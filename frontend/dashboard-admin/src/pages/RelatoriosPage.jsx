import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { useRelatorios, useFiltrosRelatorio } from '../hooks/useRelatorios'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'

const COLORS = ['#10B981','#F97316','#3b82f6','#8b5cf6','#ec4899','#10b981','#f43f5e','#06b6d4']
const fmtK   = v => v >= 1000000 ? `R$ ${(v/1000000).toFixed(1)}mi` : v >= 1000 ? `R$ ${(v/1000).toFixed(0)}k` : `R$ ${Math.round(v)}`
const fmtFull = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v)

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0F172A] border border-[#10B981]/20 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-1 font-bold">{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{color:p.color}} className="font-bold">
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmtK(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

const TIPOS = [
  { id:'funil',     icon:'🔽', label:'Funil de Vendas',   desc:'Visualize cada etapa do pipeline',       cor:'from-purple-500/20 to-purple-500/5',   border:'border-purple-500/30'  },
  { id:'conversao', icon:'🎯', label:'Conversão',         desc:'Taxa de fechamento e performance',        cor:'from-green-500/20 to-green-500/5',     border:'border-green-500/30'   },
  { id:'consultor', icon:'👤', label:'Por Consultor',     desc:'Ranking e performance do time',           cor:'from-blue-500/20 to-blue-500/5',       border:'border-blue-500/30'    },
  { id:'marca',     icon:'🏢', label:'Por Marca',         desc:'Leads e conversões por marca',            cor:'from-orange-500/20 to-orange-500/5',   border:'border-orange-500/30'  },
  { id:'temporal',  icon:'📅', label:'Análise Temporal',  desc:'Evolução de leads ao longo do tempo',     cor:'from-cyan-500/20 to-cyan-500/5',       border:'border-cyan-500/30'    },
  { id:'fonte',     icon:'📡', label:'Por Fonte',         desc:'De onde vêm seus melhores leads',         cor:'from-pink-500/20 to-pink-500/5',       border:'border-pink-500/30'    },
  { id:'perda',     icon:'💔', label:'Análise de Perdas', desc:'Motivos e padrões de desistência',        cor:'from-red-500/20 to-red-500/5',         border:'border-red-500/30'     },
  { id:'regiao',    icon:'🗺️', label:'Por Região',        desc:'Distribuição geográfica dos leads',       cor:'from-yellow-500/20 to-yellow-500/5',   border:'border-yellow-500/30'  },
  { id:'score',     icon:'⚡', label:'Score de Leads',    desc:'Distribuição de qualidade dos leads',     cor:'from-indigo-500/20 to-indigo-500/5',   border:'border-indigo-500/30'  },
  { id:'capital',   icon:'💰', label:'Análise de Capital',desc:'Pipeline financeiro e oportunidades',     cor:'from-emerald-500/20 to-emerald-500/5', border:'border-emerald-500/30' },
]

const PERIODOS = [
  { label:'7 dias',  value:'7'  },
  { label:'15 dias', value:'15' },
  { label:'30 dias', value:'30' },
  { label:'60 dias', value:'60' },
  { label:'90 dias', value:'90' },
]

function StatCard({ label, value, sub, icon, cor }) {
  return (
    <div className={`bg-[#1E293B] border rounded-2xl p-5 flex flex-col gap-1.5 ${cor||'border-white/5'}`}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
        <span className="text-xl opacity-50">{icon}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
    </div>
  )
}

function RankingTable({ dados, colunas }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 bg-[#0F172A]">
            {colunas.map((c,i) => (
              <th key={i} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-gray-500">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((row, ri) => (
            <tr key={ri} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${ri===0?'bg-[#10B981]/5':''}`}>
              {colunas.map((c,ci) => (
                <td key={ci} className="px-4 py-3">
                  {c.render ? c.render(row[c.key], row, ri) : <span className="text-gray-300 text-xs">{row[c.key]}</span>}
                </td>
              ))}
            </tr>
          ))}
          {dados.length === 0 && (
            <tr><td colSpan={colunas.length} className="px-4 py-8 text-center text-gray-600 text-xs">Sem dados no período</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function exportCSV(dados, nome) {
  if (!dados?.length) return alert('Sem dados para exportar.')
  const keys = Object.keys(dados[0])
  const rows = dados.map(r => keys.map(k => {
    const v = r[k]
    return typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')
  }))
  const csv = '\uFEFF' + [keys.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8;'}))
  a.download = `${nome}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

function exportPDF() { window.print() }

// ── HEADER COMPARTILHADO ──
function PageHeader({ tipoAtivo, tipoInfo, filtros, setFiltros, filtrosData, isLoading, d, onVoltar, onExportCSV }) {
  return (
    <>
      {/* TÍTULO */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-8 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-1">
            Central de <span className="text-[#10B981] font-bold">Relatórios</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Relatórios Estratégicos e Operacionais</p>
          </div>
        </motion.div>

        {/* Botões de ação quando relatório ativo */}
        {tipoAtivo && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="flex items-center gap-2 flex-wrap">
            <button onClick={onExportCSV}
              className="flex items-center gap-2 bg-[#1E293B] border border-white/10 hover:border-green-500/40 px-4 py-2.5 rounded-xl text-xs font-black text-gray-400 hover:text-green-400 transition-all">
              📊 CSV
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-2 bg-[#1E293B] border border-white/10 hover:border-red-500/40 px-4 py-2.5 rounded-xl text-xs font-black text-gray-400 hover:text-red-400 transition-all">
              📄 PDF
            </button>
            <button onClick={onVoltar}
              className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] px-5 py-2.5 rounded-xl text-xs font-black text-black transition-all shadow-lg shadow-[#10B981]/20">
              ← Voltar
            </button>
          </motion.div>
        )}
      </div>

      {/* FILTROS */}
      <div className="px-4 lg:px-10 mb-8 print:hidden">
        <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-600">Filtros:</span>

          <select value={filtros.periodo} onChange={e => setFiltros(f=>({...f, periodo:e.target.value}))}
            className="bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#10B981]/50 cursor-pointer">
            {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          <select value={filtros.marca} onChange={e => setFiltros(f=>({...f, marca:e.target.value}))}
            className="bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#10B981]/50 cursor-pointer">
            <option value="todas">Todas as Marcas</option>
            {(filtrosData?.marcas||[]).map(m => <option key={m.id} value={m.id}>{m.emoji} {m.nome}</option>)}
          </select>

          <select value={filtros.operador} onChange={e => setFiltros(f=>({...f, operador:e.target.value}))}
            className="bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#10B981]/50 cursor-pointer">
            <option value="todos">Todos os Consultores</option>
            {(filtrosData?.operadores||[]).map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>

          {isLoading && <span className="text-[10px] text-[#10B981] animate-pulse font-black">⏳ Carregando...</span>}

          {/* KPIs rápidos */}
          <div className="ml-auto flex items-center gap-6">
            <div className="text-center">
              <p className="text-base font-black text-white">{d.total||0}</p>
              <p className="text-[8px] text-gray-600 uppercase font-bold">Leads</p>
            </div>
            <div className="text-center">
              <p className="text-base font-black text-green-400">{d.vendidos||0}</p>
              <p className="text-[8px] text-gray-600 uppercase font-bold">Convertidos</p>
            </div>
            <div className="text-center">
              <p className="text-base font-black text-[#10B981]">{d.txConversao||'0.0'}%</p>
              <p className="text-[8px] text-gray-600 uppercase font-bold">TX Conv.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function RelatoriosPage() {
  const { usuario } = useAuth()
  const [tipoAtivo, setTipoAtivo] = useState(null)
  const [filtros, setFiltros]     = useState({ periodo:'30', marca:'todas', operador:'todos' })

  const { data: filtrosData }      = useFiltrosRelatorio(usuario?.tenant_id)
  const { data, isLoading }        = useRelatorios(usuario?.tenant_id, filtros)
  const d = data || {}
  const tipoInfo = TIPOS.find(t => t.id === tipoAtivo)

  const handleVoltar = () => setTipoAtivo(null)
  const handleExportCSV = () => exportCSV(d.leads||[], tipoInfo?.label||'relatorio')

  // ════════════════════════════════════════════
  // RENDER DE CADA RELATÓRIO
  // ════════════════════════════════════════════
  const renderRelatorio = () => {
    switch(tipoAtivo) {

      // ── FUNIL ──────────────────────────────
      case 'funil': return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {(d.funil||[]).map((f,i) => (
              <div key={i} className="bg-[#1E293B] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400">{f.etapa}</p>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor:f.cor}} />
                </div>
                <p className="text-3xl font-black text-white">{f.count}</p>
                <p className="text-[10px] text-gray-600 mt-1">{fmtK(f.capital)} em capital</p>
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{width:0}} animate={{width:`${d.total>0?(f.count/d.total*100).toFixed(0):0}%`}}
                    transition={{duration:0.8, delay:i*0.1}} className="h-full rounded-full" style={{backgroundColor:f.cor}} />
                </div>
                <p className="text-[9px] text-gray-600 mt-1">{d.total>0?(f.count/d.total*100).toFixed(1):0}% do total</p>
              </div>
            ))}
          </div>
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white mb-4">Distribuição Visual do Funil</h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.funil||[]} margin={{top:5,right:5,bottom:5,left:-10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="etapa" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Leads" radius={[8,8,0,0]} barSize={44}>
                    {(d.funil||[]).map((f,i) => <Cell key={i} fill={f.cor} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )

      // ── CONVERSÃO ──────────────────────────
      case 'conversao': return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Taxa Conversão" value={`${d.txConversao||0}%`} icon="🎯" sub="Meta: 20%" cor="border-green-500/20" />
            <StatCard label="Taxa Perda"     value={`${d.txPerda||0}%`}     icon="💔" sub={`${d.perdidos||0} perdidos`} cor="border-red-500/20" />
            <StatCard label="Ciclo Médio"    value={`${d.cicloMedio||0}d`}  icon="⏱️" sub="Até conversão" />
            <StatCard label="Score Médio"    value={d.scoreMedio||0}        icon="⚡" sub="De 0 a 100" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Evolução de Conversões</h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.temporal||[]} margin={{top:5,right:5,bottom:5,left:-20}}>
                    <defs>
                      <linearGradient id="gVc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="dia" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="vendidos" name="Convertidos" stroke="#10b981" fill="url(#gVc)" strokeWidth={2.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Distribuição de Status</h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={(d.funil||[]).filter(f=>f.count>0)} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="etapa" stroke="none">
                      {(d.funil||[]).filter(f=>f.count>0).map((f,i) => <Cell key={i} fill={f.cor} />)}
                    </Pie>
                    <ChartTooltip contentStyle={{backgroundColor:'#0F172A',border:'1px solid rgba(238,123,77,0.2)',borderRadius:'12px'}} />
                    <Legend verticalAlign="bottom" height={36} formatter={v=><span style={{color:'#6a6a6f',fontSize:'10px'}}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )

      // ── CONSULTOR ──────────────────────────
      case 'consultor': return (
        <div className="space-y-6">
          <RankingTable dados={d.porConsultor||[]} colunas={[
            { key:'_rank',      label:'#',           render:(_,__,i)=><span className={`text-sm font-black ${i===0?'text-[#10B981]':i===1?'text-gray-300':i===2?'text-yellow-600':'text-gray-600'}`}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}º`}</span> },
            { key:'nome',       label:'Consultor',   render:v=><span className="text-white font-bold text-xs">{v}</span> },
            { key:'total',      label:'Leads',       render:v=><span className="text-gray-300 text-xs font-bold">{v}</span> },
            { key:'vendidos',   label:'Convertidos', render:v=><span className="text-green-400 text-xs font-bold">{v}</span> },
            { key:'perdidos',   label:'Perdidos',    render:v=><span className="text-red-400 text-xs font-bold">{v}</span> },
            { key:'txConversao',label:'Conversão',   render:v=>(
              <div className="flex items-center gap-2">
                <div className="w-16 bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{width:`${Math.min(100,parseFloat(v))}%`}} />
                </div>
                <span className="text-green-400 text-xs font-bold">{v}%</span>
              </div>
            )},
            { key:'capital', label:'Capital', render:v=><span className="text-[#10B981] text-xs font-bold">{fmtK(v)}</span> },
          ]} />
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white mb-4">Comparativo de Performance</h4>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.porConsultor||[]} margin={{top:5,right:5,bottom:20,left:-10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="nome" stroke="#374151" fontSize={8} axisLine={false} tickLine={false} angle={-15} textAnchor="end" />
                  <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="total"    name="Total"       fill="#3b82f6" radius={[4,4,0,0]} barSize={16} />
                  <Bar dataKey="vendidos" name="Convertidos" fill="#10b981" radius={[4,4,0,0]} barSize={16} />
                  <Bar dataKey="perdidos" name="Perdidos"    fill="#ef4444" radius={[4,4,0,0]} barSize={16} />
                  <Legend verticalAlign="top" height={28} formatter={v=><span style={{color:'#9ca3af',fontSize:'10px'}}>{v}</span>} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )

      // ── MARCA ──────────────────────────────
      case 'marca': return (
        <div className="space-y-6">
          <RankingTable dados={d.porMarca||[]} colunas={[
            { key:'_rank',      label:'#',          render:(_,__,i)=><span className="text-gray-600 text-xs font-black">{i+1}º</span> },
            { key:'nome',       label:'Marca',       render:v=><span className="text-white font-bold text-xs">{v}</span> },
            { key:'total',      label:'Leads',       render:v=><span className="text-gray-300 text-xs font-bold">{v}</span> },
            { key:'vendidos',   label:'Convertidos', render:v=><span className="text-green-400 text-xs font-bold">{v}</span> },
            { key:'txConversao',label:'TX Conv.',    render:v=><span className="text-[#10B981] text-xs font-bold">{v}%</span> },
            { key:'capital',    label:'Capital',     render:v=><span className="text-[#10B981] text-xs font-bold">{fmtK(v)}</span> },
          ]} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Leads por Marca</h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.porMarca||[]} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="total" nameKey="nome" stroke="none">
                      {(d.porMarca||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip contentStyle={{backgroundColor:'#0F172A',border:'1px solid rgba(238,123,77,0.2)',borderRadius:'12px'}} />
                    <Legend verticalAlign="bottom" height={36} formatter={v=><span style={{color:'#6a6a6f',fontSize:'10px'}}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Conversão por Marca</h4>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.porMarca||[]} layout="vertical" margin={{top:5,right:20,bottom:5,left:5}}>
                    <XAxis type="number" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nome" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} width={100} />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Bar dataKey="vendidos" name="Convertidos" fill="#10b981" radius={[0,8,8,0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )

      // ── TEMPORAL ───────────────────────────
      case 'temporal': return (
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white mb-4">Evolução de Leads no Período</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.temporal||[]} margin={{top:5,right:5,bottom:5,left:-10}}>
                  <defs>
                    <linearGradient id="gLt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gVt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="dia" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="leads"    name="Leads"       stroke="#10B981" fill="url(#gLt)" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="vendidos" name="Convertidos" stroke="#10b981" fill="url(#gVt)" strokeWidth={2}   dot={false} strokeDasharray="5 3" />
                  <Legend verticalAlign="top" height={28} formatter={v=><span style={{color:'#9ca3af',fontSize:'10px'}}>{v}</span>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white mb-4">Capital Convertido por Dia</h4>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.temporal||[]} margin={{top:5,right:5,bottom:5,left:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="dia" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="capital" name="Capital" fill="#10B981" radius={[6,6,0,0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )

      // ── FONTE ──────────────────────────────
      case 'fonte': return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Leads por Fonte</h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.porFonte||[]} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" nameKey="name" stroke="none">
                      {(d.porFonte||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip contentStyle={{backgroundColor:'#0F172A',border:'1px solid rgba(238,123,77,0.2)',borderRadius:'12px'}} />
                    <Legend verticalAlign="bottom" height={36} formatter={v=><span style={{color:'#6a6a6f',fontSize:'10px'}}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-3">
              {(d.porFonte||[]).map((f,i) => (
                <div key={i} className="bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{f.name}</span>
                    <span className="text-xs font-black text-[#10B981]">{f.value} leads</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${d.total>0?(f.value/d.total*100).toFixed(0):0}%`, backgroundColor:COLORS[i%COLORS.length]}} />
                  </div>
                  <p className="text-[9px] text-gray-600 mt-1">{d.total>0?(f.value/d.total*100).toFixed(1):0}% do total</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

      // ── PERDAS ─────────────────────────────
      case 'perda': return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Perdidos"  value={d.perdidos||0}              icon="💔" sub={`${d.txPerda||0}% do total`}          cor="border-red-500/20" />
            <StatCard label="Capital Perdido" value={fmtK(d.capitalPerdido||0)}  icon="💸" sub="Oportunidades perdidas"               cor="border-red-500/20" />
            <StatCard label="Ciclo até Perda" value={`${d.cicloMedio||0}d`}      icon="⏱️" sub="Média até desistir"                   cor="border-orange-500/20" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Principais Motivos de Perda</h4>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.motivosPerda||[]} margin={{top:5,right:5,bottom:25,left:-10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="motivo" stroke="#374151" fontSize={8} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                    <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Bar dataKey="valor" name="Leads" fill="#ef4444" radius={[8,8,0,0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">Ranking de Motivos</h4>
              {(d.motivosPerda||[]).map((m,i) => (
                <div key={i} className="bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{m.motivo}</span>
                    <span className="text-xs font-black text-red-400">{m.valor}x</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{width:`${d.perdidos>0?(m.valor/d.perdidos*100).toFixed(0):0}%`}} />
                  </div>
                </div>
              ))}
              {!(d.motivosPerda||[]).length && <p className="text-xs text-gray-600 text-center py-8">Nenhuma perda registrada 🎉</p>}
            </div>
          </div>
        </div>
      )

      // ── REGIÃO ─────────────────────────────
      case 'regiao': return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Leads por Estado</h4>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.porRegiao||[]} layout="vertical" margin={{top:5,right:20,bottom:5,left:10}}>
                    <XAxis type="number" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} width={40} />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Leads" radius={[0,8,8,0]} barSize={18}>
                      {(d.porRegiao||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white mb-3">Top Estados</h4>
              {(d.porRegiao||[]).map((r,i) => (
                <div key={i} className="flex items-center gap-3 bg-[#1E293B] border border-white/5 rounded-xl px-4 py-2.5">
                  <span className="text-base font-black text-gray-600 w-6 text-center">{i+1}</span>
                  <span className="flex-1 text-xs font-bold text-white">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${d.total>0?(r.value/d.total*100).toFixed(0):0}%`, backgroundColor:COLORS[i%COLORS.length]}} />
                    </div>
                    <span className="text-xs font-black text-[#10B981] w-8 text-right">{r.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )

      // ── SCORE ──────────────────────────────
      case 'score': return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Score Médio"  value={d.scoreMedio||0}   icon="⚡" sub="De 0 a 100" />
            <StatCard label="Total Leads"  value={d.total||0}         icon="🎯" />
            <StatCard label="Convertidos"  value={d.vendidos||0}      icon="✅" cor="border-green-500/20" />
            <StatCard label="TX Conversão" value={`${d.txConversao||0}%`} icon="📈" cor="border-[#10B981]/20" />
          </div>
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white mb-4">Distribuição de Score</h4>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.scoreDist||[]} margin={{top:5,right:5,bottom:5,left:-10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="faixa" stroke="#374151" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Leads" radius={[8,8,0,0]} barSize={44}>
                    {(d.scoreDist||[]).map((_,i)=><Cell key={i} fill={['#3b82f6','#F97316','#10B981','#ef4444','#dc2626'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )

      // ── CAPITAL ────────────────────────────
      case 'capital': return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Capital Total"      value={fmtK(d.capitalTotal||0)}      icon="💰" sub="Todos os leads"           cor="border-[#10B981]/20" />
            <StatCard label="Capital Convertido" value={fmtK(d.capitalConvertido||0)} icon="✅" sub={`${d.vendidos||0} conversões`} cor="border-green-500/20" />
            <StatCard label="Capital Pipeline"   value={fmtK(d.capitalPipeline||0)}   icon="🤝" sub="Em negociação"           cor="border-blue-500/20" />
            <StatCard label="Capital Perdido"    value={fmtK(d.capitalPerdido||0)}    icon="💔" sub={`${d.perdidos||0} perdidos`} cor="border-red-500/20" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Distribuição de Capital</h4>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name:'Convertido', value: d.capitalConvertido||0 },
                      { name:'Pipeline',   value: d.capitalPipeline||0  },
                      { name:'Perdido',    value: d.capitalPerdido||0   },
                    ].filter(x=>x.value>0)} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <ChartTooltip contentStyle={{backgroundColor:'#0F172A',border:'1px solid rgba(238,123,77,0.2)',borderRadius:'12px'}} formatter={v=>fmtFull(v)} />
                    <Legend verticalAlign="bottom" height={36} formatter={v=><span style={{color:'#6a6a6f',fontSize:'11px'}}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Capital Diário</h4>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.temporal||[]} margin={{top:5,right:5,bottom:5,left:10}}>
                    <defs>
                      <linearGradient id="gCap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="dia" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)} />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="capital" name="Capital" stroke="#10B981" fill="url(#gCap)" strokeWidth={2.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )

      default: return null
    }
  }

  // ════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0F172A] text-white pb-32 print:bg-white print:text-black">

      <PageHeader
        tipoAtivo={tipoAtivo}
        tipoInfo={tipoInfo}
        filtros={filtros}
        setFiltros={setFiltros}
        filtrosData={filtrosData}
        isLoading={isLoading}
        d={d}
        onVoltar={handleVoltar}
        onExportCSV={handleExportCSV}
      />

      <AnimatePresence mode="wait">

        {/* ── SELEÇÃO DE TIPO ── */}
        {!tipoAtivo && (
          <motion.div key="selecao"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            className="px-4 lg:px-10">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">Selecione o Relatório</h2>
              <p className="text-xs text-gray-600">Escolha o tipo de análise que deseja visualizar</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {TIPOS.map((tipo, i) => (
                <motion.button key={tipo.id}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
                  whileHover={{ scale:1.03, y:-3 }} whileTap={{ scale:0.97 }}
                  onClick={() => setTipoAtivo(tipo.id)}
                  className={`relative bg-gradient-to-br ${tipo.cor} border ${tipo.border} rounded-2xl p-5 text-left hover:shadow-xl transition-all group overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-white/3 -translate-y-4 translate-x-4 group-hover:scale-150 transition-transform duration-500" />
                  <span className="text-3xl mb-3 block">{tipo.icon}</span>
                  <p className="text-sm font-black text-white mb-1">{tipo.label}</p>
                  <p className="text-[9px] text-gray-500 leading-tight">{tipo.desc}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── RELATÓRIO ATIVO ── */}
        {tipoAtivo && (
          <motion.div key={tipoAtivo}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            className="px-4 lg:px-10">

            {/* Banner do relatório */}
            <div className={`bg-gradient-to-r ${tipoInfo?.cor} border ${tipoInfo?.border} rounded-2xl p-5 mb-6 flex items-center gap-4`}>
              <span className="text-4xl">{tipoInfo?.icon}</span>
              <div className="flex-1">
                <h2 className="text-xl font-black text-white">{tipoInfo?.label}</h2>
                <p className="text-xs text-gray-400">{tipoInfo?.desc} · {PERIODOS.find(p=>p.value===filtros.periodo)?.label}</p>
              </div>
              <div className="text-right hidden lg:block">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider">Gerado em</p>
                <p className="text-xs font-bold text-gray-400">{new Date().toLocaleString('pt-BR')}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div animate={{ rotate:360 }} transition={{ duration:1.5, repeat:Infinity, ease:'linear' }} className="text-5xl">⏳</motion.div>
              </div>
            ) : renderRelatorio()}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
