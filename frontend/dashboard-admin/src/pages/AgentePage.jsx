// AgentePage.jsx — Gestão do Agente Z de captação via WhatsApp
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, MessageCircle, UserCheck, Clock, ChevronRight, X, ExternalLink, RefreshCw, Flame, Thermometer, Snowflake, User, DollarSign, MapPin, Calendar, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import { useNavigate } from 'react-router-dom'

const STATUS_CONFIG = {
  ativa:     { label: 'Ativa',      color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  handoff:   { label: 'Handoff',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  encerrada: { label: 'Encerrada',  color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}

const TEMP_CONFIG = {
  QUENTE: { label: 'Quente', icon: Flame,       color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  MORNO:  { label: 'Morno',  icon: Thermometer, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  FRIO:   { label: 'Frio',   icon: Snowflake,   color: '#6366F1', bg: 'rgba(99,102,241,0.1)'  },
}

function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  const now = new Date()
  const diff = now - dt
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function fmtCapital(v) {
  if (!v) return null
  const n = Number(v)
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

function getMsgCount(historico) {
  return (historico || []).filter(h => h.role === 'user').length
}

function getLastUserMsg(historico) {
  const userMsgs = (historico || []).filter(h => h.role === 'user')
  return userMsgs.at(-1)?.content?.slice(0, 80) || '—'
}

// ── Chat History ─────────────────────────────────────────────
function ChatHistory({ historico }) {
  if (!historico?.length) return <p className="text-[11px] text-gray-600 text-center py-6">Sem histórico</p>

  return (
    <div className="flex flex-col gap-2.5 px-1">
      {historico.map((h, idx) => {
        if (h.role === 'system') return null
        const isUser = h.role === 'user'
        const text = typeof h.content === 'string'
          ? h.content
          : (h.content || []).find(b => b.type === 'text')?.text || null
        if (!text) return null
        return (
          <div key={idx} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
              <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-[#8B5CF6]" />
              </div>
            )}
            <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed ${
              isUser
                ? 'bg-white/[0.07] text-gray-200 rounded-br-sm'
                : 'bg-[#8B5CF6]/10 text-gray-300 rounded-bl-sm border border-[#8B5CF6]/15'
            }`}>
              {text}
            </div>
            {isUser && (
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-gray-500" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Resumo Estruturado ───────────────────────────────────────
function ResumoCard({ resumo }) {
  if (!resumo) return (
    <div className="text-[11px] text-gray-600 italic text-center py-4">
      Resumo gerado automaticamente no handoff
    </div>
  )

  const TempIcon = TEMP_CONFIG[resumo.temperatura]?.icon || Thermometer
  const tempColor = TEMP_CONFIG[resumo.temperatura]?.color || '#6B7280'

  const fields = [
    { icon: User,          label: 'Nome',          val: resumo.nome },
    { icon: DollarSign,    label: 'Capital',        val: resumo.capital || (resumo.capital_estimado ? fmtCapital(resumo.capital_estimado) : null) },
    { icon: MapPin,        label: 'Contexto',       val: resumo.contexto_vida },
    { icon: Calendar,      label: 'Urgência',       val: resumo.urgencia },
    { icon: User,          label: 'Decisores',      val: resumo.decisores },
    { icon: AlertTriangle, label: 'Objeções',       val: resumo.objecoes },
    { icon: CheckCircle,   label: 'Próximo passo',  val: resumo.proximo_passo },
  ]

  return (
    <div className="space-y-3">
      {/* Temperatura + tom */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: TEMP_CONFIG[resumo.temperatura]?.bg || 'rgba(107,114,128,0.1)', color: tempColor }}>
          <TempIcon className="w-3 h-3" />
          {TEMP_CONFIG[resumo.temperatura]?.label || resumo.temperatura || '—'}
        </div>
        {resumo.tom_emocional && (
          <span className="text-[10px] text-gray-500 italic">{resumo.tom_emocional}</span>
        )}
      </div>

      {/* Motivação em destaque */}
      {resumo.motivacao && (
        <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.05]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Motivação</p>
          <p className="text-[12px] text-gray-300 leading-relaxed">{resumo.motivacao}</p>
        </div>
      )}

      {/* Campos */}
      <div className="space-y-2">
        {fields.filter(f => f.val).map((f, i) => {
          const Icon = f.icon
          return (
            <div key={i} className="flex gap-2 items-start">
              <Icon className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-gray-600 font-medium">{f.label}: </span>
                <span className="text-[11px] text-gray-300">{f.val}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Detail Panel ─────────────────────────────────────────────
function DetailPanel({ conversa, onClose }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('chat')
  if (!conversa) return null

  const statusCfg = STATUS_CONFIG[conversa.status] || STATUS_CONFIG.encerrada
  const msgs      = getMsgCount(conversa.historico)
  const nomeDisplay = conversa.resumo?.nome || conversa.telefone

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="flex flex-col h-full bg-[#0B1220] border-l border-white/[0.06]"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-white truncate">{nomeDisplay}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{conversa.telefone} · {msgs} mensagens</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lead link */}
      {conversa.lead_id && (
        <button
          onClick={() => navigate(`/pipeline?lead=${conversa.lead_id}`)}
          className="flex items-center justify-between mx-4 mt-3 px-3 py-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl text-[11px] text-[#10B981] hover:bg-[#10B981]/15 transition-colors"
        >
          <span>Ver lead no pipeline</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-4 mt-3 flex-shrink-0">
        {[['chat', 'Conversa'], ['resumo', 'Resumo IA']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              tab === k
                ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tab === 'chat' && <ChatHistory historico={conversa.historico} />}
        {tab === 'resumo' && <ResumoCard resumo={conversa.resumo} />}
      </div>

      {/* Footer metadata */}
      <div className="px-5 py-3 border-t border-white/[0.06] flex-shrink-0 text-[10px] text-gray-600 flex justify-between">
        <span>Início: {new Date(conversa.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        <span>Últ. mensagem: {fmtDate(conversa.atualizado_em)}</span>
      </div>
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function AgentePage() {
  const { usuario }  = useAuth()
  const tenantId     = usuario?.tenant_id || usuario?.tenant?.id
  const [conversas,  setConversas]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filtro,     setFiltro]     = useState('todas')
  const [selected,   setSelected]   = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const agentNome = 'Agente Z' // exibição — em prod pode vir de config

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await supabase
      .from('agente_conversas')
      .select('id, telefone, status, criado_em, atualizado_em, lead_id, historico, resumo')
      .eq('tenant_id', tenantId)
      .order('atualizado_em', { ascending: false })
      .limit(100)
    setConversas(data || [])
    setLastUpdate(new Date())
    setLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  // Realtime
  useEffect(() => {
    if (!tenantId) return
    const ch = supabase
      .channel(`agente-page-${tenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agente_conversas', filter: `tenant_id=eq.${tenantId}` }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [tenantId, load])

  // Métricas
  const stats = {
    ativas:   conversas.filter(c => c.status === 'ativa').length,
    handoff:  conversas.filter(c => c.status === 'handoff').length,
    total:    conversas.length,
    quentes:  conversas.filter(c => c.resumo?.temperatura === 'QUENTE').length,
  }

  const lista = filtro === 'todas'
    ? conversas
    : conversas.filter(c => c.status === filtro)

  return (
    <div className="min-h-full bg-[#0B1220] flex flex-col">

      {/* Header */}
      <div className="px-6 lg:px-10 py-6 border-b border-white/[0.05]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-white">{agentNome}</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">Conversas de captação via WhatsApp</p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {lastUpdate ? `Atualizado ${fmtDate(lastUpdate)}` : 'Atualizar'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Ativas',   val: stats.ativas,  color: '#10B981', icon: MessageCircle },
            { label: 'Handoff',  val: stats.handoff, color: '#F59E0B', icon: UserCheck     },
            { label: 'Total',    val: stats.total,   color: '#8B5CF6', icon: Bot           },
            { label: 'Quentes',  val: stats.quentes, color: '#EF4444', icon: Flame         },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-[#0F172A] border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}18` }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-[20px] font-black text-white leading-none">{s.val}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* List */}
        <div className={`flex flex-col ${selected ? 'hidden lg:flex lg:w-[420px]' : 'flex-1'} border-r border-white/[0.05]`}>

          {/* Filtros */}
          <div className="flex gap-1 px-4 py-3 border-b border-white/[0.05] flex-shrink-0">
            {[
              ['todas',     'Todas'],
              ['ativa',     'Ativas'],
              ['handoff',   'Handoff'],
              ['encerrada', 'Encerradas'],
            ].map(([k, l]) => (
              <button key={k} onClick={() => setFiltro(k)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  filtro === k ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'text-gray-600 hover:text-gray-400'
                }`}>
                {l}
                {k === 'ativa' && stats.ativas > 0 && (
                  <span className="ml-1.5 bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded-full text-[9px]">
                    {stats.ativas}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Conversa list */}
          <div className="flex-1 overflow-y-auto">
            {loading && !conversas.length && (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && lista.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <Bot className="w-10 h-10 text-gray-700 mb-3" />
                <p className="text-[13px] text-gray-500 font-medium">Nenhuma conversa</p>
                <p className="text-[11px] text-gray-700 mt-1">
                  {filtro === 'todas'
                    ? 'Configure o AGENTE_TENANT_ID no servidor para ativar'
                    : `Sem conversas com status "${filtro}"`}
                </p>
              </div>
            )}

            <AnimatePresence>
              {lista.map((c, i) => {
                const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.encerrada
                const tempCfg   = TEMP_CONFIG[c.resumo?.temperatura]
                const nome      = c.resumo?.nome || c.telefone
                const TempIcon  = tempCfg?.icon
                const isSelected = selected?.id === c.id
                const msgs      = getMsgCount(c.historico)

                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(isSelected ? null : c)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.04] text-left transition-colors
                      ${isSelected ? 'bg-[#8B5CF6]/10' : 'hover:bg-white/[0.02]'}`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${statusCfg.color}18`, border: `1px solid ${statusCfg.color}30` }}>
                      <span className="text-[12px] font-bold" style={{ color: statusCfg.color }}>
                        {nome.slice(0, 1).toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-white truncate">{nome}</p>
                        <span className="text-[10px] text-gray-600 flex-shrink-0">{fmtDate(c.atualizado_em)}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{getLastUserMsg(c.historico)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: statusCfg.bg, color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                        {tempCfg && TempIcon && (
                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: tempCfg.bg, color: tempCfg.color }}>
                            <TempIcon className="w-2.5 h-2.5" />
                            {tempCfg.label}
                          </span>
                        )}
                        <span className="text-[9px] text-gray-700">{msgs} msg</span>
                      </div>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-gray-700 flex-shrink-0 mt-1" />
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selected && (
            <div className={`${selected ? 'flex-1' : 'hidden'} lg:flex flex-col min-h-0`}>
              <DetailPanel conversa={selected} onClose={() => setSelected(null)} />
            </div>
          )}
        </AnimatePresence>

        {/* Empty state (no selection, desktop) */}
        {!selected && (
          <div className="hidden lg:flex flex-1 items-center justify-center flex-col gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-[#8B5CF6]/40" />
            </div>
            <p className="text-[13px] text-gray-600">Selecione uma conversa para ver o detalhes</p>
          </div>
        )}
      </div>
    </div>
  )
}
