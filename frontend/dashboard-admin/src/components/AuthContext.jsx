// ============================================================
// AuthContext.jsx — Contexto de Autenticação Tenant-Aware
// LeadCapture Pro — Zafalão Tech
// ============================================================
// ALTERAÇÕES BLOCO 2.5.3:
// ❌ BUG: loadUserData rodava 2x no login (login() + onAuthStateChange)
// ❌ BUG: logout NÃO limpava React Query cache → dados velhos no próximo login
// ✅ FIX: logout agora reseta queryClient (limpa TUDO)
// ✅ FIX: onAuthStateChange IGNORA SIGNED_IN se já carregou via login()
// ============================================================

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const isCheckingRef = useRef(false);
  const loginInProgressRef = useRef(false);  // ✅ NEW: evita loadUserData duplicado
  const queryClient = useQueryClient();       // ✅ NEW: para limpar cache no logout

  const loadUserData = useCallback(async (authId) => {
    try {
      // Buscar da view usuarios_ativos (dados enriquecidos com role + tenant)
      const { data: userData, error: userError } = await supabase
        .from('usuarios_ativos')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (userError) throw userError;

      // Buscar dados do tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, slug, is_platform, active')
        .eq('id', userData.tenant_id)
        .single();

      if (tenantError) {
        console.warn('Erro ao carregar tenant:', tenantError);
      }

      setUsuario(userData);
      setTenant(tenantData || null);
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
      setUsuario(null);
      setTenant(null);
    }
  }, []);

  const checkSession = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setLoading(true);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('[Auth] Session check error:', error.message);
        // If lock/timeout error, try to recover via getUser() before clearing
        if (error.message?.includes('lock') || error.message?.includes('timed out')) {
          console.warn('[Auth] Lock timeout detected, attempting recovery...');
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await loadUserData(user.id);
              return; // Successfully recovered
            }
          } catch (recoveryError) {
            console.warn('[Auth] Recovery failed:', recoveryError.message);
          }
        }
        // Clear corrupt session data
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
        await supabase.auth.signOut({ scope: 'local' });
        setUsuario(null);
        setTenant(null);
      } else if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUsuario(null);
        setTenant(null);
      }
    } catch (error) {
      console.error('[Auth] Critical session check error:', error);
      setUsuario(null);
      setTenant(null);
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
    }
  };

  const login = async (email, password) => {
    try {
      loginInProgressRef.current = true;  // ✅ Flag: estou logando, onAuthStateChange ignora
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await loadUserData(data.user.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      // ✅ Pequeno delay para garantir que onAuthStateChange já passou
      setTimeout(() => { loginInProgressRef.current = false; }, 500);
    }
  };

  const logout = async () => {
    // ✅ CRÍTICO: Limpar React Query ANTES de mudar estado
    queryClient.cancelQueries();          // Cancela fetches em andamento
    queryClient.clear();                  // Remove TODO o cache
    setUsuario(null);
    setTenant(null);
    await supabase.auth.signOut({ scope: 'local' });
  };

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_OUT') {
            setUsuario(null);
            setTenant(null);
            return;
          }
          if (event === 'TOKEN_REFRESHED' && !session) {
            await supabase.auth.signOut({ scope: 'local' });
            setUsuario(null);
            setTenant(null);
            return;
          }
          // ✅ FIX: Se login() já está em andamento, NÃO duplicar loadUserData
          if (event === 'SIGNED_IN' && session?.user) {
            if (loginInProgressRef.current) {
              // login() já está cuidando — ignora
              return;
            }
            await loadUserData(session.user.id);
          }
        } catch {
          // silently ignore auth state change errors
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // ── Helpers de permissão ──────────────────────────────────
  const isAuthenticated = !!usuario;

  const isPlatformAdmin = () => {
    return usuario?.is_super_admin === true && tenant?.is_platform === true;
  };

  const hasMinLevel = (minLevel) => {
    if (!usuario) return false;
    return (usuario.role_nivel || 0) >= minLevel;
  };

  const isAdmin = () => {
    if (usuario?.is_super_admin) return true;
    if (usuario?.role_nivel >= 5) return true;
    return ['Administrador', 'admin'].includes(usuario?.role);
  };

  const isDiretor = () => {
    if (isAdmin()) return true;
    if (usuario?.role_nivel >= 4) return true;
    return ['Diretor'].includes(usuario?.role);
  };

  const isGestor = () => {
    if (isDiretor()) return true;
    if (usuario?.role_nivel >= 3) return true;
    return ['Gestor'].includes(usuario?.role);
  };

  const isConsultor = () => {
    if (isGestor()) return true;
    if (usuario?.role_nivel >= 2) return true;
    return ['Consultor'].includes(usuario?.role);
  };

  const isCliente = () => usuario?.role === 'Cliente' || usuario?.role_nivel === 1;

  const hasRole = (roles) => {
    if (!usuario) return false;
    if (isAdmin()) return true;
    if (Array.isArray(roles)) return roles.includes(usuario.role);
    return usuario.role === roles;
  };

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};