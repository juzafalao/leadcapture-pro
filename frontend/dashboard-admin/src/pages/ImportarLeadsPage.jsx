// ImportarLeadsPage — Importação de Leads via Planilha Excel
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

const API_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

// Ícone Excel SVG
function ExcelIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M8 3v18M2 9h20M2 15h20" strokeLinecap="round" />
      <path d="M11 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProgressBar({ value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
        <span>{value} de {total}</span><span>{pct}%</span>
      </div>
      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-[#10B981] transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    ['Nome *', 'Telefone *', 'Investimento (R$) *', 'Email', 'Região'],
    ['João Silva', '11999999999', '150000', 'joao@email.com', 'São Paulo'],
    ['Maria Souza', '21988888888', '80000', '', 'Rio de Janeiro'],
  ])
  ws['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 25 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Leads')
  XLSX.writeFile(wb, 'template_importacao_leads.xlsx')
}

export default function ImportarLeadsPage() {
  const { usuario, isPlatformAdmin } = useAuth()
  const isAdmin = isPlatformAdmin?.()

  const [tenantId,   setTenantId]   = useState(isAdmin ? null : (usuario?.tenant_id ?? null))
  const [tenants,    setTenants]    = useState([])
  const [marcas,     setMarcas]     = useState([])
  const [marcaId,    setMarcaId]    = useState('')
  const [arquivo,    setArquivo]    = useState(null)
  const [rows,       setRows]       = useState([])
  const [headers,    setHeaders]    = useState([])
  const [preview,    setPreview]    = useState([])
  const [importing,  setImporting]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [resultado,  setResultado]  = useState(null)
  const [erro,       setErro]       = useState(null)
  const [dragOver,   setDragOver]   = useState(false)
  const fileRef = useRef(null)

  // Carrega tenants (admin)
  useEffect(() => {
    if (!isAdmin) return
    supabase.from('tenants').select('id, name').order('name').then(({ data }) => {
      if (data?.length) { setTenants(data); if (!tenantId) setTenantId(data[0].id) }
    })
  }, [isAdmin])

  // Carrega marcas do tenant selecionado
  useEffect(() => {
    if (!tenantId) { setMarcas([]); setMarcaId(''); return }
    supabase.from('marcas').select('id, nome, emoji').eq('tenant_id', tenantId).eq('ativo', true).order('nome')
      .then(({ data }) => {
        setMarcas(data || [])
        setMarcaId(data?.[0]?.id || '')
      })
  }, [tenantId])

  function reset() {
    setArquivo(null); setRows([]); setHeaders([]); setPreview([])
    setResultado(null); setErro(null); setProgress(0)
  }

  // Mapeia colunas do template: Nome, Telefone, Investimento, Email, Região
  function getVal(row, colIndex) {
    return colIndex >= 0 ? String(row[colIndex] ?? '').trim() : ''
  }

  function parseFile(file) {
    setErro(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'binary' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (!data || data.length < 2) { setErro('Planilha vazia ou sem dados.'); return }
        const hdrs = data[0].map(String)
        const rws  = data.slice(1).filter(r => r.some(c => String(c).trim()))
        setHeaders(hdrs)
        setRows(rws)
        setPreview(rws.slice(0, 5))
      } catch (ex) { setErro('Erro ao ler arquivo: ' + ex.message) }
    }
    reader.readAsBinaryString(file)
  }

  function onFileChange(e) {
    const f = e.target.files?.[0]; if (!f) return
    setArquivo(f); parseFile(f)
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) { setArquivo(f); parseFile(f) }
  }

  // Índices das colunas (template fixo: Nome, Telefone, Investimento, Email, Região)
  function findIdx(aliases) {
    return headers.findIndex(h => aliases.some(a => h.toLowerCase().trim().includes(a)))
  }

  async function importar() {
    if (!tenantId)       { setErro('Selecione o tenant.'); return }
    if (!marcaId)        { setErro('Selecione a marca.'); return }
    if (!rows.length)    { setErro('Nenhum dado na planilha.'); return }

    const iNome  = findIdx(['nome', 'name', 'lead', 'cliente'])
    const iTel   = findIdx(['telefone', 'phone', 'fone', 'celular', 'whatsapp', 'tel'])
    const iCap   = findIdx(['investimento', 'capital', 'valor', 'budget'])
    const iEmail = findIdx(['email', 'e-mail', 'mail'])
    const iReg   = findIdx(['região', 'regiao', 'cidade', 'estado', 'local'])

    if (iNome < 0) { setErro('Coluna "Nome" não encontrada. Use o template.'); return }
    if (iTel  < 0) { setErro('Coluna "Telefone" não encontrada. Use o template.'); return }
    if (iCap  < 0) { setErro('Coluna "Investimento" não encontrada. Use o template.'); return }

    const validos = rows.filter(r => getVal(r, iNome).length > 1 && getVal(r, iTel).length > 7)
    if (!validos.length) { setErro('Nenhuma linha com Nome e Telefone válidos.'); return }

    setImporting(true); setProgress(0); setResultado(null); setErro(null)
    let ok = 0, fail = 0

    for (let i = 0; i < validos.length; i++) {
      const row    = validos[i]
      const capRaw = getVal(row, iCap)
      const capNum = capRaw ? parseFloat(capRaw.replace(/[^\d.,]/g, '').replace(',', '.')) || null : null

      try {
        const res = await fetch(`${API_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome:               getVal(row, iNome),
            telefone:           getVal(row, iTel),
            capital_disponivel: capNum,
            email:              iEmail >= 0 ? getVal(row, iEmail) || null : null,
            regiao_interesse:   iReg   >= 0 ? getVal(row, iReg)   || null : null,
            marca_id:           marcaId,
            tenant_id:          tenantId,
            fonte:              'planilha',
          }),
        })
        res.ok ? ok++ : fail++
      } catch { fail++ }

      setProgress(i + 1)
      // Pequena pausa para não sobrecarregar
      if ((i + 1) % 5 === 0) await new Promise(r => setTimeout(r, 100))
    }

    setImporting(false)
    setResultado({ ok, fail, total: validos.length })
  }

  // Resultado final
  if (resultado) return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4">
      <div className="bg-[#0A0F1E] border border-white/[0.08] rounded-2xl p-8 text-center max-w-sm w-full">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${resultado.fail === 0 ? 'bg-[#10B981]/15' : 'bg-amber-500/15'}`}>
          <ExcelIcon size={28} />
        </div>
        <p className="text-white font-bold text-lg mb-5">Importação concluída</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Importados', value: resultado.ok,   color: 'text-[#10B981]' },
            { label: 'Erros',      value: resultado.fail, color: resultado.fail > 0 ? 'text-red-400' : 'text-gray-500' },
            { label: 'Total',      value: resultado.total, color: 'text-white' },
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
          <a href="/pipeline" className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#10B981] text-black hover:bg-[#059669] transition-all text-center">
            Ver no Pipeline
          </a>
        </div>
      </div>
    </div>
  )

  const nomeIdx = findIdx(['nome', 'name', 'lead', 'cliente'])
  const telIdx  = findIdx(['telefone', 'phone', 'fone', 'celular', 'whatsapp', 'tel'])
  const capIdx  = findIdx(['investimento', 'capital', 'valor', 'budget'])

  return (
    <div className="min-h-screen bg-[#0B1220] px-4 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 flex items-center justify-center text-[#10B981]">
          <ExcelIcon size={20} />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">
            Importar <span className="text-[#10B981]">Leads</span>
          </h1>
          <p className="text-[10px] text-gray-600 mt-0.5">Upload de planilha Excel · Os leads vão para o N8n para cálculo de score</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold bg-white/[0.04] border border-white/[0.08] text-[#10B981] hover:bg-white/[0.07] transition-all"
        >
          <ExcelIcon size={14} />
          Baixar Template
        </button>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Tenant selector (admin) */}
        {isAdmin && tenants.length > 0 && (
          <div className="bg-[#0A0F1E] border border-white/[0.08] rounded-2xl p-5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">Tenant *</label>
            <select
              value={tenantId ?? ''}
              onChange={e => { setTenantId(e.target.value); reset() }}
              className="w-full bg-[#0F172A] border border-white/[0.08] text-white text-[13px] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#10B981]/40"
            >
              <option value="">Selecione o tenant...</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {/* Marca selector */}
        <div className="bg-[#0A0F1E] border border-white/[0.08] rounded-2xl p-5">
          <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">Marca * <span className="text-gray-600 normal-case font-normal">(todos os leads desta importação)</span></label>
          {marcas.length === 0 ? (
            <p className="text-[11px] text-gray-600">Nenhuma marca encontrada para este tenant.</p>
          ) : (
            <select
              value={marcaId}
              onChange={e => setMarcaId(e.target.value)}
              className="w-full bg-[#0F172A] border border-white/[0.08] text-white text-[13px] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#10B981]/40"
            >
              <option value="">Selecione a marca...</option>
              {marcas.map(m => (
                <option key={m.id} value={m.id}>{m.emoji ? `${m.emoji} ` : ''}{m.nome}</option>
              ))}
            </select>
          )}
        </div>

        {/* Upload */}
        <div className="bg-[#0A0F1E] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[13px] font-bold text-white">Planilha de Leads</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Formato .xlsx, .xls ou .csv · Campos obrigatórios: Nome, Telefone, Investimento</p>
          </div>

          <div className="p-5 space-y-4">
            {erro && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p className="text-[11px] text-red-400">{erro}</p>
              </div>
            )}

            {!arquivo ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={[
                  'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                  dragOver ? 'border-[#10B981]/60 bg-[#10B981]/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]',
                ].join(' ')}
              >
                <div className="flex justify-center mb-3 text-gray-600">
                  <ExcelIcon size={40} />
                </div>
                <p className="text-[13px] font-semibold text-gray-400 mb-1">Arraste a planilha ou clique para selecionar</p>
                <p className="text-[10px] text-gray-600">Formatos: .xlsx, .xls, .csv</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
              </div>
            ) : (
              <>
                {/* Arquivo selecionado */}
                <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="text-[#10B981]"><ExcelIcon size={20} /></div>
                    <div>
                      <p className="text-[12px] font-bold text-white">{arquivo.name}</p>
                      <p className="text-[10px] text-gray-600">{rows.length} linhas detectadas</p>
                    </div>
                  </div>
                  <button onClick={reset} className="text-gray-600 hover:text-gray-300 transition-all text-lg leading-none">×</button>
                </div>

                {/* Preview */}
                {preview.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr>
                          {headers.map((h, i) => (
                            <th key={i} className={[
                              'text-left px-3 py-2 font-black uppercase tracking-wider',
                              [nomeIdx, telIdx, capIdx].includes(i) ? 'text-[#10B981]' : 'text-gray-600',
                            ].join(' ')}>
                              {h}{[nomeIdx, telIdx, capIdx].includes(i) ? ' *' : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, ri) => (
                          <tr key={ri} className="border-t border-white/[0.04]">
                            {headers.map((_, ci) => (
                              <td key={ci} className="px-3 py-2 text-gray-400 truncate max-w-[120px]">
                                {String(row[ci] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 5 && (
                      <p className="text-[9px] text-gray-600 text-center pt-2">+ {rows.length - 5} linhas não exibidas</p>
                    )}
                  </div>
                )}

                {/* Progress ou botão importar */}
                {importing ? (
                  <ProgressBar value={progress} total={rows.length} />
                ) : (
                  <button
                    onClick={importar}
                    disabled={!marcaId || !tenantId}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-[#10B981] text-black hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Importar {rows.length} leads → N8n
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-600">
            <span className="text-gray-400 font-bold">Fluxo:</span> Cada lead é enviado via API → N8n calcula o score → Lead entra no Pipeline como "Lead Novo" com fonte <span className="text-[#10B981] font-bold">planilha</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
