// Types for UAE Payroll System - Monthly Salary Calculations

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: string;
  job_title: string;
  salary_structure_id?: string;
  base_salary_aed: number;
  hourly_rate_aed: number;
  hire_date: string;
  status: 'active' | 'inactive' | 'terminated';
}

export interface SalaryStructure {
  id: string;
  structure_name: string;
  structure_code: string;
  job_title: string;
  department_id: string;
  experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'expert' | 'lead';
  base_salary_aed: number;
  min_salary_aed: number;
  max_salary_aed: number;
  salary_currency: string;
  hourly_rate_aed: number;
  overtime_rate_multiplier: number;
  commission_eligible: boolean;
  commission_base_percentage: number;
  bonus_eligible: boolean;
  transportation_allowance_aed: number;
  meal_allowance_aed: number;
  accommodation_allowance_aed: number;
  skills_allowance_aed: number;
  is_active: boolean;
}

export interface SalaryCalculation {
  id: string;
  organization_id: string;
  employee_id: string;
  calculation_period_month: number;
  calculation_period_year: number;
  salary_structure_id?: string;
  base_salary_aed: number;
  hourly_rate_aed: number;
  total_work_hours: number;
  regular_hours: number;
  overtime_hours: number;
  overtime_amount_aed: number;
  commission_amount_aed: number;
  bonus_amount_aed: number;
  allowances_amount_aed: number;
  gross_salary_aed: number;
  deductions_amount_aed: number;
  tax_amount_aed: number;
  insurance_deduction_aed: number;
  advance_deduction_aed: number;
  leave_deduction_aed: number;
  other_deductions_aed: number;
  net_salary_aed: number;
  calculation_status: 'pending' | 'calculating' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  calculation_date: string;
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  payment_reference?: string;
  notes?: string;
  calculation_details?: Record<string, any>;
  is_final: boolean;
  adjustment_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface OvertimeCalculation {
  id: string;
  organization_id: string;
  employee_id: string;
  salary_calculation_id?: string;
  calculation_period_month: number;
  calculation_period_year: number;
  regular_hourly_rate_aed: number;
  overtime_multiplier: number;
  overtime_hourly_rate_aed: number;
  total_overtime_hours: number;
  daily_overtime_hours: number;
  weekly_overtime_hours: number;
  holiday_overtime_hours: number;
  emergency_overtime_hours: number;
  total_overtime_amount_aed: number;
  uae_compliance_check: boolean;
  max_daily_limit_exceeded: boolean;
  max_annual_limit_exceeded: boolean;
  overtime_source_data?: Record<string, any>;
  calculation_method: string;
  is_manual_adjustment: boolean;
  adjustment_reason?: string;
}

export interface Allowance {
  id: string;
  organization_id: string;
  employee_id: string;
  salary_calculation_id?: string;
  allowance_type: 'transportation' | 'meal' | 'accommodation' | 'skills_certification' | 'mobile' | 'internet' | 'education' | 'health' | 'family';
  allowance_name: string;
  calculation_method: 'fixed' | 'daily' | 'hourly' | 'percentage' | 'performance_based';
  base_amount_aed: number;
  calculation_rate?: number;
  eligible_days?: number;
  eligible_hours?: number;
  percentage_base?: number;
  calculated_amount_aed: number;
  is_taxable: boolean;
  is_recurring: boolean;
  effective_date: string;
  expiry_date?: string;
  calculation_period_month: number;
  calculation_period_year: number;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  supporting_documents?: string[];
}

export interface Deduction {
  id: string;
  organization_id: string;
  employee_id: string;
  salary_calculation_id?: string;
  deduction_type: 'income_tax' | 'social_security' | 'health_insurance' | 'life_insurance' | 'pension' | 'loan_repayment' | 'advance_salary' | 'unpaid_leave' | 'disciplinary' | 'other';
  deduction_name: string;
  calculation_method: 'fixed' | 'percentage' | 'daily_rate' | 'pro_rated';
  base_amount_aed?: number;
  deduction_rate?: number;
  calculated_amount_aed: number;
  is_mandatory: boolean;
  is_statutory: boolean;
  deduction_period_start?: string;
  deduction_period_end?: string;
  calculation_period_month: number;
  calculation_period_year: number;
  remaining_amount_aed?: number;
  installment_number?: number;
  total_installments?: number;
  uae_compliance_verified: boolean;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: string;
  reference_number?: string;
  notes?: string;
  supporting_documents?: string[];
}

export interface BonusRecord {
  id: string;
  organization_id: string;
  employee_id: string;
  salary_calculation_id?: string;
  bonus_type: 'performance' | 'annual' | 'festival' | 'customer_satisfaction' | 'efficiency' | 'quality' | 'team_achievement' | 'retention' | 'referral';
  bonus_name: string;
  calculation_method: 'fixed' | 'percentage' | 'performance_based' | 'target_based';
  base_amount_aed?: number;
  bonus_percentage?: number;
  target_value?: number;
  actual_value?: number;
  achievement_percentage?: number;
  calculated_amount_aed: number;
  performance_period_start?: string;
  performance_period_end?: string;
  calculation_period_month: number;
  calculation_period_year: number;
  eligibility_criteria?: Record<string, any>;
  performance_metrics?: Record<string, any>;
  is_taxable: boolean;
  is_recurring: boolean;
  approval_level: number;
  approved_by?: string;
  approved_at?: string;
  payout_date?: string;
  is_paid: boolean;
  notes?: string;
}

export interface CalculationPreview {
  employee_id: string;
  employee_name: string;
  base_salary: number;
  regular_hours: number;
  overtime_hours: number;
  overtime_amount: number;
  commission_amount: number;
  bonus_amount: number;
  allowances_amount: number;
  gross_salary: number;
  deductions: DeductionPreview[];
  net_salary: number;
  uae_compliance_issues: string[];
  warnings: string[];
}

export interface DeductionPreview {
  type: string;
  name: string;
  amount: number;
  is_mandatory: boolean;
  is_statutory: boolean;
}

export interface BulkCalculationRequest {
  employee_ids: string[];
  calculation_period_month: number;
  calculation_period_year: number;
  override_calculations?: boolean;
  force_approval?: boolean;
  notes?: string;
}

export interface BulkCalculationResult {
  success_count: number;
  error_count: number;
  processed_employees: string[];
  errors: Array<{
    employee_id: string;
    error_message: string;
  }>;
  total_processed: number;
  processing_time_ms: number;
}

export interface PayrollSummary {
  total_employees: number;
  total_gross_salary: number;
  total_net_salary: number;
  total_deductions: number;
  total_overtime: number;
  total_commissions: number;
  total_bonuses: number;
  uae_compliance_score: number;
  pending_approvals: number;
  processing_status: 'idle' | 'processing' | 'completed' | 'failed';
}

export interface Department {
  id: string;
  name: string;
  organization_id: string;
  budget_allocated?: number;
  is_active: boolean;
}