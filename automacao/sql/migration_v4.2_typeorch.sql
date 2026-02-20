-- ============================================================
-- MIGRATION v4.2 — Campo typeOrch + colunas leads_sistema
-- LeadCapture Pro — Desenvolvido por Zafalão Tech
-- ============================================================
-- Execute este script no SQL Editor do Supabase (uma vez apenas).
-- Todas as operações usam IF NOT EXISTS — seguro para re-executar.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. TABELA: leads
--    Adiciona typeOrch para distinguir origem:
--    'produto' = franquia/cliente  |  'sistema' = LeadCapture Pro prospect
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS typeOrch TEXT DEFAULT 'produto';

-- Retroativamente marca todos os leads existentes como 'produto'
UPDATE public.leads SET typeOrch = 'produto' WHERE typeOrch IS NULL;

COMMENT ON COLUMN public.leads.typeOrch IS
  'Tipo de orquestração: produto = lead de franquia/cliente | sistema = prospect do LeadCapture Pro';


-- ─────────────────────────────────────────────────────────────
-- 2. TABELA: leads_sistema
--    Adiciona colunas necessárias para o fluxo N8N e dashboard
-- ─────────────────────────────────────────────────────────────

-- Campo de orquestração (sempre 'sistema' nesta tabela)
ALTER TABLE public.leads_sistema
  ADD COLUMN IF NOT EXISTS typeOrch TEXT DEFAULT 'sistema';

UPDATE public.leads_sistema SET typeOrch = 'sistema' WHERE typeOrch IS NULL;

-- Score calculado pelo N8N (baseado em completude do formulário)
ALTER TABLE public.leads_sistema
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

-- Categoria derivada do score: hot / warm / cold
ALTER TABLE public.leads_sistema
  ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'cold';

-- Notas internas do time comercial (separadas da mensagem original do prospect)
-- A coluna 'observacao' existente = mensagem enviada pelo prospect no formulário
-- Esta nova coluna = anotações internas da equipe de vendas
ALTER TABLE public.leads_sistema
  ADD COLUMN IF NOT EXISTS observacao_interna TEXT;

COMMENT ON COLUMN public.leads_sistema.observacao IS
  'Mensagem original enviada pelo prospect via formulário (NÃO editar)';

COMMENT ON COLUMN public.leads_sistema.observacao_interna IS
  'Notas internas do time comercial sobre este prospect (editável no dashboard)';

COMMENT ON COLUMN public.leads_sistema.typeOrch IS
  'Sempre sistema — prospect do produto LeadCapture Pro';

COMMENT ON COLUMN public.leads_sistema.score IS
  'Score calculado pelo N8N baseado em completude e qualidade dos dados';

COMMENT ON COLUMN public.leads_sistema.categoria IS
  'Categoria derivada do score: hot (>=70) | warm (>=50) | cold (<50)';


-- ─────────────────────────────────────────────────────────────
-- 3. VERIFICAÇÃO — consulta para confirmar as colunas
-- ─────────────────────────────────────────────────────────────
SELECT 'leads' AS tabela, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name = 'typeOrch'

UNION ALL

SELECT 'leads_sistema' AS tabela, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads_sistema'
  AND column_name IN ('typeOrch', 'score', 'categoria', 'observacao_interna')

ORDER BY tabela, column_name;

-- ─────────────────────────────────────────────────────────────
-- Resultado esperado:
-- leads          | typeOrch           | text    | 'produto'
-- leads_sistema  | categoria          | text    | 'cold'
-- leads_sistema  | observacao_interna | text    | null
-- leads_sistema  | score              | integer | 0
-- leads_sistema  | typeOrch           | text    | 'sistema'
-- ─────────────────────────────────────────────────────────────
