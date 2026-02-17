import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

export default function NichosPage() {
  const { usuario } = useAuth()
  const [segmentos, setSegmentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)

  const loadData = async () => {
    if (!usuario?.tenant_id) return
    setLoading(true)
    const { data } = await supabase.from('nichos').select('*').eq('tenant_id', usuario.tenant_id).order('nome')
    setSegmentos(data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [usuario])

  const handleSave = async (form) => {
    const { error } = form.id 
      ? await supabase.from('nichos').update(form).eq('id', form.id)
      : await supabase.from('nichos').insert([{ ...form, tenant_id: usuario.tenant_id }])
    if (!error) { setShowModal(false); loadData() }
  }

  if (loading) return <div className="p-20 text-center text-[#ee7b4d] font-black animate-pulse uppercase text-[10px]">Sincronizando Segmentos...</div>

  return (
    <div className="pt-10 pb-24">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-normal text-white">Gestão de <span className="text-[#ee7b4d] font-bold">Segmentos</span></h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-2 font-normal">Defina o ícone padrão para cada categoria</p>
        </div>
        <button onClick={() => { setSelected(null); setShowModal(true); }} className="bg-[#ee7b4d] text-[#0a0a0b] px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-[#ee7b4d]/20 hover:scale-105 transition-all">Novo Segmento</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {segmentos.map(s => (
          <div key={s.id} onClick={() => { setSelected(s); setShowModal(true); }} className="bg-[#12121a] border border-[#1f1f23] p-8 rounded-[2rem] hover:border-[#ee7b4d]/40 transition-all cursor-pointer group">
            {/* PUXANDO EMOJI DO BANCO */}
            <div className="w-12 h-12 rounded-xl bg-[#1f1f23] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform border border-white/5">
              {s.emoji || '🧩'}
            </div>
            <h3 className="font-bold text-white group-hover:text-[#ee7b4d] transition-colors">{s.nome}</h3>
            <p className="text-[9px] text-gray-600 uppercase font-black mt-1">Toque para editar ícone</p>
          </div>
        ))}
      </div>

      {showModal && <SegmentoModal data={selected} onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}

function SegmentoModal({ data, onClose, onSave }) {
  const [form, setForm] = useState(data || { nome: '', emoji: '🧩' })
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
      <div className="bg-[#0d0d12] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
        <h2 className="text-2xl font-normal text-white mb-8">Configurar <span className="text-[#ee7b4d] font-bold">Segmento</span></h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-20">
              <label className="text-[9px] text-gray-600 uppercase font-black ml-2 mb-1 block">Ícone</label>
              <input className="w-full bg-[#1f1f23] border border-gray-800 rounded-xl p-4 text-white text-center outline-none focus:border-[#ee7b4d]" value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} maxLength={2} />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-gray-600 uppercase font-black ml-2 mb-1 block">Nome</label>
              <input className="w-full bg-[#1f1f23] border border-gray-800 rounded-xl p-4 text-white focus:border-[#ee7b4d] outline-none font-normal" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-10">
          <button onClick={onClose} className="flex-1 text-gray-500 text-[10px] font-black uppercase hover:text-white">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 py-4 bg-[#ee7b4d] text-[#0a0a0b] font-black uppercase text-[10px] rounded-2xl shadow-lg hover:scale-105 transition-all">Salvar</button>
        </div>
      </div>
    </div>
  )
}