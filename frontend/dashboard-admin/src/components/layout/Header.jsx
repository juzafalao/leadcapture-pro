import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import ConfirmModal from '../shared/ConfirmModal';

/**
 * Render the application header with logo, tenant and user information, a mobile menu button, and a logout confirmation flow.
 * @param {Object} props
 * @param {Function} props.onMenuClick - Callback invoked when the mobile menu button is clicked.
 * @returns {JSX.Element} The header element containing the logo and tenant label, user info, logout button, and a confirm modal for logout.
 */
export default function Header({ onMenuClick }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const tenant = usuario?.tenant;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogoutClick = () => {
    setConfirmOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setConfirmOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-xl border-b border-[#1F2937] w-full">
        <div className="px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">

          {/* Left: Menu Mobile + Title */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Menu Hamburguer - Mobile */}
            <button
              onClick={onMenuClick}
              className="lg:hidden w-10 h-10 rounded-xl bg-[#0F172A] border border-[#1F2937] flex items-center justify-center text-[#F8FAFC] hover:border-[#10B981]/40 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* Logo Header (texto) + Tenant */}
            <div className="flex flex-col">
              <div className="group cursor-default">
                <span style={{ fontWeight: 300, fontSize: 'clamp(18px, 2.5vw, 24px)', lineHeight: 1 }}>
                  <span style={{ color: '#F8FAFC' }}>Lead</span>
                  <span style={{ color: '#10B981' }}>Capture</span>
                  <span style={{ color: '#F8FAFC' }}> Pro</span>
                </span>
              </div>
              {tenant?.nome ? (
                <p className="text-[8px] lg:text-[9px] text-[#CBD5E1]/50 uppercase tracking-wider mt-0.5">
                  {tenant.nome}
                </p>
              ) : usuario?.role && (
                <p style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
                  {usuario.role}
                </p>
              )}
            </div>
          </div>

          {/* Right: User info + logout */}
          <div className="flex items-center gap-2 lg:gap-4">

            {/* Info do usuário */}
            <div className="text-right hidden sm:block">
              <p className="text-xs lg:text-sm font-medium text-[#F8FAFC]">
                {usuario?.nome || 'Usuário'}
              </p>
              <p className="text-[8px] lg:text-[9px] text-[#10B981] font-bold uppercase tracking-wider">
                {usuario?.role || 'Sem Permissão'}
              </p>
            </div>

            <button
              onClick={handleLogoutClick}
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#0F172A] border border-[#1F2937] flex items-center justify-center text-[#CBD5E1]/60 hover:text-red-400 hover:border-red-500/30 transition-all"
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
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>

        </div>
      </header>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Sair do sistema"
        message="Tem certeza que deseja encerrar sua sessão?"
        onConfirm={handleLogoutConfirm}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
