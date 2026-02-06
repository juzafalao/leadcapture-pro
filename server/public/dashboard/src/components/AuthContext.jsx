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

  console.log('🔄 AuthProvider render - usuario:', usuario?.nome || 'null', 'loading:', loading);

  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      console.log('🚀 Inicializando AuthContext...');
      
      await checkSession();
      
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) {
            console.log('⚠️ Componente desmontado, ignorando evento');
            return;
          }
          
          console.log('🔔 Auth event:', event, 'session:', !!session);
          
          if (event === 'SIGNED_IN' && session) {
            console.log('✅ SIGNED_IN detectado, carregando dados...');
            await loadUserData(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 SIGNED_OUT detectado');
            setUsuario(null);
            setLoading(false);
          } else if (event === 'INITIAL_SESSION') {
            console.log('🔵 INITIAL_SESSION - já tratado no checkSession');
          }
        }
      );

      return () => {
        console.log('🧹 Limpando AuthContext...');
        isMounted = false;
        authListener?.subscription?.unsubscribe();
      };
    };

    initialize();
  }, []);

  const checkSession = async () => {
    try {
      console.log('🔍 Verificando sessão existente...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        setUsuario(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        console.log('✅ Sessão encontrada:', session.user.email);
        await loadUserData(session.user.id);
      } else {
        console.log('⚠️ Nenhuma sessão ativa');
        setUsuario(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('💥 Erro na verificação de sessão:', error);
      setUsuario(null);
      setLoading(false);
    }
  };

  const loadUserData = async (authUserId) => {
    try {
      console.log('👤 Buscando usuário com auth_id:', authUserId);
      
      const { data: usuarioData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authUserId)
        .maybeSingle();

      console.log('📊 Query retornou:', { 
        temDados: !!usuarioData, 
        temErro: !!error,
        nome: usuarioData?.nome,
        email: usuarioData?.email 
      });

      if (error) {
        console.error('❌ Erro na query:', error);
        setLoading(false);
        return;
      }

      if (usuarioData) {
        console.log('✅ Dados do usuário encontrados');
        
        // Buscar tenant
        if (usuarioData.tenant_id) {
          console.log('🏢 Buscando tenant:', usuarioData.tenant_id);
          
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', usuarioData.tenant_id)
            .maybeSingle();
          
          if (!tenantError && tenantData) {
            console.log('✅ Tenant encontrado:', tenantData.nome);
            usuarioData.tenant = tenantData;
          } else {
            console.log('⚠️ Tenant não encontrado ou erro:', tenantError);
          }
        }
        
        console.log('💾 Setando usuário no estado:', usuarioData.nome);
        setUsuario(usuarioData);
        console.log('✅ setState(usuario) chamado');
        
        setLoading(false);
        console.log('✅ setState(loading = false) chamado');
      } else {
        console.log('⚠️ Query não retornou dados');
        setUsuario(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('💥 Exceção ao carregar usuário:', error);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Iniciando login:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        setLoading(false);
        throw error;
      }

      if (data.user) {
        console.log('✅ Auth bem-sucedido, auth_id:', data.user.id);
        await loadUserData(data.user.id);
        console.log('✅ loadUserData completado');
        return { success: true };
      }
    } catch (error) {
      console.error('💥 Exceção no login:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Fazendo logout...');
      await supabase.auth.signOut();
      setUsuario(null);
      setLoading(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  const value = {
    usuario,
    loading,
    login,
    logout,
  };

  console.log('📤 AuthContext value:', { 
    temUsuario: !!usuario, 
    nomeUsuario: usuario?.nome,
    loading 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}