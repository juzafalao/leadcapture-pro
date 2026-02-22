import React from 'react';
import { motion } from 'framer-motion';

export default function PeriodFilter({ activePeriod, onChange }) {
  const periods = [
    { value: 'mes', label: 'Mês Atual', icon: '📅' },
    { value: '30dias', label: '30 Dias', icon: '📊' },
    { value: 'trimestre', label: 'Trimestre', icon: '📈' },
    { value: 'ano', label: 'Ano', icon: '🗓️' }
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {periods.map((period) => (
        <motion.button
          key={period.value}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(period.value)}
          className={`
            px-4 py-2.5 lg:px-5 lg:py-3
            rounded-full
            text-xs lg:text-sm
            font-bold
            uppercase
            tracking-wide
            whitespace-nowrap
            transition-all
            flex items-center gap-2
            ${activePeriod === period.value
              ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/30'
              : 'bg-[#0F172A] text-gray-400 border border-white/5 hover:bg-white/5'
            }
          `}
        >
          <span>{period.icon}</span>
          <span className="hidden lg:inline">{period.label}</span>
          <span className="lg:hidden">{period.value === 'mes' ? 'Mês' : period.value === '30dias' ? '30d' : period.value === 'trimestre' ? 'Trim' : 'Ano'}</span>
        </motion.button>
      ))}
    </div>
  );
}