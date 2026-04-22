// ============================================================
// BackofficePage.jsx — Dashboard Super Admin
// LeadCapture Pro — Zafalão Tech
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'

// ─── Componentes de KPI ─────────────────────────────────────
function KPICard({ label, value, sub, icon, trend, color = '#10B981' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0F172A] border border-white/5 rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ background: `${color}20` }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-bold ${
              trend > 0 ? 'text-[#10B981]' : trend < 0 ? 'text-red-400' : 'text-gray-500'
            }`}
          >
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
    </motion.div>
  )
}

// ─── Tabela de Tenants ───────────────────────────────────────
function TenantRow({ tenant, onClick }) {
  const statusColor = tenant.active ? '#10B981' : '#EF4444'
  
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={() => onClick(tenant)}
      className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{ background: tenant.cor_primaria || '#10B98120' }}
          >
            {tenant.name?.charAt(0) || 'T'}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{tenant.name}</p>
            <p className="text-[10px] text-gray-600">{tenant.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className="px-2 py-1 rounded-full text-[9px] font-black uppercase"
          style={{
            background: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {tenant.active ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">{tenant.total_leads || 0}</td>
      <td className="px-4 py-3 text-sm text-gray-400">{tenant.total_usuarios || 0}</td>
      <td className="px-4 py-3 text-sm text-[#10B981] font-bold">
        R$ {(tenant.capital_total || 0).toLocaleString('pt-BR')}
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">
        {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
      </td>
    </motion.tr>
  )
}

// ─── Drawer de Detalhes do Tenant ─────────────────────────────
function TenantDrawer({ tenant, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false)
  
  if (!tenant) return null
  
  const toggleStatus = async () => {
    setLoading(true)
    await supabase
      .from('tenants')
      .update({ active: !tenant.active })
      .eq('id', tenant.id)
    onRefresh()
    setLoading(false)
  }
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-lg bg-[#0B1220] border border-white/10 rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black"
                style={{ background: tenant.cor_primaria || '#10B98120' }}
              >
                {tenant.name?.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-black text-white">{tenant.name}</p>
                <p className="text-xs text-gray-500">{tenant.slug}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-white text-xl">
              ✕
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Leads', value: tenant.total_leads || 0, icon: '📊' },
              { label: 'Usuários', value: tenant.total_usuarios || 0, icon: '👥' },
              { label: 'Capital', value: `R$ ${(tenant.capital_total || 0).toLocaleString('pt-BR')}`, icon: '💰' },
              { label: 'Conversões', value: tenant.conversoes || 0, icon: '✅' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0F172A] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-black text-white">{stat.value}</p>
              </div>
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={toggleStatus}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                tenant.active
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/20'
              }`}
            >
              {loading ? 'Processando...' : tenant.active ? 'Desativar Tenant' : 'Ativar Tenant'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Página Principal ────────────────────────────────────────
export default function BackofficePage() {
  const { usuario } = useAuth()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalLeads: 0,
    totalCapital: 0,
    totalUsuarios: 0,
    leadsHoje: 0,
    conversoes: 0,
  })
  
  useEffect(() => {
    loadData()
  }, [])
  
  async function loadData() {
    setLoading(true)
    try {
      // Busca tenants
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('id, name, slug, active, created_at, cor_primaria')
        .order('created_at', { ascending: false })
      
      // Busca contagens
      const [
        { count: totalLeads },
        { count: totalUsuarios },
        { data: leadsHoje },
        { data: capitalData },
      ] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('usuarios').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id').gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('leads').select('capital_disponivel'),
      ])
      
      const capitalTotal = (capitalData || []).reduce(
        (sum, l) => sum + parseFloat(l.capital_disponivel || 0),
        0
      )
      
      setTenants(tenantsData || [])
      setStats({
        totalTenants: tenantsData?.length || 0,
        totalLeads: totalLeads || 0,
        totalCapital: capitalTotal,
        totalUsuarios: totalUsuarios || 0,
        leadsHoje: leadsHoje?.length || 0,
        conversoes: 0,
      })
    } catch (err) {
      console.error('[Backoffice] Erro:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const fmtCapital = (v) => {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`
    return `R$ ${v.toLocaleString('pt-BR')}`
  }
  
  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">
      {/* Header */}
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-4xl font-light text-white mb-1">
            Backoffice <span className="text-[#EE7B4D] font-bold">Admin</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-16 h-0.5 bg-[#EE7B4D] rounded-full" />
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Painel de controle da plataforma
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* KPIs */}
      <div className="px-6 lg:px-10 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Tenants"
            value={stats.totalTenants}
            icon="🏢"
            color="#3B82F6"
          />
          <KPICard
            label="Total Leads"
            value={stats.totalLeads}
            sub={`${stats.leadsHoje} hoje`}
            icon="📊"
            color="#10B981"
          />
          <KPICard
            label="Capital Plataforma"
            value={fmtCapital(stats.totalCapital)}
            icon="💰"
            color="#F59E0B"
          />
          <KPICard
            label="Usuários"
            value={stats.totalUsuarios}
            icon="👥"
            color="#8B5CF6"
          />
        </div>
      </div>
      
      {/* Tabela de Tenants */}
      <div className="px-6 lg:px-10">
        <div className="bg-[#0F172A] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-white">Tenants</h2>
            <p className="text-xs text-gray-500">Clique para ver detalhes</p>
          </div>
          
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-600">Nenhum tenant encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-black/20">
                  {['Tenant', 'Status', 'Leads', 'Usuários', 'Capital', 'Criado'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant, i) => (
                  <TenantRow
                    key={tenant.id}
                    tenant={tenant}
                    onClick={setSelectedTenant}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Drawer */}
      <TenantDrawer
        tenant={selectedTenant}
        onClose={() => setSelectedTenant(null)}
        onRefresh={loadData}
      />
    </div>
  )
}
