// ============================================================
// agente.js — Agente Virtual de Captação via WhatsApp
// LeadCapture Pro · Zafalão Tech
//
// Qualifica novos contatos via WhatsApp usando Claude AI.
// O nome exibido é configurável via env AGENTE_NOME.
// ============================================================

import supabase from '../core/database.js'
import { enviarMensagem, normalizarTelefone } from '../comunicacao/whatsapp.js'
import { processarCapitalFromConfig } from '../core/scoring.js'
import { getScoringConfig } from '../core/scoringConfig.js'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const AGENTE_NOME       = process.env.AGENTE_NOME || 'Agente Z'
const MAX_TURNS         = 14

// ── System Prompt ──────────────────────────────────────────
function buildSystemPrompt() {
  return `Você é ${AGENTE_NOME}, consultora virtual de expansão de franquias.
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
- Se o usuário pedir para falar com um humano, encerre imediatamente com a ferramenta disponível
- Quando tiver coletado nome, capital e cidade, encerre usando a ferramenta encerrar_conversa`
}

// ── Tool Definition ────────────────────────────────────────
const AGENTE_TOOLS = [
  {
    name: 'encerrar_conversa',
    description: 'Encerra a qualificação quando tiver nome + capital + cidade, ou quando o usuário pedir para falar com um humano.',
    input_schema: {
      type: 'object',
      properties: {
        nome:               { type: 'string', description: 'Nome completo do interessado' },
        capital_disponivel: { type: 'number', description: 'Capital disponível em reais (inteiro). Use 0 se não informado.' },
        cidade:             { type: 'string', description: 'Cidade de interesse' },
        estado:             { type: 'string', description: 'UF do estado de interesse' },
        prazo:              { type: 'string', enum: ['imediato', 'curto_prazo', 'explorando'], description: 'Prazo para decisão' },
        mensagem_despedida: { type: 'string', description: 'Mensagem final para o usuário informando que um consultor entrará em contato' },
        resumo_consultor:   { type: 'string', description: 'Resumo estruturado da conversa para o consultor humano (máx 300 palavras)' },
      },
      required: ['mensagem_despedida', 'resumo_consultor'],
    },
  },
]

// ── Main Entry Point ───────────────────────────────────────
export async function processarMensagemAgente(telefone, mensagem, tenantId, nomeContato = null) {
  if (!ANTHROPIC_API_KEY) {
    console.warn('[Agente] ANTHROPIC_API_KEY não configurada — agente desabilitado')
    return { handled: false }
  }

  try {
    const { data: conversa } = await supabase
      .from('agente_conversas')
      .select('*')
      .eq('telefone', telefone)
      .eq('tenant_id', tenantId)
      .eq('status', 'ativa')
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    const historico  = conversa?.historico || []
    const totalTurns = historico.filter(h => h.role === 'user').length

    // Limite de turnos atingido — encerra sem chamar Claude
    if (totalTurns >= MAX_TURNS) {
      const msg = 'Obrigado pela sua mensagem! 😊 Um consultor especializado vai entrar em contato em breve. Tenha um ótimo dia!'
      await enviarMensagem(normalizarTelefone(telefone), msg).catch(console.warn)
      if (conversa) {
        await supabase.from('agente_conversas')
          .update({ status: 'encerrada', atualizado_em: new Date().toISOString() })
          .eq('id', conversa.id)
      }
      return { handled: true }
    }

    const historicoAtualizado = [...historico, { role: 'user', content: mensagem }]

    let conversaId = conversa?.id
    let leadId     = conversa?.lead_id

    if (!conversa) {
      // Cria lead preliminar
      const { data: novoLead, error: leadErr } = await supabase.from('leads').insert({
        tenant_id:          tenantId,
        nome:               nomeContato || `Lead WhatsApp ${telefone.slice(-4)}`,
        telefone:           normalizarTelefone(telefone),
        email:              `tel.${telefone.replace(/\D/g, '')}@noemail.leadcapture.local`,
        fonte:              'captacao-ia',
        status:             'novo',
        capital_disponivel: 0,
        score:              0,
        categoria:          'cold',
        created_at:         new Date().toISOString(),
        updated_at:         new Date().toISOString(),
      }).select('id').single()

      if (leadErr) {
        console.error('[Agente] Erro ao criar lead:', leadErr.message)
      } else {
        leadId = novoLead.id
      }

      const { data: novaConversa, error: convErr } = await supabase.from('agente_conversas').insert({
        tenant_id: tenantId,
        lead_id:   leadId,
        telefone,
        historico: historicoAtualizado,
        status:    'ativa',
      }).select('id').single()

      if (convErr) {
        console.error('[Agente] Erro ao criar conversa:', convErr.message)
        return { handled: false }
      }
      conversaId = novaConversa.id
    } else {
      await supabase.from('agente_conversas')
        .update({ historico: historicoAtualizado, atualizado_em: new Date().toISOString() })
        .eq('id', conversa.id)
    }

    // ── Chama Claude ──────────────────────────────────────
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system:     buildSystemPrompt(),
        tools:      AGENTE_TOOLS,
        messages:   historicoAtualizado,
      }),
    })

    const apiData = await response.json()

    if (!response.ok) {
      console.error('[Agente] Erro API Claude:', apiData?.error?.message)
      return { handled: true }
    }

    let textoResposta = null
    let toolInput     = null
    for (const block of apiData.content || []) {
      if (block.type === 'text')                                         textoResposta = block.text
      if (block.type === 'tool_use' && block.name === 'encerrar_conversa') toolInput = block.input
    }

    // Persiste resposta do assistente no histórico
    await supabase.from('agente_conversas')
      .update({
        historico:    [...historicoAtualizado, { role: 'assistant', content: apiData.content }],
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', conversaId)

    // Envia texto ao usuário
    const textoEnvio = toolInput?.mensagem_despedida || textoResposta
    if (textoEnvio) {
      await enviarMensagem(normalizarTelefone(telefone), textoEnvio)
        .catch(err => console.warn('[Agente] Falha ao enviar resposta:', err.message))
    }

    if (toolInput) {
      await _executarHandoff(conversaId, leadId, tenantId, toolInput)
    }

    return { handled: true }
  } catch (err) {
    console.error('[Agente] Erro inesperado:', err.message)
    return { handled: true }
  }
}

// ── Verifica conversa ativa para o telefone ────────────────
export async function temConversaAgenteAtiva(telefone, tenantId) {
  try {
    const { data } = await supabase
      .from('agente_conversas')
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
  const { nome, capital_disponivel, cidade, estado, prazo } = dados

  if (leadId) {
    const updates = { status: 'em_negociacao', updated_at: new Date().toISOString() }
    if (nome)   updates.nome   = nome
    if (cidade) updates.cidade = cidade
    if (estado) updates.estado = estado
    if (prazo)  updates.urgencia = prazo
    if (capital_disponivel) {
      const scoringConfig = await getScoringConfig(tenantId).catch(() => null)
      const { score, categoria } = processarCapitalFromConfig(capital_disponivel, scoringConfig)
      updates.capital_disponivel = capital_disponivel
      updates.score    = score
      updates.categoria = categoria
    }
    await supabase.from('leads').update(updates).eq('id', leadId)
  }

  await supabase.from('agente_conversas')
    .update({ status: 'handoff', atualizado_em: new Date().toISOString() })
    .eq('id', conversaId)

  await _notificarGestores(tenantId, dados)
    .catch(err => console.warn('[Agente] Falha ao notificar gestores:', err.message))

  console.log(`[Agente] Handoff concluído — lead ${leadId}`)
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

  const prazoFmt = {
    imediato:    'Imediato (até 3 meses)',
    curto_prazo: 'Curto prazo (até 6 meses)',
    explorando:  'Ainda explorando',
  }[prazo] || 'não informado'

  const msg =
    `🤖 *${AGENTE_NOME} — Lead Qualificado!*\n\n` +
    `*Nome:* ${nome || 'não informado'}\n` +
    `*Capital:* ${capitalFmt}\n` +
    `*Localização:* ${[cidade, estado].filter(Boolean).join('/') || 'não informado'}\n` +
    `*Prazo:* ${prazoFmt}\n\n` +
    `📋 *Resumo da conversa:*\n${resumo_consultor || 'Sem resumo disponível'}\n\n` +
    `_Acesse o dashboard LeadCapture Pro para ver o lead completo._`

  for (const g of gestores) {
    if (!g.telefone) continue
    await enviarMensagem(g.telefone, msg)
      .catch(err => console.warn(`[Agente] Falha ao notificar ${g.nome}:`, err.message))
    await new Promise(r => setTimeout(r, 1500))
  }
}
