import express from 'express';
import { requireCompany } from '../middleware/auth.js';
import { ForecastingService } from '../services/forecastingService.js';
import { ForecastingError } from '../middleware/errorHandler.js';

export const forecastingRoutes = express.Router();

// All routes require company context
forecastingRoutes.use(requireCompany);

// Generate financial forecasts
forecastingRoutes.post('/generate/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { 
      forecastType, 
      periods = 12, 
      method = 'linear_regression',
      historicalData 
    } = req.body;
    
    if (!historicalData || !Array.isArray(historicalData) || historicalData.length < 3) {
      throw new ForecastingError('Insufficient historical data for forecasting', {
        dataPoints: historicalData?.length || 0,
        required: 3
      });
    }
    
    let forecast;
    
    switch (method) {
      case 'linear_regression':
        forecast = ForecastingService.linearRegressionForecast(historicalData, periods);
        break;
      case 'exponential_smoothing':
        forecast = ForecastingService.exponentialSmoothingForecast(
          historicalData, 
          periods, 
          req.body.alpha || 0.3
        );
        break;
      case 'moving_average':
        forecast = ForecastingService.movingAverageForecast(
          historicalData, 
          periods, 
          req.body.windowSize || 3
        );
        break;
      case 'seasonal_revenue':
        forecast = ForecastingService.seasonalRevenueForecast(historicalData, periods);
        break;
      case 'monte_carlo':
        forecast = ForecastingService.monteCarloForecast(
          historicalData, 
          periods, 
          req.body.simulations || 1000
        );
        break;
      default:
        throw new ForecastingError(`Unsupported forecasting method: ${method}`, {
          method,
          supported: ['linear_regression', 'exponential_smoothing', 'moving_average', 'seasonal_revenue', 'monte_carlo']
        });
    }
    
    res.json({
      success: true,
      data: {
        ...forecast,
        forecastType,
        periods,
        method,
        companyId,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Forecasting error:', error);
    
    if (error instanceof ForecastingError) {
      res.status(400).json({
        error: 'Forecasting Error',
        details: error.message,
        model: error.model
      });
    } else {
      res.status(500).json({
        error: 'Failed to generate forecast',
        details: error.message
      });
    }
  }
});

// Get revenue forecasts
forecastingRoutes.get('/revenue/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { periods = 12, method = 'seasonal_revenue' } = req.query;
    
    // Mock historical revenue data
    const historicalRevenue = [
      { date: '2023-01', value: 800000 },
      { date: '2023-02', value: 850000 },
      { date: '2023-03', value: 900000 },
      { date: '2023-04', value: 875000 },
      { date: '2023-05', value: 950000 },
      { date: '2023-06', value: 1000000 },
      { date: '2023-07', value: 1050000 },
      { date: '2023-08', value: 1100000 },
      { date: '2023-09', value: 1080000 },
      { date: '2023-10', value: 1150000 },
      { date: '2023-11', value: 1200000 },
      { date: '2023-12', value: 1250000 },
      { date: '2024-01', value: 1180000 },
      { date: '2024-02', value: 1220000 },
      { date: '2024-03', value: 1280000 },
      { date: '2024-04', value: 1300000 },
      { date: '2024-05', value: 1350000 },
      { date: '2024-06', value: 1400000 }
    ];
    
    const forecast = ForecastingService.seasonalRevenueForecast(
      historicalRevenue, 
      parseInt(periods)
    );
    
    res.json({
      success: true,
      data: {
        ...forecast,
        historicalData: historicalRevenue.slice(-12), // Last 12 months
        forecastType: 'REVENUE',
        confidence: forecast.forecasts.length > 0 ? 
          Math.round(forecast.forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecast.forecasts.length) : 0
      },
      parameters: {
        method,
        periods: parseInt(periods)
      }
    });
    
  } catch (error) {
    console.error('Revenue forecast error:', error);
    res.status(500).json({
      error: 'Failed to generate revenue forecast',
      details: error.message
    });
  }
});

// Get cash flow forecasts
forecastingRoutes.get('/cash-flow/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { periods = 12, method = 'monte_carlo' } = req.query;
    
    // Mock historical cash flow data
    const historicalCashFlow = [
      { date: '2023-01', value: 200000 },
      { date: '2023-02', value: 250000 },
      { date: '2023-03', value: 225000 },
      { date: '2023-04', value: 275000 },
      { date: '2023-05', value: 300000 },
      { date: '2023-06', value: 280000 },
      { date: '2023-07', value: 320000 },
      { date: '2023-08', value: 350000 },
      { date: '2023-09', value: 325000 },
      { date: '2023-10', value: 375000 },
      { date: '2023-11', value: 400000 },
      { date: '2023-12', value: 380000 },
      { date: '2024-01', value: 350000 },
      { date: '2024-02', value: 380000 },
      { date: '2024-03', value: 420000 },
      { date: '2024-04', value: 400000 },
      { date: '2024-05', value: 450000 },
      { date: '2024-06', value: 430000 }
    ];
    
    let forecast;
    
    if (method === 'monte_carlo') {
      forecast = ForecastingService.monteCarloForecast(
        historicalCashFlow, 
        parseInt(periods),
        1000
      );
    } else {
      forecast = ForecastingService.linearRegressionForecast(
        historicalCashFlow, 
        parseInt(periods)
      );
    }
    
    res.json({
      success: true,
      data: {
        ...forecast,
        historicalData: historicalCashFlow.slice(-12),
        forecastType: 'CASH_FLOW',
        riskAnalysis: {
          probabilityPositiveCashFlow: 85,
          worstCaseScenario: forecast.forecasts[forecast.forecasts.length - 1].confidenceInterval?.lower || 0,
          bestCaseScenario: forecast.forecasts[forecast.forecasts.length - 1].confidenceInterval?.upper || 0
        }
      },
      parameters: {
        method,
        periods: parseInt(periods)
      }
    });
    
  } catch (error) {
    console.error('Cash flow forecast error:', error);
    res.status(500).json({
      error: 'Failed to generate cash flow forecast',
      details: error.message
    });
  }
});

// Get cost forecasts
forecastingRoutes.get('/costs/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { periods = 12, category } = req.query;
    
    // Mock historical cost data
    const historicalCosts = [
      { date: '2023-01', value: 600000 },
      { date: '2023-02', value: 620000 },
      { date: '2023-03', value: 650000 },
      { date: '2023-04', value: 630000 },
      { date: '2023-05', value: 680000 },
      { date: '2023-06', value: 700000 },
      { date: '2023-07', value: 720000 },
      { date: '2023-08', value: 740000 },
      { date: '2023-09', value: 730000 },
      { date: '2023-10', value: 760000 },
      { date: '2023-11', value: 780000 },
      { date: '2023-12', value: 750000 },
      { date: '2024-01', value: 720000 },
      { date: '2024-02', value: 740000 },
      { date: '2024-03', value: 780000 },
      { date: '2024-04', value: 800000 },
      { date: '2024-05', value: 820000 },
      { date: '2024-06', value: 810000 }
    ];
    
    const forecast = ForecastingService.linearRegressionForecast(
      historicalCosts, 
      parseInt(periods)
    );
    
    // Add cost-specific insights
    const costInsights = {
      projectedGrowthRate: ((forecast.forecasts[forecast.forecasts.length - 1].predictedValue - 
                             historicalCosts[historicalCosts.length - 1].value) / 
                            historicalCosts[historicalCosts.length - 1].value) * 100,
      costControlScore: forecast.modelQuality.rSquared > 0.8 ? 'Excellent' : 
                       forecast.modelQuality.rSquared > 0.6 ? 'Good' : 'Needs Improvement',
      optimizationOpportunities: [
        'Review recurring expenses for potential savings',
        'Negotiate better terms with suppliers',
        'Implement cost control measures'
      ]
    };
    
    res.json({
      success: true,
      data: {
        ...forecast,
        historicalData: historicalCosts.slice(-12),
        forecastType: 'COST',
        category: category || 'Total Costs',
        costInsights
      },
      parameters: {
        periods: parseInt(periods),
        category
      }
    });
    
  } catch (error) {
    console.error('Cost forecast error:', error);
    res.status(500).json({
      error: 'Failed to generate cost forecast',
      details: error.message
    });
  }
});

// Get comprehensive financial forecast summary
forecastingRoutes.get('/summary/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { periods = 12 } = req.query;
    
    // Generate multiple forecasts for summary
    const revenueForecast = await this.getRevenueForecastData(parseInt(periods));
    const costForecast = await this.getCostForecastData(parseInt(periods));
    const cashFlowForecast = await this.getCashFlowForecastData(parseInt(periods));
    
    const summary = {
      revenue: revenueForecast,
      costs: costForecast,
      cashFlow: cashFlowForecast,
      projections: {
        profit: {
          current: 400000,
          projected: (revenueForecast.forecasts[0]?.predictedValue || 0) - (costForecast.forecasts[0]?.predictedValue || 0),
          margin: null // Will be calculated
        },
        profitability: {
          currentMargin: 32,
          projectedMargin: null, // Will be calculated
          trend: 'stable'
        },
        financialHealth: {
          current: 'Good',
          projected: 'Good',
          confidence: 85
        }
      }
    };
    
    // Calculate projected profit margin
    const projectedProfit = summary.projections.profit.projected;
    const projectedRevenue = revenueForecast.forecasts[0]?.predictedValue || 0;
    summary.projections.profit.margin = projectedRevenue > 0 ? 
      (projectedProfit / projectedRevenue) * 100 : 0;
    summary.projections.profitability.projectedMargin = summary.projections.profit.margin;
    
    res.json({
      success: true,
      data: {
        ...summary,
        companyId,
        forecastHorizon: parseInt(periods),
        generatedAt: new Date().toISOString()
      },
      recommendations: [
        'Continue revenue growth trajectory - strong positive trend',
        'Monitor cost increases - consider optimization strategies',
        'Maintain healthy cash flow - adequate reserves for operations',
        'Consider investment opportunities with positive ROI'
      ]
    });
    
  } catch (error) {
    console.error('Forecast summary error:', error);
    res.status(500).json({
      error: 'Failed to generate forecast summary',
      details: error.message
    });
  }
});

// Helper methods for mock data
forecastingRoutes.getRevenueForecastData = async (periods) => {
  const historicalRevenue = [
    { date: '2023-01', value: 800000 },
    { date: '2023-02', value: 850000 },
    { date: '2023-03', value: 900000 },
    { date: '2023-04', value: 875000 },
    { date: '2023-05', value: 950000 },
    { date: '2023-06', value: 1000000 },
    { date: '2023-07', value: 1050000 },
    { date: '2023-08', value: 1100000 },
    { date: '2023-09', value: 1080000 },
    { date: '2023-10', value: 1150000 },
    { date: '2023-11', value: 1200000 },
    { date: '2023-12', value: 1250000 }
  ];
  
  return ForecastingService.seasonalRevenueForecast(historicalRevenue, periods);
};

forecastingRoutes.getCostForecastData = async (periods) => {
  const historicalCosts = [
    { date: '2023-01', value: 600000 },
    { date: '2023-02', value: 620000 },
    { date: '2023-03', value: 650000 },
    { date: '2023-04', value: 630000 },
    { date: '2023-05', value: 680000 },
    { date: '2023-06', value: 700000 },
    { date: '2023-07', value: 720000 },
    { date: '2023-08', value: 740000 },
    { date: '2023-09', value: 730000 },
    { date: '2023-10', value: 760000 },
    { date: '2023-11', value: 780000 },
    { date: '2023-12', value: 750000 }
  ];
  
  return ForecastingService.linearRegressionForecast(historicalCosts, periods);
};

forecastingRoutes.getCashFlowForecastData = async (periods) => {
  const historicalCashFlow = [
    { date: '2023-01', value: 200000 },
    { date: '2023-02', value: 250000 },
    { date: '2023-03', value: 225000 },
    { date: '2023-04', value: 275000 },
    { date: '2023-05', value: 300000 },
    { date: '2023-06', value: 280000 },
    { date: '2023-07', value: 320000 },
    { date: '2023-08', value: 350000 },
    { date: '2023-09', value: 325000 },
    { date: '2023-10', value: 375000 },
    { date: '2023-11', value: 400000 },
    { date: '2023-12', value: 380000 }
  ];
  
  return ForecastingService.monteCarloForecast(historicalCashFlow, periods);
};