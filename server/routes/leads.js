import { Router } from 'express'
import supabase from '../core/database.js'
import { processarCapital, resolverCapital } from '../core/scoring.js'
import {
  isEmailValido,
  isTelefoneValido,
  validarDocumento,
  validarCamposObrigatorios,
  normalizarTelefone,
  sanitizarTexto,
} from '../core/validation.js'
import { notificarNovoLead, notificarLeadQuente, enviarBoasVindasLead } from '../comunicacao/email.js'
import { enviarBoasVindas } from '../comunicacao/whatsapp.js'
import { validateLead, validateLeadSistema, validateGoogleForms } from '../middleware/validateLead.js'

const router = Router()

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

    // âœ… Queries em paralelo â€” logo da marca + todos os usuÃ¡rios que recebem notificaÃ§Ã£o
    const [{ data: marcaInfo }, { data: usuariosNotif }] = await Promise.all([
      supabase.from('marcas').select('nome, emoji, logo_url, tenant_id').eq('id', lead.id_marca).single(),
      supabase.from('usuarios')
        .select('email, role')
        .eq('tenant_id', lead.tenant_id)
        .in('role', ['Diretor', 'Gestor', 'Administrador', 'admin'])
        .eq('active', true),
    ])

    const marcaFallback   = marcaInfo || { nome: 'LeadCapture Pro', emoji: 'ðŸš€', logo_url: null }
    const emailsNotif     = (usuariosNotif || [])
      .map(u => u.email)
      .filter(e => e && e.includes('@') && !e.endsWith('.local') && !e.includes('demo-') && !e.includes('fake'))

    // â”€â”€ Helper: retry com log no banco â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async function comRetry(fn, tipo, maxTentativas = 3) {
      for (let t = 1; t <= maxTentativas; t++) {
        try {
          await fn()
          // Loga sucesso no banco
          supabase.from('notification_logs').insert([{
            lead_id:   lead.id,
            tenant_id: lead.tenant_id,
            tipo,
            status:    'sucesso',
            tentativas: t,
          }]).catch(() => {})
          return true
        } catch (err) {
          console.warn(`[Leads] ${tipo} tentativa ${t}/${maxTentativas}: ${err.message}`)
          if (t === maxTentativas) {
            supabase.from('notification_logs').insert([{
              lead_id:   lead.id,
              tenant_id: lead.tenant_id,
              tipo,
              status:    'erro',
              erro:       err.message,
              tentativas: maxTentativas,
            }]).catch(() => {})
          } else {
            await new Promise(r => setTimeout(r, 1000 * t))
          }
        }
      }
      return false
    }

    // â”€â”€ Responde ao cliente IMEDIATAMENTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // NotificaÃ§Ãµes disparam em background â€” nÃ£o bloqueiam a resposta
    res.json({ success: true, message: 'Lead recebido com sucesso!', leadId: lead.id, score: lead.score, categoria: lead.categoria })

    // â”€â”€ Dispara notificaÃ§Ãµes em background (fire & forget seguro) â”€â”€
    // setImmediate garante que o res.json jÃ¡ foi enviado antes de comeÃ§ar
    setImmediate(async () => {
      const notifPromises = []

      // 1. Boas-vindas para o LEAD (email dele)
      if (lead.email?.includes('@')) {
        notifPromises.push(
          comRetry(() => enviarBoasVindasLead(lead, marcaFallback), 'email-boas-vindas-lead')
        )
      }

      // 2. NotificaÃ§Ã£o interna para a equipe
      notifPromises.push(
        comRetry(() => notificarNovoLead(lead, marcaFallback, emailsNotif), 'email-notificacao-interna')
      )

      // 3. Lead quente para diretores
      if (lead.score >= 65) {
        notifPromises.push(
          comRetry(() => notificarLeadQuente(lead, marcaFallback, emailsNotif), 'email-lead-quente')
        )
      }

      await Promise.allSettled(notifPromises)

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
            capital:   lead.capital_disponivel,
            regiao:    lead.regiao_interesse,
            marca:     marcaFallback.nome,
            tenant_id: lead.tenant_id,
            fonte:     lead.fonte,
            timestamp: new Date().toISOString(),
          }),
        }).catch(err => console.warn('[Leads] N8N webhook:', err.message))
      }
    })
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
    const { nome, email, telefone, empresa, companhia, cidade, estado, observacao } = req.body

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
        companhia:  sanitizarTexto(empresa || companhia || ''),
        cidade:     sanitizarTexto(cidade    || ''),
        estado:     sanitizarTexto(estado    || ''),
        observacao: sanitizarTexto(observacao || ''),
        fonte:      req.body.fonte || 'captacao-landing',
        status:     'novo',
        tenant_id:  process.env.SISTEMA_TENANT_ID || '81cac3a4-caa3-43b2-be4d-d16557d7ef88',
      }])
      .select()

    if (error) throw error

    const lead = data[0]
    console.log(`[Leads/Sistema] Prospect salvo: ${lead.id} | ${lead.nome}`)

    notificarNovoLead(lead, { nome: 'LeadCapture Pro', emoji: 'ðŸš€' }).catch(err =>
      console.warn('[Leads/Sistema] E-mail nao enviado:', err.message)
    )

    res.json({ success: true, message: 'Recebemos seu contato! Em breve nossa equipe entrara em contato.', leadId: lead.id })
  } catch (err) {
    console.error('[Leads/Sistema] Erro:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao processar prospect' })
  }
})

router.put("/:id/assign-consultant", async (req, res) => {
  try {
    const { id } = req.params;
    const { consultantId } = req.body;

    // 1. AutenticaÃ§Ã£o e AutorizaÃ§Ã£o
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({ success: false, error: "Token de autenticaÃ§Ã£o obrigatÃ³rio" });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: "Token invÃ¡lido ou expirado" });
    }

    // Verificar se o usuÃ¡rio tem permissÃ£o para atribuir consultores
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("role, is_super_admin, tenant_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return res.status(403).json({ success: false, error: "UsuÃ¡rio nÃ£o autorizado ou nÃ£o encontrado" });
    }

    const allowedRoles = ["Diretor", "Gestor", "Administrador", "admin"];
    const hasPermission = allowedRoles.includes(userData.role) || userData.is_super_admin;

    if (!hasPermission) {
      return res.status(403).json({ success: false, error: "PermissÃ£o negada. Apenas Diretores, Gestores e Administradores podem atribuir consultores." });
    }

    // 2. Validar Lead e Consultor
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, tenant_id")
      .eq("id", id)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ success: false, error: "Lead nÃ£o encontrado" });
    }

    // Garantir que o usuÃ¡rio sÃ³ pode atribuir leads do seu prÃ³prio tenant (a menos que seja super admin)
    if (!userData.is_super_admin && lead.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ success: false, error: "PermissÃ£o negada. VocÃª sÃ³ pode atribuir leads do seu prÃ³prio tenant." });
    }

    // Validar se o consultantId Ã© um usuÃ¡rio vÃ¡lido e consultor/gestor/diretor
    const { data: consultantData, error: consultantError } = await supabase
      .from("usuarios")
      .select("id, role, tenant_id")
      .eq("id", consultantId)
      .single();

    if (consultantError || !consultantData) {
      return res.status(400).json({ success: false, error: "Consultor invÃ¡lido ou nÃ£o encontrado" });
    }

    const validConsultantRoles = ["Consultor", "Gestor", "Diretor", "Administrador"];
    if (!validConsultantRoles.includes(consultantData.role)) {
      return res.status(400).json({ success: false, error: "O ID fornecido nÃ£o corresponde a um consultor, gestor ou diretor vÃ¡lido." });
    }

    // Garantir que o consultor pertence ao mesmo tenant do lead (a menos que seja super admin)
    if (!userData.is_super_admin && consultantData.tenant_id !== lead.tenant_id) {
      return res.status(403).json({ success: false, error: "NÃ£o Ã© possÃ­vel atribuir um consultor de outro tenant." });
    }

    // 3. Atribuir Consultor
    const { error: updateError } = await supabase
      .from("leads")
      .update({ operador_id: consultantId, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) throw updateError;

    console.log(`[Leads] Lead ${id} atribuÃ­do ao consultor ${consultantId} por ${user.email}`);
    res.json({ success: true, message: "Consultor atribuÃ­do com sucesso!" });

  } catch (err) {
    console.error("[Leads/AssignConsultant] Erro:", err.message);
    res.status(500).json({ success: false, error: "Erro interno ao atribuir consultor", detalhe: err.message });
  }
});

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
      operador_id:             consultantId,
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

export default router

