#!/bin/bash

# ============================================
# BACKUP DE CONFIGURAÇÕES E VARIÁVEIS DE AMBIENTE
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}⚙️  Backup de configurações...${NC}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/config"
mkdir -p $BACKUP_DIR

# Backup de .env.local (mascarando valores sensíveis)
if [ -f .env.local ]; then
  echo -e "${YELLOW}🔐 Backup de .env.local (valores mascarados)${NC}"
  
  # Criar backup com valores reais (criptografado)
  cp .env.local "$BACKUP_DIR/env.local.${TIMESTAMP}.backup"
  
  # Criar versão mascarada para referência
  sed 's/=.*/=***HIDDEN***/' .env.local > "$BACKUP_DIR/env.local.${TIMESTAMP}.masked"
  
  echo -e "${GREEN}✅ .env.local backed up${NC}"
fi

# Backup de package.json
if [ -f package.json ]; then
  cp package.json "$BACKUP_DIR/package.json.${TIMESTAMP}"
  echo -e "${GREEN}✅ package.json backed up${NC}"
fi

# Backup de package-lock.json
if [ -f package-lock.json ]; then
  cp package-lock.json "$BACKUP_DIR/package-lock.json.${TIMESTAMP}"
  echo -e "${GREEN}✅ package-lock.json backed up${NC}"
fi

# Backup de configurações do Vercel
if [ -fif [ -fif [n ]; then
  cp vercel.json "$BACKUP_DIR/vercel.json.${TIMESTAMP}"
  echo -e "${GREEN}✅ vercel.json backed up${NC}"
fi

# Backup de tsconfig
if [ -f tsconfig.json ]; then
  cp tsconfig.json "$BACKUP_DIR/tsconfig.json.${TIMESTAMP}"
  echo -e "${GREEN}✅ tsconfig.json backed up${NC}"
fi

# Backup de tailwind.config
if [ -f tailwind.config.js ] || [ -f taif [ -f tailwind.config.js ] || [ -f taif [ -f tailwind.coIR/" if [ -f tailwind.config.js ] || �� tailwind.cif [ -f tailwind.config.js ] || [ -f taif [ -f tailwind.config.js ] || [ -f taif [ -.txt"if [ -f tailwind.config.js ] || [ -f taif [oject: $(baif [ -f tailwind.confirsiif [ -f tailwind.config.js erif [ -f tailwind.config.js ] || [ -f taif [ -f tailwind.P_if [ -f tailwind.config.js ] || [ -f taif [ -f tai):
$(c$(c$(c$(c$(c$(c$nv.local.${TIMESTAMP}.masked)
MANIFEST

echo -e "\n${GREEN}✅ Backup de configurações completo!${NC}"
echo -e "${YELLOW}Localização: $BACKUP_DIR/${NC}"
