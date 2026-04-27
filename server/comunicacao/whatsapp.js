// ============================================================
// COMUNICAÇÃO — Serviço de WhatsApp (CORRIGIDO)
// Integração com Evolution API para envio de mensagens
// LeadCapture Pro — Zafalão Tech
//
// CORREÇÕES:
// - Timeout adequado nas requisições
// - Normalização consistente de telefone
// - Cache de conexão
// - Retry com backoff
// ============================================================

import { retryWithBackoff } from '../core/retry.js'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'lead-pro'

// Cache de status da conexão
let connectionCache = {
  conectado: false,
  lastCheck: 0,
  cache: null
}

/**
 * Normaliza telefone para formato internacional (Brasil)
 * @param {string} telefone
 * @returns {string} ex: "5511999998888"
 */
export function normalizarTelefone(telefone) {
  if (!telefone) return ''
  const digitos = String(telefone).replace(/\D/g, '')
  const limpo = digitos.replace(/^(55|\+55)/, '')
  return limpo ? `55${limpo}` : ''
}

/**
 * Extrai telefone do formato JID do WhatsApp
 * @param {string} jid - ex: "5511999998888@s.whatsapp.net"
 * @returns {string} - ex: "5511999998888"
 */
export function extrairTelefoneDoJid(jid) {
  if (!jid) return ''
  const telefone = jid.split('@')[0]
  return normalizarTelefone(telefone)
}

/**
 * Envia mensagem de texto via Evolution API
 * @param {string} telefone - Número do destinatário
 * @param {string} mensagem - Texto da mensagem
 * @returns {Promise<{ success: boolean, error?: string, simulated?: boolean }>}
 */
export async function enviarMensagem(telefone, mensagem) {
  if (!telefone || !mensagem) {
    return { success: false, error: 'Telefone e mensagem são obrigatórios' }
  }

  if (!EVOLUTION_API_KEY) {
    console.warn('[WhatsApp] EVOLUTION_API_KEY não configurada. Mensagem simulada.')
    return { success: false, simulated: true, error: 'API não configurada' }
  }

  const numero = normalizarTelefone(telefone)

  if (numero.length < 12 || numero.length > 13) {
    return { success: false, error: `Telefone inválido: ${numero} (deve ter 12-13 dígitos)` }
  }

  try {
    const data = await retryWithBackoff(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: numero,
            text: mensagem,
            options: { delay: 1200, presence: 'composing' },
          }),
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result?.message || result?.error?.message || `HTTP ${response.status}`
        throw new Error(errorMsg)
      }

      return result
    }, { maxRetries: 3, baseDelay: 1000, label: 'WhatsApp' })

    console.log('[WhatsApp] Mensagem enviada para:', numero)
    return { success: true, data }
  } catch (err) {
    console.error('[WhatsApp] Falha no envio:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Monta e envia a mensagem de boas-vindas para um novo lead
 */
export async function enviarBoasVindas(lead, marca) {
  if (!lead?.telefone) {
    return { success: false, error: 'Lead sem telefone' }
  }

  const primeiroNome = lead.nome?.split(' ')[0] || 'você'

  const mensagem = `Olá, ${primeiroNome}! 👋

Recebemos seu interesse em *${marca.nome}* ${marca.emoji || ''}

Em breve um de nossos consultores entrará em contato com mais informações.

_LeadCapture Pro · Zafalão Tech_`

  return enviarMensagem(lead.telefone, mensagem)
}

/**
 * Verifica a conectividade com a Evolution API
 * Com cache de 30 segundos
 */
export async function verificarConexao() {
  const agora = Date.now()
  if (connectionCache.lastCheck && (agora - connectionCache.lastCheck) < 30000) {
    return connectionCache.cache
  }

  if (!EVOLUTION_API_KEY) {
    const result = { conectado: false, motivo: 'EVOLUTION_API_KEY não configurada' }
    connectionCache = { conectado: false, lastCheck: agora, cache: result }
    return result
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/fetchInstances`,
      {
        headers: { 'apikey': EVOLUTION_API_KEY },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      const result = { conectado: false, motivo: `HTTP ${response.status}` }
      connectionCache = { conectado: false, lastCheck: agora, cache: result }
      return result
    }

    const instancias = await response.json()

    let instancia = null
    if (Array.isArray(instancias)) {
      instancia = instancias.find(i =>
        i.instance?.instanceName === EVOLUTION_INSTANCE ||
        i.name === EVOLUTION_INSTANCE
      )
    }

    if (!instancia) {
      const result = {
        conectado: false,
        motivo: `Instância '${EVOLUTION_INSTANCE}' não encontrada`,
        instanciasDisponiveis: Array.isArray(instancias)
          ? instancias.map(i => i.instance?.instanceName || i.name).filter(Boolean)
          : []
      }
      connectionCache = { conectado: false, lastCheck: agora, cache: result }
      return result
    }

    const state = instancia.instance?.state || instancia.status || 'unknown'
    const conectado = state === 'open' || state === 'connected'

    const result = {
      conectado,
      instancia: EVOLUTION_INSTANCE,
      status: state,
      numero: instancia.instance?.ownerNumber || instancia.number || null,
      perfil: instancia.instance?.profileName || instancia.profileName || null,
    }

    connectionCache = { conectado, lastCheck: agora, cache: result }
    return result
  } catch (err) {
    const result = {
      conectado: false,
      motivo: err.name === 'AbortError' ? 'Timeout (5s)' : err.message
    }
    connectionCache = { conectado: false, lastCheck: agora, cache: result }
    return result
  }
}

/**
 * Invalida o cache de conexão
 */
export function invalidarCacheConexao() {
  connectionCache = { conectado: false, lastCheck: 0, cache: null }
}

/**
 * Envia mensagem para múltiplos destinatários
 */
export async function enviarEmMassa(telefones, mensagem) {
  const resultados = []
  let sucessos = 0
  let falhas = 0

  for (const telefone of telefones) {
    await new Promise(r => setTimeout(r, 1500))
    const resultado = await enviarMensagem(telefone, mensagem)
    resultados.push({ telefone, ...resultado })
    if (resultado.success) sucessos++
    else falhas++
  }

  return { sucessos, falhas, resultados }
}
