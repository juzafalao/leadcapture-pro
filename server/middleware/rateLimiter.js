// ============================================================
// RATE LIMITER — Fallback em Memória (Desenvolvimento)
// LeadCapture Pro — Zafalão Tech
//
// NOTA: Em produção, use rateLimiterRedis.js com Upstash
// Este arquivo é fallback para desenvolvimento local
// ============================================================

import rateLimit from 'express-rate-limit'

// ─── Rate Limit Global ──────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por janela
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
  max: 30, // 30 leads por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Limite de envio de leads atingido. Máximo 30/minuto.',
    retry_after_seconds: 60,
  },
})

// ─── Rate Limit para Auth ───────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas tentativas de login. Aguarde 15 minutos.',
    retry_after_seconds: 900,
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

// ─── Rate Limit para Chat IA ────────────────────────────────
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Muitas mensagens. Aguarde um momento.',
  },
})
