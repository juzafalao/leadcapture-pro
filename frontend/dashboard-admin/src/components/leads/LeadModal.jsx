import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';
import { useAlertModal } from '../../hooks/useAlertModal';

const ROLES_GESTOR = ['Administrador', 'admin', 'Diretor', 'Gestor'];

export default function LeadModal({ lead, onClose }) {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const { alertModal, showAlert } = useAlertModal();
  const isGestor = ROLES_GESTOR.includes(usuario?.role);

  const isNovo = !lead?.id;

  const [formData, setFormData] = useState({
    nome:                  lead?.nome || '',
    email:                 lead?.email || '',
    telefone:              lead?.telefone || '',
    cidade:                lead?.cidade || '',
    estado:                lead?.estado || '',
    capital_disponivel:    lead?.capital_disponivel || 0,
    id_status:             lead?.id_status || '',
    id_motivo_desistencia: lead?.id_motivo_desistencia || '',
    categoria:             lead?.categoria || 'Cold',
    score:                 lead?.score || 0,
    fonte:                 lead?.fonte || '',
    id_marca:              lead?.id_marca || lead?.marca?.id || '',
    resumo_qualificacao:   lead?.resumo_qualificacao || '',
    mensagem_original:     lead?.mensagem_original || '',
    experiencia_anterior:  lead?.experiencia_anterior || false,
    urgencia:              lead?.urgencia || 'normal',
  });

  const [marcas, setMarcas]           = useState([]);
  const [statusList, setStatusList]   = useState([]);
  const [motivosList, setMotivosList] = useState([]);
  const [isSaving, setIsSaving]       = useState(false);

  const statusAtual = statusList.find(s => s.id === formData.id_status);
  const isPerdido   = statusAtual?.slug === 'perdido';

  useEffect(() => {
    if (!usuario?.tenant_id) return;

    async function fetchData() {
      if (!usuario?.tenant_id) return;
      const tenantId = usuario.tenant_id;
      const [
        { data: m, error: em },
        { data: s, error: es },
        { data: mo, error: emo },
      ] = await Promise.all([
        supabase.from('marcas').select('id, nome, emoji').eq('tenant_id', tenantId).eq('ativo', true).order('nome'),
        supabase.from('status_comercial').select('id, label, slug').eq('tenant_id', tenantId),
        supabase.from('motivos_desistencia').select('id, nome').eq('tenant_id', tenantId).eq('ativo', true).order('nome'),
      ]);
      if (em) console.error('Erro ao buscar marcas:', em);
      if (es) console.error('Erro ao buscar status_comercial:', es);
      if (emo) console.error('Erro ao buscar motivos_desistencia:', emo);
      if (m) setMarcas(m);
      if (s) setStatusList(s);
      if (mo) setMotivosList(mo);
    }
    fetchData();
  }, [usuario?.tenant_id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'id_status' && statusList.find(s => s.id === value)?.slug !== 'perdido'
        ? { id_motivo_desistencia: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isNovo && !formData.id_marca) { showAlert({ type: 'warning', title: 'Campo Obrigatório', message: 'Selecione uma Marca de Interesse!' }); return; }
    if (isPerdido && !formData.id_motivo_desistencia) { showAlert({ type: 'warning', title: 'Campo Obrigatório', message: 'Informe o motivo da desistência!' }); return; }
    setIsSaving(true);

    try {
      const payloadGestor = {
        nome:                  formData.nome,
        email:                 formData.email,
        telefone:              formData.telefone,
        cidade:                formData.cidade,
        estado:                formData.estado,
        capital_disponivel:    Number(formData.capital_disponivel),
        id_status:             formData.id_status || null,
        id_motivo_desistencia: isPerdido ? (formData.id_motivo_desistencia || null) : null,
        categoria:             formData.categoria,
        score:                 Number(formData.score),
        fonte:                 formData.fonte,
        id_marca:              formData.id_marca || null,
        resumo_qualificacao:   formData.resumo_qualificacao,
        mensagem_original:     formData.mensagem_original,
        experiencia_anterior:  formData.experiencia_anterior,
        urgencia:              formData.urgencia,
      };

      const payloadConsultor = {
        id_status:             formData.id_status || null,
        id_motivo_desistencia: isPerdido ? (formData.id_motivo_desistencia || null) : null,
        resumo_qualificacao:   formData.resumo_qualificacao,
      };

      const payload = isGestor ? payloadGestor : payloadConsultor;

      if (isNovo) {
        const { error } = await supabase.from('leads').insert([{...payloadGestor, tenant_id: usuario.tenant_id,}]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('leads')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', lead.id);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      showAlert({ type: 'error', title: 'Erro ao Salvar', message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass    = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#F8FAFC] placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/20 transition-all";
  const readOnlyClass = "w-full bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-gray-400";
  const labelClass    = "block text-sm font-bold text-gray-400 mb-2";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-[#1E293B] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">

          {/* HEADER */}
          <div className="px-6 py-5 border-b border-white/5 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold text-lg">
                {lead?.nome?.charAt(0).toUpperCase() || '+'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{isNovo ? 'Novo Lead' : 'Editar Lead'}</h2>
                <p className="text-sm text-gray-400">{isNovo ? 'Preencha as informações' : lead.nome}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">✕</button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

            {/* AVISO CONSULTOR */}
            {!isGestor && !isNovo && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center gap-2">
                <span>💼</span>
                <p className="text-xs text-blue-400 font-bold">Consultor: você pode alterar Status e Observações</p>
              </div>
            )}

            {/* OPERADOR */}
            {lead?.operador && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {lead.operador.nome?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-purple-400 font-bold uppercase tracking-wider">Operador Responsável</p>
                  <p className="text-sm font-bold text-white">{lead.operador.nome}</p>
                  <p className="text-xs text-purple-300">{lead.operador.role}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* NOME */}
              <div className="lg:col-span-2">
                <label className={labelClass}>Nome Completo *</label>
                {isGestor || isNovo
                  ? <input type="text" name="nome" value={formData.nome} onChange={handleChange} required className={inputClass} placeholder="Nome completo" />
                  : <div className={readOnlyClass}>{formData.nome}</div>}
              </div>

              {/* EMAIL */}
              <div>
                <label className={labelClass}>Email</label>
                {isGestor || isNovo
                  ? <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="email@exemplo.com" />
                  : <div className={readOnlyClass}>{formData.email || '—'}</div>}
              </div>

              {/* TELEFONE */}
              <div>
                <label className={labelClass}>Telefone</label>
                {isGestor || isNovo
                  ? <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className={inputClass} placeholder="(00) 00000-0000" />
                  : <div className={readOnlyClass}>{formData.telefone || '—'}</div>}
              </div>

              {/* CIDADE */}
              <div>
                <label className={labelClass}>Cidade</label>
                {isGestor || isNovo
                  ? <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className={inputClass} placeholder="São Paulo" />
                  : <div className={readOnlyClass}>{formData.cidade || '—'}</div>}
              </div>

              {/* ESTADO */}
              <div>
                <label className={labelClass}>Estado</label>
                {isGestor || isNovo
                  ? <input type="text" name="estado" value={formData.estado} onChange={handleChange} maxLength={2} className={inputClass + " uppercase"} placeholder="SP" />
                  : <div className={readOnlyClass}>{formData.estado || '—'}</div>}
              </div>

              {/* MARCA */}
              <div>
                <label className={labelClass}>🏷️ Marca de Interesse *</label>
                {isNovo ? (
                  <select name="id_marca" value={formData.id_marca} onChange={handleChange} required className={inputClass}>
                    <option value="">Selecione a marca</option>
                    {marcas.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.nome}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                    <span className="text-xl">{lead?.marca?.emoji}</span>
                    <span className="text-white font-bold">{lead?.marca?.nome || '—'}</span>
                    <span className="ml-auto text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">Fixo</span>
                  </div>
                )}
              </div>

              {/* CAPITAL */}
              <div>
                <label className={labelClass}>Capital Disponível (R$)</label>
                {isGestor || isNovo
                  ? <input type="number" name="capital_disponivel" value={formData.capital_disponivel} onChange={handleChange} min="0" step="1000" className={inputClass} placeholder="0" />
                  : <div className={readOnlyClass}>{formData.capital_disponivel ? `R$ ${Number(formData.capital_disponivel).toLocaleString('pt-BR')}` : '—'}</div>}
              </div>

              {/* STATUS COMERCIAL */}
              <div>
                <label className={labelClass}>📋 Status Comercial</label>
                <select name="id_status" value={formData.id_status} onChange={handleChange} className={inputClass}>
                  <option value="">Selecione o status</option>
                  {statusList.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              {/* MOTIVO DESISTÊNCIA */}
              {isPerdido && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className={labelClass + " !text-red-400"}>⚠️ Motivo da Desistência *</label>
                  <select name="id_motivo_desistencia" value={formData.id_motivo_desistencia} onChange={handleChange} required
                    className={inputClass + " border-red-500/30 focus:border-red-500/50"}>
                    <option value="">Selecione o motivo</option>
                    {motivosList.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </motion.div>
              )}

              {/* CATEGORIA */}
              {(isGestor || isNovo) && (
                <div>
                  <label className={labelClass}>Categoria</label>
                  <select name="categoria" value={formData.categoria} onChange={handleChange} className={inputClass}>
                    <option value="Hot">🔥 Hot</option>
                    <option value="Warm">🌤️ Warm</option>
                    <option value="Cold">❄️ Cold</option>
                  </select>
                </div>
              )}

              {/* SCORE */}
              {(isGestor || isNovo) && (
                <div>
                  <label className={labelClass}>Score (0-100)</label>
                  <input type="number" name="score" value={formData.score} onChange={handleChange} min="0" max="100" className={inputClass} />
                </div>
              )}

              {/* FONTE */}
              {(isGestor || isNovo) && (
                <div className="lg:col-span-2">
                  <label className={labelClass}>Fonte</label>
                  <input type="text" name="fonte" value={formData.fonte} onChange={handleChange} className={inputClass} placeholder="Instagram, Facebook, Site..." />
                </div>
              )}

              {/* EXPERIÊNCIA ANTERIOR */}
              {(isGestor || isNovo) && (
                <div className="lg:col-span-2 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <input type="checkbox" name="experiencia_anterior" id="exp_ant" checked={formData.experiencia_anterior} onChange={handleChange} className="w-4 h-4 accent-[#10B981]" />
                  <label htmlFor="exp_ant" className="text-sm text-gray-300 cursor-pointer">Tem experiência anterior com franquias</label>
                </div>
              )}

              {/* RESUMO / OBSERVAÇÃO */}
              <div className="lg:col-span-2">
                <label className={labelClass}>📝 Observações / Resumo</label>
                <textarea name="resumo_qualificacao" value={formData.resumo_qualificacao} onChange={handleChange} rows={3}
                  className={inputClass + " resize-none"} placeholder="Anotações sobre o lead..." />
              </div>

              {/* MENSAGEM ORIGINAL */}
              {lead?.mensagem_original && (
                <div className="lg:col-span-2">
                  <label className={labelClass}>Mensagem Original</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm">{lead.mensagem_original}</div>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-white/5 flex gap-3 flex-shrink-0">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose} disabled={isSaving} type="button"
              className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all disabled:opacity-50">
              Cancelar
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={isSaving} type="button"
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-black font-bold hover:shadow-lg hover:shadow-[#10B981]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving
                ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Salvando...</>
                : <>✓ {isNovo ? 'Criar Lead' : 'Salvar Alterações'}</>}
            </motion.button>
          </div>

        </motion.div>
      </div>

      {alertModal}
    </AnimatePresence>
  );
}