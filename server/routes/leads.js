import { Router } from 'express'
import supabase from '../core/database.js'
import { processarCapital } from '../core/scoring.js'
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
      const { score, categoria } = processarCapital(leadData.capital_disponivel)
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

    const { data, error } = await supabase.from('leads').insert([leadData]).select()
    if (error) throw error

    const lead = data[0]
    console.log(`[Leads] Salvo: ${lead.id} | ${lead.nome} | score ${lead.score} | ${lead.categoria?.toUpperCase()}`)

    const { data: marcaInfo } = await supabase
      .from('marcas').select('nome, emoji, tenant_id').eq('id', lead.id_marca).single()

    if (marcaInfo) {
      const { data: diretores } = await supabase
        .from('usuarios')
        .select('email')
        .eq('tenant_id', lead.tenant_id)
        .eq('role', 'Diretor')
        .eq('active', true)

      const emailsDiretores = (diretores || []).map(d => d.email).filter(Boolean)

      notificarNovoLead(lead, marcaInfo).catch(err =>
        console.warn('[Leads] E-mail notificacao:', err.message)
      )

      if (lead.score >= 65) {
        notificarLeadQuente(lead, marcaInfo, emailsDiretores).catch(err =>
          console.warn('[Leads] E-mail lead quente:', err.message)
        )
      }

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
            capital:   lead.capital_disponivel,
            regiao:    lead.regiao_interesse,
            marca:     marcaInfo.nome,
            tenant_id: lead.tenant_id,
            fonte:     lead.fonte,
            timestamp: new Date().toISOString(),
          })
        }).catch(err => console.warn('[Leads] N8N webhook:', err.message))
      }
    }

    res.json({ success: true, message: 'Lead recebido com sucesso!', leadId: lead.id, score: lead.score, categoria: lead.categoria })
  } catch (err) {
    console.error('[Leads] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao processar lead', detalhe: err.message })
  }
})

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
    const { capital, score, categoria } = processarCapital(capitalRaw)

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
          success: true, message: 'Lead ja existente (menos de 24h)',
          leadId: existente[0].id, duplicado: true,
        })
      }
    }

    const { data, error } = await supabase.from('leads').insert([leadData]).select()
    if (error) throw error

    const lead = data[0]
    console.log(`[Leads/GoogleForms] Salvo: ${lead.id} | score ${lead.score} | ${lead.categoria?.toUpperCase()}`)

    res.json({
      success: true, message: 'Lead do Google Forms recebido!',
      leadId: lead.id, score: lead.score, categoria: lead.categoria,
    })
  } catch (err) {
    console.error('[Leads/GoogleForms] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao processar lead do Google Forms' })
  }
})

router.get('/google-forms/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Google Forms Integration', timestamp: new Date().toISOString() })
})

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
      .select()

    if (error) throw error

    const lead = data[0]
    console.log(`[Leads/Sistema] Prospect salvo: ${lead.id} | ${lead.nome}`)

    notificarNovoLead(lead, { nome: 'LeadCapture Pro', emoji: '🚀' }).catch(err =>
      console.warn('[Leads/Sistema] E-mail nao enviado:', err.message)
    )

    res.json({ success: true, message: 'Recebemos seu contato! Em breve nossa equipe entrara em contato.', leadId: lead.id })
  } catch (err) {
    console.error('[Leads/Sistema] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao processar prospect' })
  }
})

export default router