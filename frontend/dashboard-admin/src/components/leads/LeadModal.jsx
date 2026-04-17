// components/leads/LeadModal.jsx -- Design System v1.0
// Modal completo: editar lead + atribuir consultor + status
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../AuthContext'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

const fmtCapital = (v) => {
  if (!v) return null
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$ ${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$ ${(n/1_000).toFixed(0)}K`
  return `R$ ${Math.round(n).toLocaleString('pt-BR')}`
}

const CAT_OPTS = ['Hot', 'Warm', 'Cold']
const CAT_STYLE = {
  hot:  { ring: 'ring-red-500/30',    bg: 'bg-red-500/10',    text: 'text-red-400'    },
  warm: { ring: 'ring-amber-500/30',  bg: 'bg-amber-500/10',  text: 'text-amber-400'  },
  cold: { ring: 'ring-gray-500/20',   bg: 'bg-gray-500/[0.08]', text: 'text-gray-500' },
}

function ScoreBar({ score }) {
  const cor = score >= 80 ? '#EF4444' : score >= 60 ? '#F59E0B' : '#6B7280'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(score || 0, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ background: cor }}
        />
      </div>
      <span className="text-[11px] font-black tabular-nums" style={{ color: cor }}>{score ?? 0}</span>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function LeadModal({ lead, onClose, tenantName, statusReadOnly = false }) {
  const { usuario }  = useAuth()
  const qc           = useQueryClient()
  const podeEditar   = ['Gestor','Diretor','Administrador','admin'].includes(usuario?.role) || usuario?.is_super_admin
  const podeAtribuir = podeEditar

  const [form, setForm] = useState({
    nome:                    lead?.nome                    || '',
    email:                   lead?.email                   || '',
    telefone:                lead?.telefone                || '',
    cidade:                  lead?.cidade                  || '',
    estado:                  lead?.estado                  || '',
    capital_disponivel:      lead?.capital_disponivel      || 0,
    id_status:               lead?.id_status               || '',
    id_motivo_desistencia:   lead?.id_motivo_desistencia   || '',
    categoria:               lead?.categoria               || 'Cold',
    score:                   lead?.score                   || 0,
    fonte:                   lead?.fonte                   || '',
    id_marca:                lead?.id_marca                || lead?.marca?.id || '',
    id_operador_responsavel: lead?.id_operador_responsavel || lead?.operador?.id || '',
    resumo_qualificacao:     lead?.resumo_qualificacao     || '',
  })
  const [statusOpts,  setStatusOpts]  = useState([])
  const [motivosOpts, setMotivosOpts] = useState([])
  const [marcasOpts,  setMarcasOpts]  = useState([])
  const [operadores,  setOperadores]  = useState([])
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const tenantId = lead?.tenant_id || usuario?.tenant_id

  useEffect(() => {
    async function loadOpts() {
      const [{ data: st }, { data: mv }, { data: mr }] = await Promise.all([
        supabase.from('status_comercial').select('id, label, slug, cor').eq('tenant_id', tenantId).order('ordem'),
        supabase.from('motivos_desistencia').select('id, nome').eq('tenant_id', tenantId),
        supabase.from('marcas').select('id, nome, emoji').eq('tenant_id', tenantId).order('nome'),
      ])
      setStatusOpts(st || [])
      setMotivosOpts(mv || [])
      setMarcasOpts(mr || [])
    }
    loadOpts()
  }, [tenantId])

  useEffect(() => {
    if (!podeAtribuir) return
    supabase.from('usuarios')
      .select('id, nome, role')
      .eq('tenant_id', tenantId)
      .in('role', ['Consultor','Gestor','Operador','Administrador'])
      .order('nome')
      .then(({ data }) => setOperadores(data || []))
  }, [tenantId, podeAtribuir])

  async function handleSave() {
    setSaving(true); setError(''); setSuccess(false)
    try {
      const payload = {
        ...form,
        capital_disponivel:      parseFloat(form.capital_disponivel) || 0,
        score:                   parseInt(form.score)                || 0,
        id_status:               form.id_status                     || null,
        id_motivo_desistencia:   form.id_motivo_desistencia          || null,
        id_marca:                form.id_marca                       || null,
        id_operador_responsavel: form.id_operador_responsavel        || null,
        operador_id:             form.id_operador_responsavel        || null,
        updated_at:              new Date().toISOString(),
      }
      const { error: e } = await supabase.from('leads').update(payload).eq('id', lead.id)
      if (e) throw e
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['kanban'] })
      setSuccess(true)
      setTimeout(onClose, 800)
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const cat   = (form.categoria || 'cold').toLowerCase()
  const style = CAT_STYLE[cat] || CAT_STYLE.cold

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-xl bg-[#0B1220] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[92vh]"
      >
        {/* Header do modal */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ring-2 ${style.ring} ${style.bg} flex items-center justify-center font-black text-lg ${style.text}`}>
              {lead.nome?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-white font-bold text-[13px] leading-tight">{lead.nome}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${style.bg} ${style.text}`}>
                  {cat}
                </span>
                {fmtCapital(lead.capital_disponivel) && (
                  <span className="text-[10px] font-bold text-[#10B981]">{fmtCapital(lead.capital_disponivel)}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors text-lg leading-none ml-2">x</button>
        </div>

        {/* Score */}
        <div className="px-6 py-3 bg-white/[0.02] border-b border-white/[0.04] shrink-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">Score de qualificacao</p>
            <p className="text-[9px] text-gray-700">{tenantName || ''}</p>
          </div>
          <ScoreBar score={form.score} />
        </div>

        {/* Corpo com scroll */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="space-y-4">

            {/* Dados basicos */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 mb-3">Dados do lead</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Nome completo">
                    <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                      className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/50 transition-colors" />
                  </Field>
                </div>
                <Field label="Email">
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/50 transition-colors" />
                </Field>
                <Field label="Telefone">
                  <input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                    className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/50 transition-colors" />
                </Field>
                <Field label="Capital disponivel">
                  <input type="number" value={form.capital_disponivel} onChange={e => setForm(p => ({ ...p, capital_disponivel: e.target.value }))}
                    className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/50 transition-colors" />
                </Field>
                <Field label="Score">
                  <input type="number" min="0" max="100" value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))}
                    className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]/50 transition-colors" />
                </Field>
              </div>
            </div>

            {/* Classificacao */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 mb-3">Classificacao</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria">
                  <div className="flex gap-1.5">
                    {CAT_OPTS.map(cat => {
                      const s = CAT_STYLE[cat.toLowerCase()]
                      const active = form.categoria?.toLowerCase() === cat.toLowerCase()
                      return (
                        <button key={cat} onClick={() => setForm(p => ({ ...p, categoria: cat }))}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${active ? `${s.bg} ${s.text} ring-1 ${s.ring}` : 'bg-white/[0.04] text-gray-600 hover:bg-white/[0.07]'}`}>
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                </Field>
                <Field label="Marca">
                  <select value={form.id_marca} onChange={e => setForm(p => ({ ...p, id_marca: e.target.value }))}
                    className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]/50 transition-colors">
                    <option value="">-- Sem marca --</option>
                    {marcasOpts.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.nome}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Status + consultor */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 mb-3">Comercial</p>
              <div className="grid grid-cols-2 gap-3">
                {!statusReadOnly && (
                  <Field label="Status comercial">
                    <select value={form.id_status} onChange={e => setForm(p => ({ ...p, id_status: e.target.value }))}
                      className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]/50 transition-colors">
                      <option value="">-- Status --</option>
                      {statusOpts.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </Field>
                )}
                {podeAtribuir && (
                  <Field label="Consultor responsavel">
                    <select
                      value={form.id_operador_responsavel || ''}
                      onChange={e => setForm(p => ({ ...p, id_operador_responsavel: e.target.value || null, operador_id: e.target.value || null }))}
                      className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]/50 transition-colors"
                    >
                      <option value="">-- Sem responsavel --</option>
                      {operadores.map(op => (
                        <option key={op.id} value={op.id}>{op.nome} ({op.role})</option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
            </div>

            {/* Observacoes */}
            <Field label="Observacoes / Resumo">
              <textarea
                rows={3}
                value={form.resumo_qualificacao}
                onChange={e => setForm(p => ({ ...p, resumo_qualificacao: e.target.value }))}
                className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/50 transition-colors resize-none"
                placeholder="Anotacoes sobre este lead..."
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] shrink-0">
          {error   && <p className="text-red-400 text-[11px] mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-[#10B981] text-[11px] mb-3 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-3 py-2">Salvo com sucesso!</p>}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-bold bg-white/[0.05] text-gray-400 border border-white/[0.08] hover:bg-white/[0.08] transition-all">
              Fechar
            </button>
            <button onClick={handleSave} disabled={saving || success}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-black bg-[#10B981] text-black hover:bg-[#059669] disabled:opacity-50 transition-all">
              {saving ? 'Salvando...' : success ? 'Salvo!' : 'Salvar alteracoes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
