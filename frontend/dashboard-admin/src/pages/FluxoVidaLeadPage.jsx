// FluxoVidaLeadPage — Fluxograma do ciclo de vida do lead (6 etapas canônicas)
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const ETAPAS = [
  {
    ordem: 1,
    slug: 'novo_lead',
    label: 'Novo Lead',
    cor: '#3b82f6',
    icone: '◉',
    descricao: 'Entrada automática ao capturar o lead',
    regras: ['Status inicial obrigatório', 'Sem atribuição necessária', 'Aguarda ser agendado pelo gestor'],
    proibido: [],
  },
  {
    ordem: 2,
    slug: 'em_agendamento',
    label: 'Em Agendamento',
    cor: '#f59e0b',
    icone: '📅',
    descricao: 'Lead com atendimento agendado com consultor',
    regras: ['Obrigatório atribuir responsável', 'Pode ser movido via kanban ou modal', 'Atribuição ainda pode ser alterada'],
    proibido: [],
    obrigatorio: 'Operador responsável',
  },
  {
    ordem: 3,
    slug: 'em_negociacao',
    label: 'Em Negociação',
    cor: '#ee7b4d',
    icone: '🤝',
    descricao: 'Proposta em andamento — lead engajado',
    regras: ['Atribuição BLOQUEADA a partir daqui', 'Acompanhar evolução da negociação', 'Avança para Vendido ou Perdido'],
    proibido: ['Alterar operador responsável'],
  },
  {
    ordem: 4,
    slug: 'vendido',
    label: 'Vendido',
    cor: '#10b981',
    icone: '✅',
    descricao: 'Venda concluída — encerramento positivo',
    regras: ['Obrigatório informar valor da venda', 'Status final — ciclo encerrado', 'Atribuição bloqueada'],
    proibido: ['Alterar operador', 'Retroceder etapa'],
    obrigatorio: 'Valor da venda',
    isFinal: true,
  },
  {
    ordem: 5,
    slug: 'perdido',
    label: 'Perdido',
    cor: '#ef4444',
    icone: '✖',
    descricao: 'Negociação encerrada sem conversão',
    regras: ['Obrigatório informar motivo da perda', 'Pode ser reaberto pelo gestor', 'Atribuição bloqueada'],
    proibido: ['Alterar operador'],
    obrigatorio: 'Motivo da perda',
    isFinal: true,
    podeReabrir: true,
  },
  {
    ordem: 6,
    slug: 'reaberto',
    label: 'Reaberto',
    cor: '#06b6d4',
    icone: '↩',
    descricao: 'Lead reaberto após ser marcado como perdido',
    regras: ['Operador removido ao reabrir', 'Gestor atribui novo responsável', 'Gestor move para Em Agendamento'],
    proibido: [],
    especial: true,
  },
]

const SLAS = [
  { status: 'Novo Lead',        prazo: '< 5 min',  cor: '#ef4444', desc: 'Primeiro contato após entrada' },
  { status: 'Em Agendamento',   prazo: '< 24h',    cor: '#f59e0b', desc: 'Realizar a ligação/reunião agendada' },
  { status: 'Em Negociação',    prazo: '< 5 dias', cor: '#ee7b4d', desc: 'Fechar ou qualificar como perdido' },
  { status: 'Reaberto',         prazo: '< 2h',     cor: '#06b6d4', desc: 'Gestor atribuir e mover para Em Agendamento' },
]

export default function FluxoVidaLeadPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/kanban" className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors">
              ← Kanban
            </Link>
          </div>
          <h1 className="text-2xl font-black text-white">
            Fluxo de Vida do <span className="text-[#10B981]">Lead</span>
          </h1>
          <p className="text-[11px] text-gray-500 mt-1">
            Guia oficial para gestores e diretores — regras obrigatórias de cada etapa
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span className="text-[9px] font-black text-[#10b981] uppercase tracking-wider">6 Etapas Canônicas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

        {/* Fluxograma principal */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-4">Fluxograma Completo</p>

          {/* Etapas 1–5 em grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {ETAPAS.filter(e => e.ordem <= 5).map((etapa) => (
              <motion.div
                key={etapa.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: etapa.ordem * 0.07, duration: 0.28 }}
              >
                <div
                  className="h-full rounded-2xl border p-3 bg-[#0B1220] hover:shadow-lg transition-all cursor-default flex flex-col"
                  style={{ borderColor: `${etapa.cor}35`, boxShadow: `0 0 0 1px ${etapa.cor}12` }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0"
                      style={{ background: `${etapa.cor}20`, color: etapa.cor }}
                    >
                      {etapa.ordem}
                    </div>
                    <p className="text-[10px] font-black text-white leading-tight">{etapa.label}</p>
                  </div>

                  <p className="text-[8px] text-gray-600 leading-snug mb-2">{etapa.descricao}</p>

                  {/* Obrigatório */}
                  {etapa.obrigatorio && (
                    <div
                      className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-md mb-1.5 text-center"
                      style={{ background: `${etapa.cor}20`, color: etapa.cor }}
                    >
                      ⚠ {etapa.obrigatorio}
                    </div>
                  )}

                  {/* Final badge */}
                  {etapa.isFinal && (
                    <div
                      className="text-[7.5px] font-black uppercase text-center px-1.5 py-0.5 rounded-md mt-auto"
                      style={{ background: `${etapa.cor}12`, color: `${etapa.cor}90` }}
                    >
                      Encerramento
                    </div>
                  )}

                  {/* Bloqueios */}
                  {etapa.proibido.length > 0 && (
                    <div className="mt-1.5 text-[7.5px] text-red-400/70 flex items-center gap-1">
                      <span>✕</span>
                      <span className="truncate">{etapa.proibido[0]}</span>
                    </div>
                  )}

                  {/* Pode reabrir */}
                  {etapa.podeReabrir && (
                    <div className="mt-1.5 text-[7.5px] text-[#06b6d4]/80 flex items-center gap-1">
                      <span>↩</span> Pode reabrir
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Reaberto — separado */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-white/[0.04]" />
            <span className="text-[9px] text-[#06b6d4]/50">↩ Perdido pode ser reaberto</span>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl border p-4 bg-[#0B1220]"
            style={{ borderColor: '#06b6d435', boxShadow: '0 0 0 1px #06b6d412' }}
          >
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
                  style={{ background: '#06b6d420', color: '#06b6d4' }}
                >
                  6
                </div>
                <span className="text-lg">↩</span>
                <div>
                  <p className="text-[11px] font-black text-white">Reaberto</p>
                  <p className="text-[9px] text-gray-600">Lead reaberto após perda — aguarda nova atribuição pelo gestor</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                {['Operador removido automaticamente', 'Gestor atribui novo responsável', 'Gestor move para Em Agendamento'].map((r, i) => (
                  <span key={i} className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-[#06b6d4]/10 text-[#06b6d4]/70 border border-[#06b6d4]/15">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Regras gerais */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-6 rounded-2xl border border-white/[0.06] p-5 bg-[#080E18]"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-4">Regras Gerais do Fluxo</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { titulo: 'Novo Lead',       cor: '#3b82f6', regra: 'Todo lead entra obrigatoriamente com status "Novo Lead". Sem atribuição necessária.' },
                { titulo: 'Em Agendamento',  cor: '#f59e0b', regra: 'Exige responsável atribuído. Pode mover via arraste no kanban ou via modal do lead.' },
                { titulo: 'Em Negociação',   cor: '#ee7b4d', regra: 'A partir daqui, a atribuição de operador é BLOQUEADA — não pode ser alterada.' },
                { titulo: 'Vendido',         cor: '#10b981', regra: 'Encerramento positivo. Requer valor da venda informado obrigatoriamente.' },
                { titulo: 'Perdido',         cor: '#ef4444', regra: 'Encerramento negativo. Requer motivo da perda. Pode ser reaberto pelo gestor.' },
                { titulo: 'Reaberto',        cor: '#06b6d4', regra: 'Operador removido. Gestor deve atribuir novo responsável e mover para Em Agendamento.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: item.cor }} />
                  <div>
                    <span className="text-[10px] font-black mr-1" style={{ color: item.cor }}>{item.titulo}:</span>
                    <span className="text-[10px] text-gray-500">{item.regra}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-5">

          {/* SLA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/[0.06] p-4 bg-[#080E18]"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-3">SLA de Atendimento</p>
            <div className="space-y-2.5">
              {SLAS.map((s, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: s.cor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-white truncate">{s.status}</span>
                      <span className="text-[9px] font-black shrink-0 tabular-nums" style={{ color: s.cor }}>{s.prazo}</span>
                    </div>
                    <p className="text-[8.5px] text-gray-600 mt-0.5 leading-snug">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Temperatura */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-white/[0.06] p-4 bg-[#080E18]"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-3">Temperatura do Lead</p>
            <div className="space-y-2">
              {[
                { label: 'Hot 🔥',  cor: '#ef4444', bg: '#ef444415', score: '80–100', desc: 'Contato imediato — menos de 5 min' },
                { label: 'Warm 🌡', cor: '#f59e0b', bg: '#f59e0b15', score: '60–79',  desc: 'Atendimento no mesmo dia' },
                { label: 'Cold 🧊', cor: '#64748b', bg: '#64748b15', score: '0–59',   desc: 'Atendimento em até 48h' },
              ].map((t, i) => (
                <div key={i}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{ background: t.bg, border: `1px solid ${t.cor}25` }}
                >
                  <div>
                    <p className="text-[10px] font-black" style={{ color: t.cor }}>{t.label}</p>
                    <p className="text-[8.5px] text-gray-500 leading-tight mt-0.5">{t.desc}</p>
                  </div>
                  <span className="ml-auto text-[9px] font-black tabular-nums shrink-0" style={{ color: t.cor }}>
                    {t.score}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Regras de atribuição */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-amber-500/20 p-4 bg-amber-500/[0.04]"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/70 mb-3">Regras de Atribuição</p>
            <div className="space-y-1.5">
              {[
                ['Novo Lead → Em Agendamento',   'Gestor/Diretor atribui o responsável'],
                ['Em Agendamento',                'Atribuição pode ser alterada'],
                ['Em Negociação em diante',       'Atribuição BLOQUEADA'],
                ['Perdido → Reaberto',            'Operador removido automaticamente'],
                ['Reaberto → Em Agendamento',     'Gestor deve reatribuir manualmente'],
              ].map(([etapa, regra], i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-500/50 text-[9px] shrink-0 mt-0.5">→</span>
                  <div>
                    <span className="text-[9px] font-black text-amber-400/80">{etapa}: </span>
                    <span className="text-[9px] text-gray-500">{regra}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Slugs canônicos (referência técnica) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl border border-white/[0.06] p-4 bg-[#080E18]"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-3">Slugs Canônicos (BD)</p>
            <div className="space-y-1">
              {ETAPAS.map(e => (
                <div key={e.slug} className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-400">{e.label}</span>
                  <code className="text-[8px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.04] text-gray-500">{e.slug}</code>
                </div>
              ))}
            </div>
          </motion.div>

          <Link
            to="/kanban"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-[11px] font-black hover:bg-[#10b981]/15 transition-all"
          >
            ← Ir para o Funil de Vendas
          </Link>
        </div>
      </div>
    </div>
  )
}
