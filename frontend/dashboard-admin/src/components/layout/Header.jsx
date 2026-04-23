import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import ConfirmModal from '../shared/ConfirmModal';
import { Search, Bell, Menu, X } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { usuario, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogoutClick = () => setConfirmOpen(true);

  const handleLogoutConfirm = async () => {
    setConfirmOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = usuario?.nome
    ? usuario.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-xl border-b border-[#1F2937] w-full">
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">

          {/* Esquerda: Menu hamburguer + título */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#F8FAFC] hover:border-[#10B981]/40 transition-colors shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex flex-col min-w-0">
              <span style={{ fontWeight: 300, fontSize: 'clamp(16px, 2vw, 22px)', lineHeight: 1 }}>
                <span style={{ color: '#F8FAFC' }}>Lead</span>
                <span style={{ color: '#10B981' }}>Capture</span>
                <span style={{ color: '#F8FAFC' }}> Pro</span>
              </span>
              {(tenant?.nome || tenant?.name) && (
                <p className="text-[8px] text-[#10B981] font-bold uppercase tracking-wider mt-0.5 truncate">
                  {tenant.nome || tenant.name}
                </p>
              )}
            </div>
          </div>

          {/* Centro: Barra de busca (desktop) */}
          <div className="hidden md:flex flex-1 max-w-xs items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus-within:border-[#10B981]/40 transition-colors">
            <Search className="w-4 h-4 text-[#475569] shrink-0" />
            <input
              type="text"
              placeholder="Buscar leads, consultores..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              className="bg-transparent text-sm text-[#CBD5E1] placeholder:text-[#475569] outline-none w-full"
            />
          </div>

          {/* Direita: busca mobile + notificações + usuário + sair */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Busca mobile */}
            <button
              onClick={() => setShowSearch(v => !v)}
              className="md:hidden w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#CBD5E1] hover:border-[#10B981]/40 transition-colors"
            >
              {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* Sino de notificações */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotif(v => !v)}
                className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#CBD5E1] hover:border-[#10B981]/40 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#10B981] text-[9px] font-bold text-black flex items-center justify-center">
                  3
                </span>
              </button>

              {showNotif && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-[#0F172A] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Notificações</p>
                    <span className="text-[9px] text-[#10B981] font-bold uppercase tracking-wider">3 novas</span>
                  </div>
                  {[
                    { title: 'Novo lead quente', msg: 'Lead com score 95 capturado via WhatsApp', time: '2 min', type: 'hot' },
                    { title: 'Lead sem dono', msg: '5 leads aguardando atribuição', time: '18 min', type: 'warn' },
                    { title: 'Meta mensal atingida', msg: 'Parabéns! 120% da meta de leads', time: '1h', type: 'ok' },
                  ].map((n, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'hot' ? 'bg-red-400' :
                          n.type === 'warn' ? 'bg-amber-400' : 'bg-[#10B981]'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white leading-tight">{n.title}</p>
                          <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{n.msg}</p>
                          <p className="text-[10px] text-[#334155] mt-1">{n.time} atrás</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Divisor */}
            <div className="w-px h-6 bg-white/[0.08]" />

            {/* Info do usuário */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#000',
                }}
              >
                {initials}
              </div>
              <div className="hidden lg:block text-right leading-tight">
                <p className="text-xs font-medium text-[#F8FAFC]">{usuario?.nome || 'Usuário'}</p>
                <p className="text-[9px] text-[#10B981] font-bold uppercase tracking-wider">
                  {usuario?.role || 'Sem Permissão'}
                </p>
              </div>
            </div>

            {/* Botão sair */}
            <button
              onClick={handleLogoutClick}
              className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#475569] hover:text-red-400 hover:border-red-500/30 transition-all"
              title="Sair"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Barra de busca mobile expandível */}
        {showSearch && (
          <div className="md:hidden px-4 pb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus-within:border-[#10B981]/40 transition-colors">
              <Search className="w-4 h-4 text-[#475569] shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar leads, consultores..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                className="bg-transparent text-sm text-[#CBD5E1] placeholder:text-[#475569] outline-none w-full"
              />
            </div>
          </div>
        )}
      </header>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Sair do sistema"
        message="Tem certeza que deseja encerrar sua sessão?"
        onConfirm={handleLogoutConfirm}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
