// Export utilities for financial data
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const formatCurrency = (amount: number) => {
  return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-AE', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Export to CSV
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (data.length === 0) return;

  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = data.map(row => 
    csvHeaders.map(header => {
      const value = row[header];
      // Handle values with commas, quotes, or newlines
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );

  const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to JSON
export const exportToJSON = (data: any[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to Excel (CSV format compatible with Excel)
export const exportToExcel = (data: any[], filename: string, headers?: string[]) => {
  exportToCSV(data, filename, headers);
};

// Export to PDF
export const exportToPDF = (
  data: any[], 
  filename: string, 
  title: string,
  columns: { header: string; dataKey: string }[],
  summary?: { label: string; value: string }[]
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 22);
  
  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-AE')}`, 14, 30);
  
  let yPosition = 40;

  // Add summary if provided
  if (summary && summary.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    summary.forEach(item => {
      doc.text(`${item.label}: ${item.value}`, 14, yPosition);
      yPosition += 6;
    });
    yPosition += 4;
  }

  // Add table
  autoTable(doc, {
    startY: yPosition,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => {
      const value = row[col.dataKey];
      return value !== null && value !== undefined ? String(value) : '';
    })),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    margin: { top: 10 }
  });
  
  doc.save(`${filename}.pdf`);
};

// Export financial statement to PDF
export const exportFinancialStatementToPDF = (
  title: string,
  filename: string,
  sections: { 
    title: string; 
    items: { label: string; amount: number; isTotal?: boolean; indent?: number }[] 
  }[]
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 22, { align: 'center' });
  
  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-AE')}`, 105, 30, { align: 'center' });
  
  let yPosition = 45;

  sections.forEach((section, sectionIndex) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Section title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 14, yPosition);
    yPosition += 8;

    // Draw separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPosition, 196, yPosition);
    yPosition += 6;

    // Section items
    doc.setFontSize(10);
    section.items.forEach(item => {
      const indent = (item.indent || 0) * 5;
      const xPosition = 14 + indent;
      
      if (item.isTotal) {
        doc.setFont('helvetica', 'bold');
        doc.line(14, yPosition - 2, 196, yPosition - 2);
      } else {
        doc.setFont('helvetica', 'normal');
      }

      doc.text(item.label, xPosition, yPosition);
      doc.text(formatCurrency(item.amount), 196, yPosition, { align: 'right' });
      yPosition += 6;

      if (item.isTotal) {
        doc.line(14, yPosition - 2, 196, yPosition - 2);
        yPosition += 2;
      }
    });

    yPosition += 4;
  });
  
  doc.save(`${filename}.pdf`);
};
