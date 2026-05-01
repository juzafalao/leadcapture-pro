// ============================================================
// CRMPage.jsx — Central de Integrações CRM
// LeadCapture Pro · Zafalão Tech · Sprint CRM Dia 10
//
// Tabs:
//   1. Webhooks — configurar endpoints de saída por evento
//   2. Integrações — cards de CRMs (existente + novos)
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useWebhooks, useCreateWebhook, useUpdateWebhook,
  useDeleteWebhook, useTestWebhook,
} from '../hooks/useTasks'

// ─── Dados dos CRMs ──────────────────────────────────────────
const CRMS = [
  { nome: 'Zapier / N8N',  icon: '⚡', cor: '#FF4A00', desc: 'Automação entre plataformas',    status: 'ativo'    },
  { nome: 'Pipedrive',     icon: '📊', cor: '#2E4057', desc: 'CRM focado em pipeline',          status: 'em-breve' },
  { nome: 'HubSpot',       icon: '🧡', cor: '#FF7A59', desc: 'CRM com automação de marketing',  status: 'em-breve' },
  { nome: 'RD Station',    icon: '🇧🇷', cor: '#2E9B5B', desc: 'CRM líder no Brasil',            status: 'em-breve' },
  { nome: 'Salesforce',    icon: '☁️', cor: '#00A1E0', desc: 'Líder mundial em CRM',            status: 'em-breve' },
  { nome: 'Zoho CRM',      icon: '🔵', cor: '#E42527', desc: 'CRM completo e acessível',        status: 'em-breve' },
]

const EVENTOS_INFO = {
  lead_criado:           { label: 'Lead Criado',            cor: '#10B981', desc: 'Novo lead capturado no sistema'              },
  lead_status_atualizado:{ label: 'Status Atualizado',      cor: '#6366F1', desc: 'Status do lead foi alterado'                 },
  tarefa_criada:         { label: 'Tarefa Criada',          cor: '#06B6D4', desc: 'Nova tarefa vinculada a um lead'             },
  tarefa_concluida:      { label: 'Tarefa Concluída',       cor: '#10B981', desc: 'Tarefa marcada como concluída'              },
  interacao_manual:      { label: 'Interação Manual',       cor: '#A855F7', desc: 'Ligação, reunião ou visita registrada'      },
}

// ─── Formulário de Webhook ────────────────────────────────────
function WebhookForm({ onSave, onCancel, initial = null }) {
  const [nome,     setNome]     = useState(initial?.nome     || '')
  const [url,      setUrl]      = useState(initial?.url      || '')
  const [eventos,  setEventos]  = useState(initial?.eventos  || [])
  const [secret,   setSecret]   = useState(initial?.secret_token || '')
  const [erro,     setErro]     = useState(null)

  const toggleEvento = (ev) =>
    setEventos(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nome.trim() || !url.trim() || !eventos.length) {
      setErro('Nome, URL e ao menos um evento são obrigatórios')
      return
    }
    try { new URL(url) } catch { setErro('URL inválida'); return }
    setErro(null)
    onSave({ nome, url, eventos, secret_token: secret || undefined })
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onSubmit={handleSubmit}
      className="bg-[#0F172A] border border-[#10B981]/20 rounded-2xl p-5 space-y-4"
    >
      <p className="text-xs font-black uppercase tracking-wider text-[#10B981]">
        {initial ? 'Editar Webhook' : 'Novo Webhook'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Nome</label>
          <input
            value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Ex: Pipedrive Produção"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/40 transition-all"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">URL do Endpoint</label>
          <input
            value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://hooks.zapier.com/..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/40 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-2">
          Eventos ({eventos.length} selecionado{eventos.length !== 1 ? 's' : ''})
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EVENTOS_INFO).map(([key, info]) => (
            <button
              key={key} type="button" onClick={() => toggleEvento(key)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                eventos.includes(key)
                  ? 'border' : 'bg-white/[0.04] text-gray-600 border border-white/[0.06] hover:text-gray-400'
              }`}
              style={eventos.includes(key) ? {
                background: info.cor + '15',
                color: info.cor,
                borderColor: info.cor + '40',
              } : {}}
            >
              {info.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
          Secret Token <span className="text-gray-700 normal-case font-medium">(opcional — enviado no header X-Webhook-Secret)</span>
        </label>
        <input
          value={secret} onChange={e => setSecret(e.target.value)}
          placeholder="token-secreto-para-verificar-origem"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/40 transition-all font-mono"
        />
      </div>

      {erro && (
        <p className="text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{erro}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all"
        >
          {initial ? 'Salvar alterações' : 'Criar Webhook'}
        </button>
        <button
          type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
        >
          Cancelar
        </button>
      </div>
    </motion.form>
  )
}

// ─── Card de Webhook ──────────────────────────────────────────
function WebhookCard({ wh, onEdit, onDelete }) {
  const { mutateAsync: testar, isPending: testando } = useTestWebhook()
  const { mutateAsync: atualizar }                   = useUpdateWebhook()
  const [resultado, setResultado]                    = useState(null)

  const handleTest = async () => {
    setResultado(null)
    const r = await testar(wh.id)
    setResultado(r)
    setTimeout(() => setResultado(null), 5000)
  }

  const handleToggle = () => atualizar({ id: wh.id, ativo: !wh.ativo })

  return (
    <motion.div
      layout
      className={`bg-[#0F172A] border rounded-2xl p-5 transition-all ${
        wh.ativo ? 'border-white/[0.07]' : 'border-white/[0.03] opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${wh.ativo ? 'bg-[#10B981]' : 'bg-gray-600'}`} />
            <p className="text-sm font-bold text-white truncate">{wh.nome}</p>
          </div>
          <p className="text-[11px] text-gray-600 truncate ml-4">{wh.url}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleTest} disabled={testando}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 hover:bg-[#3B82F6]/20 transition-all disabled:opacity-50"
          >
            {testando ? '...' : 'Testar'}
          </button>
          <button
            onClick={handleToggle}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
          >
            {wh.ativo ? 'Pausar' : 'Ativar'}
          </button>
          <button onClick={onEdit}   className="px-2 py-1 rounded-lg text-[10px] text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all">✏️</button>
          <button onClick={onDelete} className="px-2 py-1 rounded-lg text-[10px] text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all">🗑</button>
        </div>
      </div>

      {/* Eventos */}
      <div className="flex flex-wrap gap-1.5">
        {wh.eventos.map(ev => {
          const info = EVENTOS_INFO[ev]
          return info ? (
            <span
              key={ev}
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: info.cor + '15', color: info.cor }}
            >
              {info.label}
            </span>
          ) : null
        })}
      </div>

      {/* Resultado do teste */}
      <AnimatePresence>
        {resultado && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-3 px-3 py-2 rounded-xl text-[11px] font-bold ${
              resultado.ok
                ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                : 'bg-red-400/10 text-red-400 border border-red-400/20'
            }`}
          >
            {resultado.ok
              ? `✓ Teste enviado com sucesso (HTTP ${resultado.status})`
              : `✗ Falha no teste${resultado.erro ? `: ${resultado.erro}` : resultado.status ? ` (HTTP ${resultado.status})` : ''}`
            }
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Tab: Webhooks ────────────────────────────────────────────
function TabWebhooks() {
  const { data: webhooks = [], isLoading } = useWebhooks()
  const { mutateAsync: criar,   isPending: criando  } = useCreateWebhook()
  const { mutateAsync: atualizar                     } = useUpdateWebhook()
  const { mutateAsync: deletar                       } = useDeleteWebhook()

  const [showForm,  setShowForm]  = useState(false)
  const [editando,  setEditando]  = useState(null)

  const handleCreate = async (payload) => {
    await criar(payload)
    setShowForm(false)
  }

  const handleEdit = async (payload) => {
    await atualizar({ id: editando.id, ...payload })
    setEditando(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Remover este webhook?')) return
    await deletar(id)
  }

  return (
    <div className="space-y-5">

      {/* Banner explicativo */}
      <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/15 rounded-2xl p-5 flex gap-4">
        <div className="text-2xl shrink-0">🔗</div>
        <div>
          <p className="text-white font-bold text-sm mb-1">Webhooks de saída</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Configure endpoints para receber eventos em tempo real.
            O LeadCapture Pro enviará um POST com o payload JSON para cada URL configurada
            sempre que o evento selecionado ocorrer.
          </p>
        </div>
      </div>

      {/* Botão novo + Formulário */}
      <div className="flex justify-between items-center">
        <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">
          {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configurado{webhooks.length !== 1 ? 's' : ''}
        </p>
        {!showForm && !editando && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/20 transition-all"
          >
            + Novo Webhook
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <WebhookForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        )}
        {editando && (
          <WebhookForm initial={editando} onSave={handleEdit} onCancel={() => setEditando(null)} />
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-600 py-4">
          <div className="w-4 h-4 border border-gray-600 border-t-transparent rounded-full animate-spin" />
          Carregando webhooks...
        </div>
      )}

      {/* Lista */}
      {!isLoading && webhooks.length === 0 && !showForm && (
        <div className="text-center py-10 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
          <p className="text-3xl mb-3">⚡</p>
          <p className="text-sm text-gray-500">Nenhum webhook configurado ainda.</p>
          <p className="text-xs text-gray-700 mt-1">Clique em "Novo Webhook" para começar.</p>
        </div>
      )}

      <div className="space-y-3">
        {webhooks.map(wh => (
          <WebhookCard
            key={wh.id}
            wh={wh}
            onEdit={() => { setEditando(wh); setShowForm(false) }}
            onDelete={() => handleDelete(wh.id)}
          />
        ))}
      </div>

      {/* Payload de exemplo */}
      {webhooks.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-[10px] font-black uppercase tracking-wider text-gray-600 hover:text-gray-400 transition-colors py-2">
            ▸ Ver exemplo de payload JSON
          </summary>
          <pre className="mt-2 bg-[#0F172A] border border-white/[0.06] rounded-xl p-4 text-[11px] text-[#10B981] overflow-x-auto font-mono leading-relaxed">
{`{
  "evento": "tarefa_criada",
  "tenant_id": "uuid-do-tenant",
  "timestamp": "2026-05-01T12:00:00.000Z",
  "dados": {
    "tarefa_id": "uuid-da-tarefa",
    "lead_id":   "uuid-do-lead",
    "titulo":    "Ligar para o cliente",
    "prioridade": "alta"
  }
}`}
          </pre>
        </details>
      )}
    </div>
  )
}

// ─── Tab: Integrações ─────────────────────────────────────────
function TabIntegracoes() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#10B981]/10 to-[#3B82F6]/10 border border-[#10B981]/20 rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center gap-4">
        <div className="text-3xl shrink-0">🔗</div>
        <div className="flex-1">
          <h2 className="text-white font-bold mb-1">Sincronização bidirecional com seu CRM</h2>
          <p className="text-gray-400 text-sm">
            Use os webhooks acima para integrar com qualquer CRM via Zapier, N8N ou Make.
            Integrações nativas estão previstas para os próximos ciclos.
          </p>
        </div>
      </div>

      <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Status das integrações</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CRMS.map((crm, i) => (
          <motion.div
            key={crm.nome}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0F172A] border border-white/5 rounded-2xl p-5 flex items-start gap-4"
          >
            <div className="text-3xl">{crm.icon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold text-sm">{crm.nome}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  crm.status === 'ativo'
                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                    : 'bg-white/5 text-gray-500 border border-white/10'
                }`}>
                  {crm.status === 'ativo' ? 'Via Webhook' : 'Em breve'}
                </span>
              </div>
              <p className="text-gray-500 text-xs">{crm.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="text-2xl">⚡</div>
          <div>
            <h3 className="text-white font-bold mb-1">N8N / Zapier já disponível via Webhook</h3>
            <p className="text-gray-400 text-sm mb-3">
              Configure um webhook na aba ao lado e conecte ao N8N ou Zapier.
              Você pode enviar leads automaticamente para qualquer CRM, planilha ou sistema.
            </p>
            <a
              href="https://n8n.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30 hover:bg-[#3B82F6]/20 transition-all"
            >
              Ver documentação N8N →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
const TABS = [
  { id: 'webhooks',    label: '⚡ Webhooks'     },
  { id: 'integracoes', label: '🔗 Integrações'  },
]

export default function CRMPage() {
  const [tabAtiva, setTabAtiva] = useState('webhooks')

  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">
      {/* Header */}
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl lg:text-3xl font-light text-white">
              CRM <span className="text-[#10B981] font-bold">& Integrações</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Webhooks de saída e integrações com CRMs externos
            </p>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTabAtiva(tab.id)}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                tabAtiva === tab.id
                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-6 lg:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tabAtiva}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {tabAtiva === 'webhooks'    && <TabWebhooks    />}
            {tabAtiva === 'integracoes' && <TabIntegracoes />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
