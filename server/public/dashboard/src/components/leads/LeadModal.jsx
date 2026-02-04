import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function LeadModal({ lead, onClose, onRefresh }) {
  // Mantendo seus estados originais
  const [status, setStatus] = useState(lead.status || 'Novo');
  const [observacao, setObservacao] = useState(lead.observacao || '');
  const [isSaving, setIsSaving] = useState(false);

  // --- NOVOS ESTADOS PARA MOTIVOS ---
  const [motivos, setMotivos] = useState([]);
  const [idMotivo, setIdMotivo] = useState(lead.id_motivo_desistencia || '');

  // Mantendo suas opções originais
  const statusOptions = [
    'Novo', 'Em Contato', 'Agendado', 'Negociação', 'Convertido', 'Perdido'
  ];

  // Carrega os motivos da nova tabela sem interferir no restante
  useEffect(() => {
    async function loadMotivos() {
      const { data } = await supabase
        .from('motivos_desistencia')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });
      if (data) setMotivos(data);
    }
    loadMotivos();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Definimos o motivo: se for Perdido, usamos o idMotivo. 
      // Se NÃO for Perdido, forçamos o valor null para apagar o registro anterior.
      const motivoFinal = status === 'Perdido' ? idMotivo : null;

      const { error } = await supabase
        .from('leads')
        .update({ 
          status: status,
          observacao: observacao,
          id_motivo_desistencia: motivoFinal // Aqui garante a limpeza
        })
        .eq('id', lead.id);

      if (error) throw error;
      
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar alterações:', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/90">
      <div className="bg-[#0d0d12] border border-white/5 w-full max-w-2xl rounded-[3.5rem] p-14 shadow-2xl relative text-left">
        <button onClick={onClose} className="absolute top-10 right-10 text-gray-700 hover:text-white text-2xl transition-colors">✕</button>
        
        <h2 className="text-4xl font-black text-[#ee7b4d] italic mb-10 leading-tight uppercase tracking-tighter">
          {lead.nome} <br/> 
          <span className="text-[10px] text-gray-600 uppercase not-italic tracking-[0.3em] font-black">Informação do Lead</span>
        </h2>

        {/* INFO GRID - MANTIDO INTEGRALMENTE */}
        <div className="bg-[#12121a] border border-white/5 rounded-[2.5rem] p-10 grid grid-cols-4 gap-y-10 gap-x-4 mb-10">
          <InfoItem label="Telefone" value={lead.telefone} icon="📱" />
          <InfoItem label="E-mail" value={lead.email} icon="📧" />
          <InfoItem label="Localização" value={lead.cidade ? `${lead.cidade}/${lead.estado}` : '---'} icon="📍" />
          <InfoItem label="Investimento" value={`R$ ${parseFloat(lead.capital_disponivel || 0).toLocaleString()}`} icon="💰" />
          <InfoItem label="Fonte Original" value={lead.fonte} icon="🌐" />
          <InfoItem label="Marca / Unidade" value={lead.marcas?.nome} icon="🏢" />
          <InfoItem label="Segmento" value={lead.marcas?.segmentos?.nome} icon="⚫" />
          <InfoItem label="Score IA" value={`${lead.score} pts`} icon="🤖" color="text-[#ee7b4d]" />
        </div>

        {/* ÁREA DE PERSISTÊNCIA (Ajustada para incluir Motivo Condicional) */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="space-y-6"> {/* Aumentei o espaçamento aqui para caber os dois selects se necessário */}
            <div className="space-y-3 text-left">
              <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest ml-1">Status Comercial</label>
              <div className="relative">
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#12121a] border border-white/5 p-5 rounded-2xl text-white text-sm outline-none appearance-none cursor-pointer focus:border-[#ee7b4d]/50 transition-all shadow-xl"
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt} className="bg-[#0d0d12]">{opt}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 text-xs">▼</div>
              </div>
            </div>

            {/* NOVO CAMPO: SÓ APARECE SE STATUS FOR PERDIDO */}
            {status === 'Perdido' && (
              <div className="space-y-3 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[9px] text-[#ee7b4d] uppercase font-black tracking-widest ml-1 italic">Motivo da Perda</label>
                <div className="relative">
                  <select 
                    value={idMotivo}
                    onChange={(e) => setIdMotivo(e.target.value)}
                    className="w-full bg-[#1a1212] border border-[#ee7b4d]/20 p-5 rounded-2xl text-white text-sm outline-none appearance-none cursor-pointer focus:border-[#ee7b4d] transition-all shadow-xl"
                  >
                    <option value="" className="text-gray-500">Selecione o motivo...</option>
                    {motivos.map(m => (
                      <option key={m.id} value={m.id} className="bg-[#0d0d12]">{m.nome}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#ee7b4d] text-xs">▼</div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 text-left">
            <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest ml-1">Observações</label>
            <textarea 
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Notas sobre o atendimento..."
              className="w-full bg-[#12121a] border border-white/5 p-5 rounded-2xl text-white text-sm outline-none h-full min-h-[120px] resize-none focus:border-[#ee7b4d]/50 transition-all shadow-xl scrollbar-hide"
            />
          </div>
        </div>

        <div className="space-y-4">
          <button 
            className="w-full py-5 bg-[#00d95f] text-[#0a0a0b] font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-all"
            onClick={() => window.open(`https://wa.me/${lead.telefone?.replace(/\D/g,'')}`, '_blank')}
          >
            <span className="text-lg">📱</span> Iniciar Conversa WhatsApp
          </button>

          <div className="grid grid-cols-2 gap-4">
             <button onClick={onClose} className="py-5 bg-white/5 text-gray-600 font-black rounded-2xl uppercase text-[11px] tracking-widest border border-white/5 hover:bg-white/10 transition-all">
                Cancelar
             </button>
             <button 
                onClick={handleSave}
                disabled={isSaving || (status === 'Perdido' && !idMotivo)}
                className="py-5 bg-[#ee7b4d] text-[#0a0a0b] font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-lg shadow-[#ee7b4d]/20 hover:scale-[1.01] transition-all disabled:opacity-50"
             >
                {isSaving ? 'A guardar...' : 'Salvar Alterações'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon, color = "text-white" }) {
  return (
    <div className="overflow-hidden">
      <p className="text-[8px] text-gray-600 uppercase font-black mb-2 flex items-center gap-1.5 opacity-60">
        <span>{icon}</span> {label}
      </p>
      <p className={`text-[12px] font-bold truncate ${color}`}>
        {value || '---'}
      </p>
    </div>
  );
}