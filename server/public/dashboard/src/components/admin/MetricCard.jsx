import React from 'react';

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend,
  trendValue,
  className = ''
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-slate-600',
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm ${trendColors[trend]}`}>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-orange-50 rounded-lg">          <div className="p-3 bg-orange-50 rounde-6          <div classNa>
                                v>
  );
}
EOEOEOcho "✅ MetricCard crEOEOEOchPASSO EOEOEOcr Página de FunEOEOEOcho "✅ h#EOEiaEOEOEOcho "✅ MetricC nEOEOEOcho "✅dir -p src/pEOEOEOcho "✅ MetricCarelEOEOEOcho "✅ MetricCard crEnnelPageEOsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { supaimport { supaimport { supaimport { supaimport { supaimp fimport { supaimport { supaimport {Card';

export default function FunnelPage() {
  const [metrics, setMetric  const [metrics, setMetric  const [metrics, setMetric  const [metric
                   
    loadM    loadM    loadM    loadM    loadM    loadM    loadM    loadM  = setInterval(lo    loadM    loadM    loadM    l => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase      const { datme      const        consago: 30,
      });
                                                                                                                                     r)                                 g(false);                                                                                                                                     r)                                 g(false);                                   grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
                                            
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
      count: metrics?.signup_started       co    conversion: metrics?.landing_views       co        count: metrics?.signup_started       co    conversion: metrics?.landing_views       co color: 'from      count: metrics?.signup_started       co    conversion: metrics?.landing_views       co        count: metrics?.signup_started       co    conversion: metrics?.landing_views       co color: 'from      count: metrics?.signup_started       co    conversion: metrics?.landing_views       co        count: metrics?.signup_started       co    conversion: metrics?.landing_views       co color: 'from      count: mn: metrics?.signup_completed > 0
        ? ((        ? ((        ? ((        ? ((        ? ((        ? ((        ?           ? ((  color: 'from-yellow-400 to-orange-300',
    },
    {
      name: 'Usuários Ativos (7d)',
      count: metrics?.active_7d |      count: metrics?.active_7d |      cad > 0
        ? ((metrics?.active_7d / metrics?.first_lead) * 100).toF     1)
        : 0,
      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-gr        color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50      color: 'from-green-50 ?.warm_leads || 0}
          description="Média prioridade"
        />
        <MetricCard
          title="Leads COLD"
          value={metrics?.cold_leads || 0}
          description="Baixa prioridade"
        />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         ${                                        d px-4 text-white font-semibold t                          `}
                                         th                            }}
                  >
                    {step.conversion > 10 && `${step.conversion}%`}
                  </div>
                </div>
                {idx > 0 && (
                  <span className="text-sm text-slate-600 min-w-[80px] text-right">
                    {step.conversion}% conversão
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
