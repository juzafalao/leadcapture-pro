import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTenant } from '../TenantContext';
import ConfirmModal from '../shared/ConfirmModal';
import { supabase } from '../../lib/supabase';
import { Search, Bell, Menu, X } from 'lucide-react';

const TIPO_CONFIG = {
  hot:     { dot: 'bg-red-400',   label: 'Lead quente'   },
  warn:    { dot: 'bg-amber-400', label: 'Atenção'       },
  ok:      { dot: 'bg-[#10B981]', label: 'Sucesso'       },
  info:    { dot: 'bg-blue-400',  label: 'Informação'    },
}

function fmtAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'agora'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function Header({ onMenuClick }) {
  const { usuario, tenant, logout } = useAuth();
  const { isAdmin, tenants, activeTenantId, setActiveTenantId } = useTenant();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifs, setNotifs] = useState([]);
  const notifRef = useRef(null);

  // Usa o tenant ativo global para filtrar notificações e realtime
  const tenantId = activeTenantId || null;

  const loadNotifs = useCallback(async () => {
    if (!tenantId && !isPlatformAdmin()) return;
    let q = supabase
      .from('notificacoes')
      .select('id, titulo, mensagem, tipo, lida, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q;
    if (data) setNotifs(data);
  }, [tenantId]);

  useEffect(() => { loadNotifs(); }, [loadNotifs]);

  // Realtime subscription
  useEffect(() => {
    if (!tenantId && !isPlatformAdmin()) return;
    const channelName = tenantId ? `notifs-header-${tenantId}` : 'notifs-header-admin';
    const opts = tenantId
      ? { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `tenant_id=eq.${tenantId}` }
      : { event: 'INSERT', schema: 'public', table: 'notificacoes' };
    const ch = supabase.channel(channelName).on('postgres_changes', opts, (payload) => {
      setNotifs(prev => [payload.new, ...prev].slice(0, 20));
    }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [tenantId]);

  const markAllRead = async () => {
    const unread = notifs.filter(n => !n.lida).map(n => n.id);
    if (!unread.length) return;
    await supabase.from('notificacoes').update({ lida: true }).in('id', unread);
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const unreadCount = notifs.filter(n => !n.lida).length;

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

          {/* Centro: Seletor de tenant (admin) + Barra de busca */}
          {isAdmin && tenants.length > 0 && (
            <select
              value={activeTenantId}
              onChange={e => setActiveTenantId(e.target.value)}
              className="hidden sm:block bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-3 py-2 text-xs text-[#10B981] font-bold focus:outline-none shrink-0 max-w-[180px] truncate"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name || t.id.slice(0, 8)}</option>
              ))}
            </select>
          )}

          {/* Barra de busca (desktop) */}
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
                onClick={() => { setShowNotif(v => !v); if (!showNotif) markAllRead(); }}
                className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#CBD5E1] hover:border-[#10B981]/40 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#10B981] text-[9px] font-bold text-black flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-[#0F172A] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden max-h-[420px] flex flex-col">
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                    <p className="text-sm font-semibold text-white">Notificações</p>
                    {unreadCount > 0 && (
                      <span className="text-[9px] text-[#10B981] font-bold uppercase tracking-wider">{unreadCount} nova{unreadCount !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifs.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-600 text-xs">Nenhuma notificação</div>
                    ) : notifs.map((n) => {
                      const cfg = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info;
                      return (
                        <div key={n.id} className={`px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0 ${!n.lida ? 'bg-white/[0.02]' : ''}`}>
                          <div className="flex items-start gap-2.5">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-white leading-tight">{n.titulo}</p>
                              {n.mensagem && <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{n.mensagem}</p>}
                              <p className="text-[10px] text-[#334155] mt-1">{fmtAgo(n.created_at)} atrás</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
