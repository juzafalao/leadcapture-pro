# Análise do Repositório `LeadCapture Pro` - Branch `main`

## 1. Visão Geral
O projeto é um monorepo contendo uma aplicação SaaS multi-tenant para captura e gestão de leads. A arquitetura combina um backend Node.js (Express) com um frontend React (Vite), ambos projetados para funcionar de forma integrada, onde o backend serve tanto a API quanto os arquivos estáticos do frontend.

## 2. Estrutura do Projeto

### Backend (`server/`)
- **Tecnologia:** Node.js com Express.
- **Entry Point:** `server/index.js` (local) e `api/index.js` (Vercel Serverless).
- **Funcionalidades:**
  - API REST para gestão de Leads e Marcas.
  - Integração com Supabase, Twilio e Nodemailer.
  - **Servidor de Arquivos Estáticos:** Configurado para servir o frontend compilado a partir da pasta `dashboard-build` na raiz do projeto.

### Frontend (`frontend/dashboard-admin/`)
- **Tecnologia:** React 19, Vite 7, Tailwind CSS.
- **Gerenciamento de Estado:** `@tanstack/react-query`.
- **Build:** Gera arquivos estáticos na pasta `dist` (padrão do Vite).

### Infraestrutura & Deploy
- **Banco de Dados:** Supabase (PostgreSQL).
- **Hospedagem:** Vercel (configurado via `vercel.json`).
- **Automação:** Scripts Bash em `scripts/` para tarefas auxiliares.

## 3. Descobertas Críticas

### ⚠️ Fluxo de Build e Deploy Manual
Foi identificada uma discrepância crítica no processo de build:
1.  O **Backend** espera que os arquivos do frontend estejam na pasta `dashboard-build` na raiz.
2.  O **Script de Deploy** (`scripts/deploy.sh`) executa o build do frontend, mas os arquivos resultantes ficam em `frontend/dashboard-admin/dist`.
3.  Atualmente, o deploy depende que o desenvolvedor mova manualmente os arquivos de `dist` para `dashboard-build` e faça o commit desses arquivos no repositório (o `.gitignore` permite isso explicitamente).

### ⚠️ Performance em Serverless
A configuração atual (`vercel.json` direcionando tudo para `api/index.js`) faz com que todo o tráfego, incluindo requisições para arquivos estáticos (JS, CSS, Imagens do dashboard), passe pela Serverless Function do Express.
- **Impacto:** Maior latência no carregamento do frontend e possível aumento de custos/uso de invocação de funções na Vercel.
- **Recomendação:** Separar o deploy do frontend para ser servido diretamente pela CDN da Vercel, mantendo apenas a API na Serverless Function.

### ⚠️ Automação
Faltam scripts npm na raiz (`package.json`) para orquestrar a instalação de dependências e o build de todo o monorepo em um único comando.

## 4. Recomendações de Melhoria

### Imediatas (Para estabilizar o fluxo atual)
1.  **Script de Build Unificado:** Criar um script na raiz que instale dependências, faça o build do frontend e mova o conteúdo de `dist` para `dashboard-build` automaticamente.
2.  **Atualizar `scripts/deploy.sh`:** Incluir a etapa de mover os arquivos para garantir que o `dashboard-build` esteja sempre sincronizado com o código fonte antes do commit.

### Longo Prazo (Arquitetura)
1.  **Deploy Separado na Vercel:** Configurar o frontend como um projeto Vercel separado (ou Output Directory configurado) para aproveitar a CDN global e cache, deixando o Express apenas para a API.
2.  **CI/CD:** Implementar GitHub Actions para automatizar o build e deploy, removendo a necessidade de commitar arquivos de build (`dashboard-build`) no repositório.

## 5. Conclusão
A branch `main` contém um sistema funcional e bem estruturado em termos de código. O principal ponto de atenção é o processo de build/deploy manual e propenso a erros de sincronização entre o código do frontend e a pasta `dashboard-build`. A correção recomendada é a automação desse fluxo via scripts.
