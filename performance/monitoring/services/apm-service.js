/**
 * Application Performance Monitoring (APM) Service
 * Tracks application performance metrics, request/response times, error rates, and user experience
 */

const { EventEmitter } = require('events');
const { Logger } = require('../utilities/logger');
const { DatabaseConnection } = require('../utilities/database-connection');
const { AlertingService } = require('./alerting-service');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

class APMService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      app: options.app, // Express app instance
      sampleRate: options.sampleRate || 1.0,
      enableProfiling: options.enableProfiling || false,
      slowRequestThreshold: options.slowRequestThreshold || 2000, // milliseconds
      enableErrorTracking: options.enableErrorTracking !== false,
      enableUserMetrics: options.enableUserMetrics !== false,
      maxTransactions: options.maxTransactions || 10000,
      enableRealUserMonitoring: options.enableRealUserMonitoring || false,
      ...options
    };

    this.isRunning = false;
    this.logger = new Logger('APMService');
    this.db = null;
    this.alertingService = null;
    
    // Transaction tracking
    this.activeTransactions = new Map();
    this.completedTransactions = [];
    this.slowTransactions = [];
    this.errorTransactions = [];
    
    // Metrics aggregation
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0
      },
      errors: {
        total: 0,
        byStatus: {},
        byType: {},
        byEndpoint: {}
      },
      throughput: {
        requestsPerSecond: 0,
        bytesPerSecond: 0
      },
      availability: {
        uptime: 0,
        downtime: 0,
        sla: 100
      }
    };
    
    // Performance baselines
    this.baselines = new Map();
    
    // Counters and timers
    this.counters = {
      transactionsTracked: 0,
      errorsTracked: 0,
      slowRequestsTracked: 0,
      apdexScore: 0,
      errorRate: 0
    };
    
    // Start time for uptime calculation
    this.startTime = Date.now();
    this.lastMetricsUpdate = Date.now();
    
    // Request/response tracking
    this.requestCount = 0;
    this.responseCount = 0;
    this.lastThroughputCalculation = Date.now();
    
    // Middleware installed flag
    this.middlewareInstalled = false;
  }

  /**
   * Initialize the APM service
   */
  async initialize() {
    try {
      this.logger.info('Initializing APM Service...');
      
      // Initialize database connection
      this.db = new DatabaseConnection();
      await this.db.connect();
      
      // Initialize alerting service
      this.alertingService = new AlertingService();
      await this.alertingService.initialize();
      
      // Install middleware if app is provided
      if (this.options.app) {
        this.installMiddleware();
      }
      
      // Initialize performance baselines
      await this.initializeBaselines();
      
      this.logger.info('APM Service initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize APM Service:', error);
      throw error;
    }
  }

  /**
   * Start the APM service
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('APM Service is already running');
      return;
    }

    try {
      await this.initialize();
      
      this.isRunning = true;
      this.logger.info('APM Service started');
      
      // Start metrics aggregation interval
      this.aggregationInterval = setInterval(() => {
        this.aggregateMetrics();
      }, 30000); // Every 30 seconds
      
      // Start throughput calculation interval
      this.throughputInterval = setInterval(() => {
        this.calculateThroughput();
      }, 10000); // Every 10 seconds
      
      // Start cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldData();
      }, 60000); // Every minute
      
      this.emit('started', {
        timestamp: new Date().toISOString(),
        options: this.options
      });
      
    } catch (error) {
      this.logger.error('Failed to start APM Service:', error);
      throw error;
    }
  }

  /**
   * Stop the APM service
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear intervals
    for (const interval of [this.aggregationInterval, this.throughputInterval, this.cleanupInterval]) {
      if (interval) clearInterval(interval);
    }
    
    // Stop alerting service
    if (this.alertingService) {
      this.alertingService.stop();
    }
    
    this.logger.info('APM Service stopped');
    
    this.emit('stopped', {
      timestamp: new Date().toISOString(),
      counters: this.counters
    });
  }

  /**
   * Install Express middleware
   */
  installMiddleware() {
    if (this.middlewareInstalled) {
      return;
    }
    
    const app = this.options.app;
    
    // Request tracking middleware
    app.use((req, res, next) => {
      const shouldSample = Math.random() < this.options.sampleRate;
      if (!shouldSample) {
        return next();
      }
      
      const transactionId = uuidv4();
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();
      
      // Store transaction context
      req.apm = {
        transactionId,
        startTime,
        startMemory,
        userId: this.extractUserId(req),
        sessionId: this.extractSessionId(req),
        tags: this.extractTags(req)
      };
      
      // Track active transaction
      this.activeTransactions.set(transactionId, {
        id: transactionId,
        method: req.method,
        url: req.url,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        startTime: new Date(),
        userId: req.apm.userId,
        sessionId: req.apm.sessionId,
        tags: req.apm.tags
      });
      
      // Override res.end to capture response
      const originalEnd = res.end;
      res.end = (...args) => {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        this.completeTransaction({
          transactionId,
          method: req.method,
          url: req.url,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          startMemory,
          endMemory,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress,
          userId: req.apm.userId,
          sessionId: req.apm.sessionId,
          tags: req.apm.tags,
          requestSize: this.calculateRequestSize(req),
          responseSize: this.calculateResponseSize(res)
        });
        
        return originalEnd.apply(res, args);
      };
      
      next();
    });
    
    // Error tracking middleware
    app.use((error, req, res, next) => {
      if (this.options.enableErrorTracking && req.apm) {
        this.trackError(error, req);
      }
      next(error);
    });
    
    this.middlewareInstalled = true;
    this.logger.info('APM middleware installed');
  }

  /**
   * Complete a transaction and record metrics
   */
  completeTransaction(transactionData) {
    try {
      // Remove from active transactions
      this.activeTransactions.delete(transactionData.transactionId);
      
      // Create transaction record
      const transaction = {
        id: transactionData.transactionId,
        timestamp: new Date(),
        method: transactionData.method,
        url: transactionData.url,
        path: transactionData.path,
        statusCode: transactionData.statusCode,
        duration: transactionData.duration,
        requestSize: transactionData.requestSize,
        responseSize: transactionData.responseSize,
        userAgent: transactionData.userAgent,
        ip: transactionData.ip,
        userId: transactionData.userId,
        sessionId: transactionData.sessionId,
        tags: transactionData.tags,
        memoryDelta: {
          rss: transactionData.endMemory.rss - transactionData.startMemory.rss,
          heapUsed: transactionData.endMemory.heapUsed - transactionData.startMemory.heapUsed
        }
      };
      
      // Add to completed transactions
      this.completedTransactions.push(transaction);
      
      // Track slow requests
      if (transactionData.duration > this.options.slowRequestThreshold) {
        this.slowTransactions.push(transaction);
        this.counters.slowRequestsTracked++;
        
        // Emit slow transaction event
        this.emit('slowTransaction', transaction);
      }
      
      // Track errors
      if (transactionData.statusCode >= 400) {
        this.errorTransactions.push(transaction);
        this.counters.errorsTracked++;
        
        // Emit error event
        this.emit('error', {
          type: 'http_error',
          statusCode: transactionData.statusCode,
          transaction
        });
      }
      
      // Update metrics
      this.updateMetrics(transaction);
      
      // Store in database
      if (this.db) {
        this.storeTransactionInDatabase(transaction);
      }
      
      // Check for alerts
      if (this.alertingService) {
        this.checkAPMAlerts(transaction);
      }
      
      this.counters.transactionsTracked++;
      
      // Emit transaction event
      this.emit('transaction', transaction);
      
      // Keep transaction lists manageable
      this.maintainTransactionHistory();
      
    } catch (error) {
      this.logger.error('Error completing transaction:', error);
    }
  }

  /**
   * Track application errors
   */
  trackError(error, req) {
    try {
      const errorData = {
        id: uuidv4(),
        timestamp: new Date(),
        type: error.constructor.name,
        message: error.message,
        stack: error.stack,
        service: 'application',
        endpoint: req.path,
        method: req.method,
        userId: req.apm?.userId,
        sessionId: req.apm?.sessionId,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        statusCode: error.status || 500,
        transactionId: req.apm?.transactionId,
        tags: req.apm?.tags || {}
      };
      
      // Store error
      if (this.db) {
        this.storeErrorInDatabase(errorData);
      }
      
      this.counters.errorsTracked++;
      this.emit('error', errorData);
      
    } catch (trackingError) {
      this.logger.error('Error tracking error:', trackingError);
    }
  }

  /**
   * Update aggregated metrics
   */
  updateMetrics(transaction) {
    const metrics = this.metrics;
    
    // Request metrics
    metrics.requests.total++;
    
    if (transaction.statusCode < 400) {
      metrics.requests.successful++;
    } else {
      metrics.requests.failed++;
    }
    
    // Response time metrics
    metrics.requests.minResponseTime = Math.min(metrics.requests.minResponseTime, transaction.duration);
    metrics.requests.maxResponseTime = Math.max(metrics.requests.maxResponseTime, transaction.duration);
    
    // Calculate running average
    metrics.requests.averageResponseTime = (
      (metrics.requests.averageResponseTime * (metrics.requests.total - 1) + transaction.duration) /
      metrics.requests.total
    );
    
    // Calculate percentiles
    this.calculatePercentiles();
    
    // Error metrics
    if (transaction.statusCode >= 400) {
      metrics.errors.total++;
      metrics.errors.byStatus[transaction.statusCode] = (metrics.errors.byStatus[transaction.statusCode] || 0) + 1;
      metrics.errors.byEndpoint[transaction.path] = (metrics.errors.byEndpoint[transaction.path] || 0) + 1;
    }
    
    // Calculate error rate
    this.counters.errorRate = (metrics.errors.total / metrics.requests.total) * 100;
    
    // Calculate Apdex score
    this.calculateApdexScore();
  }

  /**
   * Calculate response time percentiles
   */
  calculatePercentiles() {
    if (this.completedTransactions.length < 10) {
      return; // Need more samples
    }
    
    const responseTimes = this.completedTransactions
      .slice(-1000) // Use last 1000 transactions
      .map(t => t.duration)
      .sort((a, b) => a - b);
    
    const percentiles = [50, 90, 95, 99];
    
    percentiles.forEach(p => {
      const index = Math.ceil((p / 100) * responseTimes.length) - 1;
      const percentileKey = `p${p}`;
      this.metrics.requests[percentileKey] = responseTimes[Math.max(0, index)];
    });
  }

  /**
   * Calculate Apdex score
   */
  calculateApdexScore() {
    const T = 1000; // Target response time (1 second)
    
    const recentTransactions = this.completedTransactions.slice(-1000);
    if (recentTransactions.length === 0) {
      return;
    }
    
    let satisfied = 0;
    let tolerating = 0;
    
    recentTransactions.forEach(transaction => {
      if (transaction.duration <= T) {
        satisfied++;
      } else if (transaction.duration <= 4 * T) {
        tolerating++;
      }
    });
    
    this.counters.apdexScore = (satisfied + (tolerating * 0.5)) / recentTransactions.length;
    this.metrics.apdex = this.counters.apdexScore;
  }

  /**
   * Calculate throughput metrics
   */
  calculateThroughput() {
    const now = Date.now();
    const timeDelta = (now - this.lastThroughputCalculation) / 1000; // seconds
    
    if (timeDelta <= 0) return;
    
    const recentTransactions = this.completedTransactions.filter(
      t => t.timestamp.getTime() > this.lastThroughputCalculation
    );
    
    this.metrics.throughput.requestsPerSecond = recentTransactions.length / timeDelta;
    this.metrics.throughput.bytesPerSecond = recentTransactions.reduce(
      (sum, t) => sum + (t.requestSize || 0) + (t.responseSize || 0), 0
    ) / timeDelta;
    
    this.lastThroughputCalculation = now;
  }

  /**
   * Check for APM-specific alerts
   */
  async checkAPMAlerts(transaction) {
    try {
      const alerts = [];
      
      // High error rate alert
      const errorRateThreshold = 5; // 5%
      if (this.counters.errorRate > errorRateThreshold) {
        alerts.push({
          rule: 'high_error_rate',
          metric: 'error_rate',
          value: this.counters.errorRate,
          threshold: errorRateThreshold,
          severity: this.counters.errorRate > 10 ? 'critical' : 'warning'
        });
      }
      
      // Slow response time alert
      const responseTimeThreshold = 3000; // 3 seconds
      if (transaction.duration > responseTimeThreshold) {
        alerts.push({
          rule: 'slow_response_time',
          metric: 'response_time',
          value: transaction.duration,
          threshold: responseTimeThreshold,
          severity: transaction.duration > 5000 ? 'critical' : 'warning'
        });
      }
      
      // Low Apdex score alert
      const apdexThreshold = 0.85; // 85% satisfaction
      if (this.counters.apdexScore < apdexThreshold) {
        alerts.push({
          rule: 'low_apdex_score',
          metric: 'apdex_score',
          value: this.counters.apdexScore,
          threshold: apdexThreshold,
          severity: this.counters.apdexScore < 0.7 ? 'critical' : 'warning'
        });
      }
      
      // High availability alert
      const availabilityThreshold = 99.9; // 99.9% availability
      if (this.metrics.availability.sla < availabilityThreshold) {
        alerts.push({
          rule: 'low_availability',
          metric: 'availability',
          value: this.metrics.availability.sla,
          threshold: availabilityThreshold,
          severity: 'critical'
        });
      }
      
      // Trigger alerts
      for (const alert of alerts) {
        this.emit('alert', {
          ...alert,
          timestamp: new Date(),
          source: 'apm_service'
        });
        
        if (this.alertingService) {
          await this.alertingService.triggerAlert(alert);
        }
      }
      
    } catch (error) {
      this.logger.error('Error checking APM alerts:', error);
    }
  }

  /**
   * Aggregate metrics periodically
   */
  aggregateMetrics() {
    try {
      // Update availability metrics
      const uptime = Date.now() - this.startTime;
      this.metrics.availability.uptime = uptime;
      this.metrics.availability.sla = ((metrics.requests.successful / metrics.requests.total) * 100) || 100;
      
      // Store aggregated metrics in database
      if (this.db) {
        this.storeAggregatedMetrics();
      }
      
      // Emit aggregated metrics event
      this.emit('metrics', {
        timestamp: new Date(),
        metrics: this.metrics,
        counters: this.counters
      });
      
      this.lastMetricsUpdate = Date.now();
      
    } catch (error) {
      this.logger.error('Error aggregating metrics:', error);
    }
  }

  /**
   * Store transaction in database
   */
  async storeTransactionInDatabase(transaction) {
    try {
      const client = await this.db.getClient();
      
      await client.query(
        `INSERT INTO application_metrics 
         (timestamp, service_name, metric_type, metric_name, metric_value, metric_unit, 
          endpoint, method, status_code, response_time_ms, request_size_bytes, response_size_bytes, 
          user_id, session_id, tags, metadata)
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          transaction.timestamp,
          'apm_service',
          'http',
          'request_duration',
          transaction.duration,
          'milliseconds',
          transaction.path,
          transaction.method,
          transaction.statusCode,
          transaction.duration,
          transaction.requestSize,
          transaction.responseSize,
          transaction.userId,
          transaction.sessionId,
          JSON.stringify(transaction.tags),
          JSON.stringify({
            memoryDelta: transaction.memoryDelta,
            userAgent: transaction.userAgent,
            ip: transaction.ip
          })
        ]
      );
      
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to store transaction in database:', error);
    }
  }

  /**
   * Store error in database
   */
  async storeErrorInDatabase(errorData) {
    try {
      const client = await this.db.getClient();
      
      await client.query(
        `INSERT INTO error_logs 
         (timestamp, service_name, error_type, error_message, stack_trace, 
          severity, user_id, session_id, endpoint, method, user_agent, ip_address, tags, metadata)
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          errorData.timestamp,
          errorData.service,
          errorData.type,
          errorData.message,
          errorData.stack,
          'error',
          errorData.userId,
          errorData.sessionId,
          errorData.endpoint,
          errorData.method,
          errorData.userAgent,
          errorData.ip,
          JSON.stringify(errorData.tags),
          JSON.stringify({ transactionId: errorData.transactionId })
        ]
      );
      
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to store error in database:', error);
    }
  }

  /**
   * Store aggregated metrics in database
   */
  async storeAggregatedMetrics() {
    try {
      const client = await this.db.getClient();
      
      // Store request metrics
      await client.query(
        `INSERT INTO application_metrics 
         (timestamp, service_name, metric_type, metric_name, metric_value, metric_unit, tags, metadata)
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          new Date(),
          'apm_service',
          'http',
          'total_requests',
          this.metrics.requests.total,
          'count',
          JSON.stringify({ type: 'aggregated' }),
          JSON.stringify({ timeWindow: '30s' })
        ]
      );
      
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to store aggregated metrics:', error);
    }
  }

  /**
   * Maintain transaction history size
   */
  maintainTransactionHistory() {
    const maxTransactions = this.options.maxTransactions;
    
    if (this.completedTransactions.length > maxTransactions) {
      this.completedTransactions = this.completedTransactions.slice(-maxTransactions);
    }
    
    if (this.slowTransactions.length > maxTransactions * 0.1) {
      this.slowTransactions = this.slowTransactions.slice(-Math.floor(maxTransactions * 0.1));
    }
    
    if (this.errorTransactions.length > maxTransactions * 0.1) {
      this.errorTransactions = this.errorTransactions.slice(-Math.floor(maxTransactions * 0.1));
    }
  }

  /**
   * Clean up old data
   */
  cleanupOldData() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean up old active transactions
    for (const [id, transaction] of this.activeTransactions) {
      if (now - transaction.startTime.getTime() > maxAge) {
        this.activeTransactions.delete(id);
        this.logger.warn(`Cleaned up stale active transaction: ${id}`);
      }
    }
    
    this.logger.debug('Cleaned up old APM data');
  }

  /**
   * Initialize performance baselines
   */
  async initializeBaselines() {
    // This would typically load baselines from database
    // For now, set default baselines
    this.baselines.set('response_time', {
      p50: 200,
      p90: 500,
      p95: 1000,
      p99: 2000
    });
    
    this.baselines.set('error_rate', {
      max: 1.0 // 1%
    });
    
    this.baselines.set('apdex', {
      min: 0.85
    });
  }

  /**
   * Extract user ID from request
   */
  extractUserId(req) {
    return req.user?.id || req.headers['x-user-id'] || null;
  }

  /**
   * Extract session ID from request
   */
  extractSessionId(req) {
    return req.sessionID || req.headers['x-session-id'] || null;
  }

  /**
   * Extract tags from request
   */
  extractTags(req) {
    const tags = {};
    
    // Environment
    tags.environment = process.env.NODE_ENV || 'development';
    
    // Service
    tags.service = req.get('X-Service-Name') || 'default';
    
    // Version
    tags.version = req.get('X-Service-Version') || '1.0.0';
    
    // Custom tags from headers
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.startsWith('x-tag-')) {
        tags[key.substring(6)] = value;
      }
    }
    
    return tags;
  }

  /**
   * Calculate request size
   */
  calculateRequestSize(req) {
    // This is a simplified calculation
    const contentLength = parseInt(req.get('Content-Length')) || 0;
    return contentLength;
  }

  /**
   * Calculate response size
   */
  calculateResponseSize(res) {
    // This would need to be captured during the response
    // For now, return 0 as we can't easily determine response size
    return 0;
  }

  /**
   * Get current APM status
   */
  getAPMStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      counters: this.counters,
      activeTransactions: this.activeTransactions.size,
      completedTransactions: this.completedTransactions.length,
      slowTransactions: this.slowTransactions.length,
      errorTransactions: this.errorTransactions.length,
      options: this.options
    };
  }

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId) {
    return this.completedTransactions.find(t => t.id === transactionId) ||
           this.activeTransactions.get(transactionId);
  }

  /**
   * Get transactions within time range
   */
  getTransactions(timeRange = '1h', limit = 100) {
    const timeRangeMs = this.parseTimeRange(timeRange);
    const cutoffTime = Date.now() - timeRangeMs;
    
    return this.completedTransactions
      .filter(t => t.timestamp.getTime() > cutoffTime)
      .slice(-limit);
  }

  /**
   * Parse time range string to milliseconds
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
}

module.exports = { APMService };