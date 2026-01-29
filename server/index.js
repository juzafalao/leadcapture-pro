import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import Twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'

// --- CONFIGURAÇÃO ---
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  SERVER_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM,
  PORT = 4000
} = process.env

console.log('--- DEBUG DE CHAVES ---');
console.log('Chave esperada no .env:', `"${SERVER_API_KEY}"`);

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Clientes
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

// Middleware de Segurança
const verifyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (apiKey === SERVER_API_KEY) return next()
  res.status(401).json({ error: 'Não autorizado' })
}

// --- ROTAS ---

app.get('/health', (req, res) => res.json({ status: 'Online', database: !!supabase }))

app.post('/send-whatsapp', verifyAuth, async (req, res) => {
  const { to, body } = req.body
  
  try {
    // 1. Enviar via Twilio
    const from = TWILIO_WHATSAPP_FROM.startsWith('whatsapp:') ? TWILIO_WHATSAPP_FROM : `whatsapp:${TWILIO_WHATSAPP_FROM}`
    const recipient = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    
    const message = await twilioClient.messages.create({ from, to: recipient, body })

    // 2. Salvar no Supabase
    const { error: dbError } = await supabase
      .from('leads')
      .insert([{ 
        phone_number: to, 
        last_message: body, 
        status: 'sent',
        metadata: { twilio_sid: message.sid }
      }])

    if (dbError) console.error('Erro ao salvar no banco:', dbError.message)

    console.log(`✅ Lead ${to} processado com sucesso!`)
    res.json({ ok: true, sid: message.sid, saved: !dbError })

  } catch (err) {
    console.error('❌ Erro na operação:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => console.log(`🚀 Captador Pro Operacional na porta ${PORT}`))