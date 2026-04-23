// DashboardOverviewPage.jsx — Visão geral em tempo real
// KPIs, gráfico de leads, funil, canais, atividade recente
// Dados reais do Supabase — visível para todos os roles
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts'
import {
  Users, Flame, DollarSign, CheckCircle, UserX,
  MessageCircle, Globe, Bot, Workflow, Instagram, Facebook,
  UserPlus, Download, TrendingUp, Clock, ArrowUpRight,
  Activity, Zap, Radio,
} from 'lucide-react'

// ─── Formatação ──────────────────────────────────────────
const fmtCapital = (v) => {
  if (!v) return 'R$ 0'
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

// ─── Config de canais ────────────────────────────────────
const CANAL_CONFIG = {
  whatsapp:   { icon: MessageCircle, color: '#25D366', label: 'WhatsApp' },
  website:    { icon: Globe,         color: '#6366F1', label: 'Formulário Web' },
  chatbot:    { icon: Bot,           color: '#F59E0B', label: 'Chatbot' },
  n8n:        { icon: Workflow,      color: '#EA580C', label: 'n8n Workflow' },
  instagram:  { icon: Instagram,     color: '#E1306C', label: 'Instagram' },
  facebook:   { icon: Facebook,      color: '#1877F2', label: 'Facebook' },
  referral:   { icon: UserPlus,      color: '#10B981', label: 'Indicação' },
  manual:     { icon: UserPlus,      color: '#8B5CF6', label: 'Manual' },
  csv_import: { icon: Download,      color: '#06B6D4', label: 'Importação CSV' },
  webhook:    { icon: Radio,         color: '#8B5CF6', label: 'API / Webhook' },
  api:        { icon: Radio,         color: '#8B5CF6', label: 'API' },
}

// ─── KPI Card ───────────────────────────────────────────
function KPICard({ label, value, sub, Icon, color, delay = 0, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      onClick={onClick}
      className={`bg-[#0F172A] rounded-2xl p-5 border flex flex-col gap-2 ${onClick ? 'cursor-pointer hover:border-white/10 transition-colors' : ''}`}
      style={{ borderColor: `${color}25` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] leading-tight" style={{ color: `${color}99` }}>{sub}</p>}
    </motion.div>
  )
}

// ─── Card container ──────────────────────────────────────
function Card({ children, title, sub, delay = 0, action, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`bg-[#0F172A] rounded-2xl border border-white/[0.06] p-5 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-[13px] font-semibold text-white">{title}</h3>}
            {sub   && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.div>
  )
}

// ─── Tooltip customizado ─────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1E293B] border border-white/[0.08] rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-gray-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function DashboardOverviewPage() {
  const { usuario } = useAuth()
  const navigate    = useNavigate()
  const tenantId    = usuario?.is_super_admin ? null : usuario?.tenant_id
  const role        = usuario?.role
  const isAdmin     = ['Administrador', 'admin'].includes(role) || usuario?.is_super_admin
  const isDiretor   = role === 'Diretor' || isAdmin
  const isGestor    = role === 'Gestor'  || isDiretor
  const isConsultor = !isGestor

  const [loading,     setLoading]     = useState(true)
  const [metrics,     setMetrics]     = useState({ total: 0, hot: 0, warm: 0, cold: 0, capital: 0, convertidos: 0, semana: 0, sem_dono: 0 })
  const [chartData,   setChartData]   = useState([])
  const [channelData, setChannelData] = useState([])
  const [funnelData,  setFunnelData]  = useState([])
  const [recentLeads, setRecentLeads] = useState([])

  const fetchAll = useCallback(async () => {
    if (!usuario) return
    setLoading(true)
    try {
      const hoje     = new Date()
      const mesInicio  = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
      const dias30ago  = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dias7ago   = new Date(hoje.getTime() -  7 * 24 * 60 * 60 * 1000).toISOString()

      // ── Status options ──
      let qSt = supabase.from('status_comercial').select('id, label, slug, cor').order('ordem')
      if (tenantId) qSt = qSt.eq('tenant_id', tenantId)
      const { data: statuses } = await qSt

      // ── Leads do mês (metrics + canal + funil) ──
      let qM = supabase.from('leads')
        .select('id, categoria, capital_disponivel, created_at, status, id_status, id_operador_responsavel, fonte')
        .is('deleted_at', null)
        .gte('created_at', mesInicio)
      if (tenantId) qM = qM.eq('tenant_id', tenantId)
      if (isConsultor && usuario?.id) {
        qM = qM.or(`id_operador_responsavel.eq.${usuario.id},id_operador_responsavel.is.null`)
      }
      const { data: ml } = await qM

      const total      = (ml || []).length
      const hot        = (ml || []).filter(l => l.categoria === 'hot').length
      const warm       = (ml || []).filter(l => l.categoria === 'warm').length
      const cold       = (ml || []).filter(l => l.categoria === 'cold').length
      const capital    = (ml || []).reduce((a, l) => a + parseFloat(l.capital_disponivel || 0), 0)
      const convertidos = (ml || []).filter(l => l.status === 'convertido').length
      const semana     = (ml || []).filter(l => l.created_at >= dias7ago).length
      const sem_dono   = (ml || []).filter(l => !l.id_operador_responsavel).length
      setMetrics({ total, hot, warm, cold, capital, convertidos, semana, sem_dono })

      // ── Canal breakdown ──
      const canalMap = {}
      ;(ml || []).forEach(l => {
        const f = (l.fonte || 'manual').toLowerCase()
        canalMap[f] = (canalMap[f] || 0) + 1
      })
      const maxCanal = Math.max(...Object.values(canalMap), 1)
      const canalArr = Object.entries(canalMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([ch, count]) => ({
          channel: ch,
          count,
          pct: Math.round((count / maxCanal) * 100),
          ...(CANAL_CONFIG[ch] || { icon: Globe, color: '#64748B', label: ch }),
        }))
      setChannelData(canalArr)

      // ── Funil por status ──
      if (statuses?.length) {
        const stMap = {}
        ;(ml || []).forEach(l => { if (l.id_status) stMap[l.id_status] = (stMap[l.id_status] || 0) + 1 })
        const maxSt = Math.max(...Object.values(stMap), 1)
        const funnelArr = statuses
          .map(s => ({ label: s.label, count: stMap[s.id] || 0, cor: s.cor, pct: Math.round(((stMap[s.id] || 0) / maxSt) * 100) }))
          .filter(s => s.count > 0)
        setFunnelData(funnelArr)
      }

      // ── Gráfico 30 dias ──
      let qC = supabase.from('leads')
        .select('created_at, status')
        .is('deleted_at', null)
        .gte('created_at', dias30ago)
      if (tenantId) qC = qC.eq('tenant_id', tenantId)
      if (isConsultor && usuario?.id) {
        qC = qC.or(`id_operador_responsavel.eq.${usuario.id},id_operador_responsavel.is.null`)
      }
      const { data: cl } = await qC

      const dayMap = {}
      for (let i = 29; i >= 0; i--) {
        const d   = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000)
        const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        dayMap[key] = { date: key, leads: 0, convertidos: 0 }
      }
      ;(cl || []).forEach(l => {
        const key = new Date(l.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        if (dayMap[key]) {
          dayMap[key].leads++
          if (l.status === 'convertido') dayMap[key].convertidos++
        }
      })
      // Mostrar só a cada 5 dias no eixo X para não poluir
      const chartArr = Object.values(dayMap).map((d, i) => ({ ...d, dateLabel: i % 5 === 0 ? d.date : '' }))
      setChartData(chartArr)

      // ── Leads recentes ──
      let qR = supabase.from('leads')
        .select('id, nome, fonte, categoria, created_at, score, marca:id_marca(nome, emoji)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(8)
      if (tenantId) qR = qR.eq('tenant_id', tenantId)
      const { data: rl } = await qR
      setRecentLeads(rl || [])

    } finally {
      setLoading(false)
    }
  }, [usuario, tenantId, isConsultor])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Realtime — recarrega ao inserir novo lead
  useEffect(() => {
    if (!tenantId) return
    const ch = supabase.channel(`dash-ov-${tenantId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `tenant_id=eq.${tenantId}` },
        () => fetchAll())
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [tenantId, fetchAll])

  // ── taxa de conversão ──
  const taxaConv = metrics.total > 0 ? ((metrics.convertidos / metrics.total) * 100).toFixed(1) : '0.0'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0B1220]">
        <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0B1220] px-4 lg:px-10 py-6 lg:py-8 space-y-6">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-light text-white">
            Dashboard <span className="text-[#10B981] font-bold">Overview</span>
          </h1>
          <p className="text-[11px] text-gray-500 mt-1">
            {isConsultor ? 'Seus leads e pipeline pessoal' : 'Visão geral em tempo real de todas as operações'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs font-semibold text-[#10B981]">Ao vivo</span>
          <span className="text-[10px] text-gray-500">{metrics.total} leads no mês</span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Leads captados"
          value={metrics.total}
          sub={`${metrics.semana} na última semana`}
          Icon={Users}
          color="#3B82F6"
          delay={0}
          onClick={() => navigate('/pipeline')}
        />
        <KPICard
          label="Quentes 🔥"
          value={metrics.hot}
          sub={`${metrics.warm} mornos · ${metrics.cold} frios`}
          Icon={Flame}
          color="#EF4444"
          delay={0.07}
          onClick={() => navigate('/pipeline')}
        />
        {isGestor && (
          <KPICard
            label="Capital declarado"
            value={fmtCapital(metrics.capital)}
            sub="Potencial total do mês"
            Icon={DollarSign}
            color="#10B981"
            delay={0.14}
          />
        )}
        {isGestor && (
          <KPICard
            label={`Taxa de conversão`}
            value={`${taxaConv}%`}
            sub={`${metrics.convertidos} convertidos · ${metrics.sem_dono} sem dono`}
            Icon={metrics.sem_dono > 0 ? UserX : CheckCircle}
            color={metrics.sem_dono > 0 ? '#F59E0B' : '#10B981'}
            delay={0.21}
          />
        )}
        {isConsultor && (
          <KPICard
            label="Convertidos"
            value={metrics.convertidos}
            sub={`Taxa: ${taxaConv}%`}
            Icon={CheckCircle}
            color="#10B981"
            delay={0.14}
          />
        )}
        {isConsultor && (
          <KPICard
            label="Leads sem dono"
            value={metrics.sem_dono}
            sub="Disponíveis para pegar"
            Icon={UserX}
            color="#F59E0B"
            delay={0.21}
            onClick={() => navigate('/pipeline')}
          />
        )}
      </div>

      {/* ── Gráfico + Funil ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de fluxo */}
        <Card
          title="Fluxo de Leads"
          sub="Últimos 30 dias"
          delay={0.28}
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-gray-500">Leads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-gray-500">Convertidos</span>
              </div>
            </div>
          }
        >
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="dateLabel" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="#10B981" fill="url(#gLeads)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="convertidos" name="Convertidos" stroke="#60A5FA" fill="url(#gConv)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Funil de conversão */}
        <Card title="Funil de Conversão" sub="Mês atual" delay={0.35}>
          {funnelData.length === 0 ? (
            <p className="text-[11px] text-gray-600 text-center py-8">Sem dados de status este mês</p>
          ) : (
            <div className="space-y-3">
              {funnelData.map((stage, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-300">{stage.label}</span>
                    <span className="text-[11px] font-mono text-gray-400">{stage.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stage.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.08, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: stage.cor || '#10B981' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Canais + Atividade recente ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Performance por canal */}
        <Card
          title="Performance por Canal"
          sub="Capturas no mês"
          delay={0.42}
          action={
            <button onClick={() => navigate('/canais')} className="text-[10px] text-[#10B981] hover:text-[#34D399] flex items-center gap-1 transition-colors">
              Ver tudo <ArrowUpRight className="w-3 h-3" />
            </button>
          }
        >
          {channelData.length === 0 ? (
            <p className="text-[11px] text-gray-600 text-center py-6">Sem dados de canal este mês</p>
          ) : (
            <div className="space-y-3.5">
              {channelData.map((ch, i) => {
                const Icon = ch.icon || Globe
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06]" style={{ background: `${ch.color}12` }}>
                      <Icon className="w-4 h-4" style={{ color: ch.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium text-gray-300 truncate">{ch.label}</span>
                        <span className="text-[11px] font-mono text-gray-500 shrink-0 ml-2">{ch.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${ch.pct}%` }}
                          transition={{ duration: 0.7, delay: 0.5 + i * 0.07 }}
                          className="h-full rounded-full"
                          style={{ background: ch.color }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Atividade recente */}
        <Card
          title="Leads Recentes"
          sub="Em tempo real"
          delay={0.49}
          action={
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
              <span className="text-[10px] text-[#F59E0B] font-bold">LIVE</span>
            </div>
          }
        >
          {recentLeads.length === 0 ? (
            <p className="text-[11px] text-gray-600 text-center py-6">Nenhum lead recente</p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {recentLeads.map((lead, i) => {
                const cat = (lead.categoria || 'cold').toLowerCase()
                const dotColor = cat === 'hot' ? '#EF4444' : cat === 'warm' ? '#F59E0B' : '#475569'
                const cfgCanal = CANAL_CONFIG[(lead.fonte || '').toLowerCase()] || { icon: Globe, color: '#475569' }
                const IconCanal = cfgCanal.icon
                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.04 }}
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate('/pipeline')}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-gray-300 shrink-0">
                      {lead.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-200 truncate group-hover:text-white transition-colors">{lead.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <IconCanal className="w-3 h-3 shrink-0" style={{ color: cfgCanal.color }} />
                        <span className="text-[10px] text-gray-500 truncate">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {lead.marca?.nome && (
                          <span className="text-[10px] text-gray-600 truncate">· {lead.marca.emoji} {lead.marca.nome}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
                  </motion.div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Quick actions (Gestor+) ── */}
      {isGestor && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Ver Pipeline',   desc: 'Todos os leads',   icon: Users,    color: '#3B82F6', path: '/pipeline' },
            { label: 'Funil Kanban',   desc: 'Visualizar etapas',icon: TrendingUp, color: '#8B5CF6', path: '/kanban' },
            { label: 'Ranking Time',   desc: 'Performance',      icon: Zap,      color: '#F59E0B', path: '/ranking' },
            { label: 'Relatórios',     desc: 'Análise avançada', icon: Activity, color: '#10B981', path: '/relatorios' },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.56 + i * 0.07 }}
                onClick={() => navigate(item.path)}
                className="bg-[#0F172A] border border-white/[0.06] rounded-2xl p-4 text-left hover:border-white/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${item.color}18` }}>
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <p className="text-[12px] font-semibold text-white group-hover:text-[#10B981] transition-colors">{item.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
              </motion.button>
            )
          })}
        </div>
      )}

    </div>
  )
}
