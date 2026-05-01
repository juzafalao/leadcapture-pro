import { describe, it, expect } from 'vitest'
import {
  isEmailValido,
  isTelefoneValido,
  normalizarTelefone,
  sanitizarTexto,
  validarSlug,
  isUUIDValido,
} from '../validation.js'

describe('Validation', () => {
  it('email valido', () => expect(isEmailValido('teste@email.com')).toBe(true))
  it('email invalido', () => expect(isEmailValido('sem-arroba')).toBe(false))
  it('telefone valido (sem DDI)', () => expect(isTelefoneValido('11999999999')).toBe(true))
  it('telefone valido (com DDI BR)', () => expect(isTelefoneValido('5511999999999')).toBe(true))
  it('telefone valido (DDI internacional)', () => expect(isTelefoneValido('447911123456')).toBe(true))
  it('escape HTML', () => expect(sanitizarTexto('<script>')).toBe('&lt;script&gt;'))
  it('slug valido', () => expect(validarSlug('minha-marca').valido).toBe(true))
  it('UUID valido', () => expect(isUUIDValido('550e8400-e29b-41d4-a716-446655440000')).toBe(true))
})

describe('normalizarTelefone — formato DDI+DDD+NÚMERO', () => {
  // Brasil — sem DDI (canais como Google Forms)
  it('BR: adiciona DDI a número sem DDI (11 dígitos)', () => {
    expect(normalizarTelefone('14996011482')).toBe('5514996011482')
  })
  it('BR: fixo sem DDI (10 dígitos)', () => {
    expect(normalizarTelefone('1436011482')).toBe('551436011482')
  })
  it('BR: com máscara (14) 99601-1482', () => {
    expect(normalizarTelefone('(14) 99601-1482')).toBe('5514996011482')
  })
  it('BR: zero inicial removido', () => {
    expect(normalizarTelefone('014996011482')).toBe('5514996011482')
  })

  // Brasil — com DDI (landing page envia combinado)
  it('BR: DDI já presente (13 dígitos) — idempotente', () => {
    expect(normalizarTelefone('5514996011482')).toBe('5514996011482')
  })
  it('BR: +55 com espaços', () => {
    expect(normalizarTelefone('+55 14 99601-1482')).toBe('5514996011482')
  })
  it('BR: fixo com DDI (12 dígitos)', () => {
    expect(normalizarTelefone('551436011482')).toBe('551436011482')
  })

  // Internacional (landing page envia DDI selecionado + número local)
  it('EUA: +1 + número local (12 dígitos)', () => {
    expect(normalizarTelefone('12125550123')).toBe('12125550123')
  })
  it('PT: +351 + número (12 dígitos)', () => {
    expect(normalizarTelefone('351912345678')).toBe('351912345678')
  })
  it('UK: +44 + número (12 dígitos)', () => {
    expect(normalizarTelefone('447911123456')).toBe('447911123456')
  })
  it('AR: +54 + número (13 dígitos)', () => {
    expect(normalizarTelefone('5491123456789')).toBe('5491123456789')
  })

  // Casos especiais
  it('vazio retorna string vazia', () => {
    expect(normalizarTelefone('')).toBe('')
    expect(normalizarTelefone(null)).toBe('')
    expect(normalizarTelefone(undefined)).toBe('')
  })
})
