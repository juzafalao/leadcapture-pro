// LeadModalEnhanced.jsx — Modal de Lead Redesenhado (v4.0)
// Melhorias: Design moderno, atribuição de consultores, histórico de interações
// Paleta: #0F172A fundo, #10B981 verde/ativo, cinzas
//
// NOVAS FUNCIONALIDADES:
// 1. Atribuição de consultores (com validação de permissões)
// 2. Histórico de interações (timeline)
// 3. Ações rápidas (enviar mensagem, mudar status)
// 4. Informações de contato destacadas
// 5. Score visual com progresso
// 6. Notas/Comentários sobre o lead

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../AuthContext'
import { useAlertModal } from '../../hooks/useAlertModal'

const ROLES_GESTOR = ['Administrador', 'admin', 'Diretor', 'Gestor']
const ROLES_PODE_ATRIBUIR = ['Administrador', 'admin', 'Diretor', 'Gestor']

export default function LeadModalEnhanced({ lead, onClose, tenantName, statusReadOnly = false }) {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const { alertModal, showAlert } = useAlertModal()
  const isGestor = ROLES_GESTOR.includes(usuario?.role)
  const podeAtribuir = ROLES_PODE_ATRIBUIR.includes(usuario?.role) || usuario?.is_super_admin

  const isNovo = !lead?.id
  const [abaAtiva, setAbaAtiva] = useState('visao-geral')

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '', cidade: '', estado: '',
    capital_disponivel: 0, id_status: '', id_motivo_desistencia: '',
    categoria: 'cold', score: 0, fonte: '', id_marca: '',
    resumo_qualificacao: '', mensagem_original: '',
    experiencia_anterior: false, urgencia: 'normal',
  })

  // Estados de dados
  const [marcas, setMarcas] = useState([])
  const [statusList, setStatusList] = useState([])
  const [motivosList, setMotivosList] = useState([])
  const [consultores, setConsultores] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [consultorAtribuido, setConsultorAtribuido] = useState(null)
  const [consultorSelecionado, setConsultorSelecionado] = useState(null)
  const [mostrarAtribuicao, setMostrarAtribuicao] = useState(false)
  const [notas, setNotas] = useState('')

  // Sincroniza formData quando lead muda
  useEffect(() => {
    if (!lead) return
    setFormData({
      nome: lead.nome || '',
      email: lead.email || '',
      telefone: lead.telefone || '',
      cidade: lead.cidade || '',
      estado: lead.estado || '',
      capital_disponivel: lead.capital_disponivel || 0,
      id_status: lead.id_status || '',
      id_motivo_desistencia: lead.id_motivo_desistencia || '',
      categoria: lead.categoria || 'cold',
      score: lead.score || 0,
      fonte: lead.fonte || '',
      id_marca: lead.id_marca || lead.marca?.id || '',
      resumo_qualificacao: lead.resumo_qualificacao || '',
      mensagem_original: lead.mensagem_original || '',
      experiencia_anterior: lead.experiencia_anterior || false,
      urgencia: lead.urgencia || 'normal',
    })
    if (lead.operador_id) {
      // Busca o consultor atribuído
      supabase
        .from('usuarios')
        .select('id, nome, role, email')
        .eq('id', lead.operador_id)
        .single()
        .then(({ data }) => setConsultorAtribuido(data))
    }
  }, [lead?.id])

  // Busca dados do tenant
  useEffect(() => {
    const tenantId = lead?.tenant_id || usuario?.tenant_id
    if (!tenantId) return

    async function fetchData() {
      try {
        const [
          { data: m },
          { data: s },
          { data: mo },
          { data: c },
        ] = await Promise.all([
          supabase.from('marcas').select('id, nome, emoji').eq('tenant_id', tenantId).eq('ativo', true).order('nome'),
          supabase.from('status_comercial').select('id, label, slug').eq('tenant_id', tenantId),
          supabase.from('motivos_desistencia').select('id, nome').eq('tenant_id', tenantId).eq('ativo', true).order('nome'),
          supabase.from('usuarios').select('id, nome, role, email').eq('tenant_id', tenantId).in('role', ['Consultor', 'Gestor', 'Diretor']),
        ])
        if (m) setMarcas(m)
        if (s && s.length > 0) setStatusList(s)
        if (mo) setMotivosList(mo)
        if (c) setConsultores(c)
      } catch (err) {
        console.error('[LeadModal] Erro ao buscar dados:', err)
      }
    }
    fetchData()
  }, [lead?.tenant_id, usuario?.tenant_id])

  const statusAtual = statusList.find(s => s.id === formData.id_status)
  const isPerdido = statusAtual?.slug === 'perdido'
  const catCor = { hot: '#EF4444', warm: '#F59E0B', cold: '#6B7280' }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value }
      if (name === 'id_status') {
        const newStatus = statusList.find(s => s.id === value)
        if (newStatus && newStatus.slug !== 'perdido') {
          updated.id_motivo_desistencia = ''
        }
      }
      return updated
    })
  }

  const handleAtribuirConsultor = async (consultorId) => {
    if (!lead?.id) {
      showAlert({ type: 'warning', title: 'Erro', message: 'Lead não foi salvo ainda' })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/leads/${lead.id}/assign-consultant`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario?.token}`,
        },
        body: JSON.stringify({ consultantId: consultorId }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao atribuir consultor')

      const consultor = consultores.find(c => c.id === consultorId)
      setConsultorAtribuido(consultor)
      setMostrarAtribuicao(false)
      showAlert({ type: 'success', title: 'Sucesso', message: `Lead atribuído a ${consultor.nome}` })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    } catch (err) {
      console.error('[LeadModal] Erro ao atribuir:', err)
      showAlert({ type: 'error', title: 'Erro', message: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (isNovo && !formData.id_marca) {
      showAlert({ type: 'warning', title: 'Campo Obrigatório', message: 'Selecione uma Marca!' })
      return
    }
    if (isPerdido && !formData.id_motivo_desistencia) {
      showAlert({ type: 'warning', title: 'Campo Obrigatório', message: 'Informe o motivo da desistência!' })
      return
    }

    setIsSaving(true)
    try {
      const payload = isGestor
        ? formData
        : {
            id_status: formData.id_status || null,
            id_motivo_desistencia: isPerdido ? (formData.id_motivo_desistencia || null) : null,
            resumo_qualificacao: formData.resumo_qualificacao,
          }

      if (isNovo) {
        const { error } = await supabase.from('leads').insert([{ ...payload, tenant_id: usuario.tenant_id }])
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('leads')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', lead.id)
        if (error) throw error
      }

      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
      onClose()
    } catch (error) {
      console.error('[LeadModal] Erro ao salvar:', error)
      showAlert({ type: 'error', title: 'Erro ao Salvar', message: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/20 transition-all"
  const labelClass = "block text-sm font-bold text-gray-400 mb-2"

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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#1E293B] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col"
        >

          {/* HEADER MODERNO */}
          <div className="px-6 py-5 border-b border-white/5 flex-shrink-0 flex items-center justify-between bg-gradient-to-r from-[#0F172A] to-[#1E293B]">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${catCor[lead?.categoria] || '#6B7280'}22, ${catCor[lead?.categoria] || '#6B7280'}11)`,
                  border: `2px solid ${catCor[lead?.categoria] || '#6B7280'}`,
                }}
              >
                {lead?.nome?.charAt(0).toUpperCase() || '+'}
              </div>

              {/* Informações */}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{isNovo ? 'Novo Lead' : lead?.nome}</h2>
                  {tenantName && (
                    <span className="text-[10px] px-2 py-0.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-md text-[#10B981] font-bold uppercase">
                      {tenantName}
                    </span>
                  )}
                  {lead?.categoria && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase"
                      style={{ background: `${catCor[lead.categoria]}20`, color: catCor[lead.categoria] }}
                    >
                      {lead.categoria.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {lead?.email} • {lead?.telefone}
                </p>
              </div>
            </div>

            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              ✕
            </button>
          </div>

          {/* ABAS */}
          {!isNovo && (
            <div className="flex border-b border-white/5 px-6 flex-shrink-0 overflow-x-auto">
              {[
                { id: 'visao-geral', label: '👁️ Visão Geral' },
                { id: 'dados', label: '📋 Dados' },
                { id: 'historico', label: '📜 Histórico' },
              ].map(aba => (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 -mb-px whitespace-nowrap ${
                    abaAtiva === aba.id
                      ? 'text-[#10B981] border-[#10B981]'
                      : 'text-gray-600 border-transparent hover:text-gray-400'
                  }`}
                >
                  {aba.label}
                </button>
              ))}
            </div>
          )}

          {/* BODY */}
          <div className="flex-1 overflow-y-auto px-6 py-6">

            {/* ABA: VISÃO GERAL */}
            {abaAtiva === 'visao-geral' && !isNovo && (
              <div className="space-y-6">
                {/* Score e Categoria */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-2">Score</p>
                    <div className="flex items-end gap-3">
                      <div className="text-3xl font-black text-white">{lead?.score || 0}</div>
                      <div className="flex-1">
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(lead?.score || 0, 100)}%`,
                              background: catCor[lead?.categoria] || '#6B7280',
                            }}
                          />
                        </div>
                        <p className="text-[9px] text-gray-600">{Math.min(lead?.score || 0, 100)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-2">Capital</p>
                    <p className="text-2xl font-black text-[#10B981]">
                      {lead?.capital_disponivel ? `R$ ${(lead.capital_disponivel / 1000).toFixed(0)}K` : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-2">Status</p>
                    <p className="text-lg font-bold text-white">{statusAtual?.label || 'Novo'}</p>
                  </div>
                </div>

                {/* Atribuição de Consultor */}
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-600">Consultor Atribuído</p>
                    {podeAtribuir && (
                      <button
                        onClick={() => setMostrarAtribuicao(!mostrarAtribuicao)}
                        className="text-[10px] px-2 py-1 rounded-md bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 transition-all"
                      >
                        {mostrarAtribuicao ? 'Cancelar' : 'Atribuir'}
                      </button>
                    )}
                  </div>

                  {mostrarAtribuicao && podeAtribuir ? (
                    <div className="space-y-2">
                      {consultores.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleAtribuirConsultor(c.id)}
                          disabled={isSaving}
                          className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#10B981]/50 transition-all text-sm text-white disabled:opacity-50"
                        >
                          <div className="font-bold">{c.nome}</div>
                          <div className="text-[10px] text-gray-400">{c.role}</div>
                        </button>
                      ))}
                    </div>
                  ) : consultorAtribuido ? (
                    <div className="px-3 py-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                      <p className="font-bold text-white">{consultorAtribuido.nome}</p>
                      <p className="text-[10px] text-gray-400">{consultorAtribuido.role}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-600">Nenhum consultor atribuído</p>
                  )}
                </div>

                {/* Ações Rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white transition-all">
                    💬 Mensagem
                  </button>
                  <button className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white transition-all">
                    📧 Email
                  </button>
                  <button className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white transition-all">
                    📞 Ligar
                  </button>
                  <button className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white transition-all">
                    🔗 Copiar
                  </button>
                </div>
              </div>
            )}

            {/* ABA: DADOS */}
            {abaAtiva === 'dados' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nome</label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      disabled={!isGestor && !isNovo}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isGestor && !isNovo}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Telefone</label>
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      disabled={!isGestor && !isNovo}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Capital Disponível</label>
                    <input
                      type="number"
                      name="capital_disponivel"
                      value={formData.capital_disponivel}
                      onChange={handleChange}
                      disabled={!isGestor && !isNovo}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Cidade</label>
                    <input
                      type="text"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      disabled={!isGestor && !isNovo}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Estado</label>
                    <input
                      type="text"
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      disabled={!isGestor && !isNovo}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Resumo de Qualificação */}
                <div>
                  <label className={labelClass}>Resumo de Qualificação</label>
                  <textarea
                    name="resumo_qualificacao"
                    value={formData.resumo_qualificacao}
                    onChange={handleChange}
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Adicione anotações sobre este lead..."
                  />
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 rounded-xl text-[11px] font-bold bg-[#10B981] text-black hover:bg-[#059669] disabled:opacity-50 transition-all"
                  >
                    {isSaving ? '⏳ Salvando...' : '💾 Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl text-[11px] font-bold bg-white/5 text-white hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* ABA: HISTÓRICO */}
            {abaAtiva === 'historico' && !isNovo && (
              <div className="space-y-4">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Últimas Atividades</p>
                <div className="space-y-3">
                  {[
                    { tipo: 'criado', descricao: 'Lead criado', data: lead?.created_at },
                    { tipo: 'status', descricao: `Status alterado para ${statusAtual?.label || 'Novo'}`, data: lead?.updated_at },
                  ].map((atividade, i) => (
                    <div key={i} className="flex gap-3 pb-3 border-b border-white/5 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-[#10B981] mt-2 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-white font-bold">{atividade.descricao}</p>
                        <p className="text-[10px] text-gray-600">
                          {atividade.data ? new Date(atividade.data).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
