// ============================================================
// useKanban.js — Leads agrupados por coluna + mutacao de mover
// LeadCapture Pro — Zafalao Tech
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Colunas padrao do funil (usadas quando nao ha status_comercial configurado)
export const COLUNAS_PADRAO = [
  { id: 'novo',        label: 'Novo',        slug: 'novo',        cor: '#6366F1' },
  { id: 'contato',     label: 'Em Contato',  slug: 'contato',     cor: '#F59E0B' },
  { id: 'qualificado', label: 'Qualificado', slug: 'qualificado', cor: '#3B82F6' },
  { id: 'proposta',    label: 'Proposta',    slug: 'proposta',    cor: '#8B5CF6' },
  { id: 'convertido',  label: 'Convertido',  slug: 'convertido',  cor: '#10B981' },
  { id: 'perdido',     label: 'Perdido',     slug: 'perdido',     cor: '#EF4444' },
]

// Busca status_comercial configurados no banco
export function useStatusColunas(tenantId) {
  return useQuery({
    queryKey: ['status-colunas', tenantId],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_comercial')
        .select('id, label, slug, cor, ordem')
        .eq('tenant_id', tenantId)
        .order('ordem', { ascending: true })

      if (error || !data?.length) return COLUNAS_PADRAO
      return data.map(s => ({
        id:    s.id,
        label: s.label,
        slug:  s.slug,
        cor:   s.cor || '#6366F1',
      }))
    },
    enabled: !!tenantId,
  })
}

// Busca leads agrupados por coluna para o Kanban
export function useKanbanLeads({ tenantId, colunas = [] }) {
  const qc = useQueryClient()

  // Realtime — invalida ao receber novo lead
  return useQuery({
    queryKey: ['kanban', tenantId],
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id, nome, email, telefone, score, categoria,
          capital_disponivel, regiao_interesse, fonte, created_at,
          marca:id_marca (id, nome, emoji),
          status_comercial:id_status (id, label, slug, cor),
          operador:id_operador_responsavel (id, nome)
        `)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      const leads = data ?? []

      // Agrupa por coluna
      const mapa = {}
      colunas.forEach(col => { mapa[col.slug] = [] })

      leads.forEach(lead => {
        const slug = lead.status_comercial?.slug || lead.status || 'novo'
        const key = mapa[slug] !== undefined ? slug : 'novo'
        if (mapa[key] !== undefined) {
          mapa[key].push(lead)
        } else {
          mapa['novo'] = mapa['novo'] || []
          mapa['novo'].push(lead)
        }
      })

      return mapa
    },
    enabled: !!tenantId && colunas.length > 0,
  })
}

// Mutacao: mover lead para outra coluna
export function useMoverLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId, novoStatusSlug, novoStatusId }) => {
      const update = novoStatusId
        ? { id_status: novoStatusId, status: novoStatusSlug }
        : { status: novoStatusSlug, id_status: null }

      const { data, error } = await supabase
        .from('leads')
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['metrics'] })
    },
  })
}