// UAE Overtime & Allowances Types

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  regularHours: number;
  overtimeHours: number;
  overtimeType: 'weekday' | 'weekend' | 'holiday' | 'night';
  hourlyRate: number;
  overtimeAmount: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AllowanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  allowanceType: 'housing' | 'transport' | 'meal' | 'medical' | 'phone' | 'other';
  amount: number;
  currency: string;
  paymentType: 'fixed' | 'variable';
  effectiveDate: string;
  endDate?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeAllowanceConfig {
  id: string;
  employeeType: 'full_time' | 'part_time' | 'contractor' | 'intern';
  department: string;
  position: string;
  baseSalary: number;
  allowances: {
    housing: number;
    transport: number;
    meal: number;
    medical: number;
    phone: number;
  };
  overtimeRates: {
    weekday: number; // 1.25x base rate
    weekend: number; // 1.5x base rate
    holiday: number; // 2x base rate
    night: number; // 1.5x base rate + night premium
  };
  maxOvertimeHours: number; // Per week/month
  applicableLaws: string[]; // UAE labor law references
}

export interface OvertimeApproval {
  id: string;
  overtimeRecordId: string;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionDate: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  breakTime: number; // minutes
  totalHours: number;
  overtimeHours: number;
  leaveType?: 'annual' | 'sick' | 'emergency' | 'maternity' | 'paternity';
  status: 'present' | 'absent' | 'late' | 'partial';
}

export interface OvertimeReport {
  period: string; // YYYY-MM
  totalOvertimeHours: number;
  totalOvertimeAmount: number;
  totalAllowances: number;
  departmentBreakdown: {
    department: string;
    employeeCount: number;
    totalOvertimeHours: number;
    totalOvertimeAmount: number;
    totalAllowances: number;
  }[];
  complianceStatus: 'compliant' | 'warning' | 'violation';
  violations?: string[];
}

export interface UAELaborLawCompliance {
  maxWorkingHours: number; // 8 hours per day, 48 hours per week
  maxOvertimeHours: number; // 2 hours per day maximum
  overtimeRates: {
    weekday: number; // 1.25x (25% premium)
    weekend: number; // 1.5x (50% premium)
    holiday: number; // 2x (100% premium)
  };
  annualLeave: number; // 30 days
  sickLeave: number; // Up to 90 days with medical certificate
  gratuityCalculation: number; // 21 days salary after 1 year
  workingDays: number[]; // Sunday to Thursday (5 days)
  weekendDays: number[]; // Friday and Saturday (2 days)
}

export interface CalculationRule {
  id: string;
  name: string;
  description: string;
  formula: string;
  conditions: string[];
  applicable: boolean;
  priority: number;
}

export interface OvertimeAnalytics {
  totalOvertimeHours: number;
  averageOvertimeHours: number;
  topOvertimeEmployees: {
    employeeId: string;
    employeeName: string;
    totalHours: number;
    totalAmount: number;
  }[];
  departmentOvertime: {
    department: string;
    totalHours: number;
    employeeCount: number;
  }[];
  complianceRate: number;
  costAnalysis: {
    currentMonth: number;
    previousMonth: number;
    variance: number;
    variancePercentage: number;
  };
}