#!/bin/bash
set -e

echo "🚀 ========================================="
echo "   BUILD LEADCAPTURE PRO"
echo "=========================================="
echo ""

# Validar antes (if exists)
if [ -f "./scripts/validate.sh" ]; then
    ./scripts/validate.sh
fi

# Build
echo ""
echo "🏗️ Gerando build do Frontend..."
cd frontend/dashboard-admin
npm install
npm run build
cd ../..

echo ""
echo "🧹 Limpando dashboard-build/..."
# Ensure directory exists
mkdir -p dashboard-build
# Remove content but keep directory
rm -rf dashboard-build/*

echo ""
echo "📂 Movendo artefatos para dashboard-build/..."
cp -r frontend/dashboard-admin/dist/* dashboard-build/

echo ""
echo "✅ BUILD FULL PRONTO!"
echo "📦 Arquivos em: dashboard-build/"
ls -F dashboard-build/ | head -n 5
