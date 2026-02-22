import React from 'react';
import { motion } from 'framer-motion';

export default function SegmentoCard({ segmento, index, onClick }) {
  // Contar marcas vinculadas a este segmento
  const totalMarcas = segmento.marcas_relacionadas?.length || 0;
  const totalLeads = segmento.leadsCount ?? segmento.leads?.length ?? 0;

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
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3 flex-1">
          {/* Emoji */}
          {segmento.emoji && (
            <div className="text-4xl lg:text-5xl">
              {segmento.emoji}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
              {segmento.nome}
            </h3>
            <p className="text-xs text-gray-600 font-mono truncate">
              ID: {segmento.id.substring(0, 8)}...
            </p>
          </div>
        </div>
        
        {/* Badge de leads */}
        <div className="
          bg-orange-500/10
          border border-orange-500/30
          rounded-xl
          px-3 py-1.5
          flex items-center gap-2
          flex-shrink-0
          ml-2
        ">
          <span className="text-lg">🎯</span>
          <span className="text-sm lg:text-base font-black text-orange-500">
            {totalLeads}
          </span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="text-xs text-gray-500 font-semibold mb-1">Marcas</div>
          <div className="text-xl font-black text-white">{totalMarcas}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="text-xs text-gray-500 font-semibold mb-1">Leads</div>
          <div className="text-xl font-black text-[#10B981]">{totalLeads}</div>
        </div>
      </div>

      {/* Marcas vinculadas */}
      {segmento.marcas_relacionadas && segmento.marcas_relacionadas.length > 0 && (
        <div className="mb-6 relative z-10">
          <div className="text-xs text-gray-500 font-semibold mb-2">
            Marcas vinculadas:
          </div>
          <div className="flex flex-wrap gap-2">
            {segmento.marcas_relacionadas.slice(0, 3).map((marca) => (
              <div
                key={marca.id}
                className="
                  bg-white/5
                  border border-white/10
                  rounded-lg
                  px-3 py-1
                  text-xs
                  text-gray-400
                  font-semibold
                  flex items-center gap-1
                "
              >
                {marca.emoji && <span>{marca.emoji}</span>}
                {marca.nome}
              </div>
            ))}
            {segmento.marcas_relacionadas.length > 3 && (
              <div className="
                bg-white/5
                border border-white/10
                rounded-lg
                px-3 py-1
                text-xs
                text-gray-500
                font-bold
              ">
                +{segmento.marcas_relacionadas.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
        <span className="text-xs text-gray-600 font-semibold">
          Criado em {new Date(segmento.created_at).toLocaleDateString('pt-BR')}
        </span>
        
        <motion.button
          whileHover={{ x: 4 }}
          className="text-orange-500 text-sm font-bold flex items-center gap-1"
        >
          Editar →
        </motion.button>
      </div>
    </motion.div>
  );
}