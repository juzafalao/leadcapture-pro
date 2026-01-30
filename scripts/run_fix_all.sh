#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.yml"
EV_CONTAINER="leadcapture-evolution"

AUTH_TYPE="apikey"
AUTH_KEY="${AUTH_KEY:-leadcapturepro_dev_key_$(date +%s)}"

echo "== LeadCapturePro | Fix All =="
echo "Project: $PROJECT_ROOT"
echo "Compose:  $COMPOSE_FILE"
echo "Auth:     $AUTH_TYPE / $AUTH_KEY"
echo ""

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ Não encontrei: $COMPOSE_FILE"
  exit 1
fi

# -------------------------------------------------------
# PASSO 1: SQL do Supabase (imprime; você já aplicou manualmente)
# -------------------------------------------------------
SQL_FIX='ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;'
echo "== PASSO 1: Supabase schema (tenants.is_active) =="
echo "✅ Se já funcionou no dashboard, ok."
echo "Se precisar, cole no Supabase SQL Editor:"
echo "$SQL_FIX"
echo ""

# -------------------------------------------------------
# PASSO 2: Patch docker-compose.yml (Evolution AUTH env vars)
# -------------------------------------------------------
echo "== PASSO 2: Patch docker-compose (Evolution AUTH env vars) =="

python3 - "$COMPOSE_FILE" "$AUTH_TYPE" "$AUTH_KEY" <<'PY'
import re, shutil, sys

compose_path = sys.argv[1]
auth_type = sys.argv[2]
auth_key = sys.argv[3]

with open(compose_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

bak = compose_path + ".bak"
shutil.copyfile(compose_path, bak)

# localizar linha com container_name: leadcapture-evolution
idx = None
for i, line in enumerate(lines):
    if re.match(r'^\s*container_name:\s*leadcapture-evolution\s*$', line.strip()):
        idx = i
        break
if idx is None:
    # fallback: procurar "leadcapture-evolution" em qualquer container_name
    for i, line in enumerate(lines):
        if "container_name:" in line and "leadcapture-evolution" in line:
            idx = i
            break
if idx is None:
    print("❌ Não encontrei container_name: leadcapture-evolution no compose.")
    print("➡️ Abra docker/docker-compose.yml e confirme o container_name do Evolution.")
    sys.exit(2)

# achar início do service (linha com indent 2 e termina com :)
service_start = None
for j in range(idx, -1, -1):
    if re.match(r'^\s{2}[A-Za-z0-9_.-]+:\s*$', lines[j]):
        service_start = j
        break
if service_start is None:
    print("❌ Não consegui identificar o início do service do Evolution.")
    sys.exit(3)

# achar fim do service (próximo service indent 2 ou EOF)
service_end = len(lines)
for j in range(service_start + 1, len(lines)):
    if re.match(r'^\s{2}[A-Za-z0-9_.-]+:\s*$', lines[j]):
        service_end = j
        break

block = lines[service_start:service_end]

# garantir environment:
env_line_idx = None
for k, line in enumerate(block):
    if re.match(r'^\s{4}environment:\s*$', line):
        env_line_idx = k
        break

auth_env_lines = [
    f"      - AUTHENTICATION_TYPE={auth_type}\n",
    f"      - AUTHENTICATION_API_KEY={auth_key}\n",
]

def has_env(prefix: str) -> bool:
    pat = re.compile(r'^\s{6}-\s*' + re.escape(prefix))
    return any(pat.match(ln) for ln in block)

if env_line_idx is None:
    # inserir environment após container_name se existir, senão após image, senão no começo do bloco
    insert_at = None
    for k, line in enumerate(block):
        if re.match(r'^\s{4}container_name:\s*leadcapture-evolution\s*$', line.strip()):
            insert_at = k + 1
            break
    if insert_at is None:
        for k, line in enumerate(block):
            if re.match(r'^\s{4}image:\s*', line):
                insert_at = k + 1
                break
    if insert_at is None:
        insert_at = 1

    new_block = block[:insert_at] + ["    environment:\n"] + auth_env_lines + block[insert_at:]
    block = new_block
else:
    # environment existe: inserir linhas se faltarem
    if not has_env("AUTHENTICATION_TYPE="):
        block.insert(env_line_idx + 1, auth_env_lines[0])
        env_line_idx += 1
    if not has_env("AUTHENTICATION_API_KEY="):
        block.insert(env_line_idx + 1, auth_env_lines[1])

# escrever arquivo
new_lines = lines[:service_start] + block + lines[service_end:]
with open(compose_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print(f"✅ Patch aplicado com sucesso. Backup: {bak}")
PY

echo "✅ Compose patch aplicado."
echo ""

# -------------------------------------------------------
# PASSO 3: Recriar containers para aplicar env vars
# -------------------------------------------------------
echo "== PASSO 3: Recriar containers (apply env vars) =="
cd "$PROJECT_ROOT/docker"
docker compose up -d --force-recreate
echo "✅ Containers recriados."
echo ""

# -------------------------------------------------------
# PASSO 4: Validar env vars dentro do container
# -------------------------------------------------------
echo "== PASSO 4: Validar AUTH dentro do container =="
docker exec -it "$EV_CONTAINER" sh -lc 'echo "AUTHENTICATION_TYPE=$AUTHENTICATION_TYPE"; echo "AUTHENTICATION_API_KEY=$AUTHENTICATION_API_KEY"'
echo ""

# -------------------------------------------------------
# PASSO 5: Criar instância WhatsApp (usa key do container)
# -------------------------------------------------------
echo "== PASSO 5: Criar instância WhatsApp =="
chmod +x "$PROJECT_ROOT/scripts/criar_instancia_whatsapp_container_key.sh"
cd "$PROJECT_ROOT/scripts"
./criar_instancia_whatsapp_container_key.sh

echo ""
echo "✅ FIM. Abra o Manager:"
echo "open http://localhost:8080/manager"
