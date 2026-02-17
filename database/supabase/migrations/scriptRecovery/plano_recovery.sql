-- ============================================
-- BACKUP COMPLETO - PLANO FREE
-- Execute ANTES de qualquer alteração!
-- ============================================

-- 1. Backup da tabela USUARIOS
CREATE TABLE IF NOT EXISTS usuarios_backup_20260205 AS 
SELECT * FROM usuarios;

-- 2. Backup da tabela TENANTS
CREATE TABLE IF NOT EXISTS tenants_backup_20260205 AS 
SELECT * FROM tenants;

-- 3. Backup da tabela MARCAS (se existir)
CREATE TABLE IF NOT EXISTS marcas_backup_20260205 AS 
SELECT * FROM marcas;

-- 4. Backup da tabela SEGMENTOS (se existir)
CREATE TABLE IF NOT EXISTS segmentos_backup_20260205 AS 
SELECT * FROM segmentos;

-- 5. Backup da tabela LEADS (se existir e tiver dados)
CREATE TABLE IF NOT EXISTS leads_backup_20260205 AS 
SELECT * FROM leads;

-- ============================================
-- VERIFICAR BACKUPS CRIADOS
-- ============================================

SELECT 
  'usuarios' as tabela,
  (SELECT COUNT(*) FROM usuarios) as original,
  (SELECT COUNT(*) FROM usuarios_backup_20260205) as backup
UNION ALL
SELECT 
  'tenants',
  (SELECT COUNT(*) FROM tenants),
  (SELECT COUNT(*) FROM tenants_backup_20260205)
UNION ALL
SELECT 
  'marcas',
  (SELECT COUNT(*) FROM marcas),
  (SELECT COUNT(*) FROM marcas_backup_20260205)
UNION ALL
SELECT 
  'segmentos',
  (SELECT COUNT(*) FROM segmentos),
  (SELECT COUNT(*) FROM segmentos_backup_20260205);

-- ✅ Deve retornar contagem igual em original vs backup