import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const isCheckingRef = useRef(false);

  const loadUserData = async (authId) => {
    try {
      console.log('🔍 Carregando usuário:', authId);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error) throw error;
      console.log('✅ Usuário:', data?.nome);
      setUsuario(data);
    } catch (err) {
      console.error('❌ Erro:', err);
      setUsuario(null);
    }
  };

  const checkSession = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setLoading(true);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        console.log('✅ Sessão:', session.user.email);
        await loadUserData(session.user.id);
      } else {
        setUsuario(null);
      }
    } catch (error) {
      console.error('❌ Erro sessão:', error);
      setUsuario(null);
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await loadUserData(data.user.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUsuario(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!usuario;
  const isAdmin    = () => usuario?.role === 'admin' || usuario?.role === 'Administrador' || usuario?.is_super_admin;
  const isGestor   = () => usuario?.role === 'Gestor' || isAdmin();
  const isDiretor  = () => usuario?.role === 'Diretor' || isAdmin();
  const hasRole    = (roles) => {
    if (!usuario) return false;
    if (Array.isArray(roles)) return roles.includes(usuario.role) || usuario.is_super_admin;
    return usuario.role === roles || usuario.is_super_admin;
  };

  const value = { usuario, loading, isAuthenticated, login, logout, isAdmin, isGestor, isDiretor, hasRole };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
