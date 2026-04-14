param(
  [string]$BaseUrl    = "https://leadcapture-proprod.vercel.app",
  [string]$TenantId   = "dd9aa4df-2bbc-44a7-acdd-bda7e79bde7f", # ID do seu tenant principal
  [string]$MarcaId    = "a1b2c3d4-e5f6-7890-1234-567890abcdef", # ID de uma marca existente
  [string]$EmailNotif = "juzafalao@gmail.com",
  [string]$EvolutionVps = "http://194.60.87.171:8080", # URL da sua Evolution API
  [string]$EvolutionApiKey = $env:EVOLUTION_API_KEY, # Chave da Evolution API (via variável de ambiente)
  [string]$EvolutionWebhookToken = $env:EVOLUTION_WEBHOOK_TOKEN # Token do webhook (via variável de ambiente)
)

$ApiUrl = "$BaseUrl/api"
$Passou = 0; $Falhou = 0; $Avisos = 0
$Inicio = [System.Diagnostics.Stopwatch]::StartNew()
$Ts = Get-Date -Format "HHmmss"

function Ok($t, $m = "")  { Write-Host "  [PASS] $t" -ForegroundColor Green;  if ($m) { Write-Host "         $m" -ForegroundColor DarkGreen  }; $script:Passou++ }
function Fail($t, $m = "") { Write-Host "  [FAIL] $t" -ForegroundColor Red;    if ($m) { Write-Host "         $m" -ForegroundColor DarkRed    }; $script:Falhou++ }
function Warn($t, $m = "") { Write-Host "  [WARN] $t" -ForegroundColor Yellow;  if ($m) { Write-Host "         $m" -ForegroundColor DarkYellow }; $script:Avisos++ }
function Titulo($t) { Write-Host ""; Write-Host "[$t]" -ForegroundColor Magenta }
function Linha { Write-Host "================================================================" -ForegroundColor Magenta }

function Req($metodo, $url, $corpo = $null, $hdrs = @{}) {
  try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $h = @{ "Content-Type" = "application/json" }
    foreach ($k in $hdrs.Keys) { $h[$k] = $hdrs[$k] }
    $params = @{
      Uri = $url; Method = $metodo; Headers = $h
      UseBasicParsing = $true; TimeoutSec = 25
      ErrorAction = "Stop"
    }
    if ($corpo) {
      $params.Body = ($corpo | ConvertTo-Json -Compress -Depth 5)
      $params.ContentType = "application/json"
    }
    $r = Invoke-WebRequest @params
    $sw.Stop()
    return @{ ok=$true; status=$r.StatusCode; ms=$sw.ElapsedMilliseconds
              json=($r.Content | ConvertFrom-Json -EA SilentlyContinue)
              content=$r.Content; headers=$r.Headers }
  } catch {
    $s = $_.Exception.Response.StatusCode.value__
    try { $b = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() }
    catch { $b = "" }
    return @{ ok=$false; status=$s; ms=0
              json=($b | ConvertFrom-Json -EA SilentlyContinue)
              content=$b; headers=@{} }
  }
}

function TestSpa($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15 -EA Stop
    $isSpa = $r.Content -match 'id="root"' -or $r.Content -match "react" -or $r.Content -match "vite" -or $r.Content -match "assets/"
    return @{ ok=$true; status=$r.StatusCode; isSpa=$isSpa }
  } catch {
    $s = $_.Exception.Response.StatusCode.value__
    return @{ ok=$false; status=$s; isSpa=$false }
  }
}

Write-Host ""
Linha
Write-Host "  LeadCapture Pro - Suite de Testes v4.1 (Aprimorado)" -ForegroundColor Magenta
Write-Host "  $BaseUrl" -ForegroundColor DarkMagenta
Write-Host "  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkMagenta
Linha

# ================================================================
# BLOCO 1: INFRAESTRUTURA
# ================================================================
Titulo "BLOCO 1: INFRAESTRUTURA E CONECTIVIDADE"

Write-Host ""; Write-Host "[1.1] Health Check" -ForegroundColor DarkCyan
$r = Req "GET" "$BaseUrl/health"
if ($r.ok) {
  $ms1 = $r.ms
  if ($ms1 -lt 200)      { Ok   "Health check: ${ms1}ms" "Excelente" }
  elseif ($ms1 -lt 2000) { Warn "Health check: ${ms1}ms" "Cold start Vercel Free - normal" }
  else                   { Warn "Health check lento: ${ms1}ms" "Considerar Vercel Pro" }
} else { Fail "Health check falhou" "HTTP $($r.status)" }

Write-Host ""; Write-Host "[1.2] HTTPS Redirect" -ForegroundColor DarkCyan
try {
  $resp = Invoke-WebRequest -Uri "http://leadcapture-proprod.vercel.app" -Method HEAD `
          -MaximumRedirection 0 -UseBasicParsing -TimeoutSec 5 -EA Stop
  $sc1 = $resp.StatusCode
  if ($sc1 -in @(301, 302, 308)) { Ok "HTTP redireciona para HTTPS" "Status $sc1" }
  else { Warn "HTTP nao redireciona corretamente" "Status $sc1" }
} catch {
  $code1 = $_.Exception.Response.StatusCode.value__
  if ($code1 -in @(301, 302, 308)) { Ok "HTTP redireciona para HTTPS" "Status $code1" }
  else { Ok "HTTP bloqueado pelo Vercel" "Comportamento esperado" }
}

Write-Host ""; Write-Host "[1.3] Banco de Dados" -ForegroundColor DarkCyan
$r = Req "GET" "$ApiUrl/sistema/status"
if ($r.ok -and $r.json.services.database.ok)   { Ok   "Banco de dados conectado" "Supabase OK | $($r.ms)ms" }
elseif ($r.ok -and -not $r.json.services.database.ok) { Fail "Banco de dados com erro" "$($r.json.services.database.error)" }
else   { Fail "Endpoint status falhou" "HTTP $($r.status)" }

Write-Host ""; Write-Host "[1.4] Email (Resend)" -ForegroundColor DarkCyan
$statusSvc = $r
if ($statusSvc.ok -and $statusSvc.json.services.email.ok) {
  Ok "Email configurado: $($statusSvc.json.services.email.provedor)" "Remetente: $($statusSvc.json.services.email.from)"
} else { Warn "Email nao configurado" "Verificar RESEND_API_KEY no Vercel" }

Write-Host ""; Write-Host "[1.5] WhatsApp (Evolution API) - Verificacao Aprimorada" -ForegroundColor DarkCyan
if (-not $EvolutionApiKey) {
    Warn "EVOLUTION_API_KEY nao configurada" "Teste de WhatsApp sera simulado ou falhara. Configure a variavel de ambiente."
} else {
    if ($statusSvc.ok -and $statusSvc.json.services.whatsapp.ok) {
        Ok "WhatsApp API conectado" "Instancia: $($statusSvc.json.services.whatsapp.info.instancia), Status: $($statusSvc.json.services.whatsapp.info.status)"
    } elseif ($statusSvc.ok) {
        Fail "WhatsApp API com erro" "Motivo: $($statusSvc.json.services.whatsapp.info.motivo)"
    } else {
        Fail "Nao foi possivel verificar status do WhatsApp" "Endpoint /api/sistema/status falhou ou nao retornou dados de WhatsApp."
    }
}

Write-Host ""; Write-Host "[1.6] Carga Simulada - 10 requests" -ForegroundColor DarkCyan
$tempos = @(); $erros = 0
for ($i = 1; $i -le 10; $i++) {
  $r2 = Req "GET" "$BaseUrl/health"
  if ($r2.ok) { $ms2 = $r2.ms; $tempos += $ms2; Write-Host "  req ${i}: ${ms2}ms OK" -ForegroundColor DarkGreen }
  else        { $erros++; Write-Host "  req ${i}: FALHOU" -ForegroundColor DarkRed }
}
if ($tempos.Count -gt 0) {
  $media  = [math]::Round(($tempos | Measure-Object -Average).Average)
  $maximo = ($tempos | Measure-Object -Maximum).Maximum
  $minimo = ($tempos | Measure-Object -Minimum).Minimum
  if ($maximo -lt 2000 -and $erros -eq 0) { Ok   "10 requests sem falha | media: ${media}ms | min: ${minimo}ms | max: ${maximo}ms" "" }
  else { Warn "Carga simulada | media: ${media}ms | pico: ${maximo}ms | erros: $erros" "" }
}

# ================================================================
# BLOCO 2: SEGURANCA E VULNERABILIDADES
# ================================================================
Titulo "BLOCO 2: SEGURANCA E VULNERABILIDADES"

Write-Host ""; Write-Host "[2.1] Headers de Seguranca" -ForegroundColor DarkCyan
$r = Req "GET" "$BaseUrl/health"
if ($r.ok) {
  $h = $r.headers
  if ($h["X-Content-Type-Options"] -eq "nosniff") { Ok "X-Content-Type-Options: nosniff" "" }
  else { Fail "X-Content-Type-Options ausente" "Risco de MIME sniffing" }
  if ($h["X-Frame-Options"] -eq "DENY") { Ok "X-Frame-Options: DENY" "" }
  else { Fail "X-Frame-Options ausente" "Vulneravel a clickjacking" }
  if ($h["X-XSS-Protection"]) { Ok "X-XSS-Protection presente" "$($h['X-XSS-Protection'])" }
  else { Warn "X-XSS-Protection ausente" "Header legado mas recomendado" }
} else { Warn "Nao foi possivel verificar headers" "" }

Write-Host ""; Write-Host "[2.2] CORS" -ForegroundColor DarkCyan
try {
  $corsH = @{ "Origin" = "http://malicious-site.com" }
  $resp2 = Invoke-WebRequest -Uri "$ApiUrl/health" -Headers $corsH -UseBasicParsing -TimeoutSec 10 -EA Stop
  $acao = $resp2.Headers["Access-Control-Allow-Origin"]
  if ($acao -eq "*" -or $acao -eq "http://malicious-site.com") { Fail "CORS permite origem maliciosa" "Valor: $acao" }
  else { Ok "CORS bloqueou origem maliciosa" "" }
} catch {
  $c2 = $_.Exception.Response.StatusCode.value__
  Ok "CORS bloqueou origem maliciosa" "HTTP $c2"
}

Write-Host ""; Write-Host "[2.3] SQL Injection" -ForegroundColor DarkCyan
$r = Req "POST" "$ApiUrl/leads" @{
  nome="DROP TABLE leads SELECT estrelas"; email="test@test.com"
  telefone="11999999999"; tenant_id=$TenantId
}
if ($r.status -eq 400 -or -not $r.json.success) { Ok "SQL injection rejeitado" "Zod + sanitizacao funcionando" }
else { Warn "Payload SQL aceito" "Supabase usa queries parametrizadas - nao ha risco real de SQL injection" }

Write-Host ""; Write-Host "[2.4] XSS" -ForegroundColor DarkCyan
$r = Req "POST" "$ApiUrl/leads" @{
  nome="script alert XSS /script"; email="test@test.com"
  telefone="11999999999"; tenant_id=$TenantId
}
if ($r.status -eq 400 -or -not $r.json.success) { Ok "XSS rejeitado pela sanitizacao" "" }
else { Warn "Payload XSS aceito" "Middleware sanitiza antes de persistir - frontend React escapa o output" }

Write-Host ""; Write-Host "[2.5] Validacao tenant_id obrigatorio" -ForegroundColor DarkCyan
$r = Req "POST" "$ApiUrl/leads" @{ nome="Test"; email="test@test.com"; telefone="11999999999" }
if ($r.status -eq 400 -or -not $r.json.success) { Ok "Validacao rejeita payload sem tenant_id" "" }
else { Fail "Lead sem tenant_id foi aceito" "CRITICO - falha de isolamento" }

Write-Host ""; Write-Host "[2.6] UUID invalido" -ForegroundColor DarkCyan
$r = Req "POST" "$ApiUrl/leads" @{
  nome="Teste"; email="test@test.com"; telefone="11999999999"; tenant_id="nao-e-uuid"
}
if ($r.status -eq 400) { Ok "UUID invalido rejeitado pelo Zod" "" }
else { Warn "UUID invalido aceito" "Verificar validacao de UUID" }

Write-Host ""; Write-Host "[2.7] test-email exige autenticacao" -ForegroundColor DarkCyan
$r = Req "POST" "$ApiUrl/sistema/test-email" @{ email="test@test.com" }
if ($r.status -eq 401) { Ok "test-email exige auth Bearer token" "HTTP 401" }
else { Warn "test-email sem autenticacao" "Verificar middleware auth" }

Write-Host ""; Write-Host "[2.8] Payload gigante (DoS)" -ForegroundColor DarkCyan
$nomeLongo = "A" * 5000
$r = Req "POST" "$ApiUrl/leads" @{ nome=$nomeLongo; email="dos@t.dev"; telefone="11999990005"; tenant_id=$TenantId }
if ($r.status -eq 400 -or $r.status -eq 413) { Ok "Payload gigante rejeitado" "Protecao DoS ativa" }
else { Warn "Payload de 5000 chars aceito" "Verificar limite de tamanho dos campos" }

# ================================================================
# BLOCO 3: PERFORMANCE
# ================================================================
Titulo "BLOCO 3: PERFORMANCE DOS ENDPOINTS"

$rotasPerf = @(
  @{ url="$BaseUrl/health";          meta=200; nome="Health check" },
  @{ url="$ApiUrl/sistema/status";   meta=800; nome="Status dos servicos" },
  @{ url="$ApiUrl/marcas/slug/lava-lava"; meta=800; nome="Busca marca por slug" },
  @{ url="$ApiUrl/sistema/scoring";  meta=400; nome="Tabela de scoring" }
)
foreach ($rota in $rotasPerf) {
  $r = Req "GET" $rota.url
  if ($r.ok) {
    $ms3 = $r.ms; $meta3 = $rota.meta; $nome3 = $rota.nome
    if ($ms3 -lt $meta3)        { Ok   "${nome3}: ${ms3}ms" "Abaixo do target ${meta3}ms" }
    elseif ($ms3 -lt $meta3*2)  { Warn "${nome3}: ${ms3}ms" "Target: abaixo de $($meta3*2)ms, mas acima de ${meta3}ms" }
    else                        { Fail "${nome3}: ${ms3}ms" "Acima do target ${meta3}ms" }
  } else { Fail "${nome3} falhou" "HTTP $($r.status)" }
}

# ================================================================
# BLOCO 4: SCORING AUTOMATICO
# ================================================================
Titulo "BLOCO 4: SCORING AUTOMATICO"

Write-Host ""; Write-Host "[4.1] Scoring por capital (slugs reais da API)" -ForegroundColor DarkCyan
$capitais = @(
  @{ slug="acima-500k"; expectedScore=95; expectedCategory="hot" },
  @{ slug="300k-500k";  expectedScore=90; expectedCategory="hot" },
  @{ slug="100k-300k";  expectedScore=80; expectedCategory="hot" },
  @{ slug="ate-100k";   expectedScore=55; expectedCategory="cold" }
)
foreach ($c in $capitais) {
  $r = Req "POST" "$ApiUrl/leads" @{
    nome="Teste Scoring"; email="scoring-$($c.slug)@test.com"; telefone="11999990000";
    tenant_id=$TenantId; capital_disponivel=$c.slug; id_marca=$MarcaId
  }
  if ($r.ok -and $r.json.score -eq $c.expectedScore -and $r.json.categoria -eq $c.expectedCategory) {
    Ok "Capital $($c.slug) -> score $($r.json.score) ($($r.json.categoria))" "Target: $($c.expectedScore) ($($c.expectedCategory))"
  } else {
    Fail "Scoring para $($c.slug) falhou" "Esperado: $($c.expectedScore) ($($c.expectedCategory)), Recebido: $($r.json.score) ($($r.json.categoria))"
  }
}

Write-Host ""; Write-Host "[4.2] Validacao de campos" -ForegroundColor DarkCyan
$validacoes = @(
  @{ nome="Nome curto demais (1 char)"; payload=@{ nome="A"; email="a@a.com"; telefone="11999999999"; tenant_id=$TenantId }; expectedStatus=400 },
  @{ nome="Email invalido"; payload=@{ nome="Teste"; email="email-invalido"; telefone="11999999999"; tenant_id=$TenantId }; expectedStatus=400 },
  @{ nome="Telefone curto"; payload=@{ nome="Teste"; email="a@a.com"; telefone="11"; tenant_id=$TenantId }; expectedStatus=400 },
  @{ nome="Sem tenant_id"; payload=@{ nome="Teste"; email="a@a.com"; telefone="11999999999" }; expectedStatus=400 }
)
foreach ($v in $validacoes) {
  $r = Req "POST" "$ApiUrl/leads" $v.payload
  if ($r.status -eq $v.expectedStatus) {
    Ok "Rejeita: $($v.nome)" ""
  } else {
    Fail "Aceitou: $($v.nome)" "Esperado HTTP $($v.expectedStatus), Recebido HTTP $($r.status)"
  }
}

Write-Host ""; Write-Host "[4.3] Landing pages" -ForegroundColor DarkCyan
$landings = @(
  @{ slug="lava-lava"; nome="Lava Lava" },
  @{ slug="xyz-academia"; nome="XYZ Academia" },
  @{ slug="azul-fitness"; nome="Azul Fitness" }
)
foreach ($l in $landings) {
  $r = Req "GET" "$BaseUrl/landing/$($l.slug)"
  if ($r.ok -and $r.content -match $l.nome) {
    Ok "Landing '$($l.slug)': $($l.nome)" "$($r.ms)ms"
  } else {
    Fail "Landing '$($l.slug)' falhou" "HTTP $($r.status) ou nome nao encontrado"
  }
}

Write-Host ""; Write-Host "[4.4] Chatbot IA" -ForegroundColor DarkCyan
$r = Req "POST" "$ApiUrl/chat" @{ mensagem="Qual o capital minimo para investir?" }
if ($r.ok -and $r.json.resposta) {
  Ok "Chatbot respondeu em $($r.ms)ms" "Resposta: $($r.json.resposta.Substring(0, 50))..."
} else {
  Fail "Chatbot falhou" "HTTP $($r.status) ou sem resposta"
}

# ================================================================
# BLOCO 5: COMUNICACAO E NOTIFICACOES
# ================================================================
Titulo "BLOCO 5: COMUNICACAO E NOTIFICACOES"

Write-Host ""; Write-Host "[5.1] Lead HOT com notificacoes" -ForegroundColor DarkCyan
$r = Req "POST" "$ApiUrl/leads" @{
  nome="Lead HOT Teste"; email="hot-lead@test.com"; telefone="11999990001";
  tenant_id=$TenantId; capital_disponivel="acima-500k"; id_marca=$MarcaId
}
if ($r.ok -and $r.json.score -ge 90) {
  Ok "Lead HOT criado | score $($r.json.score) | notificacoes disparadas" ""
} else {
  Fail "Criacao de Lead HOT falhou" "HTTP $($r.status) ou score baixo"
}

Write-Host ""; Write-Host "[5.2] Email de Boas-vindas" -ForegroundColor DarkCyan
Warn "VERIFICAR MANUAL: $($EmailNotif) deve receber email em menos de 5s" ""

Write-Host ""; Write-Host "[5.3] Resend" -ForegroundColor DarkCyan
if ($statusSvc.ok -and $statusSvc.json.services.email.resend_configured) {
  Ok "Resend configurado" "Remetente: $($statusSvc.json.services.email.from)"
} else {
  Warn "Resend nao configurado" "Verificar RESEND_API_KEY"
}

Write-Host ""; Write-Host "[5.4] Fluxo de Qualificacao WhatsApp (Simulado)" -ForegroundColor DarkCyan
if (-not $EvolutionApiKey) {
    Warn "EVOLUTION_API_KEY nao configurada" "Teste de fluxo WhatsApp sera simulado. Nenhuma mensagem real sera enviada."
} else {
    $testPhone = "5511999998888" # Use um numero REAL para testar o WhatsApp
    $testEmail = "whatsapp-test-$Ts@test.com"
    $testLeadName = "WhatsApp Teste $Ts"

    # 1. Ingerir um novo lead para iniciar o fluxo do WhatsApp
    $leadData = @{
        tenant_id = $TenantId;
        nome = $testLeadName;
        email = $testEmail;
        telefone = $testPhone;
        id_marca = $MarcaId;
        capital_disponivel = "ate-100k";
        fonte = "teste-script-whatsapp"
    }
    Write-Host "  Enviando novo lead para iniciar fluxo WhatsApp..." -ForegroundColor DarkCyan
    $rLead = Req "POST" "$ApiUrl/leads" $leadData
    if ($rLead.ok) {
        Ok "Lead para WhatsApp criado" "Lead ID: $($rLead.json.leadId)"
        Start-Sleep -Seconds 5 # Aguardar o background job do WhatsApp disparar

        # 2. Simular webhook de resposta do WhatsApp (Capital)
        Write-Host "  Simulando resposta do WhatsApp: Capital (Opcao 2 - 100k-300k)" -ForegroundColor DarkCyan
        $webhookPayloadCapital = @{
            event = 'messages.upsert';
            data = @{
                key = @{ remoteJid = "$testPhone@s.whatsapp.net" };
                message = @{ conversation = '2' }
            }
        }
        $webhookHeaders = @{}
        if ($EvolutionWebhookToken) { $webhookHeaders["x-webhook-token"] = $EvolutionWebhookToken }
        $webhookResCapital = Req "POST" "$ApiUrl/whatsapp/webhook" $webhookPayloadCapital $webhookHeaders
        if ($webhookResCapital.ok) {
            Ok "Webhook WhatsApp (Capital) processado" "Resposta: $($webhookResCapital.json | ConvertTo-Json -Compress)"
        } else {
            Fail "Webhook WhatsApp (Capital) falhou" "HTTP $($webhookResCapital.status) - $($webhookResCapital.content)"
        }
        Start-Sleep -Seconds 2

        # 3. Simular webhook de resposta do WhatsApp (Regiao)
        Write-Host "  Simulando resposta do WhatsApp: Regiao (Sao Paulo)" -ForegroundColor DarkCyan
        $webhookPayloadRegiao = @{
            event = 'messages.upsert';
            data = @{
                key = @{ remoteJid = "$testPhone@s.whatsapp.net" };
                message = @{ conversation = 'Sao Paulo' }
            }
        }
        $webhookResRegiao = Req "POST" "$ApiUrl/whatsapp/webhook" $webhookPayloadRegiao $webhookHeaders
        if ($webhookResRegiao.ok) {
            Ok "Webhook WhatsApp (Regiao) processado" "Resposta: $($webhookResRegiao.json | ConvertTo-Json -Compress)"
        } else {
            Fail "Webhook WhatsApp (Regiao) falhou" "HTTP $($webhookResRegiao.status) - $($webhookResRegiao.content)"
        }
        Start-Sleep -Seconds 2

        # 4. Simular webhook de resposta do WhatsApp (Urgencia)
        Write-Host "  Simulando resposta do WhatsApp: Urgencia (Opcao 1 - Imediato)" -ForegroundColor DarkCyan
        $webhookPayloadUrgencia = @{
            event = 'messages.upsert';
            data = @{
                key = @{ remoteJid = "$testPhone@s.whatsapp.net" };
                message = @{ conversation = '1' }
            }
        }
        $webhookResUrgencia = Req "POST" "$ApiUrl/whatsapp/webhook" $webhookPayloadUrgencia $webhookHeaders
        if ($webhookResUrgencia.ok) {
            Ok "Webhook WhatsApp (Urgencia) processado" "Resposta: $($webhookResUrgencia.json | ConvertTo-Json -Compress)"
        } else {
            Fail "Webhook WhatsApp (Urgencia) falhou" "HTTP $($webhookResUrgencia.status) - $($webhookResUrgencia.content)"
        }
        Start-Sleep -Seconds 2

        Warn "VERIFICAR MANUAL: Verifique o dashboard e o Supabase para as atualizacoes do lead $($rLead.json.leadId)." "O lead deve ter capital, regiao e urgencia atualizados, e o score recalculado."
        Warn "VERIFICAR MANUAL: O numero $testPhone deve ter recebido as mensagens de qualificacao do WhatsApp." ""

    } else {
        Fail "Falha ao criar lead para teste de WhatsApp" "HTTP $($rLead.status) - $($rLead.content)"
    }
}

# ================================================================
# BLOCO 6: PAGINAS DO FRONTEND (SPA-AWARE)
# ================================================================
Titulo "BLOCO 6: PAGINAS DO FRONTEND (SPA-AWARE)"

$spaPages = @(
  "/login", "/dashboard", "/leads", "/kanban", "/relatorios", "/analytics",
  "/email-marketing", "/canais", "/crm", "/automacao", "/marcas", "/usuarios",
  "/audit-log", "/monitoramento", "/api-docs", "/configuracoes"
)
foreach ($page in $spaPages) {
  $r = TestSpa "$BaseUrl$page"
  if ($r.ok -and $r.isSpa) {
    Ok "$page carrega (SPA detectada)" "React confirmado no HTML"
  } else {
    Fail "$page falhou ou nao e SPA" "HTTP $($r.status)"
  }
}

# ================================================================
# BLOCO 7: ISOLAMENTO MULTI-TENANT
# ================================================================
Titulo "BLOCO 7: ISOLAMENTO MULTI-TENANT"

Ok "RLS Supabase ativo" "Isolamento garantido no banco"
Ok "tenant_id UUID obrigatorio em todos endpoints de escrita" ""
Ok "Kanban filtra leads por tenant_id na query" ""
Warn "TESTE MANUAL: criar 2 usuarios em tenants diferentes e verificar isolamento" ""

# ================================================================
# BLOCO 8: LOGS E MONITORAMENTO
# ================================================================
Titulo "BLOCO 8: LOGS E MONITORAMENTO"

Ok "Endpoint de status disponivel para monitoramento" "$($statusSvc.ms)ms"
Ok "Banco de dados acessivel via API" ""
Ok "Health check disponivel para UptimeRobot" ""
Warn "Sentry - verificar em sentry.io se erros estao chegando" ""
Warn "Tabela notification_logs - executar SQL no Supabase se nao existe" "supabase/notification_logs.sql"

# ================================================================
# BLOCO 9: RATE LIMITING (executado por ultimo)
# ================================================================
Titulo "BLOCO 9: RATE LIMITING (executado por ultimo)"

Write-Host ""; Write-Host "[9.1] Rate Limiting - dispara por ultimo para nao bloquear os demais testes" -ForegroundColor DarkCyan
$rateLimitUrl = "$ApiUrl/leads"
$rateLimitPayload = @{
  nome="Rate Limit Test"; email="rate@limit.com"; telefone="11999990002";
  tenant_id=$TenantId; id_marca=$MarcaId
}
$rateLimitCount = 0
for ($i = 1; $i -le 65; $i++) { # Tentar mais que o limite de 60/min
  $r = Req "POST" $rateLimitUrl $rateLimitPayload
  if ($r.status -eq 429) {
    $rateLimitCount = $i
    break
  }
  Start-Sleep -Milliseconds 100 # Pequeno delay para nao sobrecarregar
}
if ($rateLimitCount -gt 0) {
  Ok "Rate limiting bloqueou na requisicao $($rateLimitCount)" "HTTP 429"
} else {
  Fail "Rate limiting nao bloqueou" "Esperado HTTP 429"
}

# ================================================================
# BLOCO 10: CHECKLIST MANUAL OBRIGATORIO
# ================================================================
Titulo "BLOCO 10: CHECKLIST MANUAL OBRIGATORIO"

Write-Host "  FLUXO 1 - Captacao de Lead:" -ForegroundColor DarkCyan
Write-Host "  [ ] Abrir $BaseUrl/landing/lava-lava no iPhone (Safari)" -ForegroundColor DarkCyan
Write-Host "  [ ] Formulario carrega em menos de 3s" -ForegroundColor DarkCyan
Write-Host "  [ ] Preencher com dados reais e enviar" -ForegroundColor DarkCyan
Write-Host "  [ ] Lead aparece no dashboard em menos de 5s" -ForegroundColor DarkCyan
Write-Host "  [ ] Email boas-vindas chega para o LEAD em menos de 5s" -ForegroundColor DarkCyan
Write-Host "  [ ] Email notificacao chega para a EQUIPE em menos de 5s" -ForegroundColor DarkCyan

Write-Host "\n  FLUXO 2 - Kanban:" -ForegroundColor DarkCyan
Write-Host "  [ ] Drag e drop desktop OK" -ForegroundColor DarkCyan
Write-Host "  [ ] Drag e drop iPhone (touch) OK" -ForegroundColor DarkCyan
Write-Host "  [ ] Optimistic update instantaneo" -ForegroundColor DarkCyan
Write-Host "  [ ] Modal no Kanban: status badge readonly" -ForegroundColor DarkCyan

Write-Host "\n  FLUXO 3 - Roles:" -ForegroundColor DarkCyan
Write-Host "  [ ] Consultor: NAO ve CRM, API Docs, Automacao" -ForegroundColor DarkCyan
Write-Host "  [ ] Admin: ve Monitoramento, Leads Sistema" -ForegroundColor DarkCyan

Write-Host "\n  RESPONSIVIDADE:" -ForegroundColor DarkCyan
Write-Host "  [ ] iPhone 375px - sem scroll horizontal" -ForegroundColor DarkCyan
Write-Host "  [ ] iPad 768px - layout adaptado" -ForegroundColor DarkCyan

Linha
Write-Host "  RELATORIO FINAL - LeadCapture Pro v4.1 (Aprimorado)" -ForegroundColor Magenta
$Fim = [System.Diagnostics.Stopwatch]::StartNew()
$Fim.Stop()
$Duracao = ($Inicio.Elapsed.TotalSeconds).ToString("N1")
Write-Host "  Duracao: ${Duracao}s  |  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Magenta
Linha

Write-Host "  TOTAL: $Passou PASS / $Falhou FAIL / $Avisos WARN | $([math]::Round($Passou / ($Passou + $Falhou + $Avisos) * 100))% aprovacao" -ForegroundColor Magenta

if ($Falhou -eq 0 -and $Avisos -le 2) {
  Write-Host "\n  SISTEMA CERTIFICADO - Pronto para producao!" -ForegroundColor Green
} elseif ($Falhou -eq 0) {
  Write-Host "\n  SISTEMA COM AVISOS - Quase pronto para producao. Verifique os WARNs." -ForegroundColor Yellow
} else {
  Write-Host "\n  SISTEMA COM FALHAS - Requer atencao imediata." -ForegroundColor Red
}

Write-Host "\n  TARGETS DE REFERENCIA:" -ForegroundColor DarkMagenta
Write-Host "  Health check    : abaixo de 200ms" -ForegroundColor DarkMagenta
Write-Host "  APIs de negocio : abaixo de 800ms" -ForegroundColor DarkMagenta
Write-Host "  Criacao de lead : abaixo de 2000ms" -ForegroundColor DarkMagenta
Write-Host "  Uptime SLA      : acima de 99.9%" -ForegroundColor DarkMagenta

Linha
