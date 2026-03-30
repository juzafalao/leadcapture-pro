import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './AuthContext'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')

const SUGESTOES = [
  'Como abordar um lead cold?',
  'Qual a melhor estrategia para leads com capital abaixo de R$100k?',
  'Como qualificar um lead de academia?',
  'O que perguntar em uma ligacao de prospecção?',
]

function MensagemIA({ texto }) {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-xs font-black text-white">
        AI
      </div>
      <div className="flex-1 bg-[#0F172A] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
        {texto}
      </div>
    </div>
  )
}

function MensagemUsuario({ texto }) {
  return (
    <div className="flex gap-2 items-start justify-end">
      <div className="max-w-[80%] bg-[#10B981]/15 border border-[#10B981]/20 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-gray-200 leading-relaxed">
        {texto}
      </div>
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-xs text-gray-400">
        U
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-xs font-black text-white">
        AI
      </div>
      <div className="bg-[#0F172A] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#10B981]"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ChatBot({ leadContext = null }) {
  const { usuario } = useAuth()
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (aberto && inputRef.current) {
      inputRef.current.focus()
    }
  }, [aberto])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historico, carregando])

  const enviar = async (texto) => {
    const msg = (texto || mensagem).trim()
    if (!msg || carregando) return

    setMensagem('')
    setErro(null)
    setHistorico(h => [...h, { role: 'user', content: msg }])
    setCarregando(true)

    try {
      const res = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          tenant_id: usuario?.tenant_id,
          lead_context: leadContext,
          historico: historico.slice(-6)
        })
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro na resposta')
      }

      setHistorico(h => [...h, { role: 'assistant', content: data.resposta }])
    } catch (err) {
      setErro('Erro ao conectar com a IA. Tente novamente.')
      console.error('[ChatBot]', err.message)
    } finally {
      setCarregando(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const limpar = () => {
    setHistorico([])
    setErro(null)
  }

  return (
    <>
      {/* Botao flutuante */}
      <motion.button
        onClick={() => setAberto(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] shadow-lg flex items-center justify-center text-white"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="Assistente IA"
      >
        <AnimatePresence mode="wait" initial={false}>
          {aberto ? (
            <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </motion.svg>
          )}
        </AnimatePresence>
        {/* Badge verde pulsante quando fechado */}
        {!aberto && (
          <motion.span
            className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#0B1220]"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Painel do chat */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[580px] flex flex-col rounded-3xl bg-[#0B1220] border border-white/8 shadow-2xl overflow-hidden"
            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.1)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-[#0F172A]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                AI
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">Assistente LeadCapture</div>
                <div className="text-xs text-[#10B981] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                  Online · pronto para ajudar
                </div>
              </div>
              {historico.length > 0 && (
                <button onClick={limpar} className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1 rounded">
                  Limpar
                </button>
              )}
            </div>

            {/* Lead context banner */}
            {leadContext && (
              <div className="mx-4 mt-3 px-3 py-2 bg-[#10B981]/8 border border-[#10B981]/15 rounded-xl">
                <div className="text-xs text-[#10B981] font-medium">Contexto ativo</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {leadContext.nome} · Score {leadContext.score ?? '—'} · {leadContext.categoria?.toUpperCase() || 'Sem categoria'}
                </div>
              </div>
            )}

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
              {historico.length === 0 && !carregando ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 text-center py-2">
                    Olá! Sou seu assistente de leads. Como posso ajudar?
                  </p>
                  {SUGESTOES.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => enviar(s)}
                      className="w-full text-left text-xs text-gray-400 bg-[#0F172A] hover:bg-[#1E293B] border border-white/5 hover:border-[#10B981]/30 rounded-xl px-3 py-2.5 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {historico.map((h, i) => (
                    h.role === 'user'
                      ? <MensagemUsuario key={i} texto={h.content} />
                      : <MensagemIA key={i} texto={h.content} />
                  ))}
                  {carregando && <TypingIndicator />}
                  {erro && (
                    <div className="text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                      {erro}
                    </div>
                  )}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              <div className="flex items-end gap-2 bg-[#0F172A] border border-white/8 rounded-2xl px-3 py-2 focus-within:border-[#10B981]/40 transition-colors">
                <textarea
                  ref={inputRef}
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua duvida..."
                  rows={1}
                  disabled={carregando}
                  className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-700 resize-none outline-none leading-relaxed max-h-24 disabled:opacity-50"
                  style={{ scrollbarWidth: 'none' }}
                />
                <button
                  onClick={() => enviar()}
                  disabled={!mensagem.trim() || carregando}
                  className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#10B981] disabled:opacity-30 hover:bg-[#059669] transition-colors flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-700 mt-2">Enter para enviar · Shift+Enter para nova linha</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}