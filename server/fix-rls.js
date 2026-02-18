import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixRLS() {
  console.log('🔧 Configurando permissões...');
  
  // Criar policy de leitura pública para leads_sistema
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Habilitar RLS
      ALTER TABLE leads_sistema ENABLE ROW LEVEL SECURITY;
      
      -- Remover policies antigas (se existirem)
      DROP POLICY IF EXISTS "Leitura pública leads_sistema" ON leads_sistema;
      DROP POLICY IF EXISTS "Inserção pública leads_sistema" ON leads_sistema;
      
      -- Criar policy de leitura pública
      CREATE POLICY "Leitura pública leads_sistema"
        ON leads_sistema
        FOR SELECT
        USING (true);
      
      -- Criar policy de inserção pública
      CREATE POLICY "Inserção pública leads_sistema"
        ON leads_sistema
        FOR INSERT
        WITH CHECK (true);
    `
  });
  
  if (error) {
    console.log('⚠️  Erro ao executar SQL direto:', error.message);
    console.log('\n📋 EXECUTE MANUALMENTE NO SUPABASE:');
    console.log('\n1. Acesse: https://supabase.com/dashboard/project/krcybmownrpfjvqhacup/editor');
    console.log('2. Vá em "SQL Editor"');
    console.log('3. Cole e execute este SQL:\n');
    console.log(`
-- Habilitar RLS
ALTER TABLE leads_sistema ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Leitura pública leads_sistema" ON leads_sistema;
DROP POLICY IF EXISTS "Inserção pública leads_sistema" ON leads_sistema;

-- Criar policy de leitura pública
CREATE POLICY "Leitura pública leads_sistema"
  ON leads_sistema
  FOR SELECT
  USING (true);

-- Criar policy de inserção pública
CREATE POLICY "Inserção pública leads_sistema"
  ON leads_sistema
  FOR INSERT
  WITH CHECK (true);
    `);
  } else {
    console.log('✅ Permissões configuradas com sucesso!');
  }
}

fixRLS();
