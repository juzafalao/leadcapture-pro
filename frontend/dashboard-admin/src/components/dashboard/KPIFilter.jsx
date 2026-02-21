import React from 'react';
import { motion } from 'framer-motion';

export default function KPIFilter({ kpis, kpiAtivo, setKpiAtivo }) {
  const kpiOptions = [
    { id: 'All',  label: 'Total',  value: kpis.total, icon: '📊', color: '#10B981', textColor: 'text-[#10B981]',  bg: 'bg-[#10B981]/10',  border: 'border-[#10B981]/30' },
    { id: 'Hot',  label: 'Hot',   value: kpis.hot,   icon: '🔥', color: '#ef4444', textColor: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30'   },
    { id: 'Warm', label: 'Warm',  value: kpis.warm,  icon: '🌤️', color: '#eab308', textColor: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    { id: 'Cold', label: 'Cold',  value: kpis.cold,  icon: '❄️', color: '#3b82f6', textColor: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'  },
  ];

  const total = kpis.total || 1;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {kpiOptions.map((kpi) => {
        const isActive = kpiAtivo === kpi.id;
        const pct = Math.round((kpi.value / total) * 100) || 0;

        return (
          <motion.button
            key={kpi.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setKpiAtivo(kpi.id)}
            className={`
              relative text-left
              rounded-2xl p-4 lg:p-5
              border transition-all
              ${isActive
                ? kpi.bg + ' ' + kpi.border + ' shadow-lg'
                : 'bg-[#1E293B] border-white/5 hover:border-white/10'
              }
            `}
          >
            {/* Ícone + Valor */}
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{kpi.icon}</span>
              {isActive && (
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${kpi.bg} ${kpi.textColor} border ${kpi.border}`}>
                  Ativo
                </span>
              )}
            </div>

            {/* Número */}
            <div className={`text-3xl lg:text-4xl font-black mb-1 ${isActive ? kpi.textColor : 'text-white'}`}>
              {kpi.value}
            </div>

            {/* Label */}
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
              {kpi.label}
            </div>

            {/* Barra de progresso */}
            {kpi.id !== 'All' && (
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isActive ? `${pct}%` : `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: kpi.color }}
                />
              </div>
            )}
            {kpi.id === 'All' && (
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-[#10B981]"
                />
              </div>
            )}

            {/* Borda ativa animada */}
            {isActive && (
              <motion.div
                layoutId="activeKPI"
                className={`absolute inset-0 rounded-2xl border-2 ${kpi.border} pointer-events-none`}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
