#!/bin/bash
# Script para mergear branch Claude amanhã (PROVA DE FOGO)

set -e

echo "🔥 ========================================="
echo "   MERGE BRANCH CLAUDE - PROVA DE FOGO"
echo "=========================================="
echo ""

# 1. Atualizar tudo
echo "📥 Atualizando repositório..."
git fetch --all --prune
git checkout main
git pull origin main

# 2. Tentar merge
echo ""
echo "🔀 Mergeando branch Claude..."
if git merge origin/claude/refine-lead-pro-saas-IPuQy --no-ff -m "merge: integra branch claude/refine-lead-pro-saas-IPuQy - Prova de Fogo

Merge da branch Claude antes dos testes finais.
Integração completa para validação pré-cliente.

BREAKING: Pode conter mudanças significativas
TEST: Requer validação completa do sistema"; then
    echo "✅ Merge realizado com sucesso!"
else
    echo "⚠️ CONFLITOS DETECTADOS!"
    echo "Arquivos em conflito:"
    git status --short | grep "^UU"
    echo ""
    echo "AÇÕES:"
    echo "1. Resolver conflitos manualmente"
    echo "2. git add <arquivos-resolvidos>"
    echo "3. git commit"
    echo "4. Rodar testes: npm run dev"
    exit 1
fi

# 3. Push (após validação manual)
echo ""
echo "⚠️  IMPORTANTE: NÃO FAÇA PUSH AINDA!"
echo "   1. Teste primeiro: cd frontend/dashboard-admin && npm run dev"
echo "   2. Valide todas as páginas"
echo "   3. Se tudo OK: git push origin main"
echo ""
echo "🎯 Pronto para testes!"
