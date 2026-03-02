// ============================================================
// AuthContext.jsx — Contexto de Autenticação Tenant-Aware
// LeadCapture Pro — Zafalão Tech
// ============================================================
// ALTERAÇÕES BLOCO 2:
// - loadUserData agora busca da view 'usuarios_ativos' (enriquecida)
// - Carrega dados do tenant (is_platform, name, slug)
// - Novos helpers: isPlatformAdmin, canAccess(minLevel)
// - Mantém compatibilidade: isAdmin, isGestor, isDiretor, isConsultor, hasRole
// ============================================================

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
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const isCheckingRef = useRef(false);

  const loadUserData = async (authId) => {
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
  };

  const checkSession = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setLoading(true);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
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
      setUsuario(null);
      setTenant(null);
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
          if (event === 'SIGNED_IN' && session?.user) {
            await loadUserData(session.user.id);
          }
        } catch {
          // silently ignore auth state change errors
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Helpers de permissão ──────────────────────────────────
  // Níveis da tabela roles:
  //   1 = Cliente
  //   2 = Consultor
  //   3 = Gestor
  //   4 = Diretor
  //   5 = Administrador (Super Admin)

  const isAuthenticated = !!usuario;

  // Platform Admin: Super Admin + tenant is_platform
  const isPlatformAdmin = () => {
    return usuario?.is_super_admin === true && tenant?.is_platform === true;
  };

  // Nível mínimo de acesso
  const hasMinLevel = (minLevel) => {
    if (!usuario) return false;
    return (usuario.role_nivel || 0) >= minLevel;
  };

  // Compatibilidade com código existente (agora usa role_nivel + fallback texto)
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
