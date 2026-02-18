import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Download, Search, RefreshCw } from 'lucide-react';

const supabase = createClient(
  'https://krcybmownrpfjvqhacup.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyY3libW93bnJwZmp2cWhhY3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0MzcyMjcsImV4cCI6MjA1MjAxMzIyN30.JNaJwB00hmnxrIbBvDWaYQTFzlQPp4M2vfbqBgswi_4'
);

export default function LeadsSistemaPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    carregarLeads();
    const interval = setInterval(carregarLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads_sistema')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    const csv = [
      ['Data', 'Nome', 'Email', 'Telefone', 'Companhia', 'Cidade', 'Estado', 'Observação', 'Status'],
      ...leadsFiltrados.map(l => [
        new Date(l.created_at).toLocaleDateString('pt-BR'),
        l.nome,
        l.email,
        l.telefone,
        l.companhia || '',
        l.cidade || '',
        l.estado || '',
        l.observacao || '',
        l.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads-sistema-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const leadsFiltrados = leads.filter(lead => {
    const matchSearch = !searchTerm || 
      lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm);
    
    const matchStatus = !statusFilter || lead.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-white">📊 Leads do Sistema</h1>
        <p className="text-orange-100 mt-2">
          Leads capturados pela landing page do LeadCapture Pro
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <span className="text-white font-bold text-2xl">{leads.length}</span>
            <span className="text-orange-100 text-sm ml-2">Total</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#141416] rounded-lg p-4 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="">Todos os status</option>
            <option value="novo">Novo</option>
            <option value="contatado">Contatado</option>
            <option value="qualificado">Qualificado</option>
            <option value="convertido">Convertido</option>
          </select>

          <button
            onClick={exportarCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#141416] rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0b] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Telefone</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Companhia</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cidade/UF</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leadsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Nenhum lead encontrado
                  </td>
                </tr>
              ) : (
                leadsFiltrados.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{lead.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`mailto:${lead.email}`} className="text-sm text-blue-400 hover:text-blue-300">
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://wa.me/55${lead.telefone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-400 hover:text-green-300"
                      >
                        {lead.telefone}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {lead.companhia || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {lead.cidade ? `${lead.cidade}/${lead.estado}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        lead.status === 'novo' ? 'bg-green-500/20 text-green-400' :
                        lead.status === 'contatado' ? 'bg-blue-500/20 text-blue-400' :
                        lead.status === 'qualificado' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
