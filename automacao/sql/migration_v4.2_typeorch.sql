-- Migration v4.2: TypeOrch + observacao_interna

-- Adicionar coluna observacao_interna na tabela leads_sistema
ALTER TABLE leads_sistema 
ADD COLUMN IF NOT EXISTS observacao_interna TEXT;

-- Copiar dados existentes de observacao para observacao_interna (migração retroativa)
UPDATE leads_sistema 
SET observacao_interna = observacao 
WHERE observacao_interna IS NULL AND observacao IS NOT NULL;

-- Comentário da coluna
COMMENT ON COLUMN leads_sistema.observacao_interna 
IS 'Notas internas do time comercial (separado da mensagem do prospect)';

-- Adicionar colunas typeOrch se não existirem
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS "typeOrch" TEXT;

ALTER TABLE leads_sistema 
ADD COLUMN IF NOT EXISTS "typeOrch" TEXT,
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Cold';

-- Comentários
COMMENT ON COLUMN leads."typeOrch" IS 'Tipo de orquestração do lead';
COMMENT ON COLUMN leads_sistema."typeOrch" IS 'Tipo de orquestração do prospect';
COMMENT ON COLUMN leads_sistema.score IS 'Score do lead (0-100)';
COMMENT ON COLUMN leads_sistema.categoria IS 'Categoria: Hot, Warm, Cold';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_typeorch ON leads("typeOrch");
CREATE INDEX IF NOT EXISTS idx_leads_sistema_typeorch ON leads_sistema("typeOrch");
CREATE INDEX IF NOT EXISTS idx_leads_sistema_categoria ON leads_sistema(categoria);
CREATE INDEX IF NOT EXISTS idx_leads_sistema_score ON leads_sistema(score);
