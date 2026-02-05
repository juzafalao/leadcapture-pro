import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import LeadModal from '../components/leads/LeadModal';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [leads, setLeads] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [filtroKpi, setFiltroKpi] = useState('Todos');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshData = useCallback(async () => {
  setLoading(true);
  const tenantId = '81cac3a4-caa3-43b2-be4d-d16557d7ef88';
  
  // A mágica está aqui: marcas(nome, segmentos(nome))
  const [leadsRes, statusRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, marcas(nome, segmentos(nome))') 
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('status_comercial')
      .select('*')
      .eq('tenant_id', tenantId)
  ]);

  if (!leadsRes.error) setLeads(leadsRes.data || []);
  if (!statusRes.error) setStatusList(statusRes.data || []);
  setLoading(false);
}, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const leadsFiltrados = leads.filter(l => {
    const matchBusca = l.nome?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'Todos' || l.status === filtroStatus;
    let matchKpi = true;
    if (filtroKpi === 'Hot') matchKpi = (l.score || 0) >= 80;
    if (filtroKpi === 'Warm') matchKpi = (l.score || 0) >= 50 && (l.score || 0) < 80;
    return matchBusca && matchStatus && matchKpi;
  });

  return (
    <div className="p-4 md:p-10 pt-20 md:pt-32 bg-[#0a0a0b] min-h-screen text-left">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-light text-white italic tracking-tighter uppercase">Gestão <span className="text-[#ee7b4d] not-italic font-bold">Leads</span></h2>
        <p className="text-gray-600 font-black text-[8px] uppercase tracking-[0.4em] mt-1 italic">Performance Estratégica</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Volume Total" val={leads.length} icon="⚪" active={filtroKpi === 'Todos'} onClick={() => {setFiltroKpi('Todos'); setFiltroStatus('Todos');}} />
        <StatCard label="Leads Hot" val={leads.filter(l => (l.score || 0) >= 80).length} icon="🔥" active={filtroKpi === 'Hot'} onClick={() => setFiltroKpi('Hot')} />
        <StatCard label="Leads Warm" val={leads.filter(l => (l.score || 0) >= 50 && (l.score || 0) < 80).length} icon="🌤️" active={filtroKpi === 'Warm'} onClick={() => setFiltroKpi('Warm')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8 mx-1">
        <div className="md:col-span-8 bg-[#12121a] border border-white/5 p-4 rounded-xl flex items-center">
          <input type="text" placeholder="BUSCAR INVESTIDOR..." value={busca} onChange={(e) => setBusca(e.target.value)} className="bg-transparent border-none outline-none text-[9px] font-black uppercase text-white w-full" />
        </div>
        <div className="md:col-span-4 bg-[#12121a] border border-white/5 p-4 rounded-xl">
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="bg-[#12121a] text-white text-[9px] font-black uppercase w-full outline-none cursor-pointer">
            <option value="Todos">Status (Todos)</option>
            {statusList?.map(s => <option key={s.id} value={s.label}>{s.label?.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2 px-1">
        {loading ? <p className="text-center py-20 animate-pulse text-[9px] font-black uppercase text-gray-700">Sincronizando BI...</p> : leadsFiltrados.map((lead) => (
          <div key={lead.id} onClick={() => { setSelectedLead(lead); setIsModalOpen(true); }} className="bg-[#12121a] border border-white/5 p-4 md:p-5 rounded-xl md:rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center hover:bg-[#ee7b4d]/5 transition-all cursor-pointer group">
            <div className="md:col-span-3">
              <p className="text-white font-bold text-xs uppercase group-hover:text-[#ee7b4d] transition-colors">{lead.nome}</p>
              <p className="text-gray-600 text-[9px] italic lowercase">{lead.email}</p>
            </div>
            <div className="md:col-span-2 text-[10px] text-gray-400 font-bold">{lead.telefone || '---'}</div>
            <div className="md:col-span-2 flex flex-col gap-1">
              <span className="text-[8px] text-gray-500 uppercase">🏢 {lead.marcas?.nome || 'DIRETO'}</span>
              <span className="text-[8px] text-[#ee7b4d] font-bold uppercase tracking-widest italic">{lead.segmentos?.nome || 'SEM SEGMENTO'}</span>
            </div>
            <div className="md:col-span-2 text-[10px] text-gray-600 uppercase italic">{lead.fonte || 'Website'}</div>
            <div className="md:col-span-1">
              <div className={`w-9 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${lead.score >= 80 ? 'bg-[#ee7b4d] text-black shadow-lg shadow-[#ee7b4d]/20' : 'bg-blue-500/10 text-blue-400'}`}>{lead.score || '0'}</div>
            </div>
            <div className="md:col-span-2 flex justify-end text-[9px] font-bold text-gray-400 uppercase tracking-tighter">⚡ {lead.status}</div>
          </div>
        ))}
      </div>
      {isModalOpen && <LeadModal lead={selectedLead} onClose={() => { setIsModalOpen(false); refreshData(); }} />}
    </div>
  );
}

function StatCard({ label, val, icon, active, onClick }) {
  return (
    <div onClick={onClick} className={`bg-[#12121a] border border-white/5 p-6 rounded-[2rem] transition-all cursor-pointer hover:bg-[#ee7b4d]/10 ${active ? 'ring-1 ring-[#ee7b4d] bg-[#ee7b4d]/5 border-[#ee7b4d]/40' : 'opacity-70 hover:opacity-100'}`}>
      <span className="text-lg mb-3 block">{icon}</span>
      <p className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tighter">{val}</p>
      <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">{label}</p>
    </div>
  );
}