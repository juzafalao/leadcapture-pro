// Polyfill navigator.locks — Supabase GoTrueClient precisa disso
// iOS 18.4+ tem navigator.locks nativo mas com bug de timeout (10s)
// Sobrescrevemos sempre com implementação sem timeout
if (typeof navigator !== 'undefined') {
  try {
    navigator.locks = {
      request: async (_name, _opts, cb) => {
        const callback = typeof _opts === 'function' ? _opts : cb
        const release = () => {}
        return callback({ name: _name, mode: 'exclusive', release })
      },
      query: async () => ({ held: [], pending: [] }),
    }
  } catch (_) {}
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { analytics } from './lib/analytics'
import { initSentry } from './lib/sentry'

// Sentry ANTES de qualquer render — captura erros desde o início
initSentry()

// Analytics
analytics.init()

// Render sem StrictMode (evita execuções duplas em dev)
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
