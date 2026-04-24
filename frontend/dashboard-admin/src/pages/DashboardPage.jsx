// DashboardPage.jsx — Pipeline de Leads com visual aprimorado
// KPI cards com ícones Lucide, ícones coloridos por fonte, badges de temperatura
import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'
import LeadModal from '../components/leads/LeadModal'
import {
  Users, Flame, DollarSign, CheckCircle, UserX,
  MessageCircle, Globe, Bot, Workflow, Instagram, Facebook,
  UserPlus, Download, RefreshCw, ArrowUpRight,
} from 'lucide-react'

// ─── Formatação de capital ────────────────────────────────
const fmtCapital = (v) => {
  if (!v) return 'R$ 0'
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

// ─── Config de temperatura ───────────────────────────────
const CAT_STYLE = {
  hot:  { bg: 'bg-red-500/10',      ring: 'ring-red-500/30',   text: 'text-red-400',   dot: 'bg-red-500',   label: '🔥 Quente' },
  warm: { bg: 'bg-amber-500/10',    ring: 'ring-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500', label: '☀ Morno' },
  cold: { bg: 'bg-gray-500/[0.08]', ring: 'ring-gray-500/20',  text: 'text-gray-500',  dot: 'bg-gray-600',  label: '❄ Frio' },
}

// ─── Config de fonte / canal ─────────────────────────────
const SOURCE_CONFIG = {
  whatsapp:   { icon: MessageCircle, color: '#25D366', label: 'WhatsApp' },
  website:    { icon: Globe,         color: '#6366F1', label: 'Web' },
  chatbot:    { icon: Bot,           color: '#F59E0B', label: 'Chatbot' },
  n8n:        { icon: Workflow,      color: '#EA580C', label: 'n8n' },
  instagram:  { icon: Instagram,     color: '#E1306C', label: 'Instagram' },
  facebook:   { icon: Facebook,      color: '#1877F2', label: 'Facebook' },
  referral:   { icon: UserPlus,      color: '#10B981', label: 'Indicação' },
  manual:     { icon: UserPlus,      color: '#8B5CF6', label: 'Manual' },
  csv_import: { icon: Download,      color: '#06B6D4', label: 'CSV' },
  webhook:    { icon: Workflow,      color: '#8B5CF6', label: 'Webhook' },
  api:        { icon: Workflow,      color: '#8B5CF6', label: 'API' },
}

// ─── KPI Card aprimorado ─────────────────────────────────
function StatCard({ label, value, sub, Icon, color, borderColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#0F172A] rounded-2xl p-5 flex flex-col gap-2 border"
      style={{ borderColor: borderColor || 'rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-gray-600 leading-tight">{sub}</p>}
    </motion.div>
  )
}

// ─── Ícone de fonte colorido ─────────────────────────────
function SourceBadge({ fonte }) {
  const cfg = SOURCE_CONFIG[fonte?.toLowerCase()] || { icon: Globe, color: '#64748B', label: fonte || '—' }
  const Icon = cfg.icon
  return (
    <div className="flex items-center gap-1.5" title={cfg.label}>
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${cfg.color}18` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
      </div>
      <span className="text-[11px] text-gray-400 hidden xl:block">{cfg.label}</span>
    </div>
  )
}

// ─── Linha do lead ───────────────────────────────────────
function LeadRow({ lead, operadores, podeAtribuir, usuario, onOpenModal, onReload }) {
  const cat   = (lead.categoria || 'cold').toLowerCase()
  const style = CAT_STYLE[cat] || CAT_STYLE.cold
  const [atribuindo, setAtribuindo] = useState(false)

  async function atribuir(opId) {
    setAtribuindo(true)
    try {
      await supabase.from('leads').update({
        id_operador_responsavel: opId,
        operador_id:             opId,
        updated_at:              new Date().toISOString(),
      }).eq('id', lead.id)
      onReload?.()
    } finally { setAtribuindo(false) }
  }

  async function pegarPraMim() {
    if (!usuario?.id) return
    await atribuir(usuario.id)
  }

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-white/[0.04] hover:bg-white/[0.025] group transition-colors cursor-pointer"
      onClick={() => onOpenModal(lead)}
    >
      {/* Lead: indicador de temp + nome */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-1.5 h-10 rounded-full shrink-0 ${style.dot}`}
            style={{ boxShadow: cat === 'hot' ? '0 0 8px #EF444480' : cat === 'warm' ? '0 0 6px #F59E0B60' : 'none' }}
          />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-white truncate group-hover:text-[#10B981] transition-colors">
              {lead.nome}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-0.5">
              {lead.email    && <span className="truncate max-w-[160px]">{lead.email}</span>}
              {lead.telefone && <span className="text-gray-700 shrink-0">{lead.telefone}</span>}
            </div>
          </div>
        </div>
      </td>

      {/* Fonte com ícone colorido */}
      <td className="px-4 py-3.5 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
        <div onClick={() => onOpenModal(lead)}>
          <SourceBadge fonte={lead.fonte} />
        </div>
      </td>

      {/* Marca */}
      <td className="px-4 py-3.5 hidden lg:table-cell">
        {lead.marca ? (
          <span className="text-[11px] text-gray-400 font-medium">{lead.marca.emoji} {lead.marca.nome}</span>
        ) : <span className="text-gray-700 text-[11px]">—</span>}
      </td>

      {/* Capital */}
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className="text-[13px] font-bold text-[#10B981] tabular-nums">{fmtCapital(lead.capital_disponivel)}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <span
          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap"
          style={{
            background: `${lead.status_comercial?.cor || '#6B7280'}20`,
            color:       lead.status_comercial?.cor || '#6B7280',
          }}
        >
          {lead.status_comercial?.label || lead.status || 'novo'}
        </span>
      </td>

      {/* Temperatura + Score */}
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
            {cat === 'hot' ? '🔥' : cat === 'warm' ? '☀' : '❄'}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-10 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${lead.score ?? 0}%`,
                  background: (lead.score || 0) >= 80 ? '#EF4444' : (lead.score || 0) >= 60 ? '#F59E0B' : '#6B7280',
                }}
              />
            </div>
            <span className={`text-[10px] font-black tabular-nums ${style.text}`}>{lead.score ?? 0}</span>
          </div>
        </div>
      </td>

      {/* Atribuir */}
      <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
        {podeAtribuir ? (
          <select
            value={lead.id_operador_responsavel || ''}
            onChange={e => atribuir(e.target.value || null)}
            disabled={atribuindo}
            className="bg-[#0B1220] border border-white/[0.08] rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[#10B981]/50 cursor-pointer hover:border-[#10B981]/30 transition-colors max-w-[140px]"
          >
            <option value="">— atribuir —</option>
            {operadores.map(op => (
              <option key={op.id} value={op.id}>{op.nome}</option>
            ))}
          </select>
        ) : !lead.id_operador_responsavel ? (
          <button
            onClick={pegarPraMim}
            disabled={atribuindo}
            className="px-3 py-1 rounded-lg text-[10px] font-black bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25 transition-all"
          >
            Pegar
          </button>
        ) : (
          <span className="text-[10px] text-gray-600 truncate max-w-[100px] block text-right">
            {lead.operador?.nome?.split(' ')[0] || '—'}
          </span>
        )}
      </td>
    </motion.tr>
  )
}

// ─── Dashboard principal ──────────────────────────────────
export default function DashboardPage() {
  const { usuario } = useAuth()
  const tenantId    = usuario?.is_super_admin ? null : usuario?.tenant_id
  const role        = usuario?.role
  const isAdmin     = ['Administrador', 'admin'].includes(role) || usuario?.is_super_admin
  const isDiretor   = role === 'Diretor' || isAdmin
  const isGestor    = role === 'Gestor'  || isDiretor
  const podeAtribuir = isGestor

  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [filtStatus, setFiltStatus] = useState('')
  const [meusLeads,  setMeusLeads]  = useState(false)
  const [leads,      setLeads]      = useState([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [statusOpts, setStatusOpts] = useState([])
  const [operadores, setOperadores] = useState([])
  const [leadSel,    setLeadSel]    = useState(null)
  const [metrics,    setMetrics]    = useState({
    total: 0, hot: 0, warm: 0, cold: 0, capital: 0, semana: 0, convertidos: 0, sem_dono: 0,
  })

  const PER_PAGE = 25

  useEffect(() => {
    async function load() {
      let q = supabase.from('status_comercial').select('id, label, slug, cor').order('ordem')
      if (tenantId) q = q.eq('tenant_id', tenantId)
      const { data } = await q
      setStatusOpts(data || [])
    }
    load()
  }, [tenantId])

  useEffect(() => {
    if (!podeAtribuir) return
    async function load() {
      let q = supabase.from('usuarios')
        .select('id, nome, role')
        .in('role', ['Consultor', 'Gestor', 'Operador', 'Administrador'])
        .is('deleted_at', null)
        .order('nome')
      if (tenantId) q = q.eq('tenant_id', tenantId)
      const { data } = await q
      setOperadores(data || [])
    }
    load()
  }, [tenantId, podeAtribuir])

  const carregar = useCallback(async () => {
    if (!usuario) return
    setLoading(true); setError('')
    try {
      let q = supabase.from('leads').select(`
        id, tenant_id, nome, email, telefone, cidade, estado,
        capital_disponivel, categoria, score, status, fonte,
        id_operador_responsavel, operador_id, created_at, id_status, id_marca,
        status_comercial:id_status ( id, label, slug, cor ),
        marca:id_marca ( id, nome, emoji ),
        operador:id_operador_responsavel ( id, nome )
      `, { count: 'exact' }).is('deleted_at', null)

      if (tenantId)   q = q.eq('tenant_id', tenantId)
      if (search)     q = q.or(`nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`)
      if (filtStatus) {
        const st = statusOpts.find(s => s.slug === filtStatus)
        if (st) q = q.eq('id_status', st.id)
      }
      if (meusLeads && usuario?.id) q = q.eq('id_operador_responsavel', usuario.id)
      if (!isDiretor && !meusLeads && usuario?.id && role === 'Consultor') {
        q = q.or(`id_operador_responsavel.eq.${usuario.id},id_operador_responsavel.is.null`)
      }

      q = q.order('created_at', { ascending: false })
           .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

      const { data, count, error: err } = await q
      if (err) throw err
      setLeads(data || [])
      setTotal(count || 0)

      const hoje     = new Date()
      const inicio   = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
      const seteDias = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      let qM = supabase.from('leads')
        .select('categoria, capital_disponivel, created_at, status, id_status, id_operador_responsavel, status_comercial:id_status (slug)', { count: 'exact' })
        .is('deleted_at', null)
      if (tenantId) qM = qM.eq('tenant_id', tenantId)
      const { data: ms, count: mc } = await qM.gte('created_at', inicio)

      const getSlug = l => l.status_comercial?.slug?.toLowerCase() || l.status?.toLowerCase() || ''
      const hot     = (ms || []).filter(l => l.categoria === 'hot').length
      const warm    = (ms || []).filter(l => l.categoria === 'warm').length
      const cold    = (ms || []).filter(l => l.categoria === 'cold').length
      const capital = (ms || []).reduce((a, l) => a + parseFloat(l.capital_disponivel || 0), 0)
      const semana  = (ms || []).filter(l => l.created_at >= seteDias).length
      const conv    = (ms || []).filter(l => ['vendido','convertido'].includes(getSlug(l))).length
      const semDono = (ms || []).filter(l => !l.id_operador_responsavel).length

      setMetrics({ total: mc || 0, hot, warm, cold, capital, semana, convertidos: conv, sem_dono: semDono })
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [usuario, tenantId, search, filtStatus, meusLeads, page, statusOpts, role, isDiretor])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    const channelCfg = { event: '*', schema: 'public', table: 'leads' }
    if (tenantId) channelCfg.filter = `tenant_id=eq.${tenantId}`
    const ch = supabase
      .channel(`leads-dash-${tenantId ?? 'all'}`)
      .on('postgres_changes', channelCfg, () => carregar())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [tenantId, carregar])

  const totalPages    = Math.max(1, Math.ceil(total / PER_PAGE))
  const podeVerAtribuir = podeAtribuir || role === 'Consultor'

  return (
    <div className="flex flex-col min-h-full bg-[#0B1220]">

      {/* Cabeçalho da página */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-8 mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-1">
            Pipeline de <span className="text-[#10B981] font-bold">Leads</span>
          </h1>
          <div className="w-16 h-0.5 bg-[#10B981] rounded-full mb-2" />
          <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
            Captação e qualificação em tempo real
          </p>
        </div>

        {/* Badge de status ao vivo */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 self-start lg:self-auto">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs font-semibold text-[#10B981]">Ao vivo</span>
          <span className="text-[10px] text-gray-500">{total} leads</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="px-4 lg:px-10 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Leads no mês"
            value={metrics.total}
            sub={`${metrics.semana} na última semana`}
            Icon={Users}
            color="#3B82F6"
            borderColor="rgba(59,130,246,0.2)"
            delay={0}
          />
          <StatCard
            label="Leads quentes"
            value={metrics.hot}
            sub={`${metrics.warm} mornos · ${metrics.cold} frios`}
            Icon={Flame}
            color="#EF4444"
            borderColor="rgba(239,68,68,0.2)"
            delay={0.08}
          />
          <StatCard
            label="Capital no mês"
            value={fmtCapital(metrics.capital)}
            sub="Potencial total declarado"
            Icon={DollarSign}
            color="#10B981"
            borderColor="rgba(16,185,129,0.25)"
            delay={0.16}
          />
          <StatCard
            label="Convertidos"
            value={metrics.convertidos}
            sub={metrics.sem_dono > 0 ? `${metrics.sem_dono} sem responsável` : 'Todos atribuídos ✓'}
            Icon={metrics.sem_dono > 0 ? UserX : CheckCircle}
            color={metrics.sem_dono > 0 ? '#F59E0B' : '#10B981'}
            borderColor={metrics.sem_dono > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}
            delay={0.24}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="px-4 lg:px-10 pb-8">
        <div className="bg-[#0B1220] border border-white/5 rounded-2xl overflow-hidden">

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 border-b border-white/[0.04]">
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 min-w-[200px] bg-transparent border border-white/[0.06] rounded-xl px-4 py-2 text-[11px] text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/40 transition-colors"
            />
            <select
              value={filtStatus}
              onChange={e => { setFiltStatus(e.target.value); setPage(1) }}
              className="bg-[#0F172A] border border-white/[0.06] rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#10B981]/40"
            >
              <option value="">Todos status</option>
              {statusOpts.map(s => <option key={s.id} value={s.slug}>{s.label}</option>)}
            </select>
            <button
              onClick={() => { setMeusLeads(!meusLeads); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                meusLeads
                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                  : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-gray-300'
              }`}
            >
              Meus leads
            </button>
            <button
              onClick={carregar}
              className="px-3 py-2 rounded-xl text-[11px] font-bold bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-white transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          {/* Cabeçalho da tabela */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-black/20">
                  {[
                    { label: 'Lead',          cls: 'px-5 py-3 min-w-[220px]' },
                    { label: 'Fonte',         cls: 'px-4 py-3 hidden sm:table-cell' },
                    { label: 'Marca',         cls: 'px-4 py-3 hidden lg:table-cell' },
                    { label: 'Capital',       cls: 'px-4 py-3 hidden md:table-cell' },
                    { label: 'Status',        cls: 'px-4 py-3' },
                    { label: 'Temp · Score',  cls: 'px-4 py-3 hidden lg:table-cell' },
                    { label: podeVerAtribuir ? 'Atribuir' : '', cls: 'px-4 py-3 w-[150px] text-right' },
                  ].map((h, i) => (
                    <th key={i} className={`${h.cls} text-left text-[9px] font-black uppercase tracking-[0.2em] text-gray-500`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-20 text-center">
                    <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : error ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <p className="text-red-400 text-sm mb-2">Erro ao carregar leads</p>
                    <p className="text-gray-600 text-[11px]">{error}</p>
                    <button onClick={carregar} className="mt-3 px-4 py-1.5 rounded-xl text-[11px] bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:text-white transition-all">
                      Tentar novamente
                    </button>
                  </td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-700 mb-2">Nenhum lead encontrado</p>
                    <p className="text-gray-600 text-sm">Ajuste os filtros ou aguarde novos leads</p>
                  </td></tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {leads.map(lead => (
                      <LeadRow
                        key={lead.id}
                        lead={lead}
                        operadores={operadores}
                        podeAtribuir={podeAtribuir}
                        usuario={usuario}
                        onOpenModal={setLeadSel}
                        onReload={carregar}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.04]">
              <p className="text-[10px] text-gray-600">
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} de {total} leads
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/[0.04] text-gray-500 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 transition-all"
                >
                  Anterior
                </button>
                <span className="px-3 py-1.5 text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/[0.04] text-gray-500 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 transition-all"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal do lead */}
      {leadSel && (
        <LeadModal
          lead={leadSel}
          onClose={() => { setLeadSel(null); carregar() }}
          tenantName={usuario?.tenant?.name}
        />
      )}
    </div>
  )
}
