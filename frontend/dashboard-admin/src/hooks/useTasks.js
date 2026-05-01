// ============================================================
// useTasks.js — React Query hooks para o módulo de Tarefas
// LeadCapture Pro · Zafalão Tech
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const API = '/api/tasks'

function getToken() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.includes('supabase') && key?.includes('auth-token')) {
        const val = JSON.parse(localStorage.getItem(key) || '{}')
        return val?.access_token || val?.session?.access_token || null
      }
    }
  } catch { return null }
  return null
}

function authHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ─── Leitura: Supabase direto (respeita RLS) ─────────────────

export function useTasks(leadId) {
  return useQuery({
    queryKey: ['tarefas', leadId],
    staleTime: 1000 * 30,
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*, usuario:usuario_id(id, nome, role)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

// ─── Escrita: via API (side-effects: lead_historico + webhooks) ─

export function useCreateTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ lead_id, titulo, descricao, prioridade, data_vencimento }) => {
      const res = await fetch(API, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ lead_id, titulo, descricao, prioridade, data_vencimento }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao criar tarefa')
      return json.tarefa
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tarefas', vars.lead_id] })
      qc.invalidateQueries({ queryKey: ['lead-historico', vars.lead_id] })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, lead_id, ...updates }) => {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao atualizar tarefa')
      return json.tarefa
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tarefas', vars.lead_id] })
      if (vars.status === 'concluida') {
        qc.invalidateQueries({ queryKey: ['lead-historico', vars.lead_id] })
      }
    },
  })
}

export function useRegistrarInteracao() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ lead_id, tipo_interacao, descricao }) => {
      const res = await fetch(`${API}/interacao`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ lead_id, tipo_interacao, descricao }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao registrar interação')
      return json.evento
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['lead-historico', vars.lead_id] })
    },
  })
}

// ─── Webhooks: hooks para a CRMPage ──────────────────────────

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhook-configs'],
    staleTime: 1000 * 60,
    queryFn: async () => {
      const res = await fetch('/api/webhooks', { headers: authHeaders() })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao buscar webhooks')
      return json.webhooks
    },
  })
}

export function useCreateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch('/api/webhooks', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao criar webhook')
      return json.webhook
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhook-configs'] }),
  })
}

export function useUpdateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao atualizar webhook')
      return json.webhook
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhook-configs'] }),
  })
}

export function useDeleteWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao excluir webhook')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhook-configs'] }),
  })
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/webhooks/test/${id}`, {
        method: 'POST', headers: authHeaders(),
      })
      const json = await res.json()
      return json
    },
  })
}
