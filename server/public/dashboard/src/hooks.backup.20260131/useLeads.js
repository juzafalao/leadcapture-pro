import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Buscar todos os leads COM dados da marca
export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          marca:marcas (
            id,
            nome,
            emoji,
            cor,
            investimento_minimo,
            investimento_maximo
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

// Buscar métricas do dashboard
export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('score, categoria, status')

      if (error) throw error
      const rows = data ?? []
      
      const total = rows.length
      const hot = rows.filter((l) => (l.categoria || '').toLowerCase() === 'hot').length
      const warm = rows.filter((l) => (l.categoria || '').toLowerCase() === 'warm').length
      const cold = rows.filter((l) => (l.categoria || '').toLowerCase() === 'cold' || !l.categoria).length
      const convertidos = rows.filter((l) => l.status === 'convertido').length
      const taxaConversao = total > 0 ? ((convertidos / total) * 100).toFixed(1) : 0

      return { total, hot, warm, cold, convertidos, taxaConversao }
    },
  })
}

// Atualizar lead (status, observação, etc)
export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...dados }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...dados,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          marca:marcas (
            id,
            nome,
            emoji,
            cor
          )
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    }
  })
}

// Criar novo lead
export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (novoLead) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(novoLead)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    }
  })
}
