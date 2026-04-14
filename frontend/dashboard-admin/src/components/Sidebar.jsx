// Sidebar v5 -- identidade visual original + UX melhorada
// bg-[#0F172A], LogoIcon, ConfirmModal, ativo #10B981
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LogoIcon from './LogoIcon';
import ConfirmModal from './shared/ConfirmModal';

// -- Icons 20x20 (tamanho original) ----------------------
const IconLeads      = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>;
const IconKanban     = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>;
const IconRanking    = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 00-2 2v9a2 2 0 002 2h2a2 2 0 002-2v-9a2 2 0 00-2-2z"/><path d="M13 5h-2a2 2 0 00-2 2v13a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z"/><path d="M20 2h-2a2 2 0 00-2 2v16a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>;
const IconAnalytics  = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>;
const IconRelat      = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 12h8M8 17h5"/></svg>;
const IconAuto       = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>;
const IconEmail      = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>;
const IconCanais     = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 1.3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
const IconCRM        = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const IconMarcas     = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 21V7l9-4 9 4v14M9 21V12h6v9M3 10h18"/></svg>;
const IconSegmentos  = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.36 6.36M12 12L5.64 18.36"/></svg>;
const IconTeam       = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 14c2.5 0 5 1.5 5 4"/></svg>;
const IconLeadsSist  = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2L8.5 8.5 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-6.5-.77L12 2z"/></svg>;
const IconAudit      = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>;
const IconMonitor    = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 12h2l3-9 4 18 3-9 2 5 2-5 2 4h2"/></svg>;
const IconAPI        = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IconConfig     = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.2-1.6l2-1.5-2-3.5-2.3.7A7 7 0 0014.6 4l-.6-2h-4l-.6 2A7 7 0 007.5 6.1l-2.3-.7-2 3.5 2 1.5A7 7 0 005 12c0 .5.1 1 .2 1.6l-2 1.5 2 3.5 2.3-.7A7 7 0 009.4 20l.6 2h4l.6-2a7 7 0 001.9-2.1l2.3.7 2-3.5-2-1.5c.1-.6.2-1.1.2-1.6z"/></svg>;
const IconLogoff     = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

// -- Grupos de menu (estrutura original) -----------------
const NAV_GROUPS = [
  { label: 'Principal', items: [
    { path: '/dashboard',       icon: <IconLeads />,    label: 'Leads',       show: () => true },
    { path: '/kanban',          icon: <IconKanban />,   label: 'Funil',       show: () => true },
    { path: '/ranking',         icon: <IconRanking />,  label: 'Ranking',     show: () => true, badge: 'Novo' },
  ]},
  { label: 'Inteligencia', items: [
    { path: '/analytics',       icon: <IconAnalytics />,label: 'Analytics',   show: (a) => a.isDiretor() },
    { path: '/relatorios',      icon: <IconRelat />,    label: 'Relatorios',  show: (a) => a.isConsultor() },
  ]},
  { label: 'Operacao', items: [
    { path: '/automacao',       icon: <IconAuto />,     label: 'Automacao',   show: (a) => a.isDiretor() },
    { path: '/email-marketing', icon: <IconEmail />,    label: 'Email Mktg',  show: (a) => a.isGestor(), badge: 'Novo' },
    { path: '/canais',          icon: <IconCanais />,   label: 'Canais',      show: (a) => a.isGestor() },
    { path: '/crm',             icon: <IconCRM />,      label: 'CRM',         show: (a) => a.isDiretor(), badge: 'Em breve' },
    { path: '/marcas',          icon: <IconMarcas />,   label: 'Marcas',      show: (a) => a.isGestor() },
    { path: '/segmentos',       icon: <IconSegmentos />,label: 'Segmentos',   show: (a) => a.isGestor() },
    { path: '/usuarios',        icon: <IconTeam />,     label: 'Time',        show: (a) => a.isGestor() },
  ]},
  { label: 'Plataforma', items: [
    { path: '/leads',           icon: <IconLeadsSist />,label: 'Leads Sist.', show: (a) => a.isPlatformAdmin() },
    { path: '/audit-log',       icon: <IconAudit />,    label: 'Audit Log',   show: (a) => a.isDiretor() },
    { path: '/monitoramento',   icon: <IconMonitor />,  label: 'Monitor.',    show: (a) => a.isAdmin() },
    { path: '/api-docs',        icon: <IconAPI />,      label: 'API Docs',    show: (a) => a.isDiretor(), badge: 'Novo' },
  ]},
  { label: 'Sistema', items: [
    { path: '/configuracoes',   icon: <IconConfig />,   label: 'Config',      show: (a) => a.isDiretor() },
  ]},
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const auth     = useAuth();
  const navigate = useNavigate();
  const [confirmLogoff, setConfirmLogoff] = useState(false);

  const handleNavClick = () => { if (mobileOpen) setMobileOpen(false); };

  const handleLogoffConfirm = async () => {
    setConfirmLogoff(false);
    await auth.logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    // FIXO: fixed + h-screen + overflow interno controlado
    <aside className="fixed left-0 top-0 h-screen w-32 bg-[#0F172A] border-r border-white/5 flex flex-col items-center py-6 z-50">

      {/* Logo -- area dedicada sem competir com nav */}
      <NavLink to="/dashboard" onClick={handleNavClick} className="mb-8 px-2 flex flex-col items-center gap-1.5">
        <LogoIcon size={72} />
        <span className="text-[7px] font-black uppercase tracking-[0.25em] text-[#10B981]">PRO</span>
      </NavLink>

      {/* Nav com scroll interno -- nao vaza para a pagina */}
      <nav className="flex-1 w-full px-2 overflow-y-auto overflow-x-hidden scrollbar-none">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter(i => i.show(auth));
          if (!visible.length) return null;
          return (
            <div key={group.label} className="mb-3">
              <p className="text-[7px] font-black uppercase tracking-[0.18em] text-gray-700 text-center mb-1.5 px-1">
                {group.label}
              </p>
              {visible.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  title={item.label}
                  className={({ isActive }) =>
                    'flex flex-col items-center gap-1 p-2.5 rounded-2xl mb-0.5 w-full transition-all duration-150 ' +
                    (isActive
                      ? 'bg-[#10B981] text-black shadow-md shadow-[#10B981]/20'
                      : 'text-gray-600 hover:bg-white/5 hover:text-gray-300')
                  }
                >
                  <span className="leading-none">{item.icon}</span>
                  <span className="text-[6.5px] font-black uppercase tracking-widest leading-none text-center">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`text-[5px] font-black uppercase px-1 py-0.5 rounded-full leading-none ${
                      item.badge === 'Em breve'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                        : 'bg-[#10B981]/20 text-[#10B981]'
                    }`}>
                      {item.badge === 'Em breve' ? 'breve' : 'novo'}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer: logoff + avatar -- FORA do scroll */}
      <div className="w-full px-2 pt-3 border-t border-white/5 shrink-0">
        <button
          onClick={() => setConfirmLogoff(true)}
          title="Sair do sistema"
          className="flex flex-col items-center gap-1 p-2.5 rounded-2xl mb-2 w-full text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <IconLogoff />
          <span className="text-[6.5px] font-black uppercase tracking-widest leading-none">Logoff</span>
        </button>

        <div className="flex flex-col items-center gap-1 pb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
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
          <span className="text-[6px] font-bold uppercase tracking-wider text-gray-700 text-center leading-tight max-w-full truncate px-1">
            {auth.tenant?.name || ''}
          </span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop -- sidebar FIXO (fixed), o main tem lg:pl-32 */}
      <div className="hidden lg:block">
        {sidebar}
      </div>

      {/* Mobile -- mostra quando aberto */}
      {mobileOpen && (
        <div className="lg:hidden">
          {sidebar}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmLogoff}
        title="Sair do sistema"
        message="Tem certeza que deseja encerrar sua sessao?"
        onConfirm={handleLogoffConfirm}
        onClose={() => setConfirmLogoff(false)}
      />
    </>
  );
}
