// KanbanPage -- Funil de Vendas
// Paleta: #0F172A fundo, #10B981 ativo, cards elegantes
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
  hot:  { cor: '#EF4444', bg: 'bg-red-500/10',    ring: 'ring-red-500/30',    label: 'HOT' },
  warm: { cor: '#F59E0B', bg: 'bg-amber-500/10',  ring: 'ring-amber-500/30',  label: 'WARM' },
  cold: { cor: '#6B7280', bg: 'bg-gray-500/10',   ring: 'ring-gray-500/20',   label: 'COLD' },
}

//  Card do lead 
const LeadCard = memo(function LeadCard({ lead, isDragging, onDragStart, onDragEnd, onClick }) {
  const cat = CAT[lead.categoria] || CAT.cold
  const cap = fmtCapital(lead.capital_disponivel)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0, scale: isDragging ? 1.02 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(lead)}
      className={`
        relative bg-[#0F172A] border border-white/[0.07] rounded-2xl p-3.5
        cursor-grab active:cursor-grabbing select-none
        hover:border-white/20 hover:shadow-xl hover:shadow-black/40
        transition-all duration-150
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {/* Badge categoria -- canto superior direito */}
      <span className={`
        absolute top-3 right-3 text-[8px] font-black uppercase tracking-wider
        px-1.5 py-0.5 rounded-full ${cat.bg} ring-1 ${cat.ring}
      `} style={{ color: cat.cor }}>
        {cat.label}
      </span>

      {/* Nome */}
      <p className="text-white text-[12px] font-bold leading-tight pr-12 mb-2.5 truncate">
        {lead.nome}
      </p>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-600">Score</span>
          <span className="text-[10px] font-black tabular-nums" style={{ color: cat.cor }}>
            {lead.score ?? 0}
          </span>
        </div>
        <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(lead.score ?? 0, 100)}%`, background: cat.cor }}
          />
        </div>
      </div>

      {/* Footer: marca + capital */}
      <div className="flex items-center justify-between gap-2">
        {lead.marca ? (
          <span className="text-[10px] text-gray-600 truncate flex items-center gap-1">
            <span>{lead.marca.emoji}</span>
            <span className="truncate">{lead.marca.nome}</span>
          </span>
        ) : (
          <span className="text-[10px] text-gray-700 truncate">
            {lead.regiao_interesse || lead.fonte || ''}
          </span>
        )}
        {cap && (
          <span className="text-[10px] font-black text-[#10B981] shrink-0 tabular-nums">
            {cap}
          </span>
        )}
      </div>

      {/* Operador atribuido */}
      {lead.operador && (
        <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[9px]">
            {lead.operador.nome?.charAt(0)}
          </div>
          <span className="text-[9px] text-gray-600 truncate">{lead.operador.nome}</span>
        </div>
      )}
    </motion.div>
  )
})

//  Coluna 
const Coluna = memo(function Coluna({ coluna, leads, dragLeadId, dragOver, onDragStart, onDragEnd, onDrop, onLeadClick }) {
  const isOver = dragOver === coluna.slug
  const hot    = leads.filter(l => l.categoria === 'hot').length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`
        flex items-center justify-between px-3 py-2.5 mb-2 rounded-xl
        bg-[#0B1220] border transition-colors duration-150
        ${isOver ? 'border-[#10B981]/40 bg-[#10B981]/5' : 'border-white/[0.06]'}
      `}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: coluna.cor }} />
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">
            {coluna.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {hot > 0 && (
            <span className="text-[9px] font-black text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
              {hot} HOT
            </span>
          )}
          <span className="text-[10px] font-black text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`
          flex-1 rounded-xl p-1.5 space-y-2 min-h-[80px]
          transition-all duration-150
          ${isOver ? 'bg-[#10B981]/5 ring-1 ring-dashed ring-[#10B981]/30' : ''}
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
          <div className="h-12 flex items-center justify-center">
            <p className="text-[9px] text-gray-700 uppercase tracking-wider">Vazio</p>
          </div>
        )}
      </div>
    </div>
  )
})

//  KanbanPage 
export default function KanbanPage() {
  const { usuario } = useAuth()
  const tenantId = usuario?.is_super_admin ? null : usuario?.tenant_id

  const [dragOver,   setDragOver]   = useState(null)
  const [dragLeadId, setDragLeadId] = useState(null)
  const [lead,       setLead]       = useState(null)
  const dragRef = useRef(null)

  const { data: colunas = COLUNAS_PADRAO }   = useStatusColunas(tenantId)
  const { data: kanban = {}, isLoading }      = useKanbanLeads({ tenantId, colunas })
  const { mutateAsync: mover }                = useMoverLead()

  const totalLeads = Object.values(kanban).reduce((a, b) => a + b.length, 0)
  const totalConv  = kanban['convertido']?.length ?? 0
  const txConv     = totalLeads > 0 ? Math.round((totalConv / totalLeads) * 100) : 0

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
    <div className="flex flex-col h-full bg-[#0F172A]">

      {/* Header compacto */}
      <div className="px-6 lg:px-8 pt-6 pb-4 border-b border-white/[0.05] flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-light text-white">
            Funil de <span className="text-[#10B981] font-bold">Vendas</span>
          </h1>
          <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] mt-0.5">
            {colunas.length} etapas  pipeline em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Total',      value: totalLeads, cor: 'text-white',      border: 'border-white/[0.06]' },
            { label: 'Convertidos',value: totalConv,  cor: 'text-[#10B981]', border: 'border-[#10B981]/20' },
            { label: 'Conversao',  value: `${txConv}%`,cor: 'text-gray-300', border: 'border-white/[0.06]' },
          ].map(kpi => (
            <div key={kpi.label} className={`bg-[#0B1220] border ${kpi.border} rounded-xl px-3.5 py-2 text-center min-w-[64px]`}>
              <p className="text-[8px] font-black uppercase tracking-wider text-gray-600 mb-0.5">{kpi.label}</p>
              <p className={`text-lg font-black tabular-nums ${kpi.cor}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Board com scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full px-6 lg:px-8 py-4"
          style={{ minWidth: `${Math.max(colunas.length * 220, 800)}px` }}>
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
