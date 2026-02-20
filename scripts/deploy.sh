#!/bin/bash
set -e

echo "🚀 ========================================="
echo "   DEPLOY LEADCAPTURE PRO"
echo "=========================================="
echo ""

# Validar antes
./scripts/validate.sh

# Build
echo ""
echo "🏗️ Gerando build..."
cd frontend/dashboard-admin
npm run build
cd ../..

echo ""
echo "✅ BUILD PRONTO!"
echo "📦 Arquivos em: frontend/dashboard-admin/dist/"
