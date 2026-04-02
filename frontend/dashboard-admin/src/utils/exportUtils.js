// ============================================================
// exportUtils.js — Relatórios Executivos LeadCapture Pro
// Nível: multinacional — Excel com múltiplas abas, formatação
// profissional, sem poluição de dados, pronto para C-suite
// ============================================================
import * as XLSX from 'xlsx'

// ── Paleta de cores corporativas ──────────────────────────────
const COR = {
  HEADER_BG:    '1A1A2E',   // fundo escuro do cabeçalho
  HEADER_FG:    'FFFFFF',   // texto branco
  ACCENT:       'EE7B4D',   // laranja LeadCapture
  ACCENT_LIGHT: 'FDF0E8',   // laranja suave para linhas pares
  VERDE:        '10B981',
  VERMELHO:     'EF4444',
  AMARELO:      'F59E0B',
  ROXO:         '8B5CF6',
  CINZA_CLARO:  'F8F9FA',
  CINZA_BORDA:  'E2E8F0',
  TEXTO:        '1E293B',
  SUBTEXTO:     '64748B',
}

// ── Helpers ───────────────────────────────────────────────────
const fmtBRL = v =>
  new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', minimumFractionDigits:0 }).format(parseFloat(v)||0)

const fmtData = iso => iso ? new Date(iso).toLocaleDateString('pt-BR') : ''
const fmtDataHora = iso => iso ? new Date(iso).toLocaleString('pt-BR') : ''

const categoriaSemEmoji = cat => {
  const m = { hot:'Hot', warm:'Warm', cold:'Cold' }
  return m[(cat||'').toLowerCase()] || cat || ''
}

// ── Estilo de célula de cabeçalho ────────────────────────────
const estiloHeader = (corBg = COR.HEADER_BG) => ({
  font:      { bold:true, color:{ rgb: COR.HEADER_FG }, sz:10, name:'Calibri' },
  fill:      { fgColor:{ rgb: corBg }, patternType:'solid' },
  alignment: { horizontal:'center', vertical:'center', wrapText:true },
  border:    { bottom:{ style:'thin', color:{ rgb:'FFFFFF' } } },
})

const estiloAccent = () => ({
  font:      { bold:true, color:{ rgb: COR.HEADER_FG }, sz:10, name:'Calibri' },
  fill:      { fgColor:{ rgb: COR.ACCENT }, patternType:'solid' },
  alignment: { horizontal:'center', vertical:'center' },
})

const estiloDado = (par = false) => ({
  font:      { sz:9, name:'Calibri', color:{ rgb: COR.TEXTO } },
  fill:      par ? { fgColor:{ rgb: COR.ACCENT_LIGHT }, patternType:'solid' }
                 : { fgColor:{ rgb: 'FFFFFF' }, patternType:'solid' },
  alignment: { vertical:'center' },
  border:    { bottom:{ style:'hair', color:{ rgb: COR.CINZA_BORDA } } },
})

const estiloDadoCentro = (par=false) => ({
  ...estiloDado(par), alignment:{ horizontal:'center', vertical:'center' },
})

const estiloMoeda = (par=false) => ({
  ...estiloDado(par),
  numFmt: 'R$ #,##0',
  alignment:{ horizontal:'right', vertical:'center' },
})

const estiloPercent = (par=false) => ({
  ...estiloDado(par), alignment:{ horizontal:'center', vertical:'center' },
})

const estiloTitulo = () => ({
  font:      { bold:true, sz:14, name:'Calibri', color:{ rgb: COR.ACCENT } },
  alignment: { horizontal:'left', vertical:'center' },
})

const estiloSubtitulo = () => ({
  font:      { sz:10, name:'Calibri', color:{ rgb: COR.SUBTEXTO } },
  alignment: { horizontal:'left', vertical:'center' },
})

// ── Aplica estilos em um range ────────────────────────────────
function aplicarEstilo(ws, range, estilo) {
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r:R, c:C })
      if (!ws[addr]) ws[addr] = { t:'z' }
      ws[addr].s = estilo
    }
  }
}

// ── Cria célula com estilo ────────────────────────────────────
function cel(value, style, type) {
  const t = type || (typeof value === 'number' ? 'n' : 's')
  return { v:value, t, s:style }
}

// ── Cria aba de sumário executivo ────────────────────────────
function criarAbaSumario(d, periodo) {
  const wb_data = []
  const ws = {}

  // Linha 1-2: título
  ws['A1'] = { v:`RELATÓRIO EXECUTIVO — LEADCAPTURE PRO`, t:'s', s: estiloTitulo() }
  ws['A2'] = { v:`Período: últimos ${periodo} dias · Gerado em: ${fmtDataHora(new Date().toISOString())}`, t:'s', s: estiloSubtitulo() }

  // Linha 4: cabeçalho métricas
  const metricas = [
    ['TOTAL DE LEADS', d.total,           'n', COR.HEADER_BG],
    ['LEADS HOT',      d.vendidos,         'n', COR.VERDE],
    ['CONVERTIDOS',    d.vendidos,         'n', COR.VERDE],
    ['PERDIDOS',       d.perdidos,         'n', COR.VERMELHO],
    ['TAXA CONVERSÃO', `${d.txConversao}%`,'s', COR.ACCENT],
    ['SCORE MÉDIO',    Number(d.scoreMedio),'n', COR.ROXO],
  ]

  let col = 0
  metricas.forEach(([label, valor, tipo, cor]) => {
    const addrLabel = XLSX.utils.encode_cell({ r:3, c:col })
    const addrValor = XLSX.utils.encode_cell({ r:4, c:col })
    ws[addrLabel] = { v:label, t:'s', s:{ font:{bold:true,sz:8,color:{rgb:COR.HEADER_FG},name:'Calibri'}, fill:{fgColor:{rgb:cor},patternType:'solid'}, alignment:{horizontal:'center',vertical:'center'} } }
    ws[addrValor] = { v:valor, t:tipo, s:{ font:{bold:true,sz:18,color:{rgb:cor},name:'Calibri'}, fill:{fgColor:{rgb:'FFFFFF'},patternType:'solid'}, alignment:{horizontal:'center',vertical:'center'}, border:{bottom:{style:'medium',color:{rgb:cor}}} } }
    col++
  })

  // Linha 7: capital
  ws['A7'] = { v:'CAPITAL EM PIPELINE', t:'s', s:estiloHeader() }
  ws['B7'] = { v:'CAPITAL CONVERTIDO', t:'s', s:estiloHeader(COR.VERDE) }
  ws['C7'] = { v:'CAPITAL PERDIDO', t:'s', s:estiloHeader(COR.VERMELHO) }
  ws['D7'] = { v:'CICLO MÉDIO (dias)', t:'s', s:estiloHeader(COR.ROXO) }
  ws['A8'] = { v:d.capitalTotal, t:'n', s:{...estiloMoeda(), font:{bold:true,sz:13,name:'Calibri',color:{rgb:COR.TEXTO}}} }
  ws['B8'] = { v:d.capitalConvertido, t:'n', s:{...estiloMoeda(), font:{bold:true,sz:13,name:'Calibri',color:{rgb:COR.VERDE}}} }
  ws['C8'] = { v:d.capitalPerdido, t:'n', s:{...estiloMoeda(), font:{bold:true,sz:13,name:'Calibri',color:{rgb:COR.VERMELHO}}} }
  ws['D8'] = { v:Number(d.cicloMedio)||0, t:'n', s:{...estiloDadoCentro(), font:{bold:true,sz:13,name:'Calibri',color:{rgb:COR.ROXO}}} }

  ws['!ref'] = 'A1:F10'
  ws['!cols'] = [
    {wch:22},{wch:22},{wch:22},{wch:22},{wch:22},{wch:22}
  ]
  ws['!rows'] = [
    {hpt:30},{hpt:18},{hpt:10},{hpt:28},{hpt:42},{hpt:10},{hpt:24},{hpt:42}
  ]
  ws['!merges'] = [
    { s:{r:0,c:0}, e:{r:0,c:5} }, // título
    { s:{r:1,c:0}, e:{r:1,c:5} }, // subtítulo
  ]
  return ws
}

// ── Cria aba de leads individuais ────────────────────────────
function criarAbaLeads(leads) {
  if (!leads?.length) return null

  const cabecalhos = [
    'Nome', 'Email', 'Telefone', 'Cidade', 'Estado',
    'Capital (R$)', 'Categoria', 'Score',
    'Status Comercial', 'Marca', 'Operador',
    'Fonte', 'Urgência', 'Experiência Anterior',
    'Resumo de Qualificação', 'Data de Cadastro'
  ]

  const linhas = leads.map(l => [
    l.nome || '',
    l.email || '',
    l.telefone || '',
    l.cidade || '',
    l.estado || '',
    parseFloat(l.capital_disponivel) || 0,
    categoriaSemEmoji(l.categoria),
    l.score || 0,
    l.status_comercial?.label || l.status || '',
    l.marca?.nome || '',
    l.operador?.nome || 'Não atribuído',
    l.fonte || '',
    l.urgencia || '',
    l.experiencia_anterior ? 'Sim' : 'Não',
    l.resumo_qualificacao || '',
    fmtData(l.created_at),
  ])

  const ws = XLSX.utils.aoa_to_sheet([cabecalhos, ...linhas])

  // Estiliza cabeçalho
  for (let c = 0; c < cabecalhos.length; c++) {
    const addr = XLSX.utils.encode_cell({ r:0, c })
    ws[addr].s = estiloHeader()
  }

  // Estiliza dados com zebra
  linhas.forEach((_, ri) => {
    const par = ri % 2 === 0
    for (let c = 0; c < cabecalhos.length; c++) {
      const addr = XLSX.utils.encode_cell({ r:ri+1, c })
      if (!ws[addr]) continue
      if (c === 5) { ws[addr].s = estiloMoeda(par); ws[addr].t = 'n' }
      else if (c === 7) { ws[addr].s = estiloDadoCentro(par); ws[addr].t = 'n' }
      else if ([2,3,4,11,12,13,15].includes(c)) ws[addr].s = estiloDadoCentro(par)
      else ws[addr].s = estiloDado(par)
    }
    // Cor de categoria
    const catAddr = XLSX.utils.encode_cell({ r:ri+1, c:6 })
    if (ws[catAddr]) {
      const cat = (linhas[ri][6]||'').toLowerCase()
      const corCat = cat==='hot' ? COR.VERMELHO : cat==='warm' ? COR.AMARELO : COR.SUBTEXTO
      ws[catAddr].s = { ...estiloDadoCentro(par), font:{bold:true, sz:9, name:'Calibri', color:{rgb:corCat}} }
    }
  })

  ws['!cols'] = [
    {wch:28},{wch:30},{wch:16},{wch:14},{wch:8},
    {wch:14},{wch:10},{wch:7},
    {wch:18},{wch:16},{wch:20},
    {wch:18},{wch:10},{wch:12},
    {wch:40},{wch:12},
  ]
  ws['!rows'] = [{ hpt:22 }, ...linhas.map(() => ({ hpt:16 }))]
  return ws
}

// ── Cria aba de funil ─────────────────────────────────────────
function criarAbaFunil(funil) {
  if (!funil?.length) return null
  const total = funil.reduce((a,f)=>a+f.count,0)
  const cab = ['Etapa do Funil','Quantidade de Leads','% do Total','Capital em Pipeline (R$)']
  const rows = funil.map(f => [
    f.etapa,
    f.count,
    total > 0 ? `${((f.count/total)*100).toFixed(1)}%` : '0%',
    parseFloat(f.capital)||0,
  ])
  const ws = XLSX.utils.aoa_to_sheet([cab, ...rows])
  for (let c=0;c<cab.length;c++) ws[XLSX.utils.encode_cell({r:0,c})].s = estiloHeader()
  rows.forEach((_,ri) => {
    const par = ri%2===0
    ws[XLSX.utils.encode_cell({r:ri+1,c:0})].s = {
      ...estiloDado(par), font:{bold:true,sz:10,name:'Calibri',color:{rgb:funil[ri].cor?.replace('#','')||COR.ACCENT}}
    }
    ws[XLSX.utils.encode_cell({r:ri+1,c:1})].s = estiloDadoCentro(par)
    ws[XLSX.utils.encode_cell({r:ri+1,c:2})].s = estiloDadoCentro(par)
    const mAddr = XLSX.utils.encode_cell({r:ri+1,c:3})
    ws[mAddr].s = estiloMoeda(par)
    ws[mAddr].t = 'n'
  })
  ws['!cols'] = [{wch:22},{wch:20},{wch:14},{wch:22}]
  ws['!rows'] = [{hpt:22},...rows.map(()=>({hpt:18}))]
  return ws
}

// ── Cria aba de consultores ───────────────────────────────────
function criarAbaConsultores(porConsultor) {
  if (!porConsultor?.length) return null
  const cab = ['Posição','Consultor','Total de Leads','Vendidos','Perdidos','Em Pipeline','Taxa de Conversão','Capital Gerado (R$)']
  const rows = porConsultor.map((c,i) => [
    i+1, c.nome, c.total, c.vendidos, c.perdidos,
    c.total - c.vendidos - c.perdidos,
    `${c.txConversao}%`,
    parseFloat(c.capital)||0,
  ])
  const ws = XLSX.utils.aoa_to_sheet([cab,...rows])
  for (let c=0;c<cab.length;c++) ws[XLSX.utils.encode_cell({r:0,c})].s = estiloHeader()
  rows.forEach((_,ri) => {
    const par = ri%2===0
    ;[0,2,3,4,5].forEach(c => { const a=XLSX.utils.encode_cell({r:ri+1,c}); if(ws[a]) ws[a].s=estiloDadoCentro(par) })
    const nb=XLSX.utils.encode_cell({r:ri+1,c:1}); if(ws[nb]) ws[nb].s={...estiloDado(par),font:{bold:ri===0,sz:9,name:'Calibri',color:{rgb:COR.TEXTO}}}
    const pc=XLSX.utils.encode_cell({r:ri+1,c:6}); if(ws[pc]) ws[pc].s=estiloPercent(par)
    const mc=XLSX.utils.encode_cell({r:ri+1,c:7}); if(ws[mc]){ ws[mc].s=estiloMoeda(par); ws[mc].t='n' }
  })
  ws['!cols']=[{wch:8},{wch:28},{wch:14},{wch:12},{wch:12},{wch:14},{wch:16},{wch:20}]
  ws['!rows']=[{hpt:22},...rows.map(()=>({hpt:17}))]
  return ws
}

// ── Cria aba de marcas ────────────────────────────────────────
function criarAbaMarcas(porMarca) {
  if (!porMarca?.length) return null
  const cab = ['Marca','Total de Leads','Vendidos','Perdidos','Taxa de Conversão','Capital Total (R$)']
  const rows = porMarca.map(m => [m.nome,m.total,m.vendidos,m.perdidos,`${m.txConversao}%`,parseFloat(m.capital)||0])
  const ws = XLSX.utils.aoa_to_sheet([cab,...rows])
  for (let c=0;c<cab.length;c++) ws[XLSX.utils.encode_cell({r:0,c})].s = estiloHeader()
  rows.forEach((_,ri) => {
    const par=ri%2===0
    ;[1,2,3].forEach(c=>{ const a=XLSX.utils.encode_cell({r:ri+1,c}); if(ws[a]) ws[a].s=estiloDadoCentro(par) })
    const a0=XLSX.utils.encode_cell({r:ri+1,c:0}); if(ws[a0]) ws[a0].s={...estiloDado(par),font:{bold:true,sz:9,name:'Calibri',color:{rgb:COR.ACCENT}}}
    const a4=XLSX.utils.encode_cell({r:ri+1,c:4}); if(ws[a4]) ws[a4].s=estiloPercent(par)
    const a5=XLSX.utils.encode_cell({r:ri+1,c:5}); if(ws[a5]){ ws[a5].s=estiloMoeda(par); ws[a5].t='n' }
  })
  ws['!cols']=[{wch:24},{wch:14},{wch:12},{wch:12},{wch:16},{wch:20}]
  ws['!rows']=[{hpt:22},...rows.map(()=>({hpt:17}))]
  return ws
}

// ── Cria aba temporal ────────────────────────────────────────
function criarAbaTemporal(temporal) {
  if (!temporal?.length) return null
  const cab = ['Data','Leads Captados','Vendidos no Dia','Capital Convertido (R$)']
  const rows = temporal.map(t=>[t.dia,t.leads,t.vendidos,parseFloat(t.capital)||0])
  const ws = XLSX.utils.aoa_to_sheet([cab,...rows])
  for (let c=0;c<cab.length;c++) ws[XLSX.utils.encode_cell({r:0,c})].s = estiloHeader()
  rows.forEach((_,ri) => {
    const par=ri%2===0
    ;[0,1,2].forEach(c=>{ const a=XLSX.utils.encode_cell({r:ri+1,c}); if(ws[a]) ws[a].s=estiloDadoCentro(par) })
    const a3=XLSX.utils.encode_cell({r:ri+1,c:3}); if(ws[a3]){ ws[a3].s=estiloMoeda(par); ws[a3].t='n' }
  })
  ws['!cols']=[{wch:14},{wch:16},{wch:16},{wch:22}]
  ws['!rows']=[{hpt:22},...rows.map(()=>({hpt:16}))]
  return ws
}

// ── Cria aba de fontes ────────────────────────────────────────
function criarAbaFonte(porFonte) {
  if (!porFonte?.length) return null
  const total=porFonte.reduce((a,f)=>a+f.value,0)
  const cab=['Fonte de Lead','Quantidade','% do Total']
  const rows=porFonte.map(f=>[f.name,f.value,total>0?`${((f.value/total)*100).toFixed(1)}%`:'0%'])
  const ws=XLSX.utils.aoa_to_sheet([cab,...rows])
  for(let c=0;c<cab.length;c++) ws[XLSX.utils.encode_cell({r:0,c})].s=estiloHeader()
  rows.forEach((_,ri)=>{ const par=ri%2===0; [0,1,2].forEach(c=>{ const a=XLSX.utils.encode_cell({r:ri+1,c}); if(ws[a]) ws[a].s=estiloDadoCentro(par) }) })
  ws['!cols']=[{wch:26},{wch:14},{wch:14}]
  ws['!rows']=[{hpt:22},...rows.map(()=>({hpt:16}))]
  return ws
}

// ── Cria aba de perdas ────────────────────────────────────────
function criarAbaPerda(motivosPerda) {
  if (!motivosPerda?.length) return null
  const total=motivosPerda.reduce((a,m)=>a+m.valor,0)
  const cab=['Motivo da Desistência','Quantidade','% das Perdas']
  const rows=motivosPerda.map(m=>[m.motivo,m.valor,total>0?`${((m.valor/total)*100).toFixed(1)}%`:'0%'])
  const ws=XLSX.utils.aoa_to_sheet([cab,...rows])
  for(let c=0;c<cab.length;c++) ws[XLSX.utils.encode_cell({r:0,c})].s=estiloHeader(COR.VERMELHO.replace('#',''))
  rows.forEach((_,ri)=>{ const par=ri%2===0; [0,1,2].forEach(c=>{ const a=XLSX.utils.encode_cell({r:ri+1,c}); if(ws[a]) ws[a].s=estiloDadoCentro(par) }) })
  ws['!cols']=[{wch:36},{wch:14},{wch:14}]
  ws['!rows']=[{hpt:22},...rows.map(()=>({hpt:16}))]
  return ws
}

// ── Cria aba de regiões ───────────────────────────────────────
function criarAbaRegiao(porRegiao) {
  if (!porRegiao?.length) return null
  const total=porRegiao.reduce((a,r)=>a+r.value,0)
  const cab=['Estado / Região','Leads','% do Total']
  const rows=porRegiao.map(r=>[r.name,r.value,total>0?`${((r.value/total)*100).toFixed(1)}%`:'0%'])
  const ws=XLSX.utils.aoa_to_sheet([cab,...rows])
  for(let c=0;c<cab.length;c++) ws[XLSX.utils.encode_cell({r:0,c})].s=estiloHeader()
  rows.forEach((_,ri)=>{ const par=ri%2===0; [0,1,2].forEach(c=>{ const a=XLSX.utils.encode_cell({r:ri+1,c}); if(ws[a]) ws[a].s=estiloDadoCentro(par) }) })
  ws['!cols']=[{wch:26},{wch:14},{wch:14}]
  ws['!rows']=[{hpt:22},...rows.map(()=>({hpt:16}))]
  return ws
}

// ── Cria aba de score ─────────────────────────────────────────
function criarAbaScore(scoreDist) {
  if (!scoreDist?.length) return null
  const total=scoreDist.reduce((a,s)=>a+s.count,0)
  const cab=['Faixa de Score','Quantidade de Leads','% do Total','Qualificação']
  const qualif={'0-20':'❌ Frio','21-40':'🔵 Baixo','41-60':'🟡 Médio','61-80':'🟠 Bom','81-100':'🔥 Hot'}
  const rows=scoreDist.map(s=>[s.faixa,s.count,total>0?`${((s.count/total)*100).toFixed(1)}%`:'0%',qualif[s.faixa]||''])
  const ws=XLSX.utils.aoa_to_sheet([cab,...rows])
  for(let c=0;c<cab.length;c++) ws[XLSX.utils.encode_cell({r:0,c})].s=estiloHeader()
  rows.forEach((_,ri)=>{ const par=ri%2===0; [0,1,2,3].forEach(c=>{ const a=XLSX.utils.encode_cell({r:ri+1,c}); if(ws[a]) ws[a].s=estiloDadoCentro(par) }) })
  ws['!cols']=[{wch:16},{wch:20},{wch:14},{wch:18}]
  ws['!rows']=[{hpt:22},...rows.map(()=>({hpt:16}))]
  return ws
}

// ============================================================
// FUNÇÃO PRINCIPAL — Workbook completo com todas as abas
// ============================================================
export function exportRelatorioExcel(d, periodo = '30') {
  if (!d?.leads?.length && !d?.total) return false

  const wb = XLSX.utils.book_new()
  wb.Props = {
    Title:    'Relatório LeadCapture Pro',
    Subject:  'Análise de Leads e Pipeline de Vendas',
    Author:   'LeadCapture Pro — Zafalão Tech',
    CreatedDate: new Date(),
  }

  // Adiciona cada aba na ordem correta
  const abas = [
    ['📊 Resumo Executivo', criarAbaSumario(d, periodo)],
    ['👥 Leads Individuais', criarAbaLeads(d.leads)],
    ['🔽 Funil de Vendas',  criarAbaFunil(d.funil)],
    ['👤 Consultores',       criarAbaConsultores(d.porConsultor)],
    ['🏢 Por Marca',         criarAbaMarcas(d.porMarca)],
    ['📅 Evolução Temporal', criarAbaTemporal(d.temporal)],
    ['📡 Por Fonte',         criarAbaFonte(d.porFonte)],
    ['💔 Motivos de Perda',  criarAbaPerda(d.motivosPerda)],
    ['🗺 Por Região',        criarAbaRegiao(d.porRegiao)],
    ['⚡ Score de Leads',    criarAbaScore(d.scoreDist)],
  ]

  abas.forEach(([nome, ws]) => {
    if (ws) XLSX.utils.book_append_sheet(wb, ws, nome)
  })

  const data = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `LeadCapture_Relatorio_${data}.xlsx`)
  return true
}

// ── Exports específicos por relatório ─────────────────────────
export const exportLeadsCSV       = (leads, nome='leads')    => { if (!leads?.length) return false; exportRelatorioExcel({ leads, total:leads.length }, ''); return true }
export const exportFunilCSV       = funil      => { if (!funil?.length) return false; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,criarAbaFunil(funil),'Funil'); XLSX.writeFile(wb,`funil_${new Date().toISOString().split('T')[0]}.xlsx`); return true }
export const exportConsultorCSV   = c          => { if (!c?.length) return false; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,criarAbaConsultores(c),'Consultores'); XLSX.writeFile(wb,`consultores_${new Date().toISOString().split('T')[0]}.xlsx`); return true }
export const exportMarcaCSV       = m          => { if (!m?.length) return false; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,criarAbaMarcas(m),'Marcas'); XLSX.writeFile(wb,`marcas_${new Date().toISOString().split('T')[0]}.xlsx`); return true }
export const exportTemporalCSV    = t          => { if (!t?.length) return false; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,criarAbaTemporal(t),'Temporal'); XLSX.writeFile(wb,`temporal_${new Date().toISOString().split('T')[0]}.xlsx`); return true }
export const exportFonteCSV       = f          => { if (!f?.length) return false; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,criarAbaFonte(f),'Fontes'); XLSX.writeFile(wb,`fontes_${new Date().toISOString().split('T')[0]}.xlsx`); return true }
export const exportPerdaCSV       = m          => { if (!m?.length) return false; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,criarAbaPerda(m),'Perdas'); XLSX.writeFile(wb,`perdas_${new Date().toISOString().split('T')[0]}.xlsx`); return true }
export const exportRegiaoCSV      = r          => { if (!r?.length) return false; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,criarAbaRegiao(r),'Regioes'); XLSX.writeFile(wb,`regioes_${new Date().toISOString().split('T')[0]}.xlsx`); return true }
export const exportScoreCSV       = s          => { if (!s?.length) return false; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,criarAbaScore(s),'Score'); XLSX.writeFile(wb,`score_${new Date().toISOString().split('T')[0]}.xlsx`); return true }
export const exportRelatorioCompleto = (d, periodo) => exportRelatorioExcel(d, periodo)
