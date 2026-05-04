// ============================================================
// ROUTES — /api/leads
// LeadCapture Pro — Zafalão Tech
// CORRIGIDO: Removida duplicação da rota assign-consultant
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'
import { processarCapitalFromConfig, resolverCapital } from '../core/scoring.js'
import { getScoringConfig } from '../core/scoringConfig.js'
import {
  isEmailValido,
  isTelefoneValido,
  validarDocumento,
  validarCamposObrigatorios,
  normalizarTelefone,
  sanitizarTexto,
} from '../core/validation.js'
import { notificarNovoLead, notificarLeadQuente, enviarBoasVindasLead } from '../comunicacao/email.js'
import { validateLead, validateLeadSistema, validateGoogleForms } from '../middleware/validateLead.js'
import { iniciarAgenteParaLead } from '../services/agente.js'

const router = Router()

// ============================================================
// POST /api/leads - Criar novo lead via landing page
// ============================================================
router.post('/', validateLead, async (req, res) => {
  try {
    console.log('[Leads] Novo lead via landing page')
    const dados = req.body

    const { valido, campoFaltando } = validarCamposObrigatorios(
      dados, ['tenant_id', 'nome', 'email', 'telefone']
    )
    if (!valido) {
      return res.status(400).json({ success: false, error: `Campo obrigatório: ${campoFaltando}` })
    }
    const marcaId = dados.id_marca || dados.marca_id
    if (!marcaId) {
      return res.status(400).json({ success: false, error: 'Campo obrigatório: marca_id' })
    }
    if (sanitizarTexto(dados.nome).length < 3) {
      return res.status(400).json({ success: false, error: 'Nome deve ter pelo menos 3 caracteres' })
    }
    if (!isEmailValido(dados.email)) {
      return res.status(400).json({ success: false, error: 'E-mail inválido' })
    }
    if (!isTelefoneValido(dados.telefone)) {
      return res.status(400).json({ success: false, error: 'Telefone inválido (mínimo 10 dígitos)' })
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
      leadData.score = score
      leadData.categoria = categoria
    }

    if (leadData.regiao !== undefined) {
      leadData.regiao_interesse = leadData.regiao_interesse || leadData.regiao
      delete leadData.regiao
    }

    if (dados.documento) {
      const doc = validarDocumento(dados.documento)
      if (!doc.valido) {
        return res.status(400).json({ success: false, error: 'Documento inválido' })
      }
    }

    // Se DDI vier explícito (landing page com seletor de país), combina diretamente
    // evitando que a heurística de normalização sobrescreva DDI de outros países
    if (dados.ddi) {
      const localDigits = String(dados.telefone || '').replace(/\D/g, '')
      leadData.telefone = `${dados.ddi}${localDigits}`
      delete leadData.ddi
    } else {
      leadData.telefone = normalizarTelefone(dados.telefone)
    }
    leadData.fonte = dados.fonte || 'landing-page'
    leadData.status = dados.status || 'novo'

    const { data, error } = await supabase.from('leads').insert([leadData]).select()
    if (error) throw error
    if (!data?.length) throw new Error('Insert retornou sem dados')

    const lead = data[0]
    console.log(`[Leads] Salvo: ${lead.id} | ${lead.nome} | score ${lead.score} | ${lead.categoria?.toUpperCase()}`)

    const [{ data: marcaInfo }, { data: usuariosNotif }] = await Promise.all([
      supabase.from('marcas').select('nome, emoji, logo_url, tenant_id').eq('id', lead.id_marca).single(),
      supabase.from('usuarios')
        .select('email, role')
        .eq('tenant_id', lead.tenant_id)
        .in('role', ['Diretor', 'Gestor', 'Administrador', 'admin'])
        .eq('active', true),
    ])

    const marcaFallback = marcaInfo || { nome: 'LeadCapture Pro', emoji: '🚀', logo_url: null }
    const emailsNotif = (usuariosNotif || [])
      .map(u => u.email)
      .filter(e => e && e.includes('@') && !e.endsWith('.local') && !e.includes('demo-') && !e.includes('fake'))

    async function isEmailAtivo(tenantId, id) {
      if (!tenantId) return true
      try {
        const { data } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('tenant_id', tenantId)
          .eq('chave', `email_automacao_${id}`)
          .maybeSingle()
        if (!data) return true
        return JSON.parse(data.valor) !== false
      } catch { return true }
    }

    async function logNotif(campos) {
      const { error } = await supabase.from('notification_logs').insert([campos])
      if (error) console.error('[Leads] notification_logs insert error:', error.message)
    }

    async function comRetry(fn, tipo, destinatario = null, maxTentativas = 3) {
      for (let t = 1; t <= maxTentativas; t++) {
        try {
          const resultado = await fn()
          // Funções de email retornam { success: false } em vez de throw — tratar aqui
          if (resultado && resultado.success === false) {
            throw new Error(resultado.error || resultado.motivo || 'Falha no envio')
          }
          await logNotif({
            lead_id: lead.id, tenant_id: lead.tenant_id,
            tipo, status: 'sucesso', destinatario, tentativas: t,
          })
          return true
        } catch (err) {
          console.warn(`[Leads] ${tipo} tentativa ${t}/${maxTentativas}: ${err.message}`)
          if (t === maxTentativas) {
            await logNotif({
              lead_id: lead.id, tenant_id: lead.tenant_id,
              tipo, status: 'erro', destinatario,
              erro: err.message, tentativas: maxTentativas,
            })
          } else {
            await new Promise(r => setTimeout(r, 1000 * t))
          }
        }
      }
      return false
    }

    // Notificações rodam ANTES de res.json() para garantir execução em serverless
    // (em Vercel/Lambda o processo é congelado imediatamente após a resposta)
    const runNotificacoes = async () => {
      const [ativoBoasVindas, ativoLeadQuente] = await Promise.all([
        isEmailAtivo(lead.tenant_id, 'boas-vindas'),
        isEmailAtivo(lead.tenant_id, 'lead-quente'),
      ])

      const notifPromises = []

      if (lead.email?.includes('@') && ativoBoasVindas) {
        notifPromises.push(
          comRetry(() => enviarBoasVindasLead(lead, marcaFallback), 'email-boas-vindas-lead', lead.email)
        )
      }

      const destNotif = emailsNotif.join(', ') || null
      notifPromises.push(
        comRetry(() => notificarNovoLead(lead, marcaFallback, emailsNotif), 'email-notificacao-interna', destNotif)
      )

      if (lead.score >= 65 && ativoLeadQuente) {
        notifPromises.push(
          comRetry(() => notificarLeadQuente(lead, marcaFallback, emailsNotif), 'email-lead-quente', destNotif)
        )
      }

      await Promise.allSettled(notifPromises)

      // Inicia agente IA se habilitado para o tenant (await garante execução em serverless)
      let agenteIniciado = false
      try {
        const resultAgente = await iniciarAgenteParaLead(lead, marcaFallback)
        agenteIniciado = resultAgente.iniciado
        console.log(`[Leads] Agente: ${resultAgente.iniciado ? 'iniciado' : resultAgente.motivo}`)
      } catch (err) {
        console.warn('[Leads] Agente erro:', err.message)
      }

      const n8nUrl = process.env.N8N_WEBHOOK_URL
      if (n8nUrl) {
        fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: lead.id, nome: lead.nome, email: lead.email,
            telefone: lead.telefone, score: lead.score, categoria: lead.categoria,
            capital: lead.capital_disponivel, regiao: lead.regiao_interesse,
            marca: marcaFallback.nome, tenant_id: lead.tenant_id,
            fonte: lead.fonte, timestamp: new Date().toISOString(),
            agente_ja_iniciado: agenteIniciado,
          }),
        }).catch(err => console.warn('[Leads] N8N webhook:', err.message))
      }
    }

    // Roda notificações antes de responder — garante execução em serverless
    await runNotificacoes().catch(err => console.error('[Leads] Notificações:', err.message))

    res.json({ success: true, message: 'Lead recebido com sucesso!', leadId: lead.id, score: lead.score, categoria: lead.categoria })
  } catch (err) {
    console.error('[Leads] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao processar lead', detalhe: err.message })
  }
})

// ============================================================
// POST /api/leads/google-forms
// ============================================================

/**
 * Extrai apenas os dígitos de um valor DDI que pode vir em vários formatos:
 * "55" | "+55" | "🇧🇷 +55 Brasil" | "Brasil (+55)" | "55 - Brasil"
 */
function extrairDdiDigitos(valor) {
  if (!valor) return ''
  // Tenta capturar sequência numérica após um "+" ou no início
  const match = String(valor).match(/\+?(\d{1,4})/)
  return match ? match[1] : ''
}

/**
 * Resolve o telefone final para o canal Google Forms.
 * Prioridade: DDI explícito na submissão > ddi_padrao > normalização padrão (DDI 55).
 */
function resolverTelefoneGoogleForms(form) {
  const telefoneBruto = (
    form.telefone || form['WhatsApp'] || form.whatsapp ||
    form['Número'] || form['Telefone'] || form.phone || ''
  )
  const localDigits = String(telefoneBruto).replace(/\D/g, '')

  // Extrai DDI de qualquer nome de campo enviado pelo webhook
  const ddiRaw = (
    form.ddi || form.DDI ||
    form['DDI'] || form['DDI País'] || form['Código do País'] ||
    form['Codigo do Pais'] || form['codigo_pais'] ||
    form['country_code'] || form['Country Code'] ||
    form['pais_ddi'] || ''
  )
  const ddiExplicito = extrairDdiDigitos(ddiRaw)

  // ddi_padrao permite configurar DDI padrão no webhook (ex: para forms de Portugal)
  const ddiPadrao = extrairDdiDigitos(form.ddi_padrao || '')

  if (ddiExplicito) return `${ddiExplicito}${localDigits}`
  if (ddiPadrao)    return `${ddiPadrao}${localDigits}`
  return normalizarTelefone(telefoneBruto) // fallback: heurística com DDI 55 padrão
}

router.post('/google-forms', validateGoogleForms, async (req, res) => {
  try {
    console.log('[Leads/GoogleForms] Lead recebido')
    const form = req.body

    const nome = form.nome || form['Nome completo'] || form.name || ''
    const email = form.email || form['E-mail'] || form['E-mail address'] || ''
    const telefone = resolverTelefoneGoogleForms(form)
    const marca_id = form.marca_id
    const tenant_id = form.tenant_id || process.env.DEFAULT_TENANT_ID || ''

    if (!nome || nome.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Nome inválido ou ausente' })
    }
    if (!isEmailValido(email)) {
      return res.status(400).json({ success: false, error: 'E-mail inválido ou ausente' })
    }
    if (!isTelefoneValido(telefone)) {
      return res.status(400).json({ success: false, error: 'Telefone inválido ou ausente' })
    }
    if (!marca_id) {
      return res.status(400).json({ success: false, error: 'marca_id é obrigatório' })
    }

    const capitalRaw = form.capital || form['Capital disponível'] || form.capital_disponivel || '0'
    const scoringConfig = await getScoringConfig(tenant_id)
    const capitalNumerico = resolverCapital(capitalRaw) ?? 0
    const { capital, score, categoria } = processarCapitalFromConfig(capitalNumerico, scoringConfig)

    const mensagem = form.mensagem || form['Mensagem'] || form.message || ''

    const leadData = {
      tenant_id,
      id_marca: marca_id,
      nome: sanitizarTexto(nome),
      email: email.trim().toLowerCase(),
      telefone,
      cidade: sanitizarTexto(form.cidade || form['Cidade'] || ''),
      estado: sanitizarTexto(form.estado || form['Estado'] || ''),
      capital_disponivel: capital,
      score,
      categoria,
      status: 'novo',
      fonte: 'google-forms',
      mensagem_original: sanitizarTexto(mensagem, 1000),
    }

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
          message: 'Lead já existente (menos de 24h)',
          leadId: existente[0].id,
          duplicado: true,
        })
      }
    }

    const { data, error } = await supabase.from('leads').insert([leadData]).select()
    if (error) throw error

    const lead = data[0]
    console.log(`[Leads/GoogleForms] Salvo: ${lead.id} | score ${lead.score} | ${lead.categoria?.toUpperCase()}`)

    // Busca marca para o agente
    const { data: marcaInfo } = await supabase
      .from('marcas')
      .select('nome, emoji')
      .eq('id', leadData.id_marca)
      .maybeSingle()

    try {
      const resultAgente = await iniciarAgenteParaLead(
        { ...lead, tenant_id: leadData.tenant_id, telefone: leadData.telefone, nome: leadData.nome },
        marcaInfo || { nome: 'LeadCapture Pro', emoji: '🚀' }
      )
      console.log(`[GoogleForms] Agente: ${resultAgente.iniciado ? 'iniciado' : resultAgente.motivo}`)
    } catch (err) {
      console.warn('[GoogleForms] Agente erro:', err.message)
    }

    res.json({
      success: true,
      message: 'Lead do Google Forms recebido!',
      leadId: lead.id,
      score: lead.score,
      categoria: lead.categoria,
    })
  } catch (err) {
    console.error('[Leads/GoogleForms] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao processar lead do Google Forms' })
  }
})

router.get('/google-forms/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Google Forms Integration', timestamp: new Date().toISOString() })
})

router.get('/google-forms/config', (_req, res) => {
  res.json({
    descricao: 'Configuração do webhook para integração Google Forms → LeadCapture Pro',
    endpoint: 'POST /api/leads/google-forms',
    campos_obrigatorios: {
      tenant_id: 'UUID do tenant (fixo no webhook)',
      marca_id:  'UUID da marca (fixo no webhook)',
      nome:      'Nome completo do lead',
      email:     'E-mail do lead',
      telefone:  'Número local SEM DDI (ex: 11999998888)',
    },
    campos_ddi: {
      descricao: 'Envie um destes campos para definir o DDI do país do lead',
      opcoes: ['ddi', 'DDI', 'DDI País', 'Código do País', 'country_code'],
      formatos_aceitos: ['+55', '55', '🇧🇷 +55 Brasil', 'Brasil (+55)'],
      ddi_padrao: 'Use ddi_padrao no payload do webhook para definir DDI padrão de todo o form (ex: ddi_padrao="351" para formulário de Portugal)',
    },
    campos_opcionais: {
      capital:            'Capital disponível (ex: "100k-300k", "R$ 200.000")',
      'Capital disponível': 'Alias aceito para o campo capital',
      cidade:             'Cidade do lead',
      estado:             'Estado do lead',
      mensagem:           'Mensagem ou observação livre',
      regiao_interesse:   'Região de interesse',
    },
    exemplo_payload: {
      tenant_id:  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      marca_id:   'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
      nome:       'João Silva',
      email:      'joao@email.com',
      telefone:   '11999998888',
      ddi:        '55',
      capital:    '100k-300k',
      cidade:     'São Paulo',
      estado:     'SP',
    },
    exemplo_payload_internacional: {
      tenant_id:  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      marca_id:   'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
      nome:       'Maria Santos',
      email:      'maria@email.pt',
      telefone:   '912345678',
      ddi:        '351',
      capital:    '100k-300k',
    },
  })
})

// ============================================================
// POST /api/leads/sistema
// ============================================================
router.post('/sistema', validateLeadSistema, async (req, res) => {
  try {
    console.log('[Leads/Sistema] Novo prospect do produto')
    const { nome, email, telefone, empresa, companhia, cidade, estado, observacao } = req.body

    const { valido, campoFaltando } = validarCamposObrigatorios(
      { nome, email, telefone }, ['nome', 'email', 'telefone']
    )
    if (!valido) {
      return res.status(400).json({ success: false, error: `Campo obrigatório: ${campoFaltando}` })
    }
    if (!isEmailValido(email)) {
      return res.status(400).json({ success: false, error: 'E-mail inválido' })
    }

    const { data, error } = await supabase
      .from('leads_sistema')
      .insert([{
        nome: sanitizarTexto(nome),
        email: email.trim().toLowerCase(),
        telefone: normalizarTelefone(telefone),
        companhia: sanitizarTexto(empresa || companhia || ''),
        cidade: sanitizarTexto(cidade || ''),
        estado: sanitizarTexto(estado || ''),
        observacao: sanitizarTexto(observacao || ''),
        fonte: req.body.fonte || 'captacao-landing',
        status: 'novo',
        tenant_id: process.env.SISTEMA_TENANT_ID || '81cac3a4-caa3-43b2-be4d-d16557d7ef88',
      }])
      .select()

    if (error) throw error

    const lead = data[0]
    console.log(`[Leads/Sistema] Prospect salvo: ${lead.id} | ${lead.nome}`)

    notificarNovoLead(lead, { nome: 'LeadCapture Pro', emoji: '🚀' }).catch(err =>
      console.warn('[Leads/Sistema] E-mail não enviado:', err.message)
    )

    try {
      const resultAgente = await iniciarAgenteParaLead(
        { ...lead, tenant_id: lead.tenant_id, telefone: normalizarTelefone(req.body.telefone) },
        { nome: 'LeadCapture Pro', emoji: '🚀' }
      )
      console.log(`[Sistema] Agente: ${resultAgente.iniciado ? 'iniciado' : resultAgente.motivo}`)
    } catch (err) {
      console.warn('[Sistema] Agente erro:', err.message)
    }

    res.json({ success: true, message: 'Recebemos seu contato! Em breve nossa equipe entrará em contato.', leadId: lead.id })
  } catch (err) {
    console.error('[Leads/Sistema] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao processar prospect' })
  }
})

// ============================================================
// PUT /api/leads/:id/assign-consultant
// CORRIGIDO: Única implementação (antes estava duplicado)
// ============================================================
router.put('/:id/assign-consultant', async (req, res) => {
  try {
    const { id } = req.params
    const { consultantId } = req.body

    const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token obrigatório' })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Token inválido' })
    }

    const { data: usuarioLogado } = await supabase
      .from('usuarios')
      .select('id, role, tenant_id, is_super_admin, is_platform')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (!usuarioLogado) {
      return res.status(403).json({ success: false, error: 'Usuário não encontrado' })
    }

    const ADMIN_TENANT_ID = process.env.ADMIN_TENANT_ID || 'ac8a8add-3044-4051-a5e6-274b20da5633'
    const podeAtribuir = ['Gestor', 'Diretor', 'Administrador', 'admin'].includes(usuarioLogado.role)
      || usuarioLogado.is_super_admin
      || usuarioLogado.is_platform
      || usuarioLogado.tenant_id === ADMIN_TENANT_ID

    if (!podeAtribuir) {
      return res.status(403).json({ success: false, error: 'Sem permissão para atribuir consultores' })
    }

    if (!consultantId) {
      return res.status(400).json({ success: false, error: 'consultantId obrigatório' })
    }

    const { data: lead } = await supabase
      .from('leads')
      .select('id, tenant_id, nome')
      .eq('id', id)
      .maybeSingle()

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' })
    }

    const isAdminUser = usuarioLogado.is_super_admin || usuarioLogado.is_platform
      || usuarioLogado.tenant_id === ADMIN_TENANT_ID
      || ['Administrador', 'admin'].includes(usuarioLogado.role)

    const tenantOk = isAdminUser || lead.tenant_id === usuarioLogado.tenant_id

    if (!tenantOk) {
      return res.status(403).json({ success: false, error: 'Lead pertence a outro tenant' })
    }

    const { data: consultor } = await supabase
      .from('usuarios')
      .select('id, nome, role, tenant_id')
      .eq('id', consultantId)
      .maybeSingle()

    if (!consultor) {
      return res.status(404).json({ success: false, error: 'Consultor não encontrado' })
    }

    if (!isAdminUser) {
      if (consultor.tenant_id !== lead.tenant_id) {
        return res.status(403).json({ success: false, error: 'Consultor não pertence ao mesmo tenant do lead' })
      }
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        id_operador_responsavel: consultantId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('[assign-consultant]', updateError)
      return res.status(500).json({ success: false, error: updateError.message })
    }

    console.log(`[Assign] Lead "${lead.nome}" atribuído a "${consultor.nome}" por ${usuarioLogado.role}`)

    res.json({
      success: true,
      message: `Consultor ${consultor.nome} atribuído com sucesso!`,
    })
  } catch (err) {
    console.error('[Leads/AssignConsultant] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao atribuir consultor', detalhe: err.message })
  }
})

export default router
