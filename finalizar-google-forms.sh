#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ FINALIZAR INTEGRAÇÃO GOOGLE FORMS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se backend está rodando
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Backend ainda está rodando"
    read -p "Parar backend? (s/N): " parar
    if [[ $parar =~ ^[Ss]$ ]]; then
        kill -9 $(lsof -ti:4000)
        echo "✅ Backend parado"
    fi
fi

echo ""

# Verificar leads no Supabase
echo "📊 Verificando leads do Google Forms no Supabase..."
echo ""
echo "Acesse: https://app.supabase.com/project/krcybmownrpfjvqhacup/editor"
echo "Tabela: leads"
echo "Filtro: fonte = 'google-forms'"
echo ""
read -p "Viu os leads no Supabase? (s/N): " viu_leads

if [[ ! $viu_leads =~ ^[Ss]$ ]]; then
    echo "⚠️  Verifique os leads antes de fazer commit!"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 FAZER COMMIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Adicionar tudo
git add -A

# Status
echo "📋 Arquivos modificados:"
git status --short | head -20

echo ""
read -p "Fazer commit? (s/N): " confirmar

if [[ $confirmar =~ ^[Ss]$ ]]; then
  git commit -m "📝 Integração Google Forms completa e testada

V1.8 - Google Forms Integration

Backend:
✅ Endpoint POST /api/leads/google-forms
✅ Endpoint GET /api/leads/google-forms/health
✅ Mapeamento de campos do Google Forms
✅ Validações completas
✅ Cálculo de score e categoria
✅ Detecção de leads duplicados (24h)
✅ Suporte a documento opcional (CPF/CNPJ)
✅ Logs detalhados

Google Apps Script:
✅ Código completo (google-forms-apps-script.js)
✅ Configuração automática
✅ Função onFormSubmit (disparada automaticamente)
✅ Função testarIntegracao (teste manual)
✅ Função configurarGatilho (configuração automática)
✅ Envio de email em caso de erro
✅ Logs detalhados

Documentação:
✅ GOOGLE_FORMS_SETUP.md (guia completo)
✅ google-forms-config.json (configuração)
✅ Scripts auxiliares

Testes realizados:
✅ Teste manual (testarIntegracao) - PASSOU
✅ Gatilho configurado
✅ Formulário enviado - PASSOU
✅ Lead apareceu no Supabase
✅ Logs sem erros

Configuração:
- Marca: Lava Lava
- Marca ID: 22222222-2222-2222-2222-222222222222
- Tenant ID: 81cac3a4-caa3-43b2-be4d-d16557d7ef88
- Fonte: google-forms
- API URL: (LocalTunnel temporário)

Funcionalidades:
✅ Recebe dados do Google Forms
✅ Mapeia campos automaticamente
✅ Valida dados (nome, email, telefone)
✅ Calcula score baseado em capital
✅ Detecta duplicados
✅ Salva no Supabase
✅ Retorna sucesso/erro para o Apps Script

Deduplicação:
- Verifica por email + marca_id
- Se mesmo email em < 24h: retorna duplicado
- Evita spam e dados duplicados

Próximo: Deploy para produção (trocar localhost por URL real)"

  git tag -a v1.8-google-forms -m "Integração Google Forms completa"
  
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
echo "🎉 INTEGRAÇÃO GOOGLE FORMS CONCLUÍDA!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ O QUE FOI FEITO:"
echo "   Backend com endpoint Google Forms"
echo "   Apps Script configurado e testado"
echo "   Gatilho (trigger) configurado"
echo "   Lead de teste salvo no Supabase"
echo "   Documentação completa"
echo ""

echo "📊 PROGRESSO GERAL:"
echo ""
echo "V1.0 - Base funcional          ████████████████████ 100%"
echo "V1.1 - Código limpo            ████████████████████ 100%"
echo "V1.2 - CPF/CNPJ opcional       ████████████████████ 100%"
echo "V1.3 - Google Analytics        ████████████████████ 100%"
echo "V1.4 - Landing pages extras    ████████████████████ 100%"
echo "V1.5 - Notificações            ░░░░░░░░░░░░░░░░░░░░   0%"
echo "V1.6 - Integração Admin        ░░░░░░░░░░░░░░░░░░░░   0%"
echo "V1.7 - Deploy/Produção         ░░░░░░░░░░░░░░░░░░░░   0%"
echo "V1.8 - Google Forms            ████████████████████ 100%"
echo ""
echo "TOTAL: ██████████░░░░░░░░░░  50%"
echo ""

echo "🎯 PRÓXIMOS PASSOS:"
echo ""
echo "1️⃣  V1.5 - Notificações"
echo "    📧 Email quando chega lead"
echo "    💬 WhatsApp (Twilio)"
echo ""
echo "2️⃣  V1.6 - Integração Admin"
echo "    📊 Ver leads no admin"
echo "    🔍 Filtros avançados"
echo ""
echo "3️⃣  V1.7 - Deploy/Produção"
echo "    🌐 Colocar sistema no ar"
echo "    🔒 SSL/HTTPS"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
