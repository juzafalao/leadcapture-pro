import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Bot, UserCheck, Clock, ChevronDown, ChevronUp,
  Flame, Thermometer, Snowflake, Phone, RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'


const TEMP_CONFIG = {
  QUENTE: { label: 'Quente', color: '#EF4444', bg: '#EF444418', Icon: Flame },
  MORNO:  { label: 'Morno',  color: '#F59E0B', bg: '#F59E0B18', Icon: Thermometer },
  FRIO:   { label: 'Frio',   color: '#60A5FA', bg: '#60A5FA18', Icon: Snowflake },
}

function fmtDt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function fmtCapital(val) {
  if (!val) return null
  return `R$ ${Number(val).toLocaleString('pt-BR')}`
}

// ── Card de Handoff ──────────────────────────────────────────
function HandoffCard({ conversa }) {
  const [expanded, setExpanded] = useState(false)
  const resumo = conversa.resumo || {}
  const temp = TEMP_CONFIG[resumo.temperatura] || TEMP_CONFIG.MORNO
  const TempIcon = temp.Icon
  const capital = fmtCapital(resumo.capital_estimado)
  const msgCount = (conversa.historico || []).filter(h => h.role === 'user').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0F172A] border border-[#10B981]/20 rounded-2xl overflow-hidden"
    >
      <button
        className="w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* temperatura badge */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: temp.bg }}>
              <TempIcon className="w-4 h-4" style={{ color: temp.color }} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[13px] font-bold text-white">
                  {resumo.nome || conversa.telefone}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: temp.bg, color: temp.color }}>
                  {temp.label}
                </span>
                {capital && (
                  <span className="text-[10px] font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                    {capital}
                  </span>
                )}
              </div>

              {resumo.resumo_consultor && (
                <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                  {resumo.resumo_consultor}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {conversa.telefone && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-600">
                    <Phone className="w-3 h-3" /> {conversa.telefone}
                  </span>
                )}
                {(resumo.cidade || resumo.estado) && (
                  <span className="text-[10px] text-gray-600">
                    📍 {[resumo.cidade, resumo.estado].filter(Boolean).join(' — ')}
                  </span>
                )}
                {resumo.prazo && (
                  <span className="text-[10px] text-gray-600">
                    ⏱ {resumo.prazo}
                  </span>
                )}
                <span className="text-[10px] text-gray-700">{msgCount} msg · {fmtDt(conversa.atualizado_em)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">
              Handoff
            </span>
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" />
              : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.05] px-5 py-4 space-y-4">
              {/* Resumo completo */}
              {resumo.motivacao && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Motivação</p>
                  <p className="text-[12px] text-gray-300">{resumo.motivacao}</p>
                </div>
              )}
              {resumo.perfil && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Perfil</p>
                  <p className="text-[12px] text-gray-300">{resumo.perfil}</p>
                </div>
              )}
              {resumo.capital && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Capital (dito pelo lead)</p>
                  <p className="text-[12px] text-gray-300">{resumo.capital}</p>
                </div>
              )}

              {/* Histórico da conversa */}
              {conversa.historico?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2">Conversa</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {conversa.historico.map((h, idx) => {
                      if (h.role === 'system') return null
                      const isUser = h.role === 'user'
                      const text = typeof h.content === 'string'
                        ? h.content
                        : (h.content || []).find(b => b.type === 'text')?.text || '[ação automática]'
                      return (
                        <div key={idx} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                            isUser
                              ? 'bg-white/[0.06] text-gray-300'
                              : 'bg-[#10B981]/10 text-[#10B981]'
                          }`}>
                            {text}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Card de conversa ativa (simplificado) ───────────────────
function ConversaAtivaCard({ conversa }) {
  const last = (conversa.historico || []).filter(h => h.role === 'user').at(-1)?.content || '—'
  const msgCount = (conversa.historico || []).filter(h => h.role === 'user').length

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-white truncate">{conversa.telefone}</p>
        <p className="text-[10px] text-gray-600 truncate">{typeof last === 'string' ? last.slice(0, 70) : '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[10px] text-gray-600">{msgCount} msg</p>
        <p className="text-[10px] text-gray-700">{fmtDt(conversa.atualizado_em)}</p>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function WhatsAppPage() {
  const { usuario } = useAuth()
  const [conversas,  setConversas]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const tenantId = usuario?.tenant_id || usuario?.tenant?.id

  const carregar = useCallback(async () => {
    if (!tenantId) { setLoading(false); return }
    try {
      const { data } = await supabase
        .from('agente_conversas')
        .select('id, telefone, status, criado_em, atualizado_em, historico, resumo, lead_id')
        .eq('tenant_id', tenantId)
        .order('atualizado_em', { ascending: false })
        .limit(50)
      setConversas(data || [])
    } catch {
      setConversas([])
    }
    setLoading(false)
    setRefreshing(false)
  }, [tenantId])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    if (!tenantId) return
    const channel = supabase
      .channel('agente-conversas-watcher')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'agente_conversas',
        filter: `tenant_id=eq.${tenantId}`,
      }, () => carregar())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tenantId, carregar])

  const handoffs  = conversas.filter(c => c.status === 'handoff')
  const ativas    = conversas.filter(c => c.status === 'ativa')
  const encerradas = conversas.filter(c => c.status === 'encerrada')

  function handleRefresh() {
    setRefreshing(true)
    carregar()
  }

  return (
    <div className="min-h-full bg-[#0B1220] px-4 lg:px-10 py-6 lg:py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#25D36618]">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">Handoff Inteligente — resumos do Agente Z</p>
            </div>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 mt-1">
            H A N D O F F &nbsp; I N T E L I G E N T E
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 border border-white/5">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Handoffs',  valor: handoffs.length,   cor: 'text-[#10B981]', border: 'border-[#10B981]/20' },
          { label: 'Em andamento', valor: ativas.length,  cor: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
          { label: 'Encerradas', valor: encerradas.length, cor: 'text-gray-400', border: 'border-white/5' },
        ].map((m, i) => (
          <div key={i} className={`bg-[#0F172A] border ${m.border} rounded-2xl p-4`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">{m.label}</p>
            <p className={`text-3xl font-black ${m.cor}`}>{loading ? '—' : m.valor}</p>
          </div>
        ))}
      </div>

      {/* Handoffs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="w-4 h-4 text-[#10B981]" />
          <h2 className="text-sm font-bold text-white">Handoffs do Agente Z</h2>
          {handoffs.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">
              {handoffs.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-gray-600 text-sm">Carregando...</p>
          </div>
        ) : handoffs.length === 0 ? (
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-10 text-center">
            <Bot className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-bold mb-1">Nenhum handoff ainda</p>
            <p className="text-gray-700 text-xs max-w-xs mx-auto">
              Quando o Agente Z qualificar um lead e acionar o handoff, o resumo completo aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {handoffs.map(c => <HandoffCard key={c.id} conversa={c} />)}
          </div>
        )}
      </div>

      {/* Conversas ativas */}
      {ativas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-sm font-bold text-white">Em andamento</h2>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">
              {ativas.length}
            </span>
          </div>
          <div className="space-y-2">
            {ativas.map(c => <ConversaAtivaCard key={c.id} conversa={c} />)}
          </div>
        </div>
      )}

    </div>
  )
}
