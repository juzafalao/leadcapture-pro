// FluxoVidaLeadPage — Fluxograma do ciclo de vida do lead
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const ETAPAS = [
  {
    ordem: 1,
    slug: 'novo',
    label: 'Novo Lead',
    cor: '#3b82f6',
    icone: '◉',
    descricao: 'Entrada automática ao capturar o lead',
    regras: ['Status inicial obrigatório', 'Não requer atribuição', 'Aguarda agendamento'],
    proibido: [],
  },
  {
    ordem: 2,
    slug: 'agendado',
    label: 'Agendado',
    cor: '#f59e0b',
    icone: '📅',
    descricao: 'Lead com atendimento agendado com consultor',
    regras: ['Obrigatório atribuir responsável', 'Pode ser movido via kanban ou modal', 'Atribuição pode ser alterada'],
    proibido: [],
    obrigatorio: 'Operador responsável',
  },
  {
    ordem: 3,
    slug: 'em_contato',
    label: 'Em Contato',
    cor: '#8b5cf6',
    icone: '📞',
    descricao: 'Primeiro contato realizado com o lead',
    regras: ['Atribuição ainda pode ser alterada', 'Qualificar o lead nesta etapa'],
    proibido: [],
  },
  {
    ordem: 4,
    slug: 'negociacao',
    label: 'Em Negociação',
    cor: '#ee7b4d',
    icone: '🤝',
    descricao: 'Proposta em andamento, lead engajado',
    regras: ['Atribuição BLOQUEADA a partir daqui', 'Acompanhar evolução da negociação'],
    proibido: ['Alterar operador responsável'],
  },
  {
    ordem: 5,
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
    ordem: 6,
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
    ordem: 7,
    slug: 'reaberto',
    label: 'Reaberto',
    cor: '#06b6d4',
    icone: '↩',
    descricao: 'Lead reaberto após ser marcado como perdido',
    regras: ['Sem operador atribuído', 'Gestor deve atribuir novo responsável', 'Gestor deve mover para Agendado'],
    proibido: [],
    especial: true,
  },
]

const SLAS = [
  { status: 'Novo Lead',     prazo: '< 5 min',  cor: '#ef4444', desc: 'Primeiro contato após entrada' },
  { status: 'Agendado',      prazo: '< 24h',    cor: '#f59e0b', desc: 'Realizar a ligação/reunião agendada' },
  { status: 'Em Contato',    prazo: '< 48h',    cor: '#8b5cf6', desc: 'Avançar para proposta ou negociação' },
  { status: 'Em Negociação', prazo: '< 5 dias', cor: '#ee7b4d', desc: 'Fechar ou qualificar como perdido' },
  { status: 'Reaberto',      prazo: '< 2h',     cor: '#06b6d4', desc: 'Gestor atribuir e mover para Agendado' },
]

function EtapaCard({ etapa, idx }) {
  const isLast = idx === ETAPAS.length - 1
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.3 }}
      className="flex flex-col items-center"
    >
      {/* Card */}
      <div
        className="relative w-full rounded-2xl border p-4 bg-[#0B1220] transition-all hover:shadow-lg"
        style={{ borderColor: `${etapa.cor}30`, boxShadow: `0 0 0 1px ${etapa.cor}15` }}
      >
        {/* Badge final/especial */}
        {etapa.isFinal && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: `${etapa.cor}25`, color: etapa.cor, border: `1px solid ${etapa.cor}40` }}>
            FINAL
          </span>
        )}
        {etapa.especial && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: `${etapa.cor}25`, color: etapa.cor, border: `1px solid ${etapa.cor}40` }}>
            REABERTO
          </span>
        )}

        {/* Ordem + ícone */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
            style={{ background: `${etapa.cor}20`, color: etapa.cor }}>
            {etapa.ordem}
          </div>
          <span className="text-lg">{etapa.icone}</span>
          <div>
            <p className="text-[11px] font-black text-white leading-tight">{etapa.label}</p>
            <p className="text-[9px] text-gray-600 leading-tight mt-0.5">{etapa.descricao}</p>
          </div>
        </div>

        {/* Obrigatório */}
        {etapa.obrigatorio && (
          <div className="mb-2 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5"
            style={{ background: `${etapa.cor}15`, color: etapa.cor, border: `1px solid ${etapa.cor}25` }}>
            <span>⚠</span> Obrigatório: {etapa.obrigatorio}
          </div>
        )}

        {/* Regras */}
        <ul className="space-y-1 mb-2">
          {etapa.regras.map((r, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[9px] text-gray-400">
              <span className="text-[#10b981] shrink-0 mt-0.5">›</span>{r}
            </li>
          ))}
        </ul>

        {/* Proibido */}
        {etapa.proibido.length > 0 && (
          <ul className="space-y-1">
            {etapa.proibido.map((p, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[9px] text-red-400/80">
                <span className="shrink-0 mt-0.5">✕</span>{p}
              </li>
            ))}
          </ul>
        )}

        {/* Pode reabrir */}
        {etapa.podeReabrir && (
          <div className="mt-2 pt-2 border-t border-white/[0.04] text-[9px] text-[#06b6d4] flex items-center gap-1">
            <span>↩</span> Pode ser reaberto — vai para Reaberto
          </div>
        )}
      </div>

      {/* Seta */}
      {!isLast && (
        <div className="flex flex-col items-center my-1">
          <div className="w-px h-3 bg-white/[0.08]" />
          <div className="text-gray-700 text-xs">▼</div>
        </div>
      )}
    </motion.div>
  )
}

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
          <span className="text-[9px] font-black text-[#10b981] uppercase tracking-wider">7 Etapas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

        {/* Fluxograma */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-4">Fluxograma Completo</p>

          {/* Fluxo principal (1-6) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {ETAPAS.filter(e => e.ordem <= 6).map((etapa, idx) => (
              <div key={etapa.slug} className="flex flex-col items-center">
                <div
                  className="w-full rounded-2xl border p-3 bg-[#0B1220] hover:shadow-lg transition-all cursor-default"
                  style={{ borderColor: `${etapa.cor}35`, boxShadow: `0 0 0 1px ${etapa.cor}12` }}
                >
                  {/* Header do card */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0"
                      style={{ background: `${etapa.cor}20`, color: etapa.cor }}>
                      {etapa.ordem}
                    </div>
                    <p className="text-[10px] font-black text-white leading-tight truncate">{etapa.label}</p>
                  </div>

                  {/* Dot + descricao */}
                  <p className="text-[8px] text-gray-600 leading-snug mb-2">{etapa.descricao}</p>

                  {/* Obrigatório badge */}
                  {etapa.obrigatorio && (
                    <div className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded-md mb-1.5 text-center"
                      style={{ background: `${etapa.cor}20`, color: etapa.cor }}>
                      ⚠ {etapa.obrigatorio}
                    </div>
                  )}

                  {/* Status final */}
                  {etapa.isFinal && (
                    <div className="text-[7.5px] font-black uppercase text-center px-1.5 py-0.5 rounded-md"
                      style={{ background: `${etapa.cor}12`, color: `${etapa.cor}90` }}>
                      Encerramento
                    </div>
                  )}

                  {/* Bloqueio operador */}
                  {etapa.proibido.length > 0 && (
                    <div className="mt-1.5 text-[7.5px] text-red-400/70 flex items-center gap-1">
                      <span>✕</span>
                      <span className="truncate">{etapa.proibido[0]}</span>
                    </div>
                  )}

                  {/* Reabrir */}
                  {etapa.podeReabrir && (
                    <div className="mt-1.5 text-[7.5px] text-[#06b6d4]/80 flex items-center gap-1">
                      <span>↩</span> Pode reabrir
                    </div>
                  )}
                </div>

                {/* Seta horizontal (não na última) */}
                {idx < 5 && (
                  <div className="hidden lg:flex absolute" style={{ pointerEvents: 'none' }} />
                )}
              </div>
            ))}
          </div>

          {/* Seta para reaberto */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/[0.04]" />
            <div className="flex items-center gap-2 text-[9px] text-[#06b6d4]/60">
              <span>↩ Perdido pode ser reaberto</span>
            </div>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>

          {/* Card Reaberto separado */}
          <div
            className="rounded-2xl border p-4 bg-[#0B1220]"
            style={{ borderColor: '#06b6d435', boxShadow: '0 0 0 1px #06b6d412' }}
          >
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: '#06b6d420', color: '#06b6d4' }}>
                  7
                </div>
                <span className="text-lg">↩</span>
                <div>
                  <p className="text-[11px] font-black text-white">Reaberto</p>
                  <p className="text-[9px] text-gray-600">Lead reaberto após perda — aguarda nova atribuição</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                {[
                  'Sem operador (removido ao reabrir)',
                  'Gestor atribui novo responsável',
                  'Gestor move para Agendado',
                ].map((r, i) => (
                  <span key={i} className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-[#06b6d4]/10 text-[#06b6d4]/70 border border-[#06b6d4]/15">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Regras gerais */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 rounded-2xl border border-white/[0.06] p-5 bg-[#080E18]"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-4">Regras Gerais do Fluxo</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { titulo: 'Novo Lead',      cor: '#3b82f6', regra: 'Todo lead entra com status "Novo Lead" obrigatoriamente.' },
                { titulo: 'Agendado',       cor: '#f59e0b', regra: 'Exige responsável atribuído. Pode ser alterado por arraste no kanban ou via modal.' },
                { titulo: 'Em Negociação+', cor: '#ee7b4d', regra: 'A partir de "Em Negociação", a atribuição de operador é BLOQUEADA.' },
                { titulo: 'Vendido',        cor: '#10b981', regra: 'Encerramento positivo. Requer valor da venda informado obrigatoriamente.' },
                { titulo: 'Perdido',        cor: '#ef4444', regra: 'Encerramento negativo. Requer motivo da perda. Pode ser reaberto.' },
                { titulo: 'Reaberto',       cor: '#06b6d4', regra: 'Operador removido. Gestor deve atribuir novo responsável e mover para Agendado.' },
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

        {/* Coluna direita: SLA + Temperatura */}
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

          {/* Temperatura × Status */}
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
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{ background: t.bg, border: `1px solid ${t.cor}25` }}>
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

          {/* Resumo de atribuição */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-amber-500/20 p-4 bg-amber-500/[0.04]"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/70 mb-3">Regras de Atribuição</p>
            <div className="space-y-1.5">
              {[
                ['Novo → Agendado',      'Gestor/Diretor atribui o responsável'],
                ['Agendado → Em Contato','Atribuição pode ser alterada'],
                ['Em Negociação+',       'Atribuição BLOQUEADA'],
                ['Perdido → Reaberto',   'Operador é removido automaticamente'],
                ['Reaberto → Agendado',  'Gestor deve reatribuir manualmente'],
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

          {/* Link para o Kanban */}
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
