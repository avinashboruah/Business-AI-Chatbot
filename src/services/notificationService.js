'use strict'

const nodemailer = require('nodemailer')

let mailTransporter = null

function getMailTransporter() {
  if (mailTransporter) return mailTransporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    mailTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    })
  }
  return mailTransporter
}

/**
 * Send an instant lead notification via Telegram Bot API
 * @param {string} chatId - Target Telegram chat or group ID
 * @param {string} messageText - Formatted Markdown or plain text message
 */
async function sendTelegramAlert(chatId, messageText) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.log(`[Notification:Telegram] (Simulation - TELEGRAM_BOT_TOKEN not set) Target: ${chatId}\n${messageText}`)
    return { success: true, simulated: true }
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML'
      })
    })

    const data = await res.json()
    if (!data.ok) {
      console.error('[Notification:Telegram] Error from Telegram API:', data)
      return { success: false, error: data.description }
    }
    return { success: true }
  } catch (err) {
    console.error('[Notification:Telegram] Network failure:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Send an email alert to the business owner
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Formatted HTML body
 */
async function sendEmailAlert(toEmail, subject, htmlContent) {
  const transporter = getMailTransporter()
  const fromEmail = process.env.EMAIL_FROM || 'leads@businesschatbot.local'

  if (!transporter) {
    console.log(`[Notification:Email] (Simulation - SMTP not configured) To: ${toEmail} | Subject: ${subject}`)
    return { success: true, simulated: true }
  }

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject,
      html: htmlContent
    })
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error('[Notification:Email] Send failure:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * High-level lead dispatcher that checks client settings and notifies configured channels
 * @param {object} params
 * @param {object} params.client - Client configuration object
 * @param {object} params.lead - Extracted lead object
 */
async function dispatchLeadNotification({ client, lead }) {
  const notifications = client.notifications || {}
  const clientName = client.name || client.id || 'Your Business'
  const results = { telegram: null, email: null }

  const formattedTime = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  // 1. Telegram Notification
  const targetTelegramId = notifications.telegramChatId || process.env.DEFAULT_TELEGRAM_CHAT_ID
  if (targetTelegramId) {
    const telegramMsg = `🚨 <b>New Lead Alert!</b>\n` +
      `🏢 <b>Business:</b> ${clientName}\n` +
      `👤 <b>Customer:</b> ${lead.name || 'Not provided'}\n` +
      `📞 <b>Contact:</b> ${lead.contact || 'Not provided'}\n` +
      `📝 <b>Inquiry:</b> ${lead.inquiry || lead.rawMessage || 'Expressed interest'}\n` +
      `⏰ <b>Received:</b> ${formattedTime} UTC\n\n` +
      `👉 <i>Reach out directly to close the booking!</i>`

    results.telegram = await sendTelegramAlert(targetTelegramId, telegramMsg)
  }

  // 2. Email Notification
  const targetEmail = notifications.email || (client.contact && client.contact.email)
  if (targetEmail) {
    const subject = `🚨 New Website Lead: ${lead.name || lead.contact || 'Customer Inquiry'} - ${clientName}`
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4f46e5; color: white; padding: 18px 24px;">
          <h2 style="margin: 0; font-size: 20px;">🚨 New Customer Lead</h2>
          <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Website assistant captured an inquiry for ${clientName}</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; color: #334155; font-size: 15px; line-height: 1.6;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #64748b;">Customer Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${lead.name || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Phone / Contact:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">
                <a href="tel:${lead.contact}" style="color: #4f46e5; text-decoration: none;">${lead.contact || 'Not provided'}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Inquiry Details:</td>
              <td style="padding: 8px 0; color: #334155;">${lead.inquiry || lead.rawMessage}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Timestamp:</td>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">${formattedTime} UTC</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding: 14px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #4f46e5;">
            <strong>💡 Pro-Tip:</strong> Responding within 15 minutes increases booking conversion by over 70%.
          </div>
        </div>
      </div>
    `
    results.email = await sendEmailAlert(targetEmail, subject, htmlContent)
  }

  return results
}

module.exports = {
  dispatchLeadNotification,
  sendTelegramAlert,
  sendEmailAlert
}
