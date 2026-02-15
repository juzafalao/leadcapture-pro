#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 TESTAR GOOGLE FORMS - PASSO A PASSO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Limpar processos na porta 4000
echo "1️⃣ Limpando processos antigos..."
kill -9 $(lsof -ti:4000) 2>/dev/null
sleep 2
echo "   ✅ Porta 4000 liberada"
echo ""

# 2. Iniciar backend
echo "2️⃣ Iniciando backend..."
cd server
node index.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    echo "   ✅ Backend rodando (PID: $BACKEND_PID)"
else
    echo "   ❌ Erro ao iniciar backend"
    cat /tmp/backend.log
    exit 1
fi

cd ..
echo ""

# 3. Verificar LocalTunnel
echo "3️⃣ Verificando LocalTunnel..."
if ! command -v lt &> /dev/null; then
    echo "   📦 Instalando LocalTunnel..."
    npm install -g localtunnel
fi

echo "   ✅ LocalTunnel pronto"
echo ""

# 4. Instruções
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PRÓXIMOS PASSOS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Em OUTRO TERMINAL, execute:"
echo "   lt --port 4000"
echo ""
echo "2. Copie a URL que aparecer (ex: https://xxxxx.loca.lt)"
echo ""
echo "3. No Apps Script, troque API_URL para essa URL:"
echo "   API_URL: 'https://xxxxx.loca.lt/api/leads/google-forms'"
echo ""
echo "4. Salve (💾)"
echo ""
echo "5. Execute 'testarIntegracao' no Apps Script"
echo ""
echo "6. Envie o formulário de teste"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend rodando (PID: $BACKEND_PID)"
echo "Para parar: kill $BACKEND_PID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
