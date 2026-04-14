// KanbanPage  Funil de Vendas
// Performance: optimistic updates, realtime, sem re-renders desnecessarios
// Paleta: #0F172A fundo, #10B981 ativo, cores de coluna por config
import { useState, useRef, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import {
  useStatusColunas, useKanbanLeads, useMoverLead, COLUNAS_PADRAO,
} from '../hooks/useKanban'
import LeadModal from '../components/LeadModal'

//  Helpers 
const fmtCapital = (v) => {
  if (!v) return ''
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

const catCor = { hot: '#EF4444', warm: '#F59E0B', cold: '#6B7280' }
const catLabel = { hot: '', warm: '', cold: '' }

//  Card do lead  memo para evitar re-renders 
const LeadCard = memo(function LeadCard({ lead, onDragStart, onDragEnd, onClick }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(lead)}
      className="bg-[#0B1220] border border-white/[0.07] rounded-xl p-3 cursor-grab active:cursor-grabbing
        hover:border-white/20 hover:shadow-lg hover:shadow-black/30 transition-all select-none"
    >
      {/* Header: nome + categoria */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-white text-[12px] font-bold leading-tight truncate">
          {lead.nome}
        </p>
        <span className="text-[13px] shrink-0" title={lead.categoria}>
          {catLabel[lead.categoria] || ''}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-600">Score</span>
          <span className="text-[10px] font-black" style={{ color: catCor[lead.categoria] || '#6B7280' }}>
            {lead.score ?? 0}
          </span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(lead.score ?? 0, 100)}%`,
              background: catCor[lead.categoria] || '#6B7280',
            }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between">
        {lead.marca && (
          <span className="text-[9px] text-gray-600 truncate max-w-[70%]">
            {lead.marca.emoji} {lead.marca.nome}
          </span>
        )}
        {lead.capital_disponivel && (
          <span className="text-[9px] font-bold text-[#10B981] shrink-0">
            {fmtCapital(lead.capital_disponivel)}
          </span>
        )}
      </div>
    </motion.div>
  )
})

//  Coluna do Kanban 
const Coluna = memo(function Coluna({ coluna, leads, onDragStart, onDragEnd, onDrop, dragOver, onLeadClick }) {
  const isOver = dragOver === coluna.slug

  return (
    <div
      className="flex flex-col h-full min-w-0"
      onDragOver={(e) => { e.preventDefault(); onDrop('over', coluna.slug) }}
      onDragLeave={() => onDrop('leave', coluna.slug)}
      onDrop={(e) => onDrop('drop', coluna.slug, e)}
    >
      {/* Header da coluna */}
      <div className="flex items-center justify-between px-3 py-3 mb-2 rounded-xl bg-[#0F172A] border border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: coluna.cor }} />
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">
            {coluna.label}
          </span>
        </div>
        <span className="text-[10px] font-black text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`flex-1 rounded-xl p-2 space-y-2 min-h-[120px] transition-all duration-150
          ${isOver ? 'bg-[#10B981]/5 border border-dashed border-[#10B981]/30' : 'bg-transparent border border-transparent'}`}
      >
        <AnimatePresence mode="popLayout">
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onLeadClick}
            />
          ))}
        </AnimatePresence>
        {leads.length === 0 && (
          <div className="h-16 flex items-center justify-center">
            <p className="text-[9px] text-gray-700 uppercase tracking-wider">Arraste um lead</p>
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

  const [dragOver, setDragOver]         = useState(null)
  const [dragLeadId, setDragLeadId]     = useState(null)
  const [leadSelecionado, setLead]      = useState(null)
  const dragLead = useRef(null)

  const { data: colunas = COLUNAS_PADRAO }    = useStatusColunas(tenantId)
  const { data: kanbanData = {}, isLoading }   = useKanbanLeads({ tenantId, colunas })
  const { mutateAsync: moverLead }             = useMoverLead()

  const totalLeads = Object.values(kanbanData).reduce((a, b) => a + b.length, 0)
  const totalConv  = kanbanData['convertido']?.length ?? 0
  const txConv     = totalLeads > 0 ? ((totalConv / totalLeads) * 100).toFixed(0) : 0

  //  Drag handlers 
  const handleDragStart = useCallback((e, lead) => {
    dragLead.current = lead
    setDragLeadId(lead.id)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragLeadId(null)
    setDragOver(null)
    dragLead.current = null
  }, [])

  const handleDrop = useCallback(async (action, slug, e) => {
    if (action === 'over')  { setDragOver(slug); return }
    if (action === 'leave') { if (dragOver === slug) setDragOver(null); return }

    // drop
    e?.preventDefault()
    setDragOver(null)
    const lead = dragLead.current
    if (!lead) return

    const slugAtual = lead.status_comercial?.slug?.toLowerCase() || lead.status?.toLowerCase() || 'novo'
    if (slugAtual === slug) { dragLead.current = null; setDragLeadId(null); return }

    const coluna  = colunas.find(c => c.slug === slug)
    const isUUID  = typeof coluna?.id === 'string' && coluna.id.length === 36 && coluna.id.includes('-')

    try {
      await moverLead({
        leadId:         lead.id,
        novoStatusSlug: slug,
        novoStatusId:   isUUID ? coluna.id : null,
        tenantId,
      })
    } catch (err) {
      console.error('[Kanban] Erro ao mover:', err.message)
    } finally {
      dragLead.current = null
      setDragLeadId(null)
    }
  }, [colunas, dragOver, moverLead, tenantId])

  //  Loading 
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">

      {/* Header */}
      <div className="px-6 lg:px-8 pt-7 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-light text-white">
              Funil de <span className="text-[#10B981] font-bold">Vendas</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-0.5 bg-[#10B981] rounded-full" />
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
                Pipeline em tempo real
              </p>
            </div>
          </div>

          {/* KPIs rpidos */}
          <div className="flex items-center gap-3">
            <div className="bg-[#0B1220] border border-white/[0.06] rounded-xl px-4 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">Total</p>
              <p className="text-xl font-black text-white">{totalLeads}</p>
            </div>
            <div className="bg-[#0B1220] border border-[#10B981]/20 rounded-xl px-4 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">Convertidos</p>
              <p className="text-xl font-black text-[#10B981]">{totalConv}</p>
            </div>
            <div className="bg-[#0B1220] border border-white/[0.06] rounded-xl px-4 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">Conversao</p>
              <p className="text-xl font-black text-white">{txConv}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Board  scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div
          className="flex gap-3 h-full px-6 lg:px-8 py-5"
          style={{ minWidth: `${colunas.length * 240}px` }}
        >
          {colunas.map(coluna => (
            <div key={coluna.slug} className="flex flex-col w-56 shrink-0">
              <Coluna
                coluna={coluna}
                leads={kanbanData[coluna.slug] ?? []}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                dragOver={dragOver}
                onLeadClick={setLead}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modal de lead */}
      {leadSelecionado && (
        <LeadModal
          lead={leadSelecionado}
          onClose={() => setLead(null)}
        />
      )}
    </div>
  )
}
