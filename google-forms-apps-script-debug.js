// ============================================
// GOOGLE FORMS - APPS SCRIPT (DEBUG MODE)
// ============================================

const CONFIG = {
  API_URL: 'https://dry-socks-invite.loca.lt/api/leads/google-forms', // ← SUA URL ATUAL
  TENANT_ID: '81cac3a4-caa3-43b2-be4d-d16557d7ef88',
  MARCA_ID: '22222222-2222-2222-2222-222222222222',
  
  CAMPO_NOME: 'Nome completo',
  CAMPO_EMAIL: 'E-mail',
  CAMPO_TELEFONE: 'WhatsApp',
  CAMPO_DOCUMENTO: 'CPF ou CNPJ',
  CAMPO_CAPITAL: 'Capital disponível',
  CAMPO_CIDADE: 'Cidade',
  CAMPO_ESTADO: 'Estado',
  CAMPO_MENSAGEM: 'Mensagem'
}

// ============================================
// FUNÇÃO PRINCIPAL - Disparada pelo formulário
// ============================================
function onFormSubmit(e) {
  const executionId = new Date().getTime()
  
  try {
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    Logger.log('🔍 [' + executionId + '] FORMULÁRIO ENVIADO - DEBUG MODE')
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    Logger.log('')
    
    // Log do evento completo
    Logger.log('📋 Evento completo (e):')
    Logger.log(JSON.stringify(e, null, 2))
    Logger.log('')
    
    // Verificar se evento tem response
    if (!e || !e.response) {
      Logger.log('❌ ERRO: Evento não tem response!')
      Logger.log('Tipo de evento:', typeof e)
      Logger.log('Keys:', Object.keys(e || {}))
      throw new Error('Evento não tem response')
    }
    
    Logger.log('✅ Evento tem response')
    Logger.log('')
    
    // Pegar respostas
    const respostas = e.response.getItemResponses()
    Logger.log('📝 Total de respostas: ' + respostas.length)
    Logger.log('')
    
    // Mapear respostas
    const dadosFormulario = {}
    
    Logger.log('📊 Respostas do formulário:')
    respostas.forEach(function(resposta) {
      const pergunta = resposta.getItem().getTitle()
      const valor = resposta.getResponse()
      dadosFormulario[pergunta] = valor
      Logger.log('   ' + pergunta + ': ' + valor)
    })
    Logger.log('')
    
    // Criar payload
    Logger.log('🔧 Criando payload...')
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
    
    Logger.log('📤 Payload criado:')
    Logger.log(JSON.stringify(payload, null, 2))
    Logger.log('')
    
    Logger.log('🌐 Enviando para API...')
    Logger.log('URL: ' + CONFIG.API_URL)
    Logger.log('')
    
    // Enviar para API
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
    
    Logger.log('⏳ Fazendo requisição...')
    const response = UrlFetchApp.fetch(CONFIG.API_URL, options)
    const statusCode = response.getResponseCode()
    const responseText = response.getContentText()
    
    Logger.log('')
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    Logger.log('📥 RESPOSTA DA API:')
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    Logger.log('Status: ' + statusCode)
    Logger.log('Body: ' + responseText)
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    Logger.log('')
    
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
      
      enviarEmailErro(payload, statusCode, responseText)
    }
    
    Logger.log('')
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    Logger.log('✅ [' + executionId + '] PROCESSAMENTO CONCLUÍDO')
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    Logger.log('')
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    Logger.log('❌ ERRO CRÍTICO:')
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    Logger.log('Mensagem: ' + error.toString())
    Logger.log('Stack: ' + error.stack)
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    enviarEmailErro(null, 0, error.toString())
  }
}

// ============================================
// ENVIAR EMAIL DE ERRO
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
// TESTE MANUAL
// ============================================
function testarIntegracao() {
  Logger.log('🧪 TESTE DE INTEGRAÇÃO')
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const payloadTeste = {
    tenant_id: CONFIG.TENANT_ID,
    marca_id: CONFIG.MARCA_ID,
    nome: 'Teste Manual Google Forms',
    email: 'teste.manual@googleforms.com',
    telefone: '11999999999',
    documento: '',
    capital: '100000',
    cidade: 'São Paulo',
    estado: 'SP',
    mensagem: 'Lead de teste manual do Google Forms'
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
// CONFIGURAR GATILHO
// ============================================
function configurarGatilho() {
  Logger.log('🔧 Configurando gatilho...')
  
  // Remover gatilhos existentes
  const gatilhosExistentes = ScriptApp.getProjectTriggers()
  Logger.log('Gatilhos existentes: ' + gatilhosExistentes.length)
  
  gatilhosExistentes.forEach(function(gatilho) {
    if (gatilho.getHandlerFunction() === 'onFormSubmit') {
      Logger.log('Removendo gatilho antigo: ' + gatilho.getUniqueId())
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

// ============================================
// VERIFICAR GATILHOS
// ============================================
function verificarGatilhos() {
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  Logger.log('🔍 VERIFICAR GATILHOS')
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const gatilhos = ScriptApp.getProjectTriggers()
  Logger.log('Total de gatilhos: ' + gatilhos.length)
  Logger.log('')
  
  if (gatilhos.length === 0) {
    Logger.log('❌ NENHUM GATILHO CONFIGURADO!')
    Logger.log('Execute a função: configurarGatilho')
  } else {
    gatilhos.forEach(function(gatilho, index) {
      Logger.log('Gatilho #' + (index + 1) + ':')
      Logger.log('   Função: ' + gatilho.getHandlerFunction())
      Logger.log('   Tipo: ' + gatilho.getEventType())
      Logger.log('   ID: ' + gatilho.getUniqueId())
      Logger.log('')
    })
  }
  
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}
