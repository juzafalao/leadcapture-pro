# LeadCapture Pro -- Testes v5.1 (compativel PowerShell 5+)
param(
  [string]$BaseUrl     = "https://leadcapture-proprod.vercel.app",
  [string]$TenantId    = "dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f",
  [string]$LeadId      = "",
  [string]$ConsultorId = ""
)

$pass = 0; $fail = 0; $warn = 0

function Req {
  param($Url, $Method = "GET", $Body = $null, $Headers = @{})
  try {
    $wr = [System.Net.WebRequest]::Create($Url)
    $wr.Method  = $Method
    $wr.Timeout = 15000
    foreach ($k in $Headers.Keys) { $wr.Headers.Add($k, $Headers[$k]) }
    if ($Body) {
      $wr.ContentType = "application/json"
      $bytes = [System.Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Compress))
      $wr.ContentLength = $bytes.Length
      $s = $wr.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
    }
    try {
      $resp = $wr.GetResponse()
      $code = [int]$resp.StatusCode
      $body = (New-Object System.IO.StreamReader $resp.GetResponseStream()).ReadToEnd()
      $resp.Close()
      return @{ Code = $code; Body = $body; Ok = $true }
    } catch [System.Net.WebException] {
      $code = [int]$_.Exception.Response.StatusCode
      $body = ""
      try { $body = (New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()).ReadToEnd() } catch {}
      return @{ Code = $code; Body = $body; Ok = $true }
    }
  } catch {
    return @{ Code = 0; Body = ""; Ok = $false; Err = $_.Exception.Message }
  }
}

function T {
  param($Name, $Url, $Method = "GET", $Body = $null, $Headers = @{}, $Expect = 200)
  $r = Req -Url $Url -Method $Method -Body $Body -Headers $Headers
  if (-not $r.Ok) {
    Write-Host "  FAIL  $Name -- $($r.Err)" -ForegroundColor Red; $script:fail++; return $r
  }
  $ok = ($Expect -eq 0 -and $r.Code -lt 500) -or ($r.Code -eq $Expect)
  if ($ok) { Write-Host "  PASS  $Name ($($r.Code))" -ForegroundColor Green; $script:pass++ }
  else     { Write-Host "  FAIL  $Name (esperado $Expect, recebeu $($r.Code))" -ForegroundColor Red; $script:fail++ }
  return $r
}
function W { param($M) Write-Host "  WARN  $M" -ForegroundColor Yellow; $script:warn++ }

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  LeadCapture Pro -- Testes v5.1" -ForegroundColor Cyan
Write-Host "  $BaseUrl" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan

# 1. INFRAESTRUTURA
Write-Host "`n[1] INFRAESTRUTURA" -ForegroundColor White
T "Health check"    "$BaseUrl/health"             -Expect 200
T "Sistema status"  "$BaseUrl/api/sistema/status" -Expect 200
T "Scoring table"   "$BaseUrl/api/sistema/scoring"-Expect 200
T "WhatsApp status" "$BaseUrl/api/whatsapp/status"-Expect 0

# 2. ENDPOINTS PUBLICOS
Write-Host "`n[2] ENDPOINTS PUBLICOS" -ForegroundColor White
T "Marcas slug"  "$BaseUrl/api/marcas/slug/lava-lava" -Expect 0
T "Chat health"  "$BaseUrl/api/chat/health"            -Expect 0

# 3. CRIACAO DE LEAD
Write-Host "`n[3] CRIACAO DE LEAD" -ForegroundColor White
$body = @{
  nome="Teste v5.1"; email="teste.v51@lcp.pro"; telefone="11988887777"
  capital_disponivel=300000; regiao_interesse="Sao Paulo"
  fonte="teste-ps1-v51"; tenant_id=$TenantId; marca_slug="lava-lava"
}
$r = T "Criar lead" "$BaseUrl/api/leads" -Method POST -Body $body -Expect 0
if ($r.Body) {
  try {
    $j = $r.Body | ConvertFrom-Json
    if ($j.lead -and $j.lead.id)  { $LeadId = $j.lead.id }
    elseif ($j.id)                 { $LeadId = $j.id }
    if ($LeadId) { Write-Host "         Lead: $LeadId" -ForegroundColor Gray }
  } catch {}
}

# 4. API RANKING
Write-Host "`n[4] API RANKING (service role)" -ForegroundColor White
$rr = T "GET /api/ranking/usuarios (sem auth=401)" "$BaseUrl/api/ranking/usuarios?tenant_id=$TenantId" -Expect 401
$rm = T "GET /api/ranking/meta (sem auth=401)"     "$BaseUrl/api/ranking/meta?tenant_id=$TenantId"     -Expect 401
if ($rr.Code -eq 404) { W "Rota /api/ranking NAO registrada em server/app.js -- adicione a linha import+use" }
if ($rm.Code -eq 404) { W "Rota /api/ranking/meta NAO registrada" }

# 5. ASSIGN CONSULTANT
Write-Host "`n[5] ASSIGN CONSULTANT" -ForegroundColor White
if ($LeadId) {
  $ra = T "PUT assign sem auth (401)" "$BaseUrl/api/leads/$LeadId/assign-consultant" -Method PUT -Body @{consultantId=""} -Expect 401
  if ($ra.Code -eq 404) { W "Rota assign-consultant NAO registrada em server/routes/leads.js" }
  if ($ra.Code -eq 405) { W "Rota existe mas metodo errado" }
} else { W "LeadId indisponivel -- pulando assign" }

# 6. FRONTEND (verifica se responde)
Write-Host "`n[6] FRONTEND" -ForegroundColor White
foreach ($p in @("/", "/login", "/dashboard")) {
  $rf = Req -Url "$BaseUrl$p"
  if ($rf.Code -in @(200,301,302,304)) { Write-Host "  PASS  Pagina $p ($($rf.Code))" -ForegroundColor Green; $pass++ }
  else { Write-Host "  FAIL  Pagina $p ($($rf.Code))" -ForegroundColor Red; $fail++ }
}

# 7. SEGURANCA
Write-Host "`n[7] SEGURANCA" -ForegroundColor White
$rh = Req -Url "$BaseUrl/health"
if ($rh.Ok -and $rh.Code -eq 200) {
  Write-Host "  PASS  Health acessivel" -ForegroundColor Green; $pass++
} else { Write-Host "  FAIL  Health inacessivel" -ForegroundColor Red; $fail++ }

# RESULTADO
Write-Host "`n============================================" -ForegroundColor Cyan
$total = $pass+$fail+$warn
$cor   = if ($fail -eq 0) {"Green"} else {"Red"}
Write-Host "  $pass PASS / $fail FAIL / $warn WARN  (total $total)" -ForegroundColor $cor
Write-Host "============================================" -ForegroundColor Cyan

if ($warn -gt 0) {
  Write-Host "`nACOES NECESSARIAS:" -ForegroundColor Yellow
  Write-Host "  1. Se ranking 404: adicionar em server/app.js:" -ForegroundColor Yellow
  Write-Host "       import rankingRouter from './routes/ranking.js'" -ForegroundColor Gray
  Write-Host "       app.use('/api/ranking', statusLimiter, rankingRouter)" -ForegroundColor Gray
  Write-Host "  2. Se assign 404: colar leads_assign_patch.js em server/routes/leads.js" -ForegroundColor Yellow
}

exit $(if ($fail -gt 0) {1} else {0})
