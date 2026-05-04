-- ============================================================
-- 008_platform_stats_and_indexes.sql
-- LeadCapture Pro — Zafalão Tech
--
-- Objetivos:
--   1. Índices parciais em deleted_at IS NULL para evitar
--      Sequential Scans em tabelas com soft-delete.
--   2. Função RPC get_platform_stats() para o Backoffice Admin
--      calcular métricas globais no banco, sem trazer linhas
--      ao frontend (elimina o .reduce() em JS).
--
-- Como aplicar:
--   Execute no SQL Editor do Supabase ou via supabase db push.
-- ============================================================

-- ─── 1. Índices Parciais (soft-delete) ───────────────────────

-- Leads: filtro principal do pipeline e KPIs
CREATE INDEX IF NOT EXISTS idx_leads_active_tenant
  ON public.leads (tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Leads: busca por score/categoria
CREATE INDEX IF NOT EXISTS idx_leads_active_score
  ON public.leads (tenant_id, score DESC)
  WHERE deleted_at IS NULL;

-- Usuários: listagem por tenant
CREATE INDEX IF NOT EXISTS idx_usuarios_active_tenant
  ON public.usuarios (tenant_id)
  WHERE deleted_at IS NULL;

-- Histórico: timeline de leads
CREATE INDEX IF NOT EXISTS idx_lead_historico_lead_id
  ON public.lead_historico (lead_id, created_at DESC);

-- ─── 2. RPC get_platform_stats ────────────────────────────────
-- Retorna métricas globais + por tenant em uma única chamada.
-- Usa SECURITY DEFINER para acesso ao service role do backend.
-- Só deve ser chamada pelo backend ou via chave de serviço.

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_tenants',  (SELECT COUNT(*)                          FROM tenants  WHERE active = true),
    'total_leads',    (SELECT COUNT(*)                          FROM leads    WHERE deleted_at IS NULL),
    'leads_hoje',     (SELECT COUNT(*)                          FROM leads    WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE),
    'capital_total',  (SELECT COALESCE(SUM(capital_disponivel), 0) FROM leads WHERE deleted_at IS NULL),
    'total_usuarios', (SELECT COUNT(*)                          FROM usuarios WHERE deleted_at IS NULL),
    'tenant_stats', (
      SELECT json_agg(
        json_build_object(
          'tenant_id',    t.id,
          'tenant_name',  t.name,
          'total_leads',  COUNT(l.id),
          'capital_total',COALESCE(SUM(l.capital_disponivel), 0),
          'leads_hoje',   COUNT(l.id) FILTER (WHERE l.created_at >= CURRENT_DATE)
        )
        ORDER BY COUNT(l.id) DESC
      )
      FROM tenants t
      LEFT JOIN leads l ON l.tenant_id = t.id AND l.deleted_at IS NULL
      GROUP BY t.id, t.name
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Revogar acesso público — só service role ou funções explícitas
REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_platform_stats() TO service_role;

COMMENT ON FUNCTION public.get_platform_stats() IS
  'Métricas globais da plataforma para o Backoffice Admin. '
  'Substitui o .reduce() em JavaScript no frontend. '
  'Requer chave service_role — não expor via anon key.';
