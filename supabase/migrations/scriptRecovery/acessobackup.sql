-- Listar todas as tabelas de backup
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE '%backup%'
ORDER BY tablename;

-- Ver dados do backup de usuários
SELECT * FROM usuarios_backup_20260205 LIMIT 5;



-- se der erro
-- Listar todas as tabelas de backup
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE '%backup%'
ORDER BY tablename;

-- Ver dados do backup de usuários
SELECT * FROM usuarios_backup_20260205 LIMIT 5;