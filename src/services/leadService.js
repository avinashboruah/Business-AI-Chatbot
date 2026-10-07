'use strict'

const fs = require('fs')
const path = require('path')
const { dispatchLeadNotification } = require('./notificationService')

const LEADS_DIR = path.join(__dirname, '..', 'data', 'leads')

// Ensure leads directory exists
if (!fs.existsSync(LEADS_DIR)) {
  fs.mkdirSync(LEADS_DIR, { recursive: true })
}

// In-memory cache to prevent duplicate alerts within 15 minutes
const recentAlerts = new Map()

// Multi-turn session memory for booking context (e.g. Turn 1: "I want to book table for 4", Turn 2: "9876543210")
const sessionMemories = new Map()

/**
 * Bulletproof Contact & Lead Extraction Engine
 * Handles US, India, UK, International formats, spaces, dashes, dots, and parens
 * Rejects false positives (years, street numbers, table numbers, timestamps)
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const BUYING_INTENT_REGEX = /\b(book|reserve|reservation|appointment|schedule|quote|pricing for|catering|hire|table for|order|event|party|private dining|wedding|consultation|estimate|pricing)\b/i

/**
 * Checks whether an interactive in-chat lead form card should be offered
 * @param {string} message - User message
 * @param {object} client - Business client profile
 * @returns {boolean}
 */
function shouldShowLeadCard(message, client) {
  if (!message || typeof message !== 'string') return false
  // If the user already provided contact info, no need to show the input card
  if (extractLeadFromText(message)) return false

  return BUYING_INTENT_REGEX.test(message)
}

/**
 * Extracts phone, email, and visitor name with strict validation
 * @param {string} message - User message text
 * @returns {object|null} - Extracted lead info or null if no valid contact info
 */
function extractLeadFromText(message) {
  if (!message || typeof message !== 'string') return null

  // 1. Phone Extraction: matches international numbers with separators (+, -, ., space, ())
  const phoneCandidates = message.match(/(?:\+?\d{1,4}[\s.-]*)?(?:\(?\d{2,5}\)?[\s.-]*)?\d{3,5}[\s.-]?\d{3,5}\b/g) || []
  let phone = null
  for (const candidate of phoneCandidates) {
    const digitsOnly = candidate.replace(/\D/g, '')
    // Legitimate international phone numbers have between 8 and 15 digits
    // (Excludes years like 2024, times like 7:30, or table numbers like 4)
    if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
      phone = candidate.trim()
      break
    }
  }

  // 2. Email Extraction
  const emailMatch = message.match(EMAIL_REGEX)
  const email = emailMatch ? emailMatch[0].trim() : null

  // Must contain either a valid phone or email to be an actionable contact lead
  if (!phone && !email) {
    return null
  }

  // 3. Name Extraction
  let name = null
  const nameMatch = message.match(/(?:my name is|i am|this is|name's|i'm)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i)
  if (nameMatch) {
    let candidate = nameMatch[1].trim()
    // Strip trailing conjunctions, stop words, or contact identifiers
    candidate = candidate.replace(/\b(and|my|or|here|the|a|an|phone|number|email)\b.*$/i, '').trim()
    // Guard against prepositions ("at", "interested", "looking")
    if (!/^(at|in|on|interested|looking|calling|reaching|booking|wondering)$/i.test(candidate) && candidate.length > 1) {
      name = candidate.charAt(0).toUpperCase() + candidate.slice(1)
    }
  }

  const contact = phone || email

  return {
    name,
    contact,
    phone,
    email,
    inquiry: message.trim(),
    createdAt: new Date().toISOString()
  }
}

/**
 * Save lead to data/leads/<clientId>.json
 * @param {string} clientId
 * @param {object} lead
 */
function saveLeadRecord(clientId, lead) {
  const filePath = path.join(LEADS_DIR, `${clientId}.json`)
  let leads = []

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      leads = JSON.parse(data)
    }
  } catch (err) {
    console.error(`[LeadService] Failed to read leads file for ${clientId}:`, err.message)
    leads = []
  }

  const record = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: 'new',
    ...lead
  }

  leads.unshift(record)

  try {
    fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), 'utf8')
  } catch (err) {
    console.error(`[LeadService] Failed to save lead record for ${clientId}:`, err.message)
  }

  return record
}

/**
 * Processes a message for leads and dispatches alerts if new contact info detected
 * @param {object} params
 * @param {object} params.client - Client configuration object
 * @param {string} params.message - Customer message
 * @param {string} params.conversationId - Session identifier
 * @returns {Promise<object|null>}
 */
async function processMessageForLeads({ client, message, conversationId }) {
  const sid = conversationId || 'default-session'

  // If user expresses booking/buying intent without a phone number yet, remember it for this session
  if (BUYING_INTENT_REGEX.test(message)) {
    sessionMemories.set(sid, {
      intent: message,
      timestamp: Date.now()
    })
  }

  const leadData = extractLeadFromText(message)
  if (!leadData) return null

  // If this session had an earlier booking request, combine it into the lead inquiry
  const previousIntent = sessionMemories.get(sid)
  if (previousIntent && previousIntent.intent !== message) {
    leadData.inquiry = `${previousIntent.intent} | Additional info: ${message}`
  }

  const cacheKey = `${client.id}:${leadData.contact}`
  const lastAlertTime = recentAlerts.get(cacheKey)
  const now = Date.now()

  // Prevent spamming the owner if the same contact info is sent within 15 minutes
  if (lastAlertTime && (now - lastAlertTime < 15 * 60 * 1000)) {
    console.log(`[LeadService] Duplicate lead detected within 15m for ${leadData.contact}, skipping owner alert.`)
    return null
  }

  recentAlerts.set(cacheKey, now)

  // 1. Save lead to disk
  const savedRecord = saveLeadRecord(client.id, {
    ...leadData,
    conversationId: sid
  })

  console.log(`[LeadService] 🎯 Captured new lead for ${client.name || client.id}: ${leadData.contact} (${leadData.name || 'Anonymous'})`)

  // 2. Dispatch notifications asynchronously in background
  dispatchLeadNotification({ client, lead: savedRecord }).catch(err => {
    console.error('[LeadService] Background notification error:', err)
  })

  return savedRecord
}

/**
 * Get all captured leads for a given client
 * @param {string} clientId
 * @returns {Array}
 */
function getLeadsForClient(clientId) {
  const filePath = path.join(LEADS_DIR, `${clientId}.json`)
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }
  } catch (err) {
    console.error(`[LeadService] Error reading leads for ${clientId}:`, err.message)
  }
  return []
}

module.exports = {
  extractLeadFromText,
  processMessageForLeads,
  getLeadsForClient,
  saveLeadRecord,
  shouldShowLeadCard
}
