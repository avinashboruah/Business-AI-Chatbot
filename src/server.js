'use strict'

require('dotenv').config()
const path = require('path')
const express = require('express')
const cors = require('cors')

const rateLimit = require('express-rate-limit')

const { clients, registerClient, getClient, listClientIds } = require('./config/clients')
const { extractKnowledge, getAnswerFromKnowledge } = require('./services/knowledge')
const { generateResponse } = require('./services/llm')
const { validateInput } = require('./services/guardrails')
const { processMessageForLeads, getLeadsForClient, saveLeadRecord, shouldShowLeadCard } = require('./services/leadService')
const { dispatchLeadNotification } = require('./services/notificationService')

const app = express()
const PORT = process.env.PORT || 3000

// Rate limiter: 20 requests per minute per IP (PRD Section 6 & 17)
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Rate limit reached: You can send up to 20 messages per minute. Please try again shortly.'
  }
})

// Middleware
app.use(cors())
app.use(express.json())

// Serve embeddable widget files (PRD Section 11 & @hey-amanthakur/chat-bot compatibility)
const widgetPath = path.join(__dirname, '../public/widget.js')
app.get('/widget.js', (req, res) => {
  res.sendFile(widgetPath)
})
app.get('/widgets/chat-widget.min.js', (req, res) => {
  res.sendFile(widgetPath)
})

// Serve static assets from public/
app.use(express.static(path.join(__dirname, '../public')))
app.use('/public', express.static(path.join(__dirname, '../public')))

/**
 * FR-01: Start chatbot backend & Status
 */
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chatbot backend is running',
    version: '1.0.0',
    totalClients: listClientIds().length
  })
})

/**
 * Health check endpoint (for Render and uptime monitors)
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'business-chatbot'
  })
})

/**
 * FR-02 & FR-03: Business identification & Multi-business listing
 */
app.get('/api/clients', (req, res) => {
  res.json({ clients: listClientIds() })
})

app.get('/api/client/:clientId', (req, res) => {
  const { clientId } = req.params
  const client = getClient(clientId)

  if (!client) {
    return res.status(404).json({
      error: 'Client not found',
      message: `No business found with client_id: ${clientId}`
    })
  }

  res.json({
    client,
    quickQuestions: client.quickQuestions || []
  })
})

/**
 * Business knowledge retrieval and update endpoints
 */
app.get('/api/knowledge/:clientId', (req, res) => {
  const { clientId } = req.params
  const client = getClient(clientId)

  if (!client) {
    return res.status(404).json({
      error: 'Client not found',
      message: `No business found with client_id: ${clientId}`
    })
  }

  res.json({
    clientId,
    knowledge: extractKnowledge(client)
  })
})

app.post('/api/knowledge', (req, res) => {
  const { clientId, knowledge } = req.body

  if (!clientId) {
    return res.status(400).json({ error: 'clientId is required' })
  }

  if (!knowledge) {
    return res.status(400).json({ error: 'knowledge is required' })
  }

  let client = getClient(clientId)
  if (!client) {
    client = registerClient(clientId, { name: clientId, ...knowledge })
  } else {
    client.knowledge = { ...(client.knowledge || {}), ...knowledge }
    Object.assign(client, knowledge)
  }

  res.json({
    success: true,
    message: `Knowledge updated for client: ${clientId}`,
    client
  })
})

/**
 * Core RAG Chat Endpoint (PRD Sections 7, 9, 10, 19)
 * Isolated per client_id, answers using business knowledge.
 */
app.post('/api/chat', chatRateLimiter, async (req, res) => {
  try {
    const { clientId, message, sessionId } = req.body

    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' })
    }

    // Guardrail input validation (type, non-empty, max 500 characters)
    const validation = validateInput(message)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    const client = getClient(clientId)
    if (!client) {
      return res.status(404).json({
        error: 'Client not found',
        message: `No business found with client_id: ${clientId}`
      })
    }

    // Generate answer using LLM with pre-LLM & post-LLM guardrails
    const answer = await generateResponse(validation.sanitized, client)

    // Check if the user's message contains contact info or booking inquiry
    const capturedLead = await processMessageForLeads({
      client,
      message: validation.sanitized,
      conversationId: sessionId
    })

    const showCard = !capturedLead && shouldShowLeadCard(validation.sanitized, client)

    res.json({
      clientId,
      message,
      answer,
      response: answer,
      businessName: client.name,
      lead_captured: !!capturedLead,
      lead: capturedLead ? { name: capturedLead.name, contact: capturedLead.contact } : null,
      show_lead_card: showCard,
      lead_card: showCard ? {
        title: 'Request a Quote / Booking',
        inquirySuggestion: validation.sanitized
      } : null,
      session_id: sessionId || 'default-session'
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process chat message'
    })
  }
})

/**
 * Direct Lead Submission Endpoint (Widget Callback / Mini Form)
 */
app.post('/api/leads', chatRateLimiter, async (req, res) => {
  try {
    const { clientId, name, contact, phone, email, inquiry, notes } = req.body

    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' })
    }

    const client = getClient(clientId)
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    const contactValue = contact || phone || email
    if (!contactValue) {
      return res.status(400).json({ error: 'A phone number or email is required' })
    }

    const leadRecord = saveLeadRecord(clientId, {
      name: name || null,
      contact: contactValue,
      phone: phone || null,
      email: email || null,
      inquiry: inquiry || notes || 'Direct contact request via widget',
      createdAt: new Date().toISOString()
    })

    // Dispatch background alerts to owner
    dispatchLeadNotification({ client, lead: leadRecord }).catch(err => {
      console.error('[LeadsAPI] Error notifying owner:', err)
    })

    res.status(201).json({
      success: true,
      message: 'Thank you! Your information has been received and our team will contact you shortly.',
      lead: { id: leadRecord.id, contact: contactValue }
    })
  } catch (err) {
    console.error('Lead submission error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get all captured leads for a business owner
 */
app.get('/api/leads/:clientId', (req, res) => {
  const { clientId } = req.params
  const client = getClient(clientId)
  if (!client) {
    return res.status(404).json({ error: 'Client not found' })
  }

  const leads = getLeadsForClient(clientId)
  res.json({
    clientId,
    businessName: client.name,
    total: leads.length,
    leads
  })
})

// Serve test/demo widget page
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '../test-widget.html'))
})

// Server listener
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`💬 Chatbot backend running on port ${PORT}`)
    console.log(`🏃‍♂️ Run with: npm start`)
    console.log(`📋 Available endpoints:`)
    console.log(`   GET  /                       - Status check`)
    console.log(`   GET  /api/health             - Health check`)
    console.log(`   GET  /api/clients            - List all businesses`)
    console.log(`   GET  /api/client/:clientId   - Get business info`)
    console.log(`   GET  /api/knowledge/:clientId- Get business knowledge`)
    console.log(`   POST /api/knowledge          - Update business knowledge`)
    console.log(`   POST /api/chat               - Chat with bot`)
    console.log(`   GET  /widget.js              - Embeddable widget script`)
    console.log(`   GET  /test                   - Demo HTML test page`)
  })
}

module.exports = app