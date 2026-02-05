import React, { useState } from 'react';

export default function LeadModal({ lead, onClose, onSave }) {
  const [formData, setFormData] = useState({
    status: lead?.status || 'novo',
    observacao: lead?.observacao || '',
  });

  const handleSave = () => {
    onSave?.({ ...lead, ...formData });
    onClose?.();
  };

  if (!lead) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center p-0 lg:p-4">
        <div 
          className="bg-[#12121a] border-t lg:border border-[#1f1f23] rounded-t-3xl lg:rounded-2xl w-full lg:max-w-2xl max-h-[90vh] lg:max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header - Fixo */}
          <div className="flex-shrink-0 p-6 border-b border-[#1f1f23]">
            {/* Handle Mobile */}
            <div className="w-12 h-1 bg-[#2a2a2f] rounded-full mx-auto mb-4 lg:hidden"></div>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl lg:text-2xl font-semibold text-white mb-1">
                  {lead.nome || 'Lead'}
                </h2>
                <p className="text-xs text-[#6a6a6f]">{lead.email || 'Sem email'}</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Score Badge */}
            {lead.score && (
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#ee7b4d]/10 border border-[#ee7b4d]/20">
                <span className="text-3xl font-light text-[#ee7b4d]">{lead.score}</span>
                <div>
                  <p className="text-sm font-semibold text-[#ee7b4d]">
                    {lead.score >= 70 ? 'Lead Hot 🔥' : lead.score >= 40 ? 'Lead Warm 🌤' : 'Lead Cold ❄️'}
                  </p>
                  <p className="text-[10px] text-[#4a4a4f] uppercase">Score</p>
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl p-4">
                <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-1">Telefone</p>
                <p className="text-white font-medium">{lead.telefone || '—'}</p>
              </div>
              <div className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl p-4">
                <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-1">Fonte</p>
                <p className="text-white font-medium capitalize">{lead.fonte || '—'}</p>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">
                Status do Lead
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ee7b4d]/50"
              >
                <option value="novo">🆕 Novo</option>
                <option value="contato">📞 Em Contato</option>
                <option value="agendado">📅 Agendado</option>
                <option value="negociacao">💼 Negociação</option>
                <option value="convertido">✅ Convertido</option>
                <option value="perdido">❌ Perdido</option>
              </select>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">
                Observações
              </label>
              <textarea
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                placeholder="Adicione observações sobre este lead..."
                rows={4}
                className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-white placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50 resize-none"
              />
            </div>
          </div>

          {/* Footer - Fixo */}
          <div className="flex-shrink-0 p-6 border-t border-[#1f1f23] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#2a2a2f] text-[#6a6a6f] font-semibold hover:bg-[#1f1f23] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-[#ee7b4d] text-black font-semibold hover:bg-[#d4663a] transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}