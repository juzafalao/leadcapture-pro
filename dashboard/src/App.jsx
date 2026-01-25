import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// CONFIGURAÇÃO SUPABASE - SUBSTITUA PELA SUA CHAVE COMPLETA
// ============================================================
const supabaseUrl = 'https://krcybmownrpfjvqhacup.supabase.co'
const supabaseKey = 'sb_publishable_Og18wrLgJWFj13FI37SeNg_h9WqYzvq' // ⚠️ COLE SUA CHAVE COMPLETA AQUI
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================
// COMPONENTES
// ============================================================

// Logo no Header
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img 
        src="/logo.jpg" 
        alt="LeadCapture Pro" 
        className="h-12 w-auto rounded-lg shadow-lg shadow-orange-500/20"
        onError={(e) => e.target.style.display = 'none'}
      />
      <div>
        <h1 className="text-2xl font-bold">
          <span className="text-orange-500">Lead</span>
          <span className="text-blue-400">Capture</span>
          <span className="text-orange-500"> Pro</span>
        </h1>
        <p className="text-xs text-gray-500">Sistema de Captação de Leads</p>
      </div>
    </div>
  )
}

// Card de Métrica
function MetricCard({ title, value, icon, color, subtitle }) {
  const colors = {
    orange: 'border-orange-500/30 shadow-orange-500/10 hover:border-orange-500/50',
    blue: 'border-blue-500/30 shadow-blue-500/10 hover:border-blue-500/50',
    red: 'border-red-500/30 shadow-red-500/10 hover:border-red-500/50',
    amber: 'border-amber-500/30 shadow-amber-500/10 hover:border-amber-500/50',
    cyan: 'border-cyan-500/30 shadow-cyan-500/10 hover:border-cyan-500/50',
  }
  
  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border ${colors[color]} shadow-lg hover:bg-gray-800/70 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

// Badge de Categoria
function CategoryBadge({ categoria }) {
  const styles = {
    hot: 'bg-gradient-to-r from-red-500 to-orange-500 text-white',
    warm: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black',
    cold: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
  }
  
  const icons = { hot: '🔥', warm: '⚡', cold: '❄️' }
  const cat = (categoria || 'cold').toLowerCase()
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[cat] || styles.cold}`}>
      {icons[cat]} {cat.toUpperCase()}
    </span>
  )
}

// Badge de Score
function ScoreBadge({ score }) {
  const numScore = Number(score) || 0
  let bgColor = 'bg-blue-500/20 text-blue-400'
  if (numScore >= 70) bgColor = 'bg-red-500/20 text-red-400'
  else if (numScore >= 40) bgColor = 'bg-amber-500/20 text-amber-400'
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-bold ${bgColor}`}>
      {numScore}
    </span>
  )
}

// Badge de Fonte
function FonteBadge({ fonte }) {
  const styles = {
    whatsapp: 'bg-green-500/20 text-green-400',
    instagram: 'bg-pink-500/20 text-pink-400',
    website: 'bg-blue-500/20 text-blue-400',
    google_ads: 'bg-yellow-500/20 text-yellow-400',
    facebook: 'bg-blue-600/20 text-blue-400',
  }
  
  const icons = {
    whatsapp: '📱',
    instagram: '📸',
    website: '🌐',
    google_ads: '📢',
    facebook: '👤',
  }
  
  const f = (fonte || 'website').toLowerCase()
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[f] || styles.website}`}>
      {icons[f] || '🌐'} {f}
    </span>
  )
}

// Componente de Filtros
function Filters({ filters, setFilters, leads }) {
  const fontes = [...new Set(leads.map(l => l.fonte).filter(Boolean))]
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Filtro de Fonte */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-400 mb-1">Fonte</label>
          <select
            value={filters.fonte}
            onChange={(e) => setFilters({...filters, fonte: e.target.value})}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">Todas</option>
            {fontes.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        
        {/* Filtro de Categoria */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-400 mb-1">Categoria</label>
          <select
            value={filters.categoria}
            onChange={(e) => setFilters({...filters, categoria: e.target.value})}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">Todas</option>
            <option value="hot">🔥 HOT</option>
            <option value="warm">⚡ WARM</option>
            <option value="cold">❄️ COLD</option>
          </select>
        </div>
        
        {/* Filtro de Período */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-400 mb-1">Período</label>
          <select
            value={filters.periodo}
            onChange={(e) => setFilters({...filters, periodo: e.target.value})}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">Todo período</option>
            <option value="hoje">Hoje</option>
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Últimos 30 dias</option>
          </select>
        </div>
        
        {/* Busca por nome */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-400 mb-1">Buscar</label>
          <input
            type="text"
            placeholder="Nome, email ou telefone..."
            value={filters.busca}
            onChange={(e) => setFilters({...filters, busca: e.target.value})}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 placeholder-gray-500"
          />
        </div>
        
        {/* Botão Limpar */}
        <button
          onClick={() => setFilters({ fonte: '', categoria: '', periodo: '', busca: '' })}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition"
        >
          Limpar
        </button>
      </div>
    </div>
  )
}

// Gráfico de Barras Simples (sem dependência externa)
function SimpleBarChart({ data, title }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-sm text-gray-400 truncate">{item.label}</div>
            <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
              <div 
                className={`h-full rounded-full ${item.color} transition-all duration-500`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-10 text-sm text-white font-bold text-right">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Gráfico de Pizza Simples
function SimplePieChart({ data, title }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  let cumulativePercent = 0
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        {/* Círculo */}
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {data.map((item, index) => {
              const percent = (item.value / total) * 100
              const strokeDasharray = `${percent} ${100 - percent}`
              const strokeDashoffset = -cumulativePercent
              cumulativePercent += percent
              
              return (
                <circle
                  key={index}
                  cx="18"
                  cy="18"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={item.strokeColor}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{total}</span>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.bgColor}`} />
              <span className="text-sm text-gray-400">{item.label}</span>
              <span className="text-sm text-white font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Gráfico de Linha de Leads por Dia
function LeadsOverTime({ leads }) {
  // Agrupa leads por dia (últimos 7 dias)
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    const count = leads.filter(l => l.created_at?.startsWith(dateStr)).length
    last7Days.push({ day: dayName, date: dateStr, count })
  }
  
  const maxCount = Math.max(...last7Days.map(d => d.count), 1)
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">📈 Leads nos Últimos 7 Dias</h3>
      <div className="flex items-end justify-between gap-2 h-32">
        {last7Days.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs text-white font-bold">{item.count}</span>
            <div 
              className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t transition-all duration-500"
              style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '8px' : '2px' }}
            />
            <span className="text-xs text-gray-400">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// APP PRINCIPAL
// ============================================================
function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    fonte: '',
    categoria: '',
    periodo: '',
    busca: ''
  })
  const [showCharts, setShowCharts] = useState(true)

  // Buscar leads
  useEffect(() => {
    async function fetchLeads() {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setLeads(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLeads()
    
    // Realtime subscription
    const subscription = supabase
      .channel('leads-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads()
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [])

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Filtro de fonte
      if (filters.fonte && lead.fonte !== filters.fonte) return false
      
      // Filtro de categoria
      if (filters.categoria && lead.categoria?.toLowerCase() !== filters.categoria) return false
      
      // Filtro de período
      if (filters.periodo) {
        const leadDate = new Date(lead.created_at)
        const now = new Date()
        
        if (filters.periodo === 'hoje') {
          const today = new Date().toISOString().split('T')[0]
          if (!lead.created_at?.startsWith(today)) return false
        } else if (filters.periodo === '7dias') {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          if (leadDate < weekAgo) return false
        } else if (filters.periodo === '30dias') {
          const monthAgo = new Date()
          monthAgo.setDate(monthAgo.getDate() - 30)
          if (leadDate < monthAgo) return false
        }
      }
      
      // Filtro de busca
      if (filters.busca) {
        const search = filters.busca.toLowerCase()
        const matchName = lead.nome?.toLowerCase().includes(search)
        const matchEmail = lead.email?.toLowerCase().includes(search)
        const matchPhone = lead.telefone?.includes(search)
        if (!matchName && !matchEmail && !matchPhone) return false
      }
      
      return true
    })
  }, [leads, filters])

  // Métricas
  const metrics = useMemo(() => ({
    total: filteredLeads.length,
    hot: filteredLeads.filter(l => l.categoria?.toLowerCase() === 'hot').length,
    warm: filteredLeads.filter(l => l.categoria?.toLowerCase() === 'warm').length,
    cold: filteredLeads.filter(l => l.categoria?.toLowerCase() === 'cold').length,
  }), [filteredLeads])

  // Dados para gráficos
  const chartData = useMemo(() => {
    // Por fonte
    const fontes = {}
    leads.forEach(l => {
      const f = l.fonte || 'outro'
      fontes[f] = (fontes[f] || 0) + 1
    })
    
    const fontesData = Object.entries(fontes).map(([label, value]) => ({
      label,
      value,
      color: {
        whatsapp: 'bg-green-500',
        instagram: 'bg-pink-500',
        website: 'bg-blue-500',
        facebook: 'bg-blue-600',
        google_ads: 'bg-yellow-500'
      }[label] || 'bg-gray-500'
    }))
    
    // Por categoria
    const categoriaData = [
      { label: 'HOT', value: metrics.hot, bgColor: 'bg-red-500', strokeColor: '#ef4444' },
      { label: 'WARM', value: metrics.warm, bgColor: 'bg-amber-500', strokeColor: '#f59e0b' },
      { label: 'COLD', value: metrics.cold, bgColor: 'bg-blue-500', strokeColor: '#3b82f6' },
    ]
    
    return { fontesData, categoriaData }
  }, [leads, metrics])

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-400 mt-4">Carregando leads...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">❌</p>
          <p className="text-red-400 text-xl">Erro ao carregar</p>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(249,115,22,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Logo />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                showCharts ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {showCharts ? '📊 Ocultar Gráficos' : '📊 Mostrar Gráficos'}
            </button>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Atualizado em tempo real</p>
              <p className="text-green-400 text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard 
            title="Total de Leads" 
            value={metrics.total} 
            icon="📊" 
            color="orange"
            subtitle={filters.fonte || filters.categoria || filters.periodo ? '(filtrado)' : ''}
          />
          <MetricCard title="Leads HOT" value={metrics.hot} icon="🔥" color="red" />
          <MetricCard title="Leads WARM" value={metrics.warm} icon="⚡" color="amber" />
          <MetricCard title="Leads COLD" value={metrics.cold} icon="❄️" color="cyan" />
        </div>

        {/* Charts */}
        {showCharts && leads.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <LeadsOverTime leads={leads} />
            <SimpleBarChart 
              title="📱 Leads por Fonte" 
              data={chartData.fontesData}
            />
            <SimplePieChart 
              title="🎯 Leads por Categoria" 
              data={chartData.categoriaData}
            />
          </div>
        )}

        {/* Filters */}
        <Filters filters={filters} setFilters={setFilters} leads={leads} />

        {/* Results count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-400 text-sm">
            Mostrando <span className="text-white font-bold">{filteredLeads.length}</span> de {leads.length} leads
          </p>
        </div>

        {/* Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">📭</p>
              <p className="text-gray-400 text-xl">
                {leads.length === 0 ? 'Nenhum lead cadastrado' : 'Nenhum lead encontrado com os filtros atuais'}
              </p>
              {leads.length > 0 && (
                <button
                  onClick={() => setFilters({ fonte: '', categoria: '', periodo: '', busca: '' })}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-700/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Nome</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Contato</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Fonte</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Score</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{lead.nome || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-300 text-sm">{lead.email || '-'}</p>
                        <p className="text-gray-500 text-xs">{lead.telefone || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <FonteBadge fonte={lead.fonte} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ScoreBadge score={lead.score} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <CategoryBadge categoria={lead.categoria} />
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400 text-sm">
                        {formatDate(lead.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>LeadCapture Pro v1.0 | Desenvolvido por Juliana Zafalão</p>
        </footer>
      </div>
    </div>
  )
}

export default App
