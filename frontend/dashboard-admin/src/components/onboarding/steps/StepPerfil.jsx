// ============================================================
// StepPerfil.jsx — Passo 2: Configurar Perfil
// ============================================================

import React, { useState } from 'react';

export default function StepPerfil({ data, onNext, onBack }) {
  const [empresa, setEmpresa] = useState(data?.empresa || '');
  const [segmento, setSegmento] = useState(data?.segmento || '');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-3">🏢</div>
        <h2 className="text-xl font-bold text-white mb-1">Seu Perfil</h2>
        <p className="text-sm text-[#94A3B8]">Nos conte um pouco sobre sua empresa</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Nome da Empresa</label>
          <input
            type="text"
            value={empresa}
            onChange={e => setEmpresa(e.target.value)}
            placeholder="Ex: Minha Empresa Ltda"
            className="w-full px-4 py-3 bg-[#1E293B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#10B981]/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Segmento</label>
          <select
            value={segmento}
            onChange={e => setSegmento(e.target.value)}
            className="w-full px-4 py-3 bg-[#1E293B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#10B981]/50"
          >
            <option value="">Selecione...</option>
            <option value="imobiliario">Imobiliário</option>
            <option value="educacao">Educação</option>
            <option value="saude">Saúde</option>
            <option value="varejo">Varejo</option>
            <option value="servicos">Serviços</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3 border border-white/10 text-[#94A3B8] rounded-2xl text-sm hover:bg-white/5 transition-colors">
          ← Voltar
        </button>
        <button
          onClick={() => onNext({ empresa, segmento })}
          disabled={!empresa.trim()}
          className="flex-1 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-2xl text-sm font-semibold transition-colors disabled:opacity-40"
        >
          Próximo →
        </button>
      </div>
    </div>
  );
}
