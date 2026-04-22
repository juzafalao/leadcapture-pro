// ============================================================
// TESTES — Validation Service
// server/core/__tests__/validation.test.js
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  isEmailValido,
  isTelefoneValido,
  validarDocumento,
  validarCamposObrigatorios,
  sanitizarTexto,
  normalizarTelefone,
  validarSlug,
  isUUIDValido,
} from '../validation.js'

describe('Validation Service', () => {
  describe('isEmailValido', () => {
    it('deve validar emails corretos', () => {
      expect(isEmailValido('teste@email.com')).toBe(true)
      expect(isEmailValido('usuario@dominio.com.br')).toBe(true)
    })

    it('deve rejeitar emails inválidos', () => {
      expect(isEmailValido('')).toBe(false)
      expect(isEmailValido('sem-arroba')).toBe(false)
      expect(isEmailValido(null)).toBe(false)
    })
  })

  describe('isTelefoneValido', () => {
    it('deve validar telefones corretos', () => {
      expect(isTelefoneValido('11999999999')).toBe(true)
      expect(isTelefoneValido('(11) 99999-9999')).toBe(true)
    })

    it('deve rejeitar telefones inválidos', () => {
      expect(isTelefoneValido('')).toBe(false)
      expect(isTelefoneValido('123')).toBe(false)
    })
  })

  describe('validarDocumento', () => {
    it('deve validar CPF correto', () => {
      const resultado = validarDocumento('529.982.247-25')
      expect(resultado.valido).toBe(true)
      expect(resultado.tipo).toBe('CPF')
    })

    it('deve rejeitar CPF com todos dígitos iguais', () => {
      expect(validarDocumento('111.111.111-11').valido).toBe(false)
    })

    it('deve validar CNPJ correto', () => {
      const resultado = validarDocumento('11.222.333/0001-81')
      expect(resultado.valido).toBe(true)
      expect(resultado.tipo).toBe('CNPJ')
    })
  })

  describe('validarCamposObrigatorios', () => {
    it('deve validar quando todos campos presentes', () => {
      const dados = { nome: 'João', email: 'joao@email.com' }
      const resultado = validarCamposObrigatorios(dados, ['nome', 'email'])
      expect(resultado.valido).toBe(true)
    })

    it('deve identificar campo faltando', () => {
      const dados = { nome: 'João' }
      const resultado = validarCamposObrigatorios(dados, ['nome', 'email'])
      expect(resultado.valido).toBe(false)
      expect(resultado.campoFaltando).toBe('email')
    })
  })

  describe('sanitizarTexto', () => {
    it('deve fazer trim do texto', () => {
      expect(sanitizarTexto('  texto  ')).toBe('texto')
    })

    it('deve escapar HTML', () => {
      expect(sanitizarTexto('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    })

    it('deve retornar string vazia para null', () => {
      expect(sanitizarTexto(null)).toBe('')
    })
  })

  describe('validarSlug', () => {
    it('deve validar slugs corretos', () => {
      expect(validarSlug('minha-marca').valido).toBe(true)
      expect(validarSlug('marca_123').valido).toBe(true)
    })

    it('deve rejeitar slug vazio', () => {
      expect(validarSlug('').valido).toBe(false)
    })

    it('deve rejeitar slug com caracteres especiais', () => {
      expect(validarSlug('marca@especial').valido).toBe(false)
    })
  })

  describe('isUUIDValido', () => {
    it('deve validar UUIDs corretos', () => {
      expect(isUUIDValido('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('deve rejeitar UUIDs inválidos', () => {
      expect(isUUIDValido('')).toBe(false)
      expect(isUUIDValido('not-a-uuid')).toBe(false)
    })
  })
})
