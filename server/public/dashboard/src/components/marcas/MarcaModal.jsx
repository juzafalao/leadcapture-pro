import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

export default function MarcaModal({ onClose, onRefresh }) {
  const { usuario } = useAuth();
  const [segmentos, setSegmentos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [nome, setNome] = useState('');
  const [emoji, setEmoji] = useState('🏢');
  const [idSegmento, setIdSegmento] = useState('');
  const [invMin, setInvMin] = useState('');
  const [invMax, setInvMax] = useState('');

  useEffect(() => {
    async function loadSegmentos() {
      if (!usuario?.tenant_id) return;
      const { data } = await supabase.from('segmentos').select('*').eq('tenant_id', usuario.tenant_id);
      setSegmentos(data || []);
    }
    loadSegmentos();
  }, [usuario]);

  const handleSave = async () => {
    if (!nome || !idSegmento) return alert("Preencha nome e segmento!");
    
    setLoading(true);
    try {
      const payload = {
        nome: nome,
        emoji: emoji,
        id_segmento: idSegmento,
        invest_min: parseFloat(invMin) || 0,
        invest_max: parseFloat(invMax) || 0,
        tenant_id: usuario.tenant_id
      };

      const { error } = await supabase.from('marcas').insert([payload]);

      if (error) {
        // Alerta detalhado para identificar se o erro 400 é o nome da coluna
        alert(`Erro do Banco: ${error.message}. Verifique se as colunas investimento_min/max existem.`);
        console.error("Erro detalhado:", error);
        return;
      }

      onRefresh();
      onClose();
    } catch (err) {
      alert("Falha de conexão: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/90">
      <div className="bg-[#0d0d12] border border-white/5 w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl text-left text-white">
        <h2 className="text-3xl font-black text-[#ee7b4d] italic mb-10 uppercase tracking-tighter">
          Nova <br/> <span className="text-[10px] text-gray-600 uppercase not-italic tracking-[0.4em] font-black">Unidade Franqueadora</span>
        </h2>

        <div className="space-y-6 mb-10">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block tracking-widest">Nome da Marca</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-[#12121a] border border-white/5 p-5 rounded-2xl text-white outline-none focus:border-[#ee7b4d]/50" placeholder="Ex: Bio Lavanderia" />
            </div>
            <div>
              <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block tracking-widest text-center">Icon</label>
              <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} className="w-full bg-[#12121a] border border-white/5 p-5 rounded-2xl text-center outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block tracking-widest">Segmento Operacional</label>
            <select value={idSegmento} onChange={e => setIdSegmento(e.target.value)} className="w-full bg-[#12121a] border border-white/5 p-5 rounded-2xl text-white outline-none appearance-none cursor-pointer">
              <option value="">Selecione o Nicho</option>
              {segmentos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block tracking-widest">Inv. Mínimo (R$)</label>
              <input type="number" value={invMin} onChange={e => setInvMin(e.target.value)} className="w-full bg-[#12121a] border border-white/5 p-5 rounded-2xl text-white outline-none" placeholder="0" />
            </div>
            <div>
              <label className="text-[9px] text-gray-600 uppercase font-black mb-2 block tracking-widest">Inv. Máximo (R$)</label>
              <input type="number" value={invMax} onChange={e => setInvMax(e.target.value)} className="w-full bg-[#12121a] border border-white/5 p-5 rounded-2xl text-white outline-none" placeholder="0" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onClose} className="py-5 bg-white/5 text-gray-600 font-black rounded-2xl uppercase text-[11px] tracking-widest border border-white/5">Cancelar</button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="py-5 bg-[#ee7b4d] text-[#0a0a0b] font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-lg shadow-[#ee7b4d]/20 disabled:opacity-50"
          >
            {loading ? 'Gravando...' : 'Salvar Marca'}
          </button>
        </div>
      </div>
    </div>
  );
}