import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUserData = async (authId) => {
    console.log('🔄 Carregando dados do usuário...', authId)
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authId)
        .single()

      console.log('👤 Dados do usuário:', { userData, userError })

      if (userError) {
        console.error('❌ Erro ao carregar usuário:', userError)
        setLoading(false)
        return
      }

      if (userData) {
        // ✅ VERIFICAR SE USUÁRIO ESTÁ ATIVO
        if (!userData.ativo) {
          console.error('🚫 Usuário inativo:', userData.email)
          
          await supabase.auth.signOut()
          
          setUsuario(null)
          setTenant(null)
          setLoading(false)
          
          alert('❌ Seu usuário está inativo. Entre em contato com o administrador.')
          return
        }
        
        console.log('✅ Usuário carregado:', userData.nome, userData.role)
        setUsuario(userData)
        
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userData.tenant_id)
          .single()
        
        console.log('🏢 Tenant:', { tenantData, tenantError })
        
        if (tenantError) {
          console.error('⚠️ Erro ao carregar tenant:', tenantError)
        } else if (tenantData) {
          setTenant(tenantData)
        }
      } else {
        console.log('⚠️ Nenhum usuário encontrado com auth_id:', authId)
      }
    } catch (err) {
      console.error('💥 Erro geral ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🚀 AuthContext iniciando...')
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📝 Sessão atual:', session)
      
      if (session?.user) {
        console.log('👤 Usuário autenticado no Supabase Auth:', session.user.email)
        loadUserData(session.user.id)
      } else {
        console.log('🚫 Nenhuma sessão ativa')
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.email)
      
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        setUsuario(null)
        setTenant(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    console.log('🔐 Tentando login:', email)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      })
      
      if (error) {
        console.error('❌ Erro no login:', error.message)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Login bem-sucedido!')
      return { success: true, data }
    } catch (err) {
      console.error('💥 Erro geral no login:', err)
      return { success: false, error: err.message }
    }
  }

  const logout = async () => {
    console.log('👋 Fazendo logout...')
    
    try {
      await supabase.auth.signOut()
      setUsuario(null)
      setTenant(null)
      console.log('✅ Logout concluído')
    } catch (err) {
      console.error('❌ Erro ao fazer logout:', err)
    }
  }

  // ============================================
  // FUNÇÕES DE PERMISSÃO - MULTI-TENANT
  // ============================================

  const isSuperAdmin = () => {
    const result = usuario?.is_super_admin === true || usuario?.role === 'Administrador'
    console.log('👑 isSuperAdmin?', result, 'is_super_admin:', usuario?.is_super_admin, 'role:', usuario?.role)
    return result
  }

  const isAdministrador = () => {
    const result = isSuperAdmin()
    console.log('🔍 isAdministrador?', result, 'role:', usuario?.role)
    return result
  }
  
  const isDiretor = () => {
    if (isSuperAdmin()) return true
    const result = usuario?.role === 'Diretor'
    console.log('🔍 isDiretor?', result, 'role:', usuario?.role)
    return result
  }
  
  const isGestor = () => {
    if (isSuperAdmin()) return true
    const result = ['Diretor', 'Gestor'].includes(usuario?.role)
    console.log('🔍 isGestor?', result, 'role:', usuario?.role)
    return result
  }
  
  const isConsultor = () => usuario?.role === 'Consultor'
  const isOperador = () => usuario?.role === 'Operador'

  const canManageUsers = () => {
    if (isSuperAdmin()) return true
    return usuario?.role === 'Diretor'
  }

  const canManageMarcas = () => {
    if (isSuperAdmin()) return true
    return usuario?.role === 'Diretor'
  }

  const canManageSegmentos = () => {
    if (isSuperAdmin()) return true
    return usuario?.role === 'Diretor'
  }

  const canViewAllLeads = () => {
    if (isSuperAdmin()) return true
    return ['Diretor', 'Gestor'].includes(usuario?.role)
  }

  const canEditAllLeads = () => {
    if (isSuperAdmin()) return true
    return ['Diretor', 'Gestor'].includes(usuario?.role)
  }

  const hasPermission = (resource, action) => {
    if (!usuario) return false
    
    if (isSuperAdmin()) return true
    
    const permissions = {
      'Diretor': {
        leads: ['visualizar', 'editar', 'criar', 'excluir'],
        relatorios: ['visualizar', 'exportar'],
        marcas: ['visualizar', 'editar', 'criar', 'excluir'],
        segmentos: ['visualizar', 'editar', 'criar', 'excluir'],
        usuarios: ['visualizar', 'editar', 'criar'],
        inteligencia: ['visualizar']
      },
      'Gestor': {
        leads: ['visualizar', 'editar', 'criar'],
        relatorios: ['visualizar', 'exportar'],
        marcas: ['visualizar', 'editar', 'criar'],
        segmentos: ['visualizar', 'editar', 'criar'],
        usuarios: ['visualizar'],
        inteligencia: ['visualizar']
      },
      'Consultor': {
        leads: ['visualizar'],
        relatorios: ['visualizar']
      },
      'Operador': {
        leads: ['visualizar', 'editar']
      }
    }
    
    const userPerms = permissions[usuario.role]
    if (!userPerms || !userPerms[resource]) return false
    
    return userPerms[resource].includes(action)
  }

  console.log('📊 AuthContext State:', {
    usuario: usuario?.nome,
    role: usuario?.role,
    is_super_admin: usuario?.is_super_admin,
    ativo: usuario?.ativo,
    tenant: tenant?.nome,
    loading,
    isAuthenticated: !!usuario
  })

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      tenant, 
      loading, 
      login,
      logout,
      isAdministrador,
      isDiretor,
      isGestor,
      isConsultor,
      isOperador,
      hasPermission,
      isAuthenticated: !!usuario,
      isSuperAdmin,
      canManageUsers,
      canManageMarcas,
      canManageSegmentos,
      canViewAllLeads,
      canEditAllLeads
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)