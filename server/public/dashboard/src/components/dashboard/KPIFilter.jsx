import React from 'react';
import { motion } from 'framer-motion';

export default function KPIFilter({ kpis, kpiAtivo, setKpiAtivo }) {
  const kpiOptions = [
    {
      id: 'All',
      label: 'Todos',
      value: kpis.total,
      icon: '📊',
      color: 'text-white',
      bg: 'bg-white/5',
      border: 'border-white/10',
      activeBg: 'bg-[#ee7b4d]',
      activeText: 'text-black',
      activeBorder: 'border-[#ee7b4d]'
    },
    {
      id: 'Hot',
      label: 'Hot',
      value: kpis.hot,
      icon: '🔥',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      activeBg: 'bg-red-500',
      activeText: 'text-white',
      activeBorder: 'border-red-500'
    },
    {
      id: 'Warm',
      label: 'Warm',
      value: kpis.warm,
      icon: '🌤️',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      activeBg: 'bg-yellow-500',
      activeText: 'text-black',
      activeBorder: 'border-yellow-500'
    },
    {
      id: 'Cold',
      label: 'Cold',
      value: kpis.cold,
      icon: '❄️',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      activeBg: 'bg-blue-500',
      activeText: 'text-white',
      activeBorder: 'border-blue-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {kpiOptions.map((kpi) => {
        const isActive = kpiAtivo === kpi.id;
        
        return (
          <motion.button
            key={kpi.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setKpiAtivo(kpi.id)}
            className={`
              relative
              rounded-2xl
              p-4 lg:p-6
              border
              transition-all
              ${isActive 
                ? `${kpi.activeBg} ${kpi.activeBorder} shadow-lg` 
                : `${kpi.bg} ${kpi.border} hover:border-opacity-50`
              }
            `}
          >
            {/* Icon */}
            <div className="text-3xl lg:text-4xl mb-2">
              {kpi.icon}
            </div>

            {/* Value */}
            <div className={`
              text-2xl lg:text-3xl
              font-black
              mb-1
              ${isActive ? kpi.activeText : kpi.color}
            `}>
              {kpi.value}
            </div>

            {/* Label */}
            <div className={`
              text-xs lg:text-sm
              font-bold
              uppercase
              tracking-wide
              ${isActive ? kpi.activeText : 'text-gray-400'}
            `}>
              {kpi.label}
            </div>

            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="activeKPI"
                className="absolute inset-0 rounded-2xl border-2 border-white/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}