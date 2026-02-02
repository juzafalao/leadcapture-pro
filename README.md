---

# 🚀 LeadCapture Pro - AI Powered SaaS

**LeadCapture Pro** é uma solução corporativa de alta performance para captura, qualificação inteligente e gestão de leads em ecossistemas multi-tenant. 

Desenvolvido para empresas que necessitam captar Leads precisão cirúrgica na seleção de novos clientes.

---

## 📊 Status do Projeto

🟢 **Demo Ready** — Versão 4.4 (MVP Estável)

---

## 🌟 Diferenciais Estratégicos

* **Qualificação Inteligente (IA):** Integração nativa com GPT-4o-mini para analisar o perfil financeiro e o interesse do lead em tempo real.
* **Segurança Multi-tenant:** Isolamento completo de dados via **Row Level Security (RLS)** no Supabase, garantindo privacidade entre diferentes marcas e franqueadoras.
* **Arquitetura Event-Driven:** Webhooks otimizados com `responseNode` para garantir que o frontend receba confirmação imediata sem latência.
* **Automação de Engajamento:** Notificações automáticas via WhatsApp (Twilio) para leads classificados como **HOT** pela inteligência artificial.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| --- | --- |
| **Automação** | n8n (Orquestração de fluxos) |
| **Banco de Dados** | Supabase (PostgreSQL + RLS) |
| **Frontend** | React + Vite + Tailwind CSS |
| **Inteligência Artificial** | OpenAI GPT-4o-mini |
| **Comunicação** | Twilio (WhatsApp API) |

---

---

## 📁 Estrutura do Projeto

```text
/leadcapture-pro
├── /web              # Dashboard Administrativo (React/Vite)
├── /n8n/workflows    # Definições de fluxos JSON (v3.2 e v4.2)
├── /supabase         # Scripts de banco, políticas de RLS e funções SQL
└── /docker           # Configuração de infraestrutura para n8n local

```

---

## 🚀 Quick Start

### 1. Infraestrutura e Automação (n8n)

Certifique-se de importar o workflow mais recente para garantir a resposta correta ao Webhook.

```bash
cd docker
docker compose up -d

```

### 2. Dashboard e Interface

Configure as variáveis de ambiente no arquivo `.env` antes de iniciar.

```bash
cd web
npm install
npm run dev

```

### 3. Variáveis de Ambiente Necessárias

* `VITE_SUPABASE_URL`: Endpoint do seu projeto Supabase.
* `VITE_SUPABASE_ANON_KEY`: Chave de acesso anônima.

---

## 🔒 Segurança e Privacidade

O sistema utiliza políticas de **Row Level Security (RLS)**, onde cada consulta ao banco de dados é filtrada automaticamente pelo `tenant_id` do usuário autenticado. Isso permite que múltiplas marcas coexistam na mesma infraestrutura com 100% de isolamento de dados.

---

## 📝 Licença

Proprietary - All rights reserved to **Juliana Zafalao**

---
