import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';

export default function LeadModal({ lead, onClose, onSave }) {
  const { usuario } = useAuth();
  const [motivosDesistencia, setMotivosDesistencia] = useState([]);
  const [formData, setFormData] = useState({
    status: lead?.status || 'Novo Lead',
    observacao: lead?.observacao || '',
    id_motivo_desistencia: lead?.id_motivo_desistencia || ''
  });

  useEffect(() => {
    fetchMotivos();
  }, []);

  const fetchMotivos = async () => {
    if (!usuario?.tenant_id) return;

    const { data, error } = await supabase
      .from('motivos_desistencia')
      .select('id, nome')
      .eq('tenant_id', usuario.tenant_id)
      .order('nome');

    if (!error && data) {
      setMotivosDesistencia(data);
    }
  };

  const handleSave = () => {
    onSave?.({ ...lead, ...formData });
  };

  const handleWhatsApp = () => {
    if (lead.telefone) {
      const numero = lead.telefone.replace(/\D/g, '');
      const mensagem = encodeURIComponent(`Olá ${lead.nome}, tudo bem?`);
      window.open(`https://wa.me/55${numero}?text=${mensagem}`, '_blank');
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '---';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-blue-500';
  };

  if (!lead) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-[#1a1a1f] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex-shrink-0 p-8 pb-6 relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              ✕
            </button>
            
            <h1 className="text-3xl font-bold text-[#ee7b4d] mb-1">
              {lead.nome}
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">
              Informação do Lead
            </p>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-8 pb-6 space-y-6">
            
            {/* Info Grid Linha 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#25252d] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">📱</span>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Telefone</p>
                </div>
                <p className="text-white font-semibold">{lead.telefone || '---'}</p>
              </div>

              <div className="bg-[#25252d] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">📧</span>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">E-mail</p>
                </div>
                <p className="text-white font-semibold truncate">{lead.email || '---'}</p>
              </div>

              <div className="bg-[#25252d] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">📍</span>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Localização</p>
                </div>
                <p className="text-white font-semibold">
                  {lead.cidade && lead.estado ? `${lead.cidade}/${lead.estado}` : '---'}
                </p>
              </div>

              <div className="bg-[#25252d] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">💰</span>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Investimento</p>
                </div>
                <p className="text-white font-semibold">{formatCurrency(lead.capital_disponivel)}</p>
              </div>
            </div>

            {/* Info Grid Linha 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#25252d] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">🌐</span>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Fonte Original</p>
                </div>
                <p className="text-white font-semibold capitalize">{lead.fonte || '---'}</p>
              </div>

              <div className="bg-[#25252d] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">{lead.marcas?.emoji || '🏢'}</span>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Marca / Unidade</p>
                </div>
                <p className="text-white font-semibold">{lead.marcas?.nome || '---'}</p>
              </div>

              <div className="bg-[#25252d] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">🎯</span>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Nicho</p>
                </div>
                <p className="text-white font-semibold">{lead.categoria || '---'}</p>
              </div>

              <div className="bg-[#25252d] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">🔥</span>
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Score IA</p>
                </div>
                <p className={`text-xl font-black ${getScoreColor(lead.score)}`}>
                  {lead.score || 0} pts
                </p>
              </div>
            </div>

            {/* Análise IA */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="text-3xl">🧠</div>
                <div className="flex-1">
                  <h3 className="text-blue-400 font-bold uppercase text-xs tracking-wider mb-2">
                    Análise de Perfil Inteligente
                  </h3>
                  <p className="text-gray-300 text-sm italic leading-relaxed">
                    {lead.capital_disponivel > (lead.marcas?.invest_max || 0)
                      ? `"Capital disponível é maior que o investimento máximo da marca."`
                      : lead.capital_disponivel < (lead.marcas?.invest_min || 0)
                      ? `"Capital disponível é menor que o investimento mínimo da marca."`
                      : `"Lead qualificado dentro da faixa de investimento da marca."`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Status Comercial */}
            <div>
              <label className="block text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-3">
                Status Comercial
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#25252d] border border-gray-700 rounded-2xl px-5 py-4 text-white font-semibold focus:outline-none focus:border-[#ee7b4d]/50 transition-all appearance-none cursor-pointer"
              >
                <option value="Novo Lead">🆕 Novo Lead</option>
                <option value="Em Contato">📞 Em Contato</option>
                <option value="Agendado">📅 Agendado</option>
                <option value="Em Negociação">💼 Em Negociação</option>
                <option value="Vendido">✅ Vendido</option>
                <option value="Perdido">❌ Perdido</option>
              </select>
            </div>

            {/* Motivo de Perda - CONDICIONAL */}
            {formData.status?.toLowerCase() === 'perdido' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
                <label className="block text-[9px] text-red-400 uppercase tracking-wider font-bold mb-3">
                  ⚠️ Motivo da Perda (Obrigatório)
                </label>
                <select
                  value={formData.id_motivo_desistencia}
                  onChange={(e) => setFormData({ ...formData, id_motivo_desistencia: e.target.value })}
                  className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                >
                  <option value="">Selecione o motivo...</option>
                  {motivosDesistencia.map((motivo) => (
                    <option key={motivo.id} value={motivo.id}>
                      {motivo.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="block text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-3">
                Observações do Operador
              </label>
              <textarea
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                placeholder="Descreva o andamento da negociação, pontos de atenção ou próximos passos..."
                rows={5}
                className="w-full bg-[#25252d] border border-gray-700 rounded-2xl px-5 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ee7b4d]/50 resize-none transition-all"
              />
            </div>

            {/* Botão WhatsApp */}
            {lead.telefone && (
              <button
                onClick={handleWhatsApp}
                className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-xl">📱</span>
                <span className="uppercase tracking-wide">Iniciar Conversa WhatsApp</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-800 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-transparent border border-gray-700 text-gray-400 font-bold uppercase tracking-wide hover:bg-gray-800 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={formData.status?.toLowerCase() === 'perdido' && !formData.id_motivo_desistencia}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#ee7b4d] to-[#f59e42] text-black font-bold uppercase tracking-wide hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </>
  );
}