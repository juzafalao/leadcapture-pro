#!/bin/bash

# ============================================
# SCRIPT DE RESTORE DO BANCO DE DADOS
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ $# -eq 0 ]; then
  echo -e "${RED}❌ Uso: ./scripts/restore-database.sh <arquivo-backup.sql.gz>${NC}"
  echo -e "\n${YELLOW}Backups disponíveis:${NC}"
  ls -lh backups/database/*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Arquivo não encontrado: $BACKUP_FILE${NC}"
  exit 1
fi

echo -e "${RED}⚠️  ATENÇÃO: Você está prestes a RESTAURAR o banco de dados!${NC}"
echo -e "${RED}Todos os dados atuais serão SUBSTITUÍDOS pelo backup.${NC}"
echo -e "\n${YELLOW}Backup: $BACKUP_FILE${NC}"
echo -e "${YELLOW}Database: $(echo $DATABASE_URL | sed 's/postgresql:\/\/[^@]*@/postgresql:\/\/***@/')${NC}"
echo -e "\n${RED}Esta ação é IRREVERSÍVEL!${NC}"
rrrrrrrrrrrrrrrrrrrr? Digite 'RESTORE' para confirmar: " rrrrrrrrrrrrrrrrrrrr? Digite 'RESTOE" ]; then
                                     la                                     la     ado atual antes de restaurar
echo -e "\n${YELLOWecho -e "\n${YELLOupecho -e "\nçaecho -e "\n${YELLOWe{Necho -e "\n${YELLOWecho -e "\n${YELLOupecho -e "\nçaechTEMP_FILE="/tmp/restore_$(dateecho -e "\n${YELLOWecho -e "\n${YELLOupecho -e "ando backup...${NC}"
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

# Restaurar
echo -e "${YELLOW}🔄 Restaurando banco de dados...${NC}"
psql "$DATABASE_URL" < "$TEMP_FILE"

# Limpar arquivo temporário
rm "$TEMP_FILE"

echo -e "\n${GREEN}✅ Restore concluído com sucesso!${NC}"
echo -e "${YELLOW}⚠️  Recomendado: Reiniciar a aplicação${NC}"
