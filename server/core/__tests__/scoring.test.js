import { describe, it, expect } from 'vitest'
import { calcularScore, determinarCategoria, processarCapital } from '../scoring.js'

describe('Scoring', () => {
  it('capital 500k = score 95', () => expect(calcularScore(500000)).toBe(95))
  it('capital 300k = score 90', () => expect(calcularScore(300000)).toBe(90))
  it('score 80 = hot', () => expect(determinarCategoria(80)).toBe('hot'))
  it('score 70 = warm', () => expect(determinarCategoria(70)).toBe('warm'))
  it('score 50 = cold', () => expect(determinarCategoria(50)).toBe('cold'))
  it('processar capital', () => {
    const r = processarCapital(500000)
    expect(r.score).toBe(95)
    expect(r.categoria).toBe('hot')
  })
})
