// ============================================================
// useAnalytics.js — Analytics + Realtime (OTIMIZADO)
// LeadCapture Pro — Zafalão Tech
//
// MUDANÇAS v3 (2.5.3):
// 1. REMOVIDO refetchInterval (realtime já invalida)
// 2. ADICIONADO staleTime: 5min (dados analytics não precisam ser instantâneos)
// 3. Realtime agora invalida metrics também (evita dashboard desatualizado)
// 4. Realtime NÃO invalida leads genérico (evita refetch de todas as páginas)
// ============================================================

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useEffect } from 'react'

export function useAnalytics(tenantId, periodo = '30') {
  return useQuery({
    queryKey: ['analytics', tenantId, periodo],
    enabled: !!tenantId || tenantId === null,
    staleTime: 1000 * 60 * 5,     // ✅ 5min — antes era 0 (refetch toda vez)
    // ❌ REMOVIDO: refetchInterval: 60000 — o realtime já cuida disso
    queryFn: async () => {
      const hoje = new Date()
      const inicio = new Date()
      inicio.setDate(hoje.getDate() - parseInt(periodo))

      let query = supabase
        .from('leads')
        .select(`
          id, nome, categoria, status, capital_disponivel, created_at, fonte,
          marca:id_marca (id, nome, emoji),
          status_comercial:id_status (id, label, slug),
          motivo_desistencia:id_motivo_desistencia (id, nome)
        `)
        .is('deleted_at', null)
        .gte('created_at', inicio.toISOString())
        .order('created_at', { ascending: false })

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      const { data: leads, error } = await query
      if (error) throw error
      const rows = leads || []

      const vendidos  = rows.filter(l => ['vendido','convertido'].includes(l.status_comercial?.slug?.toLowerCase()))
      const perdidos  = rows.filter(l => l.status_comercial?.slug?.toLowerCase() === 'perdido')
      const pipeline  = rows.filter(l => ['negociacao','negociação','proposta','em_negociacao'].includes(l.status_comercial?.slug?.toLowerCase()))
      const total     = rows.length

      const soma = arr => arr.reduce((a, l) => a + (parseFloat(l.capital_disponivel) || 0), 0)
      const capitalFechado  = soma(vendidos)
      const capitalPerdido  = soma(perdidos)
      const capitalPipeline = soma(pipeline)

      const txConversao   = total > 0 ? ((vendidos.length / total) * 100).toFixed(1) : '0.0'
      const txDesistencia = total > 0 ? ((perdidos.length / total) * 100).toFixed(1) : '0.0'

      const cicloMedio = vendidos.length > 0
        ? (vendidos.reduce((a, l) => {
            return a + Math.ceil(Math.abs(new Date() - new Date(l.created_at)) / 86400000)
          }, 0) / vendidos.length).toFixed(1)
        : '0'

      const dias = Math.min(parseInt(periodo), 30)
      const evolucao = Array.from({ length: dias }, (_, i) => {
        const d = new Date(hoje)
        d.setDate(hoje.getDate() - (dias - 1 - i))
        const str = d.toISOString().split('T')[0]
        const leadsNoDia     = rows.filter(l => l.created_at?.startsWith(str)).length
        const vendidosNoDia  = vendidos.filter(l => l.created_at?.startsWith(str)).length
        const acumulado      = rows.filter(l => l.created_at <= d.toISOString()).length
        return { dia: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), leads: leadsNoDia, vendidos: vendidosNoDia, acumulado }
      })

      const mediadiaria = dias > 0 ? total / dias : 0
      const diasNoMes   = 30
      const forecast    = Math.round(mediadiaria * diasNoMes)
      const txConv     = total > 0 ? vendidos.length / total : 0
      const capitalMed = total > 0 ? soma(rows) / total : 0
      const previsaoIA = Math.round(forecast * txConv * capitalMed)

      const marcasMap = {}
      rows.forEach(l => { const n = l.marca?.nome || 'Sem Marca'; marcasMap[n] = (marcasMap[n] || 0) + 1 })
      const porMarca = Object.entries(marcasMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

      const motivosMap = {}
      perdidos.forEach(l => { const m = l.motivo_desistencia?.nome || 'Não informado'; motivosMap[m] = (motivosMap[m] || 0) + 1 })
      const motivosPerda = Object.entries(motivosMap).map(([motivo, valor]) => ({ motivo: motivo.length > 22 ? motivo.slice(0, 22) + '…' : motivo, valor })).sort((a, b) => b.valor - a.valor)

      const ultimosLeads = rows.slice(0, 20)
      const pace90 = mediadiaria * 90

      return {
        total, vendidos: vendidos.length, perdidos: perdidos.length, pipeline: pipeline.length,
        capitalFechado, capitalPerdido, capitalPipeline,
        txConversao, txDesistencia, cicloMedio,
        forecast, previsaoIA, pace90,
        evolucao, porMarca, motivosPerda, ultimosLeads,
        mediadiaria: mediadiaria.toFixed(1),
      }
    }
  })
}

export function useRealtimeLeads(tenantId, onNew) {
  const qc = useQueryClient()
  useEffect(() => {
    if (!tenantId && tenantId !== null) return
    const channelConfig = {
      event: 'INSERT',
      schema: 'public',
      table: 'leads',
    }
    if (tenantId) channelConfig.filter = `tenant_id=eq.${tenantId}`

    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', channelConfig, (payload) => {
        onNew?.(payload.new)
        // ✅ 2.5.3: Invalidar analytics + metrics (ambos dependem de leads)
        qc.invalidateQueries({ queryKey: ['analytics'] })
        qc.invalidateQueries({ queryKey: ['metrics'] })
        // ✅ 2.5.3: Invalidar leads com exact: false para pegar todas as paginações
        qc.invalidateQueries({ queryKey: ['leads'] })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tenantId])
}