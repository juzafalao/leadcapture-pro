// ============================================================
// StepConclusao.jsx — Passo 4: Conclusão
// ============================================================

import React from 'react';

export default function StepConclusao({ onFinish }) {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">🎉</div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Tudo pronto!</h2>
        <p className="text-[#94A3B8] text-sm max-w-sm mx-auto">
          Sua conta está configurada. Agora você pode começar a capturar e gerenciar leads.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        {[
          { emoji: '🎯', label: 'Capturar leads' },
          { emoji: '📊', label: 'Ver analytics' },
          { emoji: '🤖', label: 'Automatizar' },
        ].map(item => (
          <div key={item.label} className="p-3 bg-[#1E293B]/60 rounded-xl">
            <div className="text-2xl mb-1">{item.emoji}</div>
            <div className="text-xs text-[#94A3B8]">{item.label}</div>
          </div>
        ))}
      </div>
      <button
        onClick={onFinish}
        className="px-8 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-2xl font-semibold transition-colors"
      >
        🚀 Ir para o Dashboard
      </button>
    </div>
  );
}
