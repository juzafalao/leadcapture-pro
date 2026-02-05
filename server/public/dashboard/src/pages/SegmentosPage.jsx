import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SegmentoModal from '../components/segmentos/SegmentoModal';

export default function SegmentosPage() {
  const { usuario, isGestor } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegmento, setSelectedSegmento] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ✅ BUSCAR SEGMENTOS (sem COUNT de marcas para evitar erro)
  const { data: segmentos = [], isLoading } = useQuery({
    queryKey: ['segmentos', usuario?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('segmentos')
        .select('id, tenant_id, nome, emoji, created_at')
        .eq('tenant_id', usuario.tenant_id)
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar segmentos:', error);
        throw error;
      }
      
      return (data || []).map(s => ({
        ...s,
        ativo: true,
        descricao: ''
      }));
    },
    enabled: !!usuario?.tenant_id
  });

  // ✅ SALVAR SEGMENTO
  const saveSegmento = useMutation({
    mutationFn: async (segmentoData) => {
      const dbData = {
        nome: segmentoData.nome,
        emoji: segmentoData.emoji
      };

      if (segmentoData.id) {
        // Atualizar
        const { data, error } = await supabase
          .from('segmentos')
          .update(dbData)
          .eq('id', segmentoData.id)
          .select()
          .single();
        
        if (error) {
          console.error('Erro ao atualizar segmento:', error);
          throw error;
        }
        return data;
      } else {
        // Criar
        const { data, error } = await supabase
          .from('segmentos')
          .insert({ ...dbData, tenant_id: usuario.tenant_id })
          .select()
          .single();
        
        if (error) {
          console.error('Erro ao criar segmento:', error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['segmentos']);
      setShowModal(false);
      setSelectedSegmento(null);
    },
    onError: (error) => {
      alert('Erro ao salvar segmento: ' + error.message);
    }
  });

  const filteredSegmentos = segmentos.filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewSegmento = () => {
    setSelectedSegmento(null);
    setShowModal(true);
  };

  const handleEditSegmento = (segmento) => {
    setSelectedSegmento(segmento);
    setShowModal(true);
  };

  if (!isGestor()) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-[#6a6a6f]">Acesso restrito a Gestores e Administradores</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      
      {/* STICKY HEADER */}
      <div className="sticky top-[52px] lg:top-[56px] z-30 bg-[#0a0a0b] pb-6">
        
        <div className="px-6 lg:px-10 pt-8 lg:pt-10 mb-6">
          <h1 className="text-3xl lg:text-4xl font-light text-white mb-3">
            Gestão de <span className="text-[#ee7b4d] font-bold">Segmentos</span>
          </h1>
          <div className="w-24 h-0.5 bg-[#ee7b4d] rounded-full mb-4"></div>
          <p className="text-[9px] lg:text-[10px] text-[#6a6a6f] uppercase tracking-[0.25em] font-bold">
            Categorização e Análise de Mercado
          </p>
        </div>

        <div className="px-6 lg:px-10">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar segmento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1f] border border-[#2a2a2f] rounded-xl px-4 py-3 pl-10 text-white text-sm placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4a4f]">🔍</span>
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 px-6 lg:px-10 overflow-y-auto pb-8">
        
        <div className="mb-4">
          <p className="text-xs text-[#6a6a6f]">
            <span className="text-[#ee7b4d] font-bold">{filteredSegmentos.length}</span> segmentos cadastrados
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 animate-pulse">⏳</div>
            <p className="text-[#6a6a6f]">Carregando segmentos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* CARD + NOVO SEGMENTO */}
            <button
              onClick={handleNewSegmento}
              className="bg-[#12121a] border-2 border-dashed border-[#2a2a2f] rounded-2xl p-8 hover:border-[#ee7b4d]/50 hover:bg-[#1f1f23]/30 transition-all group min-h-[200px] flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#ee7b4d]/10 flex items-center justify-center text-4xl text-[#ee7b4d] mb-4 group-hover:scale-110 transition-transform">
                +
              </div>
              <p className="text-lg font-semibold text-white">Novo Segmento</p>
              <p className="text-xs text-[#6a6a6f] mt-1">Adicionar categoria</p>
            </button>

            {/* SEGMENTOS EXISTENTES */}
            {filteredSegmentos.map((segmento) => (
              <div
                key={segmento.id}
                onClick={() => handleEditSegmento(segmento)}
                className="bg-[#12121a] border border-[#1f1f23] rounded-2xl p-6 hover:border-[#ee7b4d]/30 transition-all group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#ee7b4d]/10 flex items-center justify-center text-4xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                  {segmento.emoji}
                </div>
                <h3 className="text-lg font-semibold text-white text-center mb-2">
                  {segmento.nome}
                </h3>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredSegmentos.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-30">🟠</div>
            <p className="text-[#6a6a6f]">Nenhum segmento encontrado</p>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <SegmentoModal
          segmento={selectedSegmento}
          onClose={() => {
            setShowModal(false);
            setSelectedSegmento(null);
          }}
          onSave={(data) => saveSegmento.mutate(data)}
          isSaving={saveSegmento.isPending}
        />
      )}
    </div>
  );
}