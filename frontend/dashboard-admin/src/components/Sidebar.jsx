// Sidebar v5 -- Cores oficiais + UX melhorada para muitos itens
// Paleta: #0F172A fundo, #10B981 ativo, #F59E0B badge, cinzas
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LogoIcon from './LogoIcon';
import ConfirmModal from './shared/ConfirmModal';

const I = ({ children, title }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" title={title}>
    {children}
  </svg>
);
const IconLeads       = () => <I><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></I>;
const IconKanban      = () => <I><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></I>;
const IconRanking     = () => <I><path d="M6 9H4a2 2 0 00-2 2v9a2 2 0 002 2h2a2 2 0 002-2v-9a2 2 0 00-2-2z"/><path d="M13 5h-2a2 2 0 00-2 2v13a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z"/><path d="M20 2h-2a2 2 0 00-2 2v16a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2z"/></I>;
const IconAnalytics   = () => <I><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></I>;
const IconRelat       = () => <I><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 12h8M8 17h5"/></I>;
const IconAuto        = () => <I><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></I>;
const IconEmail       = () => <I><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></I>;
const IconCanais      = () => <I><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 1.3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></I>;
const IconCRM         = () => <I><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></I>;
const IconMarcas      = () => <I><path d="M3 21V7l9-4 9 4v14M9 21V12h6v9M3 10h18"/></I>;
const IconSegmentos   = () => <I><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.36 6.36M12 12L5.64 18.36"/></I>;
const IconTeam        = () => <I><circle cx="9" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 14c2.5 0 5 1.5 5 4"/></I>;
const IconLeadsSist   = () => <I><path d="M12 2L8.5 8.5 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-6.5-.77L12 2z"/></I>;
const IconAudit       = () => <I><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></I>;
const IconMonitor     = () => <I><path d="M2 12h2l3-9 4 18 3-9 2 5 2-5 2 4h2"/></I>;
const IconAPI         = () => <I><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></I>;
const IconConfig      = () => <I><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.2-1.6l2-1.5-2-3.5-2.3.7A7 7 0 0014.6 4l-.6-2h-4l-.6 2A7 7 0 007.5 6.1l-2.3-.7-2 3.5 2 1.5A7 7 0 005 12c0 .5.1 1 .2 1.6l-2 1.5 2 3.5 2.3-.7A7 7 0 009.4 20l.6 2h4l.6-2a7 7 0 001.9-2.1l2.3.7 2-3.5-2-1.5c.1-.6.2-1.1.2-1.6z"/></I>;
const IconLogoff      = () => <I><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></I>;

const GROUPS = [
  { label: 'Principal', items: [
    { path: '/dashboard',       icon: <IconLeads />,     label: 'Leads',      show: () => true },
    { path: '/kanban',          icon: <IconKanban />,    label: 'Funil',      show: () => true },
    { path: '/ranking',         icon: <IconRanking />,   label: 'Ranking',    show: () => true, badge: 'Novo' },
  ]},
  { label: 'Inteligencia', items: [
    { path: '/analytics',       icon: <IconAnalytics />, label: 'Analytics',  show: (a) => a.isDiretor() },
    { path: '/relatorios',      icon: <IconRelat />,     label: 'Relatorios', show: (a) => a.isConsultor() },
  ]},
  { label: 'Operacao', items: [
    { path: '/automacao',       icon: <IconAuto />,      label: 'Automacao',  show: (a) => a.isDiretor() },
    { path: '/email-marketing', icon: <IconEmail />,     label: 'Email',      show: (a) => a.isGestor(), badge: 'Novo' },
    { path: '/canais',          icon: <IconCanais />,    label: 'Canais',     show: (a) => a.isGestor() },
    { path: '/crm',             icon: <IconCRM />,       label: 'CRM',        show: (a) => a.isDiretor(), badge: 'Em breve' },
    { path: '/marcas',          icon: <IconMarcas />,    label: 'Marcas',     show: (a) => a.isGestor() },
    { path: '/segmentos',       icon: <IconSegmentos />, label: 'Segmentos',  show: (a) => a.isGestor() },
    { path: '/usuarios',        icon: <IconTeam />,      label: 'Time',       show: (a) => a.isGestor() },
  ]},
  { label: 'Plataforma', items: [
    { path: '/leads',           icon: <IconLeadsSist />, label: 'Leads Sist.', show: (a) => a.isPlatformAdmin() },
    { path: '/audit-log',       icon: <IconAudit />,     label: 'Audit',      show: (a) => a.isDiretor() },
    { path: '/monitoramento',   icon: <IconMonitor />,   label: 'Monitor.',   show: (a) => a.isAdmin() },
    { path: '/api-docs',        icon: <IconAPI />,       label: 'API Docs',   show: (a) => a.isDiretor() },
  ]},
  { label: 'Sistema', items: [
    { path: '/configuracoes',   icon: <IconConfig />,    label: 'Config',     show: (a) => a.isDiretor() },
  ]},
];

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      title={item.label}
      className={({ isActive }) =>
        'relative flex items-center rounded-xl mb-0.5 transition-all duration-150 ' +
        (collapsed ? 'justify-center p-2.5 ' : 'gap-3 px-3 py-2.5 ') +
        (isActive
          ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/20'
          : 'text-gray-500 hover:bg-white/5 hover:text-gray-200')
      }
    >
      <span className="shrink-0 leading-none">{item.icon}</span>
      {!collapsed && (
        <span className="text-[11px] font-bold leading-tight truncate">{item.label}</span>
      )}
      {item.badge && !collapsed && (
        <span className={`ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
          item.badge === 'Em breve' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' : 'bg-[#10B981]/15 text-[#10B981]'
        }`}>
          {item.badge === 'Em breve' ? 'breve' : 'new'}
        </span>
      )}
      {item.badge && collapsed && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#10B981]" />
      )}
    </NavLink>
  );
}

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [confirmLogoff, setConfirmLogoff] = useState(false);

  const close = () => { if (mobileOpen) setMobileOpen(false); };

  const handleLogoff = async () => {
    setConfirmLogoff(false);
    await auth.logout();
    navigate('/login', { replace: true });
  };

  const bar = (
    <aside
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      className={`flex flex-col h-full bg-[#0F172A] border-r border-white/[0.06]
        transition-all duration-250 ease-in-out
        ${collapsed ? 'w-16' : 'w-[200px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-white/[0.06] py-5
        ${collapsed ? 'justify-center px-0' : 'px-4 gap-3'}`}>
        <NavLink to="/dashboard" onClick={close} title="LeadCapture Pro" className="shrink-0">
          <LogoIcon size={collapsed ? 36 : 44} />
        </NavLink>
        {!collapsed && (
          <div>
            <p className="text-white font-black text-[13px] leading-none tracking-tight">LeadCapture</p>
            <p className="text-[#10B981] font-black text-[9px] uppercase tracking-[0.3em] mt-0.5">PRO</p>
          </div>
        )}
      </div>

      {/* Nav scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 scrollbar-none">
        {GROUPS.map((g) => {
          const items = g.items.filter(i => i.show(auth));
          if (!items.length) return null;
          return (
            <div key={g.label} className="mb-3">
              {!collapsed && (
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-700 px-1 mb-1">
                  {g.label}
                </p>
              )}
              {collapsed && <div className="border-t border-white/[0.05] my-2 mx-1" />}
              {items.map(item => (
                <div key={item.path} onClick={close}>
                  <NavItem item={item} collapsed={collapsed} />
                </div>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-2 space-y-1">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expandir' : 'Recolher'}
          className={`flex items-center w-full rounded-xl p-2.5 text-gray-600
            hover:bg-white/5 hover:text-gray-300 transition-all
            ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
          </svg>
          {!collapsed && <span className="text-[11px] font-bold">Recolher</span>}
        </button>

        {/* Logoff */}
        <button
          onClick={() => setConfirmLogoff(true)}
          title="Sair"
          className={`flex items-center w-full rounded-xl p-2.5 text-gray-600
            hover:bg-red-500/10 hover:text-red-400 transition-all
            ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          <IconLogoff />
          {!collapsed && <span className="text-[11px] font-bold">Sair</span>}
        </button>

        {/* Avatar */}
        <div className={`flex items-center pt-1 ${collapsed ? 'justify-center' : 'gap-2 px-1'}`}>
          <div
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-black"
            style={{
              background: auth.usuario?.role_color
                ? `linear-gradient(135deg, ${auth.usuario.role_color}, ${auth.usuario.role_color}88)`
                : 'linear-gradient(135deg, #10B981, #059669)',
              color: '#000',
            }}
            title={`${auth.usuario?.nome || ''} - ${auth.usuario?.role || ''}`}
          >
            {auth.usuario?.role_emoji || auth.usuario?.nome?.charAt(0)?.toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-300 truncate leading-tight">
                {auth.usuario?.nome?.split(' ')[0] || ''}
              </p>
              <p className="text-[8px] text-gray-600 truncate">{auth.tenant?.name || ''}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop - sticky */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0">{bar}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed left-0 top-0 z-50 h-full lg:hidden">{bar}</div>
      )}

      <ConfirmModal
        isOpen={confirmLogoff}
        title="Sair do sistema"
        message="Tem certeza que deseja encerrar sua sessao?"
        onConfirm={handleLogoff}
        onClose={() => setConfirmLogoff(false)}
      />
    </>
  );
}
