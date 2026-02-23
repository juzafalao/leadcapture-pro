#!/bin/bash

# ============================================================
# Script: Atualiza AnalyticsPage.jsx e Sidebar.jsx
# Execute na raiz do projeto: bash apply_fixes.sh
# ============================================================

set -e  # Para se qualquer comando falhar

echo ""
echo "🚀 Iniciando atualização dos arquivos..."
echo ""

# ── Caminhos ──────────────────────────────────────────────
ANALYTICS="frontend/dashboard-admin/src/pages/AnalyticsPage.jsx"
SIDEBAR="frontend/dashboard-admin/src/components/Sidebar.jsx"

# ── Backup dos arquivos originais ─────────────────────────
echo "📦 Fazendo backup dos arquivos originais..."
cp "$ANALYTICS" "${ANALYTICS}.bak"
cp "$SIDEBAR"   "${SIDEBAR}.bak"
echo "   ✅ Backups criados (.bak)"
echo ""

# ══════════════════════════════════════════════════════════
# ARQUIVO 1: AnalyticsPage.jsx
# ══════════════════════════════════════════════════════════
echo "📝 Escrevendo AnalyticsPage.jsx..."

cat > "$ANALYTICS" << 'ANALYTICS_EOF'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { useAnalytics, useRealtimeLeads } from '../hooks/useAnalytics'
import {
  AreaChart, Area, LineChart, Line,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as ChartTooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'

const COLORS = ['#10B981','#3b82f6','#8b5cf6','#ec4899','#f59e0b','#f43f5e','#06b6d4','#a3e635']

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

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={{
      backgroundColor: '#0B1220',
      border: '1px solid rgba(16,185,129,0.2)',
      borderRadius: '12px',
      padding: '8px 14px',
      pointerEvents: 'none',
    }}>
      <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>{item.name}</p>
      <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700, margin: '2px 0 0' }}>
        {item.value} leads
      </p>
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
  const [periodo, setPeriodo] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')
  const [newLeads, setNewLeads] = useState([])
  const [liveLeads, setLiveLeads] = useState([])
  const [clock, setClock] = useState(new Date())
  const prevIdsRef = useRef(new Set())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { data, isLoading } = useAnalytics(usuario?.tenant_id, periodo)

  useRealtimeLeads(usuario?.tenant_id, (novo) => {
    setNewLeads(ids => [novo.id, ...ids].slice(0, 5))
    setLiveLeads(list => [novo, ...list].slice(0, 20))
  })

  useEffect(() => {
    if (data?.ultimosLeads) setLiveLeads(data.ultimosLeads)
  }, [data])

  const exportCSV = () => {
    if (!data?.ultimosLeads?.length) return alert('Sem dados para exportar.')
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

  if (isLoading) return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="text-6xl">⏳</motion.div>
    </div>
  )

  const d = data || {}

  return (
    <div className="min-h-screen bg-[#0B1220] text-white pb-32">

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
          <div className="flex items-center gap-2 bg-[#0F172A] border border-white/5 rounded-2xl px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">AO VIVO</span>
            <span className="text-[10px] text-gray-500">{clock.toLocaleTimeString('pt-BR')}</span>
          </div>
          <div className="flex bg-[#0F172A] border border-white/5 rounded-2xl p-1 gap-1">
            {PERIODOS.map(p => (
              <button key={p.value} onClick={() => setPeriodo(p.value)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all
                  ${periodo === p.value ? 'bg-[#10B981] text-black' : 'text-gray-500 hover:text-white'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-[#0F172A] border border-white/5 hover:border-[#10B981]/30 px-4 py-2.5 rounded-2xl text-xs font-black text-gray-400 hover:text-white transition-all">
            📥 CSV
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-10 mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Leads Captados"   value={d.total || 0}               sub={`${d.mediadiaria}/dia em média`}      icon="🎯" />
        <KPICard label="Capital em Leads" value={fmtK(d.capitalFechado || 0)} sub={`${d.vendidos || 0} conversões`}      icon="💰" highlight />
        <KPICard label="Taxa Conversão"   value={`${d.txConversao || 0}%`}    sub={`Meta: 20%`}                          icon="📈" />
        <KPICard label="Capital Pipeline" value={fmtK(d.capitalPipeline || 0)} sub={`${d.pipeline || 0} em negociação`} icon="🤝" />
      </div>

      <div className="px-4 lg:px-10 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-[#0F172A] border border-white/5 rounded-3xl p-6">

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

          <div className="h-[280px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
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
                <Area type="monotone" dataKey="leads"    name="Leads"      stroke="#10B981" fill="url(#gLeads)"    strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="vendidos" name="Convertidos" stroke="#3b82f6" fill="url(#gVendidos)" strokeWidth={2}   dot={false} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Pace {periodo}D</p>
              <p className="text-lg font-black text-white">{d.mediadiaria}/dia</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Forecast 30D</p>
              <p className="text-lg font-black text-[#10B981]">{d.forecast || 0} leads</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Taxa Perca</p>
              <p className="text-lg font-black text-red-400">{d.txDesistencia || 0}%</p>
            </div>
          </div>
        </motion.div>

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

      <div className="px-4 lg:px-10 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

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
            {d.forecast || 0} leads previstos × {d.txConversao || 0}% conversão
          </p>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
            <span className="text-green-400 text-sm">📈</span>
            <span className="text-xs text-gray-400">Projeção baseada nos últimos {periodo} dias</span>
          </div>
        </motion.div>

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
          <p className="text-[10px] text-gray-500">Média diária: {d.mediadiaria}/dia</p>
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white mb-1">💡 Insights</h3>

          {[
            {
              icon: d.txConversao >= 20 ? '🎯' : d.txConversao >= 10 ? '📊' : '📉',
              text: `Conversão ${d.txConversao}% — ${d.txConversao >= 20 ? 'Acima da média!' : d.txConversao >= 10 ? 'Na média' : 'Abaixo da média'}`,
              color: d.txConversao >= 20 ? 'text-green-400' : d.txConversao >= 10 ? 'text-yellow-400' : 'text-red-400'
            },
            {
              icon: d.perdidos > 0 ? '⚠️' : '✅',
              text: `${d.perdidos} leads perdidos (${d.txDesistencia}% desistência)`,
              color: d.perdidos > 5 ? 'text-red-400' : 'text-gray-400'
            },
            {
              icon: '⏱️',
              text: `Ciclo médio: ${d.cicloMedio} dias até conversão`,
              color: 'text-blue-400'
            },
            {
              icon: '💸',
              text: `Capital perdido: ${fmtK(d.capitalPerdido || 0)}`,
              color: d.capitalPerdido > 50000 ? 'text-red-400' : 'text-gray-400'
            },
          ].map((ins, i) => (
            <div key={i} className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2">
              <span className="text-base mt-0.5">{ins.icon}</span>
              <p className={`text-xs font-medium ${ins.color}`}>{ins.text}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="px-4 lg:px-10 mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-6">🏢 Leads por Marca</h3>
          {(d.porMarca || []).length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={d.porMarca}
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {(d.porMarca || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={v => (
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>{v}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-gray-600 text-sm">Sem dados suficientes</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-6">📉 Motivos de Perda</h3>
          {(d.motivosPerda || []).length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
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

    </div>
  )
}
ANALYTICS_EOF

echo "   ✅ AnalyticsPage.jsx atualizado"
echo ""

# ══════════════════════════════════════════════════════════
# ARQUIVO 2: Sidebar.jsx
# ══════════════════════════════════════════════════════════
echo "📝 Escrevendo Sidebar.jsx..."

cat > "$SIDEBAR" << 'SIDEBAR_EOF'
import React, { useTransition } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LogoIcon from './LogoIcon';

const IconLeads = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="8"/>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
  </svg>
);

const IconAnalytics = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="12" width="4" height="9"/>
    <rect x="10" y="7" width="4" height="14"/>
    <rect x="17" y="3" width="4" height="18"/>
  </svg>
);

const IconRelatorios = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <path d="M8 7h8M8 12h8M8 17h5"/>
  </svg>
);

const IconAutomacao = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
  </svg>
);

const IconMarcas = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 21V7l9-4 9 4v14"/>
    <path d="M9 21V12h6v9"/>
    <path d="M3 10h18"/>
  </svg>
);

const IconSegmentos = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 3v9l6.36 6.36"/>
    <path d="M12 12L5.64 18.36"/>
  </svg>
);

const IconTeam = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="9" cy="7" r="3"/>
    <circle cx="17" cy="8" r="2.5"/>
    <path d="M2 21c0-4 3-6 7-6s7 2 7 6"/>
    <path d="M17 14c2.5 0 5 1.5 5 4"/>
  </svg>
);

const IconLeadsSistema = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 2L8.5 8.5 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-6.5-.77L12 2z"/>
  </svg>
);

const IconConfig = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.5-2.3.7A7 7 0 0 0 14.6 4l-.6-2h-4l-.6 2A7 7 0 0 0 7.5 6.1l-2.3-.7-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .5.1 1 .2 1.6l-2 1.5 2 3.5 2.3-.7A7 7 0 0 0 9.4 20l.6 2h4l.6-2a7 7 0 0 0 1.9-2.1l2.3.7 2-3.5-2-1.5c.1-.6.2-1.1.2-1.6z"/>
  </svg>
);

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard',  icon: <IconLeads />, label: 'Leads',   show: () => true },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { path: '/analytics',  icon: <IconAnalytics />,  label: 'Analytics',  show: (a) => a.isGestor() },
      { path: '/relatorios', icon: <IconRelatorios />, label: 'Relatórios', show: (a) => a.isGestor() },
    ],
  },
  {
    label: 'Operação',
    items: [
      { path: '/automacao',    icon: <IconAutomacao />,    label: 'Automação', show: (a) => a.isGestor() },
      { path: '/marcas',       icon: <IconMarcas />,       label: 'Marcas',    show: (a) => a.isGestor() },
      { path: '/segmentos',    icon: <IconSegmentos />,    label: 'Segmentos', show: (a) => a.isGestor() },
      { path: '/usuarios',     icon: <IconTeam />,         label: 'Time',      show: (a) => a.isGestor() },
    ],
  },
  {
    label: 'Institucional',
    items: [
      { path: '/leads-sistema', icon: <IconLeadsSistema />, label: 'Leads Sistema', show: (a) => a.isGestor() },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { path: '/configuracoes', icon: <IconConfig />, label: 'Config', show: () => true },
    ],
  },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const auth         = useAuth();
  const location     = useLocation();
  const navigate     = useNavigate();
  const [, startTransition] = useTransition();

  const handleNavClick = (path) => {
    if (mobileOpen) setMobileOpen(false);
    startTransition(() => {
      navigate(path);
    });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full
          bg-[#0F172A] border-r border-white/5
          flex flex-col items-center py-8
          z-50 w-32
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <button
          onClick={() => handleNavClick('/dashboard')}
          className="mb-10 hover:opacity-85 transition-opacity"
          title="LeadCapture Pro"
        >
          <LogoIcon size={44} />
        </button>

        <nav className="flex flex-col gap-1 w-full px-3 flex-1 overflow-y-auto scrollbar-none">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(item => item.show(auth));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="mb-4">
                <p className="text-[7px] font-black uppercase tracking-[0.18em] text-gray-700 text-center mb-2 px-1">
                  {group.label}
                </p>
                {visibleItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    title={item.label}
                    className={`
                      w-full flex flex-col items-center gap-1.5
                      p-3 rounded-2xl mb-1
                      transition-colors duration-150
                      ${isActive(item.path)
                        ? 'bg-[#10B981] text-black shadow-md shadow-[#10B981]/20'
                        : 'text-gray-600 hover:bg-white/5 hover:text-gray-400'
                      }
                    `}
                  >
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span className="text-[6.5px] font-black uppercase tracking-widest leading-none">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="lg:hidden mt-auto pt-4 border-t border-white/5 w-full px-4">
          <div className="text-center">
            <p className="text-xs text-white font-medium truncate">{auth.usuario?.nome}</p>
            <p className="text-[8px] text-[#10B981] font-bold uppercase mt-1">{auth.usuario?.role}</p>
          </div>
        </div>

        <div className="hidden lg:flex mt-auto pt-4 border-t border-white/5 w-full items-center justify-center">
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-black font-bold text-sm"
            title={`${auth.usuario?.nome} · ${auth.usuario?.role}`}
          >
            {auth.usuario?.nome?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      </aside>
    </>
  );
}
SIDEBAR_EOF

echo "   ✅ Sidebar.jsx atualizado"
echo ""

# ── Git commit ─────────────────────────────────────────────
echo "📤 Fazendo commit e push no git..."
git add "$ANALYTICS" "$SIDEBAR"
git commit -m "fix: pie chart legend visível, INP sidebar com useTransition e PieTooltip customizado"
git push

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Tudo pronto! Resumo do que foi feito:"
echo "   • AnalyticsPage.jsx — legenda e tooltip do gráfico pizza corrigidos"
echo "   • Sidebar.jsx       — INP corrigido com useTransition + transition-colors"
echo "   • Backups salvos em .bak caso precise reverter"
echo "═══════════════════════════════════════════════════════"
echo ""