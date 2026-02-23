import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { useAlertModal } from '../hooks/useAlertModal'
import { useAnalytics, useRealtimeLeads } from '../hooks/useAnalytics'
import {
  AreaChart, Area, LineChart, Line,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as ChartTooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'
import LoadingSpinner from '../components/shared/LoadingSpinner'

const COLORS = ['#10B981','#3b82f6','#3b82f6','#8b5cf6','#ec4899','#10b981','#f43f5e','#06b6d4']

const fmt = (v) => new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL', minimumFractionDigits:0 }).format(v)
const fmtK = (v) => v >= 1000000 ? `R$ ${(v/1000000).toFixed(1)} mi` : v >= 1000 ? `R$ ${(v/1000).toFixed(0)} k` : `R$ ${v}`
const timeAgo = (iso) => {
  const d = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (d < 1)  return 'agora mesmo'
  if (d < 60) return `há ${d} min`
  const h = Math.floor(d/60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h/24)}d`
}

// ── KPI Card (topo, estilo imagem)
function KPICard({ label, value, sub, icon, highlight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`relative bg-[#0F172A] border rounded-3xl p-6 flex flex-col gap-2 overflow-hidden
        ${highlight ? 'border-[#10B981]/40' : 'border-white/5'}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
        <span className="text-2xl opacity-40">{icon}</span>
      </div>
      <p className={`text-2xl lg:text-3xl font-black ${highlight ? 'text-[#10B981]' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
    </motion.div>
  )
}

// ── Feed item ao vivo
function FeedItem({ lead, isNew }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: 30, backgroundColor: 'rgba(16,185,129,0.15)' } : { opacity: 1 }}
      animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex-shrink-0 flex items-center justify-center text-black font-black text-sm">
        {lead.nome?.charAt(0).toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{lead.nome}</p>
        <p className="text-[10px] text-gray-500 truncate">
          {lead.marca?.emoji} {lead.marca?.nome || 'Sem marca'} · {lead.fonte || '—'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-[#10B981]">
          {lead.capital_disponivel ? fmtK(lead.capital_disponivel) : '—'}
        </p>
        <p className="text-[10px] text-gray-600">{timeAgo(lead.created_at)}</p>
      </div>
    </motion.div>
  )
}

// ── Tooltip customizado
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0F172A] border border-[#10B981]/20 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

const PERIODOS = [
  { label: '7D',   value: '7' },
  { label: '15D',  value: '15' },
  { label: '30D',  value: '30' },
  { label: '90D',  value: '90' },
]

export default function AnalyticsPage() {
  const { usuario } = useAuth()
  const { alertModal, showAlert } = useAlertModal()
  const [periodo, setPeriodo] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')
  const [newLeads, setNewLeads] = useState([])
  const [liveLeads, setLiveLeads] = useState([])
  const [clock, setClock] = useState(new Date())
  const prevIdsRef = useRef(new Set())

  // Clock ao vivo (atualiza a cada 10s para reduzir re-renders)
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  const { data, isLoading } = useAnalytics(usuario?.tenant_id, periodo)

  // Realtime
  useRealtimeLeads(usuario?.tenant_id, (novo) => {
    setNewLeads(ids => [novo.id, ...ids].slice(0, 5))
    setLiveLeads(list => [novo, ...list].slice(0, 20))
  })

  // Sincroniza feed ao carregar
  useEffect(() => {
    if (data?.ultimosLeads) setLiveLeads(data.ultimosLeads)
  }, [data])

  const exportCSV = () => {
    if (!data?.ultimosLeads?.length) {
      showAlert({ type: 'warning', title: 'Atenção', message: 'Sem dados para exportar.' })
      return
    }
    const rows = data.ultimosLeads.map(l => [
      l.nome, l.capital_disponivel || 0,
      l.marca?.nome || '', l.status_comercial?.label || '',
      new Date(l.created_at).toLocaleDateString('pt-BR'), l.fonte || ''
    ])
    const csv = '\uFEFF' + ['Nome,Capital,Marca,Status,Data,Fonte', ...rows.map(r => r.join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `analytics_${periodo}d_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (isLoading) return <LoadingSpinner />

  const d = data || {}

  return (
    <div className="min-h-screen bg-[#0B1220] text-white pb-32">

      {/* ── TOPBAR ── */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-8 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-1">
            Analytics <span className="text-[#10B981] font-bold">& BI</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Centro de Inteligência Comercial
            </p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          {/* Ao Vivo */}
          <div className="flex items-center gap-2 bg-[#0F172A] border border-white/5 rounded-2xl px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">AO VIVO</span>
            <span className="text-[10px] text-gray-500">{clock.toLocaleTimeString('pt-BR')}</span>
          </div>
          {/* Período */}
          <div className="flex bg-[#0F172A] border border-white/5 rounded-2xl p-1 gap-1">
            {PERIODOS.map(p => (
              <button key={p.value} onClick={() => setPeriodo(p.value)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all
                  ${periodo === p.value ? 'bg-[#10B981] text-black' : 'text-gray-500 hover:text-white'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {/* Export */}
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-[#0F172A] border border-white/5 hover:border-[#10B981]/30 px-4 py-2.5 rounded-2xl text-xs font-black text-gray-400 hover:text-white transition-all">
            📥 CSV
          </button>
        </div>
      </div>

      {/* ── KPI CARDS (topo, estilo imagem) ── */}
      <div className="px-4 lg:px-10 mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Leads Captados"   value={d.total || 0}         sub={`${d.mediadiaria || '0.0'}/dia em média`}     icon="🎯" />
        <KPICard label="Capital em Leads" value={fmtK(d.capitalFechado || 0)} sub={`${d.vendidos || 0} conversões`}   icon="💰" highlight />
        <KPICard label="Taxa Conversão"   value={`${d.txConversao || '0.0'}%`}    sub={`Meta: 20%`}                      icon="📈" />
        <KPICard label="Capital Pipeline" value={fmtK(d.capitalPipeline || 0)} sub={`${d.pipeline || 0} em negociação`} icon="🤝" />
      </div>

      {/* ── MAIN GRID (gráfico + feed) ── */}
      <div className="px-4 lg:px-10 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* GRÁFICO PRINCIPAL */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-[#0F172A] border border-white/5 rounded-3xl p-6">

          {/* Header gráfico */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white">Leads por Período</h3>
              <p className="text-[10px] text-gray-500">Evolução real vs forecast</p>
            </div>
            <div className="flex gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#10B981] inline-block" /> Leads</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block border-dashed border-t border-blue-400" /> Forecast</span>
            </div>
          </div>

          {/* Tabs período gráfico */}
          <div className="h-[280px] mt-4" style={{ minHeight: 280, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
              <AreaChart data={d.evolucao || []} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gVendidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="dia" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="leads"    name="Leads"     stroke="#10B981" fill="url(#gLeads)"   strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="vendidos" name="Convertidos" stroke="#3b82f6" fill="url(#gVendidos)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Performance MTD (abaixo do gráfico) */}
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Pace {periodo}D</p>
              <p className="text-lg font-black text-white">{d.mediadiaria || '0.0'}/dia</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Forecast 30D</p>
              <p className="text-lg font-black text-[#10B981]">{d.forecast || 0} leads</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Taxa Perca</p>
              <p className="text-lg font-black text-red-400">{d.txDesistencia || '0.0'}%</p>
            </div>
          </div>
        </motion.div>

        {/* FEED AO VIVO */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6 flex flex-col">

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              🔴 Últimos Leads
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] font-black text-red-400 uppercase tracking-wider">Ao Vivo</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none max-h-[380px]">
            <AnimatePresence>
              {liveLeads.slice(0, 15).map((lead) => (
                <FeedItem key={lead.id} lead={lead} isNew={newLeads.includes(lead.id)} />
              ))}
            </AnimatePresence>
            {liveLeads.length === 0 && (
              <div className="text-center py-10 text-gray-600">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-xs">Nenhum lead ainda</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── PREVISÃO IA + PACE ── */}
      <div className="px-4 lg:px-10 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* PREVISÃO IA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#0F172A] to-[#0F172A] border border-[#10B981]/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <div>
              <p className="text-[9px] font-black text-[#10B981] uppercase tracking-wider">Previsão IA</p>
              <p className="text-[8px] text-gray-600">Baseado no histórico do período</p>
            </div>
            <span className="ml-auto text-[8px] bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded-full font-black uppercase">AUTO</span>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Fechamento Estimado</p>
          <p className="text-3xl lg:text-4xl font-black text-white mb-1">{fmtK(d.previsaoIA || 0)}</p>
          <p className="text-[10px] text-gray-500">
            {d.forecast || 0} leads previstos × {d.txConversao || '0.0'}% conversão
          </p>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
            <span className="text-green-400 text-sm">📈</span>
            <span className="text-xs text-gray-400">Projeção baseada nos últimos {periodo} dias</span>
          </div>
        </motion.div>

        {/* PACE 90D */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📊</span>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Pace 90D</p>
              <p className="text-[8px] text-gray-600">Histórico</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Projeção 90 dias</p>
          <p className="text-3xl lg:text-4xl font-black text-white mb-1">{Math.round(d.pace90 || 0)} leads</p>
          <p className="text-[10px] text-gray-500">Média diária: {d.mediadiaria || '0.0'}/dia</p>
          <div className="mt-4">
            <div className="flex justify-between text-[9px] text-gray-600 mb-1">
              <span>Progresso</span>
              <span>{Math.min(100, Math.round((d.total / Math.max(d.pace90, 1)) * 100))}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.round((d.total / Math.max(d.pace90, 1)) * 100))}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* INSIGHTS RÁPIDOS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white mb-1">💡 Insights</h3>

          {[
            {
              icon: (parseFloat(d.txConversao) || 0) >= 20 ? '🎯' : (parseFloat(d.txConversao) || 0) >= 10 ? '📊' : '📉',
              text: `Conversão ${d.txConversao || '0.0'}% — ${(parseFloat(d.txConversao) || 0) >= 20 ? 'Acima da média!' : (parseFloat(d.txConversao) || 0) >= 10 ? 'Na média' : 'Abaixo da média'}`,
              color: (parseFloat(d.txConversao) || 0) >= 20 ? 'text-green-400' : (parseFloat(d.txConversao) || 0) >= 10 ? 'text-yellow-400' : 'text-red-400'
            },
            {
              icon: (d.perdidos || 0) > 0 ? '⚠️' : '✅',
              text: `${d.perdidos || 0} leads perdidos (${d.txDesistencia || '0.0'}% desistência)`,
              color: (d.perdidos || 0) > 5 ? 'text-red-400' : 'text-gray-400'
            },
            {
              icon: '⏱️',
              text: `Ciclo médio: ${d.cicloMedio || '0'} dias até conversão`,
              color: 'text-blue-400'
            },
            {
              icon: '💸',
              text: `Capital perdido: ${fmtK(d.capitalPerdido || 0)}`,
              color: (d.capitalPerdido || 0) > 50000 ? 'text-red-400' : 'text-gray-400'
            },
          ].map((ins, i) => (
            <div key={i} className="flex items-start gap-2 bg-white/3 rounded-xl px-3 py-2">
              <span className="text-base mt-0.5">{ins.icon}</span>
              <p className={`text-xs font-medium ${ins.color}`}>{ins.text}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── GRÁFICOS SECUNDÁRIOS ── */}
      <div className="px-4 lg:px-10 mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PIE: Leads por Marca */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-6">🏢 Leads por Marca</h3>
          {(d.porMarca || []).length > 0 ? (
            <div className="h-[260px]" style={{ minHeight: 260, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
                <PieChart>
                  <Pie data={d.porMarca} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {(d.porMarca || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <ChartTooltip contentStyle={{ backgroundColor:'#0B1220', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'12px', color:'#F8FAFC', padding:'8px 14px' }} itemStyle={{ color:'#F8FAFC', fontSize:'13px', fontWeight:'bold' }} labelStyle={{ color:'#94A3B8', fontSize:'11px' }} />
                  <Legend verticalAlign="bottom" height={36} formatter={v => <span style={{ color:'#CBD5E1', fontSize:'11px' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-gray-600 text-sm">Sem dados suficientes</div>
          )}
        </motion.div>

        {/* BAR: Motivos de Perda */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-6">📉 Motivos de Perda</h3>
          {(d.motivosPerda || []).length > 0 ? (
            <div className="h-[260px]" style={{ minHeight: 260, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
                <BarChart data={d.motivosPerda} margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="motivo" stroke="#374151" fontSize={8} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                  <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" name="Leads" fill="#10B981" radius={[8,8,0,0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-gray-600 text-sm">Nenhuma perda registrada 🎉</div>
          )}
        </motion.div>
      </div>
      {alertModal}
    </div>
  )
}
