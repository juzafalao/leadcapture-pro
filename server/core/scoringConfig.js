// ============================================================
// CORE — Cache de configuração de scoring por tenant
// Busca config da tabela `configuracoes` com TTL de 5 min.
// Fallback automático para DEFAULT_SCORING_CONFIG.
// ============================================================

import supabase from './database.js'
import { DEFAULT_SCORING_CONFIG } from './scoring.js'

const CONFIG_KEY = 'scoring_config_v1'
const TTL_MS = 5 * 60 * 1000

const cache = new Map()

export async function getScoringConfig(tenantId) {
  if (!tenantId) return DEFAULT_SCORING_CONFIG

  const cached = cache.get(tenantId)
  if (cached && cached.expiresAt > Date.now()) return cached.config

  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('tenant_id', tenantId)
      .eq('chave', CONFIG_KEY)
      .maybeSingle()

    if (error || !data?.valor) {
      cache.set(tenantId, { config: DEFAULT_SCORING_CONFIG, expiresAt: Date.now() + TTL_MS })
      return DEFAULT_SCORING_CONFIG
    }

    const parsed = JSON.parse(data.valor)
    const config = {
      tiers: Array.isArray(parsed.tiers) && parsed.tiers.length > 0
        ? parsed.tiers
        : DEFAULT_SCORING_CONFIG.tiers,
      thresholds: {
        HOT:  parsed.thresholds?.HOT  ?? DEFAULT_SCORING_CONFIG.thresholds.HOT,
        WARM: parsed.thresholds?.WARM ?? DEFAULT_SCORING_CONFIG.thresholds.WARM,
      },
    }
    cache.set(tenantId, { config, expiresAt: Date.now() + TTL_MS })
    return config
  } catch {
    return DEFAULT_SCORING_CONFIG
  }
}

export function invalidateScoringCache(tenantId) {
  if (tenantId) cache.delete(tenantId)
}
