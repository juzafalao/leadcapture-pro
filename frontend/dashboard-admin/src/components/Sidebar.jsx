// ============================================================
// Sidebar.jsx — Acordeão com seções recolhíveis
// LeadCapture Pro — Zafalão Tech
// ============================================================
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import LogoIcon from './LogoIcon'
import ConfirmModal from './shared/ConfirmModal'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// ÍCONES SVG
// ═══════════════════════════════════════════════════════════
const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Monitoramento: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12h2l3-9 4 18 3-9 2 5 2-5 2 4h2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  Leads: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2 21c0-4 3-6 7-6s7 2 7 6" />
      <circle cx="18" cy="8" r="2.5" />
      <path d="M16 21c0-2 1.5-3.5 4-3.5" />
    </svg>
  ),
  Kanban: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="15" rx="1" />
    </svg>
  ),
  Canais: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 1.3h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.91 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  Captura: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  WhatsApp: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  ),
  Qualificacao: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Automacao: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-2.6-5.4l-2.8 2.8m-4.4 4.4l-2.8 2.8m0-10l2.8 2.8m4.4 4.4l2.8 2.8" />
    </svg>
  ),
  Ranking: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
    </svg>
  ),
  Relatorios: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  EmailMarketing: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
    </svg>
  ),
  Backoffice: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Marcas: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21V7l9-4 9 4v14M9 21V12h6v9" />
    </svg>
  ),
  Time: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="3" /><circle cx="17" cy="8" r="2.5" />
      <path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 14c2.5 0 5 1.5 5 4" />
    </svg>
  ),
  AuditLog: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12l2 2 4-4" />
    </svg>
  ),
  API: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Config: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 00-.2-1.6l2-1.5-2-3.5-2.3.7A7 7 0 0014.6 4l-.6-2h-4l-.6 2A7 7 0 007.5 6.1l-2.3-.7-2 3.5 2 1.5A7 7 0 005 12c0 .5.1 1 .2 1.6l-2 1.5 2 3.5 2.3-.7A7 7 0 009.4 20l.6 2h4l.6-2a7 7 0 001.9-2.1l2.3.7 2-3.5-2-1.5c.1-.6.2-1.1.2-1.6z" />
    </svg>
  ),
  Logoff: () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
}

// ═══════════════════════════════════════════════════════════
// ESTRUTURA DE SEÇÕES
// ═══════════════════════════════════════════════════════════
const SECTIONS = [
  {
    id: 'principal',
    label: 'Principal',
    items: [
      { path: '/dashboard',     icon: <Icons.Dashboard />,    label: 'Dashboard' },
      { path: '/monitoramento', icon: <Icons.Monitoramento />, label: 'Monitoramento', roles: ['Diretor','Administrador','admin'] },
    ],
  },
  {
    id: 'operacao',
    label: 'Operação',
    items: [
      { path: '/pipeline', icon: <Icons.Leads />,  label: 'Leads' },
      { path: '/kanban',   icon: <Icons.Kanban />, label: 'Funil' },
      { path: '/canais',   icon: <Icons.Canais />, label: 'Canais', roles: ['Gestor','Diretor','Administrador','admin'] },
    ],
  },
  {
    id: 'automacao',
    label: 'Automação',
    roles: ['Gestor','Diretor','Administrador','admin'],
    items: [
      { path: '/captura',          icon: <Icons.Captura />,       label: 'Captura de Leads', badge: 'Beta' },
      { path: '/whatsapp',         icon: <Icons.WhatsApp />,      label: 'WhatsApp',         badge: 'Beta' },
      { path: '/qualificacao',     icon: <Icons.Qualificacao />,  label: 'Qualificação',     badge: 'Beta' },
      { path: '/automacao',        icon: <Icons.Automacao />,     label: 'Automação n8n' },
      { path: '/email-marketing',  icon: <Icons.EmailMarketing />,label: 'Email Marketing' },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    items: [
      { path: '/ranking', icon: <Icons.Ranking />, label: 'Ranking' },
    ],
  },
  {
    id: 'inteligencia',
    label: 'Inteligência',
    roles: ['Gestor','Diretor','Administrador','admin'],
    items: [
      { path: '/relatorios', icon: <Icons.Relatorios />, label: 'Relatórios' },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    roles: ['Diretor','Administrador','admin'],
    items: [
      { path: '/backoffice',    icon: <Icons.Backoffice />, label: 'Backoffice',    roles: ['Administrador','admin'], superAdmin: true },
      { path: '/marcas',        icon: <Icons.Marcas />,     label: 'Marcas',        roles: ['Gestor','Diretor','Administrador','admin'] },
      { path: '/usuarios',      icon: <Icons.Time />,       label: 'Time',          roles: ['Gestor','Diretor','Administrador','admin'] },
      { path: '/audit-log',     icon: <Icons.AuditLog />,   label: 'Audit Log',     roles: ['Diretor','Administrador','admin'] },
      { path: '/api-docs',      icon: <Icons.API />,        label: 'API Docs',      roles: ['Diretor','Administrador','admin'] },
      { path: '/configuracoes', icon: <Icons.Config />,     label: 'Configurações', roles: ['Diretor','Administrador','admin'] },
    ],
  },
]

const SIDEBAR_W           = 240
const SIDEBAR_COLLAPSED_W = 72

// ═══════════════════════════════════════════════════════════
// HELPER: quais seções contêm a rota atual
// ═══════════════════════════════════════════════════════════
function getSectionForPath(pathname) {
  const set = new Set()
  for (const s of SECTIONS) {
    if (s.items.some(it => pathname.startsWith(it.path))) set.add(s.id)
  }
  return set
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE DE SEÇÃO (acordeão)
// ═══════════════════════════════════════════════════════════
function SidebarSection({ section, visibleItems, onNavClick, isCollapsed, isOpen, onToggle }) {
  if (visibleItems.length === 0) return null

  if (isCollapsed) {
    return (
      <div className="mb-1">
        <div className="flex justify-center my-2 px-3">
          <div className="w-5 h-px bg-white/[0.06]" />
        </div>
        <div className="space-y-0.5 px-1.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              title={item.label}
              className={({ isActive }) =>
                'flex items-center justify-center rounded-xl py-2.5 transition-all duration-150 ' +
                (isActive
                  ? 'bg-[#10B981] text-black shadow-sm shadow-[#10B981]/25'
                  : 'text-[#64748B] hover:bg-white/[0.04] hover:text-[#CBD5E1]')
              }
            >
              <span className="shrink-0">{item.icon}</span>
            </NavLink>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-0.5">
      {/* Header clicável da seção */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 mt-2 group transition-colors"
      >
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-600 group-hover:text-gray-500 transition-colors">
          {section.label}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-gray-700 group-hover:text-gray-500 transition-all duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>

      {/* Itens com animação de slide */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 px-1.5 pb-1">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavClick}
                  className={({ isActive }) =>
                    'flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 ' +
                    (isActive
                      ? 'bg-[#10B981] text-black shadow-sm shadow-[#10B981]/25'
                      : 'text-[#64748B] hover:bg-white/[0.04] hover:text-[#CBD5E1]')
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="text-[12.5px] font-medium flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] shrink-0">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SIDEBAR PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const auth     = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [confirmLogoff, setConfirmLogoff] = useState(false)
  const [isCollapsed, setIsCollapsed]     = useState(() => {
    try { return localStorage.getItem('lc-sidebar-collapsed') === 'true' }
    catch { return false }
  })

  // Estado de abertura de cada seção — inicia com a seção ativa aberta
  const [openSections, setOpenSections] = useState(() => {
    const active = getSectionForPath(location.pathname)
    try {
      const stored = JSON.parse(localStorage.getItem('lc-sidebar-open') || '{}')
      // Garante que a seção ativa está aberta
      for (const id of active) stored[id] = true
      return stored
    } catch {
      const obj = {}
      for (const id of active) obj[id] = true
      return obj
    }
  })

  // Quando rota muda, abre a seção correspondente automaticamente
  useEffect(() => {
    const active = getSectionForPath(location.pathname)
    if (active.size === 0) return
    setOpenSections(prev => {
      const next = { ...prev }
      for (const id of active) next[id] = true
      return next
    })
  }, [location.pathname])

  useEffect(() => {
    const w = isCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W
    document.documentElement.style.setProperty('--sidebar-w', `${w}px`)
    try { localStorage.setItem('lc-sidebar-collapsed', String(isCollapsed)) }
    catch {}
  }, [isCollapsed])

  useEffect(() => {
    try { localStorage.setItem('lc-sidebar-open', JSON.stringify(openSections)) }
    catch {}
  }, [openSections])

  // Inicializa CSS var imediatamente (evita flash)
  useEffect(() => {
    const stored = localStorage.getItem('lc-sidebar-collapsed') === 'true'
    document.documentElement.style.setProperty('--sidebar-w', `${stored ? SIDEBAR_COLLAPSED_W : SIDEBAR_W}px`)
  }, [])

  const toggleSection = useCallback((id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleNavClick = useCallback(() => {
    if (mobileOpen) setMobileOpen(false)
  }, [mobileOpen, setMobileOpen])

  const handleLogoffConfirm = async () => {
    setConfirmLogoff(false)
    await auth.logout()
    navigate('/login', { replace: true })
  }

  const getVisibleItems = useCallback((items) => {
    return items.filter(item => {
      if (!item.roles) return true
      if (item.superAdmin && (auth.usuario?.is_super_admin || auth.usuario?.is_platform)) return true
      return item.roles.includes(auth.usuario?.role)
    })
  }, [auth.usuario])

  const isSectionVisible = useCallback((section) => {
    if (!section.roles) return true
    if (auth.usuario?.is_super_admin || auth.usuario?.is_platform) return true
    return section.roles.includes(auth.usuario?.role)
  }, [auth.usuario])

  const initials = auth.usuario?.nome?.charAt(0)?.toUpperCase() || '?'

  const sidebar = (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-[#0A0F1E] border-r border-white/[0.06] flex flex-col z-50 overflow-hidden"
    >
      {/* Logo */}
      <NavLink
        to="/dashboard"
        onClick={handleNavClick}
        className="shrink-0 flex items-center border-b border-white/[0.06] overflow-hidden"
        style={{
          gap: isCollapsed ? 0 : 12,
          padding: isCollapsed ? '16px 0' : '16px 20px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}
      >
        <LogoIcon size={30} className="shrink-0" />
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="text-[13px] font-black text-white block leading-tight tracking-tight">LeadCapture</span>
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#10B981]">PRO</span>
            </motion.div>
          )}
        </AnimatePresence>
      </NavLink>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {SECTIONS.map((section) => {
          if (!isSectionVisible(section)) return null
          const visibleItems = getVisibleItems(section.items)
          return (
            <SidebarSection
              key={section.id}
              section={section}
              visibleItems={visibleItems}
              onNavClick={handleNavClick}
              isCollapsed={isCollapsed}
              isOpen={!!openSections[section.id]}
              onToggle={() => toggleSection(section.id)}
            />
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.06]" style={{ padding: isCollapsed ? '10px 6px' : '10px 10px' }}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
              style={{
                background: auth.usuario?.role_color
                  ? `linear-gradient(135deg, ${auth.usuario.role_color}, ${auth.usuario.role_color}88)`
                  : 'linear-gradient(135deg, #10B981, #059669)',
                color: '#000',
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-white truncate leading-tight">
                {auth.usuario?.nome?.split(' ')[0]}
              </p>
              <p className="text-[9px] text-[#10B981] font-bold uppercase tracking-wider truncate">
                {auth.usuario?.role || '—'}
              </p>
            </div>
            <button
              onClick={() => setConfirmLogoff(true)}
              title="Sair"
              className="shrink-0 text-[#334155] hover:text-red-400 transition-colors p-1"
            >
              <Icons.Logoff />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmLogoff(true)}
            title="Sair do sistema"
            className="w-full flex items-center justify-center py-2 rounded-xl text-[#334155] hover:bg-red-500/10 hover:text-red-400 transition-all mb-1"
          >
            <Icons.Logoff />
          </button>
        )}

        {/* Botão recolher */}
        <button
          onClick={() => setIsCollapsed(v => !v)}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded-xl text-[#334155] hover:bg-white/[0.04] hover:text-[#64748B] transition-all text-[11px]"
        >
          {isCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <><ChevronLeft className="w-3.5 h-3.5" /><span>Recolher</span></>
          }
        </button>
      </div>
    </motion.aside>
  )

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="hidden lg:block">{sidebar}</div>
      {mobileOpen && <div className="lg:hidden">{sidebar}</div>}
      <ConfirmModal
        isOpen={confirmLogoff}
        title="Sair do sistema"
        message="Tem certeza que deseja encerrar sua sessão?"
        onConfirm={handleLogoffConfirm}
        onClose={() => setConfirmLogoff(false)}
      />
    </>
  )
}
