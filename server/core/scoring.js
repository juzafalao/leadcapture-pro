// ============================================================
// CORE — Serviço de Pontuação de Leads
// Centraliza toda a lógica de scoring e categorização
// ============================================================

/**
 * Tabela de pontuação baseada no capital disponível (R$)
 */
const SCORING_TABLE = [
  { min: 500_000, score: 95, label: '500k+' },
  { min: 300_000, score: 90, label: '300k–500k' },
  { min: 200_000, score: 80, label: '200k–300k' },
  { min: 150_000, score: 70, label: '150k–200k' },
  { min: 100_000, score: 60, label: '100k–150k' },
  { min:  80_000, score: 55, label: '80k–100k' },
  { min:       0, score: 50, label: '<80k' },
]

/**
 * Limites de categoria
 */
const CATEGORIA_THRESHOLDS = {
  HOT:  80,
  WARM: 60,
}

/**
 * Calcula o score de um lead com base no capital disponível
 * @param {number} capital - Capital disponível em reais
 * @returns {number} Score de 50 a 95
 */
export function calcularScore(capital = 0) {
  // Ordenar decrescentemente por min para garantir que o maior patamar atingido seja selecionado
  const entrada = [...SCORING_TABLE]
    .sort((a, b) => b.min - a.min)
    .find(item => capital >= item.min)
  return entrada ? entrada.score : 50
}

/**
 * Determina a categoria do lead com base no score
 * @param {number} score
 * @returns {'hot' | 'warm' | 'cold'}
 */
export function determinarCategoria(score) {
  if (score >= CATEGORIA_THRESHOLDS.HOT)  return 'hot'
  if (score >= CATEGORIA_THRESHOLDS.WARM) return 'warm'
  return 'cold'
}

/**
 * Processa o capital e retorna score + categoria em uma única chamada
 * @param {string|number} capitalRaw - Capital em formato string ou número
 * @returns {{ capital: number, score: number, categoria: string }}
 */
export function processarCapital(capitalRaw) {
  const capitalStr = String(capitalRaw ?? '0').replace(/\D/g, '')
  const capital = parseInt(capitalStr, 10) || 0
  const score = calcularScore(capital)
  const categoria = determinarCategoria(score)

  return { capital, score, categoria }
}

/**
 * Retorna a tabela de scoring completa (útil para documentação e testes)
 */
export function getScoringTable() {
  return SCORING_TABLE.map(item => ({
    ...item,
    categoria: determinarCategoria(item.score),
  }))
}
