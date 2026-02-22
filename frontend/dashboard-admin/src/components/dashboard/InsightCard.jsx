import React from 'react';
import { motion } from 'framer-motion';

export default function InsightCard({ icon, title, description, action, priority = 'normal' }) {
  
  const priorityStyles = {
    high: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/5',
      iconBg: 'bg-red-500/10',
      text: 'text-red-500'
    },
    normal: {
      border: 'border-[#10B981]/20',
      bg: 'bg-[#10B981]/5',
      iconBg: 'bg-[#10B981]/10',
      text: 'text-[#10B981]'
    },
    low: {
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/5',
      iconBg: 'bg-blue-500/10',
      text: 'text-blue-400'
    }
  };

  const style = priorityStyles[priority] || priorityStyles.normal;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, x: 4 }}
      className={`
        ${style.bg}
        ${style.border}
        border
        rounded-2xl
        p-5 lg:p-6
        flex gap-4
        items-start
        transition-all
        cursor-pointer
        hover:shadow-lg
      `}
    >
      {/* Icon */}
      <div className={`
        ${style.iconBg}
        w-12 h-12 lg:w-14 lg:h-14
        rounded-xl
        flex items-center justify-center
        text-2xl lg:text-3xl
        flex-shrink-0
      `}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm lg:text-base font-bold ${style.text} mb-1`}>
          {title}
        </h4>
        <p className="text-xs lg:text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
        {action && (
          <button className={`
            mt-3 text-xs lg:text-sm font-bold ${style.text}
            hover:underline
          `}>
            {action} →
          </button>
        )}
      </div>
    </motion.div>
  );
}