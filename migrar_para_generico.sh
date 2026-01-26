#!/bin/bash
# ============================================================
# LEADCAPTURE PRO - MIGRAÇÃO PARA VERSÃO GENÉRICA (MULTI-TENANT)
# Data: 26/01/2026
# ============================================================
# Este script prepara toda a estrutura para a versão genérica
# Execute com: ./migrar_para_generico.sh
# ============================================================

set -e  # Para se houver erro

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║     🚀 LEADCAPTURE PRO - MIGRAÇÃO PARA VERSÃO GENÉRICA 🚀       ║"
echo "║                                                                  ║"
echo "║     De: MVP Franqueadora                                         ║"
echo "║     Para: SaaS Multi-Tenant Genérico                            ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

PROJETO_DIR=~/Projetos/leadcapture-pro

# Verificar se está no diretório correto
if [ ! -d "$PROJETO_DIR" ]; then
    echo "❌ Diretório do projeto não encontrado: $PROJETO_DIR"
    exit 1
fi

cd "$PROJETO_DIR"
echo "📂 Diretório: $PROJETO_DIR"
echo ""

# ============================================================
# PASSO 1: CRIAR ESTRUTURA DE PASTAS
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 PASSO 1: Criando estrutura de pastas..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p supabase/migrations
mkdir -p docs
mkdir -p scripts
mkdir -p templates/clients
mkdir -p docker/evolution-api

echo "✅ Estrutura de pastas criada"
echo ""

# ============================================================
# PASSO 2: CRIAR ARQUIVO SQL DE MIGRAÇÃO
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗃️ PASSO 2: Criando SQL de migração do banco de dados..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > supabase/migrations/001_multi_tenant_generic.sql << 'SQLEOF'
-- ============================================================
-- LEADCAPTURE PRO - MIGRAÇÃO MULTI-TENANT GENÉRICA
-- Versão 1.0 Final (inclui features da v2.0)
-- Data: 26/01/2026
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: tenants (Clientes/Organizações)
-- Cada empresa que usa o LeadCapture Pro
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,  -- URL amigável: leadcapturepro.com/c/minha-empresa
    
    -- Personalização Visual
    logo_url TEXT,
    primary_color TEXT DEFAULT '#f97316',  -- Laranja padrão
    secondary_color TEXT DEFAULT '#3b82f6', -- Azul padrão
    
    -- Configurações de IA
    ai_instructions TEXT,  -- Prompt personalizado para qualificação
    ai_model TEXT DEFAULT 'gpt-4o-mini',
    
    -- Configurações de Negócio
    business_type TEXT,  -- franquia, imobiliaria, educacao, etc
    qualification_criteria JSONB DEFAULT '{}',  -- Critérios específicos
    
    -- Integração WhatsApp (Evolution API)
    whatsapp_instance_id TEXT,
    whatsapp_api_key TEXT,
    
    -- Integração Instagram (ManyChat)
    manychat_api_key TEXT,
    
    -- Integração CRM
    crm_type TEXT,  -- pipedrive, hubspot, rdstation, salesforce
    crm_api_key TEXT,
    crm_settings JSONB DEFAULT '{}',
    
    -- Plano/Assinatura
    plan TEXT DEFAULT 'free',  -- free, starter, pro, enterprise
    max_leads_month INTEGER DEFAULT 100,
    max_users INTEGER DEFAULT 1,
    
    -- Metadados
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: usuarios (Usuários do Sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Autenticação (vinculado ao Supabase Auth)
    auth_user_id UUID UNIQUE,
    
    -- Dados Pessoais
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    avatar_url TEXT,
    
    -- Permissões
    role TEXT DEFAULT 'vendedor',  -- admin, gestor, vendedor
    permissions JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, email)
);

-- ============================================================
-- ATUALIZAR TABELA: leads
-- Adicionar campos para multi-tenant e ciclo de vida
-- ============================================================

-- Adicionar tenant_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'tenant_id') THEN
        ALTER TABLE leads ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    END IF;
END $$;

-- Adicionar campos de ciclo de vida
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'status') THEN
        ALTER TABLE leads ADD COLUMN status TEXT DEFAULT 'novo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'vendedor_id') THEN
        ALTER TABLE leads ADD COLUMN vendedor_id UUID REFERENCES usuarios(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'data_ultimo_contato') THEN
        ALTER TABLE leads ADD COLUMN data_ultimo_contato TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'data_proximo_contato') THEN
        ALTER TABLE leads ADD COLUMN data_proximo_contato TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'motivo_perda') THEN
        ALTER TABLE leads ADD COLUMN motivo_perda TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'valor_potencial') THEN
        ALTER TABLE leads ADD COLUMN valor_potencial DECIMAL(12,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'tags') THEN
        ALTER TABLE leads ADD COLUMN tags TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'dados_extras') THEN
        ALTER TABLE leads ADD COLUMN dados_extras JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'updated_at') THEN
        ALTER TABLE leads ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================================
-- TABELA: interacoes (Histórico de Contatos)
-- ============================================================
CREATE TABLE IF NOT EXISTS interacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    
    -- Tipo de interação
    tipo TEXT NOT NULL,  -- ligacao, email, whatsapp, instagram, reuniao, visita, nota
    direcao TEXT,  -- entrada, saida
    
    -- Conteúdo
    titulo TEXT,
    conteudo TEXT,
    
    -- Resultado
    resultado TEXT,  -- sucesso, sem_resposta, ocupado, recusou, agendou
    
    -- Metadados
    duracao_minutos INTEGER,
    anexos JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: motivos_perda (Catálogo)
-- ============================================================
CREATE TABLE IF NOT EXISTS motivos_perda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    codigo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    acao_sugerida TEXT,
    permite_recontato BOOLEAN DEFAULT true,
    dias_para_recontato INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, codigo)
);

-- ============================================================
-- TABELA: templates_mensagem
-- ============================================================
CREATE TABLE IF NOT EXISTS templates_mensagem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    nome TEXT NOT NULL,
    categoria TEXT,  -- boas_vindas, follow_up, proposta, recontato
    canal TEXT,  -- whatsapp, email, sms
    
    assunto TEXT,  -- Para emails
    conteudo TEXT NOT NULL,
    variaveis TEXT[],  -- {{nome}}, {{empresa}}, etc
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: notificacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    
    tipo TEXT NOT NULL,  -- lead_novo, lead_hot, lembrete, sistema
    titulo TEXT NOT NULL,
    mensagem TEXT,
    link TEXT,
    
    lida BOOLEAN DEFAULT false,
    lida_em TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: webhooks_log (Auditoria)
-- ============================================================
CREATE TABLE IF NOT EXISTS webhooks_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    
    fonte TEXT NOT NULL,  -- whatsapp, instagram, website, api
    payload JSONB NOT NULL,
    status TEXT,  -- received, processed, error
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: configuracoes_tenant (Configurações Extras)
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes_tenant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    
    -- Notificações
    notificar_lead_hot BOOLEAN DEFAULT true,
    email_notificacao TEXT,
    
    -- Qualificação
    score_hot INTEGER DEFAULT 70,
    score_warm INTEGER DEFAULT 40,
    
    -- Automação
    auto_assign_leads BOOLEAN DEFAULT false,
    assign_method TEXT DEFAULT 'round_robin',  -- round_robin, least_leads, manual
    
    -- Campos personalizados do formulário
    campos_formulario JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INSERIR DADOS INICIAIS
-- ============================================================

-- Motivos de perda padrão
INSERT INTO motivos_perda (tenant_id, codigo, descricao, acao_sugerida, permite_recontato, dias_para_recontato) VALUES
(NULL, 'sem_capital', 'Não tem capital suficiente', 'Manter em nurturing para quando tiver', true, 90),
(NULL, 'sem_interesse', 'Perdeu interesse', 'Não recontactar', false, NULL),
(NULL, 'concorrente', 'Fechou com concorrente', 'Analisar concorrência', false, NULL),
(NULL, 'timing', 'Não é o momento', 'Recontactar em 3-6 meses', true, 120),
(NULL, 'regiao', 'Região não atendida', 'Avisar quando expandir', true, 180),
(NULL, 'preco', 'Achou caro', 'Oferecer condições especiais', true, 30),
(NULL, 'outro', 'Outro motivo', 'Avaliar caso a caso', true, 60)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_categoria ON leads(categoria);
CREATE INDEX IF NOT EXISTS idx_leads_vendedor ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interacoes_lead ON interacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_tenant ON interacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant ON usuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id, lida);

-- ============================================================
-- CRIAR VIEWS ÚTEIS
-- ============================================================

-- View: Leads com dados do vendedor
CREATE OR REPLACE VIEW vw_leads_completo AS
SELECT 
    l.*,
    t.name as tenant_name,
    t.slug as tenant_slug,
    u.nome as vendedor_nome,
    u.email as vendedor_email
FROM leads l
LEFT JOIN tenants t ON l.tenant_id = t.id
LEFT JOIN usuarios u ON l.vendedor_id = u.id;

-- View: Métricas por tenant
CREATE OR REPLACE VIEW vw_metricas_tenant AS
SELECT 
    tenant_id,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE categoria = 'hot') as leads_hot,
    COUNT(*) FILTER (WHERE categoria = 'warm') as leads_warm,
    COUNT(*) FILTER (WHERE categoria = 'cold') as leads_cold,
    COUNT(*) FILTER (WHERE status = 'convertido') as convertidos,
    COUNT(*) FILTER (WHERE status = 'perdido') as perdidos,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as leads_hoje,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as leads_semana,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as leads_mes
FROM leads
GROUP BY tenant_id;

-- ============================================================
-- HABILITAR RLS (Row Level Security)
-- ============================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_mensagem ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem dados do seu tenant
CREATE POLICY IF NOT EXISTS "tenant_isolation_leads" ON leads
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY IF NOT EXISTS "tenant_isolation_usuarios" ON usuarios
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM usuarios WHERE auth_user_id = auth.uid()
    ));

-- ============================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
CREATE TRIGGER tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INSERIR TENANT DE DEMONSTRAÇÃO (Franqueadora)
-- ============================================================
INSERT INTO tenants (
    name, 
    slug, 
    business_type,
    ai_instructions,
    primary_color,
    secondary_color
) VALUES (
    'Franqueadora Demo',
    'franqueadora-demo',
    'franquia',
    'Você é um assistente de qualificação de leads para uma rede de franquias. 
Analise a mensagem do lead e extraia:
1. Nome completo
2. Capital disponível para investimento
3. Região de interesse
4. Nível de urgência (imediato, 3 meses, 6 meses, apenas pesquisando)
5. Experiência prévia com negócios

Classifique o lead como:
- HOT: Tem capital acima de R$100k, região definida, quer começar em até 3 meses
- WARM: Tem interesse real mas falta algum critério (capital, região ou prazo)
- COLD: Apenas pesquisando, sem urgência ou capital definido

Responda em JSON com os campos: nome, capital, regiao, urgencia, experiencia, categoria, score (0-100), justificativa',
    '#f97316',
    '#3b82f6'
) ON CONFLICT (slug) DO UPDATE SET
    ai_instructions = EXCLUDED.ai_instructions,
    updated_at = NOW();

-- Pegar o ID do tenant demo para associar leads existentes
DO $$
DECLARE
    demo_tenant_id UUID;
BEGIN
    SELECT id INTO demo_tenant_id FROM tenants WHERE slug = 'franqueadora-demo';
    
    -- Atualizar leads existentes que não têm tenant
    UPDATE leads SET tenant_id = demo_tenant_id WHERE tenant_id IS NULL;
END $$;

SQLEOF

echo "✅ Arquivo SQL criado: supabase/migrations/001_multi_tenant_generic.sql"
echo ""

# ============================================================
# PASSO 3: CRIAR DOCKER-COMPOSE PARA EVOLUTION API
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 PASSO 3: Criando Docker Compose para Evolution API (WhatsApp)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > docker/docker-compose.yml << 'DOCKEREOF'
version: '3.8'

services:
  # ============================================================
  # N8N - Automação de Workflows
  # ============================================================
  n8n:
    image: n8nio/n8n
    container_name: leadcapture-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=LeadCapture2026!
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=America/Sao_Paulo
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - leadcapture-network

  # ============================================================
  # EVOLUTION API - WhatsApp Não-Oficial (Para Desenvolvimento)
  # ============================================================
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: leadcapture-evolution
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=LeadCaptureEvolution2026
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:postgres@postgres:5432/evolution
      - DATABASE_CONNECTION_CLIENT_NAME=evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      - RABBITMQ_ENABLED=false
      - WEBSOCKET_ENABLED=true
      - LOG_LEVEL=ERROR
      - DEL_INSTANCE=false
      - CONFIG_SESSION_PHONE_CLIENT=LeadCapture Pro
      - CONFIG_SESSION_PHONE_NAME=Chrome
      - QRCODE_LIMIT=10
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_URL=http://n8n:5678/webhook/whatsapp-evolution
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
      - WEBHOOK_EVENTS_MESSAGES_UPSERT=true
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
    depends_on:
      - postgres
    networks:
      - leadcapture-network

  # ============================================================
  # POSTGRES - Banco para Evolution API
  # ============================================================
  postgres:
    image: postgres:15
    container_name: leadcapture-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - leadcapture-network

volumes:
  n8n_data:
  evolution_instances:
  evolution_store:
  postgres_data:

networks:
  leadcapture-network:
    driver: bridge
DOCKEREOF

echo "✅ Docker Compose criado: docker/docker-compose.yml"
echo ""

# ============================================================
# PASSO 4: CRIAR .ENV DE EXEMPLO
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️ PASSO 4: Criando arquivo .env..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > .env.example << 'ENVEOF'
# ============================================================
# LEADCAPTURE PRO - CONFIGURAÇÃO DE AMBIENTE
# ============================================================

# Supabase
SUPABASE_URL=https://krcybmownrpfjvqhacup.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_KEY=sua_chave_service_aqui

# OpenAI
OPENAI_API_KEY=sua_chave_openai_aqui

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=LeadCaptureEvolution2026

# N8N
N8N_URL=http://localhost:5678
N8N_WEBHOOK_URL=http://localhost:5678/webhook

# Ambiente
NODE_ENV=development
DEFAULT_TENANT_SLUG=franqueadora-demo
ENVEOF

# Copiar para .env se não existir
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Arquivo .env criado (copie suas chaves reais)"
else
    echo "⚠️ Arquivo .env já existe, mantendo o atual"
fi

echo ""

# ============================================================
# PASSO 5: CRIAR DOCUMENTO DE VISÃO ATUALIZADO
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 PASSO 5: Criando documentação atualizada..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > docs/ARQUITETURA_V1_FINAL.md << 'DOCEOF'
# LeadCapture Pro - Arquitetura v1.0 Final

## 🎯 Visão Geral

O LeadCapture Pro é uma plataforma SaaS multi-tenant para captação e qualificação automática de leads utilizando IA.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Cliente A │  │Cliente B │  │Cliente C │  │Cliente N │        │
│  │(Franquia)│  │(Imob.)   │  │(Escola)  │  │(...)     │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FONTES DE LEADS                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ WhatsApp │  │Instagram │  │  Website │  │Google Ads│        │
│  │(Evolution)│  │(ManyChat)│  │  (Form)  │  │(Webhook) │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         N8N                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    WORKFLOW                              │   │
│  │  Webhook → Identificar Tenant → Buscar Config →         │   │
│  │  IA Qualifica → Salvar Lead → Notificar                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ tenants  │  │  leads   │  │ usuarios │  │interacoes│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Login → Selecionar Tenant → Ver Leads → Gerenciar      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Modelo de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `tenants` | Clientes/Organizações que usam o sistema |
| `usuarios` | Usuários com roles (admin, gestor, vendedor) |
| `leads` | Leads captados (multi-tenant) |
| `interacoes` | Histórico de contatos com cada lead |
| `templates_mensagem` | Templates de respostas por tenant |
| `notificacoes` | Fila de notificações |
| `motivos_perda` | Catálogo de motivos de perda |

### Ciclo de Vida do Lead

```
NOVO → EM_ANALISE → QUALIFICADO → EM_CONTATO → PROPOSTA → NEGOCIACAO
                                                              │
                                    ┌─────────────────────────┼─────────────────────────┐
                                    ▼                         ▼                         ▼
                               CONVERTIDO                  PERDIDO                  NURTURING
                                    │                         │                         │
                                    ▼                         ▼                         ▼
                                 🎉 FIM                   Motivo?              Recontato em X dias
```

## 🔌 Integrações

### WhatsApp (Evolution API)
- API não-oficial baseada em WhatsApp Web
- Zero burocracia para desenvolvimento
- Webhook para n8n

### Instagram (ManyChat)
- Automação oficial de DMs
- Webhook para n8n

### CRMs (Futuro)
- Pipedrive
- HubSpot
- RD Station

## 🚀 Deploy

### Desenvolvimento (Local)
- Docker Compose com n8n + Evolution API
- Dashboard React local
- Supabase Cloud

### Produção
- n8n: Railway ou Render
- Dashboard: Vercel
- Evolution: VPS dedicado

## 📱 Acesso Mobile

O Dashboard é responsivo e funciona como PWA:
- Instalável no celular
- Funciona offline (cache)
- Notificações push (Android)

## 🔐 Segurança

- RLS (Row Level Security) por tenant
- Autenticação via Supabase Auth
- API Keys por integração
- Logs de auditoria

## 📈 Métricas por Tenant

- Total de leads
- Leads por categoria (HOT/WARM/COLD)
- Taxa de conversão
- Tempo médio de resposta
- Leads por fonte
- Performance por vendedor
DOCEOF

echo "✅ Documentação criada: docs/ARQUITETURA_V1_FINAL.md"
echo ""

# ============================================================
# RESUMO FINAL
# ============================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ MIGRAÇÃO PREPARADA!                        ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📁 ARQUIVOS CRIADOS:"
echo "   • supabase/migrations/001_multi_tenant_generic.sql"
echo "   • docker/docker-compose.yml"
echo "   • .env.example"
echo "   • docs/ARQUITETURA_V1_FINAL.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PRÓXIMOS PASSOS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  EXECUTAR SQL NO SUPABASE:"
echo "    • Acesse: https://supabase.com/dashboard"
echo "    • Vá em: SQL Editor"
echo "    • Cole o conteúdo de: supabase/migrations/001_multi_tenant_generic.sql"
echo "    • Clique em RUN"
echo ""
echo "2️⃣  ATUALIZAR DASHBOARD:"
echo "    • Baixe o novo App.jsx do Claude"
echo "    • Copie para: dashboard/src/App.jsx"
echo "    • Execute: npm run dev"
echo ""
echo "3️⃣  INICIAR EVOLUTION API (WhatsApp):"
echo "    • cd docker"
echo "    • docker compose up -d"
echo "    • Acesse: http://localhost:8080"
echo ""
echo "4️⃣  CONECTAR WHATSAPP:"
echo "    • Acesse Evolution API"
echo "    • Crie uma instância"
echo "    • Escaneie o QR Code com o celular"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
