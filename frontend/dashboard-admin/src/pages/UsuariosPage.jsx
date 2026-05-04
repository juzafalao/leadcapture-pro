// UsuariosPage.jsx -- Design System v1.0
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const ROLES = ['Administrador', 'Diretor', 'Gestor', 'Consultor', 'Cliente']

const ROLE_STYLE = {
  Administrador: { bg: 'bg-red-500/10',    text: 'text-red-400' },
  Diretor:       { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  Gestor:        { bg: 'bg-blue-500/10',   text: 'text-blue-400' },
  Consultor:     { bg: 'bg-[#10B981]/10',  text: 'text-[#10B981]' },
  Cliente:       { bg: 'bg-gray-500/10',   text: 'text-gray-400' },
}

function Avatar({ nome, role }) {
  const s = ROLE_STYLE[role] || ROLE_STYLE.Cliente
  return (
    <div className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center font-black text-sm ${s.text} shrink-0`}>
      {nome?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}

function UsuarioModal({ usuario, onClose, tenantId, onSaved, allUsuarios = [] }) {
  const qc = useQueryClient()
  const isNew = !usuario?.id
  const [form, setForm] = useState({
    nome:      usuario?.nome      || '',
    email:     usuario?.email     || '',
    telefone:  usuario?.telefone  || '',
    role:      usuario?.role      || 'Consultor',
    active:    usuario?.active    ?? true,
    gestor_id: usuario?.gestor_id || '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // Quem pode ser "gestor" de um consultor: roles Gestor/Diretor
  const gestoresDisponiveis = allUsuarios.filter(u =>
    u.id !== usuario?.id && ['Gestor', 'Diretor'].includes(u.role)
  )
  // Quem pode ser "gestor" de um gestor: Diretores
  const diretoresDisponiveis = allUsuarios.filter(u =>
    u.id !== usuario?.id && u.role === 'Diretor'
  )

  const showGestorField   = ['Consultor', 'Operador'].includes(form.role)
  const showDiretorField  = form.role === 'Gestor'

  async function handleSave() {
    if (!form.nome || !form.email) { setError('Nome e email sao obrigatorios'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        nome: form.nome, email: form.email, telefone: form.telefone,
        role: form.role, active: form.active,
        gestor_id: form.gestor_id || null,
      }
      if (isNew) {
        const { error: e } = await supabase.from('usuarios').insert({ ...payload, tenant_id: tenantId })
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('usuarios').update(payload).eq('id', usuario.id)
        if (e) throw e
      }
      qc.invalidateQueries({ queryKey: ['usuarios', tenantId] })
      onSaved?.()
      onClose()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="relative w-full max-w-md bg-[#0B1220] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600">
            {isNew ? 'Novo usuario' : 'Editar usuario'}
          </p>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors text-lg leading-none">x</button>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Nome completo', key: 'nome',     type: 'text',  placeholder: 'Ex: Ana Paula Silva' },
            { label: 'E-mail',        key: 'email',    type: 'email', placeholder: 'ana@empresa.com' },
            { label: 'Telefone',      key: 'telefone', type: 'tel',   placeholder: '(11) 9 9999-9999' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/50 transition-colors"
              />
            </div>
          ))}

          <div>
            <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1.5">Perfil de acesso</label>
            <select
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]/50 transition-colors"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Gestor responsável (Consultor → Gestor/Diretor) */}
          {showGestorField && gestoresDisponiveis.length > 0 && (
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1.5">Gestor responsável</label>
              <select
                value={form.gestor_id}
                onChange={e => setForm(p => ({ ...p, gestor_id: e.target.value }))}
                className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]/50 transition-colors"
              >
                <option value="">— Sem gestor —</option>
                {gestoresDisponiveis.map(g => <option key={g.id} value={g.id}>{g.nome} ({g.role})</option>)}
              </select>
            </div>
          )}

          {/* Diretor responsável (Gestor → Diretor) */}
          {showDiretorField && diretoresDisponiveis.length > 0 && (
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1.5">Diretor responsável</label>
              <select
                value={form.gestor_id}
                onChange={e => setForm(p => ({ ...p, gestor_id: e.target.value }))}
                className="w-full bg-[#080E18] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]/50 transition-colors"
              >
                <option value="">— Sem diretor —</option>
                {diretoresDisponiveis.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[11px] font-bold text-white">Status ativo</p>
              <p className="text-[10px] text-gray-600">Usuario pode acessar o sistema</p>
            </div>
            <button
              onClick={() => setForm(p => ({ ...p, active: !p.active }))}
              className={`w-10 h-5.5 rounded-full transition-all relative ${form.active ? 'bg-[#10B981]' : 'bg-white/[0.08]'}`}
              style={{ height: '22px' }}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.active ? 'left-5.5' : 'left-0.5'}`}
                style={{ left: form.active ? '22px' : '2px' }}
              />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-[11px] mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[11px] font-bold bg-white/[0.05] text-gray-400 border border-white/[0.08] hover:bg-white/[0.08] transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[11px] font-black bg-[#10B981] text-black hover:bg-[#059669] disabled:opacity-50 transition-all">
            {saving ? 'Salvando...' : isNew ? 'Criar usuario' : 'Salvar'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function UsuariosPage() {
  const { usuario, isPlatformAdmin } = useAuth()
  const tenantId = isPlatformAdmin() ? null : usuario?.tenant_id
  const qc       = useQueryClient()

  const [modal,   setModal]   = useState(null)
  const [search,  setSearch]  = useState('')
  const [filtRole, setFiltRole] = useState('')

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios', tenantId],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let q = supabase.from('usuarios')
        .select('id, nome, email, telefone, role, active, created_at, last_login, gestor_id')
        .is('deleted_at', null)
        .order('nome')
      if (tenantId) q = q.eq('tenant_id', tenantId)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
  })

  const filtrados = usuarios.filter(u => {
    const matchSearch = !search || u.nome?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole   = !filtRole || u.role === filtRole
    return matchSearch && matchRole
  })

  const ativos   = usuarios.filter(u => u.active).length
  const inativos = usuarios.length - ativos

  return (
    <div className="flex flex-col min-h-full bg-[#0B1220]">

      <div className="px-4 lg:px-10 pt-6 lg:pt-8 pb-5 border-b border-white/[0.06]">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-4xl font-light text-white mb-1">
              Gestao de <span className="text-[#10B981] font-bold">Time</span>
            </h1>
            <div className="w-16 h-0.5 bg-[#10B981] rounded-full mb-2" />
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Usuarios, perfis e permissoes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#0F172A] border border-white/5 rounded-2xl px-4 py-3 text-center">
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-wider">Ativos</p>
              <p className="text-xl font-black text-[#10B981]">{ativos}</p>
            </div>
            <div className="bg-[#0F172A] border border-white/5 rounded-2xl px-4 py-3 text-center">
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-wider">Total</p>
              <p className="text-xl font-black text-white">{usuarios.length}</p>
            </div>
            <button
              onClick={() => setModal({})}
              className="px-4 py-2.5 rounded-xl text-[11px] font-black bg-[#10B981] text-black hover:bg-[#059669] transition-all flex items-center gap-1.5"
            >
              <span className="text-lg leading-none">+</span> Novo usuario
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-10 py-5">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
            <input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] bg-transparent border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white placeholder-gray-700 focus:outline-none focus:border-[#10B981]/40 transition-colors"
            />
            <select
              value={filtRole}
              onChange={e => setFiltRole(e.target.value)}
              className="bg-[#080E18] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none"
            >
              <option value="">Todos perfis</option>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Usuario', 'Perfil', 'Gestor/Diretor', 'Status', 'Ultimo acesso', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="py-20 text-center">
                    <div className="w-7 h-7 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-600 text-sm">
                    Nenhum usuario encontrado
                  </td></tr>
                ) : filtrados.map((u) => {
                  const rs = ROLE_STYLE[u.role] || ROLE_STYLE.Cliente
                  const lastLogin = u.last_login
                    ? new Date(u.last_login).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                    : 'Nunca'
                  return (
                    <motion.tr key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] group cursor-pointer"
                      onClick={() => setModal(u)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar nome={u.nome} role={u.role} />
                          <div>
                            <p className="text-[12px] font-bold text-white group-hover:text-[#10B981] transition-colors">{u.nome}</p>
                            <p className="text-[10px] text-gray-600">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${rs.bg} ${rs.text}`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[10px] text-gray-500">
                        {u.gestor_id
                          ? (usuarios.find(x => x.id === u.gestor_id)?.nome?.split(' ')[0] || '—')
                          : <span className="text-gray-700">—</span>
                        }
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`flex items-center gap-1.5 text-[11px] font-bold ${u.active ? 'text-[#10B981]' : 'text-gray-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-[#10B981]' : 'bg-gray-600'}`} />
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-gray-600">{lastLogin}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-gray-700 group-hover:text-gray-400 transition-colors"></span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hierarquia do time */}
      {(() => {
        const diretores = usuarios.filter(u => u.role === 'Diretor')
        const gestores  = usuarios.filter(u => u.role === 'Gestor')
        const consultores = usuarios.filter(u => ['Consultor','Operador'].includes(u.role))
        if (!gestores.length && !diretores.length) return null
        return (
          <div className="px-6 lg:px-10 pb-8">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.04]">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">Hierarquia do Time</p>
              </div>
              <div className="p-5 space-y-4">
                {diretores.map(dir => {
                  const gestoresDoDir = gestores.filter(g => g.gestor_id === dir.id)
                  const consultoresSemGestor = consultores.filter(c => c.gestor_id === dir.id)
                  return (
                    <div key={dir.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar nome={dir.nome} role={dir.role} />
                        <div>
                          <p className="text-[11px] font-black text-white">{dir.nome}</p>
                          <span className="text-[9px] text-purple-400 font-bold uppercase">Diretor</span>
                        </div>
                      </div>
                      <div className="ml-8 pl-4 border-l border-white/[0.06] space-y-2">
                        {gestoresDoDir.map(g => {
                          const consults = consultores.filter(c => c.gestor_id === g.id)
                          return (
                            <div key={g.id}>
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar nome={g.nome} role={g.role} />
                                <div>
                                  <p className="text-[11px] font-semibold text-white">{g.nome}</p>
                                  <span className="text-[9px] text-blue-400 font-bold uppercase">Gestor · {consults.length} consultor{consults.length !== 1 ? 'es' : ''}</span>
                                </div>
                              </div>
                              {consults.length > 0 && (
                                <div className="ml-8 pl-4 border-l border-white/[0.04] flex flex-wrap gap-2 mt-1">
                                  {consults.map(c => (
                                    <span key={c.id} className="text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full font-semibold">
                                      {c.nome?.split(' ')[0]}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {consultoresSemGestor.map(c => (
                          <div key={c.id} className="flex items-center gap-2">
                            <Avatar nome={c.nome} role={c.role} />
                            <p className="text-[11px] text-white">{c.nome}</p>
                            <span className="text-[9px] text-gray-600">(direto ao diretor)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {/* Gestores sem diretor */}
                {gestores.filter(g => !g.gestor_id).map(g => {
                  const consults = consultores.filter(c => c.gestor_id === g.id)
                  return (
                    <div key={g.id} className="flex items-center gap-2">
                      <Avatar nome={g.nome} role={g.role} />
                      <div>
                        <p className="text-[11px] font-semibold text-white">{g.nome}</p>
                        <span className="text-[9px] text-blue-400 font-bold uppercase">Gestor · {consults.length} consultor{consults.length !== 1 ? 'es' : ''} · sem diretor</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      <AnimatePresence>
        {modal !== null && (
          <UsuarioModal
            usuario={modal?.id ? modal : null}
            tenantId={tenantId}
            allUsuarios={usuarios}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
