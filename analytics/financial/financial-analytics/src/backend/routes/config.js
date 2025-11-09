import express from 'express';
import { requireCompany } from '../middleware/auth.js';
import { FinancialCalculator } from '../services/financialCalculator.js';

export const configRoutes = express.Router();

// All routes require company context
configRoutes.use(requireCompany);

// Get company financial configuration
configRoutes.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Mock company configuration
    const config = {
      companyId,
      basic: {
        name: 'Demo Company LLC',
        tradingName: 'Demo Company',
        registrationNumber: 'CN-123456',
        taxId: 'TAX001',
        vatNumber: '100123456700003',
        country: 'UAE',
        currency: 'AED',
        fiscalYearStart: '2024-01-01',
        industryCode: '6201' // Computer Programming
      },
      financial: {
        primaryCurrency: 'AED',
        supportedCurrencies: ['AED', 'USD', 'EUR', 'GBP'],
        exchangeRateProvider: 'fixed',
        defaultVatRate: 0.05,
        roundingPrecision: 2,
        accountingMethod: 'accrual'
      },
      reporting: {
        defaultPeriod: 'MONTHLY',
        supportedPeriods: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
        reportFormats: ['PDF', 'EXCEL', 'JSON', 'CSV'],
        defaultFormat: 'PDF',
        includeCharts: true,
        autoGenerate: false
      },
      forecasting: {
        defaultMethod: 'linear_regression',
        supportedMethods: ['linear_regression', 'exponential_smoothing', 'moving_average', 'seasonal_revenue', 'monte_carlo'],
        defaultHorizon: 12, // months
        confidenceLevel: 95,
        updateFrequency: 'daily'
      },
      alerts: {
        enabled: true,
        channels: ['email', 'push', 'sms'],
        defaultSeverity: 'MEDIUM',
        quietHours: {
          start: '22:00',
          end: '08:00'
        },
        escalationEnabled: true
      },
      integration: {
        accountingSoftware: null, // 'quickbooks', 'xero', 'sap', etc.
        bankIntegration: false,
        taxAuthorityIntegration: true,
        apiRateLimit: 1000 // requests per hour
      },
      security: {
        twoFactorAuth: true,
        sessionTimeout: 480, // minutes
        dataRetention: 2555, // days (7 years)
        auditLogging: true
      },
      lastUpdated: new Date().toISOString(),
      updatedBy: req.user?.id
    };
    
    res.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('Get company config error:', error);
    res.status(500).json({
      error: 'Failed to fetch company configuration',
      details: error.message
    });
  }
});

// Update company financial configuration
configRoutes.put('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const updates = req.body;
    
    // In a real implementation, validate and save to database
    const updatedConfig = {
      companyId,
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedBy: req.user?.id
    };
    
    // Validate configuration
    if (updates.financial?.primaryCurrency && !['AED', 'USD', 'EUR', 'GBP'].includes(updates.financial.primaryCurrency)) {
      return res.status(400).json({
        error: 'Invalid primary currency',
        supported: ['AED', 'USD', 'EUR', 'GBP']
      });
    }
    
    if (updates.financial?.defaultVatRate && (updates.financial.defaultVatRate < 0 || updates.financial.defaultVatRate > 1)) {
      return res.status(400).json({
        error: 'Invalid VAT rate',
        message: 'VAT rate must be between 0 and 1 (0% to 100%)'
      });
    }
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'Configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Update company config error:', error);
    res.status(500).json({
      error: 'Failed to update company configuration',
      details: error.message
    });
  }
});

// Get exchange rates
configRoutes.get('/exchange-rates/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { baseCurrency = 'AED', targetCurrencies = 'USD,EUR,GBP' } = req.query;
    
    const targets = targetCurrencies.split(',');
    
    // Mock exchange rates (in real implementation, fetch from external API)
    const exchangeRates = {
      baseCurrency,
      date: new Date().toISOString().split('T')[0],
      rates: {
        'AED': 1.0000,
        'USD': 0.2723, // 1 AED = 0.2723 USD
        'EUR': 0.2500, // 1 AED = 0.25 EUR
        'GBP': 0.2145  // 1 AED = 0.2145 GBP
      }
    };
    
    // Filter to requested currencies
    const requestedRates = {};
    targets.forEach(currency => {
      if (exchangeRates.rates[currency]) {
        requestedRates[currency] = exchangeRates.rates[currency];
      }
    });
    
    res.json({
      success: true,
      data: {
        ...exchangeRates,
        rates: requestedRates
      },
      provider: 'ECB' // European Central Bank
    });
    
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({
      error: 'Failed to fetch exchange rates',
      details: error.message
    });
  }
});

// Update exchange rates
configRoutes.post('/exchange-rates/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { rates } = req.body; // { 'USD': 0.2723, 'EUR': 0.25, ... }
    
    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({
        error: 'Invalid exchange rates',
        message: 'Exchange rates must be provided as an object'
      });
    }
    
    // Validate rates
    Object.keys(rates).forEach(currency => {
      if (typeof rates[currency] !== 'number' || rates[currency] <= 0) {
        return res.status(400).json({
          error: 'Invalid exchange rate',
          currency,
          message: `Exchange rate for ${currency} must be a positive number`
        });
      }
    });
    
    // In a real implementation, save to database and update historical records
    const updatedRates = {
      companyId,
      baseCurrency: 'AED',
      rates: {
        'AED': 1.0000,
        ...rates
      },
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id,
      source: 'manual'
    };
    
    res.json({
      success: true,
      data: updatedRates,
      message: 'Exchange rates updated successfully'
    });
    
  } catch (error) {
    console.error('Update exchange rates error:', error);
    res.status(500).json({
      error: 'Failed to update exchange rates',
      details: error.message
    });
  }
});

// Get industry benchmarks
configRoutes.get('/benchmarks/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { industry = 'technology', year = 2024 } = req.query;
    
    // Mock industry benchmarks
    const benchmarks = {
      industry: 'Technology Services',
      industryCode: '6201',
      year: parseInt(year),
      currency: 'USD',
      metrics: {
        revenueGrowth: {
          value: 12.5,
          unit: 'percentage',
          benchmarkType: 'AVERAGE',
          ranking: 'Above Average'
        },
        profitMargin: {
          value: 15.8,
          unit: 'percentage',
          benchmarkType: 'MEDIAN',
          ranking: 'Above Average'
        },
        roi: {
          value: 18.2,
          unit: 'percentage',
          benchmarkType: 'AVERAGE',
          ranking: 'Above Average'
        },
        currentRatio: {
          value: 2.1,
          unit: 'ratio',
          benchmarkType: 'MEDIAN',
          ranking: 'Good'
        },
        debtToEquity: {
          value: 0.3,
          unit: 'ratio',
          benchmarkType: 'AVERAGE',
          ranking: 'Excellent'
        },
        assetTurnover: {
          value: 1.2,
          unit: 'ratio',
          benchmarkType: 'MEDIAN',
          ranking: 'Average'
        }
      },
      dataSource: 'Industry Financial Database 2024',
      lastUpdated: '2024-06-01T00:00:00Z'
    };
    
    // Calculate company comparison scores
    const companyScores = {
      revenueGrowth: 13.64, // From previous calculations
      profitMargin: 32.0,
      roi: 50.0,
      currentRatio: 3.47,
      debtToEquity: 0.43,
      assetTurnover: 0.56
    };
    
    // Calculate how company performs vs benchmarks
    const comparisons = {};
    Object.keys(benchmarks.metrics).forEach(metric => {
      const benchmark = benchmarks.metrics[metric];
      const companyValue = companyScores[metric];
      
      if (companyValue !== undefined) {
        const performanceRatio = benchmark.unit === 'percentage' ? 
          (companyValue / benchmark.value) : 
          ((companyValue / benchmark.value) * 100);
        
        comparisons[metric] = {
          companyValue,
          benchmarkValue: benchmark.value,
          performance: performanceRatio * 100,
          status: performanceRatio > 110 ? 'Excellent' : 
                 performanceRatio > 90 ? 'Good' : 
                 performanceRatio > 70 ? 'Average' : 'Below Average'
        };
      }
    });
    
    res.json({
      success: true,
      data: {
        benchmarks,
        companyScores,
        comparisons,
        overallRanking: 'Above Industry Average',
        strongAreas: ['Profit Margin', 'ROI', 'Current Ratio'],
        improvementAreas: ['Asset Turnover', 'Debt Management']
      }
    });
    
  } catch (error) {
    console.error('Get benchmarks error:', error);
    res.status(500).json({
      error: 'Failed to fetch industry benchmarks',
      details: error.message
    });
  }
});

// Get tax configuration (UAE VAT)
configRoutes.get('/tax/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Mock tax configuration for UAE
    const taxConfig = {
      companyId,
      country: 'UAE',
      taxSystem: {
        name: 'Value Added Tax (VAT)',
        standardRate: 0.05, // 5%
        registrationThreshold: 375000, // AED
        deregistrationThreshold: 330000 // AED
      },
      vatConfiguration: {
        registrationNumber: '100123456700003',
        isRegistered: true,
        registrationDate: '2023-01-01',
        returnFrequency: 'MONTHLY',
        nextReturnDate: '2024-12-15',
        lastReturnDate: '2024-11-15',
        filingDeadline: 15, // days after month end
        penaltyRate: 0.01 // 1% per month
      },
      taxRates: {
        standard: 0.05,
        zeroRated: 0.0, // Exports, certain services
        exempt: null, // No VAT charged
        reduced: 0.0 // No reduced rate in UAE
      },
      compliance: {
        status: 'COMPLIANT',
        lastAuditDate: '2024-03-15',
        riskLevel: 'LOW',
        requiredReturns: {
          monthly: true,
          annual: true
        }
      },
      records: {
        retentionPeriod: 2555, // 7 years in days
        digitalRecords: true,
        invoiceRequirements: {
          requiredFields: ['Registration Number', 'Date', 'Invoice Number', 'Total', 'VAT Amount'],
          retention: '7 years'
        }
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: taxConfig
    });
    
  } catch (error) {
    console.error('Get tax config error:', error);
    res.status(500).json({
      error: 'Failed to fetch tax configuration',
      details: error.message
    });
  }
});

// Update tax configuration
configRoutes.put('/tax/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const updates = req.body;
    
    const updatedConfig = {
      companyId,
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedBy: req.user?.id
    };
    
    // Validate tax configuration
    if (updates.vatConfiguration?.returnFrequency && 
        !['MONTHLY', 'QUARTERLY'].includes(updates.vatConfiguration.returnFrequency)) {
      return res.status(400).json({
        error: 'Invalid VAT return frequency',
        supported: ['MONTHLY', 'QUARTERLY']
      });
    }
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'Tax configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Update tax config error:', error);
    res.status(500).json({
      error: 'Failed to update tax configuration',
      details: error.message
    });
  }
});

// Get system configuration
configRoutes.get('/system', async (req, res) => {
  try {
    // Mock system configuration
    const systemConfig = {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        multiCurrency: true,
        vatCompliance: true,
        forecasting: true,
        alerts: true,
        reporting: true,
        apiAccess: true
      },
      limits: {
        maxDataRetention: 2555, // days
        maxApiRequestsPerHour: 1000,
        maxReportGenerationPerDay: 50,
        maxForecastHorizon: 60 // months
      },
      integrations: {
        available: [
          { name: 'QuickBooks', status: 'available' },
          { name: 'Xero', status: 'available' },
          { name: 'SAP', status: 'coming_soon' },
          { name: 'Oracle', status: 'coming_soon' }
        ]
      },
      maintenance: {
        lastBackup: '2024-07-12T06:00:00Z',
        nextMaintenance: '2024-07-15T02:00:00Z',
        status: 'operational'
      },
      support: {
        contact: 'support@financial-analytics.com',
        documentation: 'https://docs.financial-analytics.com',
        status: 'available'
      }
    };
    
    res.json({
      success: true,
      data: systemConfig
    });
    
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({
      error: 'Failed to fetch system configuration',
      details: error.message
    });
  }
});