import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAlertModal } from '../hooks/useAlertModal'

const WORKFLOWS = [
  {
    id: 'boas_vindas',
    icon: '👋',
    title: 'Boas-vindas automáticas',
    desc: 'Envia mensagem de WhatsApp imediatamente após a captura de um novo lead.',
    status: 'ativo',
    gatilho: 'Novo lead criado',
    acoes: ['WhatsApp → Lead', 'E-mail → Admin'],
    execucoes: 142,
  },
  {
    id: 'followup_warm',
    icon: '🌤',
    title: 'Follow-up para leads Warm',
    desc: 'Aguarda 48h e reenvia mensagem para leads Warm que não foram contatados.',
    status: 'pausado',
    gatilho: 'Lead Warm + 48h sem contato',
    acoes: ['WhatsApp → Lead'],
    execucoes: 38,
  },
  {
    id: 'qualificacao_ia',
    icon: '🤖',
    title: 'Qualificação com IA',
    desc: 'Analisa a mensagem do lead com GPT e recalcula score + categoria automaticamente.',
    status: 'configurando',
    gatilho: 'Lead com mensagem_original preenchida',
    acoes: ['GPT → Score', 'GPT → Categoria', 'Notifica operador'],
    execucoes: 0,
  },
  {
    id: 'alerta_hot',
    icon: '🔥',
    title: 'Alerta de lead HOT',
    desc: 'Notifica o gestor no Telegram instantaneamente quando um lead Hot é capturado.',
    status: 'ativo',
    gatilho: 'Lead com categoria = hot',
    acoes: ['Telegram → Gestor', 'E-mail → Gestor'],
    execucoes: 21,
  },
  {
    id: 'crm_sync',
    icon: '🔗',
    title: 'Sincronização com CRM',
    desc: 'Exporta leads convertidos automaticamente para o CRM configurado (Pipedrive, RD Station).',
    status: 'configurando',
    gatilho: 'Lead com status = convertido',
    acoes: ['API → CRM externo'],
    execucoes: 0,
  },
]

const STATUS_CONFIG = {
  ativo:        { label: 'Ativo',         bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30'  },
  pausado:      { label: 'Pausado',        bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  configurando: { label: 'Configurando',   bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30'   },
}

export default function AutomacaoPage() {
  const { alertModal, showAlert } = useAlertModal()
  const [apiStatus, setApiStatus] = useState(null)

  useEffect(() => {
    fetch('/api/sistema/status')
      .then(r => r.json())
      .then(setApiStatus)
      .catch(() => setApiStatus(null))
  }, [])

  return (
    <div className="min-h-screen bg-[#0B1220] text-white pb-32">

      {/* Header */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-8">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-2">
            Centro de <span className="text-[#10B981] font-bold">Automação</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Workflows n8n · WhatsApp · IA
            </p>
          </div>
        </motion.div>
      </div>

      {/* Status dos Serviços */}
      <div className="px-4 lg:px-10 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: '⚡',
              label: 'n8n Automação',
              value: 'http://localhost:5678',
              status: 'Não configurado',
              color: 'text-yellow-400',
            },
            {
              icon: '💬',
              label: 'Evolution API (WhatsApp)',
              value: apiStatus?.services?.whatsapp?.info?.status ?? '—',
              status: apiStatus?.services?.whatsapp?.ok ? 'Conectado' : 'Não configurado',
              color: apiStatus?.services?.whatsapp?.ok ? 'text-green-400' : 'text-yellow-400',
            },
            {
              icon: '📧',
              label: 'E-mail SMTP',
              value: apiStatus?.services?.email?.configurado ? 'Configurado' : 'Modo simulado',
              status: apiStatus?.services?.email?.configurado ? 'Ativo' : 'Simulado',
              color: apiStatus?.services?.email?.configurado ? 'text-green-400' : 'text-blue-400',
            },
          ].map(({ icon, label, value, status, color }) => (
            <div key={label} className="bg-[#0F172A] border border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-black uppercase tracking-wider text-gray-500">{label}</span>
              </div>
              <p className="text-sm text-gray-300 mb-1 truncate">{value}</p>
              <p className={`text-xs font-bold ${color}`}>{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Workflows */}
      <div className="px-4 lg:px-10">
        <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-5">
          Workflows disponíveis
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {WORKFLOWS.map((wf, i) => {
            const s = STATUS_CONFIG[wf.status]
            return (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-[#0F172A] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#10B981]/08 rounded-2xl flex items-center justify-center text-2xl">
                      {wf.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{wf.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{wf.execucoes} execuções</p>
                    </div>
                  </div>
                  <span className={`
                    text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border
                    ${s.bg} ${s.text} ${s.border} whitespace-nowrap
                  `}>
                    {s.label}
                  </span>
                </div>

                <p className="text-sm text-gray-400 mb-5 leading-relaxed">{wf.desc}</p>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 w-16">Gatilho</span>
                    <span className="text-xs text-[#10B981] bg-[#10B981]/08 px-3 py-1 rounded-full">
                      {wf.gatilho}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 w-16 mt-1">Ações</span>
                    <div className="flex flex-wrap gap-1.5">
                      {wf.acoes.map(a => (
                        <span key={a} className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 transition-all"
                    onClick={() => showAlert({ type: 'info', title: 'n8n', message: 'Abra o painel do n8n para configurar este workflow.' })}
                  >
                    Configurar no n8n
                  </button>
                  {wf.status === 'ativo' && (
                    <button className="py-2.5 px-4 text-xs font-bold rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-all">
                      Pausar
                    </button>
                  )}
                  {wf.status === 'pausado' && (
                    <button className="py-2.5 px-4 text-xs font-bold rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all">
                      Ativar
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Call-to-action n8n */}
        <div className="mt-8 bg-gradient-to-r from-[#10B981]/10 to-[#059669]/05 border border-[#10B981]/20 rounded-3xl p-8 text-center">
          <p className="text-3xl mb-3">⚡</p>
          <h3 className="font-bold text-white mb-2">n8n ainda não configurado?</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            Suba o Docker Compose e acesse <strong className="text-white">localhost:5678</strong> para configurar
            seus workflows. Templates prontos estão disponíveis na pasta <code className="text-[#10B981]">automacao/workflows/</code>.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="http://localhost:5678"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#10B981] text-black font-bold text-sm rounded-xl hover:opacity-85 transition-all"
            >
              Abrir n8n
            </a>
            <button
              onClick={() => showAlert({ type: 'info', title: 'Comando Docker', message: 'docker compose -f docker/docker-compose.yml up -d' })}
              className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-all"
            >
              Ver comando Docker
            </button>
          </div>
        </div>
      </div>
      {alertModal}
    </div>
  )
}
