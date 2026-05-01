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

/**
 * Busca todos os webhooks ativos do tenant que escutam o evento
 * e dispara requests POST para cada URL configurada.
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
        const headers = { 'Content-Type': 'application/json' }
        if (cfg.secret_token) headers['X-Webhook-Secret'] = cfg.secret_token

        return fetch(cfg.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(8000),
        })
          .then(r => console.log(`[Webhook] ${evento} → ${cfg.url} : ${r.status}`))
          .catch(err => console.warn(`[Webhook] ${evento} → ${cfg.url} : ${err.message}`))
      })
    )
  } catch (err) {
    console.warn('[WebhookDispatcher] Erro ao despachar:', err.message)
  }
}
