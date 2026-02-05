import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Sidebar() {
  const { usuario } = useAuth();
  const location = useLocation();
  const role = usuario?.role;
  const isMaster = ['Administrador', 'Diretor', 'Gestor'].includes(role);

  const navItems = [
    { path: '/dashboard', icon: '⚡', label: 'Leads', show: true },
    { path: '/inteligencia', icon: '🧠', label: 'Métricas', show: isMaster },
    { path: '/marcas', icon: '🏢', label: 'Marcas', show: isMaster },
    { path: '/usuarios', icon: '👥', label: 'Time', show: role === 'Administrador' }
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-[#0a0a0b] border-r border-white/5 flex-col items-center py-8 z-50">
        <div className="mb-12 w-12 h-12 bg-[#ee7b4d] flex items-center justify-center font-black text-black rounded-2xl shadow-lg shadow-[#ee7b4d]/20">LC</div>
        <nav className="flex flex-col gap-4 w-full px-2">
          {navItems.filter(i => i.show).map((item) => (
            <Link key={item.path} to={item.path} className={`p-4 rounded-xl flex justify-center transition-all ${location.pathname === item.path ? 'bg-[#ee7b4d] text-black' : 'text-gray-600 hover:text-white'}`}>
              <span className="text-xl">{item.icon}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0b]/90 backdrop-blur-xl border-t border-white/5 px-4 py-3 flex justify-around items-center z-[100]">
        {navItems.filter(i => i.show).map((item) => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 ${location.pathname === item.path ? 'text-[#ee7b4d]' : 'text-gray-600'}`}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}