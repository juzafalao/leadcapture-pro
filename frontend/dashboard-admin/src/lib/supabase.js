import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL ou ANON_KEY não configurados no .env');
}

let supabaseInstance = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'sb-leadcapture-auth',
        flowType: 'pkce',
        lock: { enabled: false },   // Prevents cold-start timeout on Vercel
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'leadcapture-pro-dashboard',
        },
      },
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();
