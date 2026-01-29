import React from 'react'

export function LeadCard({ lead, onClick, statusConfig, categoriaConfig, fonteConfig }) {
  const status = statusConfig[lead.status] || { label: lead.status, color: 'gray', icon: '📋' }
  const categoria = categoriaConfig[lead.categoria] || { label: lead.categoria, color: 'from-gray-500 to-slate-500', icon: '⚪' }
  const fonte = fonteConfig[lead.fonte] || { label: lead.fonte, color: 'gray', icon: '🌐' }

  return (
    <div 
      onClick={() => onClick(lead)}
      className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 hover:border-orange-500/50 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-${status.color}-500/20 text-${status.color}-400 border border-${status.color}-500/30`}>
            {status.icon} {status.label.toUpperCase()}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r ${categoria.color} text-white`}>
            {categoria.icon} {categoria.label}
          </span>
        </div>
        <span className="text-gray-500 text-xs">{fonte.icon}</span>
      </div>
      
      <h3 className="text-white font-semibold group-hover:text-orange-400 transition-colors">{lead.nome}</h3>
      <p className="text-gray-400 text-sm mb-3 truncate">{lead.email || 'Sem e-mail'}</p>
      
      <div className="flex justify-between items-center pt-3 border-t border-gray-700/30">
        <span className="text-[10px] text-gray-500">
          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
        </span>
        <button className="text-orange-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Ver Detalhes →
        </button>
      </div>
    </div>
  )
}
