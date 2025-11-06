// Type definitions for the salary reports and analytics system

export interface Employee {
  id: number;
  name: string;
  department: string;
  position: string;
  salary: number;
  email: string;
  hireDate: string;
  manager?: string;
  status: 'active' | 'inactive' | 'terminated';
}

export interface MonthlyPayrollData {
  month: string;
  year: number;
  totalPayroll: number;
  totalEmployees: number;
  averageSalary: number;
  benefits: number;
  taxes: number;
  bonuses: number;
  overtime: number;
  deductions: number;
}

export interface QuarterlyData {
  quarter: string;
  year: number;
  totalCompensation: number;
  baseSalary: number;
  bonuses: number;
  benefits: number;
  taxes: number;
  employeeCount: number;
}

export interface DepartmentData {
  name: string;
  value: number;
  employees: number;
  avgSalary: number;
  departmentBudget: number;
  actualSpend: number;
  turnoverRate: number;
}

export interface BudgetData {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  description?: string;
}

export interface Metrics {
  totalPayroll: number;
  totalEmployees: number;
  avgSalary: number;
  trend: number;
  totalBudget: number;
  actualSpend: number;
  budgetVariance: number;
  budgetUtilization: number;
  costPerEmployee: number;
  turnoverRate: number;
  averageTenure: number;
  promotionRate: number;
}

export interface FilterOptions {
  timeRange: '3months' | '6months' | '12months' | '24months';
  department: string;
  employeeType: 'all' | 'full-time' | 'part-time' | 'contract';
  salaryRange: {
    min: number;
    max: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeEmployeeData: boolean;
  includeSummary: boolean;
  dateRange?: string;
  departments?: string[];
}

export interface ChartData {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'radar';
  data: any[];
  xAxisKey?: string;
  yAxisKey?: string;
  color?: string;
  height?: number;
}

export interface FinancialReport {
  reportId: string;
  reportName: string;
  generatedAt: string;
  generatedBy: string;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: Metrics;
  data: {
    monthly: MonthlyPayrollData[];
    quarterly: QuarterlyData[];
    departments: DepartmentData[];
    budget: BudgetData[];
    employees: Employee[];
  };
}

export interface CompensationInsight {
  type: 'increase' | 'decrease' | 'trend' | 'anomaly';
  category: string;
  message: string;
  value: number;
  previousValue: number;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
}

export interface KPICard {
  title: string;
  value: string | number;
  previousValue?: string | number;
  trend: number;
  trendDirection: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
  description?: string;
}