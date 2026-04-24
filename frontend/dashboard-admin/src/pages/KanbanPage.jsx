// KanbanPage — Funil de Vendas
import { useState, useRef, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import {
  useStatusColunas, useKanbanLeads, useMoverLead, COLUNAS_PADRAO,
} from '../hooks/useKanban'
import LeadModal from '../components/leads/LeadModal'

// ── Helpers ──────────────────────────────────────────────
function fmtCapital(v) {
  if (!v) return null
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$${(n / 1_000).toFixed(0)}K`
  return `R$${n.toLocaleString('pt-BR')}`
}

function diasAtras(iso) {
  if (!iso) return null
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return 'hoje'
  if (d === 1) return '1d'
  return `${d}d`
}

// ── Temperatura ──────────────────────────────────────────
const CAT = {
  hot:  { cor: '#EF4444', bg: '#EF444418', label: 'HOT'   },
  warm: { cor: '#F59E0B', bg: '#F59E0B15', label: 'MORNO' },
  cold: { cor: '#64748B', bg: '#64748B12', label: 'FRIO'  },
}

// ── Canal de origem ──────────────────────────────────────
const CANAL_MAP = [
  { match: ['whatsapp','wpp','zap'],              label: 'WhatsApp',  color: '#25D366', bg: '#25D36615' },
  { match: ['instagram','insta'],                 label: 'Instagram', color: '#E1306C', bg: '#E1306C15' },
  { match: ['facebook','fb'],                     label: 'Facebook',  color: '#1877F2', bg: '#1877F215' },
  { match: ['n8n','make','zapier','automac'],      label: 'n8n',       color: '#EA580C', bg: '#EA580C15' },
  { match: ['form','lp','landing','site'],         label: 'Formulário',color: '#8B5CF6', bg: '#8B5CF615' },
  { match: ['api','webhook'],                      label: 'API',       color: '#06B6D4', bg: '#06B6D415' },
  { match: ['import','planilha','csv'],            label: 'Importação',color: '#64748B', bg: '#64748B15' },
]

function getCanal(fonte) {
  if (!fonte) return null
  const f = fonte.toLowerCase()
  return CANAL_MAP.find(c => c.match.some(m => f.includes(m))) ?? null
}

// ── Card do lead ─────────────────────────────────────────
const LeadCard = memo(function LeadCard({ lead, isDragging, onDragStart, onDragEnd, onClick }) {
  const cat      = CAT[(lead.categoria || 'cold').toLowerCase()] || CAT.cold
  const score    = lead.score ?? 0
  const canal    = getCanal(lead.fonte)
  const cap      = fmtCapital(lead.capital_disponivel)
  const dias     = diasAtras(lead.created_at)
  const corScore = score >= 80 ? '#EF4444' : score >= 60 ? '#F59E0B' : '#64748B'

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(lead)}
      style={{ borderLeftColor: cat.cor }}
      className={`
        bg-[#0F172A] rounded-xl border border-white/[0.07] border-l-[3px]
        p-3.5 cursor-grab active:cursor-grabbing select-none
        transition-all duration-150
        ${isDragging
          ? 'opacity-40 scale-[0.97]'
          : 'hover:bg-[#131B2E] hover:border-white/[0.14] hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5'
        }
      `}
      style={{
        borderColor: isDragging ? '#10B98140' : cat.border,
      }}
    >
      {/* Nome + badge temperatura */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="text-[13.5px] font-bold text-white leading-snug flex-1 min-w-0 truncate">
          {lead.nome}
        </p>
        <span
          className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
          style={{ background: cat.bg, color: cat.cor }}
        >
          {cat.label}
        </span>
      </div>

      {/* Tags: canal + capital */}
      {(canal || cap) && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {canal && (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: canal.bg, color: canal.color }}
            >
              {canal.label}
            </span>
          )}
          {cap && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">
              {cap}
            </span>
          )}
        </div>

      {/* Contato */}
      {(lead.telefone || lead.email) && (
        <p className="text-[10.5px] text-gray-500 truncate mb-0.5">
          {lead.telefone || lead.email}
        </p>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.05]">
        {/* Consultor */}
        {lead.operador ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 bg-[#10B981]/15 text-[#10B981]">
              {lead.operador.nome?.charAt(0)}
            </div>
            <span className="text-[10px] text-gray-500 truncate">
              {lead.operador.nome?.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Score + dias */}
        <div className="flex items-center gap-2 shrink-0">
          {score > 0 && (
            <span className="text-[10px] font-black tabular-nums" style={{ color: corScore }}>
              {score}
            </span>
          )}
          {dias && (
            <span className="text-[9px] text-gray-700 tabular-nums">{dias}</span>
          )}
        </div>
      </div>
    </div>
  )
})

// ── Coluna ───────────────────────────────────────────────
const Coluna = memo(function Coluna({ coluna, leads, dragLeadId, dragOver, onDragStart, onDragEnd, onDrop, onLeadClick }) {
  const isOver  = dragOver === coluna.slug
  const hot     = leads.filter(l => (l.categoria || '').toLowerCase() === 'hot').length
  const capital = leads.reduce((a, l) => a + parseFloat(l.capital_disponivel || 0), 0)

  function fmtK(v) {
    return v >= 1_000_000 ? `R$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000 ? `R$${(v / 1_000).toFixed(0)}K`
      : `R$${Math.round(v)}`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 py-2.5 mb-2 rounded-xl border transition-all ${
          isOver ? 'border-[#10B981]/40 bg-[#10B981]/5' : 'bg-[#0A0F1E] border-white/[0.07]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: coluna.cor }} />
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-300 truncate">
            {coluna.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hot > 0 && (
            <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
              {hot}🔥
            </span>
          )}
          <span className="text-[9px] font-black text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-full tabular-nums">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Capital da coluna */}
      {capital > 0 && (
        <p className="text-[9px] font-black text-[#10B981]/50 text-center mb-2 tabular-nums">
          {fmtK(capital)}
        </p>
      )}

      {/* Drop zone */}
      <div
        className={`flex-1 rounded-xl p-1.5 space-y-2 min-h-[60px] transition-all ${
          isOver ? 'bg-[#10B981]/[0.03] ring-1 ring-dashed ring-[#10B981]/25' : ''
        }`}
        onDragOver={(e) => { e.preventDefault(); onDrop('over', coluna.slug) }}
        onDragLeave={() => onDrop('leave', coluna.slug)}
        onDrop={(e) => onDrop('drop', coluna.slug, e)}
      >
        <AnimatePresence mode="popLayout">
          {leads.map(lead => (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.14 }}
            >
              <LeadCard
                lead={lead}
                isDragging={dragLeadId === lead.id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={onLeadClick}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {leads.length === 0 && !isOver && (
          <div className="h-14 flex items-center justify-center rounded-xl border border-dashed border-white/[0.05]">
            <p className="text-[9px] text-gray-700 uppercase tracking-wider">Vazio</p>
          </div>
        )}
        {isOver && (
          <div className="h-12 flex items-center justify-center rounded-xl border border-dashed border-[#10B981]/30">
            <p className="text-[9px] text-[#10B981]/60 uppercase tracking-wider">Solte aqui</p>
          </div>
        )}
      </div>
    </div>
  )
})

// ── Página principal ─────────────────────────────────────
export default function KanbanPage() {
  const { usuario } = useAuth()
  const tenantId = usuario?.is_super_admin ? null : usuario?.tenant_id

  const [dragOver,   setDragOver]   = useState(null)
  const [dragLeadId, setDragLeadId] = useState(null)
  const [lead,       setLead]       = useState(null)
  const dragRef = useRef(null)

  const { data: colunas = COLUNAS_PADRAO } = useStatusColunas(tenantId)
  const { data: kanban = {}, isLoading }   = useKanbanLeads({ tenantId, colunas })
  const { mutateAsync: mover }             = useMoverLead()

  const totalLeads = Object.values(kanban).reduce((a, b) => a + b.length, 0)
  const totalConv  = kanban['convertido']?.length ?? 0
  const totalHot   = Object.values(kanban).flat().filter(l => (l.categoria || '').toLowerCase() === 'hot').length
  const txConv     = totalLeads > 0 ? Math.round((totalConv / totalLeads) * 100) : 0
  const totalCap   = Object.values(kanban).flat().reduce((a, l) => a + parseFloat(l.capital_disponivel || 0), 0)
  const fmtK = v => v >= 1_000_000 ? `R$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `R$${(v / 1_000).toFixed(0)}K` : `R$${Math.round(v)}`

  const onDragStart = useCallback((e, l) => {
    dragRef.current = l
    setDragLeadId(l.id)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragEnd = useCallback(() => {
    setDragLeadId(null)
    setDragOver(null)
    dragRef.current = null
  }, [])

  const onDrop = useCallback(async (action, slug, e) => {
    if (action === 'over')  { setDragOver(slug); return }
    if (action === 'leave') { if (dragOver === slug) setDragOver(null); return }
    e?.preventDefault()
    setDragOver(null)
    const l = dragRef.current
    if (!l) return
    const slugAtual = l.status_comercial?.slug?.toLowerCase() || l.status?.toLowerCase() || 'novo'
    if (slugAtual === slug) { dragRef.current = null; setDragLeadId(null); return }
    const col    = colunas.find(c => c.slug === slug)
    const isUUID = typeof col?.id === 'string' && col.id.length === 36 && col.id.includes('-')
    try {
      await mover({ leadId: l.id, novoStatusSlug: slug, novoStatusId: isUUID ? col.id : null, tenantId })
    } catch (err) { console.error('[Kanban]', err.message) }
    finally { dragRef.current = null; setDragLeadId(null) }
  }, [colunas, dragOver, mover, tenantId])

  if (isLoading) return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[#0B1220]">
      {/* Header */}
      <div className="px-4 lg:px-8 pt-5 pb-4 border-b border-white/[0.05] shrink-0">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">
              Funil de <span className="text-[#10B981]">Vendas</span>
            </h1>
            <p className="text-[10px] text-gray-600 mt-0.5">Arraste os cards para mover entre etapas</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Total',       value: totalLeads,     color: 'text-white',     border: 'border-white/[0.07]' },
              { label: '🔥 Hot',      value: totalHot,       color: 'text-red-400',   border: 'border-red-500/20'   },
              { label: 'Convertidos', value: totalConv,      color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
              { label: 'Conversão',   value: `${txConv}%`,   color: 'text-gray-300',  border: 'border-white/[0.07]' },
              { label: 'Capital',     value: fmtK(totalCap), color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-[#0A0F1E] border ${kpi.border} rounded-xl px-3 py-2 text-center min-w-[64px]`}>
                <p className="text-[8px] font-black uppercase tracking-wider text-gray-600 mb-0.5">{kpi.label}</p>
                <p className={`text-sm font-black tabular-nums ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div
          className="flex gap-3 h-full px-4 lg:px-8 py-4"
          style={{ minWidth: `${Math.max(colunas.length * 220, 800)}px` }}
        >
          {colunas.map(col => (
            <div key={col.slug} className="flex flex-col shrink-0" style={{ width: '210px' }}>
              <Coluna
                coluna={col}
                leads={kanban[col.slug] ?? []}
                dragLeadId={dragLeadId}
                dragOver={dragOver}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDrop={onDrop}
                onLeadClick={setLead}
              />
            </div>
          ))}
        </div>
      </div>

      {lead && <LeadModal lead={lead} onClose={() => setLead(null)} />}
    </div>
  )
}
