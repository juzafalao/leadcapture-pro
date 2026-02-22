import React, { useState, useEffect } from 'react';

const EMOJI_OPTIONS = ['🏢', '🧺', '☕', '🍔', '📚', '🏥', '🏋️', '💼', '🏪', '🎓', '🚗', '💇', '🏠', '🍕'];
const COLOR_OPTIONS = ['#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#ef4444', '#06b6d4', '#84cc16'];

export default function MarcaModal({ marca, segmentos, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    nome: '',
    emoji: '🏢',
    cor: '#60a5fa',
    segmento_id: '',
    investimento_minimo: '',
    investimento_maximo: '',
    descricao: ''
  });

  useEffect(() => {
    if (marca) {
      setFormData({
        nome: marca.nome || '',
        emoji: marca.emoji || '🏢',
        cor: marca.cor || '#60a5fa',
        segmento_id: marca.segmento_id || '',
        investimento_minimo: marca.investimento_minimo?.toString() || '',
        investimento_maximo: marca.investimento_maximo?.toString() || '',
        descricao: marca.descricao || ''
      });
    }
  }, [marca]);

  const handleSubmit = () => {
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    onSave({
      ...(marca?.id && { id: marca.id }),
      nome: formData.nome.trim(),
      emoji: formData.emoji,
      cor: formData.cor,
      segmento_id: formData.segmento_id || null,
      investimento_minimo: parseFloat(formData.investimento_minimo) || 0,
      investimento_maximo: parseFloat(formData.investimento_maximo) || 0,
      descricao: formData.descricao.trim()
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center p-0 lg:p-4">
        <div 
          className="bg-[#0F172A] border-t lg:border border-[#1F2937] rounded-t-3xl lg:rounded-2xl w-full lg:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-[#1F2937]">
            <div className="w-12 h-1 bg-[#1E293B] rounded-full mx-auto mb-4 lg:hidden"></div>
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {marca ? 'Editar Marca' : 'Nova Marca'}
              </h2>
              <button onClick={onClose} className="w-10 h-10 rounded-xl bg-[#1F2937] border border-[#1E293B] flex items-center justify-center text-[#6a6a6f] hover:text-white">
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* Nome */}
            <div>
              <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Premium Wash"
                className="w-full bg-[#1F2937] border border-[#1E293B] rounded-xl px-4 py-3 text-white placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#10B981]/50"
              />
            </div>

            {/* Segmento */}
            <div>
              <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">Segmento</label>
              <select
                value={formData.segmento_id}
                onChange={(e) => setFormData({ ...formData, segmento_id: e.target.value })}
                className="w-full bg-[#1F2937] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981]/50"
              >
                <option value="">Selecione um segmento</option>
                {segmentos.map((seg) => (
                  <option key={seg.id} value={seg.id}>
                    {seg.emoji} {seg.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Emoji e Cor */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        formData.emoji === emoji ? 'bg-[#10B981]/20 border-2 border-[#10B981] scale-110' : 'bg-[#1F2937] border border-[#1E293B]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor })}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        formData.cor === cor ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Investimentos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">Invest. Mínimo</label>
                <input
                  type="number"
                  value={formData.investimento_minimo}
                  onChange={(e) => setFormData({ ...formData, investimento_minimo: e.target.value })}
                  placeholder="100000"
                  className="w-full bg-[#1F2937] border border-[#1E293B] rounded-xl px-4 py-3 text-white placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#10B981]/50"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">Invest. Máximo</label>
                <input
                  type="number"
                  value={formData.investimento_maximo}
                  onChange={(e) => setFormData({ ...formData, investimento_maximo: e.target.value })}
                  placeholder="200000"
                  className="w-full bg-[#1F2937] border border-[#1E293B] rounded-xl px-4 py-3 text-white placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#10B981]/50"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva a marca..."
                rows={3}
                className="w-full bg-[#1F2937] border border-[#1E293B] rounded-xl px-4 py-3 text-white placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#10B981]/50 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-[#1F2937] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#1E293B] text-[#6a6a6f] font-semibold hover:bg-[#1F2937]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-[#10B981] text-black font-semibold hover:bg-[#059669] disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}