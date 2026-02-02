import { useState, useEffect, createContext, useContext } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './lib/supabase'

const queryClient = new QueryClient()

// =====================================================
// CONFIGURAÇÕES DE LOGOS (ALTERE AQUI!)
// =====================================================
const LOGO_SISTEMA = '/logo-sistema.png'
const LOGO_CLIENTE = '/logo-cliente.png'

// =====================================================
// CONFIGURAÇÕES GERAIS
// =====================================================
const FONTES = { all: 'Todas', website: 'Website', instagram: 'Instagram', whatsapp: 'WhatsApp', indicacao: 'Indicação', evento: 'Evento', google_ads: 'Google Ads' }
const CATEGORIAS = { all: 'Todas', hot: '🔥 Hot', warm: '🌤 Warm', cold: '❄️ Cold' }
const STATUS_OPTIONS = { all: 'Todos', novo: '🆕 Novo', contato: '📞 Em Contato', agendado: '📅 Agendado', negociacao: '💼 Negociação', convertido: '✅ Convertido', perdido: '❌ Perdido' }
const ROLES = { admin: { label: 'Administrador', emoji: '👑', color: '#ee7b4d' }, gerente: { label: 'Gerente', emoji: '📊', color: '#a78bfa' }, operador: { label: 'Operador', emoji: '👤', color: '#60a5fa' } }

// =====================================================
// COMPONENTE DE LOGO
// =====================================================
function Logo({ src, fallback = 'LC', size = 48, className = '' }) {
  const [hasError, setHasError] = useState(false)
  
  if (hasError || !src) {
    return (
      <div 
        className={`rounded-xl bg-gradient-to-br from-[#ee7b4d] to-[#d4663a] flex items-center justify-center font-black text-[#0a0a0b] ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.3 }}
      >
        {fallback}
      </div>
    )
  }
  
  return (
    <div 
      className={`rounded-xl overflow-hidden bg-gradient-to-br from-[#ee7b4d] to-[#d4663a] flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={src} 
        alt="Logo" 
        className="w-full h-full object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  )
}

// =====================================================
// CONTEXTO DE AUTENTICAÇÃO
// =====================================================
const AuthContext = createContext({})

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        setUsuario(null)
        setTenant(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (authId) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authId)
        .eq('ativo', true)
        .single()

      if (userError || !userData) {
        console.error('Erro ao buscar usuário:', userError)
        setLoading(false)
        return
      }

      setUsuario(userData)

      if (userData?.tenant_id) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userData.tenant_id)
          .single()

        if (tenantData) setTenant(tenantData)
      }

      setLoading(false)
    } catch (err) {
      console.error('Erro geral:', err)
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUsuario(null)
    setTenant(null)
  }

  const isAdmin = () => usuario?.role === 'admin'
  const isGerente = () => ['admin', 'gerente'].includes(usuario?.role)
  const hasPermission = (modulo, acao) => {
    if (isAdmin()) return true
    const perms = {
      gerente: { leads: ['visualizar', 'editar'], marcas: ['visualizar', 'editar'], usuarios: ['visualizar'], relatorios: ['visualizar', 'exportar'] },
      operador: { leads: ['visualizar', 'editar'], marcas: ['visualizar'], relatorios: ['visualizar'] }
    }
    return perms[usuario?.role]?.[modulo]?.includes(acao) || false
  }

  return (
    <AuthContext.Provider value={{ session, usuario, tenant, loading, login, logout, isAdmin, isGerente, hasPermission, isAuthenticated: !!session && !!usuario }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  return useContext(AuthContext)
}

// =====================================================
// HOOKS DE DADOS
// =====================================================
function useLeads() {
  const { usuario } = useAuth()
  return useQuery({
    queryKey: ['leads', usuario?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*, marca:marcas(id, nome, emoji, cor)')
        .eq('tenant_id', usuario.tenant_id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!usuario?.tenant_id
  })
}

function useMetrics() {
  const { usuario } = useAuth()
  return useQuery({
    queryKey: ['metrics', usuario?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('score, categoria, status')
        .eq('tenant_id', usuario.tenant_id)
      if (error) throw error
      const rows = data ?? []
      const total = rows.length
      return {
        total,
        hot: rows.filter(l => l.categoria === 'hot').length,
        warm: rows.filter(l => l.categoria === 'warm').length,
        cold: rows.filter(l => l.categoria === 'cold' || !l.categoria).length,
        convertidos: rows.filter(l => l.status === 'convertido').length,
        taxaConversao: total > 0 ? ((rows.filter(l => l.status === 'convertido').length / total) * 100).toFixed(1) : 0
      }
    },
    enabled: !!usuario?.tenant_id
  })
}

function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ ...dados, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, marca:marcas(id, nome, emoji, cor)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['metrics'] })
    }
  })
}

function useMarcas() {
  const { usuario } = useAuth()
  return useQuery({
    queryKey: ['marcas', usuario?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcas')
        .select('*')
        .eq('tenant_id', usuario.tenant_id)
        .eq('ativo', true)
        .order('ordem')
      if (error) throw error
      return data ?? []
    },
    enabled: !!usuario?.tenant_id
  })
}

function useCreateMarca() {
  const qc = useQueryClient()
  const { usuario } = useAuth()
  return useMutation({
    mutationFn: async (novaMarca) => {
      const { data: last } = await supabase
        .from('marcas')
        .select('ordem')
        .eq('tenant_id', usuario.tenant_id)
        .order('ordem', { ascending: false })
        .limit(1)
        .single()
      const { data, error } = await supabase
        .from('marcas')
        .insert({ tenant_id: usuario.tenant_id, ...novaMarca, ordem: (last?.ordem || 0) + 1 })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marcas'] })
  })
}

function useUpdateMarca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }) => {
      const { data, error } = await supabase
        .from('marcas')
        .update({ ...dados, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marcas'] })
  })
}

function useUsuarios() {
  const { usuario } = useAuth()
  return useQuery({
    queryKey: ['usuarios', usuario?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('tenant_id', usuario.tenant_id)
        .order('nome')
      if (error) throw error
      return data ?? []
    },
    enabled: !!usuario?.tenant_id
  })
}

function useCreateUsuario() {
  const qc = useQueryClient()
  const { usuario } = useAuth()
  return useMutation({
    mutationFn: async (novo) => {
      const { data, error } = await supabase
        .from('usuarios')
        .insert({ tenant_id: usuario.tenant_id, ...novo, ativo: true })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] })
  })
}

function useUpdateUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }) => {
      const { data, error } = await supabase
        .from('usuarios')
        .update(dados)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] })
  })
}

function useInteracoes(leadId) {
  return useQuery({
    queryKey: ['interacoes', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interacoes')
        .select('*, usuario:usuarios(id, nome)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!leadId
  })
}

function useCreateInteracao() {
  const qc = useQueryClient()
  const { usuario } = useAuth()
  return useMutation({
    mutationFn: async ({ leadId, tipo, descricao }) => {
      const { data, error } = await supabase
        .from('interacoes')
        .insert({ tenant_id: usuario.tenant_id, lead_id: leadId, usuario_id: usuario.id, tipo, conteudo: descricao })
        .select('*, usuario:usuarios(id, nome)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['interacoes', vars.leadId] })
  })
}

// =====================================================
// PÁGINA DE LOGIN
// =====================================================
function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLogging, setIsLogging] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLogging(true)
    if (!email || !password) { setError('Preencha todos os campos'); setIsLogging(false); return }
    const result = await login(email, password)
    if (!result.success) setError(result.error === 'Invalid login credentials' ? 'Email ou senha incorretos' : result.error)
    setIsLogging(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo src={LOGO_SISTEMA} fallback="LC" size={80} />
          </div>
          <h1 className="text-3xl font-light text-[#f5f5f4]">Lead<span className="text-[#ee7b4d] font-bold">Capture</span> Pro</h1>
          <p className="text-[#6a6a6f] text-sm mt-2">Acesse sua conta</p>
        </div>
        <div className="bg-[#12121a] border border-[#1f1f23] rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50" />
            </div>
            {error && <div className="bg-[#2a1515] border border-[#ef4444]/30 text-[#ef4444] px-4 py-3 rounded-xl text-sm">{error}</div>}
            <button type="submit" disabled={isLogging} className="w-full bg-gradient-to-r from-[#ee7b4d] to-[#d4663a] text-[#0a0a0b] font-bold py-4 rounded-xl hover:opacity-90 disabled:opacity-50">{isLogging ? 'Entrando...' : 'Entrar'}</button>
          </form>
        </div>
        <p className="text-center text-[10px] text-[#4a4a4f] mt-8 uppercase tracking-[0.3em]">© 2026 LeadCapture Pro</p>
      </div>
    </div>
  )
}

// =====================================================
// SIDEBAR - RESPONSIVO
// =====================================================
function Sidebar({ currentPage, setCurrentPage, mobileOpen, setMobileOpen }) {
  const { isAdmin } = useAuth()
  const navItems = [
    { id: 'dashboard', icon: '◉', label: 'Dashboard' },
    { id: 'relatorios', icon: '◈', label: 'Relatórios' },
    { id: 'marcas', icon: '🏷', label: 'Marcas' },
    ...(isAdmin() ? [{ id: 'usuarios', icon: '👥', label: 'Usuários' }] : []),
    { id: 'config', icon: '⚙', label: 'Configurações' }
  ]

  const handleNav = (id) => {
    setCurrentPage(id)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full bg-[#0a0a0b]/95 border-r border-[#1f1f23] flex flex-col items-center py-8 z-50
        transition-transform duration-300
        w-20
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="mb-12">
          <Logo src={LOGO_SISTEMA} fallback="LC" size={48} />
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => handleNav(item.id)} 
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative ${currentPage === item.id ? 'bg-[#1f1f23] text-[#ee7b4d]' : 'text-[#4a4a4f] hover:text-[#f5f5f4] hover:bg-[#1f1f23]/50'}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="absolute left-16 bg-[#1f1f23] text-[#f5f5f4] px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="mt-auto">
          <Logo src={LOGO_CLIENTE} fallback="👤" size={48} className="border border-[#2a2a2f]" />
        </div>
      </aside>
    </>
  )
}

// =====================================================
// HEADER - RESPONSIVO
// =====================================================
function Header({ onMenuClick }) {
  const { usuario, tenant, logout } = useAuth()
  
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-[#1f1f23]/50">
      <div className="px-4 lg:px-8 py-4 lg:py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Menu Hamburguer - Mobile */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 rounded-xl bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#f5f5f4]"
          >
            ☰
          </button>
          
          <Logo src={LOGO_SISTEMA} fallback="LC" size={36} className="lg:w-10 lg:h-10" />
          <div className="hidden sm:block">
            <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-1">{tenant?.nome || 'LeadCapture Pro'}</p>
            <h1 className="text-lg lg:text-xl font-light text-[#f5f5f4]">Lead<span className="text-[#ee7b4d] font-semibold">Capture</span> Pro</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 lg:px-4 py-2 bg-[#1a2e1a] border border-[#2d4a2d]/50 rounded-full">
            <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></span>
            <span className="text-[11px] font-medium text-[#4ade80]">Online</span>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[#f5f5f4]">{usuario?.nome}</p>
              <p className="text-[10px] text-[#4a4a4f] uppercase">{ROLES[usuario?.role]?.label}</p>
            </div>
            <button onClick={logout} className="w-10 h-10 rounded-xl bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-[#ef4444] hover:border-[#ef4444]/30" title="Sair">⏻</button>
          </div>
        </div>
      </div>
    </header>
  )
}

// =====================================================
// BOTTOM NAV - MOBILE ONLY
// =====================================================
function BottomNav({ currentPage, setCurrentPage }) {
  const { isAdmin } = useAuth()
  const navItems = [
    { id: 'dashboard', icon: '◉', label: 'Home' },
    { id: 'relatorios', icon: '◈', label: 'Relatórios' },
    { id: 'marcas', icon: '🏷', label: 'Marcas' },
    ...(isAdmin() ? [{ id: 'usuarios', icon: '👥', label: 'Usuários' }] : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/95 backdrop-blur-xl border-t border-[#1f1f23] z-40 lg:hidden">
      <div className="flex justify-around py-2">
        {navItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 min-w-[60px] ${
              currentPage === item.id ? 'text-[#ee7b4d]' : 'text-[#4a4a4f]'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

// =====================================================
// MODAL DE DETALHES DO LEAD - RESPONSIVO
// =====================================================
function LeadDetailModal({ lead, onClose, canEdit }) {
  const updateLead = useUpdateLead()
  const { data: interacoes } = useInteracoes(lead.id)
  const createInteracao = useCreateInteracao()
  const [observacao, setObservacao] = useState(lead.observacao || '')
  const [status, setStatus] = useState(lead.status || 'novo')
  const [novaNota, setNovaNota] = useState('')
  const [saving, setSaving] = useState(false)
  const marca = lead.marca || { nome: 'Sem marca', emoji: '🏢', cor: '#6a6a6f' }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    try { await updateLead.mutateAsync({ id: lead.id, status, observacao }); onClose() }
    catch (error) { alert('Erro ao salvar: ' + error.message) }
    finally { setSaving(false) }
  }

  const handleAddNota = async () => {
    if (!novaNota.trim()) return
    try { await createInteracao.mutateAsync({ leadId: lead.id, tipo: 'nota', descricao: novaNota.trim() }); setNovaNota('') }
    catch (err) { alert('Erro: ' + err.message) }
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0b]/90 backdrop-blur-sm flex items-end lg:items-center lg:justify-end z-[100]" onClick={onClose}>
      <div 
        className="h-[90vh] lg:h-full w-full lg:max-w-xl bg-[#12121a] border-t lg:border-t-0 lg:border-l border-[#1f1f23] rounded-t-3xl lg:rounded-none p-6 lg:p-8 overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Mobile */}
        <div className="w-12 h-1 bg-[#2a2a2f] rounded-full mx-auto mb-4 lg:hidden" />
        
        <div className="flex items-start justify-between mb-6 lg:mb-8">
          <div>
            <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">Detalhes do Lead</p>
            <h2 className="text-xl lg:text-2xl font-light text-[#f5f5f4]">{lead.nome || 'Lead'}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-[#f5f5f4]">✕</button>
        </div>

        <div className="mb-6 lg:mb-8">
          <div className={`inline-flex items-center gap-3 px-4 lg:px-5 py-3 rounded-2xl ${lead.score >= 70 ? 'bg-[#ee7b4d]/10 border border-[#ee7b4d]/20' : lead.score >= 40 ? 'bg-[#60a5fa]/10 border border-[#60a5fa]/20' : 'bg-[#4a4a4f]/10 border border-[#4a4a4f]/20'}`}>
            <span className={`text-2xl lg:text-3xl font-light ${lead.score >= 70 ? 'text-[#ee7b4d]' : lead.score >= 40 ? 'text-[#60a5fa]' : 'text-[#6a6a6f]'}`}>{lead.score || 0}</span>
            <div>
              <p className={`text-sm font-semibold ${lead.score >= 70 ? 'text-[#ee7b4d]' : lead.score >= 40 ? 'text-[#60a5fa]' : 'text-[#6a6a6f]'}`}>{lead.score >= 70 ? 'Lead Hot 🔥' : lead.score >= 40 ? 'Lead Warm 🌤' : 'Lead Cold ❄️'}</p>
              <p className="text-[10px] text-[#4a4a4f] uppercase">Score</p>
            </div>
          </div>
        </div>

        {lead.ia_justificativa && (
          <div className="mb-6 bg-[#1a1f2a] border border-[#2a3a4a]/50 rounded-2xl p-4">
            <p className="text-[10px] text-[#60a5fa] uppercase mb-2">🤖 Análise da IA</p>
            <p className="text-sm text-[#8a8a8f]">{lead.ia_justificativa}</p>
          </div>
        )}

        <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
          {[
            { label: 'E-mail', value: lead.email, icon: '✉' },
            { label: 'Telefone', value: lead.telefone, icon: '✆' },
            { label: 'Fonte', value: lead.fonte, icon: '◎' },
            { label: 'Marca', value: marca.nome, icon: marca.emoji },
            { label: 'Capital', value: lead.capital_disponivel ? `R$ ${Number(lead.capital_disponivel).toLocaleString()}` : null, icon: '💰' },
            { label: 'Local', value: lead.cidade && lead.estado ? `${lead.cidade}/${lead.estado}` : null, icon: '📍' }
          ].map((item, i) => (
            <div key={i} className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl lg:rounded-2xl p-3 lg:p-4 flex items-center gap-3 lg:gap-4">
              <span className="text-lg lg:text-xl opacity-50">{item.icon}</span>
              <div>
                <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-0.5">{item.label}</p>
                <p className="text-[#f5f5f4] font-medium text-sm lg:text-base">{item.value || '—'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-3">Observações</p>
          <textarea 
            value={observacao} 
            onChange={(e) => setObservacao(e.target.value.slice(0, 700))} 
            placeholder="Adicione observações..." 
            rows={3} 
            disabled={!canEdit} 
            className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl lg:rounded-2xl p-3 lg:p-4 text-[#f5f5f4] text-sm focus:outline-none focus:border-[#ee7b4d]/50 resize-none disabled:opacity-50" 
          />
        </div>

        <div className="mb-6">
          <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-3">Status do Lead</p>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            disabled={!canEdit} 
            className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl lg:rounded-2xl p-3 lg:p-4 text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50 appearance-none cursor-pointer disabled:opacity-50"
          >
            {Object.entries(STATUS_OPTIONS).filter(([k]) => k !== 'all').map(([key, nome]) => (
              <option key={key} value={key}>{nome}</option>
            ))}
          </select>
        </div>

        <div className="mb-6 lg:mb-8">
          <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-3">Histórico</p>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={novaNota} 
              onChange={(e) => setNovaNota(e.target.value)} 
              placeholder="Adicionar nota..." 
              className="flex-1 bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-3 lg:px-4 py-2 text-sm text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50" 
            />
            <button 
              onClick={handleAddNota} 
              disabled={!novaNota.trim()} 
              className="px-4 py-2 bg-[#1f1f23] border border-[#2a2a2f] rounded-xl text-sm text-[#f5f5f4] hover:border-[#ee7b4d]/50 disabled:opacity-50"
            >
              +
            </button>
          </div>
          <div className="space-y-3 max-h-40 lg:max-h-48 overflow-y-auto">
            {interacoes?.map((inter) => (
              <div key={inter.id} className="bg-[#1f1f23]/30 border border-[#2a2a2f]/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#8a8a8f]">{inter.tipo === 'nota' ? '📝 Nota' : inter.tipo}</span>
                  <span className="text-[10px] text-[#4a4a4f]">{new Date(inter.created_at).toLocaleString('pt-BR')}</span>
                </div>
                {inter.conteudo && <p className="text-sm text-[#6a6a6f]">{inter.conteudo}</p>}
                {inter.usuario && <p className="text-[10px] text-[#4a4a4f] mt-1">por {inter.usuario.nome}</p>}
              </div>
            ))}
            {(!interacoes || interacoes.length === 0) && (
              <p className="text-center text-[#4a4a4f] text-sm py-4">Nenhuma interação</p>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-3 pb-4 lg:pb-0">
            <button onClick={onClose} className="flex-1 py-3 lg:py-4 rounded-xl lg:rounded-2xl border border-[#2a2a2f] text-[#6a6a6f] font-semibold text-sm hover:bg-[#1f1f23]">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 lg:py-4 rounded-xl lg:rounded-2xl bg-[#ee7b4d] text-[#0a0a0b] font-semibold text-sm hover:bg-[#d4663a] disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
// CARD DE LEAD - MOBILE
// =====================================================
function LeadCard({ lead, onClick }) {
  const marca = lead.marca || { nome: 'Sem marca', emoji: '🏢', cor: '#6a6a6f' }
  
  return (
    <div 
      onClick={onClick}
      className="bg-[#12121a] border border-[#1f1f23] rounded-2xl p-4 active:scale-[0.98] transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#f5f5f4] truncate">{lead.nome || 'Sem nome'}</h3>
          <p className="text-xs text-[#4a4a4f]">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
        <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold ${lead.score >= 70 ? 'bg-[#ee7b4d]/20 text-[#ee7b4d]' : lead.score >= 40 ? 'bg-[#60a5fa]/20 text-[#60a5fa]' : 'bg-[#4a4a4f]/20 text-[#6a6a6f]'}`}>
          {lead.score || 0}
        </span>
      </div>
      
      <div className="space-y-1 mb-3">
        <p className="text-sm text-[#8a8a8f] truncate">{lead.email || '—'}</p>
        <p className="text-xs text-[#4a4a4f]">{lead.telefone || '—'}</p>
      </div>
      
      <div className="flex items-center justify-between">
        <span 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${marca.cor}15`, color: marca.cor }}
        >
          <span>{marca.emoji}</span>
          <span className="truncate max-w-[80px]">{marca.nome}</span>
        </span>
        <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${lead.categoria === 'hot' ? 'bg-[#ee7b4d]/20 text-[#ee7b4d]' : lead.categoria === 'warm' ? 'bg-[#60a5fa]/20 text-[#60a5fa]' : 'bg-[#4a4a4f]/20 text-[#6a6a6f]'}`}>
          {lead.categoria || 'cold'}
        </span>
      </div>
    </div>
  )
}

// =====================================================
// DASHBOARD - RESPONSIVO
// =====================================================
function DashboardPage() {
  const { data: leads, isLoading: leadsLoading } = useLeads()
  const { data: metrics } = useMetrics()
  const { data: marcas } = useMarcas()
  const { hasPermission } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [marcaFilter, setMarcaFilter] = useState('all')
  const [fonteFilter, setFonteFilter] = useState('all')
  const [categoriaFilter, setCategoriaFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const filteredLeads = leads?.filter(l => {
    const matchSearch = l.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || l.email?.toLowerCase().includes(searchTerm.toLowerCase()) || l.telefone?.includes(searchTerm)
    const matchMarca = marcaFilter === 'all' || l.marca_id === marcaFilter
    const matchFonte = fonteFilter === 'all' || l.fonte === fonteFilter
    const matchCategoria = categoriaFilter === 'all' || l.categoria === categoriaFilter
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchMarca && matchFonte && matchCategoria && matchStatus
  })

  const clearFilters = () => { setSearchTerm(''); setMarcaFilter('all'); setFonteFilter('all'); setCategoriaFilter('all'); setStatusFilter('all') }
  const hasActiveFilters = searchTerm || marcaFilter !== 'all' || fonteFilter !== 'all' || categoriaFilter !== 'all' || statusFilter !== 'all'

  if (leadsLoading) return <div className="p-8 text-center text-[#4a4a4f]">Carregando leads...</div>

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      {/* Métricas - Responsivo */}
      <section className="mb-6 lg:mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[
            { label: 'Total Leads', value: metrics?.total || 0, color: '#f5f5f4', icon: '◉', onClick: () => setCategoriaFilter('all') },
            { label: 'Leads Hot', value: metrics?.hot || 0, color: '#ee7b4d', icon: '🔥', onClick: () => setCategoriaFilter('hot') },
            { label: 'Leads Warm', value: metrics?.warm || 0, color: '#60a5fa', icon: '🌤', onClick: () => setCategoriaFilter('warm') },
            { label: 'Leads Cold', value: metrics?.cold || 0, color: '#6a6a6f', icon: '❄️', onClick: () => setCategoriaFilter('cold') }
          ].map((card, i) => (
            <div key={i} onClick={card.onClick} className="group bg-gradient-to-br from-[#1f1f23] to-[#17171a] p-4 lg:p-6 rounded-2xl border border-[#2a2a2f] hover:border-[#ee7b4d]/50 transition-all cursor-pointer active:scale-[0.98]">
              <div className="flex items-start justify-between mb-2 lg:mb-4">
                <span className="text-xl lg:text-2xl opacity-50 group-hover:opacity-100">{card.icon}</span>
              </div>
              <p className="text-2xl lg:text-4xl font-light mb-1" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[10px] lg:text-xs text-[#6a6a6f] font-medium uppercase">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabela/Lista de Leads */}
      <section className="bg-[#12121a] rounded-2xl lg:rounded-3xl border border-[#1f1f23] overflow-hidden">
        {/* Filtros */}
        <div className="p-4 lg:p-6 border-b border-[#1f1f23] bg-[#0f0f14]">
          {/* Mobile: Busca + Botão Filtros */}
          <div className="flex gap-2 lg:hidden mb-3">
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="flex-1 bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-4 py-3 text-sm placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50" 
            />
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium ${hasActiveFilters ? 'border-[#ee7b4d] text-[#ee7b4d] bg-[#ee7b4d]/10' : 'border-[#2a2a2f] text-[#6a6a6f]'}`}
            >
              ⚙
            </button>
          </div>

          {/* Mobile: Filtros expandidos */}
          {showFilters && (
            <div className="grid grid-cols-2 gap-2 lg:hidden mb-3">
              <select value={marcaFilter} onChange={(e) => setMarcaFilter(e.target.value)} className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-3 py-2 text-sm text-[#f5f5f4]">
                <option value="all">Todas Marcas</option>
                {marcas?.map((m) => (<option key={m.id} value={m.id}>{m.emoji} {m.nome}</option>))}
              </select>
              <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-3 py-2 text-sm text-[#f5f5f4]">
                {Object.entries(CATEGORIAS).map(([key, nome]) => (<option key={key} value={key}>{nome}</option>))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-3 py-2 text-sm text-[#f5f5f4]">
                {Object.entries(STATUS_OPTIONS).map(([key, nome]) => (<option key={key} value={key}>{nome}</option>))}
              </select>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-3 py-2 rounded-xl border border-[#ee7b4d]/30 text-[#ee7b4d] text-sm font-medium">Limpar</button>
              )}
            </div>
          )}

          {/* Desktop: Filtros inline */}
          <div className="hidden lg:flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Buscar</label>
              <input type="text" placeholder="Nome, email ou telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-4 py-3 text-sm placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Marca</label>
              <select value={marcaFilter} onChange={(e) => setMarcaFilter(e.target.value)} className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-4 py-3 text-sm text-[#f5f5f4] min-w-[150px]">
                <option value="all">Todas</option>
                {marcas?.map((m) => (<option key={m.id} value={m.id}>{m.emoji} {m.nome}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Fonte</label>
              <select value={fonteFilter} onChange={(e) => setFonteFilter(e.target.value)} className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-4 py-3 text-sm text-[#f5f5f4] min-w-[120px]">
                {Object.entries(FONTES).map(([key, nome]) => (<option key={key} value={key}>{nome}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Categoria</label>
              <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-4 py-3 text-sm text-[#f5f5f4] min-w-[120px]">
                {Object.entries(CATEGORIAS).map(([key, nome]) => (<option key={key} value={key}>{nome}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-4 py-3 text-sm text-[#f5f5f4] min-w-[140px]">
                {Object.entries(STATUS_OPTIONS).map(([key, nome]) => (<option key={key} value={key}>{nome}</option>))}
              </select>
            </div>
            {hasActiveFilters && (<button onClick={clearFilters} className="px-4 py-3 rounded-xl border border-[#ee7b4d]/30 text-[#ee7b4d] text-sm font-medium hover:bg-[#ee7b4d]/10">Limpar</button>)}
          </div>
        </div>

        {/* Desktop: Tabela */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#1f1f23] text-[10px] font-semibold text-[#4a4a4f] uppercase bg-[#0d0d12]">
            <div className="col-span-3">Lead</div>
            <div className="col-span-2">Contato</div>
            <div className="col-span-2">Marca</div>
            <div className="col-span-1">Fonte</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-1 text-center">Categoria</div>
            <div className="col-span-2">Status</div>
          </div>

          <div className="divide-y divide-[#1f1f23]/50 max-h-[500px] overflow-y-auto">
            {filteredLeads?.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-4xl mb-4 opacity-30">🔍</div>
                <p className="text-[#4a4a4f] text-sm mb-2">Nenhum lead encontrado</p>
                {hasActiveFilters && <button onClick={clearFilters} className="text-[#ee7b4d] text-sm hover:underline">Limpar filtros</button>}
              </div>
            ) : (
              filteredLeads?.map((lead) => {
                const marca = lead.marca || { nome: 'Sem marca', emoji: '🏢', cor: '#6a6a6f' }
                return (
                  <div key={lead.id} onClick={() => setSelectedLead(lead)} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#1f1f23]/30 cursor-pointer group">
                    <div className="col-span-3">
                      <p className="font-medium text-[#f5f5f4] group-hover:text-[#ee7b4d] truncate">{lead.nome || 'Sem nome'}</p>
                      <p className="text-xs text-[#4a4a4f]">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-[#8a8a8f] truncate">{lead.email || '—'}</p>
                      <p className="text-xs text-[#4a4a4f]">{lead.telefone || '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${marca.cor}15`, color: marca.cor }}>
                        <span>{marca.emoji}</span>
                        <span className="truncate max-w-[80px]">{marca.nome}</span>
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs text-[#6a6a6f] capitalize">{lead.fonte || '—'}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold ${lead.score >= 70 ? 'bg-[#ee7b4d]/20 text-[#ee7b4d]' : lead.score >= 40 ? 'bg-[#60a5fa]/20 text-[#60a5fa]' : 'bg-[#4a4a4f]/20 text-[#6a6a6f]'}`}>{lead.score || 0}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${lead.categoria === 'hot' ? 'bg-[#ee7b4d]/20 text-[#ee7b4d]' : lead.categoria === 'warm' ? 'bg-[#60a5fa]/20 text-[#60a5fa]' : 'bg-[#4a4a4f]/20 text-[#6a6a6f]'}`}>{lead.categoria || 'cold'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-[#8a8a8f]">{STATUS_OPTIONS[lead.status] || '🆕 Novo'}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Mobile: Cards */}
        <div className="lg:hidden p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredLeads?.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4 opacity-30">🔍</div>
              <p className="text-[#4a4a4f] text-sm mb-2">Nenhum lead encontrado</p>
              {hasActiveFilters && <button onClick={clearFilters} className="text-[#ee7b4d] text-sm">Limpar filtros</button>}
            </div>
          ) : (
            filteredLeads?.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
            ))
          )}
        </div>
      </section>

      {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} canEdit={hasPermission('leads', 'editar')} />}
    </div>
  )
}

// =====================================================
// RELATÓRIOS - RESPONSIVO
// =====================================================
function RelatoriosPage() {
  const { data: leads } = useLeads()
  const { data: marcas } = useMarcas()
  const [exportFilters, setExportFilters] = useState({ marca: true, categoria: true, status: true, fonte: true })

  const totalLeads = leads?.length || 0
  const leadsHot = leads?.filter(l => l.categoria === 'hot').length || 0
  const leadsWarm = leads?.filter(l => l.categoria === 'warm').length || 0
  const leadsCold = leads?.filter(l => l.categoria === 'cold').length || 0
  const convertidos = leads?.filter(l => l.status === 'convertido').length || 0
  const taxaConversao = totalLeads > 0 ? ((convertidos / totalLeads) * 100).toFixed(1) : 0

  const leadsPorMarca = leads?.reduce((acc, lead) => { const nome = lead.marca?.nome || 'Sem marca'; acc[nome] = (acc[nome] || 0) + 1; return acc }, {}) || {}

  const exportarCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone']
    if (exportFilters.fonte) headers.push('Fonte')
    if (exportFilters.marca) headers.push('Marca')
    headers.push('Score')
    if (exportFilters.categoria) headers.push('Categoria')
    if (exportFilters.status) headers.push('Status')
    headers.push('Data')
    
    const rows = leads?.map(l => {
      const row = [l.nome || '', l.email || '', l.telefone || '']
      if (exportFilters.fonte) row.push(l.fonte || '')
      if (exportFilters.marca) row.push(l.marca?.nome || '')
      row.push(l.score || 0)
      if (exportFilters.categoria) row.push(l.categoria || '')
      if (exportFilters.status) row.push(l.status || '')
      row.push(new Date(l.created_at).toLocaleDateString('pt-BR'))
      return row
    }) || []
    
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-light text-[#f5f5f4]">Rela<span className="text-[#ee7b4d] font-semibold">tórios</span></h1>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6 lg:mb-8">
        {[
          { label: 'Total', value: totalLeads, color: '#f5f5f4' },
          { label: 'Hot', value: leadsHot, color: '#ee7b4d' },
          { label: 'Warm', value: leadsWarm, color: '#60a5fa' },
          { label: 'Cold', value: leadsCold, color: '#6a6a6f' },
          { label: 'Conversão', value: `${taxaConversao}%`, color: '#4ade80' }
        ].map((c, i) => (
          <div key={i} className="bg-[#12121a] p-4 lg:p-5 rounded-2xl border border-[#1f1f23]">
            <p className="text-[10px] lg:text-xs text-[#6a6a6f] uppercase mb-1 lg:mb-2">{c.label}</p>
            <p className="text-2xl lg:text-3xl font-light" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Export CSV */}
      <div className="bg-[#12121a] rounded-2xl lg:rounded-3xl border border-[#1f1f23] p-4 lg:p-6 mb-6 lg:mb-8">
        <h3 className="text-sm font-semibold text-[#f5f5f4] mb-4 uppercase">📥 Exportar CSV</h3>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            {['marca', 'categoria', 'status', 'fonte'].map((f) => (
              <label key={f} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={exportFilters[f]} 
                  onChange={() => setExportFilters(p => ({ ...p, [f]: !p[f] }))} 
                  className="w-4 h-4 rounded accent-[#ee7b4d]" 
                />
                <span className="text-sm text-[#8a8a8f] capitalize">{f}</span>
              </label>
            ))}
          </div>
          <button onClick={exportarCSV} className="w-full lg:w-auto px-5 py-3 bg-[#ee7b4d] text-[#0a0a0b] rounded-xl font-semibold text-sm hover:bg-[#d4663a]">
            📥 Exportar
          </button>
        </div>
      </div>

      {/* Gráfico por Marca */}
      <div className="bg-[#12121a] rounded-2xl lg:rounded-3xl border border-[#1f1f23] p-4 lg:p-6">
        <h3 className="text-sm font-semibold text-[#f5f5f4] mb-4 lg:mb-6 uppercase">📊 Leads por Marca</h3>
        <div className="space-y-4">
          {Object.entries(leadsPorMarca).map(([nome, count]) => {
            const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0
            const marca = marcas?.find(m => m.nome === nome)
            return (
              <div key={nome}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#8a8a8f]">{marca?.emoji || '🏢'} {nome}</span>
                  <span className="text-[#f5f5f4] font-medium">{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-3 bg-[#1f1f23] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: marca?.cor || '#6a6a6f' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// MARCAS - RESPONSIVO
// =====================================================
function MarcasPage() {
  const { data: marcas, isLoading } = useMarcas()
  const createMarca = useCreateMarca()
  const updateMarca = useUpdateMarca()
  const { isGerente } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editingMarca, setEditingMarca] = useState(null)
  const [form, setForm] = useState({ nome: '', emoji: '🏢', cor: '#60a5fa', investimento_minimo: '', investimento_maximo: '', descricao: '' })
  const [saving, setSaving] = useState(false)

  const emojiOptions = ['🏢', '🧺', '🍦', '☕', '📚', '🏪', '🍕', '💼', '🏠', '🚗', '💇', '🏋️', '🎓', '🏥', '🛒']
  const corOptions = ['#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#ef4444', '#06b6d4', '#84cc16']
  const canEdit = isGerente()

  const handleSubmit = async () => {
    if (!form.nome.trim()) return
    setSaving(true)
    try {
      const dados = { nome: form.nome.trim(), emoji: form.emoji, cor: form.cor, investimento_minimo: parseFloat(form.investimento_minimo) || 0, investimento_maximo: parseFloat(form.investimento_maximo) || 0, descricao: form.descricao }
      if (editingMarca) await updateMarca.mutateAsync({ id: editingMarca.id, ...dados })
      else await createMarca.mutateAsync(dados)
      setShowModal(false)
      setEditingMarca(null)
      setForm({ nome: '', emoji: '🏢', cor: '#60a5fa', investimento_minimo: '', investimento_maximo: '', descricao: '' })
    } catch (err) { alert('Erro: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleEdit = (m) => {
    setEditingMarca(m)
    setForm({ nome: m.nome, emoji: m.emoji, cor: m.cor, investimento_minimo: m.investimento_minimo?.toString() || '', investimento_maximo: m.investimento_maximo?.toString() || '', descricao: m.descricao || '' })
    setShowModal(true)
  }

  if (isLoading) return <div className="p-8 text-center text-[#4a4a4f]">Carregando...</div>

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-light text-[#f5f5f4]">Mar<span className="text-[#ee7b4d] font-semibold">cas</span></h1>
        {canEdit && (
          <button 
            onClick={() => { setEditingMarca(null); setForm({ nome: '', emoji: '🏢', cor: '#60a5fa', investimento_minimo: '', investimento_maximo: '', descricao: '' }); setShowModal(true) }} 
            className="px-4 lg:px-5 py-2 bg-[#ee7b4d] text-[#0a0a0b] rounded-xl font-semibold text-sm hover:bg-[#d4663a]"
          >
            + Nova
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {marcas?.map((m) => (
          <div key={m.id} className="bg-[#12121a] rounded-2xl border border-[#1f1f23] p-4 lg:p-6 hover:border-[#2a2a2f] group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center text-xl lg:text-2xl" style={{ backgroundColor: `${m.cor}20` }}>
                  {m.emoji}
                </div>
                <div>
                  <h3 className="text-base lg:text-lg font-semibold text-[#f5f5f4]">{m.nome}</h3>
                  {m.investimento_minimo > 0 && (
                    <p className="text-xs text-[#4a4a4f]">R$ {m.investimento_minimo?.toLocaleString()} - R$ {m.investimento_maximo?.toLocaleString()}</p>
                  )}
                </div>
              </div>
              {canEdit && (
                <button onClick={() => handleEdit(m)} className="w-8 h-8 rounded-lg bg-[#1f1f23] flex items-center justify-center text-[#6a6a6f] hover:text-[#ee7b4d] opacity-100 lg:opacity-0 group-hover:opacity-100">
                  ✎
                </button>
              )}
            </div>
            {m.descricao && <p className="text-sm text-[#6a6a6f]">{m.descricao}</p>}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0a0a0b]/90 backdrop-blur-sm flex items-end lg:items-center justify-center z-[100]" onClick={() => setShowModal(false)}>
          <div className="bg-[#12121a] border-t lg:border border-[#1f1f23] rounded-t-3xl lg:rounded-3xl p-6 lg:p-8 w-full lg:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-[#2a2a2f] rounded-full mx-auto mb-4 lg:hidden" />
            <h2 className="text-lg lg:text-xl font-semibold text-[#f5f5f4] mb-6">{editingMarca ? 'Editar Marca' : 'Nova Marca'}</h2>
            <div className="space-y-4 lg:space-y-5">
              <div>
                <label className="text-[10px] text-[#4a4a4f] uppercase block mb-2">Nome *</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome da marca" className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#4a4a4f] uppercase block mb-2">Emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map((e) => (
                      <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })} className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${form.emoji === e ? 'bg-[#ee7b4d]/20 border-2 border-[#ee7b4d]' : 'bg-[#1f1f23] border border-[#2a2a2f]'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#4a4a4f] uppercase block mb-2">Cor</label>
                  <div className="flex flex-wrap gap-2">
                    {corOptions.map((c) => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, cor: c })} className={`w-9 h-9 rounded-lg ${form.cor === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#4a4a4f] uppercase block mb-2">Invest. Mín</label>
                  <input type="number" value={form.investimento_minimo} onChange={(e) => setForm({ ...form, investimento_minimo: e.target.value })} placeholder="100000" className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-[#4a4a4f] uppercase block mb-2">Invest. Máx</label>
                  <input type="number" value={form.investimento_maximo} onChange={(e) => setForm({ ...form, investimento_maximo: e.target.value })} placeholder="200000" className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#4a4a4f] uppercase block mb-2">Descrição</label>
                <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição..." rows={3} className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] resize-none focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 lg:mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-[#2a2a2f] text-[#6a6a6f] font-semibold hover:bg-[#1f1f23]">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#ee7b4d] text-[#0a0a0b] font-semibold hover:bg-[#d4663a] disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// USUÁRIOS - RESPONSIVO
// =====================================================
function UsuariosPage() {
  const { isAdmin, usuario: me } = useAuth()
  const { data: usuarios, isLoading } = useUsuarios()
  const createUsuario = useCreateUsuario()
  const updateUsuario = useUpdateUsuario()
  const [showModal, setShowModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState(null)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', role: 'operador' })
  const [saving, setSaving] = useState(false)

  if (!isAdmin()) return (
    <div className="p-8 text-center">
      <div className="text-6xl mb-4 opacity-30">🔒</div>
      <p className="text-[#6a6a6f]">Acesso restrito a administradores</p>
    </div>
  )

  const handleSubmit = async () => {
    if (!form.nome.trim() || (!editingUsuario && !form.email.trim())) return
    setSaving(true)
    try {
      if (editingUsuario) await updateUsuario.mutateAsync({ id: editingUsuario.id, nome: form.nome, telefone: form.telefone, role: form.role })
      else await createUsuario.mutateAsync({ nome: form.nome, email: form.email.toLowerCase(), telefone: form.telefone, role: form.role })
      setShowModal(false)
      setEditingUsuario(null)
      setForm({ nome: '', email: '', telefone: '', role: 'operador' })
    } catch (err) { alert('Erro: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleEdit = (u) => {
    setEditingUsuario(u)
    setForm({ nome: u.nome, email: u.email, telefone: u.telefone || '', role: u.role })
    setShowModal(true)
  }

  if (isLoading) return <div className="p-8 text-center text-[#4a4a4f]">Carregando...</div>

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-light text-[#f5f5f4]">Usuá<span className="text-[#ee7b4d] font-semibold">rios</span></h1>
        <button onClick={() => { setEditingUsuario(null); setForm({ nome: '', email: '', telefone: '', role: 'operador' }); setShowModal(true) }} className="px-4 lg:px-5 py-2 bg-[#ee7b4d] text-[#0a0a0b] rounded-xl font-semibold text-sm hover:bg-[#d4663a]">
          + Novo
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-[#1a2e1a] border border-[#2d4a2d]/50 rounded-2xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-[#4ade80] mb-2">⚠️ Importante sobre Senhas</h3>
        <p className="text-xs text-[#6a6a6f]">Após cadastrar o usuário aqui, é necessário criar o mesmo email no <strong>Supabase Auth</strong> com a senha desejada.</p>
      </div>

      {/* Lista de Usuários */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {usuarios?.filter(u => u.ativo).map((u) => {
          const role = ROLES[u.role] || ROLES.operador
          const isMe = u.id === me?.id
          return (
            <div key={u.id} className="bg-[#12121a] rounded-2xl border border-[#1f1f23] p-4 lg:p-6 group hover:border-[#2a2a2f]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-white font-bold text-base lg:text-lg" style={{ backgroundColor: role.color }}>
                    {u.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#f5f5f4] text-sm lg:text-base">{u.nome}</h3>
                      {isMe && <span className="text-[10px] bg-[#ee7b4d]/20 text-[#ee7b4d] px-2 py-0.5 rounded-full">você</span>}
                    </div>
                    <p className="text-xs text-[#4a4a4f] truncate max-w-[150px]">{u.email}</p>
                  </div>
                </div>
                {!isMe && (
                  <button onClick={() => handleEdit(u)} className="w-8 h-8 rounded-lg bg-[#1f1f23] flex items-center justify-center text-[#6a6a6f] hover:text-[#ee7b4d] opacity-100 lg:opacity-0 group-hover:opacity-100">
                    ✎
                  </button>
                )}
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${role.color}20`, color: role.color }}>
                {role.emoji} {role.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0a0a0b]/90 backdrop-blur-sm flex items-end lg:items-center justify-center z-[100]" onClick={() => setShowModal(false)}>
          <div className="bg-[#12121a] border-t lg:border border-[#1f1f23] rounded-t-3xl lg:rounded-3xl p-6 lg:p-8 w-full lg:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-[#2a2a2f] rounded-full mx-auto mb-4 lg:hidden" />
            <h2 className="text-lg lg:text-xl font-semibold text-[#f5f5f4] mb-6">{editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <div className="space-y-4 lg:space-y-5">
              <div>
                <label className="text-[10px] text-[#4a4a4f] uppercase block mb-2">Nome *</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-[#4a4a4f] uppercase block mb-2">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" disabled={!!editingUsuario} className={`w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] focus:outline-none ${editingUsuario ? 'opacity-50' : ''}`} />
              </div>
              <div>
                <label className="text-[10px] text-[#4a4a4f] uppercase block mb-2">Telefone</label>
                <input type="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-[#4a4a4f] uppercase block mb-2">Nível de Acesso *</label>
                <div className="grid grid-cols-3 gap-2 lg:gap-3">
                  {Object.entries(ROLES).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setForm({ ...form, role: k })} className={`p-3 lg:p-4 rounded-xl border text-center ${form.role === k ? 'border-[#ee7b4d] bg-[#ee7b4d]/10' : 'border-[#2a2a2f]'}`}>
                      <span className="text-xl lg:text-2xl block mb-1">{v.emoji}</span>
                      <span className="text-[10px] lg:text-xs font-medium text-[#f5f5f4]">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 lg:mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-[#2a2a2f] text-[#6a6a6f] font-semibold hover:bg-[#1f1f23]">Cancelar</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#ee7b4d] text-[#0a0a0b] font-semibold hover:bg-[#d4663a] disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// CONFIGURAÇÕES
// =====================================================
function ConfigPage() {
  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 text-center">
      <div className="text-6xl mb-4 opacity-30">⚙</div>
      <p className="text-[#4a4a4f]">Configurações em desenvolvimento</p>
    </div>
  )
}

// =====================================================
// APP PRINCIPAL
// =====================================================
function Dashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#f5f5f4]">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      
      <main className="lg:ml-20 min-h-screen pb-16 lg:pb-0">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'relatorios' && <RelatoriosPage />}
        {currentPage === 'marcas' && <MarcasPage />}
        {currentPage === 'usuarios' && <UsuariosPage />}
        {currentPage === 'config' && <ConfigPage />}
        
        <footer className="hidden lg:block px-8 py-6 border-t border-[#1f1f23] mt-8">
          <p className="text-center text-[10px] text-[#3a3a3f] font-medium uppercase tracking-[0.5em]">© 2026 LeadCapture Pro — Desenvolvido por: Juliana Zafalão</p>
        </footer>
      </main>

      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-[#1f1f23] border-t-[#ee7b4d] rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: '3px' }}></div>
        <p className="text-[#ee7b4d] text-xs uppercase tracking-[0.3em]">Carregando</p>
      </div>
    </div>
  )
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return isAuthenticated ? <Dashboard /> : <LoginPage />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  )
}
