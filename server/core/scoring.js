// ============================================================
// CORE — Serviço de Pontuação de Leads
// Centraliza toda a lógica de scoring e categorização
// ============================================================

/**
 * Mapa de slugs de capital (vindos do formulário) para valores numéricos
 * Centralizado aqui para evitar duplicação em leads.js
 */
export const CAPITAL_MAP = {
  'ate-100k':   80_000,
  '100k-300k':  200_000,
  '300k-500k':  400_000,
  'acima-500k': 600_000,
}

/**
 * Converte qualquer representação de capital para número
 * Aceita: slug do mapa, número direto, string numérica
 */
export function resolverCapital(valor) {
  if (!valor && valor !== 0) return null
  if (typeof valor === 'number') return valor > 0 ? valor : null
  const str = String(valor).trim()
  if (CAPITAL_MAP[str] !== undefined) return CAPITAL_MAP[str]
  const num = Number(str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return isNaN(num) || num <= 0 ? null : num
}

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
  const capitalResolvido = resolverCapital(capital) ?? 0

  // Ordenar decrescentemente por min para garantir que o maior patamar atingido seja selecionado
  const entrada = [...SCORING_TABLE]
    .sort((a, b) => b.min - a.min)
    .find(item => capitalResolvido >= item.min)
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
  const capital = resolverCapital(capitalRaw) ?? 0
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
