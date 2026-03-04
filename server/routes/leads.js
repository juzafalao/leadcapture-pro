// ============================================================
// ROUTES — /api/leads
// Captura e gestão de leads (landing pages, Google Forms, sistema)
// ============================================================

import { Router } from 'express'
import supabase            from '../core/database.js'
import { processarCapital, calcularScore, determinarCategoria } from '../core/scoring.js'
import {
  isEmailValido,
  isTelefoneValido,
  validarDocumento,
  validarCamposObrigatorios,
  normalizarTelefone,
  sanitizarTexto,
} from '../core/validation.js'
import { notificarNovoLead }    from '../comunicacao/email.js'
import { enviarBoasVindas }     from '../comunicacao/whatsapp.js'

const router = Router()

// ─────────────────────────────────────────────
// POST /api/leads
// Captura de leads via landing pages customizáveis
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('[Leads] Novo lead via landing page')

    const dados = req.body

    // Validação de campos obrigatórios
    const { valido, campoFaltando } = validarCamposObrigatorios(
      dados,
      ['tenant_id', 'marca_id', 'nome', 'email', 'telefone']
    )
    if (!valido) {
      return res.status(400).json({ success: false, error: `Campo obrigatório: ${campoFaltando}` })
    }

    // Validações de formato
    if (sanitizarTexto(dados.nome).length < 3) {
      return res.status(400).json({ success: false, error: 'Nome deve ter pelo menos 3 caracteres' })
    }
    if (!isEmailValido(dados.email)) {
      return res.status(400).json({ success: false, error: 'E-mail inválido' })
    }
    if (!isTelefoneValido(dados.telefone)) {
      return res.status(400).json({ success: false, error: 'Telefone inválido (mínimo 10 dígitos)' })
    }

    // Documento opcional
    const leadData = { ...dados }
    if (leadData.marca_id !== undefined) {
      leadData.id_marca = leadData.marca_id
      delete leadData.marca_id
    }
    if (dados.documento) {
      const doc = validarDocumento(dados.documento)
      if (!doc.valido) {
        return res.status(400).json({ success: false, error: 'Documento inválido (CPF: 11 dígitos | CNPJ: 14 dígitos)' })
      }
    }

    leadData.telefone  = normalizarTelefone(dados.telefone)
    leadData.fonte     = dados.fonte     || 'landing-page'
    leadData.status    = dados.status    || 'novo'
    // 'produto' = franquia/cliente | 'sistema' = LeadCapture Pro

    const { data, error } = await supabase.from('leads').insert([leadData]).select()
    if (error) throw error

    const lead = data[0]
    console.log(`[Leads] Salvo: ${lead.id} | ${lead.nome} | ${lead.categoria?.toUpperCase()}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Notificações assíncronas (não bloqueiam a resposta)
    const { data: marcaInfo } = await supabase
      .from('marcas')
      .select('nome, emoji')
      .eq('id', lead.id_marca)
      .single()

    if (marcaInfo) {
      notificarNovoLead(lead, marcaInfo).catch(err =>
        console.warn('[Leads] E-mail não enviado:', err.message)
      )
    }

    res.json({ success: true, message: 'Lead recebido com sucesso!', leadId: lead.id })
  } catch (err) {
    console.error('[Leads] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao processar lead' })
  }
})

// ─────────────────────────────────────────────
// POST /api/leads/google-forms
// Integração com Google Forms via webhook
// ─────────────────────────────────────────────
router.post('/google-forms', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('[Leads/GoogleForms] Lead recebido')

    const form = req.body

    // Mapeamento flexível de campos (suporta múltiplos rótulos do Google Forms)
    const nome     = form.nome     || form['Nome completo']   || form.name     || ''
    const email    = form.email    || form['E-mail']          || form['E-mail address'] || ''
    const telefone = normalizarTelefone(
      form.telefone || form['WhatsApp'] || form.whatsapp || ''
    )
    const marca_id  = form.marca_id
    const tenant_id = form.tenant_id || process.env.DEFAULT_TENANT_ID || ''

    // Validações
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

    // Capital e scoring
    const capitalRaw = form.capital || form['Capital disponível'] || form.capital_disponivel || '0'
    const { capital, score, categoria } = processarCapital(capitalRaw)

    // Documento opcional
    const documentoRaw  = form.documento || form['CPF ou CNPJ'] || form.cpf_cnpj || ''
    const docInfo        = documentoRaw ? validarDocumento(documentoRaw) : null

    // Observação enriquecida
    const mensagem   = form.mensagem || form['Mensagem'] || form.message || ''
    const observacao = [
      `Capital: R$ ${capital.toLocaleString('pt-BR')}`,
      `Origem: Google Forms`,
      mensagem ? `Mensagem: ${mensagem}` : null,
    ].filter(Boolean).join(' | ')

    const leadData = {
      tenant_id,
      id_marca: marca_id,
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
      observacao:         sanitizarTexto(observacao, 500),
    }

    // Verificar duplicata (janela de 24 horas)
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
        console.warn(`[Leads/GoogleForms] Duplicata detectada (${Math.round(horasAtras)}h atrás): ${email}`)
        return res.json({
          success:   true,
          message:   'Lead já existente (menos de 24h)',
          leadId:    existente[0].id,
          duplicado: true,
        })
      }
    }

    const { data, error } = await supabase.from('leads').insert([leadData]).select()
    if (error) throw error

    const lead = data[0]
    console.log(`[Leads/GoogleForms] Salvo: ${lead.id} | score ${lead.score} | ${lead.categoria?.toUpperCase()}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    res.json({
      success:   true,
      message:   'Lead do Google Forms recebido!',
      leadId:    lead.id,
      score:     lead.score,
      categoria: lead.categoria,
    })
  } catch (err) {
    console.error('[Leads/GoogleForms] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao processar lead do Google Forms' })
  }
})

// ─────────────────────────────────────────────
// GET /api/leads/google-forms/health
// ─────────────────────────────────────────────
router.get('/google-forms/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'Google Forms Integration',
    timestamp: new Date().toISOString(),
  })
})

// ─────────────────────────────────────────────
// POST /api/leads/sistema
// Lead captado pela landing page institucional do LeadCapture Pro
// ─────────────────────────────────────────────
router.post('/sistema', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('[Leads/Sistema] Novo prospect do produto')

    const { nome, email, telefone, companhia, cidade, estado, observacao } = req.body

    const { valido, campoFaltando } = validarCamposObrigatorios(
      { nome, email, telefone },
      ['nome', 'email', 'telefone']
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
        nome:      sanitizarTexto(nome),
        email:     email.trim().toLowerCase(),
        telefone:  normalizarTelefone(telefone),
        companhia: sanitizarTexto(companhia || ''),
        cidade:    sanitizarTexto(cidade    || ''),
        estado:    sanitizarTexto(estado    || ''),
        observacao: sanitizarTexto(observacao || ''),
        fonte:     req.body.fonte || 'captacao-landing',
        status:    'novo',
        tenant_id: '81cac3a4-caa3-43b2-be4d-d16557d7ef88', // ID fixo do LeadCapture Pro (Admin)
      }])
      .select()

    if (error) throw error

    const lead = data[0]
    console.log(`[Leads/Sistema] Prospect salvo: ${lead.id} | ${lead.nome}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    notificarNovoLead(lead, { nome: 'LeadCapture Pro', emoji: '🚀' }).catch(err =>
      console.warn('[Leads/Sistema] E-mail não enviado:', err.message)
    )

    res.json({ success: true, message: 'Recebemos seu contato! Em breve nossa equipe entrará em contato.', leadId: lead.id })
  } catch (err) {
    console.error('[Leads/Sistema] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao processar prospect' })
  }
})

export default router
