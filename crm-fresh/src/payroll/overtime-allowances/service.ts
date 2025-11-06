import { 
  OvertimeRecord, 
  AllowanceRecord, 
  EmployeeAllowanceConfig, 
  OvertimeApproval,
  AttendanceRecord,
  OvertimeReport,
  OvertimeAnalytics,
  EmployeeAllowanceConfig
} from './types';
import { calculateOvertimeFromAttendance } from './uaeCompliantCalculator';

// Mock employee data
const mockEmployees = [
  { id: 'emp001', name: 'Ahmed Al-Rashid', department: 'Engineering', position: 'Senior Developer', type: 'full_time' as const, baseSalary: 15000 },
  { id: 'emp002', name: 'Fatima Hassan', department: 'Marketing', position: 'Marketing Manager', type: 'full_time' as const, baseSalary: 12000 },
  { id: 'emp003', name: 'Mohammed Al-Zahra', department: 'Sales', position: 'Sales Representative', type: 'full_time' as const, baseSalary: 8000 },
  { id: 'emp004', name: 'Aisha Ibrahim', department: 'HR', position: 'HR Specialist', type: 'full_time' as const, baseSalary: 10000 },
  { id: 'emp005', name: 'Khalid Mansour', department: 'Finance', position: 'Financial Analyst', type: 'full_time' as const, baseSalary: 11000 },
  { id: 'emp006', name: 'Nour Al-Farisi', department: 'Engineering', position: 'Junior Developer', type: 'part_time' as const, baseSalary: 6000 },
  { id: 'emp007', name: 'Omar Al-Tamimi', department: 'Operations', position: 'Operations Manager', type: 'full_time' as const, baseSalary: 14000 },
  { id: 'emp008', name: 'Layla Al-Qasimi', department: 'Design', position: 'UI/UX Designer', type: 'contractor' as const, baseSalary: 9000 },
];

export class OvertimeAllowancesService {
  private static overtimeRecords: OvertimeRecord[] = [];
  private static allowanceRecords: AllowanceRecord[] = [];
  private static employeeConfigs: EmployeeAllowanceConfig[] = [];
  private static approvals: OvertimeApproval[] = [];
  private static attendanceRecords: AttendanceRecord[] = [];

  static {
    this.initializeMockData();
  }

  private static initializeMockData() {
    // Initialize employee allowance configurations
    mockEmployees.forEach(emp => {
      const config: EmployeeAllowanceConfig = {
        id: `config_${emp.id}`,
        employeeType: emp.type,
        department: emp.department,
        position: emp.position,
        baseSalary: emp.baseSalary,
        allowances: {
          housing: Math.round(emp.baseSalary * 0.25), // 25% of base salary
          transport: 1500, // Fixed amount
          meal: 800, // Fixed amount
          medical: 500, // Fixed amount
          phone: 200, // Fixed amount
        },
        overtimeRates: {
          weekday: 1.25,
          weekend: 1.5,
          holiday: 2.0,
          night: 1.5,
        },
        maxOvertimeHours: 96, // 2 hours x 6 days x 8 weeks
        applicableLaws: ['UAE Labor Law Article 67', 'UAE Labor Law Article 69'],
      };
      this.employeeConfigs.push(config);
    });

    // Initialize allowance records
    mockEmployees.forEach(emp => {
      const config = this.employeeConfigs.find(c => c.id === `config_${emp.id}`);
      if (config) {
        Object.entries(config.allowances).forEach(([type, amount]) => {
          if (amount > 0) {
            this.allowanceRecords.push({
              id: `allowance_${Date.now()}_${emp.id}_${type}`,
              employeeId: emp.id,
              employeeName: emp.name,
              department: emp.department,
              allowanceType: type as AllowanceRecord['allowanceType'],
              amount: amount,
              currency: 'AED',
              paymentType: 'fixed',
              effectiveDate: '2024-01-01',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        });
      }
    });

    // Initialize overtime records (last 30 days)
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Randomly assign overtime to some employees
      mockEmployees.slice(0, 6).forEach(emp => {
        if (Math.random() < 0.3) { // 30% chance
          const overtimeHours = Math.random() * 2; // 0-2 hours
          const config = this.employeeConfigs.find(c => c.id === `config_${emp.id}`);
          if (config && overtimeHours > 0) {
            const baseHourlyRate = emp.baseSalary / 22 / 8; // Monthly / 22 days / 8 hours
            const dayOfWeek = date.getDay();
            const overtimeType = dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' as const : 'weekday' as const;
            
            const overtimeAmount = baseHourlyRate * overtimeHours * 
              (overtimeType === 'weekend' ? 1.5 : 1.25);

            this.overtimeRecords.push({
              id: `ot_${Date.now()}_${emp.id}_${i}`,
              employeeId: emp.id,
              employeeName: emp.name,
              department: emp.department,
              date: dateStr,
              regularHours: 8,
              overtimeHours: Math.round(overtimeHours * 100) / 100,
              overtimeType,
              hourlyRate: Math.round(baseHourlyRate * 100) / 100,
              overtimeAmount: Math.round(overtimeAmount * 100) / 100,
              totalAmount: Math.round(overtimeAmount * 100) / 100,
              status: Math.random() > 0.7 ? 'approved' : 'pending',
              createdAt: date.toISOString(),
              updatedAt: date.toISOString(),
            });
          }
        }
      });
    }

    // Initialize approval records
    this.overtimeRecords.filter(ot => ot.status === 'approved').forEach(ot => {
      this.approvals.push({
        id: `approval_${ot.id}`,
        overtimeRecordId: ot.id,
        approverId: 'mgr001',
        approverName: 'Sarah Johnson',
        status: 'approved',
        actionDate: new Date().toISOString(),
      });
    });

    // Initialize attendance records
    mockEmployees.forEach(emp => {
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Simulate working days only (no weekends for attendance)
        if (date.getDay() === 5 || date.getDay() === 6) continue;

        const overtimeHours = Math.random() * 2;
        const totalHours = 8 + overtimeHours;

        this.attendanceRecords.push({
          id: `att_${emp.id}_${i}`,
          employeeId: emp.id,
          date: dateStr,
          checkIn: '09:00',
          checkOut: `${Math.floor(totalHours + 9)}:${(totalHours % 1 * 60).toString().padStart(2, '0')}`,
          breakTime: 60,
          totalHours: totalHours,
          overtimeHours: overtimeHours,
          status: 'present',
        });
      }
    });
  }

  // Overtime Methods
  static async getOvertimeRecords(employeeId?: string, startDate?: string, endDate?: string): Promise<OvertimeRecord[]> {
    let records = [...this.overtimeRecords];
    
    if (employeeId) {
      records = records.filter(r => r.employeeId === employeeId);
    }
    
    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async createOvertimeRecord(record: OvertimeRecord): Promise<OvertimeRecord> {
    this.overtimeRecords.push(record);
    return record;
  }

  static async updateOvertimeRecord(id: string, updates: Partial<OvertimeRecord>): Promise<OvertimeRecord | null> {
    const index = this.overtimeRecords.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    this.overtimeRecords[index] = { ...this.overtimeRecords[index], ...updates, updatedAt: new Date().toISOString() };
    return this.overtimeRecords[index];
  }

  static async approveOvertime(overtimeId: string, approverId: string, approverName: string, comments?: string): Promise<boolean> {
    const record = this.overtimeRecords.find(r => r.id === overtimeId);
    if (!record) return false;

    record.status = 'approved';
    record.approvedBy = approverId;
    record.approvedAt = new Date().toISOString();
    record.notes = comments;
    record.updatedAt = new Date().toISOString();

    this.approvals.push({
      id: `approval_${overtimeId}`,
      overtimeRecordId: overtimeId,
      approverId,
      approverName,
      status: 'approved',
      comments,
      actionDate: new Date().toISOString(),
    });

    return true;
  }

  static async rejectOvertime(overtimeId: string, approverId: string, approverName: string, comments: string): Promise<boolean> {
    const record = this.overtimeRecords.find(r => r.id === overtimeId);
    if (!record) return false;

    record.status = 'rejected';
    record.notes = comments;
    record.updatedAt = new Date().toISOString();

    this.approvals.push({
      id: `approval_${overtimeId}`,
      overtimeRecordId: overtimeId,
      approverId,
      approverName,
      status: 'rejected',
      comments,
      actionDate: new Date().toISOString(),
    });

    return true;
  }

  // Allowance Methods
  static async getAllowanceRecords(employeeId?: string): Promise<AllowanceRecord[]> {
    if (employeeId) {
      return this.allowanceRecords.filter(r => r.employeeId === employeeId);
    }
    return this.allowanceRecords;
  }

  static async createAllowanceRecord(record: AllowanceRecord): Promise<AllowanceRecord> {
    this.allowanceRecords.push(record);
    return record;
  }

  static async updateAllowanceRecord(id: string, updates: Partial<AllowanceRecord>): Promise<AllowanceRecord | null> {
    const index = this.allowanceRecords.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    this.allowanceRecords[index] = { ...this.allowanceRecords[index], ...updates, updatedAt: new Date().toISOString() };
    return this.allowanceRecords[index];
  }

  // Configuration Methods
  static async getEmployeeConfigs(): Promise<EmployeeAllowanceConfig[]> {
    return this.employeeConfigs;
  }

  static async updateEmployeeConfig(id: string, updates: Partial<EmployeeAllowanceConfig>): Promise<EmployeeAllowanceConfig | null> {
    const index = this.employeeConfigs.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    this.employeeConfigs[index] = { ...this.employeeConfigs[index], ...updates };
    return this.employeeConfigs[index];
  }

  // Reports Methods
  static async generateOvertimeReport(month: string): Promise<OvertimeReport> {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    const monthRecords = this.overtimeRecords.filter(r => r.date >= startDate && r.date <= endDate);

    const departmentMap = new Map<string, {
      employeeCount: Set<string>;
      totalOvertimeHours: number;
      totalOvertimeAmount: number;
      totalAllowances: number;
    }>();

    let totalOvertimeHours = 0;
    let totalOvertimeAmount = 0;
    let totalAllowances = 0;

    monthRecords.forEach(record => {
      totalOvertimeHours += record.overtimeHours;
      totalOvertimeAmount += record.overtimeAmount;

      if (!departmentMap.has(record.department)) {
        departmentMap.set(record.department, {
          employeeCount: new Set(),
          totalOvertimeHours: 0,
          totalOvertimeAmount: 0,
          totalAllowances: 0,
        });
      }

      const dept = departmentMap.get(record.department)!;
      dept.employeeCount.add(record.employeeId);
      dept.totalOvertimeHours += record.overtimeHours;
      dept.totalOvertimeAmount += record.overtimeAmount;
    });

    // Calculate allowances
    this.allowanceRecords.forEach(allowance => {
      const employee = mockEmployees.find(e => e.id === allowance.employeeId);
      if (employee && allowance.status === 'active') {
        totalAllowances += allowance.amount;
        if (departmentMap.has(employee.department)) {
          departmentMap.get(employee.department)!.totalAllowances += allowance.amount;
        }
      }
    });

    const departmentBreakdown = Array.from(departmentMap.entries()).map(([department, data]) => ({
      department,
      employeeCount: data.employeeCount.size,
      totalOvertimeHours: Math.round(data.totalOvertimeHours * 100) / 100,
      totalOvertimeAmount: Math.round(data.totalOvertimeAmount * 100) / 100,
      totalAllowances: Math.round(data.totalAllowances * 100) / 100,
    }));

    return {
      period: month,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      totalOvertimeAmount: Math.round(totalOvertimeAmount * 100) / 100,
      totalAllowances: Math.round(totalAllowances * 100) / 100,
      departmentBreakdown,
      complianceStatus: 'compliant', // Would be calculated based on UAE law
    };
  }

  static async getOvertimeAnalytics(): Promise<OvertimeAnalytics> {
    const currentMonth = new Date();
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const currentMonthStr = currentMonth.toISOString().substring(0, 7);
    const previousMonthStr = previousMonth.toISOString().substring(0, 7);

    const currentMonthRecords = this.overtimeRecords.filter(r => r.date.startsWith(currentMonthStr));
    const previousMonthRecords = this.overtimeRecords.filter(r => r.date.startsWith(previousMonthStr));

    const totalOvertimeHours = currentMonthRecords.reduce((sum, r) => sum + r.overtimeHours, 0);
    const averageOvertimeHours = currentMonthRecords.length > 0 ? totalOvertimeHours / currentMonthRecords.length : 0;

    // Top overtime employees
    const employeeOvertimeMap = new Map<string, { name: string; totalHours: number; totalAmount: number }>();
    currentMonthRecords.forEach(record => {
      const existing = employeeOvertimeMap.get(record.employeeId);
      if (existing) {
        existing.totalHours += record.overtimeHours;
        existing.totalAmount += record.overtimeAmount;
      } else {
        employeeOvertimeMap.set(record.employeeId, {
          name: record.employeeName,
          totalHours: record.overtimeHours,
          totalAmount: record.overtimeAmount,
        });
      }
    });

    const topOvertimeEmployees = Array.from(employeeOvertimeMap.entries())
      .map(([employeeId, data]) => ({
        employeeId,
        employeeName: data.name,
        totalHours: Math.round(data.totalHours * 100) / 100,
        totalAmount: Math.round(data.totalAmount * 100) / 100,
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5);

    // Department breakdown
    const departmentMap = new Map<string, { totalHours: number; employeeCount: Set<string> }>();
    currentMonthRecords.forEach(record => {
      if (!departmentMap.has(record.department)) {
        departmentMap.set(record.department, { totalHours: 0, employeeCount: new Set() });
      }
      const dept = departmentMap.get(record.department)!;
      dept.totalHours += record.overtimeHours;
      dept.employeeCount.add(record.employeeId);
    });

    const departmentOvertime = Array.from(departmentMap.entries()).map(([department, data]) => ({
      department,
      totalHours: Math.round(data.totalHours * 100) / 100,
      employeeCount: data.employeeCount.size,
    }));

    const currentMonthCost = currentMonthRecords.reduce((sum, r) => sum + r.totalAmount, 0);
    const previousMonthCost = previousMonthRecords.reduce((sum, r) => sum + r.totalAmount, 0);
    const variance = currentMonthCost - previousMonthCost;
    const variancePercentage = previousMonthCost > 0 ? (variance / previousMonthCost) * 100 : 0;

    return {
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      averageOvertimeHours: Math.round(averageOvertimeHours * 100) / 100,
      topOvertimeEmployees,
      departmentOvertime,
      complianceRate: 95.5, // Mock compliance rate
      costAnalysis: {
        currentMonth: Math.round(currentMonthCost * 100) / 100,
        previousMonth: Math.round(previousMonthCost * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        variancePercentage: Math.round(variancePercentage * 100) / 100,
      },
    };
  }
}