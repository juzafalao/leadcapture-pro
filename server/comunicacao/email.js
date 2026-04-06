// ============================================================
// COMUNICACAO — Serviço de E-mail
// LeadCapture Pro — Zafalão Tech
//
// Resend gratuito: só envia para email da própria conta
// Para enviar para qualquer email: verificar domínio no Resend
// Fallback: Nodemailer SMTP (Gmail)
// ============================================================

import nodemailer from 'nodemailer'

let transporter = null

export function inicializarEmail() {
  if (process.env.RESEND_API_KEY) {
    console.log('[Email] Resend configurado')
    return
  }
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[Email] SMTP não configurado — emails em modo simulado')
      return
    }
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    console.log('[Email] Nodemailer SMTP inicializado')
  } catch (err) {
    console.warn('[Email] Falha ao inicializar SMTP:', err.message)
  }
}

// ── Envio via Resend ──────────────────────────────────────────
async function enviarViaResend(to, subject, html) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Plano gratuito: remetente deve ser onboarding@resend.dev
  // Para usar domínio próprio: verificar em resend.com/domains
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev'

  // Resend gratuito só envia para o email da conta registrada
  // Se RESEND_VERIFIED=true, pode enviar para qualquer email
  const destinatario = process.env.RESEND_VERIFIED === 'true'
    ? to
    : (process.env.RESEND_TEST_EMAIL || process.env.NOTIFICATION_EMAIL || to)

  console.log(`[Email/Resend] Enviando para: ${destinatario} | from: ${from}`)

  const { data, error } = await resend.emails.send({
    from,
    to:      destinatario,
    subject,
    html,
  })

  if (error) {
    console.error('[Email/Resend] Erro:', JSON.stringify(error))
    throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`)
  }

  console.log('[Email/Resend] Enviado com sucesso. ID:', data?.id)
  return data
}

// ── Envio via SMTP ────────────────────────────────────────────
async function enviarViaSMTP(to, subject, html) {
  if (!transporter) {
    console.log('[Email/SMTP] Simulado:', subject, '->', to)
    return { simulated: true }
  }
  const info = await transporter.sendMail({
    from:    `"LeadCapture Pro" <${process.env.SMTP_USER}>`,
    to, subject, html,
  })
  console.log('[Email/SMTP] Enviado:', info.messageId)
  return info
}

// ── Dispatcher ────────────────────────────────────────────────
async function enviar(to, subject, html) {
  if (process.env.RESEND_API_KEY) {
    return enviarViaResend(to, subject, html)
  }
  return enviarViaSMTP(to, subject, html)
}

// ── Templates ─────────────────────────────────────────────────
function templateNovoLead(lead, marca) {
  const capital = lead.capital_disponivel
    ? 'R$ ' + Number(lead.capital_disponivel).toLocaleString('pt-BR')
    : 'Não informado'
  const telDigitos = String(lead.telefone ?? '').replace(/\D/g, '')
  const badgeCor   = lead.categoria === 'hot' ? '#dc2626' : lead.categoria === 'warm' ? '#d97706' : '#2563eb'
  const badgeLabel = (lead.categoria || 'cold').toUpperCase()

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#0d0d0f;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#18181b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
  <div style="background:linear-gradient(135deg,#ee7b4d,#f59e42);padding:28px 32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">${marca.emoji || '🚀'}</div>
    <h1 style="color:#000;margin:0;font-size:20px;font-weight:900;">Novo Lead Capturado</h1>
    <p style="color:rgba(0,0,0,0.65);margin:4px 0 0;font-size:13px;">${marca.nome} — LeadCapture Pro</p>
  </div>
  <div style="padding:28px 32px;">
    <div style="margin-bottom:20px;">
      <span style="background:${badgeCor};color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:900;">${badgeLabel}</span>
      <span style="color:#71717a;font-size:13px;margin-left:8px;">Score: <strong style="color:#f4f4f5">${lead.score ?? 50}</strong></span>
    </div>
    <div style="background:rgba(255,255,255,0.04);border-left:3px solid #ee7b4d;border-radius:8px;padding:12px 16px;margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#ee7b4d;">Nome</div>
      <div style="font-size:15px;color:#f4f4f5;margin-top:3px;">${lead.nome}</div>
    </div>
    <div style="background:rgba(255,255,255,0.04);border-left:3px solid #ee7b4d;border-radius:8px;padding:12px 16px;margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#ee7b4d;">E-mail</div>
      <div style="font-size:15px;color:#f4f4f5;margin-top:3px;"><a href="mailto:${lead.email}" style="color:#60a5fa;">${lead.email}</a></div>
    </div>
    <div style="background:rgba(255,255,255,0.04);border-left:3px solid #ee7b4d;border-radius:8px;padding:12px 16px;margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#ee7b4d;">WhatsApp</div>
      <div style="font-size:15px;color:#f4f4f5;margin-top:3px;"><a href="https://wa.me/55${telDigitos}" style="color:#60a5fa;">${lead.telefone}</a></div>
    </div>
    <div style="background:rgba(255,255,255,0.04);border-left:3px solid #ee7b4d;border-radius:8px;padding:12px 16px;margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#ee7b4d;">Capital Disponível</div>
      <div style="font-size:15px;color:#f4f4f5;margin-top:3px;">${capital}</div>
    </div>
    ${lead.regiao_interesse ? `<div style="background:rgba(255,255,255,0.04);border-left:3px solid #ee7b4d;border-radius:8px;padding:12px 16px;margin-bottom:10px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#ee7b4d;">Região</div><div style="font-size:15px;color:#f4f4f5;margin-top:3px;">${lead.regiao_interesse}</div></div>` : ''}
    <div style="background:rgba(255,255,255,0.04);border-left:3px solid #ee7b4d;border-radius:8px;padding:12px 16px;margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#ee7b4d;">Data/Hora</div>
      <div style="font-size:15px;color:#f4f4f5;margin-top:3px;">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>
    </div>
  </div>
  <div style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <a href="${process.env.DASHBOARD_URL || 'https://leadcapture-proprod.vercel.app'}" style="background:#ee7b4d;color:#000;font-weight:700;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;display:inline-block;">Abrir Dashboard</a>
  </div>
</div></body></html>`
}

function templateLeadQuente(lead, marca) {
  const capital    = lead.capital_disponivel ? 'R$ ' + Number(lead.capital_disponivel).toLocaleString('pt-BR') : 'Não informado'
  const telDigitos = String(lead.telefone ?? '').replace(/\D/g, '')

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#0a0a0a;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#18181b;border-radius:16px;overflow:hidden;border:2px solid #f97316;">
  <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;text-align:center;">
    <div style="font-size:56px;margin-bottom:8px;">🔥</div>
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">Lead Quente Detectado!</h1>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">${marca.nome} — LeadCapture Pro</p>
  </div>
  <div style="padding:28px 32px;">
    <div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:8px;padding:14px;margin-bottom:20px;color:#f97316;font-size:13px;font-weight:600;text-align:center;">
      Entre em contato AGORA — leads quentes esfriam rapido!
    </div>
    <div style="background:#27272a;border-radius:8px;padding:16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:11px;color:#71717a;text-transform:uppercase;">Score</div><div style="font-size:48px;font-weight:900;color:#f97316;">${lead.score}</div></div>
      <span style="background:#f97316;color:#fff;padding:8px 18px;border-radius:20px;font-weight:900;">🔥 HOT</span>
    </div>
    <div style="background:rgba(255,255,255,0.04);border-left:3px solid #f97316;border-radius:8px;padding:12px 16px;margin-bottom:10px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#f97316;">Nome</div><div style="font-size:15px;color:#f4f4f5;margin-top:3px;">${lead.nome}</div></div>
    <div style="background:rgba(255,255,255,0.04);border-left:3px solid #f97316;border-radius:8px;padding:12px 16px;margin-bottom:10px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#f97316;">WhatsApp</div><div style="font-size:15px;color:#f4f4f5;margin-top:3px;"><a href="https://wa.me/55${telDigitos}" style="color:#60a5fa;">${lead.telefone}</a></div></div>
    <div style="background:rgba(255,255,255,0.04);border-left:3px solid #f97316;border-radius:8px;padding:12px 16px;margin-bottom:10px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#f97316;">Capital</div><div style="font-size:15px;color:#f4f4f5;margin-top:3px;">${capital}</div></div>
    ${lead.regiao_interesse ? `<div style="background:rgba(255,255,255,0.04);border-left:3px solid #f97316;border-radius:8px;padding:12px 16px;margin-bottom:10px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#f97316;">Região</div><div style="font-size:15px;color:#f4f4f5;margin-top:3px;">${lead.regiao_interesse}</div></div>` : ''}
  </div>
  <div style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <a href="${process.env.DASHBOARD_URL || 'https://leadcapture-proprod.vercel.app'}" style="background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;">Abrir Dashboard Agora</a>
  </div>
</div></body></html>`
}

// ── Exports ───────────────────────────────────────────────────
export async function notificarNovoLead(lead, marca) {
  const to      = process.env.NOTIFICATION_EMAIL || 'leadcaptureadm@gmail.com'
  const emoji   = lead.categoria === 'hot' ? '🔥' : lead.categoria === 'warm' ? '🌤' : '❄️'
  const subject = `${emoji} Novo Lead: ${lead.nome} — ${marca.nome}`
  try {
    await enviar(to, subject, templateNovoLead(lead, marca))
    console.log('[Email] Novo lead enviado para:', to)
    return { success: true }
  } catch (err) {
    console.error('[Email] Falha novo lead:', err.message)
    return { success: false, error: err.message }
  }
}

export async function notificarLeadQuente(lead, marca, emailsDiretores = []) {
  const notif   = process.env.NOTIFICATION_EMAIL || 'leadcaptureadm@gmail.com'
  const extras  = (emailsDiretores || []).filter(e => e && e.includes('@') && !e.endsWith('.local'))
  const todos   = [...new Set([notif, ...extras])]
  const subject = `🔥 LEAD QUENTE! ${lead.nome} — Score ${lead.score} — ${marca.nome}`
  try {
    await enviar(todos.join(','), subject, templateLeadQuente(lead, marca))
    console.log('[Email] Lead quente enviado para:', todos.join(', '))
    return { success: true }
  } catch (err) {
    console.error('[Email] Falha lead quente:', err.message)
    return { success: false, error: err.message }
  }
}
