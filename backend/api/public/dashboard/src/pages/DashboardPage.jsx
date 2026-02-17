import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import KPIFilter from '../components/dashboard/KPIFilter';
import LeadModal from '../components/leads/LeadModal';
import AtribuirOperadorModal from '../components/leads/AtribuirOperadorModal';
import FAB from '../components/dashboard/FAB';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [leads, setLeads] = useState([]);
  const [leadsFiltrados, setLeadsFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpiAtivo, setKpiAtivo] = useState('All');
  const [busca, setBusca] = useState('');
  const [filtroMeusLeads, setFiltroMeusLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAtribuirModalOpen, setIsAtribuirModalOpen] = useState(false);
  const [leadParaAtribuir, setLeadParaAtribuir] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, [usuario]);

  useEffect(() => {
    filtrarLeads();
  }, [kpiAtivo, busca, leads, filtroMeusLeads]);

  const fetchLeads = async () => {
    if (!usuario?.tenant_id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        marcas (nome, emoji),
        operador:id_operador_responsavel (
          id,
          nome,
          role
        )
      `)
      .eq('tenant_id', usuario.tenant_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data);
      setLeadsFiltrados(data);
    }
    setLoading(false);
  };

  const filtrarLeads = () => {
    let filtrados = [...leads];

    // Filtrar por "Meus Leads"
    if (filtroMeusLeads) {
      filtrados = filtrados.filter(lead => 
        lead.id_operador_responsavel === usuario.id
      );
    }

    // Filtrar por categoria (Hot, Warm, Cold)
    if (kpiAtivo !== 'All') {
      filtrados = filtrados.filter(lead => 
        lead.categoria?.toLowerCase() === kpiAtivo.toLowerCase()
      );
    }

    // Filtrar por busca
    if (busca) {
      filtrados = filtrados.filter(lead =>
        lead.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        lead.email?.toLowerCase().includes(busca.toLowerCase()) ||
        lead.telefone?.includes(busca) ||
        lead.cidade?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    setLeadsFiltrados(filtrados);
  };

  const handleOpenModal = (lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
    fetchLeads();
  };

  const handleAtribuir = (lead) => {
    setLeadParaAtribuir(lead);
    setIsAtribuirModalOpen(true);
  };

  const handleCloseAtribuirModal = () => {
    setIsAtribuirModalOpen(false);
    setLeadParaAtribuir(null);
  };

  const handleAtribuirSuccess = () => {
    fetchLeads();
  };

  // KPIs
  const kpis = {
    total: leads.length,
    hot: leads.filter(l => l.categoria?.toLowerCase() === 'hot').length,
    warm: leads.filter(l => l.categoria?.toLowerCase() === 'warm').length,
    cold: leads.filter(l => l.categoria?.toLowerCase() === 'cold').length,
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
            Olá, <span className="text-[#ee7b4d] font-bold">{usuario?.nome?.split(' ')[0]}</span> 👋
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#ee7b4d] rounded-full"></div>
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Dashboard de Gestão de Leads
            </p>
          </div>
        </motion.div>
      </div>

      {/* KPI FILTER */}
      <div className="px-4 lg:px-10 mb-8">
        <KPIFilter
          kpis={kpis}
          kpiAtivo={kpiAtivo}
          setKpiAtivo={setKpiAtivo}
        />
      </div>

      {/* SEARCH BAR + FILTRO MEUS LEADS */}
      <div className="px-4 lg:px-10 mb-8">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar lead por nome, email, telefone ou cidade..."
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

          {/* Filtro Meus Leads */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFiltroMeusLeads(!filtroMeusLeads)}
            className={`
              flex items-center justify-center gap-2
              px-6 py-4
              rounded-2xl
              font-bold
              transition-all
              whitespace-nowrap
              ${filtroMeusLeads
                ? 'bg-gradient-to-r from-[#ee7b4d] to-[#f59e42] text-black shadow-lg shadow-[#ee7b4d]/20'
                : 'bg-[#12121a] border border-white/5 text-white hover:bg-white/5'
              }
            `}
          >
            <span className="text-xl">
              {filtroMeusLeads ? '✓' : '👤'}
            </span>
            <span className="hidden lg:inline">
              Meus Leads
            </span>
            {filtroMeusLeads && (
              <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs">
                {leadsFiltrados.length}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* LEADS TABLE */}
      <div className="px-4 lg:px-10">
        {leadsFiltrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4 opacity-30">📭</div>
            <p className="text-xl text-gray-400 mb-2">
              {busca || kpiAtivo !== 'All' || filtroMeusLeads ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {busca || kpiAtivo !== 'All' || filtroMeusLeads ? 'Tente ajustar os filtros' : 'Comece importando ou criando seus leads!'}
            </p>
            {(busca || kpiAtivo !== 'All' || filtroMeusLeads) && (
              <button
                onClick={() => {
                  setBusca('');
                  setKpiAtivo('All');
                  setFiltroMeusLeads(false);
                }}
                className="px-6 py-3 bg-[#ee7b4d] text-black font-bold rounded-xl hover:bg-[#d4663a] transition-all"
              >
                Limpar Filtros
              </button>
            )}
          </motion.div>
        ) : (
          <div className="bg-[#12121a] border border-white/5 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Contato
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      Localização
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Score
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Responsável
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leadsFiltrados.map((lead, index) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {/* Lead */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ee7b4d] to-[#f59e42] flex items-center justify-center text-white font-bold">
                            {lead.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white">{lead.nome}</div>
                            <div className="text-xs text-gray-400">
                              {lead.marcas?.emoji} {lead.marcas?.nome || 'Sem marca'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contato */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-300">{lead.email || '-'}</div>
                        <div className="text-xs text-gray-500">{lead.telefone || '-'}</div>
                      </td>

                      {/* Localização */}
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <div className="text-sm text-gray-300">
                          {lead.cidade ? `${lead.cidade} - ${lead.estado}` : '-'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`
                          inline-flex items-center gap-1
                          px-3 py-1
                          rounded-full
                          text-xs font-bold
                          ${lead.categoria?.toLowerCase() === 'hot' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                            : lead.categoria?.toLowerCase() === 'warm'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }
                        `}>
                          {lead.categoria?.toLowerCase() === 'hot' && '🔥'}
                          {lead.categoria?.toLowerCase() === 'warm' && '🌤️'}
                          {lead.categoria?.toLowerCase() === 'cold' && '❄️'}
                          {lead.categoria || 'Cold'}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                lead.score >= 70 ? 'bg-red-500' :
                                lead.score >= 40 ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-400 w-8 text-right">
                            {lead.score || 0}
                          </span>
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {lead.operador ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                              {lead.operador.nome?.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-300">
                              {lead.operador.nome}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Não atribuído</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Atribuir */}
                          <button
                            onClick={() => handleAtribuir(lead)}
                            className="
                              px-3 py-2
                              rounded-lg
                              bg-blue-500/10
                              border border-blue-500/30
                              text-blue-400
                              text-xs
                              font-bold
                              hover:bg-blue-500/20
                              transition-all
                              flex items-center gap-1
                            "
                            title="Atribuir operador"
                          >
                            <span>👤</span>
                            <span className="hidden lg:inline">Atribuir</span>
                          </button>

                          {/* Botão Ver Detalhes */}
                          <button
                            onClick={() => handleOpenModal(lead)}
                            className="
                              px-3 py-2
                              rounded-lg
                              bg-white/5
                              border border-white/10
                              text-white
                              text-xs
                              font-bold
                              hover:bg-white/10
                              transition-all
                            "
                          >
                            Ver detalhes
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <FAB onClick={() => handleOpenModal(null)} />

      {/* MODALS */}
      {isModalOpen && (
        <LeadModal
          lead={selectedLead}
          onClose={handleCloseModal}
        />
      )}

      {isAtribuirModalOpen && leadParaAtribuir && (
        <AtribuirOperadorModal
          lead={leadParaAtribuir}
          onClose={handleCloseAtribuirModal}
          onSuccess={handleAtribuirSuccess}
        />
      )}
    </div>
  );
}