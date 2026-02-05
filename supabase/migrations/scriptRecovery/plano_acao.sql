-- ============================================
-- RESTAURAR BACKUP - USUÁRIOS
-- ⚠️ SÓ EXECUTE SE PRECISAR DESFAZER!
-- ============================================

-- 1. Deletar tabela atual (cuidado!)
DROP TABLE IF EXISTS usuarios CASCADE;

-- 2. Restaurar do backup
CREATE TABLE usuarios AS 
SELECT * FROM usuarios_backup_20260205;

-- 3. Recriar constraints e índices importantes
ALTER TABLE usuarios ADD PRIMARY KEY (id);
CREATE INDEX idx_usuarios_tenant ON usuarios(tenant_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- 4. Verificar restauração
SELECT COUNT(*) as total_restaurado FROM usuarios;