#!/bin/bash

# ============================================
# BACKUP COMPLETO - ANTES DE SPRINT 1
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════╗"
echo "║                                                ║"
echo "║      BACKUP COMPLETO - LeadCapture Pro        ║"
echo "║           Antes de Sprint 1                    ║"
echo "║                                                ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}\n"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${YELLOW}📅 Data: $(date)${NC}"
echo -e "${YELLOW}⏰ Timestamp: $TIMESTAMP${NC}\n"

# 1. Backup do código
echo -e "echo -e "echo -e "echo -e "echo -e o$ecC}"
./scrip./scrip./scrip./scrip./scrip./scrip./scrip./onfigurações
echo -e "${GREEN}[2/3] ⚙️  Backup das Configurações${NC}"
./scripts/backup-c./scripts/backup-
###################o de dados
echo -e "${GREEN}[3/3] 🗄️  Backup doecho -e "${GREEN}[3/3] 🗄️  Backup doecho -e "${GREEN}[3/3] 🗄️  Backup doecho -e "${GREEN}[3/3] 🗄️  Backup doecho -e "${GREEN}[3/3] 🗄️  Becho -e "${YELLOW}Configure com: export DATABASE_URL='sua-connection-string'${NC}"
  echo -e "${YELLOW}Tentando usar SUPABASE_URL da .env.local...${NC}"
  
  # Tentar carregar de .env.local
  if [ -f .env.local ]; then
    source .env.local
    
    # Pegar password do service role key (se disponível)
    # Isso é um workaround - idealmente você deveria ter DATABASE_URL configurado
    echo -e "${YELLOW}Usando backup via API do Supabase...${NC}"
    ./scripts/backup-supabase-api.sh
  else
    ec    ec    ec    ec    ec    ec    ec    ec    ec  onfigure DATABASE_URL manualmente.${NC}"
  fi
else
  ./scripts/backup-database.sh
fi

echo ""
echo -e "${BLUE}"
echo "╔═══════�echo "╔═══════�echo "��═══════════════════════════╗"
echo "║                                                ║"
echo "║            ✅ BACKUP COMPLETO!                 ║"
echo "║                                                ║"
echo "╚═════════════════════════════�echo "╚═══════════════════� "e{NC}\n"

# Resumo
echo -e "${GREEN}📊 Resumo dos Backups:${NC}\n"

echo -e "${YELLOW}Código:${NC}"
ls -lh backups/code/*.tar.gz 2>/dev/null | tail ls -lh backups/code/*.tar.gz 2>/dev/null | tail ls -lh backups/code/*.tar.gz 2>/de"
ls -lh backups/code/*.tar.gz 2>/dev/null | tail ls -lh backups/ Nls -lh backups/code/*.tar.gz 2>/dev\nls -lLOW}Banco de Dados:${NC}"
ls -lh backups/database/*.gz 2>/dev/null | tail -1 || echo "  Nenhum backup encontrado"

echo -e "\n${GREEN}🎯 Próximos pasecho -e "\
echo -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eecho gora você pode executar o echo -eecho -eecho -eecho -eecho -eecho -eecho -eecho -eechoANTE: Não delete a pasta backups/ durante a Sprint!${NC}\n"
