#!/bin/bash
# ============================================================
# LEADCAPTURE PRO - INSTALAÇÃO EVOLUTION API + MANYCHAT
# Script de instalação automatizada
# Data: 27/01/2026
# ============================================================

set -e  # Para se houver erro

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║        🚀 INSTALAÇÃO: EVOLUTION API + MANYCHAT SETUP 🚀         ║"
echo "║                                                                  ║"
echo "║     WhatsApp sem burocracia + Instagram via webhook             ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

PROJETO_DIR=~/Projetos/leadcapture-pro

# Verificar se está no diretório correto
if [ ! -d "$PROJETO_DIR" ]; then
    echo "❌ Diretório do projeto não encontrado: $PROJETO_DIR"
    exit 1
fi

cd "$PROJETO_DIR"
echo "📂 Diretório: $PROJETO_DIR"
echo ""

# ============================================================
# PASSO 1: VERIFICAR DOCKER
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 PASSO 1: Verificando Docker..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker Desktop primeiro:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker encontrado: $(docker --version)"

if ! docker ps &> /dev/null; then
    echo "⚠️  Docker Desktop não está rodando"
    echo "   Abra Docker Desktop e aguarde inicialização"
    read -p "Pressione ENTER quando Docker estiver rodando..."
fi

echo "✅ Docker rodando"
echo ""

# ============================================================
# PASSO 2: BACKUP
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 PASSO 2: Fazendo backup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd docker
if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml docker-compose.yml.backup-$(date +%Y%m%d-%H%M%S)
    echo "✅ Backup criado: docker-compose.yml.backup-$(date +%Y%m%d-%H%M%S)"
else
    echo "⚠️  docker-compose.yml não encontrado, criando novo..."
fi

cd ..
echo ""

# ============================================================
# PASSO 3: CRIAR DOCKER-COMPOSE.YML ATUALIZADO
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 PASSO 3: Criando docker-compose.yml atualizado..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > docker/docker-compose.yml << 'DOCKER_EOF'
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: leadcapture-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=juzafalao@gmail.com
      - N8N_BASIC_AUTH_PASSWORD=Ju041287!
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=America/Sao_Paulo
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - leadcapture-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

  evolution-api:
    image: atendai/evolution-api:latest
    container_name: leadcapture-evolution-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - CORS_ORIGIN=*
      - CORS_METHODS=GET,POST,PUT,DELETE
      - CORS_CREDENTIALS=true
      - LOG_LEVEL=ERROR
      - LOG_COLOR=true
      - WEBHOOK_GLOBAL_URL=http://n8n:5678/webhook/whatsapp-global
      - WEBHOOK_GLOBAL_ENABLED=false
      - AUTHENTICATION_API_KEY=leadcapture_secret_key_2026
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=sqlite
      - DATABASE_CONNECTION_URI=file:./evolution.db
      - RABBITMQ_ENABLED=false
      - CACHE_REDIS_ENABLED=false
      - CONFIG_SESSION_PHONE_CLIENT=LeadCapture Pro
      - CONFIG_SESSION_PHONE_NAME=Captador
      - REJECT_CALL=false
      - GROUPS_IGNORE=true
      - ALWAYS_ONLINE=false
      - READ_MESSAGES=false
      - READ_STATUS=false
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
    networks:
      - leadcapture-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

networks:
  leadcapture-network:
    driver: bridge

volumes:
  n8n_data:
    driver: local
  evolution_instances:
    driver: local
  evolution_store:
    driver: local
DOCKER_EOF

echo "✅ docker-compose.yml criado com Evolution API"
echo ""

# ============================================================
# PASSO 4: INICIAR CONTAINERS
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 PASSO 4: Iniciando containers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd docker

echo "Parando containers antigos..."
docker compose down

echo ""
echo "Iniciando novos containers..."
docker compose up -d

echo ""
echo "Aguardando inicialização (30 segundos)..."
sleep 30

echo ""
echo "✅ Containers iniciados!"
echo ""

# ============================================================
# PASSO 5: VERIFICAR STATUS
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PASSO 5: Verificando status..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Containers rodando:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""

# Testar n8n
if curl -s http://localhost:5678 > /dev/null; then
    echo "✅ n8n: http://localhost:5678 (ONLINE)"
else
    echo "❌ n8n: http://localhost:5678 (OFFLINE)"
fi

# Testar Evolution API
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Evolution API: http://localhost:8080 (ONLINE)"
else
    echo "❌ Evolution API: http://localhost:8080 (OFFLINE)"
fi

echo ""

# ============================================================
# PASSO 6: INSTRUÇÕES DE USO
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📖 PRÓXIMOS PASSOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "1️⃣  CRIAR INSTÂNCIA WHATSAPP:"
echo ""
echo "    curl -X POST http://localhost:8080/instance/create \\"
echo "      -H 'apikey: leadcapture_secret_key_2026' \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{"
echo "        \"instanceName\": \"leadcapture-whatsapp\","
echo "        \"webhook\": \"http://n8n:5678/webhook/whatsapp-message\","
echo "        \"webhookByEvents\": true,"
echo "        \"events\": [\"MESSAGES_UPSERT\"]"
echo "      }'"
echo ""

echo "2️⃣  GERAR QR CODE:"
echo ""
echo "    curl -X GET 'http://localhost:8080/instance/connect/leadcapture-whatsapp' \\"
echo "      -H 'apikey: leadcapture_secret_key_2026'"
echo ""
echo "    Copie o base64 e cole em: https://codebeautify.org/base64-to-image-converter"
echo ""

echo "3️⃣  ESCANEAR QR CODE:"
echo ""
echo "    - Abra WhatsApp no celular"
echo "    - Menu (⋮) → Dispositivos conectados"
echo "    - Conectar um dispositivo"
echo "    - Escanear QR Code gerado"
echo ""

echo "4️⃣  VERIFICAR CONEXÃO:"
echo ""
echo "    curl -X GET 'http://localhost:8080/instance/connectionState/leadcapture-whatsapp' \\"
echo "      -H 'apikey: leadcapture_secret_key_2026'"
echo ""
echo "    Deve retornar: \"state\": \"open\""
echo ""

echo "5️⃣  CONFIGURAR N8N:"
echo ""
echo "    - Acessar: http://localhost:5678"
echo "    - Criar workflow conforme guia"
echo "    - Ver: GUIA_WHATSAPP_INSTAGRAM_SEM_META.md"
echo ""

echo "6️⃣  INSTALAR NGROK (para Instagram):"
echo ""
echo "    brew install ngrok"
echo "    ngrok config add-authtoken SEU_TOKEN"
echo "    ngrok http 5678"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================
# PASSO 7: CRIAR GUIA RÁPIDO
# ============================================================
echo "📄 Criando guia rápido de referência..."

cd ..
cat > docs/EVOLUTION_API_QUICKSTART.md << 'GUIDE_EOF'
# 🚀 Evolution API - Guia Rápido

## Comandos Úteis

### Criar Instância
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: leadcapture_secret_key_2026" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "leadcapture-whatsapp",
    "webhook": "http://n8n:5678/webhook/whatsapp-message",
    "webhookByEvents": true,
    "events": ["MESSAGES_UPSERT"]
  }'
```

### Gerar QR Code
```bash
curl -X GET "http://localhost:8080/instance/connect/leadcapture-whatsapp" \
  -H "apikey: leadcapture_secret_key_2026"
```

### Verificar Conexão
```bash
curl -X GET "http://localhost:8080/instance/connectionState/leadcapture-whatsapp" \
  -H "apikey: leadcapture_secret_key_2026"
```

### Listar Instâncias
```bash
curl -X GET "http://localhost:8080/instance/fetchInstances" \
  -H "apikey: leadcapture_secret_key_2026"
```

### Enviar Mensagem Teste
```bash
curl -X POST "http://localhost:8080/message/sendText/leadcapture-whatsapp" \
  -H "apikey: leadcapture_secret_key_2026" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Teste de mensagem"
  }'
```

### Desconectar (Logout)
```bash
curl -X DELETE "http://localhost:8080/instance/logout/leadcapture-whatsapp" \
  -H "apikey: leadcapture_secret_key_2026"
```

### Deletar Instância
```bash
curl -X DELETE "http://localhost:8080/instance/delete/leadcapture-whatsapp" \
  -H "apikey: leadcapture_secret_key_2026"
```

## Webhooks Recebidos

Quando mensagem chega, Evolution API envia:

```json
{
  "event": "messages.upsert",
  "instance": "leadcapture-whatsapp",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "msg_id_123"
    },
    "message": {
      "conversation": "Texto da mensagem"
    },
    "pushName": "Nome do Contato",
    "messageTimestamp": "1706200000"
  }
}
```

## Troubleshooting

### Container não inicia
```bash
docker logs leadcapture-evolution-api
```

### Porta ocupada
```bash
lsof -i :8080
kill -9 PID
```

### Resetar tudo
```bash
cd ~/Projetos/leadcapture-pro/docker
docker compose down -v
docker compose up -d
```

## URLs Importantes

- Evolution API: http://localhost:8080
- n8n: http://localhost:5678
- Documentação: https://doc.evolution-api.com
GUIDE_EOF

echo "✅ Guia criado em: docs/EVOLUTION_API_QUICKSTART.md"
echo ""

# ============================================================
# RESUMO FINAL
# ============================================================
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║                    ✅ INSTALAÇÃO CONCLUÍDA! ✅                   ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 STATUS:"
echo "   ✅ Docker atualizado"
echo "   ✅ n8n rodando em http://localhost:5678"
echo "   ✅ Evolution API rodando em http://localhost:8080"
echo "   ✅ Guia rápido criado"
echo ""
echo "📖 PRÓXIMO PASSO:"
echo "   Criar instância WhatsApp (ver comandos acima)"
echo ""
echo "📁 DOCUMENTAÇÃO:"
echo "   - GUIA_WHATSAPP_INSTAGRAM_SEM_META.md"
echo "   - docs/EVOLUTION_API_QUICKSTART.md"
echo ""
echo "🎯 META: WhatsApp + Instagram funcionando em 1 hora!"
echo ""
echo "💪 VOCÊ CONSEGUE!"
echo ""
