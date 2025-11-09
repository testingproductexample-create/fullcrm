import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qmttczrdpzzsbxwutfwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtdHRjenJkcHp6c2J4d3V0Znd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTI4MDYsImV4cCI6MjA3NzkyODgwNn0.nbzNwtMUGYI1F5RbOES__D1jpac06hwkBdoy34ahiuM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for payroll operations
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
  }
  return !error;
}

// Payroll-specific helper functions
export async function getEmployees(organizationId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      departments(name)
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('first_name');

  if (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }

  return data;
}

export async function getSalaryStructures(organizationId: string) {
  const { data, error } = await supabase
    .from('salary_structures')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('structure_name');

  if (error) {
    console.error('Error fetching salary structures:', error);
    throw error;
  }

  return data;
}

export async function getDepartments(organizationId: string) {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }

  return data;
}

export async function getSalaryCalculations(
  organizationId: string, 
  month: number, 
  year: number
) {
  const { data, error } = await supabase
    .from('salary_calculations')
    .select(`
      *,
      employees(first_name, last_name, email, job_title),
      salary_structures(structure_name, job_title)
    `)
    .eq('organization_id', organizationId)
    .eq('calculation_period_month', month)
    .eq('calculation_period_year', year)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching salary calculations:', error);
    throw error;
  }

  return data;
}

export async function createSalaryCalculation(calculation: any) {
  const { data, error } = await supabase
    .from('salary_calculations')
    .insert([calculation])
    .select()
    .single();

  if (error) {
    console.error('Error creating salary calculation:', error);
    throw error;
  }

  return data;
}

export async function updateSalaryCalculation(
  id: string, 
  updates: Partial<any>
) {
  const { data, error } = await supabase
    .from('salary_calculations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating salary calculation:', error);
    throw error;
  }

  return data;
}

export async function approveSalaryCalculation(id: string, approvedBy: string) {
  const { data, error } = await supabase
    .from('salary_calculations')
    .update({
      calculation_status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error approving salary calculation:', error);
    throw error;
  }

  return data;
}

export async function bulkCreateSalaryCalculations(calculations: any[]) {
  const { data, error } = await supabase
    .from('salary_calculations')
    .insert(calculations)
    .select();

  if (error) {
    console.error('Error bulk creating salary calculations:', error);
    throw error;
  }

  return data;
}

export async function getPayrollSummary(organizationId: string, month: number, year: number) {
  const { data, error } = await supabase
    .from('salary_calculations')
    .select(`
      calculation_status,
      gross_salary_aed,
      net_salary_aed,
      deductions_amount_aed,
      overtime_amount_aed,
      commission_amount_aed,
      bonus_amount_aed
    `)
    .eq('organization_id', organizationId)
    .eq('calculation_period_month', month)
    .eq('calculation_period_year', year);

  if (error) {
    console.error('Error fetching payroll summary:', error);
    throw error;
  }

  // Calculate summary statistics
  const summary = {
    total_employees: data.length,
    total_gross_salary: data.reduce((sum, calc) => sum + parseFloat(calc.gross_salary_aed || 0), 0),
    total_net_salary: data.reduce((sum, calc) => sum + parseFloat(calc.net_salary_aed || 0), 0),
    total_deductions: data.reduce((sum, calc) => sum + parseFloat(calc.deductions_amount_aed || 0), 0),
    total_overtime: data.reduce((sum, calc) => sum + parseFloat(calc.overtime_amount_aed || 0), 0),
    total_commissions: data.reduce((sum, calc) => sum + parseFloat(calc.commission_amount_aed || 0), 0),
    total_bonuses: data.reduce((sum, calc) => sum + parseFloat(calc.bonus_amount_aed || 0), 0),
    pending_approvals: data.filter(calc => calc.calculation_status === 'pending').length,
    processing_status: 'idle' as const
  };

  return summary;
}