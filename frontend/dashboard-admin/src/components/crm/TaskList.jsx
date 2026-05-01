// ============================================================
// TaskList.jsx — Lista de tarefas de um lead com ações
// LeadCapture Pro · Zafalão Tech · Sprint CRM Dias 5 e 7
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasks, useUpdateTask } from '../../hooks/useTasks'
import TaskForm from './TaskForm'

const PRIO_CONFIG = {
  baixa:   { cor: '#6B7280', label: 'Baixa'   },
  normal:  { cor: '#3B82F6', label: 'Normal'  },
  alta:    { cor: '#F59E0B', label: 'Alta'    },
  urgente: { cor: '#EF4444', label: 'Urgente' },
}

function fmtData(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const hoje = new Date()
  const diff = Math.floor((d - hoje) / 86_400_000)
  if (diff < 0)  return { label: `Venceu ${Math.abs(diff)}d atrás`, cor: '#EF4444' }
  if (diff === 0) return { label: 'Vence hoje', cor: '#F59E0B' }
  if (diff === 1) return { label: 'Vence amanhã', cor: '#F59E0B' }
  return { label: `Vence em ${diff}d`, cor: '#6B7280' }
}

function TaskItem({ tarefa, leadId }) {
  const [loading, setLoading] = useState(false)
  const { mutateAsync: atualizar } = useUpdateTask()

  const prio   = PRIO_CONFIG[tarefa.prioridade] || PRIO_CONFIG.normal
  const venc   = tarefa.data_vencimento ? fmtData(tarefa.data_vencimento) : null
  const feita  = tarefa.status === 'concluida'

  const toggleStatus = async () => {
    if (loading) return
    setLoading(true)
    try {
      await atualizar({
        id: tarefa.id,
        lead_id: leadId,
        status: feita ? 'pendente' : 'concluida',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      className={`flex gap-3 p-3 rounded-xl border transition-all ${
        feita
          ? 'bg-white/[0.02] border-white/[0.04] opacity-60'
          : 'bg-white/[0.04] border-white/[0.07] hover:border-white/10'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={toggleStatus}
        disabled={loading}
        className={`mt-0.5 w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-all ${
          feita ? 'bg-[#10B981] border-[#10B981]' : 'border-gray-600 hover:border-[#10B981]'
        } ${loading ? 'opacity-50' : ''}`}
      >
        {feita && (
          <svg viewBox="0 0 10 8" width="8" height="8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${feita ? 'line-through text-gray-600' : 'text-white'}`}>
          {tarefa.titulo}
        </p>

        {tarefa.descricao && (
          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed truncate">{tarefa.descricao}</p>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Prioridade */}
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${prio.cor}18`, color: prio.cor }}
          >
            {prio.label}
          </span>

          {/* Vencimento */}
          {venc && !feita && (
            <span className="text-[9px] font-medium" style={{ color: venc.cor }}>
              {venc.label}
            </span>
          )}

          {/* Responsável */}
          {tarefa.usuario?.nome && (
            <span className="text-[9px] text-gray-700">
              {tarefa.usuario.nome.split(' ')[0]}
            </span>
          )}

          {/* Concluída em */}
          {feita && tarefa.concluida_em && (
            <span className="text-[9px] text-[#10B981]">
              Concluída {new Date(tarefa.concluida_em).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function TaskList({ lead }) {
  const [showForm, setShowForm] = useState(false)
  const { data: tarefas = [], isLoading } = useTasks(lead?.id)

  const pendentes  = tarefas.filter(t => t.status === 'pendente')
  const concluidas = tarefas.filter(t => t.status === 'concluida')
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Tarefas</p>
          <p className="text-[10px] text-gray-700 mt-0.5">
            {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''} · {concluidas.length} concluída{concluidas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
            showForm
              ? 'bg-white/5 text-gray-400 hover:bg-white/10'
              : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/20'
          }`}
        >
          {showForm ? 'Cancelar' : '+ Nova Tarefa'}
        </button>
      </div>

      {/* Formulário */}
      <AnimatePresence>
        {showForm && (
          <TaskForm
            leadId={lead.id}
            onCancel={() => setShowForm(false)}
            onSuccess={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-600 py-3">
          <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
          Carregando tarefas...
        </div>
      )}

      {/* Lista pendentes */}
      {!isLoading && pendentes.length === 0 && !showForm && (
        <p className="text-[11px] text-gray-700 text-center py-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
          Nenhuma tarefa pendente — crie a primeira acima.
        </p>
      )}

      <AnimatePresence>
        {pendentes.map(t => (
          <TaskItem key={t.id} tarefa={t} leadId={lead.id} />
        ))}
      </AnimatePresence>

      {/* Concluídas (recolhíveis) */}
      {concluidas.length > 0 && (
        <div>
          <button
            onClick={() => setMostrarConcluidas(v => !v)}
            className="text-[9px] font-black uppercase tracking-wider text-gray-600 hover:text-gray-500 transition-colors py-2"
          >
            {mostrarConcluidas ? '▾' : '▸'} {concluidas.length} concluída{concluidas.length !== 1 ? 's' : ''}
          </button>

          <AnimatePresence>
            {mostrarConcluidas && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {concluidas.map(t => (
                  <TaskItem key={t.id} tarefa={t} leadId={lead.id} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
