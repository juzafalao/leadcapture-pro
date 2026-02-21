import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_CONFIG = {
  success: { icon: '✅', borderColor: 'border-[#10B981]', accentColor: 'text-[#10B981]', bgAccent: 'bg-[#10B981]/10' },
  error:   { icon: '❌', borderColor: 'border-[#EF4444]', accentColor: 'text-[#EF4444]', bgAccent: 'bg-[#EF4444]/10' },
  warning: { icon: '⚠️', borderColor: 'border-[#F59E0B]', accentColor: 'text-[#F59E0B]', bgAccent: 'bg-[#F59E0B]/10' },
  info:    { icon: 'ℹ️', borderColor: 'border-[#3B82F6]', accentColor: 'text-[#3B82F6]', bgAccent: 'bg-[#3B82F6]/10' },
};

export default function AlertModal({ isOpen, type = 'info', title, message, onClose }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-sm bg-[#1E293B] rounded-3xl shadow-2xl border ${config.borderColor} p-6 flex flex-col items-center text-center`}
          >
            <div className={`w-14 h-14 rounded-2xl ${config.bgAccent} flex items-center justify-center text-3xl mb-4`}>
              {config.icon}
            </div>
            {title && (
              <h3 className={`text-lg font-bold ${config.accentColor} mb-2`}>{title}</h3>
            )}
            {message && (
              <p className="text-sm text-[#F8FAFC]/80 mb-6 leading-relaxed">{message}</p>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-bold text-[#0F172A] bg-[#10B981] hover:bg-[#059669] transition-all`}
            >
              OK
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
