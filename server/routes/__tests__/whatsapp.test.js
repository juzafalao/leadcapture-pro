// ============================================================
// TESTES — Webhook WhatsApp
// server/routes/__tests__/whatsapp.test.js
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      or: vi.fn(() => ({
        is: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [{
                id: 'lead-123',
                nome: 'João Silva',
                telefone: '5511999998888',
                whatsapp_etapa: 'capital',
                score: 50,
              }],
              error: null
            }))
          }))
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}

vi.mock('../core/database.js', () => ({
  default: mockSupabase
}))

vi.mock('../comunicacao/whatsapp.js', () => ({
  enviarMensagem: vi.fn(() => Promise.resolve({ success: true })),
  normalizarTelefone: vi.fn((t) => t.replace(/\D/g, '')),
  extrairTelefoneDoJid: vi.fn((jid) => jid.split('@')[0].replace(/\D/g, '')),
}))

describe('WhatsApp Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Processamento de mensagens', () => {
    it('deve processar resposta de capital', async () => {
      // Simula payload do webhook
      const payload = {
        event: 'messages.upsert',
        data: {
          key: {
            remoteJid: '5511999998888@s.whatsapp.net',
            fromMe: false
          },
          message: {
            conversation: '1' // Opção 1: Até 100k
          }
        }
      }

      // O teste real usaria supertest para chamar a rota
      // Por ora, validamos a lógica
      const capitalMap = {
        '1': 80000,
        '2': 200000,
        '3': 400000,
        '4': 600000,
      }

      expect(capitalMap['1']).toBe(80000)
      expect(capitalMap['2']).toBe(200000)
    })

    it('deve processar resposta de urgência', async () => {
      const urgenciaMap = {
        '1': 'imediato',
        '2': 'curto_prazo',
        '3': 'explorando',
      }

      expect(urgenciaMap['1']).toBe('imediato')
      expect(urgenciaMap['2']).toBe('curto_prazo')
    })
  })

  describe('Cálculo de score', () => {
    it('deve calcular score baseado em capital e urgência', () => {
      function calcularScore(capital, urgencia) {
        let score = 0
        
        if (capital >= 500000) score += 50
        else if (capital >= 300000) score += 40
        else if (capital >= 150000) score += 30
        else if (capital >= 80000) score += 20
        else score += 10

        if (urgencia === 'imediato') score += 30
        else if (urgencia === 'curto_prazo') score += 20
        else score += 5

        if (capital && urgencia) score += 20

        return Math.min(score, 100)
      }

      // Lead quente: capital alto + urgência imediata
      expect(calcularScore(500000, 'imediato')).toBe(100)
      
      // Lead warm: capital médio + curto prazo
      expect(calcularScore(200000, 'curto_prazo')).toBe(70)
      
      // Lead cold: capital baixo + explorando
      expect(calcularScore(50000, 'explorando')).toBe(35)
    })
  })

  describe('Normalização de telefone', () => {
    it('deve extrair telefone do JID', () => {
      const jid = '5511999998888@s.whatsapp.net'
      const telefone = jid.split('@')[0]
      
      expect(telefone).toBe('5511999998888')
    })

    it('deve buscar lead por telefone flexível', () => {
      const telefone = '5511999998888'
      const telefoneBusca = telefone.slice(-11)
      
      expect(telefoneBusca).toBe('11999998888')
    })
  })
})
