#!/bin/bash
echo "🔍 Analisando diferenças entre branches..."

# Criar relatório
report="branch-analysis.md"
echo "# Análise de Branches - LeadCapture Pro" > $report
echo "Data: $(date)" >> $report
echo "" >> $report

branches=("main" "master" "deploy-fix" "deploy-fix-clean" "feat/Demo_2.0" "feat/demo-perfeita-hoje" "feat/landing-lava-lava" "feature/lead-modal" "restructure-v2")

for branch in "${branches[@]}"; do
    echo "## Branch: $branch" >> $report
    git checkout "$branch" 2>/dev/null
    
    echo "### Último Commit:" >> $report
    git log -1 --oneline >> $report
    
    echo "### Arquivos Únicos:" >> $report
    git ls-files >> "../files-$branch.txt"
    
    echo "### Estrutura de Pastas:" >> $report
    tree -L 2 -d >> $report 2>/dev/null || find . -type d -maxdepth 2 >> $report
    
    echo "" >> $report
    echo "---" >> $report
    echo "" >> $report
done

echo "✅ Análise completa! Veja: $report"
