import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { usuario, isAdministrador, isDiretor, isGestor } = useAuth();
  const location = useLocation();

  const navItems = [
    { 
      path: '/dashboard', 
      icon: '⚡', 
      label: 'Leads', 
      show: true 
    },
    { 
      path: '/inteligencia', 
      icon: '🧠', 
      label: 'BI', 
      show: isGestor() 
    },
    { 
      path: '/marcas', 
      icon: '🏢', 
      label: 'Marcas', 
      show: isGestor() 
    },
    { 
      path: '/segmentos', 
      icon: '🟠', 
      label: 'Segmentos', 
      show: isGestor() 
    },
    { 
      path: '/usuarios', 
      icon: '🧑🏻‍💻', 
      label: 'Time', 
      show: isGestor() // ✅ MUDOU: de isDiretor() para isGestor()
    }
  ];

  // Fechar menu ao clicar em um item (mobile)
  const handleNavClick = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* ============================================ */}
      {/* OVERLAY - Fundo escuro quando menu aberto   */}
      {/* ============================================ */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ============================================ */}
      {/* SIDEBAR - Desktop fixo, Mobile drawer        */}
      {/* ============================================ */}
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
        <div className="mb-12 w-12 h-12 bg-[#ee7b4d] flex items-center justify-center font-black text-black rounded-2xl shadow-lg">
          LC
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col gap-6 w-full px-4 flex-1">
          {navItems.map((item) => item.show && (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={handleNavClick}
              className={`
                p-4 rounded-2xl flex flex-col items-center gap-2 transition-all
                ${location.pathname === item.path 
                  ? 'bg-[#ee7b4d] text-black shadow-lg shadow-[#ee7b4d]/20' 
                  : 'text-gray-600 hover:bg-[#ee7b4d]/10'
                }
              `}
              title={item.label}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[7px] font-black uppercase tracking-widest">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* User Info - Mobile */}
        <div className="lg:hidden mt-auto pt-4 border-t border-white/5 w-full px-4">
          <div className="text-center">
            <p className="text-xs text-white font-medium truncate">
              {usuario?.nome}
            </p>
            <p className="text-[8px] text-[#ee7b4d] font-bold uppercase mt-1">
              {usuario?.role}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}