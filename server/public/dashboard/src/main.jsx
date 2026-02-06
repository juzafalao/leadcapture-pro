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