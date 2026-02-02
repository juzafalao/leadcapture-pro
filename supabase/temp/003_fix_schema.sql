-- ============================================================
-- LeadCapture Pro - Fix Schema (Multi-tenant) - Idempotent
-- File: supabase/migrations/003_fix_schema.sql
-- Date: 2026-01-27
--
-- Goals:
--  - Ensure leads + tenants exist and are consistent
--  - Normalize leads.tenant_id (no invalid tenant references)
--  - Recreate FK safely
--  - Create auxiliary tables, indexes, triggers, views, seeds
--  - Safe to re-run (idempotent)
-- ============================================================

-- ------------------------------------------------------------
-- A) EXTENSIONS + BASE TABLES
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Base: leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Base: tenants (DO NOT DROP; keep IDs stable)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#f97316',
  secondary_color TEXT DEFAULT '#3b82f6',
  ai_instructions TEXT,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  business_type TEXT,
  qualification_criteria JSONB DEFAULT '{}'::jsonb,
  whatsapp_instance_id TEXT,
  whatsapp_api_key TEXT,
  manychat_api_key TEXT,
  crm_type TEXT,
  crm_api_key TEXT,
  crm_config JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- B) LEADS COLUMNS + TENANT SEED + NORMALIZE LEADS.TENANT_ID
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='nome')
  THEN ALTER TABLE public.leads ADD COLUMN nome TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='email')
  THEN ALTER TABLE public.leads ADD COLUMN email TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='telefone')
  THEN ALTER TABLE public.leads ADD COLUMN telefone TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='mensagem_original')
  THEN ALTER TABLE public.leads ADD COLUMN mensagem_original TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='fonte')
  THEN ALTER TABLE public.leads ADD COLUMN fonte TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='score')
  THEN ALTER TABLE public.leads ADD COLUMN score INTEGER DEFAULT 0; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='categoria')
  THEN ALTER TABLE public.leads ADD COLUMN categoria TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='capital_disponivel')
  THEN ALTER TABLE public.leads ADD COLUMN capital_disponivel NUMERIC; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='regiao_interesse')
  THEN ALTER TABLE public.leads ADD COLUMN regiao_interesse TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='resumo_qualificacao')
  THEN ALTER TABLE public.leads ADD COLUMN resumo_qualificacao TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='tenant_id')
  THEN ALTER TABLE public.leads ADD COLUMN tenant_id UUID; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='status')
  THEN ALTER TABLE public.leads ADD COLUMN status TEXT DEFAULT 'novo'; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='motivo_perda')
  THEN ALTER TABLE public.leads ADD COLUMN motivo_perda TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='instagram')
  THEN ALTER TABLE public.leads ADD COLUMN instagram TEXT; END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='updated_at')
  THEN ALTER TABLE public.leads ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- Seed tenants (idempotent by slug)
INSERT INTO public.tenants (name, slug, business_type, primary_color, secondary_color)
VALUES ('Franqueadora Lavanderia', 'lavanderia-express', 'franquia', '#f97316', '#3b82f6')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tenants (name, slug, business_type, primary_color, secondary_color)
VALUES ('Imobiliária Exemplo', 'imobiliaria-exemplo', 'imobiliaria', '#10b981', '#8b5cf6')
ON CONFLICT (slug) DO NOTHING;

-- Normalize tenant_id safely
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_tenant_id_fkey;
ALTER TABLE public.leads ALTER COLUMN tenant_id DROP NOT NULL;

-- Null out invalid tenant references (tenant_id points to a non-existing tenant)
UPDATE public.leads l
SET tenant_id = NULL
WHERE tenant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = l.tenant_id);

-- Assign default tenant to any lead missing tenant
UPDATE public.leads
SET tenant_id = (SELECT id FROM public.tenants WHERE slug='lavanderia-express')
WHERE tenant_id IS NULL;

-- ------------------------------------------------------------
-- C) FOREIGN KEY + AUX TABLES
-- ------------------------------------------------------------
ALTER TABLE public.leads
DROP CONSTRAINT IF EXISTS leads_tenant_id_fkey;

ALTER TABLE public.leads
ADD CONSTRAINT leads_tenant_id_fkey
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

-- Auxiliary tables (do not DROP; keep rerunnable)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'vendedor',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS public.interacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id),
  tipo TEXT NOT NULL,
  conteudo TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  tipo TEXT,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integracoes_crm (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  crm_tipo TEXT NOT NULL,
  crm_id TEXT,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  synced BOOLEAN DEFAULT false,
  last_sync TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, crm_tipo, lead_id)
);

CREATE TABLE IF NOT EXISTS public.motivos_perda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  descricao TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, motivo)
);

CREATE TABLE IF NOT EXISTS public.templates_mensagem (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT,
  conteudo TEXT NOT NULL,
  variaveis TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, nome)
);

-- ------------------------------------------------------------
-- D) INDEXES (IDEMPOTENT)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_categoria ON public.leads(categoria);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_fonte ON public.leads(fonte);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score DESC);

CREATE INDEX IF NOT EXISTS idx_interacoes_lead_id ON public.interacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_created_at ON public.interacoes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usuarios_tenant_id ON public.usuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON public.notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);

-- ------------------------------------------------------------
-- E) TRIGGERS (IDEMPOTENT)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- F) VIEWS
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.metricas_por_tenant AS
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
FROM public.tenants t
LEFT JOIN public.leads l ON l.tenant_id = t.id
GROUP BY t.id, t.name;

CREATE OR REPLACE VIEW public.leads_por_fonte AS
SELECT
  tenant_id,
  fonte,
  COUNT(*) as total,
  COUNT(CASE WHEN categoria = 'hot' THEN 1 END) as hot,
  COUNT(CASE WHEN categoria = 'warm' THEN 1 END) as warm,
  COUNT(CASE WHEN categoria = 'cold' THEN 1 END) as cold,
  ROUND(AVG(score), 2) as score_medio
FROM public.leads
WHERE fonte IS NOT NULL AND tenant_id IS NOT NULL
GROUP BY tenant_id, fonte;

-- ------------------------------------------------------------
-- G) SEEDS (IDEMPOTENT)
-- ------------------------------------------------------------
INSERT INTO public.motivos_perda (tenant_id, motivo, descricao)
VALUES
  ((SELECT id FROM public.tenants WHERE slug='lavanderia-express'), 'Sem capital suficiente', 'Lead não possui capital mínimo necessário'),
  ((SELECT id FROM public.tenants WHERE slug='lavanderia-express'), 'Região sem disponibilidade', 'Não temos unidades disponíveis na região'),
  ((SELECT id FROM public.tenants WHERE slug='lavanderia-express'), 'Desistiu', 'Lead desistiu por conta própria'),
  ((SELECT id FROM public.tenants WHERE slug='lavanderia-express'), 'Não respondeu', 'Lead não retornou contato após múltiplas tentativas'),
  ((SELECT id FROM public.tenants WHERE slug='lavanderia-express'), 'Escolheu concorrente', 'Lead optou por outra franqueadora'),
  ((SELECT id FROM public.tenants WHERE slug='lavanderia-express'), 'Outro', 'Outro motivo não listado')
ON CONFLICT (tenant_id, motivo) DO NOTHING;

INSERT INTO public.usuarios (tenant_id, nome, email, role)
VALUES (
  (SELECT id FROM public.tenants WHERE slug='lavanderia-express'),
  'Administrador',
  'admin@lavanderia-express.com',
  'admin'
)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- ------------------------------------------------------------
-- H) RLS (POC)
-- ------------------------------------------------------------
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.integracoes_crm DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivos_perda DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_mensagem DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- I) FINAL CHECK
-- ------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM public.tenants) AS total_tenants,
  (SELECT COUNT(*) FROM public.leads) AS total_leads,
  (SELECT COUNT(*) FROM public.leads WHERE tenant_id IS NOT NULL) AS leads_com_tenant,
  (SELECT COUNT(*) FROM public.leads l WHERE l.tenant_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id=l.tenant_id)) AS leads_tenant_invalido;
