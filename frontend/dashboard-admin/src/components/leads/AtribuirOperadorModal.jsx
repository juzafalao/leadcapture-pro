import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

export default function AtribuirOperadorModal({ lead, onClose, onSuccess }) {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [operadores, setOperadores] = useState([]);
  const [selectedOperador, setSelectedOperador] = useState(lead?.id_operador_responsavel || null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const showAlert = (type, title, message) => {
    setAlertState({ isOpen: true, type, title, message });
  };

  useEffect(() => {
    fetchOperadores();
  }, []);

  const fetchOperadores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, role')
        .eq('tenant_id', usuario.tenant_id)
        .eq('active', true)
        .in('role', ['Administrador', 'Diretor', 'Gestor', 'Consultor', 'Operador'])
        .order('nome', { ascending: true });

      if (error) throw error;

      let filtrados = data || [];
      if ((usuario.role_nivel || 0) <= 2) {
        filtrados = filtrados.filter(op => op.id === usuario.id);
      } else if ((usuario.role_nivel || 0) === 3) {
        filtrados = filtrados.filter(op => op.id === usuario.id || ['Consultor', 'Operador'].includes(op.role));
      }

      setOperadores(filtrados);
    } catch (error) {
      console.error('Erro ao buscar operadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAtribuir = async () => {
    if (!selectedOperador) {
      showAlert('warning', 'Atenção', 'Selecione um operador antes de continuar.');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ id_operador_responsavel: selectedOperador, updated_at: new Date().toISOString() })
        .eq('id', lead.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onSuccess?.();
      onClose();
    } catch (error) {
      showAlert('error', 'Erro ao atribuir', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemover = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ id_operador_responsavel: null, updated_at: new Date().toISOString() })
        .eq('id', lead.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onSuccess?.();
      onClose();
    } catch (error) {
      showAlert('error', 'Erro ao remover', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const roleIcons = { 'Administrador': '👑', 'Diretor': '🎯', 'Gestor': '📊', 'Consultor': '💼', 'Operador': '⚙️' };
  const roleColors = {
    'Administrador': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    'Diretor':       'bg-blue-500/10 border-blue-500/30 text-blue-400',
    'Gestor':        'bg-green-500/10 border-green-500/30 text-green-400',
    'Consultor':     'bg-orange-500/10 border-orange-500/30 text-orange-400',
    'Operador':      'bg-gray-500/10 border-gray-500/30 text-gray-400',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0F172A] rounded-3xl shadow-2xl border border-white/10 overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">👤 Atribuir Operador</h2>
              <p className="text-sm text-gray-400 mt-1">{lead?.nome}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">✕</button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : operadores.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🤷</div>
                <p className="text-gray-400">Nenhum operador disponível</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-400 mb-3">Selecione o Responsável</p>
                {operadores.map((op) => {
                  const isSelected = selectedOperador === op.id;
                  return (
                    <motion.button key={op.id} type="button"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedOperador(op.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isSelected ? roleColors[op.role] + ' shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isSelected ? 'bg-gradient-to-br from-[#10B981] to-[#059669] text-white' : 'bg-white/10 text-gray-400'}`}>
                        {op.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{op.nome}</span>
                          <span>{roleIcons[op.role]}</span>
                        </div>
                        <div className="text-xs opacity-70">{op.role}</div>
                      </div>
                      {isSelected && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 flex gap-3">
            {lead?.id_operador_responsavel && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setConfirmOpen(true)} disabled={isSaving}
                className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/20 transition-all disabled:opacity-50">
                Remover
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={onClose} disabled={isSaving}
              className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all disabled:opacity-50">
              Cancelar
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleAtribuir}
              disabled={isSaving || !selectedOperador || selectedOperador === lead?.id_operador_responsavel}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-black font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Salvando...
                </>
              ) : '✓ Atribuir'}
            </motion.button>
          </div>
        </motion.div>
      </div>

      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title="Remover atribuição"
        message="Deseja remover a atribuição do operador deste lead?"
        onConfirm={handleRemover}
        onClose={() => setConfirmOpen(false)}
      />
    </AnimatePresence>
  );
}
