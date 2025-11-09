import express from 'express';
import { requireCompany } from '../middleware/auth.js';
import { FinancialCalculator } from '../services/financialCalculator.js';

export const reportRoutes = express.Router();

// All routes require company context
reportRoutes.use(requireCompany);

// Generate financial report
reportRoutes.post('/generate/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { 
      reportType, 
      period, 
      format = 'json',
      includeCharts = true,
      sections = [] 
    } = req.body;
    
    if (!reportType || !period) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['reportType', 'period']
      });
    }
    
    let reportData;
    
    switch (reportType) {
      case 'profit-loss':
        reportData = await generateProfitLossReport(companyId, period);
        break;
      case 'balance-sheet':
        reportData = await generateBalanceSheetReport(companyId, period);
        break;
      case 'cash-flow':
        reportData = await generateCashFlowReport(companyId, period);
        break;
      case 'vat-return':
        reportData = await generateVATReturnReport(companyId, period);
        break;
      case 'budget-analysis':
        reportData = await generateBudgetAnalysisReport(companyId, period);
        break;
      case 'comprehensive':
        reportData = await generateComprehensiveReport(companyId, period);
        break;
      default:
        return res.status(400).json({
          error: 'Invalid report type',
          supported: ['profit-loss', 'balance-sheet', 'cash-flow', 'vat-return', 'budget-analysis', 'comprehensive']
        });
    }
    
    const report = {
      companyId,
      reportType,
      period,
      format,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
      data: reportData,
      metadata: {
        includesCharts,
        sections,
        pageCount: calculatePageCount(reportData),
        wordCount: calculateWordCount(reportData)
      }
    };
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
});

// Get available report templates
reportRoutes.get('/templates/:companyId', async (req, res) => {
  try {
    const templates = [
      {
        id: 'profit-loss',
        name: 'Profit & Loss Statement',
        description: 'Comprehensive P&L statement with detailed breakdown',
        frequency: ['Monthly', 'Quarterly', 'Annually'],
        sections: ['Revenue', 'Cost of Goods Sold', 'Operating Expenses', 'Net Profit']
      },
      {
        id: 'balance-sheet',
        name: 'Balance Sheet',
        description: 'Statement of financial position',
        frequency: ['Monthly', 'Quarterly', 'Annually'],
        sections: ['Assets', 'Liabilities', 'Equity']
      },
      {
        id: 'cash-flow',
        name: 'Cash Flow Statement',
        description: 'Cash inflows and outflows analysis',
        frequency: ['Monthly', 'Quarterly', 'Annually'],
        sections: ['Operating Activities', 'Investing Activities', 'Financing Activities']
      },
      {
        id: 'vat-return',
        name: 'VAT Return Report',
        description: 'UAE VAT compliance report',
        frequency: ['Monthly', 'Quarterly'],
        sections: ['VAT Outputs', 'VAT Inputs', 'Net VAT Due', 'Compliance Status']
      },
      {
        id: 'budget-analysis',
        name: 'Budget vs Actual Analysis',
        description: 'Budget performance comparison',
        frequency: ['Monthly', 'Quarterly'],
        sections: ['Budget Overview', 'Variance Analysis', 'Performance Metrics']
      },
      {
        id: 'comprehensive',
        name: 'Comprehensive Financial Report',
        description: 'Complete financial analysis with all key metrics',
        frequency: ['Quarterly', 'Annually'],
        sections: ['Executive Summary', 'P&L', 'Balance Sheet', 'Cash Flow', 'KPIs', 'Recommendations']
      }
    ];
    
    res.json({
      success: true,
      data: templates
    });
    
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch report templates',
      details: error.message
    });
  }
});

// Download report in different formats
reportRoutes.get('/download/:companyId/:reportId', async (req, res) => {
  try {
    const { companyId, reportId } = req.params;
    const { format = 'pdf' } = req.query;
    
    // In a real implementation, you would:
    // 1. Retrieve the report data from database
    // 2. Generate the report in the requested format
    // 3. Return the file for download
    
    // For demo purposes, return mock download info
    const downloadInfo = {
      reportId,
      companyId,
      format,
      downloadUrl: `/api/reports/download/${reportId}.${format}`,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      fileSize: '2.4 MB',
      generatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: downloadInfo
    });
    
  } catch (error) {
    console.error('Report download error:', error);
    res.status(500).json({
      error: 'Failed to prepare report for download',
      details: error.message
    });
  }
});

// Schedule automated report generation
reportRoutes.post('/schedule/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      reportType,
      frequency,
      recipients,
      sections,
      isActive = true
    } = req.body;
    
    const schedule = {
      id: `schedule_${Date.now()}`,
      companyId,
      reportType,
      frequency, // 'daily', 'weekly', 'monthly', 'quarterly'
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      sections: sections || [],
      isActive,
      nextRunDate: calculateNextRunDate(frequency),
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id
    };
    
    res.json({
      success: true,
      data: schedule,
      message: `Report schedule created for ${frequency} ${reportType} reports`
    });
    
  } catch (error) {
    console.error('Schedule creation error:', error);
    res.status(500).json({
      error: 'Failed to create report schedule',
      details: error.message
    });
  }
});

// Get report history
reportRoutes.get('/history/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { reportType, limit = 50 } = req.query;
    
    // Mock report history
    const reportHistory = [
      {
        id: 'report_001',
        reportType: 'profit-loss',
        period: '2024-06',
        generatedAt: '2024-07-01T10:00:00Z',
        generatedBy: 'system',
        format: 'pdf',
        status: 'completed',
        fileSize: '1.8 MB',
        downloadUrl: '/api/reports/download/report_001.pdf'
      },
      {
        id: 'report_002',
        reportType: 'cash-flow',
        period: '2024-06',
        generatedAt: '2024-07-01T10:30:00Z',
        generatedBy: 'system',
        format: 'excel',
        status: 'completed',
        fileSize: '950 KB',
        downloadUrl: '/api/reports/download/report_002.xlsx'
      }
    ];
    
    const filteredHistory = reportType 
      ? reportHistory.filter(r => r.reportType === reportType)
      : reportHistory;
    
    res.json({
      success: true,
      data: filteredHistory.slice(0, parseInt(limit)),
      pagination: {
        total: filteredHistory.length,
        limit: parseInt(limit),
        hasMore: filteredHistory.length > parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Report history error:', error);
    res.status(500).json({
      error: 'Failed to fetch report history',
      details: error.message
    });
  }
});

// Report generation helper functions
async function generateProfitLossReport(companyId, period) {
  return {
    company: {
      name: 'Demo Company LLC',
      period,
      reportDate: new Date().toISOString().split('T')[0]
    },
    revenue: {
      total: 1250000,
      breakdown: [
        { category: 'Product Sales', amount: 1000000, percentage: 80 },
        { category: 'Service Revenue', amount: 250000, percentage: 20 }
      ]
    },
    costOfGoodsSold: {
      total: 450000,
      breakdown: [
        { category: 'Raw Materials', amount: 300000 },
        { category: 'Direct Labor', amount: 150000 }
      ]
    },
    operatingExpenses: {
      total: 400000,
      breakdown: [
        { category: 'Salaries & Wages', amount: 250000 },
        { category: 'Rent & Utilities', amount: 75000 },
        { category: 'Marketing', amount: 50000 },
        { category: 'Other Operating', amount: 25000 }
      ]
    },
    netProfit: 400000,
    margins: {
      gross: ((800000 - 450000) / 800000) * 100,
      operating: (375000 / 1250000) * 100,
      net: (400000 / 1250000) * 100
    },
    kpis: {
      revenueGrowth: 13.64,
      profitGrowth: 33.33,
      averageOrderValue: 1250
    }
  };
}

async function generateBalanceSheetReport(companyId, period) {
  return {
    company: {
      name: 'Demo Company LLC',
      period,
      reportDate: new Date().toISOString().split('T')[0]
    },
    assets: {
      current: {
        cash: 775000,
        accountsReceivable: 320000,
        inventory: 180000,
        prepaidExpenses: 25000,
        total: 1300000
      },
      fixed: {
        property: 500000,
        equipment: 300000,
        vehicles: 150000,
        total: 950000
      },
      total: 2250000
    },
    liabilities: {
      current: {
        accountsPayable: 180000,
        accruedExpenses: 95000,
        shortTermDebt: 100000,
        total: 375000
      },
      longTerm: {
        longTermDebt: 300000,
        total: 300000
      },
      total: 675000
    },
    equity: {
      shareCapital: 500000,
      retainedEarnings: 1075000,
      total: 1575000
    },
    totalLiabilitiesAndEquity: 2250000
  };
}

async function generateCashFlowReport(companyId, period) {
  return {
    company: {
      name: 'Demo Company LLC',
      period,
      reportDate: new Date().toISOString().split('T')[0]
    },
    operatingActivities: {
      netIncome: 400000,
      adjustments: {
        depreciation: 50000,
        changesInWorkingCapital: -75000
      },
      cashFromOperations: 375000
    },
    investingActivities: {
      capitalExpenditures: -75000,
      otherInvesting: 0,
      cashFromInvesting: -75000
    },
    financingActivities: {
      debtRepayment: -25000,
      otherFinancing: 0,
      cashFromFinancing: -25000
    },
    netCashFlow: 275000,
    beginningCash: 500000,
    endingCash: 775000
  };
}

async function generateVATReturnReport(companyId, period) {
  return {
    company: {
      name: 'Demo Company LLC',
      vatNumber: '100123456700003',
      period,
      reportDate: new Date().toISOString().split('T')[0]
    },
    vatOutputs: {
      taxableSupplies: 1200000,
      vatOnOutputs: 60000
    },
    vatInputs: {
      taxablePurchases: 800000,
      vatOnInputs: 40000
    },
    netVATDue: 20000,
    paymentDue: 20000,
    compliance: {
      status: 'Compliant',
      nextReturnDate: '2024-12-15',
      overdueReturns: 0
    }
  };
}

async function generateBudgetAnalysisReport(companyId, period) {
  return {
    company: {
      name: 'Demo Company LLC',
      period,
      reportDate: new Date().toISOString().split('T')[0]
    },
    summary: {
      totalBudget: 2000000,
      totalActual: 2100000,
      variance: -100000,
      variancePercent: -5.0
    },
    revenue: {
      budget: 1200000,
      actual: 1250000,
      variance: 50000,
      variancePercent: 4.17
    },
    expenses: {
      budget: 800000,
      actual: 850000,
      variance: -50000,
      variancePercent: -6.25
    },
    performance: {
      budgetAchievement: 105.0,
      costControlScore: 94.0,
      efficiencyRating: 'Good'
    }
  };
}

async function generateComprehensiveReport(companyId, period) {
  const pnl = await generateProfitLossReport(companyId, period);
  const balanceSheet = await generateBalanceSheetReport(companyId, period);
  const cashFlow = await generateCashFlowReport(companyId, period);
  
  return {
    executiveSummary: {
      financialHealth: 'Strong',
      keyHighlights: [
        'Revenue growth of 13.64% year-over-year',
        'Net profit margin improved to 32%',
        'Positive operating cash flow of AED 375,000',
        'Strong balance sheet with healthy equity position'
      ],
      recommendations: [
        'Continue revenue growth initiatives',
        'Monitor cost control measures',
        'Consider expansion opportunities',
        'Maintain current dividend policy'
      ]
    },
    financialStatements: {
      profitLoss: pnl,
      balanceSheet,
      cashFlow
    },
    keyMetrics: {
      profitability: {
        netMargin: 32.0,
        grossMargin: 43.75,
        operatingMargin: 30.0
      },
      liquidity: {
        currentRatio: 3.47,
        quickRatio: 2.99,
        cashRatio: 2.07
      },
      efficiency: {
        assetTurnover: 0.56,
        inventoryTurnover: 6.94,
        receivablesTurnover: 3.91
      }
    },
    industryBenchmarks: {
      comparedToIndustry: 'Above Average',
      keyInsights: [
        'Profit margins exceed industry average by 5%',
        'Cash flow management is strong',
        'Asset utilization is efficient'
      ]
    }
  };
}

// Helper functions
function calculatePageCount(reportData) {
  // Simple estimation based on content length
  return Math.max(1, Math.ceil(JSON.stringify(reportData).length / 2000));
}

function calculateWordCount(reportData) {
  // Simple estimation based on content length
  return Math.max(100, Math.ceil(JSON.stringify(reportData).length / 5));
}

function calculateNextRunDate(frequency) {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    case 'quarterly':
      return new Date(now.getFullYear(), now.getMonth() + 3, 1);
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}