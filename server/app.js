// ============================================================
// LeadCapture Pro â€” Servidor Principal
// ZafalÃ£o Tech Â· 2026
//
// MUDANÃ‡AS v1.9.0 (Fase A â€” Hardening):
// 1. âœ… Rate limiting: global + webhook + status
// 2. âœ… CORS restritivo (lista de domÃ­nios permitidos)
// 3. âœ… ValidaÃ§Ã£o Zod no POST /api/leads (via middleware)
// 4. âœ… Headers de seguranÃ§a (X-Content-Type-Options, etc.)
// 5. âœ… Request logging bÃ¡sico
//
// Arquitetura de mÃ³dulos:
//   core/         â†’ banco de dados, scoring, validaÃ§Ã£o
//   comunicacao/  â†’ email e WhatsApp
//   routes/       â†’ roteadores Express por domÃ­nio
//   middleware/   â†’ rate limiting, validaÃ§Ã£o Zod
//   captacao/     â†’ landing page institucional do produto
// ============================================================

import express from 'express'
import cors    from 'cors'
import dotenv  from 'dotenv'
import path    from 'path'
import fs      from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'


dotenv.config()

// â”€â”€â”€ Sentry â€” inicializa ANTES de qualquer handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if (process.env.SENTRY_DSN) {
  import('@sentry/node').then(Sentry => {
    Sentry.init({
      dsn:              process.env.SENTRY_DSN,
      environment:      process.env.NODE_ENV || 'production',
      tracesSampleRate: 0.1,
    })
    console.log('[Sentry] Backend inicializado')
  }).catch(err => console.warn('[Sentry] Falha ao inicializar:', err.message))
}

// Middlewares de seguranÃ§a
import { globalLimiter, webhookLimiter, statusLimiter } from './middleware/rateLimiter.js'

// ServiÃ§os
import { inicializarEmail } from './comunicacao/email.js'
import { verificarConexao } from './comunicacao/whatsapp.js'

// Roteadores
import leadsRouter   from './routes/leads.js'
import marcasRouter  from './routes/marcas.js'
import sistemaRouter from './routes/sistema.js'
import chatRouter      from './routes/chat.js'
import whatsappRouter  from './routes/whatsapp.js'

// Supabase (usado diretamente aqui apenas para landing page dinÃ¢mica)
import supabase from './core/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// â”€â”€â”€ InicializaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const app = express()
app.set('trust proxy', 1) // Vercel/proxy reverso
inicializarEmail()

// Verifica a conexÃ£o com a Evolution API do WhatsApp na inicializaÃ§Ã£o
if (process.env.EVOLUTION_API_KEY) {
  verificarConexao().then(status => {
    if (status.conectado) {
      console.log(`[WhatsApp] Conectado Ã  Evolution API (instÃ¢ncia: ${status.instancia}, status: ${status.status})`)
    } else {
      console.warn(`[WhatsApp] Falha na conexÃ£o com a Evolution API: ${status.motivo}`)
      console.warn('Verifique as variÃ¡veis de ambiente EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE.')
    }
  }).catch(err => console.error('[WhatsApp] Erro ao verificar conexÃ£o:', err.message))
} else {
  console.warn('[WhatsApp] EVOLUTION_API_KEY nÃ£o configurada. O serviÃ§o de WhatsApp operarÃ¡ em modo simulado.')
}

// â”€â”€â”€ CORS Restritivo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    callback(new Error(`Origem nÃ£o permitida pelo CORS: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// â”€â”€â”€ Middlewares Globais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(express.static(path.join(__dirname, 'public')))
app.use('/api/ranking', statusLimiter, rankingRouter)
app.use('/api/chat',      chatRouter)
app.use('/api/whatsapp', whatsappRouter)

// â”€â”€â”€ Dashboard (SPA React) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/dashboard', express.static(join(__dirname, '../dashboard-build')))
app.get('/dashboard/*', (_req, res) => {
  res.sendFile(join(__dirname, '../dashboard-build/index.html'))
})

// â”€â”€â”€ Landing Pages DinÃ¢micas (tenant/marca) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// IMPORTANTE: deve vir ANTES do express.static('/landing')
// para que /landing/:slug seja tratado como rota dinÃ¢mica
app.get('/landing/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const { data: marca, error } = await supabase
      .from('marcas')
      .select('id, nome, slug, emoji, logo_url, tenant_id, invest_min, invest_max, cor_primaria, cor_secundaria, descricao')
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
      : `<span class="lp-emoji">${escapeHtml(marca.emoji || 'ðŸ¢')}</span>`

    html = html
      .replace(/{{MARCA_LOGO_BLOCK}}/g, logoBlock)
      .replace(/{{MARCA_EMOJI}}/g,    escapeHtml(marca.emoji || 'ðŸ¢'))
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

// â”€â”€â”€ Assets estÃ¡ticos da landing institucional â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Vem DEPOIS da rota dinÃ¢mica para nÃ£o interceptar /landing/:slug
app.use('/landing', express.static(join(__dirname, '../landing')))

// â”€â”€â”€ Fallback 404 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Rota nÃ£o encontrada' })
})

// â”€â”€â”€ Error Handler Global â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use((err, req, res, _next) => {
  // CORS error
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ success: false, error: 'Origem nÃ£o permitida' })
  }

  // Envia para Sentry se DSN configurada (sem await â€” fire and forget)
  if (process.env.SENTRY_DSN) {
    import('@sentry/node').then(Sentry => {
      Sentry.withScope(scope => {
        scope.setExtra('url',    req.url)
        scope.setExtra('method', req.method)
        scope.setExtra('body',   JSON.stringify(req.body || {}).slice(0, 500))
        Sentry.captureException(err)
      })
    }).catch(() => {})
  }

  console.error('[App] Erro nÃ£o tratado:', err)
  res.status(500).json({ success: false, error: 'Erro interno do servidor' })
})

export default app

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function _pagina404(slug) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PÃ¡gina nÃ£o encontrada Â· LeadCapture Pro</title>
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
    <h1>ðŸ”</h1>
    <h2>Landing page nÃ£o encontrada</h2>
    <p>A pÃ¡gina solicitada nÃ£o existe no sistema.</p>
    <p><a href="/landing">ConheÃ§a o LeadCapture Pro â†’</a></p>
  </div>
</body>
</html>`
}
