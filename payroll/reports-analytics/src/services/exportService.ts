import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  Employee, 
  MonthlyPayrollData, 
  QuarterlyData, 
  DepartmentData, 
  BudgetData,
  Metrics,
  FinancialReport,
  ExportOptions 
} from '../types';
import { formatCurrency, formatPercentage, formatNumber } from '../utils';

export class ExportService {
  
  // Export to PDF
  static async exportToPDF(
    data: {
      employees?: Employee[];
      monthlyData?: MonthlyPayrollData[];
      quarterlyData?: QuarterlyData[];
      departments?: DepartmentData[];
      budget?: BudgetData[];
      metrics?: Metrics;
    },
    options: ExportOptions
  ): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Salary Reports & Analytics', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Summary section
    if (options.includeSummary && data.metrics) {
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Summary', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      const summaryData = [
        ['Total Payroll', formatCurrency(data.metrics.totalPayroll)],
        ['Total Employees', formatNumber(data.metrics.totalEmployees)],
        ['Average Salary', formatCurrency(data.metrics.avgSalary)],
        ['Budget Variance', formatCurrency(data.metrics.budgetVariance)],
        ['Cost per Employee', formatCurrency(data.metrics.costPerEmployee)],
      ];

      summaryData.forEach(([label, value]) => {
        doc.text(`${label}:`, 20, yPosition);
        doc.text(value, 100, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
    }

    // Employee data section
    if (options.includeEmployeeData && data.employees) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Employee Data', 20, yPosition);
      yPosition += 10;

      // Table headers
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const headers = ['Name', 'Department', 'Position', 'Salary'];
      const colWidths = [40, 30, 40, 30];
      let xPosition = 20;

      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 6;

      // Table data
      doc.setFontSize(7);
      data.employees.slice(0, 20).forEach((employee) => { // Limit to 20 for PDF
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        xPosition = 20;
        const rowData = [
          employee.name,
          employee.department,
          employee.position,
          formatCurrency(employee.salary),
        ];

        rowData.forEach((cell, index) => {
          doc.text(cell, xPosition, yPosition);
          xPosition += colWidths[index];
        });
        yPosition += 5;
      });

      if (data.employees.length > 20) {
        yPosition += 5;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`... and ${data.employees.length - 20} more employees`, 20, yPosition);
      }
    }

    // Save the PDF
    doc.save(`salary-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Export to Excel
  static async exportToExcel(
    data: {
      employees?: Employee[];
      monthlyData?: MonthlyPayrollData[];
      quarterlyData?: QuarterlyData[];
      departments?: DepartmentData[];
      budget?: BudgetData[];
      metrics?: Metrics;
    },
    options: ExportOptions
  ): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    if (data.metrics) {
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Payroll', data.metrics.totalPayroll],
        ['Total Employees', data.metrics.totalEmployees],
        ['Average Salary', data.metrics.avgSalary],
        ['Budget Variance', data.metrics.budgetVariance],
        ['Cost per Employee', data.metrics.costPerEmployee],
        ['Turnover Rate', data.metrics.turnoverRate],
        ['Average Tenure', data.metrics.averageTenure],
        ['Promotion Rate', data.metrics.promotionRate],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Employee data sheet
    if (data.employees) {
      const employeeData = data.employees.map(emp => ({
        'ID': emp.id,
        'Name': emp.name,
        'Email': emp.email,
        'Department': emp.department,
        'Position': emp.position,
        'Salary': emp.salary,
        'Hire Date': emp.hireDate,
        'Status': emp.status,
      }));

      const employeeSheet = XLSX.utils.json_to_sheet(employeeData);
      XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Employees');
    }

    // Monthly data sheet
    if (data.monthlyData) {
      const monthlySheet = XLSX.utils.json_to_sheet(data.monthlyData);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Data');
    }

    // Quarterly data sheet
    if (data.quarterlyData) {
      const quarterlySheet = XLSX.utils.json_to_sheet(data.quarterlyData);
      XLSX.utils.book_append_sheet(workbook, quarterlySheet, 'Quarterly Data');
    }

    // Department data sheet
    if (data.departments) {
      const departmentSheet = XLSX.utils.json_to_sheet(data.departments);
      XLSX.utils.book_append_sheet(workbook, departmentSheet, 'Departments');
    }

    // Budget data sheet
    if (data.budget) {
      const budgetSheet = XLSX.utils.json_to_sheet(data.budget);
      XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget');
    }

    // Save the Excel file
    XLSX.writeFile(workbook, `salary-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // Export to CSV
  static exportToCSV(
    data: Employee[],
    filename: string = 'employee-data'
  ): void {
    if (!data || data.length === 0) return;

    const csvData = data.map(employee => ({
      ID: employee.id,
      Name: employee.name,
      Email: employee.email,
      Department: employee.department,
      Position: employee.position,
      Salary: employee.salary,
      'Hire Date': employee.hireDate,
      Status: employee.status,
    }));

    const csv = Papa.unparse(csvData);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Export to JSON
  static exportToJSON(
    data: any,
    filename: string = 'salary-data'
  ): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Generate comprehensive report
  static generateReport(
    data: {
      employees: Employee[];
      monthlyData: MonthlyPayrollData[];
      quarterlyData: QuarterlyData[];
      departments: DepartmentData[];
      budget: BudgetData[];
      metrics: Metrics;
    }
  ): FinancialReport {
    return {
      reportId: `RPT-${Date.now()}`,
      reportName: `Salary Analytics Report - ${new Date().toLocaleDateString()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: 'System', // In real app, get from user context
      period: {
        startDate: data.monthlyData[0]?.month || '',
        endDate: data.monthlyData[data.monthlyData.length - 1]?.month || '',
      },
      summary: data.metrics,
      data: {
        monthly: data.monthlyData,
        quarterly: data.quarterlyData,
        departments: data.departments,
        budget: data.budget,
        employees: data.employees,
      },
    };
  }

  // Export report with custom formatting
  static async exportReport(
    report: FinancialReport,
    format: 'pdf' | 'excel' | 'csv' | 'json',
    options: ExportOptions = {
      format,
      includeCharts: true,
      includeEmployeeData: true,
      includeSummary: true,
    }
  ): Promise<void> {
    const exportData = {
      employees: options.includeEmployeeData ? report.data.employees : undefined,
      monthlyData: report.data.monthly,
      quarterlyData: report.data.quarterly,
      departments: report.data.departments,
      budget: report.data.budget,
      metrics: options.includeSummary ? report.summary : undefined,
    };

    switch (format) {
      case 'pdf':
        await this.exportToPDF(exportData, options);
        break;
      case 'excel':
        await this.exportToExcel(exportData, options);
        break;
      case 'csv':
        if (exportData.employees) {
          this.exportToCSV(exportData.employees, 'salary-report');
        }
        break;
      case 'json':
        this.exportToJSON(report, 'salary-report');
        break;
    }
  }
}

export default ExportService;