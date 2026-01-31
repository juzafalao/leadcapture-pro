import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Buscar todas as marcas ativas
export function useMarcas() {
  return useQuery({
    queryKey: ['marcas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcas')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

// Buscar uma marca específica
export function useMarca(id) {
  return useQuery({
    queryKey: ['marca', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marcas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id
  })
}

// Criar nova marca
export function useCreateMarca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (novaMarca) => {
      // Buscar tenant_id (primeiro tenant disponível)
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)
      
      const tenantId = tenants?.[0]?.id
      if (!tenantId) throw new Error('Tenant não encontrado')

      // Buscar próxima ordem
      const { data: lastMarca } = await supabase
        .from('marcas')
        .select('ordem')
        .eq('tenant_id', tenantId)
        .order('ordem', { ascending: false })
        .limit(1)
        .single()

      const novaOrdem = (lastMarca?.ordem || 0) + 1

      const { data, error } = await supabase
        .from('marcas')
        .insert({
          tenant_id: tenantId,
          nome: novaMarca.nome?.trim(),
          emoji: novaMarca.emoji || '🏢',
          cor: novaMarca.cor || '#60a5fa',
          investimento_minimo: novaMarca.investimento_minimo || 0,
          investimento_maximo: novaMarca.investimento_maximo || 0,
          descricao: novaMarca.descricao || null,
          ativo: true,
          ordem: novaOrdem
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe uma marca com este nome')
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
    }
  })
}

// Atualizar marca existente
export function useUpdateMarca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...dadosMarca }) => {
      const { data, error } = await supabase
        .from('marcas')
        .update({
          nome: dadosMarca.nome?.trim(),
          emoji: dadosMarca.emoji || '🏢',
          cor: dadosMarca.cor || '#60a5fa',
          investimento_minimo: dadosMarca.investimento_minimo || 0,
          investimento_maximo: dadosMarca.investimento_maximo || 0,
          descricao: dadosMarca.descricao || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe uma marca com este nome')
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
    }
  })
}

// Hook combinado para facilitar uso
export function useMarcasActions() {
  const createMarca = useCreateMarca()
  const updateMarca = useUpdateMarca()

  return {
    criar: createMarca.mutateAsync,
    atualizar: updateMarca.mutateAsync,
    isCreating: createMarca.isPending,
    isUpdating: updateMarca.isPending,
    isLoading: createMarca.isPending || updateMarca.isPending,
    createError: createMarca.error,
    updateError: updateMarca.error
  }
}
