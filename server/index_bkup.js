/**
 * Simple Express server to:
 * - Save encrypted CRM API keys into Supabase (server-only).
 * - Send WhatsApp messages via Twilio.
 *
 * Protect endpoints with SERVER_API_KEY header.
 *
 * Instructions:
 *  - create server/.env (use server/.env.server.example)
 *  - cd server && npm install
 *  - npm start
 */

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import Twilio from 'twilio'

dotenv.config({ path: './.env' })

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  ENCRYPTION_KEY_HEX,
  SERVER_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM,
  PORT = 4000
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in server/.env')
  process.exit(1)
}
if (!ENCRYPTION_KEY_HEX || ENCRYPTION_KEY_HEX.length !== 64) {
  console.error('ENCRYPTION_KEY_HEX must be 32 bytes hex (64 hex chars). Set ENCRYPTION_KEY_HEX in server/.env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Simple middleware to protect endpoints with SERVER_API_KEY
app.use((req, res, next) => {
  const key = req.header('x-api-key') || req.query.api_key
  if (!SERVER_API_KEY) {
    // If SERVER_API_KEY not set, only allow localhost for dev
    return next()
  }
  if (!key || key !== SERVER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})

// AES-256-GCM encrypt
function encryptText(plain) {
  const key = Buffer.from(ENCRYPTION_KEY_HEX, 'hex') // 32 bytes
  const iv = crypto.randomBytes(12) // recommended 12 bytes for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  }
}

// Endpoint: save encrypted CRM key for a tenant
app.post('/save-crm', async (req, res) => {
  try {
    const { tenantId, crm_api_key } = req.body
    if (!tenantId || !crm_api_key) return res.status(400).json({ error: 'tenantId and crm_api_key required' })

    const { ciphertext, iv, tag } = encryptText(crm_api_key)

    // Persist encrypted values in tenants table (add columns crm_api_key_encrypted, crm_api_iv, crm_api_tag if not present)
    const { error } = await supabase
      .from('tenants')
      .update({
        crm_api_key_encrypted: ciphertext,
        crm_api_iv: iv,
        crm_api_tag: tag,
        crm_api_updated_at: new Date().toISOString()
      })
      .eq('id', tenantId)

    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    console.error('save-crm error', err)
    res.status(500).json({ error: err.message || 'internal' })
  }
})

// Endpoint: send WhatsApp message via Twilio
app.post('/send-whatsapp', async (req, res) => {
  try {
    if (!twilioClient) return res.status(500).json({ error: 'Twilio not configured' })
    const { to, body } = req.body
    if (!to || !body) return res.status(400).json({ error: 'to and body required' })

    // to should be in international format, e.g. +551199999999
    const from = TWILIO_WHATSAPP_FROM
    if (!from) return res.status(500).json({ error: 'TWILIO_WHATSAPP_FROM not set' })

    const message = await twilioClient.messages.create({
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
      body
    })

    res.json({ ok: true, sid: message.sid })
  } catch (err) {
    console.error('send-whatsapp error', err)
    res.status(500).json({ error: err.message || 'internal' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})