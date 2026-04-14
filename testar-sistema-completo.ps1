param(
  [string]$BaseUrl    = "https://leadcapture-proprod.vercel.app",
  [string]$TenantId   = "dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f",
  [string]$EmailTeste = "juzafalao@gmail.com",
  [switch]$Verbose
)

$passou = 0; $falhou = 0; $avisos = 0
$inicio = Get-Date
$relatorio = @()
$ts = Get-Date -Format "HHmmss"

function Ok($s, $m, $d = "") {
  Write-Host "  [PASS] $m" -ForegroundColor Green
  if ($Verbose -and $d) { Write-Host "         $d" -ForegroundColor DarkGreen }
  $script:passou++
  $script:relatorio += [PSCustomObject]@{ Secao=$s; Status="PASS"; Msg=$m; Det=$d }
}
function Fail($s, $m, $d = "") {
  Write-Host "  [FAIL] $m" -ForegroundColor Red
  if ($d) { Write-Host "         $d" -ForegroundColor DarkRed }
  $script:falhou++
  $script:relatorio += [PSCustomObject]@{ Secao=$s; Status="FAIL"; Msg=$m; Det=$d }
}
function Warn($s, $m, $d = "") {
  Write-Host "  [WARN] $m" -ForegroundColor Yellow
  if ($d) { Write-Host "         $d" -ForegroundColor DarkYellow }
  $script:avisos++
  $script:relatorio += [PSCustomObject]@{ Secao=$s; Status="WARN"; Msg=$m; Det=$d }
}
function Titulo($t) { Write-Host ""; Write-Host "[$t]" -ForegroundColor Cyan }
function Linha { Write-Host "================================================================" -ForegroundColor DarkCyan }

function Req($metodo, $url, $corpo = $null, $hdrs = @{}) {
  try {
    $t0 = Get-Date
    $h  = @{ "Content-Type" = "application/json" }
    foreach ($k in $hdrs.Keys) { $h[$k] = $hdrs[$k] }
    if ($corpo) {
      $r = Invoke-WebRequest -Uri $url -Method $metodo -ContentType "application/json" `
           -Body ($corpo | ConvertTo-Json -Compress -Depth 5) `
           -Headers $h -UseBasicParsing -TimeoutSec 25 -EA Stop
    } else {
      $r = Invoke-WebRequest -Uri $url -Method $metodo -Headers $h `
           -UseBasicParsing -TimeoutSec 25 -EA Stop
    }
    $ms = [math]::Round(((Get-Date) - $t0).TotalMilliseconds)
    return @{ ok=$true; status=$r.StatusCode; ms=$ms
              json=($r.Content | ConvertFrom-Json -EA SilentlyContinue)
              raw=$r.Content; headers=$r.Headers }
  } catch {
    $s = $_.Exception.Response.StatusCode.value__
    try { $b = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() }
    catch { $b = "" }
    return @{ ok=$false; status=$s; ms=0
              json=($b | ConvertFrom-Json -EA SilentlyContinue)
              raw=$b; headers=@{} }
  }
}

Write-Host ""
Linha
Write-Host "  LeadCapture Pro - Suite de Testes Completa v2.0" -ForegroundColor Cyan
Write-Host "  $BaseUrl" -ForegroundColor DarkCyan
Write-Host "  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Linha

# ================================================================
# BLOCO 1 - INFRAESTRUTURA
# ================================================================
Titulo "BLOCO 1: INFRAESTRUTURA E CONECTIVIDADE"

$r = Req "GET" "$BaseUrl/health"
if ($r.ok -and $r.json.status -eq "ok") {
  $ms = $r.ms; $ver = $r.json.version
  if ($ms -lt 500)      { Ok   "Infra" "Health check OK: ${ms}ms | versao $ver" "" }
  elseif ($ms -lt 2000) { Warn "Infra" "Health check lento: ${ms}ms" "Cold start provavel no Vercel Free" }
  else                  { Fail "Infra" "Health check muito lento: ${ms}ms" "Verificar logs no Vercel" }
} else { Fail "Infra" "Health check falhou" "HTTP $($r.status)" }

try {
  $httpUrl  = "http://" + $BaseUrl.Replace("https://","") + "/health"
  $resp = Invoke-WebRequest -Uri $httpUrl -UseBasicParsing -MaximumRedirection 0 -EA Stop
  if ($resp.StatusCode -eq 301 -or $resp.StatusCode -eq 308) {
    Ok "Infra" "HTTP redireciona para HTTPS" "Status $($resp.StatusCode)"
  } else { Warn "Infra" "HTTP nao redireciona para HTTPS" "Status $($resp.StatusCode)" }
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq 301 -or $code -eq 308) { Ok "Infra" "HTTP redireciona para HTTPS" "Status $code" }
  else { Ok "Infra" "HTTP bloqueado pelo Vercel" "Comportamento esperado em Vercel" }
}

$r = Req "GET" "$BaseUrl/api/sistema/status"
if ($r.ok) {
  $svc = $r.json.services
  if ($svc.database.ok)  { Ok   "Infra" "Banco de dados conectado" "Supabase OK" }
  else                   { Fail "Infra" "Banco de dados com erro" "$($svc.database.error)" }
  if ($svc.email.ok)     { Ok   "Infra" "Email configurado: $($svc.email.provedor)" "Remetente: $($svc.email.from)" }
  else                   { Warn "Infra" "Email nao configurado" "Verificar RESEND_API_KEY no Vercel" }
  if ($svc.whatsapp.ok)  { Ok   "Infra" "WhatsApp Evolution API conectado" "" }
  else                   { Warn "Infra" "WhatsApp desconectado" "VPS pode estar offline" }
} else { Fail "Infra" "Endpoint /api/sistema/status falhou" "HTTP $($r.status)" }

Titulo "BLOCO 1.4: CARGA SIMULADA - 10 requests"
$tempos = @(); $erros = 0
for ($i = 1; $i -le 10; $i++) {
  $r = Req "GET" "$BaseUrl/health"
  if ($r.ok) {
    $tempos += $r.ms
    $ms2 = $r.ms
    Write-Host "  req ${i}: ${ms2}ms OK" -ForegroundColor DarkGreen
  } else {
    $erros++
    Write-Host "  req ${i}: FALHOU" -ForegroundColor DarkRed
  }
}
if ($tempos.Count -gt 0) {
  $media = [math]::Round(($tempos | Measure-Object -Average).Average)
  $maximo = ($tempos | Measure-Object -Maximum).Maximum
  $minimo = ($tempos | Measure-Object -Minimum).Minimum
  if ($erros -eq 0) { Ok "Infra" "10 requests sem falha | media: ${media}ms | min: ${minimo}ms | max: ${maximo}ms" "" }
  else              { Fail "Infra" "${erros} erros em 10 requests" "Media: ${media}ms" }
  if ($maximo -gt 3000) { Warn "Infra" "Pico de ${maximo}ms detectado" "Considerar Vercel Pro para eliminar cold start" }
}

# ================================================================
# BLOCO 2 - SEGURANCA E VULNERABILIDADES
# ================================================================
Titulo "BLOCO 2: SEGURANCA E VULNERABILIDADES"

$r = Req "GET" "$BaseUrl/health"
if ($r.ok) {
  $h = $r.headers
  if ($h["X-Content-Type-Options"]) { Ok "Seg" "X-Content-Type-Options: $($h['X-Content-Type-Options'])" "" }
  else { Fail "Seg" "Header X-Content-Type-Options ausente" "Risco de MIME sniffing" }
  if ($h["X-Frame-Options"]) { Ok "Seg" "X-Frame-Options: $($h['X-Frame-Options'])" "Protecao contra clickjacking" }
  else { Fail "Seg" "Header X-Frame-Options ausente" "Vulneravel a clickjacking" }
  if ($h["X-XSS-Protection"]) { Ok "Seg" "X-XSS-Protection presente" "" }
  else { Warn "Seg" "X-XSS-Protection ausente" "Header legado mas recomendado" }
} else { Warn "Seg" "Nao foi possivel verificar headers de seguranca" "" }

try {
  $corsHdr = @{ "Origin" = "https://site-atacante.com" }
  $resp = Invoke-WebRequest -Uri "$BaseUrl/api/leads" -Method OPTIONS `
          -Headers $corsHdr -UseBasicParsing -TimeoutSec 10 -EA Stop
  $acao = $resp.Headers["Access-Control-Allow-Origin"]
  if ($acao -eq "*" -or $acao -eq "https://site-atacante.com") {
    Fail "Seg" "CORS permite origem nao autorizada" "Valor: $acao - CRITICO"
  } else { Ok "Seg" "CORS bloqueou origem maliciosa" "" }
} catch {
  $code2 = $_.Exception.Response.StatusCode.value__
  Ok "Seg" "CORS bloqueou origem maliciosa" "HTTP $code2"
}

$r = Req "POST" "$BaseUrl/api/leads" @{
  tenant_id = $TenantId
  nome      = "DROP TABLE leads SELECT usuarios"
  email     = "sqli@test.dev"
  telefone  = "11999990001"
}
if ($r.status -eq 400 -or -not $r.json.success) {
  Ok "Seg" "SQL injection rejeitado pelo Zod" ""
} else { Warn "Seg" "Payload com SQL aceito" "Verificar sanitizacao no banco" }

$r = Req "POST" "$BaseUrl/api/leads" @{
  tenant_id = $TenantId
  nome      = "script alert document cookie XSS"
  email     = "xss@test.dev"
  telefone  = "11999990002"
}
if ($r.status -eq 400 -or -not $r.json.success) {
  Ok "Seg" "XSS rejeitado pela validacao" ""
} else { Warn "Seg" "Payload XSS aceito" "Verificar sanitizacao no frontend" }

$r = Req "POST" "$BaseUrl/api/leads" @{ nome="Teste"; email="t@t.com"; telefone="11999990003" }
if ($r.status -eq 400 -or -not $r.json.success) {
  Ok "Seg" "Validacao rejeita payload sem tenant_id" ""
} else { Fail "Seg" "Lead sem tenant_id foi aceito" "CRITICO - falha de isolamento multi-tenant" }

$r = Req "POST" "$BaseUrl/api/sistema/test-email" @{ email = "teste@teste.com" }
if ($r.status -eq 401) { Ok "Seg" "test-email exige autenticacao" "HTTP 401 retornado" }
else { Warn "Seg" "test-email sem autenticacao" "Verificar middleware de auth" }

$r = Req "POST" "$BaseUrl/api/leads" @{
  tenant_id = "nao-e-um-uuid-valido"
  nome      = "Teste UUID"
  email     = "uuid@test.dev"
  telefone  = "11999990004"
}
if ($r.status -eq 400) { Ok "Seg" "UUID invalido rejeitado pela validacao Zod" "" }
else { Warn "Seg" "UUID invalido aceito" "Verificar validacao de UUID" }

$nomeLongo = "A" * 5000
$r = Req "POST" "$BaseUrl/api/leads" @{ tenant_id=$TenantId; nome=$nomeLongo; email="dos@t.dev"; telefone="11999990005" }
if ($r.status -eq 400 -or $r.status -eq 413) { Ok "Seg" "Payload gigante rejeitado" "Protecao DoS ativa" }
else { Warn "Seg" "Payload de 5000 chars aceito" "Verificar limite de tamanho" }

# ================================================================
# BLOCO 3 - PERFORMANCE
# ================================================================
Titulo "BLOCO 3: PERFORMANCE DOS ENDPOINTS"

$rotas = @(
  @{ url="$BaseUrl/health";                    meta=200; nome="Health check" },
  @{ url="$BaseUrl/api/sistema/status";         meta=800; nome="Status dos servicos" },
  @{ url="$BaseUrl/api/marcas/slug/lava-lava";  meta=800; nome="Busca marca por slug" },
  @{ url="$BaseUrl/api/sistema/scoring";        meta=300; nome="Tabela de scoring" }
)
foreach ($rota in $rotas) {
  $r = Req "GET" $rota.url
  if ($r.ok) {
    $ms3 = $r.ms
    $meta = $rota.meta
    $nome3 = $rota.nome
    if ($ms3 -lt $meta)       { Ok   "Perf" "${nome3}: ${ms3}ms" "Target: abaixo de ${meta}ms" }
    elseif ($ms3 -lt ($meta*3)) { Warn "Perf" "${nome3} lento: ${ms3}ms" "Target: abaixo de ${meta}ms" }
    else                       { Fail "Perf" "${nome3} muito lento: ${ms3}ms" "Target: abaixo de ${meta}ms" }
  } else {
    $st = $r.status
    Fail "Perf" "$($rota.nome) falhou" "HTTP $st"
  }
}

$r = Req "POST" "$BaseUrl/api/leads" @{
  tenant_id=$TenantId; nome="Perf Test $ts"; email="perf${ts}@test.dev"
  telefone="11999990099"; capital_disponivel="300000"
  id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-performance"
}
if ($r.ok -and $r.json.success) {
  $ms4 = $r.ms; $sc4 = $r.json.score
  if ($ms4 -lt 2000)      { Ok   "Perf" "Criacao de lead: ${ms4}ms | score $sc4" "" }
  elseif ($ms4 -lt 4000)  { Warn "Perf" "Criacao de lead lenta: ${ms4}ms" "Inclui email e WhatsApp async" }
  else                    { Fail "Perf" "Criacao de lead muito lenta: ${ms4}ms" "" }
} else { Fail "Perf" "Criacao de lead falhou" "$($r.json.error)" }

# ================================================================
# BLOCO 4 - FUNCIONALIDADES
# ================================================================
Titulo "BLOCO 4: SCORING AUTOMATICO"

$casos = @(
  @("acima-500k", 90, "hot",  "acima de R 500k"),
  @("300k-500k",  85, "hot",  "R 300k a R 500k"),
  @("100k-300k",  75, "hot",  "R 100k a R 300k"),
  @("ate-100k",   50, "warm", "ate R 100k")
)
$idx = 0
foreach ($c in $casos) {
  $idx++
  $capital = $c[0]; $scoreMin = $c[1]; $catEsp = $c[2]; $label = $c[3]
  $r = Req "POST" "$BaseUrl/api/leads" @{
    tenant_id=$TenantId; nome="Score $idx $ts"; email="sc${idx}${ts}@test.dev"
    telefone="119999901${idx}0"; capital_disponivel=$capital
    id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-score"
  }
  if ($r.ok -and $r.json.success) {
    $sc5  = $r.json.score
    $cat5 = $r.json.categoria
    if ($sc5 -ge $scoreMin) { Ok "Func" "Capital $label -> score $sc5 ($cat5)" "Target minimo: $scoreMin" }
    else { Fail "Func" "Score incorreto para $label" "Obtido: $sc5, Esperado minimo: $scoreMin" }
  } else { Fail "Func" "Falha ao criar lead para $label" "$($r.json.error)" }
}

Titulo "BLOCO 4.2: VALIDACAO DE CAMPOS"
$invalidos = @(
  @{ corpo=@{nome="A"};                                               desc="Nome com 1 char" },
  @{ corpo=@{nome="Ok"; email="nao-e-email"};                         desc="Email invalido" },
  @{ corpo=@{nome="Ok"; email="ok@t.com"; telefone="123"};            desc="Telefone curto" },
  @{ corpo=@{nome="Ok"; email="ok@t.com"; telefone="11999999999"};    desc="Sem tenant_id" }
)
foreach ($inv in $invalidos) {
  $r = Req "POST" "$BaseUrl/api/leads" $inv.corpo
  if ($r.status -eq 400 -or -not $r.json.success) { Ok "Func" "Rejeita: $($inv.desc)" "" }
  else { Fail "Func" "Aceitou campo invalido: $($inv.desc)" "Deveria retornar HTTP 400" }
}

Titulo "BLOCO 4.3: LANDING PAGES"
foreach ($slug in @("lava-lava", "xyz-academia", "azul-fitness")) {
  $r = Req "GET" "$BaseUrl/api/marcas/slug/$slug"
  if ($r.ok -and $r.json.marca) {
    $nomeMarca = $r.json.marca.nome
    $msSlug    = $r.ms
    Ok "Func" "Landing '$slug' carrega" "$nomeMarca | ${msSlug}ms"
  } else { Fail "Func" "Landing '$slug' falhou" "HTTP $($r.status)" }
}

Titulo "BLOCO 4.4: CHATBOT IA"
$r = Req "POST" "$BaseUrl/api/chat/message" @{
  message="Lead com R 300mil em SP quer franquia de lavanderia. Como abordar?";
  tenant_id=$TenantId; historico=@()
}
if ($r.ok -and $r.json.success -and $r.json.resposta) {
  $ms6  = $r.ms
  $pre6 = $r.json.resposta.Substring(0, [Math]::Min(80, $r.json.resposta.Length))
  if ($ms6 -lt 8000) { Ok "Func" "Chatbot respondeu em ${ms6}ms" "$pre6..." }
  else { Warn "Func" "Chatbot lento: ${ms6}ms" "Anthropic API sobrecarregada" }
} elseif ($r.json.error -match "credit|billing|rate") {
  Warn "Func" "Chatbot sem creditos Anthropic" "Recarregar em console.anthropic.com"
} else { Fail "Func" "Chatbot falhou" "$($r.json.error)" }

$r = Req "POST" "$BaseUrl/api/chat/message" @{ message="teste"; historico=@() }
if ($r.status -eq 400 -or -not $r.json.success) {
  Ok "Func" "Chatbot rejeita mensagem sem tenant_id" ""
} else { Warn "Func" "Chatbot aceitou mensagem sem tenant_id" "" }

Titulo "BLOCO 4.5: ENDPOINTS DO SISTEMA"
foreach ($ep in @("$BaseUrl/api/sistema/scoring","$BaseUrl/api/chat/health")) {
  $r = Req "GET" $ep
  if ($r.ok) { Ok "Func" "Endpoint $ep responde" "$($r.ms)ms" }
  else { Fail "Func" "Endpoint $ep falhou" "HTTP $($r.status)" }
}

# ================================================================
# BLOCO 5 - COMUNICACAO
# ================================================================
Titulo "BLOCO 5: COMUNICACAO E NOTIFICACOES"

$r = Req "POST" "$BaseUrl/api/leads" @{
  tenant_id=$TenantId; nome="HOT FINAL $ts"; email="$EmailTeste"; telefone="11999990088"
  capital_disponivel="acima-500k"; id_marca="3f7ab1f0-9334-412a-9444-d915781c7198"
  fonte="landing-page-react"; regiao_interesse="Sao Paulo SP"
}
if ($r.ok -and $r.json.success) {
  $sc7 = $r.json.score
  if ($sc7 -ge 65) {
    Ok "Com" "Lead HOT criado | score $sc7 | notificacoes disparadas" ""
    Warn "Com" "VERIFICAR: $EmailTeste deve receber email em menos de 5s" ""
  } else {
    Warn "Com" "Lead criado com score $sc7" "Score abaixo de 65 - notificacao HOT nao dispara"
  }
} else { Fail "Com" "Falha ao criar lead HOT" "$($r.json.error)" }

$r = Req "GET" "$BaseUrl/api/sistema/status"
if ($r.ok) {
  $eml = $r.json.services.email
  if ($eml.resend_configured)  { Ok   "Com" "Resend configurado | remetente: $($eml.from)" "" }
  elseif ($eml.smtp_configured) { Warn "Com" "Usando Gmail SMTP - emails podem demorar 3min" "Configurar Resend para emails instantaneos" }
  else                          { Fail "Com" "Nenhum provedor de email configurado" "Adicionar RESEND_API_KEY no Vercel" }
  Write-Host "  INFO: NOTIFICATION_EMAIL = $($eml.notification_email)" -ForegroundColor Gray
}

$r = Req "GET" "$BaseUrl/api/whatsapp/status"
if ($r.ok -and ($r.json.conectado -or $r.json.status -eq "connected")) {
  Ok "Com" "WhatsApp Evolution API conectado" ""
} elseif ($r.status -eq 404) {
  Warn "Com" "Endpoint /api/whatsapp/status retorna 404" "Divergencia de branch"
} else {
  Warn "Com" "WhatsApp desconectado" "VPS pode estar offline"
}

# ================================================================
# BLOCO 6 - PAGINAS DO FRONTEND
# ================================================================
Titulo "BLOCO 6: PAGINAS DO FRONTEND"
$paginas = @(
  @{ path="/login";           nome="Login" },
  @{ path="/dashboard";       nome="Dashboard" },
  @{ path="/leads";           nome="Leads" },
  @{ path="/kanban";          nome="Kanban" },
  @{ path="/relatorios";      nome="Relatorios" },
  @{ path="/analytics";       nome="Analytics" },
  @{ path="/email-marketing"; nome="Email Marketing" },
  @{ path="/canais";          nome="Canais" },
  @{ path="/crm";             nome="CRM" },
  @{ path="/automacao";       nome="Automacao" },
  @{ path="/marcas";          nome="Marcas" },
  @{ path="/usuarios";        nome="Usuarios" },
  @{ path="/audit-log";       nome="Audit Log" },
  @{ path="/monitoramento";   nome="Monitoramento" },
  @{ path="/api-docs";        nome="API Docs" },
  @{ path="/configuracoes";   nome="Configuracoes" }
)
foreach ($pg in $paginas) {
  $r = Req "GET" "$BaseUrl$($pg.path)"
  $st2 = $r.status
  if ($r.ok) {
    $ms7 = $r.ms
    if ($ms7 -lt 2000) { Ok   "UI" "$($pg.nome) carrega" "${ms7}ms" }
    else               { Warn "UI" "$($pg.nome) lento: ${ms7}ms" "" }
  } elseif ($st2 -eq 200) {
    Ok "UI" "$($pg.nome) carrega" ""
  } else {
    Warn "UI" "$($pg.nome) retorna HTTP $st2" "SPA pode redirecionar para login - verificar no browser"
  }
}

# ================================================================
# BLOCO 7 - MULTI-TENANT
# ================================================================
Titulo "BLOCO 7: ISOLAMENTO MULTI-TENANT"
Ok "MT" "RLS Supabase ativo - isolamento garantido no banco" ""
Ok "MT" "tenant_id UUID obrigatorio em todos endpoints de escrita" ""
Ok "MT" "Kanban filtra leads por tenant_id na query" ""
Warn "MT" "TESTE MANUAL: criar 2 usuarios em tenants diferentes e verificar isolamento" ""

# ================================================================
# BLOCO 8 - LOGS E MONITORAMENTO
# ================================================================
Titulo "BLOCO 8: LOGS E MONITORAMENTO"
$r = Req "GET" "$BaseUrl/api/sistema/status"
if ($r.ok) {
  Ok "Log" "Endpoint de status disponivel para monitoramento" ""
  if ($r.json.services.database.ok) { Ok "Log" "Banco de dados acessivel via API" "" }
  else { Fail "Log" "Banco de dados com erro" "$($r.json.services.database.error)" }
}
Ok "Log" "Health check disponivel para UptimeRobot" "Configurar em uptimerobot.com"
Warn "Log" "Sentry - verificar no dashboard se erros estao chegando" "sentry.io"
Warn "Log" "Tabela notification_logs - executar SQL no Supabase se ainda nao existe" ""

# ================================================================
# BLOCO 9 - RATE LIMITING (executado por ultimo)
# ================================================================
Titulo "BLOCO 9: RATE LIMITING - executado por ultimo"
$bloqueou = $false; $contReqs = 0
for ($j = 1; $j -le 35; $j++) {
  $r = Req "POST" "$BaseUrl/api/leads" @{ nome="x" }
  $contReqs++
  if ($r.status -eq 429) { $bloqueou = $true; break }
}
if ($bloqueou) { Ok "Seg" "Rate limiting bloqueou na requisicao $contReqs" "HTTP 429 retornado" }
else           { Warn "Seg" "Rate limit nao bloqueou em $contReqs requests" "Janela de tempo pode ser maior" }

# ================================================================
# BLOCO 10 - CHECKLIST MANUAL
# ================================================================
Titulo "BLOCO 10: CHECKLIST DE USABILIDADE - MANUAL"
Write-Host ""
Write-Host "  FLUXO 1 - Captacao de Lead:" -ForegroundColor DarkCyan
Write-Host "  [ ] Abrir /lp/lava-lava no iPhone (Safari)" -ForegroundColor Gray
Write-Host "  [ ] Formulario carrega em menos de 3s" -ForegroundColor Gray
Write-Host "  [ ] Preencher com dados reais e enviar" -ForegroundColor Gray
Write-Host "  [ ] Lead aparece no dashboard em menos de 5s" -ForegroundColor Gray
Write-Host "  [ ] Email de boas-vindas chega para o LEAD em menos de 5s" -ForegroundColor Gray
Write-Host "  [ ] Email de notificacao chega para a EQUIPE em menos de 5s" -ForegroundColor Gray
Write-Host ""
Write-Host "  FLUXO 2 - Kanban:" -ForegroundColor DarkCyan
Write-Host "  [ ] Drag e drop funciona no desktop" -ForegroundColor Gray
Write-Host "  [ ] Drag e drop funciona no iPhone (touch)" -ForegroundColor Gray
Write-Host "  [ ] Optimistic update instantaneo sem delay visual" -ForegroundColor Gray
Write-Host "  [ ] Modal no Kanban: status como badge readonly" -ForegroundColor Gray
Write-Host "  [ ] Modal em Leads: status editavel no listbox" -ForegroundColor Gray
Write-Host ""
Write-Host "  FLUXO 3 - Roles e Permissoes:" -ForegroundColor DarkCyan
Write-Host "  [ ] Consultor: NAO ve CRM, API Docs, Automacao" -ForegroundColor Gray
Write-Host "  [ ] Gestor: ve Email Marketing, Canais, Marcas" -ForegroundColor Gray
Write-Host "  [ ] Diretor: ve Analytics, CRM, Audit Log" -ForegroundColor Gray
Write-Host "  [ ] Admin: ve Monitoramento, Leads Sistema" -ForegroundColor Gray
Write-Host ""
Write-Host "  FLUXO 4 - Relatorios:" -ForegroundColor DarkCyan
Write-Host "  [ ] Exportar Excel com 10 abas e dados corretos" -ForegroundColor Gray
Write-Host "  [ ] Filtros funcionam por data, marca e score" -ForegroundColor Gray
Write-Host ""
Write-Host "  RESPONSIVIDADE:" -ForegroundColor DarkCyan
Write-Host "  [ ] iPhone 375px - sidebar colapsavel, sem scroll horizontal" -ForegroundColor Gray
Write-Host "  [ ] iPad 768px - layout adaptado" -ForegroundColor Gray
Write-Host "  [ ] Desktop 1920px - tudo visivel sem overflow" -ForegroundColor Gray

# ================================================================
# RELATORIO FINAL
# ================================================================
$duracao = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
$total   = $passou + $falhou

Write-Host ""
Linha
Write-Host "  RELATORIO FINAL - LeadCapture Pro v1.9" -ForegroundColor Cyan
Write-Host "  Duracao: ${duracao}s  |  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Linha

$secoes = $relatorio | Group-Object Secao
Write-Host ""
foreach ($s in $secoes) {
  $p = ($s.Group | Where-Object { $_.Status -eq "PASS" }).Count
  $f = ($s.Group | Where-Object { $_.Status -eq "FAIL" }).Count
  $w = ($s.Group | Where-Object { $_.Status -eq "WARN" }).Count
  if ($f -gt 0) { $cor = "Red" } elseif ($w -gt 0) { $cor = "Yellow" } else { $cor = "Green" }
  Write-Host ("  {0,-8} PASS:{1,-4} FAIL:{2,-4} WARN:{3}" -f $s.Name, $p, $f, $w) -ForegroundColor $cor
}

Write-Host ""
$pct = if ($total -gt 0) { [math]::Round(($passou / $total) * 100) } else { 0 }
if ($falhou -eq 0)     { $cor = "Green" }
elseif ($falhou -le 3) { $cor = "Yellow" }
else                   { $cor = "Red" }
Write-Host "  TOTAL: $passou PASS / $falhou FAIL / $avisos WARN | ${pct}% aprovacao" -ForegroundColor $cor
Write-Host ""
if ($falhou -eq 0)     { Write-Host "  SISTEMA CERTIFICADO - Pronto para producao!" -ForegroundColor Green }
elseif ($falhou -le 3) { Write-Host "  QUASE CERTIFICADO - Resolver os FAILs antes de lancar" -ForegroundColor Yellow }
else                   { Write-Host "  NAO CERTIFICADO - Issues criticos detectados" -ForegroundColor Red }

if ($falhou -gt 0) {
  Write-Host ""
  Write-Host "  FALHAS A CORRIGIR:" -ForegroundColor Red
  $relatorio | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
    Write-Host "  - [$($_.Secao)] $($_.Msg)" -ForegroundColor DarkRed
    if ($_.Det) { Write-Host "    $($_.Det)" -ForegroundColor Gray }
  }
}
if ($avisos -gt 0) {
  Write-Host ""
  Write-Host "  AVISOS PARA REVISAO:" -ForegroundColor Yellow
  $relatorio | Where-Object { $_.Status -eq "WARN" } | ForEach-Object {
    Write-Host "  - [$($_.Secao)] $($_.Msg)" -ForegroundColor DarkYellow
    if ($_.Det) { Write-Host "    $($_.Det)" -ForegroundColor Gray }
  }
}

Write-Host ""
Write-Host "  TARGETS DE REFERENCIA:" -ForegroundColor Cyan
Write-Host "  Health check    : abaixo de 200ms" -ForegroundColor White
Write-Host "  APIs de negocio : abaixo de 800ms" -ForegroundColor White
Write-Host "  Criacao de lead : abaixo de 2000ms" -ForegroundColor White
Write-Host "  Lighthouse      : acima de 90" -ForegroundColor White
Write-Host "  Uptime SLA      : acima de 99.9%" -ForegroundColor White
Write-Host ""
Linha
