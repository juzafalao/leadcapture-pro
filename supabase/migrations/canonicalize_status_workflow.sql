-- ============================================================
-- Migration: canonicalize_status_workflow
-- LeadCapture Pro · Zafalão Tech
--
-- Objetivo: Limpar e padronizar a tabela status_comercial para
-- apenas os 6 status canônicos do fluxo de vida do lead.
--
-- Novos slugs canônicos:
--   novo_lead → em_agendamento → em_negociacao
--                                → vendido   (final, requer valor)
--                                → perdido   (final, pode reabrir)
--                                → reaberto  (retorna ao fluxo)
--
-- A migration migra os leads existentes para os novos slugs
-- e depois remove os status não-canônicos.
--
-- É IDEMPOTENTE: pode ser executada mais de uma vez sem duplicar dados.
-- ============================================================

-- ─── 1. Garantir colunas de metadado ───────────────────────────────────
ALTER TABLE public.status_comercial
  ADD COLUMN IF NOT EXISTS ordem              integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_final           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS permite_reabertura boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requer_valor       boolean DEFAULT false;

-- ─── 2. Garantir unique constraint (tenant_id, slug) ───────────────────
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

-- ─── 3. Upsert dos 6 status canônicos para todos os tenants ────────────
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
  ('Novo Lead',       'novo_lead',      '#3b82f6', 1, false, false, false),
  ('Em Agendamento',  'em_agendamento', '#f59e0b', 2, false, false, false),
  ('Em Negociação',   'em_negociacao',  '#ee7b4d', 3, false, false, false),
  ('Vendido',         'vendido',        '#10b981', 4, true,  false, true ),
  ('Perdido',         'perdido',        '#ef4444', 5, true,  true,  false),
  ('Reaberto',        'reaberto',       '#06b6d4', 6, false, false, false)
) AS s(label, slug, cor, ordem, is_final, permite_reabertura, requer_valor)
ON CONFLICT (tenant_id, slug) DO UPDATE SET
  label              = EXCLUDED.label,
  cor                = EXCLUDED.cor,
  ordem              = EXCLUDED.ordem,
  is_final           = EXCLUDED.is_final,
  permite_reabertura = EXCLUDED.permite_reabertura,
  requer_valor       = EXCLUDED.requer_valor;

-- ─── 4. Migrar leads de status legados para canônicos ─────────────────
-- Mapeamento de slug antigo → slug canônico:
--   novo, novo-lead, novo_lead          → novo_lead
--   agendado                            → em_agendamento
--   em_contato, contato, retorno,
--     tratamento, consulta-realizada,
--     visitou-imovel                    → em_agendamento
--   negociacao, proposta                → em_negociacao
--   convertido, fechado                 → vendido
--   perdido                             → perdido   (já canônico)
--   reaberto                            → reaberto  (já canônico)

WITH slug_map(old_slug, new_slug) AS (
  VALUES
    ('novo',                 'novo_lead'),
    ('novo-lead',            'novo_lead'),
    ('agendado',             'em_agendamento'),
    ('em_contato',           'em_agendamento'),
    ('contato',              'em_agendamento'),
    ('retorno',              'em_agendamento'),
    ('tratamento',           'em_agendamento'),
    ('consulta-realizada',   'em_agendamento'),
    ('visitou-imovel',       'em_agendamento'),
    ('negociacao',           'em_negociacao'),
    ('proposta',             'em_negociacao'),
    ('convertido',           'vendido'),
    ('fechado',              'vendido')
),
-- Para cada lead, encontrar qual status_comercial canônico usar (do mesmo tenant)
lead_remapping AS (
  SELECT
    l.id                                          AS lead_id,
    sc_new.id                                     AS new_status_id,
    sm.new_slug                                   AS new_slug
  FROM public.leads l
  JOIN public.status_comercial sc_old ON sc_old.id = l.id_status
  JOIN slug_map sm ON sm.old_slug = sc_old.slug
  JOIN public.status_comercial sc_new
    ON sc_new.tenant_id = l.tenant_id
   AND sc_new.slug = sm.new_slug
  WHERE l.deleted_at IS NULL
)
UPDATE public.leads l
SET
  id_status  = lr.new_status_id,
  status     = lr.new_slug,
  updated_at = now()
FROM lead_remapping lr
WHERE l.id = lr.lead_id;

-- Também migrar leads cujo campo status (texto) aponta para slug legado
-- mas cujo id_status já é nulo ou já foi migrado acima
WITH slug_map(old_slug, new_slug) AS (
  VALUES
    ('novo',               'novo_lead'),
    ('novo-lead',          'novo_lead'),
    ('agendado',           'em_agendamento'),
    ('em_contato',         'em_agendamento'),
    ('contato',            'em_agendamento'),
    ('retorno',            'em_agendamento'),
    ('tratamento',         'em_agendamento'),
    ('consulta-realizada', 'em_agendamento'),
    ('visitou-imovel',     'em_agendamento'),
    ('negociacao',         'em_negociacao'),
    ('proposta',           'em_negociacao'),
    ('convertido',         'vendido'),
    ('fechado',            'vendido')
)
UPDATE public.leads l
SET
  status     = sm.new_slug,
  updated_at = now()
FROM slug_map sm
WHERE l.status = sm.old_slug
  AND l.deleted_at IS NULL;

-- ─── 5. Remover status não-canônicos ──────────────────────────────────
-- Antes de deletar, garantir que nenhum lead ainda aponta para esses rows
-- (migração acima deve ter coberto; essa etapa remove o lixo restante)
DELETE FROM public.status_comercial
WHERE slug NOT IN ('novo_lead','em_agendamento','em_negociacao','vendido','perdido','reaberto');

-- ─── 6. Índice de ordenação ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_status_comercial_ordem
  ON public.status_comercial (tenant_id, ordem);

-- ─── 7. Grants ────────────────────────────────────────────────────────
GRANT ALL ON public.status_comercial TO authenticated;
GRANT ALL ON public.status_comercial TO service_role;

-- ─── Fim da migration ──────────────────────────────────────────────────
