// ============================================================
// exportUtils.js — Exportação de Relatórios LeadCapture Pro
// Gera CSVs formatados e legíveis por humanos (não JSON bruto)
// ============================================================

// ── Helper: gera e baixa um CSV ──────────────────────────────
function baixarCSV(linhas, nomeArquivo) {
  const conteudo = '\uFEFF' + linhas.join('\n') // BOM para Excel reconhecer UTF-8
  const blob     = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
  const url      = URL.createObjectURL(blob)
  const link     = document.createElement('a')
  link.href      = url
  link.download  = `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ── Helper: escapa campo CSV (aspas, vírgulas, quebras) ──────
function esc(v) {
  if (v === null || v === undefined) return '""'
  const s = String(v).replace(/"/g, '""')
  return `"${s}"`
}

// ── Helper: formata capital em reais ─────────────────────────
function fmtBRL(v) {
  const n = parseFloat(v) || 0
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(n)
}

// ── Helper: formata data ─────────────────────────────────────
function fmtData(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Helper: categoria legível ────────────────────────────────
function fmtCategoria(cat) {
  const m = { hot: '🔥 Hot', warm: '🌤 Warm', cold: '❄️ Cold' }
  return m[(cat || '').toLowerCase()] || cat || ''
}

// ============================================================
// EXPORT 1 — Leads Completo (tabela master)
// ============================================================
export function exportLeadsCSV(leads, nomeRelatorio = 'leads') {
  if (!leads?.length) return false

  const cabecalho = [
    'Nome', 'Email', 'Telefone', 'Cidade', 'Estado',
    'Capital Disponível', 'Categoria', 'Score',
    'Status Comercial', 'Marca', 'Operador Responsável',
    'Fonte', 'Urgência', 'Experiência Anterior',
    'Resumo de Qualificação', 'Data de Cadastro', 'Última Atualização'
  ].map(esc).join(',')

  const linhas = leads.map(l => [
    esc(l.nome),
    esc(l.email),
    esc(l.telefone),
    esc(l.cidade),
    esc(l.estado),
    esc(fmtBRL(l.capital_disponivel)),
    esc(fmtCategoria(l.categoria)),
    esc(l.score ?? 0),
    esc(l.status_comercial?.label || l.status || ''),
    esc(l.marca ? `${l.marca.emoji || ''} ${l.marca.nome}`.trim() : ''),
    esc(l.operador?.nome || 'Não atribuído'),
    esc(l.fonte),
    esc(l.urgencia),
    esc(l.experiencia_anterior ? 'Sim' : 'Não'),
    esc(l.resumo_qualificacao),
    esc(fmtData(l.created_at)),
    esc(fmtData(l.updated_at)),
  ].join(','))

  baixarCSV([cabecalho, ...linhas], nomeRelatorio)
  return true
}

// ============================================================
// EXPORT 2 — Funil de Vendas
// ============================================================
export function exportFunilCSV(funil) {
  if (!funil?.length) return false

  const total = funil.reduce((a, f) => a + f.count, 0)

  const cabecalho = ['Etapa', 'Leads', '% do Total', 'Capital em Pipeline'].map(esc).join(',')
  const linhas = funil.map(f => [
    esc(f.etapa),
    esc(f.count),
    esc(total > 0 ? `${((f.count / total) * 100).toFixed(1)}%` : '0%'),
    esc(fmtBRL(f.capital)),
  ].join(','))

  baixarCSV([cabecalho, ...linhas], 'funil_vendas')
  return true
}

// ============================================================
// EXPORT 3 — Performance por Consultor
// ============================================================
export function exportConsultorCSV(porConsultor) {
  if (!porConsultor?.length) return false

  const cabecalho = [
    'Consultor', 'Total de Leads', 'Vendidos', 'Perdidos',
    'Em Pipeline', 'Taxa de Conversão', 'Capital Gerado'
  ].map(esc).join(',')

  const linhas = porConsultor.map((c, i) => [
    esc(c.nome),
    esc(c.total),
    esc(c.vendidos),
    esc(c.perdidos),
    esc(c.total - c.vendidos - c.perdidos),
    esc(`${c.txConversao}%`),
    esc(fmtBRL(c.capital)),
  ].join(','))

  baixarCSV([cabecalho, ...linhas], 'performance_consultores')
  return true
}

// ============================================================
// EXPORT 4 — Performance por Marca
// ============================================================
export function exportMarcaCSV(porMarca) {
  if (!porMarca?.length) return false

  const cabecalho = [
    'Marca', 'Total de Leads', 'Vendidos', 'Perdidos', 'Taxa de Conversão', 'Capital Total'
  ].map(esc).join(',')

  const linhas = porMarca.map(m => [
    esc(m.nome),
    esc(m.total),
    esc(m.vendidos),
    esc(m.perdidos),
    esc(`${m.txConversao}%`),
    esc(fmtBRL(m.capital)),
  ].join(','))

  baixarCSV([cabecalho, ...linhas], 'leads_por_marca')
  return true
}

// ============================================================
// EXPORT 5 — Análise Temporal
// ============================================================
export function exportTemporalCSV(temporal) {
  if (!temporal?.length) return false

  const cabecalho = ['Data', 'Leads Captados', 'Vendidos', 'Capital Vendido'].map(esc).join(',')
  const linhas = temporal.map(t => [
    esc(t.dia),
    esc(t.leads),
    esc(t.vendidos),
    esc(fmtBRL(t.capital)),
  ].join(','))

  baixarCSV([cabecalho, ...linhas], 'evolucao_temporal')
  return true
}

// ============================================================
// EXPORT 6 — Por Fonte
// ============================================================
export function exportFonteCSV(porFonte) {
  if (!porFonte?.length) return false

  const total = porFonte.reduce((a, f) => a + f.value, 0)

  const cabecalho = ['Fonte', 'Leads', '% do Total'].map(esc).join(',')
  const linhas = porFonte.map(f => [
    esc(f.name),
    esc(f.value),
    esc(total > 0 ? `${((f.value / total) * 100).toFixed(1)}%` : '0%'),
  ].join(','))

  baixarCSV([cabecalho, ...linhas], 'leads_por_fonte')
  return true
}

// ============================================================
// EXPORT 7 — Motivos de Perda
// ============================================================
export function exportPerdaCSV(motivosPerda) {
  if (!motivosPerda?.length) return false

  const total = motivosPerda.reduce((a, m) => a + m.valor, 0)

  const cabecalho = ['Motivo', 'Quantidade', '% das Perdas'].map(esc).join(',')
  const linhas = motivosPerda.map(m => [
    esc(m.motivo),
    esc(m.valor),
    esc(total > 0 ? `${((m.valor / total) * 100).toFixed(1)}%` : '0%'),
  ].join(','))

  baixarCSV([cabecalho, ...linhas], 'motivos_perda')
  return true
}

// ============================================================
// EXPORT 8 — Por Região
// ============================================================
export function exportRegiaoCSV(porRegiao) {
  if (!porRegiao?.length) return false

  const total = porRegiao.reduce((a, r) => a + r.value, 0)

  const cabecalho = ['Estado/Região', 'Leads', '% do Total'].map(esc).join(',')
  const linhas = porRegiao.map(r => [
    esc(r.name),
    esc(r.value),
    esc(total > 0 ? `${((r.value / total) * 100).toFixed(1)}%` : '0%'),
  ].join(','))

  baixarCSV([cabecalho, ...linhas], 'leads_por_regiao')
  return true
}

// ============================================================
// EXPORT 9 — Distribuição de Score
// ============================================================
export function exportScoreCSV(scoreDist) {
  if (!scoreDist?.length) return false

  const total = scoreDist.reduce((a, s) => a + s.count, 0)

  const cabecalho = ['Faixa de Score', 'Quantidade', '% do Total'].map(esc).join(',')
  const linhas = scoreDist.map(s => [
    esc(s.faixa),
    esc(s.count),
    esc(total > 0 ? `${((s.count / total) * 100).toFixed(1)}%` : '0%'),
  ].join(','))

  baixarCSV([cabecalho, ...linhas], 'distribuicao_score')
  return true
}

// ============================================================
// EXPORT 10 — Relatório Completo (todas as abas em um CSV)
// ============================================================
export function exportRelatorioCompleto(d, periodo) {
  if (!d?.leads?.length) return false

  const sep = ['', '', ''].join(',') // linha em branco

  const sectionTitle = (titulo) => [
    esc(`=== ${titulo.toUpperCase()} ===`), '', '', '', ''
  ].join(',')

  // Sumário executivo
  const sumario = [
    sectionTitle(`Relatório Completo — Período: ${periodo} dias`),
    [esc('Gerado em'), esc(new Date().toLocaleString('pt-BR'))].join(','),
    sep,
    sectionTitle('Sumário Executivo'),
    [esc('Métrica'), esc('Valor')].join(','),
    [esc('Total de Leads'), esc(d.total)].join(','),
    [esc('Taxa de Conversão'), esc(`${d.txConversao}%`)].join(','),
    [esc('Taxa de Perda'), esc(`${d.txPerda}%`)].join(','),
    [esc('Score Médio'), esc(d.scoreMedio)].join(','),
    [esc('Ciclo Médio (dias)'), esc(d.cicloMedio)].join(','),
    [esc('Capital Total em Pipeline'), esc(fmtBRL(d.capitalTotal))].join(','),
    [esc('Capital Convertido'), esc(fmtBRL(d.capitalConvertido))].join(','),
    [esc('Capital Perdido'), esc(fmtBRL(d.capitalPerdido))].join(','),
    sep,
  ]

  // Leads individuais
  const cabecalhoLeads = [
    sectionTitle('Leads Individuais'),
    ['Nome','Email','Telefone','Capital','Categoria','Score','Status','Marca','Operador','Fonte','Data'].map(esc).join(','),
    ...(d.leads || []).map(l => [
      esc(l.nome), esc(l.email), esc(l.telefone),
      esc(fmtBRL(l.capital_disponivel)),
      esc(fmtCategoria(l.categoria)), esc(l.score ?? 0),
      esc(l.status_comercial?.label || l.status || ''),
      esc(l.marca ? `${l.marca.emoji || ''} ${l.marca.nome}`.trim() : ''),
      esc(l.operador?.nome || 'Não atribuído'),
      esc(l.fonte), esc(fmtData(l.created_at)),
    ].join(',')),
    sep,
  ]

  // Consultores
  const cabecalhoConsultores = [
    sectionTitle('Performance por Consultor'),
    ['Consultor','Total','Vendidos','Perdidos','Taxa Conversão','Capital'].map(esc).join(','),
    ...(d.porConsultor || []).map(c => [
      esc(c.nome), esc(c.total), esc(c.vendidos), esc(c.perdidos),
      esc(`${c.txConversao}%`), esc(fmtBRL(c.capital)),
    ].join(',')),
    sep,
  ]

  // Marcas
  const cabecalhoMarcas = [
    sectionTitle('Performance por Marca'),
    ['Marca','Total','Vendidos','Perdidos','Taxa Conversão','Capital'].map(esc).join(','),
    ...(d.porMarca || []).map(m => [
      esc(m.nome), esc(m.total), esc(m.vendidos), esc(m.perdidos),
      esc(`${m.txConversao}%`), esc(fmtBRL(m.capital)),
    ].join(',')),
  ]

  const todasLinhas = [...sumario, ...cabecalhoLeads, ...cabecalhoConsultores, ...cabecalhoMarcas]
  baixarCSV(todasLinhas, 'relatorio_completo')
  return true
}

// ── Mantém compatibilidade com exportUtils antigo ────────────
export { exportUsuariosToExcel, exportUsuariosToPDF } from './exportUtilsLegacy.js'
