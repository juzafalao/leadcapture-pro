// useTenantSelector — thin wrapper sobre TenantContext global
// Mantém a mesma API ({isAdmin, tenants, tenantId, setTenantId}) para compatibilidade
// O estado é compartilhado globalmente: mudar em uma página reflete em todas.
import { useTenant } from '../components/TenantContext'

export function useTenantSelector() {
  const { isAdmin, tenants, activeTenantId, setActiveTenantId } = useTenant()
  return {
    isAdmin,
    tenants,
    tenantId:    activeTenantId,
    setTenantId: setActiveTenantId,
  }
}
