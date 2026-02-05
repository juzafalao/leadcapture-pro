import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MarcaModal from '../components/marcas/MarcaModal';

export default function MarcasPage() {
  const { usuario, isGestor } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarca, setSelectedMarca] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ✅ BUSCAR MARCAS (usando nomes reais do banco)
  const { data: marcas = [], isLoading } = useQuery({
    queryKey: ['marcas', usuario?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcas')
        .select(`
          id,
          tenant_id,
          nome,
          emoji,
          ativo,
          id_segmento,
          invest_min,
          invest_max,
          created_at,
          segmento:segmentos!id_segmento(id, nome, emoji)
        `)
        .eq('tenant_id', usuario.tenant_id)
        .eq('ativo', true)
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar marcas:', error);
        throw error;
      }
      
      // ✅ Mapear para formato que o frontend espera
      return (data || []).map(m => ({
        id: m.id,
        nome: m.nome,
        emoji: m.emoji || '🏢',
        cor: '#60a5fa', // Cor padrão (não existe no banco)
        segmento_id: m.id_segmento,
        segmento: m.segmento,
        investimento_minimo: parseFloat(m.invest_min) || 0,
        investimento_maximo: parseFloat(m.invest_max) || 0,
        descricao: '', // Não existe no banco
        ativo: m.ativo
      }));
    },
    enabled: !!usuario?.tenant_id
  });

  // Buscar segmentos
  const { data: segmentos = [] } = useQuery({
    queryKey: ['segmentos', usuario?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('segmentos')
        .select('id, nome, emoji, tenant_id, created_at')
        .eq('tenant_id', usuario.tenant_id)
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar segmentos:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!usuario?.tenant_id
  });

  // ✅ SALVAR MARCA (convertendo nomes para o banco)
  const saveMarca = useMutation({
    mutationFn: async (marcaData) => {
      // ✅ Converter para nomes do banco
      const dbData = {
        nome: marcaData.nome,
        emoji: marcaData.emoji,
        id_segmento: marcaData.segmento_id || null, // ✅ nome do banco
        invest_min: marcaData.investimento_minimo.toString(), // ✅ nome do banco
        invest_max: marcaData.investimento_maximo.toString(), // ✅ nome do banco
        ativo: true
      };

      if (marcaData.id) {
        // Atualizar
        const { data, error } = await supabase
          .from('marcas')
          .update(dbData)
          .eq('id', marcaData.id)
          .select()
          .single();
        
        if (error) {
          console.error('Erro ao atualizar marca:', error);
          throw error;
        }
        return data;
      } else {
        // Criar
        const { data, error } = await supabase
          .from('marcas')
          .insert({ ...dbData, tenant_id: usuario.tenant_id })
          .select()
          .single();
        
        if (error) {
          console.error('Erro ao criar marca:', error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['marcas']);
      setShowModal(false);
      setSelectedMarca(null);
    },
    onError: (error) => {
      alert('Erro ao salvar marca: ' + error.message);
    }
  });

  const filteredMarcas = marcas.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewMarca = () => {
    setSelectedMarca(null);
    setShowModal(true);
  };

  const handleEditMarca = (marca) => {
    setSelectedMarca(marca);
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
            Gestão de <span className="text-[#ee7b4d] font-bold">Marcas</span>
          </h1>
          <div className="w-24 h-0.5 bg-[#ee7b4d] rounded-full mb-4"></div>
          <p className="text-[9px] lg:text-[10px] text-[#6a6a6f] uppercase tracking-[0.25em] font-bold">
            Portfólio de Ativos e Unidades Operacionais
          </p>
        </div>

        <div className="px-6 lg:px-10">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar marca..."
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
            <span className="text-[#ee7b4d] font-bold">{filteredMarcas.length}</span> marcas cadastradas
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 animate-pulse">⏳</div>
            <p className="text-[#6a6a6f]">Carregando marcas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* CARD + NOVA MARCA */}
            <button
              onClick={handleNewMarca}
              className="bg-[#12121a] border-2 border-dashed border-[#2a2a2f] rounded-2xl p-8 hover:border-[#ee7b4d]/50 hover:bg-[#1f1f23]/30 transition-all group min-h-[200px] flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#ee7b4d]/10 flex items-center justify-center text-4xl text-[#ee7b4d] mb-4 group-hover:scale-110 transition-transform">
                +
              </div>
              <p className="text-lg font-semibold text-white">Nova Marca</p>
              <p className="text-xs text-[#6a6a6f] mt-1">Adicionar ao portfólio</p>
            </button>

            {/* MARCAS EXISTENTES */}
            {filteredMarcas.map((marca) => (
              <div
                key={marca.id}
                onClick={() => handleEditMarca(marca)}
                className="bg-[#12121a] border border-[#1f1f23] rounded-2xl p-6 hover:border-[#ee7b4d]/30 transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ backgroundColor: `${marca.cor}20` }}
                  >
                    {marca.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 truncate">{marca.nome}</h3>
                    {marca.segmento && (
                      <p className="text-xs text-[#6a6a6f] mb-2">
                        {marca.segmento.emoji} {marca.segmento.nome}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6a6a6f]">Invest. Mínimo</span>
                    <span className="text-[#ee7b4d] font-bold">
                      R$ {marca.investimento_minimo?.toLocaleString('pt-BR') || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6a6a6f]">Invest. Máximo</span>
                    <span className="text-[#ee7b4d] font-bold">
                      R$ {marca.investimento_maximo?.toLocaleString('pt-BR') || '0'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredMarcas.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-30">🏢</div>
            <p className="text-[#6a6a6f]">Nenhuma marca encontrada</p>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <MarcaModal
          marca={selectedMarca}
          segmentos={segmentos}
          onClose={() => {
            setShowModal(false);
            setSelectedMarca(null);
          }}
          onSave={(data) => saveMarca.mutate(data)}
          isSaving={saveMarca.isPending}
        />
      )}
    </div>
  );
}