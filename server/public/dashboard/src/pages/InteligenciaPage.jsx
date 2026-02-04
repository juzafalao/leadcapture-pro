import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import PageHeader from '../components/shared/PageHeader';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

export default function InteligenciaPage() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showDiagnostico, setShowDiagnostico] = useState(false);
  const [showParados, setShowParados] = useState(false);
  
  const [filtroPeriodo, setFiltroPeriodo] = useState('30'); 
  const [filtroMarca, setFiltroMarca] = useState('todas');

  const [metrics, setMetrics] = useState({ total: 0, parados: 0, taxaDesistencia: 0, conversao: 0, cicloMedio: 0, capitalPerdido: 0, capitalParado: 0 });
  const [dataMarcas, setDataMarcas] = useState([]);
  const [dataDesistencia, setDataDesistencia] = useState([]);
  const [dataSLA, setDataSLA] = useState([]);
  const [leadsParadosList, setLeadsParadosList] = useState([]);

  const COLORS = ['#ee7b4d', '#3182ce', '#4a5568', '#718096', '#2d3748'];

  const fetchData = async () => {
    if (!usuario?.tenant_id) return;
    setLoading(true);

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*, marcas(id, nome), motivos_desistencia(nome)')
      .eq('tenant_id', usuario.tenant_id);

    if (!error && leads) {
      const total = leads.length;
      const perdidos = leads.filter(l => l.status?.toLowerCase() === 'perdido');
      const convertidos = leads.filter(l => l.status?.toLowerCase() === 'convertido');
      const parados = leads.filter(l => l.status?.toLowerCase() === 'novo' || l.status?.toLowerCase() === 'contato');

      const capPerdido = perdidos.reduce((acc, l) => acc + (parseFloat(l.capital_disponivel) || 0), 0);
      const capParado = parados.reduce((acc, l) => acc + (parseFloat(l.capital_disponivel) || 0), 0);

      const calcularMedia = (lista) => {
        if (lista.length === 0) return 0;
        const soma = lista.reduce((acc, l) => acc + Math.ceil(Math.abs(new Date() - new Date(l.created_at)) / (1000 * 60 * 60 * 24)), 0);
        return (soma / lista.length).toFixed(1);
      };

      setLeadsParadosList(parados);
      setMetrics({
        total,
        parados: parados.length,
        taxaDesistencia: total > 0 ? ((perdidos.length / total) * 100).toFixed(1) : 0,
        conversao: total > 0 ? ((convertidos.length / total) * 100).toFixed(1) : 0,
        cicloMedio: calcularMedia(convertidos),
        capitalPerdido: capPerdido,
        capitalParado: capParado
      });

      const motivosMap = leads.filter(l => l.status?.toLowerCase() === 'perdido' && l.motivos_desistencia)
        .reduce((acc, lead) => {
          const nomeMotivo = lead.motivos_desistencia.nome;
          acc[nomeMotivo] = (acc[nomeMotivo] || 0) + 1;
          return acc;
        }, {});
      setDataDesistencia(Object.keys(motivosMap).map(key => ({ motivo: key, valor: motivosMap[key] })));

      const marcasMap = leads.reduce((acc, lead) => {
        const nome = lead.marcas?.nome || 'Outros';
        acc[nome] = (acc[nome] || 0) + 1;
        return acc;
      }, {});
      setDataMarcas(Object.keys(marcasMap).map(key => ({ name: key, value: marcasMap[key] })));

      setDataSLA([
        { etapa: 'Novo', dias: calcularMedia(leads.filter(l => l.status?.toLowerCase() === 'novo')) },
        { etapa: 'Contato', dias: calcularMedia(leads.filter(l => l.status?.toLowerCase() === 'contato')) },
        { etapa: 'Negociação', dias: calcularMedia(leads.filter(l => l.status?.toLowerCase() === 'negociacao')) },
        { etapa: 'Vendido', dias: calcularMedia(convertidos) }
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [usuario]);

  const exportarRelatorioFiltrado = async () => {
    let query = supabase.from('leads').select('nome, email, status, capital_disponivel, created_at, marcas(nome), motivos_desistencia(nome)').eq('tenant_id', usuario.tenant_id);
    if (filtroMarca !== 'todas') query = query.filter('marcas.nome', 'eq', filtroMarca);
    const dataLimite = new Date(); dataLimite.setDate(dataLimite.getDate() - parseInt(filtroPeriodo));
    query = query.gte('created_at', dataLimite.toISOString());
    const { data: leadsFiltrados } = await query;
    if (!leadsFiltrados || leadsFiltrados.length === 0) return alert("Sem dados.");
    const headers = ["Nome", "Email", "Status", "Capital", "Data", "Marca", "Motivo"];
    const rows = leadsFiltrados.map(l => [l.nome, l.email, l.status, l.capital_disponivel, new Date(l.created_at).toLocaleDateString(), l.marcas?.nome, l.motivos_desistencia?.nome || ""]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `Extração_${filtroPeriodo}dias.csv`; link.click();
  };

  return (
    <div className="p-10 pt-32 bg-[#0a0a0b] min-h-screen text-left text-white">
      <PageHeader title="Relatórios e" highlight="Métricas" description="VISÃO EXECUTIVA E ANÁLISE DE CICLO DE VIDA DO LEAD" />

      {/* KPIs SUPERIORES */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard label="Ciclo Médio" val={`${metrics.cicloMedio} dias`} icon="⏳" color="text-blue-400" />
        <div onClick={() => setShowParados(true)} className="cursor-pointer group">
          <StatCard label="Leads Parados" val={metrics.parados} icon="🛑" color="text-red-500" highlight />
        </div>
        <div onClick={() => setShowDiagnostico(true)} className="cursor-pointer group">
          <StatCard label="Taxa Desistência" val={`${metrics.taxaDesistencia}%`} icon="📉" color="text-orange-400" highlight />
        </div>
        <StatCard label="Conversão Geral" val={`${metrics.conversao}%`} icon="🎯" color="text-[#ee7b4d]" />
      </div>

      {/* TIMELINE SLA */}
      <div className="bg-[#12121a] border border-white/5 p-12 rounded-[3.5rem] shadow-2xl mb-10">
        <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] mb-10 italic opacity-60">Timeline Operacional (SLA por Estágio)</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataSLA}>
              <defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ee7b4d" stopOpacity={0.4}/><stop offset="95%" stopColor="#ee7b4d" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="etapa" stroke="#4a5568" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0d0d12', border: 'none', borderRadius: '15px' }} />
              <Area type="monotone" dataKey="dias" stroke="#ee7b4d" fill="url(#c)" strokeWidth={4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 mb-10">
        <div className="col-span-4 bg-[#12121a] border border-white/5 p-12 rounded-[3.5rem] shadow-2xl">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] mb-12 italic opacity-60">Motivos de Perda (Lead Off)</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataDesistencia}>
                <XAxis dataKey="motivo" stroke="#4a5568" fontSize={9} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="valor" fill="#ee7b4d" radius={[12, 12, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-4 bg-[#12121a] border border-white/5 p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] mb-10 italic opacity-60">Adesão por Marca</p>
          <div className="h-48 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dataMarcas} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">{dataMarcas.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          </div>
          <div className="w-full space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
            {dataMarcas.map((item, i) => (
              <div key={i} className="flex justify-between text-[9px] font-black uppercase bg-white/5 p-2 rounded-lg"><span className="text-gray-400">{item.name}</span><span className="text-[#ee7b4d]">{item.value}</span></div>
            ))}
          </div>
        </div>

        <div className="col-span-4 bg-[#12121a] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-5 right-5 opacity-5 text-8xl italic font-black pointer-events-none uppercase">CSV</div>
          <h3 className="text-2xl font-light text-white mb-1">Central de <span className="text-[#ee7b4d] font-bold italic">Extração</span></h3>
          <div className="space-y-4 mt-8">
            <div className="grid grid-cols-2 gap-3">
              <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="bg-black border border-white/5 p-3 rounded-xl text-[9px] font-black text-white outline-none">
                <option value="7">7 Dias</option><option value="15">15 Dias</option><option value="30">30 Dias</option><option value="90">90 Dias</option>
              </select>
              <select value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)} className="bg-black border border-white/5 p-3 rounded-xl text-[9px] font-black text-white outline-none">
                <option value="todas">Marcas</option>{dataMarcas.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <button onClick={exportarRelatorioFiltrado} className="w-full py-5 bg-[#ee7b4d]/10 border border-[#ee7b4d]/20 text-[#ee7b4d] font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-[#ee7b4d] hover:text-black transition-all">📥 Baixar Base</button>
          </div>
        </div>
      </div>

      {/* MODAL 1: RAIO-X DESISTÊNCIA */}
      {showDiagnostico && (
        <DrillDownModal 
          title="Desistência" 
          subtitle="Análise do capital em risco e principais gargalos de fechamento." 
          onClose={() => setShowDiagnostico(false)}
        >
          <div className="grid grid-cols-2 gap-4 mb-10">
            <MetricBox label="Capital Total Perdido" value={`R$ ${metrics.capitalPerdido.toLocaleString()}`} />
            <MetricBox label="Impacto na Conversão" value={`-${metrics.taxaDesistencia}%`} color="text-orange-400" />
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {dataDesistencia.map((item, i) => (
              <ReasonRow key={i} label={item.motivo} val={`${item.valor} Leads`} progress={(item.valor / metrics.total * 100)} />
            ))}
          </div>
        </DrillDownModal>
      )}

      {/* MODAL 2: RAIO-X LEADS PARADOS */}
      {showParados && (
        <DrillDownModal 
          title="Leads Parados" 
          subtitle="Identificação de leads que aguardam primeiro contato ou follow-up." 
          onClose={() => setShowParados(false)}
        >
          <div className="grid grid-cols-2 gap-4 mb-10">
            <MetricBox label="Oportunidade em Espera" value={`R$ ${metrics.capitalParado.toLocaleString()}`} />
            <MetricBox label="Urgência Média" value="+48 horas" color="text-red-500" />
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {leadsParadosList.map((lead, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-white font-bold">{lead.nome}</p>
                  <p className="text-[9px] text-gray-500 uppercase font-black">{lead.marcas?.nome} • {lead.fonte}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#ee7b4d] font-black">R$ {parseFloat(lead.capital_disponivel || 0).toLocaleString()}</p>
                  <p className="text-[8px] text-gray-600 font-black uppercase">Capital Disponível</p>
                </div>
              </div>
            ))}
          </div>
        </DrillDownModal>
      )}
    </div>
  );
}

// COMPONENTES AUXILIARES PARA LIMPEZA DO CÓDIGO
function StatCard({ label, val, icon, color, highlight }) {
  return (
    <div className={`bg-[#12121a] border ${highlight ? 'border-[#ee7b4d]/30 shadow-[#ee7b4d]/5' : 'border-white/5'} p-8 rounded-[2.5rem] shadow-xl hover:bg-white/[0.02] transition-all relative overflow-hidden`}>
      {highlight && <div className="absolute top-0 right-0 p-2 text-[8px] bg-[#ee7b4d] text-black font-black uppercase tracking-tighter">Detalhar</div>}
      <span className="text-xl mb-4 block">{icon}</span>
      <p className={`text-3xl font-black mb-1 ${color}`}>{val}</p>
      <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{label}</p>
    </div>
  );
}

function DrillDownModal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#12121a] border border-white/10 w-full max-w-2xl rounded-[3.5rem] p-14 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-10 right-10 text-gray-500 hover:text-white text-xl transition-colors">✕</button>
        <p className="text-[10px] text-[#ee7b4d] font-black uppercase tracking-[0.4em] mb-4 italic">Auditoria Inteligente</p>
        <h3 className="text-4xl font-light text-white mb-2">Raio-X de <span className="font-bold italic">{title}</span></h3>
        <p className="text-gray-500 text-sm mb-10">{subtitle}</p>
        {children}
        <button onClick={onClose} className="w-full mt-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all">Fechar</button>
      </div>
    </div>
  );
}

function MetricBox({ label, value, color = "text-white" }) {
  return (
    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
      <p className="text-[9px] text-gray-500 font-black uppercase mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function ReasonRow({ label, val, progress }) {
  return (
    <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex justify-between items-center">
      <span className="text-white font-bold">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-gray-600 font-black uppercase">{val}</span>
        <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#ee7b4d]" style={{ width: `${progress.toFixed(0)}%` }}></div>
        </div>
      </div>
    </div>
  );
}