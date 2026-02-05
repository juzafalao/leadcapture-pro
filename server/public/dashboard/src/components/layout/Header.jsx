import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Linha 3 corrigida

export default function Header() {
  const { usuario, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-32 h-20 bg-[#0a0a0b]/80 backdrop-blur-md border-b border-white/5 z-[90] px-6 md:px-10 flex items-center justify-between">
      
      {/* LADO ESQUERDO: IDENTIFICAÇÃO DO SISTEMA */}
      <div className="flex flex-col text-left">
        <h1 className="text-white font-bold text-sm md:text-lg tracking-tight uppercase">
          LeadCapture<span className="text-[#ee7b4d]">Pro</span>
        </h1>
        <span className="text-gray-500 font-black text-[8px] md:text-[9px] uppercase tracking-[0.3em] -mt-0.5">
          Franqueadora
        </span>
      </div>

      {/* LADO DIREITO: PERFIL E LOGOUT (SEM O ÍCONE LC) */}
      <div className="flex items-center gap-4 md:gap-6">
        
        {/* INFORMAÇÕES DO USUÁRIO (OCULTO NO MOBILE) */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-white font-bold text-[11px] uppercase tracking-tight">
            {usuario?.nome || 'Juliana Zafalao'}
          </span>
          <span className="text-gray-600 text-[9px] font-black uppercase">
            {usuario?.role || 'Gerente'}
          </span>
        </div>

        {/* BOTÃO DE SAIR (POWER) */}
        <button 
          onClick={handleLogout}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all group active:scale-90"
        >
          <span className="text-gray-500 group-hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
        </button>
      </div>
    </header>
  );
}