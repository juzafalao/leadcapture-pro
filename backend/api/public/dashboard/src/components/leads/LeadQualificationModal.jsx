import React, { useState } from 'react'
import { supabase } from '../../services/supabase'

export function LeadQualificationModal({ lead, onClose, onUpdate, statusConfig, categoriaConfig }) {
  const [status, setStatus] = useState(lead.status)
  const [categoria, setCategoria] = useState(lead.categoria)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const { error } = await supabase
      .from('leads')
      .update({ status, categoria })
      .eq('id', lead.id)

    if (!error) {
      onUpdate() // Atualiza a lista de leads no dashboard
      onClose()
    } else {
      alert('Erro ao atualizar lead: ' + error.message)
    }
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h3 className="text-xl font-bold text-white">{lead.nome}</h3>
            <p className="text-sm text-slate-400">{lead.email || 'Sem e-mail'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Status do Lead</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setStatus(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                    status === key 
                    ? 'border-orange-500 bg-orange-500/10 text-white' 
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span>{config.icon}</span>
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Temperatura (Categoria)</label>
            <div className="flex gap-2">
              {Object.entries(categoriaConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setCategoria(key)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    categoria === key 
                    ? 'border-orange-500 bg-orange-500/10 text-white' 
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xl">{config.icon}</span>
                  <span className="text-xs font-bold">{config.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-800/30 border-t border-slate-800 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg shadow-orange-900/20 transition disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
