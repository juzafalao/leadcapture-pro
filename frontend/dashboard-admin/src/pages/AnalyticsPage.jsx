import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'

export default function AnalyticsPage() {
  const { usuario } = useAuth()
  const [data, setData] = useState({ leads: [], segmentos: [] })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!usuario?.tenant_id) return
    setLoading(true)
    const [l, s] = await Promise.all([
      supabase.from('leads').select('*, marcas(segmentos:id_segmento(nome))').eq('tenant_id', usuario.tenant_id),
      supabase.from('segmentos').select('*').eq('tenant_id', usuario.tenant_id)
    ])
    setData({ leads: l.data || [], segmentos: s.data || [] })
    setLoading(false)
  }

  useEffect(() => { if (usuario) loadData() }, [usuario])

  return (
    <div className="p-6 md:p-10 text-left">
      <header className="mb-10 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-normal text-white">Centro de <span className="text-[#ee7b4d] font-bold">Inteligência</span></h1>
          <p className="text-gray-500 text-[10px] font-black uppercase mt-2">Visão Estratégica LC Pro</p>
        </div>
        <button className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl font-black uppercase text-[10px] text-gray-400">Extrair Relatório</button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-[#12121a] p-8 rounded-[2rem] border border-white/5">
          <p className="text-3xl font-black text-white">{data.leads.length}</p>
          <p className="text-[9px] text-gray-600 font-black uppercase mt-1">Leads Totais</p>
        </div>
        <div className="bg-[#12121a] p-8 rounded-[2rem] border border-white/5">
          <p className="text-3xl font-black text-orange-500">{data.leads.filter(l => l.categoria === 'hot').length}</p>
          <p className="text-[9px] text-gray-600 font-black uppercase mt-1">Leads Hot</p>
        </div>
      </div>

      <div className="bg-[#12121a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <h3 className="text-[10px] text-gray-500 font-black uppercase mb-8">Performance por Segmento</h3>
        <div className="space-y-6">
          {data.segmentos.map(seg => {
            const count = data.leads.filter(l => l.marcas?.segmentos?.nome === seg.nome).length
            const perc = data.leads.length > 0 ? (count / data.leads.length) * 100 : 0
            return (
              <div key={seg.id}>
                <div className="flex justify-between text-[11px] font-bold mb-2">
                  <span className="text-gray-400">{seg.emoji} {seg.nome}</span>
                  <span className="text-[#ee7b4d]">{count} Leads</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ee7b4d] transition-all duration-1000" style={{ width: `${perc}%` }}></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}