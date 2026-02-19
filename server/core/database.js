// ============================================================
// CORE — Módulo de Banco de Dados
// Singleton do cliente Supabase com service role
// ============================================================

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.SUPABASE_URL) {
  throw new Error('Variável de ambiente SUPABASE_URL não definida')
}
if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Variável de ambiente SUPABASE_SERVICE_KEY não definida')
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

console.log('[Core/Database] Supabase inicializado com sucesso')

export default supabase
