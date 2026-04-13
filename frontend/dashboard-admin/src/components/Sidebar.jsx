import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

// ── Icones SVG inline ─────────────────────────────────────────
function IconDash()    { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function IconKanban()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg> }
function IconRanking() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg> }
function IconRel()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 17H5a2 2 0 00-2 2v0a2 2 0 002 2h14a2 2 0 002-2v0a2 2 0 00-2-2h-4M9 17V7m0 10h6m0 0V7m0 10V7M9 7H5m4 0h6m0 0h4"/></svg> }
function IconEmail()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> }
function IconCanais()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg> }
function IconCRM()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> }
function IconAuto()    { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M20 12h-2M17.66 17.66l-1.41-1.41M12 20v-2M6.34 17.66l1.41-1.41M4 12h2M6.34 6.34l1.41 1.41"/></svg> }
function IconMarcas()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg> }
function IconUsuarios(){ return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> }
function IconAnalytics(){ return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function IconAuditLog(){ return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> }
function IconMonitoramento(){ return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> }
function IconLeads()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> }
function IconAPI()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg> }
function IconConfig()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M20 12h-2M17.66 17.66l-1.41-1.41M12 20v-2M6.34 17.66l1.41-1.41M4 12h2M6.34 6.34l1.41 1.41"/></svg> }

export default function Sidebar() {
  const { usuario, logout, isAuthenticated, isAdmin, isGestor, isDiretor } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = usuario?.role || '';
  const isSuperAdmin = usuario?.is_super_admin === true || usuario?.is_platform === true;

  const adminCheck  = () => isSuperAdmin || ['Administrador','admin'].includes(role);
  const diretorCheck= () => adminCheck() || role === 'Diretor';
  const gestorCheck = () => diretorCheck() || role === 'Gestor';
  const consultorCheck = () => gestorCheck() || ['Consultor','Operador'].includes(role);

  const menuItems = [
    // Consultor+
    { path: '/dashboard',      icon: <IconDash />,          label: 'Leads',          show: consultorCheck() },
    { path: '/kanban',         icon: <IconKanban />,         label: 'Kanban',         show: consultorCheck() },
    { path: '/ranking',        icon: <IconRanking />,        label: 'Ranking',        show: consultorCheck() },
    // Gestor+
    { path: '/relatorios',     icon: <IconRel />,            label: 'Relatórios',     show: gestorCheck() },
    { path: '/email-marketing',icon: <IconEmail />,          label: 'Email',          show: gestorCheck() },
    { path: '/canais',         icon: <IconCanais />,         label: 'Canais',         show: gestorCheck() },
    { path: '/marcas',         icon: <IconMarcas />,         label: 'Marcas',         show: gestorCheck() },
    { path: '/usuarios',       icon: <IconUsuarios />,       label: 'Usuários',       show: gestorCheck() },
    { path: '/automacao',      icon: <IconAuto />,           label: 'Automação',      show: gestorCheck() },
    // Diretor+
    { path: '/analytics',      icon: <IconAnalytics />,      label: 'Analytics',      show: diretorCheck() },
    { path: '/crm',            icon: <IconCRM />,            label: 'CRM',            show: diretorCheck() },
    { path: '/audit-log',      icon: <IconAuditLog />,       label: 'Audit Log',      show: diretorCheck() },
    { path: '/api-docs',       icon: <IconAPI />,            label: 'API Docs',       show: diretorCheck() },
    // Admin
    { path: '/leads',          icon: <IconLeads />,          label: 'Leads Sistema',  show: adminCheck() },
    { path: '/monitoramento',  icon: <IconMonitoramento />,  label: 'Monitoramento',  show: adminCheck() },
    // Sempre
    { path: '/configuracoes',  icon: <IconConfig />,         label: 'Configurações',  show: consultorCheck() },
  ].filter(item => item.show);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Fecha menu mobile ao navegar
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-[#0A0F1E] border-r border-white/5 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>

      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EE7B4D] to-[#F59E0B] flex items-center justify-center shrink-0 text-black font-black text-sm">
          L
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-black text-sm leading-tight truncate">LeadCapture</p>
            <p className="text-[#F59E0B] text-[9px] font-black uppercase tracking-widest">PRO</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                isActive
                  ? 'bg-[#EE7B4D]/15 text-[#EE7B4D] border border-[#EE7B4D]/20'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Usuário + Logout */}
      <div className={`px-2 py-3 border-t border-white/5 space-y-1`}>
        {!collapsed && usuario && (
          <div className="px-3 py-2 rounded-xl bg-white/3">
            <p className="text-white text-xs font-bold truncate">{usuario.nome}</p>
            <p className="text-gray-600 text-[10px] truncate">{usuario.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Sair' : undefined}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          {!collapsed && 'Sair'}
        </button>
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-white hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {collapsed
              ? <path d="M9 5l7 7-7 7"/>
              : <path d="M15 19l-7-7 7-7"/>}
          </svg>
          {!collapsed && 'Recolher'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile — botão hamburguer */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 w-10 h-10 bg-[#0F172A] border border-white/10 rounded-xl flex items-center justify-center text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        {/* Overlay mobile */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 z-50 h-full"
              >
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
