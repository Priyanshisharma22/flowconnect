// routes/telegram.js
// Drop this file in your Express backend routes folder and mount it:
//   app.use('/telegram', require('./routes/telegram'))
//
// The telegram.js MCP client (your existing client.js) is required here.
// Make sure TELEGRAM_BOT_TOKEN is in your .env

const express = require('express')
const router  = express.Router()

const {
  sendTelegramMessage,
  sendPaymentAlert,
  getBotInfo,
  getUpdates,
} = require('../telegram/client') // adjust path to your existing client.js

// ── POST /telegram/send_message ───────────────────────────────────────────────
router.post('/send_message', async (req, res) => {
  const { chat_id, message, parse_mode } = req.body
  if (!chat_id || !message)
    return res.status(400).json({ detail: 'chat_id and message are required' })

  try {
    // The client.js sendTelegramMessage only accepts (chat_id, message)
    // If you need parse_mode support, pass it via a custom wrapper or
    // call callTelegram('send_message', { chat_id, message, parse_mode }) directly
    const result = await sendTelegramMessage(chat_id, message)
    res.json(result)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

// ── POST /telegram/send_payment_alert ────────────────────────────────────────
router.post('/send_payment_alert', async (req, res) => {
  const { chat_id, amount, customer_name, plan, payment_id } = req.body
  if (!chat_id || !customer_name)
    return res.status(400).json({ detail: 'chat_id and customer_name are required' })

  try {
    const result = await sendPaymentAlert(chat_id, amount || 0, customer_name, plan, payment_id)
    res.json(result)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

// ── POST /telegram/get_bot_info ───────────────────────────────────────────────
router.post('/get_bot_info', async (_req, res) => {
  try {
    const result = await getBotInfo()
    res.json(result)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

// ── POST /telegram/get_updates ────────────────────────────────────────────────
router.post('/get_updates', async (_req, res) => {
  try {
    const result = await getUpdates()
    res.json(result)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

module.exports = router