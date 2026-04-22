import { describe, it, expect } from 'vitest'
import { calcularScore, determinarCategoria, resolverCapital } from '../scoring.js'

describe('Scoring', () => {
  it('capital >= 500k = score 95', () => expect(calcularScore(500000)).toBe(95))
  it('score >= 80 = hot', () => expect(determinarCategoria(80)).toBe('hot'))
  it('score 60-79 = warm', () => expect(determinarCategoria(70)).toBe('warm'))
  it('score < 60 = cold', () => expect(determinarCategoria(50)).toBe('cold'))
  it('resolver capital slugs', () => {
    expect(resolverCapital('ate-100k')).toBe(80000)
    expect(resolverCapital('acima-500k')).toBe(600000)
  })
})
