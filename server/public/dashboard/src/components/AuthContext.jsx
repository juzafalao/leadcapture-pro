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
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_IN' && session) {
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUsuario(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        await supabase.auth.signOut();
        setUsuario(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUsuario(null);
      }
    } catch (error) {
      console.error('Erro na verificação de sessão:', error);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId) => {
    try {
      const { data: usuarioData, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        return;
      }

      if (usuarioData) {
        setUsuario(usuarioData);
        console.log('✅ Usuário carregado:', usuarioData.nome);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        throw error;
      }

      if (data.user) {
        await loadUserData(data.user.id);
        return { success: true };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
      }
      
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
            email: email,
          })
          .select()
          .single();

        if (tenantError) throw tenantError;

        const { error: userError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            email: email,
            nome: nome,
            tenant_id: tenant.id,
            role: 'admin',
          });

        if (userError) throw userError;
        
        return { success: true, user: authData.user };
      }
    } catch (error) {
      console.error('Erro no signup:', error);
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
      {children}
    </AuthContext.Provider>
  );
}
