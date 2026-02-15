#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 INTEGRAÇÃO GOOGLE FORMS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Você já tem um Google Form criado?"
read -p "(s/N): " tem_form

if [[ $tem_form =~ ^[Ss]$ ]]; then
  echo ""
  echo "✅ Ótimo! Vamos integrar o formulário existente"
  echo ""
  
  read -p "Cole a URL do Google Form: " form_url
  
  echo ""
  echo "📋 Quais campos existem no formulário?"
  echo "   Digite os nomes dos campos (um por linha)"
  echo "   Pressione ENTER em branco quando terminar"
  echo ""
  
  campos=()
  while true; do
    read -p "Campo: " campo
    if [ -z "$campo" ]; then
      break
    fi
    campos+=("$campo")
  done
  
  echo ""
  echo "✅ Campos identificados:"
  for campo in "${campos[@]}"; do
    echo "   - $campo"
  done
  
else
  echo ""
  echo "📝 Vamos criar um Google Form modelo"
  echo ""
  
  echo "Campos sugeridos:"
  echo "   1. Nome completo"
  echo "   2. E-mail"
  echo "   3. WhatsApp"
  echo "   4. CPF ou CNPJ (opcional)"
  echo "   5. Capital disponível"
  echo "   6. Cidade"
  echo "   7. Estado"
  echo "   8. Mensagem (opcional)"
  echo ""
  
  form_url="CRIAR_NOVO"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CONFIGURAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Para qual marca é este formulário?"
echo "   1) Lava Lava"
echo "   2) PowerGym"
echo "   3) ABC Escola"
echo ""
read -p "Opção (1-3): " marca_opcao

case $marca_opcao in
  1)
    MARCA_NOME="Lava Lava"
    MARCA_ID="22222222-2222-2222-2222-222222222222"
    ;;
  2)
    MARCA_NOME="PowerGym"
    MARCA_ID="bc2fbc8b-2edd-4188-a35e-65dc33529fcc"
    ;;
  3)
    MARCA_NOME="ABC Escola Infantil"
    MARCA_ID="11111111-1111-1111-1111-111111111111"
    ;;
  *)
    MARCA_NOME="Lava Lava"
    MARCA_ID="22222222-2222-2222-2222-222222222222"
    ;;
esac

echo ""
echo "✅ Marca selecionada: $MARCA_NOME"
echo "   ID: $MARCA_ID"
echo ""

# Salvar configuração
cat > google-forms-config.json << CONFIG
{
  "form_url": "$form_url",
  "marca_nome": "$MARCA_NOME",
  "marca_id": "$MARCA_ID",
  "tenant_id": "81cac3a4-caa3-43b2-be4d-d16557d7ef88",
  "fonte": "google-forms",
  "campos": $(printf '%s\n' "${campos[@]}" | jq -R . | jq -s .)
}
CONFIG

echo "✅ Configuração salva em: google-forms-config.json"
echo ""
echo "━━━━━━━━━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━"
