import nodemailer from 'nodemailer';

let transporter = null;

export function initEmailService() {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'seu-email@gmail.com',
      pass: process.env.SMTP_PASS || 'sua-senha-app'
    }
  };

  try {
    transporter = nodemailer.createTransport(emailConfig);
    console.log('✅ Serviço de email inicializado');
  } catch (error) {
    console.log('⚠️ Email não configurado (modo dev)');
  }
}

export async function enviarNotificacaoNovoLead(lead, marca) {
  if (!transporter) {
    console.log('📧 [SIMULADO] Email enviado para:', process.env.NOTIFICATION_EMAIL || 'admin@leadcapture.com');
    console.log('📋 Lead:', lead.nome, '-', lead.email);
    return { success: true, simulated: true };
  }

  const emailDestino = process.env.NOTIFICATION_EMAIL || 'admin@leadcapture.com';
  
  const htmlEmail = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .emoji { font-size: 60px; margin-bottom: 10px; }
        .content { padding: 30px; }
        .info-row { padding: 15px; margin: 10px 0; background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 5px; }
        .label { font-weight: bold; color: #667eea; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 16px; color: #333; margin-top: 5px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .urgente { background: #fff3cd; border-left-color: #ffc107; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="emoji">${marca.emoji || '🎯'}</div>
          <h1>🎉 Novo Lead Capturado!</h1>
          <p>${marca.nome}</p>
        </div>
        
        <div class="content">
          <h2 style="color: #667eea; margin-bottom: 20px;">📋 Dados do Candidato</h2>
          
          <div class="info-row urgente">
            <div class="label">👤 Nome Completo</div>
            <div class="value">${lead.nome}</div>
          </div>
          
          <div class="info-row">
            <div class="label">📧 Email</div>
            <div class="value"><a href="mailto:${lead.email}">${lead.email}</a></div>
          </div>
          
          <div class="info-row">
            <div class="label">📱 Telefone/WhatsApp</div>
            <div class="value">
              <a href="https://wa.me/${lead.telefone.replace(/\D/g, '')}" target="_blank">
                ${lead.telefone}
              </a>
            </div>
          </div>
          
          <div class="info-row">
            <div class="label">💰 Capital Disponível</div>
            <div class="value">${lead.capital_disponivel}</div>
          </div>
          
          <div class="info-row">
            <div class="label">📍 Estado</div>
            <div class="value">${lead.regiao}</div>
          </div>
          
          <div class="info-row">
            <div class="label">🌐 Origem</div>
            <div class="value">${lead.fonte || 'landing-page-react'}</div>
          </div>
          
          <div class="info-row">
            <div class="label">⏰ Data/Hora</div>
            <div class="value">${new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>LeadCapture Pro</strong></p>
          <p>Sistema de Captura de Leads para Franquias</p>
          <p style="margin-top: 10px;">
            <a href="http://localhost:4000/admin" style="color: #667eea;">
              🔗 Acessar Admin
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"LeadCapture Pro" <${process.env.SMTP_USER}>`,
      to: emailDestino,
      subject: `🎯 Novo Lead: ${lead.nome} - ${marca.nome}`,
      html: htmlEmail
    });

    console.log('✅ Email enviado com sucesso para:', emailDestino);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    return { success: false, error: error.message };
  }
}
