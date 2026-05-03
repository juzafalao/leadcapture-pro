-- ============================================================
-- SCRIPT DIRETO — Executar no Supabase SQL Editor
-- Globalizar status_comercial: 24 linhas → 6 globais
-- LeadCapture Pro · Zafalão Tech
-- ============================================================
-- Rode este script UMA VEZ no Supabase > SQL Editor
-- É IDEMPOTENTE: pode rodar mais de uma vez sem problema
-- ============================================================

BEGIN;

-- ─── 1. Garantir colunas necessárias ──────────────────────
ALTER TABLE public.status_comercial
  ADD COLUMN IF NOT EXISTS ordem              integer  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_final           boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS permite_reabertura boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS requer_valor       boolean  DEFAULT false;

-- ─── 2. Tornar tenant_id nullable ─────────────────────────
ALTER TABLE public.status_comercial
  ALTER COLUMN tenant_id DROP NOT NULL;

-- ─── 3. Remover constraints antigas ───────────────────────
ALTER TABLE public.status_comercial
  DROP CONSTRAINT IF EXISTS status_comercial_tenant_slug_unique;

-- ─── 4. Criar / garantir as 6 linhas globais (tenant=NULL) ─
INSERT INTO public.status_comercial
  (tenant_id, label, slug, cor, ordem, is_final, permite_reabertura, requer_valor)
VALUES
  (NULL, 'Novo Lead',      'novo_lead',      '#3b82f6', 1, false, false, false),
  (NULL, 'Em Agendamento', 'em_agendamento', '#f59e0b', 2, false, false, false),
  (NULL, 'Em Negociação',  'em_negociacao',  '#ee7b4d', 3, false, false, false),
  (NULL, 'Vendido',        'vendido',        '#10b981', 4, true,  false, true ),
  (NULL, 'Perdido',        'perdido',        '#ef4444', 5, true,  true,  false),
  (NULL, 'Reaberto',       'reaberto',       '#06b6d4', 6, false, false, false)
ON CONFLICT DO NOTHING;

-- Unique index parcial para garantir 1 linha por slug global
CREATE UNIQUE INDEX IF NOT EXISTS idx_status_global_slug
  ON public.status_comercial (slug)
  WHERE tenant_id IS NULL;

-- ─── 5. Remapear leads.id_status → UUID global ────────────
UPDATE public.leads l
SET
  id_status  = gs.id,
  updated_at = now()
FROM public.status_comercial gs
JOIN public.status_comercial ts ON ts.id = l.id_status
WHERE gs.tenant_id IS NULL
  AND gs.slug      = ts.slug
  AND ts.tenant_id IS NOT NULL
  AND l.deleted_at IS NULL;

-- ─── 6. Leads sem id_status mas com campo status (texto) ──
UPDATE public.leads l
SET
  id_status  = gs.id,
  updated_at = now()
FROM public.status_comercial gs
WHERE gs.tenant_id IS NULL
  AND gs.slug       = l.status
  AND l.id_status   IS NULL
  AND l.status      IS NOT NULL
  AND l.deleted_at  IS NULL;

-- ─── 7. Deletar linhas por tenant ─────────────────────────
DELETE FROM public.status_comercial
WHERE tenant_id IS NOT NULL;

-- ─── 8. Índice de ordenação global ────────────────────────
CREATE INDEX IF NOT EXISTS idx_status_comercial_ordem_global
  ON public.status_comercial (ordem)
  WHERE tenant_id IS NULL;

-- ─── 9. Grants ────────────────────────────────────────────
GRANT SELECT ON public.status_comercial TO authenticated;
GRANT ALL    ON public.status_comercial TO service_role;

COMMIT;

-- ─── Verificação: deve retornar 6 linhas com tenant_id NULL ─
-- SELECT id, slug, label, ordem, tenant_id
-- FROM   public.status_comercial
-- ORDER  BY ordem;
