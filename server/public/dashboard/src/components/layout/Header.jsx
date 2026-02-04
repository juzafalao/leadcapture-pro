import React from 'react';
import { useAuth } from '../AuthContext';

export default function Header() {
  const { usuario, logout } = useAuth();
  
  return (
    <header className="fixed top-0 left-20 right-0 z-40 bg-[#0a0a0b] border-b border-white/5 h-24">
      <div className="h-full px-10 flex items-center justify-between">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-[#ee7b4d] flex items-center justify-center font-black text-[#0a0a0b] text-base rounded-2xl shadow-lg shadow-[#ee7b4d]/20">LC</div>
          <div className="text-left">
            <h1 className="text-2xl font-light text-white tracking-tight italic leading-none">
              Lead<span className="text-[#ee7b4d] font-bold">Capture</span> Pro
            </h1>
            <p className="text-[8px] text-gray-500 font-extralight uppercase tracking-[0.6em] mt-2 ml-1 opacity-70">
              Franqueadora
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-bold text-white leading-none mb-1">{usuario?.nome || 'Juliana Zafalao'}</p>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest leading-none opacity-50">
              {usuario?.role || 'GERENTE'}
            </p>
          </div>
          
          <button 
            onClick={logout}
            className="w-11 h-11 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
          >
            <span className="text-xl font-light">⏻</span>
          </button>
        </div>
      </div>
    </header>
  );
}