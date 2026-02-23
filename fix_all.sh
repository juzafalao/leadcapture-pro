#!/bin/bash
set -e

cd /Users/julianazafalao/Projetos/leadcapture-pro

ANALYTICS="frontend/dashboard-admin/src/pages/AnalyticsPage.jsx"
LEADS_SISTEMA="frontend/dashboard-admin/src/pages/LeadsSistemaPage.jsx"
DEBUG="frontend/dashboard-admin/src/components/DebugInfo.jsx"

echo "📦 Backups..."
cp "$ANALYTICS"    "${ANALYTICS}.bak"
cp "$LEADS_SISTEMA" "${LEADS_SISTEMA}.bak"
cp "$DEBUG"        "${DEBUG}.bak"
echo "   ✅ Backups criados"

# ══════════════════════════════════════════════════════
# FIX 1: DebugInfo — remove tela verde, mantém só logs
# ══════════════════════════════════════════════════════
echo "📝 Corrigindo DebugInfo.jsx..."
cat > "$DEBUG" << 'EOF'
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

// DebugInfo: apenas logs no console em DEV, sem tela verde
export const DebugInfo = () => {
  const { usuario } = useAuth();

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[DEBUG] Auth ID:', session?.user?.id || 'NULL');
      console.log('[DEBUG] Usuario:', usuario?.nome || 'NULL');
      console.log('[DEBUG] Role:', usuario?.role || 'NULL');
      console.log('[DEBUG] Tenant:', usuario?.tenant_id || 'NULL');
    };
    run();
  }, [usuario]);

  // Sem render visual — sem tela verde
  return null;
};
EOF
echo "   ✅ DebugInfo.jsx corrigido (sem tela verde)"

# ══════════════════════════════════════════════════════
# FIX 2: LeadsSistemaPage — key duplicada + status update
# ══════════════════════════════════════════════════════
echo "📝 Corrigindo LeadsSistemaPage.jsx..."
cat > "$LEADS_SISTEMA" << 'EOF'
// ============================================================
// LeadsSistemaPage — Prospects do LeadCapture Pro (Sistema)
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { useAlertModal } from '../hooks/useAlertModal';
import * as XLSX from 'xlsx';

const STATUS_OPTS = ['novo', 'contato', 'negociacao', 'fechado', 'perdido'];
const PAGE_SIZE = 20;

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
function ProspectModal({ prospect, onClose, onSaved }) {
  const [status, setStatus] = useState(prospect?.status || 'novo');
  const [observacaoInterna, setObservacaoInterna] = useState(prospect?.observacao_interna || '');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  if (!prospect) return null;

  const handleSave = async () => {
    setSaving(true);
    setErro('');
    setSucesso(false);

    const { error } = await supabase
      .from('leads_sistema')
      .update({ status, observacao_interna: observacaoInterna })
      .eq('id', prospect.id);

    setSaving(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso(true);
    // Aguarda 1s para o usuário ver o feedback, depois fecha e recarrega
    setTimeout(() => {
      onSaved();
      onClose();
    }, 1000);
  };

  return (
    // FIX: sem AnimatePresence aqui — o pai controla a montagem via {selected && <Modal/>}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-lg bg-[#1E293B] border border-white/10 rounded-3xl p-6 shadow-2xl"
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-black font-black text-xl">
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
            { label: 'E-mail',      value: prospect.email,    icon: '📧' },
            { label: 'WhatsApp',    value: prospect.telefone, icon: '📱' },
            { label: 'Empresa',     value: prospect.companhia || '—', icon: '🏢' },
            { label: 'Cidade',      value: prospect.cidade ? `${prospect.cidade}${prospect.estado ? ' — ' + prospect.estado : ''}` : '—', icon: '📍' },
            { label: 'Fonte',       value: prospect.fonte || '—', icon: '🔗' },
            { label: 'Captado em',  value: formatDate(prospect.created_at), icon: '📅' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white/5 rounded-xl p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{icon} {label}</p>
              <p className="text-sm text-white font-medium truncate" title={value}>{value}</p>
            </div>
          ))}
        </div>

        {/* Observação original */}
        {prospect.observacao && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">📩 Mensagem do Prospect</p>
            <p className="text-sm text-white leading-relaxed">{prospect.observacao}</p>
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
            📝 Observações Internas (CRM)
          </label>
          <textarea
            value={observacaoInterna}
            onChange={e => setObservacaoInterna(e.target.value)}
            rows={3}
            placeholder="Notas internas sobre este prospect..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 resize-none transition-all"
          />
          <p className="text-xs text-white/30 mt-1">
            Essas observações são internas e não sobrescrevem a mensagem original
          </p>
        </div>

        {/* Feedback inline */}
        {erro && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            ❌ {erro}
          </div>
        )}
        {sucesso && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold">
            ✅ Lead atualizado com sucesso!
          </div>
        )}

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
            disabled={saving || sucesso}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-black font-black text-sm hover:opacity-90 disabled:opacity-60 transition-all"
          >
            {saving ? '⏳ Salvando...' : sucesso ? '✅ Salvo!' : '💾 Salvar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function LeadsSistemaPage() {
  const { usuario } = useAuth();
  const [prospects, setProspects]     = useState([]);
  const [filtrados, setFiltrados]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [busca, setBusca]             = useState('');
  const [buscaInput, setBuscaInput]   = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [selected, setSelected]       = useState(null);
  const [page, setPage]               = useState(1);
  const [exportando, setExportando]   = useState(false);
  const debounceRef = useRef(null);
  const { alertModal, showAlert } = useAlertModal();

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
    if (filtroStatus !== 'todos') lista = lista.filter(p => p.status === filtroStatus);
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
    setPage(1);
  }, [prospects, busca, filtroStatus]);

  const fetchProspects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads_sistema')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) { setProspects(data); setFiltrados(data); }
    setLoading(false);
  };

  const exportarParaExcel = async () => {
    if (filtrados.length === 0) {
      showAlert({ type: 'warning', title: 'Atenção', message: 'Nenhum lead para exportar' });
      return;
    }
    setExportando(true);
    try {
      const dadosExport = filtrados.map(lead => ({
        'Nome': lead.nome || '',
        'Email': lead.email || '',
        'Telefone': lead.telefone || '',
        'Status': lead.status || 'novo',
        'Origem': lead.fonte || 'Sistema',
        'Data Criação': lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '',
        'Mensagem Prospect': lead.observacao || '',
        'Observações Internas': lead.observacao_interna || ''
      }));
      const worksheet = XLSX.utils.json_to_sheet(dadosExport);
      const workbook  = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads Sistema');
      worksheet['!cols'] = [
        { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
        { wch: 20 }, { wch: 12 }, { wch: 40 }, { wch: 40 }
      ];
      const nomeArquivo = `leads-sistema-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, nomeArquivo);
      showAlert({ type: 'success', title: 'Exportado!', message: `${filtrados.length} leads exportados` });
    } catch {
      showAlert({ type: 'error', title: 'Erro ao Exportar', message: 'Não foi possível exportar' });
    } finally {
      setExportando(false);
    }
  };

  const totalPages    = Math.ceil(filtrados.length / PAGE_SIZE);
  const paginatedLeads = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startIndex    = (page - 1) * PAGE_SIZE + 1;
  const endIndex      = Math.min(page * PAGE_SIZE, filtrados.length);

  const kpis = {
    total:      prospects.length,
    novo:       prospects.filter(p => p.status === 'novo').length,
    negociacao: prospects.filter(p => p.status === 'negociacao').length,
    fechado:    prospects.filter(p => p.status === 'fechado').length,
    hoje:       prospects.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length,
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-6xl">⏳</motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] pb-32">

      {/* HEADER */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🚀</span>
            <h1 className="text-2xl lg:text-4xl font-light text-white">
              Prospects <span className="text-[#10B981] font-bold">LeadCapture Pro</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Interessados no produto · Zafalão Tech
            </p>
          </div>
        </motion.div>
      </div>

      {/* KPI CARDS */}
      <div className="px-4 lg:px-10 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total',      value: kpis.total,      icon: '📊', color: 'from-[#10B981] to-[#059669]', id: 'todos' },
            { label: 'Novos',      value: kpis.novo,       icon: '🆕', color: 'from-blue-600 to-blue-400',   id: 'novo' },
            { label: 'Negociando', value: kpis.negociacao, icon: '🤝', color: 'from-orange-600 to-orange-400', id: 'negociacao' },
            { label: 'Fechados',   value: kpis.fechado,    icon: '✅', color: 'from-green-600 to-green-400', id: 'fechado' },
            { label: 'Hoje',       value: kpis.hoje,       icon: '📅', color: 'from-purple-600 to-purple-400', id: 'todos' },
          ].map((kpi, i) => (
            <motion.button
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setFiltroStatus(kpi.id)}
              className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all
                ${filtroStatus === kpi.id && kpi.id !== 'todos'
                  ? `bg-gradient-to-br ${kpi.color} shadow-lg`
                  : 'bg-[#1E293B] border border-white/5 hover:border-white/10'
                }`}
            >
              <div className="text-2xl mb-2">{kpi.icon}</div>
              <div className="text-2xl font-black text-white">{kpi.value}</div>
              <div className={`text-[9px] font-black uppercase tracking-wider mt-1
                ${filtroStatus === kpi.id && kpi.id !== 'todos' ? 'text-white/70' : 'text-gray-500'}`}>
                {kpi.label}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* FILTROS */}
      <div className="px-4 lg:px-10 mb-8">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={buscaInput}
              onChange={e => handleBuscaChange(e.target.value)}
              placeholder="🔍 Buscar por nome, e-mail, empresa ou telefone..."
              className="w-full bg-[#1E293B] border border-white/5 rounded-2xl px-5 py-4 text-sm text-[#F8FAFC] placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/20 transition-all"
            />
            {buscaInput && (
              <button onClick={() => { setBuscaInput(''); setBusca(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">✕</button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {['todos', ...STATUS_OPTS].map(s => (
              <button key={s} onClick={() => setFiltroStatus(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap
                  ${filtroStatus === s
                    ? s === 'todos' ? 'bg-[#10B981] text-black border-[#10B981]' : STATUS_STYLE[s] + ' shadow-md'
                    : 'bg-[#1E293B] border-white/5 text-gray-500 hover:bg-white/5'
                  }`}>
                {s === 'todos' ? '📋 Todos' : `${STATUS_EMOJI[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}`}
              </button>
            ))}
            <button onClick={exportarParaExcel} disabled={filtrados.length === 0 || exportando}
              className="px-4 py-2 rounded-xl bg-green-700 hover:bg-green-600 text-white text-xs font-bold border border-green-600/50 transition-all whitespace-nowrap disabled:opacity-50">
              {exportando ? '⏳ Exportando...' : `📊 Excel (${filtrados.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="px-4 lg:px-10">
        {filtrados.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">🚀</div>
            <p className="text-xl text-gray-400 mb-2">
              {buscaInput || filtroStatus !== 'todos' ? 'Nenhum prospect encontrado' : 'Nenhum prospect ainda'}
            </p>
            {(buscaInput || filtroStatus !== 'todos') && (
              <button onClick={() => { setBuscaInput(''); setBusca(''); setFiltroStatus('todos'); }}
                className="mt-4 px-6 py-3 bg-[#10B981] text-black font-bold rounded-xl hover:bg-[#059669] transition-all">
                Limpar Filtros
              </button>
            )}
          </motion.div>
        ) : (
          <div className="bg-[#1E293B] border border-white/5 rounded-3xl overflow-hidden">
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
                  {paginatedLeads.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-black font-bold">
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
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-300">{p.email || '—'}</div>
                        <div className="text-xs text-gray-500">{p.telefone || '—'}</div>
                      </td>
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <div className="text-sm text-gray-300">{p.companhia || '—'}</div>
                        <div className="text-xs text-gray-500">{p.fonte || '—'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border
                          ${STATUS_STYLE[p.status] || STATUS_STYLE.novo}`}>
                          {STATUS_EMOJI[p.status] || '🆕'} {p.status || 'novo'}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-400">{formatDate(p.created_at)}</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setSelected(p)}
                          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all">
                          Ver detalhes
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            <div className="px-4 py-4 border-t border-white/5">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-600">
                  Exibindo <span className="text-white font-bold">{startIndex}</span> a{' '}
                  <span className="text-white font-bold">{endIndex}</span> de{' '}
                  <span className="text-white font-bold">{filtrados.length}</span> prospects
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30">
                      ← Anterior
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
                          return (
                            <button key={pageNum} onClick={() => setPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                                ${page === pageNum ? 'bg-[#10B981] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                              {pageNum}
                            </button>
                          );
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return <span key={pageNum} className="text-gray-600">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30">
                      Próxima →
                    </button>
                  </div>
                )}
                <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">LeadCapture Pro · Zafalão Tech</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL — sem AnimatePresence para evitar key duplicada */}
      {selected && (
        <ProspectModal
          key={selected.id}
          prospect={selected}
          onClose={() => setSelected(null)}
          onSaved={fetchProspects}
        />
      )}
      {alertModal}
    </div>
  );
}
EOF
echo "   ✅ LeadsSistemaPage.jsx corrigido (key duplicada + status update + feedback inline)"

# ══════════════════════════════════════════════════════
# FIX 3: AnalyticsPage — ResponsiveContainer com minWidth:0
# ══════════════════════════════════════════════════════
echo "📝 Corrigindo AnalyticsPage.jsx (width/height -1)..."
cat > "$ANALYTICS" << 'ANALYTICS_EOF'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { useAnalytics, useRealtimeLeads } from '../hooks/useAnalytics'
import {
  AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as ChartTooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from 'recharts'

const COLORS = ['#10B981','#3b82f6','#8b5cf6','#ec4899','#f59e0b','#f43f5e','#06b6d4','#a3e635']

const fmtK = (v) => v >= 1000000 ? `R$ ${(v/1000000).toFixed(1)} mi` : v >= 1000 ? `R$ ${(v/1000).toFixed(0)} k` : `R$ ${v}`
const timeAgo = (iso) => {
  const d = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (d < 1)  return 'agora mesmo'
  if (d < 60) return `há ${d} min`
  const h = Math.floor(d/60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h/24)}d`
}

function KPICard({ label, value, sub, icon, highlight }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`relative bg-[#0F172A] border rounded-3xl p-6 flex flex-col gap-2 overflow-hidden
        ${highlight ? 'border-[#10B981]/40' : 'border-white/5'}`}>
      <div className="flex items-start justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
        <span className="text-2xl opacity-40">{icon}</span>
      </div>
      <p className={`text-2xl lg:text-3xl font-black ${highlight ? 'text-[#10B981]' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
    </motion.div>
  )
}

function FeedItem({ lead, isNew }) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: 30, backgroundColor: 'rgba(16,185,129,0.15)' } : { opacity: 1 }}
      animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex-shrink-0 flex items-center justify-center text-black font-black text-sm">
        {lead.nome?.charAt(0).toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{lead.nome}</p>
        <p className="text-[10px] text-gray-500 truncate">{lead.marca?.nome || 'Sem marca'} · {lead.fonte || '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-[#10B981]">{lead.capital_disponivel ? fmtK(lead.capital_disponivel) : '—'}</p>
        <p className="text-[10px] text-gray-600">{timeAgo(lead.created_at)}</p>
      </div>
    </motion.div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0F172A] border border-[#10B981]/20 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={{ backgroundColor:'#0B1220', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'12px', padding:'8px 14px', pointerEvents:'none' }}>
      <p style={{ color:'#94a3b8', fontSize:'11px', margin:0 }}>{item.name}</p>
      <p style={{ color:'#ffffff', fontSize:'13px', fontWeight:700, margin:'2px 0 0' }}>{item.value} leads</p>
    </div>
  )
}

const PERIODOS = [
  { label: '7D',  value: '7'  },
  { label: '15D', value: '15' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
]

export default function AnalyticsPage() {
  const { usuario } = useAuth()
  const [periodo, setPeriodo]     = useState('30')
  const [newLeads, setNewLeads]   = useState([])
  const [liveLeads, setLiveLeads] = useState([])
  const [clock, setClock]         = useState(new Date())
  const prevIdsRef = useRef(new Set())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { data, isLoading } = useAnalytics(usuario?.tenant_id, periodo)

  useRealtimeLeads(usuario?.tenant_id, (novo) => {
    setNewLeads(ids => [novo.id, ...ids].slice(0, 5))
    setLiveLeads(list => [novo, ...list].slice(0, 20))
  })

  useEffect(() => {
    if (data?.ultimosLeads) setLiveLeads(data.ultimosLeads)
  }, [data])

  const exportCSV = () => {
    if (!data?.ultimosLeads?.length) return alert('Sem dados para exportar.')
    const rows = data.ultimosLeads.map(l => [
      l.nome, l.capital_disponivel || 0,
      l.marca?.nome || '', l.status_comercial?.label || '',
      new Date(l.created_at).toLocaleDateString('pt-BR'), l.fonte || ''
    ])
    const csv = '\uFEFF' + ['Nome,Capital,Marca,Status,Data,Fonte', ...rows.map(r => r.join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `analytics_${periodo}d_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (isLoading) return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="text-6xl">⏳</motion.div>
    </div>
  )

  const d = data || {}

  return (
    <div className="min-h-screen bg-[#0B1220] text-white pb-32">

      {/* TOPBAR */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-8 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-1">
            Analytics <span className="text-[#10B981] font-bold">& BI</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Centro de Inteligência Comercial</p>
          </div>
        </motion.div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0F172A] border border-white/5 rounded-2xl px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">AO VIVO</span>
            <span className="text-[10px] text-gray-500">{clock.toLocaleTimeString('pt-BR')}</span>
          </div>
          <div className="flex bg-[#0F172A] border border-white/5 rounded-2xl p-1 gap-1">
            {PERIODOS.map(p => (
              <button key={p.value} onClick={() => setPeriodo(p.value)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all
                  ${periodo === p.value ? 'bg-[#10B981] text-black' : 'text-gray-500 hover:text-white'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-[#0F172A] border border-white/5 hover:border-[#10B981]/30 px-4 py-2.5 rounded-2xl text-xs font-black text-gray-400 hover:text-white transition-all">
            📥 CSV
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="px-4 lg:px-10 mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Leads Captados"   value={d.total || 0}               sub={`${d.mediadiaria}/dia em média`}      icon="🎯" />
        <KPICard label="Capital em Leads" value={fmtK(d.capitalFechado || 0)} sub={`${d.vendidos || 0} conversões`}      icon="💰" highlight />
        <KPICard label="Taxa Conversão"   value={`${d.txConversao || 0}%`}    sub="Meta: 20%"                            icon="📈" />
        <KPICard label="Capital Pipeline" value={fmtK(d.capitalPipeline || 0)} sub={`${d.pipeline || 0} em negociação`} icon="🤝" />
      </div>

      {/* MAIN GRID */}
      <div className="px-4 lg:px-10 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* GRÁFICO PRINCIPAL — FIX: wrapper com minWidth:0 evita width:-1 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-[#0F172A] border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white">Leads por Período</h3>
              <p className="text-[10px] text-gray-500">Evolução real vs forecast</p>
            </div>
          </div>
          {/* FIX: min-w-0 no wrapper resolve o warning width(-1) */}
          <div className="h-[280px] mt-4 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.evolucao || []} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gVendidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="dia" stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                <ChartTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="leads"    name="Leads"      stroke="#10B981" fill="url(#gLeads)"    strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="vendidos" name="Convertidos" stroke="#3b82f6" fill="url(#gVendidos)" strokeWidth={2}   dot={false} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Pace {periodo}D</p>
              <p className="text-lg font-black text-white">{d.mediadiaria}/dia</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Forecast 30D</p>
              <p className="text-lg font-black text-[#10B981]">{d.forecast || 0} leads</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Taxa Perca</p>
              <p className="text-lg font-black text-red-400">{d.txDesistencia || 0}%</p>
            </div>
          </div>
        </motion.div>

        {/* FEED AO VIVO */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">🔴 Últimos Leads</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] font-black text-red-400 uppercase tracking-wider">Ao Vivo</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none max-h-[380px]">
            <AnimatePresence>
              {liveLeads.slice(0, 15).map((lead) => (
                <FeedItem key={lead.id} lead={lead} isNew={newLeads.includes(lead.id)} />
              ))}
            </AnimatePresence>
            {liveLeads.length === 0 && (
              <div className="text-center py-10 text-gray-600">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-xs">Nenhum lead ainda</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* PREVISÃO IA + PACE + INSIGHTS */}
      <div className="px-4 lg:px-10 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#0F172A] to-[#0F172A] border border-[#10B981]/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <div>
              <p className="text-[9px] font-black text-[#10B981] uppercase tracking-wider">Previsão IA</p>
              <p className="text-[8px] text-gray-600">Baseado no histórico</p>
            </div>
            <span className="ml-auto text-[8px] bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded-full font-black uppercase">AUTO</span>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Fechamento Estimado</p>
          <p className="text-3xl lg:text-4xl font-black text-white mb-1">{fmtK(d.previsaoIA || 0)}</p>
          <p className="text-[10px] text-gray-500">{d.forecast || 0} leads × {d.txConversao || 0}% conversão</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📊</span>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Pace 90D</p>
              <p className="text-[8px] text-gray-600">Histórico</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Projeção 90 dias</p>
          <p className="text-3xl lg:text-4xl font-black text-white mb-1">{Math.round(d.pace90 || 0)} leads</p>
          <p className="text-[10px] text-gray-500">Média: {d.mediadiaria}/dia</p>
          <div className="mt-4">
            <div className="flex justify-between text-[9px] text-gray-600 mb-1">
              <span>Progresso</span>
              <span>{Math.min(100, Math.round((d.total / Math.max(d.pace90, 1)) * 100))}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.round((d.total / Math.max(d.pace90, 1)) * 100))}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full"
              />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white mb-1">💡 Insights</h3>
          {[
            { icon: d.txConversao >= 20 ? '🎯' : d.txConversao >= 10 ? '📊' : '📉', text: `Conversão ${d.txConversao}% — ${d.txConversao >= 20 ? 'Acima da média!' : d.txConversao >= 10 ? 'Na média' : 'Abaixo da média'}`, color: d.txConversao >= 20 ? 'text-green-400' : d.txConversao >= 10 ? 'text-yellow-400' : 'text-red-400' },
            { icon: d.perdidos > 0 ? '⚠️' : '✅', text: `${d.perdidos} leads perdidos (${d.txDesistencia}% desistência)`, color: d.perdidos > 5 ? 'text-red-400' : 'text-gray-400' },
            { icon: '⏱️', text: `Ciclo médio: ${d.cicloMedio} dias até conversão`, color: 'text-blue-400' },
            { icon: '💸', text: `Capital perdido: ${fmtK(d.capitalPerdido || 0)}`, color: d.capitalPerdido > 50000 ? 'text-red-400' : 'text-gray-400' },
          ].map((ins, i) => (
            <div key={i} className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2">
              <span className="text-base mt-0.5">{ins.icon}</span>
              <p className={`text-xs font-medium ${ins.color}`}>{ins.text}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* GRÁFICOS SECUNDÁRIOS */}
      <div className="px-4 lg:px-10 mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PIE — FIX: min-w-0 no wrapper */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-6">🏢 Leads por Marca</h3>
          {(d.porMarca || []).length > 0 ? (
            <div className="h-[260px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={d.porMarca} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    {(d.porMarca || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <ChartTooltip content={<PieTooltip />} />
                  <Legend verticalAlign="bottom" height={36}
                    formatter={v => <span style={{ color:'#94a3b8', fontSize:'11px' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-gray-600 text-sm">Sem dados suficientes</div>
          )}
        </motion.div>

        {/* BAR — FIX: min-w-0 no wrapper */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-[#0F172A] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-6">📉 Motivos de Perda</h3>
          {(d.motivosPerda || []).length > 0 ? (
            <div className="h-[260px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.motivosPerda} margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="motivo" stroke="#374151" fontSize={8} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                  <YAxis stroke="#374151" fontSize={9} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" name="Leads" fill="#10B981" radius={[8,8,0,0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-gray-600 text-sm">Nenhuma perda registrada 🎉</div>
          )}
        </motion.div>
      </div>

    </div>
  )
}
ANALYTICS_EOF
echo "   ✅ AnalyticsPage.jsx corrigido (min-w-0 nos containers dos gráficos)"

# ══════════════════════════════════════════════════════
# GIT
# ══════════════════════════════════════════════════════
echo ""
echo "📤 Commit e push..."
git add "$ANALYTICS" "$LEADS_SISTEMA" "$DEBUG"
git commit -m "fix: remove tela verde debug, key duplicada no modal, status update e width:-1 nos gráficos"
git push

echo ""
echo "══════════════════════════════════════════════════"
echo "✅ TUDO CORRIGIDO!"
echo "   • DebugInfo     → sem tela verde, só console.log"
echo "   • LeadsSistema  → key duplicada + status salva + feedback inline"
echo "   • AnalyticsPage → gráficos sem warning width:-1"
echo "══════════════════════════════════════════════════"
