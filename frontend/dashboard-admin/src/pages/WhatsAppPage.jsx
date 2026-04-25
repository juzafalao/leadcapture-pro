// WhatsAppPage.jsx — Integração WhatsApp Business + ZAYA
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Smartphone, Zap, Shield, CheckCircle, Bot, Copy, ChevronDown, ChevronUp, Clock, UserCheck, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'

const RECURSOS = [
  { icon: Smartphone,    color: '#25D366', label: 'Número Conectado',      desc: 'Vincule seu WhatsApp Business API ou Evolution API' },
  { icon: Zap,           color: '#F59E0B', label: 'Respostas Automáticas', desc: 'Templates de boas-vindas e qualificação automática' },
  { icon: MessageCircle, color: '#3B82F6', label: 'Conversas Centralizadas', desc: 'Inbox unificado de todos os contatos' },
  { icon: Shield,        color: '#8B5CF6', label: 'Anti-spam & Blacklist', desc: 'Bloqueio automático de contatos indesejados' },
]

const SQL_ZAYA = `-- Execute no Supabase SQL Editor
CREATE TABLE IF NOT EXISTS zaya_conversas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  lead_id      uuid REFERENCES leads(id) ON DELETE SET NULL,
  telefone     text NOT NULL,
  historico    jsonb NOT NULL DEFAULT '[]',
  status       text NOT NULL DEFAULT 'ativa',  -- ativa | handoff | encerrada
  criado_em    timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zaya_conversas_telefone   ON zaya_conversas(telefone);
CREATE INDEX IF NOT EXISTS idx_zaya_conversas_tenant_status ON zaya_conversas(tenant_id, status);`

const STATUS_LABEL = { ativa: 'Ativa', handoff: 'Handoff', encerrada: 'Encerrada' }
const STATUS_COLOR = { ativa: '#10B981', handoff: '#F59E0B', encerrada: '#6B7280' }

function ZayaConversas({ tenantId }) {
  const [conversas, setConversas] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('zaya_conversas')
      .select('id, telefone, status, criado_em, atualizado_em, historico')
      .eq('tenant_id', tenantId)
      .order('atualizado_em', { ascending: false })
      .limit(30)
      .then(({ data }) => { setConversas(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tenantId])

  if (loading) return <p className="text-[11px] text-gray-600 text-center py-4">Carregando conversas...</p>
  if (!conversas.length) return <p className="text-[11px] text-gray-600 text-center py-4">Nenhuma conversa ZAYA ainda.</p>

  return (
    <div className="space-y-2">
      {conversas.map(c => {
        const userMessages = (c.historico || []).filter(h => h.role === 'user').length
        const last = (c.historico || []).filter(h => h.role === 'user').at(-1)?.content || '—'
        const isOpen = expanded === c.id
        return (
          <div key={c.id} className="bg-[#0B1220] border border-white/[0.06] rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              onClick={() => setExpanded(isOpen ? null : c.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[c.status] || '#6B7280' }} />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-white truncate">{c.telefone}</p>
                  <p className="text-[10px] text-gray-600 truncate mt-0.5">{last.slice(0, 60)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${STATUS_COLOR[c.status]}18`, color: STATUS_COLOR[c.status] }}>
                  {STATUS_LABEL[c.status] || c.status}
                </span>
                <span className="text-[10px] text-gray-600">{userMessages} msg</span>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-2 max-h-64 overflow-y-auto">
                {(c.historico || []).map((h, idx) => {
                  if (h.role === 'system') return null
                  const isUser = h.role === 'user'
                  const text = typeof h.content === 'string'
                    ? h.content
                    : (h.content || []).find(b => b.type === 'text')?.text || '[ação automática]'
                  return (
                    <div key={idx} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${isUser ? 'bg-white/[0.06] text-gray-300' : 'bg-[#10B981]/10 text-[#10B981]'}`}>
                        {text}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function WhatsAppPage() {
  const { usuario } = useAuth()
  const [copied, setCopied] = useState(false)
  const [showSql, setShowSql] = useState(false)
  const tenantId = usuario?.tenant_id || usuario?.tenant?.id

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_ZAYA).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="min-h-full bg-[#0B1220] px-4 lg:px-10 py-6 lg:py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#25D36618' }}>
            <MessageCircle className="w-5 h-5" style={{ color: '#25D366' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">Integração com WhatsApp Business API</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <span className="text-[11px] font-semibold text-[#F59E0B]">Em desenvolvimento — em breve disponível</span>
        </div>
      </div>

      {/* Recursos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {RECURSOS.map((r, i) => {
          const Icon = r.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#0F172A] border border-white/[0.06] rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${r.color}18` }}>
                  <Icon className="w-5 h-5" style={{ color: r.color }} />
                </div>
                <p className="text-[13px] font-semibold text-white">{r.label}</p>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{r.desc}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-gray-700" />
                <span className="text-[10px] text-gray-600">Planejado para próxima release</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Integração atual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-[#0F172A] border border-[#25D366]/20 rounded-2xl p-6 mb-6"
      >
        <p className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: '#25D366' }}>Integração atual</p>
        <p className="text-[13px] text-gray-300 leading-relaxed">
          O WhatsApp já está integrado via <strong className="text-white">Evolution API</strong> para receber leads automaticamente.
          Configure o webhook em <a href="/canais" className="hover:underline" style={{ color: '#25D366' }}>Canais</a> ou
          ajuste os fluxos em <a href="/automacao" className="hover:underline" style={{ color: '#25D366' }}>Automação n8n</a>.
        </p>
      </motion.div>

      {/* ZAYA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="bg-[#0F172A] border border-[#8B5CF6]/25 rounded-2xl overflow-hidden mb-6"
      >
        {/* ZAYA Header */}
        <div className="px-6 py-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-white">ZAYA</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] font-semibold">Premium</span>
              </div>
              <p className="text-[11px] text-gray-500">Consultora Virtual de Expansão com IA</p>
            </div>
          </div>
          <p className="text-[12px] text-gray-400 leading-relaxed">
            ZAYA qualifica novos contatos via WhatsApp usando inteligência artificial (Claude). Quando há informações suficientes,
            ela encerra a conversa e envia um resumo completo para o consultor humano, com o lead já criado no sistema.
          </p>
        </div>

        {/* Como funciona */}
        <div className="px-6 py-5 border-b border-white/[0.05]">
          <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-4">Como funciona</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: MessageCircle, color: '#25D366', step: '1', title: 'Contato via WhatsApp', desc: 'Um novo número manda mensagem para o número da empresa' },
              { icon: Bot,           color: '#8B5CF6', step: '2', title: 'ZAYA qualifica',       desc: 'Conversa natural para coletar nome, capital e cidade' },
              { icon: UserCheck,     color: '#10B981', step: '3', title: 'Handoff humano',       desc: 'Lead criado + resumo enviado ao consultor pelo WhatsApp' },
            ].map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-black"
                  style={{ background: `${s.color}20`, color: s.color }}>{s.step}</div>
                <div>
                  <p className="text-[12px] font-semibold text-white">{s.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuração */}
        <div className="px-6 py-5 border-b border-white/[0.05]">
          <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-4">Configuração</p>
          <div className="space-y-3">
            {[
              { var: 'ANTHROPIC_API_KEY', desc: 'Chave da API Claude (Anthropic)', link: null },
              { var: 'ZAYA_TENANT_ID',    desc: `ID do tenant dono deste número — use: ${tenantId || 'seu tenant_id'}`, link: null },
              { var: 'EVOLUTION_API_KEY', desc: 'Já configurada para Evolution API', link: null },
            ].map((v, i) => (
              <div key={i} className="flex items-start gap-3 bg-black/20 rounded-xl px-4 py-3">
                <code className="text-[11px] font-mono text-[#8B5CF6] font-bold flex-shrink-0">{v.var}</code>
                <p className="text-[11px] text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SQL */}
        <div className="px-6 py-5 border-b border-white/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">Tabela Supabase</p>
            <div className="flex gap-2">
              <button onClick={() => setShowSql(s => !s)} className="text-[10px] text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                {showSql ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showSql ? 'ocultar' : 'ver SQL'}
              </button>
              <button onClick={copySQL} className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] transition-colors text-gray-400">
                <Copy className="w-3 h-3" />
                {copied ? 'Copiado!' : 'Copiar SQL'}
              </button>
            </div>
          </div>
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500">Execute o SQL abaixo no Supabase SQL Editor para criar a tabela <code className="text-[#8B5CF6]">zaya_conversas</code>.</p>
          </div>
          {showSql && (
            <pre className="text-[10px] font-mono bg-black/40 rounded-xl p-4 overflow-x-auto text-gray-400 leading-relaxed whitespace-pre-wrap">{SQL_ZAYA}</pre>
          )}
        </div>

        {/* Conversas ativas */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-500">Conversas Recentes</p>
          </div>
          {tenantId
            ? <ZayaConversas tenantId={tenantId} />
            : <p className="text-[11px] text-gray-600 text-center py-4">Faça login para ver as conversas.</p>
          }
        </div>
      </motion.div>

    </div>
  )
}
