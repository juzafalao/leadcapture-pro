// ============================================
// GOOGLE FORMS - APPS SCRIPT
// ============================================
// Como usar:
// 1. Abra seu Google Form
// 2. Clique nos 3 pontos > Editor de scripts
// 3. Cole este código
// 4. Salve e configure o gatilho (trigger)

// ⚠️ CONFIGURAÇÃO - ALTERE AQUI
const CONFIG = {
  // URL do seu backend (quando estiver no ar)
  API_URL: 'http://localhost:4000/api/leads/google-forms',
  
  // Para produção, use:
  // API_URL: 'https://seu-dominio.com/api/leads/google-forms',
  
  // IDs
  TENANT_ID: '81cac3a4-caa3-43b2-be4d-d16557d7ef88',
  MARCA_ID: '22222222-2222-2222-2222-222222222222', // Alterar conforme a marca
  
  // Mapeamento de campos (ajuste conforme seu formulário)
  CAMPO_NOME: 'Nome completo',
  CAMPO_EMAIL: 'E-mail',
  CAMPO_TELEFONE: 'WhatsApp',
  CAMPO_DOCUMENTO: 'CPF ou CNPJ', // Opcional
  CAMPO_CAPITAL: 'Capital disponível',
  CAMPO_CIDADE: 'Cidade',
  CAMPO_ESTADO: 'Estado',
  CAMPO_MENSAGEM: 'Mensagem' // Opcional
}

// ============================================
// FUNÇÃO PRINCIPAL - Executada ao enviar formulário
// ============================================
function onFormSubmit(e) {
  try {
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    Logger.log('📝 Novo envio de formulário detectado')
    
    // Pegar respostas do formulário
    const respostas = e.response.getItemResponses()
    
    // Mapear respostas
    const dadosFormulario = {}
    
    respostas.forEach(function(resposta) {
      const pergunta = resposta.getItem().getTitle()
      const valor = resposta.getResponse()
      dadosFormulario[pergunta] = valor
      Logger.log('   ' + pergunta + ': ' + valor)
    })
    
    // Criar payload para API
    const payload = {
      tenant_id: CONFIG.TENANT_ID,
      marca_id: CONFIG.MARCA_ID,
      nome: dadosFormulario[CONFIG.CAMPO_NOME] || '',
      email: dadosFormulario[CONFIG.CAMPO_EMAIL] || '',
      telefone: dadosFormulario[CONFIG.CAMPO_TELEFONE] || '',
      documento: dadosFormulario[CONFIG.CAMPO_DOCUMENTO] || '',
      capital: dadosFormulario[CONFIG.CAMPO_CAPITAL] || '',
      cidade: dadosFormulario[CONFIG.CAMPO_CIDADE] || '',
      estado: dadosFormulario[CONFIG.CAMPO_ESTADO] || '',
      mensagem: dadosFormulario[CONFIG.CAMPO_MENSAGEM] || ''
    }
    
    Logger.log('')
    Logger.log('📤 Enviando para API...')
    Logger.log('URL: ' + CONFIG.API_URL)
    
    // Enviar para API
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
    
    const response = UrlFetchApp.fetch(CONFIG.API_URL, options)
    const statusCode = response.getResponseCode()
    const responseText = response.getContentText()
    
    Logger.log('')
    Logger.log('📥 Resposta da API:')
    Logger.log('   Status: ' + statusCode)
    Logger.log('   Body: ' + responseText)
    
    if (statusCode === 200) {
      Logger.log('✅ Lead enviado com sucesso!')
      
      const result = JSON.parse(responseText)
      if (result.leadId) {
        Logger.log('   Lead ID: ' + result.leadId)
      }
      if (result.duplicated) {
        Logger.log('   ⚠️  Lead duplicado (já existe)')
      }
    } else {
      Logger.log('❌ Erro ao enviar lead')
      Logger.log('   Código: ' + statusCode)
      Logger.log('   Mensagem: ' + responseText)
      
      // Enviar email de notificação de erro (opcional)
      enviarEmailErro(payload, statusCode, responseText)
    }
    
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    Logger.log('❌ ERRO CRÍTICO:')
    Logger.log(error.toString())
    Logger.log(error.stack)
    
    // Enviar email de erro crítico
    enviarEmailErro(null, 0, error.toString())
  }
}

// ============================================
// FUNÇÃO AUXILIAR - Enviar email de erro
// ============================================
function enviarEmailErro(payload, statusCode, mensagem) {
  try {
    const destinatario = Session.getActiveUser().getEmail()
    const assunto = '❌ Erro ao enviar lead do Google Forms'
    
    let corpo = 'Erro ao enviar lead para o backend:\n\n'
    corpo += 'Status Code: ' + statusCode + '\n'
    corpo += 'Mensagem: ' + mensagem + '\n\n'
    
    if (payload) {
      corpo += 'Dados do formulário:\n'
      corpo += JSON.stringify(payload, null, 2)
    }
    
    corpo += '\n\nVerifique os logs em: Extensões > Apps Script > Execuções'
    
    MailApp.sendEmail(destinatario, assunto, corpo)
    Logger.log('📧 Email de erro enviado para: ' + destinatario)
    
  } catch (e) {
    Logger.log('❌ Erro ao enviar email de notificação: ' + e.toString())
  }
}

// ============================================
// FUNÇÃO DE TESTE - Execute manualmente para testar
// ============================================
function testarIntegracao() {
  Logger.log('🧪 TESTE DE INTEGRAÇÃO')
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const payloadTeste = {
    tenant_id: CONFIG.TENANT_ID,
    marca_id: CONFIG.MARCA_ID,
    nome: 'Teste Google Forms',
    email: 'teste@googleforms.com',
    telefone: '11999999999',
    documento: '',
    capital: '100000',
    cidade: 'São Paulo',
    estado: 'SP',
    mensagem: 'Lead de teste do Google Forms'
  }
  
  Logger.log('📤 Enviando lead de teste...')
  Logger.log(JSON.stringify(payloadTeste, null, 2))
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payloadTeste),
    muteHttpExceptions: true
  }
  
  try {
    const response = UrlFetchApp.fetch(CONFIG.API_URL, options)
    const statusCode = response.getResponseCode()
    const responseText = response.getContentText()
    
    Logger.log('')
    Logger.log('📥 Resposta:')
    Logger.log('   Status: ' + statusCode)
    Logger.log('   Body: ' + responseText)
    
    if (statusCode === 200) {
      Logger.log('')
      Logger.log('✅ TESTE PASSOU! Integração funcionando.')
    } else {
      Logger.log('')
      Logger.log('❌ TESTE FALHOU!')
    }
    
  } catch (error) {
    Logger.log('❌ ERRO NO TESTE:')
    Logger.log(error.toString())
  }
  
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

// ============================================
// FUNÇÃO - Configurar gatilho automaticamente
// ============================================
function configurarGatilho() {
  // Remover gatilhos existentes
  const gatilhosExistentes = ScriptApp.getProjectTriggers()
  gatilhosExistentes.forEach(function(gatilho) {
    if (gatilho.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(gatilho)
    }
  })
  
  // Criar novo gatilho
  const form = FormApp.getActiveForm()
  ScriptApp.newTrigger('onFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create()
  
  Logger.log('✅ Gatilho configurado com sucesso!')
  Logger.log('A função onFormSubmit() será executada automaticamente a cada envio do formulário.')
}
