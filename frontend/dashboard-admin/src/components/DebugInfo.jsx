import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export const DebugInfo = () => {
  const { usuario } = useAuth();
  const [leads, setLeads] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      const { data: l, error: le } = await supabase.from('leads').select('*');
      console.log('LEADS:', l, 'ERRO:', le);
      setLeads(l || []);

      const { data: m, error: me } = await supabase.from('marcas').select('*');
      console.log('MARCAS:', m, 'ERRO:', me);
      setMarcas(m || []);
    };
    run();
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 10, right: 10, 
      background: '#1e1e1e', color: '#0f0', 
      padding: 16, borderRadius: 8, fontSize: 11,
      zIndex: 9999, maxWidth: 400, maxHeight: 400,
      overflow: 'auto', fontFamily: 'monospace'
    }}>
      <b>🔍 DEBUG</b><br/>
      <b>Auth ID:</b> {session?.user?.id || 'NULL'}<br/>
      <b>Usuario:</b> {usuario?.nome || 'NULL'}<br/>
      <b>Role:</b> {usuario?.role || 'NULL'}<br/>
      <b>Tenant:</b> {usuario?.tenant_id || 'NULL'}<br/>
      <b>Leads:</b> {leads.length}<br/>
      <b>Marcas:</b> {marcas.length}<br/>
    </div>
  );
};
