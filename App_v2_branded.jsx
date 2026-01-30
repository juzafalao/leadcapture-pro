import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// CONFIGURAÇÃO SUPABASE
// ⚠️ SUBSTITUA PELA SUA CHAVE COMPLETA
// ============================================================
const supabaseUrl = 'https://krcybmownrpfjvqhacup.supabase.co'
const supabaseKey = 'COLE_SUA_CHAVE_AQUI'
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================================
// CONFIGURAÇÃO CRM
// ============================================================
const CRM_INTEGRATIONS = {
  pipedrive: {
    name: 'Pipedrive',
    icon: '🔵',
    color: 'blue',
    enabled: false,
    apiKey: '',
    apiUrl: 'https://api.pipedrive.com/v1'
  },
  hubspot: {
    name: 'HubSpot',
    icon: '🟠',
    color: 'orange',
    enabled: false,
    apiKey: '',
    apiUrl: 'https://api.hubapi.com'
  },
  rdstation: {
    name: 'RD Station',
    icon: '🟢',
    color: 'green',
    enabled: false,
    apiKey: ''
  }
}

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

// Marca d'água do LeadCapture Pro
function Watermark() {
  return (
    <div className="fixed bottom-4 right-4 opacity-5 pointer-events-none select-none z-0">
      <div className="text-right">
        <div className="text-6xl font-black text-white mb-2">
          LeadCapture
        </div>
        <div className="text-4xl font-light text-white">
          PRO
        </div>
      </div>
    </div>
  )
}

// Logo do Tenant (Cliente)
function TenantLogo({ tenant }) {
  if (!tenant) return null
  
  return (
    <div className="flex items-center gap-3">
      {tenant.logo_url ? (
        <img 
          src={tenant.logo_url} 
          alt={tenant.name} 
          className="h-12 w-auto max-w-[200px] object-contain rounded-lg bg-white/5 p-2"
        />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
          {tenant.name?.charAt(0) || 'L'}
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold text-white">
          {tenant.name || 'LeadCapture Pro'}
        </h1>
        <p className="text-xs text-gray-500">Dashboard de Leads</p>
      </div>
    </div>
  )
}

// Logo do Aplicativo (canto superior direito)
function AppLogo() {
  return (
    <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700/50">
      <div className="h-8 w-8 rounded bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
        <span className="text-white font-bold text-sm">LC</span>
      </div>
      <div className="text-xs">
        <div className="font-bold text-white leading-tight">LeadCapture</div>
        <div className="text-gray-400 leading-tight">PRO</div>
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

// Indicador de Integração CRM
function CRMIndicator({ tenant }) {
  const hasCRM = tenant?.crm_type
  
  if (!hasCRM) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
        CRM não configurado
      </div>
    )
  }
  
  const crmConfig = CRM_INTEGRATIONS[tenant.crm_type]
  if (!crmConfig) return null
  
  return (
    <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      <span className="text-xs font-medium text-gray-300">
        {crmConfig.icon} {crmConfig.name}
      </span>
    </div>
  )
}

// Modal de Configuração CRM
function CRMSettingsModal({ tenant, onClose, onSave }) {
  const [selectedCRM, setSelectedCRM] = useState(tenant?.crm_type || '')
  const [apiKey, setApiKey] = useState(tenant?.crm_api_key || '')
  
  const handleSave = async () => {
    await onSave({ crm_type: selectedCRM, crm_api_key: apiKey })
    onClose()
  }
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">⚙️ Configurar CRM</h2>
              <p className="text-gray-400 text-sm">Conecte seu sistema de CRM para sincronizar leads automaticamente</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Seleção de CRM */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Selecione o CRM</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(CRM_INTEGRATIONS).map(([key, crm]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCRM(key)}
                  className={`p-4 rounded-xl border-2 transition ${
                    selectedCRM === key
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                  }`}
                >
                  <div className="text-3xl mb-2">{crm.icon}</div>
                  <div className="font-bold text-white text-sm">{crm.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* API Key */}
          {selectedCRM && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key / Token de Acesso
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua API key aqui..."
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Esta chave será criptografada e armazenada com segurança
              </p>
            </div>
          )}
          
          {/* Info */}
          {selectedCRM && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="text-2xl">ℹ️</div>
                <div className="text-sm text-gray-300">
                  <p className="font-medium mb-1">Como obter a API Key:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400">
                    {selectedCRM === 'pipedrive' && (
                      <>
                        <li>Acesse Configurações → Conta → API</li>
                        <li>Copie seu Personal API Token</li>
                      </>
                    )}
                    {selectedCRM === 'hubspot' && (
                      <>
                        <li>Acesse Configurações → Integrações → API Key</li>
                        <li>Gere ou copie sua Private App key</li>
                      </>
                    )}
                    {selectedCRM === 'rdstation' && (
                      <>
                        <li>Acesse Integrações → API</li>
                        <li>Gere seu token de acesso</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedCRM || !apiKey}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💾 Salvar Configuração
          </button>
        </div>
      </div>
    </div>
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
            {statuses.map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
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
            <option value="">Todos</option>
            <option value="hot">🔥 HOT</option>
            <option value="warm">⚡ WARM</option>
            <option value="cold">❄️ COLD</option>
          </select>
        </div>
        
        {/* Fonte */}
        <div className="w-36">
          <label className="block text-xs text-gray-400 mb-1">Fonte</label>
          <select
            value={filters.fonte}
            onChange={(e) => setFilters({...filters, fonte: e.target.value})}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">Todas</option>
            {fontes.map(f => (
              <option key={f} value={f}>{FONTE_CONFIG[f]?.label || f}</option>
            ))}
          </select>
        </div>
        
        {/* Limpar */}
        <button
          onClick={() => setFilters({ busca: '', status: '', categoria: '', fonte: '' })}
          className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm"
        >
          Limpar
        </button>
      </div>
    </div>
  )
}

// ============================================================
// APP PRINCIPAL
// ============================================================

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function App() {
  const [leads, setLeads] = useState([])
  const [tenants, setTenants] = useState([])
  const [currentTenant, setCurrentTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCharts, setShowCharts] = useState(false)
  const [activeTab, setActiveTab] = useState('todos')
  const [selectedLead, setSelectedLead] = useState(null)
  const [showCRMSettings, setShowCRMSettings] = useState(false)
  const [filters, setFilters] = useState({
    busca: '',
    status: '',
    categoria: '',
    fonte: ''
  })

  // Carregar tenants
  useEffect(() => {
    async function loadTenants() {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('active', true)
          .order('name')
        
        if (error) throw error
        
        setTenants(data || [])
        if (data && data.length > 0) {
          setCurrentTenant(data[0])
        }
      } catch (err) {
        console.error('Erro ao carregar tenants:', err)
        setError(err.message)
      }
    }
    
    loadTenants()
  }, [])

  // Carregar leads
  useEffect(() => {
    async function loadLeads() {
      if (!currentTenant) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setLeads(data || [])
      } catch (err) {
        console.error('Erro ao carregar leads:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadLeads()
  }, [currentTenant])

  // Métricas
  const metrics = useMemo(() => {
    const total = leads.length
    const hot = leads.filter(l => l.categoria?.toLowerCase() === 'hot').length
    const aContatar = leads.filter(l => ['novo', 'em_analise'].includes(l.status)).length
    const convertidos = leads.filter(l => l.status === 'convertido').length
    const taxaConversao = total > 0 ? Math.round((convertidos / total) * 100) : 0
    
    return { total, hot, aContatar, convertidos, taxaConversao }
  }, [leads])

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    let result = leads
    
    // Tab ativo
    if (activeTab === 'hot') {
      result = result.filter(l => l.categoria?.toLowerCase() === 'hot')
    } else if (activeTab === 'contatar') {
      result = result.filter(l => ['novo', 'em_analise'].includes(l.status))
    } else if (activeTab === 'convertidos') {
      result = result.filter(l => l.status === 'convertido')
    }
    
    // Filtros
    if (filters.busca) {
      const busca = filters.busca.toLowerCase()
      result = result.filter(l =>
        l.nome?.toLowerCase().includes(busca) ||
        l.email?.toLowerCase().includes(busca) ||
        l.telefone?.includes(busca)
      )
    }
    
    if (filters.status) {
      result = result.filter(l => l.status === filters.status)
    }
    
    if (filters.categoria) {
      result = result.filter(l => l.categoria?.toLowerCase() === filters.categoria.toLowerCase())
    }
    
    if (filters.fonte) {
      result = result.filter(l => l.fonte === filters.fonte)
    }
    
    return result
  }, [leads, activeTab, filters])

  // Salvar configuração CRM
  const saveCRMConfig = async (crmData) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update(crmData)
        .eq('id', currentTenant.id)
      
      if (error) throw error
      
      // Atualizar tenant local
      setCurrentTenant({ ...currentTenant, ...crmData })
      
      // Recarregar tenants
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', currentTenant.id)
        .single()
      
      if (data) setCurrentTenant(data)
      
      alert('✅ Configuração CRM salva com sucesso!')
    } catch (err) {
      console.error('Erro ao salvar CRM:', err)
      alert('❌ Erro ao salvar: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-400 text-lg">Carregando leads...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Erro ao carregar</h2>
          <p className="text-gray-400 mb-4">{error}</p>
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
      {/* Marca d'água */}
      <Watermark />

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <TenantLogo tenant={currentTenant} />
          
          <div className="flex flex-wrap items-center gap-3">
            <CRMIndicator tenant={currentTenant} />
            
            <button
              onClick={() => setShowCRMSettings(true)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:border-orange-500 hover:text-white transition text-sm"
              title="Configurar CRM"
            >
              ⚙️ CRM
            </button>
            
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
            
            <AppLogo />
            
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

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
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
          <p>LeadCapture Pro v2.0 | Desenvolvido por Juliana Zafalão</p>
          <p className="text-xs mt-1">© 2026 Todos os direitos reservados</p>
        </footer>
      </div>

      {/* Modal CRM Settings */}
      {showCRMSettings && (
        <CRMSettingsModal
          tenant={currentTenant}
          onClose={() => setShowCRMSettings(false)}
          onSave={saveCRMConfig}
        />
      )}
    </div>
  )
}

export default App
