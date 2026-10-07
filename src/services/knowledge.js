'use strict'

const UNKNOWN_ANSWER = "I'm not sure based on the information I have. You can contact the business directly to confirm."

/**
 * Normalizes client data into a standard knowledge structure
 */
function extractKnowledge(client) {
  if (!client) return null

  // Support both nested client.knowledge and flat client properties
  const k = client.knowledge || {}

  const name = client.name || k.name || 'Our Business'
  const description = client.description || k.description || ''
  const location = client.location || k.location || client.contact?.address || k.contact?.address || ''
  const contact = { ...(k.contact || {}), ...(client.contact || {}) }
  const hours = client.hours || k.hours || {}
  const menu = client.menu || k.menu || []
  const services = client.services || k.services || []
  const faqs = client.faqs || k.faqs || []
  const policies = client.policies || k.policies || []
  const quickQuestions = client.quickQuestions || k.quickQuestions || []

  return {
    name,
    description,
    location,
    contact,
    hours,
    menu,
    services,
    faqs,
    policies,
    quickQuestions
  }
}

/**
 * Converts client data into format expected by @hey-amanthakur/chat-bot
 */
function toChatBotClientConfig(client) {
  const k = extractKnowledge(client)
  if (!k) return null

  // Convert hours map (e.g. { monday: '11:00 AM - 10:00 PM' }) to array of { day, open, close }
  const hoursArray = []
  if (Array.isArray(k.hours)) {
    k.hours.forEach(h => hoursArray.push(h))
  } else if (typeof k.hours === 'object' && k.hours !== null) {
    for (const [day, val] of Object.entries(k.hours)) {
      if (typeof val === 'string') {
        const parts = val.split('-').map(s => s.trim())
        hoursArray.push({
          day: day.charAt(0).toUpperCase() + day.slice(1),
          open: parts[0] || val,
          close: parts[1] || ''
        })
      } else if (val && typeof val === 'object') {
        hoursArray.push({
          day: day.charAt(0).toUpperCase() + day.slice(1),
          open: val.open || '',
          close: val.close || ''
        })
      }
    }
  }

  // Convert faqs to { question, answer }
  const faqsArray = (k.faqs || []).map(f => {
    if (typeof f === 'string') {
      const parts = f.split('\n')
      return { question: parts[0] || f, answer: parts.slice(1).join('\n') || f }
    }
    return f
  })

  // Convert policies to string array
  const policiesArray = (k.policies || []).map(p => typeof p === 'string' ? p : JSON.stringify(p))

  // Combine menu items into services if menu exists
  const servicesArray = [
    ...(k.services || []),
    ...(k.menu || []).map(m => ({
      name: m.name,
      price: m.price || '',
      description: m.description || 'Menu item'
    }))
  ]

  return {
    name: k.name,
    tone: 'friendly',
    greeting: `Hi! Welcome to ${k.name}. How can I assist you today?`,
    business_info: {
      address: k.location || k.contact.address || '',
      phone: k.contact.phone || '',
      email: k.contact.email || ''
    },
    hours: hoursArray,
    services: servicesArray,
    faqs: faqsArray,
    policies: policiesArray
  }
}

/**
 * Formats full opening hours cleanly for customer display
 */
function formatHours(hours) {
  if (!hours) return null

  if (Array.isArray(hours)) {
    if (hours.length === 0) return null
    return 'Our opening hours:\n' + hours.map(h => `- ${h.day}: ${h.open}${h.close ? ' - ' + h.close : ''}`).join('\n')
  }

  if (typeof hours === 'object') {
    const entries = Object.entries(hours)
    if (entries.length === 0) return null
    return 'Our opening hours:\n' + entries.map(([day, time]) => {
      const formattedDay = day.charAt(0).toUpperCase() + day.slice(1)
      return `- ${formattedDay}: ${time}`
    }).join('\n')
  }

  return String(hours)
}

/**
 * Searches and generates answer strictly from business knowledge
 */
function getAnswerFromKnowledge(message, client) {
  if (!client) return UNKNOWN_ANSWER

  const k = extractKnowledge(client)
  if (!k) return UNKNOWN_ANSWER

  const lowerMsg = message.toLowerCase().trim()
  const cleanMsg = lowerMsg.replace(/[^a-z0-9\s]/g, ' ')

  // 1. Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)\b/i.test(lowerMsg)) {
    return `Hello! Welcome to ${k.name}. ${k.description} How can I help you today?`
  }

  // 2. Who are you / about business
  if (/(who are you|about you|tell me about|what is this business|about the restaurant|about the shop)/i.test(lowerMsg)) {
    return `${k.name}: ${k.description}`
  }

  // 3. Opening Hours
  const isHoursQuery = /(hour|hours|open|opening|close|closing|schedule|timing|time)/i.test(lowerMsg)
  if (isHoursQuery) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for (const day of days) {
      if (lowerMsg.includes(day)) {
        if (k.hours && k.hours[day]) {
          const capDay = day.charAt(0).toUpperCase() + day.slice(1)
          return `On ${capDay}, ${k.name} is ${k.hours[day] === 'Closed' ? 'closed' : 'open ' + k.hours[day]}.`
        }
      }
    }
    const formatted = formatHours(k.hours)
    if (formatted) return formatted
  }

  // 4. Location and Address
  const isLocationQuery = /(where are you|where is|located|location|address|directions|find you|how to get there)/i.test(lowerMsg)
  if (isLocationQuery) {
    const addr = k.location || k.contact.address
    if (addr) {
      return `${k.name} is located at: ${addr}`
    }
  }

  // 5. Contact Information
  const isContactQuery = /(contact|phone|call|telephone|email|reach|number)/i.test(lowerMsg)
  if (isContactQuery) {
    const details = []
    if (k.contact.phone) details.push(`Phone: ${k.contact.phone}`)
    if (k.contact.email) details.push(`Email: ${k.contact.email}`)
    if (k.contact.address || k.location) details.push(`Address: ${k.contact.address || k.location}`)
    if (k.contact.website) details.push(`Website: ${k.contact.website}`)

    if (details.length > 0) {
      return `You can contact ${k.name} via:\n${details.join('\n')}`
    }
  }

  // 6. Menu Items
  if (k.menu && k.menu.length > 0) {
    // Check specific menu item mentions first
    for (const item of k.menu) {
      const itemLower = item.name.toLowerCase()
      if (lowerMsg.includes(itemLower) || itemLower.split(' ').some(w => w.length > 3 && cleanMsg.includes(w))) {
        return `${item.name} (${item.price}): ${item.description}`
      }
    }

    // Check general menu query
    if (/(show\s+(me\s+)?(the\s+)?menu|what('s|\s+is)\s+on\s+the\s+menu|view\s+menu|food\s+menu|what\s+do\s+you\s+serve|see\s+the\s+menu|what\s+can\s+i\s+eat)/i.test(lowerMsg)) {
      const items = k.menu.map(m => `- ${m.name} (${m.price}): ${m.description}`).join('\n')
      return `Here is our menu at ${k.name}:\n${items}`
    }
  }

  // 7. Services
  if (k.services && k.services.length > 0) {
    // Check specific service items first
    for (const service of k.services) {
      const serviceLower = service.name.toLowerCase()
      if (lowerMsg.includes(serviceLower) || serviceLower.split(' ').some(w => w.length > 3 && cleanMsg.includes(w))) {
        return `${service.name} (${service.price}): ${service.description}`
      }
    }

    // Check general services query
    if (/(what\s+(are\s+your\s+)?services|what\s+services\s+do\s+you\s+offer|what\s+do\s+you\s+offer|list\s+(your\s+)?services|what\s+do\s+you\s+do)/i.test(lowerMsg)) {
      const items = k.services.map(s => `- ${s.name} (${s.price}): ${s.description}`).join('\n')
      return `Our services at ${k.name}:\n${items}`
    }
  }

  // 8. FAQs matching
  if (k.faqs && Array.isArray(k.faqs)) {
    for (const faq of k.faqs) {
      if (typeof faq === 'object' && faq !== null) {
        const q = (faq.question || '').toLowerCase()
        const words = q.split(/\s+/).filter(w => w.length > 3 && !['what', 'when', 'where', 'have', 'your', 'with'].includes(w))
        const matchCount = words.filter(w => lowerMsg.includes(w)).length

        if (lowerMsg.includes(q) || (words.length > 0 && matchCount >= Math.min(2, words.length))) {
          return faq.answer
        }
      } else if (typeof faq === 'string') {
        if (faq.toLowerCase().includes(lowerMsg) || lowerMsg.includes(faq.toLowerCase())) {
          return faq
        }
      }
    }
  }

  // 9. Policies matching
  if (k.policies && Array.isArray(k.policies)) {
    for (const policy of k.policies) {
      const p = typeof policy === 'string' ? policy : JSON.stringify(policy)
      const pLower = p.toLowerCase()
      // Keywords for policy checks
      const policyKeywords = ['reservation', 'cancel', 'refund', 'pet', 'dog', 'payment', 'card', 'cash', 'warranty', 'estimate']
      for (const kw of policyKeywords) {
        if (lowerMsg.includes(kw) && pLower.includes(kw)) {
          return p
        }
      }
    }
  }

  // 10. Prioritize accuracy over pretending to know (PRD Section 10)
  return UNKNOWN_ANSWER
}

module.exports = {
  UNKNOWN_ANSWER,
  extractKnowledge,
  toChatBotClientConfig,
  formatHours,
  getAnswerFromKnowledge
}
