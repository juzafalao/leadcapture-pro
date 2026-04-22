// ============================================================
// TESTES — WhatsApp Service
// server/comunicacao/__tests__/whatsapp.test.js
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  normalizarTelefone,
  extrairTelefoneDoJid,
} from '../whatsapp.js'

global.fetch = vi.fn()

describe('WhatsApp Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.EVOLUTION_API_KEY = 'test-api-key'
    process.env.EVOLUTION_API_URL = 'http://localhost:8080'
    process.env.EVOLUTION_INSTANCE = 'test-instance'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('normalizarTelefone', () => {
    it('deve normalizar telefone com código do país', () => {
      expect(normalizarTelefone('5511999998888')).toBe('5511999998888')
    })

    it('deve adicionar código do Brasil se ausente', () => {
      expect(normalizarTelefone('11999998888')).toBe('5511999998888')
    })

    it('deve remover caracteres especiais', () => {
      expect(normalizarTelefone('(11) 99999-8888')).toBe('5511999998888')
    })

    it('deve retornar string vazia para input vazio', () => {
      expect(normalizarTelefone('')).toBe('')
      expect(normalizarTelefone(null)).toBe('')
    })
  })

  describe('extrairTelefoneDoJid', () => {
    it('deve extrair telefone do JID do WhatsApp', () => {
      expect(extrairTelefoneDoJid('5511999998888@s.whatsapp.net')).toBe('5511999998888')
    })

    it('deve lidar com JID @lid', () => {
      expect(extrairTelefoneDoJid('5511999998888@lid')).toBe('5511999998888')
    })

    it('deve retornar string vazia para JID vazio', () => {
      expect(extrairTelefoneDoJid('')).toBe('')
    })
  })
})
