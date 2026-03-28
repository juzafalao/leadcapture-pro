// ─── Fix: Polyfill navigator.locks ───────────────────────────
// Supabase GoTrueClient v2 uses navigator.locks.request() internally
// to serialize auth-token mutations across tabs. The `lock` config
// option passed as { enabled: false } is NOT valid — GoTrueClient
// treats any truthy `lock` value as a custom lock function, causing:
//   TypeError: this.lock is not a function
// Solution: polyfill navigator.locks with a no-op BEFORE import,
// and remove the invalid `lock` option entirely.
// ──────────────────────────────────────────────────────────────
if (typeof globalThis !== 'undefined') {
  if (!globalThis.navigator) {
    globalThis.navigator = {};
  }
  if (!globalThis.navigator.locks) {
    globalThis.navigator.locks = {
      request: async (_name, _opts, cb) => {
        const callback = cb || _opts;
        return callback();
      },
    };
  }
}

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