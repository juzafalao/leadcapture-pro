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
    <header className="sticky top-0 z-40 w-full" style={{
      background: 'rgba(11,18,32,0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div className="px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">

        {/* Left: Menu mobile + Logo estilizado */}
        <div className="flex items-center gap-3 lg:gap-4">

          {/* Hamburguer mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-[#F8FAFC] transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Nome do sistema estilizado */}
          <div className="flex flex-col justify-center leading-none gap-1">
            {/* Linha principal: LeadCapture */}
            <div className="flex items-baseline gap-0">
              <span className="text-[15px] lg:text-[18px] font-light text-[#CBD5E1] tracking-tight">Lead</span>
              <span className="text-[15px] lg:text-[18px] font-black text-[#F8FAFC] tracking-tight">Capture</span>
            </div>

            {/* Linha secundária: — PRO — */}
            <div className="flex items-center gap-1.5">
              <div className="h-px w-3 lg:w-4 bg-[#10B981] opacity-70 rounded-full" />
              <span
                className="text-[7px] lg:text-[8px] font-black tracking-[0.22em] uppercase"
                style={{ color: '#10B981', letterSpacing: '0.22em' }}
              >
                PRO
              </span>
              <div className="h-px w-3 lg:w-4 bg-[#10B981] opacity-70 rounded-full" />
              {tenant?.nome && (
                <>
                  <span className="text-[#334155] text-[7px]">·</span>
                  <span className="text-[7px] lg:text-[8px] text-[#475569] uppercase tracking-wider font-medium truncate max-w-[100px] lg:max-w-[180px]">
                    {tenant.nome}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: User info + logout */}
        <div className="flex items-center gap-2 lg:gap-4">

          {/* Info do usuário */}
          <div className="text-right hidden sm:block">
            <p className="text-xs lg:text-sm font-semibold text-[#F8FAFC] leading-tight">
              {usuario?.nome || 'Usuário'}
            </p>
            <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest leading-tight mt-0.5"
              style={{ color: '#10B981' }}>
              {usuario?.role || 'Sem Permissão'}
            </p>
          </div>

          {/* Avatar compacto (mobile) */}
          <div
            className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-black font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            {usuario?.nome?.charAt(0).toUpperCase() || '?'}
          </div>

          {/* Botão sair */}
          <button
            onClick={handleLogout}
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center transition-all group"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            title="Sair"
          >
            <svg
              width="16" height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#475569] group-hover:text-red-400 transition-colors"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

      </div>
    </header>
  );
}
