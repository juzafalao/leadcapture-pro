import React, { useState, useEffect } from 'react';

const EMOJI_OPTIONS = [
  '🧺', '🍔', '☕', '📚', '🏥', '🏋️', '💼', '🏪', '🎓', '🚗', 
  '💇', '🏠', '🍕', '🏢', '🎨', '🎭', '🎮', '🎪', '🎬', '🎤',
  '⚽', '🎯', '🎲', '🎰', '🛍️', '💅', '🧘', '🍰', '🍺', '🏨',
  '🐾', '💊', '🔧', '✈️', '🏖️', '🎹', '📷', '🌿', '🧪', '⚡'
];

export default function SegmentoModal({ segmento, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    nome: '',
    emoji: '🏢',
    descricao: ''
  });

  useEffect(() => {
    if (segmento) {
      setFormData({
        nome: segmento.nome || '',
        emoji: segmento.emoji || '🏢',
        descricao: segmento.descricao || ''
      });
    }
  }, [segmento]);

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    try {
      // ✅ Chamar onSave (que já vem do SegmentosPage)
      await onSave({
        ...(segmento?.id && { id: segmento.id }),
        nome: formData.nome.trim(),
        emoji: formData.emoji,
        descricao: formData.descricao.trim()
      });
      
      // ✅ Fechar modal só se der certo (onSuccess do mutation já fecha)
    } catch (error) {
      console.error('Erro ao salvar segmento:', error);
      alert('Erro ao salvar: ' + error.message);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center p-0 lg:p-4">
        <div 
          className="bg-[#12121a] border-t lg:border border-[#1f1f23] rounded-t-3xl lg:rounded-2xl w-full lg:max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-[#1f1f23]">
            <div className="w-12 h-1 bg-[#2a2a2f] rounded-full mx-auto mb-4 lg:hidden"></div>
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {segmento ? 'Editar Segmento' : 'Novo Segmento'}
              </h2>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-xl bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* Nome */}
            <div>
              <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">
                Nome do Segmento *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Lavanderias"
                disabled={isSaving}
                className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-white placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50 disabled:opacity-50"
              />
            </div>

            {/* Emoji Picker */}
            <div>
              <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">
                Escolha um Emoji
              </label>
              <div className="bg-[#1f1f23] border border-[#2a2a2f] rounded-xl p-4 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-8 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji })}
                      disabled={isSaving}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                        formData.emoji === emoji 
                          ? 'bg-[#ee7b4d]/20 border-2 border-[#ee7b4d] scale-110' 
                          : 'bg-[#0a0a0b] border border-[#2a2a2f] hover:bg-[#2a2a2f]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Preview */}
              <div className="mt-3 flex items-center gap-3 p-3 bg-[#1f1f23] border border-[#2a2a2f] rounded-xl">
                <span className="text-4xl">{formData.emoji}</span>
                <div>
                  <p className="text-xs text-[#6a6a6f]">Emoji selecionado</p>
                  <p className="text-sm text-white font-medium">{formData.nome || 'Sem nome'}</p>
                </div>
              </div>
            </div>

            {/* Descrição (Opcional) */}
            <div>
              <label className="block text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">
                Descrição (Opcional)
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o segmento de mercado..."
                rows={3}
                disabled={isSaving}
                className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-white placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50 resize-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-[#1f1f23] flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl border border-[#2a2a2f] text-[#6a6a6f] font-semibold hover:bg-[#1f1f23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-[#ee7b4d] text-black font-semibold hover:bg-[#d4663a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}