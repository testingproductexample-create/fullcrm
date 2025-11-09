import { FinancialCalculationError } from '../middleware/errorHandler.js';

// Financial calculation utilities
export class FinancialCalculator {
  
  // Revenue calculations
  static calculateRevenueGrowth(currentRevenue, previousRevenue) {
    if (!currentRevenue || !previousRevenue) {
      throw new FinancialCalculationError('Invalid revenue values for growth calculation', {
        currentRevenue,
        previousRevenue
      });
    }
    
    if (previousRevenue === 0) return 0;
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  }

  static calculateRevenueTrend(revenueData) {
    if (!revenueData || revenueData.length < 2) {
      throw new FinancialCalculationError('Insufficient data for revenue trend analysis', {
        dataPoints: revenueData?.length || 0
      });
    }

    // Calculate period-over-period growth
    const trends = [];
    for (let i = 1; i < revenueData.length; i++) {
      const growth = this.calculateRevenueGrowth(
        revenueData[i].amount,
        revenueData[i - 1].amount
      );
      trends.push({
        period: revenueData[i].period,
        amount: revenueData[i].amount,
        growth: growth,
        isPositive: growth > 0
      });
    }

    // Calculate average growth rate
    const avgGrowth = trends.reduce((sum, trend) => sum + trend.growth, 0) / trends.length;
    
    return {
      trends,
      averageGrowth: avgGrowth,
      trendDirection: avgGrowth > 0 ? 'increasing' : 'decreasing',
      volatility: this.calculateStandardDeviation(trends.map(t => t.growth))
    };
  }

  // Profit and loss calculations
  static calculateProfitMargin(revenue, costs) {
    if (revenue === 0) return 0;
    const profit = revenue - costs;
    return (profit / revenue) * 100;
  }

  static calculateGrossMargin(revenue, costOfGoodsSold) {
    if (revenue === 0) return 0;
    return ((revenue - costOfGoodsSold) / revenue) * 100;
  }

  static calculateOperatingMargin(revenue, operatingCosts) {
    if (revenue === 0) return 0;
    return ((revenue - operatingCosts) / revenue) * 100;
  }

  static calculateNetMargin(revenue, totalCosts) {
    if (revenue === 0) return 0;
    return ((revenue - totalCosts) / revenue) * 100;
  }

  // ROI calculations
  static calculateROI(investment, returns) {
    if (investment === 0) return 0;
    return ((returns - investment) / investment) * 100;
  }

  static calculateROAS(adSpend, revenue) {
    if (adSpend === 0) return 0;
    return revenue / adSpend;
  }

  static calculatePaybackPeriod(initialInvestment, annualCashFlow) {
    if (annualCashFlow === 0) return Infinity;
    return Math.abs(initialInvestment / annualCashFlow);
  }

  // Cash flow analysis
  static calculateCashFlow(revenues, expenses) {
    return {
      operatingCashFlow: revenues.operating - expenses.operating,
      investingCashFlow: revenues.investing - expenses.investing,
      financingCashFlow: revenues.financing - expenses.financing,
      netCashFlow: (revenues.operating + revenues.investing + revenues.financing) - 
                   (expenses.operating + expenses.investing + expenses.financing)
    };
  }

  static calculateCashFlowProjection(historicalData, periods = 12) {
    if (!historicalData || historicalData.length < 3) {
      throw new FinancialCalculationError('Insufficient historical data for cash flow projection', {
        dataPoints: historicalData?.length || 0
      });
    }

    // Simple linear regression for projection
    const avgCashFlow = historicalData.reduce((sum, item) => sum + item.cashFlow, 0) / historicalData.length;
    const trend = this.calculateLinearTrend(historicalData.map((item, index) => [index, item.cashFlow]));
    
    const projections = [];
    for (let i = 1; i <= periods; i++) {
      const projectedValue = avgCashFlow + (trend.slope * i);
      projections.push({
        period: i,
        projectedCashFlow: Math.max(0, projectedValue), // Cash flow can't be negative in projection
        confidence: Math.max(0.1, 1 - (i * 0.1)) // Decreasing confidence over time
      });
    }

    return {
      projections,
      averageProjectedCashFlow: projections.reduce((sum, p) => sum + p.projectedCashFlow, 0) / periods,
      trendDirection: trend.slope > 0 ? 'positive' : 'negative'
    };
  }

  // Budget vs Actual analysis
  static calculateBudgetVariance(budgeted, actual) {
    if (budgeted === 0) return { variance: 0, variancePercent: 0 };
    const variance = actual - budgeted;
    const variancePercent = (variance / budgeted) * 100;
    
    return {
      variance,
      variancePercent,
      isOverBudget: variance > 0,
      severity: Math.abs(variancePercent) > 20 ? 'high' : Math.abs(variancePercent) > 10 ? 'medium' : 'low'
    };
  }

  // UAE VAT calculations
  static calculateVAT(amount, vatRate = 0.05) {
    return {
      netAmount: amount,
      vatAmount: amount * vatRate,
      grossAmount: amount * (1 + vatRate),
      vatRate
    };
  }

  static calculateVATReturn(vatOutputs, vatInputs, vatRate = 0.05) {
    const totalVATOutputs = vatOutputs.reduce((sum, item) => sum + (item.amount * vatRate), 0);
    const totalVATInputs = vatInputs.reduce((sum, item) => sum + (item.amount * vatRate), 0);
    const netVAT = totalVATOutputs - totalVATInputs;
    
    return {
      totalVATOutputs,
      totalVATInputs,
      netVAT,
      isPaymentDue: netVAT > 0,
      paymentDue: Math.max(0, netVAT),
      refundDue: Math.max(0, -netVAT)
    };
  }

  // Industry benchmarking
  static calculateBenchmarkScore(actualValue, benchmarkValue) {
    if (benchmarkValue === 0) return 0;
    return (actualValue / benchmarkValue) * 100;
  }

  // Statistical utilities
  static calculateStandardDeviation(values) {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  static calculateLinearTrend(dataPoints) {
    // dataPoints: [[x, y], [x, y], ...]
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, [x]) => sum + x, 0);
    const sumY = dataPoints.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = dataPoints.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumXX = dataPoints.reduce((sum, [x]) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  static calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Utility functions
  static formatCurrency(amount, currency = 'AED') {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  static formatPercentage(value) {
    return new Intl.NumberFormat('en-AE', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  }

  static isValidFinancialData(data) {
    return data && 
           typeof data === 'object' && 
           !isNaN(data.amount) && 
           data.amount >= 0;
  }
}