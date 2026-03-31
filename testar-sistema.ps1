# LeadCapture Pro - Testes Automatizados v2.0
# Sem caracteres especiais - compativel com Windows PowerShell

param(
  [string]$BaseUrl  = "https://leadcapture-proprod.vercel.app",
  [string]$TenantId = "dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
)

$passou = 0; $falhou = 0; $avisos = 0

function Ok($msg)    { Write-Host "  [PASS] $msg" -ForegroundColor Green;  $script:passou++ }
function Fail($m,$d) { Write-Host "  [FAIL] $m"  -ForegroundColor Red; if($d){Write-Host "         $d" -ForegroundColor DarkRed}; $script:falhou++ }
function Aviso($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow; $script:avisos++ }

function Get-Api($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    return @{ ok=$true; status=$r.StatusCode; json=($r.Content|ConvertFrom-Json -ErrorAction SilentlyContinue) }
  } catch {
    $s = $_.Exception.Response.StatusCode.value__
    try { $b = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch { $b="" }
    return @{ ok=$false; status=$s; json=($b|ConvertFrom-Json -ErrorAction SilentlyContinue) }
  }
}

function Post-Api($url, $body) {
  try {
    $j = $body | ConvertTo-Json -Compress
    $r = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $j -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
    return @{ ok=$true; status=$r.StatusCode; json=($r.Content|ConvertFrom-Json -ErrorAction SilentlyContinue) }
  } catch {
    $s = $_.Exception.Response.StatusCode.value__
    try { $b = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch { $b="" }
    return @{ ok=($s -lt 500); status=$s; json=($b|ConvertFrom-Json -ErrorAction SilentlyContinue) }
  }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  LeadCapture Pro - Testes v2.0"       -ForegroundColor Cyan
Write-Host "  $BaseUrl"                             -ForegroundColor DarkCyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# BLOCO 1 - Health
Write-Host "[BLOCO 1] Health Check" -ForegroundColor Yellow
$r = Get-Api "$BaseUrl/health"
if ($r.ok -and $r.json.status -eq "ok") { Ok "Health OK | version: $($r.json.version)" } else { Fail "Health falhou" "status: $($r.status)" }
$r = Get-Api "$BaseUrl/api/chat/health"
if ($r.ok) { $k=if($r.json.anthropic_configured){"ANTHROPIC OK"}else{"ANTHROPIC ausente"}; Ok "Chat health | $k" } else { Fail "Chat health falhou" "" }
Write-Host ""

# BLOCO 2 - Landing Pages
Write-Host "[BLOCO 2] Landing Pages" -ForegroundColor Yellow
foreach ($s in @("lava-lava","xyz-academia","azul-fitness")) {
  $r = Get-Api "$BaseUrl/api/marcas/slug/$s"
  if ($r.ok -and $r.json.marca) { Ok "Slug '$s' | $($r.json.marca.nome)" } else { Fail "Slug '$s' nao encontrado" "status: $($r.status)" }
}
Write-Host ""

# BLOCO 3 - Captacao de Leads
Write-Host "[BLOCO 3] Captacao de Leads" -ForegroundColor Yellow
$ts = Get-Date -Format "HHmmss"

$leadNum = @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"; nome="Teste Score $ts"
  email="score$ts@zafalao.dev"; telefone="11999990000"
  capital_disponivel="250000"; id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-automatico"
}
$r = Post-Api "$BaseUrl/api/leads" $leadNum
if ($r.ok -and $r.json.success) {
  if ($r.json.score -gt 0) { Ok "Lead capital numerico | score: $($r.json.score) | $($r.json.categoria)" }
  else { Fail "Score zerado para capital 250000" "Bug de conversao de capital" }
} else { Fail "POST /api/leads falhou" "$($r.json.error)" }

$leadMap = @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"; nome="Teste Mapa $ts"
  email="mapa$ts@zafalao.dev"; telefone="11999990000"
  capital_disponivel="100k-300k"; id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-automatico"
}
$r = Post-Api "$BaseUrl/api/leads" $leadMap
if ($r.ok -and $r.json.success) { Ok "Lead capital mapa | score: $($r.json.score)" } else { Fail "Lead via mapa falhou" "$($r.json.error)" }

$leadInv = @{ nome="X"; email="invalido" }
$r = Post-Api "$BaseUrl/api/leads" $leadInv
if (-not $r.json.success) { Ok "Validacao rejeita lead invalido corretamente" } else { Fail "Lead invalido nao foi rejeitado" "" }
Write-Host ""

# BLOCO 4 - Chatbot
Write-Host "[BLOCO 4] Chatbot IA" -ForegroundColor Yellow
$chat = @{ message="Como abordar lead hot com R 250k?"; tenant_id=$TenantId; historico=@() }
$r = Post-Api "$BaseUrl/api/chat/message" $chat
if ($r.ok -and $r.json.success) {
  $prev = $r.json.resposta.Substring(0,[Math]::Min(70,$r.json.resposta.Length))
  Ok "Chatbot respondeu | $prev..."
} elseif ($r.json.error -like "*credito*" -or $r.json.error -like "*credit*" -or $r.json.error -like "*configurado*") {
  Aviso "Chatbot sem creditos Anthropic (adicionar em console.anthropic.com/billing)"
} else { Fail "Chatbot falhou" "$($r.json.error)" }
Write-Host ""

# RESULTADO
$total = $passou + $falhou
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  RESULTADO: $passou PASS / $falhou FAIL / $avisos WARN de $total testes" -ForegroundColor $(if($falhou-eq 0){"Green"}else{"Yellow"})
if ($falhou -eq 0) { Write-Host "  SISTEMA OK - pronto para demo!" -ForegroundColor Green }
elseif ($falhou -le 2) { Write-Host "  QUASE OK - revisar itens FAIL" -ForegroundColor Yellow }
else { Write-Host "  PROBLEMAS - corrigir antes da demo" -ForegroundColor Red }
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""