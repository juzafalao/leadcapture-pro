// hooks/useVendas.js — Gestão de vendas por lead
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function api(method, path, body) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(`/api/vendas${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erro na requisição')
  return json
}

// Busca venda vinculada a um lead
export function useVendaDoLead(leadId) {
  return useQuery({
    queryKey: ['venda-lead', leadId],
    queryFn: () => api('GET', `/por-lead/${leadId}`).then(r => r.venda),
    enabled: !!leadId,
    staleTime: 1000 * 30,
  })
}

// Resumo mensal de receita
export function useResumoVendas({ ano, mes } = {}) {
  const now = new Date()
  const a = ano  || now.getFullYear()
  const m = mes  || now.getMonth() + 1
  return useQuery({
    queryKey: ['vendas-resumo', a, m],
    queryFn: () => api('GET', `/resumo?ano=${a}&mes=${m}`).then(r => r.resumo),
    staleTime: 1000 * 60 * 2,
  })
}

// Lista vendas com filtros
export function useVendas({ ano, mes, consultor_id, marca_id } = {}) {
  const params = new URLSearchParams()
  if (ano)          params.set('ano', ano)
  if (mes)          params.set('mes', mes)
  if (consultor_id) params.set('consultor_id', consultor_id)
  if (marca_id)     params.set('marca_id', marca_id)
  const qs = params.toString()
  return useQuery({
    queryKey: ['vendas', ano, mes, consultor_id, marca_id],
    queryFn: () => api('GET', qs ? `?${qs}` : '').then(r => r.vendas),
    staleTime: 1000 * 60 * 2,
  })
}

// Registra nova venda
export function useRegistrarVenda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => api('POST', '/', payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['venda-lead', variables.lead_id] })
      qc.invalidateQueries({ queryKey: ['vendas-resumo'] })
      qc.invalidateQueries({ queryKey: ['vendas'] })
    },
  })
}

// Atualiza venda
export function useAtualizarVenda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => api('PUT', `/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['venda-lead'] })
      qc.invalidateQueries({ queryKey: ['vendas-resumo'] })
      qc.invalidateQueries({ queryKey: ['vendas'] })
    },
  })
}
