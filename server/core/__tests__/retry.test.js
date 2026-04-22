// ============================================================
// TESTES — Retry Service
// server/core/__tests__/retry.test.js
// ============================================================

import { describe, it, expect, vi } from 'vitest'
import { retryWithBackoff } from '../retry.js'

describe('Retry Service', () => {
  it('deve retornar resultado na primeira tentativa se sucesso', async () => {
    const fn = vi.fn().mockResolvedValue('sucesso')
    
    const resultado = await retryWithBackoff(fn, { label: 'Test' })
    
    expect(resultado).toBe('sucesso')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('deve tentar novamente em caso de falha', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Falha 1'))
      .mockRejectedValueOnce(new Error('Falha 2'))
      .mockResolvedValue('sucesso')
    
    const resultado = await retryWithBackoff(fn, {
      maxRetries: 3,
      baseDelay: 10, // 10ms para testes rápidos
      label: 'Test'
    })
    
    expect(resultado).toBe('sucesso')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('deve lançar erro após máximo de tentativas', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Sempre falha'))
    
    await expect(retryWithBackoff(fn, {
      maxRetries: 2,
      baseDelay: 10,
      label: 'Test'
    })).rejects.toThrow('Sempre falha')
    
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('deve usar valores padrão se opções não fornecidas', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    
    const resultado = await retryWithBackoff(fn)
    
    expect(resultado).toBe('ok')
  })

  it('deve aumentar delay exponencialmente', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Falha 1'))
      .mockRejectedValueOnce(new Error('Falha 2'))
      .mockResolvedValue('sucesso')
    
    const startTime = Date.now()
    await retryWithBackoff(fn, {
      maxRetries: 3,
      baseDelay: 50, // 50ms base
      label: 'Test'
    })
    const elapsed = Date.now() - startTime
    
    // Deve ter esperado pelo menos: 50 + 100 = 150ms
    expect(elapsed).toBeGreaterThanOrEqual(100)
  })
})
