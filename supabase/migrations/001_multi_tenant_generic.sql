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

