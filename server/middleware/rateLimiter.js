// ============================================================
// rateLimiter.js — Rate Limiting para proteção contra flood
// LeadCapture Pro — Zafalão Tech
//
// Limites:
//   Global:  100 requests / 15 min por IP
//   Webhook: 30 requests / 1 min por IP (POST /api/leads)
//   Auth:    5 requests / 15 min por IP
//
// NOTA: Em Vercel Serverless, o MemoryStore é reiniciado em
// cold starts. Para proteção total, considerar Upstash Redis.
// Ainda assim, protege durante warm invocations (ataques burst).
// ============================================================

import rateLimit from 'express-rate-limit'

// ─── Rate Limit Global ──────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                   // 100 requests por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
    retry_after_seconds: 900,
  },
})

// ─── Rate Limit para Webhook de Leads ───────────────────────
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30,                   // 30 leads por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Limite de envio de leads atingido. Máximo 30/minuto.',
    retry_after_seconds: 60,
  },
})

// ─── Rate Limit para Status/Health ──────────────────────────
export const statusLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas requisições ao status.',
  },
})