// DashboardPage.jsx -- Design System v1.0
// IMPORTANTE: busca dados direto no Supabase, sem depender do useLeads.js
// Evita conflitos de assinatura de hook
import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'
import LeadModal from '../components/leads/LeadModal'

const fmtCapital = (v) => {
  if (!v) return 'R$ 0'
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$${(n/1_000).toFixed(0)}K`
  return `R$${n.toLocaleString('pt-BR')}`
}

const CAT_STYLE = {
  hot:  { bg: 'bg-red-500/10',      ring: 'ring-red-500/20',    text: 'text-red-400',    dot: 'bg-red-400'    },
  warm: { bg: 'bg-amber-500/10',    ring: 'ring-amber-500/20',  text: 'text-amber-400',  dot: 'bg-amber-400'  },
  cold: { bg: 'bg-gray-500/[0.08]', ring: 'ring-gray-500/15',   text: 'text-gray-500',   dot: 'bg-gray-500'   },
}

// -- Linha do lead --
function LeadRow({ lead, onClick }) {
  const cat   = (lead.categoria || 'cold').toLowerCase()
  const style = CAT_STYLE[cat] || CAT_STYLE.cold
  const score = lead.score ?? 0

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={() => onClick(lead)}
      className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer group transition-colors"
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-8 rounded-full ${style.dot} opacity-70 shrink-0`} />
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-white truncate group-hover:text-[#10B981] transition-colors">
              {lead.nome}
            </p>
            <p className="text-[10px] text-gray-600 truncate">
              {lead.email || lead.telefone || lead.cidade || '-'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{ width: `${score}%`, background: score >= 80 ? '#EF4444' : score >= 60 ? '#F59E0B' : '#6B7280' }}
            />
          </div>
          <span className={`text-[10px] font-black tabular-nums ${style.text}`}>{score}</span>
        </div>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ring-1 ${style.bg} ${style.ring} ${style.text}`}>
          {cat}
        </span>
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <span className="text-[11px] font-bold text-[#10B981] tabular-nums">{fmtCapital(lead.capital_disponivel)}</span>
      </td>
      <td className="px-4 py-3.5">
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
          style={{
            background: `${lead.status_comercial?.cor || '#6B7280'}18`,
            color:      lead.status_comercial?.cor || '#6B7280',
          }}
        >
          {lead.status_comercial?.label || lead.status || 'novo'}
        </span>
      </td>
      <td className="px-4 py-3.5 hidden xl:table-cell">
        {lead.marca ? (
          <span className="text-[11px] text-gray-500">{lead.marca.nome}</span>
        ) : <span className="text-gray-700">-</span>}
      </td>
      <td className="px-4 py-3.5 hidden xl:table-cell">
        <span className="text-[11px] text-gray-500 truncate">{lead.operador?.nome || '-'}</span>
      </td>
      <td className="px-4 py-3.5 w-8 text-right">
        <span className="text-gray-700 group-hover:text-gray-400 transition-colors"> </span>
      </td>
    </motion.tr>
  )
}

// -- KPI card --
function KPI({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-[#0B1220] border border-white/[0.06] rounded-xl px-4 py-3.5 min-w-[100px]">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-black tabular-nums leading-none ${color}`}>{value}</p>
    </div>
  )
}

// -- Pagina principal --
export default function DashboardPage() {
  const { usuario } = useAuth()
  const tenantId    = usuario?.is_super_admin ? null : usuario?.tenant_id

  const [page,       setPage]       = useState(1)
  const [filters,    setFilters]    = useState({ search: '', status: '' })
  const [meusLeads,  setMeusLeads]  = useState(false)
  const [leads,      setLeads]      = useState([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [statusOpts, setStatusOpts] = useState([])
  const [leadSel,    setLeadSel]    = useState(null)
  const [metrics,    setMetrics]    = useState({ total: 0, hot: 0, capital: 0, semana: 0 })

  const PER_PAGE = 25

  // Carrega status_comercial
  useEffect(() => {
    async function loadStatus() {
      let q = supabase.from('status_comercial').select('id, label, slug, cor').order('ordem')
      if (tenantId) q = q.eq('tenant_id', tenantId)
      const { data } = await q
      setStatusOpts(data || [])
    }
    loadStatus()
  }, [tenantId])

  // Carrega leads
  const carregar = useCallback(async () => {
    if (!usuario) return
    setLoading(true); setError('')
    try {
      let q = supabase.from('leads').select(`
        id, nome, email, telefone, cidade, estado,
        capital_disponivel, categoria, score, status, fonte,
        id_operador_responsavel, operador_id, created_at,
        status_comercial:id_status ( id, label, slug, cor ),
        marca:id_marca ( id, nome, emoji ),
        operador:id_operador_responsavel ( id, nome )
      `, { count: 'exact' }).is('deleted_at', null)

      if (tenantId) q = q.eq('tenant_id', tenantId)
      if (filters.search) q = q.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`)
      if (filters.status) {
        const st = statusOpts.find(s => s.slug === filters.status)
        if (st) q = q.eq('id_status', st.id)
      }
      if (meusLeads && usuario?.id) q = q.eq('id_operador_responsavel', usuario.id)

      q = q.order('created_at', { ascending: false })
           .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

      const { data, count, error: err } = await q
      if (err) throw err

      setLeads(data || [])
      setTotal(count || 0)

      // Metricas do mes atual
      const hoje   = new Date()
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
      const seteDias = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      let qMet = supabase.from('leads').select('categoria, capital_disponivel, created_at', { count: 'exact' }).is('deleted_at', null)
      if (tenantId) qMet = qMet.eq('tenant_id', tenantId)
      const { data: metData, count: metCount } = await qMet.gte('created_at', inicio)

      const hot     = (metData || []).filter(l => l.categoria === 'hot').length
      const capital = (metData || []).reduce((a, l) => a + parseFloat(l.capital_disponivel || 0), 0)
      const semana  = (metData || []).filter(l => l.created_at >= seteDias).length

      setMetrics({ total: metCount || 0, hot, capital, semana })
    } catch (e) {
      setError(e.message || 'Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }, [usuario, tenantId, filters, meusLeads, page, statusOpts])

  useEffect(() => { carregar() }, [carregar])

  // Realtime -- nova lead
  useEffect(() => {
    if (!tenantId) return
    const channel = supabase
      .channel(`leads-dashboard-${tenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `tenant_id=eq.${tenantId}` }, () => {
        carregar()
      })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [tenantId, carregar])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div className="flex flex-col min-h-full bg-[#0F172A]">
      {/* Header */}
      <div className="px-6 lg:px-10 pt-7 pb-5 border-b border-white/[0.06]">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-light text-white">
              Pipeline de <span className="text-[#10B981] font-bold">Leads</span>
            </h1>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] mt-1">
              captacao e qualificacao em tempo real
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <KPI label="Total mes"   value={metrics.total} />
            <KPI label="Hot"         value={metrics.hot} color="text-red-400" />
            <KPI label="Capital"     value={fmtCapital(metrics.capital)} color="text-[#10B981]" />
            <KPI label="7 dias"      value={metrics.semana} color="text-gray-300" />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 px-6 lg:px-10 py-5">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <input
                type="text"
                placeholder="Buscar lead..."
                value={filters.search || ''}
                onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }}
                className="w-full bg-transparent border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/40 transition-colors"
              />
            </div>
            <select
              value={filters.status || ''}
              onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1) }}
              className="bg-[#080E18] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#10B981]/40"
            >
              <option value="">Todos status</option>
              {statusOpts.map(s => <option key={s.id} value={s.slug}>{s.label}</option>)}
            </select>
            <button
              onClick={() => { setMeusLeads(!meusLeads); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                meusLeads
                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                  : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-gray-300'
              }`}
            >
              Meus leads
            </button>
            <button
              onClick={carregar}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-white transition-all"
            >
              Atualizar
            </button>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {[
                    { label: 'Lead',      cls: 'px-5 py-3 min-w-[200px]' },
                    { label: 'Score',     cls: 'px-4 py-3 hidden sm:table-cell' },
                    { label: 'Categoria', cls: 'px-4 py-3 hidden md:table-cell' },
                    { label: 'Capital',   cls: 'px-4 py-3 hidden lg:table-cell' },
                    { label: 'Status',    cls: 'px-4 py-3' },
                    { label: 'Marca',     cls: 'px-4 py-3 hidden xl:table-cell' },
                    { label: 'Consultor', cls: 'px-4 py-3 hidden xl:table-cell' },
                    { label: '',          cls: 'px-4 py-3 w-8' },
                  ].map(h => (
                    <th key={h.label} className={`${h.cls} text-left text-[9px] font-black uppercase tracking-[0.2em] text-gray-700`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="py-20 text-center">
                    <div className="w-7 h-7 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : error ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <p className="text-red-400 text-sm mb-2">Erro ao carregar</p>
                    <p className="text-gray-600 text-[11px]">{error}</p>
                  </td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-700 mb-2">Nenhum lead</p>
                    <p className="text-gray-600 text-sm">Ajuste os filtros ou aguarde novos leads</p>
                  </td></tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {leads.map(lead => <LeadRow key={lead.id} lead={lead} onClick={setLeadSel} />)}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginacao */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
              <p className="text-[10px] text-gray-600">
                {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, total)} de {total}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] text-gray-500 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 transition-all">
                  Anterior
                </button>
                <span className="px-3 py-1.5 text-[11px] text-gray-500 tabular-nums">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] text-gray-500 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 transition-all">
                  Proxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
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
