// ============================================================
// ROUTES — /sistema
// Rotas de saúde, diagnóstico e integração WhatsApp
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'
import { verificarConexao } from '../comunicacao/whatsapp.js'
import { getScoringTable, getScoringTableFromConfig, DEFAULT_SCORING_CONFIG } from '../core/scoring.js'
import { getScoringConfig, invalidateScoringCache } from '../core/scoringConfig.js'

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

// ─────────────────────────────────────────────
// GET /api/sistema/scoring-config
// Retorna config de scoring do tenant do usuário logado
// ─────────────────────────────────────────────
router.get('/scoring-config', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return res.status(401).json({ success: false, error: 'Token obrigatório' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ success: false, error: 'Token inválido' })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!usuario?.tenant_id) return res.status(403).json({ success: false, error: 'Usuário sem tenant' })

  const config = await getScoringConfig(usuario.tenant_id)
  res.json({
    success: true,
    config,
    tabela: getScoringTableFromConfig(config),
    isDefault: config === DEFAULT_SCORING_CONFIG,
  })
})

// ─────────────────────────────────────────────
// PUT /api/sistema/scoring-config
// Salva config de scoring personalizada para o tenant
// ─────────────────────────────────────────────
router.put('/scoring-config', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return res.status(401).json({ success: false, error: 'Token obrigatório' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ success: false, error: 'Token inválido' })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tenant_id, role, is_super_admin')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!usuario) return res.status(403).json({ success: false, error: 'Usuário não encontrado' })

  const podeEditar = ['Gestor', 'Diretor', 'Administrador', 'admin'].includes(usuario.role) || usuario.is_super_admin
  if (!podeEditar) return res.status(403).json({ success: false, error: 'Sem permissão para editar scoring' })

  const { tiers, thresholds, reset } = req.body

  if (reset) {
    await supabase.from('configuracoes')
      .delete()
      .eq('tenant_id', usuario.tenant_id)
      .eq('chave', 'scoring_config_v1')
    invalidateScoringCache(usuario.tenant_id)
    return res.json({ success: true, message: 'Configuração restaurada para os padrões', config: DEFAULT_SCORING_CONFIG })
  }

  if (!Array.isArray(tiers) || tiers.length === 0) {
    return res.status(400).json({ success: false, error: 'tiers é obrigatório e deve ser um array' })
  }

  const config = {
    tiers: tiers.map(t => ({
      min:   parseInt(t.min)   || 0,
      score: parseInt(t.score) || 50,
      label: String(t.label || ''),
    })),
    thresholds: {
      HOT:  parseInt(thresholds?.HOT)  || DEFAULT_SCORING_CONFIG.thresholds.HOT,
      WARM: parseInt(thresholds?.WARM) || DEFAULT_SCORING_CONFIG.thresholds.WARM,
    },
  }

  const { error } = await supabase.from('configuracoes').upsert(
    { tenant_id: usuario.tenant_id, chave: 'scoring_config_v1', valor: JSON.stringify(config) },
    { onConflict: 'tenant_id,chave' }
  )
  if (error) return res.status(500).json({ success: false, error: error.message })

  invalidateScoringCache(usuario.tenant_id)
  res.json({ success: true, message: 'Configuração de scoring salva', config })
})

export default router
