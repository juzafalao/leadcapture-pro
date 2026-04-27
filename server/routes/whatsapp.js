// ============================================================
// ROUTES — /api/whatsapp
// WhatsApp IA de qualificação de leads via Evolution API
// LeadCapture Pro — Zafalão Tech
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'
import { enviarMensagem, normalizarTelefone, extrairTelefoneDoJid } from '../comunicacao/whatsapp.js'
import { processarMensagemAgente, temConversaAgenteAtiva } from '../services/agente.js'
import rateLimit from 'express-rate-limit'

// Tenant padrão para novos contatos via agente IA (configura via env)
const AGENTE_TENANT_ID = process.env.AGENTE_TENANT_ID || null

const router = Router()

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: 'Rate limit excedido' }
})

// Fluxo de qualificação — configurável via env
const SEGMENTO_LABEL = process.env.AGENTE_SEGMENTO || 'franquias'

const FLUXO_QUALIFICACAO = [
  {
    etapa: 'capital',
    pergunta: (nome) =>
      `Oi, ${nome}! 👋 Que bom receber seu interesse!\n\nPara conectar você ao consultor certo e não perder seu tempo, preciso entender seu perfil de investimento. Qual faixa está mais próxima do seu capital disponível?\n\n1️⃣ Até R$ 150 mil\n2️⃣ R$ 150 mil a R$ 300 mil\n3️⃣ R$ 300 mil a R$ 500 mil\n4️⃣ Acima de R$ 500 mil\n\nResponda com 1, 2, 3 ou 4.`,
  },
  {
    etapa: 'regiao',
    pergunta: () =>
      `Ótimo! 📍 Em qual cidade ou estado você quer abrir o negócio?`,
  },
  {
    etapa: 'urgencia',
    pergunta: () =>
      `Entendido! Qual é o seu prazo para tomar uma decisão?\n\n1️⃣ Quero começar nos próximos 3 meses\n2️⃣ Em até 6 meses\n3️⃣ Ainda estou pesquisando\n\nResponda com 1, 2 ou 3.`,
  },
  {
    etapa: 'finalizado',
    mensagem: (nome) =>
      `Perfeito, ${nome}! ✅\n\nSuas informações foram enviadas para nossa equipe de consultores. Alguém especializado vai entrar em contato em breve — geralmente em menos de 1 hora durante o horário comercial.\n\n_Aguarde! Boas oportunidades não esperam._ 🚀`,
  },
]

const capitalMap = {
  '1': 100000, '2': 225000, '3': 400000, '4': 600000,
  '1️⃣': 100000, '2️⃣': 225000, '3️⃣': 400000, '4️⃣': 600000,
}

const urgenciaMap = {
  '1': 'imediato', '2': 'curto_prazo', '3': 'explorando',
  '1️⃣': 'imediato', '2️⃣': 'curto_prazo', '3️⃣': 'explorando',
}

// ============================================================
// POST /api/whatsapp/webhook
// ============================================================
router.post('/webhook', webhookLimiter, async (req, res) => {
  const webhookToken = process.env.EVOLUTION_WEBHOOK_TOKEN
  if (webhookToken) {
    const tokenRecebido = req.headers['x-webhook-token'] || req.query.token
    if (tokenRecebido !== webhookToken) {
      console.warn('[WhatsApp] Webhook rejeitado — token inválido')
      return res.status(401).json({ success: false, error: 'Token inválido' })
    }
  }

  try {
    const payload = req.body
    console.log('[WhatsApp/Webhook] Payload recebido:', JSON.stringify(payload).slice(0, 500))

    const event = payload?.event || payload?.type || payload?.data?.event
    const data = payload?.data || payload

    const eventosValidos = ['messages.upsert', 'message', 'messages.upsert@broadcast']
    if (!eventosValidos.includes(event)) {
      return res.json({ success: true, ignorado: true, motivo: 'evento não processado' })
    }

    const fromMe = data?.key?.fromMe || data?.fromMe || data?.message?.fromMe
    if (fromMe) {
      return res.json({ success: true, ignorado: true, motivo: 'mensagem enviada pelo bot' })
    }

    const mensagem = data?.message?.conversation
      || data?.message?.extendedTextMessage?.text
      || data?.body
      || data?.message?.text
      || ''

    const telefoneRaw = data?.key?.remoteJid || data?.from || data?.sender || ''

    if (!mensagem || !telefoneRaw) {
      return res.json({ success: true, ignorado: true, motivo: 'sem mensagem ou telefone' })
    }

    const telefone = extrairTelefoneDoJid(telefoneRaw)
    console.log(`[WhatsApp/Webhook] Mensagem de ${telefone}: ${mensagem.slice(0, 50)}...`)

    // Busca lead pelo telefone — tenta com e sem código do país (55)
    const telefoneSemCC = telefone.startsWith('55') ? telefone.slice(2) : telefone
    const { data: leads } = await supabase
      .from('leads')
      .select('id, nome, tenant_id, score, categoria, capital_disponivel, regiao_interesse, urgencia, whatsapp_etapa, telefone')
      .or(`telefone.eq.${telefoneSemCC},telefone.eq.${telefone}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!leads?.length) {
      // Tenta agente IA para contatos desconhecidos
      if (AGENTE_TENANT_ID) {
        console.log(`[WhatsApp/Webhook] Contato desconhecido ${telefone} → agente IA`)
        const nomeContato = data?.pushName || data?.notifyName || null
        const result = await processarMensagemAgente(telefone, mensagem, AGENTE_TENANT_ID, nomeContato)
        if (result.handled) return res.json({ success: true, agente: true })
      }
      console.log(`[WhatsApp/Webhook] Lead não encontrado para telefone: ${telefone}`)
      return res.json({ success: true, ignorado: true, motivo: 'lead não encontrado' })
    }

    const lead = leads[0]

    // Se há conversa de agente IA ativa para este lead, roteia para o agente
    if (AGENTE_TENANT_ID) {
      const agenteAtivo = await temConversaAgenteAtiva(telefone, lead.tenant_id)
      if (agenteAtivo) {
        console.log(`[WhatsApp/Webhook] Conversa agente ativa para ${telefone}`)
        const result = await processarMensagemAgente(telefone, mensagem, lead.tenant_id)
        if (result.handled) return res.json({ success: true, agente: true })
      }
    }

    const etapaAtual = lead.whatsapp_etapa || 'capital'

    if (etapaAtual === 'finalizado') {
      return res.json({ success: true, ignorado: true, motivo: 'fluxo já finalizado' })
    }

    const atualizacoes = {}
    const mensagemNormalizada = mensagem.trim()

    if (etapaAtual === 'capital') {
      const capital = capitalMap[mensagemNormalizada] || capitalMap[mensagemNormalizada.slice(0, 1)]
      if (capital) {
        atualizacoes.capital_disponivel = capital
        atualizacoes.whatsapp_etapa = 'regiao'
      }
    } else if (etapaAtual === 'regiao') {
      atualizacoes.regiao_interesse = mensagemNormalizada.substring(0, 100)
      atualizacoes.whatsapp_etapa = 'urgencia'
    } else if (etapaAtual === 'urgencia') {
      const urgencia = urgenciaMap[mensagemNormalizada] || urgenciaMap[mensagemNormalizada.slice(0, 1)] || 'explorando'
      atualizacoes.urgencia = urgencia
      atualizacoes.whatsapp_etapa = 'finalizado'
    }

    if (Object.keys(atualizacoes).length > 0) {
      const capitalAtual = atualizacoes.capital_disponivel || lead.capital_disponivel || 0
      const urgenciaAtual = atualizacoes.urgencia || lead.urgencia
      const score = calcularScore(capitalAtual, urgenciaAtual)
      atualizacoes.score = score
      atualizacoes.categoria = score >= 65 ? 'hot' : score >= 40 ? 'warm' : 'cold'
      atualizacoes.updated_at = new Date().toISOString()

      await supabase.from('leads').update(atualizacoes).eq('id', lead.id)
      console.log(`[WhatsApp/Webhook] Lead ${lead.id} atualizado: etapa=${atualizacoes.whatsapp_etapa}, score=${score}`)

      if (score >= 65 && lead.score < 65) {
        notificarConsultor(lead.id, lead.tenant_id, score).catch(console.error)
      }
    }

    const proximaEtapa = atualizacoes.whatsapp_etapa || etapaAtual
    const proxIdx = FLUXO_QUALIFICACAO.findIndex(e => e.etapa === proximaEtapa)

    if (proxIdx !== -1) {
      const etapa = FLUXO_QUALIFICACAO[proxIdx]
      const texto = etapa.mensagem
        ? etapa.mensagem(lead.nome?.split(' ')[0] || 'você')
        : etapa.pergunta(lead.nome?.split(' ')[0] || 'você')

      const telefoneEnvio = normalizarTelefone(lead.telefone)
      await enviarMensagem(telefoneEnvio, texto)
    }

    res.json({ success: true })
  } catch (err) {
    console.error('[WhatsApp/Webhook] Erro:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============================================================
// POST /api/whatsapp/enviar-boas-vindas
// ============================================================
router.post('/enviar-boas-vindas', async (req, res) => {
  try {
    const { leadId } = req.body
    if (!leadId) {
      return res.status(400).json({ success: false, error: 'leadId obrigatório' })
    }

    const { data: lead } = await supabase
      .from('leads')
      .select('id, nome, telefone, tenant_id')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' })
    }

    if (!lead.telefone) {
      return res.status(400).json({ success: false, error: 'Lead sem telefone' })
    }

    await supabase.from('leads').update({ whatsapp_etapa: 'capital' }).eq('id', lead.id)

    const primeiraEtapa = FLUXO_QUALIFICACAO[0]
    const texto = primeiraEtapa.pergunta(lead.nome?.split(' ')[0] || 'você')

    const resultado = await enviarMensagem(lead.telefone, texto)

    res.json({
      success: resultado.success,
      simulated: resultado.simulated || false,
      error: resultado.error
    })
  } catch (err) {
    console.error('[WhatsApp/BoasVindas] Erro:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============================================================
// GET /api/whatsapp/agente/conversas
// Retorna conversas do agente IA do tenant
// ============================================================
router.get('/agente/conversas', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id
    if (!tenantId) return res.status(400).json({ success: false, error: 'tenant_id obrigatório' })

    const { data, error } = await supabase
      .from('agente_conversas')
      .select('id, telefone, status, criado_em, atualizado_em, lead_id, historico')
      .eq('tenant_id', tenantId)
      .order('atualizado_em', { ascending: false })
      .limit(50)

    if (error) throw error
    res.json({ success: true, conversas: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ============================================================
// GET /api/whatsapp/status
// ============================================================
router.get('/status', async (_req, res) => {
  const { verificarConexao } = await import('../comunicacao/whatsapp.js')
  const status = await verificarConexao()

  res.json({
    success: true,
    configured: !!process.env.EVOLUTION_API_KEY,
    instance: process.env.EVOLUTION_INSTANCE || 'lead-pro',
    webhook_url: `${process.env.DASHBOARD_URL || 'https://leadcapture-proprod.vercel.app'}/api/whatsapp/webhook`,
    agente: {
      enabled: !!process.env.AGENTE_TENANT_ID && !!process.env.ANTHROPIC_API_KEY,
      nome:      process.env.AGENTE_NOME || 'Agente Z',
      tenant_id: process.env.AGENTE_TENANT_ID || null,
    },
    ...status
  })
})

// ============================================================
// Helpers
// ============================================================
function calcularScore(capital, urgencia) {
  let score = 0

  if (capital >= 500000) score += 50
  else if (capital >= 300000) score += 40
  else if (capital >= 150000) score += 30
  else if (capital >= 80000) score += 20
  else score += 10

  if (urgencia === 'imediato') score += 30
  else if (urgencia === 'curto_prazo') score += 20
  else if (urgencia === 'medio_prazo') score += 10
  else score += 5

  if (capital && urgencia) score += 20

  return Math.min(score, 100)
}

async function notificarConsultor(leadId, tenantId, score) {
  const { data: lead } = await supabase
    .from('leads')
    .select('nome, telefone, capital_disponivel, regiao_interesse')
    .eq('id', leadId)
    .single()

  const { data: diretores } = await supabase
    .from('usuarios')
    .select('telefone')
    .eq('tenant_id', tenantId)
    .in('role', ['Diretor', 'Gestor'])
    .eq('active', true)

  for (const dir of diretores || []) {
    if (dir.telefone) {
      await enviarMensagem(
        dir.telefone,
        `🔥 *LEAD QUENTE via WhatsApp!*\n\n*${lead.nome}*\nScore: ${score}\nCapital: R$ ${Number(lead.capital_disponivel).toLocaleString('pt-BR')}\nRegião: ${lead.regiao_interesse || 'não informado'}\n\nAcesse o dashboard agora!`
      )
      await new Promise(r => setTimeout(r, 1500))
    }
  }
}

export default router
