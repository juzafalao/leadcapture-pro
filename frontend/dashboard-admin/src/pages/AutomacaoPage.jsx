import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import { useAlertModal } from '../hooks/useAlertModal'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import AutomacaoModal from '../components/automacao/AutomacaoModal'
import ExecucoesDrawer from '../components/automacao/ExecucoesDrawer'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')

const GATILHO_LABELS = {
  lead_criado:           'Novo lead criado',
  lead_hot:              'Lead categorizado como HOT',
  lead_warm_sem_contato: 'Lead Warm sem contato',
  lead_convertido:       'Lead convertido',
  lead_mensagem_recebida:'Mensagem do lead recebida',
  agendamento_cron:      'Agendamento programado',
  manual:                'Execução manual',
}

const ACAO_TIPO_LABELS = {
  whatsapp:   '💬 WhatsApp',
  email:      '📧 E-mail',
  notificacao:'🔔 Notificação',
  api:        '🔗 API Externa',
}

const DESTINO_LABELS = {
  lead:      'Lead',
  admin:     'Admin',
  gestor:    'Gestor',
  consultor: 'Consultor',
}

const STATUS_CONFIG = {
  ativo:        { label: 'Ativo',   bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30'  },
  pausado:      { label: 'Pausado', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  configurando: { label: 'Config.', bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30'   },
}

const LOG_TIPOS = {
  'email-boas-vindas-lead':    { label: 'Boas-vindas ao lead',   icon: '👋', color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  'email-notificacao-interna': { label: 'Notificação interna',   icon: '🔔', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  'email-lead-quente':         { label: 'Lead Quente detectado', icon: '🔥', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  'whatsapp-boas-vindas':      { label: 'WhatsApp boas-vindas',  icon: '💬', color: 'text-green-400',  bg: 'bg-green-500/10'  },
}

function fmtRelativo(ts) {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return `${s}s atrás`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h atrás`
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function ActivityFeed({ tenantId }) {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [newIds, setNewIds]   = useState(new Set())
  const debounceRef           = useRef(null)

  const fetchLogs = useCallback(async () => {
    if (!tenantId) return
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - 30)
    const { data } = await supabase
      .from('notification_logs')
      .select('id, tipo, status, erro, created_at, lead_id')
      .eq('tenant_id', tenantId)
      .gte('created_at', inicio.toISOString())
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setLogs(data)
    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (!tenantId) return
    const ch = supabase
      .channel(`notif-logs-${tenantId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_logs',
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => {
        const novo = payload.new
        setLogs(prev => [novo, ...prev].slice(0, 30))
        setNewIds(prev => new Set([...prev, novo.id]))
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setNewIds(new Set()), 3000)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch); clearTimeout(debounceRef.current) }
  }, [tenantId])

  const totalMes    = logs.length
  const totalSucesso= logs.filter(l => l.status === 'sucesso').length
  const taxaSucesso = totalMes > 0 ? Math.round((totalSucesso / totalMes) * 100) : 100
  const ultimoLog   = logs[0]

  return (
    <div className="px-4 lg:px-10 mb-10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Atividade Recente</p>
        <div className="flex items-center gap-2">
          {ultimoLog && (
            <span className="text-[10px] text-gray-600">Última: {fmtRelativo(ultimoLog.created_at)}</span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse inline-block" />
            <span className="text-[10px] text-[#10B981] font-semibold">ao vivo</span>
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Disparos (30d)', valor: totalMes,    cor: 'text-[#10B981]' },
          { label: 'Taxa de sucesso',valor: `${taxaSucesso}%`, cor: taxaSucesso >= 90 ? 'text-[#10B981]' : 'text-[#F59E0B]' },
          { label: 'Erros',         valor: totalMes - totalSucesso, cor: (totalMes - totalSucesso) > 0 ? 'text-red-400' : 'text-gray-500' },
        ].map((s, i) => (
          <div key={i} className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.cor}`}>{s.valor}</p>
          </div>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner fullScreen={false} /></div>
      ) : logs.length === 0 ? (
        <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3 opacity-30">📭</p>
          <p className="text-sm text-gray-500">Nenhuma atividade nos últimos 30 dias</p>
          <p className="text-xs text-gray-600 mt-1">Os disparos aparecerão aqui assim que leads chegarem</p>
        </div>
      ) : (
        <div className="bg-[#0F172A] border border-white/5 rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {logs.slice(0, 15).map((log) => {
              const t    = LOG_TIPOS[log.tipo] || { label: log.tipo, icon: '⚡', color: 'text-gray-400', bg: 'bg-white/5' }
              const isNew = newIds.has(log.id)
              return (
                <AnimatePresence key={log.id}>
                  <motion.div
                    initial={isNew ? { opacity: 0, x: -8 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${isNew ? 'bg-[#10B981]/5' : ''}`}
                  >
                    <span className={`text-sm shrink-0 w-7 h-7 rounded-xl flex items-center justify-center ${t.bg}`}>
                      {t.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-semibold ${t.color}`}>{t.label}</p>
                      {log.status === 'erro' && log.erro && (
                        <p className="text-[10px] text-red-400/70 truncate">{log.erro}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        log.status === 'sucesso'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {log.status === 'sucesso' ? '✓' : '✗'}
                      </span>
                      <span className="text-[10px] text-gray-600">{fmtRelativo(log.created_at)}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AutomacaoPage() {
  const { usuario }                   = useAuth()
  const { alertModal, showAlert }     = useAlertModal()
  const [workflows, setWorkflows]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [apiStatus, setApiStatus]     = useState(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [selectedWf, setSelectedWf]   = useState(null)
  const [drawerWf, setDrawerWf]       = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/sistema/status`)
      .then(r => r.json())
      .then(setApiStatus)
      .catch(() => setApiStatus(null))
  }, [])

  const fetchWorkflows = useCallback(async () => {
    if (!usuario?.tenant_id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('automacoes')
      .select('*')
      .eq('tenant_id', usuario.tenant_id)
      .order('created_at', { ascending: false })
    if (!error && data) setWorkflows(data)
    else if (error) showAlert({ type: 'error', title: 'Erro', message: error.message })
    setLoading(false)
  }, [usuario?.tenant_id])

  useEffect(() => { fetchWorkflows() }, [fetchWorkflows])

  const handleOpenModal  = (wf = null) => { setSelectedWf(wf); setModalOpen(true) }
  const handleCloseModal = () => { setModalOpen(false); setSelectedWf(null) }
  const handleSave       = () => { handleCloseModal(); fetchWorkflows() }

  const handleToggleStatus = async (wf) => {
    const newStatus = wf.status === 'ativo' ? 'pausado' : 'ativo'
    const { error } = await supabase.from('automacoes').update({ status: newStatus }).eq('id', wf.id)
    if (error) showAlert({ type: 'error', title: 'Erro', message: error.message })
    else setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, status: newStatus } : w))
  }

  const handleDelete = async (wf) => {
    showAlert({
      type: 'confirm',
      title: 'Excluir workflow',
      message: `Deseja excluir "${wf.nome}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        const { error } = await supabase.from('automacoes').delete().eq('id', wf.id)
        if (error) showAlert({ type: 'error', title: 'Erro', message: error.message })
        else setWorkflows(prev => prev.filter(w => w.id !== wf.id))
      },
    })
  }

  const servicosStatus = [
    {
      icon: '💬',
      label: 'WhatsApp (Evolution API)',
      value: apiStatus?.services?.whatsapp?.info?.status ?? (apiStatus ? 'Não conectado' : '...'),
      status: apiStatus?.services?.whatsapp?.ok ? 'Conectado' : 'Não configurado',
      color:  apiStatus?.services?.whatsapp?.ok ? 'text-green-400' : 'text-yellow-400',
    },
    {
      icon: '📧',
      label: 'E-mail',
      value: apiStatus?.services?.email?.configurado
        ? (apiStatus.services.email.resend_configured ? 'Resend' : 'SMTP')
        : (apiStatus ? 'Modo simulado' : '...'),
      status: apiStatus?.services?.email?.configurado ? 'Ativo' : 'Simulado',
      color:  apiStatus?.services?.email?.configurado ? 'text-green-400' : 'text-blue-400',
    },
    {
      icon: '🤖',
      label: 'Agente Z (IA)',
      value: apiStatus?.agente?.nome ?? (apiStatus ? 'Não configurado' : '...'),
      status: apiStatus?.agente?.enabled ? 'Ativo' : 'Desabilitado',
      color:  apiStatus?.agente?.enabled ? 'text-green-400' : 'text-gray-500',
    },
  ]

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
              Workflows · WhatsApp · E-mail · IA
            </p>
          </div>
        </motion.div>
      </div>

      {/* Status dos Serviços */}
      <div className="px-4 lg:px-10 mb-8">
        <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Status dos Serviços</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {servicosStatus.map(({ icon, label, value, status, color }) => (
            <div key={label} className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{icon}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">{label}</span>
              </div>
              <p className="text-sm text-gray-300 mb-1 truncate font-medium">{value}</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                  color.includes('green') ? 'bg-green-400' : color.includes('yellow') ? 'bg-yellow-400' : color.includes('blue') ? 'bg-blue-400' : 'bg-gray-600'
                }`} />
                <p className={`text-xs font-bold ${color}`}>{status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed de Atividade */}
      {usuario?.tenant_id && (
        <ActivityFeed tenantId={usuario.tenant_id} />
      )}

      {/* Workflows */}
      <div className="px-4 lg:px-10">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Meus Workflows</p>
          <button
            onClick={() => handleOpenModal(null)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/20 transition-all"
          >
            + Novo Workflow
          </button>
        </div>

        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : workflows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-[#0F172A] border border-white/5 rounded-3xl"
          >
            <p className="text-5xl mb-4 opacity-20">⚡</p>
            <p className="text-lg text-gray-400 mb-1">Nenhum workflow ainda</p>
            <p className="text-sm text-gray-600 mb-6">Crie automações para disparar WhatsApp, e-mail e notificações automaticamente</p>
            <button
              onClick={() => handleOpenModal(null)}
              className="px-6 py-3 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#059669] transition-all"
            >
              + Criar Primeiro Workflow
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {workflows.map((wf, i) => {
              const s     = STATUS_CONFIG[wf.status] || STATUS_CONFIG.configurando
              const acoes = Array.isArray(wf.acoes) ? wf.acoes : []
              return (
                <motion.div
                  key={wf.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`bg-[#0F172A] border rounded-3xl p-6 hover:border-white/10 transition-all ${
                    wf.status === 'ativo' ? 'border-white/[0.08]' : 'border-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl relative ${
                        wf.status === 'ativo' ? 'bg-[#10B981]/10' : 'bg-white/5'
                      }`}>
                        {wf.emoji || '⚡'}
                        {wf.status === 'ativo' && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#0B1220]" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{wf.nome}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{wf.total_execucoes ?? 0} execuções</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${s.bg} ${s.text} ${s.border} whitespace-nowrap`}>
                      {s.label}
                    </span>
                  </div>

                  {wf.descricao && (
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">{wf.descricao}</p>
                  )}

                  <div className="space-y-2 mb-5">
                    {wf.gatilho_tipo && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 w-14 shrink-0">Gatilho</span>
                        <span className="text-xs text-[#10B981] bg-[#10B981]/08 px-2.5 py-1 rounded-full">
                          {GATILHO_LABELS[wf.gatilho_tipo] || wf.gatilho_tipo}
                        </span>
                      </div>
                    )}
                    {acoes.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 w-14 mt-1 shrink-0">Ações</span>
                        <div className="flex flex-wrap gap-1.5">
                          {acoes.map((a, idx) => (
                            <span key={idx} className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                              {ACAO_TIPO_LABELS[a.tipo] || a.tipo}
                              {a.destino ? ` → ${DESTINO_LABELS[a.destino] || a.destino}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleOpenModal(wf)}
                      className="py-2 px-3 text-xs font-bold rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 transition-all"
                    >
                      Editar
                    </button>
                    {wf.status !== 'configurando' && (
                      <button
                        onClick={() => handleToggleStatus(wf)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          wf.status === 'ativo'
                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                            : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                        }`}
                      >
                        {wf.status === 'ativo' ? 'Pausar' : 'Ativar'}
                      </button>
                    )}
                    <button
                      onClick={() => setDrawerWf(wf)}
                      className="py-2 px-3 text-xs font-bold rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 transition-all"
                    >
                      Histórico
                    </button>
                    <button
                      onClick={() => handleDelete(wf)}
                      className="py-2 px-3 text-xs font-bold rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      Excluir
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => handleOpenModal(null)}
        style={{ position: 'fixed', bottom: '2rem', right: '2rem' }}
        className="w-14 h-14 bg-[#10B981] hover:bg-[#059669] text-black rounded-full shadow-2xl shadow-[#10B981]/40 flex items-center justify-center text-2xl font-bold transition-all z-40 hover:scale-110"
      >
        +
      </button>

      {modalOpen && (
        <AutomacaoModal automacao={selectedWf} onClose={handleCloseModal} onSave={handleSave} />
      )}

      {drawerWf && (
        <ExecucoesDrawer automacao={drawerWf} onClose={() => setDrawerWf(null)} />
      )}

      {alertModal}
    </div>
  )
}
