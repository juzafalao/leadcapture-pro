// ============================================================
// webhookDispatcher.js — Dispatcher de eventos para webhooks
// LeadCapture Pro · Zafalão Tech
// ============================================================

import supabase from '../core/database.js'

export const EVENTOS = [
  'lead_criado',
  'lead_status_atualizado',
  'tarefa_criada',
  'tarefa_concluida',
  'interacao_manual',
]

// ─── Circuit Breaker ──────────────────────────────────────────
// Evita que falhas repetidas de um webhook remoto bloqueiem o servidor.
// Estado em memória: reseta ao reiniciar o processo (comportamento intencional).
const CIRCUIT_THRESHOLD = 3       // falhas consecutivas para abrir o circuito
const CIRCUIT_RESET_MS  = 60_000  // 1 min sem tentativas antes de re-habilitar

const _circuitState = new Map() // url → { failures, lastFailure, open }

function _isCircuitOpen(url) {
  const s = _circuitState.get(url)
  if (!s?.open) return false
  if (Date.now() - s.lastFailure > CIRCUIT_RESET_MS) {
    _circuitState.set(url, { failures: 0, lastFailure: 0, open: false })
    return false
  }
  return true
}

function _recordFailure(url) {
  const s = _circuitState.get(url) || { failures: 0, lastFailure: 0, open: false }
  s.failures++
  s.lastFailure = Date.now()
  s.open = s.failures >= CIRCUIT_THRESHOLD
  _circuitState.set(url, s)
  if (s.open) console.warn(`[Webhook] Circuit aberto para ${url} (${s.failures} falhas)`)
}

function _recordSuccess(url) {
  _circuitState.set(url, { failures: 0, lastFailure: 0, open: false })
}

// ─── Dispatcher ───────────────────────────────────────────────
/**
 * Busca todos os webhooks ativos do tenant que escutam o evento
 * e dispara requests POST para cada URL configurada.
 * Falhas individuais não bloqueiam os demais disparos.
 */
export async function dispatchWebhookEvent(tenantId, evento, payload) {
  if (!tenantId || !evento) return

  try {
    const { data: configs, error } = await supabase
      .from('webhook_configs')
      .select('id, url, secret_token')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .contains('eventos', [evento])

    if (error || !configs?.length) return

    const body = JSON.stringify({
      evento,
      tenant_id: tenantId,
      timestamp: new Date().toISOString(),
      dados: payload,
    })

    await Promise.allSettled(
      configs.map(cfg => {
        if (_isCircuitOpen(cfg.url)) {
          console.warn(`[Webhook] ${evento} → ${cfg.url} : skipped (circuit open)`)
          return Promise.resolve()
        }

        const headers = { 'Content-Type': 'application/json' }
        if (cfg.secret_token) headers['X-Webhook-Secret'] = cfg.secret_token

        return fetch(cfg.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(8000),
        })
          .then(r => {
            if (r.ok) {
              _recordSuccess(cfg.url)
            } else {
              _recordFailure(cfg.url)
            }
            console.log(`[Webhook] ${evento} → ${cfg.url} : ${r.status}`)
          })
          .catch(err => {
            _recordFailure(cfg.url)
            console.warn(`[Webhook] ${evento} → ${cfg.url} : ${err.message}`)
          })
      })
    )
  } catch (err) {
    console.warn('[WebhookDispatcher] Erro ao despachar:', err.message)
  }
}
