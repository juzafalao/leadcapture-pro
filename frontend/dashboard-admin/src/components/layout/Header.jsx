// components/layout/Header.jsx
// Header enxuto: sem titulo de pagina -- cada pagina tem seu proprio header
import { useAuth } from '../AuthContext'

export default function Header({ onMenuClick }) {
  const { usuario } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 lg:px-8 h-14 bg-[#0F172A]/90 backdrop-blur-xl border-b border-white/[0.05]">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-white hover:bg-white/[0.06] transition-all"
        aria-label="Menu"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
        </svg>
      </button>
      <div className="hidden lg:block" />

      {/* Direita: avatar */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-all relative">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-white/[0.06]">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-white leading-none">
              {usuario?.nome?.split(' ')[0] || 'Usuario'}
            </p>
            <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 leading-none mt-0.5">
              {usuario?.role || 'Role'}
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shrink-0"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#000' }}
          >
            {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  )
}
