// UAE Payroll Calculation Utilities
import { 
  Employee, 
  SalaryStructure, 
  Allowance, 
  Deduction, 
  OvertimeCalculation,
  CalculationPreview,
  DeductionPreview
} from '../types/payroll';

// UAE Labor Law Constants
export const UAE_LABOR_LAW = {
  MINIMUM_WAGE: 1000, // AED
  OVERTIME_MULTIPLIER: 1.25, // 125% of regular rate
  MAX_DAILY_OVERTIME_HOURS: 2, // Maximum 2 hours per day
  MAX_ANNUAL_OVERTIME_HOURS: 500, // Maximum 500 hours per year
  WORKING_DAYS_PER_MONTH: 22, // Standard working days
  HOURS_PER_DAY: 8, // Standard working hours per day
  TAX_FREE_THRESHOLD: 0, // UAE has no personal income tax
  SOCIAL_SECURITY_RATE: 0, // UAE doesn't have social security
  END_OF_SERVICE_CALCULATION_MONTHS: 12, // For annual calculations
} as const;

// UAE-compliant overtime calculation
export function calculateUAEOvertime(
  regularHours: number,
  overtimeHours: number,
  hourlyRate: number,
  workingDays: number = UAE_LABOR_LAW.WORKING_DAYS_PER_MONTH
): OvertimeCalculation {
  const dailyRegularHours = overtimeHours / workingDays;
  const maxDailyOvertime = UAE_LABOR_LAW.MAX_DAILY_OVERTIME_HOURS;
  const maxAnnualOvertime = UAE_LABOR_LAW.MAX_ANNUAL_OVERTIME_HOURS;
  
  // Check UAE compliance
  const maxDailyLimitExceeded = dailyRegularHours > maxDailyOvertime;
  const maxAnnualLimitExceeded = overtimeHours > maxAnnualOvertime;
  
  // Calculate overtime amount with UAE multiplier
  const overtimeRate = hourlyRate * UAE_LABOR_LAW.OVERTIME_MULTIPLIER;
  const overtimeAmount = overtimeHours * overtimeRate;
  
  // Daily, weekly, holiday, and emergency breakdown (simplified)
  const dailyOvertime = Math.min(overtimeHours, maxDailyOvertime * workingDays);
  const weeklyOvertime = Math.max(0, overtimeHours - dailyOvertime);
  const holidayOvertime = 0; // Would need holiday calendar data
  const emergencyOvertime = 0; // Would need emergency data
  
  return {
    id: '',
    organization_id: '',
    employee_id: '',
    calculation_period_month: 0,
    calculation_period_year: 0,
    regular_hourly_rate_aed: hourlyRate,
    overtime_multiplier: UAE_LABOR_LAW.OVERTIME_MULTIPLIER,
    overtime_hourly_rate_aed: overtimeRate,
    total_overtime_hours: overtimeHours,
    daily_overtime_hours: dailyOvertime,
    weekly_overtime_hours: weeklyOvertime,
    holiday_overtime_hours: holidayOvertime,
    emergency_overtime_hours: emergencyOvertime,
    total_overtime_amount_aed: overtimeAmount,
    uae_compliance_check: !maxDailyLimitExceeded && !maxAnnualLimitExceeded,
    max_daily_limit_exceeded: maxDailyLimitExceeded,
    max_annual_limit_exceeded: maxAnnualLimitExceeded,
    calculation_method: 'automatic',
    is_manual_adjustment: false
  };
}

// Calculate allowances with UAE compliance
export function calculateAllowances(
  employee: Employee,
  salaryStructure: SalaryStructure,
  workingDays: number = UAE_LABOR_LAW.WORKING_DAYS_PER_MONTH
): Allowance[] {
  const allowances: Allowance[] = [];
  
  // Transportation allowance
  if (salaryStructure.transportation_allowance_aed > 0) {
    allowances.push({
      id: '',
      organization_id: employee.organization_id || '',
      employee_id: employee.id,
      allowance_type: 'transportation',
      allowance_name: 'Transportation Allowance',
      calculation_method: 'fixed',
      base_amount_aed: salaryStructure.transportation_allowance_aed,
      calculated_amount_aed: salaryStructure.transportation_allowance_aed,
      is_taxable: false,
      is_recurring: true,
      effective_date: new Date().toISOString().split('T')[0],
      calculation_period_month: new Date().getMonth() + 1,
      calculation_period_year: new Date().getFullYear(),
      approval_required: false
    });
  }
  
  // Meal allowance
  if (salaryStructure.meal_allowance_aed > 0) {
    const dailyMealAllowance = salaryStructure.meal_allowance_aed / UAE_LABOR_LAW.WORKING_DAYS_PER_MONTH;
    allowances.push({
      id: '',
      organization_id: employee.organization_id || '',
      employee_id: employee.id,
      allowance_type: 'meal',
      allowance_name: 'Meal Allowance',
      calculation_method: 'daily',
      base_amount_aed: salaryStructure.meal_allowance_aed,
      calculation_rate: dailyMealAllowance,
      eligible_days: workingDays,
      calculated_amount_aed: dailyMealAllowance * workingDays,
      is_taxable: false,
      is_recurring: true,
      effective_date: new Date().toISOString().split('T')[0],
      calculation_period_month: new Date().getMonth() + 1,
      calculation_period_year: new Date().getFullYear(),
      approval_required: false
    });
  }
  
  // Accommodation allowance
  if (salaryStructure.accommodation_allowance_aed > 0) {
    allowances.push({
      id: '',
      organization_id: employee.organization_id || '',
      employee_id: employee.id,
      allowance_type: 'accommodation',
      allowance_name: 'Accommodation Allowance',
      calculation_method: 'fixed',
      base_amount_aed: salaryStructure.accommodation_allowance_aed,
      calculated_amount_aed: salaryStructure.accommodation_allowance_aed,
      is_taxable: false,
      is_recurring: true,
      effective_date: new Date().toISOString().split('T')[0],
      calculation_period_month: new Date().getMonth() + 1,
      calculation_period_year: new Date().getFullYear(),
      approval_required: false
    });
  }
  
  // Skills allowance
  if (salaryStructure.skills_allowance_aed > 0) {
    allowances.push({
      id: '',
      organization_id: employee.organization_id || '',
      employee_id: employee.id,
      allowance_type: 'skills_certification',
      allowance_name: 'Skills Certification Allowance',
      calculation_method: 'fixed',
      base_amount_aed: salaryStructure.skills_allowance_aed,
      calculated_amount_aed: salaryStructure.skills_allowance_aed,
      is_taxable: true,
      is_recurring: false,
      effective_date: new Date().toISOString().split('T')[0],
      calculation_period_month: new Date().getMonth() + 1,
      calculation_period_year: new Date().getFullYear(),
      approval_required: true
    });
  }
  
  return allowances;
}

// Calculate UAE-compliant deductions
export function calculateDeductions(
  employee: Employee,
  grossSalary: number,
  advanceAmount: number = 0,
  leaveDeduction: number = 0,
  otherDeductions: Deduction[] = []
): Deduction[] {
  const deductions: Deduction[] = [];
  
  // UAE has no income tax, but we include for international compliance
  deductions.push({
    id: '',
    organization_id: employee.organization_id || '',
    employee_id: employee.id,
    deduction_type: 'income_tax',
    deduction_name: 'Income Tax',
    calculation_method: 'percentage',
    deduction_rate: 0, // UAE: 0%
    calculated_amount_aed: 0,
    is_mandatory: false,
    is_statutory: false,
    uae_compliance_verified: true,
    approval_required: false,
    calculation_period_month: new Date().getMonth() + 1,
    calculation_period_year: new Date().getFullYear()
  });
  
  // Health insurance (if applicable)
  const healthInsuranceAmount = Math.min(grossSalary * 0.01, 300); // 1% or max 300 AED
  deductions.push({
    id: '',
    organization_id: employee.organization_id || '',
    employee_id: employee.id,
    deduction_type: 'health_insurance',
    deduction_name: 'Health Insurance',
    calculation_method: 'percentage',
    deduction_rate: 1,
    base_amount_aed: grossSalary,
    calculated_amount_aed: healthInsuranceAmount,
    is_mandatory: true,
    is_statutory: true,
    uae_compliance_verified: true,
    approval_required: false,
    calculation_period_month: new Date().getMonth() + 1,
    calculation_period_year: new Date().getFullYear()
  });
  
  // Advance salary deduction
  if (advanceAmount > 0) {
    deductions.push({
      id: '',
      organization_id: employee.organization_id || '',
      employee_id: employee.id,
      deduction_type: 'advance_salary',
      deduction_name: 'Advance Salary Deduction',
      calculation_method: 'fixed',
      calculated_amount_aed: advanceAmount,
      is_mandatory: true,
      is_statutory: false,
      uae_compliance_verified: true,
      approval_required: true,
      calculation_period_month: new Date().getMonth() + 1,
      calculation_period_year: new Date().getFullYear()
    });
  }
  
  // Leave deduction
  if (leaveDeduction > 0) {
    deductions.push({
      id: '',
      organization_id: employee.organization_id || '',
      employee_id: employee.id,
      deduction_type: 'unpaid_leave',
      deduction_name: 'Unpaid Leave Deduction',
      calculation_method: 'daily_rate',
      deduction_rate: employee.base_salary_aed / UAE_LABOR_LAW.WORKING_DAYS_PER_MONTH,
      calculated_amount_aed: leaveDeduction,
      is_mandatory: true,
      is_statutory: false,
      uae_compliance_verified: true,
      approval_required: false,
      calculation_period_month: new Date().getMonth() + 1,
      calculation_period_year: new Date().getFullYear()
    });
  }
  
  // Add other deductions
  deductions.push(...otherDeductions);
  
  return deductions;
}

// Main salary calculation function with UAE compliance
export function calculateMonthlySalary(
  employee: Employee,
  salaryStructure: SalaryStructure,
  regularHours: number,
  overtimeHours: number = 0,
  commissionAmount: number = 0,
  bonusAmount: number = 0,
  advanceAmount: number = 0,
  leaveDeduction: number = 0
): CalculationPreview {
  const uaeComplianceIssues: string[] = [];
  const warnings: string[] = [];
  
  // Validate minimum wage
  let calculatedNetSalary = salaryStructure.base_salary_aed;
  
  // Calculate overtime
  const overtimeCalc = calculateUAEOvertime(
    regularHours, 
    overtimeHours, 
    salaryStructure.hourly_rate_aed
  );
  
  if (overtimeCalc.max_daily_limit_exceeded) {
    uaeComplianceIssues.push('Daily overtime limit exceeded (max 2 hours per day)');
  }
  
  if (overtimeCalc.max_annual_limit_exceeded) {
    uaeComplianceIssues.push('Annual overtime limit exceeded (max 500 hours per year)');
  }
  
  // Calculate allowances
  const allowances = calculateAllowances(employee, salaryStructure);
  const totalAllowances = allowances.reduce((sum, allowance) => sum + allowance.calculated_amount_aed, 0);
  
  // Calculate deductions
  const deductions = calculateDeductions(
    employee, 
    salaryStructure.base_salary_aed, 
    advanceAmount, 
    leaveDeduction
  );
  const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.calculated_amount_aed, 0);
  
  // Calculate gross salary
  const grossSalary = 
    salaryStructure.base_salary_aed +
    overtimeCalc.total_overtime_amount_aed +
    commissionAmount +
    bonusAmount +
    totalAllowances;
  
  // Calculate net salary
  calculatedNetSalary = grossSalary - totalDeductions;
  
  // UAE minimum wage check
  if (calculatedNetSalary < UAE_LABOR_LAW.MINIMUM_WAGE) {
    uaeComplianceIssues.push(`Net salary below UAE minimum wage (${UAE_LABOR_LAW.MINIMUM_WAGE} AED)`);
    warnings.push('Net salary adjusted to meet minimum wage requirement');
    calculatedNetSalary = UAE_LABOR_LAW.MINIMUM_WAGE;
  }
  
  // Create deduction previews
  const deductionPreviews: DeductionPreview[] = deductions.map(deduction => ({
    type: deduction.deduction_type,
    name: deduction.deduction_name,
    amount: deduction.calculated_amount_aed,
    is_mandatory: deduction.is_mandatory,
    is_statutory: deduction.is_statutory
  }));
  
  return {
    employee_id: employee.id,
    employee_name: `${employee.first_name} ${employee.last_name}`,
    base_salary: salaryStructure.base_salary_aed,
    regular_hours: regularHours,
    overtime_hours: overtimeHours,
    overtime_amount: overtimeCalc.total_overtime_amount_aed,
    commission_amount: commissionAmount,
    bonus_amount: bonusAmount,
    allowances_amount: totalAllowances,
    gross_salary: grossSalary,
    deductions: deductionPreviews,
    net_salary: calculatedNetSalary,
    uae_compliance_issues: uaeComplianceIssues,
    warnings: warnings
  };
}

// Format currency for display
export function formatAED(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

// Validate calculation period
export function isValidCalculationPeriod(month: number, year: number): boolean {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Allow current month and up to 12 months in the past
  return year >= currentYear - 1 && 
         year <= currentYear && 
         (year < currentYear || month <= currentMonth);
}

// Generate calculation period label
export function getCalculationPeriodLabel(month: number, year: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[month - 1]} ${year}`;
}