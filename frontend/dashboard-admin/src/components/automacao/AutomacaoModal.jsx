import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

const EMOJI_OPTIONS = ['⚡', '👋', '🔥', '🤖', '🌤', '🔗', '📧', '💬', '🎯', '📊', '🔔', '✅', '❌', '🚀', '💡'];

const GATILHO_OPTIONS = [
  { value: 'lead_criado', label: 'Novo lead criado' },
  { value: 'lead_hot', label: 'Lead categorizado como HOT' },
  { value: 'lead_warm_sem_contato', label: 'Lead Warm sem contato' },
  { value: 'lead_convertido', label: 'Lead convertido' },
  { value: 'lead_mensagem_recebida', label: 'Mensagem do lead recebida' },
  { value: 'agendamento_cron', label: 'Agendamento programado' },
  { value: 'manual', label: 'Execução manual' },
];

const ACAO_TIPO_OPTIONS = [
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'email', label: '📧 E-mail' },
  { value: 'notificacao', label: '🔔 Notificação' },
  { value: 'api', label: '🔗 API Externa' },
];

const DESTINO_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'admin', label: 'Admin' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'consultor', label: 'Consultor' },
];

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'configurando', label: 'Configurando' },
];

export default function AutomacaoModal({ automacao, onClose, onSave }) {
  const { usuario } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    emoji: '⚡',
    gatilho_tipo: 'lead_criado',
    acoes: [],
    status: 'configurando',
  });

  useEffect(() => {
    if (automacao) {
      setFormData({
        nome: automacao.nome || '',
        descricao: automacao.descricao || '',
        emoji: automacao.emoji || '⚡',
        gatilho_tipo: automacao.gatilho_tipo || 'lead_criado',
        acoes: automacao.acoes || [],
        status: automacao.status || 'configurando',
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        emoji: '⚡',
        gatilho_tipo: 'lead_criado',
        acoes: [],
        status: 'configurando',
      });
    }
  }, [automacao]);

  const handleAddAcao = () => {
    setFormData(prev => ({
      ...prev,
      acoes: [...prev.acoes, { tipo: 'whatsapp', destino: 'lead', template: '' }],
    }));
  };

  const handleRemoveAcao = (index) => {
    setFormData(prev => ({
      ...prev,
      acoes: prev.acoes.filter((_, i) => i !== index),
    }));
  };

  const handleAcaoChange = (index, field, value) => {
    setFormData(prev => {
      const newAcoes = [...prev.acoes];
      newAcoes[index] = { ...newAcoes[index], [field]: value };
      return { ...prev, acoes: newAcoes };
    });
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      setFormError('O nome do workflow é obrigatório.');
      return;
    }
    setFormError('');
    setIsSaving(true);

    try {
      const dataToSave = {
        tenant_id: usuario.tenant_id,
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim(),
        emoji: formData.emoji,
        gatilho_tipo: formData.gatilho_tipo,
        acoes: formData.acoes,
        status: formData.status,
      };

      let result;
      if (automacao?.id) {
        const { data, error } = await supabase
          .from('automacoes')
          .update(dataToSave)
          .eq('id', automacao.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('automacoes')
          .insert({ ...dataToSave, criado_por: usuario.id })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      onSave(result);
    } catch (error) {
      console.error('Erro ao salvar workflow:', error);
      setFormError('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center p-0 lg:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="relative bg-[#1E293B] border-t lg:border border-white/10 rounded-t-3xl lg:rounded-3xl w-full lg:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 border-b border-white/5">
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4 lg:hidden" />
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#F8FAFC]">
                {automacao ? 'Editar Workflow' : 'Novo Workflow'}
              </h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Nome */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Boas-vindas automáticas"
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-[#F8FAFC] placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o que este workflow faz..."
                rows={2}
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-[#F8FAFC] placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 resize-none"
              />
            </div>

            {/* Emoji */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Emoji</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, emoji })}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                      formData.emoji === emoji
                        ? 'bg-[#10B981]/20 border-2 border-[#10B981] scale-110'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Gatilho */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Gatilho</label>
              <select
                value={formData.gatilho_tipo}
                onChange={(e) => setFormData({ ...formData, gatilho_tipo: e.target.value })}
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-[#F8FAFC] focus:outline-none focus:border-[#10B981]/50"
              >
                {GATILHO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Ações */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Ações</label>
                <button
                  type="button"
                  onClick={handleAddAcao}
                  className="text-xs font-bold text-[#10B981] hover:text-[#059669] transition-colors"
                >
                  + Adicionar ação
                </button>
              </div>
              {formData.acoes.length === 0 && (
                <p className="text-xs text-gray-600 italic">Nenhuma ação configurada.</p>
              )}
              <div className="space-y-3">
                {formData.acoes.map((acao, index) => (
                  <div key={index} className="bg-[#0F172A] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-gray-600 uppercase tracking-wider mb-1">Tipo</label>
                        <select
                          value={acao.tipo}
                          onChange={(e) => handleAcaoChange(index, 'tipo', e.target.value)}
                          className="w-full bg-[#1E293B] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#10B981]/50"
                        >
                          {ACAO_TIPO_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-600 uppercase tracking-wider mb-1">Destino</label>
                        <select
                          value={acao.destino}
                          onChange={(e) => handleAcaoChange(index, 'destino', e.target.value)}
                          className="w-full bg-[#1E293B] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#10B981]/50"
                        >
                          {DESTINO_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={acao.template || ''}
                        onChange={(e) => handleAcaoChange(index, 'template', e.target.value)}
                        placeholder="Template (opcional)"
                        className="flex-1 bg-[#1E293B] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#F8FAFC] placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAcao(index)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-[#F8FAFC] focus:outline-none focus:border-[#10B981]/50"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {formError && (
            <div className="px-6 py-2 bg-red-500/10 border-t border-red-500/20">
              <p className="text-red-400 text-xs font-bold">{formError}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-semibold hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-[#10B981] text-black font-bold hover:bg-[#059669] disabled:opacity-50 transition-all"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
