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
          marca:marcas (*),
          operador:id_operador_responsavel (
            id,
            nome,
            role
          )
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)

      // Filtro de Busca (Nome, Email, Telefone, Cidade)
      if (filters.search) {
        const s = filters.search.toLowerCase()
        query = query.or(`nome.ilike.%${s}%,email.ilike.%${s}%,telefone.ilike.%${s}%,cidade.ilike.%${s}%`)
      }

      // Filtro de Categoria/Status (Hot, Warm, Cold)
      if (filters.status && filters.status !== 'All') {
        query = query.ilike('categoria', filters.status)
      }

      // Filtro Meus Leads
      if (filters.meusLeads && filters.userId) {
        query = query.eq('id_operador_responsavel', filters.userId)
      }

      // Ordenação e Paginação
      const from = (page - 1) * perPage
      const to = from + perPage - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      return {
        data: data ?? [],
        count: count ?? 0
      }
    },
    enabled: !!tenantId,
    placeholderData: keepPreviousData
  })
}

export function useMetrics(tenantId) {
  return useQuery({
    queryKey: ['metrics', tenantId],
    queryFn: async () => {
      // Traz apenas a categoria para contagem, evitando payload desnecessário
      const { data, error } = await supabase
        .from('leads')
        .select('categoria')
        .eq('tenant_id', tenantId)

      if (error) throw error
      const rows = data ?? []

      return {
        total: rows.length,
        hot: rows.filter(l => (l.categoria || '').toLowerCase() === 'hot').length,
        warm: rows.filter(l => (l.categoria || '').toLowerCase() === 'warm').length,
        cold: rows.filter(l => (l.categoria || '').toLowerCase() === 'cold' || !l.categoria).length
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
        .select('*, marca:marcas(*)')
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
