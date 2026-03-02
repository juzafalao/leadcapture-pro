import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { useAuditLog, useAuditFiltros } from '../hooks/useAuditLog';
import AuditDetailModal from '../components/audit/AuditDetailModal';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const ACOES_CONFIG = {
  INSERT: { label: 'Criação', cor: '#10B981', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/30', emoji: '➕' },
  UPDATE: { label: 'Atualização', cor: '#F59E0B', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', emoji: '✏️' },
  DELETE: { label: 'Exclusão', cor: '#EF4444', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/30', emoji: '🗑️' },
};

const PERIODOS = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '', label: 'Todos' },
];

export default function AuditLogPage() {
  const { usuario, isPlatformAdmin } = useAuth();
  const tenantId = isPlatformAdmin() ? null : usuario?.tenant_id;

  const [page, setPage] = useState(1);
  const [perPage] = useState(30);
  const [filtros, setFiltros] = useState({ tabela: 'todas', acao: 'todas', usuario_id: 'todos', periodo: '30' });
  const [selectedRegistro, setSelectedRegistro] = useState(null);

  const { data: logData, isLoading } = useAuditLog({ tenantId, page, perPage, filtros });
  const { data: filtrosData } = useAuditFiltros(tenantId);

  const rows = logData?.data || [];
  const totalCount = logData?.count || 0;
  const totalPages = Math.ceil(totalCount / perPage);

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatTabela = (tabela) => {
    const emojis = {
      leads: '📋', usuarios: '👤', marcas: '🏢', segmentos: '🎯',
      tenants: '🏗️', status_comercial: '📊', interacoes: '💬',
      configuracoes_tenant: '⚙️', automacoes: '🤖', vendedores: '💼',
      motivos_perda: '❌', motivos_desistencia: '🚫', convites: '✉️',
      notificacoes: '🔔', leads_sistema: '🌐',
    };
    return `${emojis[tabela] || '📄'} ${tabela}`;
  };

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  return (
    <div className="text-white pb-32">
      {/* HEADER */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-6 lg:mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-2">
            Audit <span className="text-[#10B981] font-bold">Log</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#10B981] rounded-full"></div>
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              {totalCount} {totalCount === 1 ? 'registro' : 'registros'} de auditoria
            </p>
          </div>
        </motion.div>
      </div>

      {/* FILTROS */}
      <div className="px-4 lg:px-10 mb-6">
        <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4 lg:p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Período */}
            <div>
              <label className="text-[10px] text-gray-600 font-bold uppercase tracking-wider block mb-1.5">Período</label>
              <select
                value={filtros.periodo}
                onChange={e => handleFiltroChange('periodo', e.target.value)}
                className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]/50 transition-all appearance-none"
              >
                {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {/* Tabela */}
            <div>
              <label className="text-[10px] text-gray-600 font-bold uppercase tracking-wider block mb-1.5">Tabela</label>
              <select
                value={filtros.tabela}
                onChange={e => handleFiltroChange('tabela', e.target.value)}
                className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]/50 transition-all appearance-none"
              >
                <option value="todas">Todas</option>
                {(filtrosData?.tabelas || []).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Ação */}
            <div>
              <label className="text-[10px] text-gray-600 font-bold uppercase tracking-wider block mb-1.5">Ação</label>
              <select
                value={filtros.acao}
                onChange={e => handleFiltroChange('acao', e.target.value)}
                className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]/50 transition-all appearance-none"
              >
                <option value="todas">Todas</option>
                {(filtrosData?.acoes || []).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Usuário */}
            <div>
              <label className="text-[10px] text-gray-600 font-bold uppercase tracking-wider block mb-1.5">Usuário</label>
              <select
                value={filtros.usuario_id}
                onChange={e => handleFiltroChange('usuario_id', e.target.value)}
                className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]/50 transition-all appearance-none"
              >
                <option value="todos">Todos</option>
                {(filtrosData?.usuarios || []).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="px-4 lg:px-10">
        {rows.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">📋</div>
            <p className="text-xl text-gray-400 mb-2">Nenhum registro encontrado</p>
            <p className="text-sm text-gray-600">Tente ajustar os filtros</p>
          </motion.div>
        ) : (
          <div className="bg-[#0F172A] border border-white/5 rounded-3xl overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-4 text-[10px] text-gray-600 font-black uppercase tracking-wider">Data/Hora</th>
                    <th className="text-left px-5 py-4 text-[10px] text-gray-600 font-black uppercase tracking-wider">Usuário</th>
                    <th className="text-left px-5 py-4 text-[10px] text-gray-600 font-black uppercase tracking-wider">Ação</th>
                    <th className="text-left px-5 py-4 text-[10px] text-gray-600 font-black uppercase tracking-wider">Tabela</th>
                    {isPlatformAdmin() && (
                      <th className="text-left px-5 py-4 text-[10px] text-gray-600 font-black uppercase tracking-wider">Tenant</th>
                    )}
                    <th className="text-right px-5 py-4 text-[10px] text-gray-600 font-black uppercase tracking-wider">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const acao = ACOES_CONFIG[row.acao] || { label: row.acao, cor: '#6B7280', bg: 'bg-white/5', border: 'border-white/10', emoji: '📋' };
                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{formatDate(row.created_at)}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-white font-medium">{row.usuario_nome}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${acao.bg} border ${acao.border}`} style={{ color: acao.cor }}>
                            {acao.emoji} {acao.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-300">{formatTabela(row.tabela)}</td>
                        {isPlatformAdmin() && (
                          <td className="px-5 py-3.5">
                            {row.tenant_name && (
                              <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-gray-400">{row.tenant_name}</span>
                            )}
                          </td>
                        )}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedRegistro(row)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 font-bold hover:bg-[#10B981]/10 hover:border-[#10B981]/30 hover:text-[#10B981] transition-all"
                          >
                            Ver Diff
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden p-4 space-y-3">
              {rows.map((row, i) => {
                const acao = ACOES_CONFIG[row.acao] || { label: row.acao, cor: '#6B7280', bg: 'bg-white/5', border: 'border-white/10', emoji: '📋' };
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedRegistro(row)}
                    className="bg-[#0B1120] border border-white/5 rounded-2xl p-4 cursor-pointer hover:border-[#10B981]/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${acao.bg} border ${acao.border}`} style={{ color: acao.cor }}>
                        {acao.emoji} {acao.label}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono">{formatDate(row.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white font-medium">{row.usuario_nome}</p>
                        <p className="text-[10px] text-gray-500">{formatTabela(row.tabela)}</p>
                      </div>
                      {isPlatformAdmin() && row.tenant_name && (
                        <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-md text-gray-500">{row.tenant_name}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* PAGINAÇÃO */}
            <div className="px-4 py-4 border-t border-white/5">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-600">
                  Página <span className="text-white font-bold">{page}</span> de{' '}
                  <span className="text-white font-bold">{totalPages || 1}</span> ({totalCount} registros)
                </p>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-30"
                    >
                      Próxima →
                    </button>
                  </div>
                )}

                <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">
                  LeadCapture Pro · Zafalão Tech
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALHES */}
      {selectedRegistro && (
        <AuditDetailModal
          registro={selectedRegistro}
          onClose={() => setSelectedRegistro(null)}
        />
      )}
    </div>
  );
}
