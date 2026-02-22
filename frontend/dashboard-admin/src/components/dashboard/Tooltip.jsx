import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, text, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute ${positions[position]}
              z-50
              pointer-events-none
              whitespace-nowrap
            `}
          >
            <div className="
              bg-black/95
              border border-[#10B981]/30
              rounded-xl
              px-3 py-2
              shadow-2xl
              shadow-[#10B981]/20
            ">
              <p className="text-xs text-gray-300 leading-relaxed max-w-xs whitespace-normal">
                {text}
              </p>
              
              {/* Arrow */}
              <div className={`
                absolute w-2 h-2 bg-black/95 border-[#10B981]/30 rotate-45
                ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r' : ''}
                ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-t border-l' : ''}
                ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r' : ''}
                ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l' : ''}
              `} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}