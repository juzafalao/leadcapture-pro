// ============================================================
// MonitoramentoPage.jsx — Dashboard de Monitoramento Enterprise
// LeadCapture Pro — Zafalão Tech · 2026
//
// v2.0.0 — Conectado à API /api/monitoring + Realtime Supabase
// Mantém: status cards, log realtime, test email, links úteis
// Adiciona: KPI 360°, trend chart, by-type chart, alertas API
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const API_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

// ── Tipos de notificação com label e cor ─────────────────────
const TIPO_LABEL = {
  'email-boas-vindas-lead':    { label: 'Boas-vindas Lead', cor: '#3B82F6', icon: '👋' },
  'email-notificacao-interna': { label: 'Notif. Interna',   cor: '#EE7B4D', icon: '📧' },
  'email-lead-quente':         { label: 'Lead Quente',      cor: '#EF4444', icon: '🔥' },
  'whatsapp':                  { label: 'WhatsApp',         cor: '#25D366', icon: '💬' },
}

const PERIOD_LABELS = { today: 'Hoje', week: '7 Dias', month: '30 Dias' }

function fmtDt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function fmtDayShort(isoDay) {
  if (!isoDay) return ''
  const parts = isoDay.split('-')
  return `${parts[2]}/${parts[1]}`
}

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = 'text-white', border = 'border-white/5', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`bg-[#0F172A] border ${border} rounded-2xl p-4 flex flex-col gap-1`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">{label}</p>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
    </motion.div>
  )
}

// ── Alert Banner ──────────────────────────────────────────────
function AlertBanner({ alertas }) {
  if (!alertas || alertas.length === 0) return null
  const styles = {
    error:   'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]',
    warning: 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]',
    info:    'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]',
    success: 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]',
  }
  const icons = { error: '🔴', warning: '🟡', info: 'ℹ️', success: '✅' }
  return (
    <div className="space-y-2 mb-6">
      {alertas.map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`border rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-semibold ${styles[a.tipo] || styles.info}`}
        >
          <span>{icons[a.tipo] || 'ℹ️'}</span>
          {a.mensagem}
        </motion.div>
      ))}
    </div>
  )
}

// ── Custom Tooltip para gráficos ─────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2 font-bold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}{p.name === 'Taxa %' ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MonitoramentoPage — Componente Principal
// ═══════════════════════════════════════════════════════════
export default function MonitoramentoPage() {
  const { usuario, isPlatformAdmin } = useAuth()
  const [logs, setLogs]             = useState([])
  const [status, setStatus]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [filtro, setFiltro]         = useState('todos')
  const [period, setPeriod]         = useState('today')
  const [testEmail, setTestEmail]   = useState('')
  const [testando, setTestando]     = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [activeTab, setActiveTab]   = useState('overview')

  const tenantId = isPlatformAdmin() ? null : usuario?.tenant_id

  // ── Status do sistema ─────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/sistema/status`)
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [])

  // ── Logs realtime Supabase ────────────────────────────────
  const carregarLogs = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('notification_logs')
      .select('*, lead:lead_id(nome, email, score, categoria)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (tenantId) q = q.eq('tenant_id', tenantId)
    if (filtro !== 'todos') q = q.eq('status', filtro)
    const { data } = await q
    setLogs(data || [])
    setLoading(false)
  }, [tenantId, filtro])

  useEffect(() => {
    carregarLogs()
    const channel = supabase
      .channel('notification-logs-monitor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notification_logs' }, () => {
        carregarLogs()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [carregarLogs])

  // ── React Query: Dashboard KPIs ───────────────────────────
  const { data: dashboardData } = useQuery({
    queryKey: ['monitoring-dashboard', tenantId],
    queryFn: async () => {
      if (!tenantId) return null
      const r = await fetch(`${API_URL}/api/monitoring/dashboard?tenant_id=${tenantId}`)
      if (!r.ok) return null
      return r.json()
    },
    enabled: !!tenantId,
    refetchInterval: 30_000,
  })

  // ── React Query: Summary ─────────────────────────────────
  const { data: summaryData } = useQuery({
    queryKey: ['monitoring-summary', tenantId, period],
    queryFn: async () => {
      if (!tenantId) return null
      const r = await fetch(`${API_URL}/api/monitoring/notifications/summary?tenant_id=${tenantId}&period=${period}`)
      if (!r.ok) return null
      return r.json()
    },
    enabled: !!tenantId,
    refetchInterval: 60_000,
  })

  // ── React Query: Trend 7 dias ─────────────────────────────
  const { data: trendData } = useQuery({
    queryKey: ['monitoring-trend', tenantId],
    queryFn: async () => {
      if (!tenantId) return null
      const r = await fetch(`${API_URL}/api/monitoring/notifications/trend?tenant_id=${tenantId}`)
      if (!r.ok) return null
      return r.json()
    },
    enabled: !!tenantId,
    refetchInterval: 60_000,
  })

  // ── React Query: By Type ─────────────────────────────────
  const { data: byTypeData } = useQuery({
    queryKey: ['monitoring-by-type', tenantId, period],
    queryFn: async () => {
      if (!tenantId) return null
      const r = await fetch(`${API_URL}/api/monitoring/notifications/by-type?tenant_id=${tenantId}&period=${period}`)
      if (!r.ok) return null
      return r.json()
    },
    enabled: !!tenantId,
    refetchInterval: 60_000,
  })

  // ── React Query: Últimos Erros ────────────────────────────
  const { data: errorsData } = useQuery({
    queryKey: ['monitoring-errors', tenantId],
    queryFn: async () => {
      if (!tenantId) return null
      const r = await fetch(`${API_URL}/api/monitoring/notifications/errors?tenant_id=${tenantId}&limit=5`)
      if (!r.ok) return null
      return r.json()
    },
    enabled: !!tenantId,
    refetchInterval: 60_000,
  })

  // ── Teste de email ────────────────────────────────────────
  async function testarEmail() {
    if (!testEmail.includes('@')) return
    setTestando(true)
    setTestResult(null)
    try {
      const r = await fetch(`${API_URL}/api/sistema/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })
      const d = await r.json()
      setTestResult(d)
    } catch (err) {
      setTestResult({ success: false, error: err.message })
    }
    setTestando(false)
  }

  // ── Métricas do log local ─────────────────────────────────
  const total       = logs.length
  const sucessos    = logs.filter(l => l.status === 'sucesso').length
  const erros       = logs.filter(l => l.status === 'erro').length
  const taxaSucesso = total > 0 ? Math.round((sucessos / total) * 100) : 0

  // ── Dados para gráficos ───────────────────────────────────
  const trendChartData = Object.entries(trendData?.dados || {}).map(([day, d]) => ({
    day: fmtDayShort(day),
    Sucesso: d.sucesso,
    Erro: d.erro,
    'Taxa %': parseFloat(d.taxa),
  }))

  const byTypeChartData = Object.entries(byTypeData?.por_tipo || {}).map(([tipo, d]) => {
    const info = TIPO_LABEL[tipo] || { label: tipo, cor: '#6366F1' }
    return { tipo: info.label, taxa: parseFloat(d.taxa), total: d.total }
  })

  const kpi     = dashboardData?.kpi || {}
  const alertas = dashboardData?.alertas || []
  const summary = summaryData || {}

  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-light text-white mb-1">
                Monitoramento <span className="text-[#10B981] font-bold">do Sistema</span>
              </h1>
              <div className="flex items-center gap-3">
                <div className="w-12 h-0.5 bg-[#10B981] rounded-full" />
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
                  Visibilidade 360° — notificações, erros e métricas em tempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl px-3 py-2">
              <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-[#10B981] uppercase tracking-wider">Live</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="flex gap-1 bg-[#0F172A] border border-white/5 rounded-2xl p-1 w-fit">
          {[
            { id: 'overview', label: '📊 Visão Geral' },
            { id: 'logs',     label: '📋 Logs ao Vivo' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'bg-[#10B981] text-black'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: VISÃO GERAL                                   */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Status dos Serviços */}
            <div className="px-6 lg:px-10 mb-6">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-3">Status dos Serviços</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Banco de Dados', ok: status?.services?.database?.ok, detalhe: status?.services?.database?.ok ? 'Conectado' : (status?.services?.database?.error || 'Erro') },
                  { label: 'Email',          ok: status?.services?.email?.ok,    detalhe: status?.services?.email?.provedor || 'Verificando...' },
                  { label: 'WhatsApp',       ok: status?.services?.whatsapp?.ok, detalhe: status?.services?.whatsapp?.ok ? 'Evolution API ativa' : 'Desconectado' },
                  { label: 'IA (Anthropic)', ok: status?.services?.ai?.ok !== false, detalhe: 'Chatbot ativo' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-[#0F172A] border rounded-2xl p-4 ${
                      s.ok ? 'border-[#10B981]/20' : s.ok === false ? 'border-[#EF4444]/20' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        s.ok ? 'bg-[#10B981] animate-pulse' : s.ok === false ? 'bg-[#EF4444]' : 'bg-gray-600'
                      }`} />
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">{s.label}</span>
                    </div>
                    <p className="text-sm font-bold text-white">{s.ok ? 'Ativo' : s.ok === false ? 'Erro' : '...'}</p>
                    <p className="text-[10px] text-gray-600">{s.detalhe}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Alertas */}
            {alertas.length > 0 && (
              <div className="px-6 lg:px-10">
                <AlertBanner alertas={alertas} />
              </div>
            )}

            {/* Seletor de Período */}
            <div className="px-6 lg:px-10 mb-4 flex items-center gap-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">Período:</p>
              <div className="flex gap-1">
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setPeriod(key)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                      period === key ? 'bg-[#10B981] text-black' : 'bg-white/5 text-gray-500 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="px-6 lg:px-10 mb-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard icon="📨" label="Total de Notificações" value={summary.total ?? kpi.total ?? 0} sub={`Período: ${PERIOD_LABELS[period]}`} border="border-white/5" delay={0} />
                <KpiCard icon="✅" label="Sucesso" value={summary.sucesso ?? kpi.sucesso ?? 0} color="text-[#10B981]" border="border-[#10B981]/20" delay={0.05} />
                <KpiCard icon="❌" label="Erros" value={summary.erro ?? kpi.erro ?? 0} color="text-[#EF4444]" border="border-[#EF4444]/20" delay={0.1} />
                <KpiCard
                  icon="📈"
                  label="Taxa de Sucesso"
                  value={`${summary.taxa_sucesso ?? kpi.taxa_sucesso ?? 0}%`}
                  color={(summary.taxa_sucesso ?? kpi.taxa_sucesso ?? 0) >= 95 ? 'text-[#10B981]' : 'text-[#F59E0B]'}
                  border="border-[#3B82F6]/20"
                  delay={0.15}
                />
              </div>
            </div>

            {/* Gráficos + Erros + Painel lateral */}
            <div className="px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Trend Chart — 2/3 */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-[#0F172A] border border-white/5 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">📅 Tendência — Últimos 7 Dias</h3>
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Notificações / Dia</span>
                </div>
                {trendChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                      <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px', color: '#6B7280', paddingTop: '8px' }} />
                      <Line type="monotone" dataKey="Sucesso"  stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} />
                      <Line type="monotone" dataKey="Erro"     stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} />
                      <Line type="monotone" dataKey="Taxa %"   stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-gray-700 text-sm">Sem dados para o período</div>
                )}
              </motion.div>

              {/* By-Type Chart — 1/3 */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-[#0F172A] border border-white/5 rounded-2xl p-5"
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">🏷️ Taxa por Tipo</h3>
                {byTypeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byTypeChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="tipo" tick={{ fill: '#9CA3AF', fontSize: 9 }} axisLine={false} tickLine={false} width={72} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="taxa" name="Taxa %" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-gray-700 text-sm">Sem dados para o período</div>
                )}
              </motion.div>

              {/* Últimos Erros */}
              {errorsData?.erros && errorsData.erros.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-2 bg-[#0F172A] border border-[#EF4444]/10 rounded-2xl p-5"
                >
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">⚠️ Últimos Erros Detectados</h3>
                  <div className="space-y-2">
                    {errorsData.erros.map((e) => (
                      <div key={e.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                        <span className="text-base mt-0.5">{(TIPO_LABEL[e.tipo] || {}).icon || '📩'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-white">{e.lead_nome}</span>
                            <span className="text-[9px] text-gray-600">{e.lead_email}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">
                              {(TIPO_LABEL[e.tipo] || {}).label || e.tipo}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#EF4444] mt-0.5 truncate font-mono">{e.erro}</p>
                        </div>
                        <span className="text-[9px] text-gray-600 shrink-0">{fmtDt(e.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Painel lateral */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-4"
              >
                {/* Testar Email */}
                <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Testar Email Agora</h3>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    placeholder="email@teste.com"
                    className="w-full bg-[#0B1220] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50 mb-2"
                  />
                  <button
                    onClick={testarEmail}
                    disabled={testando}
                    className="w-full py-2 rounded-xl text-sm font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all disabled:opacity-50"
                  >
                    {testando ? 'Enviando...' : 'Enviar Teste'}
                  </button>
                  {testResult && (
                    <div className={`mt-2 p-2 rounded-lg text-xs ${testResult.success ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>  
                      {testResult.success ? `✓ ${testResult.message}` : `✗ ${testResult.error}`}
                    </div>
                  )}
                </div>

                {/* Config Email */}
                <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Configuração Email</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Provedor',     value: status?.services?.email?.provedor || '...' },
                      { label: 'Remetente',    value: status?.services?.email?.from || '...' },
                      { label: 'Notificações', value: status?.services?.email?.notification_email || '...' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-gray-500 shrink-0">{label}</span>
                        <span className="text-white font-bold truncate text-right">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-gray-500">Status</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${status?.services?.email?.ok ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>  
                        {status?.services?.email?.ok ? '● Ativo' : '● Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Links do Sistema</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Sentry — Erros',   url: 'https://sentry.io' },
                      { label: 'Resend — Emails',  url: 'https://resend.com' },
                      { label: 'Vercel — Logs',    url: 'https://vercel.com' },
                      { label: 'Supabase — Banco', url: 'https://supabase.com' },
                    ].map(l => (
                      <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between text-xs text-gray-400 hover:text-white transition-colors py-1">
                        <span>{l.label}</span>
                        <span className="text-gray-600">→</span>
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: LOGS AO VIVO                                  */}
        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-6 lg:px-10"
          >
            {/* Métricas realtime */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <KpiCard icon="📨" label="Total (últimas 100)" value={total} border="border-white/5" />
              <KpiCard icon="✅" label="Sucesso" value={sucessos} sub={`${taxaSucesso}% taxa`} color="text-[#10B981]" border="border-[#10B981]/20" delay={0.05} />
              <KpiCard icon="❌" label="Erros" value={erros} color="text-[#EF4444]" border="border-[#EF4444]/20" delay={0.1} />
            </div>

            {/* Filtros */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
                <h2 className="text-sm font-bold text-white">Log de Notificações</h2>
                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">— realtime</span>
              </div>
              <div className="flex gap-1">
                {['todos', 'sucesso', 'erro'].map(f => (
                  <button key={f} onClick={() => setFiltro(f)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                      filtro === f ? 'bg-[#10B981] text-black' : 'bg-white/5 text-gray-500 hover:text-white'
                    }`}>  
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela de Logs */}
            <div className="bg-[#0F172A] border border-white/5 rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">Carregando logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-600 text-sm">Nenhum log registrado ainda.</p>
                  <p className="text-gray-700 text-xs mt-1">Os logs aparecem aqui após a criação de leads.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                  {logs.map((log) => {
                    const tipoInfo = TIPO_LABEL[log.tipo] || { label: log.tipo, cor: '#6366F1', icon: '📩' }
                    return (
                      <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg shrink-0">{tipoInfo.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white">{tipoInfo.label}</span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                  log.status === 'sucesso'
                                    ? 'bg-[#10B981]/10 text-[#10B981]'
                                    : 'bg-[#EF4444]/10 text-[#EF4444]'
                                }`}>  
                                  {log.status === 'sucesso' ? '✓ Enviado' : '✗ Erro'}
                                </span>
                                {log.tentativas > 1 && (
                                  <span className="text-[9px] text-[#F59E0B]">{log.tentativas}× tentativas</span>
                                )}
                              </div>
                              {log.lead && (
                                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                  {log.lead.nome} · score {log.lead.score} · {log.lead.categoria}
                                </p>
                              )}
                              {log.erro && (
                                <p className="text-[10px] text-[#EF4444] mt-0.5 font-mono truncate" title={log.erro}>
                                  {log.erro}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-600 shrink-0 whitespace-nowrap">{fmtDt(log.created_at)}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}