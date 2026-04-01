#!/bin/bash

# ============================================================
# fix_deploy.sh — Script para Corrigir Deploy do LeadCapture Pro
# ============================================================
# Este script restaura o arquivo server/app.js corrompido
# e faz commit + push automático
# ============================================================

set -e  # Exit on error

echo "🔧 LeadCapture Pro — Deploy Fix Script"
echo "======================================"
echo ""

# Verificar se estamos em um repositório git
if [ ! -d ".git" ]; then
    echo "❌ Erro: Não estou em um repositório git"
    echo "Execute este script na raiz do seu projeto"
    exit 1
fi

# Verificar se o arquivo está corrompido
echo "🔍 Verificando status do arquivo server/app.js..."
if head -1 server/app.js | grep -q "Iniciar teste gratuito\|Compartilhar"; then
    echo "⚠️  Arquivo corrompido detectado!"
else
    echo "✅ Arquivo parece estar OK"
    read -p "Deseja continuar mesmo assim? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📋 Opções de Correção:"
echo "  1) Restaurar do commit anterior (71f491a)"
echo "  2) Restaurar do commit HEAD~1"
echo "  3) Cancelar"
read -p "Escolha uma opção (1-3): " option

case $option in
    1)
        echo "🔄 Restaurando arquivo do commit 71f491a..."
        git checkout 71f491a -- server/app.js
        ;;
    2)
        echo "🔄 Restaurando arquivo do commit anterior..."
        git checkout HEAD~1 -- server/app.js
        ;;
    3)
        echo "❌ Cancelado"
        exit 0
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "✅ Arquivo restaurado com sucesso"
echo ""

# Verificar se o arquivo foi restaurado corretamente
echo "🔍 Verificando integridade do arquivo..."
if head -1 server/app.js | grep -q "//"; then
    echo "✅ Arquivo parece estar correto agora"
else
    echo "⚠️  Aviso: Arquivo pode ainda estar com problemas"
fi

echo ""
echo "📝 Preparando commit..."
git add server/app.js

# Mostrar diff
echo ""
echo "📊 Mudanças:"
git diff --cached server/app.js | head -20
echo "..."

echo ""
read -p "Deseja fazer commit e push? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado. Mudanças não foram commitadas"
    git reset HEAD server/app.js
    exit 0
fi

# Commit
echo "💾 Fazendo commit..."
git commit -m "fix: restore server/app.js from working version"

# Push
echo "🚀 Fazendo push para main..."
git push origin main

echo ""
echo "✅ Deploy fix concluído com sucesso!"
echo ""
echo "📌 Próximos passos:"
echo "  1. Aguarde o Vercel fazer deploy automático (2-3 minutos)"
echo "  2. Verifique se a aplicação está online"
echo "  3. Implemente os fixes de bugs (P1, P2, P3)"
echo ""
echo "🔗 Verifique o status em: https://vercel.com/dashboard"
