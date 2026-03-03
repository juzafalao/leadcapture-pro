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

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'

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

  // API Keys state
  const [apiKeys, setApiKeys] = useState([])
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [apiKeyCreating, setApiKeyCreating] = useState(false)
  const [newKeyLabel, setNewKeyLabel] = useState('')
  const [newKeyVisible, setNewKeyVisible] = useState(null) // shows new key once after creation

  const loadApiKeys = useCallback(async () => {
    if (!usuario?.tenant_id) return
    setApiKeyLoading(true)
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, label, key_preview, created_at, revoked')
        .eq('tenant_id', usuario.tenant_id)
        .order('created_at', { ascending: false })
      if (!error) setApiKeys(data || [])
    } catch { /* ignore */ } finally {
      setApiKeyLoading(false)
    }
  }, [usuario?.tenant_id])

  useEffect(() => { loadApiKeys() }, [loadApiKeys])

  const handleCreateApiKey = async () => {
    if (!newKeyLabel.trim() || !usuario?.tenant_id) return
    setApiKeyCreating(true)
    try {
      // Generate a cryptographically strong API key using getRandomValues
      const randomBytes = new Uint8Array(32)
      crypto.getRandomValues(randomBytes)
      const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
      const fullKey = `lcp_${randomHex}`
      const keyPreview = `${fullKey.slice(0, 8)}...${fullKey.slice(-4)}`
      const { error } = await supabase.from('api_keys').insert({
        tenant_id: usuario.tenant_id,
        label: newKeyLabel.trim(),
        key_preview: keyPreview,
        revoked: false,
        created_by: usuario.id,
      })
      if (error) throw error
      setNewKeyVisible(fullKey)
      setNewKeyLabel('')
      await loadApiKeys()
    } catch (err) {
      setFeedback({ type: 'error', message: `Erro ao criar chave: ${err.message}` })
      setTimeout(() => setFeedback(null), 4000)
    } finally {
      setApiKeyCreating(false)
    }
  }

  const handleRevokeApiKey = async (id) => {
    try {
      await supabase.from('api_keys').update({ revoked: true }).eq('id', id)
      await loadApiKeys()
    } catch (err) {
      setFeedback({ type: 'error', message: `Erro ao revogar chave: ${err.message}` })
      setTimeout(() => setFeedback(null), 4000)
    }
  }

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
    <div className="text-white pb-32">
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

          <Section title="Integrações">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: '💬', name: 'WhatsApp',      status: 'Não configurado', color: 'text-yellow-500' },
                { icon: '🔗', name: 'Google Forms',   status: 'Ativo',           color: 'text-green-500'  },
                { icon: '⚡', name: 'n8n Automação',  status: 'Não configurado', color: 'text-yellow-500' },
                { icon: '📧', name: 'SMTP E-mail',    status: 'Simulado',        color: 'text-blue-400'   },
              ].map(({ icon, name, status, color }) => (
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

          <Section title="API Keys">
            {/* New key just created */}
            {newKeyVisible && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl"
              >
                <p className="text-xs font-bold text-[#10B981] mb-2">✅ Chave criada! Copie agora — não será exibida novamente.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-[#0B1220] px-3 py-2 rounded-xl text-[#10B981] break-all">{newKeyVisible}</code>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(newKeyVisible); setNewKeyVisible(null) }}
                    className="px-3 py-2 bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] rounded-xl text-xs font-bold transition-colors"
                  >Copiar</button>
                </div>
              </motion.div>
            )}

            {/* Create new key */}
            <div className="flex items-center gap-3 mb-5">
              <input
                type="text"
                value={newKeyLabel}
                onChange={e => setNewKeyLabel(e.target.value)}
                placeholder="Nome da chave (ex: Integração n8n)"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleCreateApiKey}
                disabled={apiKeyCreating || !newKeyLabel.trim()}
                className="whitespace-nowrap px-5 py-3.5 bg-[#10B981] hover:bg-[#059669] text-black rounded-2xl text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {apiKeyCreating ? '⏳' : '+ Criar'}
              </button>
            </div>

            {/* List existing keys */}
            {apiKeyLoading ? (
              <div className="text-center py-6 text-sm text-gray-600">Carregando...</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-600">Nenhuma API key criada ainda.</div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map(k => (
                  <div key={k.id} className={`flex items-center justify-between gap-3 bg-[#0B1220] border rounded-2xl p-4 ${k.revoked ? 'border-white/5 opacity-50' : 'border-white/5'}`}>
                    <div>
                      <p className="text-sm font-bold text-white">{k.label}</p>
                      <code className="text-xs text-gray-500">{k.key_preview}</code>
                      <p className="text-[10px] text-gray-700 mt-0.5">
                        Criada em {new Date(k.created_at).toLocaleDateString('pt-BR')}
                        {k.revoked && <span className="ml-2 text-red-400 font-bold">REVOGADA</span>}
                      </p>
                    </div>
                    {!k.revoked && (
                      <button
                        type="button"
                        onClick={() => handleRevokeApiKey(k.id)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors"
                      >Revogar</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

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