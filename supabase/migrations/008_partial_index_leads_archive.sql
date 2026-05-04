-- Índice parcial: filtra apenas leads ativos (deleted_at IS NULL)
-- Evita full-scan ao consultar por tenant em páginas como Kanban, Pipeline, Analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_active_tenant
  ON leads (tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Tabela de arquivo para leads muito antigos (opcional — executar manualmente quando necessário)
-- Para mover leads > 2 anos para arquivo e reduzir tamanho da tabela principal:
--
-- CREATE TABLE IF NOT EXISTS leads_archive (LIKE leads INCLUDING ALL);
--
-- INSERT INTO leads_archive
-- SELECT * FROM leads
-- WHERE deleted_at IS NOT NULL
--   AND deleted_at < NOW() - INTERVAL '2 years';
--
-- DELETE FROM leads
-- WHERE deleted_at IS NOT NULL
--   AND deleted_at < NOW() - INTERVAL '2 years';
