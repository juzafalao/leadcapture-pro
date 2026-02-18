-- ============================================================
-- Tabela: leads_sistema
-- Descrição: Leads interessados em COMPRAR o sistema LeadCapture Pro
-- ============================================================

CREATE TABLE IF NOT EXISTS leads_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  companhia TEXT,
  cidade TEXT,
  estado TEXT,
  observacao TEXT,
  fonte TEXT DEFAULT 'website',
  status TEXT DEFAULT 'novo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_sistema_email ON leads_sistema(email);
CREATE INDEX IF NOT EXISTS idx_leads_sistema_status ON leads_sistema(status);
CREATE INDEX IF NOT EXISTS idx_leads_sistema_created ON leads_sistema(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_leads_sistema_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leads_sistema_updated_at
  BEFORE UPDATE ON leads_sistema
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_sistema_updated_at();

-- Comentários
COMMENT ON TABLE leads_sistema IS 'Leads interessados em comprar o LeadCapture Pro (nossos clientes potenciais)';
