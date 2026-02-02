-- ============================================================
-- LEADCAPTURE PRO - BASE DE DADOS MULTI-TENANT
-- Script 100% limpo - Executar uma única vez
-- Data: 27/01/2026
-- ============================================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PASSO 1: LIMPAR TUDO (ordem correta por dependências)
-- ============================================================

DROP VIEW IF EXISTS metricas_por_tenant CASCADE;
DROP VIEW IF EXISTS leads_por_fonte CASCADE;
DROP TABLE IF EXISTS templates_mensagem CASCADE;
DROP TABLE IF EXISTS motivos_perda CASCADE;
DROP TABLE IF EXISTS integracoes_crm CASCADE;
DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS interacoes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- ============================================================
-- PASSO 2: CRIAR TABELA TENANTS
-- ============================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#f97316',
    secondary_color TEXT DEFAULT '#3b82f6',
    ai_instructions TEXT,
    ai_model TEXT DEFAULT 'gpt-4o-mini',
    business_type TEXT,
    qualification_criteria JSONB DEFAULT '{}',
    whatsapp_instance_id TEXT,
    whatsapp_api_key TEXT,
    manychat_api_key TEXT,
    crm_type TEXT,
    crm_api_key TEXT,
    crm_config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PASSO 3: CRIAR TABELA LEADS
-- ============================================================

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    instagram TEXT,
    mensagem_original TEXT,
    fonte TEXT,
    score INTEGER DEFAULT 0,
    categoria TEXT,
    capital_disponivel NUMERIC,
    regiao_interesse TEXT,
    resumo_qualificacao TEXT,
    status TEXT DEFAULT 'novo',
    motivo_perda TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PASSO 4: CRIAR TABELA USUARIOS
-- ============================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    password_hash TEXT,
    role TEXT DEFAULT 'vendedor',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- ============================================================
-- PASSO 5: CRIAR TABELA INTERACOES
-- ============================================================

CREATE TABLE interacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    tipo TEXT NOT NULL,
    conteudo TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PASSO 6: CRIAR TABELA NOTIFICACOES
-- ============================================================

CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensagem TEXT,
    tipo TEXT,
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PASSO 7: CRIAR TABELA INTEGRACOES_CRM
-- ============================================================

CREATE TABLE integracoes_crm (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    crm_tipo TEXT NOT NULL,
    crm_id TEXT,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    synced BOOLEAN DEFAULT false,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, crm_tipo, lead_id)
);

-- ============================================================
-- PASSO 8: CRIAR TABELA MOTIVOS_PERDA
-- ============================================================

CREATE TABLE motivos_perda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    descricao TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, motivo)
);

-- ============================================================
-- PASSO 9: CRIAR TABELA TEMPLATES_MENSAGEM
-- ============================================================

CREATE TABLE templates_mensagem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT,
    conteudo TEXT NOT NULL,
    variaveis TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, nome)
);

-- ============================================================
-- PASSO 10: CRIAR ÍNDICES
-- ============================================================

CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_categoria ON leads(categoria);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_fonte ON leads(fonte);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_interacoes_lead_id ON interacoes(lead_id);
CREATE INDEX idx_interacoes_created_at ON interacoes(created_at DESC);
CREATE INDEX idx_usuarios_tenant_id ON usuarios(tenant_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);

-- ============================================================
-- PASSO 11: CRIAR FUNÇÃO E TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PASSO 12: CRIAR VIEWS
-- ============================================================

CREATE VIEW metricas_por_tenant AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.categoria = 'hot' THEN 1 END) as leads_hot,
    COUNT(CASE WHEN l.categoria = 'warm' THEN 1 END) as leads_warm,
    COUNT(CASE WHEN l.categoria = 'cold' THEN 1 END) as leads_cold,
    COUNT(CASE WHEN l.status = 'convertido' THEN 1 END) as leads_convertidos,
    COUNT(CASE WHEN l.status = 'perdido' THEN 1 END) as leads_perdidos,
    ROUND(AVG(l.score), 2) as score_medio,
    COUNT(CASE WHEN l.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as leads_ultimos_7_dias
FROM tenants t
LEFT JOIN leads l ON l.tenant_id = t.id
GROUP BY t.id, t.name;

CREATE VIEW leads_por_fonte AS
SELECT 
    tenant_id,
    fonte,
    COUNT(*) as total,
    COUNT(CASE WHEN categoria = 'hot' THEN 1 END) as hot,
    COUNT(CASE WHEN categoria = 'warm' THEN 1 END) as warm,
    COUNT(CASE WHEN categoria = 'cold' THEN 1 END) as cold,
    ROUND(AVG(score), 2) as score_medio
FROM leads
WHERE fonte IS NOT NULL
GROUP BY tenant_id, fonte;

-- ============================================================
-- PASSO 13: DESABILITAR RLS
-- ============================================================

ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE integracoes_crm DISABLE ROW LEVEL SECURITY;
ALTER TABLE motivos_perda DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates_mensagem DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASSO 14: INSERIR TENANT DEMO - LAVANDERIA
-- ============================================================

INSERT INTO tenants (name, slug, ai_instructions, business_type, primary_color, secondary_color)
VALUES (
    'Franqueadora Lavanderia',
    'lavanderia-express',
    'Você é um assistente de qualificação de leads para uma franqueadora de lavanderias express.

Analise a mensagem do lead e extraia as seguintes informações em formato JSON:

{
  "capital_disponivel": número ou null,
  "regiao_interesse": "cidade/estado" ou null,
  "experiencia_anterior": true ou false,
  "urgencia": "alta", "media" ou "baixa",
  "score": número de 0 a 100,
  "categoria": "hot", "warm" ou "cold",
  "resumo": "breve resumo do interesse do lead"
}

Critérios de score:
- Capital >= 150000: +30 pontos
- Capital >= 100000: +20 pontos
- Região definida: +20 pontos
- Experiência anterior: +15 pontos
- Urgência alta: +20 pontos
- Informações completas: +15 pontos

Categoria:
- score >= 70: "hot"
- score >= 40: "warm"
- score < 40: "cold"

Responda APENAS com o JSON, sem texto adicional.',
    'franquia',
    '#f97316',
    '#3b82f6'
);

-- ============================================================
-- PASSO 15: INSERIR TENANT DEMO - IMOBILIÁRIA
-- ============================================================

INSERT INTO tenants (name, slug, ai_instructions, business_type, primary_color, secondary_color)
VALUES (
    'Imobiliária Exemplo',
    'imobiliaria-exemplo',
    'Você é um assistente de qualificação de leads para uma imobiliária.

Analise a mensagem e extraia em JSON:

{
  "orcamento": número ou null,
  "tipo_imovel": "apartamento/casa/comercial" ou null,
  "regiao": "bairro/cidade" ou null,
  "urgencia": "alta/media/baixa",
  "score": 0-100,
  "categoria": "hot/warm/cold",
  "resumo": "resumo"
}

Score:
- Orçamento definido: +30
- Região definida: +20
- Tipo definido: +20
- Urgência alta: +20
- Info completa: +10',
    'imobiliaria',
    '#10b981',
    '#8b5cf6'
);

-- ============================================================
-- PASSO 16: INSERIR MOTIVOS DE PERDA
-- ============================================================

INSERT INTO motivos_perda (tenant_id, motivo, descricao)
SELECT 
    id,
    unnest(ARRAY['Sem capital suficiente', 'Região sem disponibilidade', 'Desistiu', 'Não respondeu', 'Escolheu concorrente', 'Outro']),
    unnest(ARRAY['Lead não possui capital mínimo necessário', 'Não temos unidades disponíveis na região', 'Lead desistiu por conta própria', 'Lead não retornou contato após múltiplas tentativas', 'Lead optou por outra franqueadora', 'Outro motivo não listado'])
FROM tenants 
WHERE slug = 'lavanderia-express';

-- ============================================================
-- PASSO 17: INSERIR USUÁRIO ADMIN
-- ============================================================

INSERT INTO usuarios (tenant_id, nome, email, role)
SELECT id, 'Administrador', 'admin@lavanderia-express.com', 'admin'
FROM tenants 
WHERE slug = 'lavanderia-express';

-- ============================================================
-- PASSO 18: INSERIR LEADS DE EXEMPLO
-- ============================================================

INSERT INTO leads (tenant_id, nome, email, telefone, fonte, score, categoria, status, capital_disponivel, regiao_interesse, resumo_qualificacao, mensagem_original)
SELECT 
    t.id,
    'João Silva',
    'joao.silva@email.com',
    '11999998888',
    'instagram',
    85,
    'hot',
    'novo',
    180000,
    'São Paulo - SP',
    'Lead com alto potencial. Capital acima do mínimo e interesse definido.',
    'Olá, tenho interesse em abrir uma franquia de lavanderia. Tenho R$ 180 mil disponíveis e gostaria de atuar em São Paulo capital.'
FROM tenants t
WHERE t.slug = 'lavanderia-express';

INSERT INTO leads (tenant_id, nome, email, telefone, fonte, score, categoria, status, capital_disponivel, regiao_interesse, resumo_qualificacao, mensagem_original)
SELECT 
    t.id,
    'Maria Santos',
    'maria.santos@email.com',
    '21988887777',
    'facebook',
    55,
    'warm',
    'em_contato',
    120000,
    'Rio de Janeiro - RJ',
    'Lead com potencial médio. Capital no limite mínimo.',
    'Boa tarde! Estou pesquisando franquias de lavanderia. Tenho aproximadamente 120 mil para investir no Rio de Janeiro.'
FROM tenants t
WHERE t.slug = 'lavanderia-express';

INSERT INTO leads (tenant_id, nome, email, telefone, fonte, score, categoria, status, resumo_qualificacao, mensagem_original)
SELECT 
    t.id,
    'Carlos Oliveira',
    'carlos.oliveira@email.com',
    '31977776666',
    'site',
    25,
    'cold',
    'novo',
    'Lead com informações incompletas. Necessita mais qualificação.',
    'Quero saber mais sobre a franquia.'
FROM tenants t
WHERE t.slug = 'lavanderia-express';

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

SELECT '🎉 BASE DE DADOS CRIADA COM SUCESSO!' as resultado
UNION ALL
SELECT '✅ Tenants: ' || COUNT(*)::TEXT FROM tenants
UNION ALL
SELECT '✅ Leads: ' || COUNT(*)::TEXT FROM leads
UNION ALL
SELECT '✅ Usuários: ' || COUNT(*)::TEXT FROM usuarios
UNION ALL
SELECT '✅ Motivos de perda: ' || COUNT(*)::TEXT FROM motivos_perda
UNION ALL
SELECT '✅ Tabelas criadas: ' || COUNT(*)::TEXT 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
