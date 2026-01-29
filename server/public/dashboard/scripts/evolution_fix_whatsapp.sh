#!/usr/bin/env bash
set -eo pipefail
# Não usar "set -u" para não quebrar com variáveis do shell (HISTTIMEFORMAT etc.)

# Sempre resolve o projeto a partir da localização do script (independente do CWD)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker/docker-compose.yml"
DOCKER_DIR="$PROJECT_DIR/docker"

EVOLUTION_CONTAINER="leadcapture-evolution"
REDIS_CONTAINER="leadcapture-redis"

INSTANCE_NAME="${1:-leadcapture-whatsapp}"
API_BASE="${API_BASE:-http://localhost:8080}"
DEV_API_KEY="${DEV_API_KEY:-leadcapturepro_dev_key_$(date +%s)}"

echo "== LeadCapturePro | Evolution Fix WhatsApp =="
echo "Project:   $PROJECT_DIR"
echo "Compose:   $COMPOSE_FILE"
echo "Instance:  $INSTANCE_NAME"
echo "API:       $API_BASE"
echo "API_KEY:   (hidden)"
echo

# 1) Validar docker-compose
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ Não achei o docker-compose.yml em: $COMPOSE_FILE"
  echo "➡️ Confirme se o arquivo está em: $PROJECT_DIR/docker/docker-compose.yml"
  exit 1
fi

echo "✅ docker-compose.yml encontrado."
echo

# 2) Patch docker-compose: adicionar Redis + env vars (idempotente) + backup
python3 - <<PY
import os, re
from pathlib import Path

compose_file = Path(os.environ["COMPOSE_FILE"])
txt = compose_file.read_text(encoding="utf-8")

bak = Path(str(compose_file) + ".bak")
if not bak.exists():
    bak.write_text(txt, encoding="utf-8")

dev_key = os.environ["DEV_API_KEY"]

def ensure_service_exists(service_name: str, txt: str) -> bool:
    return re.search(rf"(?m)^\s{{2}}{re.escape(service_name)}:\s*$", txt) is not None

def ensure_redis_service(txt: str) -> str:
    if ensure_service_exists("redis", txt):
        return txt

    redis_block = """
  redis:
    image: redis:7-alpine
    container_name: leadcapture-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: ["redis-server", "--appendonly", "yes"]
"""
    if not txt.endswith("\n"):
        txt += "\n"
    txt += "\n" + redis_block
    return txt

def get_service_block(service_name: str, txt: str) -> tuple[int,int,str]:
    pattern = rf"(?ms)^  {re.escape(service_name)}:\s*\n(.*?)(?=^  [a-zA-Z0-9_-]+:\s|\Z)"
    m = re.search(pattern, txt)
    if not m:
        raise SystemExit(f"Não encontrei serviço '{service_name}:' no compose.")
    return m.start(), m.end(), txt[m.start():m.end()]

def ensure_env(service_name: str, env_lines: list[str], txt: str) -> str:
    start, end, block = get_service_block(service_name, txt)

    if "environment:" not in block:
        # insere environment perto do topo do bloco
        insertion = "    environment:\n" + "\n".join([f"      - {l}" for l in env_lines]) + "\n"
        block = block.rstrip() + "\n" + insertion
    else:
        for l in env_lines:
            if re.search(rf"(?m)^\s*-\s*{re.escape(l)}\s*$", block):
                continue
            block = re.sub(r"(?m)^\s+environment:\s*$", lambda mm: mm.group(0) + "\n      - " + l, block, count=1)

    # garante depends_on redis
    if "depends_on:" not in block:
        block = block.rstrip() + "\n    depends_on:\n      - redis\n"
    else:
        if not re.search(r"(?m)^\s*-\s*redis\s*$", block):
            block = re.sub(r"(?m)^\s+depends_on:\s*$", lambda mm: mm.group(0) + "\n      - redis", block, count=1)

    return txt[:start] + block + txt[end:]

txt2 = txt
txt2 = ensure_redis_service(txt2)

# Ajuste o nome do serviço abaixo se no seu compose não for "evolution-api"
# Alguns composes usam "evolution", "evolutionapi", etc.
service_name_guess = None
for candidate in ["evolution-api", "evolution", "evolution_api"]:
    if ensure_service_exists(candidate, txt2):
        service_name_guess = candidate
        break
if not service_name_guess:
    raise SystemExit("Não encontrei o serviço Evolution no compose. Procure por 'evolution' no docker-compose.yml.")

txt2 = ensure_env(service_name_guess, [
    "AUTHENTICATION_TYPE=apikey",
    f"AUTHENTICATION_API_KEY={dev_key}",
    "REDIS_ENABLED=true",
    "REDIS_URI=redis://redis:6379",
], txt2)

compose_file.write_text(txt2, encoding="utf-8")
print(f"✅ Patch aplicado em {compose_file}")
print(f"✅ Backup: {bak}")
print(f"✅ Serviço Evolution detectado: {service_name_guess}")
PY

echo
echo "== Subindo stack (recriar containers) =="
cd "$DOCKER_DIR"
docker compose up -d --force-recreate
echo "✅ Stack ok."
echo

echo "== Logs rápidos (Redis/Evolution) =="
docker logs "$REDIS_CONTAINER" --tail 20 || true
docker logs "$EVOLUTION_CONTAINER" --tail 40 || true
echo

echo "== Verificando envs dentro do Evolution =="
docker exec -it "$EVOLUTION_CONTAINER" sh -lc 'echo "AUTHENTICATION_TYPE=$AUTHENTICATION_TYPE"; echo "AUTHENTICATION_API_KEY=${AUTHENTICATION_API_KEY:+***}"; echo "REDIS_URI=$REDIS_URI"' || true
echo

echo "== Healthcheck Evolution =="
curl -s "$API_BASE" | head -c 400; echo
echo

echo "== Listando instâncias (fetchInstances) =="
curl -s "$API_BASE/instance/fetchInstances" -H "apikey: $DEV_API_KEY" | head -c 2000; echo
echo

echo "== Criando instância: $INSTANCE_NAME =="
CREATE_PAYLOAD=$(cat <<JSON
{
  "instanceName": "$INSTANCE_NAME",
  "webhook": "http://n8n:5678/webhook/whatsapp-message",
  "webhookByEvents": true,
  "events": ["MESSAGES_UPSERT"]
}
JSON
)

# tenta dois endpoints comuns
echo "-- POST /instance/create"
resp1=$(curl -s -w "\n__HTTP:%{http_code}\n" -X POST "$API_BASE/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: $DEV_API_KEY" \
  -d "$CREATE_PAYLOAD")
echo "$resp1" | sed 's/'"$DEV_API_KEY"'/***REDACTED***/g'
http1=$(echo "$resp1" | awk -F'__HTTP:' 'END{print $2}' | tr -d '\r')

if [ "$http1" != "200" ] && [ "$http1" != "201" ]; then
  echo
  echo "-- POST /instance (fallback)"
  resp2=$(curl -s -w "\n__HTTP:%{http_code}\n" -X POST "$API_BASE/instance" \
    -H "Content-Type: application/json" \
    -H "apikey: $DEV_API_KEY" \
    -d "$CREATE_PAYLOAD")
  echo "$resp2" | sed 's/'"$DEV_API_KEY"'/***REDACTED***/g'
fi

echo
echo "== Listando instâncias (fetchInstances) após create =="
curl -s "$API_BASE/instance/fetchInstances" -H "apikey: $DEV_API_KEY" | head -c 2000; echo
echo

echo "== Connect/QR (se suportado) =="
curl -s "$API_BASE/instance/connect/$INSTANCE_NAME" -H "apikey: $DEV_API_KEY" | head -c 2000; echo
echo

echo "✅ Finalizado. Se falhar, rode: docker logs $EVOLUTION_CONTAINER --tail 200"
