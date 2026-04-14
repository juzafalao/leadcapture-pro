// RankingPage  Ranking de Consultores
// Paleta oficial: #0F172A fundo, #10B981 verde/ativo, cinzas
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const now    = new Date()
const ANO    = now.getFullYear()
const MES    = now.getMonth() + 1

function fmtMoeda(v) {
  if (!v) return 'R$ 0'
  const n = parseFloat(v)
  if (n >= 1_000_000) return `R$ ${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `R$ ${(n/1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

//  Medalhas do pdio 
const PODIO = [
  { pos: 1, cor: '#10B981', ring: 'ring-[#10B981]', label: '1', size: 'w-20 h-20 text-3xl' },
  { pos: 2, cor: '#94A3B8', ring: 'ring-[#94A3B8]', label: '2', size: 'w-16 h-16 text-2xl' },
  { pos: 3, cor: '#6B7280', ring: 'ring-[#6B7280]', label: '3', size: 'w-14 h-14 text-xl' },
]

function PodioCard({ rank, consultor, cor, ring, label, size }) {
  if (!consultor) return (
    <div className={`flex flex-col items-center gap-2 ${rank === 1 ? 'mb-0' : 'mt-6'}`}>
      <div className={`${size} rounded-full bg-white/5 border border-white/10 flex items-center justify-center`}>
        <span className="text-gray-700 text-lg font-black">{label}</span>
      </div>
      <p className="text-[10px] text-gray-700 uppercase tracking-wider">Sem dados</p>
    </div>
  )
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08 }}
      className={`flex flex-col items-center gap-2 ${rank === 1 ? 'mb-0' : 'mt-6'}`}
    >
      <div className={`${size} rounded-full ring-2 ${ring} flex items-center justify-center font-black text-white bg-white/[0.04]`}
        style={{ background: `linear-gradient(135deg, ${cor}22, ${cor}11)` }}>
        {consultor.role_emoji || consultor.nome?.charAt(0) || '?'}
      </div>
      <div className="text-center">
        <p className="text-white text-[11px] font-black leading-tight">{consultor.nome?.split(' ')[0]}</p>
        <p className="font-black text-[10px]" style={{ color: cor }}>{consultor.total_leads} leads</p>
        <p className="text-[9px] text-gray-600">{fmtMoeda(consultor.capital_total)}</p>
      </div>
      <div className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{ background: `${cor}20`, color: cor }}>
        {label}
      </div>
    </motion.div>
  )
}

//  Linha da tabela 
function RankRow({ consultor, pos, meta }) {
  const pct  = meta > 0 ? Math.min(Math.round((consultor.total_leads / meta) * 100), 100) : 0
  const cor  = pos === 1 ? '#10B981' : pos === 2 ? '#94A3B8' : pos === 3 ? '#6B7280' : '#475569'
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: pos * 0.04 }}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0"
    >
      <span className="w-6 text-center font-black text-[11px] shrink-0" style={{ color: cor }}>
        {pos <= 3 ? ['','',''][pos-1] : pos}
      </span>
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm bg-white/[0.04] border border-white/10 shrink-0" style={{ color: cor }}>
        {consultor.role_emoji || consultor.nome?.charAt(0) || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-[11px] font-bold truncate">{consultor.nome}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: cor }} />
          </div>
          <span className="text-[9px] text-gray-600 shrink-0">{pct}% da meta</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[12px] font-black text-white">{consultor.total_leads}</p>
        <p className="text-[9px] text-gray-600">leads</p>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-[11px] font-bold text-[#10B981]">{fmtMoeda(consultor.capital_total)}</p>
        <p className="text-[9px] text-gray-600">capital</p>
      </div>
    </motion.div>
  )
}

//  Pgina principal 
export default function RankingPage() {
  const { usuario } = useAuth()
  const tenantId    = usuario?.is_super_admin ? null : usuario?.tenant_id
  const isDiretor   = ['Diretor','Administrador','admin'].includes(usuario?.role) || usuario?.is_super_admin === true || usuario?.is_platform === true

  const [aba, setAba]           = useState('ranking')
  const [periodo, setPeriodo]   = useState({ ano: ANO, mes: MES })
  const [consultores, setConsultores] = useState([])
  const [meta, setMeta]         = useState(30)
  const [loading, setLoading]   = useState(true)
  const [config, setConfig]     = useState([])

  // Carrega dados reais
  useEffect(() => {
    async function carregar() {
      setLoading(true)
      try {
        // Busca leads do mes com id_operador_responsavel
        const inicio = new Date(periodo.ano, periodo.mes - 1, 1).toISOString()
        const fim    = new Date(periodo.ano, periodo.mes,     0, 23, 59, 59).toISOString()

        let qLeads = supabase
          .from('leads')
          .select('id, score, categoria, capital_disponivel, id_operador_responsavel, operador_id, status, created_at')
          .gte('created_at', inicio)
          .lte('created_at', fim)
          .is('deleted_at', null)

        if (tenantId) qLeads = qLeads.eq('tenant_id', tenantId)
        const { data: leads } = await qLeads

        // Busca TODOS os usuarios do tenant (sem filtrar por role -- roles podem variar)
        let qUsers = supabase
          .from('usuarios')
          .select('id, nome, role, role_emoji, role_color')
          .neq('role', 'Cliente')  // exclui apenas clientes finais
        if (tenantId) qUsers = qUsers.eq('tenant_id', tenantId)
        const { data: users, error: usersError } = await qUsers

        if (usersError) console.error('[Ranking] Erro usuarios:', usersError)

        // Se nao achar por tenant, tenta sem filtro (fallback para superadmin)
        if (!users?.length && !tenantId) {
          const { data: allUsers } = await supabase
            .from('usuarios')
            .select('id, nome, role, role_emoji, role_color')
            .limit(50)
          if (allUsers?.length) {
            setConsultores(allUsers.map(u => ({ ...u, total_leads: 0, leads_hot: 0, convertidos: 0, capital_total: 0 })))
            setLoading(false)
            return
          }
        }

        if (!users?.length) { setConsultores([]); setLoading(false); return }

        // Agrupa leads por consultor -- tenta id_operador_responsavel e operador_id (alias)
        const mapaLeads = {}
        for (const lead of (leads || [])) {
          const uid = lead.id_operador_responsavel || lead.operador_id
          if (!uid) continue
          if (!mapaLeads[uid]) mapaLeads[uid] = { total: 0, hot: 0, convertido: 0, capital: 0 }
          mapaLeads[uid].total++
          if (lead.categoria === 'hot')     mapaLeads[uid].hot++
          if (lead.status === 'convertido') mapaLeads[uid].convertido++
          mapaLeads[uid].capital += parseFloat(lead.capital_disponivel || 0)
        }

        const ranking = users
          .map(u => ({
            ...u,
            total_leads:  mapaLeads[u.id]?.total     ?? 0,
            leads_hot:    mapaLeads[u.id]?.hot        ?? 0,
            convertidos:  mapaLeads[u.id]?.convertido ?? 0,
            capital_total:mapaLeads[u.id]?.capital    ?? 0,
          }))
          .sort((a, b) => b.total_leads - a.total_leads || b.capital_total - a.capital_total)

        setConsultores(ranking)

        // Busca meta do ms
        const { data: metaData } = await supabase
          .from('ranking_metas')
          .select('meta_valor')
          .eq('ano', periodo.ano)
          .eq('mes', periodo.mes)
          .is('consultor_id', null)
          .maybeSingle()

        if (metaData?.meta_valor) setMeta(metaData.meta_valor)

        // Busca config de faixas
        if (isDiretor) {
          let qCfg = supabase.from('ranking_config').select('*').eq('ativo', true).order('de')
          if (tenantId) qCfg = qCfg.eq('tenant_id', tenantId)
          const { data: cfgData } = await qCfg
          setConfig(cfgData || [])
        }
      } catch (err) {
        console.error('[Ranking]', err)
      }
      setLoading(false)
    }
    carregar()
  }, [tenantId, periodo, isDiretor])

  const top3 = consultores.slice(0, 3)

  //  CSV Export 
  function exportCSV() {
    const header = 'Posicao,Nome,Leads,HOT,Convertidos,Capital\n'
    const rows   = consultores.map((c, i) =>
      `${i+1},"${c.nome}",${c.total_leads},${c.leads_hot},${c.convertidos},"${fmtMoeda(c.capital_total)}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `ranking-${periodo.ano}-${String(periodo.mes).padStart(2,'0')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0F172A] pb-16">

      {/* Header */}
      <div className="px-6 lg:px-10 pt-7 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-light text-white">
              Ranking de <span className="text-[#10B981] font-bold">Consultores</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-0.5 bg-[#10B981] rounded-full" />
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
                {MESES[periodo.mes-1]} {periodo.ano}
              </p>
            </div>
          </div>
          {/* Seletor de ms */}
          <div className="flex items-center gap-2">
            <select
              value={`${periodo.ano}-${periodo.mes}`}
              onChange={e => {
                const [a, m] = e.target.value.split('-')
                setPeriodo({ ano: parseInt(a), mes: parseInt(m) })
              }}
              className="bg-[#0B1220] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#10B981]/50"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date(ANO, MES - 1 - i, 1)
                const m = d.getMonth() + 1
                const a = d.getFullYear()
                return <option key={`${a}-${m}`} value={`${a}-${m}`}>{MESES[m-1]} {a}</option>
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="px-6 lg:px-10 pt-5 mb-5">
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit">
          {[
            { id: 'ranking',  label: ' Ranking' },
            { id: 'relatorio',label: ' Relatrio' },
            ...(isDiretor ? [{ id: 'config', label: ' Config' }] : []),
          ].map(tab => (
            <button key={tab.id} onClick={() => setAba(tab.id)}
              className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
                aba === tab.id
                  ? 'bg-[#10B981] text-black shadow-md shadow-[#10B981]/20'
                  : 'text-gray-500 hover:text-white'
              }`}>{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 lg:px-10">

        {/*  ABA: RANKING  */}
        {aba === 'ranking' && (
          <div className="space-y-6">
            {/* Pdio */}
            {consultores.length > 0 && (
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-6">Pdio</p>
                <div className="flex items-end justify-center gap-8">
                  {/* Ordem visual: 2, 1, 3 */}
                  <PodioCard rank={2} consultor={top3[1]} {...PODIO[1]} />
                  <PodioCard rank={1} consultor={top3[0]} {...PODIO[0]} />
                  <PodioCard rank={3} consultor={top3[2]} {...PODIO[2]} />
                </div>
              </div>
            )}

            {/* Lista completa */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                  Todos os consultores  Meta: {meta} leads
                </p>
                <span className="text-[10px] font-bold text-[#10B981]">{consultores.length} consultores</span>
              </div>
              {consultores.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-gray-500 text-2xl mb-3">?</p>
                  <p className="text-white text-sm font-bold mb-2">Nenhum usuario encontrado</p>
                  <p className="text-gray-600 text-xs max-w-xs mx-auto leading-relaxed">
                    Verifique se ha usuarios cadastrados em <strong className="text-gray-400">/usuarios</strong>.
                    Todos os usuarios aparecem no ranking. Leads sem operador atribuido ficam com 0.
                  </p>
                </div>
              ) : (
                consultores.map((c, i) => (
                  <RankRow key={c.id} consultor={c} pos={i+1} meta={meta} />
                ))
              )}
            </div>
          </div>
        )}

        {/*  ABA: RELATRIO  */}
        {aba === 'relatorio' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/20 transition-all">
                 Exportar CSV
              </button>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['#','Consultor','Leads','HOT','Convertidos','Capital'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-wider text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consultores.map((c, i) => (
                    <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-black text-gray-500">{i+1}</td>
                      <td className="px-4 py-3 text-white font-bold">{c.nome}</td>
                      <td className="px-4 py-3 font-black text-white">{c.total_leads}</td>
                      <td className="px-4 py-3 font-bold text-red-400">{c.leads_hot}</td>
                      <td className="px-4 py-3 font-bold text-[#10B981]">{c.convertidos}</td>
                      <td className="px-4 py-3 font-bold text-[#10B981]">{fmtMoeda(c.capital_total)}</td>
                    </tr>
                  ))}
                  {!consultores.length && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600">Sem dados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/*  ABA: CONFIG (Diretor+)  */}
        {aba === 'config' && isDiretor && (
          <div className="max-w-lg space-y-5">
            {/* Meta mensal */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-3">Meta Mensal Global</p>
              <div className="flex items-center gap-3">
                <input
                  type="number" value={meta} min={1}
                  onChange={e => setMeta(parseInt(e.target.value) || 0)}
                  className="flex-1 bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]/50"
                />
                <button
                  onClick={async () => {
                    const { error } = await supabase.from('ranking_metas').upsert({
                      tenant_id: tenantId, ano: periodo.ano, mes: periodo.mes,
                      consultor_id: null, meta_valor: meta,
                    }, { onConflict: 'tenant_id,ano,mes,consultor_id' })
                    if (!error) alert('Meta salva!')
                  }}
                  className="px-4 py-2.5 rounded-xl text-[11px] font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all"
                >
                  Salvar
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-2">Quantidade de leads por consultor no ms</p>
            </div>

            {/* Faixas de comisso */}
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-600 mb-3">
                Faixas de Comisso  {config.length} configuradas
              </p>
              {config.length === 0 ? (
                <p className="text-gray-600 text-xs">
                  Execute o SQL <code className="text-[#10B981]">ranking_setup_v2.sql</code> para configurar faixas.
                </p>
              ) : (
                <div className="space-y-2">
                  {config.map((faixa, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-[11px] text-gray-400">
                        {fmtMoeda(faixa.de)}  {faixa.ate ? fmtMoeda(faixa.ate) : ''}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-[#10B981]">{faixa.pct}%</span>
                        {faixa.bonus > 0 && (
                          <span className="text-[10px] text-[#10B981]">+{fmtMoeda(faixa.bonus)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
