import React from 'react';
import { motion } from 'framer-motion';

export default function HeroMetric({ 
  label, 
  value, 
  subtitle,
  progress,
  progressLabel,
  trend,
  trendValue,
  icon = '💰'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="
        bg-gradient-to-br from-[#ee7b4d]/10 via-[#12121a] to-[#12121a]
        border border-[#ee7b4d]/20
        rounded-3xl lg:rounded-[3rem]
        p-8 lg:p-12
        relative
        overflow-hidden
        shadow-2xl
        shadow-[#ee7b4d]/10
      "
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#ee7b4d]/5 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Icon */}
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-5xl lg:text-6xl mb-6"
      >
        {icon}
      </motion.div>

      {/* Label */}
      <p className="text-[10px] lg:text-xs text-gray-500 font-black uppercase tracking-[0.3em] mb-2">
        {label}
      </p>

      {/* Value */}
      <motion.h2
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-5xl lg:text-7xl font-black text-[#ee7b4d] mb-4 tracking-tighter"
      >
        {value}
      </motion.h2>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm lg:text-base text-gray-400 mb-6">
          {subtitle}
        </p>
      )}

      {/* Trend */}
      {trend && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-6 ${
          trend === 'up' 
            ? 'bg-green-500/10 text-green-500' 
            : 'bg-red-500/10 text-red-500'
        }`}>
          <span className="text-lg">{trend === 'up' ? '↑' : '↓'}</span>
          <span>{trendValue}</span>
        </div>
      )}

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs lg:text-sm">
            <span className="text-gray-500 font-bold">{progressLabel || 'Progresso'}</span>
            <span className="text-white font-black">{progress}%</span>
          </div>
          <div className="h-3 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#ee7b4d] to-[#d4663a] rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}