-- ============================================================
-- Migration: globalize_status_comercial
-- LeadCapture Pro · Zafalão Tech
--
-- Objetivo: Transformar os 6 status canônicos em registros
-- GLOBAIS (tenant_id = NULL), eliminando as cópias redundantes
-- por tenant. O resultado final é 6 linhas únicas, sem repetição.
--
-- Pré-requisito: migration canonicalize_status_workflow.sql já
-- deve ter sido executada (garante slugs canônicos por tenant).
--
-- É IDEMPOTENTE: pode ser executada mais de uma vez.
-- ============================================================

-- ─── 1. Tornar tenant_id nullable ──────────────────────────────────────
ALTER TABLE public.status_comercial
  ALTER COLUMN tenant_id DROP NOT NULL;

-- ─── 2. Remover unique constraint de (tenant_id, slug) ─────────────────
ALTER TABLE public.status_comercial
  DROP CONSTRAINT IF EXISTS status_comercial_tenant_slug_unique;

-- ─── 3. Inserir os 6 status globais (tenant_id = NULL) ─────────────────
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

-- ─── 4. Unique constraint global em slug ───────────────────────────────
-- Garante que exista apenas uma linha global por slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_status_comercial_global_slug
  ON public.status_comercial (slug)
  WHERE tenant_id IS NULL;

-- ─── 5. Remapear leads: id_status → UUID global ────────────────────────
-- Cada lead passa a apontar para o status global correspondente ao mesmo slug
UPDATE public.leads l
SET
  id_status  = gs.id,
  updated_at = now()
FROM public.status_comercial gs
JOIN public.status_comercial old_sc ON old_sc.id = l.id_status
WHERE gs.tenant_id IS NULL
  AND gs.slug = old_sc.slug
  AND old_sc.tenant_id IS NOT NULL
  AND l.deleted_at IS NULL;

-- ─── 6. Também corrigir leads cujo id_status era NULL mas status (text) existe
UPDATE public.leads l
SET
  id_status  = gs.id,
  updated_at = now()
FROM public.status_comercial gs
WHERE gs.tenant_id IS NULL
  AND gs.slug = l.status
  AND l.id_status IS NULL
  AND l.status IS NOT NULL
  AND l.deleted_at IS NULL;

-- ─── 7. Deletar todos os status por tenant (rows com tenant_id != NULL) ─
DELETE FROM public.status_comercial
WHERE tenant_id IS NOT NULL;

-- ─── 8. Índice de ordenação ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_status_comercial_ordem_global
  ON public.status_comercial (ordem)
  WHERE tenant_id IS NULL;

-- ─── 9. Grants ────────────────────────────────────────────────────────
GRANT SELECT ON public.status_comercial TO authenticated;
GRANT ALL    ON public.status_comercial TO service_role;

-- ─── Resultado esperado: 6 linhas, tenant_id = NULL para todas ─────────
-- SELECT slug, label, ordem FROM status_comercial ORDER BY ordem;
-- novo_lead | Novo Lead      | 1
-- em_agendamento | Em Agendamento | 2
-- em_negociacao  | Em Negociação  | 3
-- vendido        | Vendido        | 4
-- perdido        | Perdido        | 5
-- reaberto       | Reaberto       | 6

-- ─── Fim da migration ──────────────────────────────────────────────────
