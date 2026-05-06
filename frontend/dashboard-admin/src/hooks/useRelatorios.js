// ============================================================
// useRelatorios.js — Relatórios + Filtros (OTIMIZADO)
// LeadCapture Pro — Zafalão Tech
//
// MUDANÇAS v3 (2.5.3):
// 1. useRelatorios: staleTime 5min (relatório pesado, não precisa ser instantâneo)
// 2. useFiltrosRelatorio: staleTime 10min (filtros mudam muito raramente)
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useRelatorios(tenantId, filtros = {}) {
  return useQuery({
    queryKey: ['relatorios', tenantId, filtros],
    enabled: !!tenantId || tenantId === null,
    // staleTime 0 — admin troca tenant frequentemente, cache causava receita = 0
    staleTime: 0,
    queryFn: async () => {
      const hoje = new Date()
      const inicio = new Date()
      inicio.setDate(hoje.getDate() - parseInt(filtros.periodo || '30'))

      let query = supabase
        .from('leads')
        .select(`
          id, nome, email, telefone, fonte, score, categoria,
          capital_disponivel, cidade, estado, urgencia,
          experiencia_anterior, resumo_qualificacao,
          created_at, updated_at,
          marca:id_marca (id, nome, emoji),
          operador:id_operador_responsavel (id, nome, role),
          status_comercial:id_status (id, label, slug),
          motivo_desistencia:id_motivo_desistencia (id, nome)
        `)
        .is('deleted_at', null)
        .gte('created_at', inicio.toISOString())
        .order('created_at', { ascending: false })

      if (tenantId) query = query.eq('tenant_id', tenantId)
      if (filtros.marca && filtros.marca !== 'todas') query = query.eq('id_marca', filtros.marca)
      if (filtros.operador && filtros.operador !== 'todos') query = query.eq('id_operador_responsavel', filtros.operador)
      if (filtros.status && filtros.status !== 'todos') query = query.eq('id_status', filtros.status)

      const { data: leads, error } = await query
      if (error) throw error
      const rows = leads || []

      const soma = arr => arr.reduce((a, l) => a + (parseFloat(l.capital_disponivel) || 0), 0)
      const getSlug = l => (l.status_comercial?.slug || l.status || '').toLowerCase()
      const bySlug = (...slugs) => rows.filter(l => slugs.includes(getSlug(l)))
      const vendidos   = bySlug('vendido', 'convertido')

      // Busca receita via lead_id dos leads já filtrados — vendas.tenant_id pode
      // refletir o tenant do operador, não do cliente; leads têm o tenant correto.
      const allLeadIds = rows.map(l => l.id)
      let receitaVendas = 0
      if (allLeadIds.length > 0) {
        const { data: vendasData } = await supabase
          .from('vendas')
          .select('lead_id, taxa_franquia_negociada')
          .eq('status', 'confirmada')
          .gte('data_venda', inicio.toISOString().slice(0, 10))
          .in('lead_id', allLeadIds)
        receitaVendas = (vendasData || []).reduce((a, v) => a + parseFloat(v.taxa_franquia_negociada || 0), 0)
      }
      const perdidos   = bySlug('perdido')
      const negociacao = bySlug('em_negociacao', 'negociacao')
      const agendado   = bySlug('em_agendamento', 'agendado', 'contato')
      const reabertos  = bySlug('reaberto')
      const novos      = bySlug('novo_lead', 'novo')
      const total      = rows.length

      const funil = [
        { etapa: 'Novo Lead',      count: novos.length,      capital: soma(novos),      cor: '#3b82f6' },
        { etapa: 'Em Agendamento', count: agendado.length,   capital: soma(agendado),   cor: '#f59e0b' },
        { etapa: 'Em Negociação',  count: negociacao.length, capital: soma(negociacao), cor: '#ee7b4d' },
        { etapa: 'Vendido',        count: vendidos.length,   capital: soma(vendidos),   cor: '#10b981' },
        { etapa: 'Perdido',        count: perdidos.length,   capital: soma(perdidos),   cor: '#ef4444' },
        { etapa: 'Reaberto',       count: reabertos.length,  capital: soma(reabertos),  cor: '#06b6d4' },
      ]

      const txConversao   = total > 0 ? ((vendidos.length / total) * 100).toFixed(1) : '0.0'
      const txPerda       = total > 0 ? ((perdidos.length / total) * 100).toFixed(1) : '0.0'
      const cicloMedio    = vendidos.length > 0
        ? (vendidos.reduce((a,l) => a + Math.ceil(Math.abs(new Date() - new Date(l.created_at))/86400000), 0) / vendidos.length).toFixed(1)
        : '0'
      const scoreMedio    = total > 0 ? (rows.reduce((a,l) => a + (l.score||0), 0) / total).toFixed(0) : '0'
      const capitalTotal  = soma(rows)
      const capitalConvertido = soma(vendidos)
      const capitalPerdido    = soma(perdidos)
      const capitalPipeline   = soma([...negociacao, ...agendado])

      const consultorMap = {}
      rows.forEach(l => {
        const key = l.operador?.id || 'sem_operador'
        const nome = l.operador?.nome || 'Não atribuído'
        if (!consultorMap[key]) consultorMap[key] = { nome, total:0, vendidos:0, perdidos:0, capital:0 }
        consultorMap[key].total++
        consultorMap[key].capital += parseFloat(l.capital_disponivel) || 0
        if (['vendido','convertido'].includes((l.status_comercial?.slug||l.status||'').toLowerCase())) consultorMap[key].vendidos++
        if ((l.status_comercial?.slug||l.status||'').toLowerCase() === 'perdido') consultorMap[key].perdidos++
      })
      const porConsultor = Object.values(consultorMap).map(c => ({
        ...c, txConversao: c.total > 0 ? ((c.vendidos/c.total)*100).toFixed(1) : '0.0'
      })).sort((a,b) => b.vendidos - a.vendidos)

      const marcaMap = {}
      rows.forEach(l => {
        const key = l.marca?.id || 'sem_marca'
        const nome = l.marca ? `${l.marca.emoji} ${l.marca.nome}` : 'Sem Marca'
        if (!marcaMap[key]) marcaMap[key] = { nome, total:0, vendidos:0, perdidos:0, capital:0 }
        marcaMap[key].total++
        marcaMap[key].capital += parseFloat(l.capital_disponivel) || 0
        if ((l.status_comercial?.slug||'').toLowerCase() === 'convertido') marcaMap[key].vendidos++
        if ((l.status_comercial?.slug||'').toLowerCase() === 'perdido') marcaMap[key].perdidos++
      })
      const porMarca = Object.values(marcaMap).map(m => ({
        ...m, txConversao: m.total > 0 ? ((m.vendidos/m.total)*100).toFixed(1) : '0.0'
      })).sort((a,b) => b.total - a.total)

      const dias = parseInt(filtros.periodo||'30')
      const temporal = Array.from({ length: dias }, (_,i) => {
        const d = new Date(hoje)
        d.setDate(hoje.getDate() - (dias-1-i))
        const str = d.toISOString().split('T')[0]
        const leadsNoDia    = rows.filter(l => l.created_at?.startsWith(str))
        const vendidosNoDia = leadsNoDia.filter(l => ['vendido','convertido'].includes((l.status_comercial?.slug||l.status||'').toLowerCase()))
        return { dia: d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }), leads: leadsNoDia.length, vendidos: vendidosNoDia.length, capital: soma(vendidosNoDia) }
      })

      const fonteMap = {}
      rows.forEach(l => { const f = l.fonte || 'Não informado'; fonteMap[f] = (fonteMap[f]||0)+1 })
      const porFonte = Object.entries(fonteMap).map(([name,value]) => ({ name, value })).sort((a,b) => b.value-a.value)

      const motivosMap = {}
      perdidos.forEach(l => { const m = l.motivo_desistencia?.nome || 'Não informado'; motivosMap[m] = (motivosMap[m]||0)+1 })
      const motivosPerda = Object.entries(motivosMap).map(([motivo,valor]) => ({ motivo: motivo.length>24?motivo.slice(0,24)+'…':motivo, valor })).sort((a,b) => b.valor-a.valor)

      const regiaoMap = {}
      rows.forEach(l => { const r = l.estado || 'Não informado'; regiaoMap[r] = (regiaoMap[r]||0)+1 })
      const porRegiao = Object.entries(regiaoMap).map(([name,value]) => ({ name, value })).sort((a,b) => b.value-a.value).slice(0,10)

      const scoreDist = [
        { faixa:'0-20',  count: rows.filter(l=>(l.score||0)<=20).length },
        { faixa:'21-40', count: rows.filter(l=>(l.score||0)>20&&(l.score||0)<=40).length },
        { faixa:'41-60', count: rows.filter(l=>(l.score||0)>40&&(l.score||0)<=60).length },
        { faixa:'61-80', count: rows.filter(l=>(l.score||0)>60&&(l.score||0)<=80).length },
        { faixa:'81-100',count: rows.filter(l=>(l.score||0)>80).length },
      ]

      return {
        total, txConversao, txPerda, cicloMedio, scoreMedio,
        capitalTotal, capitalConvertido, capitalPerdido, capitalPipeline, receitaVendas,
        vendidos: vendidos.length, perdidos: perdidos.length,
        funil, porConsultor, porMarca, temporal, porFonte,
        motivosPerda, porRegiao, scoreDist, leads: rows,
      }
    }
  })
}

export function useFiltrosRelatorio(tenantId) {
  return useQuery({
    queryKey: ['filtros-relatorio', tenantId],
    enabled: !!tenantId || tenantId === null,
    staleTime: 0,                    // admin troca tenant frequentemente, filtros devem refrescar
    queryFn: async () => {
      let qMarcas = supabase.from('marcas').select('id,nome,emoji').eq('ativo', true)
      let qOps    = supabase.from('usuarios').select('id,nome').eq('active', true)

      if (tenantId) {
        qMarcas = qMarcas.eq('tenant_id', tenantId)
        qOps    = qOps.eq('tenant_id', tenantId)
      }

      // Tenta status do tenant; fallback para globais (tenant_id = NULL)
      async function loadStatus() {
        if (tenantId) {
          const { data } = await supabase.from('status_comercial').select('id,label,slug').eq('tenant_id', tenantId).order('ordem')
          if (data?.length) return data
        }
        const { data } = await supabase.from('status_comercial').select('id,label,slug').is('tenant_id', null).order('ordem')
        return data || []
      }

      const [marcas, operadores, status] = await Promise.all([qMarcas, qOps, loadStatus()])
      return { marcas: marcas.data || [], operadores: operadores.data || [], status }
    }
  })
}