// ============================================================
// LandingFieldEditor.jsx — Editor de campos da Landing Page
// LeadCapture Pro — Zafalão Tech
// ============================================================

import React from 'react';

const fieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'E-mail' },
  { value: 'tel', label: 'Telefone' },
  { value: 'select', label: 'Lista suspensa' },
  { value: 'textarea', label: 'Área de texto' },
  { value: 'checkbox', label: 'Checkbox' },
];

function FieldRow({ field, index, onUpdate, onRemove, onMove, total }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#1E293B]/60 border border-white/5 rounded-xl">
      <div className="flex flex-col gap-1 pt-0.5">
        <button
          onClick={() => onMove(index, -1)}
          disabled={index === 0}
          className="text-[#475569] hover:text-white disabled:opacity-30 text-xs"
          title="Mover para cima"
        >▲</button>
        <button
          onClick={() => onMove(index, 1)}
          disabled={index === total - 1}
          className="text-[#475569] hover:text-white disabled:opacity-30 text-xs"
          title="Mover para baixo"
        >▼</button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-[#64748B] mb-1">Rótulo</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(index, 'label', e.target.value)}
            placeholder="Ex: Nome completo"
            className="w-full px-3 py-2 bg-[#0F172A] border border-white/10 rounded-lg text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#10B981]/50"
          />
        </div>
        <div>
          <label className="block text-xs text-[#64748B] mb-1">Tipo</label>
          <select
            value={field.type}
            onChange={(e) => onUpdate(index, 'type', e.target.value)}
            className="w-full px-3 py-2 bg-[#0F172A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]/50"
          >
            {fieldTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#64748B] mb-1">Placeholder</label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate(index, 'placeholder', e.target.value)}
            placeholder="Texto de ajuda"
            className="w-full px-3 py-2 bg-[#0F172A] border border-white/10 rounded-lg text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#10B981]/50"
          />
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-[#94A3B8] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => onUpdate(index, 'required', e.target.checked)}
              className="accent-[#10B981]"
            />
            Obrigatório
          </label>
        </div>
      </div>

      <button
        onClick={() => onRemove(index)}
        className="text-red-400/60 hover:text-red-400 transition-colors text-lg leading-none"
        title="Remover campo"
      >✕</button>
    </div>
  );
}

export default function LandingFieldEditor({ fields, onChange }) {
  const addField = () => {
    onChange([
      ...fields,
      { label: '', type: 'text', placeholder: '', required: false },
    ]);
  };

  const updateField = (index, key, value) => {
    const updated = fields.map((f, i) => i === index ? { ...f, [key]: value } : f);
    onChange(updated);
  };

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const moveField = (index, dir) => {
    const arr = [...fields];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    onChange(arr);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Campos do Formulário</h4>
        <button
          onClick={addField}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] rounded-lg text-xs font-medium transition-colors"
        >
          + Adicionar campo
        </button>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-sm text-[#475569]">
          Nenhum campo adicionado. Clique em &quot;+ Adicionar campo&quot; para começar.
        </div>
      )}

      <div className="space-y-2">
        {fields.map((field, i) => (
          <FieldRow
            key={i}
            field={field}
            index={i}
            total={fields.length}
            onUpdate={updateField}
            onRemove={removeField}
            onMove={moveField}
          />
        ))}
      </div>
    </div>
  );
}
