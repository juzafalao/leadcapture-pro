import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import UserCard from '../components/dashboard/UserCard';
import FAB from '../components/dashboard/FAB';
import UserModal from '../components/usuarios/UserModal';

export default function UsuariosPage() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState('todos');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsuarios = async () => {
    if (!usuario?.tenant_id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('tenant_id', usuario.tenant_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, [usuario]);

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusca = u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                       u.email?.toLowerCase().includes(busca.toLowerCase());
    const matchRole = filtroRole === 'todos' || u.role === filtroRole;
    return matchBusca && matchRole;
  });

  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    fetchUsuarios();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pb-32">
      
      {/* HEADER */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-6 lg:mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-2">
            Gestão de <span className="text-[#ee7b4d] font-bold">Usuários</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#ee7b4d] rounded-full"></div>
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              {usuarios.length} {usuarios.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* SEARCH BAR & FILTER */}
      <div className="px-4 lg:px-10 mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Buscar usuário..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="
              w-full
              bg-[#12121a]
              border border-white/5
              rounded-2xl
              px-5 py-4
              lg:px-6 lg:py-4
              text-sm lg:text-base
              text-white
              placeholder:text-gray-600
              focus:outline-none
              focus:border-[#ee7b4d]/50
              focus:ring-2
              focus:ring-[#ee7b4d]/20
              transition-all
            "
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['todos', 'Administrador', 'Diretor', 'Gestor', 'Consultor', 'Operador'].map((role) => (
            <motion.button
              key={role}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFiltroRole(role)}
              className={`
                px-4 py-2.5 lg:px-5 lg:py-3
                rounded-full
                text-xs lg:text-sm
                font-bold
                uppercase
                tracking-wide
                whitespace-nowrap
                transition-all
                ${filtroRole === role
                  ? 'bg-[#ee7b4d] text-black shadow-lg shadow-[#ee7b4d]/30'
                  : 'bg-[#12121a] text-gray-400 border border-white/5 hover:bg-white/5'
                }
              `}
            >
              {role === 'todos' && '⚪ Todos'}
              {role === 'Administrador' && '👑 Admin'}
              {role === 'Diretor' && '🎯 Diretor'}
              {role === 'Gestor' && '📊 Gestor'}
              {role === 'Consultor' && '💼 Consultor'}
              {role === 'Operador' && '⚙️ Operador'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* USERS GRID */}
      <div className="px-4 lg:px-10">
        {usuariosFiltrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4 opacity-30">👥</div>
            <p className="text-xl text-gray-400 mb-2">
              {busca || filtroRole !== 'todos' ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {busca || filtroRole !== 'todos' ? 'Tente ajustar os filtros' : 'Comece criando seu primeiro usuário!'}
            </p>
            {(busca || filtroRole !== 'todos') && (
              <button
                onClick={() => {
                  setBusca('');
                  setFiltroRole('todos');
                }}
                className="px-6 py-3 bg-[#ee7b4d] text-black font-bold rounded-xl hover:bg-[#d4663a] transition-all"
              >
                Limpar Filtros
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {usuariosFiltrados.map((user, index) => (
              <UserCard
                key={user.id}
                user={user}
                index={index}
                onClick={() => handleOpenModal(user)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <FAB onClick={() => handleOpenModal(null)} />

      {/* MODAL */}
      {isModalOpen && (
        <UserModal
          usuario={selectedUser}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}