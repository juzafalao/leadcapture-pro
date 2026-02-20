import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function InteligenciaPage() {
  const { usuario } = useAuth();
  const [metrics, setMetrics] = useState({
    receitaAcumulada: 0,
    metaPeriodo: 5000000,
    atingimento: 0,
    restante: 0,
    previsaoIA: 0,
    receitaHoje: 0,
    pace90d: 0
  });
  const [graficoReceita, setGraficoReceita] = useState([]);
  const [ultimasVendas, setUltimasVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  const calcularTempo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    if (horas < 1) return `há ${Math.floor(diff / (1000 * 60))} min`;
    if (horas < 24) return `há ${horas}h`;
    return `há ${Math.floor(horas / 24)}d`;
  };

  const carregarMetricas = useCallback(() => {
    // TODO: Replace with real Supabase queries
    const receita = 3031062;
    const meta = 5000000;
    setMetrics({
      receitaAcumulada: receita,
      metaPeriodo: meta,
      atingimento: (receita / meta) * 100,
      restante: meta - receita,
      previsaoIA: 4000000,
      receitaHoje: 26000,
      pace90d: 2700000
    });
  }, []);

  const carregarGraficoReceita = useCallback(() => {
    // TODO: Replace with real monthly revenue data from Supabase
    const dados = [];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    let acumulado = 0;
    meses.forEach((mes) => {
      acumulado += 500000 + Math.random() * 200000;
      dados.push({
        mes,
        receitaAcumulada: Math.round(acumulado),
        forecast: Math.round(acumulado * 1.1),
        pace90d: Math.round(acumulado * 0.9)
      });
    });
    setGraficoReceita(dados);
  }, []);

  const carregarUltimasVendas = useCallback(async () => {
    if (!usuario?.tenant_id) return;
    const { data } = await supabase
      .from('leads')
      .select('nome, created_at')
      .eq('tenant_id', usuario.tenant_id)
      .eq('categoria', 'Hot')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setUltimasVendas(data.map((v) => ({
        nome: v.nome,
        valor: (Math.random() * 50000 + 20000).toFixed(2),
        tempo: calcularTempo(v.created_at)
      })));
    }
  }, [usuario]);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      carregarMetricas(),
      carregarGraficoReceita(),
      carregarUltimasVendas()
    ]);
    setLoading(false);
  }, [carregarMetricas, carregarGraficoReceita, carregarUltimasVendas]);

  useEffect(() => {
    if (usuario?.tenant_id) {
      carregarDados();
      const interval = setInterval(() => carregarUltimasVendas(), 30000);
      return () => clearInterval(interval);
    }
  }, [usuario, carregarDados, carregarUltimasVendas]);

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
    <div className="min-h-screen bg-[#0a0a0b] p-6">
      {/* Header com Saudação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-black text-white mb-2">
          Olá, <span className="text-[#ee7b4d]">{usuario?.nome}</span> 👋
        </h1>
        <p className="text-white/50 text-lg">DASHBOARD DE GESTÃO DE LEADS</p>
      </motion.div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard
          titulo="RECEITA ACUMULADA"
          valor={formatCurrency(metrics.receitaAcumulada)}
          subtitulo="Realizado no período"
          cor="green"
        />
        <KPICard
          titulo="META DO PERÍODO"
          valor={formatCurrency(metrics.metaPeriodo)}
          subtitulo="Objetivo total"
          cor="blue"
        />
        <KPICard
          titulo="% ATINGIMENTO"
          valor={`${metrics.atingimento.toFixed(1)}%`}
          subtitulo="Da meta total"
          cor="purple"
        />
        <KPICard
          titulo="RESTANTE DA META"
          valor={formatCurrency(metrics.restante)}
          subtitulo="Para bater a meta"
          cor="orange"
        />
      </div>

      {/* Gráfico de Receita + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico Principal */}
        <div className="lg:col-span-2 bg-[#1a1a1c] rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Receita por Período</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={graficoReceita}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="mes" stroke="#ffffff50" />
              <YAxis stroke="#ffffff50" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid #ee7b4d' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="receitaAcumulada"
                stroke="#10b981"
                strokeWidth={3}
                name="Receita Acumulada"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Forecast"
              />
              <Line
                type="monotone"
                dataKey="pace90d"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="3 3"
                name="PACE 90D"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sidebar - Métricas Adicionais */}
        <div className="space-y-4">
          <MetricaMiniCard
            titulo="PERFORMANCE MTD"
            label="PACE 90D MTD"
            valor={formatCurrency(metrics.pace90d)}
            progresso={114.3}
            cor="green"
          />
          <MetricaMiniCard
            titulo="PREVISÃO IA"
            label="FECHAMENTO ESTIMADO"
            valor={formatCurrency(metrics.previsaoIA)}
            badge="AUTO"
            cor="purple"
          />
          <MetricaMiniCard
            titulo="PACE 90D"
            label="PROJEÇÃO HISTÓRICA"
            valor={formatCurrency(metrics.pace90d)}
            badge="HISTÓRICO"
            cor="blue"
          />
        </div>
      </div>

      {/* Últimas Vendas AO VIVO */}
      <div className="bg-[#1a1a1c] rounded-2xl p-6 border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">🔥 ÚLTIMAS VENDAS</h3>
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
              AO VIVO
            </span>
          </div>
          <p className="text-white/50 text-sm">Atualizado: {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        {ultimasVendas.length === 0 ? (
          <p className="text-white/30 text-center py-8">Nenhuma venda recente encontrada</p>
        ) : (
          <div className="space-y-3">
            {ultimasVendas.map((venda, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex justify-between items-center bg-[#0a0a0b] rounded-lg p-4 border border-white/5 hover:border-[#ee7b4d]/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ee7b4d] to-purple-600 flex items-center justify-center text-white font-bold">
                    {venda.nome?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{venda.nome}</p>
                    <p className="text-white/50 text-sm">{venda.tempo}</p>
                  </div>
                </div>
                <p className="text-green-500 font-bold text-lg">
                  {formatCurrency(venda.valor)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ titulo, valor, subtitulo, cor }) {
  const cores = {
    green: 'from-green-600 to-green-500',
    blue: 'from-blue-600 to-blue-500',
    purple: 'from-purple-600 to-purple-500',
    orange: 'from-orange-600 to-orange-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${cores[cor]} rounded-2xl p-6 border border-white/10`}
    >
      <p className="text-white/80 text-xs font-semibold tracking-wider mb-2">{titulo}</p>
      <h2 className="text-white text-3xl font-black mb-1">{valor}</h2>
      <p className="text-white/60 text-sm">{subtitulo}</p>
    </motion.div>
  );
}

function MetricaMiniCard({ titulo, label, valor, progresso, badge, cor }) {
  const cores = {
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    blue: 'bg-blue-600'
  };

  return (
    <div className="bg-[#1a1a1c] rounded-xl p-4 border border-white/10">
      <div className="flex justify-between items-start mb-3">
        <p className="text-white/70 text-xs font-semibold">{titulo}</p>
        {badge && (
          <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
            {badge}
          </span>
        )}
      </div>
      <p className="text-white/50 text-xs mb-2">{label}</p>
      <h3 className="text-white text-2xl font-black">{valor}</h3>
      {progresso && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/50">Progresso</span>
            <span className={`${cores[cor]} text-white font-bold px-2 rounded`}>
              {progresso}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className={`${cores[cor]} h-2 rounded-full transition-all`}
              style={{ width: `${Math.min(progresso, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
