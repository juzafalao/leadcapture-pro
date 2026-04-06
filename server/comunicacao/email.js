// ============================================================
// COMUNICACAO — Serviço de E-mail
// LeadCapture Pro — Zafalão Tech
//
// Provedor: Resend (emails em 2 segundos)
// Fallback: Nodemailer SMTP (Gmail)
// ============================================================

import nodemailer from 'nodemailer'

let transporter = null

// Inicializa SMTP como fallback se não tiver Resend
export function inicializarEmail() {
  if (process.env.RESEND_API_KEY) {
    console.log('[Email] Usando Resend — emails em 2 segundos')
    return
  }
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
    console.log('[Email] Nodemailer SMTP inicializado')
  } catch (err) {
    console.warn('[Email] SMTP não configurado — modo simulado ativo')
  }
}

// ── Envio via Resend ──────────────────────────────────────────
async function enviarViaResend(to, subject, html) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  // Plano gratuito Resend: apenas onboarding@resend.dev funciona sem domínio verificado
  const from = process.env.RESEND_FROM || 'LeadCapture Pro <onboarding@resend.dev>'
  const { data, error } = await resend.emails.send({ from, to, subject, html })
  if (error) throw new Error(error.message)
  return data
}

// ── Envio via Nodemailer ──────────────────────────────────────
async function enviarViaSMTP(to, subject, html) {
  if (!transporter) {
    console.log('[Email] [SIMULADO]', subject, '->', to)
    return { simulated: true }
  }
  await transporter.sendMail({
    from:    `"LeadCapture Pro" <${process.env.SMTP_USER}>`,
    to, subject, html,
  })
}

// ── Dispatcher principal ──────────────────────────────────────
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

  const badgeCor = lead.categoria === 'hot' ? '#dc2626'
    : lead.categoria === 'warm' ? '#d97706' : '#2563eb'
  const badgeLabel = (lead.categoria || 'cold').toUpperCase()

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head><body style="margin:0;padding:24px;background:#0d0d0f;font-family:Arial,sans-serif;">
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
    ${row('Nome', lead.nome)}
    ${row('E-mail', `<a href="mailto:${lead.email}" style="color:#60a5fa;">${lead.email}</a>`)}
    ${row('WhatsApp', `<a href="https://wa.me/55${telDigitos}" style="color:#60a5fa;">${lead.telefone}</a>`)}
    ${row('Capital Disponível', capital)}
    ${lead.regiao_interesse ? row('Região', lead.regiao_interesse) : ''}
    ${row('Origem', lead.fonte || 'landing-page')}
    ${row('Data/Hora', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))}
  </div>
  <div style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="color:#71717a;font-size:12px;margin:0 0 12px;">LeadCapture Pro — Zafalão Tech</p>
    <a href="${process.env.DASHBOARD_URL || 'https://leadcapture-proprod.vercel.app'}" style="background:#ee7b4d;color:#000;font-weight:700;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;display:inline-block;">Abrir Dashboard</a>
  </div>
</div></body></html>`
}

function templateLeadQuente(lead, marca) {
  const capital = lead.capital_disponivel
    ? 'R$ ' + Number(lead.capital_disponivel).toLocaleString('pt-BR')
    : 'Não informado'
  const telDigitos = String(lead.telefone ?? '').replace(/\D/g, '')

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head><body style="margin:0;padding:24px;background:#0a0a0a;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#18181b;border-radius:16px;overflow:hidden;border:2px solid #f97316;">
  <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;text-align:center;">
    <div style="font-size:56px;margin-bottom:8px;">🔥</div>
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">Lead Quente Detectado!</h1>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">${marca.nome} — LeadCapture Pro</p>
  </div>
  <div style="padding:28px 32px;">
    <div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:8px;padding:14px 16px;margin-bottom:20px;color:#f97316;font-size:13px;font-weight:600;text-align:center;">
      ⚡ Entre em contato AGORA — leads quentes esfriam rápido!
    </div>
    <div style="background:#27272a;border-radius:8px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Score do Lead</div>
        <div style="font-size:48px;font-weight:900;color:#f97316;line-height:1;">${lead.score}</div>
      </div>
      <span style="background:#f97316;color:#fff;padding:8px 18px;border-radius:20px;font-weight:900;font-size:14px;">🔥 HOT</span>
    </div>
    ${row('Nome', lead.nome, '#f97316')}
    ${row('E-mail', `<a href="mailto:${lead.email}" style="color:#60a5fa;">${lead.email}</a>`, '#f97316')}
    ${row('WhatsApp', `<a href="https://wa.me/55${telDigitos}" style="color:#60a5fa;">${lead.telefone}</a>`, '#f97316')}
    ${row('Capital Disponível', capital, '#f97316')}
    ${lead.regiao_interesse ? row('Região', lead.regiao_interesse, '#f97316') : ''}
    ${row('Marca', `${marca.emoji || ''} ${marca.nome}`, '#f97316')}
    ${row('Horário', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), '#f97316')}
  </div>
  <div style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <a href="${process.env.DASHBOARD_URL || 'https://leadcapture-proprod.vercel.app'}" style="background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;">Abrir Dashboard Agora →</a>
  </div>
</div></body></html>`
}

function row(label, value, cor = '#ee7b4d') {
  return `<div style="background:rgba(255,255,255,0.04);border-left:3px solid ${cor};border-radius:8px;padding:12px 16px;margin-bottom:10px;">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${cor};">${label}</div>
    <div style="font-size:15px;color:#f4f4f5;margin-top:3px;">${value}</div>
  </div>`
}

// ── Exports ───────────────────────────────────────────────────
export async function notificarNovoLead(lead, marca) {
  const to = process.env.NOTIFICATION_EMAIL || 'leadcaptureadm@gmail.com'
  const emoji = lead.categoria === 'hot' ? '🔥' : lead.categoria === 'warm' ? '🌤' : '❄️'
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
  const notif = process.env.NOTIFICATION_EMAIL || 'leadcaptureadm@gmail.com'
  const extras = (emailsDiretores || []).filter(e =>
    e && e.includes('@') && !e.endsWith('.local') && !e.includes('demo-')
  )
  const todos = [...new Set([notif, ...extras])]
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
