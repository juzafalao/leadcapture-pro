// ============================================================
// useRealtimeNotifications.js — Hook para notificações em tempo real
// Supabase Realtime + toast para eventos de leads/automações
// LeadCapture Pro — Zafalão Tech
// ============================================================

import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';
import { useAuth } from '../components/AuthContext';

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const { usuario, tenant } = useAuth();

  const handleLeadInsert = useCallback((payload) => {
    const lead = payload.new;
    toast.info(`🎯 Novo lead: ${lead.nome || 'Anônimo'}`);
  }, [toast]);

  const handleLeadUpdate = useCallback((payload) => {
    const lead = payload.new;
    if (lead.status === 'convertido') {
      toast.success(`✅ Lead convertido: ${lead.nome || 'Anônimo'}`);
    }
  }, [toast]);

  useEffect(() => {
    if (!usuario || !tenant?.id) return;

    const channel = supabase
      .channel(`realtime:leads:tenant:${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        handleLeadInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        handleLeadUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario, tenant, handleLeadInsert, handleLeadUpdate]);
}
