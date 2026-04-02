// Polyfill navigator.locks — Supabase GoTrueClient precisa disso no Vercel
if (typeof navigator !== 'undefined' && !navigator.locks) {
  navigator.locks = {
    request: async (_name, cb) => {
      const release = () => {}
      return cb({ name: _name, mode: 'exclusive', release })
    },
  }
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
