import { useState, useEffect, useMemo } from 'react'
import Logo from './assets/logo-leadcapture.png'
import LeadModal from './components/LeadModal'

// ============================================================
// CONFIGURAÇÃO DA API LOCAL (Seu Servidor Node)
// ============================================================
const API_URL = 'http://localhost:4000';
const API_KEY = '6ee1c8864fcccb06a099e023ae8ae9bd';

// ============================================================
// CONFIGURAÇÕES VISUAIS (STATUS, CATEGORIAS, FONTES)
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
// COMPONENTES DE UI
// ============================================================
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
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>{config.icon} {config.label}</span>
}

function CategoryBadge({ categoria }) {
  const config = CATEGORIA_CONFIG[categoria?.toLowerCase()] || CATEGORIA_CONFIG.cold
  return <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${config.color} text-white`}>{config.icon} {config.label}</span>
}

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
  return <span className={`px-2 py-1 rounded text-xs font-medium ${colorClasses[config.color]}`}>{config.icon} {config.label}</span>
}

// ============================================================
// APLICAÇÃO PRINCIPAL
// ============================================================
function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)
  const [activeTab, setActiveTab] = useState('todos')

  const statusOptions = useMemo(() => Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })), [])

  // BUSCA OS LEADS ATRAVÉS DO SEU SERVIDOR NODE
  const fetchLeads = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/leads`, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Falha ao conectar com o servidor');
      const data = await response.json();
      setLeads(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando leads do sistema...</div>;

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard LeadCapture</h1>
          <p className="text-gray-400">Gestão de Leads em Tempo Real</p>
        </div>
        <img src={Logo} alt="Logo" className="h-12" />
      </header>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase">Lead</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Fonte</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Categoria</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Status</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-700/30 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                <td className="p-4 font-medium">{lead.nome || lead.phone_number || 'Sem nome'}</td>
                <td className="p-4 text-center"><FonteBadge fonte={lead.fonte} /></td>
                <td className="p-4 text-center"><CategoryBadge categoria={lead.categoria} /></td>
                <td className="p-4 text-center"><StatusBadge status={lead.status} /></td>
                <td className="p-4 text-right text-gray-400 text-sm">{formatDate(lead.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={() => fetchLeads()} // Recarrega após salvar
          statusOptions={statusOptions}
        />
      )}
    </div>
  )
}

export default App