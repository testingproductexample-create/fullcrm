import { useState, useEffect } from 'react';
import { supabase, getEmployees, getSalaryStructures, getDepartments, getSalaryCalculations, createSalaryCalculation, updateSalaryCalculation, approveSalaryCalculation, bulkCreateSalaryCalculations, getPayrollSummary } from '../lib/supabase';
import { 
  Employee, 
  SalaryStructure, 
  Department, 
  SalaryCalculation, 
  BulkCalculationRequest, 
  BulkCalculationResult,
  PayrollSummary,
  CalculationPreview 
} from '../types/payroll';
import { calculateMonthlySalary } from '../utils/calculations';

// Hook for managing employees
export function useEmployees(organizationId: string) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    async function fetchEmployees() {
      try {
        setLoading(true);
        const data = await getEmployees(organizationId);
        setEmployees(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    }

    fetchEmployees();
  }, [organizationId]);

  const refetch = () => {
    if (organizationId) {
      getEmployees(organizationId).then(data => {
        setEmployees(data || []);
        setError(null);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      });
    }
  };

  return { employees, loading, error, refetch };
}

// Hook for managing salary structures
export function useSalaryStructures(organizationId: string) {
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    async function fetchSalaryStructures() {
      try {
        setLoading(true);
        const data = await getSalaryStructures(organizationId);
        setSalaryStructures(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch salary structures');
      } finally {
        setLoading(false);
      }
    }

    fetchSalaryStructures();
  }, [organizationId]);

  return { salaryStructures, loading, error };
}

// Hook for managing departments
export function useDepartments(organizationId: string) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    async function fetchDepartments() {
      try {
        setLoading(true);
        const data = await getDepartments(organizationId);
        setDepartments(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch departments');
      } finally {
        setLoading(false);
      }
    }

    fetchDepartments();
  }, [organizationId]);

  return { departments, loading, error };
}

// Hook for managing salary calculations
export function useSalaryCalculations(organizationId: string, month: number, year: number) {
  const [calculations, setCalculations] = useState<SalaryCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId || !month || !year) return;

    async function fetchCalculations() {
      try {
        setLoading(true);
        const data = await getSalaryCalculations(organizationId, month, year);
        setCalculations(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch salary calculations');
      } finally {
        setLoading(false);
      }
    }

    fetchCalculations();
  }, [organizationId, month, year]);

  const createCalculation = async (calculation: Omit<SalaryCalculation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCalculation = await createSalaryCalculation(calculation);
      setCalculations(prev => [newCalculation, ...prev]);
      return newCalculation;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create calculation');
    }
  };

  const updateCalculation = async (id: string, updates: Partial<SalaryCalculation>) => {
    try {
      const updatedCalculation = await updateSalaryCalculation(id, updates);
      setCalculations(prev => 
        prev.map(calc => calc.id === id ? updatedCalculation : calc)
      );
      return updatedCalculation;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update calculation');
    }
  };

  const approveCalculation = async (id: string, approvedBy: string) => {
    try {
      const approvedCalc = await approveSalaryCalculation(id, approvedBy);
      setCalculations(prev => 
        prev.map(calc => calc.id === id ? approvedCalc : calc)
      );
      return approvedCalc;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to approve calculation');
    }
  };

  return { 
    calculations, 
    loading, 
    error, 
    createCalculation, 
    updateCalculation, 
    approveCalculation,
    refetch: () => {
      if (organizationId && month && year) {
        getSalaryCalculations(organizationId, month, year).then(data => {
          setCalculations(data || []);
        }).catch(err => {
          setError(err instanceof Error ? err.message : 'Failed to fetch calculations');
        });
      }
    }
  };
}

// Hook for bulk calculations
export function useBulkCalculations(organizationId: string) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkCalculationResult | null>(null);

  const processBulkCalculations = async (request: BulkCalculationRequest) => {
    setLoading(true);
    setResult(null);
    
    const startTime = Date.now();
    const processedEmployees: string[] = [];
    const errors: Array<{ employee_id: string; error_message: string }> = [];
    
    try {
      // This would typically be done via a Supabase Edge Function for better performance
      for (const employeeId of request.employee_ids) {
        try {
          // Simulate calculation process
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
          
          // Add to processed list
          processedEmployees.push(employeeId);
        } catch (err) {
          errors.push({
            employee_id: employeeId,
            error_message: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }
      
      const processingTime = Date.now() - startTime;
      const bulkResult: BulkCalculationResult = {
        success_count: processedEmployees.length,
        error_count: errors.length,
        processed_employees: processedEmployees,
        errors: errors,
        total_processed: request.employee_ids.length,
        processing_time_ms: processingTime
      };
      
      setResult(bulkResult);
      return bulkResult;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Bulk calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, processBulkCalculations };
}

// Hook for payroll summary
export function usePayrollSummary(organizationId: string, month: number, year: number) {
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId || !month || !year) return;

    async function fetchSummary() {
      try {
        setLoading(true);
        const data = await getPayrollSummary(organizationId, month, year);
        setSummary(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch payroll summary');
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [organizationId, month, year]);

  return { summary, loading, error };
}

// Hook for calculation preview
export function useCalculationPreview() {
  const [preview, setPreview] = useState<CalculationPreview | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = async (
    employee: Employee,
    salaryStructure: SalaryStructure,
    regularHours: number,
    overtimeHours: number = 0,
    commissionAmount: number = 0,
    bonusAmount: number = 0,
    advanceAmount: number = 0,
    leaveDeduction: number = 0
  ) => {
    setLoading(true);
    try {
      const calculationPreview = calculateMonthlySalary(
        employee,
        salaryStructure,
        regularHours,
        overtimeHours,
        commissionAmount,
        bonusAmount,
        advanceAmount,
        leaveDeduction
      );
      setPreview(calculationPreview);
      return calculationPreview;
    } finally {
      setLoading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return { preview, loading, generatePreview, clearPreview };
}

// Hook for managing current calculation period
export function useCalculationPeriod() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const goToPreviousPeriod = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextPeriod = () => {
    const currentDate = new Date();
    if (year > currentDate.getFullYear() || 
        (year === currentDate.getFullYear() && month >= currentDate.getMonth() + 1)) {
      return; // Don't go to future periods
    }
    
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const isCurrentPeriod = () => {
    const currentDate = new Date();
    return month === currentDate.getMonth() + 1 && year === currentDate.getFullYear();
  };

  const canGoToNext = () => {
    const currentDate = new Date();
    return year < currentDate.getFullYear() || 
           (year === currentDate.getFullYear() && month < currentDate.getMonth() + 1);
  };

  return { 
    month, 
    year, 
    setMonth, 
    setYear, 
    goToPreviousPeriod, 
    goToNextPeriod, 
    isCurrentPeriod, 
    canGoToNext 
  };
}

// Hook for managing UI state
export function usePayrollUI() {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'individual' | 'bulk' | 'reports'>('overview');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCalculationId, setSelectedCalculationId] = useState<string | null>(null);

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = (employeeIds: string[]) => {
    setSelectedEmployees(employeeIds);
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  return {
    selectedEmployees,
    sidebarOpen,
    activeTab,
    showPreview,
    selectedCalculationId,
    setSidebarOpen,
    setActiveTab,
    setShowPreview,
    setSelectedCalculationId,
    toggleEmployeeSelection,
    selectAllEmployees,
    clearSelection
  };
}