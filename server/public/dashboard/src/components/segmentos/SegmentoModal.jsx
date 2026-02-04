import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

export default function SegmentoModal({ onClose, onRefresh }) {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [emoji, setEmoji] = useState('🟣');

  const handleSave = async () => {
    if (!nome) return alert("Por favor, dê um nome ao segmento.");
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('segmentos')
        .insert([{
          nome: nome,
          emoji: emoji,
          tenant_id: usuario.tenant_id
        }]);

      if (error) throw error;
      
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Erro na persistência:", err);
      alert("Erro ao gravar segmento. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/90">
      <div className="bg-[#0d0d12] border border-white/5 w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl text-left text-white">
        <h2 className="text-3xl font-black text-[#ee7b4d] italic mb-10 uppercase tracking-tighter leading-none">
          Novo <br/> <span className="text-[10px] text-gray-600 uppercase not-italic tracking-[0.4em] font-black">Segmento de Mercado</span>
        </h2>

        <div className="space-y-6 mb-10">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block tracking-widest ml-1">Nome do Segmento</label>
              <input 
                type="text" 
                value={nome} 
                onChange={e => setNome(e.target.value)} 
                className="w-full bg-[#12121a] border border-white/5 p-5 rounded-2xl text-white text-sm outline-none focus:border-[#ee7b4d]/50 transition-all" 
                placeholder="Ex: Alimentação"
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block tracking-widest text-center">Icon</label>
              <input 
                type="text" 
                value={emoji} 
                onChange={e => setEmoji(e.target.value)} 
                className="w-full bg-[#12121a] border border-white/5 p-5 rounded-2xl text-center text-lg outline-none focus:border-[#ee7b4d]/50 transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onClose} 
            className="py-5 bg-white/5 text-gray-600 font-black rounded-2xl uppercase text-[11px] tracking-widest border border-white/5 hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="py-5 bg-[#ee7b4d] text-[#0a0a0b] font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-lg shadow-[#ee7b4d]/20 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {loading ? 'Sincronizando...' : 'Gravar Segmento'}
          </button>
        </div>
      </div>
    </div>
  );
}