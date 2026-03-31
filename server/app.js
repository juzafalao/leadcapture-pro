// ============================================================
// LeadCapture Pro — Servidor Principal
// Zafalão Tech · 2026
//
// MUDANÇAS v1.9.0 (Fase A — Hardening):
// 1. ✅ Rate limiting: global + webhook + status
// 2. ✅ CORS restritivo (lista de domínios permitidos)
// 3. ✅ Validação Zod no POST /api/leads (via middleware)
// 4. ✅ Headers de segurança (X-Content-Type-Options, etc.)
// 5. ✅ Request logging básico
//
// Arquitetura de módulos:
//   core/         → banco de dados, scoring, validação
//   comunicacao/  → email e WhatsApp
//   routes/       → roteadores Express por domínio
//   middleware/   → rate limiting, validação Zod
//   captacao/     → landing page institucional do produto
// ============================================================

import express from 'express'
import cors    from 'cors'
import dotenv  from 'dotenv'
import path    from 'path'
import fs      from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

dotenv.config()

// Middlewares de segurança
import { globalLimiter, webhookLimiter, statusLimiter } from './middleware/rateLimiter.js'

// Serviços
import { inicializarEmail } from './comunicacao/email.js'

// Roteadores
import leadsRouter   from './routes/leads.js'
import marcasRouter  from './routes/marcas.js'
import sistemaRouter from './routes/sistema.js'
import chatRouter      from './routes/chat.js'
import whatsappRouter  from './routes/whatsapp.js'

// Supabase (usado diretamente aqui apenas para landing page dinâmica)
import supabase from './core/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// ─── Inicialização ───────────────────────────────────────────
const app = express()
inicializarEmail()

// ─── CORS Restritivo ─────────────────────────────────────────
const allowedOrigins = [
  'https://leadcapture-pro.vercel.app',
  'https://www.leadcapture-pro.vercel.app',
  'https://leadcapture-proprod.vercel.app',
  ...(process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) || []),
]

// Em desenvolvimento, permitir localhost
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173')
  allowedOrigins.push('http://localhost:4000')
  allowedOrigins.push('http://localhost:3000')
}

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (curl, Postman, webhooks server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`Origem não permitida pelo CORS: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// ─── Middlewares Globais ─────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(express.static(path.join(__dirname, 'public')))

// ─── Headers de Segurança ────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

// ─── Rate Limiting Global ────────────────────────────────────
app.use(globalLimiter)

// ─── Request Logging ─────────────────────────────────────────
app.use((req, _res, next) => {
  if (req.path !== '/health') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  }
  next()
})

// ─── Roteadores ──────────────────────────────────────────────
app.use('/api/leads',   webhookLimiter, leadsRouter)
app.use('/api/marcas',  marcasRouter)
app.get('/health', statusLimiter, (_req, res) => res.json({
  status: 'ok',
  service: 'LeadCapture Pro',
  version: '1.9.0',
  timestamp: new Date().toISOString(),
}))
app.use('/api/sistema', statusLimiter, sistemaRouter)
app.use('/api/chat',      chatRouter)
app.use('/api/whatsapp', whatsappRouter)

// ─── Dashboard (SPA React) ───────────────────────────────────
app.use('/dashboard', express.static(join(__dirname, '../dashboard-build')))
app.get('/dashboard/*', (_req, res) => {
  res.sendFile(join(__dirname, '../dashboard-build/index.html'))
})

// ─── LeadCapture Pro — Nova Landing Page SaaS ────────────────
app.use('/landing', express.static(join(__dirname, '../landing')))

// ─── Landing Pages Dinâmicas (tenant/marca) ──────────────────
// Rota: /landing/:slug → renderiza landing page customizada por marca
app.get('/landing/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const { data: marca, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !marca) {
      return res.status(404).send(_pagina404(slug))
    }

    const templatePath = path.join(__dirname, 'templates', 'landing.html')
    let html = fs.readFileSync(templatePath, 'utf-8')

    const escapeHtml = (str) => String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));

    const logoBlock = marca.logo_url
      ? `<img src="${escapeHtml(marca.logo_url)}" alt="${escapeHtml(marca.nome)}" class="lp-logo" />`
      : `<span class="lp-emoji">${escapeHtml(marca.emoji || '🏢')}</span>`

    html = html
      .replace(/{{MARCA_LOGO_BLOCK}}/g, logoBlock)
      .replace(/{{MARCA_EMOJI}}/g,    escapeHtml(marca.emoji || '🏢'))
      .replace(/{{MARCA_NOME}}/g,     escapeHtml(marca.nome))
      .replace(/{{MARCA_ID}}/g,       escapeHtml(marca.id))
      .replace(/{{TENANT_ID}}/g,      escapeHtml(marca.tenant_id))
      .replace(/{{INVEST_MIN}}/g,     (marca.invest_min || 0).toLocaleString('pt-BR'))
      .replace(/{{INVEST_MAX}}/g,     (marca.invest_max || 0).toLocaleString('pt-BR'))
      .replace(/{{COR_PRIMARIA}}/g,   escapeHtml(marca.cor_primaria || '#ee7b4d'))
      .replace(/{{COR_SECUNDARIA}}/g, escapeHtml(marca.cor_secundaria || '#f59e42'))

    res.send(html)
  } catch (err) {
    console.error('[Landing] Erro:', err.message)
    res.status(500).send('Erro ao carregar landing page')
  }
})

// ─── Fallback 404 ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' })
})

// ─── Error Handler Global ────────────────────────────────────
app.use((err, _req, res, _next) => {
  // CORS error
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ success: false, error: 'Origem não permitida' })
  }
  console.error('[App] Erro não tratado:', err)
  res.status(500).json({ success: false, error: 'Erro interno do servidor' })
})

export default app

// ─── Helpers ─────────────────────────────────────────────────
function _pagina404(slug) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Página não encontrada · LeadCapture Pro</title>
  <style>
    body { display:flex; align-items:center; justify-content:center; min-height:100vh;
           font-family:sans-serif; background:#0a0a0b; color:#f4f4f5; margin:0; }
    .box { text-align:center; }
    h1 { font-size:5rem; margin:0 0 8px; }
    h2 { font-weight:300; color:#a1a1aa; }
    p  { color:#52525b; margin-top:8px; }
    a  { color:#ee7b4d; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🔍</h1>
    <h2>Landing page não encontrada</h2>
    <p>A página solicitada não existe no sistema.</p>
    <p><a href="/landing">Conheça o LeadCapture Pro →</a></p>
  </div>
</body>
</html>`
}