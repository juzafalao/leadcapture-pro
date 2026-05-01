// ============================================================
// LeadCapture Pro — Google Forms → n8n Webhook
// ============================================================
//
// COMO INSTALAR:
// 1. Abra o Google Forms → menu ⋮ → "Script editor"
// 2. Cole este código, salve com Ctrl+S
// 3. Preencha as constantes abaixo (N8N_WEBHOOK_URL, TENANT_ID, MARCA_ID)
// 4. Menu "Executar" → "configurarTrigger" (autorize as permissões)
// 5. Submeta uma resposta de teste no formulário para validar
//
// ESTRUTURA DO FORMULÁRIO GOOGLE:
// Pergunta 1 — "Nome completo"          (resposta curta)
// Pergunta 2 — "E-mail"                 (resposta curta)
// Pergunta 3 — "WhatsApp"               (resposta curta — só o número local, ex: 11999998888)
// Pergunta 4 — "DDI País"               (lista suspensa — opções abaixo)
// Pergunta 5 — "Capital disponível"     (lista suspensa — opções abaixo)
// Pergunta 6 — "Estado de interesse"    (lista suspensa — estados BR ou países)
// Pergunta 7 — "Cidade"                 (resposta curta — opcional)
//
// OPÇÕES PARA A PERGUNTA "DDI País":
// 🇧🇷 +55 Brasil
// 🇦🇷 +54 Argentina
// 🇧🇴 +591 Bolívia
// 🇨🇱 +56 Chile
// 🇨🇴 +57 Colômbia
// 🇨🇷 +506 Costa Rica
// 🇪🇨 +593 Equador
// 🇲🇽 +52 México
// 🇵🇾 +595 Paraguai
// 🇵🇪 +51 Peru
// 🇺🇾 +598 Uruguai
// 🇻🇪 +58 Venezuela
// 🇺🇸 +1 EUA / Canadá
// 🇵🇹 +351 Portugal
// 🇪🇸 +34 Espanha
// 🇬🇧 +44 Reino Unido
// 🇩🇪 +49 Alemanha
// 🇮🇹 +39 Itália
// 🇫🇷 +33 França
// 🇯🇵 +81 Japão
// 🇦🇺 +61 Austrália
//
// OPÇÕES PARA "Capital disponível":
// Até R$ 100 mil
// R$ 100 mil — R$ 300 mil
// R$ 300 mil — R$ 500 mil
// Acima de R$ 500 mil
// ============================================================

// ── Configurações — PREENCHA ANTES DE USAR ──────────────────
var N8N_WEBHOOK_URL = 'https://SEU_N8N.app.n8n.cloud/webhook/google-forms-lead';
var TENANT_ID       = 'SUBSTITUIR_PELO_SEU_TENANT_ID';
var MARCA_ID        = 'SUBSTITUIR_PELO_ID_DA_MARCA';

// Mapeamento: título da pergunta no formulário → chave do payload
// Ajuste se você usar títulos diferentes nas perguntas
var MAPA_CAMPOS = {
  'Nome completo':        'nome',
  'E-mail':               'email',
  'Email':                'email',
  'WhatsApp':             'telefone',
  'Telefone':             'telefone',
  'Número':               'telefone',
  'DDI País':             'ddi',
  'Código do País':       'ddi',
  'Capital disponível':   'capital',
  'Capital Disponível':   'capital',
  'Estado de interesse':  'estado',
  'Estado':               'estado',
  'Cidade':               'cidade',
  'Região de interesse':  'regiao_interesse',
};

// ── Trigger — instalado via configurarTrigger() ─────────────
function onFormSubmit(e) {
  var payload = {
    tenant_id: TENANT_ID,
    marca_id:  MARCA_ID,
    fonte:     'google-forms',
  };

  var respostas = e.response.getItemResponses();
  for (var i = 0; i < respostas.length; i++) {
    var titulo = respostas[i].getItem().getTitle();
    var valor  = respostas[i].getResponse();
    var chave  = MAPA_CAMPOS[titulo];
    if (chave) {
      payload[chave] = valor;
    }
  }

  var opcoes = {
    method:      'post',
    contentType: 'application/json',
    payload:     JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var resposta = UrlFetchApp.fetch(N8N_WEBHOOK_URL, opcoes);
    var status   = resposta.getResponseCode();
    Logger.log('[LeadCapture] Webhook enviado. Status: ' + status + ' | Payload: ' + JSON.stringify(payload));
    if (status < 200 || status >= 300) {
      Logger.log('[LeadCapture] Resposta: ' + resposta.getContentText());
    }
  } catch (err) {
    Logger.log('[LeadCapture] Erro ao enviar webhook: ' + err.toString());
  }
}

// ── Instala o trigger no formulário ─────────────────────────
// Execute esta função UMA VEZ pelo menu "Executar" para instalar o trigger
function configurarTrigger() {
  // Remove triggers antigos deste script para evitar duplicatas
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Instala o novo trigger
  var form = FormApp.getActiveForm();
  ScriptApp.newTrigger('onFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();

  Logger.log('[LeadCapture] Trigger instalado com sucesso no formulário: ' + form.getTitle());
}

// ── Teste manual ─────────────────────────────────────────────
// Execute esta função para testar sem precisar submeter o formulário
function testarWebhook() {
  var payloadTeste = {
    tenant_id:   TENANT_ID,
    marca_id:    MARCA_ID,
    nome:        'Lead Teste DDI',
    email:       'teste@leadcapture.pro',
    telefone:    '11999998888',
    ddi:         '🇧🇷 +55 Brasil',
    capital:     'R$ 100 mil — R$ 300 mil',
    estado:      'SP',
    cidade:      'São Paulo',
    fonte:       'google-forms',
  };

  var opcoes = {
    method:      'post',
    contentType: 'application/json',
    payload:     JSON.stringify(payloadTeste),
    muteHttpExceptions: true,
  };

  var resposta = UrlFetchApp.fetch(N8N_WEBHOOK_URL, opcoes);
  Logger.log('[LeadCapture] Teste enviado. Status: ' + resposta.getResponseCode());
  Logger.log('[LeadCapture] Resposta: ' + resposta.getContentText());
}
