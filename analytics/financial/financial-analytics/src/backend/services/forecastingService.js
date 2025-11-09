import { ForecastingError } from '../middleware/errorHandler.js';
import { FinancialCalculator } from './financialCalculator.js';

export class ForecastingService {
  
  // Linear regression forecasting
  static linearRegressionForecast(historicalData, periods = 12) {
    if (!historicalData || historicalData.length < 3) {
      throw new ForecastingError('Insufficient historical data for linear regression', {
        dataPoints: historicalData?.length || 0,
        required: 3
      });
    }

    // Prepare data for regression (x = time period, y = value)
    const regressionData = historicalData.map((item, index) => [index, item.value]);
    const trend = FinancialCalculator.calculateLinearTrend(regressionData);
    
    const forecasts = [];
    const lastPeriod = historicalData.length - 1;
    
    for (let i = 1; i <= periods; i++) {
      const forecastPeriod = lastPeriod + i;
      const predictedValue = Math.max(0, trend.intercept + trend.slope * forecastPeriod);
      
      // Calculate confidence interval (simplified)
      const residuals = historicalData.map((item, index) => {
        const predicted = trend.intercept + trend.slope * index;
        return item.value - predicted;
      });
      
      const stdError = FinancialCalculator.calculateStandardDeviation(residuals);
      const confidenceInterval = {
        lower: predictedValue - (1.96 * stdError),
        upper: predictedValue + (1.96 * stdError)
      };
      
      forecasts.push({
        period: i,
        predictedValue,
        confidenceInterval,
        confidence: Math.max(0.1, 0.95 - (i * 0.05)) // Decreasing confidence
      });
    }

    return {
      method: 'linear_regression',
      forecasts,
      modelQuality: {
        rSquared: this.calculateRSquared(historicalData, trend),
        standardError: FinancialCalculator.calculateStandardDeviation(residuals)
      },
      trend: {
        slope: trend.slope,
        direction: trend.slope > 0 ? 'increasing' : 'decreasing',
        strength: Math.abs(trend.slope) > 0.1 ? 'strong' : 'weak'
      }
    };
  }

  // Exponential smoothing forecasting
  static exponentialSmoothingForecast(historicalData, periods = 12, alpha = 0.3) {
    if (!historicalData || historicalData.length === 0) {
      throw new ForecastingError('No historical data provided for exponential smoothing');
    }

    if (alpha < 0 || alpha > 1) {
      throw new ForecastingError('Alpha parameter must be between 0 and 1', { alpha });
    }

    // Calculate smoothed values
    const smoothed = [historicalData[0].value];
    
    for (let i = 1; i < historicalData.length; i++) {
      const smoothedValue = alpha * historicalData[i].value + (1 - alpha) * smoothed[i - 1];
      smoothed.push(smoothedValue);
    }

    const lastSmoothed = smoothed[smoothed.length - 1];
    
    // Generate forecasts
    const forecasts = [];
    for (let i = 1; i <= periods; i++) {
      // For simple exponential smoothing, all future forecasts equal the last smoothed value
      const predictedValue = lastSmoothed;
      const confidence = Math.max(0.1, 0.90 - (i * 0.05));
      
      forecasts.push({
        period: i,
        predictedValue,
        confidence,
        trend: 0 // Simple exponential smoothing doesn't capture trend
      });
    }

    return {
      method: 'exponential_smoothing',
      alpha,
      forecasts,
      modelQuality: {
        mape: this.calculateMAPE(historicalData, smoothed),
        residuals: this.calculateResiduals(historicalData, smoothed)
      }
    };
  }

  // Moving average forecasting
  static movingAverageForecast(historicalData, periods = 12, windowSize = 3) {
    if (!historicalData || historicalData.length < windowSize) {
      throw new ForecastingError('Insufficient data for moving average forecast', {
        dataPoints: historicalData?.length || 0,
        required: windowSize
      });
    }

    // Calculate moving averages
    const movingAverages = [];
    for (let i = windowSize - 1; i < historicalData.length; i++) {
      const window = historicalData.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, item) => sum + item.value, 0) / windowSize;
      movingAverages.push(average);
    }

    // Use the last moving average for forecasting
    const lastMA = movingAverages[movingAverages.length - 1];
    
    const forecasts = [];
    for (let i = 1; i <= periods; i++) {
      const confidence = Math.max(0.1, 0.85 - (i * 0.05));
      
      forecasts.push({
        period: i,
        predictedValue: lastMA,
        confidence,
        basedOnPeriods: windowSize
      });
    }

    return {
      method: 'moving_average',
      windowSize,
      forecasts,
      modelQuality: {
        maValues: movingAverages,
        volatility: FinancialCalculator.calculateStandardDeviation(movingAverages)
      }
    };
  }

  // Revenue forecasting with seasonal adjustment
  static seasonalRevenueForecast(historicalData, periods = 12) {
    if (!historicalData || historicalData.length < 24) {
      // Fall back to linear regression if insufficient data
      return this.linearRegressionForecast(historicalData, periods);
    }

    // Group data by month/quarter to identify patterns
    const seasonalData = this.groupBySeasonalPeriod(historicalData);
    
    // Calculate seasonal factors
    const seasonalFactors = this.calculateSeasonalFactors(seasonalData);
    
    // Base trend using linear regression
    const trendForecast = this.linearRegressionForecast(historicalData, periods);
    
    // Apply seasonal adjustments
    const forecasts = trendForecast.forecasts.map((forecast, index) => {
      const seasonalPeriod = (index + 1) % 12; // Assuming monthly data
      const seasonalFactor = seasonalFactors[seasonalPeriod] || 1;
      const adjustedValue = forecast.predictedValue * seasonalFactor;
      
      return {
        ...forecast,
        predictedValue: adjustedValue,
        seasonalFactor,
        seasonalAdjustment: (seasonalFactor - 1) * 100
      };
    });

    return {
      method: 'seasonal_revenue',
      forecasts,
      seasonalFactors,
      baseForecast: trendForecast
    };
  }

  // Monte Carlo simulation for risk analysis
  static monteCarloForecast(historicalData, periods = 12, simulations = 1000) {
    if (!historicalData || historicalData.length < 5) {
      throw new ForecastingError('Insufficient historical data for Monte Carlo simulation', {
        dataPoints: historicalData?.length || 0,
        required: 5
      });
    }

    // Calculate historical returns and volatility
    const returns = this.calculateReturns(historicalData);
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = FinancialCalculator.calculateStandardDeviation(returns);
    
    const lastValue = historicalData[historicalData.length - 1].value;
    
    // Run Monte Carlo simulations
    const simulationsResults = [];
    for (let sim = 0; sim < simulations; sim++) {
      let currentValue = lastValue;
      const simulationPath = [currentValue];
      
      for (let period = 1; period <= periods; period++) {
        // Generate random return using normal distribution approximation
        const randomReturn = this.generateNormalRandom(meanReturn, volatility);
        currentValue = Math.max(0, currentValue * (1 + randomReturn));
        simulationPath.push(currentValue);
      }
      
      simulationsResults.push(simulationPath);
    }
    
    // Calculate statistics for each period
    const forecasts = [];
    for (let period = 1; period <= periods; period++) {
      const periodValues = simulationsResults.map(sim => sim[period]);
      periodValues.sort((a, b) => a - b);
      
      const mean = periodValues.reduce((sum, val) => sum + val, 0) / periodValues.length;
      const median = periodValues[Math.floor(periodValues.length / 2)];
      const p5 = periodValues[Math.floor(periodValues.length * 0.05)];
      const p95 = periodValues[Math.floor(periodValues.length * 0.95)];
      
      forecasts.push({
        period,
        mean,
        median,
        confidenceInterval: {
          lower: p5,
          upper: p95
        },
        confidence: 0.90,
        riskMetrics: {
          valueAtRisk5: p5,
          valueAtRisk95: p95
        }
      });
    }
    
    return {
      method: 'monte_carlo',
      simulations,
      forecasts,
      riskMetrics: {
        meanReturn,
        volatility,
        sharpeRatio: meanReturn / volatility
      }
    };
  }

  // Helper methods
  static calculateRSquared(data, trend) {
    const actualValues = data.map(item => item.value);
    const predictedValues = data.map((item, index) => 
      trend.intercept + trend.slope * index
    );
    
    const actualMean = actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length;
    const totalSumSquares = actualValues.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actualValues.reduce((sum, val, i) => 
      sum + Math.pow(val - predictedValues[i], 2), 0
    );
    
    return 1 - (residualSumSquares / totalSumSquares);
  }

  static calculateMAPE(actual, predicted) {
    if (actual.length !== predicted.length) return 0;
    
    const ape = actual.map((val, i) => 
      val !== 0 ? Math.abs((val - predicted[i]) / val) : 0
    );
    
    return (ape.reduce((sum, val) => sum + val, 0) / ape.length) * 100;
  }

  static calculateResiduals(actual, predicted) {
    if (actual.length !== predicted.length) return [];
    return actual.map((val, i) => val - predicted[i]);
  }

  static groupBySeasonalPeriod(data) {
    // Group data by month/quarter for seasonal analysis
    const groups = {};
    data.forEach(item => {
      const period = new Date(item.date).getMonth() + 1; // 1-12 for months
      if (!groups[period]) groups[period] = [];
      groups[period].push(item.value);
    });
    return groups;
  }

  static calculateSeasonalFactors(groupedData) {
    const factors = {};
    Object.keys(groupedData).forEach(period => {
      const periodData = groupedData[period];
      const overallMean = Object.values(groupedData)
        .flat()
        .reduce((sum, val) => sum + val, 0) / Object.values(groupedData).flat().length;
      
      const periodMean = periodData.reduce((sum, val) => sum + val, 0) / periodData.length;
      factors[period] = periodMean / overallMean;
    });
    return factors;
  }

  static calculateReturns(data) {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const returnRate = (data[i].value - data[i - 1].value) / data[i - 1].value;
      returns.push(returnRate);
    }
    return returns;
  }

  static generateNormalRandom(mean, stdDev) {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }
}