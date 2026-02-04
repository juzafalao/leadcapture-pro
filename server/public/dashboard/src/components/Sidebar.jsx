import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { usuario } = useAuth(); // Usando o objeto usuario diretamente
  const location = useLocation();

  // Definição de permissões baseada na nova hierarquia
  const role = usuario?.role;
  const isMaster = ['Administrador', 'Diretor', 'Gestor'].includes(role);
  const isAdmin = role === 'Administrador';

  // Sidebar.jsx - Mapeamento Correto
const navItems = [
  { path: '/dashboard', icon: '⚡', label: 'Leads', show: true },
  { path: '/inteligencia', icon: '🧠', label: 'Inteligência', show: isMaster }, // Aqui devem estar as MÉTRICAS
  { path: '/marcas', icon: '🏢', label: 'Marcas', show: isMaster },
  { path: '/segmentos', icon: '🟠', label: 'Segmentos', show: isMaster },
  { path: '/usuarios', icon: '🧑🏻‍💻', label: 'Usuários', show: isAdmin } // Aqui deve estar a GESTÃO DE ACESSOS
];

  return (
    <aside 
      className={`fixed left-0 top-0 bottom-0 bg-[#0a0a0b] border-r border-white/5 flex flex-col items-center py-8 transition-all duration-300 z-50 rounded-none shadow-2xl ${isExpanded ? 'w-64' : 'w-20'}`}
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-12 w-12 h-12 bg-[#ee7b4d] flex items-center justify-center font-black text-[#0a0a0b] rounded-2xl hover:scale-105 transition-all shadow-lg shadow-[#ee7b4d]/20"
      >
        LC
      </button>
      
      <nav className="flex-1 flex flex-col gap-1 w-full px-2">
        {navItems.filter(i => i.show).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-4 p-4 transition-all rounded-none ${active ? 'bg-[#ee7b4d] text-[#0a0a0b]' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}
            >
              <span className="text-xl min-w-[24px] flex justify-center">{item.icon}</span>
              {isExpanded && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap italic">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}