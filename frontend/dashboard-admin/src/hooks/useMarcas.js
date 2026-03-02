import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useMarcas(tenantId) {
  return useQuery({
    queryKey: ['marcas', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('marcas')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true })

      if (tenantId) query = query.eq('tenant_id', tenantId)

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenantId || tenantId === null
  })
}

export function useCreateMarca(tenantId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (novaMarca) => {
      const { data, error } = await supabase
        .from('marcas')
        .insert({ tenant_id: tenantId, ...novaMarca, ativo: true })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marcas', tenantId] })
  })
}
