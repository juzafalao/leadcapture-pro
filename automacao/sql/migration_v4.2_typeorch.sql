-- migration_v4.2_typeorch.sql
-- Adicionar colunas faltantes na tabela leads

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS "typeOrch" TEXT;

COMMENT ON COLUMN leads."typeOrch" IS 'Tipo de orquestração do lead';

-- Adicionar colunas faltantes na tabela leads_sistema
ALTER TABLE leads_sistema 
ADD COLUMN IF NOT EXISTS "typeOrch" TEXT,
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Cold',
ADD COLUMN IF NOT EXISTS observacao_interna TEXT;

COMMENT ON COLUMN leads_sistema."typeOrch" IS 'Tipo de orquestração do prospect';
COMMENT ON COLUMN leads_sistema.score IS 'Score do lead (0-100)';
COMMENT ON COLUMN leads_sistema.categoria IS 'Categoria: Hot, Warm, Cold';
COMMENT ON COLUMN leads_sistema.observacao_interna IS 'Notas internas do time comercial (separado da mensagem do prospect)';

-- UPDATE retroativo: copiar observacao existente para observacao_interna
-- Preserva mensagem original do prospect em 'observacao'; copia para campo interno
-- apenas quando ainda não há notas internas registradas
UPDATE leads_sistema 
SET observacao_interna = observacao 
WHERE observacao_interna IS NULL AND observacao IS NOT NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_typeorch ON leads("typeOrch");
CREATE INDEX IF NOT EXISTS idx_leads_sistema_typeorch ON leads_sistema("typeOrch");
CREATE INDEX IF NOT EXISTS idx_leads_sistema_categoria ON leads_sistema(categoria);
CREATE INDEX IF NOT EXISTS idx_leads_sistema_score ON leads_sistema(score);
