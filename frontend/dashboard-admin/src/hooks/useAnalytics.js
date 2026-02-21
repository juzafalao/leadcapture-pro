import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useEffect } from 'react'

export function useAnalytics(tenantId, periodo = '30') {
  return useQuery({
    queryKey: ['analytics', tenantId, periodo],
    enabled: !!tenantId,
    refetchInterval: 60000,
    queryFn: async () => {
      const hoje = new Date()
      const inicio = new Date()
      inicio.setDate(hoje.getDate() - parseInt(periodo))

      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          id, nome, categoria, status, capital_disponivel, created_at, fonte,
          marca:id_marca (id, nome, emoji),
          status_comercial:id_status (id, label, slug),
          motivo_desistencia:id_motivo_desistencia (id, nome)
        `)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .gte('created_at', inicio.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      const rows = leads || []

      // ── Status slugs
      const vendidos  = rows.filter(l => ['vendido','convertido'].includes(l.status_comercial?.slug?.toLowerCase()))
      const perdidos  = rows.filter(l => l.status_comercial?.slug?.toLowerCase() === 'perdido')
      const pipeline  = rows.filter(l => ['negociacao','negociação','proposta','em_negociacao'].includes(l.status_comercial?.slug?.toLowerCase()))
      const total     = rows.length

      // ── Capitais
      const soma = arr => arr.reduce((a, l) => a + (parseFloat(l.capital_disponivel) || 0), 0)
      const capitalFechado  = soma(vendidos)
      const capitalPerdido  = soma(perdidos)
      const capitalPipeline = soma(pipeline)

      // ── Taxas
      const txConversao   = total > 0 ? ((vendidos.length / total) * 100).toFixed(1) : '0.0'
      const txDesistencia = total > 0 ? ((perdidos.length / total) * 100).toFixed(1) : '0.0'

      // ── Ciclo médio (dias)
      const cicloMedio = vendidos.length > 0
        ? (vendidos.reduce((a, l) => {
            return a + Math.ceil(Math.abs(new Date() - new Date(l.created_at)) / 86400000)
          }, 0) / vendidos.length).toFixed(1)
        : '0'

      // ── Gráfico linha: leads por dia (últimos N dias, max 30)
      const dias = Math.min(parseInt(periodo), 30)
      const evolucao = Array.from({ length: dias }, (_, i) => {
        const d = new Date(hoje)
        d.setDate(hoje.getDate() - (dias - 1 - i))
        const str = d.toISOString().split('T')[0]
        const leadsNoDia     = rows.filter(l => l.created_at?.startsWith(str)).length
        const vendidosNoDia  = vendidos.filter(l => l.created_at?.startsWith(str)).length
        const acumulado      = rows.filter(l => l.created_at <= d.toISOString()).length
        return {
          dia:      d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          leads:    leadsNoDia,
          vendidos: vendidosNoDia,
          acumulado,
        }
      })

      // ── Forecast linear simples
      const mediadiaria = dias > 0 ? total / dias : 0
      const diasNoMes   = 30
      const forecast    = Math.round(mediadiaria * diasNoMes)

      // ── Previsão IA (capital)
      const txConv     = total > 0 ? vendidos.length / total : 0
      const capitalMed = total > 0 ? soma(rows) / total : 0
      const previsaoIA = Math.round(forecast * txConv * capitalMed)

      // ── Leads por marca (pie)
      const marcasMap = {}
      rows.forEach(l => {
        const n = l.marca?.nome || 'Sem Marca'
        marcasMap[n] = (marcasMap[n] || 0) + 1
      })
      const porMarca = Object.entries(marcasMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      // ── Motivos de perda
      const motivosMap = {}
      perdidos.forEach(l => {
        const m = l.motivo_desistencia?.nome || 'Não informado'
        motivosMap[m] = (motivosMap[m] || 0) + 1
      })
      const motivosPerda = Object.entries(motivosMap)
        .map(([motivo, valor]) => ({ motivo: motivo.length > 22 ? motivo.slice(0, 22) + '…' : motivo, valor }))
        .sort((a, b) => b.valor - a.valor)

      // ── Últimos leads (feed ao vivo)
      const ultimosLeads = rows.slice(0, 20)

      // ── Pace 90D simples
      const pace90 = mediadiaria * 90

      return {
        total, vendidos: vendidos.length, perdidos: perdidos.length,
        pipeline: pipeline.length,
        capitalFechado, capitalPerdido, capitalPipeline,
        txConversao, txDesistencia, cicloMedio,
        forecast, previsaoIA, pace90,
        evolucao, porMarca, motivosPerda,
        ultimosLeads,
        mediadiaria: mediadiaria.toFixed(1),
      }
    }
  })
}

// ── Realtime hook para feed ao vivo
export function useRealtimeLeads(tenantId, onNew) {
  const qc = useQueryClient()
  useEffect(() => {
    if (!tenantId) return
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => {
        onNew?.(payload.new)
        qc.invalidateQueries({ queryKey: ['analytics', tenantId] })
        qc.invalidateQueries({ queryKey: ['leads'] })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tenantId])
}
