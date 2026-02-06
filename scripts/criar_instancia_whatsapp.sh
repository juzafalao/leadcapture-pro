#!/bin/bash

# ================================
# CONFIGURAÇÕES
# ================================
EVOLUTION_URL="http://localhost:8080"
INSTANCE_NAME="leadcapture-whatsapp"

# Webhook interno (Evolution → n8n)
WEBHOOK_URL="http://n8n:5678/webhook/whatsapp-message"

# ================================
# CARREGAR VARIÁVEIS DE AMBIENTE
# ================================
if [ ! -f .env ]; then
  echo "❌ Arquivo .env não encontrado"
  exit 1
fi

export $(grep -v '^#' .env | xargs)

# Ajuste conforme sua variável real
API_KEY="${EVOLUTION_API_KEY:-$API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "❌ API KEY da Evolution não encontrada no .env"
  echo "➡️ Esperado: EVOLUTION_API_KEY ou API_KEY"
  exit 1
fi

echo "✅ API KEY carregada"

# ================================
# CRIAR INSTÂNCIA
# ================================
echo "🚀 Criando instância WhatsApp: $INSTANCE_NAME"

curl -s -X POST "$EVOLUTION_URL/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: $API_KEY" \
  -d "{
    \"instanceName\": \"$INSTANCE_NAME\",
    \"webhook\": \"$WEBHOOK_URL\",
    \"webhookByEvents\": true,
    \"events\": [\"MESSAGES_UPSERT\"]
  }" | jq .

echo ""
echo "📌 Se status = 200/201, a instância foi criada com sucesso"
echo "📲 Acesse o Manager para parear o WhatsApp:"
echo "👉 $EVOLUTION_URL/manager"
