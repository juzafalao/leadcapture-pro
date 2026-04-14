// LeadsCaptureAnalyticsDashboard.jsx — Dashboard de Captação de Leads
// Métricas em tempo real, funil de vendas, análises por fonte e marca
// Paleta: #0F172A fundo, #10B981 verde/ativo, cinzas
//
// FUNCIONALIDADES:
// 1. KPIs em tempo real (hoje, semana, mês)
// 2. Gráficos de evolução e distribuição
// 3. Funil de vendas
// 4. Análise por fonte e marca
// 5. Alertas de leads quentes

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'

const fmtMoeda = (v) => {
  if (!v) return 'R$ 0'
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$ ${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `R$ ${(n/1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

// Card de KPI
function KPICard({ titulo, valor, subtitulo, cor = '#10B981', icon = '📊' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-2">{titulo}</p>
          <p className="text-3xl font-black text-white">{valor}</p>
          {subtitulo && <p className="text-[10px] text-gray-600 mt-1">{subtitulo}</p>}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </motion.div>
  )
}

// Card de Métrica com Barra
function MetricaCard({ titulo, leads, hot, warm, cold }) {
  const total = leads
  const pctHot = total > 0 ? Math.round((hot / total) * 100) : 0
  const pctWarm = total > 0 ? Math.round((warm / total) * 100) : 0
  const pctCold = total > 0 ? Math.round((cold / total) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4"
    >
      <p className="text-[10px] font-bold text-white mb-3">{titulo}</p>
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-gray-600">🔥 Hot</span>
            <span className="text-[9px] font-bold text-red-400">{hot} ({pctHot}%)</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${pctHot}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-gray-600">⚡ Warm</span>
            <span className="text-[9px] font-bold text-yellow-400">{warm} ({pctWarm}%)</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pctWarm}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-gray-600">❄️ Cold</span>
            <span className="text-[9px] font-bold text-gray-400">{cold} ({pctCold}%)</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gray-500 rounded-full" style={{ width: `${pctCold}%` }} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function LeadsCaptureAnalyticsDashboard() {
  const { usuario } = useAuth()
  const tenantId = usuario?.is_super_admin ? null : usuario?.tenant_id

  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState([])
  const [periodo, setPeriodo] = useState('mes') // dia, semana, mes

  // Carrega dados
  useEffect(() => {
    async function carregar() {
      setLoading(true)
      try {
        const agora = new Date()
        let dataInicio

        switch (periodo) {
          case 'dia':
            dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
            break
          case 'semana':
            dataInicio = new Date(agora)
            dataInicio.setDate(agora.getDate() - agora.getDay())
            break
          case 'mes':
            dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
            break
          default:
            dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
        }

        let query = supabase
          .from('leads')
          .select('id, nome, email, telefone, score, categoria, capital_disponivel, fonte, id_marca, status, created_at')
          .gte('created_at', dataInicio.toISOString())
          .lte('created_at', agora.toISOString())
          .is('deleted_at', null)

        if (tenantId) query = query.eq('tenant_id', tenantId)

        const { data } = await query
        setLeads(data || [])
      } catch (err) {
        console.error('[LeadsCaptureAnalytics] Erro:', err)
      }
      setLoading(false)
    }
    carregar()
  }, [tenantId, periodo])

  // Calcula métricas
  const metricas = useMemo(() => {
    const total = leads.length
    const hot = leads.filter(l => l.categoria === 'hot').length
    const warm = leads.filter(l => l.categoria === 'warm').length
    const cold = leads.filter(l => l.categoria === 'cold').length
    const convertidos = leads.filter(l => l.status === 'convertido').length
    const capitalTotal = leads.reduce((sum, l) => sum + (parseFloat(l.capital_disponivel) || 0), 0)
    const txConversao = total > 0 ? Math.round((convertidos / total) * 100) : 0

    // Agrupa por fonte
    const porFonte = {}
    leads.forEach(l => {
      const fonte = l.fonte || 'Desconhecida'
      if (!porFonte[fonte]) porFonte[fonte] = { total: 0, hot: 0, warm: 0, cold: 0 }
      porFonte[fonte].total++
      if (l.categoria === 'hot') porFonte[fonte].hot++
      else if (l.categoria === 'warm') porFonte[fonte].warm++
      else porFonte[fonte].cold++
    })

    return {
      total,
      hot,
      warm,
      cold,
      convertidos,
      capitalTotal,
      txConversao,
      porFonte: Object.entries(porFonte).map(([fonte, dados]) => ({ fonte, ...dados })),
    }
  }, [leads])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A] pb-16">

      {/* Header */}
      <div className="px-6 lg:px-10 pt-7 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-light text-white">
              Captação de <span className="text-[#10B981] font-bold">Leads</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-0.5 bg-[#10B981] rounded-full" />
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
                Análise em Tempo Real
              </p>
            </div>
          </div>

          {/* Seletor de Período */}
          <div className="flex gap-2">
            {['dia', 'semana', 'mes'].map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  periodo === p
                    ? 'bg-[#10B981] text-black shadow-md shadow-[#10B981]/20'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {p === 'dia' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="px-6 lg:px-10 pt-7 pb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            titulo="Total de Leads"
            valor={metricas.total}
            subtitulo={`${metricas.txConversao}% convertidos`}
            icon="📊"
          />
          <KPICard
            titulo="Leads Quentes"
            valor={metricas.hot}
            subtitulo={`${Math.round((metricas.hot / metricas.total) * 100)}% do total`}
            icon="🔥"
          />
          <KPICard
            titulo="Capital Capturado"
            valor={fmtMoeda(metricas.capitalTotal)}
            subtitulo={`Média: ${fmtMoeda(metricas.capitalTotal / Math.max(metricas.total, 1))}`}
            icon="💰"
          />
          <KPICard
            titulo="Taxa de Conversão"
            valor={`${metricas.txConversao}%`}
            subtitulo={`${metricas.convertidos} convertidos`}
            icon="✅"
          />
        </div>
      </div>

      {/* Distribuição por Categoria */}
      <div className="px-6 lg:px-10 pb-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricaCard
            titulo="Distribuição Geral"
            leads={metricas.total}
            hot={metricas.hot}
            warm={metricas.warm}
            cold={metricas.cold}
          />

          {/* Análise por Fonte (Top 2) */}
          {metricas.porFonte.slice(0, 2).map((fonte, i) => (
            <MetricaCard
              key={i}
              titulo={`Fonte: ${fonte.fonte}`}
              leads={fonte.total}
              hot={fonte.hot}
              warm={fonte.warm}
              cold={fonte.cold}
            />
          ))}
        </div>
      </div>

      {/* Tabela de Leads Recentes */}
      <div className="px-6 lg:px-10">
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">
              Últimos Leads Capturados
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Nome', 'Email', 'Telefone', 'Score', 'Categoria', 'Fonte', 'Data'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-gray-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 10).map((lead, i) => (
                  <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-bold">{lead.nome}</td>
                    <td className="px-4 py-3 text-gray-400">{lead.email}</td>
                    <td className="px-4 py-3 text-gray-400">{lead.telefone}</td>
                    <td className="px-4 py-3 font-bold text-white">{lead.score}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] px-2 py-1 rounded-md font-bold"
                        style={{
                          background: lead.categoria === 'hot' ? '#EF444420' : lead.categoria === 'warm' ? '#F59E0B20' : '#6B728020',
                          color: lead.categoria === 'hot' ? '#EF4444' : lead.categoria === 'warm' ? '#F59E0B' : '#6B7280',
                        }}
                      >
                        {lead.categoria?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{lead.fonte}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leads.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-600 text-sm">Nenhum lead capturado neste período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
