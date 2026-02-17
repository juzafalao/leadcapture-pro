import React from 'react';
import { motion } from 'framer-motion';

export default function FilterChips({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <motion.button
          key={filter.value}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFilterChange(filter.value)}
          className={`
            px-4 py-2 lg:px-5 lg:py-2.5
            rounded-full
            text-xs lg:text-sm
            font-bold
            uppercase
            tracking-wide
            whitespace-nowrap
            transition-all
            flex items-center gap-2
            ${activeFilter === filter.value
              ? 'bg-[#ee7b4d] text-black shadow-lg shadow-[#ee7b4d]/30'
              : 'bg-[#12121a] text-gray-400 border border-white/5 hover:bg-white/5'
            }
          `}
        >
          <span>{filter.icon}</span>
          <span>{filter.label}</span>
          {filter.count !== undefined && (
            <span className={`
              px-2 py-0.5 rounded-full text-[10px] font-black
              ${activeFilter === filter.value
                ? 'bg-black/20 text-black'
                : 'bg-white/10 text-gray-500'
              }
            `}>
              {filter.count}
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
}