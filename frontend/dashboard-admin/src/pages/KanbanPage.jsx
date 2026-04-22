// KanbanPage -- Funil de Vendas
// Cards: Nome, Score, Contato, Consultor -- padrao LeadCapture Pro
import { useState, useRef, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import {
  useStatusColunas, useKanbanLeads, useMoverLead, COLUNAS_PADRAO,
} from '../hooks/useKanban'
import LeadModal from '../components/leads/LeadModal'

const fmtCapital = (v) => {
  if (!v) return null
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$${(n/1_000).toFixed(0)}K`
  return null
}

const CAT = {
  hot:  { cor: '#EF4444', bg: 'bg-red-500/10',   ring: 'ring-red-500/30',   label: 'HOT'  },
  warm: { cor: '#F59E0B', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30', label: 'WARM' },
  cold: { cor: '#6B7280', bg: 'bg-gray-500/10',  ring: 'ring-gray-500/20',  label: 'COLD' },
}

// Card do lead -- nome, score, contato, consultor
const LeadCard = memo(function LeadCard({ lead, isDragging, onDragStart, onDragEnd, onClick }) {
  const cat   = CAT[(lead.categoria || 'cold').toLowerCase()] || CAT.cold
  const cap   = fmtCapital(lead.capital_disponivel)
  const score = lead.score ?? 0
  const corScore = score >= 80 ? '#EF4444' : score >= 60 ? '#F59E0B' : '#6B7280'

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(lead)}
      className={`
        relative rounded-2xl p-3.5 cursor-grab active:cursor-grabbing select-none
        border transition-all duration-150 group
        ${isDragging
          ? 'opacity-40 scale-95 border-[#10B981]/40 bg-[#10B981]/5'
          : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.18] hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/30'
        }
      `}
    >
      {/* Linha de cor da categoria no topo */}
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-60"
        style={{ background: cat.cor }} />

      {/* Header: nome + badge */}
      <div className="flex items-start justify-between gap-2 mt-1 mb-2.5">
        <p className="text-white text-[12px] font-bold leading-tight truncate flex-1">
          {lead.nome}
        </p>
        <span className={`shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${cat.bg} ring-1 ${cat.ring}`}
          style={{ color: cat.cor }}>
          {cat.label}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-600">Score</span>
          <span className="text-[10px] font-black tabular-nums" style={{ color: corScore }}>{score}</span>
        </div>
        <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(score, 100)}%`, background: corScore }} />
        </div>
      </div>

      {/* Contato */}
      {(lead.email || lead.telefone) && (
        <div className="mb-2.5 space-y-0.5">
          {lead.email && (
            <p className="text-[10px] text-gray-500 truncate">{lead.email}</p>
          )}
          {lead.telefone && (
            <p className="text-[10px] text-gray-600">{lead.telefone}</p>
          )}
        </div>
      )}

      {/* Footer: capital + consultor */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.05]">
        {/* Consultor */}
        {lead.operador ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[9px] font-black text-[#10B981] shrink-0">
              {lead.operador.nome?.charAt(0)}
            </div>
            <span className="text-[10px] text-gray-500 truncate">{lead.operador.nome?.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-[9px] text-gray-700 italic">sem consultor</span>
        )}

        {/* Capital */}
        {cap && (
          <span className="text-[10px] font-black text-[#10B981] shrink-0 tabular-nums">{cap}</span>
        )}
      </div>
    </div>
  )
})

// Coluna
const Coluna = memo(function Coluna({ coluna, leads, dragLeadId, dragOver, onDragStart, onDragEnd, onDrop, onLeadClick }) {
  const isOver = dragOver === coluna.slug
  const hot    = leads.filter(l => l.categoria === 'hot').length
  const capital = leads.reduce((a, l) => a + parseFloat(l.capital_disponivel || 0), 0)
  const fmtK   = (v) => v >= 1_000_000 ? `R$${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `R$${(v/1_000).toFixed(0)}K` : `R$${Math.round(v)}`

  return (
    <div className="flex flex-col h-full bg-[#0B1220]">
      {/* Header da coluna */}
      <div className={`
        flex items-center justify-between px-3 py-2.5 mb-2 rounded-xl
        border transition-colors duration-150
        ${isOver ? 'border-[#10B981]/40 bg-[#10B981]/5' : 'bg-[#0B1220] border-white/[0.06]'}
      `}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: coluna.cor }} />
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-300 truncate">
            {coluna.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hot > 0 && (
            <span className="text-[9px] font-black text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
              {hot}H
            </span>
          )}
          <span className="text-[9px] font-black text-gray-600 bg-white/[0.05] px-2 py-0.5 rounded-full tabular-nums">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Capital total da coluna */}
      {capital > 0 && (
        <p className="text-[9px] font-black text-[#10B981]/60 text-center mb-2 tabular-nums">
          {fmtK(capital)}
        </p>
      )}

      {/* Drop zone */}
      <div
        className={`
          flex-1 rounded-xl p-1.5 space-y-2 min-h-[80px]
          transition-all duration-150
          ${isOver ? 'bg-[#10B981]/[0.03] ring-1 ring-dashed ring-[#10B981]/30' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); onDrop('over', coluna.slug) }}
        onDragLeave={() => onDrop('leave', coluna.slug)}
        onDrop={(e) => onDrop('drop', coluna.slug, e)}
      >
        <AnimatePresence mode="popLayout">
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              isDragging={dragLeadId === lead.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onLeadClick}
            />
          ))}
        </AnimatePresence>
        {leads.length === 0 && !isOver && (
          <div className="h-16 flex items-center justify-center rounded-xl border border-dashed border-white/[0.05]">
            <p className="text-[9px] text-gray-700 uppercase tracking-wider">Vazio</p>
          </div>
        )}
      </div>
    </div>
  )
})

// KanbanPage principal
export default function KanbanPage() {
  const { usuario } = useAuth()
  const tenantId = usuario?.is_super_admin ? null : usuario?.tenant_id

  const [dragOver,   setDragOver]   = useState(null)
  const [dragLeadId, setDragLeadId] = useState(null)
  const [lead,       setLead]       = useState(null)
  const dragRef = useRef(null)

  const { data: colunas = COLUNAS_PADRAO }  = useStatusColunas(tenantId)
  const { data: kanban = {}, isLoading }    = useKanbanLeads({ tenantId, colunas })
  const { mutateAsync: mover }              = useMoverLead()

  const totalLeads = Object.values(kanban).reduce((a, b) => a + b.length, 0)
  const totalConv  = kanban['convertido']?.length ?? 0
  const totalHot   = Object.values(kanban).flat().filter(l => l.categoria === 'hot').length
  const txConv     = totalLeads > 0 ? Math.round((totalConv / totalLeads) * 100) : 0
  const totalCap   = Object.values(kanban).flat().reduce((a, l) => a + parseFloat(l.capital_disponivel || 0), 0)
  const fmtK       = (v) => v >= 1_000_000 ? `R$${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `R$${(v/1_000).toFixed(0)}K` : `R$${Math.round(v)}`

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
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[#0B1220]">

      {/* Header -- padrao Analytics */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-8 pb-4 border-b border-white/[0.05] shrink-0">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-4xl font-light text-white mb-1">
              Funil de <span className="text-[#10B981] font-bold">Vendas</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-16 h-0.5 bg-[#10B981] rounded-full" />
              <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Arraste os cards para mover entre etapas</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Total',       value: totalLeads,      cor: 'text-white',      border: 'border-white/[0.06]' },
              { label: 'Hot',         value: totalHot,        cor: 'text-red-400',    border: 'border-red-500/20'   },
              { label: 'Convertidos', value: totalConv,       cor: 'text-[#10B981]',  border: 'border-[#10B981]/20' },
              { label: 'Conversao',   value: `${txConv}%`,    cor: 'text-gray-300',   border: 'border-white/[0.06]' },
              { label: 'Capital',     value: fmtK(totalCap),  cor: 'text-[#10B981]',  border: 'border-[#10B981]/20' },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-[#0B1220] border ${kpi.border} rounded-xl px-3.5 py-2 text-center min-w-[64px]`}>
                <p className="text-[8px] font-black uppercase tracking-wider text-gray-600 mb-0.5">{kpi.label}</p>
                <p className={`text-base font-black tabular-nums ${kpi.cor}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full px-4 lg:px-8 py-4"
          style={{ minWidth: `${Math.max(colunas.length * 224, 800)}px` }}>
          {colunas.map(col => (
            <div key={col.slug} className="flex flex-col shrink-0" style={{ width: '212px' }}>
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
