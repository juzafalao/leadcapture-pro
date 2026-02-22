import React from 'react';
import { motion } from 'framer-motion';

export default function MarcaCard({ marca, index, onClick }) {
  const totalLeads = marca.leads?.length || 0;

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
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className="
        bg-[#0F172A]
        border border-white/5
        rounded-3xl
        p-6 lg:p-8
        cursor-pointer
        transition-all
        hover:border-[#10B981]/30
        hover:shadow-xl
        hover:shadow-[#10B981]/10
        relative
        overflow-hidden
      "
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3 flex-1">
          {/* Emoji */}
          {marca.emoji && (
            <div className="text-4xl lg:text-5xl">
              {marca.emoji}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
              {marca.nome}
            </h3>
            <p className="text-xs text-gray-600 font-mono truncate">
              ID: {marca.id.substring(0, 8)}...
            </p>
          </div>
        </div>
        
        {/* Badge de leads */}
        <div className="
          bg-[#10B981]/10
          border border-[#10B981]/30
          rounded-xl
          px-3 py-1.5
          flex items-center gap-2
          flex-shrink-0
          ml-2
        ">
          <span className="text-lg">👥</span>
          <span className="text-sm lg:text-base font-black text-[#10B981]">
            {totalLeads}
          </span>
        </div>
      </div>

      {/* Faixa de Investimento */}
      {(marca.invest_min || marca.invest_max) && (
        <div className="mb-6 relative z-10">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="text-xs text-gray-500 font-semibold mb-2">
              💰 Faixa de Investimento
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">De</span>
              <span className="text-white font-bold">{formatCurrency(marca.invest_min)}</span>
              <span className="text-gray-400">até</span>
              <span className="text-[#10B981] font-bold">{formatCurrency(marca.invest_max)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Segmento */}
      {marca.segmentos && (
        <div className="mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">Segmento:</span>
            <div className="
              bg-white/5
              border border-white/10
              rounded-lg
              px-3 py-1
              text-sm
              text-white
              font-semibold
              flex items-center gap-2
            ">
              {marca.segmentos.emoji && <span>{marca.segmentos.emoji}</span>}
              {marca.segmentos.nome}
            </div>
          </div>
        </div>
      )}

      {/* Status Ativo */}
      {marca.ativo !== undefined && (
        <div className="mb-6 relative z-10">
          <div className={`
            inline-flex items-center gap-2
            px-3 py-1.5
            rounded-lg
            text-xs
            font-bold
            ${marca.ativo 
              ? 'bg-green-500/10 border border-green-500/30 text-green-500' 
              : 'bg-red-500/10 border border-red-500/30 text-red-500'
            }
          `}>
            <span>{marca.ativo ? '🟢' : '🔴'}</span>
            <span>{marca.ativo ? 'ATIVA' : 'INATIVA'}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
        <span className="text-xs text-gray-600 font-semibold">
          Criada em {new Date(marca.created_at).toLocaleDateString('pt-BR')}
        </span>
        
        <motion.button
          whileHover={{ x: 4 }}
          className="text-[#10B981] text-sm font-bold flex items-center gap-1"
        >
          Editar →
        </motion.button>
      </div>
    </motion.div>
  );
}