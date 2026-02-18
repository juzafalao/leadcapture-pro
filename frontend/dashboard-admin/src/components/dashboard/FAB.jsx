import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function FAB({ onClick }) {
  const location = useLocation();

  // Determinar o texto com base na rota
  const getButtonText = () => {
    if (location.pathname.includes('marcas')) return 'Marca';
    if (location.pathname.includes('segmentos')) return 'Segmento';
    if (location.pathname.includes('usuarios')) return 'Usuário';
    return 'Novo';
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="
        fixed
        bottom-8
        right-8
        w-16
        h-16
        lg:w-auto
        lg:h-auto
        lg:px-6
        lg:py-4
        bg-[#ee7b4d]
        hover:bg-[#d4663a]
        text-black
        rounded-full
        shadow-2xl
        shadow-[#ee7b4d]/50
        flex
        items-center
        justify-center
        gap-2
        font-bold
        transition-all
        z-40
      "
    >
      <span className="text-2xl">+</span>
      <span className="hidden lg:inline uppercase tracking-wide">
        {getButtonText()}
      </span>
    </motion.button>
  );
}