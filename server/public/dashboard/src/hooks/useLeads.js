import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useLeads(tenantId) {
  return useQuery({
    queryKey: ['leads', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`*, marca:marcas (*)`)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenantId,
  })
}

export function useMetrics(tenantId) {
  return useQuery({
    queryKey: ['metrics', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('score, categoria, status')
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