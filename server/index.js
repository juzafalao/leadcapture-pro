import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import Twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'

// Configurações de Caminho e Ambiente
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

// Middlewares Comerciais
app.use(cors())
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')))

// Clientes de Infraestrutura
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

/**
 * Middleware de Segurança: Valida a API Key para todas as requisições sensíveis
 */
const verifyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (apiKey === SERVER_API_KEY) return next()
  console.warn(`⚠️ Tentativa de acesso não autorizado: ${req.ip}`)
  res.status(401).json({ error: 'Acesso negado. API Key inválida.' })
}

/**
 * ROTA: Dashboard B2B
 * Busca os leads do banco para visualização do seu cliente
 */
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
    res.status(500).json({ error: 'Falha interna ao carregar dashboard.' })
  }
})

/**
 * ROTA COMERCIAL: Captador Multicanal (Landing Page e WhatsApp)
 * Recebe, valida, notifica via WhatsApp e persiste no banco
 */
app.post('/send-whatsapp', verifyAuth, async (req, res) => {
  const { to, body, nome, fonte = 'whatsapp' } = req.body
  
  try {
    // 1. Validação de Dados Obrigatórios
    if (!to) return res.status(400).json({ error: 'O número de telefone é obrigatório.' })

    // 2. Localização Automática do Tenant (Franqueado)
    // Em uma estrutura multi-tenant, aqui buscaríamos o ID dinamicamente
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1)
    const tenantId = tenants?.[0]?.id

    if (!tenantId) throw new Error('Configuração de Tenant (franqueado) não encontrada.')

    // 3. Notificação via WhatsApp (Se houver corpo de mensagem)
    if (body) {
      await twilioClient.messages.create({ 
        from: `whatsapp:${TWILIO_WHATSAPP_FROM}`, 
        to: `whatsapp:${to}`, 
        body 
      })
    }

    // 4. Persistência de Dados Profissional
    const { data, error } = await supabase.from('leads').insert([{ 
      nome: nome || 'Lead via Sistema',
      telefone: to, 
      last_message: body || 'Captura de lead via formulário', 
      status: 'novo',
      categoria: 'hot',
      fonte: fonte, // Ex: 'landing_page', 'whatsapp', 'google_ads'
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    }]).select()

    if (error) throw error

    console.log(`✅ Sucesso: Lead [${nome || to}] capturado via [${fonte}]`)
    res.status(201).json({ ok: true, lead: data[0] })

  } catch (err) {
    console.error('❌ Erro na Operação Comercial:', err.message)
    res.status(500).json({ error: 'Erro ao processar captura. Tente novamente mais tarde.' })
  }
})

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log('--------------------------------------------------')
  console.log(`🚀 LEADCAPTURE PRO ONLINE | Porta: ${PORT}`)
  console.log(`💻 DASHBOARD: http://localhost:${PORT}`)
  console.log('--------------------------------------------------')
})