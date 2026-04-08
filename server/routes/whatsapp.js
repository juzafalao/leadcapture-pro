// ============================================================
// ROUTES — /api/whatsapp
// WhatsApp IA de qualificação de leads via Evolution API
// LeadCapture Pro — Zafalao Tech
//
// FLUXO:
// 1. Lead preenche formulário → envia boas-vindas pelo WA
// 2. Lead responde → webhook recebe → IA processa → responde
// 3. IA coleta: capital, região, urgência → salva no lead
// 4. Score >= 65 → notifica consultor
// ============================================================

import { Router }            from 'express'
import supabase              from '../core/database.js'
import { enviarMensagem }    from '../comunicacao/whatsapp.js'
import rateLimit             from 'express-rate-limit'

const router = Router()

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: 'Rate limit excedido' }
})

// Perguntas da IA em sequência
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
  '1': 80000,
  '2': 200000,
  '3': 400000,
  '4': 600000,
}

const urgenciaMap = {
  '1': 'imediato',
  '2': 'curto_prazo',
  '3': 'explorando',
}

// ─── POST /api/whatsapp/webhook ───────────────────────────────
// Recebe mensagens da Evolution API
router.post('/webhook', webhookLimiter, async (req, res) => {
  // Valida token de segurança se configurado
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

    // Evolution API envia diferentes formatos — normaliza
    const event   = payload?.event || payload?.type
    const data    = payload?.data  || payload

    // Só processa mensagens recebidas (não enviadas pelo bot)
    if (event !== 'messages.upsert' && event !== 'message') {
      return res.json({ success: true, ignorado: true })
    }

    const mensagem  = data?.message?.conversation
      || data?.message?.extendedTextMessage?.text
      || data?.body
      || ''

    const telefoneRaw = data?.key?.remoteJid
      || data?.from
      || ''

    if (!mensagem || !telefoneRaw) {
      return res.json({ success: true, ignorado: true })
    }

    // Remove @s.whatsapp.net do número
    const telefone = telefoneRaw.replace('@s.whatsapp.net', '').replace(/\D/g, '')

    // Busca lead pelo telefone
    const { data: leads } = await supabase
      .from('leads')
      .select('id, nome, tenant_id, score, categoria, capital_disponivel, regiao_interesse, urgencia, whatsapp_etapa')
      .ilike('telefone', `%${telefone.slice(-9)}%`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!leads?.length) {
      return res.json({ success: true, ignorado: true, motivo: 'lead nao encontrado' })
    }

    const lead = leads[0]
    const etapaAtual = lead.whatsapp_etapa || 'capital'
    const etapaIdx   = FLUXO_QUALIFICACAO.findIndex(e => e.etapa === etapaAtual)

    if (etapaAtual === 'finalizado') {
      return res.json({ success: true, ignorado: true, motivo: 'fluxo ja finalizado' })
    }

    // Processa resposta da etapa atual
    const atualizacoes = {}

    if (etapaAtual === 'capital') {
      const capital = capitalMap[mensagem.trim()] || null
      if (capital) {
        atualizacoes.capital_disponivel = capital
        atualizacoes.whatsapp_etapa     = 'regiao'
      }
    } else if (etapaAtual === 'regiao') {
      atualizacoes.regiao_interesse = mensagem.trim().substring(0, 100)
      atualizacoes.whatsapp_etapa   = 'urgencia'
    } else if (etapaAtual === 'urgencia') {
      const urgencia = urgenciaMap[mensagem.trim()] || 'explorando'
      atualizacoes.urgencia       = urgencia
      atualizacoes.whatsapp_etapa = 'finalizado'
    }

    // Recalcula score com os dados novos
    if (Object.keys(atualizacoes).length > 0) {
      const capitalAtual = atualizacoes.capital_disponivel || lead.capital_disponivel || 0
      const score = calcularScore(capitalAtual, atualizacoes.urgencia || lead.urgencia)
      atualizacoes.score    = score
      atualizacoes.categoria = score >= 65 ? 'hot' : score >= 40 ? 'warm' : 'cold'
      atualizacoes.updated_at = new Date().toISOString()

      await supabase
        .from('leads')
        .update(atualizacoes)
        .eq('id', lead.id)

      // Se ficou quente após qualificação — notifica
      if (score >= 65 && lead.score < 65) {
        notificarConsultor(lead.id, lead.tenant_id, score).catch(console.error)
      }
    }

    // Envia próxima mensagem do fluxo
    const proximaEtapa = atualizacoes.whatsapp_etapa || etapaAtual
    const proxIdx      = FLUXO_QUALIFICACAO.findIndex(e => e.etapa === proximaEtapa)

    if (proxIdx !== -1) {
      const etapa = FLUXO_QUALIFICACAO[proxIdx]
      const texto = etapa.mensagem
        ? etapa.mensagem(lead.nome?.split(' ')[0] || 'você')
        : etapa.pergunta(lead.nome?.split(' ')[0] || 'você')

      await enviarMensagem(telefone, texto)
    }

    res.json({ success: true })
  } catch (err) {
    console.error('[WhatsApp/Webhook] Erro:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── POST /api/whatsapp/enviar-boas-vindas ────────────────────
// Chamado quando lead entra — envia primeira mensagem
router.post('/enviar-boas-vindas', async (req, res) => {
  try {
    const { leadId } = req.body
    if (!leadId) return res.status(400).json({ success: false, error: 'leadId obrigatorio' })

    const { data: lead } = await supabase
      .from('leads')
      .select('id, nome, telefone, tenant_id')
      .eq('id', leadId)
      .single()

    if (!lead) return res.status(404).json({ success: false, error: 'Lead nao encontrado' })

    const primeiraEtapa = FLUXO_QUALIFICACAO[0]
    const texto = primeiraEtapa.pergunta(lead.nome?.split(' ')[0] || 'você')

    await supabase.from('leads').update({ whatsapp_etapa: 'capital' }).eq('id', lead.id)
    const resultado = await enviarMensagem(lead.telefone, texto)

    res.json({ success: resultado.success, simulated: resultado.simulated })
  } catch (err) {
    console.error('[WhatsApp/BoasVindas] Erro:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── GET /api/whatsapp/status ─────────────────────────────────
router.get('/status', async (_req, res) => {
  const configured = !!process.env.EVOLUTION_API_KEY
  res.json({
    success: true,
    configured,
    instance: process.env.EVOLUTION_INSTANCE || 'lead-pro',
    webhook_url: `${process.env.DASHBOARD_URL || 'https://leadcapture-proprod.vercel.app'}/api/whatsapp/webhook`,
  })
})

// ─── Helpers ─────────────────────────────────────────────────
function calcularScore(capital, urgencia) {
  let score = 0
  if (capital >= 500000)      score += 50
  else if (capital >= 300000) score += 40
  else if (capital >= 150000) score += 30
  else if (capital >= 80000)  score += 20
  else                        score += 10

  if (urgencia === 'imediato')     score += 30
  else if (urgencia === 'curto_prazo') score += 20
  else if (urgencia === 'medio_prazo') score += 10
  else                             score += 5

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
    }
  }
}

export default router
