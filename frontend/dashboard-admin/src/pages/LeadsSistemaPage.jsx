// ============================================================
// LeadsSistemaPage — Prospects do LeadCapture Pro (Sistema)
// Leads captados pela landing page institucional (/captacao)
// Desenvolvido por Zafalão Tech — LeadCapture Pro
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';

const STATUS_OPTS = ['novo', 'contato', 'negociacao', 'fechado', 'perdido'];
const PAGE_SIZE = 20; // 🆕 CONSTANTE DE PAGINAÇÃO

const STATUS_STYLE = {
  novo:        'bg-blue-500/10 text-blue-400 border-blue-500/30',
  contato:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  negociacao:  'bg-orange-500/10 text-orange-400 border-orange-500/30',
  fechado:     'bg-green-500/10 text-green-400 border-green-500/30',
  perdido:     'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

const STATUS_EMOJI = {
  novo: '🆕', contato: '📞', negociacao: '🤝', fechado: '✅', perdido: '❌',
};

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ── Modal de detalhes ────────────────────────────────────────
function ProspectModal({ prospect, onClose, onUpdate }) {
  const [status, setStatus] = useState(prospect?.status || 'novo');
  const [obs, setObs] = useState(prospect?.observacao || '');
  const [saving, setSaving] = useState(false);

  if (!prospect) return null;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('leads_sistema')
      .update({ status, observacao: obs })
      .eq('id', prospect.id)
      .select();
    setSaving(false);
    if (error) {
      console.error('Erro ao atualizar prospect:', error);
      alert('❌ Erro ao salvar: ' + error.message);
      return;
    }
    onUpdate();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-lg bg-[#111118] border border-white/10 rounded-3xl p-6 shadow-2xl"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ee7b4d] to-[#f59e42] flex items-center justify-center text-black font-black text-xl">
                {prospect.nome?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{prospect.nome}</h2>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  🚀 Prospect LeadCapture Pro
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-all"
            >
              ✕
            </button>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'E-mail', value: prospect.email, icon: '📧' },
              { label: 'WhatsApp', value: prospect.telefone, icon: '📱' },
              { label: 'Empresa', value: prospect.companhia || '—', icon: '🏢' },
              { label: 'Cidade', value: prospect.cidade ? `${prospect.cidade}${prospect.estado ? ' — ' + prospect.estado : ''}` : '—', icon: '📍' },
              { label: 'Fonte', value: prospect.fonte || '—', icon: '🔗' },
              { label: 'Captado em', value: formatDate(prospect.created_at), icon: '📅' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white/5 rounded-xl p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{icon} {label}</p>
                <p className="text-sm text-white font-medium truncate" title={value}>{value}</p>
              </div>
            ))}
          </div>

          {/* Observação original */}
          {prospect.observacao_original && (
            <div className="bg-white/5 rounded-xl p-3 mb-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">💬 Mensagem</p>
              <p className="text-sm text-gray-300 leading-relaxed">{prospect.observacao_original}</p>
            </div>
          )}

          {/* Status */}
          <div className="mb-4">
            <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`
                    px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                    ${status === s
                      ? STATUS_STYLE[s] + ' shadow-md'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                    }
                  `}
                >
                  {STATUS_EMOJI[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Observação interna */}
          <div className="mb-5">
            <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
              Observação Interna
            </label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              rows={3}
              placeholder="Notas internas sobre este prospect..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ee7b4d]/50 resize-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#ee7b4d] to-[#f59e42] text-black font-black text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? '⏳ Salvando...' : '✅ Salvar'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function LeadsSistemaPage() {
  const { usuario } = useAuth();
  const [prospects, setProspects] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busca, setBusca]         = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [selected, setSelected]   = useState(null);
  const [page, setPage] = useState(1); // 🆕 ESTADO DE PAGINAÇÃO
  const debounceRef = useRef(null);

  const handleBuscaChange = useCallback((value) => {
    setBuscaInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBusca(value), 300);
  }, []);

  useEffect(() => { fetchProspects(); }, []);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  useEffect(() => {
    let lista = [...prospects];
    if (filtroStatus !== 'todos') {
      lista = lista.filter(p => p.status === filtroStatus);
    }
    if (busca) {
      const q = busca.toLowerCase();
      lista = lista.filter(p =>
        p.nome?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.telefone?.includes(q) ||
        p.companhia?.toLowerCase().includes(q)
      );
    }
    setFiltrados(lista);
    setPage(1); // 🆕 RESETAR PÁGINA QUANDO FILTROS MUDAM
  }, [prospects, busca, filtroStatus]);

  const fetchProspects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads_sistema')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProspects(data);
      setFiltrados(data);
    }
    setLoading(false);
  };

  const handleUpdate = () => {
    setSelected(null);
    fetchProspects();
  };

  // 🆕 PAGINAÇÃO
  const totalPages = Math.ceil(filtrados.length / PAGE_SIZE);
  const paginatedLeads = filtrados.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const startIndex = (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, filtrados.length);

  // KPIs
  const kpis = {
    total:      prospects.length,
    novo:       prospects.filter(p => p.status === 'novo').length,
    negociacao: prospects.filter(p => p.status === 'negociacao').length,
    fechado:    prospects.filter(p => p.status === 'fechado').length,
    hoje:       prospects.filter(p => {
      const d = new Date(p.created_at);
      const n = new Date();
      return d.toDateString() === n.toDateString();
    }).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pb-32">

      {/* HEADER */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🚀</span>
            <h1 className="text-2xl lg:text-4xl font-light text-white">
              Prospects <span className="text-[#ee7b4d] font-bold">LeadCapture Pro</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#ee7b4d] rounded-full" />
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Interessados no produto · Desenvolvido por Zafalão Tech
            </p>
          </div>
        </motion.div>
      </div>

      {/* KPI CARDS */}
      <div className="px-4 lg:px-10 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: kpis.total,      icon: '📊', color: 'from-[#ee7b4d] to-[#f59e42]', id: 'todos' },
            { label: 'Novos', value: kpis.novo,       icon: '🆕', color: 'from-blue-600 to-blue-400',   id: 'novo' },
            { label: 'Negociando', value: kpis.negociacao, icon: '🤝', color: 'from-orange-600 to-orange-400', id: 'negociacao' },
            { label: 'Fechados', value: kpis.fechado, icon: '✅', color: 'from-green-600 to-green-400', id: 'fechado' },
            { label: 'Hoje', value: kpis.hoje,        icon: '📅', color: 'from-purple-600 to-purple-400', id: 'todos' },
          ].map((kpi, i) => (
            <motion.button
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFiltroStatus(kpi.id)}
              className={`
                relative overflow-hidden rounded-2xl p-4 text-left transition-all
                ${filtroStatus === kpi.id && kpi.id !== 'todos'
                  ? `bg-gradient-to-br ${kpi.color} shadow-lg`
                  : 'bg-[#12121a] border border-white/5 hover:border-white/10'
                }
              `}
            >
              <div className="text-2xl mb-2">{kpi.icon}</div>
              <div className={`text-2xl font-black ${filtroStatus === kpi.id && kpi.id !== 'todos' ? 'text-white' : 'text-white'}`}>
                {kpi.value}
              </div>
              <div className={`text-[9px] font-black uppercase tracking-wider mt-1 ${filtroStatus === kpi.id && kpi.id !== 'todos' ? 'text-white/70' : 'text-gray-500'}`}>
                {kpi.label}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* FILTROS */}
      <div className="px-4 lg:px-10 mb-8">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={buscaInput}
              onChange={e => handleBuscaChange(e.target.value)}
              placeholder="🔍 Buscar por nome, e-mail, empresa ou telefone..."
              className="w-full bg-[#12121a] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ee7b4d]/50 focus:ring-2 focus:ring-[#ee7b4d]/20 transition-all"
            />
            {buscaInput && (
              <button
                onClick={() => { setBuscaInput(''); setBusca(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex gap-2 flex-wrap">
            {['todos', ...STATUS_OPTS].map(s => (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                className={`
                  px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap
                  ${filtroStatus === s
                    ? s === 'todos'
                      ? 'bg-[#ee7b4d] text-black border-[#ee7b4d]'
                      : STATUS_STYLE[s] + ' shadow-md'
                    : 'bg-[#12121a] border-white/5 text-gray-500 hover:bg-white/5'
                  }
                `}
              >
                {s === 'todos' ? '📋 Todos' : `${STATUS_EMOJI[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="px-4 lg:px-10">
        {filtrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4 opacity-30">🚀</div>
            <p className="text-xl text-gray-400 mb-2">
              {buscaInput || filtroStatus !== 'todos' ? 'Nenhum prospect encontrado' : 'Nenhum prospect ainda'}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {buscaInput || filtroStatus !== 'todos'
                ? 'Tente ajustar os filtros'
                : 'Os prospects chegam via /captacao e WhatsApp'
              }
            </p>
            {(buscaInput || filtroStatus !== 'todos') && (
              <button
                onClick={() => { setBuscaInput(''); setBusca(''); setFiltroStatus('todos'); }}
                className="px-6 py-3 bg-[#ee7b4d] text-black font-bold rounded-xl hover:bg-[#d4663a] transition-all"
              >
                Limpar Filtros
              </button>
            )}
          </motion.div>
        ) : (
          <div className="bg-[#12121a] border border-white/5 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Prospect</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contato</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden xl:table-cell">Empresa</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider hidden lg:table-cell">Captado</th>
                    <th className="px-4 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeads.map((p, i) => ( /* 🆕 USANDO paginatedLeads */
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {/* Prospect */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ee7b4d] to-[#f59e42] flex items-center justify-center text-black font-bold">
                            {p.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white">{p.nome}</div>
                            <div className="text-xs text-gray-500">
                              {p.cidade ? `${p.cidade}${p.estado ? ' — ' + p.estado : ''}` : '🚀 LeadCapture Pro'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contato */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-300">{p.email || '—'}</div>
                        <div className="text-xs text-gray-500">{p.telefone || '—'}</div>
                      </td>

                      {/* Empresa */}
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <div className="text-sm text-gray-300">{p.companhia || '—'}</div>
                        <div className="text-xs text-gray-500">{p.fonte || '—'}</div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`
                          inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border
                          ${STATUS_STYLE[p.status] || STATUS_STYLE.novo}
                        `}>
                          {STATUS_EMOJI[p.status] || '🆕'} {p.status || 'novo'}
                        </span>
                      </td>

                      {/* Captado */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-400">{formatDate(p.created_at)}</div>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-4 text-right">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelected(p)}
                          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all"
                        >
                          Ver detalhes
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🆕 FOOTER COM PAGINAÇÃO */}
            <div className="px-4 py-4 border-t border-white/5">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Info */}
                <p className="text-xs text-gray-600">
                  Exibindo <span className="text-white font-bold">{startIndex}</span> a{' '}
                  <span className="text-white font-bold">{endIndex}</span> de{' '}
                  <span className="text-white font-bold">{filtrados.length}</span> prospects
                  {filtrados.length !== prospects.length && (
                    <span className="text-gray-700"> (de {prospects.length} total)</span>
                  )}
                </p>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Show first, last, current, and neighbors
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= page - 1 && pageNum <= page + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`
                                w-8 h-8 rounded-lg text-xs font-bold transition-all
                                ${page === pageNum
                                  ? 'bg-[#ee7b4d] text-black'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }
                              `}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return <span key={pageNum} className="text-gray-600">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Próxima →
                    </button>
                  </div>
                )}

                {/* Branding */}
                <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">
                  LeadCapture Pro · Zafalão Tech
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {selected && (
        <ProspectModal
          prospect={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
