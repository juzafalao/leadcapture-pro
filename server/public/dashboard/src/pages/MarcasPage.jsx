import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import PageHeader from '../components/shared/PageHeader';
import MarcaModal from '../components/marcas/MarcaModal';

export default function MarcasPage() {
  const { usuario } = useAuth();
  const [marcas, setMarcas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMarcas = async () => {
    if (!usuario?.tenant_id) return;
    // Seleção explícita para evitar erros de retorno
    const { data, error } = await supabase
      .from('marcas')
      .select('*, segmentos:id_segmento(nome)')
      .eq('tenant_id', usuario.tenant_id)
      .order('nome');
    
    if (error) {
      console.error("Erro ao carregar marcas:", error.message);
    } else {
      setMarcas(data || []);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, [usuario]);

  const money = (val) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="p-10 pt-32 bg-[#0a0a0b] min-h-screen text-left">
      <PageHeader 
        title="Gestão de" 
        highlight="Marcas" 
        description="PORTFÓLIO DE ATIVOS E UNIDADES OPERACIONAIS" 
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {/* BOTÃO ADICIONAR (+) */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center group hover:bg-[#ee7b4d]/10 hover:border-[#ee7b4d]/50 transition-all min-h-[280px]"
        >
          <span className="text-6xl text-[#ee7b4d] font-light group-hover:scale-110 transition-transform">+</span>
          <p className="text-[10px] text-gray-600 font-black uppercase mt-4 tracking-[0.3em]">Nova Marca</p>
        </button>

        {/* CARDS DAS MARCAS */}
        {marcas.map((marca) => (
          <div 
            key={marca.id} 
            className="bg-[#12121a] border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xl hover:bg-[#ee7b4d]/10 hover:border-[#ee7b4d]/30 group min-h-[280px] text-center"
          >
            {/* Emoji vindo da base */}
            <span className="text-5xl mb-6 group-hover:scale-110 transition-transform">
              {marca.emoji || '🏢'}
            </span>
            
            <div className="w-full">
              <p className="text-sm font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#ee7b4d] transition-colors">
                {marca.nome}
              </p>
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter mb-6">
                {marca.segmentos?.nome || 'Geral'}
              </p>
              
              {/* Range de investimento vindo da base */}
              <div className="grid grid-cols-1 gap-2 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[7px] text-gray-500 uppercase font-black tracking-widest">Investimento Mín.</p>
                  <p className="text-[11px] text-white font-bold">{money(marca.invest_min)}</p>
                </div>
                <div>
                  <p className="text-[7px] text-gray-500 uppercase font-black tracking-widest">Investimento Máx.</p>
                  <p className="text-[11px] text-[#ee7b4d] font-bold">{money(marca.invest_max)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && <MarcaModal onClose={() => setIsModalOpen(false)} onRefresh={fetchMarcas} />}
    </div>
  );
}