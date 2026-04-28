/* SCRIPT DE ESTRUTURA DE BANCO DE DADOS - ZAFALAOTECH
   Gerado em: 2026-04-24
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--------------------------------------------------------------------------------
-- 1. NÚCLEO (TENANTS, ROLES, USUÁRIOS)
--------------------------------------------------------------------------------

-- --- TABELA: tenants ---
CREATE TABLE tenants (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    name text NOT NULL, 
    slug text NOT NULL, 
    logo_url text, 
    primary_color text DEFAULT '#f97316'::text, 
    secondary_color text DEFAULT '#3b82f6'::text, 
    ai_instructions text, 
    ai_model text DEFAULT 'gpt-4o-mini'::text, 
    business_type text, 
    qualification_criteria jsonb DEFAULT '{}'::jsonb, 
    whatsapp_instance_id text, 
    whatsapp_api_key text, 
    manychat_api_key text, 
    crm_type text, 
    crm_api_key text, 
    crm_config jsonb DEFAULT '{}'::jsonb, 
    active boolean DEFAULT true, 
    created_at timestamp with time zone DEFAULT now(), 
    updated_at timestamp with time zone DEFAULT now(), 
    deleted_at timestamp with time zone, 
    is_platform boolean DEFAULT false, 
    whatsapp_api_key_enc bytea, 
    manychat_api_key_enc bytea, 
    crm_api_key_enc bytea
);

-- --- TABELA: roles ---
CREATE TABLE roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    nome text NOT NULL, 
    descricao text, 
    nivel integer NOT NULL DEFAULT 0, 
    emoji text, 
    color text, 
    max_global integer, 
    max_tenant integer, 
    is_super boolean DEFAULT false, 
    active boolean DEFAULT true, 
    created_at timestamp with time zone DEFAULT now(), 
    updated_at timestamp with time zone DEFAULT now()
);

-- --- TABELA: usuarios ---
CREATE TABLE usuarios (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    tenant_id uuid NOT NULL, 
    nome text NOT NULL, 
    email text NOT NULL, 
    telefone text, 
    password_hash text, 
    role text DEFAULT 'vendedor'::text, 
    active boolean DEFAULT true, 
    created_at timestamp with time zone DEFAULT now(), 
    auth_id uuid, 
    deleted_at timestamp with time zone, 
    last_login timestamp with time zone, 
    role_id uuid, 
    role_emoji text, 
    role_color text DEFAULT '#10B981'::text, 
    gestor_id uuid, 
    avatar_url text
);

-- --- TABELA: vendedores ---
CREATE TABLE vendedores (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    nome character varying NOT NULL, 
    email character varying NOT NULL, 
    ativo boolean DEFAULT true, 
    created_at timestamp with time zone DEFAULT now(), 
    tenant_id uuid NOT NULL
);

--------------------------------------------------------------------------------
-- 2. LEADS E QUALIFICAÇÃO
--------------------------------------------------------------------------------

-- --- TABELA: leads ---
CREATE TABLE leads (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    tenant_id uuid NOT NULL, 
    nome text, 
    email text, 
    telefone text, 
    mensagem_original text, 
    fonte text, 
    score integer DEFAULT 0, 
    categoria text, 
    capital_disponivel numeric, 
    regiao_interesse text, 
    resumo_qualificacao text, 
    status text DEFAULT 'novo'::text, 
    created_at timestamp with time zone DEFAULT now(), 
    updated_at timestamp with time zone DEFAULT now(), 
    deleted_at timestamp with time zone, 
    id_marca uuid, 
    id_operador_responsavel uuid, 
    cidade text, 
    estado text, 
    experiencia_anterior boolean DEFAULT false, 
    urgencia text DEFAULT 'normal'::text, 
    id_status uuid, 
    id_motivo_desistencia uuid, 
    gclid text, 
    fbclid text, 
    whatsapp_etapa text
);

-- --- TABELA: lead_historico ---
CREATE TABLE lead_historico (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    lead_id uuid, 
    tenant_id uuid, 
    usuario_id uuid, 
    tipo text, 
    descricao text, 
    dados jsonb, 
    created_at timestamp with time zone DEFAULT now(), 
    usuario_nome text
);

-- --- TABELA: marcas ---
CREATE TABLE marcas (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    tenant_id uuid NOT NULL, 
    id_segmento uuid, 
    nome text NOT NULL, 
    invest_min numeric DEFAULT 0, 
    invest_max numeric DEFAULT 0, 
    emoji text, 
    ativo boolean DEFAULT true, 
    created_at timestamp with time zone DEFAULT now(), 
    slug text, 
    logo_url text, 
    google_ads_conversion_id text, 
    google_ads_conversion_label text, 
    meta_pixel_id text
);

-- --- TABELA: segmentos ---
CREATE TABLE segmentos (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    tenant_id uuid NOT NULL, 
    nome text NOT NULL, 
    emoji text, 
    created_at timestamp with time zone DEFAULT now()
);

--------------------------------------------------------------------------------
-- 3. CONFIGURAÇÕES E PARÂMETROS
--------------------------------------------------------------------------------

-- --- TABELA: configuracoes_tenant ---
CREATE TABLE configuracoes_tenant (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    tenant_id uuid NOT NULL, 
    notificar_lead_hot boolean DEFAULT true, 
    email_notificacao text, 
    score_hot integer DEFAULT 70, 
    score_warm integer DEFAULT 40, 
    auto_assign_leads boolean DEFAULT false, 
    assign_method text DEFAULT 'round_robin'::text, 
    campos_formulario jsonb DEFAULT '[]'::jsonb, 
    created_at timestamp with time zone DEFAULT now(), 
    updated_at timestamp with time zone DEFAULT now()
);

-- --- TABELA: parametros_score ---
CREATE TABLE parametros_score (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    marca_id uuid NOT NULL, 
    tenant_id uuid NOT NULL, 
    peso_capital integer DEFAULT 35, 
    peso_urgencia integer DEFAULT 25, 
    capital_ideal numeric DEFAULT 100000, 
    threshold_hot integer DEFAULT 70, 
    threshold_warm integer DEFAULT 40, 
    ativo boolean DEFAULT true, 
    created_at timestamp with time zone DEFAULT now(), 
    updated_at timestamp with time zone DEFAULT now()
);

-- --- TABELA: status_comercial ---
CREATE TABLE status_comercial (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    label text NOT NULL, 
    slug text NOT NULL, 
    tenant_id uuid NOT NULL, 
    cor text DEFAULT '#ee7b4d'::text
);

--------------------------------------------------------------------------------
-- 4. RANKING E COMISSÕES
--------------------------------------------------------------------------------

-- --- TABELA: ranking_config ---
CREATE TABLE ranking_config (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    tenant_id uuid NOT NULL, 
    de numeric NOT NULL DEFAULT 0, 
    ate numeric, 
    pct numeric NOT NULL DEFAULT 0, 
    bonus numeric NOT NULL DEFAULT 0, 
    ativo boolean DEFAULT true, 
    created_at timestamp with time zone DEFAULT now()
);

-- --- TABELA: ranking_metas ---
CREATE TABLE ranking_metas (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    tenant_id uuid NOT NULL, 
    consultor_id uuid, 
    ano integer NOT NULL, 
    mes integer NOT NULL, 
    meta_valor numeric NOT NULL, 
    created_at timestamp with time zone DEFAULT now(), 
    meta_leads integer DEFAULT 20, 
    meta_capital numeric DEFAULT 0, 
    bonus_individual numeric DEFAULT 0, 
    bonus_equipe numeric DEFAULT 0, 
    pct_gestor numeric DEFAULT 0
);

-- --- TABELA: ranking_comissoes ---
CREATE TABLE ranking_comissoes (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    tenant_id uuid NOT NULL, 
    consultor_id uuid NOT NULL, 
    lead_id uuid NOT NULL, 
    ano integer NOT NULL, 
    mes integer NOT NULL, 
    capital numeric NOT NULL DEFAULT 0, 
    pct_aplicado numeric NOT NULL DEFAULT 0, 
    valor_comissao numeric NOT NULL DEFAULT 0, 
    bonus_aplicado numeric NOT NULL DEFAULT 0, 
    status text DEFAULT 'pendente'::text, 
    aprovado_por uuid, 
    aprovado_em timestamp with time zone, 
    pago_em timestamp with time zone, 
    obs text, 
    created_at timestamp with time zone DEFAULT now()
);

--------------------------------------------------------------------------------
-- 5. AUTOMAÇÕES E LOGS
--------------------------------------------------------------------------------

-- --- TABELA: automacoes ---
CREATE TABLE automacoes (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    tenant_id uuid NOT NULL, 
    nome text NOT NULL, 
    descricao text, 
    emoji text DEFAULT '⚡'::text, 
    gatilho_tipo text NOT NULL, 
    gatilho_config jsonb DEFAULT '{}'::jsonb, 
    acoes jsonb DEFAULT '[]'::jsonb, 
    status text NOT NULL DEFAULT 'configurando'::text, 
    total_execucoes integer DEFAULT 0, 
    ultima_execucao timestamp with time zone, 
    total_erros integer DEFAULT 0, 
    ultimo_erro text, 
    criado_por uuid, 
    created_at timestamp with time zone DEFAULT now(), 
    updated_at timestamp with time zone DEFAULT now()
);

-- --- TABELA: automacao_execucoes ---
CREATE TABLE automacao_execucoes (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    automacao_id uuid NOT NULL, 
    tenant_id uuid NOT NULL, 
    lead_id uuid, 
    status text NOT NULL, 
    detalhes jsonb DEFAULT '{}'::jsonb, 
    erro_mensagem text, 
    duracao_ms integer, 
    created_at timestamp with time zone DEFAULT now()
);

-- --- TABELA: audit_log ---
CREATE TABLE audit_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    tenant_id uuid, 
    usuario_id uuid, 
    acao text NOT NULL, 
    tabela text NOT NULL, 
    registro_id uuid, 
    dados_antes jsonb, 
    dados_depois jsonb, 
    ip_address text, 
    user_agent text, 
    created_at timestamp with time zone DEFAULT now()
);

--------------------------------------------------------------------------------
-- 6. COMUNICAÇÃO E NOTIFICAÇÕES
--------------------------------------------------------------------------------

-- --- TABELA: templates_mensagem ---
CREATE TABLE templates_mensagem (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    tenant_id uuid NOT NULL, 
    nome text NOT NULL, 
    tipo text, 
    conteudo text NOT NULL, 
    variaveis text[], -- Ajustado de ARRAY para text[]
    active boolean DEFAULT true, 
    created_at timestamp with time zone DEFAULT now()
);

-- --- TABELA: notificacoes ---
CREATE TABLE notificacoes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    tenant_id uuid NOT NULL, 
    usuario_id uuid, 
    lead_id uuid, 
    titulo text NOT NULL, 
    mensagem text, 
    tipo text, 
    lida boolean DEFAULT false, 
    created_at timestamp with time zone DEFAULT now(), 
    deleted_at timestamp with time zone
);

--------------------------------------------------------------------------------
-- 7. TABELAS ADICIONAIS E AUXILIARES
--------------------------------------------------------------------------------

-- --- TABELA: interacoes ---
CREATE TABLE interacoes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    lead_id uuid NOT NULL, 
    usuario_id uuid, 
    tipo text NOT NULL, 
    conteudo text, 
    metadata jsonb DEFAULT '{}'::jsonb, 
    created_at timestamp with time zone DEFAULT now(), 
    deleted_at timestamp with time zone, 
    tenant_id uuid NOT NULL
);

-- --- TABELA: motivos_desistencia ---
CREATE TABLE motivos_desistencia (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    tenant_id uuid NOT NULL DEFAULT '81cac3a4-caa3-43b2-be4d-d16557d7ef88'::uuid, 
    nome text NOT NULL, 
    ativo boolean DEFAULT true, 
    created_at timestamp with time zone DEFAULT now()
);

-- --- TABELA: webhooks_log ---
CREATE TABLE webhooks_log (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    tenant_id uuid NOT NULL, 
    fonte text NOT NULL, 
    payload jsonb NOT NULL, 
    status text, 
    error_message text, 
    created_at timestamp with time zone DEFAULT now()
);

-- --- TABELA: integracoes_crm ---
CREATE TABLE integracoes_crm (
    id uuid NOT NULL DEFAULT uuid_generate_v4(), 
    tenant_id uuid NOT NULL, 
    crm_tipo text NOT NULL, 
    crm_id text, 
    lead_id uuid NOT NULL, 
    synced boolean DEFAULT false, 
    last_sync timestamp with time zone, 
    sync_error text, 
    created_at timestamp with time zone DEFAULT now()
);