// ============================================================
// ROUTES — /sistema
// Rotas de saúde, diagnóstico e integração WhatsApp
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'
import { verificarConexao } from '../comunicacao/whatsapp.js'
import { getScoringTable }  from '../core/scoring.js'

const router = Router()

// ─────────────────────────────────────────────
// GET /health
// Health-check geral da aplicação
// ─────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'LeadCapture Pro — Core API',
    version:   process.env.npm_package_version || '2.0.0',
    timestamp: new Date().toISOString(),
  })
})

// ─────────────────────────────────────────────
// GET /api/sistema/status
// Status detalhado de todos os serviços
// ─────────────────────────────────────────────
router.get('/status', async (_req, res) => {
  const checks = await Promise.allSettled([
    supabase.from('tenants').select('id', { count: 'exact', head: true }),
    verificarConexao(),
  ])

  const [dbCheck, waCheck] = checks
  const resendOk = !!process.env.RESEND_API_KEY
  const smtpOk   = !!process.env.SMTP_USER && !!process.env.SMTP_PASS

  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        ok:    dbCheck.status === 'fulfilled' && !dbCheck.value.error,
        error: dbCheck.value?.error?.message || null,
      },
      whatsapp: {
        ok:    waCheck.status === 'fulfilled' ? waCheck.value.conectado : false,
        info:  waCheck.status === 'fulfilled' ? waCheck.value : { motivo: waCheck.reason?.message },
      },
      email: {
        ok:                   resendOk || smtpOk,
        resend_configured:    resendOk,
        smtp_configured:      smtpOk,
        from:                 process.env.RESEND_FROM || 'onboarding@resend.dev',
        notification_email:   process.env.NOTIFICATION_EMAIL || 'leadcaptureadm@gmail.com',
        provedor:             resendOk ? 'Resend' : smtpOk ? 'Gmail SMTP' : 'Não configurado',
      },
    },
  })
})

// ─────────────────────────────────────────────
// POST /api/sistema/test-email
// Envia email de teste — requer token Supabase
// ─────────────────────────────────────────────
router.post('/test-email', async (req, res) => {
  // Verifica token de autenticação
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de autenticação obrigatório' })
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado' })
  }
  const { email } = req.body
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'E-mail inválido' })
  }

  try {
    const { notificarNovoLead } = await import('../comunicacao/email.js')
    const leadFake = {
      nome:               'Teste de Configuração',
      email:              email,
      telefone:           '11999999999',
      score:              90,
      categoria:          'hot',
      capital_disponivel: 500000,
      regiao_interesse:   'São Paulo - SP',
      fonte:              'teste-manual',
    }
    const result = await notificarNovoLead(leadFake, { nome: 'LeadCapture Pro', emoji: '🚀' })
    if (result.success) {
      res.json({ success: true, message: `E-mail enviado para ${email}` })
    } else {
      res.status(500).json({ success: false, error: result.error || 'Falha no envio' })
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────
// GET /api/sistema/scoring
// Tabela de scoring para documentação/debug
// ─────────────────────────────────────────────
router.get('/scoring', (_req, res) => {
  res.json({
    success: true,
    tabela:  getScoringTable(),
    criterios: {
      hot:  'score >= 80',
      warm: 'score >= 60',
      cold: 'score < 60',
    },
  })
})

export default router
