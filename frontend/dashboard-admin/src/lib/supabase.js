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
        storageKey: 'leadcapture-pro-auth',
        lock: typeof navigator !== 'undefined' && navigator?.locks?.request
          ? (name, acquireTimeout, fn) => navigator.locks.request(name, fn.bind(null))
          : async (_name, _acquireTimeout, fn) => await fn(null),
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
