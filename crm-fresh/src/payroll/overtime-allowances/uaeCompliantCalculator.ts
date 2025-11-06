import { UAELaborLawCompliance, OvertimeRecord, AttendanceRecord } from './types';

export const UAE_LABOR_LAW: UAELaborLawCompliance = {
  maxWorkingHours: 8, // per day
  maxOvertimeHours: 2, // per day maximum
  overtimeRates: {
    weekday: 1.25, // 25% premium
    weekend: 1.5, // 50% premium  
    holiday: 2.0, // 100% premium
  },
  annualLeave: 30, // days per year
  sickLeave: 90, // days with medical certificate
  gratuityCalculation: 21, // days salary after 1 year
  workingDays: [0, 1, 2, 3, 4], // Sunday to Thursday
  weekendDays: [5, 6], // Friday and Saturday
};

export class UAEOvertimeCalculator {
  /**
   * Calculate overtime hours based on UAE labor law
   * Maximum 8 hours per day, 2 hours overtime max
   */
  static calculateDailyOvertimeHours(actualHours: number): number {
    if (actualHours <= UAE_LABOR_LAW.maxWorkingHours) {
      return 0;
    }
    
    const overtimeHours = actualHours - UAE_LABOR_LAW.maxWorkingHours;
    return Math.min(overtimeHours, UAE_LABOR_LAW.maxOvertimeHours);
  }

  /**
   * Calculate weekly overtime hours
   * Maximum 48 hours per week, 6 working days
   */
  static calculateWeeklyOvertimeHours(weeklyHours: number): number {
    const maxWeeklyHours = UAE_LABOR_LAW.maxWorkingHours * 6; // 6 working days
    if (weeklyHours <= maxWeeklyHours) {
      return 0;
    }
    
    return weeklyHours - maxWeeklyHours;
  }

  /**
   * Calculate overtime amount based on UAE rates
   */
  static calculateOvertimeAmount(
    baseHourlyRate: number,
    overtimeHours: number,
    overtimeType: 'weekday' | 'weekend' | 'holiday' | 'night'
  ): number {
    const rateMultiplier = this.getOvertimeRateMultiplier(overtimeType);
    const baseAmount = baseHourlyRate * overtimeHours;
    return Math.round(baseAmount * rateMultiplier * 100) / 100;
  }

  /**
   * Get overtime rate multiplier for UAE
   */
  static getOvertimeRateMultiplier(overtimeType: 'weekday' | 'weekend' | 'holiday' | 'night'): number {
    switch (overtimeType) {
      case 'weekday':
        return UAE_LABOR_LAW.overtimeRates.weekday;
      case 'weekend':
        return UAE_LABOR_LAW.overtimeRates.weekend;
      case 'holiday':
        return UAE_LABOR_LAW.overtimeRates.holiday;
      case 'night':
        return UAE_LABOR_LAW.overtimeRates.weekend; // Night hours same as weekend rate
      default:
        return UAE_LABOR_LAW.overtimeRates.weekday;
    }
  }

  /**
   * Determine if a day is a weekend in UAE
   */
  static isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return UAE_LABOR_LAW.weekendDays.includes(dayOfWeek);
  }

  /**
   * Check if employee has exceeded maximum overtime hours
   */
  static checkOvertimeCompliance(
    dailyOvertime: number,
    weeklyOvertime: number,
    monthlyOvertime: number
  ): { compliant: boolean; violations: string[] } {
    const violations: string[] = [];
    
    if (dailyOvertime > UAE_LABOR_LAW.maxOvertimeHours) {
      violations.push(
        `Daily overtime (${dailyOvertime}h) exceeds maximum allowed (${UAE_LABOR_LAW.maxOvertimeHours}h)`
      );
    }
    
    if (weeklyOvertime > UAE_LABOR_LAW.maxOvertimeHours * 7) {
      violations.push(
        `Weekly overtime (${weeklyOvertime}h) exceeds maximum allowed (${UAE_LABOR_LAW.maxOvertimeHours * 7}h)`
      );
    }
    
    if (monthlyOvertime > 96) { // 2 hours × 6 working days × 8 weeks = 96 hours per month
      violations.push(
        `Monthly overtime (${monthlyOvertime}h) exceeds recommended maximum (96h)`
      );
    }
    
    return {
      compliant: violations.length === 0,
      violations
    };
  }

  /**
   * Calculate employee benefits according to UAE labor law
   */
  static calculateEmployeeBenefits(
    baseSalary: number,
    serviceYears: number
  ): {
    annualLeave: number;
    endOfService: number;
    gratuity: number;
  } {
    // End of service calculation
    const endOfService = serviceYears >= 1 ? 
      (baseSalary / 30) * UAE_LABOR_LAW.gratuityCalculation * serviceYears : 0;
    
    // Gratuity calculation (minimum 21 days after 1 year)
    const gratuity = serviceYears >= 1 ? 
      (baseSalary / 30) * UAE_LABOR_LAW.gratuityCalculation : 0;
    
    return {
      annualLeave: UAE_LABOR_LAW.annualLeave,
      endOfService: Math.round(endOfService),
      gratuity: Math.round(gratuity)
    };
  }

  /**
   * Validate attendance record against UAE working hours
   */
  static validateAttendance(record: AttendanceRecord): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    if (record.totalHours > 12) {
      warnings.push('Working hours exceed 12 hours (UAE health & safety limit)');
    }
    
    if (record.overtimeHours > UAE_LABOR_LAW.maxOvertimeHours) {
      warnings.push(`Overtime hours (${record.overtimeHours}h) exceed daily maximum (${UAE_LABOR_LAW.maxOvertimeHours}h)`);
    }
    
    if (record.status === 'late' && record.totalHours < UAE_LABOR_LAW.maxWorkingHours) {
      warnings.push('Late arrival with reduced total hours may affect performance');
    }
    
    return {
      valid: warnings.length === 0,
      warnings
    };
  }
}

export const formatCurrency = (amount: number, currency: string = 'AED'): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
};

export const calculateOvertimeFromAttendance = (
  attendance: AttendanceRecord,
  baseHourlyRate: number
): OvertimeRecord | null => {
  if (attendance.overtimeHours <= 0) return null;
  
  const date = new Date(attendance.date);
  const overtimeType = UAEOvertimeCalculator.isWeekend(date) ? 'weekend' : 'weekday';
  const overtimeAmount = UAEOvertimeCalculator.calculateOvertimeAmount(
    baseHourlyRate,
    attendance.overtimeHours,
    overtimeType
  );
  
  return {
    id: `ot_${Date.now()}_${attendance.employeeId}`,
    employeeId: attendance.employeeId,
    employeeName: '', // Will be filled by service
    department: '', // Will be filled by service
    date: attendance.date,
    regularHours: attendance.totalHours - attendance.overtimeHours,
    overtimeHours: attendance.overtimeHours,
    overtimeType,
    hourlyRate: baseHourlyRate,
    overtimeAmount,
    totalAmount: overtimeAmount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};