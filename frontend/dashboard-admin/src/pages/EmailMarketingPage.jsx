import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'

const API_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

const TEMPLATES_DEF = [
  {
    id: 'boas-vindas',
    nome: 'Boas-vindas ao Lead',
    emoji: '👋',
    desc: 'Enviado automaticamente ao capturar novo lead via landing page',
    automatico: true,
    trigger: 'POST /api/leads',
    triggerDesc: 'Dispara quando um lead é criado via formulário ou webhook',
    locked: true, // não pode ser desativado
  },
  {
    id: 'lead-quente',
    nome: 'Notificação Lead Quente',
    emoji: '🔥',
    desc: 'Disparado quando score ≥ 65 — notifica consultores e diretores',
    automatico: true,
    trigger: 'Score ≥ 65',
    triggerDesc: 'Dispara quando o score do lead atinge 65 pontos',
    locked: false,
  },
  {
    id: 'follow-up-7',
    nome: 'Follow-up 7 dias',
    emoji: '📅',
    desc: 'Lembrete para leads sem contato há 7 dias',
    automatico: false,
    trigger: 'Agendamento automático',
    triggerDesc: 'Agendado diariamente — verifica leads sem atualização há 7 dias',
    locked: false,
  },
  {
    id: 'proposta',
    nome: 'Envio de Proposta',
    emoji: '📄',
    desc: 'Template para envio de proposta comercial personalizada',
    automatico: false,
    trigger: 'Manual',
    triggerDesc: 'Acionado manualmente pelo consultor no card do lead',
    locked: false,
  },
  {
    id: 'reengajamento',
    nome: 'Reengajamento',
    emoji: '💫',
    desc: 'Para leads inativos há mais de 30 dias',
    automatico: false,
    trigger: 'Agendamento automático',
    triggerDesc: 'Verifica leads frios sem interação há 30+ dias',
    locked: false,
  },
  {
    id: 'confirmacao',
    nome: 'Confirmação de Reunião',
    emoji: '📆',
    desc: 'Confirmação automática após agendamento de reunião',
    automatico: false,
    trigger: 'Integração Calendário',
    triggerDesc: 'Integra com Google Calendar ou Calendly (configurar em Automação)',
    locked: false,
  },
]

// ── Toggle switch ─────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-[#10B981]' : 'bg-white/10'}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ── Persistência local das automações ─────────────────────
const STORAGE_KEY_PREFIX = 'lc-email-automacao-'

function loadAtivo(id, defaultVal) {
  try {
    const v = localStorage.getItem(STORAGE_KEY_PREFIX + id)
    return v === null ? defaultVal : v === 'true'
  } catch { return defaultVal }
}

function saveAtivo(id, val) {
  try { localStorage.setItem(STORAGE_KEY_PREFIX + id, String(val)) } catch {}
}

export default function EmailMarketingPage() {
  const { usuario, isPlatformAdmin } = useAuth()
  const [aba, setAba]           = useState('automacoes')
  const [config, setConfig]     = useState(null)
  const [metricas, setMetricas] = useState(null)
  const [testEmail, setTestEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [alerta, setAlerta]     = useState(null)

  // Estado de cada automação (carregado do localStorage)
  const [ativos, setAtivos] = useState(() =>
    Object.fromEntries(
      TEMPLATES_DEF.map(t => [t.id, loadAtivo(t.id, t.id === 'boas-vindas' || t.id === 'lead-quente')])
    )
  )
  const [salvando, setSalvando] = useState(null)

  const tenantId = isPlatformAdmin?.() ? null : usuario?.tenant_id

  useEffect(() => {
    fetch(`${API_URL}/api/sistema/status`)
      .then(r => r.json())
      .then(d => setConfig({
        resend:   !!d.services?.email?.resend_configured,
        smtp:     !!d.services?.email?.smtp_configured,
        from:     d.services?.email?.from || '—',
        notif:    d.services?.email?.notification_email || '—',
        provedor: d.services?.email?.resend_configured ? 'Resend' : d.services?.email?.smtp_configured ? 'Gmail SMTP' : 'Não configurado',
        ok:       d.services?.email?.ok,
      }))
      .catch(() => setConfig({ resend: false, smtp: false, from: '—', notif: '—', provedor: 'Erro', ok: false }))
  }, [])

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
        const rows = data || []
        setMetricas({
          total:        count || rows.length,
          hot:          rows.filter(l => l.categoria === 'hot').length,
          notificacoes: rows.filter(l => (l.score || 0) >= 65).length,
          automaticos:  rows.filter(l => l.categoria !== 'cold').length,
        })
      } catch { setMetricas({ total: 0, hot: 0, notificacoes: 0, automaticos: 0 }) }
    }
    carregarMetricas()
  }, [tenantId])

  function mostrarAlerta(tipo, titulo, msg) {
    setAlerta({ tipo, titulo, msg })
    setTimeout(() => setAlerta(null), 4000)
  }

  // Toggle com persistência
  const handleToggle = useCallback(async (id, novoValor) => {
    setSalvando(id)
    setAtivos(prev => ({ ...prev, [id]: novoValor }))
    saveAtivo(id, novoValor)

    // Tenta salvar no Supabase (graceful fallback)
    try {
      await supabase.from('configuracoes').upsert({
        tenant_id: tenantId,
        chave: `email_automacao_${id}`,
        valor: JSON.stringify(novoValor),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,chave' })
    } catch { /* localStorage já foi salvo */ }

    setTimeout(() => setSalvando(null), 600)
    mostrarAlerta('success', novoValor ? 'Automação ativada' : 'Automação pausada',
      `${TEMPLATES_DEF.find(t => t.id === id)?.nome} foi ${novoValor ? 'ativada' : 'pausada'}.`)
  }, [tenantId])

  async function enviarTeste() {
    if (!testEmail || !testEmail.includes('@')) {
      mostrarAlerta('warn', 'E-mail inválido', 'Informe um e-mail válido para o teste.')
      return
    }
    setEnviando(true)
    try {
      const authH = await getAuthHeader()
      const r = await fetch(`${API_URL}/api/sistema/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({ email: testEmail }),
      })
      const d = await r.json()
      if (d.success) {
        mostrarAlerta('success', 'E-mail enviado!', `Verifique a caixa de ${testEmail}`)
        setTestEmail('')
      } else {
        mostrarAlerta('error', 'Falha no envio', d.error || 'Erro desconhecido')
      }
    } catch (err) {
      mostrarAlerta('error', 'Erro de conexão', err.message)
    } finally { setEnviando(false) }
  }

  const corStatus = config?.ok ? '#10B981' : config?.resend || config?.smtp ? '#F59E0B' : '#EF4444'
  const totalAtivos = Object.values(ativos).filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">

      {/* Toast */}
      <AnimatePresence>
        {alerta && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 max-w-sm">
            <div className={`p-4 rounded-2xl border shadow-2xl ${
              alerta.tipo === 'success' ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' :
              alerta.tipo === 'error'   ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]' :
                                          'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
            }`}>
              <p className="font-bold text-sm">{alerta.titulo}</p>
              <p className="text-xs mt-0.5 opacity-80">{alerta.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
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
          {[
            { label: 'Leads captados (30d)',    valor: metricas?.total,        cor: 'text-[#10B981]' },
            { label: 'Leads HOT',               valor: metricas?.hot,          cor: 'text-[#EF4444]' },
            { label: 'Notificações disparadas', valor: metricas?.notificacoes, cor: 'text-[#F59E0B]' },
            { label: 'Automações ativas',       valor: totalAtivos,            cor: 'text-[#8B5CF6]' },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-2">{m.label}</p>
              <p className={`text-2xl font-black ${m.cor}`}>
                {metricas !== null || m.label === 'Automações ativas'
                  ? (m.valor ?? 0)
                  : <span className="text-gray-700 text-lg animate-pulse">—</span>}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Abas */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="flex gap-1 bg-[#0F172A] border border-white/5 rounded-xl p-1 w-fit">
          {[
            { id: 'automacoes',    label: 'Automações' },
            { id: 'configuracoes', label: 'Configurações' },
          ].map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                aba === a.id ? 'bg-[#10B981] text-black' : 'text-gray-500 hover:text-white'
              }`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 lg:px-10">

        {/* ABA: Automações */}
        {aba === 'automacoes' && (
          <div className="space-y-3">
            {TEMPLATES_DEF.map((t, i) => {
              const isAtivo = ativos[t.id]
              const isSaving = salvando === t.id
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-[#0F172A] border rounded-2xl p-5 transition-all ${
                    isAtivo ? 'border-white/[0.10]' : 'border-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Emoji + info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{t.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-bold text-white">{t.nome}</p>
                          {t.automatico && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                              AUTOMÁTICO
                            </span>
                          )}
                          {t.locked && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500">
                              OBRIGATÓRIO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{t.desc}</p>
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Toggle
                        checked={isAtivo}
                        onChange={(v) => handleToggle(t.id, v)}
                        disabled={t.locked}
                      />
                      <span className={`text-[9px] font-black transition-colors ${
                        isSaving ? 'text-[#F59E0B]' : isAtivo ? 'text-[#10B981]' : 'text-gray-600'
                      }`}>
                        {isSaving ? 'Salvando...' : isAtivo ? '● Ativo' : '○ Inativo'}
                      </span>
                    </div>
                  </div>

                  {/* Trigger info */}
                  <div className={`mt-3 pt-3 border-t border-white/[0.05] flex items-start justify-between gap-3 transition-opacity ${
                    isAtivo ? 'opacity-100' : 'opacity-40'
                  }`}>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-0.5">Trigger</p>
                      <p className="text-[10px] text-gray-400 font-mono">{t.trigger}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{t.triggerDesc}</p>
                    </div>
                    {isAtivo && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-[10px] text-[#10B981] font-semibold">Funcionando</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}

            <p className="text-[10px] text-gray-600 pt-2">
              Os gatilhos automáticos (boas-vindas, lead quente) são executados pelo servidor via n8n.
              Os toggles controlam quais automações estão habilitadas para seu tenant.
            </p>
          </div>
        )}

        {/* ABA: Configurações */}
        {aba === 'configuracoes' && (
          <div className="max-w-lg space-y-5">

            {/* Status provedor */}
            <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4">Status do Provedor</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: corStatus }} />
                <span className="text-sm text-white font-bold">{config?.provedor || '...'}</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Remetente', val: config?.from },
                  { label: 'Notificações vão para', val: config?.notif, hint: 'Variável NOTIFICATION_EMAIL no Vercel' },
                ].map(row => (
                  <div key={row.label}>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{row.label}</p>
                    <div className="bg-[#0B1220] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 font-mono">
                      {row.val || '—'}
                    </div>
                    {row.hint && <p className="text-[10px] text-gray-600 mt-1">{row.hint}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Teste de envio */}
            <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Testar Envio de E-mail</p>
              <p className="text-[10px] text-gray-600 mb-3">Envia um e-mail de teste real para validar a configuração</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && enviarTeste()}
                  placeholder="seu@email.com"
                  className="flex-1 bg-[#0B1220] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50"
                />
                <button onClick={enviarTeste} disabled={enviando}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all disabled:opacity-50 whitespace-nowrap">
                  {enviando ? '⏳' : '📨 Testar'}
                </button>
              </div>
            </div>

            {/* Como configurar */}
            <div className="bg-[#0F172A] border border-[#F59E0B]/20 rounded-2xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-[#F59E0B] mb-3">Como configurar o Resend</p>
              <div className="space-y-2 text-xs text-gray-400">
                <p>1. Crie uma conta gratuita em <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-[#10B981] hover:underline">resend.com</a></p>
                <p>2. Copie a API Key e adicione no Vercel:</p>
                <div className="bg-[#0B1220] rounded-lg px-3 py-2 font-mono text-gray-500 text-[11px]">RESEND_API_KEY = re_xxxxxxxxxxxx</div>
                <p>3. Configure o email de notificação:</p>
                <div className="bg-[#0B1220] rounded-lg px-3 py-2 font-mono text-gray-500 text-[11px]">NOTIFICATION_EMAIL = seu@email.com</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
