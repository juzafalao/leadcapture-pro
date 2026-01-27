#!/bin/bash
set -e

EVOLUTION_URL="${EVOLUTION_URL:-http://localhost:8080}"
CONTAINER="${CONTAINER:-leadcapture-evolution}"
INSTANCE_NAME="${INSTANCE_NAME:-leadcapture-whatsapp}"

# webhook para n8n (mantive como você estava usando)
WEBHOOK_URL="${WEBHOOK_URL:-http://n8n:5678/webhook/whatsapp-message}"

echo "🔎 Lendo AUTH do container: $CONTAINER"
AUTH_TYPE=$(docker exec -i "$CONTAINER" sh -lc 'echo -n "${AUTHENTICATION_TYPE}"' 2>/dev/null || true)
API_KEY=$(docker exec -i "$CONTAINER" sh -lc 'echo -n "${AUTHENTICATION_API_KEY}"' 2>/dev/null || true)

if [ -z "$AUTH_TYPE" ]; then AUTH_TYPE="apikey"; fi

if [ -z "$API_KEY" ]; then
  echo "❌ Não consegui ler AUTHENTICATION_API_KEY dentro do container."
  echo "➡️ Isso significa que sua Evolution não recebeu a variável no docker-compose."
  echo "✅ Ação: abra docker/docker-compose.yml e adicione:"
  echo "   - AUTHENTICATION_TYPE=apikey"
  echo "   - AUTHENTICATION_API_KEY=UMA_CHAVE_FORTE"
  exit 1
fi

echo "✅ AUTH_TYPE=$AUTH_TYPE"
echo "✅ API_KEY=*** (carregada do container)"
echo "🚀 Criando instância: $INSTANCE_NAME"

if [ "$AUTH_TYPE" = "jwt" ]; then
  AUTH_HEADER=(-H "Authorization: Bearer $API_KEY")
else
  AUTH_HEADER=(-H "apikey: $API_KEY")
fi

curl -s -X POST "$EVOLUTION_URL/instance/create" \
  -H "Content-Type: application/json" \
  "${AUTH_HEADER[@]}" \
  -d "{
    \"instanceName\": \"$INSTANCE_NAME\",
    \"webhook\": \"$WEBHOOK_URL\",
    \"webhookByEvents\": true,
    \"events\": [\"MESSAGES_UPSERT\"]
  }"

echo ""
echo "✅ Agora gere o QR:"
echo "curl -s -X GET \"$EVOLUTION_URL/instance/connect/$INSTANCE_NAME\" ${AUTH_HEADER[*]}"

