import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Corrigido: Apenas um ponto e sem a palavra 'components'
import { useAuth } from './AuthContext'; 
// Sobe um nível para chegar na 'src' e entra em 'lib'
import { supabase } from '../lib/supabase'; 

export default function Sidebar() {
  const { usuario } = useAuth();
  const location = useLocation();
  
  // Normalização para bater com o banco (Administrador) [cite: 2026-02-05]
  const role = usuario?.role?.toLowerCase() || '';
  const isMaster = ['administrador', 'diretor', 'gestor'].includes(role);

  const navItems = [
    { path: '/dashboard', icon: '⚡', label: 'Leads', show: true },
    { path: '/inteligencia', icon: '🧠', label: 'BI', show: isMaster },
    { path: '/marcas', icon: '🏢', label: 'Marcas', show: isMaster },
    { path: '/segmentos', icon: '📊', label: 'Segmentos', show: isMaster },
    { path: '/usuarios', icon: '👥', label: 'Time', show: ['administrador', 'diretor'].includes(role) }
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-32 bg-[#0a0a0b] border-r border-white/5 flex-col items-center py-10 z-50">
      <div className="mb-12 w-12 h-12 bg-[#ee7b4d] flex items-center justify-center font-black text-black rounded-2xl shadow-lg">LC</div>
      <nav className="flex flex-col gap-6 w-full px-4 text-left">
        {navItems.map((item) => item.show && (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
              location.pathname === item.path ? 'bg-[#ee7b4d] text-black shadow-lg shadow-[#ee7b4d]/20' : 'text-gray-600 hover:bg-[#ee7b4d]/10'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}