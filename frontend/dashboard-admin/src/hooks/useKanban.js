// ============================================================
// useKanban.js — Kanban de alta performance
// LeadCapture Pro — Zafalão Tech
//
// ARQUITETURA:
// ┌─────────────────────────────────────────────────────────┐
// │  FONTE ÚNICA DE VERDADE: status_comercial.id (UUID)    │
// │  leads.id_status ──► status_comercial (FK real)        │
// │  leads.status    ──► sincronizado automaticamente      │
// └─────────────────────────────────────────────────────────┘
//
// FEATURES:
// ✅ Optimistic Updates — card move imediatamente, rollback em erro
// ✅ Realtime Supabase  — todos os usuários veem mudanças ao vivo
// ✅ Cache inteligente  — staleTime + gcTime calibrados
// ✅ Single source of truth — apenas id_status define a coluna
// ✅ Batch invalidation — invalida queries relacionadas em paralelo
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useEffect } from 'react'

// Colunas fallback — usadas APENAS quando tenant não tem status_comercial no banco
// Slugs espelham exatamente o que existe na tabela status_comercial
export const COLUNAS_PADRAO = [
  { id: 'novo',       label: 'Novo Lead',      slug: 'novo',       cor: '#ee7b4d' },
  { id: 'contato',    label: 'Em Contato',     slug: 'contato',    cor: '#F59E0B' },
  { id: 'agendado',   label: 'Agendado',       slug: 'agendado',   cor: '#3B82F6' },
  { id: 'negociacao', label: 'Em Negociação',  slug: 'negociacao', cor: '#8B5CF6' },
  { id: 'convertido', label: 'Vendido',        slug: 'convertido', cor: '#10B981' },
  { id: 'perdido',    label: 'Perdido',        slug: 'perdido',    cor: '#EF4444' },
]

// ── Status Colunas ────────────────────────────────────────────
// Busca os status_comercial do tenant e os transforma em colunas
// Cache longo (10min) — status raramente mudam
export function useStatusColunas(tenantId) {
  return useQuery({
    queryKey: ['status-colunas', tenantId],
    staleTime:  1000 * 60 * 10, // 10 min
    gcTime:     1000 * 60 * 30, // 30 min no garbage collector
    queryFn: async () => {
      if (!tenantId) return COLUNAS_PADRAO

      const { data, error } = await supabase
        .from('status_comercial')
        .select('id, label, slug, cor, ordem')
        .eq('tenant_id', tenantId)
        .order('ordem', { ascending: true })

      if (error || !data?.length) return COLUNAS_PADRAO

      return data.map(s => ({
        id:    s.id,            // UUID real do banco
        label: s.label,
        slug:  s.slug?.toLowerCase().trim(),
        cor:   s.cor || '#6366F1',
      }))
    },
  })
}

// ── Kanban Leads ─────────────────────────────────────────────
// Busca leads e agrupa por coluna usando SOMENTE id_status como fonte de verdade
// Realtime Supabase mantém todos os clientes sincronizados
export function useKanbanLeads({ tenantId, colunas = [] }) {
  const qc = useQueryClient()

  // ✅ REALTIME — Supabase broadcast qualquer mudança em leads
  useEffect(() => {
    if (!colunas.length) return

    const channel = supabase
      .channel(`kanban-leads-${tenantId ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          ...(tenantId ? { filter: `tenant_id=eq.${tenantId}` } : {}),
        },
        () => {
          // Invalida cache — React Query refaz a query automaticamente
          qc.invalidateQueries({ queryKey: ['kanban', tenantId] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId, colunas.length, qc])

  return useQuery({
    queryKey: ['kanban', tenantId],
    staleTime: 1000 * 60 * 5, // 5 min — realtime cobre atualizações
    gcTime:    1000 * 60 * 10,
    enabled:   colunas.length > 0,
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          id, nome, score, categoria, tenant_id,
          capital_disponivel, regiao_interesse, fonte, created_at,
          id_marca, id_status,
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

      // ── Agrupamento por coluna ────────────────────────────
      // Lookup O(1) via Map — mais rápido que find() em array
      const slugParaColuna = new Map(colunas.map(c => [c.slug, c.slug]))
      const idParaSlug     = new Map(colunas.map(c => [c.id, c.slug]))
      const primeiraColuna = colunas[0]?.slug ?? 'novo'

      // Inicializa mapa com arrays vazios
      const mapa = Object.fromEntries(colunas.map(c => [c.slug, []]))

      for (const lead of leads) {
        // ✅ FONTE ÚNICA: id_status tem prioridade absoluta
        let slugFinal = primeiraColuna

        if (lead.id_status) {
          // 1. Tenta resolver pelo UUID do id_status — mais confiável
          const slugPorId = idParaSlug.get(lead.id_status)
          if (slugPorId) {
            slugFinal = slugPorId
          } else {
            // 2. Fallback: slug do join status_comercial
            const slugJoin = lead.status_comercial?.slug?.toLowerCase().trim()
            if (slugJoin && slugParaColuna.has(slugJoin)) {
              slugFinal = slugJoin
            }
          }
        }

        // Garante que a coluna existe no mapa (segurança)
        if (!(slugFinal in mapa)) slugFinal = primeiraColuna
        mapa[slugFinal].push(lead)
      }

      return mapa
    },
  })
}

// ── Mover Lead ───────────────────────────────────────────────
// Optimistic update: card move IMEDIATAMENTE na UI
// Se falhar, rollback automático com estado anterior
export function useMoverLead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ leadId, novoStatusSlug, novoStatusId, tenantId }) => {
      // Sempre atualiza os DOIS campos para manter consistência total
      const { data, error } = await supabase
        .from('leads')
        .update({
          id_status:  novoStatusId  || null,
          status:     novoStatusSlug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select('id, id_status, status')
        .single()

      if (error) throw error
      return data
    },

    // ✅ OPTIMISTIC UPDATE — move card antes da resposta do servidor
    onMutate: async ({ leadId, novoStatusSlug, novoStatusId, tenantId }) => {
      const queryKey = ['kanban', tenantId]

      // Cancela qualquer refetch em andamento para evitar conflito
      await qc.cancelQueries({ queryKey })

      // Snapshot do estado atual (para rollback)
      const snapshot = qc.getQueryData(queryKey)

      // Atualiza cache otimisticamente
      qc.setQueryData(queryKey, (mapaAtual) => {
        if (!mapaAtual) return mapaAtual

        const novoMapa = {}
        for (const [slug, leads] of Object.entries(mapaAtual)) {
          novoMapa[slug] = leads.filter(l => l.id !== leadId)
        }

        // Encontra o lead no snapshot e o move para a nova coluna
        const leadMovido = Object.values(mapaAtual)
          .flat()
          .find(l => l.id === leadId)

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

    // ✅ ROLLBACK em caso de erro
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        qc.setQueryData(context.queryKey, context.snapshot)
      }
    },

    // ✅ Invalida queries relacionadas após sucesso
    onSettled: (_data, _err, { tenantId }) => {
      qc.invalidateQueries({ queryKey: ['kanban', tenantId] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['metrics'] })
    },
  })
}