// ============================================================
// agente.js — Agente Virtual de Captação via WhatsApp
// LeadCapture Pro · Zafalão Tech
//
// Agente IA multi-tenant: configuração por tenant no banco.
// O nome interno do agente no código é 'Agente Z'; o nome
// exibido ao lead (ex: 'Lia') é configurado por tenant.
// ============================================================

import supabase from '../core/database.js'
import { enviarMensagem, normalizarTelefone } from '../comunicacao/whatsapp.js'
import { enviarEmail } from '../comunicacao/email.js'
import { processarCapitalFromConfig } from '../core/scoring.js'
import { getScoringConfig } from '../core/scoringConfig.js'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// ── Helper: garante que histórico seja sempre um array ─────
function parseHistorico(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
}

// ── Cache de configurações por tenant (TTL: 5 minutos) ─────
const _agenteConfigCache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000

export async function getAgenteConfig(tenantId) {
  if (!tenantId) return null

  const cached = _agenteConfigCache.get(tenantId)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.config
  }

  const { data, error } = await supabase
    .from('agente_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error) {
    console.warn('[Agente] Erro ao buscar config:', error.message)
    return null
  }

  const config = (data && data.habilitado) ? data : null
  _agenteConfigCache.set(tenantId, { config, ts: Date.now() })
  return config
}

export function invalidarCacheAgente(tenantId) {
  _agenteConfigCache.delete(tenantId)
}

// ── System Prompt ──────────────────────────────────────────
function buildSystemPrompt(config) {
  const AGENTE_NOME        = config.nome_agente || 'Agente Z'
  const AGENTE_SEGMENTO    = config.segmento || 'franquias'
  const AGENTE_PITCH       = config.pitch_principal || ''
  const AGENTE_CAP_MINIMO  = config.capital_minimo || 0
  const PROMPT_EXTRA       = config.prompt_extra || ''

  const pitchSection = AGENTE_PITCH
    ? `\nDIFERENCIAIS DO NEGÓCIO (use com moderação — apenas quando o lead perguntar ou demonstrar dúvida):
${AGENTE_PITCH}\n`
    : ''

  const capitalCriterio = AGENTE_CAP_MINIMO > 0
    ? `- Capital disponível declarado (referência: a partir de R$${AGENTE_CAP_MINIMO.toLocaleString('pt-BR')})`
    : `- Tem capital disponível (qualquer valor)`

  const extraSection = PROMPT_EXTRA ? `\nINSTRUÇÕES ADICIONAIS:\n${PROMPT_EXTRA}\n` : ''

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
Diga algo como: "Pelo que você me contou, acho que vale demais uma conversa com nosso especialista — ele consegue montar um cenário real, sem enrolação, exatamente pro seu perfil. Posso já conectar vocês?"
${extraSection}`
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

// ── Inicia o agente proativamente para um lead recém-criado ─
export async function iniciarAgenteParaLead(lead, marcaInfo) {
  if (!ANTHROPIC_API_KEY) return { iniciado: false, motivo: 'ANTHROPIC_API_KEY não configurada' }
  if (!lead?.telefone)    return { iniciado: false, motivo: 'lead sem telefone' }

  const config = await getAgenteConfig(lead.tenant_id)
  if (!config) return { iniciado: false, motivo: 'agente não habilitado para tenant' }

  const telefoneNorm = normalizarTelefone(lead.telefone)

  const { data: existente } = await supabase
    .from('agente_conversas')
    .select('id')
    .eq('telefone', telefoneNorm)
    .eq('tenant_id', lead.tenant_id)
    .eq('status', 'ativa')
    .limit(1)
    .maybeSingle()

  if (existente) {
    // Verifica se a mensagem inicial foi de fato enviada (histórico vazio = nunca enviou)
    const { data: convData } = await supabase
      .from('agente_conversas')
      .select('historico')
      .eq('id', existente.id)
      .single()
    const hist = parseHistorico(convData?.historico)
    if (hist.length === 0) {
      // Conversa existe mas mensagem inicial nunca chegou — reenviar
      const primeiroNomeRetry = lead.nome?.split(' ')[0] || 'você'
      const mensagemRetry =
        `Olá, ${primeiroNomeRetry}! 👋 Sou ${config.nome_agente}, da equipe de expansão.\n\n` +
        `Recebi seu interesse e queria entender melhor o seu perfil para te conectar com a pessoa certa. Tem 2 minutinhos agora?`
      await enviarMensagem(telefoneNorm, mensagemRetry)
        .catch(err => console.warn('[Agente] Retry mensagem inicial:', err.message))
      return { iniciado: true, conversaId: existente.id, retry: true }
    }
    return { iniciado: false, motivo: 'conversa já ativa' }
  }

  const { data: conversa, error: convErr } = await supabase
    .from('agente_conversas')
    .insert({
      tenant_id: lead.tenant_id,
      lead_id:   lead.id || null,
      telefone:  telefoneNorm,
      historico: [],
      status:    'ativa',
    })
    .select('id')
    .single()

  if (convErr) {
    console.error('[Agente] Erro ao criar conversa inicial:', convErr.message)
    return { iniciado: false, motivo: convErr.message }
  }

  const primeiroNome = lead.nome?.split(' ')[0] || 'você'
  const mensagemInicial =
    `Olá, ${primeiroNome}! 👋 Sou ${config.nome_agente}, da equipe de expansão.\n\n` +
    `Recebi seu interesse e queria entender melhor o seu perfil para te conectar com a pessoa certa. Tem 2 minutinhos agora?`

  await enviarMensagem(telefoneNorm, mensagemInicial)
    .catch(err => console.warn('[Agente] Falha ao enviar mensagem inicial:', err.message))

  return { iniciado: true, conversaId: conversa.id }
}

// ── Main Entry Point ───────────────────────────────────────
export async function processarMensagemAgente(telefone, mensagem, tenantId, nomeContato = null, existingLeadId = null) {
  if (!ANTHROPIC_API_KEY) {
    console.warn('[Agente] ANTHROPIC_API_KEY não configurada — agente desabilitado')
    return { handled: false, agente_configurado: false }
  }

  const config = await getAgenteConfig(tenantId)
  if (!config) {
    return { handled: false, agente_configurado: false }
  }

  const MAX_TURNS = config.max_turns || 14

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

    const historico  = parseHistorico(conversa?.historico)
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
      // Reutiliza lead existente (passado pelo webhook) ou cria um preliminar
      if (existingLeadId) {
        leadId = existingLeadId
      } else {
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
        return { handled: false, agente_configurado: true }
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
        system:     buildSystemPrompt(config),
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
      await _executarHandoff(conversaId, leadId, tenantId, toolInput, historicoFinal, config)
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
async function _executarHandoff(conversaId, leadId, tenantId, dados, historico, config) {
  const { nome, capital_disponivel, cidade, estado, prazo, temperatura } = dados

  // Gera resumo estruturado via Claude usando o histórico completo
  const resumoRich = await _gerarResumoEstruturado(historico, config).catch(() => null)

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

  // Notificação realtime no sino para o handoff da LIA
  const nomeLeadNotif = dados?.nome || 'Lead'
  const tempNotif = dados?.temperatura || resumoRich?.temperatura || 'MORNO'
  const emojiTemp = { QUENTE: '🔥', MORNO: '🌡️', FRIO: '❄️' }[tempNotif] || '📋'
  await supabase.from('notificacoes').insert({
    tenant_id: tenantId,
    lead_id:   leadId,
    tipo:      tempNotif === 'QUENTE' ? 'hot' : 'info',
    titulo:    `${emojiTemp} Handoff LIA: ${nomeLeadNotif}`,
    mensagem:  resumoRich?.proximo_passo || `Lead ${tempNotif.toLowerCase()} qualificado pela LIA. Capital: ${resumoRich?.capital || 'não informado'}`,
    lida:      false,
  }).catch(err => console.warn('[Agente] notificacao handoff:', err.message))

  const dadosCompletos = { ...dados, resumoRich }
  await _notificarGestores(tenantId, dadosCompletos, config)
    .catch(err => console.warn('[Agente] Falha ao notificar gestores:', err.message))

  console.log(`[Agente] Handoff concluído — lead ${leadId}, temperatura: ${temperatura || resumoRich?.temperatura || '?'}`)
}

// ── Gera resumo estruturado em JSON usando o histórico ─────
async function _gerarResumoEstruturado(historico, config) {
  if (!ANTHROPIC_API_KEY || !historico?.length) return null
  const nomeAgente = config?.nome_agente || 'Agente Z'
  try {
    const conversa = historico
      .filter(h => h.role === 'user' || h.role === 'assistant')
      .map(h => {
        const texto = typeof h.content === 'string'
          ? h.content
          : (h.content || []).find(b => b.type === 'text')?.text || ''
        return `${h.role === 'assistant' ? nomeAgente : 'Lead'}: ${texto}`
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: SUMMARY_PROMPT + '\n\n' + conversa }],
      }),
    })

    const data = await res.json()
    const raw  = data.content?.[0]?.text?.replace(/```json|```/g, '').trim()
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.warn('[Agente] Falha ao gerar resumo estruturado:', err?.message)
    return null
  }
}

async function _notificarGestores(tenantId, dados, config) {
  const nomeAgente = config?.nome_agente || 'Agente Z'
  const { nome, capital_disponivel, cidade, estado, prazo, resumo_consultor, resumoRich } = dados

  const { data: gestores } = await supabase
    .from('usuarios')
    .select('email, nome')
    .eq('tenant_id', tenantId)
    .in('role', ['Administrador', 'Diretor', 'Gestor'])
    .eq('active', true)
    .limit(5)

  if (!gestores?.length) return

  const emails = gestores.map(g => g.email).filter(e => e && e.includes('@') && !e.endsWith('.local'))
  if (!emails.length) return

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
  const nomeDisplay = resumoRich?.nome || nome || 'não informado'

  const dashUrl = process.env.DASHBOARD_URL || 'https://leadcapture-proprod.vercel.app'

  const assunto = `[LIA Handoff] ${temp} — ${nomeDisplay}`

  const corpo = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#0a0a0a;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#18181b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
  <div style="background:linear-gradient(135deg,#10B981,#059669);padding:28px 32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">${tempEmoji}</div>
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900;">${nomeAgente} — Handoff ${temp}</h1>
    <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px;">Lead qualificado — pronto para negociação</p>
  </div>
  <div style="padding:28px 32px;">
    <table style="width:100%;border-collapse:collapse;">
      ${[
        ['Nome',          nomeDisplay],
        ['Capital',       capitalFmt],
        ['Localização',   [cidade, estado].filter(Boolean).join('/') || 'não informado'],
        ['Prazo',         prazoFmt],
        ['Decisores',     resumoRich?.decisores || 'não informado'],
        ['Tom emocional', resumoRich?.tom_emocional || 'não informado'],
        ...(resumoRich?.motivacao   ? [['Motivação',    resumoRich.motivacao]]   : []),
        ...(resumoRich?.objecoes    ? [['Objeções',     resumoRich.objecoes]]    : []),
        ...(resumoRich?.proximo_passo ? [['Próximo passo', resumoRich.proximo_passo]] : []),
        ...(!resumoRich && resumo_consultor ? [['Resumo', resumo_consultor]] : []),
      ].map(([label, value]) => `
        <tr>
          <td style="padding:8px 12px;font-size:10px;font-weight:700;text-transform:uppercase;color:#10B981;white-space:nowrap;vertical-align:top;">${label}</td>
          <td style="padding:8px 12px;font-size:14px;color:#f4f4f5;">${value}</td>
        </tr>
      `).join('')}
    </table>
  </div>
  <div style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <a href="${dashUrl}" style="background:#10B981;color:#fff;font-weight:700;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;display:inline-block;">Abrir Dashboard</a>
  </div>
</div></body></html>`

  await enviarEmail(emails, assunto, corpo)
    .catch(err => console.warn('[Agente] Falha ao enviar email handoff gestores:', err.message))
}
