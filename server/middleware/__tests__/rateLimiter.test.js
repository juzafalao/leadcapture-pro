// ============================================================
// TESTES — Rate Limiter Middleware
// server/middleware/__tests__/rateLimiter.test.js
// ============================================================

import { describe, it, expect } from 'vitest'

describe('Rate Limiter Configuration', () => {
  it('deve ter configuração correta para globalLimiter', async () => {
    const { globalLimiter } = await import('../rateLimiter.js')
    
    expect(globalLimiter).toBeDefined()
    expect(typeof globalLimiter).toBe('function')
  })

  it('deve ter configuração correta para webhookLimiter', async () => {
    const { webhookLimiter } = await import('../rateLimiter.js')
    
    expect(webhookLimiter).toBeDefined()
    expect(typeof webhookLimiter).toBe('function')
  })

  it('deve ter configuração correta para statusLimiter', async () => {
    const { statusLimiter } = await import('../rateLimiter.js')
    
    expect(statusLimiter).toBeDefined()
    expect(typeof statusLimiter).toBe('function')
  })
})
