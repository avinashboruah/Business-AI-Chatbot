'use strict'

const MAX_MESSAGE_LENGTH = 500
const SAFE_GUARDRAIL_RESPONSE = "I can only assist with questions regarding our business, menu, services, hours, and policies. How can I help you with those today?"

// Known jailbreak, injection, and extraction signatures
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|former)\s+(instructions|prompts|rules|commands)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|rules)/i,
  /you\s+are\s+now\s+(in\s+)?(dan|developer|unfiltered|jailbreak|unrestricted|god)\s+mode/i,
  /pretend\s+(you\s+have\s+no\s+(rules|restrictions|limits)|to\s+be\s+an\s+unfiltered)/i,
  /act\s+as\s+(an\s+unrestricted|a\s+hacker|root|system\s+admin)/i,
  /(reveal|print|show|output|repeat|dump)\s+(your\s+)?(system\s+prompt|developer\s+instructions|initial\s+prompt)/i,
  /(what\s+is\s+your|what\s+are\s+your)\s+(system\s+prompt|core\s+instructions|base\s+prompt)/i,
  /(print|reveal|show|echo|export)\s+(env|environment\s+variables|api[_-]?key|secret|token)/i,
  /sk-or-v1-[a-zA-Z0-9_-]+/i,
  /bypass\s+(safety|content\s+filters|moderation|guardrails)/i
]

/**
 * Validates message length and formatting
 */
function validateInput(message) {
  if (typeof message !== 'string') {
    return { valid: false, error: 'Message must be a string' }
  }

  const trimmed = message.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' }
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`
    }
  }

  return { valid: true, sanitized: trimmed }
}

/**
 * Detects prompt injection, jailbreak, or sensitive extraction attempts
 */
function isExploitAttempt(message) {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return true
    }
  }
  return false
}

/**
 * Scans LLM output to prevent accidental leakage of secrets or credentials
 */
function sanitizeOutput(text) {
  if (!text || typeof text !== 'string') return ''

  // Redact any OpenRouter, OpenAI, or generic API keys if generated
  let cleaned = text.replace(/sk-or-v1-[a-zA-Z0-9_-]{20,}/gi, '[REDACTED_KEY]')
  cleaned = cleaned.replace(/sk-[a-zA-Z0-9_-]{20,}/gi, '[REDACTED_KEY]')

  // Redact environment variable assignments
  cleaned = cleaned.replace(/OPENROUTER_API_KEY\s*=\s*[^\s]+/gi, 'OPENROUTER_API_KEY=[REDACTED]')
  cleaned = cleaned.replace(/OPENAI_API_KEY\s*=\s*[^\s]+/gi, 'OPENAI_API_KEY=[REDACTED]')

  return cleaned
}

module.exports = {
  MAX_MESSAGE_LENGTH,
  SAFE_GUARDRAIL_RESPONSE,
  validateInput,
  isExploitAttempt,
  sanitizeOutput
}
