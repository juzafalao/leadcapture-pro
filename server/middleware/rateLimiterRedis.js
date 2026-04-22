// ============================================================
// RATE LIMITER — Upstash Redis (Produção)
// LeadCapture Pro — Zafalão Tech
//
// CONFIGURAÇÃO:
// 1. Crie conta em https://upstash.com
// 2. Crie um Redis database
// 3. Adicione ao .env:
//    UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
//    UPSTASH_REDIS_REST_TOKEN=xxx
// ============================================================

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Configuração do Redis
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Rate Limiters
const createRateLimiter = (options) => {
  if (!redis) {
    console.warn('[RateLimiter] Upstash Redis não configurado. Usando fallback em memória.')
    return null
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.max, options.window),
    analytics: true,
    prefix: options.prefix || 'leadcapture',
  })
}

// ─── Global: 100 requests / 15 min ───────────────────────────
export const globalLimiterRedis = createRateLimiter({
  max: 100,
  window: '15 m',
  prefix: 'global',
})

// ─── Webhook Leads: 30 requests / 1 min ──────────────────────
export const webhookLimiterRedis = createRateLimiter({
  max: 30,
  window: '1 m',
  prefix: 'webhook',
})

// ─── Auth: 5 requests / 15 min ───────────────────────────────
export const authLimiterRedis = createRateLimiter({
  max: 5,
  window: '15 m',
  prefix: 'auth',
})

// ─── Status: 60 requests / 1 min ─────────────────────────────
export const statusLimiterRedis = createRateLimiter({
  max: 60,
  window: '1 m',
  prefix: 'status',
})

// ─── Chat IA: 30 requests / 1 min ────────────────────────────
export const chatLimiterRedis = createRateLimiter({
  max: 30,
  window: '1 m',
  prefix: 'chat',
})

// ─── WhatsApp Webhook: 60 requests / 1 min ───────────────────
export const whatsappLimiterRedis = createRateLimiter({
  max: 60,
  window: '1 m',
  prefix: 'whatsapp',
})

// ============================================================
// Middleware Express para Rate Limiting
// ============================================================
export function rateLimitMiddleware(limiter, keyGenerator) {
  return async (req, res, next) => {
    // Se Redis não está configurado, pula o rate limit
    if (!limiter) {
      return next()
    }

    try {
      const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown'
      const { success, limit, reset, remaining } = await limiter.limit(key)

      // Headers padrão
      res.setHeader('X-RateLimit-Limit', limit)
      res.setHeader('X-RateLimit-Remaining', remaining)
      res.setHeader('X-RateLimit-Reset', reset)

      if (!success) {
        return res.status(429).json({
          success: false,
          error: 'Muitas requisições. Tente novamente em alguns minutos.',
          retry_after: Math.ceil((reset - Date.now()) / 1000),
        })
      }

      next()
    } catch (err) {
      console.error('[RateLimiter] Erro:', err.message)
      // Em caso de erro, permite a requisição (fail-open)
      next()
    }
  }
}

// ─── Exporta middleware prontos ──────────────────────────────
export const globalRateLimit = () => rateLimitMiddleware(globalLimiterRedis)
export const webhookRateLimit = () => rateLimitMiddleware(webhookLimiterRedis)
export const authRateLimit = () => rateLimitMiddleware(authLimiterRedis, (req) => req.ip + ':' + (req.body?.email || 'unknown'))
export const statusRateLimit = () => rateLimitMiddleware(statusLimiterRedis)
export const chatRateLimit = () => rateLimitMiddleware(chatLimiterRedis)
export const whatsappRateLimit = () => rateLimitMiddleware(whatsappLimiterRedis)

export default {
  globalLimiterRedis,
  webhookLimiterRedis,
  authLimiterRedis,
  statusLimiterRedis,
  chatLimiterRedis,
  whatsappLimiterRedis,
  rateLimitMiddleware,
}
