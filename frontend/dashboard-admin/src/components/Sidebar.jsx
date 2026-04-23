// ============================================================
// Sidebar.jsx — Navegação Recolhível com Acordeões
// LeadCapture Pro — Zafalão Tech
//
// DESIGN: Collapsible (240px expandido / 72px recolhido)
// Cores oficiais: navy #0F172A + verde #10B981
// ============================================================

import React, { useState, useCallback, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import LogoIcon from './LogoIcon'
import ConfirmModal from './shared/ConfirmModal'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// ÍCONES SVG
// ═══════════════════════════════════════════════════════════

const Icons = {
  Leads: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  Kanban: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" />
    </svg>
  ),
  Ranking: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
    </svg>
  ),
  Analytics: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-6" />
    </svg>
  ),
  Relatorios: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  Automacao: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4m-2.6-5.4l-2.8 2.8m-4.4 4.4l-2.8 2.8m0-10l2.8 2.8m4.4 4.4l2.8 2.8" />
    </svg>
  ),
  EmailMarketing: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
    </svg>
  ),
  Canais: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 1.3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  Marcas: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21V7l9-4 9 4v14M9 21V12h6v9" />
    </svg>
  ),
  Time: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="3" /><circle cx="17" cy="8" r="2.5" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 14c2.5 0 5 1.5 5 4" />
    </svg>
  ),
  Backoffice: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Monitoramento: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12h2l3-9 4 18 3-9 2 5 2-5 2 4h2" />
    </svg>
  ),
  AuditLog: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12l2 2 4-4" />
    </svg>
  ),
  API: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Config: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.2-1.6l2-1.5-2-3.5-2.3.7A7 7 0 0014.6 4l-.6-2h-4l-.6 2A7 7 0 007.5 6.1l-2.3-.7-2 3.5 2 1.5A7 7 0 005 12c0 .5.1 1 .2 1.6l-2 1.5 2 3.5 2.3-.7A7 7 0 009.4 20l.6 2h4l.6-2a7 7 0 001.9-2.1l2.3.7 2-3.5-2-1.5c.1-.6.2-1.1.2-1.6z" />
    </svg>
  ),
  Logoff: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
}

// ═══════════════════════════════════════════════════════════
// GRUPOS DE MENU
// ═══════════════════════════════════════════════════════════

const MENU_GROUPS = [
  {
    id: 'pipeline',
    label: 'Pipeline',
    color: '#10B981',
    defaultOpen: true,
    items: [
      { path: '/dashboard', icon: <Icons.Leads />, label: 'Leads' },
      { path: '/kanban', icon: <Icons.Kanban />, label: 'Funil' },
      { path: '/ranking', icon: <Icons.Ranking />, label: 'Ranking', badge: 'Novo' },
    ],
  },
  {
    id: 'inteligencia',
    label: 'Inteligência',
    color: '#3B82F6',
    defaultOpen: false,
    items: [
      { path: '/analytics', icon: <Icons.Analytics />, label: 'Analytics', roles: ['Diretor', 'Administrador', 'admin'] },
      { path: '/relatorios', icon: <Icons.Relatorios />, label: 'Relatórios' },
    ],
  },
  {
    id: 'operacao',
    label: 'Operação',
    color: '#F59E0B',
    defaultOpen: false,
    items: [
      { path: '/automacao', icon: <Icons.Automacao />, label: 'Automação', roles: ['Gestor', 'Diretor', 'Administrador', 'admin'] },
      { path: '/email-marketing', icon: <Icons.EmailMarketing />, label: 'Email Marketing', roles: ['Gestor', 'Diretor', 'Administrador', 'admin'], badge: 'Novo' },
      { path: '/canais', icon: <Icons.Canais />, label: 'Canais', roles: ['Gestor', 'Diretor', 'Administrador', 'admin'] },
      { path: '/marcas', icon: <Icons.Marcas />, label: 'Marcas', roles: ['Gestor', 'Diretor', 'Administrador', 'admin'] },
      { path: '/usuarios', icon: <Icons.Time />, label: 'Time', roles: ['Gestor', 'Diretor', 'Administrador', 'admin'] },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    color: '#8B5CF6',
    defaultOpen: false,
    items: [
      { path: '/backoffice', icon: <Icons.Backoffice />, label: 'Backoffice', roles: ['Administrador', 'admin'], superAdmin: true },
      { path: '/monitoramento', icon: <Icons.Monitoramento />, label: 'Monitoramento', roles: ['Administrador', 'admin'] },
      { path: '/audit-log', icon: <Icons.AuditLog />, label: 'Audit Log', roles: ['Diretor', 'Administrador', 'admin'] },
      { path: '/api-docs', icon: <Icons.API />, label: 'API Docs', roles: ['Diretor', 'Administrador', 'admin'], badge: 'Novo' },
      { path: '/configuracoes', icon: <Icons.Config />, label: 'Configurações', roles: ['Diretor', 'Administrador', 'admin'] },
    ],
  },
]

// ═══════════════════════════════════════════════════════════
// GRUPO DE MENU (acordeão ou ícones)
// ═══════════════════════════════════════════════════════════

function MenuGroup({ group, isOpen, onToggle, visibleItems, onNavClick, isCollapsed }) {
  if (visibleItems.length === 0) return null

  // Modo recolhido: apenas ícones centralizados com separador colorido
  if (isCollapsed) {
    return (
      <div className="mb-3">
        <div className="flex justify-center mb-1.5 px-2">
          <span className="w-4 h-[2px] rounded-full" style={{ background: group.color + '60' }} />
        </div>
        <div className="space-y-0.5 px-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              title={item.label}
              className={({ isActive }) =>
                'flex items-center justify-center w-full py-2.5 rounded-xl transition-all ' +
                (isActive
                  ? 'bg-[#10B981] text-black shadow-md shadow-[#10B981]/20'
                  : 'text-gray-500 hover:bg-white/[0.05] hover:text-gray-300')
              }
            >
              {item.icon}
            </NavLink>
          ))}
        </div>
      </div>
    )
  }

  // Modo expandido: acordeão completo
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all hover:bg-white/[0.03]"
        style={{ color: isOpen ? group.color : '#52525b' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 transition-all"
          style={{ background: isOpen ? group.color : '#3f3f46' }}
        />
        <span className="flex-1 text-left">{group.label}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: isOpen ? group.color : '#3f3f46' }}
        >
          <Icons.ChevronDown />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 pr-1 pt-1 space-y-0.5">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavClick}
                  title={item.label}
                  className={({ isActive }) =>
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ' +
                    (isActive
                      ? 'bg-[#10B981] text-black shadow-md shadow-[#10B981]/20'
                      : 'text-gray-500 hover:bg-white/[0.03] hover:text-gray-300')
                  }
                >
                  <span className="shrink-0 opacity-70">{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
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

const SIDEBAR_EXPANDED_W = 240
const SIDEBAR_COLLAPSED_W = 72

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [confirmLogoff, setConfirmLogoff] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem('lc-sidebar-collapsed') === 'true' }
    catch { return false }
  })
  const [openGroups, setOpenGroups] = useState(
    MENU_GROUPS.reduce((acc, g) => {
      acc[g.id] = g.defaultOpen
      return acc
    }, {})
  )

  // Sincroniza a largura do sidebar via CSS custom property
  useEffect(() => {
    const w = isCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W
    document.documentElement.style.setProperty('--sidebar-w', `${w}px`)
    try { localStorage.setItem('lc-sidebar-collapsed', String(isCollapsed)) }
    catch {}
  }, [isCollapsed])

  // Define a largura inicial imediatamente (antes do primeiro render)
  useEffect(() => {
    const stored = localStorage.getItem('lc-sidebar-collapsed') === 'true'
    const w = stored ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W
    document.documentElement.style.setProperty('--sidebar-w', `${w}px`)
  }, [])

  const toggleGroup = useCallback((groupId) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
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

  const sidebar = (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-[#0F172A] border-r border-white/5 flex flex-col z-50 overflow-hidden"
    >
      {/* Logo */}
      <NavLink
        to="/dashboard"
        onClick={handleNavClick}
        className="shrink-0 flex items-center gap-3 border-b border-white/5 overflow-hidden"
        style={{ padding: isCollapsed ? '18px 0' : '18px 20px', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
      >
        <LogoIcon size={32} className="shrink-0" />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="text-sm font-black text-white block leading-none">LeadCapture</span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#10B981]">PRO</span>
            </motion.div>
          )}
        </AnimatePresence>
      </NavLink>

      {/* Menu com scroll */}
      <nav className="flex-1 overflow-y-auto py-4" style={{ padding: isCollapsed ? '16px 4px' : '16px 8px' }}>
        {MENU_GROUPS.map((group) => (
          <MenuGroup
            key={group.id}
            group={group}
            isOpen={openGroups[group.id]}
            onToggle={() => toggleGroup(group.id)}
            visibleItems={getVisibleItems(group.items)}
            onNavClick={handleNavClick}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/5" style={{ padding: isCollapsed ? '12px 4px' : '12px 8px' }}>
        {isCollapsed ? (
          /* Modo recolhido: só ícone de logoff */
          <button
            onClick={() => setConfirmLogoff(true)}
            title="Sair do sistema"
            className="w-full flex items-center justify-center py-2.5 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <Icons.Logoff />
          </button>
        ) : (
          /* Modo expandido: logoff + info do usuário */
          <>
            <button
              onClick={() => setConfirmLogoff(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <Icons.Logoff />
              <span>Sair do sistema</span>
            </button>

            <div className="mt-3 flex items-center gap-3 px-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                style={{
                  background: auth.usuario?.role_color
                    ? `linear-gradient(135deg, ${auth.usuario.role_color}, ${auth.usuario.role_color}88)`
                    : 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#000',
                }}
              >
                {auth.usuario?.nome?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[11px] font-bold text-white truncate">
                  {auth.usuario?.nome?.split(' ')[0]}
                </p>
                <p className="text-[9px] text-gray-500 truncate">
                  {auth.tenant?.name || 'Sem tenant'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Botão recolher/expandir */}
        <button
          onClick={() => setIsCollapsed(v => !v)}
          className="w-full flex items-center justify-center gap-2 mt-2 py-2 rounded-xl text-gray-600 hover:bg-white/[0.04] hover:text-gray-400 transition-all text-xs"
        >
          {isCollapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span>Recolher</span></>
          }
        </button>
      </div>
    </motion.aside>
  )

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile */}
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
