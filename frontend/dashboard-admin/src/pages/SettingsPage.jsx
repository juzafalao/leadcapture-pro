import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'

const Section = ({ title, children }) => (
  <div className="bg-[#12121a] border border-white/5 rounded-3xl p-8 mb-6">
    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6">{title}</h2>
    {children}
  </div>
)

const Field = ({ label, children }) => (
  <div className="mb-5">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
    {children}
  </div>
)

const inputClass = `
  w-full bg-[#0a0a0b] border border-white/5 rounded-2xl
  px-5 py-3.5 text-sm text-white placeholder:text-gray-700
  focus:outline-none focus:border-[#ee7b4d]/50
  focus:ring-2 focus:ring-[#ee7b4d]/15 transition-all
`

export default function SettingsPage() {
  const { usuario } = useAuth()
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pb-32">
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-8">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-2">
            Configurações <span className="text-[#ee7b4d] font-bold">do Sistema</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#ee7b4d] rounded-full" />
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Personalize sua conta e tenant
            </p>
          </div>
        </motion.div>
      </div>

      <div className="px-4 lg:px-10 max-w-3xl">
        <form onSubmit={handleSave}>
          <Section title="Perfil do usuário">
            <Field label="Nome completo">
              <input className={inputClass} defaultValue={usuario?.nome} placeholder="Seu nome" />
            </Field>
            <Field label="E-mail">
              <input className={inputClass} defaultValue={usuario?.email} type="email" placeholder="email@empresa.com" />
            </Field>
            <Field label="Cargo / Função">
              <div className={`${inputClass} cursor-not-allowed opacity-50`}>
                {usuario?.role || 'Administrador'}
              </div>
            </Field>
          </Section>

          <Section title="Segurança">
            <Field label="Nova senha">
              <input className={inputClass} type="password" placeholder="••••••••" />
            </Field>
            <Field label="Confirmar nova senha">
              <input className={inputClass} type="password" placeholder="••••••••" />
            </Field>
          </Section>

          <Section title="Notificações por e-mail">
            {[
              { id: 'notif_hot',    label: 'Lead Hot capturado',     def: true  },
              { id: 'notif_all',    label: 'Qualquer novo lead',      def: false },
              { id: 'notif_assign', label: 'Lead atribuído a mim',    def: true  },
              { id: 'notif_digest', label: 'Resumo diário (às 08h)',  def: false },
            ].map(({ id, label, def }) => (
              <label key={id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 cursor-pointer">
                <span className="text-sm text-gray-300">{label}</span>
                <div className="relative">
                  <input type="checkbox" id={id} defaultChecked={def} className="sr-only peer" />
                  <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-[#ee7b4d] transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            ))}
          </Section>

          <Section title="Integrações">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: '💬', name: 'WhatsApp',      status: 'Não configurado', color: 'text-yellow-500' },
                { icon: '🔗', name: 'Google Forms',   status: 'Ativo',           color: 'text-green-500'  },
                { icon: '⚡', name: 'n8n Automação',  status: 'Não configurado', color: 'text-yellow-500' },
                { icon: '📧', name: 'SMTP E-mail',    status: 'Simulado',        color: 'text-blue-400'   },
              ].map(({ icon, name, status, color }) => (
                <div key={name} className="flex items-center gap-4 bg-[#0a0a0b] border border-white/5 rounded-2xl p-4">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className={`text-xs font-bold ${color}`}>{status}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full py-4 rounded-2xl font-bold text-sm transition-all
              ${saved
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-[#ee7b4d] to-[#f59e42] text-black'
              }
            `}
          >
            {saved ? '✓ Alterações salvas' : 'Salvar configurações'}
          </motion.button>
        </form>
      </div>
    </div>
  )
}
