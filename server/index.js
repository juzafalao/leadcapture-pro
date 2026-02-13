import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import Twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'

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

const app = express()

app.use(cors())
app.use(bodyParser.json())

// ============================================
// MIDDLEWARE: PROTEÇÃO DO PAINEL ADMIN
// ============================================
const ADMIN_USER = 'admin'
const ADMIN_PASS = 'leadcapture2026' // ⚠️ MUDE ISSO EM PRODUÇÃO!

function requireAuth(req, res, next) {
  const auth = req.headers.authorization

  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"')
    return res.status(401).send('🔐 Autenticação necessária')
  }

  const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':')
  const [username, password] = credentials

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return next()
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"')
  return res.status(401).send('❌ Credenciais inválidas')
}

// Proteger apenas o painel admin
app.use('/admin', requireAuth, express.static(path.join(__dirname, 'admin')))

// Public continua público (landing pages, etc)
app.use(express.static(path.join(__dirname, 'public')))

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

const verifyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (apiKey === SERVER_API_KEY) return next()
  console.warn(`⚠️ Acesso não autorizado: ${req.ip}`)
  res.status(401).json({ error: 'Acesso negado.' })
}

// ============================================
// ROTAS API
// ============================================
app.get('/api/leads', verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('❌ Erro ao buscar leads:', err.message)
    res.status(500).json({ error: 'Erro ao carregar leads.' })
  }
})

// ✅ NOVA ROTA: Buscar tenants
app.get('/api/tenants', verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, nome, slug, business_type, active')
      .order('nome')
    
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('❌ Erro ao buscar tenants:', err.message)
    res.status(500).json({ error: 'Erro ao carregar tenants.' })
  }
})

// ✅ NOVA ROTA: Estatísticas por tenant
app.get('/api/stats', verifyAuth, async (req, res) => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('tenant_id, categoria, status')
    
    if (error) throw error

    const stats = {}
    leads.forEach(lead => {
      if (!stats[lead.tenant_id]) {
        stats[lead.tenant_id] = { total: 0, hot: 0, warm: 0, cold: 0, convertido: 0 }
      }
      stats[lead.tenant_id].total++
      if (lead.categoria) stats[lead.tenant_id][lead.categoria.toLowerCase()]++
      if (lead.status === 'Convertido') stats[lead.tenant_id].convertido++
    })

    res.json(stats)
  } catch (err) {
    console.error('❌ Erro ao buscar stats:', err.message)
    res.status(500).json({ error: 'Erro ao carregar estatísticas.' })
  }
})

app.post('/send-whatsapp', verifyAuth, async (req, res) => {
  const { to, body, nome, fonte = 'whatsapp' } = req.body
  
  try {
    if (!to) return res.status(400).json({ error: 'Telefone obrigatório.' })

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1)
    const tenantId = tenants?.[0]?.id

    if (!tenantId) throw new Error('Tenant não encontrado.')

    if (body) {
      await twilioClient.messages.create({ 
        from: `whatsapp:${TWILIO_WHATSAPP_FROM}`, 
        to: `whatsapp:${to}`, 
        body 
      })
    }

    const { data, error } = await supabase.from('leads').insert([{ 
      nome: nome || 'Lead via Sistema',
      telefone: to, 
      mensagem_original: body || 'Captura via formulário', 
      status: 'Novo',
      categoria: 'hot',
      fonte: fonte,
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    }]).select()

    if (error) throw error

    console.log(`✅ Lead capturado: ${nome || to}`)
    res.status(201).json({ ok: true, lead: data[0] })

  } catch (err) {
    console.error('❌ Erro:', err.message)
    res.status(500).json({ error: 'Erro ao processar captura.' })
  }
})

app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`🚀 LeadCapture Pro ONLINE | Porta: ${PORT}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 Painel Admin: http://localhost:${PORT}/admin`)
  console.log(`👤 Usuário: ${ADMIN_USER}`)
  console.log(`🔑 Senha: ${ADMIN_PASS}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})
