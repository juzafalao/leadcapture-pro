import React from 'react';
import { motion } from 'framer-motion';

export default React.memo(function MetricCard({ 
  label, 
  value, 
  icon, 
  trend, 
  trendValue, 
  active = false, 
  onClick,
  color = 'default',
  pulse = false 
}) {
  
  const colorStyles = {
    default: {
      bg: active ? 'bg-[#ee7b4d]/10' : 'bg-[#12121a]',
      border: active ? 'border-[#ee7b4d]/40 ring-1 ring-[#ee7b4d]' : 'border-white/5',
      text: 'text-white',
      glow: 'shadow-[#ee7b4d]/20'
    },
    hot: {
      bg: active ? 'bg-red-500/10' : 'bg-[#12121a]',
      border: active ? 'border-red-500/40 ring-1 ring-red-500' : 'border-white/5',
      text: 'text-red-500',
      glow: 'shadow-red-500/20'
    },
    warm: {
      bg: active ? 'bg-orange-500/10' : 'bg-[#12121a]',
      border: active ? 'border-orange-500/40 ring-1 ring-orange-500' : 'border-white/5',
      text: 'text-orange-500',
      glow: 'shadow-orange-500/20'
    },
    cold: {
      bg: active ? 'bg-blue-500/10' : 'bg-[#12121a]',
      border: active ? 'border-blue-500/40 ring-1 ring-blue-500' : 'border-white/5',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20'
    },
    money: {
      bg: active ? 'bg-green-500/10' : 'bg-[#12121a]',
      border: active ? 'border-green-500/40 ring-1 ring-green-500' : 'border-white/5',
      text: 'text-green-500',
      glow: 'shadow-green-500/20'
    }
  };

  const styles = colorStyles[color] || colorStyles.default;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        ${styles.bg} 
        border ${styles.border} 
        p-6 lg:p-8 
        rounded-3xl lg:rounded-[2.5rem] 
        transition-all 
        cursor-pointer 
        relative 
        overflow-hidden
        ${active ? `${styles.glow} shadow-xl` : 'hover:bg-white/[0.02]'}
        ${pulse && active ? 'animate-pulse' : ''}
      `}
    >
      {active && (
        <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent pointer-events-none`}></div>
      )}

      <motion.span 
        className="text-2xl lg:text-3xl mb-3 lg:mb-4 block"
        animate={pulse && active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {icon}
      </motion.span>

      <motion.p 
        className={`text-3xl lg:text-4xl xl:text-5xl font-black ${styles.text} mb-1 lg:mb-2 tracking-tighter`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {value}
      </motion.p>

      <p className="text-[8px] lg:text-[9px] text-gray-500 font-black uppercase tracking-widest">
        {label}
      </p>

      {trend && (
        <div className={`flex items-center gap-1 mt-2 lg:mt-3 text-[10px] lg:text-xs font-bold ${
          trend === 'up' ? 'text-green-500' : 'text-red-500'
        }`}>
          <span>{trend === 'up' ? '↑' : '↓'}</span>
          <span>{trendValue}</span>
        </div>
      )}

      {active && (
        <div className="absolute top-3 right-3 lg:top-4 lg:right-4">
          <div className={`w-2 h-2 rounded-full ${styles.text.replace('text-', 'bg-')} animate-pulse`}></div>
        </div>
      )}
    </motion.div>
  );
})