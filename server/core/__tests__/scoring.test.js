import {
  resolverCapital,
  calcularScore,
  determinarCategoria,
  processarCapital,
  getScoringTable,
} from '../scoring.js'

describe('core/scoring', () => {
  it('resolve capital em múltiplos formatos', () => {
    expect(resolverCapital('300k-500k')).toBe(400000)
    expect(resolverCapital('R$ 200.000')).toBe(200000)
    expect(resolverCapital(150000)).toBe(150000)
    expect(resolverCapital('valor inválido')).toBe(null)
  })

  it('calcula score por faixa de capital', () => {
    expect(calcularScore(600000)).toBe(95)
    expect(calcularScore(350000)).toBe(90)
    expect(calcularScore(120000)).toBe(60)
    expect(calcularScore(50000)).toBe(50)
  })

  it('determina categoria por score', () => {
    expect(determinarCategoria(90)).toBe('hot')
    expect(determinarCategoria(60)).toBe('warm')
    expect(determinarCategoria(59)).toBe('cold')
  })

  it('processa capital e retorna score/categoria', () => {
    expect(processarCapital('100k-300k')).toEqual({
      capital: 200000,
      score: 80,
      categoria: 'hot',
    })
  })

  it('retorna tabela de scoring com categoria', () => {
    const tabela = getScoringTable()
    expect(tabela.length).toBeGreaterThan(0)
    expect(tabela[0]).toHaveProperty('categoria')
  })
})
