#!/bin/bash
# ============================================================
# Setup Script - LeadCapture Pro
# Instala dependências e configura o projeto
# ============================================================

set -e

echo ""
echo "🚀 LeadCapture Pro - Setup"
echo "============================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não encontrado. Instale Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js versão $NODE_VERSION detectada. Requer 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# Instala dependências do backend
echo ""
echo -e "${BLUE}📦 Instalando dependências do backend...${NC}"
cd server
npm install
cd ..

# Instala dependências do frontend
echo ""
echo -e "${BLUE}📦 Instalando dependências do frontend...${NC}"
cd frontend/dashboard-admin
npm install
cd ../..

# Instala dependências de teste
echo ""
echo -e "${BLUE}🧪 Instalando dependências de teste...${NC}"
npm install -D vitest @vitest/coverage-v8 @vitest/ui

# Executa limpeza de código morto
echo ""
echo -e "${YELLOW}🧹 Executando limpeza de código morto...${NC}"
chmod +x scripts/cleanup.sh
./scripts/cleanup.sh || true

# Executa testes
echo ""
echo -e "${BLUE}🧪 Executando testes...${NC}"
npm test || echo -e "${YELLOW}⚠ Alguns testes falharam. Verifique os logs.${NC}"

# Verifica variáveis de ambiente
echo ""
echo -e "${BLUE}🔐 Verificando variáveis de ambiente...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Arquivo .env não encontrado${NC}"
    echo "  Copiando .env.example para .env..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Edite o arquivo .env com suas credenciais!${NC}"
fi

# Cria estrutura de diretórios se não existir
mkdir -p server/__tests__
mkdir -p server/core/__tests__
mkdir -p server/comunicacao/__tests__
mkdir -p server/routes/__tests__
mkdir -p server/middleware/__tests__

echo ""
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Edite o arquivo .env com suas credenciais"
echo "  2. Execute 'npm run dev' para iniciar o servidor"
echo "  3. Execute 'npm test' para rodar os testes"
echo "  4. Execute 'npm run test:coverage' para ver cobertura"
echo ""
