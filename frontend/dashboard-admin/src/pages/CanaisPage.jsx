// CanaisPage — Análise de Canais de Captação
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'

// ── Definição dos canais ──────────────────────────────────
const CANAL_DEFS = [
  {
    id: 'whatsapp', label: 'WhatsApp', cor: '#25D366', custo: 'Grátis',
    fontes: ['whatsapp', 'wpp', 'zap'],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 1.745.456 3.38 1.25 4.8L2 22l5.313-1.234A9.956 9.956 0 0012 22c5.522 0 10-4.485 10-10.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    id: 'google', label: 'Google Ads', cor: '#FBBC05', custo: null,
    fontes: ['google', 'ads', 'googleads'],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    id: 'instagram', label: 'Instagram', cor: '#E1306C', custo: null,
    fontes: ['instagram', 'insta'],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'facebook', label: 'Facebook', cor: '#1877F2', custo: null,
    fontes: ['facebook', 'fb'],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'website', label: 'Website', cor: '#06B6D4', custo: null,
    fontes: ['site', 'website', 'form', 'lp', 'landing'],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    id: 'chatbot', label: 'Chatbot', cor: '#F97316', custo: null,
    fontes: ['chatbot', 'bot'],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21l4-4 4 4" />
        <path d="M9 8h.01M12 8h.01M15 8h.01" />
      </svg>
    ),
  },
  {
    id: 'n8n', label: 'N8N', cor: '#EA580C', custo: 'Grátis',
    fontes: ['n8n', 'make', 'zapier', 'automac'],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    id: 'indicacao', label: 'Indicação', cor: '#8B5CF6', custo: 'Grátis',
    fontes: ['indicacao', 'referral', 'ref', 'ind', 'indicac'],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: 'manual', label: 'Manual', cor: '#94A3B8', custo: 'Grátis',
    fontes: ['manual'],
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
]

function matchCanal(fonte) {
  if (!fonte) return 'manual'
  const f = fonte.toLowerCase()
  for (const c of CANAL_DEFS) {
    if (c.fontes.some(m => f.includes(m))) return c.id
  }
  return 'manual'
}

function fmtBRL(v) {
  if (!v || v <= 0) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

// ── Donut Chart SVG ───────────────────────────────────────
function DonutChart({ segments, size = 160, sw = 26 }) {
  const r    = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const cx   = size / 2
  const cy   = size / 2
  const total = segments.reduce((a, s) => a + s.total, 0)

  const computed = []
  let cumulative = 0
  for (const s of segments) {
    if (s.total > 0) {
      const dash = (s.total / total) * circ
      computed.push({ cor: s.cor, dash, offset: cumulative })
      cumulative += dash
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E293B" strokeWidth={sw} />
      {computed.map((s, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.cor}
          strokeWidth={sw}
          strokeDasharray={`${s.dash} ${circ}`}
          strokeDashoffset={-s.offset}
        />
      ))}
      {total === 0 && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#475569"
          fontSize="10"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}
        >
          Sem dados
        </text>
      )}
    </svg>
  )
}

// ── KPI Card ─────────────────────────────────────────────
function KpiCard({ icon, label, value, gradient, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${gradient} border border-white/[0.07] rounded-2xl p-5`}
    >
      <div className="mb-3 opacity-80">{icon}</div>
      <p className="text-[22px] font-black text-white tabular-nums leading-none">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 mt-1.5">{label}</p>
    </motion.div>
  )
}

// ── Canal Card ────────────────────────────────────────────
function CanalCard({ canal, stats, delay }) {
  const conversao = stats.total > 0 ? Math.round((stats.convertidos / stats.total) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#0F172A] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.13] transition-all"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${canal.cor}20`, color: canal.cor }}
        >
          {canal.icon}
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">{canal.label}</p>
          <p className="text-[10px] text-gray-500">{stats.total} leads</p>
        </div>
      </div>

      {/* Stats 2x2 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-gray-600 mb-1">Convertidos</p>
          <p className="text-[17px] font-black text-white tabular-nums">{stats.convertidos}</p>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-gray-600 mb-1">Conversão</p>
          <p className="text-[17px] font-black tabular-nums" style={{ color: canal.cor }}>
            {conversao}%
          </p>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-gray-600 mb-1">Receita</p>
          <p className="text-[12px] font-black text-white tabular-nums">{fmtBRL(stats.receita)}</p>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-gray-600 mb-1">Custo</p>
          <p className="text-[12px] font-black text-gray-400">{canal.custo ?? 'N/D'}</p>
        </div>
      </div>

      {/* Barra de conversão */}
      <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${conversao}%`, background: canal.cor }}
        />
      </div>
    </motion.div>
  )
}

// ── Página principal ──────────────────────────────────────
export default function CanaisPage() {
  const { usuario } = useAuth()
  const [leads,   setLeads]   = useState([])
  const [loading, setLoading] = useState(true)

  const tenantId = usuario?.is_super_admin ? null : usuario?.tenant_id

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase
        .from('leads')
        .select('fonte, status, capital_disponivel')
        .is('deleted_at', null)
      if (tenantId) q = q.eq('tenant_id', tenantId)
      const { data } = await q
      setLeads(data ?? [])
      setLoading(false)
    }
    load()
  }, [tenantId])

  const { stats, totalLeads, receitaTotal, convMedia } = useMemo(() => {
    const map = {}
    for (const c of CANAL_DEFS) {
      map[c.id] = { total: 0, convertidos: 0, receita: 0 }
    }

    for (const l of leads) {
      const cid  = matchCanal(l.fonte)
      const isConv = l.status === 'convertido' || l.status === 'vendido'
      map[cid].total++
      if (isConv) {
        map[cid].convertidos++
        map[cid].receita += parseFloat(l.capital_disponivel || 0)
      }
    }

    const totalLeads   = leads.length
    const totalConv    = Object.values(map).reduce((a, s) => a + s.convertidos, 0)
    const receitaTotal = Object.values(map).reduce((a, s) => a + s.receita, 0)
    const convMedia    = totalLeads > 0 ? ((totalConv / totalLeads) * 100).toFixed(1) : '0.0'
    return { stats: map, totalLeads, receitaTotal, convMedia }
  }, [leads])

  const donutSegments = CANAL_DEFS.map(c => ({ cor: c.cor, label: c.label, total: stats[c.id]?.total ?? 0 }))
  const canaisAtivos  = CANAL_DEFS.filter(c => (stats[c.id]?.total ?? 0) > 0).length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0B1220] px-4 lg:px-10 py-6 lg:py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Canais de Captação</h1>
        <p className="text-[11px] text-gray-500 mt-1">Performance detalhada de cada canal de aquisição</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          delay={0}
          gradient="from-[#10B981]/15 to-[#10B981]/5"
          label="Total Canais"
          value={CANAL_DEFS.length}
          icon={
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10B981" strokeWidth="1.5">
              <path d="M18 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2z" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          }
        />
        <KpiCard
          delay={0.06}
          gradient="from-[#06B6D4]/15 to-[#06B6D4]/5"
          label="Total Leads"
          value={totalLeads}
          icon={
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#06B6D4" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          }
        />
        <KpiCard
          delay={0.12}
          gradient="from-[#8B5CF6]/15 to-[#8B5CF6]/5"
          label="Receita Total"
          value={fmtBRL(receitaTotal)}
          icon={
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#8B5CF6" strokeWidth="1.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <KpiCard
          delay={0.18}
          gradient="from-[#F59E0B]/15 to-[#F59E0B]/5"
          label="Conv. Média"
          value={`${convMedia}%`}
          icon={
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#F59E0B" strokeWidth="1.5">
              <path d="M22 7l-8.5 8.5-5-5L2 17" />
              <path d="M16 7h6v6" />
            </svg>
          }
        />
      </div>

      {/* Main: Donut + Canal Grid */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Donut + legenda */}
        <div className="lg:w-72 shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0F172A] border border-white/[0.07] rounded-2xl p-5 sticky top-6"
          >
            <p className="text-[11px] font-black uppercase tracking-wider text-white mb-5">
              Distribuição por Canal
            </p>

            <div className="flex justify-center mb-6">
              <div className="relative">
                <DonutChart segments={donutSegments} size={160} sw={24} />
                {totalLeads > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[18px] font-black text-white tabular-nums">{totalLeads}</p>
                    <p className="text-[8px] text-gray-600 uppercase tracking-wider">leads</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              {CANAL_DEFS
                .filter(c => (stats[c.id]?.total ?? 0) > 0)
                .sort((a, b) => (stats[b.id]?.total ?? 0) - (stats[a.id]?.total ?? 0))
                .map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.cor }} />
                      <span className="text-[11px] text-gray-400 truncate">{c.label}</span>
                    </div>
                    <span className="text-[11px] font-black text-white tabular-nums shrink-0">
                      {stats[c.id]?.total ?? 0}
                    </span>
                  </div>
                ))
              }
              {totalLeads === 0 && (
                <p className="text-[10px] text-gray-600 text-center py-3">Nenhum lead ainda</p>
              )}
            </div>

            {canaisAtivos > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                <span className="text-[9px] text-gray-600 uppercase tracking-wider">Canais ativos</span>
                <span className="text-[11px] font-black text-[#10B981]">{canaisAtivos}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Grid de canais */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {CANAL_DEFS.map((canal, i) => (
              <CanalCard
                key={canal.id}
                canal={canal}
                stats={stats[canal.id] ?? { total: 0, convertidos: 0, receita: 0 }}
                delay={0.24 + i * 0.04}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
