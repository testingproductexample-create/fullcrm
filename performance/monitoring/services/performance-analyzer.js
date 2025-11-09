/**
 * Performance Analysis Service
 * Analyzes performance metrics, identifies bottlenecks, and provides optimization recommendations
 */

const { EventEmitter } = require('events');
const { Logger } = require('../utilities/logger');
const { DatabaseConnection } = require('../utilities/database-connection');
const { v4: uuidv4 } = require('uuid');

class PerformanceAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      analysisInterval: options.analysisInterval || 300000, // 5 minutes
      enableOptimizationSuggestions: options.enableOptimizationSuggestions !== false,
      enableTrendAnalysis: options.enableTrendAnalysis !== false,
      enableAnomalyDetection: options.enableAnomalyDetection || false,
      enableCostAnalysis: options.enableCostAnalysis || false,
      enablePredictiveAnalysis: options.enablePredictiveAnalysis || false,
      baselinePeriod: options.baselinePeriod || '7d',
      anomalyThreshold: options.anomalyThreshold || 2.5, // Standard deviations
      minDataPoints: options.minDataPoints || 30,
      ...options
    };

    this.isRunning = false;
    this.logger = new Logger('PerformanceAnalyzer');
    this.db = null;
    
    // Analysis results
    this.analysisResults = new Map(); // analysisId -> results
    this.optimizationRecommendations = [];
    this.performanceBaselines = new Map();
    this.anomaliesDetected = [];
    this.trendsIdentified = [];
    
    // Performance categories
    this.categories = {
      system: {
        name: 'System Performance',
        metrics: ['cpu', 'memory', 'disk', 'network'],
        weight: 0.25
      },
      application: {
        name: 'Application Performance',
        metrics: ['response_time', 'throughput', 'error_rate', 'availability'],
        weight: 0.35
      },
      database: {
        name: 'Database Performance',
        metrics: ['query_time', 'connections', 'cache_hit_rate', 'slow_queries'],
        weight: 0.25
      },
      frontend: {
        name: 'Frontend Performance',
        metrics: ['load_time', 'core_web_vitals', 'user_experience'],
        weight: 0.15
      }
    };
    
    // Analysis thresholds
    this.thresholds = {
      cpu: { warning: 70, critical: 85 },
      memory: { warning: 75, critical: 90 },
      disk: { warning: 80, critical: 95 },
      responseTime: { warning: 1000, critical: 3000 },
      errorRate: { warning: 2, critical: 5 },
      availability: { warning: 99, critical: 95 }
    };
    
    // Performance scoring
    this.scoring = {
      excellent: { min: 90, color: 'green' },
      good: { min: 75, color: 'blue' },
      needs_improvement: { min: 60, color: 'yellow' },
      poor: { min: 0, color: 'red' }
    };
    
    // Statistics
    this.counters = {
      analysesCompleted: 0,
      recommendationsGenerated: 0,
      anomaliesDetected: 0,
      trendsIdentified: 0,
      costSavingsIdentified: 0,
      optimizationOpportunities: 0
    };
    
    // Start time
    this.startTime = Date.now();
  }

  /**
   * Initialize the performance analyzer
   */
  async initialize() {
    try {
      this.logger.info('Initializing Performance Analyzer...');
      
      // Initialize database connection
      this.db = new DatabaseConnection();
      await this.db.connect();
      
      // Load performance baselines
      await this.loadPerformanceBaselines();
      
      // Initialize analysis algorithms
      this.initializeAnalysisAlgorithms();
      
      this.logger.info('Performance Analyzer initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Performance Analyzer:', error);
      throw error;
    }
  }

  /**
   * Start the performance analyzer
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('Performance Analyzer is already running');
      return;
    }

    try {
      await this.initialize();
      
      this.isRunning = true;
      this.logger.info('Performance Analyzer started');
      
      // Start analysis interval
      this.analysisInterval = setInterval(() => {
        this.performScheduledAnalysis();
      }, this.options.analysisInterval);
      
      // Start trend analysis
      if (this.options.enableTrendAnalysis) {
        this.trendAnalysisInterval = setInterval(() => {
          this.analyzeTrends();
        }, 600000); // Every 10 minutes
      }
      
      // Start anomaly detection
      if (this.options.enableAnomalyDetection) {
        this.anomalyDetectionInterval = setInterval(() => {
          this.detectAnomalies();
        }, 300000); // Every 5 minutes
      }
      
      // Start cost analysis
      if (this.options.enableCostAnalysis) {
        this.costAnalysisInterval = setInterval(() => {
          this.performCostAnalysis();
        }, 1800000); // Every 30 minutes
      }
      
      this.emit('started', {
        timestamp: new Date().toISOString(),
        options: this.options
      });
      
    } catch (error) {
      this.logger.error('Failed to start Performance Analyzer:', error);
      throw error;
    }
  }

  /**
   * Stop the performance analyzer
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear intervals
    for (const interval of [
      this.analysisInterval,
      this.trendAnalysisInterval,
      this.anomalyDetectionInterval,
      this.costAnalysisInterval
    ]) {
      if (interval) clearInterval(interval);
    }
    
    this.logger.info('Performance Analyzer stopped');
    
    this.emit('stopped', {
      timestamp: new Date().toISOString(),
      counters: this.counters
    });
  }

  /**
   * Perform performance analysis
   */
  async performAnalysis(timeRange = '1h', categories = null) {
    try {
      this.logger.info('Starting performance analysis', { timeRange, categories });
      
      const analysisId = uuidv4();
      const analysis = {
        id: analysisId,
        timestamp: new Date(),
        timeRange,
        categories: categories || Object.keys(this.categories),
        status: 'running',
        results: {}
      };
      
      this.analysisResults.set(analysisId, analysis);
      
      // Analyze each category
      for (const category of analysis.categories) {
        const categoryResult = await this.analyzeCategory(category, timeRange);
        analysis.results[category] = categoryResult;
      }
      
      // Calculate overall performance score
      analysis.overallScore = this.calculateOverallScore(analysis.results);
      
      // Generate optimization recommendations
      if (this.options.enableOptimizationSuggestions) {
        analysis.recommendations = await this.generateRecommendations(analysis.results);
        this.optimizationRecommendations.push(...analysis.recommendations);
        this.counters.recommendationsGenerated += analysis.recommendations.length;
      }
      
      // Detect anomalies
      if (this.options.enableAnomalyDetection) {
        analysis.anomalies = await this.detectAnalysisAnomalies(analysis.results);
        this.anomaliesDetected.push(...analysis.anomalies);
        this.counters.anomaliesDetected += analysis.anomalies.length;
      }
      
      // Perform trend analysis
      if (this.options.enableTrendAnalysis) {
        analysis.trends = await this.analyzeCategoryTrends(analysis.results);
        this.trendsIdentified.push(...analysis.trends);
        this.counters.trendsIdentified += analysis.trends.length;
      }
      
      analysis.status = 'completed';
      analysis.completedAt = new Date();
      
      // Store analysis results
      if (this.db) {
        await this.storeAnalysisResults(analysis);
      }
      
      this.counters.analysesCompleted++;
      
      this.emit('analysisCompleted', analysis);
      
      this.logger.info('Performance analysis completed', {
        analysisId,
        overallScore: analysis.overallScore,
        recommendations: analysis.recommendations?.length || 0
      });
      
      return analysis;
      
    } catch (error) {
      this.logger.error('Error performing performance analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze a specific category
   */
  async analyzeCategory(category, timeRange) {
    const categoryConfig = this.categories[category];
    if (!categoryConfig) {
      throw new Error(`Unknown category: ${category}`);
    }
    
    const result = {
      category,
      name: categoryConfig.name,
      weight: categoryConfig.weight,
      score: 0,
      metrics: {},
      issues: [],
      performance: 'unknown'
    };
    
    try {
      // Analyze each metric in the category
      for (const metric of categoryConfig.metrics) {
        const metricAnalysis = await this.analyzeMetric(metric, category, timeRange);
        result.metrics[metric] = metricAnalysis;
        
        // Add issues to category
        if (metricAnalysis.issues.length > 0) {
          result.issues.push(...metricAnalysis.issues);
        }
      }
      
      // Calculate category score
      result.score = this.calculateCategoryScore(result.metrics);
      result.performance = this.getPerformanceRating(result.score);
      
    } catch (error) {
      this.logger.error(`Error analyzing category ${category}:`, error);
      result.error = error.message;
    }
    
    return result;
  }

  /**
   * Analyze a specific metric
   */
  async analyzeMetric(metric, category, timeRange) {
    const result = {
      metric,
      category,
      current: null,
      baseline: null,
      score: 0,
      issues: [],
      trends: [],
      recommendations: []
    };
    
    try {
      // Get current metric data
      const currentData = await this.getMetricData(metric, category, timeRange);
      result.current = this.calculateMetricStatistics(currentData);
      
      // Get baseline data
      const baselineData = await this.getBaselineData(metric, category);
      result.baseline = baselineData ? this.calculateMetricStatistics(baselineData) : null;
      
      // Calculate score
      result.score = this.calculateMetricScore(result.current, result.baseline);
      
      // Identify issues
      result.issues = this.identifyMetricIssues(result.current, result.baseline);
      
      // Analyze trends
      if (this.options.enableTrendAnalysis) {
        result.trends = this.analyzeMetricTrends(currentData);
      }
      
      // Generate recommendations
      if (this.options.enableOptimizationSuggestions) {
        result.recommendations = this.generateMetricRecommendations(result);
      }
      
    } catch (error) {
      this.logger.error(`Error analyzing metric ${metric}:`, error);
      result.error = error.message;
    }
    
    return result;
  }

  /**
   * Get metric data from database
   */
  async getMetricData(metric, category, timeRange) {
    try {
      const timeRangeMs = this.parseTimeRange(timeRange);
      const cutoffTime = new Date(Date.now() - timeRangeMs);
      
      const client = await this.db.getClient();
      
      let query = '';
      let params = [cutoffTime];
      
      switch (category) {
        case 'system':
          query = `
            SELECT metric_value as value, timestamp
            FROM system_metrics
            WHERE timestamp > $1 AND metric_name = $2
            ORDER BY timestamp
          `;
          params.push(metric);
          break;
          
        case 'application':
          query = `
            SELECT metric_value as value, timestamp
            FROM application_metrics
            WHERE timestamp > $1 AND metric_name = $2
            ORDER BY timestamp
          `;
          params.push(metric);
          break;
          
        case 'database':
          query = `
            SELECT metric_value as value, timestamp
            FROM database_metrics
            WHERE timestamp > $1 AND metric_name = $2
            ORDER BY timestamp
          `;
          params.push(metric);
          break;
          
        case 'frontend':
          query = `
            SELECT metric_value as value, timestamp
            FROM frontend_metrics
            WHERE timestamp > $1 AND metric_name = $2
            ORDER BY timestamp
          `;
          params.push(metric);
          break;
          
        default:
          throw new Error(`Unknown category: ${category}`);
      }
      
      const result = await client.query(query, params);
      await client.release();
      
      return result.rows.map(row => ({
        value: parseFloat(row.value),
        timestamp: row.timestamp
      }));
      
    } catch (error) {
      this.logger.error('Error getting metric data:', error);
      return [];
    }
  }

  /**
   * Get baseline data for a metric
   */
  async getBaselineData(metric, category) {
    try {
      const client = await this.db.getClient();
      
      const result = await client.query(`
        SELECT mean_value, median_value, p95_value, standard_deviation
        FROM performance_baselines
        WHERE metric_type = $1 AND metric_name = $2
        ORDER BY created_at DESC
        LIMIT 1
      `, [category, metric]);
      
      await client.release();
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const baseline = result.rows[0];
      return {
        mean: parseFloat(baseline.mean_value),
        median: parseFloat(baseline.median_value),
        p95: parseFloat(baseline.p95_value),
        stddev: parseFloat(baseline.standard_deviation)
      };
      
    } catch (error) {
      this.logger.error('Error getting baseline data:', error);
      return null;
    }
  }

  /**
   * Calculate metric statistics
   */
  calculateMetricStatistics(data) {
    if (data.length === 0) {
      return null;
    }
    
    const values = data.map(d => d.value);
    values.sort((a, b) => a - b);
    
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median = values[Math.floor(values.length / 2)];
    const p95 = values[Math.floor(values.length * 0.95)];
    const p99 = values[Math.floor(values.length * 0.99)];
    const min = values[0];
    const max = values[values.length - 1];
    
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);
    
    return {
      count: values.length,
      mean,
      median,
      p95,
      p99,
      min,
      max,
      stddev,
      latest: values[values.length - 1],
      trend: this.calculateTrend(values)
    };
  }

  /**
   * Calculate metric score
   */
  calculateMetricScore(current, baseline) {
    if (!current) {
      return 0;
    }
    
    let score = 100; // Start with perfect score
    
    // Adjust score based on performance thresholds
    if (this.thresholds[current.metric]) {
      const threshold = this.thresholds[current.metric];
      
      if (current.latest > threshold.critical) {
        score -= 50; // Severe penalty for critical thresholds
      } else if (current.latest > threshold.warning) {
        score -= 25; // Penalty for warning thresholds
      }
    }
    
    // Adjust score based on variance (consistency)
    if (current.stddev > current.mean * 0.5) {
      score -= 15; // Penalty for high variance
    }
    
    // Adjust score based on baseline comparison
    if (baseline) {
      const deviation = Math.abs(current.mean - baseline.mean) / baseline.mean;
      if (deviation > 0.3) { // 30% deviation from baseline
        score -= 20;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate category score
   */
  calculateCategoryScore(metrics) {
    const scores = Object.values(metrics).map(m => m.score);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  /**
   * Calculate overall performance score
   */
  calculateOverallScore(categoryResults) {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, result] of Object.entries(categoryResults)) {
      if (result.weight && result.score !== undefined) {
        totalScore += result.score * result.weight;
        totalWeight += result.weight;
      }
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Identify metric issues
   */
  identifyMetricIssues(current, baseline) {
    const issues = [];
    
    if (!current) {
      return issues;
    }
    
    // Check for threshold violations
    if (this.thresholds[current.metric]) {
      const threshold = this.thresholds[current.metric];
      
      if (current.latest > threshold.critical) {
        issues.push({
          type: 'critical_threshold',
          severity: 'critical',
          message: `${current.metric} is critically high: ${current.latest.toFixed(2)} (threshold: ${threshold.critical})`
        });
      } else if (current.latest > threshold.warning) {
        issues.push({
          type: 'warning_threshold',
          severity: 'warning',
          message: `${current.metric} is elevated: ${current.latest.toFixed(2)} (threshold: ${threshold.warning})`
        });
      }
    }
    
    // Check for baseline deviations
    if (baseline) {
      const deviation = Math.abs(current.mean - baseline.mean) / baseline.mean;
      if (deviation > 0.5) { // 50% deviation
        issues.push({
          type: 'baseline_deviation',
          severity: deviation > 1 ? 'critical' : 'warning',
          message: `${current.metric} deviates ${(deviation * 100).toFixed(1)}% from baseline`
        });
      }
    }
    
    // Check for high variance
    if (current.stddev > current.mean * 0.8) {
      issues.push({
        type: 'high_variance',
        severity: 'warning',
        message: `${current.metric} shows high variability (CV: ${(current.stddev / current.mean * 100).toFixed(1)}%)`
      });
    }
    
    return issues;
  }

  /**
   * Generate optimization recommendations
   */
  async generateRecommendations(categoryResults) {
    const recommendations = [];
    
    try {
      for (const [category, result] of Object.entries(categoryResults)) {
        for (const [metric, metricResult] of Object.entries(result.metrics)) {
          for (const issue of metricResult.issues) {
            const recommendation = this.generateRecommendation(category, metric, issue, metricResult);
            if (recommendation) {
              recommendations.push(recommendation);
            }
          }
        }
      }
      
      // Add general recommendations based on overall performance
      const overallScore = this.calculateOverallScore(categoryResults);
      if (overallScore < 60) {
        recommendations.push({
          id: uuidv4(),
          category: 'general',
          priority: 'high',
          title: 'Overall Performance Improvement',
          description: 'System performance is below optimal levels. Consider reviewing all performance categories.',
          impact: 'Could improve overall system performance by 20-30%',
          effort: 'medium',
          estimatedSavings: 'Could save $500-2000/month in infrastructure costs',
          implementation: [
            'Conduct comprehensive performance audit',
            'Implement performance monitoring for all tiers',
            'Optimize database queries and indexes',
            'Review and optimize application code',
            'Consider infrastructure scaling'
          ],
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      this.logger.error('Error generating recommendations:', error);
    }
    
    return recommendations;
  }

  /**
   * Generate specific recommendation
   */
  generateRecommendation(category, metric, issue, metricResult) {
    const recommendations = {
      cpu: {
        high_usage: {
          title: 'Optimize CPU Usage',
          description: 'High CPU usage detected. Consider optimizing CPU-intensive operations.',
          impact: 'Could reduce CPU usage by 20-40%',
          effort: 'medium',
          implementation: [
            'Profile CPU-intensive operations',
            'Optimize algorithms and data structures',
            'Implement caching for expensive calculations',
            'Consider horizontal scaling',
            'Review and optimize database queries'
          ]
        }
      },
      memory: {
        high_usage: {
          title: 'Optimize Memory Usage',
          description: 'High memory usage detected. This may lead to performance degradation.',
          impact: 'Could reduce memory usage by 30-50%',
          effort: 'low',
          implementation: [
            'Implement memory pooling',
            'Optimize data structures',
            'Review and fix memory leaks',
            'Implement proper garbage collection',
            'Consider memory optimization for large datasets'
          ]
        }
      },
      response_time: {
        slow_responses: {
          title: 'Improve Response Times',
          description: 'Slow response times detected. This impacts user experience.',
          impact: 'Could improve response times by 50-80%',
          effort: 'medium',
          implementation: [
            'Implement response caching',
            'Optimize database queries',
            'Add database indexes',
            'Implement CDN for static content',
            'Optimize application code',
            'Consider database read replicas'
          ]
        }
      },
      error_rate: {
        high_errors: {
          title: 'Reduce Error Rate',
          description: 'High error rate detected. This affects system reliability.',
          impact: 'Could improve system reliability by 90-95%',
          effort: 'medium',
          implementation: [
            'Implement comprehensive error handling',
            'Add input validation',
            'Implement circuit breakers',
            'Add monitoring and alerting',
            'Review and fix bug sources'
          ]
        }
      }
    };
    
    const categoryRecs = recommendations[metric];
    if (!categoryRecs) {
      return null;
    }
    
    const rec = categoryRecs[issue.type];
    if (!rec) {
      return null;
    }
    
    return {
      id: uuidv4(),
      category,
      metric,
      priority: issue.severity === 'critical' ? 'high' : 'medium',
      title: rec.title,
      description: rec.description,
      impact: rec.impact,
      effort: rec.effort,
      estimatedSavings: this.estimateCostSavings(category, metric, issue),
      implementation: rec.implementation,
      context: {
        issue,
        currentValue: metricResult.current?.latest,
        baseline: metricResult.baseline?.mean
      },
      timestamp: new Date()
    };
  }

  /**
   * Estimate cost savings from optimization
   */
  estimateCostSavings(category, metric, issue) {
    // This is a simplified cost estimation
    // In a real implementation, you would use actual cost data
    
    const costEstimates = {
      cpu: '$200-800/month',
      memory: '$100-500/month',
      response_time: '$300-1000/month',
      error_rate: '$500-2000/month'
    };
    
    return costEstimates[metric] || '$100-500/month';
  }

  /**
   * Detect anomalies in analysis results
   */
  async detectAnalysisAnomalies(categoryResults) {
    const anomalies = [];
    
    try {
      for (const [category, result] of Object.entries(categoryResults)) {
        for (const [metric, metricResult] of Object.entries(result.metrics)) {
          if (!metricResult.current || !metricResult.baseline) {
            continue;
          }
          
          // Calculate anomaly score
          const anomalyScore = this.calculateAnomalyScore(
            metricResult.current,
            metricResult.baseline
          );
          
          if (anomalyScore > this.options.anomalyThreshold) {
            anomalies.push({
              id: uuidv4(),
              category,
              metric,
              type: 'statistical_anomaly',
              severity: anomalyScore > 3 ? 'critical' : 'warning',
              score: anomalyScore,
              current: metricResult.current,
              baseline: metricResult.baseline,
              description: `Anomalous ${metric} detected (score: ${anomalyScore.toFixed(2)})`,
              timestamp: new Date()
            });
          }
        }
      }
      
    } catch (error) {
      this.logger.error('Error detecting anomalies:', error);
    }
    
    return anomalies;
  }

  /**
   * Calculate anomaly score
   */
  calculateAnomalyScore(current, baseline) {
    if (!baseline || !baseline.stddev) {
      return 0;
    }
    
    // Z-score based anomaly detection
    const zScore = Math.abs(current.latest - baseline.mean) / baseline.stddev;
    
    // Additional factors
    const varianceScore = current.stddev / baseline.stddev;
    const trendScore = Math.abs(current.trend?.slope || 0);
    
    // Combine scores
    return zScore + (varianceScore * 0.5) + (trendScore * 0.3);
  }

  /**
   * Analyze trends
   */
  async analyzeTrends() {
    try {
      this.logger.debug('Analyzing performance trends...');
      
      // This would perform comprehensive trend analysis
      // For now, emit a placeholder event
      this.emit('trendsAnalyzed', {
        timestamp: new Date(),
        trends: this.trendsIdentified.slice(-10) // Last 10 trends
      });
      
    } catch (error) {
      this.logger.error('Error analyzing trends:', error);
    }
  }

  /**
   * Analyze category trends
   */
  async analyzeCategoryTrends(categoryResults) {
    const trends = [];
    
    for (const [category, result] of Object.entries(categoryResults)) {
      for (const [metric, metricResult] of Object.entries(result.metrics)) {
        if (metricResult.trends.length > 0) {
          trends.push({
            category,
            metric,
            trends: metricResult.trends
          });
        }
      }
    }
    
    return trends;
  }

  /**
   * Perform cost analysis
   */
  async performCostAnalysis() {
    try {
      this.logger.debug('Performing cost analysis...');
      
      // This would analyze cost optimization opportunities
      // For now, just emit an event
      this.emit('costAnalysisCompleted', {
        timestamp: new Date(),
        potentialSavings: this.counters.costSavingsIdentified
      });
      
    } catch (error) {
      this.logger.error('Error performing cost analysis:', error);
    }
  }

  /**
   * Detect anomalies periodically
   */
  async detectAnomalies() {
    try {
      // This would perform real-time anomaly detection
      // For now, just emit an event
      this.emit('anomaliesDetected', {
        timestamp: new Date(),
        anomalies: this.anomaliesDetected.slice(-5) // Last 5 anomalies
      });
      
    } catch (error) {
      this.logger.error('Error detecting anomalies:', error);
    }
  }

  /**
   * Perform scheduled analysis
   */
  async performScheduledAnalysis() {
    try {
      await this.performAnalysis('1h');
    } catch (error) {
      this.logger.error('Error in scheduled analysis:', error);
    }
  }

  /**
   * Initialize analysis algorithms
   */
  initializeAnalysisAlgorithms() {
    this.logger.info('Analysis algorithms initialized');
  }

  /**
   * Load performance baselines
   */
  async loadPerformanceBaselines() {
    try {
      const client = await this.db.getClient();
      
      const result = await client.query(`
        SELECT metric_type, metric_name, mean_value, median_value, p95_value, 
               standard_deviation, sample_count, created_at
        FROM performance_baselines
        WHERE created_at > NOW() - INTERVAL '30 days'
      `);
      
      for (const baseline of result.rows) {
        const key = `${baseline.metric_type}.${baseline.metric_name}`;
        this.performanceBaselines.set(key, {
          type: baseline.metric_type,
          name: baseline.metric_name,
          mean: parseFloat(baseline.mean_value),
          median: parseFloat(baseline.median_value),
          p95: parseFloat(baseline.p95_value),
          stddev: parseFloat(baseline.standard_deviation),
          sampleCount: parseInt(baseline.sample_count),
          createdAt: baseline.created_at
        });
      }
      
      await client.release();
      this.logger.info(`Loaded ${this.performanceBaselines.size} performance baselines`);
      
    } catch (error) {
      this.logger.error('Error loading performance baselines:', error);
    }
  }

  /**
   * Store analysis results
   */
  async storeAnalysisResults(analysis) {
    try {
      // This would store analysis results in the database
      // For now, just log
      this.logger.debug('Analysis results stored', { analysisId: analysis.id });
      
    } catch (error) {
      this.logger.error('Error storing analysis results:', error);
    }
  }

  /**
   * Calculate trend for values
   */
  calculateTrend(values) {
    if (values.length < 2) {
      return null;
    }
    
    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return {
      slope,
      intercept,
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
    };
  }

  /**
   * Get performance rating
   */
  getPerformanceRating(score) {
    for (const [rating, config] of Object.entries(this.scoring)) {
      if (score >= config.min) {
        return rating;
      }
    }
    return 'poor';
  }

  /**
   * Parse time range string
   */
  parseTimeRange(timeRange) {
    const units = {
      'ms': 1,
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000
    };
    
    const match = timeRange.match(/^(\d+)([a-z]+)$/i);
    if (!match) {
      return 3600000; // Default 1 hour
    }
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    return value * (units[unit] || units['h']);
  }

  /**
   * Analyze metric trends
   */
  analyzeMetricTrends(data) {
    const trends = [];
    
    if (data.length < 10) {
      return trends;
    }
    
    const values = data.map(d => d.value);
    const trend = this.calculateTrend(values);
    
    if (trend && Math.abs(trend.slope) > 0.01) { // Minimum slope threshold
      trends.push({
        type: 'linear_trend',
        direction: trend.direction,
        slope: trend.slope,
        confidence: Math.min(100, values.length * 5), // Simple confidence measure
        description: `${trend.direction} trend detected (slope: ${trend.slope.toFixed(4)})`
      });
    }
    
    return trends;
  }

  /**
   * Get current performance analyzer status
   */
  getPerformanceAnalyzerStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date().toISOString(),
      counters: this.counters,
      categories: Object.keys(this.categories),
      recommendations: this.optimizationRecommendations.length,
      anomalies: this.anomaliesDetected.length,
      trends: this.trendsIdentified.length,
      baselines: this.performanceBaselines.size
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(limit = 10) {
    return this.optimizationRecommendations
      .sort((a, b) => {
        // Sort by priority: high, medium, low
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      })
      .slice(0, limit);
  }

  /**
   * Get analysis results
   */
  getAnalysisResults(analysisId) {
    return this.analysisResults.get(analysisId);
  }

  /**
   * Get detected anomalies
   */
  getDetectedAnomalies(limit = 10) {
    return this.anomaliesDetected
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = { PerformanceAnalyzer };