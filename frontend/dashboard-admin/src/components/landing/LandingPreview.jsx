// ============================================================
// LandingPreview.jsx — Preview em tempo real da Landing Page
// LeadCapture Pro — Zafalão Tech
// ============================================================

import React from 'react';

export default function LandingPreview({ config }) {
  const {
    titulo = 'Título da Landing Page',
    subtitulo = 'Subtítulo ou descrição breve',
    cta = 'Quero saber mais',
    corPrimaria = '#10B981',
    bgColor = '#0F172A',
    logoUrl = '',
    fields = [],
  } = config || {};

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-white/10 text-white"
      style={{ background: bgColor, minHeight: 400 }}
    >
      {/* Header */}
      <div className="p-8 text-center border-b border-white/10">
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-12 mx-auto mb-4 object-contain" />
        )}
        <h1 className="text-2xl font-bold mb-2" style={{ color: corPrimaria }}>
          {titulo}
        </h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">{subtitulo}</p>
      </div>

      {/* Form */}
      <div className="p-8">
        {fields.length === 0 ? (
          <div className="text-center py-6 text-sm text-white/30 italic">
            Adicione campos ao formulário para visualizá-los aqui
          </div>
        ) : (
          <div className="space-y-4 max-w-sm mx-auto">
            {fields.map((field, i) => (
              <div key={i}>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  {field.label || 'Campo'}{field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    disabled
                    placeholder={field.placeholder || ''}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/40 placeholder-white/20 resize-none cursor-not-allowed"
                  />
                ) : field.type === 'select' ? (
                  <select
                    disabled
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/40 cursor-not-allowed"
                  >
                    <option>{field.placeholder || 'Selecione...'}</option>
                  </select>
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-sm text-white/40 cursor-not-allowed">
                    <input type="checkbox" disabled className="accent-[#10B981]" />
                    {field.placeholder || field.label}
                  </label>
                ) : (
                  <input
                    type={field.type || 'text'}
                    disabled
                    placeholder={field.placeholder || ''}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/40 placeholder-white/20 cursor-not-allowed"
                  />
                )}
              </div>
            ))}

            <button
              disabled
              className="w-full py-3 rounded-xl text-sm font-bold cursor-not-allowed opacity-90 transition-opacity"
              style={{ background: corPrimaria, color: '#0F172A' }}
            >
              {cta}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
