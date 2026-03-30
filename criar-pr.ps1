# ============================================================
# LeadCapture Pro - Criar PR no GitHub
# Uso: .\criar-pr.ps1 -Token "seu_github_token"
# ============================================================
param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$REPO  = "juzafalao/leadcapture-pro"
$BRANCH = "feature/chatbot-interno-kanban"
$BASE   = "main"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  LeadCapture Pro - Criar PR" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Push da branch
Write-Host "[1] Fazendo push da branch $BRANCH..." -ForegroundColor Yellow
git push origin $BRANCH
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no push. Verifique suas credenciais Git." -ForegroundColor Red
    exit 1
}
Write-Host "  Push concluido!" -ForegroundColor Green
Write-Host ""

# Passo 2: Criar PR via GitHub API
Write-Host "[2] Criando Pull Request no GitHub..." -ForegroundColor Yellow

$body = @{
    title = "feat: Chatbot IA interno para consultores"
    head  = $BRANCH
    base  = $BASE
    body  = @"
## Chatbot IA Interno para Consultores

### O que foi feito
- Novo endpoint POST /api/chat/message com Anthropic API
- Widget flutuante no dashboard (bottom-right)
- Contexto dinamico por tenant (usa ai_instructions do banco)
- Contexto opcional do lead sendo visualizado
- Historico de conversa com ultimas 6 mensagens
- Rate limiting dedicado (30 req/min)
- Testes automatizados no bloco 5 do testar-sistema.ps1
- .gitignore atualizado (exclui dashboard-build, dist, backups)

### Como testar
1. Adicionar ANTHROPIC_API_KEY nas env vars do Vercel
2. Fazer login no dashboard
3. Clicar no botao verde flutuante (bottom-right)
4. Fazer uma pergunta sobre leads ou qualificacao

### Checklist
- [x] Build do Vite passando sem erros
- [x] Backend com rate limiting
- [x] System prompt dinamico por tenant
- [x] Sugestoes de perguntas no estado inicial
- [x] Tratamento de erro quando API key nao configurada

### Env var necessaria
```
ANTHROPIC_API_KEY=sk-ant-...
```
"@
    draft = $false
} | ConvertTo-Json -Compress

$headers = @{
    "Authorization" = "token $Token"
    "Accept"        = "application/vnd.github.v3+json"
    "Content-Type"  = "application/json"
}

try {
    $resp = Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$REPO/pulls" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -UseBasicParsing `
        -ErrorAction Stop

    $pr = $resp.Content | ConvertFrom-Json
    Write-Host "  PR criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Numero: #$($pr.number)" -ForegroundColor White
    Write-Host "  Titulo: $($pr.title)" -ForegroundColor White
    Write-Host "  URL:    $($pr.html_url)" -ForegroundColor Cyan
} catch {
    try {
        $errBody = (New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
        $errJson = $errBody | ConvertFrom-Json -ErrorAction SilentlyContinue
        Write-Host "ERRO ao criar PR: $($errJson.message)" -ForegroundColor Red
        if ($errJson.errors) {
            $errJson.errors | ForEach-Object { Write-Host "  - $($_.message)" -ForegroundColor DarkRed }
        }
    } catch {
        Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan