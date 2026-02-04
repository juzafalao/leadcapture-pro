import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import LeadModal from '../components/leads/LeadModal';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  useEffect(() => {
    if (usuario?.tenant_id) {
      // Alteramos a linha do .select para buscar o "neto" (segmento) através da marca
      supabase
        .from('leads')
        .select('*, marcas(nome, emoji, segmentos:id_segmento(nome))') 
        .eq('tenant_id', usuario.tenant_id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setLeads(data || []));
    }
  }, [usuario]);

  const filtrados = leads.filter(l => 
    l.nome?.toLowerCase().includes(busca.toLowerCase()) && 
    (filtroCategoria === 'Todos' || l.categoria === filtroCategoria) &&
    (filtroStatus === 'Todos' || l.status === filtroStatus)
  );

  return (
    <div className="p-10 pt-32 bg-[#0a0a0b] min-h-screen text-left">
      {/* KPI FILTERS - LARANJA TRANSPARENTE */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <KPICard 
          label="Volume Total" val={leads.length} icon="🔘" 
          active={filtroCategoria === 'Todos'} onClick={() => setFiltroCategoria('Todos')} 
        />
        <KPICard 
          label="Leads Hot" val={leads.filter(l => l.categoria === 'hot').length} icon="🔥" 
          active={filtroCategoria === 'hot'} onClick={() => setFiltroCategoria('hot')}
        />
        <KPICard 
          label="Leads Warm" val={leads.filter(l => l.categoria === 'warm').length} icon="🌤️" 
          active={filtroCategoria === 'warm'} onClick={() => setFiltroCategoria('warm')}
        />
        <KPICard 
          label="Leads Cold" val={leads.filter(l => l.categoria === 'cold').length} icon="❄️" 
          active={filtroCategoria === 'cold'} onClick={() => setFiltroCategoria('cold')}
        />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex gap-4 mb-10">
        <div className="flex-1 bg-[#12121a] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <span className="text-gray-600">🔍</span>
          <input type="text" placeholder="Buscar investidor pelo nome..." className="bg-transparent outline-none text-white text-sm w-full" onChange={e => setBusca(e.target.value)} />
        </div>
        <div className="w-64 bg-[#12121a] border border-white/5 p-4 rounded-2xl">
          <select className="bg-transparent outline-none text-white text-[10px] font-black uppercase w-full cursor-pointer tracking-widest" onChange={e => setFiltroStatus(e.target.value)}>
            <option value="Todos">Status Comercial</option>
            <option value="Novo">Novo Lead</option>
            <option value="Convertido">Convertido</option>
          </select>
        </div>
      </div>

      {/* GRID IDÊNTICO */}
      <div className="w-full">
        <div className="grid grid-cols-7 px-8 mb-4 text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
          <div className="col-span-1">Lead / Identificação</div>
          <div>Telefone</div>
          <div>Marca</div>
          <div>Fonte</div>
          <div className="text-center">Score</div>
          <div className="text-center">Categoria</div>
          <div className="text-right">Status</div>
        </div>
        
        <div className="space-y-3">
          {filtrados.map(l => (
            <div 
              key={l.id} 
              onClick={() => setSelectedLead(l)}
              className="grid grid-cols-7 items-center px-8 py-5 bg-[#12121a] border border-white/[0.03] rounded-2xl hover:border-[#ee7b4d]/40 transition-all cursor-pointer group shadow-lg"
            >
              {/* Coluna Lead (Nome + E-mail) */}
              <div className="col-span-1">
                <p className="text-sm font-bold text-white group-hover:text-[#ee7b4d] transition-colors">{l.nome}</p>
                <p className="text-[10px] text-gray-600 font-medium truncate">{l.email}</p>
              </div>

              {/* Coluna Telefone */}
              <div className="text-[11px] text-gray-400 font-bold">{l.telefone || '(19) 9999-9999'}</div>

              {/* Coluna Marca */}
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                <span>{l.marcas?.emoji}</span>
                <span className="truncate">{l.marcas?.nome}</span>
              </div>

              {/* Coluna Fonte */}
              <div className="text-[10px] text-gray-600 font-black uppercase tracking-tighter">{l.fonte || 'Website'}</div>

              {/* Coluna Score */}
              <div className="text-center">
                <span className={`inline-flex items-center justify-center px-4 py-1 rounded-lg text-xs font-black min-w-[50px] ${l.score >= 80 ? 'bg-[#ee7b4d] text-[#0a0a0b]' : 'bg-white/5 text-gray-500'}`}>
                  {l.score || 0}
                </span>
              </div>

              {/* Coluna Categoria */}
              <div className="text-center">
                <span className={`inline-flex items-center justify-center px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${l.categoria === 'hot' ? 'bg-[#ee7b4d] text-[#0a0a0b]' : 'bg-white/5 text-blue-400'}`}>
                  {l.categoria || 'cold'}
                </span>
              </div>

              {/* Coluna Status */}
              <div className="text-right text-[10px] font-black text-[#ee7b4d] uppercase tracking-tighter">
                🔹 {l.status}
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedLead && <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}

function KPICard({ label, val, icon, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`
        p-8 rounded-[2.5rem] border transition-all duration-300 cursor-pointer hover:scale-105 shadow-2xl
        ${active 
          ? 'bg-[#ee7b4d]/20 border-[#ee7b4d]/40' 
          : 'bg-[#12121a] border-white/5 hover:bg-[#ee7b4d]/10'
        }
      `}
    >
      <span className="text-2xl mb-4 block">{icon}</span>
      <p className={`text-4xl font-black mb-1 ${active ? 'text-[#ee7b4d]' : 'text-white'}`}>{val}</p>
      <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}