#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PREPARAR GOOGLE ANALYTICS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 PASSO A PASSO:"
echo ""
echo "1️⃣ Criar conta Google Analytics 4:"
echo "   https://analytics.google.com/"
echo ""
echo "2️⃣ Criar propriedade:"
echo "   Nome: LeadCapture Pro - Lava Lava"
echo "   Fuso: America/Sao_Paulo"
echo "   Moeda: BRL"
echo ""
echo "3️⃣ Configurar stream de dados:"
echo "   Tipo: Web"
echo "   URL: http://localhost:4000/dashboard/src/landing/"
echo "   (depois trocar para domínio de produção)"
echo ""
echo "4️⃣ Copiar Measurement ID:"
echo "   Formato: G-XXXXXXXXXX"
echo ""

read -p "Você já tem o Measurement ID? (s/N): " tem_id

if [[ $tem_id =~ ^[Ss]$ ]]; then
  read -p "Cole o Measurement ID (G-XXXXXXXXXX): " GA_ID
  
  if [[ ! $GA_ID =~ ^G- ]]; then
    echo "❌ ID inválido! Deve começar com 'G-'"
    exit 1
  fi
  
  echo ""
  echo "✅ ID salvo: $GA_ID"
  echo ""
  
  # Salvar no .env
  cd server
  if ! grep -q "GOOGLE_ANALYTICS_ID" .env; then
    echo "" >> .env
    echo "# Google Analytics" >> .env
    echo "GOOGLE_ANALYTICS_ID=$GA_ID" >> .env
    echo "✅ Adicionado ao .env"
  else
    echo "⚠️  GOOGLE_ANALYTICS_ID já existe no .env"
  fi
  
  cd ..
  
  echo ""
  echo "🎯 Próximo: Adicionar tracking code na landing page"
  echo ""
  echo "Executar:"
  echo "  npm run add-google-analytics"
  echo ""
else
  echo ""
  echo "📝 Crie a conta primeiro:"
  echo "   https://analytics.google.com/"
  echo ""
  echo "Depois rode este script novamente!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
