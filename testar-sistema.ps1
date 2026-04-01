# ============================================================
# LeadCapture Pro - Script de Validacao Completa v3.0
# Roda apos deploy para validar TODOS os modulos
# ============================================================

param(
  [string]$BaseUrl  = "https://leadcapture-proprod.vercel.app",
  [string]$TenantId = "dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
)

$passou = 0; $falhou = 0; $avisos = 0
$relatorio = @()

function Ok($modulo, $msg) {
  Write-Host "  [PASS] $msg" -ForegroundColor Green
  $script:passou++
  $script:relatorio += [PSCustomObject]@{ Modulo=$modulo; Status="PASS"; Detalhe=$msg }
}
function Fail($modulo, $msg, $detalhe="") {
  Write-Host "  [FAIL] $msg" -ForegroundColor Red
  if ($detalhe) { Write-Host "         $detalhe" -ForegroundColor DarkRed }
  $script:falhou++
  $script:relatorio += [PSCustomObject]@{ Modulo=$modulo; Status="FAIL"; Detalhe="$msg $detalhe" }
}
function Aviso($modulo, $msg) {
  Write-Host "  [WARN] $msg" -ForegroundColor Yellow
  $script:avisos++
  $script:relatorio += [PSCustomObject]@{ Modulo=$modulo; Status="WARN"; Detalhe=$msg }
}

function Get-Api($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    return @{ ok=$true; status=$r.StatusCode; json=($r.Content|ConvertFrom-Json -EA SilentlyContinue); raw=$r.Content }
  } catch {
    $s = $_.Exception.Response.StatusCode.value__
    try { $b = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch { $b="" }
    return @{ ok=$false; status=$s; json=($b|ConvertFrom-Json -EA SilentlyContinue); raw=$b }
  }
}

function Post-Api($url, $body) {
  try {
    $j = $body | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $j -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
    return @{ ok=$true; status=$r.StatusCode; json=($r.Content|ConvertFrom-Json -EA SilentlyContinue) }
  } catch {
    $s = $_.Exception.Response.StatusCode.value__
    try { $b = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch { $b="" }
    return @{ ok=($s -lt 500); status=$s; json=($b|ConvertFrom-Json -EA SilentlyContinue) }
  }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  LeadCapture Pro - Validacao Completa v3.0" -ForegroundColor Cyan
Write-Host "  $BaseUrl" -ForegroundColor DarkCyan
Write-Host "  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── MODULO 1: Infraestrutura ─────────────────────────────────
Write-Host "[1] INFRAESTRUTURA" -ForegroundColor Magenta

$r = Get-Api "$BaseUrl/health"
if ($r.ok -and $r.json.status -eq "ok") {
  Ok "Infra" "Health OK | version: $($r.json.version)"
} else {
  Fail "Infra" "Health FALHOU - servidor pode estar down" "status: $($r.status)"
}

$r = Get-Api "$BaseUrl/api/chat/health"
if ($r.ok) {
  $k = if ($r.json.anthropic_configured) { "Anthropic OK" } else { "Anthropic NAO configurado" }
  Ok "Infra" "Chat health OK | $k"
} else {
  Fail "Infra" "Chat health falhou" "status: $($r.status)"
}

$r = Get-Api "$BaseUrl/api/whatsapp/status"
if ($r.ok -and $r.json.success) {
  $wk = if ($r.json.configured) { "Evolution API configurada" } else { "Evolution API NAO configurada" }
  Ok "Infra" "WhatsApp status OK | $wk"
  if (-not $r.json.configured) {
    Aviso "Infra" "EVOLUTION_API_KEY ausente - WhatsApp em modo simulado"
  }
} else {
  Fail "Infra" "WhatsApp status falhou" "status: $($r.status)"
}

Write-Host ""

# ── MODULO 2: Landing Pages ──────────────────────────────────
Write-Host "[2] LANDING PAGES" -ForegroundColor Magenta

foreach ($slug in @("lava-lava", "xyz-academia", "azul-fitness")) {
  $r = Get-Api "$BaseUrl/api/marcas/slug/$slug"
  if ($r.ok -and $r.json.marca) {
    Ok "Landing" "Slug '$slug' OK | $($r.json.marca.nome)"
  } else {
    Fail "Landing" "Slug '$slug' NAO encontrado" "status: $($r.status)"
  }
}

# Testa se landing page carrega no browser (HTML)
$r = Get-Api "$BaseUrl/lp/lava-lava"
if ($r.status -eq 200 -and $r.raw -like "*LeadCapture*") {
  Ok "Landing" "Landing page /lp/lava-lava carrega corretamente"
} elseif ($r.status -eq 200) {
  Ok "Landing" "Landing page retorna 200 (HTML carregado)"
} else {
  Fail "Landing" "Landing page /lp/lava-lava com erro" "status: $($r.status)"
}

Write-Host ""

# ── MODULO 3: Captacao de Leads ──────────────────────────────
Write-Host "[3] CAPTACAO DE LEADS" -ForegroundColor Magenta

$ts = Get-Date -Format "HHmmss"

# Lead com capital numerico direto
$leadNum = @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
  nome="Validacao Score $ts"
  email="score$ts@zafalao.dev"
  telefone="11999990000"
  capital_disponivel="250000"
  id_marca="22222222-2222-2222-2222-222222222222"
  fonte="teste-automatico"
}
$r = Post-Api "$BaseUrl/api/leads" $leadNum
if ($r.ok -and $r.json.success) {
  if ($r.json.score -gt 0) {
    Ok "Leads" "Score calculado corretamente | score: $($r.json.score) | $($r.json.categoria)"
  } else {
    Fail "Leads" "Score zerado para capital R 250k" "Bug de conversao de capital"
  }
} else {
  Fail "Leads" "POST /api/leads falhou" "$($r.json.error)"
}

# Lead com capital via chave do mapa
$leadMap = @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
  nome="Validacao Mapa $ts"
  email="mapa$ts@zafalao.dev"
  telefone="11999990001"
  capital_disponivel="100k-300k"
  id_marca="22222222-2222-2222-2222-222222222222"
  fonte="teste-automatico"
}
$r = Post-Api "$BaseUrl/api/leads" $leadMap
if ($r.ok -and $r.json.success) {
  Ok "Leads" "Capital via mapa OK | score: $($r.json.score)"
} else {
  Fail "Leads" "Lead via mapa falhou" "$($r.json.error)"
}

# Lead invalido deve retornar 400
$leadInv = @{ nome="X"; email="invalido" }
$r = Post-Api "$BaseUrl/api/leads" $leadInv
if (-not $r.json.success -or $r.status -eq 400) {
  Ok "Leads" "Validacao rejeita lead invalido corretamente"
} else {
  Fail "Leads" "Lead invalido NAO foi rejeitado" "Esperava erro, recebeu: $($r.status)"
}

Write-Host ""

# ── MODULO 4: Notificacoes ───────────────────────────────────
Write-Host "[4] NOTIFICACOES" -ForegroundColor Magenta

# Lead HOT pela landing page real (dispara email + whatsapp)
$leadHot = @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
  nome="Teste Notificacao $ts"
  email="notif$ts@zafalao.dev"
  telefone="11999990002"
  capital_disponivel="300000"
  id_marca="3f7ab1f0-9334-412a-9444-d915781c7198"
  fonte="landing-page-react"
  regiao_interesse="Sao Paulo - SP"
}
$r = Post-Api "$BaseUrl/api/leads" $leadHot
if ($r.ok -and $r.json.success -and $r.json.score -ge 65) {
  Ok "Notif" "Lead HOT criado | score: $($r.json.score) - email+whatsapp devem disparar"
  Aviso "Notif" "Verificar manualmente: email em leadcaptureadm@gmail.com + WhatsApp"
} elseif ($r.ok -and $r.json.success) {
  Aviso "Notif" "Lead criado com score $($r.json.score) - abaixo de 65, email quente NAO dispara"
} else {
  Fail "Notif" "Falha ao criar lead para teste de notificacao" "$($r.json.error)"
}

Write-Host ""

# ── MODULO 5: Chatbot IA ─────────────────────────────────────
Write-Host "[5] CHATBOT IA" -ForegroundColor Magenta

$chat = @{
  message="Como abordar lead hot com R 300k disponivel em SP?"
  tenant_id=$TenantId
  historico=@()
}
$r = Post-Api "$BaseUrl/api/chat/message" $chat
if ($r.ok -and $r.json.success -and $r.json.resposta) {
  $prev = $r.json.resposta.Substring(0,[Math]::Min(80,$r.json.resposta.Length))
  Ok "Chat" "Chatbot respondeu | $prev..."
} elseif ($r.json.error -like "*credito*" -or $r.json.error -like "*credit*" -or $r.json.error -like "*balance*") {
  Aviso "Chat" "Chatbot sem creditos Anthropic (adicionar em console.anthropic.com/billing)"
} elseif ($r.json.error -like "*configurado*") {
  Aviso "Chat" "ANTHROPIC_API_KEY nao configurada no Vercel"
} else {
  Fail "Chat" "Chatbot falhou" "$($r.json.error)"
}

Write-Host ""

# ── MODULO 6: WhatsApp ───────────────────────────────────────
Write-Host "[6] WHATSAPP IA" -ForegroundColor Magenta

$r = Get-Api "$BaseUrl/api/whatsapp/status"
if ($r.ok -and $r.json.configured) {
  Ok "WA" "Evolution API configurada | instance: $($r.json.instance)"
  Ok "WA" "Webhook URL: $($r.json.webhook_url)"
  Aviso "WA" "Testar manualmente: preencher /lp/lava-lava com celular real"
} elseif ($r.ok) {
  Fail "WA" "EVOLUTION_API_KEY ausente no Vercel" "Adicionar em Vercel Settings > Env Vars"
} else {
  Fail "WA" "Rota /api/whatsapp/status nao responde" "Verificar se app.js tem rota ativa"
}

Write-Host ""

# ── MODULO 7: Rate Limiting ──────────────────────────────────
Write-Host "[7] RATE LIMITING" -ForegroundColor Magenta

$bloqueou = $false
for ($i = 0; $i -lt 35; $i++) {
  $r = Post-Api "$BaseUrl/api/leads" @{ nome="X" }
  if ($r.status -eq 429) { $bloqueou = $true; break }
}
if ($bloqueou) {
  Ok "RateLimit" "Rate limiting ativo - bloqueou apos multiplas requests"
} else {
  Aviso "RateLimit" "Rate limiting nao bloqueou em 35 requests (limite pode estar alto)"
}

Write-Host ""

# ── RELATORIO FINAL ──────────────────────────────────────────
$total = $passou + $falhou
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  RELATORIO FINAL - LeadCapture Pro" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Agrupa por modulo
$modulos = $relatorio | Group-Object Modulo
foreach ($mod in $modulos) {
  $passouMod = ($mod.Group | Where-Object Status -eq "PASS").Count
  $falhouMod = ($mod.Group | Where-Object Status -eq "FAIL").Count
  $avisosMod = ($mod.Group | Where-Object Status -eq "WARN").Count
  $cor = if ($falhouMod -gt 0) { "Red" } elseif ($avisosMod -gt 0) { "Yellow" } else { "Green" }
  Write-Host "  $($mod.Name.PadRight(12)) PASS:$passouMod  FAIL:$falhouMod  WARN:$avisosMod" -ForegroundColor $cor
}

Write-Host ""
Write-Host "  TOTAL: $passou PASS / $falhou FAIL / $avisos WARN de $total testes" -ForegroundColor $(if($falhou -eq 0){"Green"}elseif($falhou -le 2){"Yellow"}else{"Red"})
Write-Host ""

if ($falhou -eq 0) {
  Write-Host "  SISTEMA OK - pronto para demo!" -ForegroundColor Green
} elseif ($falhou -le 2) {
  Write-Host "  SISTEMA QUASE OK - revisar itens FAIL antes da demo" -ForegroundColor Yellow
} else {
  Write-Host "  SISTEMA COM PROBLEMAS - reportar aos arquitetos" -ForegroundColor Red
}

Write-Host ""
Write-Host "  ACOES MANUAIS NECESSARIAS:" -ForegroundColor Cyan
Write-Host "  1. Verificar email em leadcaptureadm@gmail.com" -ForegroundColor White
Write-Host "  2. Verificar WhatsApp Business (numero conectado)" -ForegroundColor White
Write-Host "  3. Testar /lp/lava-lava no browser" -ForegroundColor White
Write-Host "  4. Testar modal do lead no Kanban (status comercial)" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""