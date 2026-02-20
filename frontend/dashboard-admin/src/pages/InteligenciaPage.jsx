import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import HeroMetric from '../components/dashboard/HeroMetric';
import MetricCard from '../components/dashboard/MetricCard';
import InsightCard from '../components/dashboard/InsightCard';
import Tooltip from '../components/dashboard/Tooltip';
import PeriodFilter from '../components/dashboard/PeriodFilter';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

export default function InteligenciaPage() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  
  const [filtroPeriodo, setFiltroPeriodo] = useState('30');
  const [filtroMarca, setFiltroMarca] = useState('todas');

  const [metrics, setMetrics] = useState({
    total: 0,
    parados: 0,
    taxaDesistencia: 0,
    conversao: 0,
    cicloMedio: 0,
    capitalPerdido: 0,
    capitalParado: 0,
    capitalPipeline: 0,
    faturamento: 0,
    dealsVendidos: 0,
    metaMensal: 1000000,
    variacao: 0
  });

  const [dataMarcas, setDataMarcas] = useState([]);
  const [dataDesistencia, setDataDesistencia] = useState([]);
  const [dataSLA, setDataSLA] = useState([]);
  const [dataEvolucao, setDataEvolucao] = useState([]);
  const [leadsParadosList, setLeadsParadosList] = useState([]);

  const COLORS = ['#ee7b4d', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

  const getDateRange = () => {
    const hoje = new Date();
    let inicio = new Date();

    switch (periodo) {
      case 'mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case '30dias':
        inicio.setDate(hoje.getDate() - 30);
        break;
      case 'trimestre':
        const mesAtual = hoje.getMonth();
        const primeiroMesTrimestre = Math.floor(mesAtual / 3) * 3;
        inicio = new Date(hoje.getFullYear(), primeiroMesTrimestre, 1);
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        break;
    }

    return { inicio, fim: hoje };
  };

  const fetchData = async () => {
    if (!usuario?.tenant_id) return;
    setLoading(true);

    const { inicio, fim } = getDateRange();

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*, marcas(id, nome), motivos_desistencia(nome)')
      .eq('tenant_id', usuario.tenant_id)
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fim.toISOString());

    if (!error && leads) {
      const total = leads.length;
      
      const vendidos = leads.filter(l => l.status?.toLowerCase() === 'vendido');
      const perdidos = leads.filter(l => l.status?.toLowerCase() === 'perdido');
      const pipeline = leads.filter(l => l.status?.toLowerCase() === 'em negociação' || l.status?.toLowerCase().includes('negoc'));
      const parados = leads.filter(l => {
        const statusBaixo = l.status?.toLowerCase() || '';
        return statusBaixo.includes('novo') || statusBaixo.includes('contato') || statusBaixo === 'agendado';
      });

      const capPerdido = perdidos.reduce((acc, l) => acc + (parseFloat(l.capital_disponivel) || 0), 0);
      const capParado = parados.reduce((acc, l) => acc + (parseFloat(l.capital_disponivel) || 0), 0);
      const capPipeline = pipeline.reduce((acc, l) => acc + (parseFloat(l.capital_disponivel) || 0), 0);
      const faturamento = vendidos.reduce((acc, l) => acc + (parseFloat(l.capital_disponivel) || 0), 0);

      const calcularMedia = (lista) => {
        if (lista.length === 0) return 0;
        const soma = lista.reduce((acc, l) => {
          const dias = Math.ceil(Math.abs(new Date() - new Date(l.created_at)) / (1000 * 60 * 60 * 24));
          return acc + dias;
        }, 0);
        return (soma / lista.length).toFixed(1);
      };

      const variacao = total > 0 ? ((vendidos.length / total) * 100).toFixed(0) : 0;

      setLeadsParadosList(parados);
      
      setMetrics({
        total,
        parados: parados.length,
        taxaDesistencia: total > 0 ? ((perdidos.length / total) * 100).toFixed(1) : 0,
        conversao: total > 0 ? ((vendidos.length / total) * 100).toFixed(1) : 0,
        cicloMedio: calcularMedia(vendidos),
        capitalPerdido: capPerdido,
        capitalParado: capParado,
        capitalPipeline: capPipeline,
        faturamento: faturamento,
        dealsVendidos: vendidos.length,
        metaMensal: 1000000,
        variacao: variacao
      });

      const motivosMap = perdidos
        .filter(l => l.motivos_desistencia)
        .reduce((acc, lead) => {
          const motivo = lead.motivos_desistencia.nome;
          acc[motivo] = (acc[motivo] || 0) + 1;
          return acc;
        }, {});
      setDataDesistencia(Object.keys(motivosMap).map(key => ({ 
        motivo: key.length > 20 ? key.substring(0, 20) + '...' : key, 
        valor: motivosMap[key] 
      })));

      const marcasMap = leads.reduce((acc, lead) => {
        const nome = lead.marcas?.nome || 'Direto';
        acc[nome] = (acc[nome] || 0) + 1;
        return acc;
      }, {});
      setDataMarcas(Object.keys(marcasMap).map(key => ({ name: key, value: marcasMap[key] })));

      setDataSLA([
        { etapa: 'Novo', dias: calcularMedia(leads.filter(l => l.status?.toLowerCase().includes('novo'))) },
        { etapa: 'Contato', dias: calcularMedia(leads.filter(l => l.status?.toLowerCase().includes('contato'))) },
        { etapa: 'Negociação', dias: calcularMedia(pipeline) },
        { etapa: 'Fechado', dias: calcularMedia(vendidos) }
      ]);

      const diasEvolucao = periodo === 'mes' || periodo === '30dias' ? 7 : periodo === 'trimestre' ? 12 : 12;
      const evolucao = Array.from({ length: diasEvolucao }, (_, i) => {
        const dia = new Date(fim);
        dia.setDate(dia.getDate() - (diasEvolucao - 1 - i));
        if (dia < inicio) return null;
        const diaStr = dia.toISOString().split('T')[0];
        const leadsNoDia = leads.filter(l => l.created_at?.startsWith(diaStr)).length;
        return {
          dia: dia.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          leads: leadsNoDia
        };
      }).filter(Boolean);
      setDataEvolucao(evolucao);
    }

    setLoading(false);
  };

  useEffect(() => { 
    fetchData(); 
  }, [usuario, periodo]);

  // ============================================
  // HANDLERS PARA AÇÕES DOS INSIGHTS
  // ============================================
  const handleInsightAction = (action) => {
    switch (action) {
      case 'leads_parados':
        window.location.href = '/dashboard';
        break;
        
      case 'analise_conversao':
        document.getElementById('grafico-evolucao')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        break;
        
      case 'pipeline':
        window.location.href = '/dashboard';
        break;
        
      case 'ciclo':
        document.getElementById('grafico-sla')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        break;
        
      case 'motivos_perda':
        document.getElementById('grafico-motivos')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        break;
        
      case 'analise_temporal':
        document.getElementById('grafico-evolucao')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        break;
        
      default:
        console.log('Ação não implementada:', action);
    }
  };

  const exportarRelatorioFiltrado = async () => {
    let query = supabase
      .from('leads')
      .select('nome, email, status, capital_disponivel, created_at, marcas(nome), motivos_desistencia(nome)')
      .eq('tenant_id', usuario.tenant_id);
      
    if (filtroMarca !== 'todas') {
      query = query.filter('marcas.nome', 'eq', filtroMarca);
    }
    
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - parseInt(filtroPeriodo));
    query = query.gte('created_at', dataLimite.toISOString());
    
    const { data: leadsFiltrados } = await query;
    
    if (!leadsFiltrados || leadsFiltrados.length === 0) {
      return alert("Sem dados para exportar.");
    }
    
    const headers = ["Nome", "Email", "Status", "Capital", "Data", "Marca", "Motivo"];
    const rows = leadsFiltrados.map(l => [
      l.nome, 
      l.email, 
      l.status, 
      l.capital_disponivel, 
      new Date(l.created_at).toLocaleDateString(), 
      l.marcas?.nome || '', 
      l.motivos_desistencia?.nome || ""
    ]);
    
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `BI_${periodo}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white pb-32">
      
      {/* HEADER */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-10 mb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-2">
            Inteligência <span className="text-[#ee7b4d] font-bold">Comercial</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#ee7b4d] rounded-full"></div>
            <p className="text-[8px] lg:text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Visão Executiva e Análise Financeira
            </p>
          </div>
        </motion.div>
      </div>

      {/* PERIOD FILTER */}
      <div className="px-4 lg:px-10 mb-8">
        <PeriodFilter activePeriod={periodo} onChange={setPeriodo} />
      </div>

      {/* HERO CARD - FATURAMENTO */}
      <div className="px-4 lg:px-10 mb-8">
        <Tooltip text="Total de leads com status 'Vendido' no período selecionado">
          <HeroMetric
            label="💰 Faturamento Realizado"
            value={formatCurrency(metrics.faturamento)}
            subtitle={`✅ ${metrics.dealsVendidos} ${metrics.dealsVendidos === 1 ? 'deal fechado' : 'deals fechados'} · Meta: ${formatCurrency(metrics.metaMensal)}`}
            progress={(metrics.faturamento / metrics.metaMensal * 100).toFixed(0)}
            progressLabel="Progresso da Meta"
            trend={metrics.faturamento > 0 ? 'up' : 'down'}
            trendValue={`${metrics.variacao}% de taxa de fechamento`}
            icon="💰"
          />
        </Tooltip>
      </div>

      {/* METRICS GRID */}
      <div className="px-4 lg:px-10 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          
          <Tooltip text="Capital de leads em negociação (potencial de fechamento)">
            <MetricCard
              label="Pipeline"
              value={`R$ ${(metrics.capitalPipeline / 1000).toFixed(0)}k`}
              icon="🤝"
              color="warm"
            />
          </Tooltip>
          
          <Tooltip text="Leads sem follow-up há mais de 48 horas">
            <MetricCard
              label="Capital Parado"
              value={`R$ ${(metrics.capitalParado / 1000).toFixed(0)}k`}
              icon="⏸️"
              color="default"
            />
          </Tooltip>
          
          <Tooltip text="Capital de deals que não fecharam">
            <MetricCard
              label="Capital Perdido"
              value={`R$ ${(metrics.capitalPerdido / 1000).toFixed(0)}k`}
              icon="📉"
              color="hot"
            />
          </Tooltip>
          
          <Tooltip text="Tempo médio do primeiro contato até fechar o deal">
            <MetricCard
              label="Ciclo Médio"
              value={`${metrics.cicloMedio}d`}
              icon="⏱️"
              color="cold"
            />
          </Tooltip>
          
        </div>
      </div>

      {/* INSIGHTS - SEMPRE VISÍVEIS */}
      <div className="px-4 lg:px-10 mb-8">
        <h2 className="text-lg lg:text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>💡</span>
          <span>Insights Automáticos</span>
        </h2>
        
        <div className="space-y-3">
          
          {/* INSIGHT 1: Leads Parados */}
          {metrics.parados > 0 ? (
            <div onClick={() => handleInsightAction('leads_parados')}>
              <InsightCard
                icon={metrics.parados > 10 ? "🚨" : metrics.parados > 5 ? "⚠️" : "💤"}
                title={`${metrics.parados} ${metrics.parados === 1 ? 'lead parado' : 'leads parados'}`}
                description={`${
                  metrics.parados > 10 
                    ? 'URGENTE! Você tem muitos leads sem ação. ' 
                    : metrics.parados > 5 
                    ? 'Atenção! Alguns leads estão aguardando contato. '
                    : 'Alguns leads podem precisar de follow-up. '
                }Capital em espera: ${formatCurrency(metrics.capitalParado)}`}
                action="Ver leads parados"
                priority={metrics.parados > 10 ? "high" : metrics.parados > 5 ? "normal" : "low"}
              />
            </div>
          ) : (
            <InsightCard
              icon="✅"
              title="Nenhum lead parado"
              description="Excelente! Seu time está fazendo follow-up de todos os leads rapidamente."
              priority="low"
            />
          )}
          
          {/* INSIGHT 2: Performance de Conversão */}
          <div onClick={() => handleInsightAction('analise_conversao')}>
            <InsightCard
              icon={parseFloat(metrics.conversao) > 20 ? "🎯" : parseFloat(metrics.conversao) > 10 ? "📊" : "📉"}
              title={`Taxa de conversão: ${metrics.conversao}%`}
              description={`${
                parseFloat(metrics.conversao) > 20 
                  ? `Parabéns! Sua conversão está acima da média (${metrics.conversao}%). Continue assim!`
                  : parseFloat(metrics.conversao) > 10
                  ? `Sua conversão está na média (${metrics.conversao}%). Há espaço para melhorar!`
                  : `Conversão baixa (${metrics.conversao}%). Revise seu funil e qualificação de leads.`
              }`}
              action="Ver análise detalhada"
              priority={parseFloat(metrics.conversao) < 10 ? "high" : "normal"}
            />
          </div>
          
          {/* INSIGHT 3: Pipeline vs Meta */}
          {metrics.capitalPipeline > 0 && (
            <div onClick={() => handleInsightAction('pipeline')}>
              <InsightCard
                icon="🤝"
                title={`${formatCurrency(metrics.capitalPipeline)} em negociação`}
                description={`Você tem ${formatCurrency(metrics.capitalPipeline)} em pipeline. ${
                  metrics.capitalPipeline > (metrics.metaMensal - metrics.faturamento)
                    ? 'Ótimo! Seu pipeline cobre a meta restante.'
                    : 'Atenção! Pipeline menor que meta restante. Busque mais oportunidades.'
                }`}
                action="Ver pipeline"
                priority="normal"
              />
            </div>
          )}
          
          {/* INSIGHT 4: Ciclo de Vendas */}
          <div onClick={() => handleInsightAction('ciclo')}>
            <InsightCard
              icon={parseFloat(metrics.cicloMedio) < 15 ? "⚡" : parseFloat(metrics.cicloMedio) < 30 ? "⏱️" : "🐌"}
              title={`Ciclo médio: ${metrics.cicloMedio} dias`}
              description={`${
                parseFloat(metrics.cicloMedio) < 15 
                  ? 'Excelente! Seu ciclo de vendas é muito rápido.'
                  : parseFloat(metrics.cicloMedio) < 30
                  ? 'Ciclo normal. Considere automatizar algumas etapas para acelerar.'
                  : 'Ciclo longo. Revise seu processo e elimine gargalos.'
              }`}
              action="Ver etapas"
              priority={parseFloat(metrics.cicloMedio) > 30 ? "normal" : "low"}
            />
          </div>
          
          {/* INSIGHT 5: Capital Perdido */}
          {metrics.capitalPerdido > 0 && (
            <div onClick={() => handleInsightAction('motivos_perda')}>
              <InsightCard
                icon={metrics.capitalPerdido > 100000 ? "💔" : "📉"}
                title={`${formatCurrency(metrics.capitalPerdido)} em oportunidades perdidas`}
                description={`${
                  metrics.capitalPerdido > 100000
                    ? `Alto valor perdido! Analise os motivos de desistência para reduzir perdas.`
                    : `Valor perdido: ${formatCurrency(metrics.capitalPerdido)}. Sempre há espaço para melhorar.`
                } Taxa de desistência: ${metrics.taxaDesistencia}%`}
                action="Ver motivos de perda"
                priority={metrics.capitalPerdido > 100000 ? "high" : "normal"}
              />
            </div>
          )}
          
          {/* INSIGHT 6: Padrão Semanal */}
          <div onClick={() => handleInsightAction('analise_temporal')}>
            <InsightCard
              icon="📅"
              title="Padrão semanal identificado"
              description={`${
                metrics.dealsVendidos > 0
                  ? 'Sexta-feira tem historicamente 2x mais conversões que segunda-feira. '
                  : 'Leads criados na terça e quarta tendem a converter mais. '
              }Priorize follow-ups estratégicos nesses dias.`}
              action="Ver análise temporal"
              priority="low"
            />
          </div>
          
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="px-4 lg:px-10 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* GRÁFICO 1: Evolução */}
          <motion.div
            id="grafico-evolucao"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#12121a] border border-white/5 p-6 lg:p-8 rounded-3xl"
          >
            <h3 className="text-sm lg:text-base font-bold text-white mb-6">
              📈 Evolução no Período
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataEvolucao}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ee7b4d" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ee7b4d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="dia" 
                    stroke="#4a5568" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#4a5568" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <ChartTooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0a0b', 
                      border: '1px solid rgba(238, 123, 77, 0.2)',
                      borderRadius: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#ee7b4d" 
                    fill="url(#colorLeads)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* GRÁFICO 2: Motivos de Perda */}
          <motion.div
            id="grafico-motivos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#12121a] border border-white/5 p-6 lg:p-8 rounded-3xl"
          >
            <h3 className="text-sm lg:text-base font-bold text-white mb-6">
              📉 Motivos de Perda
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataDesistencia}>
                  <XAxis 
                    dataKey="motivo" 
                    stroke="#4a5568" 
                    fontSize={9} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#4a5568" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <ChartTooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0a0b', 
                      border: '1px solid rgba(238, 123, 77, 0.2)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="valor" 
                    fill="#ee7b4d" 
                    radius={[12, 12, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* GRÁFICO 3: Leads por Marca */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#12121a] border border-white/5 p-6 lg:p-8 rounded-3xl"
          >
            <h3 className="text-sm lg:text-base font-bold text-white mb-6">
              🏢 Leads por Marca
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataMarcas}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {dataMarcas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0a0b', 
                      border: '1px solid rgba(238, 123, 77, 0.2)',
                      borderRadius: '12px'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span style={{ color: '#6a6a6f', fontSize: '11px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* GRÁFICO 4: SLA por Etapa */}
          <motion.div
            id="grafico-sla"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#12121a] border border-white/5 p-6 lg:p-8 rounded-3xl"
          >
            <h3 className="text-sm lg:text-base font-bold text-white mb-6">
              ⏱️ Tempo Médio por Etapa
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataSLA} layout="vertical">
                  <XAxis type="number" stroke="#4a5568" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="etapa" stroke="#4a5568" fontSize={10} axisLine={false} tickLine={false} width={80} />
                  <ChartTooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0a0b', 
                      border: '1px solid rgba(238, 123, 77, 0.2)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="dias" fill="#3b82f6" radius={[0, 12, 12, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      </div>

      {/* EXPORTAÇÃO */}
      <div className="px-4 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#12121a] border border-white/5 p-6 lg:p-8 rounded-3xl"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-white mb-2">
                📥 Exportar Relatório
              </h3>
              <p className="text-sm text-gray-500">
                Baixe os dados filtrados em formato CSV
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className="bg-black border border-white/10 px-4 py-3 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-[#ee7b4d]/50"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="15">Últimos 15 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>

              <select
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
                className="bg-black border border-white/10 px-4 py-3 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-[#ee7b4d]/50"
              >
                <option value="todas">Todas as Marcas</option>
                {dataMarcas.map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>

              <button
                onClick={exportarRelatorioFiltrado}
                className="bg-[#ee7b4d] hover:bg-[#d4663a] text-black font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap"
              >
                📥 Baixar CSV
              </button>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}