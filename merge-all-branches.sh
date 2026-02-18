#!/bin/bash
echo "🔀 Iniciando merge de todas as branches..."

# Ir para a branch main
git checkout main

# Criar nova branch unificada
git checkout -b unified-structure

echo "📦 Mergeando branches na ordem de importância..."

# Ordem de merge (do mais antigo para o mais novo/importante)
branches_order=(
    "master"                    # Backend base
    "feat/landing-lava-lava"   # Landing pages
    "feature/lead-modal"        # Feature frontend
    "feat/Demo_2.0"            # Demo melhorada
    "feat/demo-perfeita-hoje"  # Demo final
    "deploy-fix"               # Fixes de deploy
    "deploy-fix-clean"         # Fixes limpos
)

for branch in "${branches_order[@]}"; do
    echo "🔄 Mergeando: $branch"
    
    # Tentar merge automático
    git merge "$branch" --no-edit --allow-unrelated-histories || {
        echo "⚠️  Conflitos encontrados em $branch"
        echo "Resolvendo automaticamente favorecendo a branch atual..."
        git merge --strategy-option ours --no-edit
    }
    
    echo "✅ Branch $branch mergeada!"
done

echo "🎉 Merge completo! Branch: unified-structure"
