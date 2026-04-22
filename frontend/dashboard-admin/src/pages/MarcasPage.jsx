import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import MarcaCard from '../components/dashboard/MarcaCard';
import FAB from '../components/dashboard/FAB';
import MarcaModal from '../components/marcas/MarcaModal';
import { useAlertModal } from '../hooks/useAlertModal';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const PAGE_SIZE = 20;

export default function MarcasPage() {
  const { usuario, isPlatformAdmin } = useAuth();
  const { alertModal, showAlert } = useAlertModal();
  const canEdit = ['Administrador', 'admin', 'Diretor'].includes(usuario?.role);
  const [marcas, setMarcas] = useState([]);
  const [segmentos, setSegmentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMarca, setSelectedMarca] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef(null);

  const handleBuscaChange = useCallback((value) => {
    setBuscaInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBusca(value), 300);
  }, []);

  const fetchMarcas = async () => {
    if (!usuario?.tenant_id && !isPlatformAdmin()) return;
    setLoading(true);
    let query = supabase.from('marcas').select('*').order('created_at', { ascending: false });
    if (!isPlatformAdmin()) query = query.eq('tenant_id', usuario.tenant_id);
    const { data, error } = await query;
    if (!error && data) {
      setMarcas(data);
    } else if (error) {
      showAlert({ type: 'error', title: 'Erro', message: 'Erro ao buscar marcas: ' + error.message });
    }
    setLoading(false);
  };

  const fetchSegmentos = async () => {
    if (!usuario?.tenant_id && !isPlatformAdmin()) return;
    let query = supabase.from('segmentos').select('id, nome, emoji').order('nome');
    if (!isPlatformAdmin()) query = query.eq('tenant_id', usuario.tenant_id);
    const { data, error } = await query;
    if (!error && data) setSegmentos(data);
  };

  useEffect(() => {
    fetchMarcas();
    fetchSegmentos();
  }, [usuario]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [busca]);

  const marcasFiltradas = marcas.filter(m =>
    m.nome?.toLowerCase().includes(busca.toLowerCase())
  );
  const totalPages = Math.ceil(marcasFiltradas.length / PAGE_SIZE);
  const paginatedMarcas = marcasFiltradas.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const startIndex = (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, marcasFiltradas.length);

  const handleOpenModal = (marca = null) => {
    setSelectedMarca(marca);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMarca(null);
    setIsSaving(false);
  };

  const handleSaveMarca = async (marcaData) => {
    setIsSaving(true);
    try {
      const dataToSave = {
        tenant_id: usuario.tenant_id,
        nome: marcaData.nome,
        emoji: marcaData.emoji,
        id_segmento: marcaData.segmento_id || null,
        invest_min: marcaData.investimento_minimo || 0,
        invest_max: marcaData.investimento_maximo || 0,
        ativo: true
      };
      if (marcaData.id) {
        const { error } = await supabase.from('marcas').update(dataToSave).eq('id', marcaData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('marcas').insert(dataToSave);
        if (error) throw error;
      }
      await fetchMarcas();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar marca:', error);
      showAlert({ type: 'error', title: 'Erro ao salvar', message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMarca = async (marca) => {
    try {
      const { error } = await supabase.from('marcas').delete().eq('id', marca.id);
      if (error) throw error;
      await fetchMarcas();
    } catch (error) {
      showAlert({ type: 'error', title: 'Erro ao excluir', message: error.message });
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {alertModal}

      {/* Header */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-8 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-1">
            Gestao de <span className="text-[#10B981] font-bold">Marcas</span>
          </h1>
          <div className="w-16 h-0.5 bg-[#10B981] rounded-full mb-2" />
          <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Franquias e marcas cadastradas no sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl px-4 py-3 text-center">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">Total</p>
            <p className="text-xl font-black text-white">{marcas.length}</p>
          </div>
          {canEdit && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2.5 rounded-xl text-[11px] font-black bg-[#10B981] text-black hover:bg-[#059669] transition-all flex items-center gap-1.5"
            >
              <span className="text-lg leading-none">+</span> Nova marca
            </button>
          )}
        </div>
      </div>

      {/* Busca */}
      <div className="px-4 lg:px-10 mb-5">
        <input
          type="text"
          placeholder="Buscar marca..."
          value={buscaInput}
          onChange={e => handleBuscaChange(e.target.value)}
          className="w-full max-w-sm bg-[#0B1220] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/40 transition-colors"
        />
      </div>

      {/* Conteudo */}
      <div className="flex-1 px-4 lg:px-10 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : marcasFiltradas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-700 mb-2">
              {busca ? 'Nenhuma marca encontrada' : 'Nenhuma marca cadastrada'}
            </p>
            {canEdit && !busca && (
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 px-4 py-2 rounded-xl text-[11px] font-black bg-[#10B981] text-black hover:bg-[#059669] transition-all"
              >
                Cadastrar primeira marca
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedMarcas.map(marca => (
                <MarcaCard
                  key={marca.id}
                  marca={marca}
                  segmentos={segmentos}
                  canEdit={canEdit}
                  onEdit={() => handleOpenModal(marca)}
                  onDelete={() => handleDeleteMarca(marca)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.04]">
                <p className="text-[10px] text-gray-600">
                  {startIndex}-{endIndex} de {marcasFiltradas.length}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] text-gray-500 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 transition-all">
                    Anterior
                  </button>
                  <span className="px-3 py-1.5 text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] text-gray-500 hover:bg-white/[0.07] hover:text-white disabled:opacity-30 transition-all">
                    Proxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <MarcaModal
          marca={selectedMarca}
          segmentos={segmentos}
          onSave={handleSaveMarca}
          onClose={handleCloseModal}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
