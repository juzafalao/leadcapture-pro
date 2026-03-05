// ============================================================
// ErrorBoundary.jsx — Captura erros globais do React
// LeadCapture Pro — Zafalão Tech
//
// Envolve o App inteiro para que um erro em um componente
// não derrube toda a aplicação. Mostra tela amigável com
// opção de recarregar.
// ============================================================

import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0B1220',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          padding: '24px',
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '24px',
            padding: '48px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{
              color: '#F8FAFC',
              fontSize: '24px',
              fontWeight: '300',
              margin: '0 0 8px',
            }}>
              Algo deu <span style={{ color: '#10B981', fontWeight: 'bold' }}>errado</span>
            </h1>
            <p style={{
              color: '#64748B',
              fontSize: '14px',
              margin: '0 0 32px',
              lineHeight: '1.6',
            }}>
              Ocorreu um erro inesperado. Nosso time foi notificado.
              Tente recarregar a página.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '14px 28px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Recarregar página
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#F8FAFC',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '14px 28px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Ir para Dashboard
              </button>
            </div>

            {/* Detalhes técnicos (colapsado) */}
            {this.state.error && (
              <details style={{ marginTop: '32px', textAlign: 'left' }}>
                <summary style={{
                  color: '#475569',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 'bold',
                }}>
                  Detalhes técnicos
                </summary>
                <pre style={{
                  marginTop: '12px',
                  padding: '16px',
                  background: '#0B1220',
                  borderRadius: '12px',
                  color: '#EF4444',
                  fontSize: '11px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <p style={{
              color: '#1E293B',
              fontSize: '9px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginTop: '32px',
            }}>
              LeadCapture Pro · Zafalão Tech
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
