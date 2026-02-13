#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 ATUALIZAR SUPABASE SERVICE KEY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backup do .env atual
cp .env .env.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup criado"
echo ""

# Mostrar key atual
echo "🔍 Key ATUAL (primeiros 30 chars):"
grep "SUPABASE_SERVICE_KEY" .env | cut -d'=' -f2 | cut -c1-30
echo "..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COPIE A KEY DO SUPABASE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Abra: https://app.supabase.com/project/krcybmownrpfjvqhacup/settings/api"
echo "2. Procure: 'service_role' secret"
echo "3. Clique em 'Reveal' ou ícone de olho"
echo "4. Copie a key COMPLETA"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Cole a nova SERVICE_ROLE key aqui: " NEW_KEY

if [ -z "$NEW_KEY" ]; then
  echo "❌ Key vazia! Cancelando..."
  exit 1
fi

# Validar formato da key (deve começar com eyJ)
if [[ ! $NEW_KEY =~ ^eyJ ]]; then
  echo "⚠️  ATENÇÃO: A key não parece ser um JWT válido (não começa com 'eyJ')"
  read -p "Tem certeza que quer usar essa key? (s/N): " confirm
  if [[ ! $confirm =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado"
    exit 1
  fi
fi

# Criar novo .env
cat > .env << NEWENV
# Supabase Configuration
SUPABASE_URL=https://krcybmownrpfjvqhacup.supabase.co
SUPABASE_SERVICE_KEY=$NEW_KEY

# Security Keys
ENCRYPTION_KEY_HEX=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
SERVER_API_KEY=leadcapture-api-key-2026-secure-production

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACca794974c9b8ec8e8ce15862a4bb0954
TWILIO_AUTH_TOKEN=ff711170570c41baee7875213b28c169
TWILIO_WHATSAPP_FROM=+17064206831

# Server Configuration
PORT=4000
NODE_ENV=development

# Supabase ANON Key (frontend)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyY3libW93bnJwZmp2cWhhY3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTM0MDgsImV4cCI6MjA4NDcyOTQwOH0.Y5D_dWds6XmJuhy0oxPwkgSmbq4BGS3sKB0OlHahP_c
NEWENV

echo ""
echo "✅ Arquivo .env atualizado!"
echo ""
echo "📋 Nova key (primeiros 30 chars):"
echo "$NEW_KEY" | cut -c1-30
echo "..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 PRÓXIMO PASSO: REINICIAR BACKEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. No terminal do backend, pressione Ctrl+C"
echo "2. Execute: node index.js"
echo "3. Teste novamente"
echo ""

