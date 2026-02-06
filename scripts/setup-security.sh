#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d%H%M%S)
GITIGNORE=".gitignore"

echo ">>> Adicionando entradas recomendadas ao ${GITIGNORE}"
grep -qxF ".env.server" ${GITIGNORE} || echo ".env.server" >> ${GITIGNORE}
grep -qxF "server/.env" ${GITIGNORE} || echo "server/.env" >> ${GITIGNORE}
grep -qxF "server/node_modules" ${GITIGNORE} || echo "server/node_modules" >> ${GITIGNORE}

echo ">>> Criando exemplo de arquivo server/.env.server.example (se não existir)"
if [ ! -f "server/.env.server.example" ]; then
  cat > server/.env.server.example <<'EOF'
# Copy this file to server/.env and fill the values (DO NOT COMMIT server/.env)
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_xxx
ENCRYPTION_KEY_HEX=<32-byte-hex-64chars>
SERVER_API_KEY=<random-server-api-key>
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
EOF
  echo "Created server/.env.server.example"
else
  echo "server/.env.server.example already exists, skipping"
fi

echo ">>> Lembrete: Depois rode:"
echo "  cd server"
echo "  npm install"
echo "  cp .env.server.example .env"
echo "  edit .env com valores reais (NUNCA comitar)"
echo "  npm start"