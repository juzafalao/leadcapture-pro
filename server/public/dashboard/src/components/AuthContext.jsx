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
    
    const initialize = async () => {
      await checkSession();
      
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) return;
          
          console.log('🔔 Auth event:', event);
          
          if (event === 'SIGNED_IN' && session) {
            await loadUserData(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUsuario(null);
          }
        }
      );

      return () => {
        isMounted = false;
        authListener?.subscription?.unsubscribe();
      };
    };

    initialize();
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
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
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
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUsuario(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const signup = async (email, password, nome, empresaNome) => {
    try {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            nome: empresaNome,
            slug: empresaNome.toLowerCase().replace(/\s+/g, '-'),
          })
          .select()
          .single();

        if (tenantError) throw tenantError;

        const { error: userError } = await supabase
          .from('usuarios')
          .insert({
            auth_id: authData.user.id,
            email: email,
            nome: nome,
            tenant_id: tenant.id,
            role: 'Administrador',
            ativo: true,
            is_super_admin: false,
          });

        if (userError) throw userError;

        return { success: true, user: authData.user };
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    usuario,
    loading,
    login,
    logout,
    signup,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}