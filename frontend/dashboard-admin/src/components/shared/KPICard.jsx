// components/shared/KPICard.jsx
// KPI Card padrao Analytics -- reutilizavel
import { motion } from 'framer-motion'

export default function KPICard({ label, value, sub, icon, highlight, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative bg-[#0F172A] border rounded-3xl p-6 flex flex-col gap-2 overflow-hidden
        ${highlight ? 'border-[#10B981]/40' : 'border-white/5'}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
        {icon && <span className="text-2xl opacity-40">{icon}</span>}
      </div>
      <p className={`text-2xl lg:text-3xl font-black ${highlight ? 'text-[#10B981]' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
    </motion.div>
  )
}
