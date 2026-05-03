// KanbanPage — Funil de Vendas
import { useState, useRef, memo, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import {
  useStatusColunas, useKanbanLeads, useMoverLead, COLUNAS_PADRAO, SLUGS_FECHADO,
} from '../hooks/useKanban'
import LeadModal from '../components/leads/LeadModal'
import VendaModal from '../components/vendas/VendaModal'
import AtribuirOperadorModal from '../components/leads/AtribuirOperadorModal'
import { useRegistrarVenda } from '../hooks/useVendas'
import { supabase } from '../lib/supabase'

// Verifica se um id de coluna é um UUID válido
function isColUUID(col) {
  return typeof col?.id === 'string' && col.id.length === 36 && col.id.includes('-')
}

// ── Helpers ──────────────────────────────────────────────
function fmtCapital(v) {
  if (!v) return null
  const n = parseFloat(v)
  if (isNaN(n) || n <= 0) return null
  if (n >= 1_000_000) return `R$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$${(n / 1_000).toFixed(0)}K`
  return `R$${n.toLocaleString('pt-BR')}`
}

function diasAtras(iso) {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  const h  = Math.floor(ms / 3_600_000)
  const d  = Math.floor(ms / 86_400_000)
  if (h < 1)  return 'agora'
  if (h < 24) return `${h}h atrás`
  if (d === 1) return '1d atrás'
  if (d < 7)  return `${d}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function getInitials(nome) {
  if (!nome) return '?'
  return nome.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// ── Canal de origem ──────────────────────────────────────
const CANAL_MAP = [
  { match: ['whatsapp','wpp','zap'],              label: 'WhatsApp',   color: '#25D366', bg: '#25D36620' },
  { match: ['instagram','insta'],                 label: 'Instagram',  color: '#E1306C', bg: '#E1306C20' },
  { match: ['facebook','fb'],                     label: 'Facebook',   color: '#1877F2', bg: '#1877F220' },
  { match: ['google','ads'],                      label: 'Google Ads', color: '#FBBC05', bg: '#FBBC0520' },
  { match: ['chatbot','bot'],                     label: 'Chatbot',    color: '#F97316', bg: '#F9731620' },
  { match: ['indicacao','referral','ind'],         label: 'Indicação',  color: '#8B5CF6', bg: '#8B5CF620' },
  { match: ['n8n','make','zapier'],               label: 'N8N',        color: '#EA580C', bg: '#EA580C20' },
  { match: ['form','lp','landing','site','website'], label: 'Website', color: '#06B6D4', bg: '#06B6D420' },
  { match: ['api','webhook'],                     label: 'API',        color: '#8B5CF6', bg: '#8B5CF620' },
  { match: ['import','planilha','csv'],           label: 'Importação', color: '#64748B', bg: '#64748B20' },
  { match: ['manual'],                            label: 'Manual',     color: '#64748B', bg: '#64748B20' },
]

function getCanal(fonte) {
  if (!fonte) return null
  const f = fonte.toLowerCase()
  return CANAL_MAP.find(c => c.match.some(m => f.includes(m))) ?? null
}

// ── Card do lead ─────────────────────────────────────────
const LeadCard = memo(function LeadCard({ lead, isDragging, onDragStart, onDragEnd, onClick, showReabrirBtn, onReabrir }) {
  const score    = lead.score ?? 0
  const canal    = getCanal(lead.fonte)
  const cap      = fmtCapital(lead.capital_disponivel)
  const dias     = diasAtras(lead.created_at)
  const ini      = getInitials(lead.nome)
  const corScore = score >= 80 ? '#EF4444' : score >= 60 ? '#F59E0B' : '#64748B'

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(lead)}
      className={[
        'bg-[#0F172A] rounded-xl border border-white/[0.07] p-3.5',
        'cursor-grab active:cursor-grabbing select-none transition-all duration-150',
        isDragging
          ? 'opacity-40 scale-[0.97]'
          : 'hover:bg-[#131B2E] hover:border-white/[0.14] hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5',
      ].join(' ')}
    >
      {/* Nome + avatar + score */}
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
          <span className="text-[9px] font-black text-gray-400 tracking-tight">{ini}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold text-white leading-snug truncate">{lead.nome}</p>
          {(lead.telefone || lead.email) && (
            <p className="text-[10px] text-gray-500 truncate mt-0.5">
              {lead.telefone || lead.email}
            </p>
          )}
        </div>
        {score > 0 && (
          <span
            className="text-[10px] font-black tabular-nums shrink-0 mt-0.5"
            style={{ color: corScore }}
          >
            {score}
          </span>
        )}
      </div>

      {/* Canal + capital */}
      <div className="flex items-center justify-between gap-2 min-h-[22px]">
        {canal ? (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: canal.bg, color: canal.color }}
          >
            {canal.label}
          </span>
        ) : (
          <span />
        )}
        {cap && (
          <span className="text-[12px] font-black text-white tabular-nums shrink-0">
            {cap}
          </span>
        )}
      </div>

      {/* Rodapé: consultor + dias */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.05]">
        <span className="text-[10px] text-gray-600 truncate">
          {lead.operador ? lead.operador.nome.split(' ')[0] : ''}
        </span>
        {dias && (
          <span className="text-[9px] text-gray-500 tabular-nums">{dias}</span>
        )}
      </div>

      {/* Botão Reabrir Lead (apenas na coluna Perdido) */}
      {showReabrirBtn && (
        <button
          onClick={(e) => { e.stopPropagation(); onReabrir(lead) }}
          className="mt-2.5 w-full py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-[#06b6d4]/10 text-[#06b6d4] hover:bg-[#06b6d4]/20 border border-[#06b6d4]/20"
        >
          ↩ Reabrir Lead
        </button>
      )}
    </div>
  )
})

// ── Coluna ────────────────────────────────────────────────
const Coluna = memo(function Coluna({ coluna, leads, dragLeadId, dragOver, onDragStart, onDragEnd, onDrop, onLeadClick, onReabrirLead }) {
  const isOver  = dragOver === coluna.slug
  const capital = leads.reduce((a, l) => a + parseFloat(l.capital_disponivel || 0), 0)
  const isPerdido = coluna.slug === 'perdido'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={[
          'px-3 py-2.5 mb-2 rounded-xl border transition-all',
          isOver ? 'border-white/[0.12] bg-white/[0.04]' : 'bg-[#0A0F1E] border-white/[0.06]',
        ].join(' ')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: coluna.cor }} />
            <span className="text-[11px] font-black text-white truncate">{coluna.label}</span>
            {coluna.is_final && (
              <span
                className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: `${coluna.cor}25`, color: coluna.cor }}
                title="Status finalizado"
              >
                final
              </span>
            )}
          </div>
          <span className="text-[10px] font-black text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-full tabular-nums shrink-0 ml-1">
            {leads.length}
          </span>
        </div>
        {capital > 0 && (
          <p className="text-[9px] font-bold text-gray-600 tabular-nums mt-0.5 pl-4">
            {capital.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={[
          'flex-1 rounded-xl p-1.5 space-y-2 min-h-[60px] transition-all',
          isOver ? 'bg-[#10B981]/[0.03] ring-1 ring-dashed ring-[#10B981]/20' : '',
        ].join(' ')}
        onDragOver={(e) => { e.preventDefault(); onDrop('over', coluna.slug) }}
        onDragLeave={() => onDrop('leave', coluna.slug)}
        onDrop={(e) => onDrop('drop', coluna.slug, e)}
      >
        <AnimatePresence mode="popLayout">
          {leads.map(lead => (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.14 }}
            >
              <LeadCard
                lead={lead}
                isDragging={dragLeadId === lead.id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={onLeadClick}
                showReabrirBtn={isPerdido}
                onReabrir={onReabrirLead}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {leads.length === 0 && !isOver && (
          <div className="h-14 flex items-center justify-center rounded-xl border border-dashed border-white/[0.04]">
            <p className="text-[9px] text-gray-700 uppercase tracking-wider">Vazio</p>
          </div>
        )}
        {isOver && (
          <div className="h-12 flex items-center justify-center rounded-xl border border-dashed border-[#10B981]/25">
            <p className="text-[9px] text-[#10B981]/50 uppercase tracking-wider">Solte aqui</p>
          </div>
        )}
      </div>
    </div>
  )
})

// ── Filtros de período ────────────────────────────────────
const FILTROS = [
  { key: 'diaria',  label: 'Hoje'    },
  { key: 'semanal', label: 'Semana'  },
  { key: 'mensal',  label: 'Mês'     },
  { key: 'geral',   label: 'Geral'   },
]

function getDataInicio(filtro) {
  if (filtro === 'diaria')  { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString() }
  if (filtro === 'semanal') { const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); d.setHours(0,0,0,0); return d.toISOString() }
  if (filtro === 'mensal')  { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString() }
  return null
}

// ── Página principal ──────────────────────────────────────
export default function KanbanPage() {
  const { usuario, isPlatformAdmin } = useAuth()
  const tenantId = isPlatformAdmin() ? null : usuario?.tenant_id

  const [filtro,              setFiltro]              = useState('geral')
  const [dragOver,            setDragOver]            = useState(null)
  const [dragLeadId,          setDragLeadId]          = useState(null)
  const [lead,                setLead]                = useState(null)
  const [vendaPendente,       setVendaPendente]       = useState(null)   // { lead, slugDestino, colId }
  const [agendPendente,       setAgendPendente]       = useState(null)   // { lead, colId } — aguardando atribuição
  const [perdaPendente,       setPerdaPendente]       = useState(null)   // { lead, colId } — aguardando motivo
  const [motivosOpts,         setMotivosOpts]         = useState([])
  const [motivoSelecionado,   setMotivoSelecionado]   = useState('')
  const [bannerVisible,       setBannerVisible]       = useState(() => {
    try { return localStorage.getItem('lc-fluxo-banner') !== 'hidden' }
    catch { return true }
  })
  const dragRef = useRef(null)

  const { data: colunas = COLUNAS_PADRAO } = useStatusColunas(tenantId)
  const { data: kanban = {}, isLoading, isError, refetch } = useKanbanLeads({ tenantId, colunas, dataInicio: getDataInicio(filtro) })
  const { mutateAsync: mover }             = useMoverLead()
  const registrarVenda                     = useRegistrarVenda()

  // Carrega motivos de desistência do tenant
  useEffect(() => {
    if (!tenantId) return
    supabase.from('motivos_desistencia').select('id, nome').eq('tenant_id', tenantId).eq('ativo', true).order('nome')
      .then(({ data }) => setMotivosOpts(data || []))
  }, [tenantId])

  function hideBanner() {
    setBannerVisible(false)
    try { localStorage.setItem('lc-fluxo-banner', 'hidden') } catch {}
  }

  // Contagem de convertidos: usa metadados requer_valor do banco para ser dinâmico
  const slugsConvertidos = useMemo(
    () => new Set([...colunas.filter(c => c.requer_valor).map(c => c.slug), ...SLUGS_FECHADO]),
    [colunas]
  )
  const allLeads   = useMemo(() => Object.values(kanban).flat(), [kanban])
  const totalLeads = allLeads.length
  const totalConv  = useMemo(
    () => [...slugsConvertidos].reduce((acc, slug) => acc + (kanban[slug]?.length ?? 0), 0),
    [kanban, slugsConvertidos]
  )
  const txConv     = totalLeads > 0 ? Math.round((totalConv / totalLeads) * 100) : 0
  const totalCap   = allLeads.reduce((a, l) => a + parseFloat(l.capital_disponivel || 0), 0)

  function fmtK(v) {
    if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000)     return `R$${(v / 1_000).toFixed(0)}K`
    return `R$${Math.round(v)}`
  }

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
    const col   = colunas.find(c => c.slug === slug)
    const colId = isColUUID(col) ? col.id : null

    // Exige valor de venda
    if (SLUGS_FECHADO.includes(slug) || col?.requer_valor) {
      setVendaPendente({ lead: l, slugDestino: slug, colId })
      dragRef.current = null; setDragLeadId(null)
      return
    }

    // Em Agendamento exige operador atribuído
    if (slug === 'em_agendamento' && !l.id_operador_responsavel) {
      setAgendPendente({ lead: l, colId })
      dragRef.current = null; setDragLeadId(null)
      return
    }

    // Perdido exige motivo de desistência
    if (slug === 'perdido' && !l.id_motivo_desistencia) {
      setPerdaPendente({ lead: l, colId })
      setMotivoSelecionado('')
      dragRef.current = null; setDragLeadId(null)
      return
    }

    try {
      await mover({ leadId: l.id, novoStatusSlug: slug, novoStatusId: colId, tenantId })
    } catch (err) { console.error('[Kanban]', err.message) }
    finally { dragRef.current = null; setDragLeadId(null) }
  }, [colunas, dragOver, mover, tenantId])

  // Reabrir lead: move para 'reaberto' sem operador — gestor deve atribuir e mover para em_agendamento
  const onReabrirLead = useCallback(async (l) => {
    const colReaberto = colunas.find(c => c.slug === 'reaberto')
    if (!colReaberto) return
    try {
      await supabase.from('leads').update({ id_operador_responsavel: null, updated_at: new Date().toISOString() }).eq('id', l.id)
      await mover({
        leadId: l.id,
        novoStatusSlug: 'reaberto',
        novoStatusId: isColUUID(colReaberto) ? colReaberto.id : null,
        tenantId,
      })
    } catch (err) { console.error('[Kanban] Erro ao reabrir lead:', err.message) }
  }, [colunas, mover, tenantId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center flex-col gap-4">
        <p className="text-gray-400 text-sm font-bold">Erro ao carregar o funil</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-[#10B981]/10 text-[#10B981] text-xs font-bold hover:bg-[#10B981]/20 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0B1220]">

      {/* Banner fluxo de vida */}
      <AnimatePresence>
        {bannerVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-4 lg:px-8 py-2 bg-[#06b6d4]/[0.08] border-b border-[#06b6d4]/20">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#06b6d4] text-[11px] shrink-0">◆</span>
                <p className="text-[10px] text-[#06b6d4]/80 truncate">
                  Conheça as regras do fluxo de vida do lead — etapas, obrigações e SLA
                </p>
                <Link
                  to="/fluxo-vida-lead"
                  className="shrink-0 text-[10px] font-black text-[#06b6d4] hover:text-white transition-colors underline underline-offset-2"
                >
                  Ver fluxograma
                </Link>
              </div>
              <button onClick={hideBanner} className="shrink-0 text-[#06b6d4]/40 hover:text-[#06b6d4] transition-colors text-xs">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 lg:px-8 pt-5 pb-4 border-b border-white/[0.05] shrink-0">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white">
              Funil de <span className="text-[#10B981]">Vendas</span>
            </h1>
            <p className="text-[10px] text-gray-600 mt-0.5">Arraste os cards para mover entre etapas</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Total',       value: totalLeads,     color: 'text-white'      },
              { label: 'Convertidos', value: totalConv,      color: 'text-[#10B981]'  },
              { label: 'Conversão',   value: `${txConv}%`,   color: 'text-gray-300'   },
              { label: 'Capital',     value: fmtK(totalCap), color: 'text-[#10B981]'  },
            ].map(kpi => (
              <div key={kpi.label} className="bg-[#0A0F1E] border border-white/[0.07] rounded-xl px-3 py-2 text-center min-w-[64px]">
                <p className="text-[8px] font-black uppercase tracking-wider text-gray-600 mb-0.5">{kpi.label}</p>
                <p className={`text-sm font-black tabular-nums ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filtro de período */}
        <div className="flex gap-1">
          {FILTROS.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={[
                'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                filtro === f.key
                  ? 'bg-[#10B981] text-black'
                  : 'bg-white/[0.04] text-gray-500 hover:bg-white/[0.07] hover:text-gray-300',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
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
                onReabrirLead={onReabrirLead}
              />
            </div>
          ))}
        </div>
      </div>

      {lead && <LeadModal lead={lead} onClose={() => setLead(null)} />}

      {/* Modal: venda obrigatória ao mover para convertido/vendido */}
      {vendaPendente && (
        <VendaModal
          lead={vendaPendente.lead}
          vendaExistente={null}
          isSaving={registrarVenda.isPending}
          onClose={() => setVendaPendente(null)}
          onSave={async (payload) => {
            try {
              await mover({
                leadId:         vendaPendente.lead.id,
                novoStatusSlug: vendaPendente.slugDestino,
                novoStatusId:   vendaPendente.colId,
                tenantId,
              })
              await registrarVenda.mutateAsync(payload)
            } catch (err) {
              console.error('[Kanban] Erro ao fechar venda:', err.message)
            } finally {
              setVendaPendente(null)
            }
          }}
        />
      )}

      {/* Modal: atribuição obrigatória ao mover para agendado */}
      {agendPendente && (
        <AtribuirOperadorModal
          lead={agendPendente.lead}
          onClose={() => setAgendPendente(null)}
          onSuccess={async () => {
            const colAgend = colunas.find(c => c.slug === 'em_agendamento')
            try {
              await mover({
                leadId: agendPendente.lead.id,
                novoStatusSlug: 'em_agendamento',
                novoStatusId: isColUUID(colAgend) ? colAgend.id : null,
                tenantId,
              })
            } catch (err) { console.error('[Kanban] Erro ao mover para em_agendamento:', err.message) }
            finally { setAgendPendente(null) }
          }}
        />
      )}

      {/* Modal: motivo obrigatório ao mover para perdido */}
      {perdaPendente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPerdaPendente(null)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-sm bg-[#0B1220] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-sm font-black text-white mb-1">Motivo da Perda</h3>
            <p className="text-[10px] text-gray-500 mb-4">Informe o motivo antes de mover para Perdido</p>
            {motivosOpts.length === 0 ? (
              <p className="text-[11px] text-yellow-400/80 mb-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
                Nenhum motivo cadastrado. Acesse Configurações para adicionar.
              </p>
            ) : (
              <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto">
                {motivosOpts.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMotivoSelecionado(m.id)}
                    className={[
                      'w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition-all border',
                      motivoSelecionado === m.id
                        ? 'bg-red-500/15 text-red-300 border-red-500/30'
                        : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.07]',
                    ].join(' ')}
                  >
                    {m.nome}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setPerdaPendente(null)}
                className="flex-1 py-2.5 rounded-xl text-[11px] font-bold bg-white/[0.05] text-gray-400 border border-white/[0.08] hover:bg-white/[0.08] transition-all">
                Cancelar
              </button>
              <button
                disabled={!motivoSelecionado && motivosOpts.length > 0}
                onClick={async () => {
                  const colPerdido = colunas.find(c => c.slug === 'perdido') ?? colunas.find(c => c.is_final && c.permite_reabertura)
                  try {
                    if (motivoSelecionado) {
                      await supabase.from('leads').update({ id_motivo_desistencia: motivoSelecionado, updated_at: new Date().toISOString() }).eq('id', perdaPendente.lead.id)
                    }
                    await mover({
                      leadId: perdaPendente.lead.id,
                      novoStatusSlug: 'perdido',
                      novoStatusId: isColUUID(colPerdido) ? colPerdido.id : null,
                      tenantId,
                    })
                  } catch (err) { console.error('[Kanban] Erro ao marcar perdido:', err.message) }
                  finally { setPerdaPendente(null) }
                }}
                className="flex-1 py-2.5 rounded-xl text-[11px] font-black bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-all">
                Confirmar Perda
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
