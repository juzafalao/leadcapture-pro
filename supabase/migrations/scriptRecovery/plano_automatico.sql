-- ============================================
-- IMPLEMENTAÇÃO MULTI-TENANT COM BACKUP
-- Free Plan Compatible - 2026-02-05
-- ============================================

-- ============================================
-- PARTE 1: BACKUPS AUTOMÁTICOS
-- ============================================

-- Backup da tabela usuarios
CREATE TABLE IF NOT EXISTS usuarios_backup_20260205 AS 
SELECT * FROM usuarios;

-- Backup da tabela tenants
CREATE TABLE IF NOT EXISTS tenants_backup_20260205 AS 
SELECT * FROM tenants;

-- Verificar backups criados
SELECT 
  'BACKUP CRIADO ✅' as status,
  (SELECT COUNT(*) FROM usuarios_backup_20260205) as usuarios_backup,
  (SELECT COUNT(*) FROM tenants_backup_20260205) as tenants_backup;

-- ============================================
-- PARTE 2: ADICIONAR COLUNA is_super_admin
-- ============================================

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- ============================================
-- PARTE 3: CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_is_super_admin ON usuarios(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant_role ON usuarios(tenant_id, role);

-- ============================================
-- PARTE 4: MARCAR SUPER ADMINS
-- ============================================

UPDATE usuarios 
SET 
  is_super_admin = true,
  role = 'Administrador'
WHERE email IN (
  'leadcaptureadm@gmail.com',
  'juzafalao@gmail.com'
);

-- ============================================
-- PARTE 5: VERIFICAÇÕES FINAIS
-- ============================================

-- Deve retornar 2 super admins
SELECT 
  id, 
  nome, 
  email, 
  role, 
  is_super_admin, 
  tenant_id,
  ativo
FROM usuarios 
WHERE is_super_admin = true
ORDER BY email;

-- Relatório completo
SELECT 
  'IMPLEMENTAÇÃO CONCLUÍDA ✅' as status,
  (SELECT COUNT(*) FROM usuarios_backup_20260205) as backup_usuarios,
  (SELECT COUNT(*) FROM usuarios) as usuarios_atual,
  (SELECT COUNT(*) FROM usuarios WHERE is_super_admin = true) as super_admins,
  CASE 
    WHEN (SELECT COUNT(*) FROM usuarios WHERE is_super_admin = true) = 2 
    THEN '✅ 2 Super Admins configurados'
    ELSE '⚠️ Verificar quantidade de Super Admins'
  END as validacao;