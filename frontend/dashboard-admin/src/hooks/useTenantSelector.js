import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'

// Carrega lista de tenants para admins e expõe seletor de tenant
export function useTenantSelector() {
  const { usuario, isPlatformAdmin } = useAuth()
  const isAdmin = isPlatformAdmin()
    || usuario?.is_super_admin
    || usuario?.is_platform
    || ['Administrador', 'admin'].includes(usuario?.role)

  const [tenants,  setTenants]  = useState([])
  const [tenantId, setTenantId] = useState('')

  useEffect(() => {
    if (!isAdmin) {
      setTenantId(usuario?.tenant_id || '')
      return
    }
    supabase.from('tenants').select('id, name').order('name').then(({ data }) => {
      if (data?.length) {
        setTenants(data)
        setTenantId(prev => prev || data[0].id)
      }
    })
  }, [isAdmin, usuario?.tenant_id])

  return { isAdmin, tenants, tenantId, setTenantId }
}
