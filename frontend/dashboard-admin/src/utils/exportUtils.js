import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exportar usuários para Excel
 */
export const exportUsuariosToExcel = (usuarios) => {
  try {
    console.log('📗 Iniciando export Excel...');

    if (!usuarios || usuarios.length === 0) {
      console.warn('Nenhum usuário para exportar!');
      return;
    }

    const data = usuarios.map(u => ({
      'Nome': u.nome || '',
      'Cargo/Perfil': u.role || '',
      'Email': u.email || '',
      'Telefone': u.telefone || '',
      'Status': u.ativo ? 'Ativo' : 'Inativo',
      'Criado em': new Date(u.created_at).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuários');

    const colWidths = [
      { wch: 30 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 }
    ];
    ws['!cols'] = colWidths;

    const fileName = `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    setTimeout(() => {
      console.log('✅ Excel exportado:', fileName);
    }, 500);
    
  } catch (error) {
    console.error('❌ Erro ao exportar Excel:', error);
    console.error('Erro ao exportar:', error.message);
  }
};

/**
 * Exportar usuários para PDF
 */
export const exportUsuariosToPDF = (usuarios) => {
  try {
    console.log('📕 Iniciando export PDF...');

    if (!usuarios || usuarios.length === 0) {
      console.warn('Nenhum usuário para exportar!');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(238, 123, 77);
    doc.text('Relatório de Usuários', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de usuários: ${usuarios.length}`, 14, 36);

    const tableData = usuarios.map(u => [
      (u.nome || '').substring(0, 30),
      u.role || '',
      u.telefone || '',
      u.ativo ? 'Ativo' : 'Inativo'
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Nome', 'Cargo', 'Telefone', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [238, 123, 77],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 38 },
        2: { cellWidth: 35 },
        3: { cellWidth: 20, halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const fileName = `usuarios_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    setTimeout(() => {
      console.log('✅ PDF exportado:', fileName);
    }, 500);
    
  } catch (error) {
    console.error('❌ Erro ao exportar PDF:', error);
    console.error('Erro ao exportar:', error.message);
  }
};