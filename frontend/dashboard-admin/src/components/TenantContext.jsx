import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const TenantContext = createContext(null)

const STORAGE_KEY = 'lc-active-tenant'

export function TenantProvider({ children }) {
  const { usuario, isPlatformAdmin } = useAuth()

  const isAdmin = isPlatformAdmin()
    || usuario?.is_super_admin
    || usuario?.is_platform
    || ['Administrador', 'admin'].includes(usuario?.role)

  const [tenants,        setTenants]        = useState([])
  const [activeTenantId, setActiveTenantIdRaw] = useState('')

  const setActiveTenantId = useCallback((id) => {
    setActiveTenantIdRaw(id)
    try { localStorage.setItem(STORAGE_KEY, id) } catch {}
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      setActiveTenantIdRaw(usuario?.tenant_id || '')
      return
    }
    supabase.from('tenants').select('id, name').order('name').then(({ data }) => {
      if (!data?.length) return
      setTenants(data)
      const saved = (() => { try { return localStorage.getItem(STORAGE_KEY) } catch { return null } })()
      const valid = saved && data.find(t => t.id === saved)
      setActiveTenantIdRaw(valid ? saved : data[0].id)
    })
  }, [isAdmin, usuario?.tenant_id])

  return (
    <TenantContext.Provider value={{ isAdmin, tenants, activeTenantId, setActiveTenantId }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used inside TenantProvider')
  return ctx
}
