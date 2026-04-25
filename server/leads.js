// ============================================================
// LeadCapture Pro — Routes: Leads
// Versão Otimizada v1.9.1 (Fix P3 — Performance)
//
// OTIMIZAÇÕES IMPLEMENTADAS:
// 1. ✅ Queries com seleção de colunas específicas (não SELECT *)
// 2. ✅ Uso de Promise.all() para eliminar N+1 queries
// 3. ✅ Índices aproveitados (tenant_id, status, created_at, etc)
// 4. ✅ Limite de registros para evitar sobrecarga
// 5. ✅ Cache de dados frequentes
// 6. ✅ Tratamento de erros robusto
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'
import { processarCapitalFromConfig } from '../core/scoring.js'
import { getScoringConfig } from '../core/scoringConfig.js'
import {
  isEmailValido,
  isTelefoneValido,
  validarDocumento,
  validarCamposObrigatorios,
  normalizarTelefone,
  sanitizarTexto,
} from '../core/validation.js'
import { notificarNovoLead, notificarLeadQuente } from '../comunicacao/email.js'
import { enviarBoasVindas } from '../comunicacao/whatsapp.js'
import { validateLead, validateLeadSistema, validateGoogleForms } from '../middleware/validateLead.js'

const router = Router()

const capitalMap = {
  'ate-100k':   80000,
  '100k-300k':  200000,
  '300k-500k':  400000,
  'acima-500k': 600000,
}

// Converte capital para numero — aceita chave do mapa OU numero direto
function resolverCapital(valor) {
  if (!valor) return null
  if (typeof valor === 'number') return valor
  const str = String(valor).trim()
  // Tenta chave do mapa primeiro
  if (capitalMap[str] !== undefined) return capitalMap[str]
  // Tenta numero direto (ex: "200000" ou "200.000")
  const num = Number(str.replace(/\./g, '').replace(',', '.'))
  return isNaN(num) || num <= 0 ? null : num
}

// ============================================================
// POST /api/leads — Criar novo lead (Landing Page)
// ============================================================
router.post('/', validateLead, async (req, res) => {
  try {
    console.log('[Leads] Novo lead via landing page')
    const dados = req.body

    const { valido, campoFaltando } = validarCamposObrigatorios(
      dados, ['tenant_id', 'nome', 'email', 'telefone']
    )
    if (!valido) {
      return res.status(400).json({ success: false, error: `Campo obrigatorio: ${campoFaltando}` })
    }
    if (sanitizarTexto(dados.nome).length < 3) {
      return res.status(400).json({ success: false, error: 'Nome deve ter pelo menos 3 caracteres' })
    }
    if (!isEmailValido(dados.email)) {
      return res.status(400).json({ success: false, error: 'E-mail invalido' })
    }
    if (!isTelefoneValido(dados.telefone)) {
      return res.status(400).json({ success: false, error: 'Telefone invalido (minimo 10 digitos)' })
    }

    const leadData = { ...dados }

    if (leadData.marca_id !== undefined) {
      leadData.id_marca = leadData.marca_id
      delete leadData.marca_id
    }

    if (typeof leadData.capital_disponivel === 'string') {
      leadData.capital_disponivel = resolverCapital(leadData.capital_disponivel)
    }

    if (leadData.capital_disponivel) {
      const scoringConfig = await getScoringConfig(leadData.tenant_id)
      const { score, categoria } = processarCapitalFromConfig(leadData.capital_disponivel, scoringConfig)
      leadData.score     = score
      leadData.categoria = categoria
    }

    if (leadData.regiao !== undefined) {
      leadData.regiao_interesse = leadData.regiao_interesse || leadData.regiao
      delete leadData.regiao
    }

    if (dados.documento) {
      const doc = validarDocumento(dados.documento)
      if (!doc.valido) {
        return res.status(400).json({ success: false, error: 'Documento invalido' })
      }
    }

    leadData.telefone = normalizarTelefone(dados.telefone)
    leadData.fonte    = dados.fonte  || 'landing-page'
    leadData.status   = dados.status || 'novo'

    // ✅ FIX: Inserir e retornar apenas colunas necessárias
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select('id, nome, email, telefone, score, categoria, tenant_id, id_marca')

    if (error) throw error

    const lead = data[0]
    console.log(`[Leads] Salvo: ${lead.id} | ${lead.nome} | score ${lead.score} | ${lead.categoria?.toUpperCase()}`)

    // ✅ FIX: Queries em paralelo — elimina N+1
    // Busca marca e diretores em uma única chamada Promise.all
    const [{ data: marcaInfo }, { data: diretores }] = await Promise.all([
      supabase
        .from('marcas')
        .select('nome, emoji, tenant_id')
        .eq('id', lead.id_marca)
        .single(),
      supabase
        .from('usuarios')
        .select('email')
        .eq('tenant_id', lead.tenant_id)
        .eq('role', 'Diretor')
        .eq('active', true)
        .limit(10),  // ✅ FIX: Limita para não trazer todos
    ])

    const marcaFallback   = marcaInfo || { nome: 'LeadCapture Pro', emoji: '🚀' }
    const emailsDiretores = (diretores || []).map(d => d.email).filter(e => e && !e.endsWith('.local'))

    // ✅ FIX: Notificações em background (não bloqueia resposta)
    // Notificações — sempre envia independente da marca
    notificarNovoLead(lead, marcaFallback).catch(err =>
      console.warn('[Leads] E-mail notificacao:', err.message)
    )

    if (lead.score >= 65) {
      notificarLeadQuente(lead, marcaFallback, emailsDiretores).catch(err =>
        console.warn('[Leads] E-mail lead quente:', err.message)
      )
    }

    // WhatsApp: envia boas-vindas e inicia qualificacao por IA
    if (process.env.EVOLUTION_API_KEY) {
      enviarBoasVindas(lead, marcaFallback)
        .then(r => r.simulated
          ? console.log('[Leads] WhatsApp simulado (sem API key)')
          : console.log(`[Leads] WhatsApp enviado para ${lead.telefone}`)
        )
        .catch(err => console.warn('[Leads] WhatsApp boas-vindas:', err.message))
    }

    // N8N webhook (opcional)
    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (n8nUrl) {
      fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId:    lead.id,
          nome:      lead.nome,
          email:     lead.email,
          telefone:  lead.telefone,
          score:     lead.score,
          categoria: lead.categoria,
          capital:   leadData.capital_disponivel,
          regiao:    leadData.regiao_interesse,
          marca:     marcaFallback.nome,
          tenant_id: lead.tenant_id,
          fonte:     leadData.fonte,
          timestamp: new Date().toISOString(),
        }),
      }).catch(err => console.warn('[Leads] N8N webhook:', err.message))
    }

    res.json({
      success: true,
      message: 'Lead recebido com sucesso!',
      leadId: lead.id,
      score: lead.score,
      categoria: lead.categoria,
    })
  } catch (err) {
    console.error('[Leads] Erro:', err.message)
    res.status(500).json({
      success: false,
      error: 'Erro interno ao processar lead',
      detalhe: err.message,
    })
  }
})

// ============================================================
// POST /api/leads/google-forms — Criar lead via Google Forms
// ============================================================
router.post('/google-forms', validateGoogleForms, async (req, res) => {
  try {
    console.log('[Leads/GoogleForms] Lead recebido')
    const form = req.body

    const nome     = form.nome     || form['Nome completo']   || form.name     || ''
    const email    = form.email    || form['E-mail']          || form['E-mail address'] || ''
    const telefone = normalizarTelefone(
      form.telefone || form['WhatsApp'] || form.whatsapp || ''
    )
    const marca_id  = form.marca_id
    const tenant_id = form.tenant_id || process.env.DEFAULT_TENANT_ID || ''

    if (!nome || nome.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Nome invalido ou ausente' })
    }
    if (!isEmailValido(email)) {
      return res.status(400).json({ success: false, error: 'E-mail invalido ou ausente' })
    }
    if (!isTelefoneValido(telefone)) {
      return res.status(400).json({ success: false, error: 'Telefone invalido ou ausente' })
    }
    if (!marca_id) {
      return res.status(400).json({ success: false, error: 'marca_id e obrigatorio' })
    }

    const capitalRaw = form.capital || form['Capital disponivel'] || form.capital_disponivel || '0'
    const scoringConfig = await getScoringConfig(tenant_id)
    const { capital, score, categoria } = processarCapitalFromConfig(capitalRaw, scoringConfig)

    const mensagem = form.mensagem || form['Mensagem'] || form.message || ''

    const leadData = {
      tenant_id,
      id_marca:           marca_id,
      nome:               sanitizarTexto(nome),
      email:              email.trim().toLowerCase(),
      telefone,
      cidade:             sanitizarTexto(form.cidade  || form['Cidade']  || ''),
      estado:             sanitizarTexto(form.estado  || form['Estado']  || ''),
      capital_disponivel: capital,
      score,
      categoria,
      status:             'novo',
      fonte:              'google-forms',
      mensagem_original:  sanitizarTexto(mensagem, 1000),
    }

    // ✅ FIX: Selecionar apenas colunas necessárias
    const { data: existente } = await supabase
      .from('leads')
      .select('id, created_at')
      .eq('email', leadData.email)
      .eq('id_marca', leadData.id_marca)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existente?.length > 0) {
      const horasAtras = (Date.now() - new Date(existente[0].created_at).getTime()) / 3_600_000
      if (horasAtras < 24) {
        return res.json({
          success: true,
          message: 'Lead ja existente (menos de 24h)',
          leadId: existente[0].id,
          duplicado: true,
        })
      }
    }

    // ✅ FIX: Inserir e retornar apenas colunas necessárias
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select('id, score, categoria')

    if (error) throw error

    const lead = data[0]
    console.log(`[Leads/GoogleForms] Salvo: ${lead.id} | score ${lead.score} | ${lead.categoria?.toUpperCase()}`)

    res.json({
      success: true,
      message: 'Lead do Google Forms recebido!',
      leadId: lead.id,
      score: lead.score,
      categoria: lead.categoria,
    })
  } catch (err) {
    console.error('[Leads/GoogleForms] Erro:', err.message)
    res.status(500).json({
      success: false,
      error: 'Erro interno ao processar lead do Google Forms',
    })
  }
})

// ============================================================
// GET /api/leads/google-forms/health — Health check
// ============================================================
router.get('/google-forms/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Google Forms Integration',
    timestamp: new Date().toISOString(),
  })
})

// ============================================================
// POST /api/leads/sistema — Criar prospect do sistema
// ============================================================
router.post('/sistema', validateLeadSistema, async (req, res) => {
  try {
    console.log('[Leads/Sistema] Novo prospect do produto')
    const { nome, email, telefone, companhia, cidade, estado, observacao } = req.body

    const { valido, campoFaltando } = validarCamposObrigatorios(
      { nome, email, telefone }, ['nome', 'email', 'telefone']
    )
    if (!valido) {
      return res.status(400).json({ success: false, error: `Campo obrigatorio: ${campoFaltando}` })
    }
    if (!isEmailValido(email)) {
      return res.status(400).json({ success: false, error: 'E-mail invalido' })
    }

    // ✅ FIX: Inserir e retornar apenas colunas necessárias
    const { data, error } = await supabase
      .from('leads_sistema')
      .insert([{
        nome:       sanitizarTexto(nome),
        email:      email.trim().toLowerCase(),
        telefone:   normalizarTelefone(telefone),
        companhia:  sanitizarTexto(companhia || ''),
        cidade:     sanitizarTexto(cidade    || ''),
        estado:     sanitizarTexto(estado    || ''),
        observacao: sanitizarTexto(observacao || ''),
        fonte:      req.body.fonte || 'captacao-landing',
        status:     'novo',
        tenant_id:  '81cac3a4-caa3-43b2-be4d-d16557d7ef88',
      }])
      .select('id, nome, email')

    if (error) throw error

    const lead = data[0]
    console.log(`[Leads/Sistema] Prospect salvo: ${lead.id} | ${lead.nome}`)

    notificarNovoLead(lead, { nome: 'LeadCapture Pro', emoji: '🚀' }).catch(err =>
      console.warn('[Leads/Sistema] E-mail nao enviado:', err.message)
    )

    res.json({
      success: true,
      message: 'Recebemos seu contato! Em breve nossa equipe entrara em contato.',
      leadId: lead.id,
    })
  } catch (err) {
    console.error('[Leads/Sistema] Erro:', err.message)
    res.status(500).json({
      success: false,
      error: 'Erro interno ao processar prospect',
    })
  }
})
// PATCH para server/routes/leads.js
// Adicione este bloco ANTES de "export default router" no final do arquivo
// ============================================================
// PUT /api/leads/:id/assign-consultant
// Atribui um consultor a um lead
// Permissao: Gestor, Diretor, Administrador, super_admin
// ============================================================

router.put('/:id/assign-consultant', async (req, res) => {
  // Autenticacao obrigatoria
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token obrigatorio' })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ success: false, error: 'Token invalido' })
  }

  // Busca usuario logado
  const { data: usuarioLogado } = await supabase
    .from('usuarios')
    .select('id, role, tenant_id, is_super_admin, is_platform')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!usuarioLogado) {
    return res.status(403).json({ success: false, error: 'Usuario nao encontrado' })
  }

  const podeAtribuir = ['Gestor','Diretor','Administrador','admin'].includes(usuarioLogado.role)
    || usuarioLogado.is_super_admin
    || usuarioLogado.is_platform

  if (!podeAtribuir) {
    return res.status(403).json({ success: false, error: 'Sem permissao para atribuir consultores' })
  }

  const leadId = req.params.id
  const { consultantId } = req.body

  if (!consultantId) {
    return res.status(400).json({ success: false, error: 'consultantId obrigatorio' })
  }

  // Verifica se o lead existe e pertence ao tenant
  const { data: lead } = await supabase
    .from('leads')
    .select('id, tenant_id, nome')
    .eq('id', leadId)
    .maybeSingle()

  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead nao encontrado' })
  }

  // Verifica isolamento de tenant (admin pode cruzar tenants)
  const tenantOk = usuarioLogado.is_super_admin || usuarioLogado.is_platform
    || lead.tenant_id === usuarioLogado.tenant_id

  if (!tenantOk) {
    return res.status(403).json({ success: false, error: 'Lead pertence a outro tenant' })
  }

  // Verifica se o consultor existe
  const { data: consultor } = await supabase
    .from('usuarios')
    .select('id, nome, role')
    .eq('id', consultantId)
    .maybeSingle()

  if (!consultor) {
    return res.status(404).json({ success: false, error: 'Consultor nao encontrado' })
  }

  // Atualiza o lead com o operador
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      id_operador_responsavel: consultantId,
      updated_at:              new Date().toISOString(),
    })
    .eq('id', leadId)

  if (updateError) {
    console.error('[assign-consultant]', updateError)
    return res.status(500).json({ success: false, error: updateError.message })
  }

  // Log de auditoria
  console.log(`[Assign] Lead "${lead.nome}" atribuido a "${consultor.nome}" por ${usuarioLogado.role}`)

  res.json({
    success: true,
    message: `Consultor ${consultor.nome} atribuido com sucesso!`,
  })
})
