// ============================================================
// LeadTimeline.jsx — Timeline visual do ciclo de vida do lead
// LeadCapture Pro — Zafalao Tech
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLeadHistorico, useRegistrarObservacao, getTipoConfig } from '../../hooks/useLeadHistorico'

function formatarData(iso) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })
}

function EventoItem({ evento, isLast }) {
  const config = getTipoConfig(evento.tipo)
  return (
    <div className="flex gap-3">
      {/* Linha vertical + dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-2.5 h-2.5 rounded-full ring-2 ring-[#0F172A] flex-shrink-0 mt-1"
          style={{ background: config.cor }}
        />
        {!isLast && <div className="w-px flex-1 mt-1" style={{ background: config.cor + '30' }} />}
      </div>

      {/* Conteúdo */}
      <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Badge do tipo */}
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded mr-2"
              style={{ background: config.cor + '18', color: config.cor }}
            >
              {config.label}
            </span>
            {/* Descrição */}
            <span className="text-xs text-gray-300 leading-relaxed">
              {evento.descricao}
            </span>
            {/* Quem fez */}
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
  const [novaObs, setNovaObs] = useState('')
  const [salvando, setSalvando] = useState(false)

  const { data: historico = [], isLoading } = useLeadHistorico(lead?.id)
  const { mutateAsync: registrarObs } = useRegistrarObservacao()

  const handleSalvarObs = async () => {
    const texto = novaObs.trim()
    if (!texto || salvando) return
    setSalvando(true)
    try {
      await registrarObs({
        leadId:    lead.id,
        tenantId:  lead.tenant_id,
        descricao: texto,
      })
      setNovaObs('')
    } catch (err) {
      console.error('[Timeline] Erro ao salvar observação:', err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Campo de observação */}
      <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
          Registrar observação
        </label>
        <textarea
          value={novaObs}
          onChange={e => setNovaObs(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSalvarObs()
          }}
          placeholder="Ex: Ligou, tem interesse, quer visitar unidade em SP..."
          rows={3}
          className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-700 resize-none outline-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <span className="text-[10px] text-gray-700">Ctrl+Enter para salvar</span>
          <button
            onClick={handleSalvarObs}
            disabled={!novaObs.trim() || salvando}
            className="px-4 py-1.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-30 text-black text-xs font-bold rounded-lg transition-colors"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

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
