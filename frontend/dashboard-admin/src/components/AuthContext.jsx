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
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error) throw error;
      setUsuario(data);
    } catch (err) {
      setUsuario(null);
    }
  };

  const checkSession = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setLoading(true);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        if (error.message?.includes('Refresh Token')) {
          await supabase.auth.signOut();
        }
        setUsuario(null);
      } else if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUsuario(null);
      }
    } catch (error) {
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
        if (event === 'SIGNED_OUT') {
          setUsuario(null);
          return;
        }
        if (event === 'TOKEN_REFRESHED' && !session) {
          await supabase.auth.signOut();
          setUsuario(null);
          return;
        }
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Roles válidos
  const ROLES_ADMIN    = ['Administrador', 'admin'];
  const ROLES_GESTOR   = ['Administrador', 'admin', 'Diretor', 'Gestor'];
  const ROLES_DIRETOR  = ['Administrador', 'admin', 'Diretor'];

  const isAuthenticated = !!usuario;
  const isAdmin   = () => ROLES_ADMIN.includes(usuario?.role);
  const isGestor  = () => ROLES_GESTOR.includes(usuario?.role);
  const isDiretor = () => ROLES_DIRETOR.includes(usuario?.role);
  const hasRole   = (roles) => {
    if (!usuario) return false;
    if (isAdmin()) return true;
    if (Array.isArray(roles)) return roles.includes(usuario.role);
    return usuario.role === roles;
  };

  const value = { 
    usuario, loading, isAuthenticated, 
    login, logout, 
    isAdmin, isGestor, isDiretor, hasRole 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
