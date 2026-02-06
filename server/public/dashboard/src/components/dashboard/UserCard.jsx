import React from 'react';
import { motion } from 'framer-motion';

export default function UserCard({ user, index, onClick }) {
  const normalizedRole = user.role?.toLowerCase() || 'default';
  
  const roleColors = {
    'administrador': 'text-red-500 bg-red-500/10 border-red-500/30',
    'admin': 'text-red-500 bg-red-500/10 border-red-500/30',
    'gestor': 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    'vendedor': 'text-green-500 bg-green-500/10 border-green-500/30',
    'default': 'text-gray-500 bg-gray-500/10 border-gray-500/30'
  };

  const roleColor = roleColors[normalizedRole] || roleColors.default;

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRoleIcon = (role) => {
    const normalized = role?.toLowerCase() || '';
    if (normalized.includes('admin')) return '👑';
    if (normalized.includes('gestor')) return '📊';
    if (normalized.includes('vendedor')) return '💼';
    return '👤';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className="
        bg-[#12121a]
        border border-white/5
        rounded-3xl
        p-6 lg:p-8
        cursor-pointer
        transition-all
        hover:border-[#ee7b4d]/30
        hover:shadow-xl
        hover:shadow-[#ee7b4d]/10
        relative
        overflow-hidden
      "
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6 relative z-10">
        {/* Avatar */}
        <div className="
          w-16 h-16 lg:w-20 lg:h-20
          rounded-2xl
          bg-gradient-to-br from-[#ee7b4d] to-[#d4663a]
          flex items-center justify-center
          text-xl lg:text-2xl
          font-black
          text-black
          flex-shrink-0
        ">
          {getInitials(user.nome)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg lg:text-xl font-bold text-white mb-1 truncate">
            {user.nome}
          </h3>
          <p className="text-sm text-gray-500 mb-2 truncate">
            {user.email}
          </p>
          
          {/* Role badge */}
          <div className={`
            inline-flex items-center gap-1
            ${roleColor}
            border
            rounded-lg
            px-2 py-1
            text-xs
            font-bold
            uppercase
            tracking-wide
          `}>
            {getRoleIcon(user.role)}
            {user.role || 'Usuário'}
          </div>
        </div>
      </div>

      {/* Telefone (se disponível) */}
      {user.telefone && (
        <div className="mb-6 relative z-10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-gray-500 font-semibold mb-1">📱 Telefone</div>
            <div className="text-sm font-bold text-white">{user.telefone}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
        <span className={`text-xs font-semibold ${user.ativo ? 'text-green-500' : 'text-red-500'}`}>
          {user.ativo ? '🟢 Ativo' : '🔴 Inativo'}
        </span>
        
        <motion.button
          whileHover={{ x: 4 }}
          className="text-blue-500 text-sm font-bold flex items-center gap-1"
        >
          Editar →
        </motion.button>
      </div>
    </motion.div>
  );
}