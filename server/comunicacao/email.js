// ============================================================
// COMUNICAÇÃO — Serviço de E-mail
// Notificações por e-mail para novos leads
// ============================================================

import nodemailer from 'nodemailer'

let transporter = null

/**
 * Inicializa o transporter de e-mail.
 * Chamado uma única vez na inicialização da aplicação.
 */
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
    console.log('[Comunicacao/Email] Serviço de e-mail inicializado')
  } catch (err) {
    console.warn('[Comunicacao/Email] SMTP não configurado — modo simulado ativo')
  }
}

/**
 * Renderiza o template HTML do e-mail de novo lead
 */
function renderizarEmailNovoLead(lead, marca) {
  const telefoneDigitos = String(lead.telefone ?? '').replace(/\D/g, '')
  const capital = lead.capital_disponivel
    ? `R$ ${Number(lead.capital_disponivel).toLocaleString('pt-BR')}`
    : 'Não informado'

  const badge = lead.categoria === 'hot'
    ? '<span style="background:#dc2626;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">🔥 HOT</span>'
    : lead.categoria === 'warm'
    ? '<span style="background:#d97706;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">🌤 WARM</span>'
    : '<span style="background:#2563eb;color:#fff;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">❄️ COLD</span>'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body      { font-family: 'Segoe UI', Arial, sans-serif; background: #0d0d0f; margin: 0; padding: 24px; }
    .card     { max-width: 560px; margin: 0 auto; background: #18181b; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
    .header   { background: linear-gradient(135deg, #ee7b4d 0%, #f59e42 100%); padding: 28px 32px; text-align: center; }
    .header h1 { color: #000; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
    .header p  { color: rgba(0,0,0,0.65); margin: 4px 0 0; font-size: 13px; }
    .body     { padding: 28px 32px; }
    .badge-row { margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    .row      { background: rgba(255,255,255,0.04); border-left: 3px solid #ee7b4d; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; }
    .label    { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #ee7b4d; }
    .value    { font-size: 15px; color: #f4f4f5; margin-top: 3px; }
    .value a  { color: #60a5fa; text-decoration: none; }
    .footer   { padding: 20px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); }
    .footer p { color: #71717a; font-size: 11px; margin: 0 0 4px; }
    .cta      { display: inline-block; margin-top: 12px; background: #ee7b4d; color: #000; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div style="font-size:48px;margin-bottom:8px;">${marca.emoji || '🎯'}</div>
      <h1>Novo Lead Capturado</h1>
      <p>${marca.nome} · LeadCapture Pro</p>
    </div>
    <div class="body">
      <div class="badge-row">
        ${badge}
        <span style="color:#71717a;font-size:13px;">Score: <strong style="color:#f4f4f5">${lead.score ?? 50}</strong></span>
      </div>
      <div class="row">
        <div class="label">Nome</div>
        <div class="value">${lead.nome}</div>
      </div>
      <div class="row">
        <div class="label">E-mail</div>
        <div class="value"><a href="mailto:${lead.email}">${lead.email}</a></div>
      </div>
      <div class="row">
        <div class="label">WhatsApp</div>
        <div class="value">
          <a href="https://wa.me/55${telefoneDigitos}" target="_blank">${lead.telefone}</a>
        </div>
      </div>
      <div class="row">
        <div class="label">Capital Disponível</div>
        <div class="value">${capital}</div>
      </div>
      ${lead.cidade ? `
      <div class="row">
        <div class="label">Localização</div>
        <div class="value">${lead.cidade}${lead.estado ? ` — ${lead.estado}` : ''}</div>
      </div>` : ''}
      <div class="row">
        <div class="label">Origem</div>
        <div class="value">${lead.fonte || 'landing-page'}</div>
      </div>
      <div class="row">
        <div class="label">Data/Hora</div>
        <div class="value">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</div>
      </div>
    </div>
    <div class="footer">
      <p><strong style="color:#e4e4e7">LeadCapture Pro</strong> · Zafalão Tech</p>
      <p>Sistema inteligente de captação e qualificação de leads</p>
      <a class="cta" href="${process.env.DASHBOARD_URL || 'https://app.leadcapturepro.com.br'}" target="_blank">Abrir Dashboard →</a>
    </div>
  </div>
</body>
</html>`
}

/**
 * Envia notificação de novo lead por e-mail
 * @param {object} lead   - Dados do lead
 * @param {object} marca  - { nome, emoji }
 */
export async function notificarNovoLead(lead, marca) {
  const destinatario = process.env.NOTIFICATION_EMAIL || 'admin@leadcapturepro.com.br'

  if (!transporter) {
    console.log('[Comunicacao/Email] [SIMULADO] →', destinatario, '|', lead.nome, lead.categoria?.toUpperCase())
    return { success: true, simulated: true }
  }

  try {
    await transporter.sendMail({
      from:    `"LeadCapture Pro" <${process.env.SMTP_USER}>`,
      to:      destinatario,
      subject: `${lead.categoria === 'hot' ? '🔥' : lead.categoria === 'warm' ? '🌤' : '❄️'} Novo Lead: ${lead.nome} — ${marca.nome}`,
      html:    renderizarEmailNovoLead(lead, marca),
    })

    console.log('[Comunicacao/Email] Enviado para:', destinatario)
    return { success: true }
  } catch (err) {
    console.error('[Comunicacao/Email] Falha:', err.message)
    return { success: false, error: err.message }
  }
}
