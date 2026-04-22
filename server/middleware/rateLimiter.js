// ============================================================
// Rate Limiter — Proteção contra flood
// LeadCapture Pro — Zafalão Tech
// ============================================================

import rateLimit from 'express-rate-limit'

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
    retry_after_seconds: 900,
  },
})

export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Limite de envio de leads atingido. Máximo 30/minuto.',
    retry_after_seconds: 60,
  },
})

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
