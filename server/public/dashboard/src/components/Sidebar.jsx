import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  LayoutDashboard,
  Brain,
  Tag,
  Layers,
  Users,
  TrendingUp,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Administrador', 'Diretor', 'Gestor', 'Operador'],
    },
    {
      name: 'Inteligência',
      path: '/inteligencia',
      icon: Brain,
      roles: ['Administrador', 'Diretor', 'Gestor'],
    },
    {
      name: 'Marcas',
      path: '/marcas',
      icon: Tag,
      roles: ['Administrador', 'Diretor', 'Gestor'],
    },
    {
      name: 'Segmentos',
      path: '/segmentos',
      icon: Layers,
      roles: ['Administrador', 'Diretor', 'Gestor'],
    },
    {
      name: 'Usuários',
      path: '/usuarios',
      icon: Users,
      roles: ['Administrador', 'Diretor', 'Gestor'],
    },
    {
      name: 'Analytics', // ✅ NOVO
      path: '/admin/funil',
      icon: TrendingUp,
      roles: ['Administrador', 'Diretor', 'Gestor'],
    },
  ];

  // Filtrar itens baseado no role do usuário
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(usuario?.role)
  );

  const isActive = (path) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0a0a0b] border-r border-white/5">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all">
            <span className="text-2xl">⚡</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
              LeadCapture
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Pro
            </span>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center">
            <span className="text-sm font-bold text-orange-400">
              {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {usuario?.nome || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {usuario?.role || 'Role'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  active
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.name}</span>
              
              {/* Badge para Analytics */}
              {item.name === 'Analytics' && (
                <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-orange-400/20 text-orange-400 rounded-full border border-orange-400/30">
                  NOVO
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-72 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setMobileOpen(false)}
        >
          {/* Mobile Sidebar */}
          <aside
            className="fixed inset-y-0 left-0 w-72 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
            
            {/* Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </aside>
        </div>
      )}
    </>
  );
}