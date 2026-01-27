#!/bin/bash

# ============================================================
# SCRIPT DE INSTALAÇÃO - DESIGN MELHORADO
# LeadCapture Pro v2.0 - Branded Edition
# ============================================================

set -e

echo "🎨 ============================================"
echo "🎨 LeadCapture Pro - Atualização Visual"
echo "🎨 ============================================"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar se está no projeto
if [ ! -d "dashboard" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto leadcapture-pro"
    exit 1
fi

echo "${BLUE}📍 Projeto encontrado!${NC}"
echo ""

# Fazer backup
echo "${YELLOW}📦 Fazendo backup do App.jsx atual...${NC}"
if [ -f "dashboard/src/App.jsx" ]; then
    cp dashboard/src/App.jsx dashboard/src/App_backup_$(date +%Y%m%d_%H%M%S).jsx
    echo "${GREEN}✅ Backup criado${NC}"
else
    echo "${YELLOW}⚠️  App.jsx não encontrado, será criado${NC}"
fi

# Copiar nova versão
echo ""
echo "${BLUE}📝 Instalando App_v2_branded.jsx...${NC}"

# Verificar se usuário tem o arquivo
if [ ! -f "App_v2_branded.jsx" ]; then
    echo ""
    echo "${YELLOW}⚠️  Arquivo App_v2_branded.jsx não encontrado!${NC}"
    echo ""
    echo "Por favor:"
    echo "1. Baixe o arquivo App_v2_branded.jsx"
    echo "2. Coloque na raiz do projeto"
    echo "3. Execute este script novamente"
    echo ""
    exit 1
fi

cp App_v2_branded.jsx dashboard/src/App.jsx
echo "${GREEN}✅ Arquivo instalado${NC}"

# Verificar dependências
echo ""
echo "${BLUE}🔍 Verificando dependências...${NC}"
cd dashboard

if [ ! -d "node_modules" ]; then
    echo "${YELLOW}📦 Instalando dependências...${NC}"
    npm install
else
    echo "${GREEN}✅ Dependências OK${NC}"
fi

# Configurar Supabase Key
echo ""
echo "${YELLOW}⚙️  CONFIGURAÇÃO NECESSÁRIA${NC}"
echo ""
echo "Abra o arquivo: dashboard/src/App.jsx"
echo "Linha 9: const supabaseKey = 'COLE_SUA_CHAVE_AQUI'"
echo ""
echo "Substitua 'COLE_SUA_CHAVE_AQUI' pela sua chave do Supabase"
echo ""

# Perguntar se quer abrir
read -p "Deseja abrir o arquivo agora? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    code dashboard/src/App.jsx || nano dashboard/src/App.jsx || open dashboard/src/App.jsx
fi

echo ""
echo "${GREEN}✅ ============================================${NC}"
echo "${GREEN}✅ INSTALAÇÃO CONCLUÍDA!${NC}"
echo "${GREEN}✅ ============================================${NC}"
echo ""
echo "${BLUE}📋 Próximos passos:${NC}"
echo ""
echo "1. Configure a chave do Supabase (se ainda não fez)"
echo "   📁 dashboard/src/App.jsx (linha 9)"
echo ""
echo "2. Inicie o Dashboard:"
echo "   ${YELLOW}cd dashboard && npm run dev${NC}"
echo ""
echo "3. Acesse:"
echo "   ${YELLOW}http://localhost:5173${NC}"
echo ""
echo "4. Personalize:"
echo "   • Adicione logo do cliente no Supabase"
echo "   • Configure integração CRM"
echo "   • Ajuste cores (opcional)"
echo ""
echo "${BLUE}📚 Documentação:${NC}"
echo "   Leia: GUIA_DESIGN_MELHORADO.md"
echo ""
echo "${GREEN}🎉 Bom trabalho!${NC}"
echo ""

