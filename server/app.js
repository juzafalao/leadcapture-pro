// ============================================================
// LeadCapture Pro — Servidor Principal
// Zafalão Tech · 2026
//
// Arquitetura de módulos:
//   core/         → banco de dados, scoring, validação
//   comunicacao/  → email e WhatsApp
//   routes/       → roteadores Express por domínio
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

// Serviços
import { inicializarEmail } from './comunicacao/email.js'

// Roteadores
import leadsRouter   from './routes/leads.js'
import marcasRouter  from './routes/marcas.js'
import sistemaRouter from './routes/sistema.js'

// Supabase (usado diretamente aqui apenas para landing page dinâmica)
import supabase from './core/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// ─── Inicialização ───────────────────────────────────────────
const app = express()
inicializarEmail()

// ─── Middlewares Globais ─────────────────────────────────────
app.use(cors({
  origin:  process.env.CORS_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(express.static(path.join(__dirname, 'public')))

// ─── Roteadores ──────────────────────────────────────────────
app.use('/api/leads',  leadsRouter)
app.use('/api/marcas', marcasRouter)
app.use('/',           sistemaRouter)   // inclui /health e /api/sistema/*

// ─── Dashboard (SPA React) ───────────────────────────────────
app.use('/dashboard', express.static(join(__dirname, '../dashboard-build')))
app.get('/dashboard/*', (_req, res) => {
  res.sendFile(join(__dirname, '../dashboard-build/index.html'))
})

// ─── Painel Admin ────────────────────────────────────────────
app.get('/admin', (_req, res) => {
  res.sendFile(join(__dirname, 'admin/index.html'))
})

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

    html = html
      .replace(/{{MARCA_EMOJI}}/g,    marca.emoji       || '🏢')
      .replace(/{{MARCA_NOME}}/g,     marca.nome)
      .replace(/{{MARCA_ID}}/g,       marca.id)
      .replace(/{{TENANT_ID}}/g,      marca.tenant_id)
      .replace(/{{INVEST_MIN}}/g,     (marca.invest_min || 0).toLocaleString('pt-BR'))
      .replace(/{{INVEST_MAX}}/g,     (marca.invest_max || 0).toLocaleString('pt-BR'))
      .replace(/{{COR_PRIMARIA}}/g,   marca.cor_primaria  || '#ee7b4d')
      .replace(/{{COR_SECUNDARIA}}/g, marca.cor_secundaria || '#f59e42')

    res.send(html)
  } catch (err) {
    console.error('[Landing] Erro:', err.message)
    res.status(500).send('Erro ao carregar landing page')
  }
})

// ─── Captação — Landing Page Institucional do Produto ────────
// Servir a landing page do próprio LeadCapture Pro (módulo captação)
app.use('/captacao', express.static(join(__dirname, '../captacao')))
app.get('/captacao/*', (_req, res) => {
  res.sendFile(join(__dirname, '../captacao/index.html'))
})

// ─── Fallback 404 ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' })
})

// ─── Error Handler Global ────────────────────────────────────
app.use((err, _req, res, _next) => {
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
    <p>O slug <strong>"${slug}"</strong> não existe no sistema.</p>
    <p><a href="/captacao">Conheça o LeadCapture Pro →</a></p>
  </div>
</body>
</html>`
}
