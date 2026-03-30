# ============================================================
# LeadCapture Pro — Script de Teste Automatico
# Zafalao Tech · 2026
# Uso: .\testar-sistema.ps1
# ============================================================

$BASE_URL = "https://leadcapture-proprod.vercel.app"
$TENANT_ID = "dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
$MARCA_ID  = "22222222-2222-2222-2222-222222222222"
$MARCA_SLUG = "lava-lava"

$passou = 0
$falhou = 0
$resultados = @()

function Testar {
  param($nome, $url, $metodo = "GET", $body = $null, $esperado = 200, $validar = $null)

  try {
    $params = @{
      Uri             = $url
      Method          = $metodo
      UseBasicParsing = $true
      TimeoutSec      = 15
      ErrorAction     = "Stop"
    }

    if ($body) {
      $params.Body        = ($body | ConvertTo-Json -Compress)
      $params.ContentType = "application/json"
    }

    $resp   = Invoke-WebRequest @params
    $status = $resp.StatusCode
    $json   = $resp.Content | ConvertFrom-Json -ErrorAction SilentlyContinue

    $ok = $status -eq $esperado
    if ($ok -and $validar) { $ok = & $validar $json }

    if ($ok) {
      Write-Host "  [PASS] $nome" -ForegroundColor Green
      $script:passou++
      $script:resultados += [PSCustomObject]@{ Teste=$nome; Status="PASS"; Detalhe="OK" }
    } else {
      Write-Host "  [FAIL] $nome — HTTP $status" -ForegroundColor Red
      $script:falhou++
      $script:resultados += [PSCustomObject]@{ Teste=$nome; Status="FAIL"; Detalhe="HTTP $status / $($json.error)" }
    }
    return $json
  }
  catch {
    $msg = $_.Exception.Message -replace "`n"," "
    # Tenta extrair JSON do erro
    try {
      $errBody = ($_.Exception.Response.GetResponseStream())
      $reader  = New-Object System.IO.StreamReader($errBody)
      $errJson = $reader.ReadToEnd() | ConvertFrom-Json -ErrorAction SilentlyContinue
      $detalhe = if ($errJson.detalhe) { $errJson.detalhe } elseif ($errJson.error) { $errJson.error } else { $msg }
    } catch { $detalhe = $msg }

    Write-Host "  [FAIL] $nome — $detalhe" -ForegroundColor Red
    $script:falhou++
    $script:resultados += [PSCustomObject]@{ Teste=$nome; Status="FAIL"; Detalhe=$detalhe }
    return $null
  }
}

# ── Header ──────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  LeadCapture Pro — Teste Automatico" -ForegroundColor Cyan
Write-Host "  $BASE_URL" -ForegroundColor DarkCyan
Write-Host "  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── BLOCO 1: Health ─────────────────────────────────────────
Write-Host "[ BLOCO 1 ] Health & Status" -ForegroundColor Yellow

Testar "Health check" "$BASE_URL/health" "GET" $null 200 {
  param($j) $j.status -eq "ok"
}

Testar "Status da API" "$BASE_URL/api/sistema/status" "GET" $null 200 {
  param($j) $null -ne $j
}

Testar "Google Forms health" "$BASE_URL/api/leads/google-forms/health" "GET" $null 200 {
  param($j) $j.status -eq "ok"
}

Write-Host ""

# ── BLOCO 2: Marcas ─────────────────────────────────────────
Write-Host "[ BLOCO 2 ] Marcas & Landing Pages" -ForegroundColor Yellow

$marca = Testar "Buscar marca por slug ($MARCA_SLUG)" "$BASE_URL/api/marcas/slug/$MARCA_SLUG" "GET" $null 200 {
  param($j) $j.success -eq $true -and $null -ne $j.marca
}

if ($marca -and $marca.marca) {
  $temLogoUrl  = $null -ne $marca.marca.logo_url
  $temTenantId = $null -ne $marca.marca.tenant_id
  $temInvest   = $null -ne $marca.marca.invest_min

  if ($temTenantId) { Write-Host "    tenant_id: $($marca.marca.tenant_id)" -ForegroundColor DarkGray }
  if ($temLogoUrl)  { Write-Host "    logo_url:  $($marca.marca.logo_url)" -ForegroundColor DarkGray }
  else              { Write-Host "    logo_url:  (vazio — logo nao sera exibida)" -ForegroundColor DarkYellow }
}

# Testa outras marcas com slug
$slugs = @("xyz-academia", "azul-fitness", "pet-shop-love", "beleza-pura", "lavacar")
foreach ($s in $slugs) {
  Testar "Marca /$s" "$BASE_URL/api/marcas/slug/$s" "GET" $null 200 {
    param($j) $j.success -eq $true
  }
}

Write-Host ""

# ── BLOCO 3: Captura de Lead ─────────────────────────────────
Write-Host "[ BLOCO 3 ] Captura de Lead" -ForegroundColor Yellow

$leadBody = @{
  nome               = "Teste Automatico $(Get-Date -Format 'HHmmss')"
  email              = "teste.auto.$(Get-Date -Format 'HHmmss')@zafalao.dev"
  telefone           = "11999990000"
  capital_disponivel = "100k-300k"
  regiao             = "SP"
  tenant_id          = $TENANT_ID
  marca_id           = $MARCA_ID
  fonte              = "teste-automatico"
  gclid              = "test_gclid_$(Get-Random)"
  fbclid             = ""
}

$lead = Testar "POST /api/leads (lead completo)" "$BASE_URL/api/leads" "POST" $leadBody 200 {
  param($j) $j.success -eq $true -and $null -ne $j.leadId
}

if ($lead -and $lead.leadId) {
  Write-Host "    leadId: $($lead.leadId)" -ForegroundColor DarkGray
}

# Testa validacao — nome curto
$leadInvalido = @{ nome="A"; email="invalido"; telefone="123"; tenant_id=$TENANT_ID; marca_id=$MARCA_ID }
Testar "POST /api/leads (dados invalidos — deve dar 400)" "$BASE_URL/api/leads" "POST" $leadInvalido 400 {
  param($j) $j.success -eq $false
}

# Testa sem tenant_id
$semTenant = @{ nome="Sem Tenant"; email="ok@ok.com"; telefone="11999990000" }
Testar "POST /api/leads (sem tenant_id — deve dar 400)" "$BASE_URL/api/leads" "POST" $semTenant 400 {
  param($j) $j.success -eq $false
}

Write-Host ""

# ── BLOCO 4: Rate Limiting ───────────────────────────────────
Write-Host "[ BLOCO 4 ] Rate Limiting" -ForegroundColor Yellow

$rateOk = $true
for ($i = 1; $i -le 3; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "$BASE_URL/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($r.StatusCode -ne 200) { $rateOk = $false }
  } catch { $rateOk = $false }
}

if ($rateOk) {
  Write-Host "  [PASS] Rate limiter ativo (3 requests ok, nao bloqueou requests normais)" -ForegroundColor Green
  $passou++
  $resultados += [PSCustomObject]@{ Teste="Rate limiter"; Status="PASS"; Detalhe="OK" }
} else {
  Write-Host "  [FAIL] Rate limiter pode estar bloqueando requests normais" -ForegroundColor Red
  $falhou++
  $resultados += [PSCustomObject]@{ Teste="Rate limiter"; Status="FAIL"; Detalhe="Bloqueou requests normais" }
}

Write-Host ""

# ── BLOCO 5: CORS ───────────────────────────────────────────
Write-Host "[ BLOCO 5 ] CORS" -ForegroundColor Yellow

try {
  $corsResp = Invoke-WebRequest -Uri "$BASE_URL/api/leads" -Method OPTIONS -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
  $corsHeader = $corsResp.Headers["Access-Control-Allow-Origin"]
  if ($corsHeader) {
    Write-Host "  [PASS] CORS headers presentes: $corsHeader" -ForegroundColor Green
    $passou++
    $resultados += [PSCustomObject]@{ Teste="CORS headers"; Status="PASS"; Detalhe=$corsHeader }
  } else {
    Write-Host "  [WARN] CORS headers ausentes no OPTIONS" -ForegroundColor DarkYellow
    $resultados += [PSCustomObject]@{ Teste="CORS headers"; Status="WARN"; Detalhe="Header ausente" }
  }
} catch {
  Write-Host "  [WARN] CORS OPTIONS nao respondeu (pode ser normal)" -ForegroundColor DarkYellow
  $resultados += [PSCustomObject]@{ Teste="CORS headers"; Status="WARN"; Detalhe="OPTIONS nao respondeu" }
}

Write-Host ""

# ── RESUMO ───────────────────────────────────────────────────
$total = $passou + $falhou
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Total:   $total testes" -ForegroundColor White
Write-Host "  Passou:  $passou" -ForegroundColor Green
Write-Host "  Falhou:  $falhou" -ForegroundColor $(if ($falhou -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($falhou -eq 0) {
  Write-Host "  SISTEMA 100% OPERACIONAL" -ForegroundColor Green
} elseif ($falhou -le 2) {
  Write-Host "  SISTEMA PARCIALMENTE OK — verifique os itens em vermelho" -ForegroundColor Yellow
} else {
  Write-Host "  SISTEMA COM PROBLEMAS — revisar antes da demo" -ForegroundColor Red
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Tabela de resultados
$resultados | Format-Table -AutoSize


# ── BLOCO 5 - Chatbot ────────────────────────────────────────
Write-Host "[BLOCO 5] Chatbot IA" -ForegroundColor Yellow

$r = Get-Api "$BASE_URL/api/chat/health"
if ($r.ok -and $r.json.status -eq "ok") {
    $anthropic = if ($r.json.anthropic_configured) { "ANTHROPIC_API_KEY configurada" } else { "ANTHROPIC_API_KEY ausente" }
    Ok "Chat health | $anthropic"
} else {
    Fail "Chat health" "endpoint nao responde"
}

$chatBody = @{
    message   = "O que e um lead hot e como devo aborda-lo?"
    tenant_id = $TENANT_ID
    historico = @()
}
$r = Post-Api "$BASE_URL/api/chat/message" $chatBody
if ($r.ok -and $r.json.success -and $r.json.resposta) {
    $preview = $r.json.resposta.Substring(0, [Math]::Min(60, $r.json.resposta.Length))
    Ok "Chat message respondeu | $preview..."
} elseif ($r.status -eq 500 -and $r.json.error -like "*nao configurado*") {
    Write-Host "  [WARN] Chat - ANTHROPIC_API_KEY nao configurada ainda (adicionar no Vercel)" -ForegroundColor DarkYellow
    $script:resultados += [PSCustomObject]@{ Teste="Chat message"; Status="WARN"; Detalhe="API key ausente" }
} else {
    Fail "Chat message" "$($r.json.error)"
}

Write-Host ""
$total = $passou + $falhou
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "  Passou : $passou / $total" -ForegroundColor Green
if ($falhou -gt 0) {
    Write-Host "  Falhou : $falhou / $total" -ForegroundColor Red
} else {
    Write-Host "  Falhou : 0 / $total" -ForegroundColor Green
}
Write-Host ""
if ($falhou -eq 0) {
    Write-Host "  SISTEMA 100% OPERACIONAL - pronto para demo!" -ForegroundColor Green
} elseif ($falhou -le 2) {
    Write-Host "  SISTEMA QUASE OK - pequenos ajustes necessarios" -ForegroundColor Yellow
} else {
    Write-Host "  SISTEMA COM PROBLEMAS - revisar antes da demo" -ForegroundColor Red
}
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""