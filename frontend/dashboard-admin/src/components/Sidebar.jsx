import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LogoIcon from './LogoIcon';
import ConfirmModal from './shared/ConfirmModal';

// ─── SVG Icon components ───────────────────────────────────────
const IconLeads = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="8"/>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
  </svg>
);

const IconAnalytics = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="12" width="4" height="9"/>
    <rect x="10" y="7" width="4" height="14"/>
    <rect x="17" y="3" width="4" height="18"/>
  </svg>
);

const IconRelatorios = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <path d="M8 7h8M8 12h8M8 17h5"/>
  </svg>
);

const IconAutomacao = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
  </svg>
);

const IconMarcas = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 21V7l9-4 9 4v14"/>
    <path d="M9 21V12h6v9"/>
    <path d="M3 10h18"/>
  </svg>
);

const IconSegmentos = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 3v9l6.36 6.36"/>
    <path d="M12 12L5.64 18.36"/>
  </svg>
);

const IconTeam = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="9" cy="7" r="3"/>
    <circle cx="17" cy="8" r="2.5"/>
    <path d="M2 21c0-4 3-6 7-6s7 2 7 6"/>
    <path d="M17 14c2.5 0 5 1.5 5 4"/>
  </svg>
);

const IconLeadsSistema = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 2L8.5 8.5 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-6.5-.77L12 2z"/>
  </svg>
);

const IconConfig = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.5-2.3.7A7 7 0 0 0 14.6 4l-.6-2h-4l-.6 2A7 7 0 0 0 7.5 6.1l-2.3-.7-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .5.1 1 .2 1.6l-2 1.5 2 3.5 2.3-.7A7 7 0 0 0 9.4 20l.6 2h4l.6-2a7 7 0 0 0 1.9-2.1l2.3.7 2-3.5-2-1.5c.1-.6.2-1.1.2-1.6z"/>
  </svg>
);

// ─── Definição da navegação por grupos ────────────────────────
const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard',  icon: <IconLeads />, label: 'Leads',   show: () => true },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { path: '/analytics',  icon: <IconAnalytics />, label: 'Analytics',  show: (a) => a.isDiretor() },
      { path: '/relatorios', icon: <IconRelatorios />, label: 'Relatórios', show: (a) => a.hasRole(['Administrador', 'admin', 'Diretor', 'Gestor', 'Consultor']) },
    ],
  },
  {
    label: 'Operação',
    items: [
      { path: '/automacao',    icon: <IconAutomacao />,    label: 'Automação', show: (a) => a.hasRole(['Administrador', 'admin', 'Diretor', 'Gestor']) },
      { path: '/marcas',       icon: <IconMarcas />,       label: 'Marcas',    show: (a) => a.hasRole(['Administrador', 'admin', 'Diretor', 'Gestor']) },
      { path: '/segmentos',    icon: <IconSegmentos />,    label: 'Segmentos', show: (a) => a.hasRole(['Administrador', 'admin', 'Diretor', 'Gestor']) },
      { path: '/usuarios',     icon: <IconTeam />,         label: 'Time',      show: (a) => a.hasRole(['Administrador', 'admin', 'Diretor', 'Gestor']) },
    ],
  },
  {
    label: 'Institucional',
    items: [
      { path: '/leads-sistema', icon: <IconLeadsSistema />, label: 'Leads Sistema', show: (a) => a.isAdmin() },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { path: '/configuracoes', icon: <IconConfig />, label: 'Config', show: (a) => a.isDiretor() },
    ],
  },
];

const IconLogoff = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const auth     = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmLogoff, setConfirmLogoff] = useState(false);

  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  const handleLogoffConfirm = async () => {
    setConfirmLogoff(false);
    await auth.logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ── Overlay mobile ────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className={`
          fixed left-0 top-0 h-full
          bg-[#0F172A] border-r border-white/5
          flex flex-col items-center py-8
          z-50 w-32
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <Link
          to="/dashboard"
          onClick={handleNavClick}
          className="mb-10 px-3"
          title="LeadCapture Pro"
        >
          <LogoIcon size={104} />
        </Link>

        {/* Nav por grupos */}
        <nav className="flex flex-col gap-1 w-full px-3 flex-1 overflow-y-auto scrollbar-none">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(item => item.show(auth));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="mb-4">
                <p className="text-[7px] font-black uppercase tracking-[0.18em] text-gray-700 text-center mb-2 px-1">
                  {group.label}
                </p>
                {visibleItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    title={item.label}
                    className={`
                      flex flex-col items-center gap-1.5
                      p-3 rounded-2xl mb-1
                      transition-all duration-150
                      ${isActive(item.path)
                        ? 'bg-[#10B981] text-black shadow-md shadow-[#10B981]/20'
                        : 'text-gray-600 hover:bg-white/5 hover:text-gray-400'
                      }
                    `}
                  >
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span className="text-[6.5px] font-black uppercase tracking-widest leading-none">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Logoff */}
        <div className="mt-auto pt-4 border-t border-white/5 w-full px-3">
          <button
            onClick={() => setConfirmLogoff(true)}
            title="Sair do sistema"
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl mb-2 w-full transition-all duration-150 text-gray-600 hover:bg-red-500/10 hover:text-red-400"
          >
            <span className="text-lg leading-none"><IconLogoff /></span>
            <span className="text-[6.5px] font-black uppercase tracking-widest leading-none">
              Logoff
            </span>
          </button>

          {/* Avatar usuário */}
          <div className="flex items-center justify-center pb-2">
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-black font-bold text-sm"
              title={`${auth.usuario?.nome} · ${auth.usuario?.role}`}
            >
              {auth.usuario?.nome?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={confirmLogoff}
        title="Sair do sistema"
        message="Tem certeza que deseja encerrar sua sessão?"
        onConfirm={handleLogoffConfirm}
        onClose={() => setConfirmLogoff(false)}
      />
    </>
  );
}
