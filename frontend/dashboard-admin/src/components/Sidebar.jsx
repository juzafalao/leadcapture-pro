import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// ─── Definição da navegação por grupos ────────────────────────
const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard',  icon: '⚡', label: 'Leads',   show: () => true },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { path: '/analytics',  icon: '📊', label: 'Analytics',  show: (a) => a.isGestor() },
      { path: '/relatorios', icon: '📋', label: 'Relatórios', show: (a) => a.isGestor() },
    ],
  },
  {
    label: 'Operação',
    items: [
      { path: '/automacao',    icon: '🤖', label: 'Automação', show: (a) => a.isGestor() },
      { path: '/marcas',       icon: '🏢', label: 'Marcas',    show: (a) => a.isGestor() },
      { path: '/segmentos',    icon: '🟠', label: 'Segmentos', show: (a) => a.isGestor() },
      { path: '/usuarios',     icon: '👥', label: 'Time',      show: (a) => a.isGestor() },
    ],
  },
  {
    label: 'Institucional',
    items: [
      { path: '/leads-sistema', icon: '🚀', label: 'Leads Sistema', show: (a) => a.isGestor() },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { path: '/configuracoes', icon: '⚙️', label: 'Config', show: () => true },
    ],
  },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const auth     = useAuth();
  const location = useLocation();

  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
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
          bg-[#0a0a0b] border-r border-white/5
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
          className="mb-10 w-12 h-12 bg-[#ee7b4d] flex items-center justify-center font-black text-black rounded-2xl shadow-lg hover:opacity-85 transition-opacity"
          title="LeadCapture Pro"
        >
          LC
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
                        ? 'bg-[#ee7b4d] text-black shadow-md shadow-[#ee7b4d]/20'
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

        {/* Usuário (Mobile) */}
        <div className="lg:hidden mt-auto pt-4 border-t border-white/5 w-full px-4">
          <div className="text-center">
            <p className="text-xs text-white font-medium truncate">{auth.usuario?.nome}</p>
            <p className="text-[8px] text-[#ee7b4d] font-bold uppercase mt-1">{auth.usuario?.role}</p>
          </div>
        </div>

        {/* Avatar usuário (Desktop) */}
        <div className="hidden lg:flex mt-auto pt-4 border-t border-white/5 w-full items-center justify-center">
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ee7b4d] to-[#f59e42] flex items-center justify-center text-black font-bold text-sm"
            title={`${auth.usuario?.nome} · ${auth.usuario?.role}`}
          >
            {auth.usuario?.nome?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      </aside>
    </>
  );
}
