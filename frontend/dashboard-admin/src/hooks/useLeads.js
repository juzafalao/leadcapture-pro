import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useLeads({ tenantId, page = 1, perPage = 20, filters = {} }) {
  return useQuery({
    queryKey: ['leads', tenantId, page, perPage, filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          marca:id_marca (id, nome, emoji),
          operador:id_operador_responsavel (id, nome, role),
          status_comercial:id_status (id, label, slug, cor),
          motivo_desistencia:id_motivo_desistencia (id, nome)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)

      if (filters.search) {
        const s = filters.search
        query = query.or(`nome.ilike.%${s}%,email.ilike.%${s}%,telefone.ilike.%${s}%,cidade.ilike.%${s}%`)
      }

      if (filters.status && filters.status !== 'All') {
        // Normaliza para o mesmo case do banco
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
    enabled: !!tenantId,
    placeholderData: keepPreviousData
  })
}

export function useMetrics(tenantId) {
  return useQuery({
    queryKey: ['metrics', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('categoria')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)

      if (error) throw error
      const rows = data ?? []

      return {
        total: rows.length,
        hot:  rows.filter(l => (l.categoria || '').toLowerCase() === 'hot').length,
        warm: rows.filter(l => (l.categoria || '').toLowerCase() === 'warm').length,
        cold: rows.filter(l => ['cold', ''].includes((l.categoria || '').toLowerCase())).length
      }
    },
    enabled: !!tenantId,
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
