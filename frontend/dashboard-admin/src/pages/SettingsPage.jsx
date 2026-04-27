// ============================================================
// SettingsPage.jsx — Configurações com alteração de senha real
// LeadCapture Pro — Zafalão Tech
//
// MUDANÇAS vs versão anterior:
// 1. Alteração de senha funcional via supabase.auth.updateUser
// 2. Validação: mínimo 6 caracteres, senhas devem coincidir
// 3. Atualização de nome funcional via tabela usuarios
// 4. Feedback visual de sucesso/erro
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'

const API_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

const DEFAULT_TIERS = [
  { min: 500000, score: 95, label: '500k+' },
  { min: 300000, score: 90, label: '300k–500k' },
  { min: 200000, score: 80, label: '200k–300k' },
  { min: 150000, score: 70, label: '150k–200k' },
  { min: 100000, score: 60, label: '100k–150k' },
  { min: 80000,  score: 55, label: '80k–100k' },
  { min: 0,      score: 50, label: '<80k' },
]

const DEFAULT_THRESHOLDS = { HOT: 80, WARM: 60 }

const Section = ({ title, children }) => (
  <div className="bg-[#0F172A] border border-white/5 rounded-3xl p-8 mb-6">
    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6">{title}</h2>
    {children}
  </div>
)

const Field = ({ label, children, error }) => (
  <div className="mb-5">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
  </div>
)

const inputClass = `
  w-full bg-[#0B1220] border border-white/5 rounded-2xl
  px-5 py-3.5 text-sm text-white placeholder:text-gray-700
  focus:outline-none focus:border-[#10B981]/50
  focus:ring-2 focus:ring-[#10B981]/15 transition-all
`

const inputErrorClass = `
  w-full bg-[#0B1220] border border-red-500/50 rounded-2xl
  px-5 py-3.5 text-sm text-white placeholder:text-gray-700
  focus:outline-none focus:border-red-500/50
  focus:ring-2 focus:ring-red-500/15 transition-all
`

function categoriaFromScore(score, thresholds) {
  if (score >= (thresholds.HOT ?? 80)) return { label: 'Hot', color: 'text-red-400' }
  if (score >= (thresholds.WARM ?? 60)) return { label: 'Warm', color: 'text-yellow-400' }
  return { label: 'Cold', color: 'text-blue-400' }
}

function ScoringConfigSection({ tenantId }) {
  const [tiers, setTiers] = useState(null)
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const showFeedback = (type, message) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 5000)
  }

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const tok = await getToken()
      if (!tok) return
      const r = await fetch(`${API_URL}/api/sistema/scoring-config`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (r.ok) {
        const data = await r.json()
        setTiers(data.config.tiers.slice().sort((a, b) => b.min - a.min))
        setThresholds(data.config.thresholds)
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      const tok = await getToken()
      const r = await fetch(`${API_URL}/api/sistema/scoring-config`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers, thresholds }),
      })
      const data = await r.json()
      if (data.success) showFeedback('success', 'Configuração de scoring salva!')
      else showFeedback('error', data.error || 'Erro ao salvar')
    } catch (err) {
      showFeedback('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Restaurar para os valores padrão? Isso apaga a configuração personalizada.')) return
    setSaving(true)
    try {
      const tok = await getToken()
      const r = await fetch(`${API_URL}/api/sistema/scoring-config`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      })
      const data = await r.json()
      if (data.success) {
        setTiers(DEFAULT_TIERS.slice())
        setThresholds(DEFAULT_THRESHOLDS)
        showFeedback('success', 'Padrões restaurados')
      }
    } catch (err) {
      showFeedback('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateTier = (i, field, val) => {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: field === 'label' ? val : Number(val) } : t))
  }

  const addTier = () => setTiers(prev => [...prev, { min: 0, score: 50, label: 'Novo' }])
  const removeTier = (i) => setTiers(prev => prev.filter((_, idx) => idx !== i))

  const cellInput = `bg-[#0B1220] border border-white/10 rounded-xl px-3 py-2 text-sm text-white w-full
    focus:outline-none focus:border-[#10B981]/50 focus:ring-1 focus:ring-[#10B981]/20`

  if (loading) return (
    <Section title="Qualificação de Leads (Scoring)">
      <p className="text-sm text-gray-500">Carregando...</p>
    </Section>
  )

  return (
    <Section title="Qualificação de Leads (Scoring)">
      <p className="text-xs text-gray-500 mb-5">
        Configure as faixas de capital e os limiares de classificação (Hot/Warm/Cold) para este tenant.
      </p>

      {feedback && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border
          ${feedback.type === 'success' ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {feedback.type === 'success' ? '✅ ' : '❌ '}{feedback.message}
        </div>
      )}

      <div className="mb-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Limiares de Categoria</p>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-[10px] text-gray-500 mb-1.5">Score mínimo <span className="text-red-400 font-bold">HOT</span></label>
            <input type="number" min={1} max={100} value={thresholds.HOT}
              onChange={e => setThresholds(t => ({ ...t, HOT: Number(e.target.value) }))}
              className={cellInput} />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-gray-500 mb-1.5">Score mínimo <span className="text-yellow-400 font-bold">WARM</span></label>
            <input type="number" min={1} max={100} value={thresholds.WARM}
              onChange={e => setThresholds(t => ({ ...t, WARM: Number(e.target.value) }))}
              className={cellInput} />
          </div>
        </div>
      </div>

      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Faixas de Capital</p>
      <div className="overflow-x-auto rounded-xl border border-white/5 mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-[10px] text-gray-500 font-bold uppercase tracking-wider px-4 py-2.5">Capital mín. (R$)</th>
              <th className="text-left text-[10px] text-gray-500 font-bold uppercase tracking-wider px-4 py-2.5">Score</th>
              <th className="text-left text-[10px] text-gray-500 font-bold uppercase tracking-wider px-4 py-2.5">Label</th>
              <th className="text-left text-[10px] text-gray-500 font-bold uppercase tracking-wider px-4 py-2.5">Categoria</th>
              <th className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {(tiers || []).map((tier, i) => {
              const cat = categoriaFromScore(tier.score, thresholds)
              return (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={tier.min} onChange={e => updateTier(i, 'min', e.target.value)} className={cellInput} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} max={100} value={tier.score} onChange={e => updateTier(i, 'score', e.target.value)} className={cellInput} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="text" value={tier.label} onChange={e => updateTier(i, 'label', e.target.value)} className={cellInput} />
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-bold ${cat.color}`}>{cat.label}</span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button type="button" onClick={() => removeTier(i)}
                      className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={addTier}
        className="text-xs text-[#10B981] hover:text-[#34D399] font-bold mb-6 flex items-center gap-1.5 transition-colors">
        <span className="text-base leading-none">+</span> Adicionar faixa
      </button>

      <div className="flex gap-3">
        <motion.button
          type="button" onClick={handleSave} disabled={saving}
          whileHover={{ scale: saving ? 1 : 1.01 }} whileTap={{ scale: 0.98 }}
          className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all
            ${saving ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#10B981] to-[#059669] text-black hover:shadow-lg hover:shadow-[#10B981]/20'}`}>
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Salvando...
            </span>
          ) : 'Salvar Qualificação'}
        </motion.button>
        <button type="button" onClick={handleReset} disabled={saving}
          className="px-5 py-3.5 rounded-2xl text-xs font-bold text-gray-500 border border-white/10
            hover:border-red-500/30 hover:text-red-400 transition-all">
          Restaurar padrões
        </button>
      </div>
    </Section>
  )
}

function IntegrationStatusSection() {
  const [waStatus, setWaStatus] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const url = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')
    supabase.auth.getSession().then(({ data }) => {
      const token = data?.session?.access_token
      return fetch(`${url}/api/whatsapp/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (mountedRef.current) setWaStatus(data) })
      .catch(() => {})
    return () => { mountedRef.current = false }
  }, [])

  const waLabel = () => {
    if (!waStatus) return { text: 'Verificando...', color: 'text-gray-500' }
    if (!waStatus.configured) return { text: 'Não configurado', color: 'text-yellow-500' }
    if (waStatus.conectado) return { text: `Conectado (${waStatus.instancia || 'lead-pro'})`, color: 'text-green-500' }
    return { text: waStatus.motivo || 'Desconectado', color: 'text-red-400' }
  }

  const wa = waLabel()

  const integracoes = [
    { icon: '💬', name: 'WhatsApp (Evolution API)', status: wa.text,          color: wa.color            },
    { icon: '🔗', name: 'Google Forms',              status: 'Ativo',           color: 'text-green-500'   },
    { icon: '⚡', name: 'n8n Automação',              status: 'Não configurado', color: 'text-yellow-500'  },
    { icon: '📧', name: 'SMTP E-mail',                status: 'Simulado',        color: 'text-blue-400'    },
  ]

  return (
    <Section title="Integrações">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {integracoes.map(({ icon, name, status, color }) => (
          <div key={name} className="flex items-center gap-4 bg-[#0B1220] border border-white/5 rounded-2xl p-4">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{name}</p>
              <p className={`text-xs font-bold ${color}`}>{status}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

export default function SettingsPage() {
  const { usuario } = useAuth()

  // Estado dos campos
  const [nome, setNome] = useState(usuario?.nome || '')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  // Estado de feedback
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', message: string }
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}

    if (!nome.trim()) {
      errs.nome = 'Nome é obrigatório'
    }

    if (novaSenha || confirmarSenha) {
      if (novaSenha.length < 6) {
        errs.novaSenha = 'Mínimo 6 caracteres'
      }
      if (novaSenha !== confirmarSenha) {
        errs.confirmarSenha = 'As senhas não coincidem'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setFeedback(null)

    if (!validate()) return

    setSaving(true)

    try {
      const updates = []

      // 1. Atualizar nome na tabela usuarios (se mudou)
      if (nome.trim() !== usuario?.nome) {
        const { error: nomeError } = await supabase
          .from('usuarios')
          .update({ nome: nome.trim() })
          .eq('id', usuario.id)

        if (nomeError) throw new Error(`Erro ao atualizar nome: ${nomeError.message}`)
        updates.push('nome')
      }

      // 2. Atualizar senha via Supabase Auth (se preencheu)
      if (novaSenha) {
        const { error: senhaError } = await supabase.auth.updateUser({
          password: novaSenha
        })

        if (senhaError) throw new Error(`Erro ao atualizar senha: ${senhaError.message}`)
        updates.push('senha')

        // Limpar campos de senha após sucesso
        setNovaSenha('')
        setConfirmarSenha('')
      }

      if (updates.length === 0) {
        setFeedback({ type: 'info', message: 'Nenhuma alteração detectada' })
      } else {
        setFeedback({
          type: 'success',
          message: `${updates.includes('nome') ? 'Nome' : ''}${updates.includes('nome') && updates.includes('senha') ? ' e ' : ''}${updates.includes('senha') ? 'Senha' : ''} atualizado(a) com sucesso!`
        })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
      setTimeout(() => setFeedback(null), 5000)
    }
  }

  return (
    <div className="min-h-full bg-[#0B1220] text-white pb-16">
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-8">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-2">
            Configurações <span className="text-[#10B981] font-bold">do Sistema</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Personalize sua conta e tenant
            </p>
          </div>
        </motion.div>
      </div>

      <div className="px-4 lg:px-10 max-w-3xl">
        {['Gestor', 'Diretor', 'Administrador', 'admin'].includes(usuario?.role) && (
          <ScoringConfigSection tenantId={usuario?.tenant_id} />
        )}
        <form onSubmit={handleSave}>

          {/* Feedback global */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                mb-6 px-5 py-4 rounded-2xl border text-sm font-medium
                ${feedback.type === 'success' ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' : ''}
                ${feedback.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : ''}
                ${feedback.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : ''}
              `}
            >
              {feedback.type === 'success' && '✅ '}{feedback.type === 'error' && '❌ '}{feedback.type === 'info' && 'ℹ️ '}
              {feedback.message}
            </motion.div>
          )}

          <Section title="Perfil do usuário">
            <Field label="Nome completo" error={errors.nome}>
              <input
                className={errors.nome ? inputErrorClass : inputClass}
                value={nome}
                onChange={e => { setNome(e.target.value); setErrors(prev => ({ ...prev, nome: null })) }}
                placeholder="Seu nome"
              />
            </Field>
            <Field label="E-mail">
              <div className={`${inputClass} cursor-not-allowed opacity-50`}>
                {usuario?.email || 'email@empresa.com'}
              </div>
              <p className="text-[10px] text-gray-700 mt-1">E-mail não pode ser alterado por aqui</p>
            </Field>
            <Field label="Cargo / Função">
              <div className={`${inputClass} cursor-not-allowed opacity-50`}>
                {usuario?.role_emoji && <span className="mr-2">{usuario.role_emoji}</span>}
                {usuario?.role || 'Administrador'}
              </div>
            </Field>
          </Section>

          <Section title="Alterar Senha">
            <Field label="Nova senha" error={errors.novaSenha}>
              <input
                className={errors.novaSenha ? inputErrorClass : inputClass}
                type="password"
                value={novaSenha}
                onChange={e => { setNovaSenha(e.target.value); setErrors(prev => ({ ...prev, novaSenha: null })) }}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirmar nova senha" error={errors.confirmarSenha}>
              <input
                className={errors.confirmarSenha ? inputErrorClass : inputClass}
                type="password"
                value={confirmarSenha}
                onChange={e => { setConfirmarSenha(e.target.value); setErrors(prev => ({ ...prev, confirmarSenha: null })) }}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
            </Field>
            <p className="text-[10px] text-gray-700 -mt-2">
              Deixe em branco se não quiser alterar a senha
            </p>
          </Section>

          <Section title="Notificações por e-mail">
            {[
              { id: 'notif_hot',    label: 'Lead Hot capturado',     def: true  },
              { id: 'notif_all',    label: 'Qualquer novo lead',      def: false },
              { id: 'notif_assign', label: 'Lead atribuído a mim',    def: true  },
              { id: 'notif_digest', label: 'Resumo diário (às 08h)',  def: false },
            ].map(({ id, label, def }) => (
              <label key={id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 cursor-pointer">
                <span className="text-sm text-gray-300">{label}</span>
                <div className="relative">
                  <input type="checkbox" id={id} defaultChecked={def} className="sr-only peer" />
                  <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-[#10B981] transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            ))}
          </Section>

          <IntegrationStatusSection />

          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.01 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            className={`
              w-full py-4 rounded-2xl font-bold text-sm transition-all
              ${saving
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : feedback?.type === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-[#10B981] to-[#059669] text-black hover:shadow-lg hover:shadow-[#10B981]/20'
              }
            `}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Salvando...
              </span>
            ) : feedback?.type === 'success' ? (
              '✓ Salvo com sucesso!'
            ) : (
              'Salvar configurações'
            )}
          </motion.button>
        </form>
      </div>
    </div>
  )
}