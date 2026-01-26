#!/bin/bash
# ============================================================
# SCRIPT DE ATUALIZAÇÃO DO KANBAN - 25/01/2026
# LeadCapture Pro
# ============================================================

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     LEADCAPTURE PRO - ATUALIZAÇÃO DO KANBAN              ║"
echo "║     Data: 25/01/2026 (Sábado)                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Verificar se GitHub CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI não está instalado."
    echo "   Instale com: brew install gh"
    echo "   Depois autentique: gh auth login"
    echo ""
    echo "📋 Alternativamente, crie as issues manualmente em:"
    echo "   https://github.com/juzafalao/leadcapture-pro/issues/new"
    exit 1
fi

# Navegar para o projeto
cd ~/Projetos/leadcapture-pro || { echo "❌ Pasta do projeto não encontrada"; exit 1; }

echo "📋 O que deseja fazer?"
echo ""
echo "  1) Criar issues das TAREFAS CONCLUÍDAS HOJE (para registro)"
echo "  2) Criar issues das NOVAS TAREFAS (backlog)"
echo "  3) Criar TODAS as issues (concluídas + novas)"
echo "  4) Ver lista de issues sem criar"
echo "  5) Sair"
echo ""
read -p "Escolha [1-5]: " OPCAO

# ============================================================
# TAREFAS CONCLUÍDAS HOJE - 25/01/2026
# ============================================================
criar_tarefas_concluidas() {
    echo ""
    echo "✅ Criando issues das tarefas CONCLUÍDAS hoje..."
    echo ""

    # Tarefa 1: Landing Page
    echo "📝 Criando: Landing Page..."
    gh issue create \
        --title "✅ Landing Page para captação de leads via website" \
        --body "## Descrição
Página web profissional para captar leads interessados em franquias.

## Entregáveis
- [x] Formulário com campos: Nome, Email, WhatsApp, Capital, Região, Mensagem
- [x] Design profissional combinando com Dashboard
- [x] Máscara de telefone automática
- [x] Integração com webhook do n8n
- [x] Mensagem de sucesso após envio
- [x] Responsivo (mobile e desktop)
- [x] Badges de confiança

## Arquivos
- \`landing-page/index.html\`
- \`landing-page/logo.jpg\`

## Status: ✅ CONCLUÍDO em 25/01/2026" \
        --label "feature,done"

    # Tarefa 2: Filtros do Dashboard
    echo "📝 Criando: Filtros do Dashboard..."
    gh issue create \
        --title "✅ Filtros avançados no Dashboard" \
        --body "## Descrição
Sistema de filtros para facilitar a busca e análise de leads.

## Entregáveis
- [x] Filtro por Fonte (WhatsApp, Instagram, Website, etc)
- [x] Filtro por Categoria (HOT, WARM, COLD)
- [x] Filtro por Período (Hoje, 7 dias, 30 dias)
- [x] Busca por nome, email ou telefone
- [x] Botão Limpar Filtros
- [x] Contador de resultados filtrados

## Status: ✅ CONCLUÍDO em 25/01/2026" \
        --label "feature,done"

    # Tarefa 3: Gráficos
    echo "📝 Criando: Gráficos do Dashboard..."
    gh issue create \
        --title "✅ Gráficos de métricas no Dashboard" \
        --body "## Descrição
Visualização gráfica dos dados de leads.

## Entregáveis
- [x] Gráfico de barras: Leads nos últimos 7 dias
- [x] Gráfico de barras: Leads por Fonte
- [x] Gráfico de pizza: Leads por Categoria
- [x] Botão Mostrar/Ocultar gráficos
- [x] Gráficos responsivos

## Status: ✅ CONCLUÍDO em 25/01/2026" \
        --label "feature,done"

    # Tarefa 4: Manual de Inicialização
    echo "📝 Criando: Manual de Inicialização..."
    gh issue create \
        --title "✅ Manual de Inicialização Diária v1.1" \
        --body "## Descrição
Documentação completa para iniciar o ambiente de desenvolvimento.

## Entregáveis
- [x] Checklist rápido de inicialização
- [x] Passo a passo completo
- [x] Verificação de serviços
- [x] Instruções do script atualizar_kanban.sh
- [x] Testes rápidos
- [x] Encerramento do dia
- [x] Solução de problemas
- [x] Credenciais de acesso

## Status: ✅ CONCLUÍDO em 25/01/2026" \
        --label "docs,done"

    # Tarefa 5: Documento Visão v2.0
    echo "📝 Criando: Documento Visão v2.0..."
    gh issue create \
        --title "✅ Documento de Visão v2.0" \
        --body "## Descrição
Planejamento completo das funcionalidades futuras.

## Entregáveis
- [x] Visão geral da v2.0
- [x] Aplicativo Mobile (PWA)
- [x] Integração com CRMs (Pipedrive, HubSpot, RD Station)
- [x] Gestão de Leads Utilizados (ciclo de vida)
- [x] Novas funcionalidades planejadas
- [x] Arquitetura técnica v2.0
- [x] Roadmap de implementação
- [x] Estimativas e recursos

## Status: ✅ CONCLUÍDO em 25/01/2026" \
        --label "docs,done"

    # Tarefa 6: Checklist do Projeto
    echo "📝 Criando: Checklist do Projeto..."
    gh issue create \
        --title "✅ Checklist Completo do Projeto" \
        --body "## Descrição
Documento com todas as tarefas do projeto e seus status.

## Entregáveis
- [x] Resumo executivo (métricas)
- [x] Fase 1: Fundação (100%)
- [x] Fase 2: Integrações (bloqueada)
- [x] Fase 3: IA (95%)
- [x] Fase 4: Dashboard (100%)
- [x] Documentação
- [x] Próximas tarefas priorizadas

## Status: ✅ CONCLUÍDO em 25/01/2026" \
        --label "docs,done"

    # Tarefa 7: Script do Kanban
    echo "📝 Criando: Script do Kanban..."
    gh issue create \
        --title "✅ Script de atualização Git + Kanban" \
        --body "## Descrição
Script bash para automatizar commits e atualização do Kanban.

## Entregáveis
- [x] Menu interativo
- [x] Ver status do Git
- [x] Fazer commit + push
- [x] Abrir Kanban no navegador
- [x] Ver próximas tarefas
- [x] Fluxo completo automatizado

## Arquivo: \`atualizar_kanban.sh\`

## Status: ✅ CONCLUÍDO em 25/01/2026" \
        --label "feature,done"

    # Tarefa 8: Correção API Key
    echo "📝 Criando: Correção API Key..."
    gh issue create \
        --title "✅ Correção do erro Invalid API Key (Supabase)" \
        --body "## Descrição
Atualização da chave de API do Supabase após mudança de formato.

## Problema
- Supabase mudou formato das chaves
- Erro: Invalid API key

## Solução
- Atualizado para nova chave \`sb_publishable_...\`
- Dashboard voltou a funcionar

## Status: ✅ CONCLUÍDO em 25/01/2026" \
        --label "bug,done"

    echo ""
    echo "✅ Tarefas concluídas criadas!"
}

# ============================================================
# NOVAS TAREFAS PARA O BACKLOG
# ============================================================
criar_novas_tarefas() {
    echo ""
    echo "📋 Criando issues das NOVAS TAREFAS para o backlog..."
    echo ""

    # BLOQUEADAS
    echo "🚫 Criando tarefas BLOQUEADAS..."
    
    gh issue create \
        --title "🚫 [BLOQUEADO] Criar conta Meta Business" \
        --body "## Descrição
Criar conta no Meta Business Suite para acessar APIs do WhatsApp e Instagram.

## Status
⚠️ **BLOQUEADO**: Aguardando verificação de identidade (24-48h)

## Dependências
- Nenhuma

## Bloqueia
- Configurar WhatsApp Business API
- Conectar Instagram ao Facebook

## Última tentativa: 25/01/2026" \
        --label "blocked,high-priority"

    gh issue create \
        --title "🚫 [BLOQUEADO] Configurar WhatsApp Business API" \
        --body "## Descrição
Integrar WhatsApp Business API para receber mensagens de leads.

## Status
⚠️ **BLOQUEADO**: Depende da verificação do Meta Business

## Tarefas
- [ ] Criar App no Meta Developers
- [ ] Configurar WhatsApp Business API
- [ ] Adicionar número (17) 99714-2901
- [ ] Obter token de acesso
- [ ] Configurar webhook
- [ ] Criar workflow no n8n
- [ ] Testar recebimento de mensagens

## Documentação
Guia completo em: \`Guia_WhatsApp_Business.docx\`" \
        --label "blocked,feature"

    gh issue create \
        --title "🚫 [BLOQUEADO] Configurar Instagram Graph API" \
        --body "## Descrição
Integrar Instagram Graph API para receber DMs de leads.

## Status
⚠️ **BLOQUEADO**: Depende da verificação do Meta Business

## Pré-requisitos concluídos
- [x] Conta Instagram Business criada
- [x] Conta convertida para profissional

## Tarefas pendentes
- [ ] Conectar Instagram ao Facebook
- [ ] Adicionar Instagram ao App do Meta
- [ ] Configurar webhook
- [ ] Criar workflow no n8n

## Documentação
Guia completo em: \`Guia_Facebook_Instagram.docx\`" \
        --label "blocked,feature"

    # PREPARAÇÃO V2.0
    echo "📅 Criando tarefas de PREPARAÇÃO V2.0..."

    gh issue create \
        --title "🗃️ [V2.0] Adicionar campos de gestão no banco de dados" \
        --body "## Descrição
Preparar banco de dados para funcionalidades da v2.0.

## Novos campos na tabela \`leads\`
- \`status_atendimento\`: novo, em_contato, proposta, convertido, perdido, nurturing
- \`vendedor_id\`: UUID do vendedor responsável
- \`data_ultimo_contato\`: timestamp
- \`data_proximo_contato\`: timestamp
- \`motivo_perda\`: sem_capital, concorrente, timing, preco, outro

## Tempo estimado: 30 minutos" \
        --label "database,v2.0"

    gh issue create \
        --title "✨ [V2.0] Implementar histórico de interações" \
        --body "## Descrição
Registrar todas as interações com cada lead.

## Funcionalidades
- Registrar ligações, emails, WhatsApp, reuniões
- Anotar resultado de cada contato
- Visualizar timeline no detalhe do lead
- Filtrar leads por último contato

## Tempo estimado: 2 horas" \
        --label "feature,v2.0"

    gh issue create \
        --title "✨ [V2.0] Criar tela de detalhes do lead" \
        --body "## Descrição
Página individual com todas as informações do lead.

## Funcionalidades
- Todas as informações do lead
- Histórico de interações
- Botões de ação rápida (ligar, WhatsApp, email)
- Alterar status
- Atribuir vendedor
- Adicionar notas

## Tempo estimado: 1.5 horas" \
        --label "feature,v2.0"

    gh issue create \
        --title "📱 [V2.0] Transformar Dashboard em PWA" \
        --body "## Descrição
Converter o Dashboard React em Progressive Web App para acesso mobile.

## Funcionalidades
- Instalável no celular
- Funciona offline (dados em cache)
- Notificações push (Android)
- Ícone na tela inicial

## Arquivos necessários
- manifest.json
- service-worker.js
- Ícones em vários tamanhos

## Tempo estimado: 3 horas" \
        --label "feature,v2.0,mobile"

    gh issue create \
        --title "🔗 [V2.0] Integração com Pipedrive CRM" \
        --body "## Descrição
Enviar leads qualificados automaticamente para o Pipedrive.

## Funcionalidades
- Configuração de API Key
- Mapeamento de campos
- Envio automático ou manual
- Sincronização de status

## Prioridade: Alta (CRM mais simples de integrar)

## Tempo estimado: 2 horas" \
        --label "feature,v2.0,integration"

    # MELHORIAS IMEDIATAS
    echo "✨ Criando tarefas de MELHORIAS..."

    gh issue create \
        --title "📧 Notificação por email para leads HOT" \
        --body "## Descrição
Enviar email automático quando um lead HOT chegar.

## Funcionalidades
- Configurar serviço de email (Resend ou SendGrid)
- Template de email profissional
- Incluir dados do lead no email
- Configurar destinatário

## Tempo estimado: 1 hora" \
        --label "feature,enhancement"

    gh issue create \
        --title "📝 Atualizar README do GitHub" \
        --body "## Descrição
Criar README profissional para o repositório.

## Conteúdo
- Descrição do projeto
- Screenshots
- Tecnologias utilizadas
- Como instalar
- Como usar
- Roadmap
- Contribuição
- Licença

## Tempo estimado: 30 minutos" \
        --label "docs,enhancement"

    gh issue create \
        --title "🧪 Criar suite de testes" \
        --body "## Descrição
Documentar e automatizar casos de teste.

## Casos de teste
- Lead via Landing Page → Dashboard
- Lead via webhook direto → Dashboard
- Cálculo de score correto
- Categorização HOT/WARM/COLD
- Filtros funcionando
- Realtime updates

## Tempo estimado: 1 hora" \
        --label "testing,enhancement"

    # POC
    echo "🧪 Criando tarefas de POC..."

    gh issue create \
        --title "🧪 Executar POC de captação de leads" \
        --body "## Descrição
Testar o sistema com leads reais (controlados).

## Plano
1. Publicar post de pesquisa no Instagram
2. Criar Stories com quiz
3. Pedir para 5-10 amigos enviarem mensagens
4. Analisar resultados no Dashboard

## Métricas de sucesso
- Mínimo 10 leads captados
- Score calculado corretamente
- Categorização correta
- Dashboard atualizado em tempo real

## Tempo: 1 semana" \
        --label "testing,poc"

    echo ""
    echo "✅ Novas tarefas criadas no backlog!"
}

# ============================================================
# LISTAR ISSUES
# ============================================================
listar_issues() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "📋 TAREFAS CONCLUÍDAS HOJE (25/01/2026)"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "1. ✅ Landing Page para captação de leads via website"
    echo "2. ✅ Filtros avançados no Dashboard"
    echo "3. ✅ Gráficos de métricas no Dashboard"
    echo "4. ✅ Manual de Inicialização Diária v1.1"
    echo "5. ✅ Documento de Visão v2.0"
    echo "6. ✅ Checklist Completo do Projeto"
    echo "7. ✅ Script de atualização Git + Kanban"
    echo "8. ✅ Correção do erro Invalid API Key"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "🚫 TAREFAS BLOQUEADAS"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "1. 🚫 Criar conta Meta Business (aguardando verificação)"
    echo "2. 🚫 Configurar WhatsApp Business API"
    echo "3. 🚫 Configurar Instagram Graph API"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "📋 NOVAS TAREFAS (BACKLOG)"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "V2.0:"
    echo "1. 🗃️ Adicionar campos de gestão no banco de dados"
    echo "2. ✨ Implementar histórico de interações"
    echo "3. ✨ Criar tela de detalhes do lead"
    echo "4. 📱 Transformar Dashboard em PWA"
    echo "5. 🔗 Integração com Pipedrive CRM"
    echo ""
    echo "Melhorias:"
    echo "6. 📧 Notificação por email para leads HOT"
    echo "7. 📝 Atualizar README do GitHub"
    echo "8. 🧪 Criar suite de testes"
    echo ""
    echo "POC:"
    echo "9. 🧪 Executar POC de captação de leads"
    echo ""
}

# ============================================================
# EXECUTAR OPÇÃO ESCOLHIDA
# ============================================================
case $OPCAO in
    1)
        criar_tarefas_concluidas
        ;;
    2)
        criar_novas_tarefas
        ;;
    3)
        criar_tarefas_concluidas
        criar_novas_tarefas
        ;;
    4)
        listar_issues
        ;;
    5)
        echo "👋 Até mais!"
        exit 0
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📌 PRÓXIMOS PASSOS:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. Acesse o Kanban: https://github.com/juzafalao/leadcapture-pro/projects"
echo "2. Mova as issues concluídas para a coluna 'Concluído'"
echo "3. Organize as novas issues nas colunas apropriadas"
echo ""
echo "🔗 Abrindo o Kanban no navegador..."
open "https://github.com/juzafalao/leadcapture-pro/projects" 2>/dev/null

echo ""
echo "✅ Script finalizado!"
