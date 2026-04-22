// components/shared/PageHeader.jsx
// Padrao Analytics -- reutilizavel em todas as paginas
import { motion } from 'framer-motion'

export default function PageHeader({ title, accent, sub, children }) {
  return (
    <div className="px-4 lg:px-10 pt-6 lg:pt-8 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-4xl font-light text-white mb-1">
          {title} <span className="text-[#10B981] font-bold">{accent}</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="w-16 h-0.5 bg-[#10B981] rounded-full" />
          <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
            {sub}
          </p>
        </div>
      </motion.div>
      {children && (
        <div className="flex items-center gap-3 flex-wrap">
          {children}
        </div>
      )}
    </div>
  )
}
