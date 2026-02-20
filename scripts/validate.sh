#!/bin/bash
set -e

echo "🔍 ========================================="
echo "   VALIDAÇÃO LEADCAPTURE PRO"
echo "=========================================="
echo ""

# 1. Verificar Node
echo "📦 Verificando Node.js..."
node --version && npm --version || exit 1

# 2. Frontend
echo ""
echo "🎨 Validando frontend..."
cd frontend/dashboard-admin
npm install --silent
npm run lint || echo "⚠️ Warnings encontrados"
npm run build
cd ../..

# 3. Backend
echo ""
echo "🔌 Validando backend..."
cd server
npm install --silent
node -c app.js
cd ..

echo ""
echo "✅ ========================================="
echo "   VALIDAÇÃO COMPLETA!"
echo "=========================================="
