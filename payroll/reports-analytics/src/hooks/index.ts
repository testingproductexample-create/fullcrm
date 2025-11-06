import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Employee, 
  MonthlyPayrollData, 
  QuarterlyData, 
  DepartmentData, 
  BudgetData,
  Metrics,
  FilterOptions,
  CompensationInsight
} from '../types';
import { 
  generateMockEmployees,
  calculateMetrics,
  groupByDepartment,
  filterEmployees,
  getDateRange,
  generateMonthRange,
  calculatePercentageChange
} from '../utils';

// Hook for managing employee data
export const useEmployeeData = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      const mockData = generateMockEmployees(50);
      setEmployees(mockData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const addEmployee = useCallback((employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: Math.max(...employees.map(e => e.id), 0) + 1,
    };
    setEmployees(prev => [...prev, newEmployee]);
  }, [employees]);

  const updateEmployee = useCallback((id: number, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === id ? { ...emp, ...updates } : emp
    ));
  }, []);

  const removeEmployee = useCallback((id: number) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  }, []);

  return {
    employees,
    isLoading,
    error,
    addEmployee,
    updateEmployee,
    removeEmployee,
  };
};

// Hook for generating monthly payroll data
export const useMonthlyPayrollData = (timeRange: string = '12months') => {
  const [data, setData] = useState<MonthlyPayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const { start, end } = getDateRange(timeRange);
      const months = generateMonthRange(start, end);
      
      const monthlyData: MonthlyPayrollData[] = months.map(month => ({
        month,
        year: new Date().getFullYear(),
        totalPayroll: Math.floor(Math.random() * 500000) + 200000,
        totalEmployees: Math.floor(Math.random() * 50) + 20,
        averageSalary: Math.floor(Math.random() * 20000) + 30000,
        benefits: Math.floor(Math.random() * 50000) + 10000,
        taxes: Math.floor(Math.random() * 100000) + 50000,
        bonuses: Math.floor(Math.random() * 30000) + 5000,
        overtime: Math.floor(Math.random() * 20000) + 2000,
        deductions: Math.floor(Math.random() * 15000) + 1000,
      }));
      
      setData(monthlyData);
      setIsLoading(false);
    }, 800);
  }, [timeRange]);

  return { data, isLoading };
};

// Hook for generating quarterly data
export const useQuarterlyData = () => {
  const [data, setData] = useState<QuarterlyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
      const quarterlyData: QuarterlyData[] = quarters.map(quarter => ({
        quarter,
        year: 2024,
        totalCompensation: Math.floor(Math.random() * 2000000) + 1000000,
        baseSalary: Math.floor(Math.random() * 1500000) + 800000,
        bonuses: Math.floor(Math.random() * 300000) + 100000,
        benefits: Math.floor(Math.random() * 200000) + 100000,
        taxes: Math.floor(Math.random() * 400000) + 200000,
        employeeCount: Math.floor(Math.random() * 50) + 20,
      }));
      
      setData(quarterlyData);
      setIsLoading(false);
    }, 600);
  }, []);

  return { data, isLoading };
};

// Hook for department data
export const useDepartmentData = (employees: Employee[]) => {
  const departmentData = useMemo(() => {
    return groupByDepartment(employees);
  }, [employees]);

  return { data: departmentData };
};

// Hook for budget data
export const useBudgetData = () => {
  const [data, setData] = useState<BudgetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const categories = ['Salaries', 'Benefits', 'Bonuses', 'Training', 'Equipment', 'Other'];
      const budgetData: BudgetData[] = categories.map(category => {
        const budgeted = Math.floor(Math.random() * 1000000) + 500000;
        const actual = Math.floor(Math.random() * 1000000) + 400000;
        const variance = budgeted - actual;
        const variancePercent = (variance / budgeted) * 100;

        return {
          category,
          budgeted,
          actual,
          variance,
          variancePercent,
          description: `${category} expenses for the current period`,
        };
      });
      
      setData(budgetData);
      setIsLoading(false);
    }, 700);
  }, []);

  return { data, isLoading };
};

// Hook for calculated metrics
export const useMetrics = (
  monthlyData: MonthlyPayrollData[],
  budgetData: BudgetData[],
  employees: Employee[]
) => {
  const metrics = useMemo(() => {
    return calculateMetrics(monthlyData, budgetData, employees);
  }, [monthlyData, budgetData, employees]);

  return metrics;
};

// Hook for filtering employees
export const useEmployeeFilter = (employees: Employee[]) => {
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: '12months',
    department: 'all',
    employeeType: 'all',
    salaryRange: { min: 0, max: 500000 },
    dateRange: {
      start: '2020-01-01',
      end: new Date().toISOString().split('T')[0],
    },
  });

  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = useMemo(() => {
    let filtered = filterEmployees(employees, filters);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term) ||
        emp.position.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [employees, filters, searchTerm]);

  const updateFilter = useCallback(<K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      timeRange: '12months',
      department: 'all',
      employeeType: 'all',
      salaryRange: { min: 0, max: 500000 },
      dateRange: {
        start: '2020-01-01',
        end: new Date().toISOString().split('T')[0],
      },
    });
    setSearchTerm('');
  }, []);

  return {
    filters,
    searchTerm,
    filteredEmployees,
    updateFilter,
    setSearchTerm,
    resetFilters,
  };
};

// Hook for compensation insights
export const useCompensationInsights = (
  monthlyData: MonthlyPayrollData[],
  departmentData: DepartmentData[]
): CompensationInsight[] => {
  const insights = useMemo(() => {
    const result: CompensationInsight[] = [];

    // Payroll trend analysis
    if (monthlyData.length >= 2) {
      const current = monthlyData[monthlyData.length - 1];
      const previous = monthlyData[monthlyData.length - 2];
      const trend = calculatePercentageChange(current.totalPayroll, previous.totalPayroll);

      if (Math.abs(trend) > 5) {
        result.push({
          type: 'trend',
          category: 'Payroll',
          message: `Payroll ${trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(trend).toFixed(1)}%`,
          value: current.totalPayroll,
          previousValue: previous.totalPayroll,
          impact: Math.abs(trend) > 10 ? 'high' : 'medium',
          recommendation: trend > 10 ? 
            'Review the increase in payroll costs' : 
            'Monitor payroll reduction trends',
        });
      }
    }

    // Department analysis
    departmentData.forEach(dept => {
      if (dept.turnoverRate > 15) {
        result.push({
          type: 'anomaly',
          category: 'Turnover',
          message: `High turnover rate in ${dept.name} department (${dept.turnoverRate.toFixed(1)}%)`,
          value: dept.turnoverRate,
          previousValue: 10,
          impact: 'high',
          recommendation: 'Review retention strategies and employee satisfaction',
        });
      }
    });

    // Budget variance analysis
    const totalBudget = departmentData.reduce((sum, dept) => sum + dept.departmentBudget, 0);
    const totalSpend = departmentData.reduce((sum, dept) => sum + dept.actualSpend, 0);
    const budgetVariance = ((totalSpend - totalBudget) / totalBudget) * 100;

    if (Math.abs(budgetVariance) > 5) {
      result.push({
        type: budgetVariance > 0 ? 'increase' : 'decrease',
        category: 'Budget',
        message: `Department budget ${budgetVariance > 0 ? 'overrun' : 'underrun'} by ${Math.abs(budgetVariance).toFixed(1)}%`,
        value: totalSpend,
        previousValue: totalBudget,
        impact: Math.abs(budgetVariance) > 15 ? 'high' : 'medium',
        recommendation: budgetVariance > 0 ?
          'Review spending patterns and adjust future budgets' :
          'Consider reallocating unused budget to other areas',
      });
    }

    return result;
  }, [monthlyData, departmentData]);

  return insights;
};

// Hook for managing export state
export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const startExport = useCallback(async (callback: () => Promise<void>) => {
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await callback();
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 500);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
      setIsExporting(false);
      setExportProgress(0);
    }
  }, []);

  return {
    isExporting,
    exportProgress,
    exportError,
    startExport,
    clearError: () => setExportError(null),
  };
};