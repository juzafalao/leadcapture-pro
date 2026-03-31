import pg from 'pg';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from 'dotenv';

config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrado no .env');
  console.error('💡 Adicione DATABASE_URL=postgresql://postgres:SENHA@db.REF.supabase.co:5432/postgres no arquivo .env');
  process.exit(1);
}

const { Client } = pg;

const sslRejectUnauthorized = process.env.SSL_REJECT_UNAUTHORIZED !== 'false';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: sslRejectUnauthorized }
});

async function exportarSchema() {
  console.log('🔍 Conectando ao banco...');
  await client.connect();
  console.log('✅ Conectado!\n');

  let saida = '';
  saida += `-- ================================================================\n`;
  saida += `-- DATABASE SCHEMA - LeadCapture Pro\n`;
  saida += `-- Gerado automaticamente em: ${new Date().toISOString()}\n`;
  saida += `-- ================================================================\n\n`;

  // 1. Tabelas e colunas
  console.log('📋 Exportando tabelas e colunas...');
  const { rows: colunas } = await client.query(`
    SELECT 
      t.table_name,
      c.column_name,
      c.data_type,
      c.character_maximum_length,
      c.is_nullable,
      c.column_default,
      c.ordinal_position
    FROM information_schema.tables t
    JOIN information_schema.columns c 
      ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position;
  `);

  // Group columns by table to handle trailing commas correctly
  const tabelasMap = new Map();
  for (const col of colunas) {
    if (!tabelasMap.has(col.table_name)) tabelasMap.set(col.table_name, []);
    tabelasMap.get(col.table_name).push(col);
  }
  for (const [tableName, cols] of tabelasMap) {
    saida += `-- ----------------------------------------------------\n`;
    saida += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
    cols.forEach((col, i) => {
      const tipo = col.character_maximum_length
        ? `${col.data_type}(${col.character_maximum_length})`
        : col.data_type;
      const nullable = col.is_nullable === 'NO' ? ' NOT NULL' : '';
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      const comma = i < cols.length - 1 ? ',' : '';
      saida += `  ${col.column_name} ${tipo}${def}${nullable}${comma}\n`;
    });
    saida += ');\n\n';
  }

  // 2. Foreign Keys
  console.log('🔗 Exportando foreign keys...');
  const { rows: fks } = await client.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table,
      ccu.column_name AS foreign_column,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `);

  saida += `-- ================================================================\n`;
  saida += `-- FOREIGN KEYS\n`;
  saida += `-- ================================================================\n\n`;
  for (const fk of fks) {
    saida += `ALTER TABLE public.${fk.table_name} ADD FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table}(${fk.foreign_column}) ON DELETE ${fk.delete_rule};\n`;
  }

  // 3. Índices
  console.log('📑 Exportando índices...');
  const { rows: indices } = await client.query(`
    SELECT indexname, tablename, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);

  saida += `\n-- ================================================================\n`;
  saida += `-- INDEXES\n`;
  saida += `-- ================================================================\n\n`;
  for (const idx of indices) {
    saida += `${idx.indexdef};\n`;
  }

  // 4. Funções
  console.log('⚙️  Exportando funções...');
  const { rows: funcoes } = await client.query(`
    SELECT routine_name, routine_type, data_type, security_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    ORDER BY routine_name;
  `);

  saida += `\n-- ================================================================\n`;
  saida += `-- FUNCTIONS\n`;
  saida += `-- ================================================================\n`;
  for (const fn of funcoes) {
    saida += `-- ${fn.routine_type}: ${fn.routine_name}() → ${fn.data_type} [${fn.security_type}]\n`;
  }

  const caminho = 'supabase/scripts/DATABASE_SCHEMA.sql';
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, saida, 'utf8');
  console.log(`\n✅ Schema exportado com sucesso: ${caminho}`);
  console.log(`📊 Tabelas: ${tabelasMap.size}`);
  console.log(`🔗 Foreign keys: ${fks.length}`);
  console.log(`📑 Índices: ${indices.length}`);
  console.log(`⚙️  Funções: ${funcoes.length}`);

  await client.end();
}

exportarSchema().catch(err => {
  console.error('❌ Erro ao exportar schema:', err.message);
  console.error('💡 Verifique se DATABASE_URL está configurado corretamente no .env');
  process.exit(1);
});
