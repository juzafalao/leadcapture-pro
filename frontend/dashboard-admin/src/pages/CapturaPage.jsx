// CapturaPage.jsx — Captura de Leads multi-canal
import { motion } from 'framer-motion'
import { Radio, Globe, MessageCircle, Bot, Webhook, Upload, Zap, ArrowRight } from 'lucide-react'

const CANAIS = [
  { icon: MessageCircle, color: '#25D366', label: 'WhatsApp',      desc: 'Captura automática via número conectado' },
  { icon: Globe,         color: '#6366F1', label: 'Formulário Web', desc: 'Widget embedável em qualquer site' },
  { icon: Bot,           color: '#F59E0B', label: 'Chatbot',        desc: 'Bot com qualificação automática' },
  { icon: Zap,           color: '#EA580C', label: 'n8n / Make',     desc: 'Integração via workflows de automação' },
  { icon: Webhook,       color: '#8B5CF6', label: 'API / Webhook',  desc: 'Endpoint REST para qualquer plataforma' },
  { icon: Upload,        color: '#06B6D4', label: 'Importação CSV', desc: 'Upload em massa de planilhas' },
]

export default function CapturaPage() {
  return (
    <div className="min-h-full bg-[#0B1220] px-4 lg:px-10 py-6 lg:py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 flex items-center justify-center">
            <Radio className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Captura de Leads</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">Gerencie todos os canais de entrada de leads</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <span className="text-[11px] font-semibold text-[#F59E0B]">Em desenvolvimento — em breve disponível</span>
        </div>
      </div>

      {/* Canais disponíveis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {CANAIS.map((canal, i) => {
          const Icon = canal.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-[#0F172A] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${canal.color}18` }}>
                  <Icon className="w-5 h-5" style={{ color: canal.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white">{canal.label}</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{canal.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-600">Em breve</span>
                <ArrowRight className="w-4 h-4 text-gray-700" />
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
        className="bg-[#0F172A] border border-[#10B981]/20 rounded-2xl p-6"
      >
        <p className="text-[11px] font-black uppercase tracking-wider text-[#10B981] mb-2">Enquanto isso</p>
        <p className="text-[13px] text-gray-300 leading-relaxed">
          Os leads já chegam automaticamente via <strong className="text-white">WhatsApp</strong>, <strong className="text-white">webhook</strong> e <strong className="text-white">n8n</strong>.
          Acesse a tela de <a href="/pipeline" className="text-[#10B981] hover:underline">Leads</a> para gerenciar o pipeline ou
          configure integrações em <a href="/canais" className="text-[#10B981] hover:underline">Canais</a>.
        </p>
      </motion.div>
    </div>
  )
}
