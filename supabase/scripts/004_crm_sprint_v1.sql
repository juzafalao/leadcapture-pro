-- ============================================================
-- Migration 004 — CRM Sprint v1
-- LeadCapture Pro · Zafalão Tech
--
-- ATENÇÃO: Execute este script no Supabase SQL Editor.
-- É 100% aditivo — não altera nenhuma tabela existente.
-- Pode ser reexecutado com segurança (usa IF NOT EXISTS).
-- ============================================================

-- ─── 1. TABELA: tarefas ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tarefas (
  id               uuid        DEFAULT gen_random_uuid()       PRIMARY KEY,
  tenant_id        uuid        NOT NULL,
  lead_id          uuid        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  usuario_id       uuid        REFERENCES public.usuarios(id)  ON DELETE SET NULL,
  titulo           text        NOT NULL,
  descricao        text,
  status           text        NOT NULL DEFAULT 'pendente'
                               CHECK (status IN ('pendente', 'concluida', 'cancelada')),
  prioridade       text        NOT NULL DEFAULT 'normal'
                               CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  data_vencimento  timestamptz,
  concluida_em     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- Política: cada usuário vê/edita apenas tarefas do seu tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tarefas' AND policyname = 'tenant_isolation_tarefas'
  ) THEN
    CREATE POLICY tenant_isolation_tarefas ON public.tarefas
      USING (
        tenant_id = (
          SELECT tenant_id FROM public.usuarios
          WHERE auth_id = auth.uid()
          LIMIT 1
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tarefas_lead_id        ON public.tarefas (lead_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_tenant_id      ON public.tarefas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status         ON public.tarefas (status);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_vencimento ON public.tarefas (data_vencimento);

-- ─── 2. TABELA: webhook_configs ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id           uuid      DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    uuid      NOT NULL,
  nome         text      NOT NULL,
  url          text      NOT NULL,
  eventos      text[]    NOT NULL DEFAULT '{}',
  ativo        boolean   NOT NULL DEFAULT true,
  secret_token text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'webhook_configs' AND policyname = 'tenant_isolation_webhook_configs'
  ) THEN
    CREATE POLICY tenant_isolation_webhook_configs ON public.webhook_configs
      USING (
        tenant_id = (
          SELECT tenant_id FROM public.usuarios
          WHERE auth_id = auth.uid()
          LIMIT 1
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhook_configs_tenant_id ON public.webhook_configs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_ativo     ON public.webhook_configs (ativo);

-- ─── 3. Grants (Supabase padrão) ─────────────────────────────
GRANT ALL ON public.tarefas         TO authenticated;
GRANT ALL ON public.tarefas         TO service_role;
GRANT ALL ON public.webhook_configs TO authenticated;
GRANT ALL ON public.webhook_configs TO service_role;
