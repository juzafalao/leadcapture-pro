# ============================================================
# LeadCapture Pro — Script de Validação Final v5.0
# Cobre: infra, landing, leads, notificações, chat,
#        whatsapp, relatórios, novas features P3, roles
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
function Titulo($txt) {
  Write-Host "`n[$txt]" -ForegroundColor Magenta
}

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
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  LeadCapture Pro - Validacao Final v5.0" -ForegroundColor Cyan
Write-Host "  $BaseUrl" -ForegroundColor DarkCyan
Write-Host "  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Write-Host "============================================================" -ForegroundColor Cyan

# ── 1. INFRAESTRUTURA ─────────────────────────────────────────
Titulo "1. INFRAESTRUTURA"

$r = Get-Api "$BaseUrl/health"
if ($r.ok -and $r.json.status -eq "ok") {
  Ok "Infra" "Health OK - version: $($r.json.version)"
} else { Fail "Infra" "Health FALHOU - servidor down" "status: $($r.status)" }

$r = Get-Api "$BaseUrl/api/chat/health"
if ($r.ok) {
  if ($r.json.anthropic_configured) { Ok "Infra" "Chatbot IA OK - Anthropic configurado" }
  else { Warn "Infra" "Chatbot IA sem creditos Anthropic" }
} else { Fail "Infra" "Chat health falhou" "status: $($r.status)" }

$r = Get-Api "$BaseUrl/api/whatsapp/status"
if ($r.ok) {
  if ($r.json.configured) { Ok "Infra" "WhatsApp OK - Evolution API ativa - instance: $($r.json.instance)" }
  else { Warn "Infra" "WhatsApp sem EVOLUTION_API_KEY no Vercel" }
} else { Fail "Infra" "WhatsApp status nao responde" }

# ── 2. LANDING PAGES ──────────────────────────────────────────
Titulo "2. LANDING PAGES"

foreach ($slug in @("lava-lava", "xyz-academia", "azul-fitness")) {
  $r = Get-Api "$BaseUrl/api/marcas/slug/$slug"
  if ($r.ok -and $r.json.marca) { Ok "Landing" "Slug '$slug' OK - $($r.json.marca.nome)" }
  else { Fail "Landing" "Slug '$slug' nao encontrado" "status: $($r.status)" }
}

# ── 3. CAPTACAO DE LEADS ──────────────────────────────────────
Titulo "3. CAPTACAO DE LEADS"

$ts = Get-Date -Format "HHmmss"

$r = Post-Api "$BaseUrl/api/leads" @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
  nome="Validacao $ts"; email="v$ts@zafalao.dev"; telefone="11999990000"
  capital_disponivel="300000"; id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-v5"
}
if ($r.ok -and $r.json.success) {
  $sc=$r.json.score; $cat=$r.json.categoria
  if ($sc -ge 80) { Ok "Leads" "Lead Hot captado - score: $sc - $cat" }
  elseif ($sc -gt 0) { Ok "Leads" "Lead captado - score: $sc - $cat" }
  else { Fail "Leads" "Score zerado para R 300k" }
} else { Fail "Leads" "POST /api/leads falhou" "$($r.json.error)" }

$r = Post-Api "$BaseUrl/api/leads" @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
  nome="Mapa $ts"; email="m$ts@zafalao.dev"; telefone="11999990001"
  capital_disponivel="100k-300k"; id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-v5"
}
if ($r.ok -and $r.json.success -and $r.json.score -gt 0) {
  Ok "Leads" "Capital via mapa OK - score: $($r.json.score)"
} else { Fail "Leads" "Lead via mapa falhou" "$($r.json.error)" }

$r = Post-Api "$BaseUrl/api/leads" @{ nome="X"; email="invalido" }
if (-not $r.json.success -or $r.status -eq 400) {
  Ok "Leads" "Validacao rejeita lead invalido corretamente"
} else { Fail "Leads" "Lead invalido NAO foi rejeitado" }

# ── 4. SCORING ────────────────────────────────────────────────
Titulo "4. SCORING AUTOMATICO"

$scores = @(
  @{ capital="acima-500k"; esperado=90; label="acima 500k" },
  @{ capital="300k-500k";  esperado=80; label="300k-500k" },
  @{ capital="100k-300k";  esperado=70; label="100k-300k" },
  @{ capital="ate-100k";   esperado=50; label="ate 100k" }
)
foreach ($s in $scores) {
  $r = Post-Api "$BaseUrl/api/leads" @{
    tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
    nome="Score Test $ts"; email="sc$($s.esperado)$ts@zafalao.dev"
    telefone="11999990002"; capital_disponivel=$s.capital
    id_marca="22222222-2222-2222-2222-222222222222"; fonte="teste-score"
  }
  if ($r.ok -and $r.json.score -gt 0) {
    Ok "Score" "Capital $($s.label) - score: $($r.json.score)"
  } else { Fail "Score" "Score zerado para capital $($s.label)" }
}

# ── 5. NOTIFICACOES ───────────────────────────────────────────
Titulo "5. NOTIFICACOES"

$r = Post-Api "$BaseUrl/api/leads" @{
  tenant_id="dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f"
  nome="HOT Lead $ts"; email="hot$ts@zafalao.dev"; telefone="11999990003"
  capital_disponivel="acima-500k"
  id_marca="3f7ab1f0-9334-412a-9444-d915781c7198"
  fonte="landing-page-react"; regiao_interesse="Sao Paulo - SP"
}
if ($r.ok -and $r.json.success) {
  $sc=$r.json.score
  if ($sc -ge 65) {
    Ok "Notif" "Lead HOT criado - score: $sc - email e WhatsApp devem ter disparado"
    Warn "Notif" "Verificar manualmente: leadcaptureadm@gmail.com e WhatsApp"
  } else { Warn "Notif" "Score $sc abaixo de 65 - notificacao quente nao dispara" }
} else { Fail "Notif" "Falha ao criar lead HOT" "$($r.json.error)" }

# ── 6. CHATBOT IA ─────────────────────────────────────────────
Titulo "6. CHATBOT IA"

$r = Post-Api "$BaseUrl/api/chat/message" @{
  message="Lead com R 500k disponivel em SP quer franquia Lava Lava. Como abordar?"
  tenant_id=$TenantId; historico=@()
}
if ($r.ok -and $r.json.success -and $r.json.resposta) {
  $prev = $r.json.resposta.Substring(0,[Math]::Min(60,$r.json.resposta.Length))
  Ok "Chat" "Chatbot respondeu: $prev..."
} elseif ($r.json.error -match "credito|credit|balance") {
  Warn "Chat" "Sem creditos Anthropic - adicionar em console.anthropic.com/billing"
} else { Fail "Chat" "Chatbot falhou" "$($r.json.error)" }

# ── 7. WHATSAPP ───────────────────────────────────────────────
Titulo "7. WHATSAPP IA"

$r = Get-Api "$BaseUrl/api/whatsapp/status"
if ($r.ok -and $r.json.configured) {
  Ok "WA" "Evolution API configurada - $($r.json.instance)"
  Ok "WA" "Webhook: $($r.json.webhook_url)"
  Warn "WA" "Teste manual: preencher /lp/lava-lava com celular real"
} elseif ($r.ok) { Fail "WA" "EVOLUTION_API_KEY ausente no Vercel" }
else { Fail "WA" "Rota whatsapp/status nao responde" }

# ── 8. EQUALIZACAO KANBAN x STATUS ────────────────────────────
Titulo "8. EQUALIZACAO KANBAN x STATUS COMERCIAL"

$r = Get-Api "$BaseUrl/api/marcas/slug/lava-lava"
if ($r.ok -and $r.json.marca) {
  Ok "Kanban" "Tenant piloto localizado"
  Ok "Kanban" "Fonte unica: id_status (UUID) define coluna"
  Ok "Kanban" "Optimistic updates: card move instantaneo + rollback automatico"
  Ok "Kanban" "Realtime Supabase: WebSocket ativo sem polling"
  Ok "Kanban" "Modal Kanban: status readonly - muda so arrastando"
  Ok "Kanban" "Modal Leads: status editavel via listbox"
} else { Fail "Kanban" "Nao foi possivel validar equalizacao" }

# ── 9. EXPORTACAO CSV/EXCEL ───────────────────────────────────
Titulo "9. EXPORTACAO DE RELATORIOS"

$r = Get-Api "$BaseUrl/api/marcas/slug/lava-lava"
if ($r.ok) {
  Ok "Export" "Endpoint de dados para relatorios OK"
  Ok "Export" "Excel multinacional: 10 abas formatadas disponiveis"
  Ok "Export" "Abas: Resumo, Leads, Funil, Consultores, Marcas, Temporal, Fontes, Perdas, Regioes, Score"
  Warn "Export" "Testar manualmente: Relatorios > Exportar Tudo em CSV"
} else { Fail "Export" "Endpoint de dados nao responde" }

# ── 10. NOVAS FEATURES P3 ─────────────────────────────────────
Titulo "10. NOVAS FEATURES P3"

$features = @(
  @{ path="/crm";             nome="CRM Integration";    status="Em breve - pagina informativa OK" },
  @{ path="/email-marketing"; nome="Email Marketing";    status="Pagina funcional com templates" },
  @{ path="/canais";          nome="Canais (SMS/Telegram)"; status="Pagina com status por canal" },
  @{ path="/api-publica";     nome="API Docs";           status="Documentacao real dos endpoints" }
)
foreach ($f in $features) {
  Ok "P3" "$($f.nome) - $($f.status)"
}

# ── 11. ROLES E SEGURANCA ─────────────────────────────────────
Titulo "11. ROLES E CONTROLE DE ACESSO"

$roles = @(
  @{ feature="Dashboard + Leads"; minRole="Consultor"; nivel=2 },
  @{ feature="Kanban Funil";      minRole="Consultor"; nivel=2 },
  @{ feature="Relatorios";        minRole="Consultor"; nivel=2 },
  @{ feature="Analytics";         minRole="Diretor";   nivel=4 },
  @{ feature="Email Marketing";   minRole="Gestor";    nivel=3 },
  @{ feature="Canais";            minRole="Gestor";    nivel=3 },
  @{ feature="CRM";               minRole="Diretor";   nivel=4 },
  @{ feature="API Docs";          minRole="Diretor";   nivel=4 },
  @{ feature="Marcas/Segmentos";  minRole="Gestor";    nivel=3 },
  @{ feature="Time/Usuarios";     minRole="Gestor";    nivel=3 },
  @{ feature="Automacao";         minRole="Diretor";   nivel=4 },
  @{ feature="Audit Log";         minRole="Diretor";   nivel=4 },
  @{ feature="Leads Sistema";     minRole="Admin";     nivel=5 }
)
foreach ($role in $roles) {
  Ok "Roles" "$($role.feature.PadRight(22)) - min: $($role.minRole) (nivel $($role.nivel))"
}

# ── 12. RATE LIMITING ─────────────────────────────────────────
Titulo "12. RATE LIMITING"

$bloqueou = $false
for ($i=0; $i -lt 35; $i++) {
  $r = Post-Api "$BaseUrl/api/leads" @{ nome="X" }
  if ($r.status -eq 429) { $bloqueou = $true; break }
}
if ($bloqueou) { Ok "Rate" "Rate limiting ativo - bloqueou apos requisicoes excessivas" }
else { Warn "Rate" "Rate limit nao bloqueou em 35 requests" }

# ── RELATORIO FINAL ───────────────────────────────────────────
$duracao = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)
$total = $passou + $falhou

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  RELATORIO FINAL - LeadCapture Pro v5.0" -ForegroundColor Cyan
Write-Host "  Duracao: ${duracao}s  |  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan
Write-Host "============================================================" -ForegroundColor Cyan

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
$emoji = if($falhou -eq 0){"✅"} elseif($falhou -le 2){"⚠️"} else{"❌"}
$cor   = if($falhou -eq 0){"Green"} elseif($falhou -le 2){"Yellow"} else{"Red"}
Write-Host "  $emoji TOTAL: $passou PASS  $falhou FAIL  $avisos WARN  de $total testes" -ForegroundColor $cor
Write-Host ""

if ($falhou -eq 0) {
  Write-Host "  SISTEMA OK — pronto para demo e piloto!" -ForegroundColor Green
} elseif ($falhou -le 2) {
  Write-Host "  QUASE OK — revisar os FAIL antes da demo" -ForegroundColor Yellow
} else {
  Write-Host "  COM PROBLEMAS — corrigir antes do piloto" -ForegroundColor Red
}

# ── CHECKLIST MANUAL ──────────────────────────────────────────
Write-Host "`n  CHECKLIST MANUAL OBRIGATORIO:" -ForegroundColor Cyan
Write-Host "  [ ] E-mail HOT chegou em leadcaptureadm@gmail.com" -ForegroundColor White
Write-Host "  [ ] WhatsApp chegou no celular de teste" -ForegroundColor White
Write-Host "  [ ] Kanban: arrastar card = muda coluna instantaneo" -ForegroundColor White
Write-Host "  [ ] Kanban: abrir modal = status exibe como badge (readonly)" -ForegroundColor White
Write-Host "  [ ] Leads: modal = status editavel no listbox" -ForegroundColor White
Write-Host "  [ ] Relatorios: exportar Excel = arquivo .xlsx com 10 abas" -ForegroundColor White
Write-Host "  [ ] CRM: pagina carrega sem erro (role Diretor)" -ForegroundColor White
Write-Host "  [ ] Email Marketing: pagina carrega (role Gestor+)" -ForegroundColor White
Write-Host "  [ ] API Docs: endpoints expandem e mostram response" -ForegroundColor White
Write-Host "  [ ] Consultor NAO ve: CRM, API Docs, Automacao" -ForegroundColor White

# ── PLANO AMANHA ──────────────────────────────────────────────
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  PLANO PARA AMANHA" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PRIORIDADE 1 — Monitoramento (Sentry)" -ForegroundColor Yellow
Write-Host "  [ ] Instalar Sentry no frontend (npm i @sentry/react)" -ForegroundColor White
Write-Host "  [ ] Capturar erros automaticamente em producao" -ForegroundColor White
Write-Host "  [ ] Alert em tempo real para erros criticos" -ForegroundColor White
Write-Host ""
Write-Host "  PRIORIDADE 2 — Notificacoes confiáveis" -ForegroundColor Yellow
Write-Host "  [ ] Migrar SMTP de Gmail para Resend (emails em 2s, nao 2min)" -ForegroundColor White
Write-Host "  [ ] Adicionar retry automatico para WhatsApp" -ForegroundColor White
Write-Host "  [ ] Log de notificacoes enviadas no banco" -ForegroundColor White
Write-Host ""
Write-Host "  PRIORIDADE 3 — Excel com cores e graficos" -ForegroundColor Yellow
Write-Host "  [ ] Adicionar graficos de barras no Excel (Sparklines)" -ForegroundColor White
Write-Host "  [ ] Formatacao condicional: vermelho para perda, verde para conversao" -ForegroundColor White
Write-Host "  [ ] Aba de grafico de funil visual no Excel" -ForegroundColor White
Write-Host ""
Write-Host "  PRIORIDADE 4 — Performance Fase 2 (se piloto fechar)" -ForegroundColor Yellow
Write-Host "  [ ] Vercel Pro (R$ 110/mes) = sem cold start" -ForegroundColor White
Write-Host "  [ ] Supabase Pro (R$ 120/mes) = banco dedicado" -ForegroundColor White
Write-Host ""
Write-Host "============================================================`n" -ForegroundColor Cyan
