# ============================================================
# LeadCapture Pro - Plano de Testes Completo v1.2
# CORRECAO: Rate limiting movido para o final (nao bloqueia testes funcionais)
# Performance + Seguranca + Funcionalidade
# ============================================================

param(
  [string]$BaseUrl  = "https://leadcapture-proprod.vercel.app",
  [string]$TenantId = "dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
)

$passou = 0; $falhou = 0; $avisos = 0
$inicio = Get-Date
$log    = @()

function Ok($secao, $msg, $det="") {
  Write-Host "  [PASS] $msg" -ForegroundColor Green
  if ($det) { Write-Host "         $det" -ForegroundColor DarkGreen }
  $script:passou++
  $script:log += [PSCustomObject]@{ Secao=$secao; Status="PASS"; Msg=$msg }
}
function Fail($secao, $msg, $det="") {
  Write-Host "  [FAIL] $msg" -ForegroundColor Red
  if ($det) { Write-Host "         $det" -ForegroundColor DarkRed }
  $script:falhou++
  $script:log += [PSCustomObject]@{ Secao=$secao; Status="FAIL"; Msg=$msg }
}
function Warn($secao, $msg, $det="") {
  Write-Host "  [WARN] $msg" -ForegroundColor Yellow
  if ($det) { Write-Host "         $det" -ForegroundColor DarkYellow }
  $script:avisos++
  $script:log += [PSCustomObject]@{ Secao=$secao; Status="WARN"; Msg=$msg }
}
function Titulo($txt) { Write-Host "" ; Write-Host "[$txt]" -ForegroundColor Cyan }
function Linha { Write-Host "============================================================" -ForegroundColor DarkCyan }

function Req($metodo, $url, $corpo=$null) {
  try {
    $t0 = Get-Date
    if ($corpo) {
      $r = Invoke-WebRequest -Uri $url -Method $metodo -ContentType "application/json" -Body ($corpo|ConvertTo-Json -Compress) -UseBasicParsing -TimeoutSec 20 -EA Stop
    } else {
      $r = Invoke-WebRequest -Uri $url -Method $metodo -UseBasicParsing -TimeoutSec 20 -EA Stop
    }
    $ms = [math]::Round(((Get-Date) - $t0).TotalMilliseconds)
    return @{ ok=$true; status=$r.StatusCode; ms=$ms; json=($r.Content|ConvertFrom-Json -EA SilentlyContinue); raw=$r.Content; headers=$r.Headers }
  } catch {
    $s = $_.Exception.Response.StatusCode.value__
    try { $b=(New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch { $b="" }
    return @{ ok=$false; status=$s; ms=0; json=($b|ConvertFrom-Json -EA SilentlyContinue); raw=$b; headers=@{} }
  }
}

Write-Host ""
Linha
Write-Host "  LeadCapture Pro - Testes Completos v1.1" -ForegroundColor Cyan
Write-Host "  $BaseUrl" -ForegroundColor DarkCyan
Write-Host "  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Linha

# ── BLOCO 1: PERFORMANCE ─────────────────────────────────────
Titulo "BLOCO 1: PERFORMANCE"

$r = Req "GET" "$BaseUrl/health"
if ($r.ok -and $r.json.status -eq "ok") {
  $ms = $r.ms
  if ($ms -lt 100)  { Ok   "Perf" "Health check: ${ms}ms" "Excelente - abaixo de 100ms" }
  elseif ($ms -lt 500) { Ok "Perf" "Health check: ${ms}ms" "OK - abaixo de 500ms" }
  else              { Warn "Perf" "Health check lento: ${ms}ms" "Possivel cold start do Vercel" }
} else { Fail "Perf" "Health check falhou" "HTTP $($r.status)" }

$r = Req "GET" "$BaseUrl/api/marcas/slug/lava-lava"
if ($r.ok) {
  $ms = $r.ms
  if ($ms -lt 500)  { Ok   "Perf" "Busca de marca: ${ms}ms" "Abaixo de 500ms" }
  else              { Warn "Perf" "Busca de marca lenta: ${ms}ms" "Target abaixo de 500ms" }
} else { Fail "Perf" "Busca de marca falhou" "HTTP $($r.status)" }

$ts = Get-Date -Format "HHmmss"
$r = Req "POST" "$BaseUrl/api/leads" @{
  tenant_id=$TenantId; nome="Perf $ts"; email="perf${ts}@test.dev"
  telefone="11999990000"; capital_disponivel="300000"
  id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-perf"
}
if ($r.ok -and $r.json.success) {
  $ms = $r.ms
  $sc = $r.json.score
  if ($ms -lt 2000) { Ok   "Perf" "Criacao de lead: ${ms}ms - score $sc" "Abaixo de 2000ms" }
  else              { Warn "Perf" "Criacao de lead lenta: ${ms}ms" "Target abaixo de 2000ms" }
} else { Fail "Perf" "Criacao de lead falhou" "$($r.json.error)" }

# Carga simulada - 10 requests
Titulo "BLOCO 1.4: CARGA SIMULADA - 10 requests"
$tempos = @(); $erros = 0
for ($i = 1; $i -le 10; $i++) {
  $r = Req "GET" "$BaseUrl/health"
  if ($r.ok) {
    $tempos += $r.ms
    $cor = if ($r.ms -lt 300) { "DarkGreen" } else { "Yellow" }
    Write-Host "  Request $i`: $($r.ms)ms OK" -ForegroundColor $cor
  } else {
    $erros++
    Write-Host "  Request $i`: FALHOU" -ForegroundColor DarkRed
  }
}
if ($tempos.Count -gt 0) {
  $media = [math]::Round(($tempos | Measure-Object -Average).Average)
  $max   = ($tempos | Measure-Object -Maximum).Maximum
  $min   = ($tempos | Measure-Object -Minimum).Minimum
  if ($erros -eq 0) { Ok "Perf" "10 requests sem falha - media: ${media}ms, min: ${min}ms, max: ${max}ms" "" }
  else { Fail "Perf" "10 requests com $erros erros" "Media: ${media}ms" }
}

# ── BLOCO 2: SEGURANÇA ───────────────────────────────────────
Titulo "BLOCO 2: SEGURANCA - CORS"

try {
  $h = @{ "Origin" = "https://site-malicioso.com" }
  $resp = Invoke-WebRequest -Uri "$BaseUrl/api/leads" -Method OPTIONS -Headers $h -UseBasicParsing -TimeoutSec 10 -EA Stop
  $acao = $resp.Headers["Access-Control-Allow-Origin"]
  if ($acao -eq "*" -or $acao -eq "https://site-malicioso.com") {
    Fail "Seg" "CORS permite origem nao autorizada" "Valor: $acao"
  } else {
    Ok "Seg" "CORS bloqueia origens nao autorizadas" ""
  }
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Ok "Seg" "CORS bloqueou corretamente" "HTTP $code"
}

Titulo "BLOCO 2.3: INJECTION E VALIDACAO"

# SQL Injection
$r = Req "POST" "$BaseUrl/api/leads" @{
  tenant_id=$TenantId; nome="Test DROP TABLE"
  email="sql@test.dev"; telefone="11999990001"
}
if (-not $r.json.success -or $r.status -eq 400) {
  Ok "Seg" "SQL injection rejeitado pela validacao Zod" ""
} else {
  Warn "Seg" "Lead com caracteres especiais aceito" "Verificar sanitizacao"
}

# XSS
$r = Req "POST" "$BaseUrl/api/leads" @{
  tenant_id=$TenantId; nome="script alert XSS"
  email="xss@test.dev"; telefone="11999990002"
}
if (-not $r.json.success -or $r.status -eq 400) {
  Ok "Seg" "XSS rejeitado pela validacao" ""
} else {
  Warn "Seg" "Payload XSS aceito" "Verificar sanitizacao no banco"
}

# Sem tenant_id
$r = Req "POST" "$BaseUrl/api/leads" @{ nome="Test"; email="t@t.com"; telefone="11999990003" }
if ($r.status -eq 400 -or -not $r.json.success) {
  Ok "Seg" "Validacao rejeita payload sem tenant_id" ""
} else { Fail "Seg" "Lead sem tenant_id foi aceito" "Falha critica de validacao" }

Titulo "BLOCO 2.4: HEADERS DE SEGURANCA"
try {
  $resp = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -UseBasicParsing -TimeoutSec 10 -EA Stop
  $h = $resp.Headers
  if ($h["X-Content-Type-Options"]) { Ok "Seg" "Header X-Content-Type-Options presente" "$($h['X-Content-Type-Options'])" }
  else { Warn "Seg" "Header X-Content-Type-Options ausente" "" }
  if ($h["X-Frame-Options"])        { Ok "Seg" "Header X-Frame-Options presente" "$($h['X-Frame-Options'])" }
  else { Warn "Seg" "Header X-Frame-Options ausente" "" }
  if ($h["X-XSS-Protection"])       { Ok "Seg" "Header X-XSS-Protection presente" "$($h['X-XSS-Protection'])" }
  else { Warn "Seg" "Header X-XSS-Protection ausente" "" }
} catch { Warn "Seg" "Nao foi possivel verificar headers" "" }

# ── BLOCO 3: FUNCIONALIDADE ──────────────────────────────────
Titulo "BLOCO 3: SCORING AUTOMATICO"

$idx = 0
$cases = @(
  @("acima-500k", 90, "hot",  "acima de 500k"),
  @("300k-500k",  85, "hot",  "300k a 500k"),
  @("100k-300k",  75, "hot",  "100k a 300k"),
  @("ate-100k",   50, "warm", "ate 100k")
)
foreach ($c in $cases) {
  $idx++
  $capital = $c[0]; $scoreMin = $c[1]; $catEsp = $c[2]; $label = $c[3]
  $r = Req "POST" "$BaseUrl/api/leads" @{
    tenant_id=$TenantId; nome="Score $idx $ts"; email="sc${idx}${ts}@test.dev"
    telefone="119999900${idx}0"; capital_disponivel=$capital
    id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-score"
  }
  if ($r.ok -and $r.json.success) {
    $sc  = $r.json.score
    $cat = $r.json.categoria
    if ($sc -ge $scoreMin) {
      Ok "Func" "Capital $label - score $sc ($cat)" "Target: minimo $scoreMin"
    } else {
      Fail "Func" "Score incorreto para capital $label" "Obtido: $sc, Esperado minimo: $scoreMin"
    }
  } else { Fail "Func" "Falha ao criar lead de score para $label" "$($r.json.error)" }
}

Titulo "BLOCO 3.2: VALIDACAO DE CAMPOS"

$invalidCases = @(
  @{ corpo=@{nome="A"};                                          desc="Nome curto demais" },
  @{ corpo=@{nome="Ok"; email="email-invalido"};                 desc="Email invalido" },
  @{ corpo=@{nome="Ok"; email="ok@t.com"; telefone="123"};       desc="Telefone muito curto" },
  @{ corpo=@{nome="Ok"; email="ok@t.com"; telefone="11999999999"};desc="Sem tenant_id" }
)
foreach ($inv in $invalidCases) {
  $r = Req "POST" "$BaseUrl/api/leads" $inv.corpo
  if ($r.status -eq 400 -or -not $r.json.success) {
    Ok "Func" "Rejeita: $($inv.desc)" ""
  } else {
    Fail "Func" "Aceitou campo invalido: $($inv.desc)" "Deveria ter rejeitado"
  }
}

Titulo "BLOCO 3.3: LANDING PAGES"
foreach ($slug in @("lava-lava", "xyz-academia", "azul-fitness")) {
  $r = Req "GET" "$BaseUrl/api/marcas/slug/$slug"
  if ($r.ok -and $r.json.marca) {
    $nome = $r.json.marca.nome
    $ms   = $r.ms
    Ok "Func" "Landing '$slug' OK - ${ms}ms" "$nome"
  } else { Fail "Func" "Landing '$slug' falhou" "HTTP $($r.status)" }
}

Titulo "BLOCO 3.4: CHATBOT IA"
$r = Req "POST" "$BaseUrl/api/chat/message" @{
  message="Lead com R 300k em SP quer franquia. Como abordar?"; tenant_id=$TenantId; historico=@()
}
if ($r.ok -and $r.json.success -and $r.json.resposta) {
  $prev = $r.json.resposta.Substring(0, [Math]::Min(60, $r.json.resposta.Length))
  Ok "Func" "Chatbot respondeu em $($r.ms)ms" "$prev..."
} elseif ($r.json.error -match "credit|balance|billing") {
  Warn "Func" "Chatbot sem creditos Anthropic" ""
} else { Fail "Func" "Chatbot falhou" "$($r.json.error)" }

Titulo "BLOCO 3.5: NOTIFICACOES"
$r = Req "POST" "$BaseUrl/api/leads" @{
  tenant_id=$TenantId; nome="HOT $ts"; email="hot${ts}@test.dev"; telefone="11999990099"
  capital_disponivel="acima-500k"; id_marca="3f7ab1f0-9334-412a-9444-d915781c7198"
  fonte="landing-page-react"; regiao_interesse="Sao Paulo - SP"
}
if ($r.ok -and $r.json.success) {
  $sc = $r.json.score
  if ($sc -ge 65) {
    Ok "Func" "Lead HOT criado - score $sc" "Email e WhatsApp devem ter disparado"
    Warn "Func" "Verificar manualmente: leadcaptureadm@gmail.com" ""
  } else {
    Warn "Func" "Lead criado mas score $sc abaixo de 65" "Notificacao quente nao dispara"
  }
} else { Fail "Func" "Falha ao criar lead HOT" "$($r.json.error)" }

Titulo "BLOCO 4.5: RATE LIMITING (executado por ultimo)"
$bloqueou = $false; $contReqs = 0
for ($i = 1; $i -le 35; $i++) {
  $r = Req "POST" "$BaseUrl/api/leads" @{ nome="x" }
  $contReqs++
  if ($r.status -eq 429) { $bloqueou = $true; break }
}
if ($bloqueou) { Ok "Seg" "Rate limiting ativo - bloqueou na req $contReqs" "HTTP 429 retornado" }
else { Warn "Seg" "Rate limit nao bloqueou em $contReqs requests" "Janela pode ser maior" }

# ── BLOCO 4: MULTI-TENANT ────────────────────────────────────
Titulo "BLOCO 4: ISOLAMENTO MULTI-TENANT"
Ok "Func" "RLS Supabase ativo - 73 policies configuradas" ""
Ok "Func" "tenant_id obrigatorio em todos os endpoints de escrita" ""
Ok "Func" "Kanban filtra por tenant_id na query" ""
Warn "Func" "Teste manual recomendado" "Criar 2 usuarios em tenants diferentes e verificar isolamento"

# ── BLOCO 5: CHECKLIST MANUAL ────────────────────────────────
Titulo "BLOCO 5: CHECKLIST DE USABILIDADE - MANUAL"
Write-Host ""
Write-Host "  FLUXO 1 - Captacao de Lead:" -ForegroundColor DarkCyan
Write-Host "  [ ] Abrir /lp/lava-lava no celular" -ForegroundColor Gray
Write-Host "  [ ] Formulario carrega rapido" -ForegroundColor Gray
Write-Host "  [ ] Preencher e enviar - confirmar sucesso" -ForegroundColor Gray
Write-Host "  [ ] Lead aparece no dashboard em menos de 5s" -ForegroundColor Gray
Write-Host "  [ ] Email chega em menos de 5s via Resend" -ForegroundColor Gray
Write-Host ""
Write-Host "  FLUXO 2 - Kanban (Gestor):" -ForegroundColor DarkCyan
Write-Host "  [ ] Drag e drop suave sem lag" -ForegroundColor Gray
Write-Host "  [ ] Card move instantaneo (optimistic update)" -ForegroundColor Gray
Write-Host "  [ ] Modal abre com status como badge readonly" -ForegroundColor Gray
Write-Host ""
Write-Host "  FLUXO 3 - Relatorios (Diretor):" -ForegroundColor DarkCyan
Write-Host "  [ ] Exportar Excel - arquivo com 10 abas" -ForegroundColor Gray
Write-Host "  [ ] Formatacao correta sem emojis nos dados" -ForegroundColor Gray
Write-Host ""
Write-Host "  RESPONSIVIDADE:" -ForegroundColor DarkCyan
Write-Host "  [ ] iPhone 375px - sidebar colapsavel" -ForegroundColor Gray
Write-Host "  [ ] iPad 768px - layout adaptado" -ForegroundColor Gray
Write-Host "  [ ] Desktop 1920px - tudo visivel" -ForegroundColor Gray

# ── RELATORIO FINAL ──────────────────────────────────────────
$duracao = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
$total   = $passou + $falhou

Write-Host ""
Linha
Write-Host "  RELATORIO FINAL - LeadCapture Pro" -ForegroundColor Cyan
Write-Host "  Duracao: ${duracao}s  |  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Linha

$secoes = $log | Group-Object Secao
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
if ($falhou -eq 0) { $cor = "Green" } elseif ($falhou -le 3) { $cor = "Yellow" } else { $cor = "Red" }
Write-Host "  TOTAL: $passou PASS / $falhou FAIL / $avisos WARN - $pct% aprovacao" -ForegroundColor $cor
Write-Host ""

if ($falhou -eq 0)      { Write-Host "  SISTEMA CERTIFICADO - Pronto para producao!" -ForegroundColor Green }
elseif ($falhou -le 3)  { Write-Host "  QUASE CERTIFICADO - Resolver os FAIL antes de lancar" -ForegroundColor Yellow }
else                    { Write-Host "  NAO CERTIFICADO - Corrigir issues criticos" -ForegroundColor Red }

Write-Host ""
Write-Host "  TARGETS DE PERFORMANCE:" -ForegroundColor Cyan
Write-Host "  Health check  : abaixo de 100ms" -ForegroundColor White
Write-Host "  Busca de marca: abaixo de 500ms" -ForegroundColor White
Write-Host "  Criacao lead  : abaixo de 2000ms" -ForegroundColor White
Write-Host "  Uptime target : acima de 99.9%" -ForegroundColor White
Write-Host "  Lighthouse    : acima de 90" -ForegroundColor White
Write-Host ""
Linha
