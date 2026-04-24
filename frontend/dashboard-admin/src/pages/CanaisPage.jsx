// CanaisPage.jsx — Gestão de canais e webhooks
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'

const API_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

// ── Definição dos canais ──────────────────────────────────
const CANAL_DEF = [
  {
    id: 'whatsapp',
    nome: 'WhatsApp Business',
    cor: '#25D366',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    ),
    desc: 'Receba leads direto pelo WhatsApp via Evolution API',
    webhookKey: 'WHATSAPP_WEBHOOK',
    testable: true,
    features: ['Captura automática de contatos', 'Qualificação por IA', 'Score em tempo real'],
  },
  {
    id: 'email',
    nome: 'Email',
    cor: '#EE7B4D',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 7l-10 7L2 7" />
      </svg>
    ),
    desc: 'Notificações e templates de e-mail para leads e equipe',
    webhookKey: 'EMAIL_SMTP',
    testable: false,
    features: ['Boas-vindas ao lead', 'Alerta lead quente', 'Relatório diário'],
  },
  {
    id: 'n8n',
    nome: 'n8n / Make',
    cor: '#EA580C',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-2.6-5.4l-2.8 2.8m-4.4 4.4l-2.8 2.8m0-10l2.8 2.8m4.4 4.4l2.8 2.8" />
      </svg>
    ),
    desc: 'Integração via workflows de automação — n8n, Make ou Zapier',
    webhookKey: 'N8N_WEBHOOK',
    testable: true,
    features: ['Fluxos automáticos', 'Roteamento inteligente', 'Integração com CRM'],
  },
  {
    id: 'webhook',
    nome: 'API / Webhook',
    cor: '#8B5CF6',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    ),
    desc: 'Endpoint REST para receber leads de qualquer plataforma',
    webhookKey: 'API_KEY',
    testable: true,
    features: ['Endpoint dedicado por tenant', 'Autenticação por API Key', 'Documentação em /api-docs'],
  },
  {
    id: 'instagram',
    nome: 'Instagram DM',
    cor: '#E1306C',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
    desc: 'Captação de leads via Direct do Instagram — Meta Business API',
    webhookKey: null,
    testable: false,
    features: ['Captura por DM', 'Resposta automática', 'Em breve'],
    emBreve: true,
  },
  {
    id: 'telegram',
    nome: 'Telegram Bot',
    cor: '#0088CC',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
      </svg>
    ),
    desc: 'Bot para notificações instantâneas ao time de vendas',
    webhookKey: null,
    testable: false,
    features: ['Alerta de novo lead', 'Relatório diário', 'Em breve'],
    emBreve: true,
  },
]

// ── Status badge ──────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'conectado')
    return <span className="flex items-center gap-1.5 text-[10px] font-black text-[#10B981]"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />Conectado</span>
  if (status === 'erro')
    return <span className="flex items-center gap-1.5 text-[10px] font-black text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Erro</span>
  if (status === 'em-breve')
    return <span className="flex items-center gap-1.5 text-[10px] font-black text-[#F59E0B]"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />Em breve</span>
  return <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-gray-600" />Verificando...</span>
}

// ── Card de canal ─────────────────────────────────────────
function CanalCard({ canal, systemStatus, onTest, testing, testResult, webhookUrl }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const status = canal.emBreve
    ? 'em-breve'
    : systemStatus?.[canal.id] === true
      ? 'conectado'
      : systemStatus?.[canal.id] === false
        ? 'erro'
        : null

  function copyUrl() {
    if (!webhookUrl) return
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#0F172A] rounded-2xl border overflow-hidden transition-all ${
        canal.emBreve ? 'border-white/[0.04] opacity-60' : 'border-white/[0.08] hover:border-white/[0.12]'
      }`}
    >
      {/* Barra colorida */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${canal.cor}, ${canal.cor}40)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${canal.cor}18`, color: canal.cor }}
            >
              {canal.icon}
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">{canal.nome}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{canal.desc}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {canal.features.map((f, i) => (
            <span
              key={i}
              className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: canal.emBreve ? '#ffffff08' : `${canal.cor}12`,
                color: canal.emBreve ? '#475569' : canal.cor,
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Ações */}
        {!canal.emBreve && (
          <div className="space-y-2">
            {/* URL do webhook */}
            {webhookUrl && (
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                <p className="text-[10px] text-gray-500 font-mono flex-1 truncate">{webhookUrl}</p>
                <button
                  onClick={copyUrl}
                  className="text-[9px] font-black px-2 py-1 rounded-lg shrink-0 transition-all"
                  style={{
                    background: copied ? '#10B98120' : `${canal.cor}18`,
                    color: copied ? '#10B981' : canal.cor,
                  }}
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            )}

            {/* Botão testar */}
            {canal.testable && (
              <button
                onClick={() => onTest(canal.id)}
                disabled={testing === canal.id}
                className="w-full py-2 rounded-xl text-[11px] font-bold transition-all border disabled:opacity-50"
                style={{
                  background: testing === canal.id ? `${canal.cor}10` : `${canal.cor}10`,
                  color: canal.cor,
                  borderColor: `${canal.cor}30`,
                }}
              >
                {testing === canal.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    Testando conexão...
                  </span>
                ) : (
                  'Testar Conexão'
                )}
              </button>
            )}

            {/* Resultado do teste */}
            {testResult?.[canal.id] && (
              <div className={`px-3 py-2 rounded-xl text-[10px] font-semibold ${
                testResult[canal.id].ok
                  ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {testResult[canal.id].ok
                  ? `✓ ${testResult[canal.id].msg || 'Conexão bem-sucedida'}`
                  : `✗ ${testResult[canal.id].msg || 'Falha na conexão'}`}
              </div>
            )}
          </div>
        )}

        {canal.emBreve && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/15">
            <span className="text-[10px] text-[#F59E0B]">🚧 Em desenvolvimento — disponível em breve</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Página principal ──────────────────────────────────────
export default function CanaisPage() {
  const { usuario } = useAuth()
  const [systemStatus, setSystemStatus] = useState({})
  const [testing, setTesting]           = useState(null)
  const [testResult, setTestResult]     = useState({})
  const [webhookUrls, setWebhookUrls]   = useState({})
  const [loadingStatus, setLoadingStatus] = useState(true)

  const tenantId = usuario?.tenant_id

  // Carrega status dos serviços e URLs de webhook
  useEffect(() => {
    async function load() {
      setLoadingStatus(true)
      try {
        const r = await fetch(`${API_URL}/api/sistema/status`)
        const d = await r.json()
        setSystemStatus({
          whatsapp: d?.services?.whatsapp?.ok,
          email:    d?.services?.email?.ok,
          n8n:      null,
          webhook:  d?.services?.database?.ok,
        })
      } catch {
        setSystemStatus({})
      }

      // Monta URLs de webhook por tenant
      if (tenantId) {
        const base = API_URL
        setWebhookUrls({
          whatsapp: `${base}/api/whatsapp/webhook`,
          n8n:      `${base}/api/leads/webhook?tenant=${tenantId}`,
          webhook:  `${base}/api/leads/webhook?tenant=${tenantId}`,
        })
      }

      setLoadingStatus(false)
    }
    load()
  }, [tenantId])

  const handleTest = useCallback(async (canalId) => {
    setTesting(canalId)
    setTestResult(prev => ({ ...prev, [canalId]: null }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers = {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      }

      let result = { ok: false, msg: 'Endpoint não disponível' }

      if (canalId === 'whatsapp') {
        const r = await fetch(`${API_URL}/api/sistema/status`, { headers })
        const d = await r.json()
        result = {
          ok:  d?.services?.whatsapp?.ok === true,
          msg: d?.services?.whatsapp?.ok ? 'Evolution API conectada' : 'VPS desconectado — verifique a Evolution API',
        }
      } else if (canalId === 'n8n' || canalId === 'webhook') {
        const url = webhookUrls[canalId]
        if (url) {
          const r = await fetch(url, { method: 'HEAD' }).catch(() => null)
          result = {
            ok:  r !== null,
            msg: r !== null ? 'Endpoint respondendo' : 'Endpoint não alcançável',
          }
        }
      }

      setTestResult(prev => ({ ...prev, [canalId]: result }))
      setSystemStatus(prev => ({ ...prev, [canalId]: result.ok }))
    } catch (e) {
      setTestResult(prev => ({ ...prev, [canalId]: { ok: false, msg: e.message } }))
    }

    setTesting(null)
  }, [webhookUrls])

  const ativos  = CANAL_DEF.filter(c => !c.emBreve)
  const emBreve = CANAL_DEF.filter(c => c.emBreve)
  const totalAtivos = ativos.filter(c => systemStatus[c.id] === true).length

  return (
    <div className="min-h-full bg-[#0B1220] px-4 lg:px-10 py-6 lg:py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10B981" strokeWidth="1.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 1.3h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.91 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Canais</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">Gerencie as integrações de entrada de leads</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Canais Ativos',    value: loadingStatus ? '...' : totalAtivos,             color: 'text-[#10B981]', border: 'border-[#10B981]/15' },
            { label: 'Em Configuração',  value: loadingStatus ? '...' : ativos.length - totalAtivos, color: 'text-[#F59E0B]', border: 'border-white/[0.06]' },
            { label: 'Em Breve',         value: emBreve.length,                                  color: 'text-gray-400',  border: 'border-white/[0.06]' },
          ].map((k, i) => (
            <div key={i} className={`bg-[#0F172A] border ${k.border} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mt-1">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Canais ativos/configuráveis */}
      <div className="mb-3">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-600 mb-3">Canais disponíveis</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ativos.map((canal, i) => (
            <motion.div key={canal.id} transition={{ delay: i * 0.06 }}>
              <CanalCard
                canal={canal}
                systemStatus={systemStatus}
                onTest={handleTest}
                testing={testing}
                testResult={testResult}
                webhookUrl={webhookUrls[canal.id]}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Canais em breve */}
      <div className="mt-6">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-600 mb-3">Em desenvolvimento</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emBreve.map((canal, i) => (
            <motion.div key={canal.id} transition={{ delay: i * 0.06 }}>
              <CanalCard
                canal={canal}
                systemStatus={systemStatus}
                onTest={handleTest}
                testing={testing}
                testResult={testResult}
                webhookUrl={null}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dica de configuração */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-[#0F172A] border border-[#10B981]/15 rounded-2xl p-5"
      >
        <p className="text-[10px] font-black uppercase tracking-wider text-[#10B981] mb-2">Como configurar</p>
        <p className="text-[12px] text-gray-400 leading-relaxed">
          Copie a URL do webhook e configure no painel da plataforma de origem (WhatsApp Business, n8n, Make...).
          Para dúvidas de integração, consulte a <a href="/api-docs" className="text-[#10B981] hover:underline">documentação da API</a> ou
          ajuste os fluxos em <a href="/automacao" className="text-[#10B981] hover:underline">Automação n8n</a>.
        </p>
      </motion.div>
    </div>
  )
}
