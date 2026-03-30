// ============================================================
// KanbanPage.jsx — Funil visual de leads (drag & drop)
// LeadCapture Pro — Zafalao Tech
// ============================================================

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { useStatusColunas, useKanbanLeads, useMoverLead, COLUNAS_PADRAO } from '../hooks/useKanban'
import LeadModal from '../components/leads/LeadModal'
import LoadingSpinner from '../components/shared/LoadingSpinner'

// ── Card de lead no Kanban ────────────────────────────────────
function LeadCard({ lead, onDragStart, onClick }) {
  const cat = (lead.categoria || '').toLowerCase()
  const catColor = cat === 'hot' ? '#EF4444' : cat === 'warm' ? '#F59E0B' : '#6366F1'
  const catLabel = cat === 'hot' ? '🔥 Hot' : cat === 'warm' ? '🌤 Warm' : '❄️ Cold'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={e => onDragStart(e, lead)}
      onClick={() => onClick(lead)}
      className="bg-[#0F172A] border border-white/5 rounded-2xl p-4 cursor-grab active:cursor-grabbing hover:border-white/10 transition-all group"
      style={{ userSelect: 'none' }}
      whileHover={{ y: -1 }}
    >
      {/* Score + categoria */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: catColor }}>
          {catLabel}
        </span>
        {lead.score > 0 && (
          <span className="text-[10px] font-bold text-gray-500">
            Score {lead.score}
          </span>
        )}
      </div>

      {/* Nome */}
      <p className="text-sm font-semibold text-white leading-tight mb-1 line-clamp-1">
        {lead.nome}
      </p>

      {/* Marca */}
      {lead.marca && (
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <span>{lead.marca.emoji}</span>
          <span>{lead.marca.nome}</span>
        </p>
      )}

      {/* Capital */}
      {lead.capital_disponivel > 0 && (
        <div className="text-xs text-gray-400 mb-2">
          R$ {Number(lead.capital_disponivel).toLocaleString('pt-BR')}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <span className="text-[10px] text-gray-600">
          {lead.regiao_interesse || lead.fonte || 'landing-page'}
        </span>
        <span className="text-[10px] text-gray-700">
          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Operador atribuido */}
      {lead.operador && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[8px] text-[#10B981] font-bold">
            {lead.operador.nome?.[0]}
          </div>
          <span className="text-[10px] text-gray-600 truncate">{lead.operador.nome}</span>
        </div>
      )}
    </motion.div>
  )
}

// ── Coluna do Kanban ─────────────────────────────────────────
function Coluna({ coluna, leads = [], onDrop, onDragOver, onDragLeave, isDragOver, onCardClick, onDragStart }) {
  return (
    <div
      className="flex flex-col min-w-[260px] max-w-[280px] flex-shrink-0"
      onDragOver={e => { e.preventDefault(); onDragOver(coluna.slug) }}
      onDragLeave={onDragLeave}
      onDrop={e => onDrop(e, coluna)}
    >
      {/* Header da coluna */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: coluna.cor }} />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            {coluna.label}
          </span>
        </div>
        <span className="text-xs font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      {/* Zona de drop */}
      <div
        className="flex-1 min-h-[120px] rounded-2xl transition-all duration-200 p-2 space-y-2"
        style={{
          background: isDragOver
            ? `${coluna.cor}12`
            : 'rgba(255,255,255,0.02)',
          border: isDragOver
            ? `1.5px dashed ${coluna.cor}60`
            : '1.5px dashed transparent',
        }}
      >
        <AnimatePresence>
          {leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onDragStart={onDragStart}
              onClick={onCardClick}
            />
          ))}
        </AnimatePresence>

        {leads.length === 0 && !isDragOver && (
          <div className="flex items-center justify-center h-20 text-xs text-gray-700">
            Arraste leads aqui
          </div>
        )}

        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-12 rounded-xl border border-dashed flex items-center justify-center text-xs"
            style={{ borderColor: coluna.cor, color: coluna.cor, background: `${coluna.cor}08` }}
          >
            Soltar aqui
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ── Página principal do Kanban ────────────────────────────────
export default function KanbanPage() {
  const { usuario, isPlatformAdmin } = useAuth()
  // Platform Admin vê todos os leads (tenantId = undefined ignora o filtro)
  // Tenant normal filtra pelo próprio tenant
  const tenantId = usuario?.tenant_id || null
  const isAdmin  = isPlatformAdmin()

  const [dragLeadId, setDragLeadId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [leadSelecionado, setLeadSelecionado] = useState(null)
  const [movendo, setMovendo] = useState(false)
  const dragLead = useRef(null)

  const { data: colunas = COLUNAS_PADRAO } = useStatusColunas(tenantId)

  const { data: kanbanData = {}, isLoading } = useKanbanLeads({
    tenantId,
    colunas,
  })

  const { mutateAsync: moverLead } = useMoverLead()

  const handleDragStart = (e, lead) => {
    dragLead.current = lead
    setDragLeadId(lead.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e, coluna) => {
    e.preventDefault()
    setDragOver(null)

    const lead = dragLead.current
    if (!lead) return

    const slugAtual = lead.status_comercial?.slug || lead.status || 'novo'
    if (slugAtual === coluna.slug) return

    setMovendo(true)
    try {
      await moverLead({
        leadId: lead.id,
        novoStatusSlug: coluna.slug,
        novoStatusId: typeof coluna.id === 'string' && coluna.id.length > 10 ? coluna.id : null,
      })
    } catch (err) {
      console.error('[Kanban] Erro ao mover lead:', err.message)
    } finally {
      setMovendo(false)
      dragLead.current = null
      setDragLeadId(null)
    }
  }

  const totalLeads = Object.values(kanbanData).reduce((acc, arr) => acc + arr.length, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1220]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">
      {/* Header */}
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1">
            Funil de <span className="text-[#10B981] font-bold">Vendas</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-12 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              {totalLeads} leads no funil · arraste para mover entre etapas
            </p>
          </div>
        </motion.div>
      </div>

      {/* Indicador de movendo */}
      <AnimatePresence>
        {movendo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-6 lg:mx-10 mb-4 px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl text-xs text-[#10B981] flex items-center gap-2"
          >
            <div className="w-3 h-3 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
            Atualizando status do lead...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="px-6 lg:px-10 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {colunas.map(coluna => (
            <Coluna
              key={coluna.slug}
              coluna={coluna}
              leads={kanbanData[coluna.slug] || []}
              onDrop={handleDrop}
              onDragOver={setDragOver}
              onDragLeave={() => setDragOver(null)}
              isDragOver={dragOver === coluna.slug}
              onCardClick={setLeadSelecionado}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>

      {/* Modal de detalhes do lead */}
      <AnimatePresence>
        {leadSelecionado && (
          <LeadModal
            lead={leadSelecionado}
            onClose={() => setLeadSelecionado(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}