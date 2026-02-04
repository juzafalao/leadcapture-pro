import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUserData = async (authId) => {
    try {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authId)
        .single()

      if (userData) {
        setUsuario(userData)
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userData.tenant_id)
          .single()
        if (tenantData) setTenant(tenantData)
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserData(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserData(session.user.id)
      else {
        setUsuario(null)
        setTenant(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Definindo como funções para bater com a chamada da Sidebar
  const isAdmin = () => usuario?.role === 'admin'
  const isGerente = () => ['admin', 'gerente'].includes(usuario?.role)

  return (
    <AuthContext.Provider value={{ usuario, tenant, loading, isAdmin, isGerente, isAuthenticated: !!usuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)