import { format, parseISO, subMonths, subYears, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Employee, 
  MonthlyPayrollData, 
  QuarterlyData, 
  DepartmentData, 
  BudgetData,
  Metrics,
  FilterOptions 
} from '../types';

// Format currency values
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format numbers with commas
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Format percentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Calculate percentage change
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Generate date ranges
export const getDateRange = (timeRange: string): { start: Date; end: Date } => {
  const end = new Date();
  let start: Date;

  switch (timeRange) {
    case '3months':
      start = subMonths(end, 3);
      break;
    case '6months':
      start = subMonths(end, 6);
      break;
    case '12months':
      start = subMonths(end, 12);
      break;
    case '24months':
      start = subMonths(end, 24);
      break;
    default:
      start = subMonths(end, 12);
  }

  return { start, end };
};

// Generate months between two dates
export const generateMonthRange = (start: Date, end: Date): string[] => {
  const months: string[] = [];
  const current = startOfMonth(start);
  const last = endOfMonth(end);

  while (current <= last) {
    months.push(format(current, 'MMM yyyy'));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
};

// Calculate salary statistics
export const calculateSalaryStats = (employees: Employee[]) => {
  const salaries = employees.map(emp => emp.salary);
  const sortedSalaries = salaries.sort((a, b) => a - b);
  
  const total = salaries.reduce((sum, salary) => sum + salary, 0);
  const average = total / salaries.length;
  const median = sortedSalaries[Math.floor(sortedSalaries.length / 2)];
  const min = Math.min(...salaries);
  const max = Math.max(...salaries);
  
  return { total, average, median, min, max, count: salaries.length };
};

// Group employees by department
export const groupByDepartment = (employees: Employee[]): DepartmentData[] => {
  const departmentGroups = employees.reduce((acc, employee) => {
    if (!acc[employee.department]) {
      acc[employee.department] = [];
    }
    acc[employee.department].push(employee);
    return acc;
  }, {} as Record<string, Employee[]>);

  return Object.entries(departmentGroups).map(([department, deptEmployees]) => ({
    name: department,
    value: deptEmployees.reduce((sum, emp) => sum + emp.salary, 0),
    employees: deptEmployees.length,
    avgSalary: deptEmployees.reduce((sum, emp) => sum + emp.salary, 0) / deptEmployees.length,
    departmentBudget: deptEmployees.reduce((sum, emp) => sum + emp.salary, 0) * 1.2, // 20% buffer
    actualSpend: deptEmployees.reduce((sum, emp) => sum + emp.salary, 0),
    turnoverRate: Math.random() * 15, // Mock data
  }));
};

// Calculate metrics
export const calculateMetrics = (
  monthlyData: MonthlyPayrollData[],
  budgetData: BudgetData[],
  employees: Employee[]
): Metrics => {
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  
  const totalPayroll = monthlyData.reduce((sum, month) => sum + month.totalPayroll, 0);
  const totalEmployees = currentMonth?.totalEmployees || 0;
  const avgSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
  const trend = previousMonth ? 
    calculatePercentageChange(currentMonth.totalPayroll, previousMonth.totalPayroll) : 0;

  const totalBudget = budgetData.reduce((sum, item) => sum + item.budgeted, 0);
  const actualSpend = budgetData.reduce((sum, item) => sum + item.actual, 0);
  const budgetVariance = totalBudget - actualSpend;
  const budgetUtilization = totalBudget > 0 ? (actualSpend / totalBudget) * 100 : 0;
  const costPerEmployee = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
  const turnoverRate = 8.2; // Mock data
  const averageTenure = 3.4; // Mock data
  const promotionRate = 12.5; // Mock data

  return {
    totalPayroll,
    totalEmployees,
    avgSalary,
    trend,
    totalBudget,
    actualSpend,
    budgetVariance,
    budgetUtilization,
    costPerEmployee,
    turnoverRate,
    averageTenure,
    promotionRate,
  };
};

// Filter employees based on criteria
export const filterEmployees = (employees: Employee[], filters: FilterOptions): Employee[] => {
  return employees.filter(employee => {
    // Department filter
    if (filters.department !== 'all' && employee.department !== filters.department) {
      return false;
    }

    // Salary range filter
    if (employee.salary < filters.salaryRange.min || employee.salary > filters.salaryRange.max) {
      return false;
    }

    // Date range filter
    const hireDate = parseISO(employee.hireDate);
    const startDate = parseISO(filters.dateRange.start);
    const endDate = parseISO(filters.dateRange.end);
    
    if (hireDate < startDate || hireDate > endDate) {
      return false;
    }

    return true;
  });
};

// Generate mock data for demonstration
export const generateMockEmployees = (count: number = 50): Employee[] => {
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  const positions = {
    Engineering: ['Software Engineer', 'Senior Developer', 'Tech Lead', 'Engineering Manager'],
    Marketing: ['Marketing Specialist', 'Marketing Manager', 'Content Creator', 'SEO Specialist'],
    Sales: ['Sales Representative', 'Account Manager', 'Sales Director', 'Business Development'],
    HR: ['HR Specialist', 'Recruiter', 'HR Manager', 'People Operations'],
    Finance: ['Financial Analyst', 'Accountant', 'Finance Manager', 'CFO'],
    Operations: ['Operations Manager', 'Project Coordinator', 'Operations Specialist'],
  };

  const firstNames = ['John', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa', 'Chris', 'Anna', 'James', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Wilson', 'Brown', 'Davis', 'Miller', 'Moore', 'Taylor', 'Anderson', 'Thomas'];

  return Array.from({ length: count }, (_, i) => {
    const department = departments[Math.floor(Math.random() * departments.length)];
    const positionList = positions[department as keyof typeof positions];
    const position = positionList[Math.floor(Math.random() * positionList.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    const salaryRange = {
      'Software Engineer': [70000, 120000],
      'Senior Developer': [90000, 150000],
      'Tech Lead': [110000, 180000],
      'Engineering Manager': [130000, 200000],
      'Marketing Specialist': [45000, 70000],
      'Marketing Manager': [65000, 95000],
      'Content Creator': [40000, 65000],
      'SEO Specialist': [50000, 80000],
      'Sales Representative': [50000, 80000],
      'Account Manager': [70000, 110000],
      'Sales Director': [100000, 160000],
      'Business Development': [80000, 130000],
      'HR Specialist': [45000, 65000],
      'Recruiter': [50000, 75000],
      'HR Manager': [70000, 100000],
      'People Operations': [60000, 90000],
      'Financial Analyst': [60000, 90000],
      'Accountant': [50000, 75000],
      'Finance Manager': [80000, 120000],
      'CFO': [150000, 250000],
      'Operations Manager': [70000, 110000],
      'Project Coordinator': [45000, 70000],
      'Operations Specialist': [50000, 80000],
    };

    const [minSalary, maxSalary] = salaryRange[position as keyof typeof salaryRange] || [40000, 100000];
    const salary = Math.floor(Math.random() * (maxSalary - minSalary + 1)) + minSalary;

    const hireDate = new Date();
    hireDate.setFullYear(hireDate.getFullYear() - Math.floor(Math.random() * 8));

    return {
      id: i + 1,
      name: `${firstName} ${lastName}`,
      department,
      position,
      salary,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      hireDate: hireDate.toISOString().split('T')[0],
      status: 'active' as const,
    };
  });
};

// Debounce function for search
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Color utilities for charts
export const getChartColors = (): string[] => {
  return [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};