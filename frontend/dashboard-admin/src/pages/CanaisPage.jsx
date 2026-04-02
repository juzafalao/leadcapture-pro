// CanaisPage.jsx — SMS / Telegram / Múltiplos Canais
import { motion } from 'framer-motion'

const CANAIS = [
  {
    nome: 'WhatsApp Business',
    emoji: '💬',
    cor: '#25D366',
    desc: 'Qualificação automática de leads via IA',
    status: 'ativo',
    detalhe: 'Evolution API conectada — recebendo mensagens',
    features: ['Boas-vindas automáticas', 'Qualificação por IA', 'Score atualizado em tempo real'],
  },
  {
    nome: 'SMS',
    emoji: '📱',
    cor: '#3B82F6',
    desc: 'Notificações e confirmações por SMS',
    status: 'em-breve',
    detalhe: 'Integração com Twilio / Zenvia planejada',
    features: ['Confirmação de agendamento', 'Alerta de lead quente', 'Follow-up automático'],
  },
  {
    nome: 'Telegram',
    emoji: '✈️',
    cor: '#0088CC',
    desc: 'Bot Telegram para equipe de vendas',
    status: 'em-breve',
    detalhe: 'Bot para notificações instantâneas ao time',
    features: ['Alerta de novo lead', 'Comando /lead para detalhes', 'Relatório diário automático'],
  },
  {
    nome: 'Instagram DM',
    emoji: '📸',
    cor: '#E1306C',
    desc: 'Captação via direct do Instagram',
    status: 'em-breve',
    detalhe: 'Via Meta Business API',
    features: ['Captura de leads por DM', 'Resposta automática', 'Sincronização com CRM'],
  },
  {
    nome: 'Email',
    emoji: '📧',
    cor: '#EE7B4D',
    desc: 'Notificações e templates de e-mail',
    status: 'ativo',
    detalhe: 'SMTP configurado — enviando notificações',
    features: ['Notificação de novo lead', 'Alerta lead quente', 'Templates personalizados'],
  },
  {
    nome: 'Web Push',
    emoji: '🔔',
    cor: '#8B5CF6',
    desc: 'Notificações no navegador',
    status: 'em-breve',
    detalhe: 'Notificações push para a equipe',
    features: ['Lead novo capturado', 'Alerta de lead quente', 'Lembrete de follow-up'],
  },
]

export default function CanaisPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}>
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1">
            Múltiplos <span className="text-[#10B981] font-bold">Canais</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-12 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Alcance seus leads onde eles estão
            </p>
          </div>
        </motion.div>
      </div>

      {/* Status geral */}
      <div className="px-6 lg:px-10 mb-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0F172A] border border-[#10B981]/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-[#10B981]">2</p>
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mt-1">Canais Ativos</p>
          </div>
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-[#F59E0B]">4</p>
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mt-1">Em Breve</p>
          </div>
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">6</p>
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mt-1">Total Planejado</p>
          </div>
        </div>
      </div>

      {/* Grid de canais */}
      <div className="px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CANAIS.map((canal, i) => (
            <motion.div
              key={canal.nome}
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.07 }}
              className={`bg-[#0F172A] border rounded-2xl p-5 relative overflow-hidden ${
                canal.status === 'ativo' ? 'border-white/10' : 'border-white/5'
              }`}
            >
              {/* Badge status */}
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                  canal.status === 'ativo'
                    ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
                    : 'bg-white/5 text-gray-600 border-white/10'
                }`}>
                  {canal.status === 'ativo' ? '● Ativo' : '🚧 Em breve'}
                </span>
              </div>

              {/* Ícone e nome */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${canal.cor}15`, border: `1px solid ${canal.cor}30` }}>
                  {canal.emoji}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{canal.nome}</p>
                  <p className="text-gray-500 text-xs">{canal.desc}</p>
                </div>
              </div>

              {/* Detalhe */}
              <p className="text-[11px] text-gray-600 mb-3 pb-3 border-b border-white/5">{canal.detalhe}</p>

              {/* Features */}
              <div className="space-y-1.5">
                {canal.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{ background: canal.status === 'ativo' ? canal.cor : '#374151' }} />
                    <span className={`text-[11px] ${canal.status === 'ativo' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
