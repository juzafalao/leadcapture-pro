import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportUsuariosToExcel = (usuarios) => {
  if (!usuarios?.length) return
  const data = usuarios.map(u => ({
    'Nome': u.nome || '', 'Cargo': u.role || '', 'Email': u.email || '',
    'Telefone': u.telefone || '', 'Status': u.ativo ? 'Ativo' : 'Inativo',
    'Criado em': new Date(u.created_at).toLocaleDateString('pt-BR')
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Usuários')
  ws['!cols'] = [{ wch:30 },{ wch:15 },{ wch:30 },{ wch:15 },{ wch:10 },{ wch:12 }]
  XLSX.writeFile(wb, `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`)
}

export const exportUsuariosToPDF = (usuarios) => {
  if (!usuarios?.length) return
  const doc = new jsPDF()
  doc.setFontSize(18); doc.setTextColor(238,123,77)
  doc.text('Relatório de Usuários', 14, 20)
  doc.setFontSize(10); doc.setTextColor(100,100,100)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28)
  autoTable(doc, {
    startY: 36,
    head: [['Nome','Cargo','Telefone','Status']],
    body: usuarios.map(u => [u.nome||'', u.role||'', u.telefone||'', u.ativo?'Ativo':'Inativo']),
    headStyles: { fillColor:[238,123,77], textColor:[0,0,0], fontStyle:'bold' }
  })
  doc.save(`usuarios_${new Date().toISOString().split('T')[0]}.pdf`)
}
