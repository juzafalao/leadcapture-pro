#!/bin/bash
# ============================================================
# Script para aplicar correções da FASE 1
# 
# USO:
#   1. Coloque este script na RAIZ do repositório leadcapture-pro
#   2. Execute: chmod +x aplicar-fase1.sh && ./aplicar-fase1.sh
# ============================================================

set -e

echo ""
echo "🔧 LeadCapture Pro - Aplicando FASE 1: Estabilização"
echo "===================================================="
echo ""

# Verifica se está no diretório correto
if [ ! -f "package.json" ] || [ ! -d "server" ]; then
    echo "❌ Execute este script na raiz do repositório leadcapture-pro"
    exit 1
fi

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📁 Criando estrutura de diretórios...${NC}"
mkdir -p server/__tests__
mkdir -p server/core/__tests__
mkdir -p server/comunicacao/__tests__
mkdir -p server/routes/__tests__
mkdir -p server/middleware/__tests__
mkdir -p docs

echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Você precisa copiar os arquivos manualmente${NC}"
echo ""
echo "Os arquivos corrigidos estão disponíveis no workspace."
echo ""
echo "Arquivos a copiar:"
echo ""
echo "  # Backend:"
echo "  server/routes/leads.js"
echo "  server/comunicacao/whatsapp.js"
echo "  server/routes/whatsapp.js"
echo "  server/core/validation.js"
echo "  server/core/scoring.js"
echo "  server/core/retry.js"
echo "  server/core/database.js"
echo "  server/middleware/rateLimiter.js"
echo ""
echo "  # Testes:"
echo "  server/__tests__/api.test.js"
echo "  server/core/__tests__/scoring.test.js"
echo "  server/core/__tests__/validation.test.js"
echo "  server/core/__tests__/retry.test.js"
echo "  server/comunicacao/__tests__/whatsapp.test.js"
echo "  server/routes/__tests__/whatsapp.test.js"
echo "  server/middleware/__tests__/rateLimiter.test.js"
echo ""
echo "  # Config:"
echo "  vitest.config.js"
echo ""
echo "  # Docs:"
echo "  docs/FASE1_ESTABILIZACAO.md"
echo "  docs/TESTES.md"
echo ""
echo -e "${BLUE}📦 Instalando dependências de teste...${NC}"
npm install -D vitest @vitest/coverage-v8 @vitest/ui

echo ""
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Copie os arquivos listados acima"
echo "  2. Execute: npm test"
echo "  3. Se tudo passar: git add . && git commit -m 'FASE 1: Estabilização'"
echo "  4. Push: git push origin fase1-estabilizacao"
echo ""
