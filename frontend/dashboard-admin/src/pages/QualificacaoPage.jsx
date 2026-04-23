// QualificacaoPage.jsx — Motor de Qualificação de Leads
import { motion } from 'framer-motion'
import { Shield, Zap, SlidersHorizontal, TrendingUp, GitBranch, CheckCircle } from 'lucide-react'

const FUNCIONALIDADES = [
  { icon: SlidersHorizontal, color: '#8B5CF6', label: 'Regras de Score',         desc: 'Configure critérios de pontuação: capital, região, interesse, comportamento' },
  { icon: GitBranch,         color: '#3B82F6', label: 'Roteamento Automático',    desc: 'Distribua leads automaticamente por perfil, região ou consultor disponível' },
  { icon: Zap,               color: '#F59E0B', label: 'Triggers de Temperatura',  desc: 'Defina quando um lead vira Quente, Morno ou Frio com base em ações' },
  { icon: TrendingUp,        color: '#10B981', label: 'Análise de Qualidade',     desc: 'Relatório de qualidade por canal, marca e período' },
]

export default function QualificacaoPage() {
  return (
    <div className="min-h-full bg-[#0B1220] px-4 lg:px-10 py-6 lg:py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Qualificação</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">Motor de regras automáticas para qualificar e rotear leads</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <span className="text-[11px] font-semibold text-[#F59E0B]">Em desenvolvimento — em breve disponível</span>
        </div>
      </div>

      {/* Score atual */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0F172A] border border-[#8B5CF6]/20 rounded-2xl p-5 mb-6"
      >
        <p className="text-[11px] font-black uppercase tracking-wider text-[#8B5CF6] mb-3">Sistema de Score atual</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hot',  desc: 'Score ≥ 80',   color: '#EF4444', bg: '#EF444418' },
            { label: 'Morno',desc: 'Score 50–79',  color: '#F59E0B', bg: '#F59E0B18' },
            { label: 'Frio', desc: 'Score < 50',   color: '#6B7280', bg: '#6B728018' },
          ].map((t, i) => (
            <div key={i} className="rounded-xl p-3 text-center" style={{ background: t.bg }}>
              <p className="text-[13px] font-bold" style={{ color: t.color }}>{t.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Funcionalidades planejadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {FUNCIONALIDADES.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="bg-[#0F172A] border border-white/[0.06] rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${f.color}18` }}>
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <p className="text-[13px] font-semibold text-white">{f.label}</p>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{f.desc}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-gray-700" />
                <span className="text-[10px] text-gray-600">Planejado</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Enquanto isso */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-[#0F172A] border border-[#8B5CF6]/20 rounded-2xl p-6"
      >
        <p className="text-[11px] font-black uppercase tracking-wider text-[#8B5CF6] mb-2">Score já funciona automaticamente</p>
        <p className="text-[13px] text-gray-300 leading-relaxed">
          O score já é calculado automaticamente via <strong className="text-white">n8n</strong> com base no capital declarado, origem e engajamento.
          Veja os resultados no <a href="/pipeline" className="text-[#8B5CF6] hover:underline">Pipeline de Leads</a> ou
          ajuste os fluxos em <a href="/automacao" className="text-[#8B5CF6] hover:underline">Automação</a>.
        </p>
      </motion.div>
    </div>
  )
}
