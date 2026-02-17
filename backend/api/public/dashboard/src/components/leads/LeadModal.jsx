import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

export default function LeadModal({ lead, onClose }) {
  const { usuario } = useAuth();
  const [formData, setFormData] = useState({
    nome: lead?.nome || '',
    email: lead?.email || '',
    telefone: lead?.telefone || '',
    cidade: lead?.cidade || '',
    estado: lead?.estado || '',
    capital_disponivel: lead?.capital_disponivel || 0,
    status: lead?.status || 'novo',
    categoria: lead?.categoria || 'cold',
    score: lead?.score || 0,
    fonte: lead?.fonte || '',
    marca_id: lead?.marca_id || '',
    observacao: lead?.observacao || '',
    mensagem_original: lead?.mensagem_original || ''
  });
  const [marcas, setMarcas] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMarcas();
  }, []);

  const fetchMarcas = async () => {
    const { data } = await supabase
      .from('marcas')
      .select('*')
      .eq('tenant_id', usuario.tenant_id)
      .eq('ativo', true)
      .order('nome');
    
    if (data) setMarcas(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (lead?.id) {
        // Atualizar lead existente
        const { error } = await supabase
          .from('leads')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id);

        if (error) throw error;
        alert('✅ Lead atualizado com sucesso!');
      } else {
        // Criar novo lead
        const { error } = await supabase
          .from('leads')
          .insert([{
            ...formData,
            tenant_id: usuario.tenant_id
          }]);

        if (error) throw error;
        alert('✅ Lead criado com sucesso!');
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      alert('❌ Erro ao salvar lead: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
          className="relative w-full max-w-2xl max-h-[90vh] bg-[#1a1a1f] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ee7b4d] to-[#f59e42] flex items-center justify-center text-white font-bold text-lg">
                  {lead?.nome?.charAt(0).toUpperCase() || '+'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {lead ? 'Editar Lead' : 'Novo Lead'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {lead ? lead.nome : 'Preencha as informações abaixo'}
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

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Operador Responsável - SOMENTE VISUALIZAÇÃO */}
              {lead?.operador && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">👤</span>
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                      Operador Responsável
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {lead.operador.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {lead.operador.nome}
                      </div>
                      <div className="text-xs text-purple-400">
                        {lead.operador.role}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                    "
                    placeholder="Digite o nome completo"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                    "
                    placeholder="email@exemplo.com"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                    "
                    placeholder="(00) 00000-0000"
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                    "
                    placeholder="São Paulo"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    maxLength={2}
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                      uppercase
                    "
                    placeholder="SP"
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Marca de Interesse
                  </label>
                  <select
                    name="marca_id"
                    value={formData.marca_id}
                    onChange={handleChange}
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                    "
                  >
                    <option value="">Selecione uma marca</option>
                    {marcas.map(marca => (
                      <option key={marca.id} value={marca.id}>
                        {marca.emoji} {marca.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Capital Disponível */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Capital Disponível (R$)
                  </label>
                  <input
                    type="number"
                    name="capital_disponivel"
                    value={formData.capital_disponivel}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                    "
                    placeholder="0"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                    "
                  >
                    <option value="novo">Novo Lead</option>
                    <option value="contatado">Contatado</option>
                    <option value="em negociação">Em Negociação</option>
                    <option value="vendido">Vendido</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Categoria
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                    "
                  >
                    <option value="hot">🔥 Hot</option>
                    <option value="warm">🌤️ Warm</option>
                    <option value="cold">❄️ Cold</option>
                  </select>
                </div>

                {/* Score */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Score (0-100)
                  </label>
                  <input
                    type="number"
                    name="score"
                    value={formData.score}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                    "
                    placeholder="0"
                  />
                </div>

                {/* Fonte */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Fonte
                  </label>
                  <input
                    type="text"
                    name="fonte"
                    value={formData.fonte}
                    onChange={handleChange}
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                    "
                    placeholder="Ex: Instagram, Facebook, Site"
                  />
                </div>

                {/* Observação */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-400 mb-2">
                    Observações
                  </label>
                  <textarea
                    name="observacao"
                    value={formData.observacao}
                    onChange={handleChange}
                    rows={3}
                    className="
                      w-full
                      bg-white/5
                      border border-white/10
                      rounded-xl
                      px-4 py-3
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:border-[#ee7b4d]/50
                      focus:ring-2
                      focus:ring-[#ee7b4d]/20
                      transition-all
                      resize-none
                    "
                    placeholder="Anotações sobre o lead..."
                  />
                </div>

                {/* Mensagem Original */}
                {lead?.mensagem_original && (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-bold text-gray-400 mb-2">
                      Mensagem Original
                    </label>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm">
                      {lead.mensagem_original}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 flex gap-3 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={isSaving}
              type="button"
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
              onClick={handleSubmit}
              disabled={isSaving}
              type="button"
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
                  ✓ {lead ? 'Salvar Alterações' : 'Criar Lead'}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}