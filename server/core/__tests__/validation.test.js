import { describe, it, expect } from 'vitest'
import { isEmailValido, isTelefoneValido, sanitizarTexto, validarSlug, isUUIDValido } from '../validation.js'

describe('Validation', () => {
  it('email valido', () => expect(isEmailValido('teste@email.com')).toBe(true))
  it('email invalido', () => expect(isEmailValido('sem-arroba')).toBe(false))
  it('telefone valido', () => expect(isTelefoneValido('11999999999')).toBe(true))
  it('escape HTML', () => expect(sanitizarTexto('<script>')).toBe('&lt;script&gt;'))
  it('slug valido', () => expect(validarSlug('minha-marca').valido).toBe(true))
  it('UUID valido', () => expect(isUUIDValido('550e8400-e29b-41d4-a716-446655440000')).toBe(true))
})
