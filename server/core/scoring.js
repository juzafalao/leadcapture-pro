// ============================================================
// CORE — Serviço de Pontuação de Leads
// Centraliza toda a lógica de scoring e categorização
// LeadCapture Pro — Zafalão Tech
// ============================================================

export const CAPITAL_MAP = {
  'ate-100k': 80_000,
  '100k-300k': 200_000,
  '300k-500k': 400_000,
  'acima-500k': 600_000,
}

export function resolverCapital(valor) {
  if (!valor && valor !== 0) return null
  if (typeof valor === 'number') return valor
  const str = String(valor).trim()
  if (CAPITAL_MAP[str] !== undefined) return CAPITAL_MAP[str]
  const num = Number(str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return isNaN(num) || num <= 0 ? null : num
}

const SCORING_TABLE = [
  { min: 500_000, score: 95, label: '500k+' },
  { min: 300_000, score: 90, label: '300k–500k' },
  { min: 200_000, score: 80, label: '200k–300k' },
  { min: 150_000, score: 70, label: '150k–200k' },
  { min: 100_000, score: 60, label: '100k–150k' },
  { min: 80_000, score: 55, label: '80k–100k' },
  { min: 0, score: 50, label: '<80k' },
]

const CATEGORIA_THRESHOLDS = {
  HOT: 80,
  WARM: 60,
}

export function calcularScore(capital = 0) {
  const entrada = [...SCORING_TABLE]
    .sort((a, b) => b.min - a.min)
    .find(item => capital >= item.min)
  return entrada ? entrada.score : 50
}

export function determinarCategoria(score) {
  if (score >= CATEGORIA_THRESHOLDS.HOT) return 'hot'
  if (score >= CATEGORIA_THRESHOLDS.WARM) return 'warm'
  return 'cold'
}

export function processarCapital(capitalRaw) {
  const capitalStr = String(capitalRaw ?? '0').replace(/\D/g, '')
  const capital = parseInt(capitalStr, 10) || 0
  const score = calcularScore(capital)
  const categoria = determinarCategoria(score)
  return { capital, score, categoria }
}

export function getScoringTable() {
  return SCORING_TABLE.map(item => ({
    ...item,
    categoria: determinarCategoria(item.score),
  }))
}
