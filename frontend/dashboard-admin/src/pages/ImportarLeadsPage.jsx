// ImportarLeadsPage — Importação de Leads via Planilha Excel
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../components/AuthContext'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

const API_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

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

// Gera template .xlsx com cabeçalho estilizado via ExcelJS
async function downloadTemplate(marcas = [], tenantId = '') {
  try {
    const ExcelJS = (await import('exceljs')).default

    const wb = new ExcelJS.Workbook()
    wb.creator = 'LeadCapture Pro'

    // ── Aba principal: Leads ──────────────────────────────────
    const ws = wb.addWorksheet('Leads')

    const COLS = [
      { header: 'Nome *',            key: 'nome',       width: 24 },
      { header: 'Telefone *',        key: 'telefone',   width: 18 },
      { header: 'Email',             key: 'email',      width: 28 },
      { header: 'Investimento (R$) *', key: 'capital', width: 22 },
      { header: 'Cidade',            key: 'cidade',     width: 18 },
      { header: 'Estado',            key: 'estado',     width: 14 },
      { header: 'Tenant_ID *',       key: 'tenant_id',  width: 38 },
      { header: 'Marca',             key: 'marca',      width: 22 },
    ]

    ws.columns = COLS

    // Estilo do cabeçalho: fundo verde, texto azul bold
    const headerRow = ws.getRow(1)
    headerRow.eachCell(cell => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
      cell.font   = { bold: true, color: { argb: 'FF1D4ED8' }, size: 11 }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF059669' } } }
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
    })
    headerRow.height = 22

    // Linhas de exemplo com tenant_id pré-preenchido
    const primeirasMarcas = marcas.slice(0, 2)
    const exemploRows = [
      {
        nome:      'João Silva',
        telefone:  '11999999999',
        email:     'joao@email.com',
        capital:   150000,
        cidade:    'São Paulo',
        estado:    'SP',
        tenant_id: tenantId,
        marca:     primeirasMarcas[0]?.nome || '',
      },
      {
        nome:      'Maria Souza',
        telefone:  '21988888888',
        email:     '',
        capital:   80000,
        cidade:    'Rio de Janeiro',
        estado:    'RJ',
        tenant_id: tenantId,
        marca:     primeirasMarcas[1]?.nome || primeirasMarcas[0]?.nome || '',
      },
    ]

    exemploRows.forEach(row => {
      const r = ws.addRow(row)
      // Tenant_ID em cinza para indicar que é automático
      r.getCell(7).font = { color: { argb: 'FF94A3B8' }, italic: true }
      r.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
    })

    // Freeze primeira linha
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    // Nota na célula Tenant_ID do cabeçalho
    ws.getCell('G1').note = 'Preencha com o ID do seu tenant. Já preenchido nas linhas de exemplo.'

    // ── Aba de referência: Marcas ─────────────────────────────
    if (marcas.length > 0) {
      const wsMarcas = wb.addWorksheet('Marcas')
      wsMarcas.columns = [
        { header: 'Marca',    key: 'nome', width: 30 },
        { header: 'ID',       key: 'id',   width: 38 },
      ]
      const hdr = wsMarcas.getRow(1)
      hdr.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
        cell.font = { bold: true, color: { argb: 'FF10B981' } }
      })
      marcas.forEach(m => wsMarcas.addRow({ nome: m.nome, id: m.id }))

      // Data validation dropdown na coluna Marca (H) da aba Leads
      ws.dataValidations.add(`H2:H10001`, {
        type: 'list',
        allowBlank: true,
        formulae: [`Marcas!$A$2:$A$${marcas.length + 1}`],
        showErrorMessage: false,
        promptTitle: 'Selecione a marca',
        prompt: 'Escolha uma marca da lista',
      })
    }

    const buffer = await wb.xlsx.writeBuffer()
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href    = url
    a.download = `template_leads_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('[Template] ExcelJS falhou, usando fallback:', err)
    // Fallback: template simples sem estilos
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nome *', 'Telefone *', 'Email', 'Investimento (R$) *', 'Cidade', 'Estado', 'Tenant_ID *', 'Marca'],
      ['João Silva',  '11999999999', 'joao@email.com', 150000, 'São Paulo',       'SP', tenantId, marcas[0]?.nome || ''],
      ['Maria Souza', '21988888888', '',               80000,  'Rio de Janeiro',  'RJ', tenantId, marcas[1]?.nome || ''],
    ])
    ws['!cols'] = [22, 18, 28, 22, 18, 12, 38, 22].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    if (marcas.length) {
      const wsMarcas = XLSX.utils.aoa_to_sheet([
        ['Marca', 'ID'],
        ...marcas.map(m => [m.nome, m.id]),
      ])
      XLSX.utils.book_append_sheet(wb, wsMarcas, 'Marcas')
    }
    XLSX.writeFile(wb, `template_leads_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }
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
  const [dlLoading,  setDlLoading]  = useState(false)
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
    supabase.from('marcas').select('id, nome, emoji').eq('tenant_id', tenantId).order('nome')
      .then(({ data }) => {
        setMarcas(data || [])
        setMarcaId(data?.[0]?.id || '')
      })
  }, [tenantId])

  function reset() {
    setArquivo(null); setRows([]); setHeaders([]); setPreview([])
    setResultado(null); setErro(null); setProgress(0)
  }

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

  function findIdx(aliases) {
    return headers.findIndex(h => aliases.some(a => h.toLowerCase().trim().includes(a)))
  }

  async function importar() {
    if (!tenantId)    { setErro('Selecione o tenant.'); return }
    if (!rows.length) { setErro('Nenhum dado na planilha.'); return }

    const iNome    = findIdx(['nome', 'name', 'lead', 'cliente'])
    const iTel     = findIdx(['telefone', 'phone', 'fone', 'celular', 'whatsapp', 'tel'])
    const iCap     = findIdx(['investimento', 'capital', 'valor', 'budget'])
    const iEmail   = findIdx(['email', 'e-mail', 'mail'])
    const iCidade  = findIdx(['cidade', 'city'])
    const iEstado  = findIdx(['estado', 'state', 'uf'])
    const iMarca   = findIdx(['marca', 'brand', 'franquia'])
    const iTenId   = findIdx(['tenant_id', 'tenant'])

    if (iNome < 0) { setErro('Coluna "Nome" não encontrada. Use o template.'); return }
    if (iTel  < 0) { setErro('Coluna "Telefone" não encontrada. Use o template.'); return }

    const validos = rows.filter(r => getVal(r, iNome).length > 1 && getVal(r, iTel).length > 7)
    if (!validos.length) { setErro('Nenhuma linha com Nome e Telefone válidos.'); return }

    setImporting(true); setProgress(0); setResultado(null); setErro(null)
    let ok = 0, fail = 0

    for (let i = 0; i < validos.length; i++) {
      const row    = validos[i]
      const telefoneRaw = getVal(row, iTel)
      const emailVal = (iEmail >= 0 && getVal(row, iEmail)) ||
        `tel.${telefoneRaw.replace(/\D/g, '')}@noemail.leadcapture.local`
      const capNum = capRaw ? (parseFloat(capRaw.replace(/[^\d.,]/g, '').replace(',', '.')) || null) : null

      // Resolve marca: coluna da planilha > seletor da UI
      let marcaFinal = marcaId || undefined
      if (iMarca >= 0) {
        const nomeMarca = getVal(row, iMarca)
        if (nomeMarca) {
          const found = marcas.find(m => m.nome.toLowerCase().includes(nomeMarca.toLowerCase()))
          if (found) marcaFinal = found.id
        }
      }

      // Tenant_ID da planilha (se preenchido) tem prioridade sobre o da planilha para cada row
      const tenantFinal = (iTenId >= 0 && getVal(row, iTenId)) || tenantId

      try {
        const res = await fetch(`${API_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome:               getVal(row, iNome),
            telefone:           getVal(row, iTel),
            capital_disponivel: capNum,
            email:              emailVal,
            cidade:             iCidade >= 0 ? getVal(row, iCidade) || null : null,
            estado:             iEstado >= 0 ? getVal(row, iEstado) || null : null,
            marca_id:           marcaFinal || undefined,
            tenant_id:          tenantFinal,
            fonte:              'planilha',
          }),
        })
        if (res.ok) { ok++ } else { fail++ }
      } catch { fail++ }

      setProgress(i + 1)
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
            { label: 'Importados', value: resultado.ok,    color: 'text-[#10B981]' },
            { label: 'Erros',      value: resultado.fail,  color: resultado.fail > 0 ? 'text-red-400' : 'text-gray-500' },
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

  const podeImportar = !!tenantId && rows.length > 0

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
          <p className="text-[10px] text-gray-600 mt-0.5">
            Upload de planilha Excel · Tenant_ID e marcas pré-preenchidos no template
          </p>
        </div>
        <button
          onClick={async () => {
            setDlLoading(true)
            await downloadTemplate(marcas, tenantId || '')
            setDlLoading(false)
          }}
          disabled={dlLoading}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold bg-white/[0.04] border border-white/[0.08] text-[#10B981] hover:bg-white/[0.07] transition-all disabled:opacity-50"
        >
          <ExcelIcon size={14} />
          {dlLoading ? 'Gerando...' : 'Baixar Template'}
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
          <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
            Marca <span className="text-gray-600 normal-case font-normal">(padrão para todos os leads desta importação)</span>
          </label>
          {marcas.length === 0 ? (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
              <span className="text-amber-400 mt-0.5">⚠</span>
              <div>
                <p className="text-[11px] text-amber-400 font-bold">Nenhuma marca encontrada para este tenant.</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Você pode importar sem marca ou{' '}
                  <a href="/marcas" className="text-[#10B981] hover:underline">criar uma marca primeiro</a>.
                  Se a planilha tiver coluna "Marca", ela será usada por lead.
                </p>
              </div>
            </div>
          ) : (
            <select
              value={marcaId}
              onChange={e => setMarcaId(e.target.value)}
              className="w-full bg-[#0F172A] border border-white/[0.08] text-white text-[13px] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#10B981]/40"
            >
              <option value="">— Sem marca padrão —</option>
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
            <p className="text-[10px] text-gray-500 mt-0.5">
              Formato .xlsx, .xls ou .csv · Colunas obrigatórias: <span className="text-white">Nome, Telefone</span>
            </p>
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
                              {h}{[nomeIdx, telIdx].includes(i) ? ' **' : ''}
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
                    disabled={!podeImportar}
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
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 space-y-1">
          <p className="text-[10px] text-gray-600">
            <span className="text-gray-400 font-bold">Fluxo:</span>{' '}
            Cada lead é enviado via API → N8n calcula o score → Lead entra no Pipeline com fonte{' '}
            <span className="text-[#10B981] font-bold">planilha</span>.
          </p>
          <p className="text-[10px] text-gray-600">
            <span className="text-gray-400 font-bold">Colunas reconhecidas:</span>{' '}
            Nome, Telefone, Email, Investimento, Cidade, Estado, Tenant_ID, Marca
          </p>
        </div>
      </div>
    </div>
  )
}
