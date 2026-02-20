#!/bin/bash

echo "🧪 ========================================="
echo "   TESTES AUTOMATIZADOS - LEADCAPTURE PRO"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5173"
RESULTS=()

# Função para testar página
test_page() {
  local path=$1
  local name=$2
  
  echo "🔍 Testando $name ($path)..."
  
  # Verificar se servidor está rodando
  if curl -s --max-time 5 "$BASE_URL$path" > /dev/null 2>&1; then
    echo "   ✅ Página carrega"
    RESULTS+=("✅ $name")
  else
    echo "   ❌ Página não responde"
    RESULTS+=("❌ $name")
  fi
}

# Verificar se servidor está rodando
if ! curl -s --max-time 3 "$BASE_URL" > /dev/null 2>&1; then
  echo "❌ ERRO: Servidor não está rodando!"
  echo "   Execute: cd frontend/dashboard-admin && npm run dev"
  exit 1
fi

echo "✅ Servidor rodando em $BASE_URL"
echo ""

# Testes
test_page "/" "Login"
test_page "/dashboard" "Dashboard"
test_page "/leads-sistema" "Leads Sistema"
test_page "/marcas" "Marcas"
test_page "/segmentos" "Segmentos"
test_page "/usuarios" "Usuários"
test_page "/inteligencia" "Inteligência"
test_page "/analytics" "Analytics"
test_page "/relatorios" "Relatórios"
test_page "/automacao" "Automação"

echo ""
echo "========================================="
echo "   RESUMO DOS TESTES"
echo "========================================="
for result in "${RESULTS[@]}"; do
  echo "$result"
done
echo ""

# Testar build
echo "🏗️ Testando build..."
cd frontend/dashboard-admin
if npm run build > /dev/null 2>&1; then
  echo "   ✅ Build passa"
else
  echo "   ❌ Build falha"
fi

echo ""
echo "✅ Testes concluídos!"
