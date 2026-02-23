import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const STATUS_BADGE = {
  sucesso: { icon: '✅', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  erro:    { icon: '❌', text: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20'   },
  parcial: { icon: '⚠️', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
};

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ExecucoesDrawer({ automacao, onClose }) {
  const [execucoes, setExecucoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!automacao?.id) return;
    setLoading(true);
    supabase
      .from('automacao_execucoes')
      .select('*')
      .eq('automacao_id', automacao.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao buscar execuções:', error);
        } else if (data) {
          setExecucoes(data);
        }
        setLoading(false);
      });
  }, [automacao?.id]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-end p-0 lg:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          className="relative bg-[#1E293B] border-t lg:border border-white/10 rounded-t-3xl lg:rounded-3xl w-full lg:max-w-md max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 border-b border-white/5">
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4 lg:hidden" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#F8FAFC]">Histórico de Execuções</h2>
                <p className="text-xs text-gray-500 mt-0.5">{automacao?.emoji} {automacao?.nome}</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : execucoes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-3xl mb-3 opacity-30">📋</p>
                <p className="text-gray-400 text-sm">Nenhuma execução registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {execucoes.map((exec) => {
                  const badge = STATUS_BADGE[exec.status] || STATUS_BADGE.parcial;
                  return (
                    <div
                      key={exec.id}
                      className={`bg-[#0F172A] border rounded-2xl p-4 ${badge.border}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.icon} {exec.status}
                        </span>
                        {exec.duracao_ms != null && (
                          <span className="text-[10px] text-gray-600">{exec.duracao_ms}ms</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mb-1">{formatDate(exec.created_at)}</p>
                      {exec.erro_mensagem && (
                        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mt-2">
                          {exec.erro_mensagem}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-white/5">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl border border-white/10 text-gray-400 font-semibold hover:bg-white/5 transition-all"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
