// CRMPage.jsx — Integração CRM (Em Construção)
import { motion } from 'framer-motion'

const CRMS = [
  { nome:'Salesforce',  icon:'☁️', cor:'#00A1E0', desc:'Líder mundial em CRM',           status:'em-breve' },
  { nome:'Pipedrive',   icon:'📊', cor:'#2E4057', desc:'CRM focado em pipeline',          status:'em-breve' },
  { nome:'HubSpot',     icon:'🧡', cor:'#FF7A59', desc:'CRM com automação de marketing',  status:'em-breve' },
  { nome:'RD Station',  icon:'🇧🇷', cor:'#2E9B5B', desc:'CRM líder no Brasil',            status:'em-breve' },
  { nome:'Zoho CRM',    icon:'🔵', cor:'#E42527', desc:'CRM completo e acessível',        status:'em-breve' },
  { nome:'Zapier/N8N',  icon:'⚡', cor:'#FF4A00', desc:'Automação entre plataformas',     status:'parcial'  },
]

export default function CRMPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl lg:text-3xl font-light text-white">
              Integração <span className="text-[#10B981] font-bold">CRM</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
              Em Construção
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Sincronize seus leads com o CRM da sua empresa
            </p>
          </div>
        </motion.div>
      </div>

      {/* Banner */}
      <div className="px-6 lg:px-10 mb-8">
        <div className="bg-gradient-to-r from-[#10B981]/10 to-[#3B82F6]/10 border border-[#10B981]/20 rounded-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="text-4xl">🔗</div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg mb-1">Sincronização bidirecional com seu CRM</h2>
            <p className="text-gray-400 text-sm">
              Em breve você poderá sincronizar leads automaticamente, atualizar status nos dois sistemas
              e ter uma visão unificada do seu pipeline de vendas.
            </p>
          </div>
          <div className="shrink-0">
            <button className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 cursor-not-allowed opacity-60">
              Disponível em breve
            </button>
          </div>
        </div>
      </div>

      {/* Grid de CRMs */}
      <div className="px-6 lg:px-10">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4">Integrações disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {CRMS.map((crm, i) => (
            <motion.div
              key={crm.nome}
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-[#0F172A] border border-white/5 rounded-2xl p-5 flex items-start gap-4"
            >
              <div className="text-3xl">{crm.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-bold text-sm">{crm.nome}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    crm.status === 'parcial'
                      ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20'
                      : 'bg-white/5 text-gray-500 border border-white/10'
                  }`}>
                    {crm.status === 'parcial' ? 'Via Webhook' : 'Em breve'}
                  </span>
                </div>
                <p className="text-gray-500 text-xs">{crm.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* N8N já funciona */}
        <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-2xl">⚡</div>
            <div>
              <h3 className="text-white font-bold mb-1">Integração via N8N já disponível</h3>
              <p className="text-gray-400 text-sm mb-3">
                O LeadCapture Pro já envia leads automaticamente para o N8N via webhook.
                Com o N8N você pode conectar com qualquer CRM, planilha ou sistema.
              </p>
              <a
                href="https://n8n.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30 hover:bg-[#3B82F6]/20 transition-all"
              >
                Ver documentação N8N →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
