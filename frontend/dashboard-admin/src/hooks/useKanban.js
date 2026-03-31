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
      // Se não tem tenant (platform admin vendo tudo), usa colunas padrão
      if (!tenantId) return COLUNAS_PADRAO

      const { data, error } = await supabase
        .from('status_comercial')
        .select('id, label, slug, cor, ordem')
        .eq('tenant_id', tenantId)
        .order('ordem', { ascending: true })

      if (error || !data?.length) return COLUNAS_PADRAO
      return data.map(s => ({
        id:    s.id,
        label: s.label,
        slug:  s.slug?.toLowerCase(),
        cor:   s.cor || '#6366F1',
      }))
    },
    enabled: true, // sempre executa — tenantId null usa padrão
  })
}

// Busca leads agrupados por coluna para o Kanban
export function useKanbanLeads({ tenantId, colunas = [] }) {
  const qc = useQueryClient()

  // Realtime — invalida ao receber novo lead
  return useQuery({
    queryKey: ['kanban', tenantId],
    staleTime: 1000 * 60 * 2,   // 2 min de cache — evita refetch desnecessario
    refetchInterval: 1000 * 90, // refetch a cada 90s apenas
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          id, nome, score, categoria,
          capital_disponivel, regiao_interesse, fonte, created_at, status,
          id_marca, id_status, id_operador_responsavel,
          marca:id_marca (id, nome, emoji),
          status_comercial:id_status (id, label, slug, cor),
          operador:id_operador_responsavel (id, nome)
        `)
        .is('deleted_at', null)
        .order('score', { ascending: false })
        .limit(100)                             // limite para performance

      // Filtra por tenant apenas se não for platform admin
      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      const { data, error } = await query

      if (error) throw error
      const leads = data ?? []

      // Agrupa por coluna — prioriza status_comercial.slug, depois lead.status, depois 'novo'
      const mapa = {}
      colunas.forEach(col => { mapa[col.slug] = [] })

      // Conjunto de slugs válidos para lookup rápido
      const slugsValidos = new Set(colunas.map(c => c.slug))

      leads.forEach(lead => {
        // 1. Tenta o slug do status_comercial (join)
        const slugStatus = lead.status_comercial?.slug?.toLowerCase()
        // 2. Fallback para lead.status
        const slugLead = lead.status?.toLowerCase()

        let coluna = 'novo'
        if (slugStatus && slugsValidos.has(slugStatus)) {
          coluna = slugStatus
        } else if (slugLead && slugsValidos.has(slugLead)) {
          coluna = slugLead
        }
        // Se nenhum bate com as colunas, vai para 'novo'
        if (!mapa[coluna]) coluna = colunas[0]?.slug || 'novo'
        mapa[coluna].push(lead)
      })

      return mapa
    },
    enabled: colunas.length > 0,
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
