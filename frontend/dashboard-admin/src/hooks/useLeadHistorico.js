// ============================================================
// useLeadHistorico.js — Timeline de eventos do lead
// LeadCapture Pro — Zafalao Tech
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const TIPO_CONFIG = {
  captura:      { cor: '#10B981', label: 'Entrada'     },
  atribuicao:   { cor: '#F59E0B', label: 'Atribuição'  },
  status_mudou: { cor: '#6366F1', label: 'Status'      },
  observacao:   { cor: '#3B82F6', label: 'Observação'  },
  manual:       { cor: '#8B5CF6', label: 'Manual'      },
  reaberto:     { cor: '#EC4899', label: 'Reaberto'    },
}

export function getTipoConfig(tipo) {
  return TIPO_CONFIG[tipo] || { cor: '#6B7280', label: tipo }
}

export function useLeadHistorico(leadId) {
  return useQuery({
    queryKey: ['lead-historico', leadId],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_historico')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    enabled: !!leadId,
  })
}

export function useRegistrarObservacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ leadId, tenantId, descricao }) => {
      const { data, error } = await supabase.rpc('registrar_observacao_lead', {
        p_lead_id:   leadId,
        p_tenant_id: tenantId,
        p_descricao: descricao,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['lead-historico', vars.leadId] })
    },
  })
}
