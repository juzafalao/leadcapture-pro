-- Tabela para armazenar eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_properties JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES usuarios(id),
  tenant_id UUID REFERENCES tenants(id),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_tenant ON analytics_events(tenant_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);

-- Função para obter métricas do funil
CREATE OR REPLACE FUNCTION get_funnel_metrics(days_ago INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  start_date TIMESTAMP;
BEGIN
  start_date := NOW() - (days_ago || ' days')::INTERVAL;
  
  SELECT jsonb_build_object(
    'period_days', days_ago,
    'landing_views', (
      SELECT COUNT(*) FROM analytics_events 
      WHERE event_type = 'landing_viewed' 
      AND created_at > start_date
    ),
    'signup_started', (
      SELECT COUNT(*) FROM analytics_events 
      WHERE event_type = 'signup_started' 
      AND created_at > start_date
    ),
    'signup_completed', (
      SELECT COUNT(DISTINCT user_id) FROM usuarios 
      WHERE created_at > start_date
    ),
    'first_lead', (
      SELECT COUNT(DISTINCT tenant_id) FROM leads 
      WHERE created_at > start_date
    ),
    'active_7d', (
      SELECT COUNT(DISTINCT user_id) FROM analytics_events 
      WHERE created_at > NOW() - INTERVAL '7 days'
    ),
    'total_leads', (
      SELECT COUNT(*) FROM leads
    ),
    'hot_leads', (
      SELECT COUNT(*) FROM leads WHERE status = 'HOT'
    ),
    'warm_leads', (
      SELECT COUNT(*) FROM leads WHERE status = 'WARM'
    ),
    'cold_leads', (
      SELECT COUNT(*) FROM leads WHERE status = 'COLD'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Política para inserção
CREATE POLICY "Sistema pode inserir eventos"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Política para leitura
CREATE POLICY "Usuários veem seus eventos"
  ON analytics_events FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

COMMENT ON TABLE analytics_events IS 'Armazena eventos de analytics para funil de conversão';
COMMENT ON FUNCTION get_funnel_metrics IS 'Retorna métricas do funil de conversão';