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
        detectSessionInUrl: true,
        storageKey: 'sb-leadcapture-auth',
        flowType: 'pkce',
        // Fix: Navigator LockManager timeout on Vercel cold starts
        // Disable lock to prevent "timed out waiting 10000ms" error
        lock: {
          enabled: false,
        },
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
