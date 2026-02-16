import React from 'react';
import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

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
      activeBg: 'bg-[#ee7b4d]/20',
      activeText: 'text-white',
      activeBorder: 'border-[#ee7b4d]/40',
      showChart: true
    },
    {
      id: 'Hot',
      label: 'Hot',
      value: kpis.hot,
      icon: '🔥',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      activeBg: 'bg-red-500/20',
      activeText: 'text-white',
      activeBorder: 'border-red-500/40'
    },
    {
      id: 'Warm',
      label: 'Warm',
      value: kpis.warm,
      icon: '🌤️',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      activeBg: 'bg-yellow-500/20',
      activeText: 'text-black',
      activeBorder: 'border-yellow-500/40'
    },
    {
      id: 'Cold',
      label: 'Cold',
      value: kpis.cold,
      icon: '❄️',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      activeBg: 'bg-blue-500/20',
      activeText: 'text-white',
      activeBorder: 'border-blue-500/40'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {kpiOptions.map((kpi) => {
        const isActive = kpiAtivo === kpi.id;
        
        const chartData = [{
          name: kpi.label,
          value: kpi.value,
          fill: '#ee7b4d'
        }];

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
                ? `${kpi.activeBg} ${kpi.activeBorder} shadow-lg shadow-[#ee7b4d]/10` 
                : `${kpi.bg} ${kpi.border} hover:border-opacity-50`
              }
            `}
          >
            {kpi.showChart && isActive ? (
              <div className="relative mb-2">
                <div className="h-28 lg:h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="60%"
                      outerRadius="90%"
                      data={chartData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, Math.max(kpi.value * 1.2, 100)]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                        fill="#ee7b4d"
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl lg:text-3xl font-black text-white block">
                      {kpi.value}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">
                      Leads
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-3xl lg:text-4xl mb-2">
                  {kpi.icon}
                </div>

                <div className={`
                  text-2xl lg:text-3xl
                  font-black
                  mb-1
                  ${isActive ? kpi.activeText : kpi.color}
                `}>
                  {kpi.value}
                </div>
              </>
            )}

            <div className={`
              text-xs lg:text-sm
              font-bold
              uppercase
              tracking-wide
              ${isActive ? kpi.activeText : 'text-gray-400'}
            `}>
              {kpi.label}
            </div>

            {isActive && (
              <motion.div
                layoutId="activeKPI"
                className="absolute inset-0 rounded-2xl border-2 border-[#ee7b4d]/30"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}