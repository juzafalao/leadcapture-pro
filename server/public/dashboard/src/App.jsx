import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLeads, useMetrics } from './hooks/useLeads'

const queryClient = new QueryClient()

// Logo SVG inline para evitar problemas com caminhos de imagem
const LogoSVG = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ee7b4d" />
        <stop offset="100%" stopColor="#d4663a" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#logoGrad)" />
    <text x="50" y="62" textAnchor="middle" fill="#0a0a0b" fontSize="32" fontWeight="900" fontFamily="system-ui">LC</text>
  </svg>
)

// Watermark SVG
const WatermarkSVG = () => (
  <svg className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.02]" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="watermarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ee7b4d" />
        <stop offset="100%" stopColor="#d4663a" />
      </linearGradient>
    </defs>
    <polygon points="50,10 90,40 75,90 25,90 10,40" fill="url(#watermarkGrad)" />
    <circle cx="85" cy="60" r="12" fill="#1a365d" />
    <path d="M85 55 L85 65 M80 60 L90 60" stroke="#ee7b4d" strokeWidth="3" />
  </svg>
)

const FONTES = {
  all: 'Todas',
  website: 'Website',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  indicacao: 'Indicação',
  evento: 'Evento'
}

const CATEGORIAS = {
  all: 'Todas',
  hot: '🔥 Hot',
  warm: '🌤 Warm',
  cold: '❄️ Cold'
}

const STATUS_OPTIONS = {
  all: 'Todos',
  novo: '🆕 Novo',
  contato: '📞 Em Contato',
  agendado: '📅 Agendado',
  negociacao: '💼 Negociação',
  convertido: '✅ Convertido',
  perdido: '❌ Perdido'
}

// Componente de Navegação
function Sidebar({ currentPage, setCurrentPage }) {
  const navItems = [
    { id: 'dashboard', icon: '◉', label: 'Dashboard' },
    { id: 'relatorios', icon: '◈', label: 'Relatórios' },
    { id: 'marcas', icon: '🏷', label: 'Marcas' },
    { id: 'config', icon: '⚙', label: 'Configurações' }
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-20 bg-[#0a0a0b]/95 border-r border-[#1f1f23] flex flex-col items-center py-8 z-50 backdrop-blur-sm">
      <div className="mb-12">
        <LogoSVG size={40} />
      </div>
      
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group relative
              ${currentPage === item.id 
                ? 'bg-[#1f1f23] text-[#ee7b4d]' 
                : 'text-[#4a4a4f] hover:text-[#f5f5f4] hover:bg-[#1f1f23]/50'}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="absolute left-16 bg-[#1f1f23] text-[#f5f5f4] px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Espaço para Logo do Cliente */}
      <div className="w-12 h-12 rounded-xl bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center overflow-hidden">
        <span className="text-[#4a4a4f] text-[8px] text-center leading-tight font-medium">LOGO<br/>CLIENTE</span>
      </div>
    </aside>
  )
}

// Página de Relatórios
function RelatoriosPage({ leads, metrics, marcas }) {
  const [periodoFilter, setPeriodoFilter] = useState('30')
  const [exportFilters, setExportFilters] = useState({ marca: true, categoria: true, status: true, fonte: true })
  
  const totalLeads = leads?.length || 0
  const leadsHot = leads?.filter(l => l.categoria === 'hot').length || 0
  const leadsWarm = leads?.filter(l => l.categoria === 'warm').length || 0
  const leadsCold = leads?.filter(l => l.categoria === 'cold').length || 0
  const convertidos = leads?.filter(l => l.status === 'convertido').length || 0
  const taxaConversao = totalLeads > 0 ? ((convertidos / totalLeads) * 100).toFixed(1) : 0

  const leadsPorMarca = leads?.reduce((acc, lead) => {
    const marcaObj = marcas.find(m => m.id === lead.marca_id)
    const marca = marcaObj?.nome || 'Sem marca'
    acc[marca] = (acc[marca] || 0) + 1
    return acc
  }, {}) || {}

  const leadsPorStatus = leads?.reduce((acc, lead) => {
    const status = lead.status || 'novo'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {}) || {}

  const leadsPorStatusMarca = leads?.reduce((acc, lead) => {
    const marcaObj = marcas.find(m => m.id === lead.marca_id)
    const marca = marcaObj?.nome || 'Sem marca'
    const status = lead.status || 'novo'
    if (!acc[marca]) acc[marca] = {}
    acc[marca][status] = (acc[marca][status] || 0) + 1
    return acc
  }, {}) || {}

  const exportarCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone']
    if (exportFilters.fonte) headers.push('Fonte')
    if (exportFilters.marca) headers.push('Marca')
    headers.push('Score')
    if (exportFilters.categoria) headers.push('Categoria')
    if (exportFilters.status) headers.push('Status')
    headers.push('Capital Disponível', 'Data')

    const rows = leads?.map(l => {
      const marcaObj = marcas.find(m => m.id === l.marca_id)
      const row = [l.nome || '', l.email || '', l.telefone || '']
      if (exportFilters.fonte) row.push(l.fonte || '')
      if (exportFilters.marca) row.push(marcaObj?.nome || '')
      row.push(l.score || 0)
      if (exportFilters.categoria) row.push(l.categoria || '')
      if (exportFilters.status) row.push(l.status || '')
      row.push(l.capital_disponivel || '', new Date(l.created_at).toLocaleDateString('pt-BR'))
      return row
    }) || []
    
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const toggleFilter = (key) => setExportFilters(prev => ({ ...prev, [key]: !prev[key] }))

  const statusColors = { novo: '#60a5fa', contato: '#a78bfa', agendado: '#f472b6', negociacao: '#fbbf24', convertido: '#4ade80', perdido: '#ef4444' }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] text-[#4a4a4f] font-medium tracking-[0.2em] uppercase mb-1">Análise</p>
          <h1 className="text-2xl font-light tracking-tight">Rela<span className="text-[#ee7b4d] font-semibold">tórios</span></h1>
        </div>
        <select value={periodoFilter} onChange={(e) => setPeriodoFilter(e.target.value)} className="appearance-none bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-2 text-sm text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50 cursor-pointer">
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
        </select>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: totalLeads, color: '#f5f5f4', bg: 'from-[#1f1f23] to-[#17171a]' },
          { label: 'Leads Hot', value: leadsHot, color: '#ee7b4d', bg: 'from-[#2a1f1a] to-[#1a1512]' },
          { label: 'Leads Warm', value: leadsWarm, color: '#60a5fa', bg: 'from-[#1a1f2a] to-[#12151a]' },
          { label: 'Leads Cold', value: leadsCold, color: '#6a6a6f', bg: 'from-[#1f1f23] to-[#17171a]' },
          { label: 'Taxa Conversão', value: `${taxaConversao}%`, color: '#4ade80', bg: 'from-[#1a2a1f] to-[#121a15]' }
        ].map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.bg} p-5 rounded-2xl border border-[#2a2a2f]`}>
            <p className="text-xs text-[#6a6a6f] font-medium uppercase tracking-wide mb-2">{card.label}</p>
            <p className="text-3xl font-light" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Exportação */}
      <div className="bg-[#12121a] rounded-3xl border border-[#1f1f23] p-6 mb-8">
        <h3 className="text-sm font-semibold text-[#f5f5f4] mb-4 uppercase tracking-wider">📥 Exportar Relatório</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xs text-[#6a6a6f]">Incluir colunas:</span>
            {[{ key: 'marca', label: 'Marca' }, { key: 'categoria', label: 'Categoria' }, { key: 'status', label: 'Status' }, { key: 'fonte', label: 'Fonte' }].map((filter) => (
              <label key={filter.key} className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={exportFilters[filter.key]} onChange={() => toggleFilter(filter.key)} className="w-4 h-4 rounded bg-[#1f1f23] border-[#2a2a2f] text-[#ee7b4d] focus:ring-[#ee7b4d]/50 cursor-pointer accent-[#ee7b4d]" />
                <span className="text-sm text-[#8a8a8f] group-hover:text-[#f5f5f4] transition-colors">{filter.label}</span>
              </label>
            ))}
          </div>
          <button onClick={exportarCSV} className="flex items-center gap-2 px-5 py-2 bg-[#ee7b4d] text-[#0a0a0b] rounded-xl font-semibold text-sm hover:bg-[#d4663a] transition-all shadow-lg shadow-[#ee7b4d]/20">
            <span>📥</span><span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Por Marca */}
        <div className="bg-[#12121a] rounded-3xl border border-[#1f1f23] p-6">
          <h3 className="text-sm font-semibold text-[#f5f5f4] mb-6 uppercase tracking-wider">📊 Leads por Marca</h3>
          <div className="space-y-4">
            {Object.entries(leadsPorMarca).map(([marca, count]) => {
              const percent = totalLeads > 0 ? (count / totalLeads) * 100 : 0
              const marcaObj = marcas.find(m => m.nome === marca)
              return (
                <div key={marca}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8a8a8f] flex items-center gap-2">
                      <span>{marcaObj?.emoji || '🏢'}</span><span>{marca}</span>
                    </span>
                    <span className="text-[#f5f5f4] font-medium">{count} ({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="h-3 bg-[#1f1f23] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: marcaObj?.cor || '#6a6a6f' }} />
                  </div>
                </div>
              )
            })}
            {Object.keys(leadsPorMarca).length === 0 && <p className="text-center text-[#4a4a4f] text-sm py-8">Nenhum dado disponível</p>}
          </div>
        </div>

        {/* Por Status */}
        <div className="bg-[#12121a] rounded-3xl border border-[#1f1f23] p-6">
          <h3 className="text-sm font-semibold text-[#f5f5f4] mb-6 uppercase tracking-wider">📈 Leads por Status</h3>
          <div className="space-y-4">
            {Object.entries(leadsPorStatus).map(([status, count]) => {
              const percent = totalLeads > 0 ? (count / totalLeads) * 100 : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8a8a8f]">{STATUS_OPTIONS[status] || status}</span>
                    <span className="text-[#f5f5f4] font-medium">{count} ({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="h-3 bg-[#1f1f23] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: statusColors[status] || '#6a6a6f' }} />
                  </div>
                </div>
              )
            })}
            {Object.keys(leadsPorStatus).length === 0 && <p className="text-center text-[#4a4a4f] text-sm py-8">Nenhum dado disponível</p>}
          </div>
        </div>
      </div>

      {/* Tabela Status x Marca */}
      <div className="bg-[#12121a] rounded-3xl border border-[#1f1f23] p-6 mb-8">
        <h3 className="text-sm font-semibold text-[#f5f5f4] mb-6 uppercase tracking-wider">📊 Status por Marca</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f23]">
                <th className="text-left text-[10px] text-[#4a4a4f] uppercase tracking-wider py-3 px-2">Marca</th>
                <th className="text-center text-[10px] text-[#4a4a4f] uppercase py-3 px-2">🆕 Novo</th>
                <th className="text-center text-[10px] text-[#4a4a4f] uppercase py-3 px-2">📞 Contato</th>
                <th className="text-center text-[10px] text-[#4a4a4f] uppercase py-3 px-2">📅 Agendado</th>
                <th className="text-center text-[10px] text-[#4a4a4f] uppercase py-3 px-2">💼 Negociação</th>
                <th className="text-center text-[10px] text-[#4a4a4f] uppercase py-3 px-2">✅ Convertido</th>
                <th className="text-center text-[10px] text-[#4a4a4f] uppercase py-3 px-2">❌ Perdido</th>
                <th className="text-center text-[10px] text-[#4a4a4f] uppercase py-3 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(leadsPorStatusMarca).map(([marca, statuses]) => {
                const marcaObj = marcas.find(m => m.nome === marca)
                const total = Object.values(statuses).reduce((a, b) => a + b, 0)
                return (
                  <tr key={marca} className="border-b border-[#1f1f23]/50 hover:bg-[#1f1f23]/30">
                    <td className="py-3 px-2"><span className="flex items-center gap-2 text-sm"><span>{marcaObj?.emoji || '🏢'}</span><span className="text-[#f5f5f4]">{marca}</span></span></td>
                    <td className="text-center py-3 px-2"><span className="text-sm text-[#60a5fa]">{statuses.novo || 0}</span></td>
                    <td className="text-center py-3 px-2"><span className="text-sm text-[#a78bfa]">{statuses.contato || 0}</span></td>
                    <td className="text-center py-3 px-2"><span className="text-sm text-[#f472b6]">{statuses.agendado || 0}</span></td>
                    <td className="text-center py-3 px-2"><span className="text-sm text-[#fbbf24]">{statuses.negociacao || 0}</span></td>
                    <td className="text-center py-3 px-2"><span className="text-sm text-[#4ade80]">{statuses.convertido || 0}</span></td>
                    <td className="text-center py-3 px-2"><span className="text-sm text-[#ef4444]">{statuses.perdido || 0}</span></td>
                    <td className="text-center py-3 px-2"><span className="text-sm font-semibold text-[#f5f5f4]">{total}</span></td>
                  </tr>
                )
              })}
              {Object.keys(leadsPorStatusMarca).length === 0 && <tr><td colSpan={8} className="text-center text-[#4a4a4f] text-sm py-8">Nenhum dado disponível</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pizza Categorias */}
      <div className="bg-[#12121a] rounded-3xl border border-[#1f1f23] p-6">
        <h3 className="text-sm font-semibold text-[#f5f5f4] mb-6 uppercase tracking-wider">🎯 Distribuição por Categoria</h3>
        <div className="flex items-center justify-center gap-16">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ee7b4d" strokeWidth="20" strokeDasharray={`${(leadsHot/totalLeads)*251.2 || 0} 251.2`} />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#60a5fa" strokeWidth="20" strokeDasharray={`${(leadsWarm/totalLeads)*251.2 || 0} 251.2`} strokeDashoffset={`${-(leadsHot/totalLeads)*251.2 || 0}`} />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#4a4a4f" strokeWidth="20" strokeDasharray={`${(leadsCold/totalLeads)*251.2 || 0} 251.2`} strokeDashoffset={`${-((leadsHot+leadsWarm)/totalLeads)*251.2 || 0}`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center"><p className="text-3xl font-light text-[#f5f5f4]">{totalLeads}</p><p className="text-[10px] text-[#4a4a4f] uppercase">Total</p></div>
            </div>
          </div>
          <div className="space-y-4">
            {[{ label: 'Hot (70+)', value: leadsHot, color: '#ee7b4d', emoji: '🔥' }, { label: 'Warm (40-69)', value: leadsWarm, color: '#60a5fa', emoji: '🌤' }, { label: 'Cold (0-39)', value: leadsCold, color: '#4a4a4f', emoji: '❄️' }].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-[#8a8a8f]">{item.emoji} {item.label}</span>
                <span className="text-sm font-semibold text-[#f5f5f4]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Página de Marcas - SEM EXCLUSÃO
function MarcasPage({ marcas, setMarcas }) {
  const [showModal, setShowModal] = useState(false)
  const [editingMarca, setEditingMarca] = useState(null)
  const [form, setForm] = useState({ nome: '', emoji: '🏢', cor: '#60a5fa', investimento_minimo: '', investimento_maximo: '', descricao: '' })

  const emojiOptions = ['🏢', '🧺', '🍦', '☕', '📚', '🏪', '🍕', '💼', '🏠', '🚗', '💇', '🏋️', '🎓', '🏥', '🛒', '🐕', '💊']
  const corOptions = ['#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#ef4444', '#06b6d4', '#84cc16']

  const handleSubmit = () => {
    if (!form.nome.trim()) return
    const novaMarca = {
      id: editingMarca?.id || Date.now().toString(),
      ...form,
      investimento_minimo: parseFloat(form.investimento_minimo) || 0,
      investimento_maximo: parseFloat(form.investimento_maximo) || 0
    }
    if (editingMarca) {
      setMarcas(prev => prev.map(m => m.id === editingMarca.id ? novaMarca : m))
    } else {
      setMarcas(prev => [...prev, novaMarca])
    }
    setShowModal(false)
    setEditingMarca(null)
    setForm({ nome: '', emoji: '🏢', cor: '#60a5fa', investimento_minimo: '', investimento_maximo: '', descricao: '' })
  }

  const handleEdit = (marca) => {
    setEditingMarca(marca)
    setForm({ nome: marca.nome, emoji: marca.emoji, cor: marca.cor, investimento_minimo: marca.investimento_minimo?.toString() || '', investimento_maximo: marca.investimento_maximo?.toString() || '', descricao: marca.descricao || '' })
    setShowModal(true)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] text-[#4a4a4f] font-medium tracking-[0.2em] uppercase mb-1">Cadastro</p>
          <h1 className="text-2xl font-light tracking-tight">Mar<span className="text-[#ee7b4d] font-semibold">cas</span></h1>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2 bg-[#ee7b4d] text-[#0a0a0b] rounded-xl font-semibold text-sm hover:bg-[#d4663a] transition-all shadow-lg shadow-[#ee7b4d]/20 hover:scale-105 active:scale-95">
          <span>+</span><span>Nova Marca</span>
        </button>
      </div>

      {/* Aviso importante */}
      <div className="bg-[#1a2e1a] border border-[#2d4a2d]/50 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <span className="text-xl">💡</span>
        <p className="text-sm text-[#4ade80]">Marcas cadastradas não podem ser excluídas pois estão vinculadas aos leads. Você pode editar as informações a qualquer momento.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {marcas.map((marca) => (
          <div key={marca.id} className="bg-[#12121a] rounded-2xl border border-[#1f1f23] p-6 hover:border-[#2a2a2f] transition-all group hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${marca.cor}20` }}>{marca.emoji}</div>
                <div>
                  <h3 className="text-lg font-semibold text-[#f5f5f4]">{marca.nome}</h3>
                  <p className="text-xs text-[#4a4a4f]">{marca.investimento_minimo > 0 && <>R$ {marca.investimento_minimo.toLocaleString()} - R$ {marca.investimento_maximo.toLocaleString()}</>}</p>
                </div>
              </div>
              {/* SÓ EDIÇÃO - SEM EXCLUSÃO */}
              <button onClick={() => handleEdit(marca)} className="w-8 h-8 rounded-lg bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-[#ee7b4d] hover:border-[#ee7b4d]/30 transition-all opacity-0 group-hover:opacity-100">✎</button>
            </div>
            {marca.descricao && <p className="text-sm text-[#6a6a6f] line-clamp-2">{marca.descricao}</p>}
            <div className="mt-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: marca.cor }} />
              <span className="text-[10px] text-[#4a4a4f] uppercase tracking-wider">{marca.cor}</span>
            </div>
          </div>
        ))}
        {marcas.length === 0 && (
          <div className="col-span-2 text-center py-16 text-[#4a4a4f]">
            <p className="text-4xl mb-4 opacity-30">🏷</p>
            <p className="text-sm">Nenhuma marca cadastrada</p>
            <button onClick={() => setShowModal(true)} className="mt-4 text-[#ee7b4d] text-sm hover:underline">Criar primeira marca</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#0a0a0b]/90 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => { setShowModal(false); setEditingMarca(null); }}>
          <div className="bg-[#12121a] border border-[#1f1f23] rounded-3xl p-8 w-full max-w-lg animate-modalIn" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-[#f5f5f4] mb-6">{editingMarca ? 'Editar Marca' : 'Nova Marca'}</h2>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Nome da Marca *</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Lavanderia Express" className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50" />
                <p className="text-[10px] text-[#4a4a4f] mt-1">Padrão: "Tipo + Nome" (Ex: Lavanderia Opt, Escola de Idiomas Best)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map((emoji) => (
                      <button key={emoji} onClick={() => setForm({ ...form, emoji })} className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${form.emoji === emoji ? 'bg-[#ee7b4d]/20 border-2 border-[#ee7b4d]' : 'bg-[#1f1f23] border border-[#2a2a2f] hover:border-[#3a3a3f]'}`}>{emoji}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Cor</label>
                  <div className="flex flex-wrap gap-2">
                    {corOptions.map((cor) => (
                      <button key={cor} onClick={() => setForm({ ...form, cor })} className={`w-9 h-9 rounded-lg transition-all ${form.cor === cor ? 'ring-2 ring-offset-2 ring-offset-[#12121a] ring-white' : ''}`} style={{ backgroundColor: cor }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Investimento Mínimo</label>
                  <input type="number" value={form.investimento_minimo} onChange={(e) => setForm({ ...form, investimento_minimo: e.target.value })} placeholder="100000" className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50" />
                </div>
                <div>
                  <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Investimento Máximo</label>
                  <input type="number" value={form.investimento_maximo} onChange={(e) => setForm({ ...form, investimento_maximo: e.target.value })} placeholder="200000" className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Descrição</label>
                <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Breve descrição da marca..." rows={3} className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-xl px-4 py-3 text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => { setShowModal(false); setEditingMarca(null); }} className="flex-1 py-3 rounded-xl border border-[#2a2a2f] text-[#6a6a6f] font-semibold text-sm hover:bg-[#1f1f23] transition-all">Cancelar</button>
              <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-[#ee7b4d] text-[#0a0a0b] font-semibold text-sm hover:bg-[#d4663a] transition-all">{editingMarca ? 'Salvar' : 'Criar Marca'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Dashboard Page
function DashboardPage({ leads, metrics, marcas }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [marcaFilter, setMarcaFilter] = useState('all')
  const [fonteFilter, setFonteFilter] = useState('all')
  const [categoriaFilter, setCategoriaFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)

  const filteredLeads = leads?.filter(l => {
    const matchSearch = l.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || l.email?.toLowerCase().includes(searchTerm.toLowerCase()) || l.telefone?.includes(searchTerm)
    const matchMarca = marcaFilter === 'all' || l.marca_id === marcaFilter
    const matchFonte = fonteFilter === 'all' || l.fonte === fonteFilter
    const matchCategoria = categoriaFilter === 'all' || l.categoria === categoriaFilter
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchMarca && matchFonte && matchCategoria && matchStatus
  })

  const countByCategory = (cat) => leads?.filter(l => l.categoria === cat).length || 0
  const clearFilters = () => { setSearchTerm(''); setMarcaFilter('all'); setFonteFilter('all'); setCategoriaFilter('all'); setStatusFilter('all'); }
  const hasActiveFilters = searchTerm || marcaFilter !== 'all' || fonteFilter !== 'all' || categoriaFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="p-8">
      {/* Metrics com animação */}
      <section className="mb-10">
        <div className="grid grid-cols-4 gap-4">
          <div onClick={() => setCategoriaFilter('all')} className="group bg-gradient-to-br from-[#1f1f23] to-[#17171a] p-6 rounded-2xl border border-[#2a2a2f] hover:border-[#ee7b4d]/50 transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#ee7b4d]/5 active:scale-95">
            <div className="flex items-start justify-between mb-4"><span className="text-2xl opacity-50 group-hover:opacity-100 transition-all">◉</span><span className="text-[10px] font-medium text-[#4ade80] bg-[#4ade80]/10 px-2 py-1 rounded-full">+12%</span></div>
            <p className="text-4xl font-light text-[#f5f5f4] mb-1 group-hover:text-[#ee7b4d] transition-colors">{metrics?.total || 0}</p>
            <p className="text-xs text-[#6a6a6f] font-medium uppercase">Total Leads</p>
          </div>
          <div onClick={() => setCategoriaFilter('hot')} className="group bg-gradient-to-br from-[#2a1f1a] to-[#1a1512] p-6 rounded-2xl border border-[#3a2a1f] hover:border-[#ee7b4d] transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#ee7b4d]/20 active:scale-95">
            <div className="flex items-start justify-between mb-4"><span className="text-2xl group-hover:animate-bounce">🔥</span><span className="text-[10px] font-medium text-[#ee7b4d] bg-[#ee7b4d]/10 px-2 py-1 rounded-full">Prioridade</span></div>
            <p className="text-4xl font-light text-[#ee7b4d] mb-1">{countByCategory('hot')}</p>
            <p className="text-xs text-[#6a6a6f] font-medium uppercase">Leads Hot</p>
          </div>
          <div onClick={() => setCategoriaFilter('warm')} className="group bg-gradient-to-br from-[#1a1f2a] to-[#12151a] p-6 rounded-2xl border border-[#2a2a3f] hover:border-[#60a5fa] transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#60a5fa]/10 active:scale-95">
            <div className="flex items-start justify-between mb-4"><span className="text-2xl opacity-50 group-hover:opacity-100">🌤</span><span className="text-[10px] font-medium text-[#60a5fa] bg-[#60a5fa]/10 px-2 py-1 rounded-full">Análise</span></div>
            <p className="text-4xl font-light text-[#60a5fa] mb-1">{countByCategory('warm')}</p>
            <p className="text-xs text-[#6a6a6f] font-medium uppercase">Leads Warm</p>
          </div>
          <div onClick={() => setCategoriaFilter('cold')} className="group bg-gradient-to-br from-[#1f1f23] to-[#17171a] p-6 rounded-2xl border border-[#2a2a2f] hover:border-[#6a6a6f] transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1 hover:shadow-xl active:scale-95">
            <div className="flex items-start justify-between mb-4"><span className="text-2xl opacity-50 group-hover:opacity-100">❄️</span><span className="text-[10px] font-medium text-[#6a6a6f] bg-[#6a6a6f]/10 px-2 py-1 rounded-full">Frios</span></div>
            <p className="text-4xl font-light text-[#6a6a6f] mb-1">{countByCategory('cold')}</p>
            <p className="text-xs text-[#6a6a6f] font-medium uppercase">Leads Cold</p>
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="bg-[#12121a] rounded-3xl border border-[#1f1f23] overflow-hidden">
        {/* Filtros */}
        <div className="p-6 border-b border-[#1f1f23] bg-[#0f0f14]">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Buscar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a4a4f]">🔍</span>
                <input type="text" placeholder="Nome, email ou telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl pl-11 pr-4 py-3 text-sm placeholder:text-[#4a4a4f] focus:outline-none focus:border-[#ee7b4d]/50" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Marca</label>
              <select value={marcaFilter} onChange={(e) => setMarcaFilter(e.target.value)} className="appearance-none bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-4 py-3 pr-10 text-sm text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50 cursor-pointer min-w-[180px]">
                <option value="all">◎ Todas as Marcas</option>
                {marcas.map((m) => (<option key={m.id} value={m.id}>{m.emoji} {m.nome}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Fonte</label>
              <select value={fonteFilter} onChange={(e) => setFonteFilter(e.target.value)} className="appearance-none bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-4 py-3 pr-10 text-sm text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50 cursor-pointer min-w-[130px]">
                {Object.entries(FONTES).map(([key, nome]) => (<option key={key} value={key}>{nome}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Categoria</label>
              <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className="appearance-none bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-4 py-3 pr-10 text-sm text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50 cursor-pointer min-w-[130px]">
                {Object.entries(CATEGORIAS).map(([key, nome]) => (<option key={key} value={key}>{nome}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#4a4a4f] uppercase tracking-wider block mb-2">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-xl px-4 py-3 pr-10 text-sm text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50 cursor-pointer min-w-[150px]">
                {Object.entries(STATUS_OPTIONS).map(([key, nome]) => (<option key={key} value={key}>{nome}</option>))}
              </select>
            </div>
            {hasActiveFilters && (<button onClick={clearFilters} className="px-4 py-3 rounded-xl border border-[#ee7b4d]/30 text-[#ee7b4d] text-sm font-medium hover:bg-[#ee7b4d]/10">Limpar</button>)}
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2 text-xs text-[#6a6a6f]">
              <span>Filtros:</span>
              {searchTerm && <span className="px-2 py-1 bg-[#1f1f23] rounded-lg text-[#f5f5f4]">"{searchTerm}"</span>}
              {marcaFilter !== 'all' && <span className="px-2 py-1 bg-[#1f1f23] rounded-lg text-[#f5f5f4]">{marcas.find(m => m.id === marcaFilter)?.nome}</span>}
              {fonteFilter !== 'all' && <span className="px-2 py-1 bg-[#1f1f23] rounded-lg text-[#f5f5f4]">{FONTES[fonteFilter]}</span>}
              {categoriaFilter !== 'all' && <span className="px-2 py-1 bg-[#1f1f23] rounded-lg text-[#f5f5f4]">{CATEGORIAS[categoriaFilter]}</span>}
              {statusFilter !== 'all' && <span className="px-2 py-1 bg-[#1f1f23] rounded-lg text-[#f5f5f4]">{STATUS_OPTIONS[statusFilter]}</span>}
              <span className="ml-2">→ {filteredLeads?.length || 0} resultado(s)</span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#1f1f23] text-[10px] font-semibold text-[#4a4a4f] uppercase tracking-wider bg-[#0d0d12]">
          <div className="col-span-2">Lead</div>
          <div className="col-span-2">Contato</div>
          <div className="col-span-2">Marca</div>
          <div className="col-span-1">Fonte</div>
          <div className="col-span-1 text-center">Score</div>
          <div className="col-span-1 text-center">Categoria</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>

        {/* Body */}
        <div className="divide-y divide-[#1f1f23]/50">
          {filteredLeads?.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-4xl mb-4 opacity-30">🔍</div>
              <p className="text-[#4a4a4f] text-sm mb-2">Nenhum lead encontrado</p>
              {hasActiveFilters && <button onClick={clearFilters} className="text-[#ee7b4d] text-sm hover:underline">Limpar filtros</button>}
            </div>
          ) : (
            filteredLeads?.map((lead) => {
              const marca = marcas.find(m => m.id === lead.marca_id) || { nome: 'Sem marca', emoji: '🏢', cor: '#6a6a6f' }
              return (
                <div key={lead.id} onClick={() => setSelectedLead(lead)} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#1f1f23]/30 cursor-pointer group">
                  <div className="col-span-2"><p className="font-medium text-[#f5f5f4] group-hover:text-[#ee7b4d] truncate">{lead.nome || 'Sem nome'}</p></div>
                  <div className="col-span-2">
                    <p className="text-sm text-[#8a8a8f] truncate">{lead.email || '—'}</p>
                    <p className="text-xs text-[#4a4a4f]">{lead.telefone || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${marca.cor}15`, color: marca.cor }}>
                      <span>{marca.emoji}</span><span className="truncate max-w-[100px]">{marca.nome}</span>
                    </span>
                  </div>
                  <div className="col-span-1"><span className="text-xs text-[#6a6a6f] capitalize">{lead.fonte || 'Website'}</span></div>
                  <div className="col-span-1 text-center">
                    <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold ${lead.score >= 70 ? 'bg-[#ee7b4d]/20 text-[#ee7b4d]' : lead.score >= 40 ? 'bg-[#60a5fa]/20 text-[#60a5fa]' : 'bg-[#4a4a4f]/20 text-[#6a6a6f]'}`}>{lead.score || 0}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${lead.categoria === 'hot' ? 'bg-[#ee7b4d]/20 text-[#ee7b4d]' : lead.categoria === 'warm' ? 'bg-[#60a5fa]/20 text-[#60a5fa]' : 'bg-[#4a4a4f]/20 text-[#6a6a6f]'}`}>{lead.categoria || 'cold'}</span>
                  </div>
                  <div className="col-span-2"><span className="text-xs text-[#8a8a8f]">{STATUS_OPTIONS[lead.status] || '🆕 Novo'}</span></div>
                  <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                    <button className="w-7 h-7 rounded-lg bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-[#f5f5f4] text-xs">✎</button>
                    <button className="w-7 h-7 rounded-lg bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-[#4ade80] text-xs">✓</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {selectedLead && <LeadDetailModal lead={selectedLead} marcas={marcas} onClose={() => setSelectedLead(null)} />}
    </div>
  )
}

// Modal de Detalhes
function LeadDetailModal({ lead, marcas, onClose }) {
  const [observacao, setObservacao] = useState(lead.observacao || '')
  const marca = marcas.find(m => m.id === lead.marca_id) || { nome: 'Sem marca', emoji: '🏢', cor: '#6a6a6f' }

  return (
    <div className="fixed inset-0 bg-[#0a0a0b]/90 backdrop-blur-sm flex items-center justify-end z-[100]" onClick={onClose}>
      <div className="h-full w-full max-w-xl bg-[#12121a] border-l border-[#1f1f23] p-8 overflow-y-auto animate-slideIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-2">Detalhes do Lead</p>
            <h2 className="text-2xl font-light text-[#f5f5f4]">{lead.nome || 'Lead'}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-[#1f1f23] border border-[#2a2a2f] flex items-center justify-center text-[#6a6a6f] hover:text-[#f5f5f4]">✕</button>
        </div>

        <div className="mb-8">
          <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl ${lead.score >= 70 ? 'bg-[#ee7b4d]/10 border border-[#ee7b4d]/20' : lead.score >= 40 ? 'bg-[#60a5fa]/10 border border-[#60a5fa]/20' : 'bg-[#4a4a4f]/10 border border-[#4a4a4f]/20'}`}>
            <span className={`text-3xl font-light ${lead.score >= 70 ? 'text-[#ee7b4d]' : lead.score >= 40 ? 'text-[#60a5fa]' : 'text-[#6a6a6f]'}`}>{lead.score || 0}</span>
            <div>
              <p className={`text-sm font-semibold ${lead.score >= 70 ? 'text-[#ee7b4d]' : lead.score >= 40 ? 'text-[#60a5fa]' : 'text-[#6a6a6f]'}`}>{lead.score >= 70 ? 'Lead Hot 🔥' : lead.score >= 40 ? 'Lead Warm 🌤' : 'Lead Cold ❄️'}</p>
              <p className="text-[10px] text-[#4a4a4f] uppercase">Score de Qualificação</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {[
            { label: 'E-mail', value: lead.email, icon: '✉' },
            { label: 'Telefone', value: lead.telefone, icon: '✆' },
            { label: 'Fonte', value: lead.fonte, icon: '◎' },
            { label: 'Marca', value: marca.nome, icon: marca.emoji },
            { label: 'Capital Disponível', value: lead.capital_disponivel ? `R$ ${lead.capital_disponivel.toLocaleString()}` : null, icon: '💰' }
          ].map((item, i) => (
            <div key={i} className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-2xl p-4 flex items-center gap-4">
              <span className="text-xl opacity-50">{item.icon}</span>
              <div>
                <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-0.5">{item.label}</p>
                <p className="text-[#f5f5f4] font-medium">{item.value || '—'}</p>
              </div>
            </div>
          ))}
        </div>

        {lead.mensagem_original && (
          <div className="mb-6">
            <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-3">Mensagem do Lead</p>
            <div className="bg-[#1f1f23]/50 border border-[#2a2a2f] rounded-2xl p-5">
              <p className="text-sm text-[#8a8a8f] italic">"{lead.mensagem_original}"</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-3">Observações <span className="text-[#6a6a6f]">({observacao.length}/700)</span></p>
          <textarea value={observacao} onChange={(e) => setObservacao(e.target.value.slice(0, 700))} placeholder="Adicione observações..." rows={4} className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-2xl p-4 text-[#f5f5f4] text-sm focus:outline-none focus:border-[#ee7b4d]/50 resize-none" />
        </div>

        <div className="mb-8">
          <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-3">Status do Lead</p>
          <select defaultValue={lead.status || 'novo'} className="w-full bg-[#1f1f23] border border-[#2a2a2f] rounded-2xl p-4 text-[#f5f5f4] focus:outline-none focus:border-[#ee7b4d]/50 appearance-none cursor-pointer">
            {Object.entries(STATUS_OPTIONS).filter(([k]) => k !== 'all').map(([key, nome]) => (<option key={key} value={key}>{nome}</option>))}
          </select>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border border-[#2a2a2f] text-[#6a6a6f] font-semibold text-sm hover:bg-[#1f1f23] hover:text-[#f5f5f4]">Cancelar</button>
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-[#ee7b4d] text-[#0a0a0b] font-semibold text-sm hover:bg-[#d4663a] shadow-lg shadow-[#ee7b4d]/20">Salvar</button>
        </div>
      </div>
    </div>
  )
}

// Main
function DashboardContent() {
  const { data: leads, isLoading } = useLeads()
  const { data: metrics } = useMetrics()
  
  const [currentPage, setCurrentPage] = useState('dashboard')
  
  // Marcas que virão do banco de dados
  const [marcas, setMarcas] = useState([
    { id: '1', nome: 'Lavanderia Opt', emoji: '🧺', cor: '#60a5fa', investimento_minimo: 120000, investimento_maximo: 180000, descricao: 'Franquia de lavanderia express premium' },
    { id: '2', nome: 'Lavanderia Express', emoji: '🧺', cor: '#3b82f6', investimento_minimo: 80000, investimento_maximo: 120000, descricao: 'Franquia de lavanderia modelo compacto' },
    { id: '3', nome: 'Sorveteria Gelato', emoji: '🍦', cor: '#f472b6', investimento_minimo: 60000, investimento_maximo: 100000, descricao: 'Franquia de sorvetes artesanais italianos' },
    { id: '4', nome: 'Cafeteria Aroma', emoji: '☕', cor: '#a78bfa', investimento_minimo: 100000, investimento_maximo: 150000, descricao: 'Franquia de café gourmet e confeitaria' },
    { id: '5', nome: 'Escola de Idiomas Best', emoji: '📚', cor: '#34d399', investimento_minimo: 150000, investimento_maximo: 250000, descricao: 'Franquia de ensino de idiomas com metodologia exclusiva' },
    { id: '6', nome: 'Farmácia Dog+', emoji: '🐕', cor: '#fbbf24', investimento_minimo: 90000, investimento_maximo: 140000, descricao: 'Franquia de farmácia veterinária' },
    { id: '7', nome: 'Farmácia Pessoas', emoji: '💊', cor: '#ef4444', investimento_minimo: 200000, investimento_maximo: 350000, descricao: 'Franquia de farmácia popular' }
  ])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ee7b4d]/20 border-t-[#ee7b4d] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ee7b4d] font-light tracking-[0.3em] text-xs uppercase">Carregando</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#f5f5f4] antialiased relative overflow-hidden">
      <WatermarkSVG />
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main className="ml-20 min-h-screen relative z-10">
        <header className="sticky top-0 z-40 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-[#1f1f23]/50">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LogoSVG size={40} />
              <div>
                <p className="text-[10px] text-[#4a4a4f] uppercase tracking-wider mb-1">
                  {currentPage === 'dashboard' && 'Visão Geral'}
                  {currentPage === 'relatorios' && 'Análise'}
                  {currentPage === 'marcas' && 'Cadastro'}
                  {currentPage === 'config' && 'Sistema'}
                </p>
                <h1 className="text-2xl font-light">Lead<span className="text-[#ee7b4d] font-semibold">Capture</span> Pro</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1a2e1a] border border-[#2d4a2d]/50 rounded-full">
              <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></span>
              <span className="text-[11px] font-medium text-[#4ade80]">Sistema Online</span>
            </div>
          </div>
        </header>

        {currentPage === 'dashboard' && <DashboardPage leads={leads} metrics={metrics} marcas={marcas} />}
        {currentPage === 'relatorios' && <RelatoriosPage leads={leads} metrics={metrics} marcas={marcas} />}
        {currentPage === 'marcas' && <MarcasPage marcas={marcas} setMarcas={setMarcas} />}
        {currentPage === 'config' && (<div className="p-8 text-center text-[#4a4a4f]"><p className="text-4xl mb-4 opacity-30">⚙</p><p>Configurações em desenvolvimento</p></div>)}

        <footer className="px-8 py-6 border-t border-[#1f1f23] mt-8">
          <p className="text-center text-[10px] text-slate-700 font-black uppercase tracking-[0.5em] opacity-30">© 2026 LeadCapture Pro — Desenvolvido por: Juliana Zafalão</p>
        </footer>
      </main>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes modalIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
        .animate-modalIn { animation: modalIn 0.2s ease-out forwards; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #12121a; }
        ::-webkit-scrollbar-thumb { background: #2a2a2f; border-radius: 3px; }
        ::selection { background: #ee7b4d30; color: #f5f5f4; }
        select option { background: #1f1f23; color: #f5f5f4; }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  )
}