// ============================================================
// StepIntegracao.jsx — Passo 3: Integração WhatsApp
// ============================================================

import React, { useState } from 'react';

export default function StepIntegracao({ data, onNext, onBack }) {
  const [whatsapp, setWhatsapp] = useState(data?.whatsapp || '');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-3">💬</div>
        <h2 className="text-xl font-bold text-white mb-1">Integração WhatsApp</h2>
        <p className="text-sm text-[#94A3B8]">Receba notificações de novos leads no WhatsApp (opcional)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Número do WhatsApp</label>
        <input
          type="tel"
          value={whatsapp}
          onChange={e => setWhatsapp(e.target.value)}
          placeholder="(11) 99999-9999"
          className="w-full px-4 py-3 bg-[#1E293B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#10B981]/50"
        />
        <p className="text-xs text-[#475569] mt-1.5">
          Você pode configurar a integração completa depois em Configurações → Integrações
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 border border-white/10 text-[#94A3B8] rounded-2xl text-sm hover:bg-white/5 transition-colors">
          ← Voltar
        </button>
        <button
          onClick={() => onNext({ whatsapp })}
          className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-2xl text-sm font-semibold transition-colors"
        >
          Próximo →
        </button>
      </div>
    </div>
  );
}
