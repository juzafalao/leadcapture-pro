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
    <header className="sticky top-0 z-40 bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-[#1f1f23] w-full">
      {/* REDUZIDO: py-4 para py-3 no mobile, py-4 no desktop */}
      <div className="px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
        
        {/* Left: Menu Mobile + Title */}
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Menu Hamburguer - Mobile */}
          <button 
            onClick={onMenuClick} 
            className="lg:hidden w-10 h-10 rounded-xl bg-[#1f1f23] flex items-center justify-center text-[#f5f5f4] hover:bg-[#2a2a2f] transition-colors"
          >
            ☰
          </button>
          
          {/* Título do Sistema */}
          <div>
            <h1 className="text-base lg:text-xl font-light text-[#f5f5f4]">
              Lead<span className="text-[#ee7b4d] font-semibold">Capture</span> Pro
            </h1>
            {tenant?.nome && (
              <p className="text-[8px] lg:text-[9px] text-[#4a4a4f] uppercase tracking-wider">
                {tenant.nome}
              </p>
            )}
          </div>
        </div>

        {/* Right: User Info + Logout */}
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs lg:text-sm font-medium text-[#f5f5f4]">
              {usuario?.nome || 'Usuário'}
            </p>
            <p className="text-[8px] lg:text-[9px] text-[#ee7b4d] font-bold uppercase tracking-wider">
              {usuario?.role || 'Sem Permissão'}
            </p>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-[#ef4444] hover:border-[#ef4444]/30 transition-all"
            title="Sair"
          >
            ⏻
          </button>
        </div>
      </div>
    </header>
  );
}