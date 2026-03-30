// ============================================================
// ROUTES — /api/chat
// Chatbot interno para consultores — LeadCapture Pro
// Usa Anthropic API + ai_instructions do tenant
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'
import { sanitizarTexto } from '../core/validation.js'
import { globalLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Rate limit especifico para chat (mais generoso que leads)
import rateLimit from 'express-rate-limit'
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Muitas mensagens. Aguarde um momento.' }
})

// ─── POST /api/chat/message ──────────────────────────────────
// Envia mensagem ao assistente IA do tenant
router.post('/message', chatLimiter, async (req, res) => {
  try {
    const { message, tenant_id, lead_context, historico = [] } = req.body

    if (!tenant_id) {
      return res.status(400).json({ success: false, error: 'tenant_id obrigatorio' })
    }
    if (!message || message.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Mensagem muito curta' })
    }

    const mensagemLimpa = sanitizarTexto(message, 2000)

    // Busca configuracoes do tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name, ai_instructions, ai_model, business_type')
      .eq('id', tenant_id)
      .single()

    if (tenantError || !tenant) {
      return res.status(404).json({ success: false, error: 'Tenant nao encontrado' })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Servico de IA nao configurado' })
    }

    // Monta system prompt rico com contexto do tenant
    const systemPrompt = montarSystemPrompt(tenant, lead_context)

    // Monta historico de mensagens para contexto
    const messages = [
      ...historico.slice(-8).map(h => ({
        role: h.role,
        content: h.content
      })),
      { role: 'user', content: mensagemLimpa }
    ]

    // Chama Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages
      })
    })

    if (!response.ok) {
      const erro = await response.text()
      console.error('[Chat] Erro Anthropic:', erro)
      return res.status(502).json({ success: false, error: 'Erro ao consultar IA' })
    }

    const data = await response.json()
    const resposta = data.content?.[0]?.text || ''

    if (!resposta) {
      return res.status(502).json({ success: false, error: 'Resposta vazia da IA' })
    }

    res.json({
      success: true,
      resposta,
      tokens: data.usage?.output_tokens || 0
    })

  } catch (err) {
    console.error('[Chat] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno no chat' })
  }
})

// ─── GET /api/chat/health ────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'LeadCapture Pro — Chat IA',
    anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
    timestamp: new Date().toISOString()
  })
})

// ─── Helpers ─────────────────────────────────────────────────
function montarSystemPrompt(tenant, leadContext) {
  const instrucoes = tenant.ai_instructions ||
    `Voce e um assistente especializado em qualificacao de leads para ${tenant.name}.
     Ajude consultores a entender e qualificar potenciais franqueados.
     Seja objetivo, profissional e focado em resultados de vendas.`

  let prompt = `Voce e o assistente interno do sistema LeadCapture Pro para ${tenant.name}.

SUAS INSTRUCOES ESPECIFICAS:
${instrucoes}

CONTEXTO DO SISTEMA:
- Voce esta auxiliando consultores e gestores da ${tenant.name}
- Tipo de negocio: ${tenant.business_type || 'franquia'}
- Seu papel: ajudar a equipe a qualificar leads, sugerir abordagens e responder duvidas sobre o processo de vendas

REGRAS:
- Seja direto e pratico — consultores precisam de respostas rapidas
- Quando avaliar um lead, sempre mencione o score e a categoria (hot/warm/cold)
- Sugira acoes concretas: ligar, enviar WhatsApp, agendar visita
- Nao invente informacoes que nao foram fornecidas
- Responda sempre em portugues brasileiro`

  if (leadContext) {
    prompt += `

LEAD ATUAL EM ANALISE:
- Nome: ${leadContext.nome || 'Nao informado'}
- Score: ${leadContext.score ?? 'Nao calculado'}/100
- Categoria: ${leadContext.categoria?.toUpperCase() || 'Nao categorizado'}
- Capital disponivel: ${leadContext.capital ? `R$ ${Number(leadContext.capital).toLocaleString('pt-BR')}` : 'Nao informado'}
- Regiao: ${leadContext.regiao || 'Nao informado'}
- Fonte: ${leadContext.fonte || 'Nao informado'}
- Status: ${leadContext.status || 'Novo'}
- Marca de interesse: ${leadContext.marca || 'Nao informado'}

Use essas informacoes para dar orientacoes especificas sobre este lead.`
  }

  return prompt
}

export default router