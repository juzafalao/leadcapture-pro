-- ============================================================
-- Migration: equalize_status_comercial
-- LeadCapture Pro · Zafalão Tech
--
-- Objetivo: Padronizar status dos leads em todos os tenants
-- para refletir um fluxo Kanban coerente com rastreamento
-- de valor ao converter (Vendido) e suporte a reabertura.
--
-- Fluxo:
--   Novo Lead → Agendado → Em Contato → Em Negociação
--                                     → Vendido (finalizado, exige valor)
--                                     → Perdido  (pode ser reaberto)
--                                     → Reaberto → Agendado (reinicia)
--
-- É IDEMPOTENTE: pode ser executado mais de uma vez sem duplicar dados.
-- ============================================================

-- ─── 1. Adicionar colunas de metadado à tabela status_comercial ──────────

ALTER TABLE public.status_comercial
  ADD COLUMN IF NOT EXISTS ordem             integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_final          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS permite_reabertura boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requer_valor      boolean DEFAULT false;

-- ─── 2. Atualizar metadados dos status existentes por slug ───────────────
--   Aplica a todos os tenants que já possuem esses slugs canônicos.

UPDATE public.status_comercial SET
  ordem = 1, is_final = false, permite_reabertura = false, requer_valor = false
WHERE slug IN ('novo', 'novo-lead', 'novo_lead');

UPDATE public.status_comercial SET
  ordem = 2, is_final = false, permite_reabertura = false, requer_valor = false
WHERE slug = 'agendado';

UPDATE public.status_comercial SET
  ordem = 3, is_final = false, permite_reabertura = false, requer_valor = false
WHERE slug IN ('em_contato', 'contato', 'em-contato');

UPDATE public.status_comercial SET
  ordem = 4, is_final = false, permite_reabertura = false, requer_valor = false
WHERE slug IN ('negociacao', 'em_negociacao', 'em-negociacao', 'negociação');

UPDATE public.status_comercial SET
  ordem = 5, is_final = true, permite_reabertura = false, requer_valor = true
WHERE slug IN ('vendido', 'convertido', 'fechado');

UPDATE public.status_comercial SET
  ordem = 6, is_final = true, permite_reabertura = true, requer_valor = false
WHERE slug = 'perdido';

UPDATE public.status_comercial SET
  ordem = 7, is_final = false, permite_reabertura = false, requer_valor = false
WHERE slug = 'reaberto';

-- Slugs legados com ordem padrão (não canônicos mas existentes)
UPDATE public.status_comercial SET
  ordem = CASE
    WHEN slug IN ('proposta')             THEN 4
    WHEN slug IN ('retorno')              THEN 3
    WHEN slug IN ('tratamento')           THEN 3
    WHEN slug IN ('consulta-realizada')   THEN 3
    WHEN slug IN ('visitou-imovel')       THEN 2
    ELSE 0
  END
WHERE slug IN ('proposta','retorno','tratamento','consulta-realizada','visitou-imovel')
  AND ordem = 0;

-- ─── 3. Inserir os 7 status canônicos para cada tenant existente ─────────
--   Usa INSERT ... ON CONFLICT DO NOTHING para idempotência.
--   Primeiro garante que existe um unique constraint em (tenant_id, slug).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'status_comercial_tenant_slug_unique'
      AND conrelid = 'public.status_comercial'::regclass
  ) THEN
    ALTER TABLE public.status_comercial
      ADD CONSTRAINT status_comercial_tenant_slug_unique UNIQUE (tenant_id, slug);
  END IF;
END $$;

-- Insere os 7 status canônicos para cada tenant que ainda não os possui
INSERT INTO public.status_comercial
  (tenant_id, label, slug, cor, ordem, is_final, permite_reabertura, requer_valor)
SELECT
  t.id,
  s.label,
  s.slug,
  s.cor,
  s.ordem,
  s.is_final,
  s.permite_reabertura,
  s.requer_valor
FROM public.tenants t
CROSS JOIN (VALUES
  ('Novo Lead',       'novo',        '#3b82f6', 1, false, false, false),
  ('Agendado',        'agendado',    '#f59e0b', 2, false, false, false),
  ('Em Contato',      'em_contato',  '#8b5cf6', 3, false, false, false),
  ('Em Negociação',   'negociacao',  '#ee7b4d', 4, false, false, false),
  ('Vendido',         'vendido',     '#10b981', 5, true,  false, true),
  ('Perdido',         'perdido',     '#ef4444', 6, true,  true,  false),
  ('Reaberto',        'reaberto',    '#06b6d4', 7, false, false, false)
) AS s(label, slug, cor, ordem, is_final, permite_reabertura, requer_valor)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- ─── 4. Garantir que o slug 'convertido' herdado aponte metadados corretos ─
--   Tenants que ainda usam 'convertido' como slug de venda devem ter is_final=true.
UPDATE public.status_comercial SET
  is_final     = true,
  requer_valor = true,
  ordem        = CASE WHEN ordem = 0 THEN 5 ELSE ordem END
WHERE slug = 'convertido';

-- ─── 5. Índice para ordenação eficiente no Kanban ────────────────────────
CREATE INDEX IF NOT EXISTS idx_status_comercial_ordem
  ON public.status_comercial (tenant_id, ordem);

-- ─── 6. Grants (mantém compatibilidade com Supabase RLS) ─────────────────
GRANT ALL ON public.status_comercial TO authenticated;
GRANT ALL ON public.status_comercial TO service_role;

-- ─── Fim da migration ─────────────────────────────────────────────────────
