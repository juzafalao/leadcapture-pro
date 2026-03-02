import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ACOES = {
  INSERT: { label: 'Criação', cor: '#10B981', emoji: '➕' },
  UPDATE: { label: 'Atualização', cor: '#F59E0B', emoji: '✏️' },
  DELETE: { label: 'Exclusão', cor: '#EF4444', emoji: '🗑️' },
};

function formatValue(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  return String(val);
}

function DiffView({ antes, depois, acao }) {
  if (acao === 'INSERT') {
    const campos = Object.entries(depois || {}).filter(([k]) => !['id', 'created_at', 'updated_at', 'deleted_at', 'tenant_id'].includes(k));
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-[#10B981] uppercase tracking-wider mb-3">Dados Criados</h4>
        {campos.map(([key, val]) => (
          <div key={key} className="flex items-start gap-3 bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl px-4 py-2">
            <span className="text-xs text-gray-500 font-mono min-w-[140px]">{key}</span>
            <span className="text-xs text-white break-all">{formatValue(val)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (acao === 'DELETE') {
    const campos = Object.entries(antes || {}).filter(([k]) => !['id', 'created_at', 'updated_at', 'deleted_at', 'tenant_id'].includes(k));
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider mb-3">Dados Excluídos</h4>
        {campos.map(([key, val]) => (
          <div key={key} className="flex items-start gap-3 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl px-4 py-2">
            <span className="text-xs text-gray-500 font-mono min-w-[140px]">{key}</span>
            <span className="text-xs text-red-300 line-through break-all">{formatValue(val)}</span>
          </div>
        ))}
      </div>
    );
  }

  // UPDATE — diff
  const antesObj = antes || {};
  const depoisObj = depois || {};
  const allKeys = [...new Set([...Object.keys(antesObj), ...Object.keys(depoisObj)])]
    .filter(k => !['id', 'created_at', 'updated_at', 'deleted_at', 'tenant_id'].includes(k));

  const changed = allKeys.filter(k => JSON.stringify(antesObj[k]) !== JSON.stringify(depoisObj[k]));
  const unchanged = allKeys.filter(k => JSON.stringify(antesObj[k]) === JSON.stringify(depoisObj[k]));

  return (
    <div className="space-y-4">
      {changed.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-3">
            Campos Alterados ({changed.length})
          </h4>
          <div className="space-y-2">
            {changed.map(key => (
              <div key={key} className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl px-4 py-3">
                <span className="text-xs text-gray-500 font-mono block mb-2">{key}</span>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-red-400 line-through break-all flex-1">{formatValue(antesObj[key])}</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-xs text-[#10B981] break-all flex-1">{formatValue(depoisObj[key])}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unchanged.length > 0 && (
        <details className="group">
          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors">
            Campos sem alteração ({unchanged.length}) ▸
          </summary>
          <div className="space-y-1 mt-2">
            {unchanged.map(key => (
              <div key={key} className="flex items-start gap-3 px-4 py-1">
                <span className="text-xs text-gray-600 font-mono min-w-[140px]">{key}</span>
                <span className="text-xs text-gray-500 break-all">{formatValue(antesObj[key])}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default function AuditDetailModal({ registro, onClose }) {
  if (!registro) return null;

  const acao = ACOES[registro.acao] || { label: registro.acao, cor: '#6B7280', emoji: '📋' };
  const dataFormatada = new Date(registro.created_at).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  let antes = null;
  let depois = null;
  try { antes = typeof registro.dados_antes === 'string' ? JSON.parse(registro.dados_antes) : registro.dados_antes; } catch {}
  try { depois = typeof registro.dados_depois === 'string' ? JSON.parse(registro.dados_depois) : registro.dados_depois; } catch {}

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0B1120] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{acao.emoji}</span>
              <div>
                <h2 className="text-lg font-bold text-white">{acao.label}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="font-mono" style={{ color: acao.cor }}>{registro.tabela}</span>
                  {registro.tenant_name && (
                    <span className="ml-2 px-2 py-0.5 bg-white/5 rounded-md text-gray-400">{registro.tenant_name}</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>
          </div>

          {/* Meta info */}
          <div className="px-6 py-3 border-b border-white/5 flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-gray-600">Usuário: </span>
              <span className="text-white font-medium">{registro.usuario_nome}</span>
              {registro.usuario_email && (
                <span className="text-gray-600 ml-1">({registro.usuario_email})</span>
              )}
            </div>
            <div>
              <span className="text-gray-600">Data: </span>
              <span className="text-white">{dataFormatada}</span>
            </div>
            <div>
              <span className="text-gray-600">ID registro: </span>
              <span className="text-gray-400 font-mono">{registro.registro_id?.substring(0, 8) || '—'}...</span>
            </div>
          </div>

          {/* Body - Diff */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <DiffView antes={antes} depois={depois} acao={registro.acao} />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center">
            <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">
              Audit Log · LeadCapture Pro
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white font-bold hover:bg-white/10 transition-all"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
