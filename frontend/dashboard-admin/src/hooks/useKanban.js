// ============================================================
// useKanban.js — Kanban de alta performance
// LeadCapture Pro — Zafalão Tech
//
// FONTE ÚNICA DE VERDADE: status_comercial (banco)
// Kanban + Modal listbox sempre refletem o mesmo dado
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useEffect } from 'react'

// Fallback usado APENAS quando banco não retorna status_comercial
export const COLUNAS_PADRAO = [
  { id: 'novo',       label: 'Novo Lead',      slug: 'novo',       cor: '#ee7b4d' },
  { id: 'contato',    label: 'Em Contato',     slug: 'contato',    cor: '#F59E0B' },
  { id: 'agendado',   label: 'Agendado',       slug: 'agendado',   cor: '#3B82F6' },
  { id: 'negociacao', label: 'Em Negociação',  slug: 'negociacao', cor: '#8B5CF6' },
  { id: 'convertido', label: 'Vendido',        slug: 'convertido', cor: '#10B981' },
  { id: 'perdido',    label: 'Perdido',        slug: 'perdido',    cor: '#EF4444' },
]

// ── Status Colunas ────────────────────────────────────────────
export function useStatusColunas(tenantId) {
  return useQuery({
    queryKey: ['status-colunas', tenantId],
    staleTime: 1000 * 60 * 10,
    gcTime:    1000 * 60 * 30,
    queryFn: async () => {
      if (!tenantId) return COLUNAS_PADRAO

      // Sem "ordem" no SELECT — coluna não existe no schema atual
      const { data, error } = await supabase
        .from('status_comercial')
        .select('id, label, slug, cor')
        .eq('tenant_id', tenantId)

      if (error || !data?.length) return COLUNAS_PADRAO

      return data.map(s => ({
        id:    s.id,
        label: s.label,
        slug:  s.slug?.toLowerCase().trim(),
        cor:   s.cor || '#6366F1',
      }))
    },
  })
}

// ── Kanban Leads ─────────────────────────────────────────────
export function useKanbanLeads({ tenantId, colunas = [] }) {
  const qc = useQueryClient()

  // Realtime — invalida cache ao receber qualquer mudança em leads
  useEffect(() => {
    if (!colunas.length) return
    const channel = supabase
      .channel(`kanban-${tenantId ?? 'all'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        ...(tenantId ? { filter: `tenant_id=eq.${tenantId}` } : {}),
      }, () => {
        qc.invalidateQueries({ queryKey: ['kanban', tenantId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenantId, colunas.length, qc])

  return useQuery({
    queryKey: ['kanban', tenantId],
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
    enabled:   colunas.length > 0,
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          id, nome, score, categoria, tenant_id, status,
          capital_disponivel, regiao_interesse, fonte, created_at,
          id_marca, id_status, id_operador_responsavel,
          marca:id_marca (id, nome, emoji),
          status_comercial:id_status (id, label, slug, cor),
          operador:id_operador_responsavel (id, nome)
        `)
        .is('deleted_at', null)
        .order('score', { ascending: false })
        .limit(200)

      if (tenantId) query = query.eq('tenant_id', tenantId)

      const { data, error } = await query
      if (error) throw error

      const leads = data ?? []

      // Lookups O(1)
      const idParaSlug   = new Map(colunas.map(c => [c.id,   c.slug]))
      const slugsValidos = new Set(colunas.map(c => c.slug))
      const primeiraCol  = colunas[0]?.slug ?? 'novo'

      // Inicializa mapa de colunas
      const mapa = Object.fromEntries(colunas.map(c => [c.slug, []]))

      for (const lead of leads) {
        let slugFinal = primeiraCol

        // 1. Prioridade máxima: id_status → lookup por UUID
        if (lead.id_status) {
          const slugPorId = idParaSlug.get(lead.id_status)
          if (slugPorId && slugsValidos.has(slugPorId)) {
            slugFinal = slugPorId
            mapa[slugFinal].push(lead)
            continue
          }
        }

        // 2. Fallback: slug do join status_comercial
        const slugJoin = lead.status_comercial?.slug?.toLowerCase().trim()
        if (slugJoin && slugsValidos.has(slugJoin)) {
          slugFinal = slugJoin
          mapa[slugFinal].push(lead)
          continue
        }

        // 3. Fallback final: campo status (texto legado)
        const slugTexto = lead.status?.toLowerCase().trim()
        if (slugTexto && slugsValidos.has(slugTexto)) {
          slugFinal = slugTexto
        }

        // Segurança: garante que a coluna existe
        if (!(slugFinal in mapa)) slugFinal = primeiraCol
        mapa[slugFinal].push(lead)
      }

      return mapa
    },
  })
}

// ── Mover Lead ───────────────────────────────────────────────
// Optimistic update: card move INSTANTANEAMENTE, rollback em erro
export function useMoverLead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ leadId, novoStatusSlug, novoStatusId }) => {
      // Sempre atualiza os dois campos para manter consistência
      const { data, error } = await supabase
        .from('leads')
        .update({
          id_status:  novoStatusId || null,
          status:     novoStatusSlug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select('id, id_status, status')
        .single()

      if (error) throw error
      return data
    },

    // Card move imediatamente na UI
    onMutate: async ({ leadId, novoStatusSlug, novoStatusId, tenantId }) => {
      const queryKey = ['kanban', tenantId]
      await qc.cancelQueries({ queryKey })
      const snapshot = qc.getQueryData(queryKey)

      qc.setQueryData(queryKey, (mapaAtual) => {
        if (!mapaAtual) return mapaAtual
        const novoMapa = {}
        let leadMovido = null

        for (const [slug, leads] of Object.entries(mapaAtual)) {
          novoMapa[slug] = leads.filter(l => {
            if (l.id === leadId) { leadMovido = l; return false }
            return true
          })
        }

        if (leadMovido && novoMapa[novoStatusSlug] !== undefined) {
          novoMapa[novoStatusSlug] = [
            { ...leadMovido, id_status: novoStatusId, status: novoStatusSlug },
            ...novoMapa[novoStatusSlug],
          ]
        }
        return novoMapa
      })

      return { snapshot, queryKey }
    },

    // Rollback em caso de erro de rede/servidor
    onError: (_err, _vars, context) => {
      if (context?.snapshot) qc.setQueryData(context.queryKey, context.snapshot)
    },

    onSettled: (_data, _err, { tenantId }) => {
      qc.invalidateQueries({ queryKey: ['kanban', tenantId] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['metrics'] })
    },
  })
}