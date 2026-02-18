import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

export default function UserModal({ usuario, onClose }) {
  const [formData, setFormData] = useState({
    role: usuario?.role || 'Operador'
  });
  const [isSaving, setIsSaving] = useState(false);

  const roles = [
    { value: 'Administrador', label: 'Administrador', icon: '👑', color: 'purple' },
    { value: 'Diretor', label: 'Diretor', icon: '🎯', color: 'blue' },
    { value: 'Gestor', label: 'Gestor', icon: '📊', color: 'green' },
    { value: 'Consultor', label: 'Consultor', icon: '💼', color: 'orange' },
    { value: 'Operador', label: 'Operador', icon: '⚙️', color: 'gray' }
  ];

  const roleColors = {
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    gray: 'bg-gray-500/10 border-gray-500/30 text-gray-400'
  };

  const handleSave = async () => {
    if (!usuario?.id) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ role: formData.role })
        .eq('id', usuario.id);

      if (error) throw error;

      alert('✅ Perfil atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('❌ Erro ao atualizar perfil: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#1a1a1f] rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ee7b4d] to-[#f59e42] flex items-center justify-center text-white font-bold text-lg">
                  {usuario?.nome?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Editar Perfil
                  </h2>
                  <p className="text-sm text-gray-400">
                    {usuario?.nome}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-6">
            {/* Info do Usuário */}
            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Email
                </span>
              </div>
              <p className="text-sm text-gray-300">
                {usuario?.email}
              </p>

              {usuario?.telefone && (
                <>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Telefone
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {usuario.telefone}
                  </p>
                </>
              )}
            </div>

            {/* Seletor de Role */}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-3">
                Perfil de Acesso
              </label>
              <div className="space-y-2">
                {roles.map((role) => {
                  const isSelected = formData.role === role.value;
                  return (
                    <motion.button
                      key={role.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData({ ...formData, role: role.value })}
                      className={`
                        w-full
                        flex items-center gap-3
                        px-4 py-3
                        rounded-xl
                        border-2
                        transition-all
                        ${isSelected
                          ? roleColors[role.color] + ' shadow-lg'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }
                      `}
                    >
                      <span className="text-2xl">{role.icon}</span>
                      <span className="flex-1 text-left font-bold">
                        {role.label}
                      </span>
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
            </div>

            {/* Info sobre mudança */}
            <div className="bg-[#ee7b4d]/10 border border-[#ee7b4d]/30 rounded-xl p-4">
              <div className="flex gap-3">
                <span className="text-xl">ℹ️</span>
                <div>
                  <p className="text-xs font-bold text-[#ee7b4d] mb-1">
                    Sobre a mudança de perfil
                  </p>
                  <p className="text-xs text-gray-400">
                    Alterar o perfil do usuário irá modificar suas permissões de acesso ao sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 flex gap-3">
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
                disabled:cursor-not-allowed
              "
            >
              Cancelar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving || formData.role === usuario?.role}
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
                  ✓ Salvar Alterações
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}