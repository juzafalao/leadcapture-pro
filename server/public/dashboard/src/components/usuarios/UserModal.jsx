import React, { useState, useEffect } from 'react';
import { ROLES } from '../../lib/constants';

export default function UserModal({ user, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'Operador',
    ativo: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        role: user.role || 'Operador',
        ativo: user.ativo !== false
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSave({
        ...(user?.id && { id: user.id }),
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.trim(),
        role: formData.role,
        ativo: formData.ativo
      });
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center p-0 lg:p-4">
        <div 
          className="bg-[#12121a] border-t lg:border border-[#1f1f23] rounded-t-3xl lg:rounded-2xl w-full lg:max-w-lg max-h-[85vh] lg:max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header - Fixo */}
          <div className="flex-shrink-0 p-4 lg:p-6 border-b border-[#1f1f23]">
            {/* Handle Mobile */}
            <div className="w-12 h-1 bg-[#2a2a2f] rounded-full mx-auto mb-3 lg:hidden"></div>
            
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg lg:text-xl font-semibold text-white truncate">
                  {user ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <p className="text-[10px] lg:text-xs text-[#6a6a6f] mt-1 truncate">
                  {user ? user.nome : 'Cadastrar novo membro'}
                </p>
              </div>
              <button 
                onClick={onClose}
                disabled={isSaving}
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-white transition-colors disabled:opacity-50 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
            
            {/* Nome */}
            <div>
              <label className="block text-[9px] lg:text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: João Silva"
                disabled={isSaving}
                className={`w-full bg-[#1f1f23] border ${errors.nome ? 'border-red-500' : 'border-[#2a2a2f]'} rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base text-white placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50 disabled:opacity-50`}
              />
              {errors.nome && (
                <p className="text-xs text-red-500 mt-1">{errors.nome}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[9px] lg:text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@empresa.com"
                disabled={isSaving}
                className={`w-full bg-[#1f1f23] border ${errors.email ? 'border-red-500' : 'border-[#2a2a2f]'} rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base text-white placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50 disabled:opacity-50`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-[9px] lg:text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(11) 98765-4321"
                disabled={isSaving}
                className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base text-white placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50 disabled:opacity-50"
              />
            </div>

            {/* Role (Perfil) */}
            <div>
              <label className="block text-[9px] lg:text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">
                Perfil de Acesso *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={isSaving}
                className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base text-white focus:outline-none focus:border-[#ee7b4d]/50 disabled:opacity-50"
              >
                {Object.values(ROLES).sort((a, b) => b.nivel - a.nivel).map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.emoji} {role.label}
                  </option>
                ))}
              </select>
              
              {/* Preview compacto */}
              <div className="mt-2 p-3 bg-[#1f1f23] border border-[#2a2a2f] rounded-xl">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${ROLES[formData.role]?.color}20` }}
                  >
                    {ROLES[formData.role]?.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-semibold text-white truncate">
                      {ROLES[formData.role]?.label}
                    </p>
                    <p className="text-[10px] lg:text-xs text-[#6a6a6f] truncate">
                      {ROLES[formData.role]?.descricao}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Ativo/Inativo - Compacto */}
            <div>
              <label className="block text-[9px] lg:text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">
                Status
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ativo: true })}
                  disabled={isSaving}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                    formData.ativo
                      ? 'bg-green-500 text-black'
                      : 'bg-[#1f1f23] border border-[#2a2a2f] text-[#6a6a6f]'
                  }`}
                >
                  ● Ativo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ativo: false })}
                  disabled={isSaving}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                    !formData.ativo
                      ? 'bg-red-500 text-black'
                      : 'bg-[#1f1f23] border border-[#2a2a2f] text-[#6a6a6f]'
                  }`}
                >
                  ● Inativo
                </button>
              </div>
            </div>
          </div>

          {/* Footer - Fixo */}
          <div className="flex-shrink-0 p-4 lg:p-6 border-t border-[#1f1f23] flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2.5 lg:py-3 rounded-xl border border-[#2a2a2f] text-[#6a6a6f] text-sm lg:text-base font-semibold hover:bg-[#1f1f23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 py-2.5 lg:py-3 rounded-xl bg-[#ee7b4d] text-black text-sm lg:text-base font-semibold hover:bg-[#d4663a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}