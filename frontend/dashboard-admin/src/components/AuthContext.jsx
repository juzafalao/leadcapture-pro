// ============================================================
// AuthContext.jsx — Contexto de Autenticação (CORRIGIDO)
// LeadCapture Pro — Zafalão Tech
//
// FIXES:
// - Debounce no botão de login
// - Limpeza correta de cache React Query
// - Race condition corrigida
// ============================================================

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { setSentryUser, clearSentryUser } from '../lib/sentry'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const isCheckingRef = useRef(false)
  const loginInProgressRef = useRef(false)
  const queryClient = useQueryClient()

  const loadUserData = useCallback(async (authId) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios_ativos')
        .select('*')
        .eq('auth_id', authId)
        .single()

      if (userError) throw userError

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, slug, is_platform, active')
        .eq('id', userData.tenant_id)
        .single()

      if (tenantError) {
        console.warn('Erro ao carregar tenant:', tenantError)
      }

      setUsuario(userData)
      setTenant(tenantData || null)
      setSentryUser(userData)
    } catch (err) {
      console.error('Erro ao carregar usuário:', err)
      setUsuario(null)
      setTenant(null)
    }
  }, [])

  const checkSession = async () => {
    if (isCheckingRef.current) return
    isCheckingRef.current = true
    setLoading(true)

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.warn('[Auth] Session check error:', error.message)
        if (error.message?.includes('lock') || error.message?.includes('timed out')) {
          console.warn('[Auth] Lock timeout detected, attempting recovery...')
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              await loadUserData(user.id)
              return
            }
          } catch (recoveryError) {
            console.warn('[Auth] Recovery failed:', recoveryError.message)
          }
        }
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-')) localStorage.removeItem(key)
        })
        await supabase.auth.signOut({ scope: 'local' })
        setUsuario(null)
        setTenant(null)
      } else if (session?.user) {
        await loadUserData(session.user.id)
      } else {
        setUsuario(null)
        setTenant(null)
      }
    } catch (error) {
      console.error('[Auth] Critical session check error:', error)
      setUsuario(null)
      setTenant(null)
    } finally {
      setLoading(false)
      isCheckingRef.current = false
    }
  }

  // FIX: Debounce no login para evitar cliques duplos
  const login = useCallback(async (email, password) => {
    // Previne múltiplas chamadas simultâneas
    if (loginInProgressRef.current) {
      return { success: false, error: 'Login em andamento...' }
    }

    try {
      loginInProgressRef.current = true
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await loadUserData(data.user.id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setTimeout(() => { loginInProgressRef.current = false }, 500)
    }
  }, [loadUserData])

  const logout = useCallback(async () => {
    // CRÍTICO: Limpar React Query ANTES de mudar estado
    queryClient.cancelQueries()
    queryClient.clear()
    clearSentryUser()
    setUsuario(null)
    setTenant(null)
    await supabase.auth.signOut({ scope: 'local' })
  }, [queryClient])

  useEffect(() => {
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_OUT') {
            setUsuario(null)
            setTenant(null)
            return
          }
          if (event === 'TOKEN_REFRESHED' && !session) {
            await supabase.auth.signOut({ scope: 'local' })
            setUsuario(null)
            setTenant(null)
            return
          }
          if (event === 'SIGNED_IN' && session?.user) {
            if (loginInProgressRef.current) return
            await loadUserData(session.user.id)
          }
        } catch {
          // silently ignore auth state change errors
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadUserData])

  // ── Helpers de permissão ──────────────────────────────────
  const isAuthenticated = !!usuario

  const isPlatformAdmin = useCallback(() => {
    return ['Administrador', 'admin'].includes(usuario?.role)
  }, [usuario?.role])

  const hasMinLevel = useCallback((minLevel) => {
    if (!usuario) return false
    return (usuario.role_nivel || 0) >= minLevel
  }, [usuario])

  const isAdmin = useCallback(() => {
    if (usuario?.is_super_admin) return true
    if (usuario?.role_nivel >= 5) return true
    return ['Administrador', 'admin'].includes(usuario?.role)
  }, [usuario])

  const isDiretor = useCallback(() => {
    if (isAdmin()) return true
    if (usuario?.role_nivel >= 4) return true
    return ['Diretor'].includes(usuario?.role)
  }, [usuario, isAdmin])

  const isGestor = useCallback(() => {
    if (isDiretor()) return true
    if (usuario?.role_nivel >= 3) return true
    return ['Gestor'].includes(usuario?.role)
  }, [usuario, isDiretor])

  const isConsultor = useCallback(() => {
    if (isGestor()) return true
    if (usuario?.role_nivel >= 2) return true
    return ['Consultor'].includes(usuario?.role)
  }, [usuario, isGestor])

  const isCliente = useCallback(() => {
    return usuario?.role === 'Cliente' || usuario?.role_nivel === 1
  }, [usuario])

  const hasRole = useCallback((roles) => {
    if (!usuario) return false
    if (isAdmin()) return true
    if (Array.isArray(roles)) return roles.includes(usuario.role)
    return usuario.role === roles
  }, [usuario, isAdmin])

  const value = {
    usuario,
    tenant,
    loading,
    isAuthenticated,
    login,
    logout,
    isPlatformAdmin,
    hasMinLevel,
    isAdmin,
    isGestor,
    isDiretor,
    isConsultor,
    isCliente,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
