-- ============================================================
-- 003_agente_configs.sql
-- Configuração do Agente IA por tenant (multi-tenant)
-- LeadCapture Pro · Zafalão Tech
-- ============================================================

-- Tabela de configuração do agente IA por tenant
CREATE TABLE IF NOT EXISTS agente_configs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  habilitado      BOOLEAN NOT NULL DEFAULT false,
  nome_agente     TEXT NOT NULL DEFAULT 'Lia',
  segmento        TEXT NOT NULL DEFAULT 'franquias',
  pitch_principal TEXT DEFAULT '',
  capital_minimo  INTEGER DEFAULT 0,
  max_turns       INTEGER DEFAULT 14,
  prompt_extra    TEXT DEFAULT '',  -- instruções adicionais para o system prompt
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE agente_configs ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode ler/escrever (backend usa service key)
DROP POLICY IF EXISTS "service_role_all" ON agente_configs;
CREATE POLICY "service_role_all" ON agente_configs
  USING (true) WITH CHECK (true);

-- Seed: tenant piloto já habilitado com Lia
INSERT INTO agente_configs (tenant_id, habilitado, nome_agente, segmento, capital_minimo)
VALUES ('dd9aa5df-2bbc-44a7-acdd-bda7e79bde7f', true, 'Lia', 'franquias', 80000)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================
-- Tabela de conversas do agente IA (cria se não existir)
-- ============================================================
CREATE TABLE IF NOT EXISTS agente_conversas (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id     UUID NOT NULL,
  lead_id       UUID REFERENCES leads(id) ON DELETE SET NULL,
  telefone      TEXT NOT NULL,
  historico     JSONB NOT NULL DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'handoff', 'encerrada')),
  resumo        JSONB,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agente_conversas_telefone_tenant ON agente_conversas(telefone, tenant_id);
CREATE INDEX IF NOT EXISTS idx_agente_conversas_status ON agente_conversas(status);
