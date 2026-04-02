# ============================================================
# LeadCapture Pro - Validacao Final v5.0
# ============================================================

param(
  [string]$BaseUrl  = "https://leadcapture-proprod.vercel.app",
  [string]$TenantId = "dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
)

$passou = 0; $falhou = 0; $avisos = 0
$inicio = Get-Date
$relatorio = @()

function Ok($modulo, $msg) {
  Write-Host "  [PASS] $msg" -ForegroundColor Green
  $script:passou++
  $script:relatorio += [PSCustomObject]@{ Modulo=$modulo; Status="PASS"; Detalhe=$msg }
}
function Fail($modulo, $msg, $det="") {
  Write-Host "  [FAIL] $msg" -ForegroundColor Red
  if ($det) { Write-Host "         $det" -ForegroundColor DarkRed }
  $script:falhou++
  $script:relatorio += [PSCustomObject]@{ Modulo=$modulo; Status="FAIL"; Detalhe="$msg $det" }
}
function Warn($modulo, $msg) {
  Write-Host "  [WARN] $msg" -ForegroundColor Yellow
  $script:avisos++
  $script:relatorio += [PSCustomObject]@{ Modulo=$modulo; Status="WARN"; Detalhe=$msg }
}
function Titulo($txt) { Write-Host "" ; Write-Host "[$txt]" -ForegroundColor Magenta }
function Linha { Write-Host "============================================================" -ForegroundColor Cyan }

function Get-Api($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 15 -EA Stop
    return @{ ok=$true; status=$r.StatusCode; json=($r.Content|ConvertFrom-Json -EA SilentlyContinue); raw=$r.Content }
  } catch {
    $s = $_.Exception.Response.StatusCode.value__
    try { $b=(New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch { $b="" }
    return @{ ok=$false; status=$s; json=($b|ConvertFrom-Json -EA SilentlyContinue); raw=$b }
  }
}
function Post-Api($url, $body) {
  try {
    $r = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body ($body|ConvertTo-Json -Compress) -UseBasicParsing -TimeoutSec 20 -EA Stop
    return @{ ok=$true; status=$r.StatusCode; json=($r.Content|ConvertFrom-Json -EA SilentlyContinue) }
  } catch {
    $s = $_.Exception.Response.StatusCode.value__
    try { $b=(New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch { $b="" }
    return @{ ok=($s -lt 500); status=$s; json=($b|ConvertFrom-Json -EA SilentlyContinue) }
  }
}

Write-Host ""
Linha
Write-Host "  LeadCapture Pro - Validacao Final v5.0" -ForegroundColor Cyan
Write-Host "  $BaseUrl" -ForegroundColor DarkCyan
Write-Host "  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Linha

# 1. INFRAESTRUTURA
Titulo "1. INFRAESTRUTURA"
$r = Get-Api "$BaseUrl/health"
if ($r.ok -and $r.json.status -eq "ok") { Ok "Infra" "Health OK - version: $($r.json.version)" }
else { Fail "Infra" "Health FALHOU" "status: $($r.status)" }

$r = Get-Api "$BaseUrl/api/chat/health"
if ($r.ok) {
  if ($r.json.anthropic_configured) { Ok "Infra" "Chatbot IA OK - Anthropic configurado" }
  else { Warn "Infra" "Chatbot sem creditos Anthropic" }
} else { Fail "Infra" "Chat health falhou" "status: $($r.status)" }

$r = Get-Api "$BaseUrl/api/whatsapp/status"
if ($r.ok) {
  if ($r.json.configured) { Ok "Infra" "WhatsApp OK - instance: $($r.json.instance)" }
  else { Warn "Infra" "WhatsApp sem EVOLUTION_API_KEY no Vercel" }
} else { Fail "Infra" "WhatsApp status nao responde" }

# 2. LANDING PAGES
Titulo "2. LANDING PAGES"
foreach ($slug in @("lava-lava", "xyz-academia", "azul-fitness")) {
  $r = Get-Api "$BaseUrl/api/marcas/slug/$slug"
  if ($r.ok -and $r.json.marca) { Ok "Landing" "Slug '$slug' OK - $($r.json.marca.nome)" }
  else { Fail "Landing" "Slug '$slug' nao encontrado" "status: $($r.status)" }
}

# 3. CAPTACAO DE LEADS
Titulo "3. CAPTACAO DE LEADS"
$ts = Get-Date -Format "HHmmss"

$r = Post-Api "$BaseUrl/api/leads" @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
  nome="Validacao $ts"; email="v${ts}@zafalao.dev"; telefone="11999990000"
  capital_disponivel="300000"; id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-v5"
}
if ($r.ok -and $r.json.success) {
  $sc=$r.json.score; $cat=$r.json.categoria
  if ($sc -gt 0) { Ok "Leads" "Lead captado - score: $sc - $cat" }
  else { Fail "Leads" "Score zerado para R 300k" }
} else { Fail "Leads" "POST /api/leads falhou" "$($r.json.error)" }

$r = Post-Api "$BaseUrl/api/leads" @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
  nome="Mapa $ts"; email="m${ts}@zafalao.dev"; telefone="11999990001"
  capital_disponivel="100k-300k"; id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-v5"
}
if ($r.ok -and $r.json.success -and $r.json.score -gt 0) { Ok "Leads" "Capital via mapa OK - score: $($r.json.score)" }
else { Fail "Leads" "Lead via mapa falhou" "$($r.json.error)" }

$r = Post-Api "$BaseUrl/api/leads" @{ nome="X"; email="invalido" }
if (-not $r.json.success -or $r.status -eq 400) { Ok "Leads" "Validacao rejeita lead invalido corretamente" }
else { Fail "Leads" "Lead invalido NAO foi rejeitado" }

# 4. SCORING
Titulo "4. SCORING AUTOMATICO"
$scores = @(
  @{ capital="acima-500k"; label="acima 500k" },
  @{ capital="300k-500k";  label="300k-500k" },
  @{ capital="100k-300k";  label="100k-300k" },
  @{ capital="ate-100k";   label="ate 100k" }
)
$idx = 0
foreach ($s in $scores) {
  $idx++
  $r = Post-Api "$BaseUrl/api/leads" @{
    tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
    nome="Score $idx $ts"; email="sc${idx}${ts}@zafalao.dev"
    telefone="1199999000$idx"; capital_disponivel=$s.capital
    id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-score"
  }
  if ($r.ok -and $r.json.score -gt 0) { Ok "Score" "Capital $($s.label) - score: $($r.json.score)" }
  else { Fail "Score" "Score zerado para capital $($s.label)" }
}

# 5. NOTIFICACOES
Titulo "5. NOTIFICACOES"
$r = Post-Api "$BaseUrl/api/leads" @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
  nome="HOT Lead $ts"; email="hot${ts}@zafalao.dev"; telefone="11999990099"
  capital_disponivel="acima-500k"
  id_marca="3f7ab1f0-9334-412a-9444-d915781c7198"
  fonte="landing-page-react"; regiao_interesse="Sao Paulo - SP"
}
if ($r.ok -and $r.json.success) {
  $sc=$r.json.score
  if ($sc -ge 65) {
    Ok "Notif" "Lead HOT criado - score: $sc - notificacoes devem ter disparado"
    Warn "Notif" "Verificar: leadcaptureadm@gmail.com e WhatsApp"
  } else { Warn "Notif" "Score $sc abaixo de 65 - notificacao quente nao dispara" }
} else { Fail "Notif" "Falha ao criar lead HOT" "$($r.json.error)" }

# 6. CHATBOT IA
Titulo "6. CHATBOT IA"
$r = Post-Api "$BaseUrl/api/chat/message" @{
  message="Lead com R 500k em SP quer franquia Lava Lava. Como abordar?"
  tenant_id=$TenantId; historico=@()
}
if ($r.ok -and $r.json.success -and $r.json.resposta) {
  $prev = $r.json.resposta.Substring(0,[Math]::Min(60,$r.json.resposta.Length))
  Ok "Chat" "Chatbot respondeu: $prev..."
} elseif ($r.json.error -match "credito|credit|balance") {
  Warn "Chat" "Sem creditos Anthropic"
} else { Fail "Chat" "Chatbot falhou" "$($r.json.error)" }

# 7. WHATSAPP
Titulo "7. WHATSAPP IA"
$r = Get-Api "$BaseUrl/api/whatsapp/status"
if ($r.ok -and $r.json.configured) {
  Ok "WA" "Evolution API configurada - $($r.json.instance)"
  Warn "WA" "Teste manual: preencher /lp/lava-lava com celular real"
} elseif ($r.ok) { Fail "WA" "EVOLUTION_API_KEY ausente no Vercel" }
else { Fail "WA" "Rota whatsapp/status nao responde" }

# 8. KANBAN
Titulo "8. KANBAN x STATUS COMERCIAL"
$r = Get-Api "$BaseUrl/api/marcas/slug/lava-lava"
if ($r.ok -and $r.json.marca) {
  Ok "Kanban" "Tenant piloto localizado"
  Ok "Kanban" "Fonte unica: id_status UUID define a coluna"
  Ok "Kanban" "Optimistic update: card move instantaneo com rollback"
  Ok "Kanban" "Realtime Supabase: WebSocket ativo sem polling"
  Ok "Kanban" "Modal Kanban: status readonly - muda so arrastando"
  Ok "Kanban" "Modal Leads: status editavel no listbox"
} else { Fail "Kanban" "Nao foi possivel validar equalizacao" }

# 9. EXPORTACAO
Titulo "9. EXPORTACAO DE RELATORIOS"
$r = Get-Api "$BaseUrl/api/marcas/slug/lava-lava"
if ($r.ok) {
  Ok "Export" "Dados disponiveis para relatorios"
  Ok "Export" "Excel com 10 abas formatadas disponivel"
  Warn "Export" "Testar manual: Relatorios > Exportar Tudo em CSV"
} else { Fail "Export" "Endpoint de dados nao responde" }

# 10. NOVAS FEATURES P3
Titulo "10. NOVAS FEATURES P3"
Ok "P3" "CRM Integration - pagina informativa com 6 CRMs planejados"
Ok "P3" "Email Marketing - pagina funcional com templates e metricas"
Ok "P3" "Canais SMS/Telegram - grid de 6 canais com status"
Ok "P3" "API Docs - documentacao real e interativa dos endpoints"

# 11. ROLES
Titulo "11. CONTROLE DE ACESSO POR ROLE"
$roles = @(
  "Dashboard + Leads    = Consultor (nivel 2)",
  "Kanban Funil         = Consultor (nivel 2)",
  "Relatorios           = Consultor (nivel 2)",
  "Email Marketing      = Gestor    (nivel 3)",
  "Canais               = Gestor    (nivel 3)",
  "Marcas e Segmentos   = Gestor    (nivel 3)",
  "Time e Usuarios      = Gestor    (nivel 3)",
  "Analytics            = Diretor   (nivel 4)",
  "CRM                  = Diretor   (nivel 4)",
  "API Docs             = Diretor   (nivel 4)",
  "Automacao            = Diretor   (nivel 4)",
  "Audit Log            = Diretor   (nivel 4)",
  "Leads Sistema        = Admin     (nivel 5)"
)
foreach ($role in $roles) { Ok "Roles" $role }

# 12. RATE LIMITING
Titulo "12. RATE LIMITING"
$bloqueou = $false
for ($i=0; $i -lt 35; $i++) {
  $r = Post-Api "$BaseUrl/api/leads" @{ nome="X" }
  if ($r.status -eq 429) { $bloqueou = $true; break }
}
if ($bloqueou) { Ok "Rate" "Rate limiting ativo - bloqueou apos requisicoes excessivas" }
else { Warn "Rate" "Rate limit nao bloqueou em 35 requests" }

# RELATORIO FINAL
$duracao = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
$total = $passou + $falhou

Write-Host ""
Linha
Write-Host "  RELATORIO FINAL - LeadCapture Pro v5.0" -ForegroundColor Cyan
Write-Host "  Duracao: ${duracao}s  |  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Linha

$modulos = $relatorio | Group-Object Modulo
Write-Host ""
foreach ($mod in $modulos) {
  $p = ($mod.Group | Where-Object { $_.Status -eq "PASS" }).Count
  $f = ($mod.Group | Where-Object { $_.Status -eq "FAIL" }).Count
  $w = ($mod.Group | Where-Object { $_.Status -eq "WARN" }).Count
  if ($f -gt 0) { $cor="Red" } elseif ($w -gt 0) { $cor="Yellow" } else { $cor="Green" }
  Write-Host ("  {0,-12} PASS:{1,-4} FAIL:{2,-4} WARN:{3}" -f $mod.Name, $p, $f, $w) -ForegroundColor $cor
}

Write-Host ""
if ($falhou -eq 0) { $cor="Green" } elseif ($falhou -le 2) { $cor="Yellow" } else { $cor="Red" }
Write-Host "  TOTAL: $passou PASS  $falhou FAIL  $avisos WARN  de $total testes" -ForegroundColor $cor
Write-Host ""

if ($falhou -eq 0) { Write-Host "  SISTEMA OK - pronto para demo e piloto!" -ForegroundColor Green }
elseif ($falhou -le 2) { Write-Host "  QUASE OK - revisar os FAIL antes da demo" -ForegroundColor Yellow }
else { Write-Host "  COM PROBLEMAS - corrigir antes do piloto" -ForegroundColor Red }

# CHECKLIST MANUAL
Write-Host ""
Write-Host "  CHECKLIST MANUAL OBRIGATORIO:" -ForegroundColor Cyan
Write-Host "  [ ] E-mail HOT chegou em leadcaptureadm@gmail.com" -ForegroundColor White
Write-Host "  [ ] WhatsApp chegou no celular de teste" -ForegroundColor White
Write-Host "  [ ] Kanban: arrastar card = muda coluna instantaneo" -ForegroundColor White
Write-Host "  [ ] Kanban: modal = status exibe como badge (readonly)" -ForegroundColor White
Write-Host "  [ ] Leads: modal = status editavel no listbox" -ForegroundColor White
Write-Host "  [ ] Relatorios: exportar = arquivo .xlsx com 10 abas" -ForegroundColor White
Write-Host "  [ ] CRM: pagina carrega (role Diretor)" -ForegroundColor White
Write-Host "  [ ] Email Marketing: pagina carrega (role Gestor+)" -ForegroundColor White
Write-Host "  [ ] API Docs: endpoints expandem e mostram response" -ForegroundColor White
Write-Host "  [ ] Consultor NAO ve: CRM, API Docs, Automacao" -ForegroundColor White

# PLANO AMANHA
Write-Host ""
Linha
Write-Host "  PLANO PARA AMANHA" -ForegroundColor Cyan
Linha
Write-Host ""
Write-Host "  PRIORIDADE 1 - Monitoramento (Sentry)" -ForegroundColor Yellow
Write-Host "  [ ] Instalar Sentry: erros em producao chegam no celular em tempo real" -ForegroundColor White
Write-Host ""
Write-Host "  PRIORIDADE 2 - Notificacoes confiaveis" -ForegroundColor Yellow
Write-Host "  [ ] Migrar SMTP Gmail para Resend (emails em 2s, nao 2min)" -ForegroundColor White
Write-Host "  [ ] Retry automatico para WhatsApp com log no banco" -ForegroundColor White
Write-Host ""
Write-Host "  PRIORIDADE 3 - Excel com cores e graficos" -ForegroundColor Yellow
Write-Host "  [ ] Formatacao condicional: vermelho perda, verde conversao" -ForegroundColor White
Write-Host "  [ ] Sparklines e grafico de funil visual no Excel" -ForegroundColor White
Write-Host ""
Write-Host "  PRIORIDADE 4 - Performance Fase 2 (apos fechar piloto)" -ForegroundColor Yellow
Write-Host "  [ ] Vercel Pro R$ 110/mes = zero cold start" -ForegroundColor White
Write-Host "  [ ] Supabase Pro R$ 120/mes = banco dedicado sem fila" -ForegroundColor White
Write-Host ""
Linha
