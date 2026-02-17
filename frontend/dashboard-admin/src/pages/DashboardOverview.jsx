import React from 'react'
import { useLeads, useMetrics } from '../hooks/useLeads' 
import { useAuth } from '../App'

export default function DashboardOverview() {
  const { usuario } = useAuth()
  const { data: metrics } = useMetrics(usuario?.tenant_id)
  
  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  return (
    <div className="pt-10 pb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-normal text-white">Visão <span className="text-[#ee7b4d] font-bold">Estratégica</span></h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-2">Performance Global do Tenant</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <KpiCard label="Leads Ativos" value={metrics?.total || 0} sub="Volume Total" color="text-white" />
        <KpiCard label="Leads Hot" value={metrics?.hot || 0} sub="Alta Intenção" color="text-[#ee7b4d]" />
        <KpiCard label="Taxa de Conversão" value={`${metrics?.taxaConversao || 0}%`} sub="Leads Vendidos" color="text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#12121a] border border-[#1f1f23] p-10 rounded-[2.5rem] shadow-2xl">
          <h3 className="text-[10px] text-gray-600 uppercase font-black mb-8 tracking-widest">Qualidade da Base</h3>
          <div className="space-y-6">
            <ProgressBar label="Hot (Prontos)" value={metrics?.hot} total={metrics?.total} color="bg-[#ee7b4d]" />
            <ProgressBar label="Warm (Em Aquecimento)" value={metrics?.warm} total={metrics?.total} color="bg-blue-500" />
            <ProgressBar label="Cold (Novos)" value={metrics?.cold} total={metrics?.total} color="bg-gray-700" />
          </div>
        </div>
        
        <div className="bg-[#12121a] border border-[#1f1f23] p-10 rounded-[2.5rem] shadow-2xl flex items-center justify-center">
          <div className="text-center">
            <p className="text-[10px] text-gray-600 uppercase font-black mb-4 tracking-widest">Status de Vendas</p>
            <p className="text-6xl font-bold text-white">{metrics?.convertidos || 0}</p>
            <p className="text-[10px] text-[#ee7b4d] font-black uppercase mt-2">Contratos Fechados</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="bg-[#12121a] border border-[#1f1f23] p-8 rounded-[2rem] shadow-xl">
      <p className="text-[9px] text-gray-600 uppercase font-black mb-3">{label}</p>
      <p className={`text-4xl font-bold ${color} mb-1`}>{value}</p>
      <p className="text-[10px] text-gray-500 font-normal">{sub}</p>
    </div>
  )
}

function ProgressBar({ label, value, total, color }) {
  const perc = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-[9px] font-black uppercase mb-2">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${perc}%` }}></div>
      </div>
    </div>
  )
}