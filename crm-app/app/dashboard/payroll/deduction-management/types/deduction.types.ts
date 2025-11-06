// Deduction Management Types for UAE Payroll System

export interface Deduction {
  id: string;
  employee_id: string;
  deduction_type: string;
  deduction_category: 'tax' | 'loan' | 'insurance' | 'housing' | 'transportation' | 'healthcare' | 'education' | 'communication' | 'utilities' | 'meals' | 'uniform' | 'maintenance' | 'other';
  amount_aed: number;
  deduction_date: string;
  description: string;
  status: 'pending' | 'processed' | 'cancelled';
  period_month: number;
  period_year: number;
  is_recurring: boolean;
  recurring_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  salary_structure_id?: string;
  employment_status: 'active' | 'inactive' | 'terminated';
  join_date: string;
  annual_salary_aed?: number;
  monthly_salary_aed?: number;
}

export interface TaxDeduction {
  id: string;
  employee_id: string;
  income_tax_rate: number; // UAE typically 0% for residents
  social_security_aed: number;
  other_taxes_aed: number;
  calculation_base: number; // Gross salary base
  effective_date: string;
  is_active: boolean;
  employee?: Employee;
}

export interface LoanDeduction {
  id: string;
  employee_id: string;
  loan_type: 'personal' | 'housing' | 'car' | 'education' | 'emergency' | 'other';
  principal_amount_aed: number;
  monthly_payment_aed: number;
  remaining_balance_aed: number;
  interest_rate: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  employee?: Employee;
}

export interface InsuranceDeduction {
  id: string;
  employee_id: string;
  insurance_type: 'health' | 'life' | 'disability' | 'accident' | 'critical_illness' | 'group_medical';
  premium_amount_aed: number;
  coverage_details: string;
  provider_name: string;
  policy_number: string;
  effective_date: string;
  expiry_date: string;
  employee_contribution_aed: number;
  employer_contribution_aed: number;
  employee?: Employee;
}

export interface DeductionCalculationRule {
  id: string;
  rule_name: string;
  deduction_category: string;
  calculation_type: 'fixed' | 'percentage' | 'formula' | 'tiered';
  calculation_value: number;
  formula_expression?: string;
  conditions?: string; // JSON string for complex conditions
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
}

export interface DeductionReport {
  id: string;
  report_name: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  generated_date: string;
  period_start: string;
  period_end: string;
  total_deductions_aed: number;
  report_data: any; // JSON data
  generated_by: string;
  file_url?: string;
}

export interface EmployeeDeductionPreference {
  id: string;
  employee_id: string;
  auto_deductions: boolean;
  tax_rate_percentage: number;
  insurance_deductions: boolean;
  loan_deductions: boolean;
  other_deductions: boolean;
  preferred_deduction_day: number; // Day of month (1-28)
  custom_deductions?: Array<{
    category: string;
    amount: number;
    description: string;
  }>;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface DeductionStats {
  totalDeductions: number;
  totalTaxDeductions: number;
  totalLoanDeductions: number;
  totalInsuranceDeductions: number;
  totalOtherDeductions: number;
  pendingDeductions: number;
  processedDeductions: number;
  complianceScore: number;
  monthlyTrends: Array<{
    month: string;
    total: number;
    tax: number;
    loan: number;
    insurance: number;
    other: number;
  }>;
}

export interface UAEDeductionCompliance {
  requiresTaxDeduction: boolean;
  maxTaxRate: number; // UAE: 0% for residents
  socialSecurityRequired: boolean;
  minWageCompliance: number; // UAE minimum wage considerations
  overtimeDeductionRules: string;
  leaveDeductionRules: string;
  endOfServiceDeductions: number;
  gratuityCalculation: number; // 21 days for 1+ year employees
}

export interface DeductionCalculationEngine {
  calculateTaxDeduction: (baseSalary: number, employeeId: string, date: string) => Promise<number>;
  calculateLoanDeduction: (employeeId: string, month: number, year: number) => Promise<number[]>;
  calculateInsuranceDeduction: (employeeId: string, month: number, year: number) => Promise<number>;
  calculateOtherDeductions: (employeeId: string, month: number, year: number) => Promise<number>;
  validateUAECCompliance: (deductions: Deduction[], baseSalary: number) => Promise<boolean>;
  generateDeductionSummary: (employeeId: string, month: number, year: number) => Promise<any>;
}

export interface DeductionExportData {
  employeeName: string;
  employeeId: string;
  deductionDate: string;
  category: string;
  type: string;
  amountAED: number;
  status: string;
  description: string;
}