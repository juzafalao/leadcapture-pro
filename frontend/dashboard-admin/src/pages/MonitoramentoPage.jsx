import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'

const API_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

const TIPO_LABEL = {
  'email-boas-vindas-lead':      { label: 'Boas-vindas Lead',  cor: '#3B82F6', icon: '👋' },
  'email-notificacao-interna':   { label: 'Notif. Interna',    cor: '#EE7B4D', icon: '📧' },
  'email-lead-quente':           { label: 'Lead Quente',       cor: '#EF4444', icon: '🔥' },
  'whatsapp':                    { label: 'WhatsApp',          cor: '#25D366', icon: '💬' },
}

function fmtDt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  })
}

export default function MonitoramentoPage() {
  const { usuario, isPlatformAdmin } = useAuth()
  const [logs, setLogs]         = useState([])
  const [status, setStatus]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filtro, setFiltro]     = useState('todos')
  const [testEmail, setTestEmail] = useState('')
  const [testando, setTestando] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const tenantId = isPlatformAdmin() ? null : usuario?.tenant_id

  // Status do sistema
  useEffect(() => {
    fetch(`${API_URL}/api/sistema/status`)
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [])

  // Logs de notificação
  useEffect(() => {
    async function carregarLogs() {
      setLoading(true)
      let q = supabase
        .from('notification_logs')
        .select('*, lead:lead_id(nome, email, score, categoria)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (tenantId) q = q.eq('tenant_id', tenantId)
      if (filtro !== 'todos') q = q.eq('status', filtro)
      const { data } = await q
      setLogs(data || [])
      setLoading(false)
    }
    carregarLogs()

    // Realtime — atualiza ao vivo
    const channel = supabase
      .channel('notification-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notification_logs' }, () => {
        carregarLogs()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tenantId, filtro])

  async function testarEmail() {
    if (!testEmail.includes('@')) return
    setTestando(true)
    setTestResult(null)
    try {
      const r = await fetch(`${API_URL}/api/sistema/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })
      const d = await r.json()
      setTestResult(d)
    } catch (err) {
      setTestResult({ success: false, error: err.message })
    }
    setTestando(false)
  }

  const total    = logs.length
  const sucessos = logs.filter(l => l.status === 'sucesso').length
  const erros    = logs.filter(l => l.status === 'erro').length
  const taxaSucesso = total > 0 ? Math.round((sucessos / total) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}>
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1">
            Monitoramento <span className="text-[#10B981] font-bold">do Sistema</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-12 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Logs em tempo real — emails, notificações e erros
            </p>
          </div>
        </motion.div>
      </div>

      {/* Status dos serviços */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Banco de Dados',
              ok: status?.services?.database?.ok,
              detalhe: status?.services?.database?.ok ? 'Conectado' : status?.services?.database?.error || 'Erro',
            },
            {
              label: 'Email',
              ok: status?.services?.email?.ok,
              detalhe: status?.services?.email?.provedor || 'Verificando...',
            },
            {
              label: 'WhatsApp',
              ok: status?.services?.whatsapp?.ok,
              detalhe: status?.services?.whatsapp?.ok ? 'Evolution API ativa' : 'Desconectado',
            },
            {
              label: 'IA (Anthropic)',
              ok: status?.services?.ai?.ok !== false,
              detalhe: 'Chatbot ativo',
            },
          ].map((s, i) => (
            <div key={i} className={`bg-[#0F172A] border rounded-2xl p-4 ${s.ok ? 'border-[#10B981]/20' : s.ok === false ? 'border-[#EF4444]/20' : 'border-white/5'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${s.ok ? 'bg-[#10B981] animate-pulse' : s.ok === false ? 'bg-[#EF4444]' : 'bg-gray-600'}`} />
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">{s.label}</span>
              </div>
              <p className="text-sm font-bold text-white">{s.ok ? 'Ativo' : s.ok === false ? 'Erro' : '...'}</p>
              <p className="text-[10px] text-gray-600">{s.detalhe}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas de notificações */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">Total (últimas 100)</p>
            <p className="text-2xl font-black text-white">{total}</p>
          </div>
          <div className="bg-[#0F172A] border border-[#10B981]/20 rounded-2xl p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">Sucesso</p>
            <p className="text-2xl font-black text-[#10B981]">{sucessos}</p>
            <p className="text-[10px] text-gray-600">{taxaSucesso}% taxa</p>
          </div>
          <div className="bg-[#0F172A] border border-[#EF4444]/20 rounded-2xl p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">Erros</p>
            <p className="text-2xl font-black text-[#EF4444]">{erros}</p>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-10 flex flex-col lg:flex-row gap-6">

        {/* Logs */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Log de Notificações</h2>
            <div className="flex gap-1">
              {['todos','sucesso','erro'].map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                    filtro === f ? 'bg-[#10B981] text-black' : 'bg-white/5 text-gray-500 hover:text-white'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0F172A] border border-white/5 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-600 text-sm">Carregando logs...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 text-sm">Nenhum log registrado ainda.</p>
                <p className="text-gray-700 text-xs mt-1">Os logs aparecem aqui após a criação de leads.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {logs.map((log, i) => {
                  const tipoInfo = TIPO_LABEL[log.tipo] || { label: log.tipo, cor: '#6366F1', icon: '📩' }
                  return (
                    <motion.div key={log.id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                      className="px-4 py-3 hover:bg-white/2 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-base">{tipoInfo.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">{tipoInfo.label}</span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                log.status === 'sucesso'
                                  ? 'bg-[#10B981]/10 text-[#10B981]'
                                  : 'bg-[#EF4444]/10 text-[#EF4444]'
                              }`}>
                                {log.status === 'sucesso' ? '✓ Enviado' : '✗ Erro'}
                              </span>
                              {log.tentativas > 1 && (
                                <span className="text-[9px] text-[#F59E0B]">{log.tentativas} tentativas</span>
                              )}
                            </div>
                            {log.lead && (
                              <p className="text-[11px] text-gray-500 truncate">
                                {log.lead.nome} · score {log.lead.score}
                              </p>
                            )}
                            {log.erro && (
                              <p className="text-[10px] text-[#EF4444] mt-0.5 truncate" title={log.erro}>{log.erro}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-600 shrink-0">{fmtDt(log.created_at)}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Painel lateral — diagnóstico */}
        <div className="w-full lg:w-72 space-y-4">

          {/* Teste de email */}
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Testar Email Agora</h3>
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="email@teste.com"
              className="w-full bg-[#0B1220] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50 mb-2"
            />
            <button onClick={testarEmail} disabled={testando}
              className="w-full py-2 rounded-xl text-sm font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all disabled:opacity-50">
              {testando ? 'Enviando...' : 'Enviar Teste'}
            </button>
            {testResult && (
              <div className={`mt-2 p-2 rounded-lg text-xs ${testResult.success ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                {testResult.success ? `✓ ${testResult.message}` : `✗ ${testResult.error}`}
              </div>
            )}
          </div>

          {/* Configuração de email */}
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Configuração Email</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Provedor</span>
                <span className="text-white font-bold">{status?.services?.email?.provedor || '...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remetente</span>
                <span className="text-white truncate ml-2 text-right" style={{maxWidth:'140px'}}>{status?.services?.email?.from || '...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Notificações</span>
                <span className="text-white truncate ml-2 text-right" style={{maxWidth:'140px'}}>{status?.services?.email?.notification_email || '...'}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-500">Status</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${status?.services?.email?.ok ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                  {status?.services?.email?.ok ? '● Ativo' : '● Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Links úteis */}
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Links do Sistema</h3>
            <div className="space-y-2">
              {[
                { label: 'Sentry — Erros',    url: 'https://sentry.io' },
                { label: 'Resend — Emails',   url: 'https://resend.com' },
                { label: 'Vercel — Logs',     url: 'https://vercel.com' },
                { label: 'Supabase — Banco',  url: 'https://supabase.com' },
              ].map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between text-xs text-gray-400 hover:text-white transition-colors py-1">
                  <span>{l.label}</span>
                  <span className="text-gray-600">→</span>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
