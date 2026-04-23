// WhatsAppPage.jsx — Integração WhatsApp Business
import { motion } from 'framer-motion'
import { MessageCircle, Smartphone, Zap, Shield, CheckCircle, ArrowRight } from 'lucide-react'

const RECURSOS = [
  { icon: Smartphone,    color: '#25D366', label: 'Número Conectado',    desc: 'Vincule seu WhatsApp Business API ou Evolution API' },
  { icon: Zap,           color: '#F59E0B', label: 'Respostas Automáticas', desc: 'Templates de boas-vindas e qualificação automática' },
  { icon: MessageCircle, color: '#3B82F6', label: 'Conversas Centralizadas', desc: 'Inbox unificado de todos os contatos' },
  { icon: Shield,        color: '#8B5CF6', label: 'Anti-spam & Blacklist', desc: 'Bloqueio automático de contatos indesejados' },
]

export default function WhatsAppPage() {
  return (
    <div className="min-h-full bg-[#0B1220] px-4 lg:px-10 py-6 lg:py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#25D36618' }}>
            <MessageCircle className="w-5 h-5" style={{ color: '#25D366' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">Integração com WhatsApp Business API</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <span className="text-[11px] font-semibold text-[#F59E0B]">Em desenvolvimento — em breve disponível</span>
        </div>
      </div>

      {/* Recursos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {RECURSOS.map((r, i) => {
          const Icon = r.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#0F172A] border border-white/[0.06] rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${r.color}18` }}>
                  <Icon className="w-5 h-5" style={{ color: r.color }} />
                </div>
                <p className="text-[13px] font-semibold text-white">{r.label}</p>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{r.desc}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-gray-700" />
                <span className="text-[10px] text-gray-600">Planejado para próxima release</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Configuração atual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="bg-[#0F172A] border border-[#25D366]/20 rounded-2xl p-6"
      >
        <p className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: '#25D366' }}>Integração atual</p>
        <p className="text-[13px] text-gray-300 leading-relaxed">
          O WhatsApp já está integrado via <strong className="text-white">Evolution API</strong> para receber leads automaticamente.
          Configure o webhook em <a href="/canais" className="hover:underline" style={{ color: '#25D366' }}>Canais</a> ou
          ajuste os fluxos em <a href="/automacao" className="hover:underline" style={{ color: '#25D366' }}>Automação n8n</a>.
        </p>
      </motion.div>
    </div>
  )
}
