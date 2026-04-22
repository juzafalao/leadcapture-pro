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
  sanitizarObjeto,
} from '../validation.js'

describe('Validation', () => {
  it('valida email', () => {
    expect(isEmailValido('a@b.com')).toBe(true)
    expect(isEmailValido('')).toBe(false)
    expect(isEmailValido('teste..nome@dominio.com')).toBe(false)
  })

  it('valida telefone', () => {
    expect(isTelefoneValido('11999999999')).toBe(true)
    expect(isTelefoneValido('123')).toBe(false)
  })

  it('valida documento CPF/CNPJ', () => {
    expect(validarDocumento('111.444.777-35')).toEqual({ valido: true, tipo: 'CPF', limpo: '11144477735' })
    expect(validarDocumento('45.723.174/0001-10')).toEqual({ valido: true, tipo: 'CNPJ', limpo: '45723174000110' })
    expect(validarDocumento('111.444.777-00').valido).toBe(false)
    expect(validarDocumento('45.723.174/0001-00').valido).toBe(false)
    expect(validarDocumento('123')).toEqual({ valido: false, tipo: null, limpo: '123' })
  })

  it('valida campos obrigatorios', () => {
    expect(validarCamposObrigatorios({ a: 1, b: 2 }, ['a', 'b']).valido).toBe(true)
    expect(validarCamposObrigatorios({ a: 1 }, ['a', 'b']).valido).toBe(false)
  })

  it('sanitiza HTML e limita tamanho', () => {
    expect(sanitizarTexto('<b>oi</b>')).toBe('&lt;b&gt;oi&lt;/b&gt;')
    expect(sanitizarTexto('123456', 3)).toBe('123')
  })

  it('normaliza telefone', () => {
    expect(normalizarTelefone('(11) 99999-9999')).toBe('11999999999')
  })

  it('valida slug', () => {
    expect(validarSlug('marca_teste-1').valido).toBe(true)
    expect(validarSlug('-invalido').valido).toBe(false)
  })

  it('valida UUID', () => {
    expect(isUUIDValido('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(isUUIDValido('invalido')).toBe(false)
  })

  it('sanitiza objeto por campos permitidos', () => {
    expect(sanitizarObjeto({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })
})
