import { supabase } from '@/lib/supabase';
import { 
  Deduction, 
  DeductionCalculationEngine, 
  UAEDeductionCompliance, 
  TaxDeduction, 
  LoanDeduction, 
  InsuranceDeduction 
} from '../types/deduction.types';

export class DeductionCalculator implements DeductionCalculationEngine {
  private uaeCompliance: UAEDeductionCompliance = {
    requiresTaxDeduction: true,
    maxTaxRate: 0, // UAE has 0% income tax for residents
    socialSecurityRequired: false, // UAE doesn't have social security system
    minWageCompliance: 1500, // UAE minimum wage
    overtimeDeductionRules: 'Overtime deductions only for unauthorized overtime',
    leaveDeductionRules: 'Proportional deductions for unpaid leave only',
    endOfServiceDeductions: 0, // End of service is benefit, not deduction
    gratuityCalculation: 21 // days of basic salary for 1+ year employees
  };

  /**
   * Calculate tax deductions for UAE employees
   * UAE has 0% income tax for residents, but may have other statutory deductions
   */
  async calculateTaxDeduction(baseSalary: number, employeeId: string, date: string): Promise<number> {
    try {
      // UAE has 0% income tax, so this should be minimal
      let totalTaxDeductions = 0;

      // Check for any social security or other statutory deductions
      const { data: taxRecord, error } = await supabase
        .from('tax_deductions')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching tax deduction:', error);
        return 0;
      }

      if (taxRecord) {
        // Add any statutory deductions (social security, etc.)
        totalTaxDeductions += taxRecord.social_security_aed || 0;
        totalTaxDeductions += taxRecord.other_taxes_aed || 0;
      }

      return Math.max(0, totalTaxDeductions);
    } catch (error) {
      console.error('Error calculating tax deduction:', error);
      return 0;
    }
  }

  /**
   * Calculate active loan deductions for an employee
   */
  async calculateLoanDeduction(employeeId: string, month: number, year: number): Promise<number> {
    try {
      const { data: activeLoans, error } = await supabase
        .from('loan_deductions')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'active')
        .lte('start_date', `${year}-${month.toString().padStart(2, '0')}-31`)
        .gte('end_date', `${year}-${month.toString().padStart(2, '0')}-01`);

      if (error) {
        console.error('Error fetching active loans:', error);
        return 0;
      }

      const totalLoanDeductions = (activeLoans || []).reduce((sum, loan) => {
        return sum + (loan.monthly_payment_aed || 0);
      }, 0);

      return Math.max(0, totalLoanDeductions);
    } catch (error) {
      console.error('Error calculating loan deductions:', error);
      return 0;
    }
  }

  /**
   * Calculate insurance premium deductions
   */
  async calculateInsuranceDeduction(employeeId: string, month: number, year: number): Promise<number> {
    try {
      const { data: activeInsurance, error } = await supabase
        .from('insurance_deductions')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .lte('effective_date', `${year}-${month.toString().padStart(2, '0')}-31`)
        .gte('expiry_date', `${year}-${month.toString().padStart(2, '0')}-01`);

      if (error) {
        console.error('Error fetching insurance deductions:', error);
        return 0;
      }

      const totalInsuranceDeductions = (activeInsurance || []).reduce((sum, insurance) => {
        return sum + (insurance.employee_contribution_aed || 0);
      }, 0);

      return Math.max(0, totalInsuranceDeductions);
    } catch (error) {
      console.error('Error calculating insurance deductions:', error);
      return 0;
    }
  }

  /**
   * Calculate other deductions (housing, transportation, etc.)
   */
  async calculateOtherDeductions(employeeId: string, month: number, year: number): Promise<number> {
    try {
      const { data: otherDeductions, error } = await supabase
        .from('deductions')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('period_month', month)
        .eq('period_year', year)
        .in('deduction_category', [
          'housing', 'transportation', 'healthcare', 'education', 
          'communication', 'utilities', 'meals', 'uniform', 'maintenance', 'other'
        ]);

      if (error) {
        console.error('Error fetching other deductions:', error);
        return 0;
      }

      const totalOtherDeductions = (otherDeductions || []).reduce((sum, deduction) => {
        return sum + (deduction.amount_aed || 0);
      }, 0);

      return Math.max(0, totalOtherDeductions);
    } catch (error) {
      console.error('Error calculating other deductions:', error);
      return 0;
    }
  }

  /**
   * Validate UAE compliance for deductions
   */
  async validateUAECCompliance(deductions: Deduction[], baseSalary: number): Promise<boolean> {
    try {
      // Check minimum wage compliance
      if (baseSalary < this.uaeCompliance.minWageCompliance) {
        console.warn('Salary below UAE minimum wage:', baseSalary);
        return false;
      }

      // UAE specific checks
      const totalDeductions = deductions.reduce((sum, ded) => sum + (ded.amount_aed || 0), 0);
      const maxDeductionsPercentage = 0.5; // Generally shouldn't exceed 50% of salary
      
      if (totalDeductions > (baseSalary * maxDeductionsPercentage)) {
        console.warn('Deductions exceed 50% of salary:', totalDeductions, baseSalary);
        return false;
      }

      // Check for mandatory deductions only
      const taxDeductions = deductions.filter(ded => ded.deduction_category === 'tax');
      if (taxDeductions.length > 0) {
        const totalTax = taxDeductions.reduce((sum, ded) => sum + (ded.amount_aed || 0), 0);
        if (totalTax > (baseSalary * (this.uaeCompliance.maxTaxRate / 100))) {
          console.warn('Tax deductions exceed UAE limits:', totalTax);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating UAE compliance:', error);
      return false;
    }
  }

  /**
   * Generate comprehensive deduction summary for an employee
   */
  async generateDeductionSummary(employeeId: string, month: number, year: number): Promise<any> {
    try {
      // Get employee information
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select(`
          *,
          salary_structures (
            basic_salary_aed,
            structure_name
          )
        `)
        .eq('id', employeeId)
        .single();

      if (employeeError) {
        console.error('Error fetching employee:', employeeError);
        return null;
      }

      const baseSalary = employee.salary_structures?.basic_salary_aed || employee.monthly_salary_aed || 0;

      // Calculate all deduction types
      const taxDeductions = await this.calculateTaxDeduction(baseSalary, employeeId, `${year}-${month.toString().padStart(2, '0')}-01`);
      const loanDeductions = await this.calculateLoanDeduction(employeeId, month, year);
      const insuranceDeductions = await this.calculateInsuranceDeduction(employeeId, month, year);
      const otherDeductions = await this.calculateOtherDeductions(employeeId, month, year);

      const totalDeductions = taxDeductions + loanDeductions + insuranceDeductions + otherDeductions;
      const netSalary = baseSalary - totalDeductions;

      // Validate compliance
      const allDeductions: Deduction[] = []; // Would fetch all deductions here
      const isCompliant = await this.validateUAECCompliance(allDeductions, baseSalary);

      return {
        employee: {
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
          jobTitle: employee.job_title,
          baseSalary: baseSalary
        },
        deductions: {
          tax: taxDeductions,
          loan: loanDeductions,
          insurance: insuranceDeductions,
          other: otherDeductions,
          total: totalDeductions
        },
        netSalary: netSalary,
        compliance: {
          isCompliant,
          checks: {
            minimumWage: baseSalary >= this.uaeCompliance.minWageCompliance,
            maxDeductionRate: totalDeductions <= (baseSalary * 0.5),
            taxCompliance: taxDeductions <= (baseSalary * (this.uaeCompliance.maxTaxRate / 100))
          }
        },
        calculationDate: new Date().toISOString(),
        period: {
          month,
          year
        }
      };
    } catch (error) {
      console.error('Error generating deduction summary:', error);
      return null;
    }
  }

  /**
   * Calculate overtime deductions (UAE specific)
   */
  calculateOvertimeDeduction(baseSalary: number, overtimeHours: number, overtimeRate: number = 1.25): number {
    // UAE Labor Law: Overtime should be paid at 125% of regular rate
    // Deductions would only apply for unauthorized overtime
    if (overtimeHours <= 0) return 0;
    
    const hourlyRate = baseSalary / 160; // Assuming 160 working hours per month
    const overtimePay = overtimeHours * hourlyRate * overtimeRate;
    
    // If overtime is unauthorized, this amount might be deducted
    return overtimePay;
  }

  /**
   * Calculate leave deductions (UAE specific)
   */
  calculateLeaveDeduction(baseSalary: number, leaveDays: number, totalWorkDays: number = 22): number {
    if (leaveDays <= 0) return 0;
    
    const dailyRate = baseSalary / totalWorkDays;
    return leaveDays * dailyRate;
  }

  /**
   * Get UAE compliance information
   */
  getUAEComplianceRules(): UAEDeductionCompliance {
    return this.uaeCompliance;
  }
}

// Export singleton instance
export const deductionCalculator = new DeductionCalculator();