import { FinancialCalculator } from './financialCalculator.js';

export class AlertService {
  
  // Check for budget overruns
  static checkBudgetOverruns(budgetData, actualData, thresholds = { warning: 10, critical: 20 }) {
    const alerts = [];
    
    for (const budget of budgetData) {
      const actual = actualData.find(a => a.category === budget.category);
      if (!actual) continue;
      
      const variance = FinancialCalculator.calculateBudgetVariance(budget.amount, actual.amount);
      
      if (variance.isOverBudget) {
        const severity = Math.abs(variance.variancePercent) >= thresholds.critical ? 'CRITICAL' :
                        Math.abs(variance.variancePercent) >= thresholds.warning ? 'HIGH' : 'MEDIUM';
        
        alerts.push({
          type: 'BUDGET_OVERRUN',
          severity,
          category: budget.category,
          budgetedAmount: budget.amount,
          actualAmount: actual.amount,
          overrun: variance.variance,
          overrunPercent: variance.variancePercent,
          title: `Budget Overrun in ${budget.category}`,
          message: `${budget.category} budget has been exceeded by ${FinancialCalculator.formatPercentage(variance.variancePercent)} (${FinancialCalculator.formatCurrency(variance.variance)})`
        });
      }
    }
    
    return alerts;
  }

  // Check for revenue drops
  static checkRevenueDrops(revenueData, threshold = -10) {
    const alerts = [];
    
    if (revenueData.length < 2) return alerts;
    
    // Check month-over-month drops
    for (let i = 1; i < revenueData.length; i++) {
      const current = revenueData[i];
      const previous = revenueData[i - 1];
      
      const growth = FinancialCalculator.calculateRevenueGrowth(current.amount, previous.amount);
      
      if (growth <= threshold) {
        alerts.push({
          type: 'REVENUE_DROP',
          severity: growth <= -25 ? 'CRITICAL' : 'HIGH',
          period: current.period,
          previousPeriod: previous.period,
          currentAmount: current.amount,
          previousAmount: previous.amount,
          dropPercent: Math.abs(growth),
          title: `Revenue Drop Detected`,
          message: `Revenue decreased by ${FinancialCalculator.formatPercentage(Math.abs(growth))} from ${previous.period} to ${current.period}`
        });
      }
    }
    
    return alerts;
  }

  // Check for cost increases
  static checkCostIncreases(costData, threshold = 15) {
    const alerts = [];
    
    if (costData.length < 2) return alerts;
    
    // Group by category and check trends
    const categoryGroups = {};
    costData.forEach(cost => {
      if (!categoryGroups[cost.category]) {
        categoryGroups[cost.category] = [];
      }
      categoryGroups[cost.category].push(cost);
    });
    
    Object.keys(categoryGroups).forEach(category => {
      const categoryData = categoryGroups[category];
      if (categoryData.length < 2) return;
      
      // Check latest vs previous period
      const latest = categoryData[categoryData.length - 1];
      const previous = categoryData[categoryData.length - 2];
      
      const growth = FinancialCalculator.calculateRevenueGrowth(latest.amount, previous.amount);
      
      if (growth >= threshold) {
        alerts.push({
          type: 'COST_INCREASE',
          severity: growth >= 40 ? 'CRITICAL' : 'HIGH',
          category,
          period: latest.period,
          currentAmount: latest.amount,
          previousAmount: previous.amount,
          increasePercent: growth,
          title: `Significant Cost Increase in ${category}`,
          message: `${category} costs increased by ${FinancialCalculator.formatPercentage(growth)} in ${latest.period}`
        });
      }
    });
    
    return alerts;
  }

  // Check cash flow issues
  static checkCashFlowIssues(cashFlowData, minCashFlow = 0) {
    const alerts = [];
    
    if (cashFlowData.length === 0) return alerts;
    
    // Check for negative cash flow
    const latestCashFlow = cashFlowData[cashFlowData.length - 1];
    if (latestCashFlow.netCashFlow < minCashFlow) {
      alerts.push({
        type: 'CASH_FLOW_ISSUE',
        severity: latestCashFlow.netCashFlow < -10000 ? 'CRITICAL' : 'HIGH',
        period: latestCashFlow.period,
        cashFlow: latestCashFlow.netCashFlow,
        operatingCashFlow: latestCashFlow.operatingCashFlow,
        title: 'Negative Cash Flow Detected',
        message: `Net cash flow of ${FinancialCalculator.formatCurrency(latestCashFlow.netCashFlow)} in ${latestCashFlow.period}`
      });
    }
    
    // Check for declining cash flow trend
    if (cashFlowData.length >= 3) {
      const recentPeriods = cashFlowData.slice(-3);
      const isDeclining = recentPeriods.every((period, index) => 
        index === 0 || period.netCashFlow < recentPeriods[index - 1].netCashFlow
      );
      
      if (isDeclining) {
        alerts.push({
          type: 'CASH_FLOW_ISSUE',
          severity: 'MEDIUM',
          title: 'Declining Cash Flow Trend',
          message: 'Cash flow has been declining for 3 consecutive periods',
          trend: 'declining'
        });
      }
    }
    
    return alerts;
  }

  // Check profit margin deterioration
  static checkProfitMarginDeterioration(profitData, threshold = -5) {
    const alerts = [];
    
    if (profitData.length < 2) return alerts;
    
    for (let i = 1; i < profitData.length; i++) {
      const current = profitData[i];
      const previous = profitData[i - 1];
      
      const marginChange = current.margin - previous.margin;
      
      if (marginChange <= threshold) {
        alerts.push({
          type: 'PROFIT_MARGIN_DETERIORATION',
          severity: marginChange <= -15 ? 'CRITICAL' : 'HIGH',
          period: current.period,
          currentMargin: current.margin,
          previousMargin: previous.margin,
          marginChange,
          title: 'Profit Margin Deterioration',
          message: `Profit margin decreased by ${FinancialCalculator.formatPercentage(Math.abs(marginChange))} to ${FinancialCalculator.formatPercentage(current.margin)}`
        });
      }
    }
    
    return alerts;
  }

  // Check for unusual transactions (anomaly detection)
  static checkUnusualTransactions(transactions, thresholds = {
    amount: 2, // Standard deviations
    frequency: 3 // Outliers
  }) {
    const alerts = [];
    
    if (transactions.length < 10) return alerts;
    
    // Analyze amounts
    const amounts = transactions.map(t => t.amount);
    const meanAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const stdDev = FinancialCalculator.calculateStandardDeviation(amounts);
    
    // Find outliers
    const outliers = transactions.filter(t => 
      Math.abs(t.amount - meanAmount) > thresholds.amount * stdDev
    );
    
    if (outliers.length > 0) {
      alerts.push({
        type: 'UNUSUAL_TRANSACTION',
        severity: 'MEDIUM',
        outlierCount: outliers.length,
        meanAmount,
        threshold: thresholds.amount * stdDev,
        title: 'Unusual Transactions Detected',
        message: `${outliers.length} transactions with unusual amounts detected (${thresholds.amount} standard deviations from mean)`,
        outliers: outliers.slice(0, 5) // Include first 5 outliers in alert
      });
    }
    
    return alerts;
  }

  // Check for VAT compliance issues
  static checkVATCompliance(vatData, registrationData) {
    const alerts = [];
    
    // Check for unregistered transactions
    if (!registrationData.isRegistered && vatData.chargeableAmount > 0) {
      alerts.push({
        type: 'VAT_COMPLIANCE',
        severity: 'CRITICAL',
        title: 'VAT Registration Required',
        message: `Business must register for VAT as chargeable supplies exceed AED 375,000 annually`,
        chargeableAmount: vatData.chargeableAmount
      });
    }
    
    // Check for overdue VAT return
    if (registrationData.nextDueDate && new Date() > registrationData.nextDueDate) {
      alerts.push({
        type: 'VAT_COMPLIANCE',
        severity: 'HIGH',
        title: 'Overdue VAT Return',
        message: `VAT return was due on ${registrationData.nextDueDate.toDateString()}`,
        overdueBy: Math.ceil((new Date() - registrationData.nextDueDate) / (1000 * 60 * 60 * 24))
      });
    }
    
    return alerts;
  }

  // Generate comprehensive alert summary
  static generateAlertSummary(companyId, allAlertData) {
    const allAlerts = [
      ...this.checkBudgetOverruns(allAlertData.budgets || [], allAlertData.actual || []),
      ...this.checkRevenueDrops(allAlertData.revenue || []),
      ...this.checkCostIncreases(allAlertData.costs || []),
      ...this.checkCashFlowIssues(allAlertData.cashFlow || []),
      ...this.checkProfitMarginDeterioration(allAlertData.profit || []),
      ...this.checkUnusualTransactions(allAlertData.transactions || []),
      ...this.checkVATCompliance(allAlertData.vat || {}, allAlertData.vatRegistration || {})
    ];
    
    // Categorize alerts by severity
    const categorizedAlerts = {
      CRITICAL: allAlerts.filter(a => a.severity === 'CRITICAL'),
      HIGH: allAlerts.filter(a => a.severity === 'HIGH'),
      MEDIUM: allAlerts.filter(a => a.severity === 'MEDIUM'),
      LOW: allAlerts.filter(a => a.severity === 'LOW')
    };
    
    return {
      companyId,
      totalAlerts: allAlerts.length,
      alertsBySeverity: {
        critical: categorizedAlerts.CRITICAL.length,
        high: categorizedAlerts.HIGH.length,
        medium: categorizedAlerts.MEDIUM.length,
        low: categorizedAlerts.LOW.length
      },
      alerts: allAlerts,
      summary: {
        hasCriticalAlerts: categorizedAlerts.CRITICAL.length > 0,
        mostUrgentAlert: allAlerts.find(a => a.severity === 'CRITICAL') || allAlerts[0] || null,
        alertTrend: this.calculateAlertTrend(allAlerts)
      },
      generatedAt: new Date().toISOString()
    };
  }

  static calculateAlertTrend(alerts) {
    // Simple implementation - in real scenario, compare with previous periods
    if (alerts.length === 0) return 'stable';
    if (alerts.length > 10) return 'increasing';
    if (alerts.length > 5) return 'moderate';
    return 'low';
  }
}