// ============================================================
// COMUNICAÇÃO — Serviço de WhatsApp
// Integração com Evolution API para envio de mensagens
// ============================================================

import { retryWithBackoff } from '../core/retry.js'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'lead-pro'

let cache = { conectado: false, lastCheck: 0, data: null }

/**
 * Normaliza telefone para formato internacional (Brasil)
 * @param {string} telefone
 * @returns {string}
 */
export function normalizarTelefone(telefone) {
  if (!telefone) return ''
  const digitos = String(telefone).replace(/\D/g, '')
  return digitos.startsWith('55') ? digitos : `55${digitos}`
}

export function extrairTelefoneDoJid(jid) {
  if (!jid) return ''
  return normalizarTelefone(jid.split('@')[0])
}

/**
 * Envia mensagem de texto via Evolution API
 * @param {string} telefone  - Número do destinatário
 * @param {string} mensagem  - Texto da mensagem
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function enviarMensagem(telefone, mensagem) {
  if (!telefone || !mensagem) return { success: false, error: 'Telefone e mensagem obrigatórios' }
  if (!EVOLUTION_API_KEY) return { success: false, simulated: true, error: 'API não configurada' }
  const numero = normalizarTelefone(telefone)
  if (numero.length < 12 || numero.length > 13) return { success: false, error: 'Telefone inválido' }

  try {
    const data = await retryWithBackoff(async () => {
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), 15000)
      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({
          number: numero,
          textMessage: { text: mensagem },
          options: { delay: 1200 },
        }),
        signal: c.signal,
      })
      clearTimeout(t)
      const result = await response.json()
      if (!response.ok) throw new Error(result?.message || `HTTP ${response.status}`)
      return result
    }, { maxRetries: 3, baseDelay: 1000, label: 'WhatsApp' })

    console.log('[WhatsApp] Enviado para:', numero)
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

/**
 * Monta e envia a mensagem de boas-vindas para um novo lead
 * @param {object} lead   - Dados do lead
 * @param {object} marca  - { nome, emoji }
 */
export async function enviarBoasVindas(lead, marca) {
  if (!lead?.telefone) return { success: false, error: 'Sem telefone' }
  const nome = lead.nome?.split(' ')[0] || 'você'
  return enviarMensagem(
    lead.telefone,
    `Olá, ${nome}! 👋\n\nRecebemos seu interesse em *${marca.nome}* ${marca.emoji || ''}\n\nEm breve entraremos em contato.\n\n_LeadCapture Pro_`
  )
}

/**
 * Verifica a conectividade com a Evolution API
 */
export async function verificarConexao() {
  const agora = Date.now()
  if (cache.lastCheck && (agora - cache.lastCheck) < 30000) return cache.data

  if (!EVOLUTION_API_KEY) {
    cache = { conectado: false, lastCheck: agora, data: { conectado: false, motivo: 'API não configurada' } }
    return cache.data
  }

  try {
    const c = new AbortController()
    const t = setTimeout(() => c.abort(), 5000)
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_API_KEY },
      signal: c.signal,
    })
    clearTimeout(t)
    if (!response.ok) {
      cache = { conectado: false, lastCheck: agora, data: { conectado: false, motivo: `HTTP ${response.status}` } }
      return cache.data
    }

    const instancias = await response.json()
    const instancia = Array.isArray(instancias)
      ? instancias.find(i => i.instance?.instanceName === EVOLUTION_INSTANCE || i.name === EVOLUTION_INSTANCE)
      : null

    if (!instancia) {
      cache = { conectado: false, lastCheck: agora, data: { conectado: false, motivo: 'Instância não encontrada' } }
      return cache.data
    }

    const state = instancia.instance?.state || instancia.status || 'unknown'
    const conectado = state === 'open' || state === 'connected'
    cache = { conectado, lastCheck: agora, data: { conectado, instancia: EVOLUTION_INSTANCE, status: state } }
    return cache.data
  } catch (e) {
    cache = { conectado: false, lastCheck: agora, data: { conectado: false, motivo: e.message } }
    return cache.data
  }
}
