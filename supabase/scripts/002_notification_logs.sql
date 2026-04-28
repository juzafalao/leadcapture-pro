-- ============================================================
-- MIGRAÇÃO: notification_logs
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id          uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id   uuid,
  lead_id     uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  tipo        text NOT NULL,
  status      text NOT NULL,
  destinatario text,
  erro        text,
  tentativas  int  DEFAULT 1,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant_date
  ON public.notification_logs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_lead
  ON public.notification_logs(lead_id);

-- Row Level Security
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.notification_logs
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.usuarios WHERE auth_id = auth.uid()
    )
  );
