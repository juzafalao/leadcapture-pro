#!/bin/bash
set -e

echo "🚀 ========================================="
echo "   DEPLOY LEADCAPTURE PRO"
echo "=========================================="
echo ""

# Validar antes
if [ -f "./scripts/validate.sh" ]; then
    ./scripts/validate.sh
fi

# Build usando o script unificado (gera dashboard-build/)
./scripts/build.sh

echo ""
echo "✅ DEPLOY PRONTO! (Artefatos sincronizados em dashboard-build/)"
