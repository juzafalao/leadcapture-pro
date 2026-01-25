#!/bin/bash
# ============================================================
# SCRIPT DE ATUALIZAÇÃO DO KANBAN - LEADCAPTURE PRO
# Execute este script após cada tarefa finalizada
# ============================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     LEADCAPTURE PRO - ATUALIZAÇÃO GIT + KANBAN          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# CONFIGURAÇÕES
# ============================================================
PROJETO_DIR=~/Projetos/leadcapture-pro
REPO_URL="https://github.com/juzafalao/leadcapture-pro"

# ============================================================
# FUNÇÕES
# ============================================================

# Função para verificar se está no diretório correto
verificar_diretorio() {
    if [ ! -d "$PROJETO_DIR" ]; then
        echo -e "${RED}❌ Diretório do projeto não encontrado!${NC}"
        echo "   Esperado: $PROJETO_DIR"
        exit 1
    fi
    cd "$PROJETO_DIR"
    echo -e "${GREEN}✅ Diretório do projeto OK${NC}"
}

# Função para verificar status do Git
verificar_git_status() {
    echo ""
    echo -e "${YELLOW}📋 Status do Git:${NC}"
    git status --short
    echo ""
}

# Função para fazer commit
fazer_commit() {
    echo -e "${YELLOW}📝 Digite a mensagem do commit:${NC}"
    echo "   (Use prefixos: 🎨 UI, 🐛 Fix, ✨ Feature, 📝 Docs, 🔧 Config)"
    read -p "   > " COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        echo -e "${RED}❌ Mensagem vazia. Commit cancelado.${NC}"
        return 1
    fi
    
    git add .
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ Commit realizado!${NC}"
}

# Função para fazer push
fazer_push() {
    echo ""
    echo -e "${YELLOW}🚀 Enviando para GitHub...${NC}"
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Push realizado com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro no push. Verifique sua conexão.${NC}"
    fi
}

# Função para abrir o Kanban no navegador
abrir_kanban() {
    echo ""
    echo -e "${YELLOW}🔗 Abrindo Kanban no navegador...${NC}"
    open "$REPO_URL/projects" 2>/dev/null || xdg-open "$REPO_URL/projects" 2>/dev/null
    echo -e "${GREEN}✅ Kanban aberto!${NC}"
    echo ""
    echo -e "${BLUE}📌 LEMBRETE: Mova o card da tarefa para 'Concluído'${NC}"
}

# Função para mostrar próximas tarefas
mostrar_proximas_tarefas() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              PRÓXIMAS TAREFAS (SEQUÊNCIA A)              ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "  A1. [ ] Criar Landing Page com formulário"
    echo "  A2. [ ] Adicionar filtros ao Dashboard"
    echo "  A3. [ ] Criar tela de detalhes do lead"
    echo "  A4. [ ] Adicionar gráficos de métricas"
    echo "  A5. [ ] Criar notificação por email"
    echo ""
    echo -e "${YELLOW}🚫 TAREFAS BLOQUEADAS:${NC}"
    echo "  • Configurar WhatsApp Business API (aguardando Meta)"
    echo "  • Conectar Instagram ao Facebook (aguardando Meta)"
    echo ""
}

# ============================================================
# MENU PRINCIPAL
# ============================================================
mostrar_menu() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo "  O que você deseja fazer?"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  1) Ver status do Git"
    echo "  2) Fazer commit + push (tarefa concluída)"
    echo "  3) Abrir Kanban no navegador"
    echo "  4) Ver próximas tarefas"
    echo "  5) Commit + Push + Abrir Kanban (completo)"
    echo "  6) Sair"
    echo ""
    read -p "  Escolha uma opção [1-6]: " OPCAO
    
    case $OPCAO in
        1)
            verificar_git_status
            ;;
        2)
            verificar_git_status
            fazer_commit
            fazer_push
            ;;
        3)
            abrir_kanban
            ;;
        4)
            mostrar_proximas_tarefas
            ;;
        5)
            verificar_git_status
            fazer_commit
            fazer_push
            abrir_kanban
            mostrar_proximas_tarefas
            ;;
        6)
            echo -e "${GREEN}👋 Até mais!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Opção inválida${NC}"
            ;;
    esac
}

# ============================================================
# EXECUÇÃO
# ============================================================
verificar_diretorio

# Loop do menu
while true; do
    mostrar_menu
    echo ""
    read -p "Pressione ENTER para continuar ou 'q' para sair: " CONTINUAR
    if [ "$CONTINUAR" = "q" ]; then
        echo -e "${GREEN}👋 Até mais!${NC}"
        exit 0
    fi
done
