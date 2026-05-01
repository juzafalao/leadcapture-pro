// ============================================================
// LeadTimeline.jsx — Timeline visual do ciclo de vida do lead
// LeadCapture Pro · Zafalao Tech
//
// Sprint CRM Dia 8: adicionado registro de interação manual
// (ligação, reunião, e-mail, visita) via /api/tasks/interacao
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLeadHistorico, useRegistrarObservacao, getTipoConfig } from '../../hooks/useLeadHistorico'
import { useRegistrarInteracao } from '../../hooks/useTasks'

const TIPOS_INTERACAO = [
  { value: 'ligacao', label: '📞 Ligação' },
  { value: 'reuniao', label: '🤝 Reunião' },
  { value: 'email',   label: '📧 E-mail'  },
  { value: 'visita',  label: '🏢 Visita'  },
  { value: 'outro',   label: '💬 Outro'   },
]

function formatarData(iso) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function EventoItem({ evento, isLast }) {
  const config = getTipoConfig(evento.tipo)
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-2.5 h-2.5 rounded-full ring-2 ring-[#0F172A] flex-shrink-0 mt-1"
          style={{ background: config.cor }}
        />
        {!isLast && <div className="w-px flex-1 mt-1" style={{ background: config.cor + '30' }} />}
      </div>

      <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded mr-2"
              style={{ background: config.cor + '18', color: config.cor }}
            >
              {config.label}
            </span>
            <span className="text-xs text-gray-300 leading-relaxed">
              {evento.descricao}
            </span>
            {evento.usuario_nome && (
              <div className="flex items-center gap-1 mt-1">
                <div
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                  style={{ background: config.cor + '60' }}
                >
                  {evento.usuario_nome[0]?.toUpperCase()}
                </div>
                <span className="text-[10px] text-gray-600">{evento.usuario_nome}</span>
              </div>
            )}
          </div>
          <span className="text-[9px] text-gray-700 whitespace-nowrap flex-shrink-0 mt-0.5">
            {formatarData(evento.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function LeadTimeline({ lead }) {
  const [novaObs, setNovaObs]             = useState('')
  const [salvandoObs, setSalvandoObs]     = useState(false)
  const [modoRegistro, setModoRegistro]   = useState('observacao')
  const [tipoInteracao, setTipoInteracao] = useState('ligacao')
  const [descInteracao, setDescInteracao] = useState('')

  const { data: historico = [], isLoading }                                 = useLeadHistorico(lead?.id)
  const { mutateAsync: registrarObs }                                       = useRegistrarObservacao()
  const { mutateAsync: registrarInteracao, isPending: salvandoInteracao }   = useRegistrarInteracao()

  const handleSalvarObs = async () => {
    const texto = novaObs.trim()
    if (!texto || salvandoObs) return
    setSalvandoObs(true)
    try {
      await registrarObs({ leadId: lead.id, tenantId: lead.tenant_id, descricao: texto })
      setNovaObs('')
    } catch (err) {
      console.error('[Timeline] Erro ao salvar observação:', err.message)
    } finally {
      setSalvandoObs(false)
    }
  }

  const handleSalvarInteracao = async () => {
    const texto = descInteracao.trim()
    if (!texto || salvandoInteracao) return
    try {
      await registrarInteracao({ lead_id: lead.id, tipo_interacao: tipoInteracao, descricao: texto })
      setDescInteracao('')
    } catch (err) {
      console.error('[Timeline] Erro ao registrar interação:', err.message)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Seletor de modo */}
      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
        {[
          { id: 'observacao', label: '📝 Observação' },
          { id: 'interacao',  label: '📞 Interação'  },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setModoRegistro(m.id)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              modoRegistro === m.id
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Registro de Observação */}
      {modoRegistro === 'observacao' && (
        <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Registrar observação
          </label>
          <textarea
            value={novaObs}
            onChange={e => setNovaObs(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSalvarObs() }}
            placeholder="Ex: Ligou, tem interesse, quer visitar unidade em SP..."
            rows={3}
            className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-700 resize-none outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="text-[10px] text-gray-700">Ctrl+Enter para salvar</span>
            <button
              onClick={handleSalvarObs}
              disabled={!novaObs.trim() || salvandoObs}
              className="px-4 py-1.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-30 text-black text-xs font-bold rounded-lg transition-colors"
            >
              {salvandoObs ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Registro de Interação Manual */}
      {modoRegistro === 'interacao' && (
        <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Registrar interação
          </label>

          <div className="flex gap-1.5 flex-wrap mb-3">
            {TIPOS_INTERACAO.map(t => (
              <button
                key={t.value}
                onClick={() => setTipoInteracao(t.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  tipoInteracao === t.value
                    ? 'bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30'
                    : 'bg-white/[0.04] text-gray-600 border border-white/[0.06] hover:text-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            value={descInteracao}
            onChange={e => setDescInteracao(e.target.value)}
            placeholder="Descreva o que aconteceu na interação..."
            rows={3}
            className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-700 resize-none outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="text-[10px] text-gray-700">Registra na timeline e dispara webhooks</span>
            <button
              onClick={handleSalvarInteracao}
              disabled={!descInteracao.trim() || salvandoInteracao}
              className="px-4 py-1.5 bg-[#A855F7] hover:bg-[#9333EA] disabled:opacity-30 text-white text-xs font-bold rounded-lg transition-colors"
            >
              {salvandoInteracao ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
          Histórico · {historico.length} eventos
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-600 py-4">
            <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
            Carregando histórico...
          </div>
        ) : historico.length === 0 ? (
          <p className="text-xs text-gray-700 py-4 text-center">
            Nenhum evento registrado ainda.
          </p>
        ) : (
          <div>
            {[...historico].reverse().map((evento, i) => (
              <EventoItem
                key={evento.id}
                evento={evento}
                isLast={i === historico.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
