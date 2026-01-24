import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('score,categoria')

      if (error) throw error

      const rows = data ?? []
      return {
        total: rows.length,
        hot: rows.filter((l) => (l.categoria || '').toLowerCase() === 'hot').length,
        warm: rows.filter((l) => (l.categoria || '').toLowerCase() === 'warm').length,
        cold: rows.filter((l) => (l.categoria || '').toLowerCase() === 'cold' || !l.categoria).length,
      }
    },
  })
}
