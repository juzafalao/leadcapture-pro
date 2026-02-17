import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

function MetricCard({ title, value, description, gradient }) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-orange-500/50 transition-all">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </p>
      <p className={`text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-1`}>
        {value}
      </p>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

export default function FunnelPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_funnel_metrics', {
        days_ago: 30,
      });
      
      if (error) throw error;
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 bg-[#0a0a0b]">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-white/5 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const funnelSteps = [
    {
      name: 'Visitantes Landing',
      count: metrics?.landing_views || 0,
      conversion: 100,
      color: 'from-orange-500 to-orange-600',
    },
    {
      name: 'Cadastros Iniciados',
      count: metrics?.signup_started || 0,
      conversion: metrics?.landing_views > 0
        ? ((metrics?.signup_started / metrics?.landing_views) * 100).toFixed(1)
        : 0,
      color: 'from-orange-400 to-orange-500',
    },
    {
      name: 'Cadastros Completos',
      count: metrics?.signup_completed || 0,
      conversion: metrics?.signup_started > 0
        ? ((metrics?.signup_completed / metrics?.signup_started) * 100).toFixed(1)
        : 0,
      color: 'from-orange-300 to-orange-400',
    },
    {
      name: 'Primeiro Lead',
      count: metrics?.first_lead || 0,
      conversion: metrics?.signup_completed > 0
        ? ((metrics?.first_lead / metrics?.signup_completed) * 100).toFixed(1)
        : 0,
      color: 'from-yellow-400 to-orange-300',
    },
    {
      name: 'Ativos 7d',
      count: metrics?.active_7d || 0,
      conversion: metrics?.first_lead > 0
        ? ((metrics?.active_7d / metrics?.first_lead) * 100).toFixed(1)
        : 0,
      color: 'from-green-500 to-yellow-400',
    },
  ];

  return (
    <div className="p-6 lg:p-10 bg-[#0a0a0b] min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-2">
          Funil de Conversão
        </h1>
        <p className="text-gray-400">
          Últimos {metrics?.period_days} dias • Atualizado em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Leads"
          value={metrics?.total_leads || 0}
          description="Todos os leads capturados"
          gradient="from-orange-500 to-yellow-500"
        />
        <MetricCard
          title="Leads HOT 🔥"
          value={metrics?.hot_leads || 0}
          description="Alta prioridade"
          gradient="from-red-500 to-orange-500"
        />
        <MetricCard
          title="Leads WARM"
          value={metrics?.warm_leads || 0}
          description="Média prioridade"
          gradient="from-yellow-500 to-orange-400"
        />
        <MetricCard
          title="Leads COLD"
          value={metrics?.cold_leads || 0}
          description="Baixa prioridade"
          gradient="from-blue-400 to-cyan-400"
        />
      </div>

      <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">📊</span>
          Visualização do Funil
        </h2>
        
        <div className="space-y-6">
          {funnelSteps.map((step, idx) => (
            <div key={step.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-300">{step.name}</span>
                <span className="text-gray-400">
                  {step.count.toLocaleString()} usuários
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-14 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                  <div
                    className={`h-full bg-gradient-to-r ${step.color} flex items-center justify-end px-6 text-white font-bold transition-all duration-700 ease-out shadow-lg`}
                    style={{ width: `${Math.max(step.conversion, 5)}%` }}
                  >
                    {step.conversion > 15 && (
                      <span className="text-lg drop-shadow-lg">
                        {step.conversion}%
                      </span>
                    )}
                  </div>
                </div>
                
                {idx > 0 && (
                  <div className="min-w-[120px] text-right">
                    <span className="text-lg font-bold text-orange-400">
                      {step.conversion}%
                    </span>
                    <p className="text-xs text-gray-500">conversão</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-600">
          💡 Dados atualizados automaticamente a cada 60 segundos
        </p>
      </div>
    </div>
  );
}