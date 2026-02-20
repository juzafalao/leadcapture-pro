ALTER TABLE leads_sistema 
ADD COLUMN IF NOT EXISTS observacao_interna TEXT;

UPDATE leads_sistema 
SET observacao_interna = observacao 
WHERE observacao_interna IS NULL AND observacao IS NOT NULL;

COMMENT ON COLUMN leads_sistema.observacao_interna 
IS 'Notas internas CRM (separado da mensagem do prospect)';

ALTER TABLE leads ADD COLUMN IF NOT EXISTS "typeOrch" TEXT;
ALTER TABLE leads_sistema 
ADD COLUMN IF NOT EXISTS "typeOrch" TEXT,
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Cold';

CREATE INDEX IF NOT EXISTS idx_leads_sistema_categoria ON leads_sistema(categoria);
CREATE INDEX IF NOT EXISTS idx_leads_sistema_score ON leads_sistema(score);
