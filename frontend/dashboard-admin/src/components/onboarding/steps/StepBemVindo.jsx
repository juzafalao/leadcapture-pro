// ============================================================
// StepBemVindo.jsx — Passo 1: Boas-vindas
// ============================================================

import React from 'react';

export default function StepBemVindo({ onNext }) {
  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">👋</div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao LeadCapture Pro!</h2>
        <p className="text-[#94A3B8] text-sm max-w-sm mx-auto">
          Vamos configurar sua conta em poucos passos para que você possa capturar e converter leads com eficiência.
        </p>
      </div>
      <button
        onClick={onNext}
        className="px-8 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-2xl font-semibold transition-colors"
      >
        Começar →
      </button>
    </div>
  );
}
