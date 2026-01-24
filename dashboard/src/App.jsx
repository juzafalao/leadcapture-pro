import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://krcybmownrpfjvqhacup.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyY3libW93bnJwZmp2cWhhY3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NjYwOTAsImV4cCI6MjA1MzI0MjA5MH0.hKwpLe4KMHZ3TLr4MJNse-7wKTq3X3-zL5s3MSQVazs'
const supabase = createClient(supabaseUrl, supabaseKey)

function Logo() {
  return (
    <div className="flex items-center gap-4">
      <img src="/logo.jpg" alt="LeadCapture Pro" className="h-12 w-auto rounded-lg shadow-lg shadow-orange-500/20"/>
      <div className="hidden sm:block">
        <h1 className="text-xl font-bold">
          <span className="text-orange-500">Lead</span>
          <span className="text-blue-400">Capture</span>
          <span className="text-orange-500"> Pro</span>
        </h1>
        <p className="text-xs text-gray-500">Sistema de Captação de Leads</p>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color }) {
  const colors = {
    orange: 'text-orange-500 border-orange-500/30 shadow-orange-500/10',
    red: 'text-red-500 border-red-500/30 shadow-red-500/10',
    amber: 'text-amber-400 border-amber-400/30 shadow-amber-400/10',
    cyan: 'text-cyan-400 border-cyan-400/30 shadow-cyan-400/10',
  }
  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border shadow-lg hover:bg-gray-800/70 transition-all duration-300 hover:scale-[1.02] ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${colors[color].split(' ')[0]}`}>{value}</p>
        </div>
        <div className={`text-4xl opacity-50 ${colors[color].split(' ')[0]}`}>{icon}</div>
      </div>
    </div>
  )
}

function CategoryBadge({ categoria }) {
  const styles = {
    hot: 'bg-gradient-to-r from-red-600 to-orange-500 text-white',
    warm: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900',
    cold: 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white',
  }
  const icons = { hot: '🔥', warm: '⚡', cold: '❄️' }
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${styles[categoria] || styles.cold}`}>
      {icons[categoria]} {categoria?.toUpperCase()}
    </span>
  )
}

function ScoreBadge({ score }) {
  let colorClass = 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  if (score >= 70) colorClass = 'bg-red-500/20 text-red-400 border-red-500/30'
  else if (score >= 40) colorClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  return (
    <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-bold border ${colorClass}`}>{score}</span>
  )
}

function FonteBadge({ fonte }) {
  const styles = {
    whatsapp: 'bg-green-500/20 text-green-400 border-green-500/30',
    instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    website: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    google_ads: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  const icons = { whatsapp: '📱', instagram: '📸', website: '🌐', google_ads: '🔍' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${styles[fonte] || styles.website}`}>
      {icons[fonte]} {fonte}
    </span>
  )
}

function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchLeads() {
      try {
        const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
        if (error) throw error
        setLeads(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
    const channel = supabase.channel('leads-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchLeads()).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const metrics = {
    total: leads.length,
    hot: leads.filter(l => l.categoria === 'hot').length,
    warm: leads.filter(l => l.categoria === 'warm').length,
    cold: leads.filter(l => l.categoria === 'cold').length,
  }

  const dataAtual = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="fixed inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(249,115,22,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}/>
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"/>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"/>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Logo />
          <div className="text-right">
            <p className="text-gray-400 text-sm capitalize">{dataAtual}</p>
            <p className="text-orange-500 text-xs font-medium mt-1">Dashboard v1.3 • Sprint 3</p>
          </div>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Total de Leads" value={metrics.total} icon="📊" color="orange"/>
          <MetricCard title="Leads Hot" value={metrics.hot} icon="🔥" color="red"/>
          <MetricCard title="Leads Warm" value={metrics.warm} icon="⚡" color="amber"/>
          <MetricCard title="Leads Cold" value={metrics.cold} icon="❄️" color="cyan"/>
        </section>

        <section className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2"><span className="text-orange-500">📋</span>Leads Recentes</h2>
            <span className="text-sm text-gray-400">{metrics.total} registros</span>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"/>
                <p className="text-gray-400">Carregando leads...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-red-400 text-lg mb-2">❌ Erro ao carregar</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && leads.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-6xl mb-4">📭</p>
                <p className="text-gray-400 text-lg">Nenhum lead encontrado</p>
                <p className="text-gray-500 text-sm mt-2">Os leads aparecerão aqui quando chegarem</p>
              </div>
            </div>
          )}

          {!loading && !error && leads.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Fonte</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Score</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{lead.nome || 'Sem nome'}</p>
                        {lead.regiao_interesse && <p className="text-xs text-gray-500 mt-1">📍 {lead.regiao_interesse}</p>}
                      </td>
                      <td className="px-6 py-4">
                        {lead.email && <p className="text-sm text-gray-300">✉️ {lead.email}</p>}
                        {lead.telefone && <p className="text-sm text-gray-400">📞 {lead.telefone}</p>}
                      </td>
                      <td className="px-6 py-4"><FonteBadge fonte={lead.fonte}/></td>
                      <td className="px-6 py-4 text-center"><ScoreBadge score={lead.score || 0}/></td>
                      <td className="px-6 py-4 text-center"><CategoryBadge categoria={lead.categoria}/></td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm text-gray-400">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs text-gray-500">{new Date(lead.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <span>Desenvolvido por</span>
            <span className="text-orange-500 font-medium">Juliana Zafalão</span>
            <span>•</span>
            <span>© 2026 LeadCapture Pro</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
