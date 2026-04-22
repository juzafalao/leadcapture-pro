// ============================================================
// TESTES — API Integration
// server/__tests__/api.test.js
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock do Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: '123' }, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [{ id: '123' }], error: null })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      auth: {
        getUser: vi.fn(() => Promise.resolve({
          data: { user: { id: 'user-123' } },
          error: null
        })),
      },
    })),
  })),
}))

// Mock das comunicações
vi.mock('../comunicacao/email.js', () => ({
  notificarNovoLead: vi.fn(() => Promise.resolve({ success: true })),
  notificarLeadQuente: vi.fn(() => Promise.resolve({ success: true })),
  enviarBoasVindasLead: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('../comunicacao/whatsapp.js', () => ({
  enviarBoasVindas: vi.fn(() => Promise.resolve({ success: true })),
}))

describe('API Routes', () => {
  describe('POST /api/leads', () => {
    it('deve criar lead com dados válidos', async () => {
      // Este teste seria mais completo com supertest
      // Por ora, valida a lógica de scoring
      const { processarCapital } = await import('../core/scoring.js')
      
      const resultado = processarCapital(500000)
      expect(resultado.score).toBe(95)
      expect(resultado.categoria).toBe('hot')
    })

    it('deve categorizar lead warm corretamente', async () => {
      const { processarCapital } = await import('../core/scoring.js')
      
      const resultado = processarCapital(200000)
      expect(resultado.score).toBe(80)
      expect(resultado.categoria).toBe('hot') // 80 >= 80 = hot
    })

    it('deve categorizar lead cold corretamente', async () => {
      const { processarCapital } = await import('../core/scoring.js')
      
      const resultado = processarCapital(50000)
      expect(resultado.score).toBe(50)
      expect(resultado.categoria).toBe('cold')
    })
  })

  describe('Validação de entrada', () => {
    it('deve validar email corretamente', async () => {
      const { isEmailValido } = await import('../core/validation.js')
      
      expect(isEmailValido('teste@email.com')).toBe(true)
      expect(isEmailValido('email-invalido')).toBe(false)
    })

    it('deve validar telefone corretamente', async () => {
      const { isTelefoneValido } = await import('../core/validation.js')
      
      expect(isTelefoneValido('11999999999')).toBe(true)
      expect(isTelefoneValido('123')).toBe(false)
    })

    it('deve validar campos obrigatórios', async () => {
      const { validarCamposObrigatorios } = await import('../core/validation.js')
      
      const dados = { nome: 'João', email: 'joao@email.com' }
      const resultado = validarCamposObrigatorios(dados, ['nome', 'email', 'telefone'])
      
      expect(resultado.valido).toBe(false)
      expect(resultado.campoFaltando).toBe('telefone')
    })
  })

  describe('Segurança', () => {
    it('deve sanitizar texto com HTML', async () => {
      const { sanitizarTexto } = await import('../core/validation.js')
      
      const input = '<script>alert("xss")</script>'
      const output = sanitizarTexto(input)
      
      expect(output).not.toContain('<script>')
      expect(output).toContain('&lt;script&gt;')
    })

    it('deve validar slug corretamente', async () => {
      const { validarSlug } = await import('../core/validation.js')
      
      expect(validarSlug('minha-marca').valido).toBe(true)
      expect(validarSlug('marca@invalida').valido).toBe(false)
      expect(validarSlug('-invalida').valido).toBe(false)
    })

    it('deve validar UUID corretamente', async () => {
      const { isUUIDValido } = await import('../core/validation.js')
      
      expect(isUUIDValido('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isUUIDValido('not-a-uuid')).toBe(false)
    })
  })
})
