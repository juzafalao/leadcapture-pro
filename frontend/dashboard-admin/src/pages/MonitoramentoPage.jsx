import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'

const API_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

const TIPO_LABEL = {
  'email-boas-vindas-lead':    { label: 'Boas-vindas Lead',  cor: '#3B82F6', icon: '👋' },
  'email-notificacao-interna': { label: 'Notif. Interna',    cor: '#EE7B4D', icon: '📧' },
  'email-lead-quente':         { label: 'Lead Quente',       cor: '#EF4444', icon: '🔥' },
  'whatsapp':                  { label: 'WhatsApp',          cor: '#25D366', icon: '💬' },
}

function fmtDt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  })
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

export default function MonitoramentoPage() {
  const { usuario, isPlatformAdmin } = useAuth()
  const [logs, setLogs]           = useState([])
  const [status, setStatus]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [filtro, setFiltro]       = useState('todos')
  const [testEmail, setTestEmail] = useState('')
  const [testando, setTestando]   = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const tenantId = isPlatformAdmin?.() ? null : usuario?.tenant_id

  async function carregarStatus() {
    try {
      const r = await fetch(`${API_URL}/api/sistema/status`)
      const d = await r.json()
      setStatus(d)
    } catch { setStatus(null) }
  }

  async function carregarLogs() {
    setLoading(true)
    try {
      let q = supabase
        .from('notification_logs')
        .select('*, lead:lead_id(nome, email, score, categoria)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (tenantId) q = q.eq('tenant_id', tenantId)
      if (filtro !== 'todos') q = q.eq('status', filtro)
      const { data } = await q
      setLogs(data || [])
    } catch { setLogs([]) }
    setLoading(false)
  }

  useEffect(() => { carregarStatus() }, [])

  useEffect(() => {
    carregarLogs()
    const channel = supabase
      .channel('notification-logs-monitor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notification_logs' }, () => {
        carregarLogs()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tenantId, filtro])

  async function refresh() {
    setRefreshing(true)
    await Promise.all([carregarStatus(), carregarLogs()])
    setRefreshing(false)
  }

  async function testarEmail() {
    if (!testEmail.includes('@')) {
      setTestResult({ success: false, error: 'Informe um e-mail válido' })
      return
    }
    setTestando(true)
    setTestResult(null)
    try {
      const authH = await getAuthHeader()
      const r = await fetch(`${API_URL}/api/sistema/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authH },
        body: JSON.stringify({ email: testEmail }),
      })
      const d = await r.json()
      setTestResult(d)
    } catch (err) {
      setTestResult({ success: false, error: err.message })
    }
    setTestando(false)
  }

  const total      = logs.length
  const sucessos   = logs.filter(l => l.status === 'sucesso').length
  const erros      = logs.filter(l => l.status === 'erro').length
  const taxaSucesso = total > 0 ? Math.round((sucessos / total) * 100) : 0

  const svcs = [
    { label: 'Banco de Dados', ok: status?.services?.database?.ok,
      detalhe: status?.services?.database?.ok ? 'Supabase conectado' : (status?.services?.database?.error || 'Verificando...'), icon: '🗄️' },
    { label: 'Email', ok: status?.services?.email?.ok,
      detalhe: status?.services?.email?.ok ? `${status?.services?.email?.provedor} — ${status?.services?.email?.from}` : 'Sem provedor configurado', icon: '📧' },
    { label: 'WhatsApp', ok: status?.services?.whatsapp?.ok,
      detalhe: status?.services?.whatsapp?.ok ? 'Evolution API ativa' : 'VPS desconectado', icon: '💬' },
    { label: 'IA (Anthropic)', ok: true,
      detalhe: 'Chatbot operacional', icon: '🤖' },
  ]

  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
          className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl lg:text-4xl font-light text-white mb-1">
              Monitoramento <span className="text-[#10B981] font-bold">do Sistema</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-12 h-0.5 bg-[#10B981] rounded-full" />
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
                Logs em tempo real — emails, notificações e erros
              </p>
            </div>
          </div>
          <button onClick={refresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 border border-white/5">
            <span className={refreshing ? 'animate-spin' : ''}>↻</span>
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </motion.div>
      </div>

      {/* Status dos serviços */}
      <div className="px-6 lg:px-10 mb-6">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-3">Status dos Serviços</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {svcs.map((s, i) => (
            <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
              className={`bg-[#0F172A] border rounded-2xl p-4 ${
                s.ok === true  ? 'border-[#10B981]/20' :
                s.ok === false ? 'border-[#EF4444]/20' : 'border-white/5'
              }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{s.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  s.ok === true ? 'bg-[#10B981] animate-pulse' :
                  s.ok === false ? 'bg-[#EF4444]' : 'bg-gray-600'
                }`} />
                <p className="text-xs font-bold text-white">{s.ok === true ? 'Ativo' : s.ok === false ? 'Erro' : '...'}</p>
              </div>
              <p className="text-[10px] text-gray-600 mt-1 truncate" title={s.detalhe}>{s.detalhe}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Métricas */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total (últimas 100)', valor: total, cor: 'text-white' },
            { label: `Sucesso — ${taxaSucesso}%`, valor: sucessos, cor: 'text-[#10B981]' },
            { label: 'Erros', valor: erros, cor: 'text-[#EF4444]' },
          ].map((m, i) => (
            <div key={i} className={`bg-[#0F172A] border rounded-2xl p-4 ${
              i===1 ? 'border-[#10B981]/20' : i===2 && erros>0 ? 'border-[#EF4444]/20' : 'border-white/5'
            }`}>
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">{m.label}</p>
              <p className={`text-3xl font-black ${m.cor}`}>{m.valor}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 lg:px-10 flex flex-col lg:flex-row gap-6">
        {/* Log de notificações */}
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
              <div className="p-8 text-center">
                <div className="animate-spin text-3xl mb-3">⏳</div>
                <p className="text-gray-600 text-sm">Carregando logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-500 text-sm font-bold mb-1">Nenhum log registrado ainda</p>
                <p className="text-gray-700 text-xs max-w-xs mx-auto">
                  Os logs aparecem aqui após a criação de leads. Crie um lead via landing page para ver os logs aparecerem em tempo real.
                </p>
                <p className="text-gray-700 text-xs mt-2">
                  Certifique-se que a tabela <code className="text-[#10B981]">notification_logs</code> foi criada no Supabase.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {logs.map((log) => {
                  const info = TIPO_LABEL[log.tipo] || { label: log.tipo, cor: '#6366F1', icon: '📩' }
                  return (
                    <motion.div key={log.id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                      className="px-4 py-3 hover:bg-white/2 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-base shrink-0">{info.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">{info.label}</span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                log.status === 'sucesso'
                                  ? 'bg-[#10B981]/10 text-[#10B981]'
                                  : 'bg-[#EF4444]/10 text-[#EF4444]'
                              }`}>
                                {log.status === 'sucesso' ? '✓ Enviado' : '✗ Erro'}
                              </span>
                              {log.tentativas > 1 && (
                                <span className="text-[9px] text-[#F59E0B]">{log.tentativas} tent.</span>
                              )}
                            </div>
                            {log.lead && (
                              <p className="text-[11px] text-gray-500 truncate">
                                {log.lead.nome} · score {log.lead.score} · {log.lead.categoria?.toUpperCase()}
                              </p>
                            )}
                            {log.destinatario && (
                              <p className="text-[10px] text-gray-600 truncate">→ {log.destinatario}</p>
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

        {/* Painel lateral */}
        <div className="w-full lg:w-72 space-y-4">

          {/* Testar email */}
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Testar Email Agora</h3>
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && testarEmail()}
              placeholder="email@teste.com"
              className="w-full bg-[#0B1220] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50 mb-2"
            />
            <button onClick={testarEmail} disabled={testando}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {testando ? (
                <><span className="animate-spin">⏳</span> Enviando...</>
              ) : (
                <><span>📨</span> Enviar Teste</>
              )}
            </button>
            {testResult && (
              <div className={`mt-2 p-3 rounded-xl text-xs ${
                testResult.success ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
              }`}>
                {testResult.success ? `✓ ${testResult.message}` : `✗ ${testResult.error}`}
              </div>
            )}
          </div>

          {/* Config email */}
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Configuração Email</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { k: 'Provedor',      v: status?.services?.email?.provedor },
                { k: 'Remetente',     v: status?.services?.email?.from },
                { k: 'Notificações',  v: status?.services?.email?.notification_email },
              ].map(row => (
                <div key={row.k}>
                  <span className="text-gray-600 uppercase tracking-wider text-[9px]">{row.k}</span>
                  <p className="text-gray-300 font-mono text-[11px] mt-0.5 truncate">{row.v || '...'}</p>
                </div>
              ))}
              <div className="pt-1">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  status?.services?.email?.ok ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                }`}>
                  {status?.services?.email?.ok ? '● Ativo' : '● Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Painéis Externos</h3>
            <div className="space-y-1.5">
              {[
                { label: 'Sentry — Erros',   url: 'https://sentry.io',      icon: '🔴' },
                { label: 'Resend — Emails',  url: 'https://resend.com',     icon: '📨' },
                { label: 'Vercel — Logs',    url: 'https://vercel.com',     icon: '▲' },
                { label: 'Supabase — Banco', url: 'https://supabase.com',   icon: '🗄️' },
              ].map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-xs text-gray-400 hover:text-white transition-colors py-1.5 border-b border-white/5 last:border-0 group">
                  <span>{l.icon}</span>
                  <span className="flex-1">{l.label}</span>
                  <span className="text-gray-700 group-hover:text-gray-400 transition-colors">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* SQL para criar tabela */}
          <div className="bg-[#0F172A] border border-[#F59E0B]/20 rounded-2xl p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#F59E0B] mb-2">Tabela notification_logs</h3>
            <p className="text-[10px] text-gray-500 mb-2">
              Se os logs não aparecem, execute este SQL no Supabase:
            </p>
            <div className="bg-[#0B1220] rounded-lg p-2 text-[9px] font-mono text-gray-500 overflow-auto">
              CREATE TABLE IF NOT EXISTS notification_logs (
              id UUID DEFAULT uuid_generate_v4(),
              tenant_id UUID, lead_id UUID,
              tipo TEXT, status TEXT,
              destinatario TEXT, erro TEXT,
              tentativas INT DEFAULT 1,
              created_at TIMESTAMPTZ DEFAULT NOW()
              );
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
