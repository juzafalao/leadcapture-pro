// DashboardPage.jsx -- Design System v1.0
// Paleta: #0F172A fundo, #10B981 verde, #EE7B4D laranja, #F59E0B amber
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { useLeads } from '../hooks/useLeads'
import { useStatusColunas } from '../hooks/useKanban'
import LeadModal from '../components/leads/LeadModal'

const fmtCapital = (v) => {
  if (!v) return 'R$ 0'
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$${(n/1_000).toFixed(0)}K`
  return `R$${n.toLocaleString('pt-BR')}`
}

const CAT_STYLE = {
  hot:  { bg: 'bg-red-500/10',    ring: 'ring-red-500/20',    text: 'text-red-400',    dot: 'bg-red-400'    },
  warm: { bg: 'bg-amber-500/10',  ring: 'ring-amber-500/20',  text: 'text-amber-400',  dot: 'bg-amber-400'  },
  cold: { bg: 'bg-gray-500/[0.08]', ring: 'ring-gray-500/15', text: 'text-gray-500',   dot: 'bg-gray-500'   },
}

// -- Linha do lead na tabela --
function LeadRow({ lead, onClick }) {
  const cat   = (lead.categoria || 'cold').toLowerCase()
  const style = CAT_STYLE[cat] || CAT_STYLE.cold
  const score = lead.score ?? 0
  const slug  = lead.status_comercial?.slug || lead.status || 'novo'
  const cap   = fmtCapital(lead.capital_disponivel)

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(lead)}
      className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer group transition-colors"
    >
      {/* Nome + fonte */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          {/* Score indicator */}
          <div className={`w-1.5 h-8 rounded-full ${style.dot} opacity-70 shrink-0`} />
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-white truncate group-hover:text-[#10B981] transition-colors">
              {lead.nome}
            </p>
            <p className="text-[10px] text-gray-600 truncate">
              {lead.email || lead.telefone || lead.cidade || ''}
            </p>
          </div>
        </div>
      </td>

      {/* Score */}
      <td className="px-4 py-3.5 hidden sm:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${score}%`, background: score >= 80 ? '#EF4444' : score >= 60 ? '#F59E0B' : '#6B7280' }}
            />
          </div>
          <span className={`text-[10px] font-black tabular-nums ${style.text}`}>{score}</span>
        </div>
      </td>

      {/* Categoria */}
      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ring-1 ${style.bg} ${style.ring} ${style.text}`}>
          {cat}
        </span>
      </td>

      {/* Capital */}
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <span className="text-[11px] font-bold text-[#10B981] tabular-nums">{cap}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <span
          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
          style={{
            background: `${lead.status_comercial?.cor || '#6B7280'}18`,
            color:       lead.status_comercial?.cor || '#6B7280',
          }}
        >
          {lead.status_comercial?.label || slug}
        </span>
      </td>

      {/* Marca */}
      <td className="px-4 py-3.5 hidden xl:table-cell">
        {lead.marca ? (
          <span className="text-[11px] text-gray-500">
            {lead.marca.emoji} {lead.marca.nome}
          </span>
        ) : <span className="text-gray-700"></span>}
      </td>

      {/* Operador */}
      <td className="px-4 py-3.5 hidden xl:table-cell">
        <span className="text-[11px] text-gray-500 truncate">
          {lead.operador?.nome || ''}
        </span>
      </td>

      {/* Seta */}
      <td className="px-4 py-3.5 w-8 text-right">
        <span className="text-gray-700 group-hover:text-gray-400 transition-colors"></span>
      </td>
    </motion.tr>
  )
}

// -- Filtros --
function FiltroBar({ filters, onChange, statusOpts }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar lead..."
          value={filters.search || ''}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-transparent border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/40 transition-colors"
        />
      </div>

      {/* Status */}
      <select
        value={filters.status || ''}
        onChange={e => onChange({ ...filters, status: e.target.value })}
        className="bg-[#080E18] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#10B981]/40"
      >
        <option value="">Todos status</option>
        {(statusOpts || []).map(s => (
          <option key={s.id} value={s.slug}>{s.label}</option>
        ))}
      </select>

      {/* Meus leads */}
      <button
        onClick={() => onChange({ ...filters, meusLeads: !filters.meusLeads })}
        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
          filters.meusLeads
            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
            : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-gray-300'
        }`}
      >
        Meus leads
      </button>
    </div>
  )
}

// -- KPI card --
function KPI({ label, value, sub, color = 'text-white', accent }) {
  return (
    <div className="bg-[#0B1220] border border-white/[0.06] rounded-xl px-4 py-3.5 min-w-[100px]">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-black tabular-nums leading-none ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-700 mt-1">{sub}</p>}
    </div>
  )
}

// -- Paginacao --
function Paginacao({ page, total, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
      <p className="text-[10px] text-gray-600">
        {(page - 1) * perPage + 1}{Math.min(page * perPage, total)} de {total}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] text-gray-500 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 transition-all"
        >
           Ant
        </button>
        <span className="px-3 py-1.5 text-[11px] text-gray-500 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] text-gray-500 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 transition-all"
        >
          Prox 
        </button>
      </div>
    </div>
  )
}

// -- Pagina principal --
export default function DashboardPage() {
  const { usuario } = useAuth()
  const tenantId = usuario?.is_super_admin ? null : usuario?.tenant_id

  const [page,     setPage]     = useState(1)
  const [filters,  setFilters]  = useState(() => ({ search: '', status: '', meusLeads: false, userId: usuario?.id || '' }))
  const [leadSel,  setLeadSel]  = useState(null)

  const PER_PAGE = 25
  const statusQuery   = useStatusColunas(tenantId)
  const leadsQuery    = useLeads(tenantId, page, PER_PAGE, filters)

  const metrics    = null
  const statusOpts = statusQuery?.data    || []
  const leadsData  = leadsQuery?.data     || null
  const isLoading  = leadsQuery?.isLoading ?? true

  const leads = leadsData?.data || []
  const total = leadsData?.count || 0

  const handleFilters = useCallback((f) => {
    setFilters({ ...f, userId: usuario?.id })
    setPage(1)
  }, [usuario?.id])

  return (
    <div className="flex flex-col min-h-full bg-[#0F172A]">

      {/* Page header */}
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
          {/* KPIs */}
          <div className="flex flex-wrap gap-2">
            <KPI label="Total"      value={total ?? 0} />
            <KPI label="Hot"        value={leads.filter(l => l.categoria === 'hot').length} color="text-red-400" />
            <KPI label="Capital"    value={fmtCapital(leads.reduce((a,l) => a + parseFloat(l.capital_disponivel||0), 0))} color="text-[#10B981]" />
            <KPI label="Pagina"     value={`${page}/${Math.ceil(total/PER_PAGE)||1}`} color="text-gray-300" />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 px-6 lg:px-10 py-5">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Filtros */}
          <FiltroBar filters={filters} onChange={handleFilters} statusOpts={statusOpts} />

          {/* Cabealho da tabela */}
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
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="w-7 h-7 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <p className="text-[9px] font-black uppercase tracking-wider text-gray-700 mb-2">Nenhum lead</p>
                      <p className="text-gray-600 text-sm">Ajuste os filtros ou aguarde novos leads</p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {leads.map(lead => (
                      <LeadRow key={lead.id} lead={lead} onClick={setLeadSel} />
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginacao */}
          <Paginacao page={page} total={total} perPage={PER_PAGE} onPage={setPage} />
        </div>
      </div>

      {/* Modal */}
      {leadSel && (
        <LeadModal
          lead={leadSel}
          onClose={() => setLeadSel(null)}
          tenantName={usuario?.tenant?.name}
        />
      )}
    </div>
  )
}
