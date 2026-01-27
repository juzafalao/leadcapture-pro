import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn("Aviso: Variáveis de ambiente do Supabase não detectadas. Verifique seu arquivo .env")
}

export const supabase = createClient(
  supabaseUrl || 'https://krcybmownrpfjvqhacup.supabase.co', 
  supabaseKey || 'sb_publishable_Og18wrLgJWFj13FI37SeNg_h9WqYzvq'
 )
