import { useEffect, useState } from 'react'

export default function LeadModal({ lead, onClose, onSave, statusOptions = [] }) {
  const [status, setStatus] = useState(lead?.status || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!lead) return
    setStatus(lead.status || '')
  }, [lead])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose && onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!lead) return null

  const handleSave = async () => {
    const newStatus = status || ''
    // Only call onSave with the updated lead object.
    setSaving(true)
    try {
      onSave && onSave({ ...lead, status: newStatus })
      onClose && onClose()
    } catch (err) {
      console.error('Erro no onSave do modal:', err)
      // keep simple: parent will handle errors/rollback
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay (slightly transparent) */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !saving && onClose && onClose()}
      />

      {/* Modal box (semi-transparent) */}
      <div className="relative w-full max-w-md bg-gray-800/60 rounded-lg border border-gray-700 p-5 z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Detalhes do Lead</h3>
            <p className="text-xs text-gray-400">Editar status</p>
          </div>
          <button
            onClick={() => !saving && onClose && onClose()}
            className="text-gray-400 hover:text-white ml-3"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-xs text-gray-400">Nome</p>
            <p className="text-sm text-white font-medium">{lead.nome || '-'}</p>
          </div>

          <div>
            <p className="text-xs text-gray-400">Telefone</p>
            <p className="text-sm text-gray-300">{lead.telefone || '-'}</p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="">-- Selecionar status --</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => !saving && onClose && onClose()}
            className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}