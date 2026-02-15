#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 LIMPAR E FAZER COMMIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================
# 1. LIMPAR SCRIPTS TEMPORÁRIOS
# ============================================
echo "1️⃣ Limpando scripts temporários..."

cd server/public/dashboard/src

rm -f criar-estrutura-landings.sh
rm -f criar-landings-manual.sh
rm -f gerador-landing.sh

echo "✅ Scripts removidos"
echo ""

cd ../../../..

# ============================================
# 2. VERIFICAR ESTRUTURA
# ============================================
echo "2️⃣ Verificando estrutura..."
echo ""

echo "📂 Landing pages criadas:"
ls -d server/public/dashboard/src/landing*

echo ""

# ============================================
# 3. ADICIONAR AO GIT
# ============================================
echo "3️⃣ Adicionando ao Git..."

git add -A

echo ""
echo "📋 Arquivos modificados:"
git status --short | head -20

echo ""

# ============================================
# 4. COMMIT
# ============================================
read -p "Fazer commit? (s/N): " confirm

if [[ $confirm =~ ^[Ss]$ ]]; then
  git commit -m "🏢 Adicionar landing pages PowerGym e ABC Escola

V1.4 - OP2 Concluída

Landing Pages criadas:
✅ Lava Lava (lavanderia) - cyan/blue
✅ PowerGym (academia) - orange/red  
✅ ABC Escola (educação) - blue/yellow

Estrutura:
- server/public/dashboard/src/landing/ (Lava Lava)
- server/public/dashboard/src/landing-powergym/ (PowerGym)
- server/public/dashboard/src/landing-abc-escola/ (ABC Escola)
- server/public/dashboard/src/landing/shared.js (JS compartilhado)

Cada landing page inclui:
✅ Cores personalizadas por marca
✅ Textos específicos do segmento
✅ IDs únicos (tenant_id, marca_id)
✅ Investimento mínimo ajustado
✅ Google Analytics integrado (G-HGSQJ4R9JC)
✅ Formulário completo com validações
✅ Máscaras (telefone, CPF/CNPJ, capital)
✅ Tracking de eventos (scroll, CTA, form)

Configurações:

Lava Lava:
- Marca ID: 22222222-2222-2222-2222-222222222222
- Cores: Ciano + Azul
- Investimento: R\$ 80.000

PowerGym:
- Marca ID: bc2fbc8b-2edd-4188-a35e-65dc33529fcc
- Cores: Laranja + Vermelho
- Investimento: R\$ 120.000
- Tema: Academia/Fitness

ABC Escola:
- Marca ID: 11111111-1111-1111-1111-111111111111
- Cores: Azul + Amarelo
- Investimento: R\$ 80.000
- Tema: Educação Infantil

shared.js implementado:
✅ Animações (bubbles, header scroll)
✅ Máscaras de campos
✅ Validações CPF/CNPJ
✅ Cálculo de score e categoria
✅ Integração com API
✅ Google Analytics events
✅ Reutilizável entre landing pages

Testes realizados:
✅ Landing pages carregam corretamente
✅ Cores aplicadas corretamente
✅ Formulários submetem dados
✅ Backend recebe leads

URLs:
- http://localhost:4000/dashboard/src/landing/
- http://localhost:4000/dashboard/src/landing-powergym/
- http://localhost:4000/dashboard/src/landing-abc-escola/

Próximo: V1.5 - Notificações (Email + WhatsApp)"

  git tag -a v1.4-landing-pages -m "Landing pages PowerGym e ABC Escola implementadas"
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ COMMIT REALIZADO COM SUCESSO!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📌 Tags disponíveis:"
  git tag
  echo ""
  echo "📊 Últimos commits:"
  git log --oneline --graph -5
  echo ""
else
  echo "❌ Commit cancelado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
