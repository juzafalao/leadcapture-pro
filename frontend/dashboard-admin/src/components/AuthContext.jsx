import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSessionAndSubscribe = async () => {
      await checkSession();
    };

    checkSessionAndSubscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session) {
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUsuario(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        setUsuario(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUsuario(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro na verificação de sessão:', error);
      setUsuario(null);
      setLoading(false);
    }
  };

  const loadUserData = async (authUserId) => {
    try {
      const { data: usuarioData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authUserId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar usuário:', error);
        setLoading(false);
        return;
      }

      if (usuarioData) {
        // Buscar tenant
        if (usuarioData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', usuarioData.tenant_id)
            .maybeSingle();
          
          if (tenantData) {
            usuarioData.tenant = tenantData;
          }
        }
        
        setUsuario(usuarioData);
        console.log('✅ Usuário carregado:', usuarioData.nome);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserData(data.user.id);
        return { success: true };
      }
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message || 'Erro ao fazer login' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUsuario(null);
      setLoading(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  // ========================================
  // HELPER FUNCTIONS (para compatibilidade)
  // ========================================
  
  const isAdmin = () => {
    return usuario?.role === 'Administrador' || usuario?.is_super_admin === true;
  };

  const isGestor = () => {
    return usuario?.role === 'Gestor' || isAdmin();
  };

  const isDiretor = () => {
    return usuario?.role === 'Diretor' || isAdmin();
  };

  const hasRole = (roles) => {
    if (!usuario) return false;
    if (Array.isArray(roles)) {
      return roles.includes(usuario.role) || usuario.is_super_admin === true;
    }
    return usuario.role === roles || usuario.is_super_admin === true;
  };

  const value = {
    usuario,
    loading,
    login,
    logout,
    isAuthenticated: !!usuario,
    // Helper functions
    isAdmin,
    isGestor,
    isDiretor,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}