import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function fmtR(v) {
  if (!v && v !== 0) return 'R$ —'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function mesAtual() {
  const now = new Date()
  return { ano: now.getFullYear(), mes: now.getMonth() }
}

function labelMes(ano, mes) {
  return new Date(ano, mes, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// Score de capital -> valor estimado em reais
const CAPITAL_VALOR = {
  'acima-500k': 550000, '300k-500k': 400000, '100k-300k': 200000,
  'ate-100k': 75000, '50k-100k': 75000,
}
function estimarCapital(raw) {
  if (!raw) return 0
  const n = parseFloat(String(raw).replace(/\D/g,''))
  if (!isNaN(n) && n > 0) return n
  return CAPITAL_VALOR[raw] || 0
}

// Calcula comissão de acordo com faixas configuradas
function calcComissao(totalVendas, faixas) {
  if (!faixas?.length) return { pct: 0, bonus: 0, total: 0, faixa: null }
  const sorted = [...faixas].sort((a, b) => a.de - b.de)
  let faixaAtiva = null
  for (const f of sorted) {
    if (totalVendas >= f.de && (f.ate === null || totalVendas <= f.ate)) {
      faixaAtiva = f
    }
  }
  if (!faixaAtiva) return { pct: 0, bonus: 0, total: 0, faixa: null }
  const comissao = totalVendas * (faixaAtiva.pct / 100)
  return {
    pct:    faixaAtiva.pct,
    bonus:  faixaAtiva.bonus,
    total:  comissao + faixaAtiva.bonus,
    faixa:  faixaAtiva,
  }
}

// ──────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────
export default function RankingPage() {
  const { usuario, isPlatformAdmin } = useAuth()
  const role   = usuario?.role || ''
  const isDiretor = ['Diretor','Administrador','admin'].includes(role) || isPlatformAdmin?.()
  const tenantId  = isPlatformAdmin?.() ? null : usuario?.tenant_id

  const { ano: anoAtual, mes: mesAtualNum } = mesAtual()
  const [ano, setAno]       = useState(anoAtual)
  const [mes, setMes]       = useState(mesAtualNum)
  const [aba, setAba]       = useState('ranking')

  // Dados
  const [consultores, setConsultores] = useState([])
  const [leads, setLeads]             = useState([])
  const [faixas, setFaixas]           = useState([])
  const [metas, setMetas]             = useState([])
  const [loading, setLoading]         = useState(true)

  // Parametrização (só Diretores)
  const [editFaixas, setEditFaixas]   = useState([])
  const [salvando, setSalvando]       = useState(false)
  const [salvoOk, setSalvoOk]         = useState(false)
  const [metaGlobal, setMetaGlobal]   = useState('')
  const [editMetas, setEditMetas]     = useState({})

  // ── Carrega dados ──────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const inicio = new Date(ano, mes, 1).toISOString()
        const fim    = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString()

        // Consultores do tenant
        let qU = supabase.from('usuarios')
          .select('id, nome, email, role, avatar_url')
          .eq('role', 'Consultor')
          .eq('active', true)
        if (tenantId) qU = qU.eq('tenant_id', tenantId)
        const { data: us } = await qU

        // Leads convertidos no mês (status = 'convertido' ou slug contendo 'ganho'/'convertido')
        let qL = supabase.from('leads')
          .select('id, nome, capital_disponivel, score, operador_id, created_at, status, status_comercial(slug, label), tenant_id')
          .gte('created_at', inicio)
          .lte('created_at', fim)
          .or('status.eq.convertido,status.like.%ganho%,status.like.%fechado%')
        if (tenantId) qL = qL.eq('tenant_id', tenantId)
        const { data: ls } = await qL

        // Faixas de comissão salvas
        let qF = supabase.from('ranking_config')
          .select('*')
          .eq('ativo', true)
          .order('de')
        if (tenantId) qF = qF.eq('tenant_id', tenantId)
        const { data: fxs } = await qF

        // Metas individuais do mês
        let qM = supabase.from('ranking_metas')
          .select('*')
          .eq('ano', ano)
          .eq('mes', mes + 1)
        if (tenantId) qM = qM.eq('tenant_id', tenantId)
        const { data: mts } = await qM

        setConsultores(us || [])
        setLeads(ls || [])
        setFaixas(fxs || [])
        setMetas(mts || [])

        // Popula editor de faixas
        if (fxs?.length) {
          setEditFaixas(fxs.map(f => ({ ...f })))
        } else {
          setEditFaixas([
            { id: null, de: 0,      ate: 50000,  pct: 5,  bonus: 2000  },
            { id: null, de: 50001,  ate: 150000, pct: 7,  bonus: 4000  },
            { id: null, de: 150001, ate: 300000, pct: 9,  bonus: 8000  },
            { id: null, de: 300001, ate: null,   pct: 12, bonus: 15000 },
          ])
        }
        const mt = mts?.find(m => m.consultor_id === null)
        if (mt) setMetaGlobal(String(mt.meta_valor || ''))
        const ind = {}
        mts?.forEach(m => { if (m.consultor_id) ind[m.consultor_id] = String(m.meta_valor || '') })
        setEditMetas(ind)
      } catch (e) {
        console.error('Erro ao carregar ranking:', e)
      }
      setLoading(false)
    }
    load()
  }, [ano, mes, tenantId])

  // ── Monta ranking ──────────────────────────
  const ranking = useMemo(() => {
    return consultores.map(c => {
      const leadsConsultor = leads.filter(l => l.operador_id === c.id)
      const totalVendas    = leadsConsultor.reduce((s, l) => s + estimarCapital(l.capital_disponivel), 0)
      const qtdLeads       = leadsConsultor.length
      const com            = calcComissao(totalVendas, faixas)
      const metaIndiv      = metas.find(m => m.consultor_id === c.id)
      const metaValor      = metaIndiv?.meta_valor || parseFloat(metaGlobal) || 0
      const pctMeta        = metaValor > 0 ? Math.min(Math.round((totalVendas / metaValor) * 100), 100) : null
      return {
        ...c,
        leadsConsultor,
        totalVendas,
        qtdLeads,
        comissao: com,
        metaValor,
        pctMeta,
      }
    }).sort((a, b) => b.totalVendas - a.totalVendas)
  }, [consultores, leads, faixas, metas, metaGlobal])

  const top3     = ranking.slice(0, 3)
  const demais   = ranking.slice(3)
  const totalGeral = ranking.reduce((s, c) => s + c.totalVendas, 0)

  // ── Salva parametrização ──────────────────
  async function salvarParametros() {
    if (!isDiretor || !tenantId) return
    setSalvando(true)
    try {
      // Deleta faixas antigas e reinsere
      await supabase.from('ranking_config').delete().eq('tenant_id', tenantId)
      const novas = editFaixas.map(f => ({
        tenant_id: tenantId,
        de:    parseFloat(f.de) || 0,
        ate:   f.ate ? parseFloat(f.ate) : null,
        pct:   parseFloat(f.pct) || 0,
        bonus: parseFloat(f.bonus) || 0,
        ativo: true,
      }))
      await supabase.from('ranking_config').insert(novas)

      // Meta global
      if (metaGlobal) {
        await supabase.from('ranking_metas').upsert({
          tenant_id: tenantId, ano, mes: mes + 1,
          consultor_id: null, meta_valor: parseFloat(metaGlobal),
        }, { onConflict: 'tenant_id,ano,mes,consultor_id' })
      }
      // Metas individuais
      for (const [cid, val] of Object.entries(editMetas)) {
        if (val) {
          await supabase.from('ranking_metas').upsert({
            tenant_id: tenantId, ano, mes: mes + 1,
            consultor_id: cid, meta_valor: parseFloat(val),
          }, { onConflict: 'tenant_id,ano,mes,consultor_id' })
        }
      }
      setSalvoOk(true)
      setTimeout(() => setSalvoOk(false), 3000)
    } catch (e) {
      console.error('Erro ao salvar:', e)
    }
    setSalvando(false)
  }

  // ── Seletores de mês ──────────────────────
  const meses = Array.from({ length: 12 }, (_, i) => ({ v: i, l: new Date(2025, i, 1).toLocaleDateString('pt-BR', { month: 'long' }) }))
  const anos  = [anoAtual - 1, anoAtual]

  const medalhas = ['🥇','🥈','🥉']
  const bgPodio  = [
    'from-[#EE7B4D] to-[#EE7B4D]',
    'from-[#94A3B8] to-[#64748B]',
    'from-[#6B7280] to-[#4B5563]',
  ]
  const altPodio = [140, 100, 80]

  // ── Render ────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B1220] pb-20">

      {/* Header */}
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}>
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1">
            Ranking <span className="text-[#EE7B4D] font-bold">de Consultores</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-12 h-0.5 bg-[#EE7B4D] rounded-full" />
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Performance mensal · comissões · metas · premiação
            </p>
          </div>
        </motion.div>
      </div>

      {/* Filtros de período */}
      <div className="px-6 lg:px-10 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-[#0F172A] border border-white/5 rounded-xl p-1">
          {meses.map(m => (
            <button key={m.v} onClick={() => setMes(m.v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                mes === m.v ? 'bg-[#EE7B4D] text-black' : 'text-gray-500 hover:text-white'
              }`}>
              {m.l.substring(0,3)}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#0F172A] border border-white/5 rounded-xl p-1">
          {anos.map(a => (
            <button key={a} onClick={() => setAno(a)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                ano === a ? 'bg-[#EE7B4D] text-black' : 'text-gray-500 hover:text-white'
              }`}>
              {a}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 capitalize">{labelMes(ano, mes)}</span>
      </div>

      {/* Abas */}
      <div className="px-6 lg:px-10 mb-6">
        <div className="flex gap-1 bg-[#0F172A] border border-white/5 rounded-xl p-1 w-fit">
          {[
            { id:'ranking',         label:'🏆 Ranking' },
            { id:'metricas',        label:'📊 Métricas' },
            { id:'relatorio',       label:'📄 Relatório' },
            ...(isDiretor ? [{ id:'parametrizacao', label:'⚙️ Parametrização' }] : []),
          ].map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                aba === a.id ? 'bg-[#EE7B4D] text-black' : 'text-gray-500 hover:text-white'
              }`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p className="text-gray-600 text-sm">Carregando ranking...</p>
          </div>
        </div>
      ) : (
        <div className="px-6 lg:px-10">

          {/* ══════════════════════════════════════
              ABA: RANKING — PÓDIO + LISTA
          ══════════════════════════════════════ */}
          {aba === 'ranking' && (
            <div>
              {/* KPIs gerais */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {[
                  { label:'Total em vendas (mês)', valor:fmtR(totalGeral),  cor:'text-[#EE7B4D]', icon:'💰' },
                  { label:'Consultores ativos',    valor:ranking.length,    cor:'text-white',      icon:'👥' },
                  { label:'Leads convertidos',     valor:leads.length,      cor:'text-[#10B981]',  icon:'🎯' },
                  { label:'Ticket médio',          valor:leads.length > 0 ? fmtR(totalGeral / leads.length) : 'R$ —', cor:'text-[#8B5CF6]', icon:'📈' },
                ].map((k, i) => (
                  <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                    className="bg-[#0F172A] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{k.icon}</span>
                      <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">{k.label}</p>
                    </div>
                    <p className={`text-xl font-black ${k.cor}`}>{k.valor}</p>
                  </motion.div>
                ))}
              </div>

              {ranking.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-4">🏆</p>
                  <p className="text-white font-bold text-lg mb-2">Nenhuma venda este mês ainda</p>
                  <p className="text-gray-500 text-sm">Os consultores aparecerão aqui quando leads forem convertidos.</p>
                  <p className="text-gray-600 text-xs mt-2">Leads com status "convertido", "ganho" ou "fechado" contam para o ranking.</p>
                </div>
              ) : (
                <>
                  {/* PÓDIO */}
                  {top3.length >= 1 && (
                    <div className="mb-10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#EE7B4D] mb-6 text-center">
                        Pódio do mês — {labelMes(ano, mes)}
                      </p>
                      <div className="flex items-end justify-center gap-4 lg:gap-8">
                        {/* Reordena: 2º, 1º, 3º para visual de pódio */}
                        {[1, 0, 2].map(pos => {
                          const c = top3[pos]
                          if (!c) return <div key={pos} className="w-28" />
                          return (
                            <motion.div key={c.id}
                              initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
                              transition={{ delay: pos === 0 ? 0.2 : pos === 1 ? 0 : 0.35, type:'spring', bounce:0.4 }}
                              className="flex flex-col items-center">
                              {/* Avatar */}
                              <div className={`relative w-16 h-16 lg:w-20 lg:h-20 rounded-full border-2 flex items-center justify-center text-2xl font-black shadow-2xl mb-2 bg-gradient-to-br ${bgPodio[pos]}`}
                                style={{ borderColor: pos === 0 ? '#F59E0B' : pos === 1 ? '#CBD5E1' : '#B45309' }}>
                                <span className="text-black">{c.nome?.charAt(0).toUpperCase()}</span>
                                <div className="absolute -top-3 -right-1 text-xl">{medalhas[pos]}</div>
                              </div>
                              <p className="text-white font-bold text-sm text-center leading-tight">{c.nome?.split(' ')[0]}</p>
                              <p className="text-[#EE7B4D] font-black text-base">{fmtR(c.totalVendas)}</p>
                              <p className="text-gray-500 text-[10px]">{c.qtdLeads} lead{c.qtdLeads !== 1 ? 's' : ''}</p>
                              {/* Barra de pódio */}
                              <div className={`mt-3 w-24 lg:w-32 rounded-t-xl bg-gradient-to-t ${bgPodio[pos]}`}
                                style={{ height: altPodio[pos] }}>
                                <div className="text-center pt-2 text-black font-black text-xs">#{pos + 1}</div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* LISTA COMPLETA */}
                  <div className="bg-[#0F172A] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5 grid grid-cols-12 gap-2">
                      <span className="col-span-1 text-[9px] font-black uppercase text-gray-600">#</span>
                      <span className="col-span-4 text-[9px] font-black uppercase text-gray-600">Consultor</span>
                      <span className="col-span-2 text-[9px] font-black uppercase text-gray-600 text-right">Vendas</span>
                      <span className="col-span-2 text-[9px] font-black uppercase text-gray-600 text-right">Comissão</span>
                      <span className="col-span-2 text-[9px] font-black uppercase text-gray-600 text-right">Bônus</span>
                      <span className="col-span-1 text-[9px] font-black uppercase text-gray-600 text-right">Meta</span>
                    </div>
                    {ranking.map((c, i) => (
                      <motion.div key={c.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                        className={`px-5 py-4 grid grid-cols-12 gap-2 items-center border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors ${
                          i === 0 ? 'bg-[#EE7B4D]/5' : i === 1 ? 'bg-white/3' : i === 2 ? 'bg-[#B45309]/5' : ''
                        }`}>
                        <div className="col-span-1 flex items-center">
                          <span className="text-lg">{i < 3 ? medalhas[i] : <span className="text-gray-600 text-sm font-black">{i+1}</span>}</span>
                        </div>
                        <div className="col-span-4 flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-black text-xs bg-gradient-to-br ${bgPodio[i] || 'from-gray-700 to-gray-600'}`}>
                            <span className="text-black">{c.nome?.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-bold text-sm truncate">{c.nome}</p>
                            <p className="text-gray-600 text-[10px]">{c.qtdLeads} lead{c.qtdLeads !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-[#EE7B4D] font-black text-sm">{fmtR(c.totalVendas)}</p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-[#10B981] font-bold text-sm">
                            {c.comissao.pct > 0 ? fmtR(c.totalVendas * c.comissao.pct / 100) : '—'}
                          </p>
                          {c.comissao.pct > 0 && <p className="text-gray-600 text-[10px]">{c.comissao.pct}%</p>}
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-[#8B5CF6] font-bold text-sm">{c.comissao.bonus > 0 ? fmtR(c.comissao.bonus) : '—'}</p>
                        </div>
                        <div className="col-span-1 text-right">
                          {c.pctMeta !== null ? (
                            <div>
                              <p className={`text-xs font-black ${c.pctMeta >= 100 ? 'text-[#10B981]' : c.pctMeta >= 70 ? 'text-[#EE7B4D]' : 'text-[#EF4444]'}`}>
                                {c.pctMeta}%
                              </p>
                              <div className="w-full h-1 bg-white/10 rounded-full mt-0.5">
                                <div className={`h-1 rounded-full ${c.pctMeta >= 100 ? 'bg-[#10B981]' : c.pctMeta >= 70 ? 'bg-[#EE7B4D]' : 'bg-[#EF4444]'}`}
                                  style={{ width:`${c.pctMeta}%` }} />
                              </div>
                            </div>
                          ) : <span className="text-gray-700 text-xs">—</span>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              ABA: MÉTRICAS — POR CONSULTOR
          ══════════════════════════════════════ */}
          {aba === 'metricas' && (
            <div className="space-y-4">
              {ranking.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-5xl mb-4">📊</p>
                  <p className="text-gray-500 text-sm">Nenhuma métrica ainda. Aguardando conversões no mês selecionado.</p>
                </div>
              ) : ranking.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                  className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg bg-gradient-to-br ${bgPodio[i] || 'from-gray-700 to-gray-600'}`}>
                        <span className="text-black">{c.nome?.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{c.nome}</p>
                          {i < 3 && <span className="text-base">{medalhas[i]}</span>}
                        </div>
                        <p className="text-gray-500 text-xs">{c.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#EE7B4D] font-black text-xl">{fmtR(c.totalVendas)}</p>
                      <p className="text-gray-500 text-xs">{c.qtdLeads} lead{c.qtdLeads !== 1 ? 's' : ''} convertido{c.qtdLeads !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {[
                      { l:'Comissão (%)',  v: c.comissao.pct > 0 ? fmtR(c.totalVendas * c.comissao.pct / 100) : '—', sub: c.comissao.pct > 0 ? `${c.comissao.pct}% sobre vendas` : 'Sem faixa ativa', cor:'text-[#10B981]' },
                      { l:'Bônus fixo',    v: c.comissao.bonus > 0 ? fmtR(c.comissao.bonus) : '—', sub: c.comissao.faixa?.label || '', cor:'text-[#8B5CF6]' },
                      { l:'Total a receber', v: c.comissao.total > 0 ? fmtR(c.comissao.total) : '—', sub:'comissão + bônus', cor:'text-[#EE7B4D]' },
                      { l:'Ticket médio',  v: c.qtdLeads > 0 ? fmtR(c.totalVendas / c.qtdLeads) : '—', sub:'por lead convertido', cor:'text-white' },
                    ].map((m, mi) => (
                      <div key={mi} className="bg-[#0B1220] rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-1">{m.l}</p>
                        <p className={`text-lg font-black ${m.cor}`}>{m.v}</p>
                        <p className="text-[10px] text-gray-600">{m.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Barra de meta */}
                  {c.pctMeta !== null && (
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-500">Meta: {fmtR(c.metaValor)}</span>
                        <span className={`font-black ${c.pctMeta >= 100 ? 'text-[#10B981]' : c.pctMeta >= 70 ? 'text-[#EE7B4D]' : 'text-[#EF4444]'}`}>
                          {c.pctMeta}% atingido
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width:0 }} animate={{ width:`${c.pctMeta}%` }} transition={{ delay:0.3 + i*0.05, duration:0.8 }}
                          className={`h-2 rounded-full ${c.pctMeta >= 100 ? 'bg-[#10B981]' : c.pctMeta >= 70 ? 'bg-[#EE7B4D]' : 'bg-[#EF4444]'}`} />
                      </div>
                    </div>
                  )}

                  {/* Leads do consultor */}
                  {c.leadsConsultor.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-white transition-colors select-none">
                        Ver {c.leadsConsultor.length} lead{c.leadsConsultor.length !== 1 ? 's' : ''} convertido{c.leadsConsultor.length !== 1 ? 's' : ''}
                      </summary>
                      <div className="mt-2 space-y-1.5">
                        {c.leadsConsultor.map(l => (
                          <div key={l.id} className="flex items-center justify-between bg-[#0B1220] rounded-xl px-3 py-2">
                            <div>
                              <p className="text-white text-xs font-bold">{l.nome}</p>
                              <p className="text-gray-600 text-[10px]">{new Date(l.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <p className="text-[#EE7B4D] font-bold text-xs">{fmtR(estimarCapital(l.capital_disponivel))}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════
              ABA: RELATÓRIO
          ══════════════════════════════════════ */}
          {aba === 'relatorio' && (
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-white font-bold capitalize">Relatório — {labelMes(ano, mes)}</p>
                <button
                  onClick={() => {
                    const linhas = [
                      ['Posição','Consultor','Leads','Total Vendas','Comissão %','Valor Comissão','Bônus','Total a Receber','% Meta'],
                      ...ranking.map((c, i) => [
                        i + 1, c.nome, c.qtdLeads,
                        c.totalVendas, c.comissao.pct,
                        Math.round(c.totalVendas * c.comissao.pct / 100),
                        c.comissao.bonus,
                        Math.round(c.comissao.total),
                        c.pctMeta ?? '',
                      ]),
                    ]
                    const csv = linhas.map(r => r.join(',')).join('\n')
                    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8' })
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = `ranking-${ano}-${String(mes+1).padStart(2,'0')}.csv`
                    a.click()
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#EE7B4D]/10 text-[#EE7B4D] border border-[#EE7B4D]/20 hover:bg-[#EE7B4D]/20 transition-all">
                  📥 Exportar CSV
                </button>
              </div>

              {/* Tabela de relatório */}
              <div className="bg-[#0F172A] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0B1220]">
                      {['#','Consultor','Leads','Vendas','% Com.','Comissão','Bônus','Total','Meta'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase text-gray-500 first:text-center">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ranking.map((c, i) => (
                      <tr key={c.id} className={`hover:bg-white/2 transition-colors ${i === 0 ? 'bg-[#EE7B4D]/5' : ''}`}>
                        <td className="px-4 py-3 text-center">{i < 3 ? medalhas[i] : <span className="text-gray-600">{i+1}</span>}</td>
                        <td className="px-4 py-3 text-white font-bold">{c.nome}</td>
                        <td className="px-4 py-3 text-gray-300">{c.qtdLeads}</td>
                        <td className="px-4 py-3 text-[#EE7B4D] font-bold">{fmtR(c.totalVendas)}</td>
                        <td className="px-4 py-3 text-gray-300">{c.comissao.pct > 0 ? `${c.comissao.pct}%` : '—'}</td>
                        <td className="px-4 py-3 text-[#10B981] font-bold">{c.comissao.pct > 0 ? fmtR(c.totalVendas * c.comissao.pct / 100) : '—'}</td>
                        <td className="px-4 py-3 text-[#8B5CF6] font-bold">{c.comissao.bonus > 0 ? fmtR(c.comissao.bonus) : '—'}</td>
                        <td className="px-4 py-3 text-white font-black">{c.comissao.total > 0 ? fmtR(c.comissao.total) : '—'}</td>
                        <td className="px-4 py-3">
                          {c.pctMeta !== null ? (
                            <span className={`font-black ${c.pctMeta >= 100 ? 'text-[#10B981]' : c.pctMeta >= 70 ? 'text-[#EE7B4D]' : 'text-[#EF4444]'}`}>
                              {c.pctMeta}%
                            </span>
                          ) : <span className="text-gray-700">—</span>}
                        </td>
                      </tr>
                    ))}
                    {/* Totais */}
                    <tr className="bg-[#0B1220] border-t-2 border-white/10">
                      <td colSpan={2} className="px-4 py-3 text-white font-black text-xs uppercase tracking-wider">TOTAL GERAL</td>
                      <td className="px-4 py-3 text-white font-black">{leads.length}</td>
                      <td className="px-4 py-3 text-[#EE7B4D] font-black">{fmtR(totalGeral)}</td>
                      <td colSpan={2} className="px-4 py-3 text-[#10B981] font-black">
                        {fmtR(ranking.reduce((s,c) => s + c.totalVendas * c.comissao.pct / 100, 0))}
                      </td>
                      <td className="px-4 py-3 text-[#8B5CF6] font-black">
                        {fmtR(ranking.reduce((s,c) => s + c.comissao.bonus, 0))}
                      </td>
                      <td className="px-4 py-3 text-white font-black">
                        {fmtR(ranking.reduce((s,c) => s + c.comissao.total, 0))}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] text-gray-600 mt-3 text-center">
                * Valores de capital estimados com base no campo capital_disponivel do lead. Para valores exatos, verifique com cada consultor.
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════
              ABA: PARAMETRIZAÇÃO (só Diretores)
          ══════════════════════════════════════ */}
          {aba === 'parametrizacao' && isDiretor && (
            <div className="max-w-2xl space-y-6">

              {/* Faixas de comissão */}
              <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-black text-white">Faixas de Comissão</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Configure % de comissão + bônus fixo por faixa de vendas mensal</p>
                  </div>
                  <button onClick={() => setEditFaixas(f => [...f, { id:null, de: 0, ate: null, pct: 5, bonus: 0 }])}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                    + Faixa
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Cabeçalho */}
                  <div className="grid grid-cols-10 gap-2 px-1">
                    {['De (R$)','Até (R$)','Comissão %','Bônus (R$)',''].map(h => (
                      <span key={h} className={`text-[9px] font-black uppercase text-gray-600 ${h==='' ? 'col-span-1' : 'col-span-2'}`}>{h}</span>
                    ))}
                  </div>
                  {editFaixas.map((f, i) => (
                    <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }}
                      className="grid grid-cols-10 gap-2 items-center bg-[#0B1220] rounded-xl p-3">
                      <input type="number" value={f.de} onChange={e => setEditFaixas(fs => fs.map((x,xi) => xi===i ? {...x, de: e.target.value} : x))}
                        className="col-span-2 bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#EE7B4D]/50"
                        placeholder="0" min="0" />
                      <input type="number" value={f.ate ?? ''} onChange={e => setEditFaixas(fs => fs.map((x,xi) => xi===i ? {...x, ate: e.target.value || null} : x))}
                        className="col-span-2 bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#EE7B4D]/50"
                        placeholder="Sem limite" min="0" />
                      <div className="col-span-2 flex items-center gap-1">
                        <input type="number" value={f.pct} onChange={e => setEditFaixas(fs => fs.map((x,xi) => xi===i ? {...x, pct: e.target.value} : x))}
                          className="w-full bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-[#10B981] font-bold focus:outline-none focus:border-[#EE7B4D]/50"
                          placeholder="5" min="0" max="100" step="0.5" />
                        <span className="text-gray-600 text-xs">%</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <span className="text-gray-600 text-xs">R$</span>
                        <input type="number" value={f.bonus} onChange={e => setEditFaixas(fs => fs.map((x,xi) => xi===i ? {...x, bonus: e.target.value} : x))}
                          className="w-full bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-xs text-[#8B5CF6] font-bold focus:outline-none focus:border-[#EE7B4D]/50"
                          placeholder="0" min="0" />
                      </div>
                      <button onClick={() => setEditFaixas(fs => fs.filter((_, xi) => xi !== i))}
                        className="col-span-1 flex items-center justify-center text-gray-600 hover:text-[#EF4444] transition-colors text-base">
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Preview ao vivo */}
                {editFaixas.length > 0 && (
                  <div className="mt-4 p-3 bg-[#0B1220] rounded-xl">
                    <p className="text-[9px] font-black uppercase text-gray-600 mb-2">Preview das faixas</p>
                    <div className="space-y-1">
                      {editFaixas.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]">
                          <span className="text-gray-500">{fmtR(parseFloat(f.de)||0)} — {f.ate ? fmtR(parseFloat(f.ate)) : '∞'}</span>
                          <span className="text-[#10B981] font-bold">{f.pct}% comissão</span>
                          <span className="text-gray-600">+</span>
                          <span className="text-[#8B5CF6] font-bold">{fmtR(parseFloat(f.bonus)||0)} bônus</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Meta global + individuais */}
              <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
                <p className="text-sm font-black text-white mb-1">Metas — {labelMes(ano, mes)}</p>
                <p className="text-[10px] text-gray-500 mb-4">Meta global aplicada a todos. Meta individual sobrepõe a global para aquele consultor.</p>

                <div className="mb-5">
                  <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Meta Global (todos os consultores)</p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">R$</span>
                    <input type="number" value={metaGlobal} onChange={e => setMetaGlobal(e.target.value)}
                      className="flex-1 bg-[#0B1220] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#EE7B4D]/50"
                      placeholder="Ex: 200000" min="0" />
                    {metaGlobal && <span className="text-[#EE7B4D] text-xs font-bold">{fmtR(parseFloat(metaGlobal))}</span>}
                  </div>
                </div>

                {consultores.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Metas Individuais (opcional)</p>
                    <div className="space-y-2">
                      {consultores.map(c => (
                        <div key={c.id} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#EE7B4D] to-[#EE7B4D] flex items-center justify-center text-black font-black text-xs shrink-0">
                            {c.nome?.charAt(0)}
                          </div>
                          <p className="text-gray-300 text-xs flex-1 truncate">{c.nome}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 text-xs">R$</span>
                            <input type="number" value={editMetas[c.id] || ''} onChange={e => setEditMetas(m => ({...m, [c.id]: e.target.value}))}
                              className="w-32 bg-[#0B1220] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#EE7B4D]/50"
                              placeholder={metaGlobal || 'Global'} min="0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botão salvar */}
              <button onClick={salvarParametros} disabled={salvando}
                className="w-full py-4 rounded-2xl text-sm font-black bg-[#EE7B4D] text-black hover:bg-[#D97706] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {salvando ? (
                  <><span className="animate-spin">⏳</span> Salvando...</>
                ) : salvoOk ? (
                  <><span>✅</span> Parametros salvos com sucesso!</>
                ) : (
                  <><span>💾</span> Salvar Parametrização</>
                )}
              </button>

              <div className="bg-[#0F172A] border border-[#EE7B4D]/20 rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase text-[#EE7B4D] mb-2">SQL necessário no Supabase</p>
                <pre className="text-[10px] text-gray-500 font-mono overflow-x-auto whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS ranking_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  de NUMERIC NOT NULL DEFAULT 0,
  ate NUMERIC,
  pct NUMERIC NOT NULL DEFAULT 0,
  bonus NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ranking_metas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  consultor_id UUID,
  ano INT NOT NULL,
  mes INT NOT NULL,
  meta_valor NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, ano, mes, consultor_id)
);`}</pre>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
