// ============================================================
// ROUTES — /api/whatsapp
// WhatsApp IA de qualificação de leads via Evolution API
// LeadCapture Pro — Zafalão Tech
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'
import { enviarMensagem, normalizarTelefone, extrairTelefoneDoJid } from '../comunicacao/whatsapp.js'
import { processarMensagemZaya, temConversaZayaAtiva } from '../services/zaya.js'
import rateLimit from 'express-rate-limit'

// Tenant padrão para novos contatos via ZAYA (configura via env)
const ZAYA_TENANT_ID = process.env.ZAYA_TENANT_ID || null

const router = Router()

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: 'Rate limit excedido' }
})

// Fluxo de qualificação
const FLUXO_QUALIFICACAO = [
  {
    etapa: 'capital',
    pergunta: (nome) =>
      `Olá, ${nome}! 👋 Que ótimo ter seu interesse!\n\nPara te ajudarmos melhor, qual é o capital que você tem disponível para investir?\n\n1️⃣ Até R$ 100 mil\n2️⃣ Entre R$ 100 mil e R$ 300 mil\n3️⃣ Entre R$ 300 mil e R$ 500 mil\n4️⃣ Acima de R$ 500 mil\n\nResponda com o número da opção.`,
  },
  {
    etapa: 'regiao',
    pergunta: () =>
      `Perfeito! 📍 Em qual cidade ou estado você pretende abrir a franquia?`,
  },
  {
    etapa: 'urgencia',
    pergunta: () =>
      `Entendido! ⏰ Qual é o seu prazo para tomar essa decisão?\n\n1️⃣ Quero abrir nos próximos 3 meses\n2️⃣ Em 6 meses\n3️⃣ Ainda estou pesquisando\n\nResponda com o número.`,
  },
  {
    etapa: 'finalizado',
    mensagem: (nome) =>
      `Obrigado, ${nome}! ✅\n\nUm de nossos consultores especializados vai entrar em contato em breve com as melhores opções para o seu perfil.\n\n_LeadCapture Pro · Zafalão Tech_`,
  },
]

const capitalMap = {
  '1': 80000, '2': 200000, '3': 400000, '4': 600000,
  '1️⃣': 80000, '2️⃣': 200000, '3️⃣': 400000, '4️⃣': 600000,
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

    // Busca lead pelo telefone (busca flexível)
    const telefoneBusca = telefone.slice(-11)
    const { data: leads } = await supabase
      .from('leads')
      .select('id, nome, tenant_id, score, categoria, capital_disponivel, regiao_interesse, urgencia, whatsapp_etapa, telefone')
      .or(`telefone.ilike.%${telefoneBusca},telefone.ilike.%${telefone}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!leads?.length) {
      // Tenta ZAYA para contatos desconhecidos
      if (ZAYA_TENANT_ID) {
        console.log(`[WhatsApp/Webhook] Contato desconhecido ${telefone} → ZAYA`)
        const nomeContato = data?.pushName || data?.notifyName || null
        const zayaResult = await processarMensagemZaya(telefone, mensagem, ZAYA_TENANT_ID, nomeContato)
        if (zayaResult.handled) return res.json({ success: true, zaya: true })
      }
      console.log(`[WhatsApp/Webhook] Lead não encontrado para telefone: ${telefone}`)
      return res.json({ success: true, ignorado: true, motivo: 'lead não encontrado' })
    }

    const lead = leads[0]

    // Se há conversa ZAYA ativa para este lead, roteia para ZAYA
    if (ZAYA_TENANT_ID) {
      const zayaAtiva = await temConversaZayaAtiva(telefone, lead.tenant_id)
      if (zayaAtiva) {
        console.log(`[WhatsApp/Webhook] Conversa ZAYA ativa para ${telefone}`)
        const zayaResult = await processarMensagemZaya(telefone, mensagem, lead.tenant_id)
        if (zayaResult.handled) return res.json({ success: true, zaya: true })
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
// GET /api/whatsapp/zaya/conversas
// Retorna conversas ZAYA do tenant (requer auth Supabase no header)
// ============================================================
router.get('/zaya/conversas', async (req, res) => {
  try {
    const tenantId = req.query.tenant_id
    if (!tenantId) return res.status(400).json({ success: false, error: 'tenant_id obrigatório' })

    const { data, error } = await supabase
      .from('zaya_conversas')
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
    zaya: {
      enabled: !!process.env.ZAYA_TENANT_ID && !!process.env.ANTHROPIC_API_KEY,
      tenant_id: process.env.ZAYA_TENANT_ID || null,
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
