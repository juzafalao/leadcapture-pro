import React from 'react';
import { useAuth } from '../AuthContext'; // Sobe 1 nível para 'components'
import { supabase } from '../../lib/supabase'; // Sobe 2 níveis para 'src' e entra em 'lib'

export default function Header({ onMenuClick }) {
  const { usuario, tenant, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login'; // Limpeza total de sessão [cite: 2026-02-05]
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-[#1f1f23]/50 w-full text-left">
      <div className="px-4 lg:px-8 py-4 lg:py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-4">
          <button onClick={onMenuClick} className="lg:hidden w-10 h-10 rounded-xl bg-[#1f1f23] flex items-center justify-center text-[#f5f5f4]">☰</button>
          <div className="w-10 h-10 bg-[#ee7b4d] rounded-xl flex items-center justify-center font-black text-black shadow-lg shadow-[#ee7b4d]/20">LC</div>
          <div className="hidden sm:block">
            <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-0.5">{tenant?.nome || 'LeadCapture Pro'}</p>
            <h1 className="text-lg lg:text-xl font-light text-[#f5f5f4]">Lead<span className="text-[#ee7b4d] font-semibold">Capture</span> Pro</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 text-right">
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[#f5f5f4]">{usuario?.nome}</p>
            <p className="text-[10px] text-[#ee7b4d] font-black uppercase tracking-widest italic">{usuario?.role}</p>
          </div>
          <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-[#ef4444] transition-all">⏻</button>
        </div>
      </div>
    </header>
  );
}