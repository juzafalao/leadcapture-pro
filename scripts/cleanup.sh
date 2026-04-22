#!/bin/bash
# ============================================================
# Script de Limpeza - Código Morto
# LeadCapture Pro — Zafalão Tech
# ============================================================

set -e

echo "🧹 Iniciando limpeza de código morto..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para deletar arquivo com log
remove_file() {
  local file=$1
  local reason=$2
  
  if [ -f "$file" ]; then
    echo -e "${YELLOW}Removendo${NC} $file"
    echo "  Motivo: $reason"
    rm -f "$file"
    echo -e "${GREEN}✓${NC} Removido com sucesso"
  else
    echo -e "${RED}✗${NC} Arquivo não encontrado: $file"
  fi
}

# Função para deletar diretório
remove_dir() {
  local dir=$1
  local reason=$2
  
  if [ -d "$dir" ]; then
    echo -e "${YELLOW}Removendo diretório${NC} $dir"
    echo "  Motivo: $reason"
    rm -rf "$dir"
    echo -e "${GREEN}✓${NC} Diretório removido"
  else
    echo -e "${RED}✗${NC} Diretório não encontrado: $dir"
  fi
}

echo ""
echo "📁 Removendo arquivos duplicados e não utilizados..."
echo ""

# Páginas duplicadas/não utilizadas
remove_file "frontend/dashboard-admin/src/pages/Dashboard.jsx" "Redireciona para DashboardPage, não é usado"
remove_file "frontend/dashboard-admin/src/pages/DashboardOverview.jsx" "Versão antiga não utilizada"
remove_file "frontend/dashboard-admin/src/pages/LeadsCaptureAnalyticsDashboard.jsx" "Duplicado de AnalyticsPage"
remove_file "frontend/dashboard-admin/src/pages/RankingPageEnhanced.jsx" "Versão antiga, usar RankingPage.jsx"

# Sidebar original no root
remove_file "Sidebar_original.jsx" "Versão antiga, usar src/components/Sidebar.jsx"

# Hooks backup antigo
remove_dir "frontend/dashboard-admin/src/hooks.backup.20260131" "Backup antigo de hooks"

# Scripts de teste PowerShell (migrar para Vitest)
remove_file "test_suite.ps1" "Migrado para Vitest"
remove_file "testar-completo.ps1" "Migrado para Vitest"
remove_file "testar-sistema-completo-v3.ps1" "Migrado para Vitest"
remove_file "testar-sistema-completo.ps1" "Migrado para Vitest"
remove_file "testar-sistema-final.ps1" "Migrado para Vitest"
remove_file "testar-sistema-v5.ps1" "Migrado para Vitest"
remove_file "testar-sistema.ps1" "Migrado para Vitest"

# Scripts não utilizados
remove_file "criar-pr.ps1" "Script não utilizado"
remove_file "fix_deploy.sh" "Script não utilizado"

# Arquivos de documentação antigos
remove_file "FIX_DOCUMENTATION.md" "Documentação antiga"

echo ""
echo "📁 Verificando arquivos órfãos..."
echo ""

# Lista arquivos que podem ser órfãos
find frontend/dashboard-admin/src -name "*.jsx" -o -name "*.js" | while read file; do
  filename=$(basename "$file")
  # Verifica se o arquivo é importado em algum lugar
  if ! grep -r "import.*$filename" frontend/dashboard-admin/src --include="*.js" --include="*.jsx" -l > /dev/null 2>&1; then
    # Verifica se é um arquivo de página ou componente
    if [[ "$file" == *"/pages/"* ]] || [[ "$file" == *"/components/"* ]]; then
      # Verifica se está no App.jsx ou rotas
      if ! grep -r "$filename" frontend/dashboard-admin/src/App.jsx frontend/dashboard-admin/src/main.jsx > /dev/null 2>&1; then
        echo -e "${YELLOW}Possível órfão:${NC} $file"
      fi
    fi
  fi
done

echo ""
echo "📊 Estatísticas de código..."
echo ""

# Conta linhas de código
total_lines=$(find server frontend/dashboard-admin/src -name "*.js" -o -name "*.jsx" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
echo "Total de linhas de código: $total_lines"

# Conta arquivos
total_files=$(find server frontend/dashboard-admin/src -name "*.js" -o -name "*.jsx" | wc -l)
echo "Total de arquivos JS/JSX: $total_files"

echo ""
echo -e "${GREEN}✅ Limpeza concluída!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Execute 'npm install' para atualizar dependências"
echo "  2. Execute 'npm test' para rodar os testes"
echo "  3. Execute 'npm run build' para verificar se compila"
