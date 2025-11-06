// Deduction Management System Exports
export { default as DeductionManagement } from './page';
export { default as TaxDeductions } from './components/TaxDeductions';
export { default as LoanDeductions } from './components/LoanDeductions';
export { default as InsuranceDeductions } from './components/InsuranceDeductions';
export { default as DeductionHistoryReports } from './components/DeductionHistoryReports';
export { default as EmployeePreferences } from './components/EmployeePreferences';
export { DeductionCalculator, deductionCalculator } from './lib/deduction-calculator';
export * from './types/deduction.types';

// Additional helper exports
export const DEDUCTION_CATEGORIES = {
  TAX: 'tax',
  LOAN: 'loan',
  INSURANCE: 'insurance',
  HOUSING: 'housing',
  TRANSPORTATION: 'transportation',
  HEALTHCARE: 'healthcare',
  EDUCATION: 'education',
  COMMUNICATION: 'communication',
  UTILITIES: 'utilities',
  MEALS: 'meals',
  UNIFORM: 'uniform',
  MAINTENANCE: 'maintenance',
  OTHER: 'other'
} as const;

export const DEDUCTION_STATUS = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  CANCELLED: 'cancelled'
} as const;

export const LOAN_TYPES = {
  PERSONAL: 'personal',
  HOUSING: 'housing',
  CAR: 'car',
  EDUCATION: 'education',
  EMERGENCY: 'emergency',
  OTHER: 'other'
} as const;

export const INSURANCE_TYPES = {
  HEALTH: 'health',
  LIFE: 'life',
  DISABILITY: 'disability',
  ACCIDENT: 'accident',
  CRITICAL_ILLNESS: 'critical_illness',
  GROUP_MEDICAL: 'group_medical'
} as const;

export const RECURRING_FREQUENCIES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
} as const;