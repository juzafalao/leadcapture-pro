// Polyfill navigator.locks for environments that don't support it
// Prevents Supabase GoTrueClient LockManager timeout on Vercel cold starts
if (typeof navigator !== 'undefined' && !navigator.locks) {
  navigator.locks = {
    request: async (_name, cb) => {
      const release = () => {};
      return cb({ name: _name, mode: 'exclusive', release });
    },
  };
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { analytics } from './lib/analytics'

// Inicializar analytics
analytics.init();

// Render sem StrictMode (evita execuções duplas)
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)