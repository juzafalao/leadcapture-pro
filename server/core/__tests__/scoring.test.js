// ============================================================
// TESTES — Scoring Service
// server/core/__tests__/scoring.test.js
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  calcularScore,
  determinarCategoria,
  processarCapital,
  resolverCapital,
  CAPITAL_MAP,
  getScoringTable,
} from '../scoring.js'

describe('Scoring Service', () => {
  describe('calcularScore', () => {
    it('deve retornar 95 para capital >= 500k', () => {
      expect(calcularScore(500_000)).toBe(95)
      expect(calcularScore(1_000_000)).toBe(95)
    })

    it('deve retornar 90 para capital entre 300k e 500k', () => {
      expect(calcularScore(300_000)).toBe(90)
      expect(calcularScore(400_000)).toBe(90)
    })

    it('deve retornar 80 para capital entre 200k e 300k', () => {
      expect(calcularScore(200_000)).toBe(80)
      expect(calcularScore(250_000)).toBe(80)
    })

    it('deve retornar 50 para capital < 80k', () => {
      expect(calcularScore(0)).toBe(50)
      expect(calcularScore(50_000)).toBe(50)
    })
  })

  describe('determinarCategoria', () => {
    it('deve retornar "hot" para score >= 80', () => {
      expect(determinarCategoria(80)).toBe('hot')
      expect(determinarCategoria(95)).toBe('hot')
    })

    it('deve retornar "warm" para score entre 60 e 79', () => {
      expect(determinarCategoria(60)).toBe('warm')
      expect(determinarCategoria(70)).toBe('warm')
    })

    it('deve retornar "cold" para score < 60', () => {
      expect(determinarCategoria(50)).toBe('cold')
      expect(determinarCategoria(0)).toBe('cold')
    })
  })

  describe('resolverCapital', () => {
    it('deve resolver slugs do CAPITAL_MAP', () => {
      expect(resolverCapital('ate-100k')).toBe(80_000)
      expect(resolverCapital('100k-300k')).toBe(200_000)
      expect(resolverCapital('300k-500k')).toBe(400_000)
      expect(resolverCapital('acima-500k')).toBe(600_000)
    })

    it('deve retornar número diretamente', () => {
      expect(resolverCapital(150_000)).toBe(150_000)
    })

    it('deve retornar null para valores inválidos', () => {
      expect(resolverCapital('')).toBe(null)
      expect(resolverCapital(null)).toBe(null)
    })
  })

  describe('processarCapital', () => {
    it('deve processar capital e retornar score + categoria', () => {
      const resultado = processarCapital(500_000)
      expect(resultado).toEqual({
        capital: 500_000,
        score: 95,
        categoria: 'hot',
      })
    })
  })

  describe('getScoringTable', () => {
    it('deve retornar tabela completa', () => {
      const tabela = getScoringTable()
      expect(Array.isArray(tabela)).toBe(true)
      expect(tabela.length).toBe(7)
    })
  })
})
