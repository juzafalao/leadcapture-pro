// ============================================================
// ZAYA — Virtual AI Expansion Consultant
// LeadCapture Pro · Zafalão Tech
//
// ZAYA qualifies leads via WhatsApp using Claude AI.
// When enough info is collected, it hands off to a human
// consultant and sends a full conversation summary.
// ============================================================

import supabase from '../core/database.js'
import { enviarMensagem, normalizarTelefone } from '../comunicacao/whatsapp.js'
import { processarCapitalFromConfig } from '../core/scoring.js'
import { getScoringConfig } from '../core/scoringConfig.js'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const MAX_TURNS = 14

// ── System Prompt ──────────────────────────────────────────
const ZAYA_SYSTEM = `Você é ZAYA, consultora virtual de expansão de franquias.
Seu papel é qualificar interessados em abrir uma franquia de forma natural e empática.

Você precisa coletar as seguintes informações ao longo da conversa:
• Nome completo do interessado
• Capital disponível para investimento (peça como valor em reais)
• Cidade e estado de interesse
• Prazo aproximado para decisão

Diretrizes:
- Seja conversacional e não faça todas as perguntas de uma vez
- Máximo 120 palavras por mensagem
- Use emojis moderadamente (1-2 por mensagem)
- Responda sempre em português brasileiro
- Não mencione marcas ou franchises específicos que você não conheça
- Se o usuário pedir para falar com um humano, encerre a conversa imediatamente com a ferramenta disponível
- Quando tiver coletado nome, capital e cidade, encerre usando a ferramenta encerrar_conversa`

// ── Tool Definition ────────────────────────────────────────
const ZAYA_TOOLS = [
  {
    name: 'encerrar_conversa',
    description: 'Encerra a qualificação quando tiver nome + capital + cidade, ou quando o usuário pedir para falar com um humano.',
    input_schema: {
      type: 'object',
      properties: {
        nome:               { type: 'string',  description: 'Nome completo do interessado' },
        capital_disponivel: { type: 'number',  description: 'Capital disponível em reais (número inteiro). Use 0 se não informado.' },
        cidade:             { type: 'string',  description: 'Cidade de interesse' },
        estado:             { type: 'string',  description: 'UF do estado de interesse' },
        prazo:              { type: 'string',  enum: ['imediato', 'curto_prazo', 'explorando'], description: 'Prazo para decisão' },
        mensagem_despedida: { type: 'string',  description: 'Mensagem final para o usuário informando que um consultor entrará em contato' },
        resumo_consultor:   { type: 'string',  description: 'Resumo estruturado da conversa para o consultor humano (máx 300 palavras)' },
      },
      required: ['mensagem_despedida', 'resumo_consultor'],
    },
  },
]

// ── Main Entry Point ───────────────────────────────────────
export async function processarMensagemZaya(telefone, mensagem, tenantId, nomeContato = null) {
  if (!ANTHROPIC_API_KEY) {
    console.warn('[ZAYA] ANTHROPIC_API_KEY não configurada — ZAYA desabilitado')
    return { handled: false }
  }

  try {
    // Busca conversa ativa
    const { data: conversa } = await supabase
      .from('zaya_conversas')
      .select('*')
      .eq('telefone', telefone)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    const historico  = conversa?.historico || []
    const totalTurns = historico.filter(h => h.role === 'user').length

    // Limite de turnos: forçar handoff sem Claude
    if (totalTurns >= MAX_TURNS) {
      const msg = 'Obrigado pela sua mensagem! 😊 Um consultor especializado vai entrar em contato em breve pelo WhatsApp. Tenha um ótimo dia!'
      await enviarMensagem(normalizarTelefone(telefone), msg).catch(console.warn)
      if (conversa) {
        await supabase.from('zaya_conversas')
          .update({ status: 'encerrada', atualizado_em: new Date().toISOString() })
          .eq('id', conversa.id)
      }
      return { handled: true }
    }

    // Adiciona mensagem do usuário ao histórico
    const historicoAtualizado = [...historico, { role: 'user', content: mensagem }]

    // Cria ou atualiza conversa + lead
    let conversaId  = conversa?.id
    let leadId      = conversa?.lead_id

    if (!conversa) {
      // Cria lead preliminar
      const leadEmail = `tel.${telefone.replace(/\D/g, '')}@noemail.leadcapture.local`
      const { data: novoLead, error: leadErr } = await supabase.from('leads').insert({
        tenant_id:        tenantId,
        nome:             nomeContato || `Lead WhatsApp ${telefone.slice(-4)}`,
        telefone:         normalizarTelefone(telefone),
        email:            leadEmail,
        fonte:            'captacao-ia',
        status:           'novo',
        capital_disponivel: 0,
        score:            0,
        categoria:        'cold',
        created_at:       new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      }).select('id').single()

      if (leadErr) {
        console.error('[ZAYA] Erro ao criar lead:', leadErr.message)
      } else {
        leadId = novoLead.id
      }

      const { data: novaConversa, error: convErr } = await supabase.from('zaya_conversas').insert({
        tenant_id: tenantId,
        lead_id:   leadId,
        telefone,
        historico: historicoAtualizado,
        status:    'ativa',
      }).select('id').single()

      if (convErr) {
        console.error('[ZAYA] Erro ao criar conversa:', convErr.message)
        return { handled: false }
      }
      conversaId = novaConversa.id
    } else {
      await supabase.from('zaya_conversas')
        .update({ historico: historicoAtualizado, atualizado_em: new Date().toISOString() })
        .eq('id', conversa.id)
    }

    // ── Chama Claude ──────────────────────────────────────
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system:     ZAYA_SYSTEM,
        tools:      ZAYA_TOOLS,
        messages:   historicoAtualizado,
      }),
    })

    const apiData = await response.json()

    if (!response.ok) {
      console.error('[ZAYA] Erro API Claude:', apiData?.error?.message)
      return { handled: true }
    }

    // Extrai texto e tool_use da resposta
    let textoResposta = null
    let toolInput     = null
    for (const block of apiData.content || []) {
      if (block.type === 'text')     textoResposta = block.text
      if (block.type === 'tool_use' && block.name === 'encerrar_conversa') toolInput = block.input
    }

    // Salva resposta do assistente no histórico
    const historicoFinal = [...historicoAtualizado, { role: 'assistant', content: apiData.content }]
    await supabase.from('zaya_conversas')
      .update({ historico: historicoFinal, atualizado_em: new Date().toISOString() })
      .eq('id', conversaId)

    // Envia mensagem ao usuário (texto da resposta OU mensagem de despedida da tool)
    const textoEnvio = toolInput?.mensagem_despedida || textoResposta
    if (textoEnvio) {
      await enviarMensagem(normalizarTelefone(telefone), textoEnvio)
        .catch(err => console.warn('[ZAYA] Falha ao enviar resposta:', err.message))
    }

    // Handoff se Claude chamou a ferramenta
    if (toolInput) {
      await _executarHandoff(conversaId, leadId, tenantId, toolInput)
    }

    return { handled: true }
  } catch (err) {
    console.error('[ZAYA] Erro inesperado:', err.message)
    return { handled: true }
  }
}

// ── Verifica se existe conversa ativa para este telefone ───
export async function temConversaZayaAtiva(telefone, tenantId) {
  try {
    const { data } = await supabase
      .from('zaya_conversas')
      .select('id')
      .eq('telefone', telefone)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
      .limit(1)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

// ── Handoff para consultor humano ──────────────────────────
async function _executarHandoff(conversaId, leadId, tenantId, dados) {
  const { nome, capital_disponivel, cidade, estado, prazo, resumo_consultor } = dados

  // Atualiza lead com dados coletados
  if (leadId) {
    const updates = {
      status:     'em_negociacao',
      updated_at: new Date().toISOString(),
    }
    if (nome)               updates.nome = nome
    if (cidade)             updates.cidade = cidade
    if (estado)             updates.estado = estado
    if (prazo)              updates.urgencia = prazo
    if (capital_disponivel) {
      const scoringConfig = await getScoringConfig(tenantId).catch(() => null)
      const { score, categoria } = processarCapitalFromConfig(capital_disponivel, scoringConfig)
      updates.capital_disponivel = capital_disponivel
      updates.score    = score
      updates.categoria = categoria
    }
    await supabase.from('leads').update(updates).eq('id', leadId)
  }

  // Marca conversa como handoff
  await supabase.from('zaya_conversas')
    .update({ status: 'handoff', atualizado_em: new Date().toISOString() })
    .eq('id', conversaId)

  // Notifica gestores/diretores
  await _notificarGestores(tenantId, dados).catch(err =>
    console.warn('[ZAYA] Falha ao notificar gestores:', err.message)
  )

  console.log(`[ZAYA] Handoff concluído — lead ${leadId}`)
}

async function _notificarGestores(tenantId, dados) {
  const { nome, capital_disponivel, cidade, estado, prazo, resumo_consultor } = dados

  const { data: gestores } = await supabase
    .from('usuarios')
    .select('telefone, nome')
    .eq('tenant_id', tenantId)
    .in('role', ['Administrador', 'Diretor', 'Gestor'])
    .eq('active', true)
    .limit(5)

  if (!gestores?.length) return

  const capitalFmt = capital_disponivel
    ? `R$ ${Number(capital_disponivel).toLocaleString('pt-BR')}`
    : 'não informado'

  const prazoFmt = { imediato: 'Imediato (até 3 meses)', curto_prazo: 'Curto prazo (até 6 meses)', explorando: 'Ainda explorando' }[prazo] || 'não informado'

  const msg =
    `🤖 *ZAYA — Lead Qualificado!*\n\n` +
    `*Nome:* ${nome || 'não informado'}\n` +
    `*Capital:* ${capitalFmt}\n` +
    `*Localização:* ${[cidade, estado].filter(Boolean).join('/') || 'não informado'}\n` +
    `*Prazo:* ${prazoFmt}\n\n` +
    `📋 *Resumo da conversa:*\n${resumo_consultor || 'Sem resumo disponível'}\n\n` +
    `_Acesse o dashboard LeadCapture Pro para ver o lead completo e iniciar o atendimento._`

  for (const g of gestores) {
    if (!g.telefone) continue
    await enviarMensagem(g.telefone, msg)
      .catch(err => console.warn(`[ZAYA] Falha ao notificar ${g.nome}:`, err.message))
    await new Promise(r => setTimeout(r, 1500))
  }
}
