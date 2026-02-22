import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOAST_STYLES = {
  success: 'bg-[#10B981] text-black',
  error:   'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-black',
  info:    'bg-blue-600 text-white',
};

const TOAST_ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

export default function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className={`
              pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl
              text-sm font-bold max-w-sm
              ${TOAST_STYLES[toast.type] || TOAST_STYLES.info}
            `}
          >
            <span>{TOAST_ICONS[toast.type] || TOAST_ICONS.info}</span>
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
