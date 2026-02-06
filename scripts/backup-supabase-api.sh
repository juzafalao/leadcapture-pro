#!/bin/bash

# ============================================
# BACKUP VIA SUPABASE API
# (Para quem não tem acesso direto ao PostgreSQL)
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔄 Backup via Supabase API...${NC}"

# Carregar variáveis de ambiente
source .env.local

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/database"
mkdir -p $BACKUP_DIR

# Lista de tabelas para backup
TABLES=(
  "tenants"
  "usuarios"
  "leads"
  "interactions"
  "lead_events"
  "webhook_requests"
  "analytics_events"
)

echo -e "${YELLOW}📊 Exportando dados das tabelas...${NC}"

for TABLE in "${TABLES[@]}"; do
  echo -e "  → $TABLE"
  
  curl -s "$VITE_SUPABASE_URL/rest/v1/$TABLE?select=*" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
    > "$BACKUP_DIR/${TABLE}_${TIMESTAMP}.json"
done

# Comprimir tudo em um arquivo
echo -e "${YELLOW}🗜️  Comprimindo...${NC}"
tar -czf "$BACKUP_DIR/api_backup_${TIMESTAMP}.tar.gz" \
  $BACKUP_DIR/*_${TIMESTAMP}.json

# Remover JSONs individuais
rm $BACKUP_DIR/*_${TIMESTAMP}.json

ecececececececececececececececececececececececeUP_ececapi_ececece${TIMESTAMP}.tar.gz${NC}"
