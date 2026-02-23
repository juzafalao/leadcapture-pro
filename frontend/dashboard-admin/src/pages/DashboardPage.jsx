import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { useLeads, useMetrics } from '../hooks/useLeads';
import { useDebounce } from '../hooks/useDebounce';
import KPIFilter from '../components/dashboard/KPIFilter';
import LeadModal from '../components/leads/LeadModal';
import AtribuirOperadorModal from '../components/leads/AtribuirOperadorModal';
import FAB from '../components/dashboard/FAB';

const ROLES_GESTOR = ['Administrador', 'admin', 'Diretor', 'Gestor'];
const ROLES_CONSULTOR = ['Consultor'];

export default function DashboardPage() {
  const { usuario } = useAuth();

  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [kpiAtivo, setKpiAtivo] = useState('All');
  const [busca, setBusca] = useState('');
  const [filtroMeusLeads, setFiltroMeusLeads] = useState(false);
  const debouncedBusca = useDebounce(busca, 500);

  const { data: leadsData, isLoading: loading, isPlaceholderData } = useLeads({
    tenantId: usuario?.tenant_id,
    page,
    perPage,
    filters: {
      search: debouncedBusca,
      status: kpiAtivo,
      meusLeads: filtroMeusLeads,
      userId: usuario?.id
    }
  });

  const leads = leadsData?.data || [];
  const totalCount = leadsData?.count || 0;
  const totalPages = Math.ceil(totalCount / perPage);
  const { data: metrics } = useMetrics(usuario?.tenant_id);

  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAtribuirModalOpen, setIsAtribuirModalOpen] = useState(false);
  const [leadParaAtribuir, setLeadParaAtribuir] = useState(null);

  const handleOpenModal = (lead) => { setSelectedLead(lead); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedLead(null); };
  const handleAtribuir = (lead) => { setLeadParaAtribuir(lead); setIsAtribuirModalOpen(true); };
  const handleCloseAtribuirModal = () => { setIsAtribuirModalOpen(false); setLeadParaAtribuir(null); };

  React.useEffect(() => { setPage(1); }, [kpiAtivo, filtroMeusLeads, debouncedBusca]);

  const kpis = metrics || { total: 0, hot: 0, warm: 0, cold: 0 };

  const isGestor = ROLES_GESTOR.includes(usuario?.role);
  const isConsultor = ROLES_CONSULTOR.includes(usuario?.role);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-6xl">⏳</motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] pb-32">

      {/* HEADER */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-6 lg:mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-2">
            Olá, <span className="text-[#10B981] font-bold">{usuario?.nome?.split(" ")[0]}</span> 👋
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#10B981] rounded-full"></div>
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Dashboard de Gestão de Leads</p>
          </div>
        </motion.div>
      </div>

      {/* KPI FILTER */}
      <div className="px-4 lg:px-10 mb-8">
        <KPIFilter kpis={kpis} kpiAtivo={kpiAtivo} setKpiAtivo={setKpiAtivo} />
      </div>

      {/* SEARCH + FILTROS */}
      <div className="px-4 lg:px-10 mb-8">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar por nome, email, telefone ou cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#1E293B] border border-white/5 rounded-2xl px-5 py-4 text-sm text-[#F8FAFC] placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/20 transition-all"
            />
            {busca && (
              <button onClick={() => setBusca("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">✕</button>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setFiltroMeusLeads(!filtroMeusLeads)}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${filtroMeusLeads ? "bg-gradient-to-r from-[#10B981] to-[#059669] text-black shadow-lg" : "bg-[#1E293B] border border-white/5 text-[#F8FAFC] hover:bg-white/5"}`}
          >
            <span>{filtroMeusLeads ? "✓" : "👤"}</span>
            <span className="hidden lg:inline">Meus Leads</span>
          </motion.button>
        </div>
      </div>

      {/* TABELA */}
      <div className="px-4 lg:px-10">
        {leads.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">📭</div>
            <p className="text-xl text-gray-400 mb-2">{busca || kpiAtivo !== "All" || filtroMeusLeads ? "Nenhum lead encontrado" : "Nenhum lead cadastrado"}</p>
            <p className="text-sm text-gray-600 mb-6">{busca || kpiAtivo !== "All" || filtroMeusLeads ? "Tente ajustar os filtros" : "Comece importando ou criando seus leads!"}</p>
            {(busca || kpiAtivo !== "All" || filtroMeusLeads) && (
              <button onClick={() => { setBusca(""); setKpiAtivo("All"); setFiltroMeusLeads(false); }} className="px-6 py-3 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#059669] transition-all">Limpar Filtros</button>
            )}
          </motion.div>
        ) : (
          <div className="bg-[#1E293B] border border-white/5 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contato</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden xl:table-cell">Localização</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">Marca</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">Score</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status Comercial</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden xl:table-cell">Atribuído</th>
                    <th className="px-4 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {/* Nome */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold flex-shrink-0">
                            {lead.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white">{lead.nome}</div>
                            <div className="text-xs text-gray-500">{lead.fonte || "—"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contato */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-white font-medium">{lead.telefone || "—"}</div>
                        <div className="text-xs text-gray-500">{lead.email || "—"}</div>
                      </td>

                      {/* Localização */}
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <div className="text-sm text-gray-300">
                          {lead.cidade && lead.estado ? `${lead.cidade} - ${lead.estado}` : lead.regiao_interesse || "—"}
                        </div>
                      </td>

                      {/* Marca */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {lead.marca ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{lead.marca.emoji}</span>
                            <span className="text-sm text-gray-300">{lead.marca.nome}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">Sem marca</span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm font-bold text-gray-300">{lead.score || 0}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          lead.categoria?.toLowerCase() === "hot" ? "bg-red-500/10 text-red-400 border border-red-500/30" :
                          lead.categoria?.toLowerCase() === "warm" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" :
                          "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        }`}>
                          {lead.categoria?.toLowerCase() === "hot" && "🔥"}
                          {lead.categoria?.toLowerCase() === "warm" && "🌤️"}
                          {lead.categoria?.toLowerCase() === "cold" && "❄️"}
                          {lead.categoria || "Cold"}
                        </span>
                      </td>

                      {/* Status Comercial */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {lead.status ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                            lead.status.toLowerCase().includes('vendido') || lead.status.toLowerCase().includes('convertido')
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : lead.status.toLowerCase().includes('negoc')
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : lead.status.toLowerCase().includes('perdido')
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : lead.status.toLowerCase().includes('agendado')
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : lead.status.toLowerCase().includes('contato')
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                          }`}>
                            {lead.status}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600 italic">—</span>
                        )}
                      </td>

                      {/* Atribuído */}
                      <td className="px-4 py-4 hidden xl:table-cell">
                        {lead.operador ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {lead.operador.nome?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-300 truncate max-w-[100px]">{lead.operador.nome}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600 italic">Não atribuído</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Atribuir - somente Gestor+ */}
                          {isGestor && (
                            <button
                              onClick={() => handleAtribuir(lead)}
                              className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all flex items-center gap-1"
                              title="Atribuir operador"
                            >
                              <span>👤</span>
                              <span className="hidden lg:inline">Atribuir</span>
                            </button>
                          )}
                          {/* Ver detalhes - todos */}
                          <button
                            onClick={() => handleOpenModal(lead)}
                            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
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

            {/* PAGINAÇÃO */}
            {totalCount > 0 && (
              <div className="px-4 py-4 flex items-center justify-between border-t border-white/5">
                <button onClick={() => setPage(old => Math.max(old - 1, 1))} disabled={page === 1} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold text-gray-400">← Anterior</button>
                <span className="text-xs lg:text-sm text-gray-500">Página <span className="text-[#F8FAFC]">{page}</span> de <span className="text-[#F8FAFC]">{totalPages}</span> · <span className="text-[#10B981]">{totalCount}</span> leads</span>
                <button onClick={() => { if (!isPlaceholderData && page < totalPages) setPage(old => old + 1); }} disabled={isPlaceholderData || page >= totalPages} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold text-gray-400">Próximo →</button>
              </div>
            )}
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
          isGestor={isGestor}
          isConsultor={isConsultor}
          usuarioRole={usuario?.role}
        />
      )}
      {isAtribuirModalOpen && leadParaAtribuir && (
        <AtribuirOperadorModal
          lead={leadParaAtribuir}
          onClose={handleCloseAtribuirModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
