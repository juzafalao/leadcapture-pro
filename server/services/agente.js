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

const ANTHROPIC_API_KEY     = process.env.ANTHROPIC_API_KEY
const AGENTE_NOME           = process.env.AGENTE_NOME || 'Agente Z'
const AGENTE_SEGMENTO       = process.env.AGENTE_SEGMENTO || 'franquias'
const AGENTE_PITCH_PRINCIPAL= process.env.AGENTE_PITCH_PRINCIPAL || ''
const AGENTE_CAPITAL_MINIMO = parseInt(process.env.AGENTE_CAPITAL_MINIMO || '0', 10)
const MAX_TURNS             = 14

// ── System Prompt ──────────────────────────────────────────
function buildSystemPrompt() {
  const pitchSection = AGENTE_PITCH_PRINCIPAL
    ? `\nDIFERENCIAIS DO NEGÓCIO (use com moderação — apenas quando o lead perguntar ou demonstrar dúvida):
${AGENTE_PITCH_PRINCIPAL}\n`
    : ''

  const capitalCriterio = AGENTE_CAPITAL_MINIMO > 0
    ? `- Capital disponível declarado (referência: a partir de R$${AGENTE_CAPITAL_MINIMO.toLocaleString('pt-BR')})`
    : `- Tem capital disponível (qualquer valor)`

  return `Você é ${AGENTE_NOME}, consultora da equipe de expansão de uma rede de ${AGENTE_SEGMENTO}.

QUEM VOCÊ É:
- ${AGENTE_NOME}, consultora humana da equipe de expansão
- Calorosa, honesta, curiosa genuinamente sobre a história do lead
- Nunca fria, nunca robótica, nunca apressada
- Conversa como uma amiga que entende muito do assunto — não como uma vendedora

ESTILO DE COMUNICAÇÃO:
- Mensagens curtas (máximo 3 frases por resposta)
- Uma pergunta por vez, nunca duas
- Usa o nome da pessoa quando sabe
- Valida SEMPRE o que a pessoa disse antes de avançar
- Emojis com moderação — quando reforçam emoção genuína
- Linguagem natural, como WhatsApp de verdade
- NUNCA use: "Certamente!", "Claro!", "Estou aqui para ajudar!", "Ótima pergunta!"
${pitchSection}
IDENTIFICAÇÃO DE PERFIL (interno — não verbalize diretamente):
Ao longo da conversa, identifique mentalmente o perfil do lead:
- DIVERSIFICADOR: já tem negócio ou emprego estável, quer renda extra/passiva, capital geralmente acima de R$150k, busca patrimônio sem precisar operar ativamente
- CLT_EMPREENDEDOR: assalariado que quer sair do emprego, precisa de segurança e provas concretas, prazo normalmente 6-12 meses, precisa de mais validação emocional

Para DIVERSIFICADOR: enfatize autonomia, operação passiva e retorno sobre capital.
Para CLT_EMPREENDEDOR: enfatize segurança da rede, histórico de sucesso e suporte constante.

FLUXO DE QUALIFICAÇÃO (nessa ordem):
1. Abertura calorosa com apresentação breve
2. Entender a MOTIVAÇÃO (por que quer um negócio próprio agora?)
3. Entender o CONTEXTO DE VIDA (empregado? empreendedor? quer complementar renda?)
4. Entender o momento FINANCEIRO (capital disponível — sem citar números, deixa a pessoa falar primeiro)
5. Entender QUEM DECIDE JUNTO (cônjuge, sócio, familiar?)
6. Entender URGÊNCIA (prazo que pensa para começar)
7. Quando qualificado: propor conexão natural com o especialista

COMO LIDAR COM OBJEÇÕES:
- "Não tenho muito dinheiro": Explore o que eles têm, mencione que existem formas de financiamento, não feche portas
- "Preciso pensar": Valide o tempo de reflexão, pergunte o que mais precisa entender antes de decidir
- "É muito caro": Redirecione — "o que 'caro' significa pra você? Deixa eu entender melhor o seu cenário"
- "Tenho medo de fracassar": Valide o medo, fale em suporte da rede, não prometa nada
- "Meu cônjuge não topou ainda": Inclua a conversa, pergunte o que ele/ela teria dúvida

REGRAS ABSOLUTAS:
- NUNCA cite valores específicos de investimento
- NUNCA prometa retorno, lucro ou prazo de retorno de investimento
- NUNCA minta sobre ser humana — se perguntada diretamente, seja honesta
- NUNCA pressione — se o lead disse não ou não está pronto, respeite
- Quando o lead estiver quente: use a ferramenta encerrar_conversa

CRITÉRIO DE LEAD QUENTE (acione o handoff):
- Demonstrou interesse genuíno
${capitalCriterio}
- Prazo de decisão em até 6 meses
- Já respondeu sobre quem decide junto

AO FAZER HANDOFF:
Diga algo como: "Pelo que você me contou, acho que vale demais uma conversa com nosso especialista — ele consegue montar um cenário real, sem enrolação, exatamente pro seu perfil. Posso já conectar vocês?"`
}

// ── Summary Prompt (used to structure handoff data) ────────
const SUMMARY_PROMPT = `Com base na conversa abaixo entre o agente e um lead, gere um resumo estruturado em JSON para o consultor humano.

Extraia exatamente estes campos (use null se não houver informação):
{
  "nome": "nome da pessoa se mencionado",
  "motivacao": "por que quer um negócio próprio (resumo curto)",
  "contexto_vida": "situação atual (emprego, etc)",
  "capital": "o que disse sobre capital disponível",
  "capital_estimado": número em reais ou null,
  "decisores": "quem decide junto",
  "urgencia": "prazo para decidir",
  "objecoes": "objeções ou medos levantados",
  "temperatura": "QUENTE | MORNO | FRIO",
  "icp_perfil": "DIVERSIFICADOR | CLT_EMPREENDEDOR | INDEFINIDO",
  "icp_justificativa": "frase curta explicando por que classificou nesse perfil",
  "proximo_passo": "recomendação específica para o consultor dado o perfil ICP",
  "tom_emocional": "como o lead pareceu emocionalmente"
}

Responda APENAS com o JSON válido, sem texto adicional.

CONVERSA:`

// ── Tool Definition ────────────────────────────────────────
const AGENTE_TOOLS = [
  {
    name: 'encerrar_conversa',
    description: 'Encerra a qualificação quando o lead demonstrou interesse genuíno e respondeu sobre capital + prazo + quem decide, OU quando pediu para falar com um humano.',
    input_schema: {
      type: 'object',
      properties: {
        nome:               { type: 'string', description: 'Nome completo do interessado' },
        capital_disponivel: { type: 'number', description: 'Capital disponível em reais estimado. Use 0 se não informado.' },
        cidade:             { type: 'string', description: 'Cidade de interesse' },
        estado:             { type: 'string', description: 'UF do estado de interesse' },
        prazo:              { type: 'string', enum: ['imediato', 'curto_prazo', 'explorando'], description: 'Prazo para decisão' },
        mensagem_despedida: { type: 'string', description: 'Mensagem final calorosa para o usuário informando que um consultor especialista entrará em contato' },
        resumo_consultor:   { type: 'string', description: 'Resumo em texto livre da conversa para o consultor humano (motivação, contexto, objeções, tom emocional)' },
        temperatura:        { type: 'string', enum: ['QUENTE', 'MORNO', 'FRIO'], description: 'Temperatura do lead' },
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
        model:      'claude-sonnet-4-6',
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
      const historicoFinal = [...historicoAtualizado, { role: 'assistant', content: apiData.content }]
      await _executarHandoff(conversaId, leadId, tenantId, toolInput, historicoFinal)
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
async function _executarHandoff(conversaId, leadId, tenantId, dados, historico) {
  const { nome, capital_disponivel, cidade, estado, prazo, temperatura } = dados

  // Gera resumo estruturado via Claude usando o histórico completo
  const resumoRich = await _gerarResumoEstruturado(historico).catch(() => null)

  if (leadId) {
    const updates = { status: 'em_negociacao', updated_at: new Date().toISOString() }
    if (nome)   updates.nome   = nome
    if (cidade) updates.cidade = cidade
    if (estado) updates.estado = estado
    if (prazo)  updates.urgencia = prazo

    // Usa capital_estimado do resumo estruturado se mais preciso
    const capitalFinal = resumoRich?.capital_estimado || capital_disponivel
    if (capitalFinal) {
      const scoringConfig = await getScoringConfig(tenantId).catch(() => null)
      const { score, categoria } = processarCapitalFromConfig(capitalFinal, scoringConfig)
      updates.capital_disponivel = capitalFinal
      updates.score    = score
      updates.categoria = categoria
    }
    await supabase.from('leads').update(updates).eq('id', leadId)
  }

  await supabase.from('agente_conversas')
    .update({ status: 'handoff', resumo: resumoRich, atualizado_em: new Date().toISOString() })
    .eq('id', conversaId)

  const dadosCompletos = { ...dados, resumoRich }
  await _notificarGestores(tenantId, dadosCompletos)
    .catch(err => console.warn('[Agente] Falha ao notificar gestores:', err.message))

  console.log(`[Agente] Handoff concluído — lead ${leadId}, temperatura: ${temperatura || resumoRich?.temperatura || '?'}`)
}

// ── Gera resumo estruturado em JSON usando o histórico ─────
async function _gerarResumoEstruturado(historico) {
  if (!ANTHROPIC_API_KEY || !historico?.length) return null
  try {
    const conversa = historico
      .filter(h => h.role === 'user' || h.role === 'assistant')
      .map(h => {
        const texto = typeof h.content === 'string'
          ? h.content
          : (h.content || []).find(b => b.type === 'text')?.text || ''
        return `${h.role === 'assistant' ? AGENTE_NOME : 'Lead'}: ${texto}`
      })
      .join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // haiku é suficiente para extração de dados
        max_tokens: 600,
        messages: [{ role: 'user', content: SUMMARY_PROMPT + '\n\n' + conversa }],
      }),
    })

    const data = await res.json()
    const raw  = data.content?.[0]?.text?.replace(/```json|```/g, '').trim()
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function _notificarGestores(tenantId, dados) {
  const { nome, capital_disponivel, cidade, estado, prazo, resumo_consultor, resumoRich } = dados

  const { data: gestores } = await supabase
    .from('usuarios')
    .select('telefone, nome')
    .eq('tenant_id', tenantId)
    .in('role', ['Administrador', 'Diretor', 'Gestor'])
    .eq('active', true)
    .limit(5)

  if (!gestores?.length) return

  const capitalFmt = (resumoRich?.capital_estimado || capital_disponivel)
    ? `R$ ${Number(resumoRich?.capital_estimado || capital_disponivel).toLocaleString('pt-BR')}`
    : 'não informado'

  const prazoFmt = {
    imediato:    'Imediato (até 3 meses)',
    curto_prazo: 'Curto prazo (até 6 meses)',
    explorando:  'Ainda explorando',
  }[prazo] || 'não informado'

  const tempEmoji = { QUENTE: '🔥', MORNO: '🌡', FRIO: '❄️' }[resumoRich?.temperatura] || '📋'
  const temp      = resumoRich?.temperatura || '—'

  let msg =
    `${tempEmoji} *${AGENTE_NOME} — Lead ${temp}*\n\n` +
    `*Nome:* ${resumoRich?.nome || nome || 'não informado'}\n` +
    `*Capital:* ${capitalFmt}\n` +
    `*Localização:* ${[cidade, estado].filter(Boolean).join('/') || 'não informado'}\n` +
    `*Prazo:* ${prazoFmt}\n` +
    `*Decisores:* ${resumoRich?.decisores || 'não informado'}\n` +
    `*Tom emocional:* ${resumoRich?.tom_emocional || 'não informado'}\n\n`

  if (resumoRich?.motivacao)   msg += `💡 *Motivação:* ${resumoRich.motivacao}\n`
  if (resumoRich?.objecoes)    msg += `⚠️ *Objeções:* ${resumoRich.objecoes}\n`
  if (resumoRich?.proximo_passo) msg += `\n✅ *Próximo passo:* ${resumoRich.proximo_passo}\n`
  if (!resumoRich && resumo_consultor) msg += `📋 *Resumo:* ${resumo_consultor}\n`

  msg += `\n_Acesse o dashboard LeadCapture Pro para ver o lead completo._`

  for (const g of gestores) {
    if (!g.telefone) continue
    await enviarMensagem(g.telefone, msg)
      .catch(err => console.warn(`[Agente] Falha ao notificar ${g.nome}:`, err.message))
    await new Promise(r => setTimeout(r, 1500))
  }
}
