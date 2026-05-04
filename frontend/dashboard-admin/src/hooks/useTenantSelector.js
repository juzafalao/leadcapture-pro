import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'lcp_active_tenant'

// Carrega lista de tenants para admins e expõe seletor de tenant
// O tenant selecionado persiste no sessionStorage entre navegações
export function useTenantSelector() {
  const { usuario, isPlatformAdmin } = useAuth()
  const isAdmin = isPlatformAdmin()
    || usuario?.is_super_admin
    || usuario?.is_platform
    || ['Administrador', 'admin'].includes(usuario?.role)

  const [tenants, setTenants] = useState([])
  const [tenantId, setTenantIdState] = useState(
    isAdmin ? (sessionStorage.getItem(STORAGE_KEY) || '') : ''
  )

  const setTenantId = useCallback((id) => {
    if (isAdmin && id) sessionStorage.setItem(STORAGE_KEY, id)
    setTenantIdState(id)
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      setTenantIdState(usuario?.tenant_id || '')
      return
    }
    supabase.from('tenants').select('id, name').order('name').then(({ data }) => {
      if (data?.length) {
        setTenants(data)
        setTenantIdState(prev => {
          // Mantém a seleção atual se ainda for válida
          if (prev && data.find(t => t.id === prev)) return prev
          // Tenta restaurar do sessionStorage
          const stored = sessionStorage.getItem(STORAGE_KEY)
          if (stored && data.find(t => t.id === stored)) return stored
          // Fallback para o primeiro tenant
          const first = data[0].id
          sessionStorage.setItem(STORAGE_KEY, first)
          return first
        })
      }
    })
  }, [isAdmin, usuario?.tenant_id])

  return { isAdmin, tenants, tenantId, setTenantId }
}
