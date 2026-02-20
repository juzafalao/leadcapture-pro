import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

export default function AtribuirOperadorModal({ lead, onClose, onSuccess }) {
  const { usuario } = useAuth();
  const [operadores, setOperadores] = useState([]);
  const [selectedOperador, setSelectedOperador] = useState(lead?.id_operador_responsavel || null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchOperadores();
  }, []);

  const fetchOperadores = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, role, telefone')
        .eq('tenant_id', usuario.tenant_id)
        .eq('active', true)
        .in('role', ['Administrador', 'Gestor', 'Consultor'])
        .order('nome', { ascending: true });

      if (error) throw error;

      let operadoresFiltrados = data || [];

      if (usuario.role === 'Consultor') {
        operadoresFiltrados = data.filter(op => op.id === usuario.id);
      } else if (usuario.role === 'Gestor') {
        operadoresFiltrados = data.filter(op => 
          op.id === usuario.id || op.role === 'Consultor'
        );
      }

      setOperadores(operadoresFiltrados);
    } catch (error) {
      console.error('Erro ao buscar operadores:', error);
      alert('Erro ao carregar operadores');
    } finally {
      setLoading(false);
    }
  };

  const handleAtribuir = async () => {
    if (!selectedOperador) {
      alert('⚠️ Selecione um operador');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          id_operador_responsavel: selectedOperador,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) throw error;

      alert('✅ Lead atribuído com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atribuir lead:', error);
      alert('❌ Erro ao atribuir lead: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemover = async () => {
    if (!confirm('Deseja remover a atribuição deste lead?')) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          id_operador_responsavel: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) throw error;

      alert('✅ Atribuição removida!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao remover atribuição:', error);
      alert('❌ Erro: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const roleIcons = {
    'Administrador': '👑',
    'Gestor': '📊',
    'Consultor': '💼'
  };

  const roleColors = {
    'Administrador': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    'Gestor': 'bg-green-500/10 border-green-500/30 text-green-400',
    'Consultor': 'bg-orange-500/10 border-orange-500/30 text-orange-400'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#1a1a1f] rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  👤 Atribuir Operador
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {lead?.nome}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-4xl"
                >
                  ⏳
                </motion.div>
              </div>
            ) : operadores.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🤷</div>
                <p className="text-gray-400">
                  Nenhum operador disponível
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-400 mb-3">
                  Selecione o Responsável
                </label>

                {operadores.map((operador) => {
                  const isSelected = selectedOperador === operador.id;
                  return (
                    <motion.button
                      key={operador.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedOperador(operador.id)}
                      className={`
                        w-full
                        flex items-center gap-3
                        px-4 py-3
                        rounded-xl
                        border-2
                        transition-all
                        ${isSelected
                          ? roleColors[operador.role] + ' shadow-lg'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-full
                        flex items-center justify-center
                        font-bold text-sm
                        ${isSelected 
                          ? 'bg-gradient-to-br from-[#ee7b4d] to-[#f59e42] text-white' 
                          : 'bg-white/10 text-gray-400'
                        }
                      `}>
                        {operador.nome.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {operador.nome}
                          </span>
                          <span className="text-lg">
                            {roleIcons[operador.role]}
                          </span>
                        </div>
                        <div className="text-xs opacity-70">
                          {operador.role}
                        </div>
                      </div>

                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-lg"
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-white/5 flex gap-3">
            {lead?.id_operador_responsavel && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRemover}
                disabled={isSaving}
                className="
                  px-6 py-3
                  rounded-xl
                  bg-red-500/10
                  border border-red-500/30
                  text-red-400
                  font-bold
                  hover:bg-red-500/20
                  transition-all
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                Remover
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={isSaving}
              className="
                flex-1
                px-6 py-3
                rounded-xl
                bg-white/5
                border border-white/10
                text-white
                font-bold
                hover:bg-white/10
                transition-all
                disabled:opacity-50
              "
            >
              Cancelar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAtribuir}
              disabled={isSaving || !selectedOperador || selectedOperador === lead?.id_operador_responsavel}
              className="
                flex-1
                px-6 py-3
                rounded-xl
                bg-gradient-to-r from-[#ee7b4d] to-[#f59e42]
                text-black
                font-bold
                hover:shadow-lg hover:shadow-[#ee7b4d]/20
                transition-all
                disabled:opacity-50
                disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⏳
                  </motion.div>
                  Salvando...
                </>
              ) : (
                <>
                  ✓ Atribuir
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}