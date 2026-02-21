import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import SegmentoCard from '../components/dashboard/SegmentoCard';
import FAB from '../components/dashboard/FAB';
import SegmentoModal from '../components/segmentos/SegmentoModal';
import LeadCaptureLogo from '../components/LeadCaptureLogo';

const PAGE_SIZE = 20;

export default function SegmentosPage() {
  const { usuario } = useAuth();
  const [segmentos, setSegmentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSegmento, setSelectedSegmento] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef(null);

  const handleBuscaChange = useCallback((value) => {
    setBuscaInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBusca(value), 300);
  }, []);

  const fetchSegmentos = async () => {
    if (!usuario?.tenant_id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('segmentos')
        .select('id, nome, emoji, created_at, tenant_id')
        .eq('tenant_id', usuario.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch all related marcas in a single query
        const segmentoIds = data.map(s => s.id);
        const { data: todasMarcas } = await supabase
          .from('marcas')
          .select('id, nome, emoji, id_segmento')
          .in('id_segmento', segmentoIds);

        const marcasMap = {};
        (todasMarcas || []).forEach(m => {
          if (!marcasMap[m.id_segmento]) marcasMap[m.id_segmento] = [];
          marcasMap[m.id_segmento].push(m);
        });

        // Fetch lead counts per marca in a single query
        const todasMarcasIds = (todasMarcas || []).map(m => m.id);
        let leadsCountMap = {};
        if (todasMarcasIds.length > 0) {
          const { data: leadsData } = await supabase
            .from('leads')
            .select('marca_id')
            .in('marca_id', todasMarcasIds);
          (leadsData || []).forEach(l => {
            leadsCountMap[l.marca_id] = (leadsCountMap[l.marca_id] || 0) + 1;
          });
        }

        const segmentosCompletos = data.map(segmento => {
          const marcas = marcasMap[segmento.id] || [];
          const leadsCount = marcas.reduce((acc, m) => acc + (leadsCountMap[m.id] || 0), 0);
          return {
            ...segmento,
            marcas_relacionadas: marcas,
            leadsCount
          };
        });

        setSegmentos(segmentosCompletos);
      } else {
        setSegmentos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error);
      setSegmentos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentos();
  }, [usuario]);

  useEffect(() => {
    setPage(1);
  }, [busca]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const segmentosFiltrados = segmentos.filter(s =>
    s.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  const totalPages = Math.ceil(segmentosFiltrados.length / PAGE_SIZE);
  const paginatedSegmentos = segmentosFiltrados.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const startIndex = (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, segmentosFiltrados.length);

  const handleOpenModal = (segmento = null) => {
    setSelectedSegmento(segmento);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSegmento(null);
    setIsSaving(false);
  };

  const handleSaveSegmento = async (segmentoData) => {
    setIsSaving(true);
    
    try {
      const dataToSave = {
        tenant_id: usuario.tenant_id,
        nome: segmentoData.nome,
        emoji: segmentoData.emoji
      };

      if (segmentoData.id) {
        // Editar
        const { error } = await supabase
          .from('segmentos')
          .update(dataToSave)
          .eq('id', segmentoData.id);

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase
          .from('segmentos')
          .insert(dataToSave);

        if (error) throw error;
      }

      await fetchSegmentos();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar segmento:', error);
      alert('Erro ao salvar segmento: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="animate-pulse">
          <LeadCaptureLogo variant="icon" size={64} />
        </div>
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
            Gestão de <span className="text-[#ee7b4d] font-bold">Segmentos</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#ee7b4d] rounded-full"></div>
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              {segmentos.length} {segmentos.length === 1 ? 'segmento cadastrado' : 'segmentos cadastrados'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* SEARCH BAR */}
      <div className="px-4 lg:px-10 mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Buscar segmento..."
            value={buscaInput}
            onChange={(e) => handleBuscaChange(e.target.value)}
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
          {buscaInput && (
            <button
              onClick={() => { setBuscaInput(''); setBusca(''); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* SEGMENTOS GRID */}
      <div className="px-4 lg:px-10">
        {segmentosFiltrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4 opacity-30">🎯</div>
            <p className="text-xl text-gray-400 mb-2">
              {busca ? 'Nenhum segmento encontrado' : 'Nenhum segmento cadastrado'}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {busca ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro segmento!'}
            </p>
            {busca ? (
              <button
                onClick={() => { setBuscaInput(''); setBusca(''); }}
                className="px-6 py-3 bg-[#ee7b4d] text-black font-bold rounded-xl hover:bg-[#d4663a] transition-all"
              >
                Limpar Busca
              </button>
            ) : (
              <button
                onClick={() => handleOpenModal(null)}
                className="px-6 py-3 bg-[#ee7b4d] text-black font-bold rounded-xl hover:bg-[#d4663a] transition-all"
              >
                + Criar Primeiro Segmento
              </button>
            )}
          </motion.div>
        ) : (
          <div className="bg-[#12121a] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {paginatedSegmentos.map((segmento, index) => (
                  <SegmentoCard
                    key={segmento.id}
                    segmento={segmento}
                    index={index}
                    onClick={() => handleOpenModal(segmento)}
                  />
                ))}
              </div>
            </div>

            {/* FOOTER COM PAGINAÇÃO */}
            <div className="px-4 py-4 border-t border-white/5 bg-[#12121a] rounded-b-3xl">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Info */}
                <p className="text-xs text-gray-600">
                  Exibindo <span className="text-white font-bold">{startIndex}</span> a{' '}
                  <span className="text-white font-bold">{endIndex}</span> de{' '}
                  <span className="text-white font-bold">{segmentosFiltrados.length}</span> itens
                </p>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= page - 1 && pageNum <= page + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`
                                w-8 h-8 rounded-lg text-xs font-bold transition-all
                                ${page === pageNum
                                  ? 'bg-[#ee7b4d] text-black'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }
                              `}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return <span key={pageNum} className="text-gray-600">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Próxima →
                    </button>
                  </div>
                )}

                {/* Branding */}
                <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">
                  LeadCapture Pro · Zafalão Tech
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <FAB onClick={() => handleOpenModal(null)} />

      {/* MODAL */}
      {isModalOpen && (
        <SegmentoModal
          segmento={selectedSegmento}
          onClose={handleCloseModal}
          onSave={handleSaveSegmento}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}