import express from 'express';
import { requireCompany, requireRole } from '../middleware/auth.js';
import { FinancialCalculator } from '../services/financialCalculator.js';
import { FinancialCalculationError, ValidationError } from '../middleware/errorHandler.js';

export const financialRoutes = express.Router();

// All routes require company context
financialRoutes.use(requireCompany);

// Get financial dashboard summary
financialRoutes.get('/dashboard/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period } = req.query; // 'current', 'previous', 'ytd', 'all'
    
    // In a real implementation, this would query the database
    // For demo purposes, we'll return mock data with calculations
    
    const mockData = {
      revenue: {
        current: 1250000,
        previous: 1100000,
        growth: FinancialCalculator.calculateRevenueGrowth(1250000, 1100000)
      },
      costs: {
        current: 850000,
        previous: 800000,
        growth: FinancialCalculator.calculateRevenueGrowth(850000, 800000)
      },
      profit: {
        current: 400000,
        previous: 300000,
        margin: FinancialCalculator.calculateProfitMargin(1250000, 850000)
      },
      cashFlow: {
        operating: 350000,
        investing: -50000,
        financing: -25000,
        net: 275000
      },
      roi: {
        marketing: FinancialCalculator.calculateROI(50000, 150000),
        operations: FinancialCalculator.calculateROI(200000, 400000),
        overall: FinancialCalculator.calculateROI(500000, 750000)
      },
      kpis: {
        revenueGrowth: FinancialCalculator.formatPercentage(0.1364),
        profitMargin: FinancialCalculator.formatPercentage(0.32),
        roi: FinancialCalculator.formatPercentage(0.50),
        cashFlowHealth: 'Good'
      }
    };
    
    res.json({
      success: true,
      data: mockData,
      period: period || 'current',
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
  }
});

// Get revenue analytics
financialRoutes.get('/revenue/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period, category, startDate, endDate } = req.query;
    
    // Mock revenue data with trend analysis
    const revenueData = [
      { period: '2024-01', amount: 950000, category: 'Sales' },
      { period: '2024-02', amount: 1020000, category: 'Sales' },
      { period: '2024-03', amount: 1150000, category: 'Sales' },
      { period: '2024-04', amount: 1180000, category: 'Sales' },
      { period: '2024-05', amount: 1200000, category: 'Sales' },
      { period: '2024-06', amount: 1250000, category: 'Sales' }
    ];
    
    const trendAnalysis = FinancialCalculator.calculateRevenueTrend(revenueData);
    const growth = FinancialCalculator.calculateRevenueGrowth(
      revenueData[revenueData.length - 1].amount,
      revenueData[revenueData.length - 2].amount
    );
    
    res.json({
      success: true,
      data: {
        revenue: revenueData,
        trendAnalysis,
        currentGrowth: growth,
        totalRevenue: revenueData.reduce((sum, r) => sum + r.amount, 0),
        averageRevenue: revenueData.reduce((sum, r) => sum + r.amount, 0) / revenueData.length,
        projections: {
          nextMonth: 1300000,
          confidence: 85
        }
      },
      filters: { period, category, startDate, endDate }
    });
    
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch revenue analytics',
      details: error.message
    });
  }
});

// Get profit & loss analysis
financialRoutes.get('/profit-loss/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period } = req.query;
    
    // Mock P&L data
    const pnlData = {
      revenue: 1250000,
      costOfGoodsSold: 450000,
      grossProfit: 800000,
      grossMargin: FinancialCalculator.calculateGrossMargin(1250000, 450000),
      operatingExpenses: {
        salaries: 300000,
        rent: 50000,
        utilities: 15000,
        marketing: 35000,
        other: 25000
      },
      totalOperatingExpenses: 425000,
      operatingProfit: 375000,
      operatingMargin: FinancialCalculator.calculateOperatingMargin(1250000, 425000),
      otherIncome: 25000,
      otherExpenses: 0,
      netProfit: 400000,
      netMargin: FinancialCalculator.calculateNetMargin(1250000, 850000)
    };
    
    // Calculate margins
    pnlData.grossMargin = FinancialCalculator.formatPercentage(pnlData.grossMargin);
    pnlData.operatingMargin = FinancialCalculator.formatPercentage(pnlData.operatingMargin);
    pnlData.netMargin = FinancialCalculator.formatPercentage(pnlData.netMargin);
    
    res.json({
      success: true,
      data: pnlData,
      period: period || 'current',
      comparison: {
        previousPeriod: {
          revenue: 1100000,
          netProfit: 300000,
          netMargin: '27.27%'
        },
        growth: {
          revenue: '13.64%',
          netProfit: '33.33%'
        }
      }
    });
    
  } catch (error) {
    console.error('P&L analysis error:', error);
    res.status(500).json({
      error: 'Failed to fetch P&L analysis',
      details: error.message
    });
  }
});

// Get cost analysis
financialRoutes.get('/costs/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period, category, startDate, endDate } = req.query;
    
    // Mock cost data
    const costData = {
      totalCosts: 850000,
      breakdown: [
        { category: 'Cost of Goods Sold', amount: 450000, percentage: 52.94 },
        { category: 'Salaries & Wages', amount: 300000, percentage: 35.29 },
        { category: 'Rent & Utilities', amount: 65000, percentage: 7.65 },
        { category: 'Marketing', amount: 35000, percentage: 4.12 }
      ],
      trend: [
        { period: '2024-01', amount: 780000 },
        { period: '2024-02', amount: 820000 },
        { period: '2024-03', amount: 800000 },
        { period: '2024-04', amount: 840000 },
        { period: '2024-05', amount: 860000 },
        { period: '2024-06', amount: 850000 }
      ],
      costPerUnit: 17.00, // Cost per unit sold
      costEfficiency: {
        ratio: 0.68, // Costs as % of revenue
        trend: 'improving'
      }
    };
    
    res.json({
      success: true,
      data: costData,
      insights: {
        highestCostCategory: 'Cost of Goods Sold',
        costGrowthRate: '2.1%',
        costOptimizationOpportunities: [
          'Negotiate better supplier terms',
          'Optimize inventory management',
          'Review marketing spend efficiency'
        ]
      },
      filters: { period, category, startDate, endDate }
    });
    
  } catch (error) {
    console.error('Cost analysis error:', error);
    res.status(500).json({
      error: 'Failed to fetch cost analysis',
      details: error.message
    });
  }
});

// Get cash flow analysis
financialRoutes.get('/cash-flow/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period } = req.query;
    
    // Mock cash flow data
    const cashFlowData = {
      operating: {
        cashInflows: 1200000,
        cashOutflows: 850000,
        netOperating: 350000
      },
      investing: {
        cashInflows: 25000,
        cashOutflows: 75000,
        netInvesting: -50000
      },
      financing: {
        cashInflows: 0,
        cashOutflows: 25000,
        netFinancing: -25000
      },
      netCashFlow: 275000,
      beginningCash: 500000,
      endingCash: 775000,
      projections: FinancialCalculator.calculateCashFlowProjection([
        { period: '2024-01', cashFlow: 250000 },
        { period: '2024-02', cashFlow: 300000 },
        { period: '2024-03', cashFlow: 275000 },
        { period: '2024-04', cashFlow: 320000 },
        { period: '2024-05', cashFlow: 350000 },
        { period: '2024-06', cashFlow: 275000 }
      ])
    };
    
    res.json({
      success: true,
      data: cashFlowData,
      health: {
        status: 'Healthy',
        daysCashOnHand: 45,
        operatingCashFlowRatio: 1.41
      },
      period: period || 'current'
    });
    
  } catch (error) {
    console.error('Cash flow analysis error:', error);
    res.status(500).json({
      error: 'Failed to fetch cash flow analysis',
      details: error.message
    });
  }
});

// Get ROI analysis
financialRoutes.get('/roi/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { area } = req.query; // marketing, operations, product, it
    
    // Mock ROI data by business area
    const roiData = {
      overall: {
        investment: 500000,
        returns: 750000,
        roi: FinancialCalculator.calculateROI(500000, 750000),
        paybackPeriod: FinancialCalculator.calculatePaybackPeriod(500000, 150000)
      },
      areas: {
        marketing: {
          investment: 50000,
          returns: 150000,
          roi: FinancialCalculator.calculateROI(50000, 150000),
          roas: FinancialCalculator.calculateROAS(50000, 150000)
        },
        operations: {
          investment: 200000,
          returns: 400000,
          roi: FinancialCalculator.calculateROI(200000, 400000),
          paybackPeriod: FinancialCalculator.calculatePaybackPeriod(200000, 80000)
        },
        product: {
          investment: 150000,
          returns: 180000,
          roi: FinancialCalculator.calculateROI(150000, 180000),
          paybackPeriod: FinancialCalculator.calculatePaybackPeriod(150000, 36000)
        },
        it: {
          investment: 100000,
          returns: 20000,
          roi: FinancialCalculator.calculateROI(100000, 20000),
          paybackPeriod: FinancialCalculator.calculatePaybackPeriod(100000, 4000)
        }
      }
    };
    
    // Format percentages
    Object.keys(roiData.areas).forEach(area => {
      roiData.areas[area].roi = FinancialCalculator.formatPercentage(roiData.areas[area].roi);
    });
    roiData.overall.roi = FinancialCalculator.formatPercentage(roiData.overall.roi);
    
    res.json({
      success: true,
      data: roiData,
      benchmarks: {
        industry: 'Above Average',
        targetROI: '15%',
        achievedROI: roiData.overall.roi
      },
      recommendations: [
        'Continue investing in marketing - highest ROI',
        'Review IT investment strategy - low returns',
        'Expand operations investment - strong returns'
      ]
    });
    
  } catch (error) {
    console.error('ROI analysis error:', error);
    res.status(500).json({
      error: 'Failed to fetch ROI analysis',
      details: error.message
    });
  }
});

// Get budget vs actual performance
financialRoutes.get('/budget-vs-actual/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period } = req.query;
    
    // Mock budget vs actual data
    const budgetData = {
      budget: {
        revenue: 1200000,
        costs: 800000,
        profit: 400000
      },
      actual: {
        revenue: 1250000,
        costs: 850000,
        profit: 400000
      },
      variances: {
        revenue: FinancialCalculator.calculateBudgetVariance(1200000, 1250000),
        costs: FinancialCalculator.calculateBudgetVariance(800000, 850000),
        profit: FinancialCalculator.calculateBudgetVariance(400000, 400000)
      }
    };
    
    res.json({
      success: true,
      data: budgetData,
      performance: {
        revenueAchievement: '104.17%',
        costControl: '106.25%',
        profitTarget: '100%'
      },
      alerts: [
        {
          type: 'COST_OVERRUN',
          severity: 'MEDIUM',
          message: 'Costs exceeded budget by 6.25%'
        }
      ],
      period: period || 'current'
    });
    
  } catch (error) {
    console.error('Budget vs actual error:', error);
    res.status(500).json({
      error: 'Failed to fetch budget vs actual data',
      details: error.message
    });
  }
});

// Get UAE VAT compliance report
financialRoutes.get('/vat-compliance/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period } = req.query;
    
    // Mock VAT compliance data
    const vatData = {
      registration: {
        isRegistered: true,
        vatNumber: '100123456700003',
        registrationDate: '2023-01-01',
        nextReturnDate: '2024-12-15',
        frequency: 'Monthly'
      },
      currentPeriod: {
        outputs: {
          taxableSupplies: 1200000,
          vatOutput: 60000,
          totalOutputs: 1260000
        },
        inputs: {
          taxablePurchases: 800000,
          vatInput: 40000,
          totalInputs: 840000
        },
        return: {
          netVAT: 20000,
          paymentDue: 20000,
          refundDue: 0
        }
      },
      ytd: {
        totalOutputs: 7200000,
        totalInputs: 4800000,
        netVAT: 120000
      },
      compliance: {
        status: 'Compliant',
        overdueReturns: 0,
        nextAction: 'Submit VAT return by December 15, 2024'
      }
    };
    
    res.json({
      success: true,
      data: vatData,
      alerts: [
        {
          type: 'VAT_REMINDER',
          severity: 'LOW',
          message: 'VAT return due in 5 days'
        }
      ],
      period: period || 'current'
    });
    
  } catch (error) {
    console.error('VAT compliance error:', error);
    res.status(500).json({
      error: 'Failed to fetch VAT compliance data',
      details: error.message
    });
  }
});