// RankingPage v3 -- Ranking de Vendas e Comissoes
// Paleta: #0F172A fundo, #10B981 verde, #EE7B4D laranja accent
// Regras: Consultor/Gestor aparecem; Diretor/Admin nao contabilizam
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'

//  Helpers 
const MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const now = new Date()
const ANO_ATUAL = now.getFullYear()
const MES_ATUAL = now.getMonth() + 1

function fmtR$(v) {
  if (!v) return 'R$ 0'
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$ ${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$ ${(n/1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

function fmtPct(v) { return `${Math.round(v || 0)}%` }

function BarraMeta({ pct, cor }) {
  const c = pct >= 100 ? '#10B981' : pct >= 80 ? '#F59E0B' : pct >= 50 ? '#3B82F6' : '#6B7280'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ background: cor || c }}
        />
      </div>
      <span className="text-[9px] font-black tabular-nums shrink-0" style={{ color: cor || c }}>
        {fmtPct(pct)}
      </span>
    </div>
  )
}

//  Card do podio 
function PodioSlot({ pos, consultor }) {
  const cfg = [
    { cor: '#10B981', ring: 'ring-[#10B981]/40', size: 'w-20 h-20', base: 'h-24', label: '1' },
    { cor: '#94A3B8', ring: 'ring-[#94A3B8]/40', size: 'w-16 h-16', base: 'h-16', label: '2' },
    { cor: '#CD7C3A', ring: 'ring-[#CD7C3A]/40', size: 'w-14 h-14', base: 'h-12', label: '3' },
  ][pos - 1]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: pos * 0.1 }}
      className="flex flex-col items-center gap-2"
    >
      {/* Avatar */}
      <div className={`${cfg.size} rounded-full ring-2 ${cfg.ring} flex items-center justify-center text-2xl font-black`}
        style={{ background: `linear-gradient(135deg, ${cfg.cor}22, ${cfg.cor}11)`, color: cfg.cor }}>
        {consultor ? (consultor.role_emoji || consultor.nome?.charAt(0)) : cfg.label}
      </div>
      {/* Info */}
      {consultor ? (
        <div className="text-center">
          <p className="text-white text-[11px] font-black">{consultor.nome?.split(' ')[0]}</p>
          <p className="text-[10px] font-bold" style={{ color: cfg.cor }}>{consultor.total_leads} leads</p>
          <p className="text-[9px] text-gray-600">{fmtR$(consultor.capital_total)}</p>
          {consultor.bateu_meta && (
            <span className="text-[8px] bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded-full font-black">META</span>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-gray-700">{cfg.label} lugar</p>
      )}
      {/* Base do podio */}
      <div className={`w-16 ${cfg.base} rounded-t-lg flex items-center justify-center`}
        style={{ background: `${cfg.cor}18`, border: `1px solid ${cfg.cor}30` }}>
        <span className="text-2xl font-black" style={{ color: cfg.cor }}>{cfg.label}</span>
      </div>
    </motion.div>
  )
}

//  Linha do ranking 
function RankRow({ consultor, pos, onClick }) {
  const cor = pos === 1 ? '#10B981' : pos === 2 ? '#94A3B8' : pos === 3 ? '#CD7C3A' : '#475569'
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(pos * 0.03, 0.3) }}
      onClick={() => onClick(consultor)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-all border-b border-white/[0.04] last:border-0 group"
    >
      {/* Pos */}
      <span className="w-6 shrink-0 text-center font-black text-[11px]" style={{ color: cor }}>
        {pos}
      </span>
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 border border-white/10"
        style={{ background: `${cor}18`, color: cor }}>
        {consultor.role_emoji || consultor.nome?.charAt(0) || '?'}
      </div>
      {/* Nome + barra */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-white text-[11px] font-bold truncate">{consultor.nome}</p>
          <span className="text-[8px] text-gray-600 shrink-0 uppercase tracking-wide">{consultor.role}</span>
          {consultor.bateu_meta && (
            <span className="text-[8px] bg-[#10B981]/20 text-[#10B981] px-1 py-px rounded-full font-black shrink-0">META</span>
          )}
        </div>
        <BarraMeta pct={consultor.pct_meta} />
      </div>
      {/* Leads */}
      <div className="text-right shrink-0 w-12">
        <p className="text-white text-[13px] font-black tabular-nums">{consultor.total_leads}</p>
        <p className="text-[8px] text-gray-600">leads</p>
      </div>
      {/* Capital */}
      <div className="text-right shrink-0 w-20 hidden sm:block">
        <p className="text-[#10B981] text-[11px] font-bold">{fmtR$(consultor.capital_total)}</p>
        <p className="text-[8px] text-gray-600">capital</p>
      </div>
      {/* Ganhos estimados */}
      <div className="text-right shrink-0 w-20 hidden md:block">
        <p className="text-[#EE7B4D] text-[11px] font-bold">{fmtR$(consultor.total_ganhos)}</p>
        <p className="text-[8px] text-gray-600">{fmtPct(consultor.comissao_pct)} com.</p>
      </div>
      {/* Seta */}
      <span className="text-gray-700 group-hover:text-gray-400 transition-colors text-sm shrink-0"></span>
    </motion.div>
  )
}

//  Drawer do consultor 
function ConsultorDrawer({ consultor, meta, onClose }) {
  if (!consultor) return null
  const tx = consultor.total_leads > 0
    ? Math.round((consultor.convertidos / consultor.total_leads) * 100) : 0

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black border border-white/10 bg-white/5">
                {consultor.role_emoji || consultor.nome?.charAt(0)}
              </div>
              <div>
                <p className="text-white font-black">{consultor.nome}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{consultor.role}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-white text-xl transition-colors">x</button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Leads',         value: consultor.total_leads,             cor: '#fff' },
              { label: 'HOT',           value: consultor.leads_hot,               cor: '#EF4444' },
              { label: 'Convertidos',   value: consultor.convertidos,             cor: '#10B981' },
              { label: 'Tx Conversao',  value: `${tx}%`,                          cor: '#10B981' },
              { label: 'Capital',       value: fmtR$(consultor.capital_total),    cor: '#10B981' },
              { label: 'Comissao',      value: fmtR$(consultor.comissao_valor),   cor: '#EE7B4D' },
              { label: 'Bonus Faixa',   value: fmtR$(consultor.bonus_faixa),      cor: '#F59E0B' },
              { label: 'Total Ganhos',  value: fmtR$(consultor.total_ganhos),     cor: '#EE7B4D' },
            ].map(k => (
              <div key={k.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-wider mb-1">{k.label}</p>
                <p className="text-lg font-black" style={{ color: k.cor }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Progresso meta */}
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 mb-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">Meta do mes</p>
              <span className="text-[10px] font-black text-white">{consultor.total_leads} / {consultor.meta_leads}</span>
            </div>
            <BarraMeta pct={consultor.pct_meta} />
            {consultor.bateu_meta && (
              <p className="text-[10px] text-[#10B981] font-black mt-2">Meta batida! Bonus individual liberado.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

//  Alerta banner 
function AlertaBanner({ consultores, pctEquipe, metaEquipe }) {
  const destaques = consultores.filter(c => c.bateu_meta)
  if (!destaques.length && pctEquipe < 80) return null
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {pctEquipe >= 80 && (
        <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-4 py-2.5">
          <span className="text-[#10B981] font-black text-sm">EQUIPE</span>
          <p className="text-[11px] text-[#10B981]">Equipe atingiu {fmtPct(pctEquipe)} da meta! Bonus de equipe liberado.</p>
        </div>
      )}
      {destaques.slice(0, 3).map(c => (
        <div key={c.id} className="flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl px-4 py-2.5">
          <span className="text-[#F59E0B] font-black text-sm">META</span>
          <p className="text-[11px] text-[#F59E0B]">{c.nome?.split(' ')[0]} bateu a meta individual!</p>
        </div>
      ))}
    </div>
  )
}

//  Pagina principal 
export default function RankingPage() {
  const { usuario } = useAuth()

  const isAdmin   = ['Administrador','admin'].includes(usuario?.role)
    || usuario?.is_super_admin || usuario?.is_platform
  const podeVer   = isAdmin || ['Diretor','Gestor','Consultor'].includes(usuario?.role)
  const isDiretor = isAdmin || usuario?.role === 'Diretor'

  const [aba,              setAba]              = useState('ranking')
  const [periodo,          setPeriodo]          = useState({ ano: ANO_ATUAL, mes: MES_ATUAL })
  const [tenants,          setTenants]          = useState([])
  const [tenantId,         setTenantId]         = useState(usuario?.tenant_id || '')
  const [consultores,      setConsultores]      = useState([])
  const [metaConfig,       setMetaConfig]       = useState({})
  const [pctEquipe,        setPctEquipe]        = useState(0)
  const [loading,          setLoading]          = useState(true)
  const [erro,             setErro]             = useState('')
  const [consultorDetalhe, setConsultorDetalhe] = useState(null)
  const [faixas,           setFaixas]           = useState([])

  // Carrega tenants para admin
  useEffect(() => {
    if (!isAdmin) return
    async function loadTenants() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return
      const API = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')
      try {
        const r = await fetch(`${API}/api/ranking/tenants`, { headers: { Authorization: `Bearer ${token}` } })
        const d = await r.json()
        if (d.tenants?.length) {
          setTenants(d.tenants)
          if (!tenantId) setTenantId(d.tenants[0].id)
        }
      } catch (_) {}
    }
    loadTenants()
  }, [isAdmin])

  // Carrega faixas de comissao
  useEffect(() => {
    if (!tenantId) return
    supabase.from('ranking_config').select('*').eq('tenant_id', tenantId)
      .eq('ativo', true).order('de')
      .then(({ data }) => setFaixas(data || []))
  }, [tenantId])

  // Carrega dados do ranking
  const carregar = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setErro('')
    try {
      // Forca refresh do token -- garante token valido mesmo apos longa inatividade
      let token = ''
      try {
        const { data: refreshed } = await supabase.auth.refreshSession()
        token = refreshed?.session?.access_token || ''
      } catch (_) {}
      // Fallback: session atual
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession()
        token = session?.access_token || ''
      }
      if (!token) { setErro('Sessao expirada. Faca logout e login novamente.'); setLoading(false); return }
      const API   = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

      const res  = await fetch(
        `${API}/api/ranking/usuarios?tenant_id=${tenantId}&ano=${periodo.ano}&mes=${periodo.mes}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()

      if (res.status === 401 || !res.ok) {
        // Fallback: busca direto no Supabase (mesmo tenant do usuario logado)
        console.warn('[Ranking] API indisponivel, usando Supabase direto')
        const { data: users } = await supabase
          .from('usuarios')
          .select('id, nome, role')
          .eq('tenant_id', tenantId)
          .in('role', ['Consultor', 'Gestor', 'Operador'])
          .order('nome')
        if (users?.length) {
          setConsultores(users.map(u => ({
            ...u,
            total_leads: 0, leads_hot: 0, convertidos: 0, capital_total: 0,
            pct_meta: 0, meta_leads: 20, comissao_pct: 0,
            comissao_valor: 0, bonus_faixa: 0, bonus_individual: 0,
            bonus_equipe: 0, total_ganhos: 0, bateu_meta: false,
          })))
          setErro('Modo basico ativo. Faca logout/login para ver dados completos.')
        } else {
          setErro(json?.error || 'Erro ao carregar. Verifique se ha consultores cadastrados.')
          setConsultores([])
        }
        return
      }

      setConsultores(json.consultores || [])
      setMetaConfig(json.meta_global  || {})
      setPctEquipe(json.pct_equipe    || 0)
    } catch (e) {
      setErro('Erro de conexao: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [tenantId, periodo])

  useEffect(() => { carregar() }, [carregar])

  // KPIs gerais
  const totalLeads    = consultores.reduce((a, c) => a + c.total_leads,  0)
  const totalCapital  = consultores.reduce((a, c) => a + c.capital_total, 0)
  const totalGanhos   = consultores.reduce((a, c) => a + c.total_ganhos,  0)
  const metaBatida    = consultores.filter(c => c.bateu_meta).length
  const top3          = consultores.slice(0, 3)

  // Exporta CSV
  function exportCSV() {
    const h = 'Pos,Nome,Role,Leads,HOT,Convertidos,Tx Conv,Capital,Comissao %,Comissao R$,Bonus,Total Ganhos,% Meta\n'
    const r = consultores.map((c, i) => {
      const tx = c.total_leads > 0 ? Math.round((c.convertidos / c.total_leads) * 100) : 0
      return `${i+1},"${c.nome}",${c.role},${c.total_leads},${c.leads_hot},${c.convertidos},${tx}%,${c.capital_total},${c.comissao_pct}%,${c.comissao_valor},${c.bonus_faixa + c.bonus_individual + c.bonus_equipe},${c.total_ganhos},${c.pct_meta}%`
    }).join('\n')
    const blob = new Blob([h + r], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `ranking-${periodo.ano}-${String(periodo.mes).padStart(2,'0')}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  if (!podeVer) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <p className="text-gray-600">Sem permissao de acesso.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0F172A] pb-16">

      {/* Header */}
      <div className="px-6 lg:px-10 pt-7 pb-5 border-b border-white/[0.06]">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-light text-white">
              Ranking de <span className="text-[#10B981] font-bold">Vendas</span>
            </h1>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em] mt-1">
              {MESES[periodo.mes-1]} {periodo.ano}  comissoes e metas
            </p>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tenant (admin) */}
            {isAdmin && tenants.length > 0 && (
              <select value={tenantId} onChange={e => setTenantId(e.target.value)}
                className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-3 py-2 text-xs text-[#10B981] font-bold focus:outline-none">
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name || t.id.slice(0,8)}</option>)}
              </select>
            )}
            {/* Periodo */}
            <select
              value={`${periodo.ano}-${periodo.mes}`}
              onChange={e => { const [a,m] = e.target.value.split('-'); setPeriodo({ ano:+a, mes:+m }) }}
              className="bg-[#0B1220] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              {Array.from({ length: 24 }, (_, i) => {
                const d = new Date(ANO_ATUAL, MES_ATUAL - 1 - i, 1)
                const m = d.getMonth() + 1; const a = d.getFullYear()
                return <option key={`${a}-${m}`} value={`${a}-${m}`}>{MESES_CURTO[m-1]} {a}</option>
              })}
            </select>
            <button onClick={carregar} title="Atualizar"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-500 hover:text-white text-sm">
              R
            </button>
          </div>
        </div>

        {/* KPIs rapidos */}
        <div className="flex flex-wrap gap-3 mt-5">
          {[
            { label: 'Consultores', value: consultores.length, cor: 'text-white' },
            { label: 'Total Leads', value: totalLeads,         cor: 'text-white' },
            { label: 'Capital',     value: fmtR$(totalCapital),cor: 'text-[#10B981]' },
            { label: 'Comissoes',   value: fmtR$(totalGanhos), cor: 'text-[#EE7B4D]' },
            { label: 'Metas Batidas',value: `${metaBatida}/${consultores.length}`, cor: 'text-[#F59E0B]' },
            { label: 'Equipe',      value: fmtPct(pctEquipe),  cor: pctEquipe >= 80 ? 'text-[#10B981]' : 'text-gray-400' },
          ].map(k => (
            <div key={k.label} className="bg-[#0B1220] border border-white/[0.06] rounded-xl px-4 py-2.5 min-w-[90px]">
              <p className="text-[8px] font-black uppercase tracking-wider text-gray-600 mb-0.5">{k.label}</p>
              <p className={`text-base font-black tabular-nums ${k.cor}`}>{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mx-6 lg:mx-10 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-red-400 text-sm">{erro}</p>
          <button onClick={carregar} className="text-xs text-red-400 underline">Tentar novamente</button>
        </div>
      )}

      {/* Abas */}
      <div className="px-6 lg:px-10 pt-5 mb-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {[
            { id: 'ranking',   label: 'Ranking' },
            { id: 'relatorio', label: 'Relatorio' },
            ...(isDiretor ? [{ id: 'config', label: 'Config' }] : []),
          ].map(t => (
            <button key={t.id} onClick={() => setAba(t.id)}
              className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
                aba === t.id ? 'bg-[#10B981] text-black' : 'text-gray-500 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {aba === 'relatorio' && (
          <button onClick={exportCSV}
            className="px-4 py-2 rounded-xl text-[11px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/20 transition-all">
            Exportar CSV
          </button>
        )}
      </div>

      <div className="px-6 lg:px-10">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && aba === 'ranking' && (
          <div className="space-y-5">
            {/* Alertas */}
            <AlertaBanner consultores={consultores} pctEquipe={pctEquipe} />

            {/* Podio */}
            {consultores.length > 0 && (
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-6">Podio do mes</p>
                <div className="flex items-end justify-center gap-6 lg:gap-10">
                  <PodioSlot pos={2} consultor={top3[1]} />
                  <PodioSlot pos={1} consultor={top3[0]} />
                  <PodioSlot pos={3} consultor={top3[2]} />
                </div>
              </div>
            )}

            {/* Lista */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                  Consultores / Gestores
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-gray-600">Meta: {metaConfig.meta_leads || 20} leads</span>
                  <span className="text-[10px] font-bold text-[#10B981]">{consultores.length} pessoas</span>
                </div>
              </div>

              {consultores.length === 0 && !erro ? (
                <div className="py-16 text-center">
                  <p className="text-gray-600 text-sm mb-2">Nenhum dado para este periodo</p>
                  <p className="text-gray-700 text-xs">
                    Verifique se ha consultores ou gestores cadastrados no tenant selecionado
                  </p>
                </div>
              ) : (
                consultores.map((c, i) => (
                  <RankRow key={c.id} consultor={c} pos={i+1} onClick={setConsultorDetalhe} />
                ))
              )}
            </div>
          </div>
        )}

        {!loading && aba === 'relatorio' && (
          <div className="space-y-5">
            {/* Resumo financeiro */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Capital Total Vendido',  value: fmtR$(totalCapital),  cor: '#10B981' },
                { label: 'Total em Comissoes',      value: fmtR$(totalGanhos),   cor: '#EE7B4D' },
                { label: 'Meta da Equipe',          value: fmtPct(pctEquipe),    cor: pctEquipe >= 80 ? '#10B981' : '#F59E0B' },
              ].map(k => (
                <div key={k.label} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-2">{k.label}</p>
                  <p className="text-3xl font-black" style={{ color: k.cor }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Tabela detalhada */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-x-auto">
              <table className="w-full text-[11px] min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['#','Consultor','Role','Leads','HOT','Conv','Tx Conv','Capital','Com%','Comissao','Bonus','Total','% Meta'].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-[9px] font-black uppercase tracking-wider text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consultores.map((c, i) => {
                    const tx = c.total_leads > 0 ? Math.round((c.convertidos / c.total_leads) * 100) : 0
                    return (
                      <tr key={c.id} onClick={() => setConsultorDetalhe(c)}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer">
                        <td className="px-3 py-2.5 text-gray-500 font-black">{i+1}</td>
                        <td className="px-3 py-2.5 text-white font-bold whitespace-nowrap">{c.nome}</td>
                        <td className="px-3 py-2.5 text-gray-500">{c.role}</td>
                        <td className="px-3 py-2.5 text-white font-black">{c.total_leads}</td>
                        <td className="px-3 py-2.5 text-red-400 font-bold">{c.leads_hot}</td>
                        <td className="px-3 py-2.5 text-[#10B981] font-bold">{c.convertidos}</td>
                        <td className="px-3 py-2.5 text-[#10B981]">{tx}%</td>
                        <td className="px-3 py-2.5 text-[#10B981] font-bold whitespace-nowrap">{fmtR$(c.capital_total)}</td>
                        <td className="px-3 py-2.5 text-[#EE7B4D]">{c.comissao_pct}%</td>
                        <td className="px-3 py-2.5 text-[#EE7B4D] font-bold whitespace-nowrap">{fmtR$(c.comissao_valor)}</td>
                        <td className="px-3 py-2.5 text-[#F59E0B] font-bold whitespace-nowrap">{fmtR$(c.bonus_faixa + c.bonus_individual + c.bonus_equipe)}</td>
                        <td className="px-3 py-2.5 text-[#EE7B4D] font-black whitespace-nowrap">{fmtR$(c.total_ganhos)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${c.bateu_meta ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-white/5 text-gray-500'}`}>
                            {c.pct_meta}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {!consultores.length && (
                    <tr><td colSpan={13} className="px-4 py-8 text-center text-gray-600">Sem dados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && aba === 'config' && isDiretor && (
          <div className="max-w-xl space-y-5">
            {/* Meta */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-4">Meta Mensal</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Meta de leads (equipe)',  key: 'meta_leads',       type: 'number', placeholder: '20' },
                  { label: 'Meta de capital (R$)',    key: 'meta_capital',     type: 'number', placeholder: '500000' },
                  { label: 'Bonus individual (R$)',   key: 'bonus_individual', type: 'number', placeholder: '2000' },
                  { label: 'Bonus equipe (R$)',       key: 'bonus_equipe',     type: 'number', placeholder: '5000' },
                  { label: '% gestor sobre equipe',   key: 'pct_gestor',       type: 'number', placeholder: '10' },
                ].map(f => (
                  <div key={f.key} className="col-span-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-gray-600 mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      defaultValue={metaConfig[f.key] || ''}
                      id={`meta-${f.key}`}
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981]/50"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={async () => {
                  const get = k => parseFloat(document.getElementById(`meta-${k}`)?.value || 0)
                  const metaLeadsVal = get('meta_leads') || 20
                  const { error } = await supabase.from('ranking_metas').upsert({
                    tenant_id:        tenantId,
                    ano:              periodo.ano,
                    mes:              periodo.mes,
                    consultor_id:     null,
                    meta_valor:       metaLeadsVal,
                    meta_leads:       metaLeadsVal,
                    meta_capital:     get('meta_capital'),
                    bonus_individual: get('bonus_individual'),
                    bonus_equipe:     get('bonus_equipe'),
                    pct_gestor:       get('pct_gestor'),
                  }, { onConflict: 'tenant_id,ano,mes,consultor_id' })
                  if (!error) { alert('Metas salvas!'); carregar() }
                  else alert('Erro: ' + error.message)
                }}
                className="w-full py-2.5 rounded-xl text-[11px] font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all">
                Salvar Metas
              </button>
            </div>

            {/* Faixas */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-3">
                Faixas de Comissao -- {faixas.length} configuradas
              </p>
              {faixas.length === 0 ? (
                <p className="text-gray-600 text-xs">Execute o SQL <code className="text-[#10B981]">ranking_schema_v3.sql</code> para configurar as faixas.</p>
              ) : (
                <div className="space-y-2">
                  {faixas.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-[11px] text-gray-400">
                        {fmtR$(f.de)} -- {f.ate ? fmtR$(f.ate) : 'sem limite'}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#10B981] font-black text-[11px]">{f.pct}%</span>
                        {f.bonus > 0 && <span className="text-[#F59E0B] text-[10px]">+{fmtR$(f.bonus)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawer detalhe consultor */}
      <ConsultorDrawer
        consultor={consultorDetalhe}
        meta={metaConfig}
        onClose={() => setConsultorDetalhe(null)}
      />
    </div>
  )
}
