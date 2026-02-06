import React from 'react';
import { motion } from 'framer-motion';

export default function LeadCard({ lead, index, onClick }) {
  const getScoreColor = (score) => {
    if (score >= 70) return {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-500',
      label: 'Hot 🔥'
    };
    if (score >= 40) return {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-500',
      label: 'Warm 🌤️'
    };
    return {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-500',
      label: 'Cold ❄️'
    };
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('vendido') || statusLower.includes('convertido')) {
      return 'bg-green-500/10 border-green-500/30 text-green-500';
    }
    if (statusLower.includes('negoc')) {
      return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
    }
    if (statusLower.includes('perdido')) {
      return 'bg-red-500/10 border-red-500/30 text-red-500';
    }
    if (statusLower.includes('agendado')) {
      return 'bg-purple-500/10 border-purple-500/30 text-purple-500';
    }
    if (statusLower.includes('contato')) {
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500';
    }
    return 'bg-gray-500/10 border-gray-500/30 text-gray-500';
  };

  const scoreColor = getScoreColor(lead.score || 0);
  const statusColor = getStatusColor(lead.status);

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
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
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ee7b4d]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg lg:text-xl font-bold text-white mb-1 truncate">
            {lead.nome}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {lead.email}
          </p>
        </div>

        {/* Score badge */}
        <div className={`
          ${scoreColor.bg}
          ${scoreColor.border}
          border
          rounded-xl
          px-3 py-1.5
          flex-shrink-0
          ml-2
        `}>
          <span className={`text-sm lg:text-base font-black ${scoreColor.text}`}>
            {lead.score || 0}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div className="space-y-3 mb-4 relative z-10">
        {lead.telefone && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">📱</span>
            <span className="text-gray-400">{lead.telefone}</span>
          </div>
        )}

        {lead.capital_disponivel && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">💰</span>
            <span className="text-white font-bold">
              {formatCurrency(lead.capital_disponivel)}
            </span>
          </div>
        )}

        {lead.marcas && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{lead.marcas.emoji || '🏢'}</span>
            <span className="text-gray-400">{lead.marcas.nome}</span>
          </div>
        )}

        {lead.fonte && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">📍</span>
            <span className="text-gray-400 capitalize">{lead.fonte}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
        {/* Status badge */}
        <div className={`
          ${statusColor}
          border
          rounded-lg
          px-3 py-1
          text-xs
          font-bold
          uppercase
          tracking-wide
        `}>
          {lead.status || 'Novo'}
        </div>

        {/* Score label */}
        <span className={`text-xs font-bold ${scoreColor.text}`}>
          {scoreColor.label}
        </span>
      </div>
    </motion.div>
  );
}