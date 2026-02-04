import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import PageHeader from '../components/shared/PageHeader';
import SegmentoModal from '../components/segmentos/SegmentoModal'; // Vamos criar abaixo

export default function SegmentosPage() {
  const { usuario } = useAuth();
  const [segmentos, setSegmentos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSegmentos = async () => {
    if (!usuario?.tenant_id) return;
    const { data, error } = await supabase
      .from('segmentos')
      .select('*')
      .eq('tenant_id', usuario.tenant_id)
      .order('nome');
    
    if (error) console.error("Erro ao carregar segmentos:", error.message);
    else setSegmentos(data || []);
  };

  useEffect(() => { fetchSegmentos(); }, [usuario]);

  return (
    <div className="p-10 pt-32 bg-[#0a0a0b] min-h-screen text-left">
      {/* Padronização conforme imagem */}
      <PageHeader 
        title="Gestão de" 
        highlight="Segmentos" 
        description="NICHOS E ÁREAS DE ATUAÇÃO ESTRATÉGICA" 
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {/* BOTÃO ADICIONAR (+) COM HOVER LARANJA TRANSPARENTE */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center group hover:bg-[#ee7b4d]/10 hover:border-[#ee7b4d]/50 transition-all min-h-[250px]"
        >
          <span className="text-6xl text-[#ee7b4d] font-light group-hover:scale-110 transition-transform">+</span>
          <p className="text-[10px] text-gray-600 font-black uppercase mt-4 tracking-[0.3em]">Novo Segmento</p>
        </button>

        {/* CARDS DOS SEGMENTOS */}
        {segmentos.map((seg) => (
          <div 
            key={seg.id} 
            className="bg-[#12121a] border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xl hover:bg-[#ee7b4d]/10 hover:border-[#ee7b4d]/30 group min-h-[250px] text-center"
          >
            {/* Emoji vindo da base */}
            <span className="text-5xl mb-6 group-hover:scale-110 transition-transform">
              {seg.emoji || '🟣'}
            </span>
            
            <div className="w-full">
              <p className="text-sm font-black text-white uppercase tracking-widest group-hover:text-[#ee7b4d] transition-colors">
                {seg.nome}
              </p>
              <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.2em] mt-2 opacity-60">
                Nicho Ativo
              </p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <SegmentoModal 
          onClose={() => setIsModalOpen(false)} 
          onRefresh={fetchSegmentos} 
        />
      )}
    </div>
  );
}