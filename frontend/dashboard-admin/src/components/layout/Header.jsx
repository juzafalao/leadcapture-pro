import React from 'react';
import { useAuth } from '../AuthContext';

export default function Header({ onMenuClick }) {
  const { usuario, logout } = useAuth();
  const tenant = usuario?.tenant;

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await logout();
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B1220]/95 backdrop-blur-xl border-b border-[#1F2937] w-full">
      <div className="px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">

        {/* Left: Menu Mobile + Title */}
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Menu Hamburguer - Mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 rounded-xl bg-[#0F172A] border border-[#1F2937] flex items-center justify-center text-[#F8FAFC] hover:border-[#10B981]/40 transition-colors"
          >
            ☰
          </button>

          {/* Título do Sistema */}
          <div>
            <h1 className="text-base lg:text-xl font-light text-[#F8FAFC]">
              Lead<span className="text-[#10B981] font-semibold">Capture</span> Pro
            </h1>
            {tenant?.nome && (
              <p className="text-[8px] lg:text-[9px] text-[#CBD5E1]/50 uppercase tracking-wider">
                {tenant.nome}
              </p>
            )}
          </div>
        </div>

        {/* Right: User Info + Logout */}
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs lg:text-sm font-medium text-[#F8FAFC]">
              {usuario?.nome || 'Usuário'}
            </p>
            <p className="text-[8px] lg:text-[9px] text-[#10B981] font-bold uppercase tracking-wider">
              {usuario?.role || 'Sem Permissão'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#0F172A] border border-[#1F2937] flex items-center justify-center text-[#CBD5E1]/60 hover:text-red-400 hover:border-red-500/30 transition-all"
            title="Sair"
          >
            ⏻
          </button>
        </div>
      </div>
    </header>
  );
}
