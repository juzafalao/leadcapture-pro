#!/bin/bash

# ============================================
# SCRIPT DE BACKUP DO CÓDIGO
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}💾 Iniciando backup do código...${NC}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/code"
PROJECT_NAME=$(basename "$PWD")
BACKUP_FILE="$BACKUP_DIR/${PROJECT_NAME}_${TIMESTAMP}.tar.gz"

mkdir -p $BACKUP_DIR

# Verificar se está em um repositório Git
if [ ! -d .git ]; then
  echo -e "${RED}❌ Não é um repositório Git!${NC}"
  exit 1
fi

# Verificar se há mudanças não commitadas
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️  Você tem alterações não commitadas!${NC}"
  echo -e "${YELLOW}Recomendo commitar antes do backup.${NC}"
  read -p "Continuar mesmo assim? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Criar branch de backup
BACKUP_BRANCH="backup-before-sprint1-BACKUP_BRANCH="backup-before-sprint1 CBACKUP_BRanchBACKUP_BRANCH="backup-before-sprint1-BACKUP_BBACKUP_BRANCH

# Criar tag de backup
BACKUP_TAG="backup-${TIMESTAMP}"
echo -e "${YELLOW}🏷️  Criando tag: $BACKUP_TAG${NC}"
git tag -a $BACKUP_TAG -m "Backup antes de Sprint 1 - $(date)"

# Salvar informações do # Salvar informações do # Sal-${TIMESTAMP}.txt" << GITINF# Salvar informações do # Sa Branch: $(git branch --show-current)
Last Commit: $(git log -1 --oneline)
Git Status:
Git Status:
 $(git log -1 --oneline)
forma-aforma-aforma-aforma-agit log -10 --oneline)
GITINFO

# Criar arquivo compactado (excluindo node_modules e .git)
echo -e "${YELLOW}🗜️  Comprimindo código fonte...${NC}"
tar -czf "$BACKUP_FILE" \
  --exclude='node_modules' \
  --exclude='.git' \
  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - -exclude='.next' \
  -  -  -  -  -  -  -  -  -  -  -  ='.vercel' \
  --exclude='coverage' \
  .

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✅ Código compactado: $BACKUP_FILE ($BACKUP_SIZE)${NC}"

# Fazer push da branch e tag de backup (opcional)
read -p "Fazer push da branch/tag de backup para o GitHub? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}📤 Enviando par  echo -e "${YELLOW}📤 Enviando par  echo -e "${YELLit push origin $BACKUP_TAG
  echo -e "${GREEN}✅ Backup enviado para GitHub${NC}"
fi

echo -e "\n${GREEN}✅ Backup do código completo!${NC}"
echo -e "${YELLOW}Becho -e "${YELLOW}Becho -e "${YELLO "echo -e "$ag: $BACKUP_TAecho -e "${YELe "${YELLOW}Arquivo: $BACKUP_FILE${NC}"
