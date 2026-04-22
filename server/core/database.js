// ============================================================
// CORE — Módulo de Banco de Dados
// Singleton do cliente Supabase com service role
// LeadCapture Pro — Zafalão Tech
// ============================================================

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-key'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export default supabase
