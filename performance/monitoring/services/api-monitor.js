/**
 * API Performance Monitoring Service
 * Tracks API performance, usage patterns, rate limiting, and analytics
 */

const { EventEmitter } = require('events');
const { Logger } = require('../utilities/logger');
const { DatabaseConnection } = require('../utilities/database-connection');
const { AlertingService } = require('./alerting-service');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const { RateLimiterMemory } = require('rate-limiter-flexible');

class APIMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      rateLimitWindow: options.rateLimitWindow || 60000, // 1 minute
      rateLimitMax: options.rateLimitMax || 100, // requests per window
      enableDetailedMetrics: options.enableDetailedMetrics !== false,
      enableRateLimiting: options.enableRateLimiting !== false,
      enableUserTracking: options.enableUserTracking !== false,
      enableEndpointAnalytics: options.enableEndpointAnalytics !== false,
      maxRequestsPerEndpoint: options.maxRequestsPerEndpoint || 10000,
      collectionInterval: options.collectionInterval || 15000, // 15 seconds
      enableUsageAnalytics: options.enableUsageAnalytics !== false,
      enablePerformanceAlerts: options.enablePerformanceAlerts !== false,
      ...options
    };

    this.isRunning = false;
    this.logger = new Logger('APIMonitor');
    this.db = null;
    this.alertingService = null;
    
    // API metrics
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
      throughput: {
        requestsPerSecond: 0,
        bytesPerSecond: 0,
        peakRPS: 0
      },
      errors: {
        total: 0,
        byStatus: {},
        byEndpoint: {},
        byMethod: {}
      },
      rateLimit: {
        requests: 0,
        hits: 0,
        remaining: 0,
        resetTime: null
      },
      endpoints: new Map(), // endpoint -> metrics
      users: new Map(), // userId -> metrics
      methods: new Map(), // method -> metrics
      statusCodes: new Map(), // statusCode -> count
      responseTimeHistory: [],
      errorRate: 0,
      availability: 100
    };
    
    // Request tracking
    this.requestHistory = [];
    this.recentRequests = []; // Last 1000 requests
    this.slowRequests = [];
    this.errorRequests = [];
    this.rateLimitedRequests = [];
    
    // Rate limiting
    this.rateLimiters = new Map();
    this.endpointRateLimiters = new Map();
    this.userRateLimiters = new Map();
    
    // Analytics
    this.analytics = {
      topEndpoints: [],
      topUsers: [],
      trafficPatterns: new Map(), // hour -> request count
      errorPatterns: new Map(),
      performancePatterns: new Map(),
      usageTrends: new Map()
    };
    
    // Statistics
    this.counters = {
      requestsMonitored: 0,
      requestsRateLimited: 0,
      slowRequestsTracked: 0,
      errorRequestsTracked: 0,
      analyticsGenerated: 0,
      alertsTriggered: 0
    };
    
    // Performance thresholds
    this.thresholds = {
      responseTime: 2000, // 2 seconds
      errorRate: 5, // 5%
      rateLimitHitRate: 10, // 10%
      throughputDrop: 50, // 50% drop
      slowRequestPercentage: 20 // 20% slow requests
    };
    
    // Start time
    this.startTime = Date.now();
    this.lastAnalyticsUpdate = Date.now();
    this.lastThroughputCalculation = Date.now();
  }

  /**
   * Initialize the API monitor
   */
  async initialize() {
    try {
      this.logger.info('Initializing API Monitor...');
      
      // Initialize database connection
      this.db = new DatabaseConnection();
      await this.db.connect();
      
      // Initialize alerting service
      this.alertingService = new AlertingService();
      await this.alertingService.initialize();
      
      // Initialize rate limiters
      this.initializeRateLimiters();
      
      // Load historical analytics
      if (this.options.enableUsageAnalytics) {
        await this.loadHistoricalAnalytics();
      }
      
      this.logger.info('API Monitor initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize API Monitor:', error);
      throw error;
    }
  }

  /**
   * Start the API monitor
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('API Monitor is already running');
      return;
    }

    try {
      await this.initialize();
      
      this.isRunning = true;
      this.logger.info('API Monitor started');
      
      // Start metrics collection interval
      this.collectionInterval = setInterval(() => {
        this.collectMetrics();
      }, this.options.collectionInterval);
      
      // Start throughput calculation interval
      this.throughputInterval = setInterval(() => {
        this.calculateThroughput();
      }, 10000); // Every 10 seconds
      
      // Start analytics generation interval
      if (this.options.enableUsageAnalytics) {
        this.analyticsInterval = setInterval(() => {
          this.generateAnalytics();
        }, 60000); // Every minute
      }
      
      // Start cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldData();
      }, 300000); // Every 5 minutes
      
      this.emit('started', {
        timestamp: new Date().toISOString(),
        options: this.options
      });
      
    } catch (error) {
      this.logger.error('Failed to start API Monitor:', error);
      throw error;
    }
  }

  /**
   * Stop the API monitor
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear intervals
    for (const interval of [
      this.collectionInterval,
      this.throughputInterval,
      this.analyticsInterval,
      this.cleanupInterval
    ]) {
      if (interval) clearInterval(interval);
    }
    
    this.logger.info('API Monitor stopped');
    
    this.emit('stopped', {
      timestamp: new Date().toISOString(),
      counters: this.counters
    });
  }

  /**
   * Create Express middleware for API monitoring
   */
  createMiddleware() {
    return async (req, res, next) => {
      const startTime = process.hrtime.bigint();
      const requestId = uuidv4();
      
      // Add request tracking info
      req.apiMonitor = {
        requestId,
        startTime,
        userId: this.extractUserId(req),
        endpoint: req.route?.path || req.path,
        method: req.method
      };
      
      // Check rate limits
      if (this.options.enableRateLimiting) {
        const rateLimitResult = await this.checkRateLimits(req);
        if (!rateLimitResult.allowed) {
          return this.handleRateLimitExceeded(req, res, rateLimitResult);
        }
      }
      
      // Track active request
      this.trackActiveRequest({
        id: requestId,
        method: req.method,
        endpoint: req.apiMonitor.endpoint,
        userId: req.apiMonitor.userId,
        startTime: new Date(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      // Override res.end to capture response
      const originalEnd = res.end;
      res.end = (...args) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        this.completeRequest({
          requestId,
          method: req.method,
          endpoint: req.apiMonitor.endpoint,
          statusCode: res.statusCode,
          duration,
          startTime: new Date(),
          userId: req.apiMonitor.userId,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestSize: this.calculateRequestSize(req),
          responseSize: this.calculateResponseSize(res),
          headers: req.headers,
          query: req.query,
          body: req.body
        });
        
        return originalEnd.apply(res, args);
      };
      
      next();
    };
  }

  /**
   * Track a complete request
   */
  completeRequest(requestData) {
    try {
      // Remove from active requests tracking
      this.removeActiveRequest(requestData.requestId);
      
      // Create request record
      const request = {
        id: requestData.requestId,
        timestamp: requestData.startTime,
        method: requestData.method,
        endpoint: requestData.endpoint,
        statusCode: requestData.statusCode,
        duration: requestData.duration,
        userId: requestData.userId,
        ip: requestData.ip,
        userAgent: requestData.userAgent,
        requestSize: requestData.requestSize,
        responseSize: requestData.responseSize,
        headers: requestData.headers,
        query: requestData.query,
        body: requestData.body,
        success: requestData.statusCode < 400,
        isSlow: requestData.duration > this.thresholds.responseTime,
        isError: requestData.statusCode >= 400
      };
      
      // Add to recent requests
      this.recentRequests.push(request);
      
      // Track slow requests
      if (request.isSlow) {
        this.slowRequests.push(request);
        this.counters.slowRequestsTracked++;
        
        this.emit('slowRequest', request);
      }
      
      // Track error requests
      if (request.isError) {
        this.errorRequests.push(request);
        this.counters.errorRequestsTracked++;
        
        this.emit('error', request);
      }
      
      // Update metrics
      this.updateRequestMetrics(request);
      
      // Store in database
      if (this.db) {
        this.storeRequestInDatabase(request);
      }
      
      // Check for performance alerts
      if (this.options.enablePerformanceAlerts) {
        this.checkPerformanceAlerts(request);
      }
      
      this.counters.requestsMonitored++;
      
      // Emit request event
      this.emit('request', request);
      
      // Keep request lists manageable
      this.maintainRequestHistory();
      
    } catch (error) {
      this.logger.error('Error completing request:', error);
    }
  }

  /**
   * Update request metrics
   */
  updateRequestMetrics(request) {
    const metrics = this.metrics;
    
    // Overall request metrics
    metrics.requests.total++;
    
    if (request.success) {
      metrics.requests.successful++;
    } else {
      metrics.requests.failed++;
    }
    
    // Response time metrics
    metrics.requests.minResponseTime = Math.min(metrics.requests.minResponseTime, request.duration);
    metrics.requests.maxResponseTime = Math.max(metrics.requests.maxResponseTime, request.duration);
    
    // Calculate running average
    metrics.requests.averageResponseTime = (
      (metrics.requests.averageResponseTime * (metrics.requests.total - 1) + request.duration) /
      metrics.requests.total
    );
    
    // Error metrics
    if (!request.success) {
      metrics.errors.total++;
      metrics.errors.byStatus[request.statusCode] = (metrics.errors.byStatus[request.statusCode] || 0) + 1;
      metrics.errors.byEndpoint[request.endpoint] = (metrics.errors.byEndpoint[request.endpoint] || 0) + 1;
      metrics.errors.byMethod[request.method] = (metrics.errors.byMethod[request.method] || 0) + 1;
    }
    
    // Calculate error rate
    this.metrics.errorRate = (metrics.errors.total / metrics.requests.total) * 100;
    
    // Calculate percentiles
    this.calculateResponseTimePercentiles();
    
    // Update endpoint-specific metrics
    this.updateEndpointMetrics(request);
    
    // Update user-specific metrics
    if (request.userId && this.options.enableUserTracking) {
      this.updateUserMetrics(request);
    }
    
    // Update method-specific metrics
    this.updateMethodMetrics(request);
  }

  /**
   * Calculate response time percentiles
   */
  calculateResponseTimePercentiles() {
    if (this.recentRequests.length < 10) {
      return; // Need more samples
    }
    
    const responseTimes = this.recentRequests
      .slice(-1000) // Use last 1000 requests
      .map(r => r.duration)
      .sort((a, b) => a - b);
    
    const percentiles = [50, 90, 95, 99];
    
    percentiles.forEach(p => {
      const index = Math.ceil((p / 100) * responseTimes.length) - 1;
      const percentileKey = `p${p}`;
      this.metrics.requests[percentileKey] = responseTimes[Math.max(0, index)];
    });
  }

  /**
   * Update endpoint-specific metrics
   */
  updateEndpointMetrics(request) {
    const endpoint = request.endpoint;
    
    if (!this.metrics.endpoints.has(endpoint)) {
      this.metrics.endpoints.set(endpoint, {
        endpoint,
        requests: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        lastAccessed: request.timestamp,
        methods: new Map(),
        statusCodes: new Map()
      });
    }
    
    const endpointMetrics = this.metrics.endpoints.get(endpoint);
    endpointMetrics.requests++;
    endpointMetrics.lastAccessed = request.timestamp;
    
    if (request.success) {
      endpointMetrics.successful++;
    } else {
      endpointMetrics.failed++;
    }
    
    // Update response time metrics
    endpointMetrics.minResponseTime = Math.min(endpointMetrics.minResponseTime, request.duration);
    endpointMetrics.maxResponseTime = Math.max(endpointMetrics.maxResponseTime, request.duration);
    endpointMetrics.averageResponseTime = (
      (endpointMetrics.averageResponseTime * (endpointMetrics.requests - 1) + request.duration) /
      endpointMetrics.requests
    );
    
    // Update method-specific stats
    const methodCount = endpointMetrics.methods.get(request.method) || 0;
    endpointMetrics.methods.set(request.method, methodCount + 1);
    
    // Update status code stats
    const statusCount = endpointMetrics.statusCodes.get(request.statusCode) || 0;
    endpointMetrics.statusCodes.set(request.statusCode, statusCount + 1);
  }

  /**
   * Update user-specific metrics
   */
  updateUserMetrics(request) {
    const userId = request.userId;
    
    if (!this.metrics.users.has(userId)) {
      this.metrics.users.set(userId, {
        userId,
        requests: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        lastActive: request.timestamp,
        endpoints: new Set(),
        methods: new Set()
      });
    }
    
    const userMetrics = this.metrics.users.get(userId);
    userMetrics.requests++;
    userMetrics.lastActive = request.timestamp;
    
    if (request.success) {
      userMetrics.successful++;
    } else {
      userMetrics.failed++;
    }
    
    userMetrics.endpoints.add(request.endpoint);
    userMetrics.methods.add(request.method);
    
    // Update response time metrics
    userMetrics.averageResponseTime = (
      (userMetrics.averageResponseTime * (userMetrics.requests - 1) + request.duration) /
      userMetrics.requests
    );
  }

  /**
   * Update method-specific metrics
   */
  updateMethodMetrics(request) {
    const method = request.method;
    
    if (!this.metrics.methods.has(method)) {
      this.metrics.methods.set(method, {
        method,
        requests: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        endpoints: new Set()
      });
    }
    
    const methodMetrics = this.metrics.methods.get(method);
    methodMetrics.requests++;
    
    if (request.success) {
      methodMetrics.successful++;
    } else {
      methodMetrics.failed++;
    }
    
    methodMetrics.endpoints.add(request.endpoint);
    
    // Update response time metrics
    methodMetrics.averageResponseTime = (
      (methodMetrics.averageResponseTime * (methodMetrics.requests - 1) + request.duration) /
      methodMetrics.requests
    );
  }

  /**
   * Calculate throughput metrics
   */
  calculateThroughput() {
    const now = Date.now();
    const timeDelta = (now - this.lastThroughputCalculation) / 1000; // seconds
    
    if (timeDelta <= 0) return;
    
    const recentRequests = this.recentRequests.filter(
      r => r.timestamp.getTime() > this.lastThroughputCalculation
    );
    
    const requestsPerSecond = recentRequests.length / timeDelta;
    const bytesPerSecond = recentRequests.reduce(
      (sum, r) => sum + (r.requestSize || 0) + (r.responseSize || 0), 0
    ) / timeDelta;
    
    this.metrics.throughput.requestsPerSecond = requestsPerSecond;
    this.metrics.throughput.bytesPerSecond = bytesPerSecond;
    this.metrics.throughput.peakRPS = Math.max(this.metrics.throughput.peakRPS, requestsPerSecond);
    
    this.lastThroughputCalculation = now;
  }

  /**
   * Initialize rate limiters
   */
  initializeRateLimiters() {
    // Global rate limiter
    this.globalRateLimiter = new RateLimiterMemory({
      keyGenerator: (req) => req.ip,
      points: this.options.rateLimitMax,
      duration: this.options.rateLimitWindow / 1000, // Convert to seconds
    });
    
    // Endpoint-specific rate limiters will be created on demand
    // User-specific rate limiters will be created on demand
  }

  /**
   * Check rate limits for a request
   */
  async checkRateLimits(req) {
    try {
      const ip = req.ip;
      const userId = this.extractUserId(req);
      const endpoint = req.route?.path || req.path;
      
      // Check global rate limit
      try {
        const globalRes = await this.globalRateLimiter.consume(ip, 1);
        
        // Update rate limit metrics
        this.metrics.rateLimit.requests++;
        this.metrics.rateLimit.remaining = globalRes.remainingPoints;
        this.metrics.rateLimit.resetTime = new Date(Date.now() + globalRes.msBeforeNext);
        
        return { allowed: true, remaining: globalRes.remainingPoints };
      } catch (rateLimiterRes) {
        // Rate limit exceeded
        this.metrics.rateLimit.hits++;
        this.counters.requestsRateLimited++;
        
        this.emit('rateLimitExceeded', {
          ip,
          userId,
          endpoint,
          resetTime: new Date(Date.now() + rateLimiterRes.msBeforeNext),
          remainingPoints: rateLimiterRes.remainingPoints
        });
        
        return { 
          allowed: false, 
          remaining: rateLimiterRes.remainingPoints,
          resetTime: new Date(Date.now() + rateLimiterRes.msBeforeNext)
        };
      }
      
    } catch (error) {
      this.logger.error('Error checking rate limits:', error);
      return { allowed: true }; // Allow request on error
    }
  }

  /**
   * Handle rate limit exceeded
   */
  handleRateLimitExceeded(req, res, rateLimitResult) {
    this.counters.requestsRateLimited++;
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': this.options.rateLimitMax,
      'X-RateLimit-Remaining': rateLimitResult.remaining || 0,
      'X-RateLimit-Reset': rateLimitResult.resetTime ? Math.floor(rateLimitResult.resetTime.getTime() / 1000) : null
    });
    
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests',
      retryAfter: rateLimitResult.resetTime 
        ? Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)
        : this.options.rateLimitWindow / 1000
    });
    
    // Track rate limited request
    const rateLimitedRequest = {
      id: uuidv4(),
      timestamp: new Date(),
      method: req.method,
      endpoint: req.apiMonitor?.endpoint || req.path,
      ip: req.ip,
      userId: req.apiMonitor?.userId,
      userAgent: req.get('User-Agent'),
      resetTime: rateLimitResult.resetTime
    };
    
    this.rateLimitedRequests.push(rateLimitedRequest);
    this.emit('rateLimited', rateLimitedRequest);
  }

  /**
   * Check for performance alerts
   */
  async checkPerformanceAlerts(request) {
    try {
      const alerts = [];
      
      // High error rate alert
      if (this.metrics.errorRate > this.thresholds.errorRate) {
        alerts.push({
          rule: 'high_api_error_rate',
          metric: 'api_error_rate',
          value: this.metrics.errorRate,
          threshold: this.thresholds.errorRate,
          severity: this.metrics.errorRate > 10 ? 'critical' : 'warning'
        });
      }
      
      // Slow response time alert
      if (request.duration > this.thresholds.responseTime) {
        alerts.push({
          rule: 'slow_api_response_time',
          metric: 'api_response_time',
          value: request.duration,
          threshold: this.thresholds.responseTime,
          severity: request.duration > this.thresholds.responseTime * 2 ? 'critical' : 'warning'
        });
      }
      
      // High slow request percentage
      const slowRequestPercentage = (this.slowRequests.length / this.metrics.requests.total) * 100;
      if (slowRequestPercentage > this.thresholds.slowRequestPercentage) {
        alerts.push({
          rule: 'high_slow_request_percentage',
          metric: 'slow_request_percentage',
          value: slowRequestPercentage,
          threshold: this.thresholds.slowRequestPercentage,
          severity: 'warning'
        });
      }
      
      // High rate limit hit rate
      const rateLimitHitRate = (this.metrics.rateLimit.hits / this.metrics.requests.total) * 100;
      if (rateLimitHitRate > this.thresholds.rateLimitHitRate) {
        alerts.push({
          rule: 'high_rate_limit_hit_rate',
          metric: 'rate_limit_hit_rate',
          value: rateLimitHitRate,
          threshold: this.thresholds.rateLimitHitRate,
          severity: 'warning'
        });
      }
      
      // Trigger alerts
      for (const alert of alerts) {
        this.counters.alertsTriggered++;
        this.emit('alert', {
          ...alert,
          timestamp: new Date(),
          source: 'api_monitor',
          context: {
            endpoint: request.endpoint,
            method: request.method,
            statusCode: request.statusCode
          }
        });
        
        if (this.alertingService) {
          await this.alertingService.triggerAlert(alert);
        }
      }
      
    } catch (error) {
      this.logger.error('Error checking performance alerts:', error);
    }
  }

  /**
   * Generate analytics
   */
  generateAnalytics() {
    try {
      // Generate top endpoints
      this.analytics.topEndpoints = Array.from(this.metrics.endpoints.entries())
        .sort((a, b) => b[1].requests - a[1].requests)
        .slice(0, 10)
        .map(([endpoint, metrics]) => ({
          endpoint,
          requests: metrics.requests,
          successful: metrics.successful,
          failed: metrics.failed,
          averageResponseTime: metrics.averageResponseTime
        }));
      
      // Generate top users
      if (this.options.enableUserTracking) {
        this.analytics.topUsers = Array.from(this.metrics.users.entries())
          .sort((a, b) => b[1].requests - a[1].requests)
          .slice(0, 10)
          .map(([userId, metrics]) => ({
            userId,
            requests: metrics.requests,
            successful: metrics.successful,
            failed: metrics.failed,
            lastActive: metrics.lastActive
          }));
      }
      
      // Generate traffic patterns
      const now = new Date();
      const currentHour = now.getHours();
      const hourCount = this.analytics.trafficPatterns.get(currentHour) || 0;
      this.analytics.trafficPatterns.set(currentHour, hourCount + this.metrics.requests.total);
      
      this.counters.analyticsGenerated++;
      this.lastAnalyticsUpdate = now;
      
      // Emit analytics event
      this.emit('analytics', {
        timestamp: now,
        analytics: this.analytics
      });
      
    } catch (error) {
      this.logger.error('Error generating analytics:', error);
    }
  }

  /**
   * Store request in database
   */
  async storeRequestInDatabase(request) {
    try {
      const client = await this.db.getClient();
      
      await client.query(
        `INSERT INTO api_metrics 
         (timestamp, api_name, endpoint, method, metric_type, metric_name, metric_value, metric_unit, 
          status_code, response_time_ms, request_size_bytes, response_size_bytes, user_agent, 
          ip_address, rate_limit_remaining, tags, metadata)
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          request.timestamp,
          'api_monitor',
          request.endpoint,
          request.method,
          'request',
          'api_request',
          1,
          'count',
          request.statusCode,
          request.duration,
          request.requestSize || 0,
          request.responseSize || 0,
          request.userAgent,
          request.ip,
          this.metrics.rateLimit.remaining,
          JSON.stringify({
            userId: request.userId,
            success: request.success,
            isSlow: request.isSlow,
            isError: request.isError
          }),
          JSON.stringify({
            query: request.query,
            body: request.body ? '[REDACTED]' : null
          })
        ]
      );
      
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to store request in database:', error);
    }
  }

  /**
   * Collect metrics periodically
   */
  collectMetrics() {
    try {
      // Update availability metric
      const uptime = Date.now() - this.startTime;
      this.metrics.availability = ((this.metrics.requests.successful / this.metrics.requests.total) * 100) || 100;
      
      // Store aggregated metrics in database
      if (this.db) {
        this.storeAggregatedMetrics();
      }
      
      // Emit metrics event
      this.emit('metrics', {
        timestamp: new Date(),
        metrics: this.metrics,
        analytics: this.analytics
      });
      
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
    }
  }

  /**
   * Store aggregated metrics in database
   */
  async storeAggregatedMetrics() {
    try {
      const client = await this.db.getClient();
      
      // Store throughput metrics
      await client.query(
        `INSERT INTO api_metrics 
         (timestamp, api_name, endpoint, method, metric_type, metric_name, metric_value, metric_unit, tags)
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          new Date(),
          'api_monitor',
          'global',
          'ALL',
          'throughput',
          'requests_per_second',
          this.metrics.throughput.requestsPerSecond,
          'requests_per_second',
          JSON.stringify({ type: 'aggregated' })
        ]
      );
      
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to store aggregated metrics:', error);
    }
  }

  /**
   * Track active request
   */
  trackActiveRequest(requestData) {
    // This would track active requests for monitoring
    // For now, just emit an event
    this.emit('activeRequest', requestData);
  }

  /**
   * Remove active request
   */
  removeActiveRequest(requestId) {
    // This would remove the request from active tracking
    this.emit('activeRequestCompleted', { requestId });
  }

  /**
   * Maintain request history size
   */
  maintainRequestHistory() {
    const maxRecentRequests = 1000;
    const maxSlowRequests = 100;
    const maxErrorRequests = 100;
    const maxRateLimitedRequests = 100;
    
    // Maintain recent requests
    if (this.recentRequests.length > maxRecentRequests) {
      this.recentRequests = this.recentRequests.slice(-maxRecentRequests);
    }
    
    // Maintain slow requests
    if (this.slowRequests.length > maxSlowRequests) {
      this.slowRequests = this.slowRequests.slice(-maxSlowRequests);
    }
    
    // Maintain error requests
    if (this.errorRequests.length > maxErrorRequests) {
      this.errorRequests = this.errorRequests.slice(-maxErrorRequests);
    }
    
    // Maintain rate limited requests
    if (this.rateLimitedRequests.length > maxRateLimitedRequests) {
      this.rateLimitedRequests = this.rateLimitedRequests.slice(-maxRateLimitedRequests);
    }
  }

  /**
   * Clean up old data
   */
  cleanupOldData() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    const cutoff = Date.now() - maxAge;
    
    // Clean up old request history
    this.requestHistory = this.requestHistory.filter(
      request => request.timestamp.getTime() > cutoff
    );
    
    this.logger.debug('Cleaned up old API monitoring data');
  }

  /**
   * Load historical analytics
   */
  async loadHistoricalAnalytics() {
    try {
      // This would load historical data from database
      // For now, just initialize with empty data
      this.analytics.trafficPatterns.set(0, 0);
      
    } catch (error) {
      this.logger.error('Failed to load historical analytics:', error);
    }
  }

  /**
   * Extract user ID from request
   */
  extractUserId(req) {
    return req.user?.id || req.headers['x-user-id'] || req.headers['authorization']?.split(' ')[1] || null;
  }

  /**
   * Calculate request size
   */
  calculateRequestSize(req) {
    const contentLength = parseInt(req.get('Content-Length')) || 0;
    return contentLength;
  }

  /**
   * Calculate response size
   */
  calculateResponseSize(res) {
    // This would need to be captured during the response
    // For now, return 0
    return 0;
  }

  /**
   * Get current API monitor status
   */
  getAPIMonitorStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date().toISOString(),
      metrics: {
        ...this.metrics,
        endpoints: Object.fromEntries(this.metrics.endpoints),
        users: Object.fromEntries(this.metrics.users),
        methods: Object.fromEntries(this.metrics.methods)
      },
      analytics: {
        ...this.analytics,
        trafficPatterns: Object.fromEntries(this.analytics.trafficPatterns)
      },
      counters: this.counters,
      activeRequests: this.recentRequests.filter(r => 
        Date.now() - r.timestamp.getTime() < 30000 // Last 30 seconds
      ).length
    };
  }

  /**
   * Get endpoint analytics
   */
  getEndpointAnalytics(endpoint) {
    const endpointMetrics = this.metrics.endpoints.get(endpoint);
    if (!endpointMetrics) {
      return null;
    }
    
    return {
      endpoint,
      metrics: endpointMetrics,
      recentRequests: this.recentRequests.filter(r => r.endpoint === endpoint).slice(-10)
    };
  }

  /**
   * Get user analytics
   */
  getUserAnalytics(userId) {
    const userMetrics = this.metrics.users.get(userId);
    if (!userMetrics) {
      return null;
    }
    
    return {
      userId,
      metrics: userMetrics,
      recentRequests: this.recentRequests.filter(r => r.userId === userId).slice(-10)
    };
  }
}

module.exports = { APIMonitor };