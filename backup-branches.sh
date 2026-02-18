#!/bin/bash
echo "🔄 Criando backup de todas as branches..."

# Criar pasta de backup
mkdir -p ../leadcapture-pro-backup
cd ../leadcapture-pro-backup

# Clonar repositório
git clone https://github.com/juzafalao/leadcapture-pro.git .

# Fazer backup de cada branch
branches=("main" "master" "deploy-fix" "deploy-fix-clean" "feat/Demo_2.0" "feat/demo-perfeita-hoje" "feat/landing-lava-lava" "feature/lead-modal" "restructure-v2")

for branch in "${branches[@]}"; do
    echo "📦 Backup da branch: $branch"
    git checkout "$branch" 2>/dev/null
    mkdir -p "../backups/$branch"
    cp -r . "../backups/$branch/" 2>/dev/null
done

echo "✅ Backup completo!"
