-- ============================================================
-- PERFORMANCE OPTIMIZATION - LEADS
-- ============================================================

-- Enable pg_trgm extension for GIN indexes (text search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for ILIKE search performance on guaranteed columns
CREATE INDEX IF NOT EXISTS idx_leads_nome_gin ON leads USING gin (nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_email_gin ON leads USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_telefone_gin ON leads USING gin (telefone gin_trgm_ops);

-- Create index for filtering by tenant and category (common filter)
CREATE INDEX IF NOT EXISTS idx_leads_tenant_categoria ON leads (tenant_id, categoria);

-- Create indexes for optional columns safely
DO $$
BEGIN
    -- Index for 'cidade' if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'cidade') THEN
        CREATE INDEX IF NOT EXISTS idx_leads_cidade_gin ON leads USING gin (cidade gin_trgm_ops);
    END IF;

    -- Index for 'id_operador_responsavel' if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'id_operador_responsavel') THEN
        CREATE INDEX IF NOT EXISTS idx_leads_operador ON leads (tenant_id, id_operador_responsavel);
    END IF;
END $$;

-- ============================================================
-- VIEWS FOR FRONTEND OPTIMIZATION
-- Ensure metricas_por_tenant view exists for useMetrics hook
-- ============================================================
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
