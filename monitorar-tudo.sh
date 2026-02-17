#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 MONITORAMENTO GOOGLE FORMS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ CHECKLIST:"
echo ""

# 1. Backend
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "   ✅ Backend rodando (porta 4000)"
else
    echo "   ❌ Backend NÃO está rodando"
    echo "      Inicie: cd server && node index-debug.js"
fi

echo ""

# 2. LocalTunnel
TUNNEL_PID=$(ps aux | grep "lt --port 4000" | grep -v grep | awk '{print $2}')
if [ -n "$TUNNEL_PID" ]; then
    echo "   ✅ LocalTunnel rodando (PID: $TUNNEL_PID)"
    echo ""
    echo "   Para ver a URL, vá no terminal do LocalTunnel"
else
    echo "   ❌ LocalTunnel NÃO está rodando"
    echo "      Inicie: lt --port 4000"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PRÓXIMOS PASSOS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Verificar URL do LocalTunnel"
echo "2. Trocar URL no Apps Script (CONFIG.API_URL)"
echo "3. Salvar Apps Script"
echo "4. Enviar formulário de teste"
echo "5. Ver logs no terminal do backend"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
