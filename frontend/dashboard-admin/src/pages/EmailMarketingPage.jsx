import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'
import { useAlertModal } from '../hooks/useAlertModal'

const API_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

const TEMPLATES = [
  {
    id: 'boas-vindas',
    nome: 'Boas-vindas ao Lead',
    emoji: '👋',
    desc: 'Enviado automaticamente ao capturar novo lead via landing page',
    ativo: true,
    automatico: true,
    trigger: 'POST /api/leads',
  },
  {
    id: 'lead-quente',
    nome: 'Notificação Lead Quente',
    emoji: '🔥',
    desc: 'Disparado quando score >= 65 — notifica consultores e diretores',
    ativo: true,
    automatico: true,
    trigger: 'Score >= 65',
  },
  {
    id: 'follow-up-7',
    nome: 'Follow-up 7 dias',
    emoji: '📅',
    desc: 'Lembrete para leads sem contato há 7 dias',
    ativo: false,
    automatico: false,
    trigger: 'Agendamento automático',
  },
  {
    id: 'proposta',
    nome: 'Envio de Proposta',
    emoji: '📄',
    desc: 'Template para envio de proposta comercial personalizada',
    ativo: false,
    automatico: false,
    trigger: 'Manual',
  },
  {
    id: 'reengajamento',
    nome: 'Reengajamento',
    emoji: '💫',
    desc: 'Para leads inativos há mais de 30 dias',
    ativo: false,
    automatico: false,
    trigger: 'Agendamento automático',
  },
  {
    id: 'confirmacao',
    nome: 'Confirmação de Reunião',
    emoji: '📆',
    desc: 'Confirmação automática após agendamento de reunião',
    ativo: false,
    automatico: false,
    trigger: 'Integração Calendário',
  },
]

export default function EmailMarketingPage() {
  const { usuario, isPlatformAdmin } = useAuth()
  const { alertModal, showAlert } = useAlertModal()
  const [abaAtiva, setAbaAtiva]     = useState('templates')
  const [config, setConfig]         = useState(null)
  const [metricas, setMetricas]     = useState(null)
  const [testEmail, setTestEmail]   = useState('')
  const [enviando, setEnviando]     = useState(false)
  const [statusApi, setStatusApi]   = useState(null)

  const tenantId = isPlatformAdmin() ? null : usuario?.tenant_id

  // Carrega configuração real do backend
  useEffect(() => {
    async function carregarConfig() {
      try {
        const r = await fetch(`${API_URL}/api/sistema/status`)
        const d = await r.json()
        setStatusApi(d)
        setConfig({
          resend:  !!d.services?.email?.resend_configured,
          smtp:    !!d.services?.email?.smtp_configured,
          from:    d.services?.email?.from || 'onboarding@resend.dev',
          notif:   d.services?.email?.notification_email || 'leadcaptureadm@gmail.com',
          provedor: d.services?.email?.resend_configured ? 'Resend' : d.services?.email?.smtp_configured ? 'Gmail SMTP' : 'Não configurado',
        })
      } catch {
        setConfig({
          resend:   false, smtp: false,
          from:     'onboarding@resend.dev',
          notif:    'leadcaptureadm@gmail.com',
          provedor: 'Verificando...',
        })
      }
    }
    carregarConfig()
  }, [])

  // Carrega métricas reais do banco
  useEffect(() => {
    async function carregarMetricas() {
      try {
        const inicio = new Date()
        inicio.setDate(inicio.getDate() - 30)
        let q = supabase
          .from('leads')
          .select('id, score, categoria, created_at', { count: 'exact' })
          .is('deleted_at', null)
          .gte('created_at', inicio.toISOString())
        if (tenantId) q = q.eq('tenant_id', tenantId)
        const { data, count } = await q
        const rows  = data || []
        const total = count || rows.length
        const hot   = rows.filter(l => l.categoria === 'hot').length
        const notif = rows.filter(l => (l.score || 0) >= 65).length
        setMetricas({
          enviados:  total,
          hot,
          notificacoes: notif,
          automaticos: rows.filter(l => l.categoria !== 'cold').length,
        })
      } catch {
        setMetricas({ enviados: 0, hot: 0, notificacoes: 0, automaticos: 0 })
      }
    }
    carregarMetricas()
  }, [tenantId])

  // Envia email de teste
  async function enviarTeste() {
    if (!testEmail || !testEmail.includes('@')) {
      showAlert({ type: 'warning', title: 'E-mail inválido', message: 'Informe um e-mail válido para o teste.' })
      return
    }
    setEnviando(true)
    try {
      const r = await fetch(`${API_URL}/api/sistema/test-email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: testEmail }),
      })
      const d = await r.json()
      if (d.success) {
        showAlert({ type: 'success', title: 'E-mail enviado!', message: `Verifique a caixa de ${testEmail}` })
      } else {
        showAlert({ type: 'error', title: 'Falha no envio', message: d.error || 'Erro desconhecido' })
      }
    } catch (err) {
      showAlert({ type: 'error', title: 'Erro de conexão', message: err.message })
    } finally {
      setEnviando(false)
    }
  }

  const corStatus = config?.resend
    ? '#10B981'
    : config?.smtp
    ? '#F59E0B'
    : '#EF4444'

  const labelStatus = config?.resend
    ? 'Resend — Ativo'
    : config?.smtp
    ? 'Gmail SMTP — Ativo'
    : 'Não configurado'

  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">
      {alertModal}

      {/* Header */}
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

      {/* Métricas reais */}
      <div className="px-6 lg:px-10 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Leads captados (30d)',  valor: metricas?.enviados ?? '—',      cor: 'text-[#10B981]' },
            { label: 'Leads HOT',             valor: metricas?.hot ?? '—',           cor: 'text-[#EF4444]' },
            { label: 'Notificações enviadas', valor: metricas?.notificacoes ?? '—',  cor: 'text-[#F59E0B]' },
            { label: 'Emails automáticos',    valor: metricas?.automaticos ?? '—',   cor: 'text-[#8B5CF6]' },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
              className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-2">{m.label}</p>
              <p className={`text-2xl font-black ${m.cor}`}>
                {metricas ? m.valor : <span className="text-gray-700 text-lg">Carregando...</span>}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Abas */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="flex gap-1 bg-[#0F172A] border border-white/5 rounded-xl p-1 w-fit">
          {['templates', 'campanhas', 'configuracoes'].map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                abaAtiva === aba ? 'bg-[#10B981] text-black' : 'text-gray-500 hover:text-white'
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
            {TEMPLATES.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
                className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.emoji}</span>
                    <div>
                      <p className="text-white font-bold text-sm">{t.nome}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
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
                      {t.ativo ? '● Ativo' : '○ Inativo'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">Trigger:</span>
                  <span className="text-[10px] text-gray-400 font-mono">{t.trigger}</span>
                </div>

                {t.automatico && t.ativo && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[10px] text-[#10B981]">Funcionando automaticamente</span>
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
              Crie campanhas segmentadas por score, marca, região ou status comercial.
              Integração com Resend e templates dinâmicos disponíveis na v2.0.
            </p>
            <div className="flex flex-col items-center gap-3">
              <span className="px-4 py-2 rounded-xl text-sm font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                Em construção — v2.0
              </span>
              <p className="text-xs text-gray-600 max-w-xs">
                Use o N8N conectado via webhook para criar campanhas automatizadas agora mesmo
              </p>
            </div>
          </div>
        )}

        {/* ABA: Configurações */}
        {abaAtiva === 'configuracoes' && (
          <div className="max-w-lg space-y-5">

            {/* Status do provedor */}
            <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4">Status do Provedor</p>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: corStatus }} />
                <span className="text-sm text-white font-bold">{labelStatus}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Remetente</p>
                  <div className="bg-[#0B1220] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-mono">
                    {config?.from || '—'}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Notificações vão para</p>
                  <div className="bg-[#0B1220] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-mono">
                    {config?.notif || '—'}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">Variável: NOTIFICATION_EMAIL no Vercel</p>
                </div>
              </div>
            </div>

            {/* Teste de envio */}
            <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4">Testar Envio</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="flex-1 bg-[#0B1220] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50"
                />
                <button
                  onClick={enviarTeste}
                  disabled={enviando}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all disabled:opacity-50"
                >
                  {enviando ? 'Enviando...' : 'Testar'}
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-2">
                Envia um email de teste para validar a configuração do provedor
              </p>
            </div>

            {/* Instruções de configuração */}
            <div className="bg-[#0F172A] border border-[#F59E0B]/20 rounded-2xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-[#F59E0B] mb-3">Como configurar</p>
              <div className="space-y-2 text-xs text-gray-400">
                <p>1. Acesse <span className="text-[#10B981]">resend.com</span> e crie uma conta gratuita</p>
                <p>2. Copie a API Key e adicione no Vercel:</p>
                <div className="bg-[#0B1220] rounded-lg px-3 py-2 font-mono text-gray-500 text-[11px]">
                  RESEND_API_KEY = re_xxxxxxxxxxxx
                </div>
                <p>3. Para enviar para qualquer email, verifique seu domínio no Resend</p>
                <p>4. Adicione o email de notificação:</p>
                <div className="bg-[#0B1220] rounded-lg px-3 py-2 font-mono text-gray-500 text-[11px]">
                  NOTIFICATION_EMAIL = seu@email.com
                </div>
                <p className="text-gray-600 pt-1">No plano gratuito, emails só chegam ao email da conta Resend</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
