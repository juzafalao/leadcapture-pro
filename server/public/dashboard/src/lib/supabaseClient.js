// dashboard/src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Vite usa import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase config not found. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu .env'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')