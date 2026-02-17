#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 DEBUG COMPLETO - GOOGLE FORMS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Verificar backend
echo "1️⃣ VERIFICANDO BACKEND..."
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "   ✅ Backend está rodando na porta 4000"
else
    echo "   ❌ Backend NÃO está rodando"
    echo ""
    echo "   Inicie o backend primeiro:"
    echo "   cd server && node index.js"
    exit 1
fi

echo ""

# 2. Testar endpoint diretamente
echo "2️⃣ TESTANDO ENDPOINT DIRETAMENTE..."
echo ""
echo "   Enviando lead de teste..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:4000/api/leads/google-forms \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "81cac3a4-caa3-43b2-be4d-d16557d7ef88",
    "marca_id": "22222222-2222-2222-2222-222222222222",
    "nome": "Debug Test Direct",
    "email": "debug.direct@test.com",
    "telefone": "11999999999",
    "capital": "100000",
    "cidade": "São Paulo",
    "estado": "SP",
    "mensagem": "Teste direto do endpoint"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo ""
echo "   Status HTTP: $HTTP_CODE"
echo "   Resposta: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Endpoint funcionando!"
    
    # Extrair lead ID
    LEAD_ID=$(echo "$BODY" | grep -o '"leadId":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$LEAD_ID" ]; then
        echo "   ✅ Lead ID: $LEAD_ID"
        echo ""
        echo "   Verificar no Supabase:"
        echo "   https://app.supabase.com/project/krcybmownrpfjvqhacup/editor"
        echo "   Tabela: leads"
        echo "   Filtrar: id = $LEAD_ID"
    fi
else
    echo "   ❌ Endpoint com erro!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣ PRÓXIMOS PASSOS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Se o teste acima funcionou (✅), o problema está no Apps Script"
echo ""
echo "Para verificar Apps Script:"
echo "   1. Abra: https://script.google.com/"
echo "   2. Projeto: LeadCapture - Lava Lava"
echo "   3. Menu lateral: Execuções"
echo "   4. Veja os logs das últimas execuções"
echo ""
echo "Para ver logs em tempo real, deixe este terminal aberto:"
echo "   tail -f no terminal do backend"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
