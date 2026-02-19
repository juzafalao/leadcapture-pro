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
        ok:         !!process.env.SMTP_USER,
        configurado: !!process.env.SMTP_USER,
      },
    },
  })
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
