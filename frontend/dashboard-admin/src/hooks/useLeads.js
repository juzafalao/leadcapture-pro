import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useEffect } from 'react'

export function useLeads({ tenantId, page = 1, perPage = 20, filters = {} }) {
  const qc = useQueryClient()

  // Realtime — invalida cache quando chega lead novo
  useEffect(() => {
    if (!tenantId) return
    const channel = supabase
      .channel(`leads-realtime-${tenantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `tenant_id=eq.${tenantId}`
      }, () => {
        qc.invalidateQueries({ queryKey: ['leads'] })
        qc.invalidateQueries({ queryKey: ['metrics'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tenantId, qc])

  return useQuery({
    queryKey: ['leads', tenantId, page, perPage, filters],
    staleTime: tenantId ? 1000 * 60 * 5 : 1000 * 30,  // admin sem realtime: 30s; tenant normal: 5min
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          id, nome, email, telefone, cidade, estado,
          score, categoria, capital_disponivel, regiao_interesse,
          fonte, status, created_at, updated_at,
          id_marca, id_status, id_operador_responsavel, id_motivo_desistencia,
          tenant_id,
          marca:id_marca (id, nome, emoji),
          operador:id_operador_responsavel (id, nome, role),
          status_comercial:id_status (id, label, slug, cor),
          motivo_desistencia:id_motivo_desistencia (id, nome)
        `, { count: 'exact' })
        .is('deleted_at', null)

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      if (filters.search) {
        const s = filters.search
        query = query.or(`nome.ilike.%${s}%,email.ilike.%${s}%,telefone.ilike.%${s}%,cidade.ilike.%${s}%`)
      }

      if (filters.status && filters.status !== 'All') {
        const cat = filters.status.charAt(0).toUpperCase() + filters.status.slice(1).toLowerCase()
        query = query.ilike('categoria', cat)
      }

      if (filters.meusLeads && filters.userId) {
        query = query.eq('id_operador_responsavel', filters.userId)
      }

      const from = (page - 1) * perPage
      const to = from + perPage - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      return { data: data ?? [], count: count ?? 0 }
    },
    enabled: !!tenantId || tenantId === null,
    placeholderData: keepPreviousData,
  })
}

export function useMetrics(tenantId) {
  return useQuery({
    queryKey: ['metrics', tenantId],
    staleTime: 1000 * 60 * 3,
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('categoria')
        .is('deleted_at', null)

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      const { data, error } = await query
      if (error) throw error
      const rows = data ?? []

      return {
        total: rows.length,
        hot:  rows.filter(l => (l.categoria || '').toLowerCase() === 'hot').length,
        warm: rows.filter(l => (l.categoria || '').toLowerCase() === 'warm').length,
        cold: rows.filter(l => ['cold', ''].includes((l.categoria || '').toLowerCase())).length
      }
    },
    enabled: !!tenantId || tenantId === null,
    refetchInterval: 1000 * 120,
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ ...dados, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          marca:id_marca (id, nome, emoji),
          operador:id_operador_responsavel (id, nome, role),
          status_comercial:id_status (id, label, slug, cor),
          motivo_desistencia:id_motivo_desistencia (id, nome)
        `)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['metrics'] })
    }
  })
}