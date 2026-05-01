// VendaModal.jsx — Registrar / editar venda de franquia
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

const fmtR$ = v => v ? `R$ ${Number(v).toLocaleString('pt-BR')}` : '—'

export default function VendaModal({ lead, vendaExistente, onClose, onSave, isSaving }) {
  const [marcaInfo, setMarcaInfo] = useState(null)
  const [form, setForm] = useState({
    taxa_franquia_negociada: '',
    data_venda: new Date().toISOString().slice(0, 10),
    observacoes: '',
  })
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (vendaExistente) {
      setForm({
        taxa_franquia_negociada: vendaExistente.taxa_franquia_negociada ?? '',
        data_venda: vendaExistente.data_venda ?? new Date().toISOString().slice(0, 10),
        observacoes: vendaExistente.observacoes ?? '',
      })
    }
  }, [vendaExistente])

  useEffect(() => {
    const marcaId = lead?.id_marca || lead?.marca?.id
    if (!marcaId) return
    supabase
      .from('marcas')
      .select('id, nome, taxa_franquia_padrao, taxa_franquia_minima')
      .eq('id', marcaId)
      .single()
      .then(({ data }) => {
        if (data) {
          setMarcaInfo(data)
          if (!vendaExistente && data.taxa_franquia_padrao) {
            setForm(f => ({ ...f, taxa_franquia_negociada: data.taxa_franquia_padrao }))
          }
        }
      })
  }, [lead?.id_marca, lead?.marca?.id, vendaExistente])

  const handleValorChange = (v) => {
    setForm(f => ({ ...f, taxa_franquia_negociada: v }))
    if (marcaInfo?.taxa_franquia_minima && Number(v) < Number(marcaInfo.taxa_franquia_minima)) {
      setAviso(`⚠️ Valor abaixo do mínimo (${fmtR$(marcaInfo.taxa_franquia_minima)})`)
    } else {
      setAviso('')
    }
  }

  const handleSubmit = () => {
    if (!form.taxa_franquia_negociada) return
    onSave({
      lead_id:                lead.id,
      marca_id:               lead?.id_marca || lead?.marca?.id || null,
      consultor_id:           lead?.id_operador_responsavel || null,
      taxa_franquia_tabela:   marcaInfo?.taxa_franquia_padrao || null,
      taxa_franquia_negociada: Number(form.taxa_franquia_negociada),
      data_venda:             form.data_venda,
      observacoes:            form.observacoes || null,
      ...(vendaExistente?.id && { id: vendaExistente.id }),
    })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white">
                {vendaExistente ? 'Editar Venda' : 'Registrar Venda'}
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">{lead?.nome}</p>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-white text-xl transition-colors">✕</button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Info da marca */}
            {marcaInfo && (
              <div className="bg-white/[0.04] border border-white/5 rounded-xl p-3 text-xs">
                <p className="text-gray-500 mb-1 font-black uppercase tracking-wider text-[9px]">Tabela da marca</p>
                <div className="flex gap-4">
                  <span className="text-gray-300">Padrão: <span className="text-[#10B981] font-bold">{fmtR$(marcaInfo.taxa_franquia_padrao)}</span></span>
                  <span className="text-gray-300">Mínimo: <span className="text-[#F59E0B] font-bold">{fmtR$(marcaInfo.taxa_franquia_minima)}</span></span>
                </div>
              </div>
            )}

            {/* Valor negociado */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
                Valor Negociado (R$) *
              </label>
              <input
                type="number"
                value={form.taxa_franquia_negociada}
                onChange={e => handleValorChange(e.target.value)}
                placeholder="25000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50"
              />
              {aviso && <p className="text-[10px] text-[#F59E0B] mt-1">{aviso}</p>}
            </div>

            {/* Data */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">Data da Venda</label>
              <input
                type="date"
                value={form.data_venda}
                onChange={e => setForm(f => ({ ...f, data_venda: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#10B981]/50"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                placeholder="Condições especiais, desconto autorizado..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 resize-none text-sm"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-semibold hover:bg-white/5 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || !form.taxa_franquia_negociada}
              className="flex-1 py-3 rounded-xl bg-[#10B981] text-black font-black hover:bg-[#059669] disabled:opacity-50 text-sm"
            >
              {isSaving ? 'Salvando...' : vendaExistente ? 'Atualizar' : 'Registrar Venda'}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}
