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
  it('telefone valido (com DDI)', () => expect(isTelefoneValido('5511999999999')).toBe(true))
  it('escape HTML', () => expect(sanitizarTexto('<script>')).toBe('&lt;script&gt;'))
  it('slug valido', () => expect(validarSlug('minha-marca').valido).toBe(true))
  it('UUID valido', () => expect(isUUIDValido('550e8400-e29b-41d4-a716-446655440000')).toBe(true))
})

describe('normalizarTelefone — sempre DDI+DDD+NÚMERO', () => {
  it('adiciona DDI a número sem DDD', () => {
    expect(normalizarTelefone('14996011482')).toBe('5514996011482')
  })

  it('mantém DDI quando já presente (13 dígitos)', () => {
    expect(normalizarTelefone('5514996011482')).toBe('5514996011482')
  })

  it('formata entrada com máscara brasileira', () => {
    expect(normalizarTelefone('(14) 99601-1482')).toBe('5514996011482')
  })

  it('formata entrada com +55 e espaços', () => {
    expect(normalizarTelefone('+55 14 99601-1482')).toBe('5514996011482')
  })

  it('remove zero inicial antes de adicionar DDI', () => {
    expect(normalizarTelefone('014996011482')).toBe('5514996011482')
  })

  it('funciona para fixo (10 dígitos)', () => {
    expect(normalizarTelefone('1436011482')).toBe('551436011482')
  })

  it('funciona para fixo com DDI (12 dígitos)', () => {
    expect(normalizarTelefone('551436011482')).toBe('551436011482')
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(normalizarTelefone('')).toBe('')
    expect(normalizarTelefone(null)).toBe('')
    expect(normalizarTelefone(undefined)).toBe('')
  })
})
