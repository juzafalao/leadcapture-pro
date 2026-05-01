// ============================================================
// TaskForm.jsx — Formulário para criar nova tarefa
// LeadCapture Pro · Zafalão Tech · Sprint CRM Dia 3
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCreateTask } from '../../hooks/useTasks'

const PRIORIDADES = [
  { value: 'baixa',   label: 'Baixa',   cor: '#6B7280' },
  { value: 'normal',  label: 'Normal',  cor: '#3B82F6' },
  { value: 'alta',    label: 'Alta',    cor: '#F59E0B' },
  { value: 'urgente', label: 'Urgente', cor: '#EF4444' },
]

export default function TaskForm({ leadId, onCancel, onSuccess }) {
  const [titulo, setTitulo]               = useState('')
  const [descricao, setDescricao]         = useState('')
  const [prioridade, setPrioridade]       = useState('normal')
  const [dataVencimento, setDataVencimento] = useState('')
  const [erro, setErro]                   = useState(null)

  const { mutateAsync: criarTarefa, isPending } = useCreateTask()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!titulo.trim()) { setErro('Título é obrigatório'); return }
    setErro(null)

    try {
      await criarTarefa({
        lead_id: leadId,
        titulo,
        descricao: descricao || undefined,
        prioridade,
        data_vencimento: dataVencimento || undefined,
      })
      onSuccess?.()
    } catch (err) {
      setErro(err.message)
    }
  }

  const prioAtual = PRIORIDADES.find(p => p.value === prioridade)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-[#0F172A] border border-[#10B981]/30 rounded-2xl p-4"
    >
      <p className="text-[9px] font-black uppercase tracking-widest text-[#10B981] mb-3">Nova Tarefa</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Título */}
        <input
          type="text"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Título da tarefa..."
          autoFocus
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 focus:ring-1 focus:ring-[#10B981]/20 transition-all"
        />

        {/* Descrição */}
        <textarea
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          placeholder="Detalhes (opcional)..."
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 resize-none transition-all"
        />

        {/* Prioridade + Data */}
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider mb-1">Prioridade</p>
            <div className="flex gap-1 flex-wrap">
              {PRIORIDADES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPrioridade(p.value)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: prioridade === p.value ? `${p.cor}25` : 'rgba(255,255,255,0.04)',
                    color: prioridade === p.value ? p.cor : '#6B7280',
                    border: `1px solid ${prioridade === p.value ? p.cor + '60' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0">
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider mb-1">Vencimento</p>
            <input
              type="date"
              value={dataVencimento}
              onChange={e => setDataVencimento(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#10B981]/50 transition-all"
            />
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <p className="text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {erro}
          </p>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending || !titulo.trim()}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#10B981] text-black hover:bg-[#059669] disabled:opacity-40 transition-all"
          >
            {isPending ? 'Criando...' : 'Criar Tarefa'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
        </div>
      </form>
    </motion.div>
  )
}
