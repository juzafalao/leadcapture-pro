import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useAuditLog({ tenantId, page = 1, perPage = 30, filtros = {} }) {
  return useQuery({
    queryKey: ['audit-log', tenantId, page, perPage, filtros],
    enabled: !!tenantId || tenantId === null,
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Platform admin (tenantId = null) vê tudo
      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      // Filtros
      if (filtros.tabela && filtros.tabela !== 'todas') {
        query = query.eq('tabela', filtros.tabela)
      }
      if (filtros.acao && filtros.acao !== 'todas') {
        query = query.eq('acao', filtros.acao)
      }
      if (filtros.usuario_id && filtros.usuario_id !== 'todos') {
        query = query.eq('usuario_id', filtros.usuario_id)
      }
      if (filtros.periodo) {
        const inicio = new Date()
        inicio.setDate(inicio.getDate() - parseInt(filtros.periodo))
        query = query.gte('created_at', inicio.toISOString())
      }

      // Paginação
      const from = (page - 1) * perPage
      const to = from + perPage - 1
      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      // Buscar nomes dos usuários separadamente
      const userIds = [...new Set((data || []).map(r => r.usuario_id).filter(Boolean))]
      let userMap = {}
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('usuarios')
          .select('id, nome, email')
          .in('id', userIds)
        ;(users || []).forEach(u => { userMap[u.id] = u })
      }

      // Buscar tenant names para platform admin
      let tenantMap = {}
      if (!tenantId) {
        const tIds = [...new Set((data || []).map(r => r.tenant_id).filter(Boolean))]
        if (tIds.length > 0) {
          const { data: tenants } = await supabase
            .from('tenants')
            .select('id, name')
            .in('id', tIds)
          ;(tenants || []).forEach(t => { tenantMap[t.id] = t.name })
        }
      }

      const rows = (data || []).map(r => ({
        ...r,
        usuario_nome: userMap[r.usuario_id]?.nome || 'Sistema',
        usuario_email: userMap[r.usuario_id]?.email || '',
        tenant_name: tenantMap[r.tenant_id] || '',
      }))

      return { data: rows, count: count ?? 0 }
    }
  })
}

export function useAuditFiltros(tenantId) {
  return useQuery({
    queryKey: ['audit-filtros', tenantId],
    enabled: !!tenantId || tenantId === null,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      // Buscar tabelas distintas
      const { data: tabelas } = await supabase
        .from('audit_log')
        .select('tabela')
        .order('tabela')

      const tabelasUnicas = [...new Set((tabelas || []).map(t => t.tabela))].sort()

      // Buscar usuários que fizeram ações
      let query = supabase.from('usuarios').select('id, nome').eq('active', true)
      if (tenantId) query = query.eq('tenant_id', tenantId)
      const { data: usuarios } = await query

      return {
        tabelas: tabelasUnicas,
        usuarios: usuarios || [],
        acoes: ['INSERT', 'UPDATE', 'DELETE'],
      }
    }
  })
}
