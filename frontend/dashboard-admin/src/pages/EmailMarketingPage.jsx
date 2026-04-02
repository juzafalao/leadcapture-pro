// EmailMarketingPage.jsx — Email Marketing
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'

const TEMPLATES = [
  { id:'boas-vindas',   nome:'Boas-vindas ao Lead',       emoji:'👋', desc:'Enviado automaticamente ao capturar novo lead',         ativo:true,  automatico:true  },
  { id:'lead-quente',   nome:'Notificação Lead Quente',    emoji:'🔥', desc:'Enviado quando score >= 65 para consultores',           ativo:true,  automatico:true  },
  { id:'follow-up-7',   nome:'Follow-up 7 dias',           emoji:'📅', desc:'Lembrete para leads sem contato há 7 dias',             ativo:false, automatico:false },
  { id:'proposta',      nome:'Envio de Proposta',          emoji:'📄', desc:'Template para envio de proposta comercial',             ativo:false, automatico:false },
  { id:'reengajamento', nome:'Reengajamento',              emoji:'💫', desc:'Para leads inativos há mais de 30 dias',                ativo:false, automatico:false },
  { id:'confirmacao',   nome:'Confirmação de Reunião',     emoji:'📆', desc:'Confirmação automática após agendamento',               ativo:false, automatico:false },
]

const METRICAS_MOCK = [
  { label:'E-mails enviados (30d)', valor:'247',   cor:'text-[#10B981]' },
  { label:'Taxa de abertura',       valor:'38%',   cor:'text-[#3B82F6]' },
  { label:'Taxa de clique',         valor:'12%',   cor:'text-[#8B5CF6]' },
  { label:'Leads engajados',        valor:'94',    cor:'text-[#F59E0B]' },
]

export default function EmailMarketingPage() {
  const { usuario } = useAuth()
  const [abaAtiva, setAbaAtiva] = useState('templates')

  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}>
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1">
            Email <span className="text-[#10B981] font-bold">Marketing</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-12 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Automação e templates de comunicação com leads
            </p>
          </div>
        </motion.div>
      </div>

      {/* Métricas */}
      <div className="px-6 lg:px-10 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICAS_MOCK.map((m,i) => (
            <motion.div key={i} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-2">{m.label}</p>
              <p className={`text-2xl font-black ${m.cor}`}>{m.valor}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Abas */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="flex gap-1 bg-[#0F172A] border border-white/5 rounded-xl p-1 w-fit">
          {['templates','campanhas','configuracoes'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                abaAtiva === aba
                  ? 'bg-[#10B981] text-black'
                  : 'text-gray-500 hover:text-white'
              }`}>
              {aba === 'configuracoes' ? 'Configurações' : aba.charAt(0).toUpperCase() + aba.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 lg:px-10">

        {/* ABA: Templates */}
        {abaAtiva === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((t,i) => (
              <motion.div key={t.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.emoji}</span>
                    <div>
                      <p className="text-white font-bold text-sm">{t.nome}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {t.automatico && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                        Automático
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                      t.ativo
                        ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
                        : 'bg-white/5 text-gray-500 border-white/10'
                    }`}>
                      {t.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                {!t.automatico && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                    <button className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-not-allowed opacity-50">
                      Editar template
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 cursor-not-allowed opacity-50">
                      Ativar
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* ABA: Campanhas */}
        {abaAtiva === 'campanhas' && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-white font-bold text-xl mb-2">Campanhas de e-mail</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              Crie campanhas de e-mail segmentadas por score, marca, região ou status comercial.
              Disponível na próxima versão.
            </p>
            <span className="px-4 py-2 rounded-xl text-sm font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
              🚧 Em construção
            </span>
          </div>
        )}

        {/* ABA: Configurações */}
        {abaAtiva === 'configuracoes' && (
          <div className="max-w-lg">
            <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6 space-y-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Remetente</p>
                <div className="bg-[#0B1220] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300">
                  LeadCapture Pro &lt;noreply@leadcapture.com.br&gt;
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">E-mail de notificações</p>
                <div className="bg-[#0B1220] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300">
                  leadcaptureadm@gmail.com
                </div>
                <p className="text-[10px] text-gray-600 mt-1">Configurado via variável de ambiente NOTIFICATION_EMAIL</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Provedor SMTP</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-sm text-gray-300">Gmail SMTP — Ativo</span>
                </div>
                <p className="text-[10px] text-gray-600 mt-1">Para melhor entregabilidade, considere migrar para SendGrid ou Resend</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
