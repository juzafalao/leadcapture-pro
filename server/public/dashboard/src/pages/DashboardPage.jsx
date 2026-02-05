import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import PageHeader from '../components/shared/PageHeader';
import LeadModal from '../components/leads/LeadModal';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos'); // Adicionado conforme solicitado
  
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*, marcas(nome)')
      .eq('tenant_id', '81cac3a4-caa3-43b2-be4d-d16557d7ef88')
      .order('created_at', { ascending: false });

    if (!error && data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleOpenModal = (lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Lógica de Filtro Cruzado (Nome + Status)
  const leadsFiltrados = leads.filter(l => {
    const matchNome = l.nome?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'Todos' || l.status === filtroStatus;
    return matchNome && matchStatus;
  });

  // KPIs Dinâmicos baseados no Banco
  const totalVolume = leads.length;
  const hotLeads = leads.filter(l => l.score >= 80).length;
  const warmLeads = leads.filter(l => l.score >= 50 && l.score < 80).length;

  return (
    <div className="p-4 md:p-10 pt-20 md:pt-32 bg-[#0a0a0b] min-h-screen text-left">
      <div className="mb-6 px-1">
        <p className="text-[#ee7b4d] font-black text-[8px] md:text-[10px] uppercase tracking-[0.4em] mb-1 italic">Gestão Leads</p>
        <h2 className="text-xl md:text-3xl font-light text-white italic tracking-tighter">
          Lead<span className="font-bold not-italic">Capture</span> <span className="text-gray-600">Pro</span>
        </h2>
      </div>

      {/* KPIS REFINADOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-8">
        <StatCard label="Volume Total" val={totalVolume} icon="⚪" color="bg-[#241612] border-[#ee7b4d]/20" />
        <StatCard label="Leads Hot" val={hotLeads} icon="🔥" color="bg-[#12121a] border-white/5" />
        <StatCard label="Leads Warm" val={warmLeads} icon="🌤️" color="bg-[#12121a] border-white/5" />
      </div>

      {/* ÁREA DE BUSCA E STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8 mx-1">
        <div className="md:col-span-8 bg-[#12121a] border border-white/5 p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-3 focus-within:border-[#ee7b4d]/30 transition-all">
          <span className="opacity-40 text-lg">🔍</span>
          <input 
            type="text" placeholder="BUSCAR INVESTIDOR..." value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="bg-transparent border-none outline-none text-[9px] md:text-[10px] font-black uppercase text-white w-full"
          />
        </div>
        <div className="md:col-span-4 bg-[#12121a] border border-white/5 p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center">
          <select 
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="bg-transparent border-none outline-none text-[9px] md:text-[10px] font-black uppercase text-[#ee7b4d] w-full cursor-pointer"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Novo">Novo</option>
            <option value="Contato">Contato</option>
            <option value="Negociação">Negociação</option>
            <option value="Convertido">Convertido</option>
            <option value="Perdido">Perdido</option>
          </select>
        </div>
      </div>

      {/* LISTAGEM - COM COLUNA DE STATUS */}
      <div className="space-y-2 md:space-y-3 px-1">
        {/* HEADER DESKTOP */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 mb-4 text-[9px] font-black text-gray-700 uppercase tracking-widest">
          <div className="col-span-3">Lead / Identificação</div>
          <div className="col-span-2">Telefone</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Marca</div>
          <div className="col-span-2">Fonte</div>
          <div className="col-span-1 text-right">Score</div>
        </div>

        {loading ? (
          <p className="text-center text-gray-600 text-[9px] font-black uppercase py-10 animate-pulse">Sincronizando Leads...</p>
        ) : leadsFiltrados.map((lead) => (
          <div 
            key={lead.id} 
            onClick={() => handleOpenModal(lead)}
            className="bg-[#12121a] border border-white/5 p-4 md:p-5 rounded-xl md:rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center hover:border-[#ee7b4d]/20 hover:bg-white/[0.01] transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="md:col-span-3">
              <p className="text-white font-bold text-sm md:text-sm group-hover:text-[#ee7b4d] transition-colors uppercase tracking-tight">{lead.nome}</p>
              <p className="text-gray-600 text-[9px] md:text-[10px] italic lowercase">{lead.email}</p>
            </div>

            <div className="md:col-span-2 hidden md:block text-gray-400 text-[11px] font-bold">
              {lead.telefone}
            </div>

            <div className="md:col-span-2">
              <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full border ${
                lead.status === 'Convertido' ? 'border-[#00d95f] text-[#00d95f]' : 
                lead.status === 'Novo' ? 'border-blue-500 text-blue-500' : 'border-white/10 text-gray-500'
              }`}>
                {lead.status || 'Novo'}
              </span>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <p className="text-[9px] font-black uppercase text-gray-500 truncate">{lead.marcas?.nome || 'DIRETO'}</p>
            </div>

            <div className="md:col-span-2 hidden md:block text-[9px] font-black uppercase text-gray-700 tracking-widest">
              {lead.fonte || 'GOOGLE'}
            </div>

            <div className="md:col-span-1 flex justify-between md:justify-end items-center">
              <span className="md:hidden text-[8px] font-black text-gray-800 uppercase">Score</span>
              <div className={`text-[10px] font-black px-3 py-1 rounded-lg ${lead.score >= 80 ? 'bg-[#ee7b4d] text-black shadow-lg shadow-[#ee7b4d]/10' : 'bg-white/5 text-gray-500'}`}>
                {lead.score || '00'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && <LeadModal lead={selectedLead} onClose={() => { setIsModalOpen(false); fetchLeads(); }} />}
    </div>
  );
}

function StatCard({ label, val, icon, color }) {
  return (
    <div className={`${color} border p-5 md:p-6 rounded-2xl md:rounded-3xl transition-all mx-1`}>
      <span className="text-lg md:text-xl mb-2 md:mb-3 block">{icon}</span>
      <p className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tighter">{val}</p>
      <p className="text-[8px] md:text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}