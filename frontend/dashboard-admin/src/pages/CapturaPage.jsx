// CapturaPage.jsx — Captura de Leads + Importação via Planilha
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import { Radio, Globe, MessageCircle, Bot, Webhook, Upload, Zap, ArrowRight, X, AlertTriangle, CheckCircle } from 'lucide-react'

// ── Canais planejados ─────────────────────────────────────
const CANAIS = [
  { icon: MessageCircle, color: '#25D366', label: 'WhatsApp',      desc: 'Captura automática via número conectado' },
  { icon: Globe,         color: '#6366F1', label: 'Formulário Web', desc: 'Widget embedável em qualquer site' },
  { icon: Bot,           color: '#F59E0B', label: 'Chatbot',        desc: 'Bot com qualificação automática' },
  { icon: Zap,           color: '#EA580C', label: 'n8n / Make',     desc: 'Integração via workflows de automação' },
  { icon: Webhook,       color: '#8B5CF6', label: 'API / Webhook',  desc: 'Endpoint REST para qualquer plataforma' },
]

// ── Mapeamento de colunas ─────────────────────────────────
const FIELD_MAP = [
  { key: 'nome',               aliases: ['nome','name','lead','cliente','contato'],               required: true  },
  { key: 'telefone',           aliases: ['telefone','phone','fone','celular','whatsapp','tel'],   required: false },
  { key: 'email',              aliases: ['email','e-mail','mail'],                                required: false },
  { key: 'capital_disponivel', aliases: ['capital','valor','investimento','patrimonio','budget'], required: false },
  { key: 'regiao_interesse',   aliases: ['regiao','região','cidade','estado','uf','local'],       required: false },
  { key: 'fonte',              aliases: ['fonte','canal','origem','source'],                      required: false },
  { key: 'observacao',         aliases: ['obs','observacao','observação','nota','note'],          required: false },
]

// ── Score automático por capital investido ────────────────
function calcularScore(capital) {
  const cap = parseFloat(capital || 0)
  if (isNaN(cap) || cap <= 0) return 10
  if (cap < 10_000)   return Math.round(10 + (cap / 10_000) * 20)
  if (cap < 50_000)   return Math.round(30 + ((cap - 10_000) / 40_000) * 20)
  if (cap < 150_000)  return Math.round(50 + ((cap - 50_000) / 100_000) * 20)
  if (cap < 500_000)  return Math.round(70 + ((cap - 150_000) / 350_000) * 20)
  return Math.min(100, Math.round(90 + ((cap - 500_000) / 500_000) * 10))
}

function calcularCategoria(score) {
  if (score >= 70) return 'hot'
  if (score >= 40) return 'warm'
  return 'cold'
}

function detectMapping(headers) {
  const result = {}
  for (const field of FIELD_MAP) {
    const h = headers.find(h => field.aliases.some(a => h.toLowerCase().trim().includes(a)))
    if (h) result[field.key] = h
  }
  return result
}

// ── Barra de progresso ────────────────────────────────────
function ProgressBar({ value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
        <span>{value} de {total}</span><span>{pct}%</span>
      </div>
      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-[#10B981]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
      </div>
    </div>
  )
}

// ── Importação ────────────────────────────────────────────
function ImportacaoPlanilha({ tenantId }) {
  const [arquivo,   setArquivo]   = useState(null)
  const [headers,   setHeaders]   = useState([])
  const [rows,      setRows]      = useState([])
  const [mapping,   setMapping]   = useState({})
  const [preview,   setPreview]   = useState([])
  const [importing, setImporting] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [resultado, setResultado] = useState(null)
  const [dragOver,  setDragOver]  = useState(false)
  const [erro,      setErro]      = useState(null)
  const fileRef = useRef(null)

  function reset() {
    setArquivo(null); setHeaders([]); setRows([]); setMapping({})
    setPreview([]); setResultado(null); setErro(null); setProgress(0)
  }

  function parseFile(file) {
    setErro(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'binary' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (!data || data.length < 2) { setErro('Planilha vazia ou sem dados'); return }
        const rawHeaders = data[0].map(String)
        const rawRows    = data.slice(1).filter(r => r.some(c => String(c).trim()))
        setHeaders(rawHeaders)
        setRows(rawRows)
        setMapping(detectMapping(rawHeaders))
        setPreview(rawRows.slice(0, 8))
      } catch (ex) { setErro('Erro ao ler arquivo: ' + ex.message) }
    }
    reader.readAsBinaryString(file)
  }

  function onFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setArquivo(f)
    parseFile(f)
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) { setArquivo(f); parseFile(f) }
  }

  function getVal(row, fieldKey) {
    const col = mapping[fieldKey]
    if (!col) return ''
    const idx = headers.indexOf(col)
    return idx >= 0 ? String(row[idx] ?? '').trim() : ''
  }

  async function importar() {
    if (!tenantId) { setErro('Tenant não identificado.'); return }
    if (!mapping.nome) { setErro('Mapeie a coluna "Nome" antes de importar.'); return }
    const validos = rows.filter(r => getVal(r, 'nome').length > 1)
    if (!validos.length) { setErro('Nenhum nome válido encontrado.'); return }

    setImporting(true); setProgress(0); setResultado(null); setErro(null)
    let ok = 0, fail = 0
    const BATCH = 20

    for (let i = 0; i < validos.length; i += BATCH) {
      const batch = validos.slice(i, i + BATCH).map(row => {
        const capRaw  = getVal(row, 'capital_disponivel')
        const capNum  = capRaw ? parseFloat(capRaw.replace(/[^\d.,]/g,'').replace(',','.')) || null : null
        const score   = calcularScore(capNum)
        return {
          tenant_id:          tenantId,
          nome:               getVal(row, 'nome'),
          telefone:           getVal(row, 'telefone') || null,
          email:              getVal(row, 'email') || null,
          capital_disponivel: capNum,
          regiao_interesse:   getVal(row, 'regiao_interesse') || null,
          fonte:              getVal(row, 'fonte') || 'importacao_planilha',
          observacao:         getVal(row, 'observacao') || null,
          status:             'novo',
          score,
          categoria:          calcularCategoria(score),
          created_at:         new Date().toISOString(),
        }
      })
      const { error } = await supabase.from('leads').insert(batch)
      error ? (fail += batch.length) : (ok += batch.length)
      setProgress(Math.min(i + BATCH, validos.length))
      await new Promise(r => setTimeout(r, 80))
    }

    setImporting(false)
    setResultado({ ok, fail, total: validos.length })
  }

  // Resultado
  if (resultado) return (
    <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-6 text-center">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${resultado.fail === 0 ? 'bg-[#10B981]/15' : 'bg-[#F59E0B]/15'}`}>
        <CheckCircle className={`w-7 h-7 ${resultado.fail === 0 ? 'text-[#10B981]' : 'text-[#F59E0B]'}`} />
      </div>
      <p className="text-white font-bold text-lg mb-4">Importação concluída</p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Importados', value: resultado.ok,   color: 'text-[#10B981]' },
          { label: 'Erros',      value: resultado.fail, color: resultado.fail > 0 ? 'text-red-400' : 'text-gray-500' },
          { label: 'Total',      value: resultado.total,color: 'text-white' },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.04] rounded-xl p-3">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-gray-400 hover:text-white transition-all">
          Nova importação
        </button>
        <a href="/pipeline" className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all">
          Ver no Pipeline
        </a>
      </div>
    </div>
  )

  return (
    <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 flex items-center justify-center">
            <Upload className="w-4 h-4 text-[#10B981]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">Importar via Planilha</p>
            <p className="text-[10px] text-gray-500">CSV ou XLSX — os leads entram como "Lead Novo" na base</p>
          </div>
        </div>
        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">DIRETOR+</span>
      </div>

      <div className="p-5 space-y-4">
        {erro && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-[11px] text-red-400">{erro}</p>
          </div>
        )}

        {/* Drop zone */}
        {!arquivo && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver ? 'border-[#10B981]/60 bg-[#10B981]/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-gray-400 mb-1">Arraste a planilha ou clique para selecionar</p>
            <p className="text-[10px] text-gray-600">Formatos: .xlsx, .xls, .csv</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
          </div>
        )}

        {/* Arquivo carregado */}
        {arquivo && rows.length > 0 && (
          <>
            {/* Info arquivo */}
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <div>
                <p className="text-[12px] font-semibold text-white">{arquivo.name}</p>
                <p className="text-[10px] text-gray-500">{rows.length} linhas detectadas</p>
              </div>
              <button onClick={reset} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mapeamento */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-600 mb-2">
                Mapeamento de colunas
                <span className="text-gray-700 normal-case tracking-normal font-normal ml-2">(detectado automaticamente)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FIELD_MAP.map(field => (
                  <div key={field.key} className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-wider w-[96px] shrink-0 ${field.required ? 'text-[#10B981]' : 'text-gray-600'}`}>
                      {field.key.replace(/_/g,' ')}{field.required ? ' *' : ''}
                    </span>
                    <select
                      value={mapping[field.key] || ''}
                      onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value || undefined }))}
                      className="flex-1 bg-[#0B1220] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[10px] text-gray-300 focus:outline-none focus:border-[#10B981]/40 min-w-0"
                    >
                      <option value="">— ignorar —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-600 mb-2">Pré-visualização ({preview.length} primeiros)</p>
              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-[10px] min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Nome','Telefone','E-mail','Capital','Região','Fonte'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-white font-medium truncate max-w-[110px]">{getVal(row,'nome')||'—'}</td>
                        <td className="px-3 py-2 text-gray-500">{getVal(row,'telefone')||'—'}</td>
                        <td className="px-3 py-2 text-gray-500 truncate max-w-[110px]">{getVal(row,'email')||'—'}</td>
                        <td className="px-3 py-2 text-[#10B981]">{getVal(row,'capital_disponivel')||'—'}</td>
                        <td className="px-3 py-2 text-gray-500">{getVal(row,'regiao_interesse')||'—'}</td>
                        <td className="px-3 py-2 text-gray-500">{getVal(row,'fonte')||'importacao_planilha'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Progresso */}
            {importing && (
              <div className="bg-[#0B1220] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">Importando leads...</p>
                <ProgressBar value={progress} total={rows.length} />
              </div>
            )}

            {/* Botão */}
            {!importing && (
              <button
                onClick={importar}
                disabled={!mapping.nome}
                className="w-full py-3 rounded-xl text-[13px] font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Importar {rows.length} leads
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────
export default function CapturaPage() {
  const { usuario } = useAuth()

  const isDiretor = ['Diretor','Administrador','admin'].includes(usuario?.role)
    || usuario?.is_super_admin || usuario?.is_platform

  return (
    <div className="min-h-full bg-[#0B1220] px-4 lg:px-10 py-6 lg:py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 flex items-center justify-center">
            <Radio className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Captura de Leads</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">Gerencie todos os canais de entrada de leads</p>
          </div>
        </div>
      </div>

      {/* Importação planilha */}
      {isDiretor ? (
        <div className="mb-8">
          <ImportacaoPlanilha tenantId={usuario?.tenant_id} />
        </div>
      ) : (
        <div className="mb-8 bg-[#0F172A] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-3 opacity-60">
          <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-white">Importação via planilha</p>
            <p className="text-[10px] text-gray-500">Disponível apenas para Diretores e Administradores</p>
          </div>
        </div>
      )}

      {/* Canais em breve */}
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-600 mb-4">Outros canais de captura</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {CANAIS.map((canal, i) => {
          const Icon = canal.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-[#0F172A] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${canal.color}18` }}>
                  <Icon className="w-5 h-5" style={{ color: canal.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white">{canal.label}</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{canal.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-600">Em breve</span>
                <ArrowRight className="w-4 h-4 text-gray-700" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="bg-[#0F172A] border border-[#10B981]/15 rounded-2xl p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#10B981] mb-2">Canais ativos agora</p>
        <p className="text-[12px] text-gray-400 leading-relaxed">
          Leads já chegam via <strong className="text-white">WhatsApp</strong>, <strong className="text-white">webhook</strong> e <strong className="text-white">n8n</strong>.
          Acesse o <a href="/pipeline" className="text-[#10B981] hover:underline">Pipeline</a> para gerenciar ou configure em <a href="/canais" className="text-[#10B981] hover:underline">Canais</a>.
        </p>
      </motion.div>
    </div>
  )
}
