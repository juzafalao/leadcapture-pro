-- ============================================================
-- 005 — Vendas Sprint v1
-- Adiciona taxa_franquia_padrao/minima na tabela marcas,
-- cria tabela vendas com RLS, e popula Lava Lava.
-- EXECUTE NO SUPABASE SQL EDITOR
-- ============================================================

-- 1. Adiciona colunas de taxa de franquia na tabela marcas (idempotente)
ALTER TABLE marcas
  ADD COLUMN IF NOT EXISTS taxa_franquia_padrao NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS taxa_franquia_minima  NUMERIC(12,2);

-- 2. Popula Lava Lava com valores iniciais
UPDATE marcas
   SET taxa_franquia_padrao = 25000,
       taxa_franquia_minima  = 15000
 WHERE id = '22222222-2222-2222-2222-222222222222';

-- 3. Tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                  UUID NOT NULL REFERENCES leads(id)   ON DELETE CASCADE,
  marca_id                 UUID             REFERENCES marcas(id),
  consultor_id             UUID             REFERENCES usuarios(id),
  taxa_franquia_tabela     NUMERIC(12,2),
  taxa_franquia_negociada  NUMERIC(12,2) NOT NULL,
  data_venda               DATE NOT NULL DEFAULT CURRENT_DATE,
  status                   TEXT NOT NULL DEFAULT 'confirmada'
                             CHECK (status IN ('confirmada','cancelada','em_andamento')),
  observacoes              TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Impede duplicata de venda por lead
CREATE UNIQUE INDEX IF NOT EXISTS vendas_lead_id_uidx ON vendas(lead_id);

-- Índices de performance
CREATE INDEX IF NOT EXISTS vendas_tenant_idx       ON vendas(tenant_id);
CREATE INDEX IF NOT EXISTS vendas_consultor_idx    ON vendas(consultor_id);
CREATE INDEX IF NOT EXISTS vendas_data_venda_idx   ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS vendas_marca_idx        ON vendas(marca_id);

-- 4. RLS
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendas_tenant_isolation ON vendas
  USING (
    tenant_id = (
      SELECT tenant_id FROM usuarios WHERE auth_id = auth.uid() LIMIT 1
    )
  );

-- 5. Trigger de updated_at
CREATE OR REPLACE FUNCTION vendas_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_vendas_updated_at ON vendas;
CREATE TRIGGER trg_vendas_updated_at
  BEFORE UPDATE ON vendas
  FOR EACH ROW EXECUTE FUNCTION vendas_set_updated_at();

-- 6. Popula vendas para leads já convertidos/vendidos da Lava Lava
--    usando taxa_franquia_padrao como valor negociado
INSERT INTO vendas (tenant_id, lead_id, marca_id, consultor_id,
                    taxa_franquia_tabela, taxa_franquia_negociada,
                    data_venda, status)
SELECT
  l.tenant_id,
  l.id,
  l.id_marca,
  l.id_operador_responsavel,
  m.taxa_franquia_padrao,
  m.taxa_franquia_padrao,
  COALESCE(l.updated_at::DATE, l.created_at::DATE, CURRENT_DATE),
  'confirmada'
FROM leads l
LEFT JOIN status_comercial sc ON sc.id = l.id_status
LEFT JOIN marcas m ON m.id = l.id_marca
WHERE l.tenant_id = 'dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f'
  AND l.deleted_at IS NULL
  AND m.taxa_franquia_padrao IS NOT NULL
  AND (
    sc.slug IN ('convertido','vendido')
    OR LOWER(l.status) IN ('convertido','vendido','fechado')
  )
  AND NOT EXISTS (SELECT 1 FROM vendas v WHERE v.lead_id = l.id)
ON CONFLICT (lead_id) DO NOTHING;
