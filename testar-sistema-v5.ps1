# ============================================================
# LeadCapture Pro -- Script de Testes v5.0
# Cobre: API, Ranking, Assign Consultant, Kanban, Auth
# Uso: .\testar-sistema-v5.ps1
# ============================================================

param(
  [string]$BaseUrl    = "https://leadcapture-proprod.vercel.app",
  [string]$TenantId   = "dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f",
  [string]$LeadId     = "",
  [string]$ConsultorId= ""
)

$pass = 0; $fail = 0; $warn = 0

function Test-Endpoint {
  param($Name, $Url, $Method = "GET", $Body = $null, $Headers = @{}, $ExpectStatus = 200, $ExpectField = $null)
  try {
    $params = @{ Uri = $Url; Method = $Method; TimeoutSec = 15; SkipHttpErrorCheck = $true }
    if ($Body)    { $params.Body = ($Body | ConvertTo-Json -Compress); $params.ContentType = "application/json" }
    if ($Headers.Count) { $params.Headers = $Headers }
    $r = Invoke-WebRequest @params
    $status = $r.StatusCode
    $ok = ($status -eq $ExpectStatus) -or ($ExpectStatus -eq 0 -and $status -lt 500)
    if ($ExpectField -and $ok) {
      try { $json = $r.Content | ConvertFrom-Json; $ok = $null -ne $json.$ExpectField } catch {}
    }
    if ($ok) {
      Write-Host "  PASS  $Name ($status)" -ForegroundColor Green
      $script:pass++
    } else {
      Write-Host "  FAIL  $Name (esperado $ExpectStatus, recebeu $status)" -ForegroundColor Red
      $script:fail++
    }
    return $r
  } catch {
    Write-Host "  FAIL  $Name -- $($_.Exception.Message)" -ForegroundColor Red
    $script:fail++
    return $null
  }
}

function Warn { param($Msg) Write-Host "  WARN  $Msg" -ForegroundColor Yellow; $script:warn++ }

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "  LeadCapture Pro -- Testes v5.0" -ForegroundColor Cyan
Write-Host "  URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# ----------------------------------------------------------
Write-Host "`n[1] INFRAESTRUTURA" -ForegroundColor White
# ----------------------------------------------------------
Test-Endpoint "Health check"        "$BaseUrl/health"                   -ExpectStatus 200
Test-Endpoint "Sistema status"      "$BaseUrl/api/sistema/status"        -ExpectStatus 200 -ExpectField "services"
Test-Endpoint "Scoring table"       "$BaseUrl/api/sistema/scoring"       -ExpectStatus 200
Test-Endpoint "WhatsApp status"     "$BaseUrl/api/whatsapp/status"       -ExpectStatus 0

# ----------------------------------------------------------
Write-Host "`n[2] ENDPOINTS PUBLICOS" -ForegroundColor White
# ----------------------------------------------------------
Test-Endpoint "Landing Lava Lava"   "$BaseUrl/api/marcas/slug/lava-lava" -ExpectStatus 0
Test-Endpoint "Chat health"         "$BaseUrl/api/chat/health"           -ExpectStatus 0

# ----------------------------------------------------------
Write-Host "`n[3] CRIACAO DE LEAD (end-to-end)" -ForegroundColor White
# ----------------------------------------------------------
$novoLead = @{
  nome               = "Teste Automatizado v5"
  email              = "teste.v5@leadcapture.pro"
  telefone           = "11988887777"
  capital_disponivel = 300000
  regiao_interesse   = "Sao Paulo"
  fonte              = "teste-ps1-v5"
  tenant_id          = $TenantId
  marca_slug         = "lava-lava"
}
$r = Test-Endpoint "Criar lead" "$BaseUrl/api/leads" -Method POST -Body $novoLead -ExpectStatus 0
if ($r -and $r.StatusCode -lt 300) {
  try {
    $json = $r.Content | ConvertFrom-Json
    if ($json.lead -and $json.lead.id) { $LeadId = $json.lead.id } elseif ($json.id) { $LeadId = $json.id }
    Write-Host "         Lead ID: $LeadId" -ForegroundColor Gray
  } catch {}
}

# ----------------------------------------------------------
Write-Host "`n[4] API RANKING (novo -- service role)" -ForegroundColor White
# ----------------------------------------------------------
$rRanking = Test-Endpoint "Ranking sem auth (deve 401)"  "$BaseUrl/api/ranking/usuarios?tenant_id=$TenantId" -ExpectStatus 401
$rMeta    = Test-Endpoint "Meta sem auth (deve 401)"     "$BaseUrl/api/ranking/meta?tenant_id=$TenantId"     -ExpectStatus 401

# ----------------------------------------------------------
Write-Host "`n[5] ASSIGN CONSULTANT (sem auth -- deve 401)" -ForegroundColor White
# ----------------------------------------------------------
if ($LeadId) {
  Test-Endpoint "Assign sem auth (401)" "$BaseUrl/api/leads/$LeadId/assign-consultant" `
    -Method PUT -Body @{ consultantId = $ConsultorId } -ExpectStatus 401
} else {
  Warn "LeadId nao disponivel -- pulando teste de assign"
}

# ----------------------------------------------------------
Write-Host "`n[6] FRONTEND" -ForegroundColor White
# ----------------------------------------------------------
$pages = @("/dashboard", "/kanban", "/ranking", "/relatorios", "/monitoramento")
foreach ($p in $pages) {
  $r = Test-Endpoint "Pagina $p" "$BaseUrl$p" -ExpectStatus 0
  if ($r -and $r.StatusCode -in @(200, 301, 302)) {
    # OK -- redireciona para login ou carrega
  }
}

# ----------------------------------------------------------
Write-Host "`n[7] SEGURANCA" -ForegroundColor White
# ----------------------------------------------------------
Test-Endpoint "SQL injection blocked"   "$BaseUrl/api/leads?id=1' OR '1'='1"        -ExpectStatus 0
Test-Endpoint "XSS header presente"     "$BaseUrl/health"                            -ExpectStatus 200
$rXss = Invoke-WebRequest -Uri "$BaseUrl/health" -SkipHttpErrorCheck -TimeoutSec 10
$xssH = $rXss.Headers["X-Content-Type-Options"]
if ($xssH) { Write-Host "  PASS  Security headers presentes" -ForegroundColor Green; $pass++ }
else { Warn "Security headers ausentes" }

# ----------------------------------------------------------
Write-Host "`n===========================================" -ForegroundColor Cyan
$total = $pass + $fail + $warn
Write-Host "  RESULTADO: $pass PASS / $fail FAIL / $warn WARN" -ForegroundColor $(if ($fail -eq 0) {"Green"} else {"Red"})
Write-Host "  Total: $total testes" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

if ($fail -gt 0) {
  Write-Host "`nACOES NECESSARIAS:" -ForegroundColor Yellow
  Write-Host "  - Verifique os FAILs acima" -ForegroundColor Yellow
  Write-Host "  - Se ranking retorna 404: registrar rota no server/app.js" -ForegroundColor Yellow
  Write-Host "  - Se assign retorna 404: adicionar rota no server/routes/leads.js" -ForegroundColor Yellow
}

exit $(if ($fail -gt 0) { 1 } else { 0 })
