import React from 'react'
import Logo from '../../assets/logo-leadcapture.png'

export function Header({ tenant, tenants, onSelectTenant }) {
  return (
    <header className="flex items-center justify-between bg-gray-900/50 border-b border-gray-800 p-4 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg overflow-hidden">
          <img src={Logo} alt="LeadCapture" className="h-full w-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">LeadCapture PRO</h1>
          <p className="text-xs text-gray-500">Gestão Inteligente de Leads</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {tenants.length > 1 && (
          <select
            value={tenant?.id || ''}
            onChange={(e) => onSelectTenant(tenants.find(t => t.id === e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
          >
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
          {tenant?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  )
}
