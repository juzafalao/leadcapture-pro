// ============================================================
// sentry.js — Monitoramento de Erros em Produção
// LeadCapture Pro — Zafalão Tech
//
// O que captura automaticamente:
// - Erros JavaScript não tratados
// - Erros em componentes React (ErrorBoundary)
// - Chamadas de rede com falha
// - Performance de carregamento de páginas
//
// Para ver os erros: https://sentry.io → projeto leadcapture-pro
// ============================================================

import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN || 'https://3e7a25624d64314bab4480792ff264b7@o4511151526772736.ingest.us.sentry.io/4511151533457408'

export function initSentry() {
  // Só inicializa se a DSN estiver configurada
  if (!DSN) return

  Sentry.init({
    dsn: DSN,
    environment: 'production',
    release: 'leadcapture-pro@1.9.0',

    // Captura 10% das sessões para performance (não sobrecarrega a cota)
    tracesSampleRate: 0.1,

    // Ignora erros que não são nossos
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'Network request failed',
      'Load failed',
      'ChunkLoadError',         // cache busting normal
      'NavigationDuplicated',   // react-router duplicado
    ],

    // Contexto extra em cada erro
    beforeSend(event) {
      // Remove dados sensíveis antes de enviar
      if (event.request?.cookies) delete event.request.cookies
      if (event.user?.email) event.user.email = '[filtrado]'
      return event
    },
  })
}

// Identifica o usuário logado nos reports de erro
export function setSentryUser(usuario) {
  if (!DSN || !usuario) return
  Sentry.setUser({
    id:       usuario.id,
    username: usuario.nome,
    role:     usuario.role,
    tenant:   usuario.tenant_id,
    // email propositalmente omitido por privacidade
  })
}

// Limpa o usuário ao fazer logout
export function clearSentryUser() {
  if (!DSN) return
  Sentry.setUser(null)
}

// Captura erro manual com contexto extra
export function captureErro(erro, contexto = {}) {
  if (!DSN) {
    console.error('[Erro capturado]', erro, contexto)
    return
  }
  Sentry.withScope(scope => {
    Object.entries(contexto).forEach(([k, v]) => scope.setExtra(k, v))
    Sentry.captureException(erro)
  })
}

// ErrorBoundary pronto para usar em qualquer componente
export const SentryErrorBoundary = Sentry.ErrorBoundary
