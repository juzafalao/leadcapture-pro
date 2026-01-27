import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// CONFIGURAÇÃO SUPABASE
// ⚠️ SUBSTITUA PELA SUA CHAVE COMPLETA
// ============================================================
const supabaseUrl = 'https://krcybmownrpfjvqhacup.supabase.co'
const supabaseKey = 'sb_publishable_Og18wrLgJWFj13FI37SeNg_h9WqYzvq'
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================
// CONSTANTES
// ============================================================
const STATUS_CONFIG = {
  novo: { label: 'Novo', color: 'blue', icon: '🆕' },
  em_analise: { label: 'Em Análise', color: 'gray', icon: '🔍' },
  qualificado: { label: 'Qualificado', color: 'green', icon: '✅' },
  em_contato: { label: 'Em Contato', color: 'yellow', icon: '📞' },
  proposta: { label: 'Proposta', color: 'purple', icon: '📄' },
  negociacao: { label: 'Negociação', color: 'orange', icon: '🤝' },
  convertido: { label: 'Convertido', color: 'emerald', icon: '🎉' },
  perdido: { label: 'Perdido', color: 'red', icon: '❌' },
  nurturing: { label: 'Nurturing', color: 'indigo', icon: '🌱' },
}

const CATEGORIA_CONFIG = {
  hot: { label: 'HOT', color: 'from-red-500 to-orange-500', icon: '🔥' },
  warm: { label: 'WARM', color: 'from-amber-500 to-yellow-500', icon: '⚡' },
  cold: { label: 'COLD', color: 'from-blue-500 to-cyan-500', icon: '❄️' },
}

const FONTE_CONFIG = {
  whatsapp: { label: 'WhatsApp', color: 'green', icon: '📱' },
  instagram: { label: 'Instagram', color: 'pink', icon: '📸' },
  website: { label: 'Website', color: 'blue', icon: '🌐' },
  facebook: { label: 'Facebook', color: 'blue', icon: '👤' },
  google_ads: { label: 'Google Ads', color: 'yellow', icon: '📢' },
  indicacao: { label: 'Indicação', color: 'purple', icon: '👥' },
  outro: { label: 'Outro', color: 'gray', icon: '📋' },
}

// ============================================================
// COMPONENTES
// ============================================================

// Logo e Header
function Logo({ tenant }) {
  return (
    <div className="flex items-center gap-3">
      {tenant?.logo_url ? (
        <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-auto rounded-lg" />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
          {tenant?.name?.charAt(0) || 'L'}
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold text-white">
          {tenant?.name || 'LeadCapture Pro'}
        </h1>
        <p className="text-xs text-gray-500">Sistema de Captação de Leads</p>
      </div>
    </div>
  )
}

// Seletor de Tenant
function TenantSelector({ tenants, currentTenant, onSelect }) {
  if (tenants.length <= 1) return null
  
  return (
    <select
      value={currentTenant?.id || ''}
      onChange={(e) => onSelect(tenants.find(t => t.id === e.target.value))}
      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
    >
      {tenants.map(t => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  )
}

// Card de Métrica
function MetricCard({ title, value, icon, color, subtitle, onClick }) {
  const colors = {
    orange: 'border-orange-500/30 shadow-orange-500/10 hover:border-orange-500/50',
    blue: 'border-blue-500/30 shadow-blue-500/10 hover:border-blue-500/50',
    red: 'border-red-500/30 shadow-red-500/10 hover:border-red-500/50',
    amber: 'border-amber-500/30 shadow-amber-500/10 hover:border-amber-500/50',
    cyan: 'border-cyan-500/30 shadow-cyan-500/10 hover:border-cyan-500/50',
    green: 'border-green-500/30 shadow-green-500/10 hover:border-green-500/50',
    purple: 'border-purple-500/30 shadow-purple-500/10 hover:border-purple-500/50',
  }
  
  return (
    <div 
      className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border ${colors[color]} shadow-lg hover:bg-gray-800/70 transition-all duration-300 hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  )
}

// Badge de Status
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.novo
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    gray: 'bg-gray-500/20 text-gray-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/20 text-red-400',
    indigo: 'bg-indigo-500/20 text-indigo-400',
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>
      {config.icon} {config.label}
    </span>
  )
}

// Badge de Categoria
function CategoryBadge({ categoria }) {
  const config = CATEGORIA_CONFIG[categoria?.toLowerCase()] || CATEGORIA_CONFIG.cold
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${config.color} text-white`}>
      {config.icon} {config.label}
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
  const config = FONTE_CONFIG[fonte?.toLowerCase()] || FONTE_CONFIG.outro
  const colorClasses = {
    green: 'bg-green-500/20 text-green-400',
    pink: 'bg-pink-500/20 text-pink-400',
    blue: 'bg-blue-500/20 text-blue-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/20 text-purple-400',
    gray: 'bg-gray-500/20 text-gray-400',
  }
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colorClasses[config.color]}`}>
      {config.icon} {config.label}
    </span>
  )
}

// Componente de Filtros
function Filters({ filters, setFilters, leads }) {
  const fontes = [...new Set(leads.map(l => l.fonte).filter(Boolean))]
  const statuses = [...new Set(leads.map(l => l.status).filter(Boolean))]
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 mb-6">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Busca */}
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
        
        {/* Status */}
        <div className="w-36">
          <label className="block text-xs text-gray-400 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.icon} {val.label}</option>
            ))}
          </select>
        </div>
        
        {/* Categoria */}
        <div className="w-32">
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
        
        {/* Fonte */}
        <div className="w-32">
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
        
        {/* Período */}
        <div className="w-36">
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
        
        {/* Limpar */}
        <button
          onClick={() => setFilters({ fonte: '', categoria: '', periodo: '', busca: '', status: '' })}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition"
        >
          Limpar
        </button>
      </div>
    </div>
  )
}

// Modal de Detalhes do Lead
function LeadDetailModal({ lead, onClose, onUpdate }) {
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState(lead?.status || 'novo')
  const [novaInteracao, setNovaInteracao] = useState('')
  const [tipoInteracao, setTipoInteracao] = useState('nota')
  const [interacoes, setInteracoes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (lead?.id) {
      loadInteracoes()
    }
  }, [lead?.id])

  const loadInteracoes = async () => {
    const { data } = await supabase
      .from('interacoes')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
    setInteracoes(data || [])
  }

  const handleStatusChange = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', lead.id)
    
    if (!error) {
      setEditingStatus(false)
      onUpdate()
    }
    setLoading(false)
  }

  const handleAddInteracao = async () => {
    if (!novaInteracao.trim()) return
    setLoading(true)
    
    await supabase.from('interacoes').insert({
      lead_id: lead.id,
      tenant_id: lead.tenant_id,
      tipo: tipoInteracao,
      conteudo: novaInteracao,
      direcao: 'saida'
    })
    
    await supabase.from('leads').update({ 
      data_ultimo_contato: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', lead.id)
    
    setNovaInteracao('')
    loadInteracoes()
    onUpdate()
    setLoading(false)
  }

  if (!lead) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{lead.nome || 'Lead sem nome'}</h2>
            <div className="flex gap-2 mt-2">
              <CategoryBadge categoria={lead.categoria} />
              <ScoreBadge score={lead.score} />
              <FonteBadge fonte={lead.fonte} />
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Informações */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Email</p>
              <p className="text-white">{lead.email || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Telefone</p>
              <p className="text-white">{lead.telefone || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Região</p>
              <p className="text-white">{lead.regiao_interesse || lead.dados_extras?.regiao || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Capital</p>
              <p className="text-white">{lead.capital_disponivel || lead.dados_extras?.capital || '-'}</p>
            </div>
          </div>
          
          {/* Status */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-2">Status</p>
            {editingStatus ? (
              <div className="flex gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <option key={key} value={key}>{val.icon} {val.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleStatusChange}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditingStatus(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <StatusBadge status={lead.status} />
                <button
                  onClick={() => setEditingStatus(true)}
                  className="text-sm text-orange-400 hover:text-orange-300"
                >
                  Alterar
                </button>
              </div>
            )}
          </div>
          
          {/* Mensagem Original */}
          {lead.mensagem_original && (
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">Mensagem Original</p>
              <div className="bg-gray-900/50 rounded-lg p-3 text-gray-300 text-sm">
                {lead.mensagem_original}
              </div>
            </div>
          )}
          
          {/* Adicionar Interação */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-2">Adicionar Interação</p>
            <div className="flex gap-2 mb-2">
              <select
                value={tipoInteracao}
                onChange={(e) => setTipoInteracao(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="nota">📝 Nota</option>
                <option value="ligacao">📞 Ligação</option>
                <option value="whatsapp">📱 WhatsApp</option>
                <option value="email">📧 Email</option>
                <option value="reuniao">🤝 Reunião</option>
              </select>
              <input
                type="text"
                placeholder="Descreva a interação..."
                value={novaInteracao}
                onChange={(e) => setNovaInteracao(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
              <button
                onClick={handleAddInteracao}
                disabled={loading || !novaInteracao.trim()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
          
          {/* Histórico de Interações */}
          <div>
            <p className="text-gray-400 text-sm mb-2">Histórico ({interacoes.length})</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {interacoes.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma interação registrada</p>
              ) : (
                interacoes.map(int => (
                  <div key={int.id} className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-orange-400">{int.tipo}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(int.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{int.conteudo}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between">
          <div className="flex gap-2">
            {lead.telefone && (
              <a
                href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
              >
                📱 WhatsApp
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                📧 Email
              </a>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// Gráficos
function SimpleBarChart({ data, title }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
      <h3 className="text-base font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-16 text-xs text-gray-400 truncate">{item.label}</div>
            <div className="flex-1 bg-gray-700 rounded-full h-5 overflow-hidden">
              <div 
                className={`h-full rounded-full ${item.color} transition-all duration-500`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-8 text-xs text-white font-bold text-right">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LeadsOverTime({ leads }) {
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    const count = leads.filter(l => l.created_at?.startsWith(dateStr)).length
    last7Days.push({ day: dayName, count })
  }
  
  const maxCount = Math.max(...last7Days.map(d => d.count), 1)
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
      <h3 className="text-base font-semibold text-white mb-4">📈 Últimos 7 Dias</h3>
      <div className="flex items-end justify-between gap-1 h-24">
        {last7Days.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-white font-bold">{item.count}</span>
            <div 
              className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t transition-all duration-500"
              style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '4px' : '2px' }}
            />
            <span className="text-xs text-gray-400">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Funil de Conversão
function FunnelChart({ leads }) {
  const funnel = [
    { label: 'Total', value: leads.length, color: 'bg-blue-500' },
    { label: 'Qualificados', value: leads.filter(l => !['novo', 'em_analise'].includes(l.status)).length, color: 'bg-green-500' },
    { label: 'Em Contato', value: leads.filter(l => ['em_contato', 'proposta', 'negociacao'].includes(l.status)).length, color: 'bg-yellow-500' },
    { label: 'Proposta', value: leads.filter(l => ['proposta', 'negociacao'].includes(l.status)).length, color: 'bg-orange-500' },
    { label: 'Convertidos', value: leads.filter(l => l.status === 'convertido').length, color: 'bg-emerald-500' },
  ]
  
  const maxValue = funnel[0].value || 1
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
      <h3 className="text-base font-semibold text-white mb-4">🎯 Funil de Conversão</h3>
      <div className="space-y-2">
        {funnel.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-20 text-xs text-gray-400">{item.label}</div>
            <div className="flex-1 bg-gray-700 rounded h-6 overflow-hidden">
              <div 
                className={`h-full ${item.color} transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              >
                <span className="text-xs text-white font-bold">{item.value}</span>
              </div>
            </div>
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
  const [tenants, setTenants] = useState([])
  const [currentTenant, setCurrentTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    fonte: '', categoria: '', periodo: '', busca: '', status: ''
  })
  const [showCharts, setShowCharts] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const [activeTab, setActiveTab] = useState('todos') // todos, hot, contatar, convertidos

  // Carregar dados
  useEffect(() => {
    loadData()
  }, [])

  // Carregar leads quando mudar tenant
  useEffect(() => {
    if (currentTenant) {
      loadLeads()
    }
  }, [currentTenant])

  const loadData = async () => {
    try {
      // Carregar tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true)
      
      if (tenantsError) throw tenantsError
      
      setTenants(tenantsData || [])
      
      // Se tiver tenants, selecionar o primeiro
      if (tenantsData?.length > 0) {
        setCurrentTenant(tenantsData[0])
      } else {
        // Se não houver tenants, carregar leads sem filtro
        await loadLeads()
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadLeads = async () => {
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setLeads(data || [])
    } catch (err) {
      console.error('Erro ao carregar leads:', err)
    }
  }

  // Realtime subscription
  useEffect(() => {
    const subscription = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeads()
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [currentTenant])

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    let result = leads

    // Tab filter
    if (activeTab === 'hot') {
      result = result.filter(l => l.categoria?.toLowerCase() === 'hot')
    } else if (activeTab === 'contatar') {
      result = result.filter(l => ['novo', 'qualificado'].includes(l.status))
    } else if (activeTab === 'convertidos') {
      result = result.filter(l => l.status === 'convertido')
    }

    // Other filters
    return result.filter(lead => {
      if (filters.fonte && lead.fonte !== filters.fonte) return false
      if (filters.categoria && lead.categoria?.toLowerCase() !== filters.categoria) return false
      if (filters.status && lead.status !== filters.status) return false
      
      if (filters.periodo) {
        const leadDate = new Date(lead.created_at)
        const now = new Date()
        
        if (filters.periodo === 'hoje') {
          if (!lead.created_at?.startsWith(new Date().toISOString().split('T')[0])) return false
        } else if (filters.periodo === '7dias') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7))
          if (leadDate < weekAgo) return false
        } else if (filters.periodo === '30dias') {
          const monthAgo = new Date(now.setDate(now.getDate() - 30))
          if (leadDate < monthAgo) return false
        }
      }
      
      if (filters.busca) {
        const search = filters.busca.toLowerCase()
        const matchName = lead.nome?.toLowerCase().includes(search)
        const matchEmail = lead.email?.toLowerCase().includes(search)
        const matchPhone = lead.telefone?.includes(search)
        if (!matchName && !matchEmail && !matchPhone) return false
      }
      
      return true
    })
  }, [leads, filters, activeTab])

  // Métricas
  const metrics = useMemo(() => ({
    total: leads.length,
    hot: leads.filter(l => l.categoria?.toLowerCase() === 'hot').length,
    aContatar: leads.filter(l => ['novo', 'qualificado'].includes(l.status)).length,
    convertidos: leads.filter(l => l.status === 'convertido').length,
    taxaConversao: leads.length > 0 
      ? ((leads.filter(l => l.status === 'convertido').length / leads.length) * 100).toFixed(1) 
      : 0,
  }), [leads])

  // Dados para gráficos
  const chartData = useMemo(() => {
    const fontes = {}
    leads.forEach(l => {
      const f = l.fonte || 'outro'
      fontes[f] = (fontes[f] || 0) + 1
    })
    
    const fontesData = Object.entries(fontes).map(([label, value]) => ({
      label,
      value,
      color: FONTE_CONFIG[label]?.color === 'green' ? 'bg-green-500' :
             FONTE_CONFIG[label]?.color === 'pink' ? 'bg-pink-500' :
             FONTE_CONFIG[label]?.color === 'blue' ? 'bg-blue-500' :
             FONTE_CONFIG[label]?.color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-500'
    }))
    
    return { fontesData }
  }, [leads])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-400 mt-4">Carregando...</p>
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
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Logo tenant={currentTenant} />
          <div className="flex items-center gap-3">
            <TenantSelector 
              tenants={tenants} 
              currentTenant={currentTenant} 
              onSelect={setCurrentTenant} 
            />
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                showCharts ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              📊
            </button>
            <div className="text-right">
              <p className="text-green-400 text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <MetricCard 
            title="Total de Leads" 
            value={metrics.total} 
            icon="📊" 
            color="orange"
            onClick={() => setActiveTab('todos')}
          />
          <MetricCard 
            title="Leads HOT" 
            value={metrics.hot} 
            icon="🔥" 
            color="red"
            onClick={() => setActiveTab('hot')}
          />
          <MetricCard 
            title="A Contatar" 
            value={metrics.aContatar} 
            icon="📞" 
            color="amber"
            onClick={() => setActiveTab('contatar')}
          />
          <MetricCard 
            title="Convertidos" 
            value={metrics.convertidos} 
            icon="🎉" 
            color="green"
            onClick={() => setActiveTab('convertidos')}
          />
          <MetricCard 
            title="Taxa Conversão" 
            value={`${metrics.taxaConversao}%`} 
            icon="📈" 
            color="purple"
          />
        </div>

        {/* Charts */}
        {showCharts && leads.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <LeadsOverTime leads={leads} />
            <SimpleBarChart title="📱 Por Fonte" data={chartData.fontesData} />
            <FunnelChart leads={leads} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'todos', label: 'Todos', count: leads.length },
            { key: 'hot', label: '🔥 HOT', count: metrics.hot },
            { key: 'contatar', label: '📞 A Contatar', count: metrics.aContatar },
            { key: 'convertidos', label: '🎉 Convertidos', count: metrics.convertidos },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Filters */}
        <Filters filters={filters} setFilters={setFilters} leads={leads} />

        {/* Results count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-400 text-sm">
            Mostrando <span className="text-white font-bold">{filteredLeads.length}</span> leads
          </p>
        </div>

        {/* Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-gray-400 text-lg">Nenhum lead encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-700/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Lead</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Contato</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Fonte</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Score</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{lead.nome || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300 text-sm">{lead.email || '-'}</p>
                        <p className="text-gray-500 text-xs">{lead.telefone || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <FonteBadge fonte={lead.fonte} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ScoreBadge score={lead.score} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CategoryBadge categoria={lead.categoria} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-sm">
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

      {/* Modal de Detalhes */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onUpdate={() => {
            loadLeads()
            setSelectedLead(null)
          }}
        />
      )}
    </div>
  )
}

export default App
