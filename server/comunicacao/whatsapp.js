// ============================================================
// COMUNICAÇÃO — Serviço de WhatsApp
// Integração com Evolution API para envio de mensagens
// ============================================================

const EVOLUTION_API_URL    = process.env.EVOLUTION_API_URL    || 'http://localhost:8080'
const EVOLUTION_API_KEY    = process.env.EVOLUTION_API_KEY    || ''
const EVOLUTION_INSTANCE   = process.env.EVOLUTION_INSTANCE   || 'lead-pro'

/**
 * Normaliza telefone para formato internacional (Brasil)
 * @param {string} telefone
 * @returns {string} ex: "5511999998888"
 */
function normalizarTelefone(telefone) {
  const digitos = String(telefone).replace(/\D/g, '')
  return digitos.startsWith('55') ? digitos : `55${digitos}`
}

/**
 * Envia mensagem de texto via Evolution API
 * @param {string} telefone  - Número do destinatário
 * @param {string} mensagem  - Texto da mensagem
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function enviarMensagem(telefone, mensagem) {
  if (!EVOLUTION_API_KEY) {
    console.warn('[Comunicacao/WhatsApp] EVOLUTION_API_KEY não configurada — modo simulado')
    console.log('[Comunicacao/WhatsApp] [SIMULADO] Para:', telefone)
    console.log('[Comunicacao/WhatsApp] [SIMULADO] Mensagem:', mensagem)
    return { success: true, simulated: true }
  }

  try {
    const numero = normalizarTelefone(telefone)

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey':        EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number:  numero,
          textMessage: { text: mensagem },
          options: { delay: 1200 },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.message || `HTTP ${response.status}`)
    }

    console.log('[Comunicacao/WhatsApp] Mensagem enviada para:', numero)
    return { success: true, data }
  } catch (err) {
    console.error('[Comunicacao/WhatsApp] Falha no envio:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Monta e envia a mensagem de boas-vindas para um novo lead
 * @param {object} lead   - Dados do lead
 * @param {object} marca  - { nome, emoji }
 */
export async function enviarBoasVindas(lead, marca) {
  const mensagem = `Olá, ${lead.nome.split(' ')[0]}! 👋

Recebemos seu interesse em *${marca.nome}* ${marca.emoji || ''}

Em breve um de nossos consultores entrará em contato com mais informações.

_LeadCapture Pro · Zafalão Tech_`

  return enviarMensagem(lead.telefone, mensagem)
}

/**
 * Envia mensagem usando template pré-definido
 * @param {string} telefone     - Número do destinatário
 * @param {string} templateName - Nome do template
 * @param {object} vars         - Variáveis do template
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function enviarTemplate(telefone, templateName, vars = {}) {
  const templates = {
    boas_vindas: (v) => `Olá, ${v.nome || 'cliente'}! 👋\n\nRecebemos seu interesse em *${v.marca || 'nossa empresa'}* ${v.emoji || ''}\n\nEm breve um consultor entrará em contato.\n\n_LeadCapture Pro · Zafalão Tech_`,
    followup: (v) => `Olá, ${v.nome || 'cliente'}! 👋\n\nPassando para saber se ainda tem interesse em *${v.marca || 'nossa empresa'}*.\n\nPodemos ajudá-lo? Responda aqui! 😊\n\n_LeadCapture Pro · Zafalão Tech_`,
    hot_lead: (v) => `🔥 *Lead Quente Detectado!*\n\nNome: ${v.nome || '-'}\nTelefone: ${v.telefone || '-'}\nMarca: ${v.marca || '-'}\nScore: ${v.score || '-'}\n\n_LeadCapture Pro · Zafalão Tech_`,
  }

  const templateFn = templates[templateName]
  if (!templateFn) {
    console.warn(`[Comunicacao/WhatsApp] Template "${templateName}" não encontrado`)
    return { success: false, error: `Template "${templateName}" não encontrado` }
  }

  const mensagem = templateFn(vars)
  return enviarMensagem(telefone, mensagem)
}

/**
 * Verifica a conectividade com a Evolution API
 */
export async function verificarConexao() {
  if (!EVOLUTION_API_KEY) {
    return { conectado: false, motivo: 'API key não configurada' }
  }

  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/fetchInstances`,
      {
        headers: { 'apikey': EVOLUTION_API_KEY },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!response.ok) return { conectado: false, motivo: `HTTP ${response.status}` }

    const instancias = await response.json()
    const instancia  = Array.isArray(instancias)
      ? instancias.find(i => i.instance?.instanceName === EVOLUTION_INSTANCE)
      : null

    return {
      conectado: true,
      instancia: EVOLUTION_INSTANCE,
      status: instancia?.instance?.state ?? 'desconhecido',
    }
  } catch (err) {
    return { conectado: false, motivo: err.message }
  }
}
