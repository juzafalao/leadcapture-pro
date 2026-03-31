// ============================================================
// COMUNICACAO - Servico de E-mail
// Notificacoes por e-mail para novos leads
// ============================================================

import nodemailer from 'nodemailer'

let transporter = null

export function inicializarEmail() {
  try {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    console.log('[Email] Servico inicializado')
  } catch (err) {
    console.warn('[Email] SMTP nao configurado - modo simulado ativo')
  }
}

function renderizarEmailNovoLead(lead, marca) {
  const telefoneDigitos = String(lead.telefone ?? '').replace(/\D/g, '')
  const capital = lead.capital_disponivel
    ? 'R$ ' + Number(lead.capital_disponivel).toLocaleString('pt-BR')
    : 'Nao informado'

  const badge = lead.categoria === 'hot'
    ? '<span style="background:#dc2626;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">HOT</span>'
    : lead.categoria === 'warm'
    ? '<span style="background:#d97706;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">WARM</span>'
    : '<span style="background:#2563eb;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">COLD</span>'

  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>'
    + 'body{font-family:Arial,sans-serif;background:#0d0d0f;margin:0;padding:24px;}'
    + '.card{max-width:560px;margin:0 auto;background:#18181b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);}'
    + '.header{background:linear-gradient(135deg,#ee7b4d,#f59e42);padding:28px 32px;text-align:center;}'
    + '.header h1{color:#000;margin:0;font-size:20px;font-weight:900;}'
    + '.header p{color:rgba(0,0,0,0.65);margin:4px 0 0;font-size:13px;}'
    + '.body{padding:28px 32px;}'
    + '.badge-row{margin-bottom:20px;}'
    + '.row{background:rgba(255,255,255,0.04);border-left:3px solid #ee7b4d;border-radius:8px;padding:12px 16px;margin-bottom:10px;}'
    + '.label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#ee7b4d;}'
    + '.value{font-size:15px;color:#f4f4f5;margin-top:3px;}'
    + '.value a{color:#60a5fa;text-decoration:none;}'
    + '.footer{padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);}'
    + '.cta{display:inline-block;margin-top:12px;background:#ee7b4d;color:#000;font-weight:700;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;}'
    + '</style></head><body><div class="card">'
    + '<div class="header"><div style="font-size:48px;margin-bottom:8px;">' + (marca.emoji || '') + '</div>'
    + '<h1>Novo Lead Capturado</h1><p>' + marca.nome + ' - LeadCapture Pro</p></div>'
    + '<div class="body"><div class="badge-row">' + badge
    + ' <span style="color:#71717a;font-size:13px;">Score: <strong style="color:#f4f4f5">' + (lead.score ?? 50) + '</strong></span></div>'
    + '<div class="row"><div class="label">Nome</div><div class="value">' + lead.nome + '</div></div>'
    + '<div class="row"><div class="label">E-mail</div><div class="value"><a href="mailto:' + lead.email + '">' + lead.email + '</a></div></div>'
    + '<div class="row"><div class="label">WhatsApp</div><div class="value"><a href="https://wa.me/55' + telefoneDigitos + '">' + lead.telefone + '</a></div></div>'
    + '<div class="row"><div class="label">Capital Disponivel</div><div class="value">' + capital + '</div></div>'
    + (lead.regiao_interesse ? '<div class="row"><div class="label">Regiao</div><div class="value">' + lead.regiao_interesse + '</div></div>' : '')
    + '<div class="row"><div class="label">Origem</div><div class="value">' + (lead.fonte || 'landing-page') + '</div></div>'
    + '<div class="row"><div class="label">Data/Hora</div><div class="value">' + new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + '</div></div>'
    + '</div><div class="footer"><p><strong style="color:#e4e4e7">LeadCapture Pro</strong> - Zafalao Tech</p>'
    + '<a class="cta" href="' + (process.env.DASHBOARD_URL || 'https://leadcapture-proprod.vercel.app') + '" target="_blank">Abrir Dashboard</a>'
    + '</div></div></body></html>'
}

function renderizarEmailLeadQuente(lead, marca) {
  const telefoneDigitos = String(lead.telefone ?? '').replace(/\D/g, '')
  const capital = lead.capital_disponivel
    ? 'R$ ' + Number(lead.capital_disponivel).toLocaleString('pt-BR')
    : 'Nao informado'

  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>'
    + 'body{font-family:Arial,sans-serif;background:#0a0a0a;margin:0;padding:24px;}'
    + '.card{max-width:560px;margin:0 auto;background:#18181b;border-radius:16px;overflow:hidden;border:2px solid #f97316;}'
    + '.header{background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;text-align:center;}'
    + '.header h1{color:#fff;margin:0;font-size:24px;font-weight:900;}'
    + '.header p{color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;}'
    + '.body{padding:28px 32px;}'
    + '.score-bar{background:#27272a;border-radius:8px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;}'
    + '.score-num{font-size:48px;font-weight:900;color:#f97316;line-height:1;}'
    + '.score-label{font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;}'
    + '.hot-badge{background:#f97316;color:#fff;padding:8px 18px;border-radius:20px;font-weight:900;font-size:14px;}'
    + '.row{background:rgba(255,255,255,0.04);border-left:3px solid #f97316;border-radius:8px;padding:12px 16px;margin-bottom:10px;}'
    + '.label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#f97316;}'
    + '.value{font-size:15px;color:#f4f4f5;margin-top:3px;}'
    + '.value a{color:#60a5fa;text-decoration:none;}'
    + '.alerta{background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:8px;padding:14px 16px;margin-bottom:20px;color:#f97316;font-size:13px;font-weight:600;text-align:center;}'
    + '.footer{padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);}'
    + '.cta{display:inline-block;margin-top:12px;background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;}'
    + '</style></head><body><div class="card">'
    + '<div class="header"><div style="font-size:56px;margin-bottom:8px;">🔥</div>'
    + '<h1>Lead Quente Detectado!</h1><p>' + marca.nome + ' - LeadCapture Pro</p></div>'
    + '<div class="body"><div class="alerta">Entre em contato AGORA - leads quentes esfriam rapido!</div>'
    + '<div class="score-bar"><div><div class="score-label">Score do Lead</div><div class="score-num">' + lead.score + '</div></div>'
    + '<div class="hot-badge">🔥 HOT LEAD</div></div>'
    + '<div class="row"><div class="label">Nome</div><div class="value">' + lead.nome + '</div></div>'
    + '<div class="row"><div class="label">E-mail</div><div class="value"><a href="mailto:' + lead.email + '">' + lead.email + '</a></div></div>'
    + '<div class="row"><div class="label">WhatsApp</div><div class="value"><a href="https://wa.me/55' + telefoneDigitos + '">' + lead.telefone + '</a></div></div>'
    + '<div class="row"><div class="label">Capital Disponivel</div><div class="value">' + capital + '</div></div>'
    + (lead.regiao_interesse ? '<div class="row"><div class="label">Regiao</div><div class="value">' + lead.regiao_interesse + '</div></div>' : '')
    + '<div class="row"><div class="label">Marca</div><div class="value">' + (marca.emoji || '') + ' ' + marca.nome + '</div></div>'
    + '<div class="row"><div class="label">Horario</div><div class="value">' + new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + '</div></div>'
    + '</div><div class="footer"><p style="color:#71717a;font-size:12px;">LeadCapture Pro - Zafalao Tech</p>'
    + '<a class="cta" href="' + (process.env.DASHBOARD_URL || 'https://leadcapture-proprod.vercel.app') + '" target="_blank">Abrir Dashboard Agora</a>'
    + '</div></div></body></html>'
}

export async function notificarNovoLead(lead, marca) {
  const destinatario = process.env.NOTIFICATION_EMAIL || 'leadcaptureadm@gmail.com'

  if (!transporter) {
    console.log('[Email] [SIMULADO] novo lead ->', destinatario, '|', lead.nome)
    return { success: true, simulated: true }
  }

  try {
    await transporter.sendMail({
      from:    '"LeadCapture Pro" <' + process.env.SMTP_USER + '>',
      to:      destinatario,
      subject: (lead.categoria === 'hot' ? '🔥' : lead.categoria === 'warm' ? '🌤' : '❄️') + ' Novo Lead: ' + lead.nome + ' — ' + marca.nome,
      html:    renderizarEmailNovoLead(lead, marca),
    })
    console.log('[Email] Enviado para:', destinatario)
    return { success: true }
  } catch (err) {
    console.error('[Email] Falha:', err.message)
    return { success: false, error: err.message }
  }
}

export async function notificarLeadQuente(lead, marca, emailsDiretores = []) {
  const notificationEmail = process.env.NOTIFICATION_EMAIL || 'leadcaptureadm@gmail.com'

  // Sempre inclui NOTIFICATION_EMAIL + emails reais dos diretores (filtra emails falsos)
  const emailsReais = emailsDiretores.filter(e =>
    e && e.includes('@') && !e.endsWith('.local') && !e.includes('demo-') && !e.includes('fake')
  )
  const todosDestinatarios = [...new Set([notificationEmail, ...emailsReais])]
  const destinatarios = todosDestinatarios.join(',')

  if (!transporter) {
    console.log('[Email] [SIMULADO] lead quente ->', destinatarios, '| score:', lead.score)
    return { success: true, simulated: true }
  }

  try {
    await transporter.sendMail({
      from:    '"LeadCapture Pro" <' + process.env.SMTP_USER + '>',
      to:      destinatarios,
      subject: '🔥 LEAD QUENTE! ' + lead.nome + ' — Score ' + lead.score + ' — ' + marca.nome,
      html:    renderizarEmailLeadQuente(lead, marca),
    })
    console.log('[Email] Lead quente enviado para:', destinatarios)
    return { success: true }
  } catch (err) {
    console.error('[Email] Falha lead quente:', err.message)
    return { success: false, error: err.message }
  }
}