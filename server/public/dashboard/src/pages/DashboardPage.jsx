import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import KPIFilter from '../components/dashboard/KPIFilter';
import LeadModal from '../components/leads/LeadModal';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [kpiAtivo, setKpiAtivo] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeads = async () => {
    if (!usuario?.tenant_id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        marcas (
          id,
          nome,
          emoji
        ),
        motivos_desistencia (
          id,
          nome
        )
      `)
      .eq('tenant_id', usuario.tenant_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [usuario]);

  const getLeadsByKPI = () => {
    switch (kpiAtivo) {
      case 'Hot':
        return leads.filter(l => (l.score || 0) >= 70);
      case 'Warm':
        return leads.filter(l => (l.score || 0) >= 40 && (l.score || 0) < 70);
      case 'Cold':
        return leads.filter(l => (l.score || 0) < 40);
      default:
        return leads;
    }
  };

  const leadsFiltrados = getLeadsByKPI().filter(lead =>
    lead.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    lead.email?.toLowerCase().includes(busca.toLowerCase()) ||
    lead.telefone?.includes(busca)
  );

  const calcularKPIs = () => {
    const total = leads.length;
    const hot = leads.filter(l => (l.score || 0) >= 70).length;
    const warm = leads.filter(l => (l.score || 0) >= 40 && (l.score || 0) < 70).length;
    const cold = leads.filter(l => (l.score || 0) < 40).length;

    return { total, hot, warm, cold };
  };

  const kpis = calcularKPIs();

  const handleOpenModal = (lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
  };

  const handleSaveLead = async (updatedLead) => {
    try {
      const dataToUpdate = {
        status: updatedLead.status,
        observacao: updatedLead.observacao,
        score: updatedLead.score
      };

      // Se status for "Perdido", incluir motivo
      if (updatedLead.status?.toLowerCase() === 'perdido' && updatedLead.id_motivo_desistencia) {
        dataToUpdate.id_motivo_desistencia = updatedLead.id_motivo_desistencia;
      }

      const { error } = await supabase
        .from('leads')
        .update(dataToUpdate)
        .eq('id', updatedLead.id);

      if (error) throw error;

      await fetchLeads();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      alert('Erro ao salvar lead: ' + error.message);
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 70) return { label: 'Hot', bg: 'bg-red-500/10', text: 'text-red-500', icon: '🔥' };
    if (score >= 40) return { label: 'Warm', bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: '🌤️' };
    return { label: 'Cold', bg: 'bg-blue-500/10', text: 'text-blue-500', icon: '❄️' };
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('vendido')) return { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30' };
    if (statusLower.includes('negoc')) return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30' };
    if (statusLower.includes('perdido')) return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30' };
    if (statusLower.includes('agendado')) return { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30' };
    if (statusLower.includes('contato')) return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30' };
    return { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/30' };
  };

  const formatCurrency = (value) => {
    if (!value) return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pb-32">
      
      {/* HEADER */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-6 lg:mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-2">
            Gestão de <span className="text-[#ee7b4d] font-bold">Leads</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#ee7b4d] rounded-full"></div>
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              {leads.length} {leads.length === 1 ? 'lead cadastrado' : 'leads cadastrados'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* KPI FILTERS */}
      <div className="px-4 lg:px-10 mb-6 lg:mb-8">
        <KPIFilter
          kpis={kpis}
          kpiAtivo={kpiAtivo}
          setKpiAtivo={setKpiAtivo}
        />
      </div>

      {/* SEARCH BAR */}
      <div className="px-4 lg:px-10 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Buscar lead..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="
              w-full
              bg-[#12121a]
              border border-white/5
              rounded-2xl
              px-5 py-4
              lg:px-6 lg:py-4
              text-sm lg:text-base
              text-white
              placeholder:text-gray-600
              focus:outline-none
              focus:border-[#ee7b4d]/50
              focus:ring-2
              focus:ring-[#ee7b4d]/20
              transition-all
            "
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="px-4 lg:px-10">
        {leadsFiltrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4 opacity-30">📊</div>
            <p className="text-xl text-gray-400 mb-2">
              {busca ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {busca ? 'Tente ajustar sua busca' : 'Aguardando novos leads...'}
            </p>
          </motion.div>
        ) : (
          <div className="bg-[#12121a] border border-white/5 rounded-3xl overflow-hidden">
            {/* TABLE HEADER */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-[#1f1f23] border-b border-white/5">
              <div className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Lead</div>
              <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Contato</div>
              <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Capital</div>
              <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Marca</div>
              <div className="col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Score</div>
              <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</div>
            </div>

            {/* TABLE BODY */}
            <div className="divide-y divide-white/5">
              {leadsFiltrados.map((lead, index) => {
                const scoreBadge = getScoreBadge(lead.score || 0);
                const statusBadge = getStatusBadge(lead.status);

                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleOpenModal(lead)}
                    className="
                      grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4
                      px-6 py-4 lg:py-5
                      hover:bg-white/5
                      cursor-pointer
                      transition-colors
                    "
                  >
                    {/* Lead Info */}
                    <div className="col-span-1 lg:col-span-3">
                      <div className="font-bold text-white mb-1">{lead.nome}</div>
                      <div className="text-sm text-gray-500 truncate lg:hidden">{lead.email}</div>
                    </div>

                    {/* Contato */}
                    <div className="col-span-1 lg:col-span-2">
                      <div className="text-sm text-gray-400">{lead.email}</div>
                      <div className="text-xs text-gray-500">{lead.telefone || '—'}</div>
                    </div>

                    {/* Capital */}
                    <div className="col-span-1 lg:col-span-2">
                      <div className="text-sm font-bold text-white">
                        {formatCurrency(lead.capital_disponivel)}
                      </div>
                      <div className="text-xs text-gray-500">{lead.fonte || '—'}</div>
                    </div>

                    {/* Marca */}
                    <div className="col-span-1 lg:col-span-2">
                      {lead.marcas ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{lead.marcas.emoji}</span>
                          <span className="text-sm text-gray-400">{lead.marcas.nome}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </div>

                    {/* Score */}
                    <div className="col-span-1 lg:col-span-1 flex lg:justify-center items-start lg:items-center">
                      <div className={`
                        ${scoreBadge.bg}
                        border border-white/10
                        rounded-lg
                        px-3 py-1
                        flex items-center gap-1
                      `}>
                        <span className="text-base">{scoreBadge.icon}</span>
                        <span className={`text-sm font-black ${scoreBadge.text}`}>
                          {lead.score || 0}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 lg:col-span-2">
                      <div className={`
                        ${statusBadge.bg}
                        ${statusBadge.border}
                        border
                        rounded-lg
                        px-3 py-1.5
                        inline-block
                      `}>
                        <span className={`text-xs font-bold uppercase tracking-wide ${statusBadge.text}`}>
                          {lead.status || 'Novo'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <LeadModal
          lead={selectedLead}
          onClose={handleCloseModal}
          onSave={handleSaveLead}
        />
      )}
    </div>
  );
}