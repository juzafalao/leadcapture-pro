import React, { useState, useMemo } from 'react'
import { useMetrics, useLeads } from '../hooks/useLeads'
import { useMarcas } from '../hooks/useMarcas'
import { useAuth } from '../App'

export default function RelatoriosPage() {
  const { usuario } = useAuth()
  const { data: metrics, isLoading: loadingMetrics } = useMetrics(usuario?.tenant_id)
  const { data: leads, isLoading: loadingLeads } = useLeads(usuario?.tenant_id)
  const { data: marcas } = useMarcas(usuario?.tenant_id)

  const [filtroMarca, setFiltroMarca] = useState('all')
  const [camposExport, setCamposExport] = useState({
    nome: true, email: true, telefone: true, status: true, score: true, marca: true
  })

  const leadsFiltrados = useMemo(() => {
    if (!leads) return []
    return leads.filter(l => filtroMarca === 'all' || l.marca_id === filtroMarca)
  }, [leads, filtroMarca])

  const stats = useMemo(() => {
    const total = leadsFiltrados.length
    const hot = leadsFiltrados.filter(l => l.score >= 70).length
    const warm = leadsFiltrados.filter(l => l.score >= 40 && l.score < 70).length
    const cold = leadsFiltrados.filter(l => l.score < 40).length
    const fechados = leadsFiltrados.filter(l => l.status === 'convertido').length
    const taxa = total > 0 ? ((fechados / total) * 100).toFixed(1) : 0

    return { total, hot, warm, cold, fechados, taxa }
  }, [leadsFiltrados])

  const handleExportCSV = () => {
    if (leadsFiltrados.length === 0) return alert("Sem dados para exportar.")
    const cabecalho = Object.keys(camposExport).filter(c => camposExport[c]).join(';')
    const linhas = leadsFiltrados.map(l => {
      const row = []
      if (camposExport.nome) row.push(l.nome)
      if (camposExport.email) row.push(l.email)
      if (camposExport.telefone) row.push(l.telefone)
      if (camposExport.status) row.push(l.status)
      if (camposExport.score) row.push(l.score)
      if (camposExport.marca) row.push(l.marca?.nome || 'Multimarcas')
      return row.join(';')
    })
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + cabecalho + "\n" + linhas.join("\n")
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", `relatorio_leads_${new Date().toLocaleDateString()}.csv`)
    link.click()
  }

  if (loadingMetrics || loadingLeads) return <div className="h-screen flex items-center justify-center text-[#ee7b4d] font-black animate-pulse uppercase tracking-[0.4em]">Sincronizando BI...</div>

  // CÁLCULO PARA O GRÁFICO PIZZA
  const dashHot = (stats.hot / stats.total) * 100 || 0
  const dashWarm = (stats.warm / stats.total) * 100 || 0

  return (
    <div className="p-4 lg:p-10 pt-24 lg:pt-10 pb-24 max-w-[1600px] mx-auto">
      <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-4xl font-normal text-white leading-tight">BI <span className="text-[#ee7b4d] font-bold">Analítico</span></h1>
          <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-[0.3em] font-black">Performance e Controle de Dados</p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[9px] text-gray-600 uppercase font-black ml-2 tracking-widest">Filtrar por Marca</label>
          <select value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)} className="bg-[#12121a] border border-[#1f1f23] rounded-2xl px-6 py-4 text-white text-xs outline-none focus:border-[#ee7b4d] min-w-[280px]">
            <option value="all">Todas as Unidades</option>
            {marcas?.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard label="Leads Filtrados" value={stats.total} sub="Volume na Seleção" color="text-white" />
        <StatCard label="Taxa de Conversão" value={`${stats.taxa}%`} sub="Sucesso em Vendas" color="text-green-500" />
        <StatCard label="Leads Hot" value={stats.hot} sub="Alta Qualificação" color="text-[#ee7b4d]" />
        <StatCard label="Fechamentos" value={stats.fechados} sub="Total Vendido" color="text-[#ee7b4d]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* GRÁFICO PIZZA DE CATEGORIAS */}
        <div className="bg-[#12121a] border border-white/5 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center">
          <h3 className="text-[10px] text-gray-600 uppercase font-black mb-10 tracking-widest">Nível dos Leads</h3>
          <div className="relative w-48 h-48 mb-8">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-800" strokeWidth="4" />
              {/* Cold Segment */}
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-600" strokeWidth="4" strokeDasharray="100 100" />
              {/* Warm Segment */}
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-500" strokeWidth="4" strokeDasharray={`${dashHot + dashWarm} 100`} />
              {/* Hot Segment */}
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#ee7b4d]" strokeWidth="4" strokeDasharray={`${dashHot} 100`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-3xl text-white font-light">{stats.total}</span>
               <span className="text-[7px] text-gray-500 uppercase font-black">Total</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Legend label="Hot" color="bg-[#ee7b4d]" />
            <Legend label="Warm" color="bg-blue-500" />
            <Legend label="Cold" color="bg-gray-600" />
          </div>
        </div>

        {/* FUNIL DE PROGRESSO */}
        <div className="lg:col-span-2 bg-[#12121a] border border-white/5 p-10 rounded-[3rem] shadow-2xl">
          <h3 className="text-[10px] text-gray-600 uppercase font-black mb-10 tracking-widest">Progresso do Funil Comercial</h3>
          <div className="flex items-end justify-between h-56 gap-4 px-4">
            {['Novo', 'Contato', 'Agendado', 'Negociação', 'Vendido'].map((st, i) => {
              const count = leadsFiltrados.filter(l => l.status?.toLowerCase().includes(st.toLowerCase())).length
              const height = stats.total > 0 ? (count / stats.total) * 100 : 5
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="w-full bg-[#ee7b4d]/10 rounded-t-2xl group-hover:bg-[#ee7b4d] transition-all duration-700 relative border-x border-t border-white/5" style={{ height: `${height}%` }}>
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-[#ee7b4d] font-bold opacity-0 group-hover:opacity-100 transition-all">{count}</span>
                  </div>
                  <span className="text-[8px] text-gray-500 uppercase font-black mt-4 text-center leading-tight">{st}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* EXPORTADOR */}
      <section className="bg-[#12121a] border border-[#ee7b4d]/20 p-12 rounded-[4rem] shadow-2xl">
        <h2 className="text-2xl font-normal text-white mb-2">Exportação <span className="text-[#ee7b4d] font-bold">Customizada</span></h2>
        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-10">Gere relatórios específicos selecionando as colunas abaixo</p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
          {Object.keys(camposExport).map(campo => (
            <label key={campo} className={`flex items-center justify-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${camposExport[campo] ? 'bg-[#ee7b4d]/10 border-[#ee7b4d] text-white' : 'bg-[#1f1f23] border-white/5 text-gray-600'}`}>
              <input type="checkbox" className="hidden" checked={camposExport[campo]} onChange={() => setCamposExport(p => ({...p, [campo]: !p[campo]}))} />
              <span className="text-[10px] font-black uppercase tracking-widest">{campo}</span>
              {camposExport[campo] && <span className="text-[#ee7b4d] font-bold">✓</span>}
            </label>
          ))}
        </div>
        <button onClick={handleExportCSV} className="px-16 py-6 bg-[#ee7b4d] text-[#0a0a0b] font-black uppercase text-xs rounded-2xl shadow-xl shadow-[#ee7b4d]/20 hover:scale-[1.02] active:scale-95 transition-all">Baixar Relatório em CSV</button>
      </section>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-[#12121a] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
      <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-3">{label}</p>
      <p className={`text-4xl font-normal mb-2 ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-500 font-bold">{sub}</p>
    </div>
  )
}

function Legend({ label, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{label}</span>
    </div>
  )
}