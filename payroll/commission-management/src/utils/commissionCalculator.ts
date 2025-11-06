// Commission Calculation Engine for UAE Payroll System
export interface CommissionCalculation {
  baseAmount: number;
  baseRate: number;
  baseCommission: number;
  tierBonus?: number;
  performanceBonus?: number;
  totalCommission: number;
  calculationDetails: {
    salesAmount: number;
    commissionRate: number;
    tierApplicable?: {
      min: number;
      max: number;
      rate: number;
    };
    bonusThreshold?: number;
    bonusRate?: number;
  };
}

export class CommissionCalculator {
  /**
   * Calculate commission based on percentage structure
   */
  static calculatePercentageCommission(
    salesAmount: number,
    commissionRate: number,
    bonusThreshold?: number,
    bonusRate?: number
  ): CommissionCalculation {
    const baseCommission = (salesAmount * commissionRate) / 100;
    let performanceBonus = 0;

    // Calculate performance bonus if threshold is met
    if (bonusThreshold && bonusRate && salesAmount > bonusThreshold) {
      performanceBonus = ((salesAmount - bonusThreshold) * bonusRate) / 100;
    }

    const totalCommission = baseCommission + performanceBonus;

    return {
      baseAmount: salesAmount,
      baseRate: commissionRate,
      baseCommission,
      performanceBonus,
      totalCommission,
      calculationDetails: {
        salesAmount,
        commissionRate,
        bonusThreshold,
        bonusRate
      }
    };
  }

  /**
   * Calculate commission based on tiered structure
   */
  static calculateTieredCommission(
    salesAmount: number,
    tierRates: { min: number; max: number; rate: number }[],
    baseRate: number = 0
  ): CommissionCalculation {
    let totalCommission = 0;
    let tierBonus = 0;
    let applicableTier: { min: number; max: number; rate: number } | undefined;

    // Apply base rate to entire amount first
    if (baseRate > 0) {
      totalCommission = (salesAmount * baseRate) / 100;
    }

    // Find applicable tier and calculate bonus
    for (const tier of tierRates) {
      if (salesAmount >= tier.min) {
        applicableTier = tier;
        const tierAmount = Math.min(salesAmount, tier.max) - tier.min;
        if (tierAmount > 0) {
          tierBonus = (tierAmount * tier.rate) / 100;
          totalCommission += tierBonus;
        }
      }
    }

    return {
      baseAmount: salesAmount,
      baseRate: baseRate,
      baseCommission: (salesAmount * baseRate) / 100,
      tierBonus,
      totalCommission,
      calculationDetails: {
        salesAmount,
        commissionRate: baseRate,
        tierApplicable: applicableTier
      }
    };
  }

  /**
   * Calculate fixed amount commission
   */
  static calculateFixedCommission(
    salesAmount: number,
    fixedAmount: number
  ): CommissionCalculation {
    return {
      baseAmount: salesAmount,
      baseRate: 0,
      baseCommission: fixedAmount,
      totalCommission: fixedAmount,
      calculationDetails: {
        salesAmount,
        commissionRate: 0
      }
    };
  }

  /**
   * Calculate monthly commission summary for an employee
   */
  static calculateMonthlyCommission(
    sales: Array<{
      amount: number;
      date: string;
      commissionRate: number;
      bonusThreshold?: number;
      bonusRate?: number;
      tierRates?: { min: number; max: number; rate: number }[];
    }>
  ): {
    totalSales: number;
    totalCommission: number;
    averageRate: number;
    salesCount: number;
    calculations: CommissionCalculation[];
  } {
    const calculations: CommissionCalculation[] = [];
    let totalSales = 0;
    let totalCommission = 0;

    for (const sale of sales) {
      let calculation: CommissionCalculation;

      if (sale.tierRates && sale.tierRates.length > 0) {
        calculation = this.calculateTieredCommission(
          sale.amount,
          sale.tierRates,
          0 // Base rate handled in tiers
        );
      } else {
        calculation = this.calculatePercentageCommission(
          sale.amount,
          sale.commissionRate,
          sale.bonusThreshold,
          sale.bonusRate
        );
      }

      calculations.push(calculation);
      totalSales += sale.amount;
      totalCommission += calculation.totalCommission;
    }

    const averageRate = totalSales > 0 ? (totalCommission / totalSales) * 100 : 0;

    return {
      totalSales,
      totalCommission,
      averageRate,
      salesCount: sales.length,
      calculations
    };
  }

  /**
   * Calculate performance metrics
   */
  static calculatePerformanceMetrics(
    actualSales: number,
    targetSales: number,
    commissionRate: number,
    baseSalary: number
  ): {
    achievementRate: number;
    expectedCommission: number;
    totalCompensation: number;
    performanceRating: 'Excellent' | 'Good' | 'Average' | 'Below Average';
  } {
    const achievementRate = (actualSales / targetSales) * 100;
    const expectedCommission = (actualSales * commissionRate) / 100;
    const totalCompensation = baseSalary + expectedCommission;

    let performanceRating: 'Excellent' | 'Good' | 'Average' | 'Below Average';
    if (achievementRate >= 120) {
      performanceRating = 'Excellent';
    } else if (achievementRate >= 100) {
      performanceRating = 'Good';
    } else if (achievementRate >= 80) {
      performanceRating = 'Average';
    } else {
      performanceRating = 'Below Average';
    }

    return {
      achievementRate,
      expectedCommission,
      totalCompensation,
      performanceRating
    };
  }

  /**
   * Generate commission report for a period
   */
  static generateCommissionReport(
    employees: Array<{
      id: string;
      name: string;
      sales: Array<{
        amount: number;
        date: string;
        commissionRate: number;
        bonusThreshold?: number;
        bonusRate?: number;
        tierRates?: { min: number; max: number; rate: number }[];
      }>;
      baseSalary: number;
      targetSales: number;
    }>
  ): {
    period: string;
    totalSales: number;
    totalCommissions: number;
    employeeReports: Array<{
      employeeId: string;
      employeeName: string;
      totalSales: number;
      totalCommission: number;
      achievementRate: number;
      performanceRating: string;
      salesCount: number;
    }>;
  } {
    const employeeReports = employees.map(employee => {
      const monthlyCommission = this.calculateMonthlyCommission(employee.sales);
      const performance = this.calculatePerformanceMetrics(
        monthlyCommission.totalSales,
        employee.targetSales,
        employee.sales[0]?.commissionRate || 0,
        employee.baseSalary
      );

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalSales: monthlyCommission.totalSales,
        totalCommission: monthlyCommission.totalCommission,
        achievementRate: performance.achievementRate,
        performanceRating: performance.performanceRating,
        salesCount: monthlyCommission.salesCount
      };
    });

    const totalSales = employeeReports.reduce((sum, report) => sum + report.totalSales, 0);
    const totalCommissions = employeeReports.reduce((sum, report) => sum + report.totalCommission, 0);

    return {
      period: new Date().toISOString().substring(0, 7), // YYYY-MM format
      totalSales,
      totalCommissions,
      employeeReports
    };
  }

  /**
   * Export commission data to various formats
   */
  static exportCommissionData(
    data: any[],
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): string {
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'xlsx':
        // Would implement Excel export here
        return JSON.stringify(data, null, 2);
      default:
        return this.convertToCSV(data);
    }
  }

  private static convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}

// Example usage and testing
export const commissionExamples = {
  // Example 1: Basic percentage commission
  basicExample: CommissionCalculator.calculatePercentageCommission(
    50000, // Sales amount
    5,     // 5% commission rate
    100000, // Bonus threshold
    2      // 2% bonus rate
  ),

  // Example 2: Tiered commission
  tieredExample: CommissionCalculator.calculateTieredCommission(
    150000, // Sales amount
    [
      { min: 0, max: 50000, rate: 3 },
      { min: 50000, max: 100000, rate: 5 },
      { min: 100000, max: Infinity, rate: 7 }
    ],
    0 // No base rate
  ),

  // Example 3: Performance calculation
  performanceExample: CommissionCalculator.calculatePerformanceMetrics(
    120000, // Actual sales
    100000, // Target sales
    5,      // Commission rate
    15000   // Base salary
  )
};