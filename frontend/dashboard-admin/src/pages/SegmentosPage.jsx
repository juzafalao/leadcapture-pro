import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import SegmentoCard from '../components/dashboard/SegmentoCard';
import FAB from '../components/dashboard/FAB';
import SegmentoModal from '../components/segmentos/SegmentoModal';

export default function SegmentosPage() {
  const { usuario } = useAuth();
  const [segmentos, setSegmentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [selectedSegmento, setSelectedSegmento] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSegmentos = async () => {
    if (!usuario?.tenant_id) return;
    setLoading(true);

    try {
      // Query simplificada
      const { data, error } = await supabase
        .from('segmentos')
        .select('*')
        .eq('tenant_id', usuario.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar marcas e leads relacionados
      if (data && data.length > 0) {
        const segmentosCompletos = await Promise.all(
          data.map(async (segmento) => {
            // Buscar marcas vinculadas
            const { data: marcas } = await supabase
              .from('marcas')
              .select('id, nome, emoji')
              .eq('id_segmento', segmento.id);

            // Buscar leads das marcas deste segmento
            const marcasIds = (marcas || []).map(m => m.id);
            const { data: leads } = await supabase
              .from('leads')
              .select('id')
              .in('marca_id', marcasIds.length > 0 ? marcasIds : ['00000000-0000-0000-0000-000000000000']);
            return {
              ...segmento,
              marcas_relacionadas: marcas || [],
              leads: leads || []
            };
          })
        );

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

  const segmentosFiltrados = segmentos.filter(s =>
    s.nome?.toLowerCase().includes(busca.toLowerCase())
  );

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
                onClick={() => setBusca('')}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {segmentosFiltrados.map((segmento, index) => (
              <SegmentoCard
                key={segmento.id}
                segmento={segmento}
                index={index}
                onClick={() => handleOpenModal(segmento)}
              />
            ))}
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