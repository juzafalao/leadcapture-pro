#!/bin/bash

# ============================================
# SCRIPT DE BACKUP DO BANCO DE DADOS
# ============================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  Iniciando backup do banco de dados...${NC}"

# Verificar se existe DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ Erro: DATABASE_URL não configurado${NC}"
  echo "Configure com: export DATABASE_URL='postgresql://user:pass@host:port/database'"
  exit 1
fi

# Criar timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/database"
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="$BACKUP_FILE.gz"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}📊 Criando backup...${NC}"

# Opção 1: Backup completo (schema + dados)
pg_dump "$DATABASE_URL" \
  --format=plain \
  --no-owner \
  --no-acl \
  --verbo  --verbo  --verbo  --verbo  ->&1 | tee "$  --verbo /backup_${TIMESTAMP}.log"

# Comprimir backup
echo -e "${YELLOW}🗜️  Comprimindo backup...${NC}"
gzip -9 "$BACKUP_FILE"

# Verificar tamanho
BACKUP_SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
echo -e "${GREEN}✅ Backup criado: $BACKUP_COMPRESSED ($BACKUP_SIZE)${NC}"

# Backup apenas do schema (sem dados - útil para comparação)
SCHEMA_FILE="$BACKUP_DIR/schema_${TIMESTAMP}.sql"
echo -e "${YELLOW}📋 Criando backup do schema...${NC}"
pg_dump "$DATABASE_URL" \
  --schema-only \
  --no-owner \
  --no-acl \
  --file="$SCHEMA_FILE"

gzip -9 "$SCHEMA_FILE"
echo -echo -echo -echochema backup: ${SCHEMA_FILE}.gz${NCecho -echo -echo -echochemackup
cat > "$BACKUP_DIR/manifest_${TIMESTAMP}.txt" << MANIFEST
Backup Date: $(date)
DatabaDatabaDatabaDatabaDatabaDatabd 's/pDatabaDatabaDatab]*@/postgresql:\/\/***@/')
Full Backup: $BACKUP_COMPRFull Backup: $BACKUP_COMPRFull Backup: $B: $BAFull Backup: $BACKUP_ed Up:
$(psql "$DATABASE_URL" -t -c "SELECT table_na$(psql "$DATABASE_URL" -t -c "SELECT table_na$(psql "$DATABASE_URL" -t -c "SELECT tab)

Row Counts:
$(psql $(psql $(psql $(psql $(psql $(psql $(psql $(psql $(ps.'$(psql $(psql $(psqble_name,
    n_live_tup AS row_count
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC;
")
MANIFEST

echo -e "${GREEN}📄 Manifesto criado: $BACKUP_echo -e "${GREEN}📄 Manifesto criado: $BACKUP_echo -e "${Gntesecho -e "${GREEN}📄 Manifesto criado: $BACKUP${Necho -e "${GREEN}📄 Manifesto criado: $BACKUP_echo -e backup anterior encontrado"

# Limpeza de backups antigos (m# Limpeza ds # Limpeza de backups a-e "\n${YELLOW}🧹 Limpando backups antigos (>7 dias)...${NC}"
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "schema_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "manifest_*.txt" -mtime +7 -delete

echo -e "\n${GREEN}✅ Backup completo! Arquivo: $BACKUP_COMPRESSED${NC}"
echo -e "${GREEN}Para restaurar, use: ./scripts/restore-database.sh $BACKUP_COMPRESSED${NC}"
