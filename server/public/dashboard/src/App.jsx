// =====================================================
// LEADCAPTURE PRO - APP.JSX v5.0 MOBILE-FIRST
// Design responsivo otimizado para celular e desktop
// =====================================================

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ============ CONFIGURAÇÃO ============
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
const queryClient = new QueryClient()

// ============ LOGOS ============
const LOGO_SISTEMA = '/logo-sistema.png'
const LOGO_CLIENTE = '/logo-cliente.png'

// ============ ÍCONES SVG ============
const Icons = {
  menu: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  close: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  leads: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  marcas: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  reports: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  logout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  filter: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  download: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  phone: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  mail: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  chevronRight: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  fire: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>,
  plus: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  back: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
}

// ============ COMPONENTE LOGO ============
const Logo = ({ src, fallback, size = 40, className = '' }) => {
  const [error, setError] = useState(false)
  if (error || !src) {
    return (
      <div 
        className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {fallback}
      </div>
    )
  }
  return (
    <img 
      src={src} 
      alt="Logo" 
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  )
}

// ============ HOOKS CUSTOMIZADOS ============
const useAuth = () => {
  const [user, setUser] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchUsuario(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchUsuario(session.user.id)
      else { setUsuario(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUsuario = async (authId) => {
    const { data } = await supabase
      .from('usuarios')
      .select('*, tenant:tenants(*)')
      .eq('auth_id', authId)
      .eq('ativo', true)
      .single()
    setUsuario(data)
    setLoading(false)
  }

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUsuario(null)
  }

  return { user, usuario, loading, login, logout }
}

// ============ COMPONENTES UI ============
const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    hot: 'bg-red-500/20 text-red-400 border-red-500/30',
    warm: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    novo: 'bg-green-500/20 text-green-400 border-green-500/30',
    em_atendimento: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    convertido: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    perdido: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    default: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  }
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${variants[variant] || variants.default} ${sizes[size]}`}>
      {children}
    </span>
  )
}

const Card = ({ children, className = '', onClick }) => (
  <div 
    className={`bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl ${onClick ? 'cursor-pointer hover:bg-gray-800/70 active:scale-[0.98] transition-all' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
)

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    ghost: 'hover:bg-gray-700/50 text-gray-300',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2',
  }
  return (
    <button 
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const Input = ({ label, className = '', ...props }) => (
  <div className="space-y-1">
    {label && <label className="text-sm text-gray-400">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all ${className}`}
      {...props}
    />
  </div>
)

const Select = ({ label, options = [], className = '', ...props }) => (
  <div className="space-y-1">
    {label && <label className="text-sm text-gray-400">{label}</label>}
    <select 
      className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 outline-none ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
)

// ============ PÁGINA DE LOGIN ============
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await onLogin(email, password)
    if (error) setError('Email ou senha inválidos')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo src={LOGO_SISTEMA} fallback="LC" size={80} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">LeadCapture Pro</h1>
          <p className="text-gray-400 mt-1">Sistema de Gestão de Leads</p>
        </div>
        
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

// ============ LAYOUT MOBILE-FIRST ============
const MobileLayout = ({ children, usuario, currentPage, setCurrentPage, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { id: 'leads', label: 'Leads', icon: Icons.leads },
    { id: 'marcas', label: 'Marcas', icon: Icons.marcas },
    { id: 'usuarios', label: 'Usuários', icon: Icons.users, roles: ['admin'] },
    { id: 'relatorios', label: 'Relatórios', icon: Icons.reports },
  ]

  const filteredMenu = menuItems.filter(item => 
    !item.roles || item.roles.includes(usuario?.role)
  )

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header Mobile */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-400">
          {Icons.menu}
        </button>
        <Logo src={LOGO_SISTEMA} fallback="LC" size={32} />
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo src={LOGO_SISTEMA} fallback="LC" size={40} />
              <div>
                <h1 className="font-bold text-white">LeadCapture</h1>
                <p className="text-xs text-gray-500">Pro v5.0</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400 lg:hidden">
              {Icons.close}
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredMenu.map(item => (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentPage === item.id 
                    ? 'bg-orange-500/20 text-orange-400' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                {usuario?.nome?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{usuario?.nome}</p>
                <p className="text-xs text-gray-500 truncate">{usuario?.role}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-red-400" onClick={onLogout}>
              {Icons.logout}
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur border-t border-gray-800 lg:hidden">
        <div className="flex justify-around py-2">
          {filteredMenu.slice(0, 4).map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                currentPage === item.id ? 'text-orange-400' : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// ============ DASHBOARD ============
const Dashboard = ({ usuario }) => {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads', usuario?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('*, marca:marcas(nome, emoji)')
        .eq('tenant_id', usuario.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100)
      return data || []
    },
    enabled: !!usuario?.tenant_id,
  })

  const hoje = new Date().toISOString().split('T')[0]
  const leadsHoje = leads.filter(l => l.created_at?.startsWith(hoje))
  const hotsHoje = leadsHoje.filter(l => l.categoria === 'hot')
  const totalHot = leads.filter(l => l.categoria === 'hot').length
  const totalWarm = leads.filter(l => l.categoria === 'warm').length
  const totalCold = leads.filter(l => l.categoria === 'cold').length

  const metrics = [
    { label: 'Leads Hoje', value: leadsHoje.length, color: 'from-blue-500 to-blue-600' },
    { label: 'Hot Hoje', value: hotsHoje.length, color: 'from-red-500 to-red-600', icon: Icons.fire },
    { label: 'Total Hot', value: totalHot, color: 'from-orange-500 to-orange-600' },
    { label: 'Total Warm', value: totalWarm, color: 'from-yellow-500 to-yellow-600' },
  ]

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Bem-vindo, {usuario?.nome?.split(' ')[0]}!</p>
      </div>

      {/* Métricas - Grid responsivo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="p-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center text-white mb-3`}>
              {metric.icon || <span className="text-lg font-bold">#</span>}
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-white">{metric.value}</p>
            <p className="text-sm text-gray-400">{metric.label}</p>
          </Card>
        ))}
      </div>

      {/* Leads Recentes */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Leads Recentes</h2>
        <div className="space-y-3">
          {leads.slice(0, 10).map(lead => (
            <Card key={lead.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{lead.marca?.emoji || '🏢'}</span>
                    <h3 className="font-medium text-white truncate">{lead.nome}</h3>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{lead.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={lead.categoria} size="sm">
                      {lead.categoria?.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">Score: {lead.score}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  {lead.capital_disponivel && (
                    <p className="text-sm font-medium text-green-400 mt-1">
                      R$ {Number(lead.capital_disponivel).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ LEADS ============
const LeadsPage = ({ usuario }) => {
  const [search, setSearch] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const queryClient = useQueryClient()

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', usuario?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('*, marca:marcas(nome, emoji)')
        .eq('tenant_id', usuario.tenant_id)
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!usuario?.tenant_id,
  })

  const filteredLeads = leads.filter(lead => {
    const matchSearch = !search || 
      lead.nome?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
    const matchCategoria = !filterCategoria || lead.categoria === filterCategoria
    const matchStatus = !filterStatus || lead.status === filterStatus
    return matchSearch && matchCategoria && matchStatus
  })

  const updateLead = async (id, updates) => {
    await supabase.from('leads').update(updates).eq('id', id)
    queryClient.invalidateQueries(['leads'])
    setSelectedLead(null)
  }

  // Lead Detail Modal
  if (selectedLead) {
    return (
      <div className="p-4 lg:p-6 pb-24 lg:pb-6">
        <button 
          onClick={() => setSelectedLead(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          {Icons.back}
          <span>Voltar</span>
        </button>

        <Card className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{selectedLead.nome}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={selectedLead.categoria}>
                  {selectedLead.categoria?.toUpperCase()}
                </Badge>
                <span className="text-gray-400">Score: {selectedLead.score}</span>
              </div>
            </div>
            <span className="text-3xl">{selectedLead.marca?.emoji || '🏢'}</span>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center gap-3 text-gray-300">
              {Icons.mail}
              <span>{selectedLead.email || 'Não informado'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              {Icons.phone}
              <span>{selectedLead.telefone || 'Não informado'}</span>
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">Capital:</span>{' '}
              <span className="text-green-400 font-medium">
                R$ {Number(selectedLead.capital_disponivel || 0).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="text-gray-300">
              <span className="text-gray-500">Cidade:</span>{' '}
              {selectedLead.cidade || 'Não informado'}/{selectedLead.estado || 'N/A'}
            </div>
          </div>

          {selectedLead.ia_justificativa && (
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Análise IA:</p>
              <p className="text-white">{selectedLead.ia_justificativa}</p>
            </div>
          )}

          {selectedLead.mensagem_original && (
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Mensagem:</p>
              <p className="text-white">{selectedLead.mensagem_original}</p>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Alterar Status</label>
            <Select
              value={selectedLead.status}
              onChange={(e) => updateLead(selectedLead.id, { status: e.target.value })}
              options={[
                { value: 'novo', label: '🆕 Novo' },
                { value: 'em_atendimento', label: '📞 Em Atendimento' },
                { value: 'agendado', label: '📅 Agendado' },
                { value: 'convertido', label: '✅ Convertido' },
                { value: 'perdido', label: '❌ Perdido' },
              ]}
            />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Leads</h1>

      {/* Busca e Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {Icons.search}
          </span>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            options={[
              { value: '', label: 'Categoria' },
              { value: 'hot', label: '🔥 Hot' },
              { value: 'warm', label: '🌡️ Warm' },
              { value: 'cold', label: '❄️ Cold' },
            ]}
            className="min-w-[120px]"
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'Status' },
              { value: 'novo', label: 'Novo' },
              { value: 'em_atendimento', label: 'Em Atendimento' },
              { value: 'convertido', label: 'Convertido' },
              { value: 'perdido', label: 'Perdido' },
            ]}
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* Lista de Leads */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Carregando...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Nenhum lead encontrado</div>
        ) : (
          filteredLeads.map(lead => (
            <Card key={lead.id} className="p-4" onClick={() => setSelectedLead(lead)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{lead.marca?.emoji || '🏢'}</span>
                    <h3 className="font-medium text-white truncate">{lead.nome}</h3>
                  </div>
                  <p className="text-sm text-gray-400 truncate mt-0.5">{lead.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={lead.categoria} size="sm">
                      {lead.categoria?.toUpperCase()}
                    </Badge>
                    <Badge variant={lead.status} size="sm">
                      {lead.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-gray-400">
                  {Icons.chevronRight}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

// ============ MARCAS ============
const MarcasPage = ({ usuario }) => {
  const { data: marcas = [] } = useQuery({
    queryKey: ['marcas', usuario?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('marcas')
        .select('*')
        .eq('tenant_id', usuario.tenant_id)
        .eq('ativo', true)
        .order('nome')
      return data || []
    },
    enabled: !!usuario?.tenant_id,
  })

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Marcas</h1>
        {['admin', 'gerente'].includes(usuario?.role) && (
          <Button size="sm">
            {Icons.plus}
            <span className="hidden sm:inline">Nova</span>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {marcas.map(marca => (
          <Card key={marca.id} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{marca.emoji || '🏢'}</span>
              <div>
                <h3 className="font-medium text-white">{marca.nome}</h3>
                <p className="text-xs text-gray-500">{marca.slug}</p>
              </div>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Mín: R$ {Number(marca.investimento_minimo || 0).toLocaleString('pt-BR')}</p>
              <p>Máx: R$ {Number(marca.investimento_maximo || 0).toLocaleString('pt-BR')}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============ USUÁRIOS ============
const UsuariosPage = ({ usuario }) => {
  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios', usuario?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('tenant_id', usuario.tenant_id)
        .order('nome')
      return data || []
    },
    enabled: !!usuario?.tenant_id && usuario?.role === 'admin',
  })

  const roleColors = {
    admin: 'text-red-400',
    gerente: 'text-yellow-400',
    operador: 'text-blue-400',
  }

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Usuários</h1>
        <Button size="sm">
          {Icons.plus}
          <span className="hidden sm:inline">Convidar</span>
        </Button>
      </div>

      <div className="space-y-3">
        {usuarios.map(u => (
          <Card key={u.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                {u.nome?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white">{u.nome}</h3>
                <p className="text-sm text-gray-400 truncate">{u.email}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${roleColors[u.role]}`}>
                  {u.role}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {u.ativo ? '🟢 Ativo' : '🔴 Inativo'}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ============ RELATÓRIOS ============
const RelatoriosPage = ({ usuario }) => {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads', usuario?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', usuario.tenant_id)
      return data || []
    },
    enabled: !!usuario?.tenant_id,
  })

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Score', 'Categoria', 'Status', 'Data']
    const rows = leads.map(l => [
      l.nome, l.email, l.telefone, l.score, l.categoria, l.status,
      new Date(l.created_at).toLocaleDateString('pt-BR')
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const total = leads.length
  const hot = leads.filter(l => l.categoria === 'hot').length
  const warm = leads.filter(l => l.categoria === 'warm').length
  const cold = leads.filter(l => l.categoria === 'cold').length
  const convertidos = leads.filter(l => l.status === 'convertido').length
  const taxaConversao = total > 0 ? ((convertidos / total) * 100).toFixed(1) : 0

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <Button onClick={exportCSV}>
          {Icons.download}
          <span>Exportar CSV</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-white">{total}</p>
          <p className="text-sm text-gray-400">Total de Leads</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{hot}</p>
          <p className="text-sm text-gray-400">Leads Hot</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{warm}</p>
          <p className="text-sm text-gray-400">Leads Warm</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{cold}</p>
          <p className="text-sm text-gray-400">Leads Cold</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Taxa de Conversão</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${taxaConversao}%` }}
            />
          </div>
          <span className="text-2xl font-bold text-green-400">{taxaConversao}%</span>
        </div>
        <p className="text-sm text-gray-400 mt-2">{convertidos} de {total} leads convertidos</p>
      </Card>
    </div>
  )
}

// ============ APP PRINCIPAL ============
const AppContent = () => {
  const { user, usuario, loading, login, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user || !usuario) {
    return <LoginPage onLogin={login} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard usuario={usuario} />
      case 'leads': return <LeadsPage usuario={usuario} />
      case 'marcas': return <MarcasPage usuario={usuario} />
      case 'usuarios': return <UsuariosPage usuario={usuario} />
      case 'relatorios': return <RelatoriosPage usuario={usuario} />
      default: return <Dashboard usuario={usuario} />
    }
  }

  return (
    <MobileLayout 
      usuario={usuario} 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      onLogout={logout}
    >
      {renderPage()}
    </MobileLayout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
