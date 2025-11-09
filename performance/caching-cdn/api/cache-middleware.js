const { ResponseCache } = require('./response-cache');
const EventEmitter = require('events');

/**
 * API middleware for automatic response caching and optimization
 */
class APICacheMiddleware extends EventEmitter {
  constructor(cacheManager, options = {}) {
    super();
    
    this.cacheManager = cacheManager;
    this.responseCache = new ResponseCache(cacheManager, options.responseCache || {});
    
    this.options = {
      enableCaching: options.enableCaching !== false,
      enableCompression: options.enableCompression !== false,
      enableRateLimiting: options.enableRateLimiting !== false,
      enableSmartInvalidation: options.enableSmartInvalidation !== false,
      cacheableMethods: options.cacheableMethods || ['GET', 'HEAD'],
      excludePaths: options.excludePaths || [
        '/api/auth',
        '/api/login',
        '/api/logout',
        '/api/admin'
      ],
      includePaths: options.includePaths || [],
      maxCacheSize: options.maxCacheSize || 1000,
      rateLimitWindow: options.rateLimitWindow || 60000, // 1 minute
      rateLimitMax: options.rateLimitMax || 100, // requests per window
      ...options
    };
    
    this.requestTracker = new Map();
    this.responseOptimizers = new Map();
    this.metrics = {
      totalRequests: 0,
      cachedResponses: 0,
      directResponses: 0,
      rateLimitedRequests: 0,
      optimizedResponses: 0,
      averageResponseTime: 0,
      cacheHitRate: 0
    };
    
    this._setupResponseOptimizers();
    this._setupEventHandlers();
  }

  /**
   * Express.js middleware function
   */
  middleware() {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      try {
        // Check rate limiting
        if (this.options.enableRateLimiting) {
          const rateLimitResult = await this._checkRateLimit(req);
          if (!rateLimitResult.allowed) {
            this.metrics.rateLimitedRequests++;
            res.set('X-RateLimit-Limit', rateLimitResult.limit);
            res.set('X-RateLimit-Remaining', rateLimitResult.remaining);
            res.set('X-RateLimit-Reset', rateLimitResult.resetTime);
            return res.status(429).json({
              error: 'Rate limit exceeded',
              resetTime: rateLimitResult.resetTime
            });
          }
        }
        
        // Check if request should be cached
        if (this._shouldCacheRequest(req)) {
          const cachedResponse = await this._handleCachedRequest(req, res);
          if (cachedResponse) {
            this._sendCachedResponse(cachedResponse, res);
            this._updateMetrics('cachedResponses', 1, startTime);
            return;
          }
        }
        
        // Proceed to actual API handler
        await this._handleDirectRequest(req, res, next, startTime);
        
      } catch (error) {
        console.error('API Middleware Error:', error);
        this.emit('middleware_error', { req, error: error.message });
        next(error);
      }
    };
  }

  /**
   * Handle cached request
   */
  async _handleCachedRequest(req, res) {
    const requestKey = this._generateRequestKey(req);
    
    try {
      const cached = await this.responseCache.get(requestKey, req, {
        includeHeaders: true
      });
      
      if (cached) {
        // Handle conditional requests
        if (this._isConditionalRequest(req) && this._isNotModified(req, cached)) {
          res.status(304).end();
          return null;
        }
        
        return cached;
      }
      
      return null;
      
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  /**
   * Handle direct request with caching
   */
  async _handleDirectRequest(req, res, next, startTime) {
    // Wrap original send method to capture response
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);
    
    let responseData = null;
    let responseStatus = 200;
    let responseHeaders = {};
    
    // Intercept response
    res.send = (data) => {
      responseData = data;
      responseStatus = res.statusCode;
      responseHeaders = { ...res.getHeaders() };
      return originalSend(data);
    };
    
    res.json = (data) => {
      responseData = data;
      responseStatus = res.statusCode;
      responseHeaders = { ...res.getHeaders() };
      return originalJson(data);
    };
    
    // Continue to next middleware
    await new Promise((resolve) => {
      next();
      resolve();
    });
    
    // Cache the response if successful
    if (this._shouldCacheResponse(res.statusCode, responseData)) {
      await this._cacheResponse(req, responseData, responseStatus, responseHeaders);
    }
    
    this._updateMetrics('directResponses', 1, startTime);
  }

  /**
   * Send cached response
   */
  _sendCachedResponse(cachedResponse, res) {
    // Set status code
    res.status(cachedResponse.status);
    
    // Set headers
    Object.entries(cachedResponse.headers).forEach(([key, value]) => {
      res.set(key, value);
    });
    
    // Add cache hit header
    res.set('X-Cache', 'HIT');
    res.set('X-Cache-Hit', 'true');
    
    // Send data
    res.send(cachedResponse.data);
  }

  /**
   * Check if request should be cached
   */
  _shouldCacheRequest(req) {
    if (!this.options.enableCaching) return false;
    
    // Check method
    if (!this.options.cacheableMethods.includes(req.method)) {
      return false;
    }
    
    // Check exclude paths
    for (const path of this.options.excludePaths) {
      if (req.path.includes(path)) {
        return false;
      }
    }
    
    // Check include paths (if specified)
    if (this.options.includePaths.length > 0) {
      const shouldInclude = this.options.includePaths.some(path => {
        if (path.endsWith('*')) {
          return req.path.startsWith(path.slice(0, -1));
        }
        return req.path === path;
      });
      
      if (!shouldInclude) return false;
    }
    
    // Skip caching for authenticated requests with user-specific data
    if (req.headers.authorization && this._isUserSpecificEndpoint(req.path)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if response should be cached
   */
  _shouldCacheResponse(statusCode, data) {
    // Only cache successful responses
    if (statusCode < 200 || statusCode >= 300) {
      return false;
    }
    
    // Don't cache empty responses
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return false;
    }
    
    return true;
  }

  /**
   * Cache response
   */
  async _cacheResponse(req, data, statusCode, headers) {
    const requestKey = this._generateRequestKey(req);
    
    try {
      const response = {
        data,
        status: statusCode,
        headers
      };
      
      await this.responseCache.set(requestKey, response, req, {
        ttl: this._calculateCacheTTL(req, statusCode)
      });
      
      this.emit('response_cached', {
        requestKey,
        path: req.path,
        method: req.method,
        statusCode
      });
      
    } catch (error) {
      console.error('Response caching error:', error);
      this.emit('caching_error', { requestKey, error: error.message });
    }
  }

  /**
   * Calculate cache TTL for request
   */
  _calculateCacheTTL(req, statusCode) {
    const path = req.path;
    
    // Static content
    if (path.includes('/static/') || path.includes('/assets/')) {
      return 86400; // 24 hours
    }
    
    // API endpoints
    if (path.includes('/api/')) {
      // Public APIs
      if (path.includes('/public/')) {
        return 3600; // 1 hour
      }
      
      // User-specific APIs
      if (this._isUserSpecificEndpoint(path)) {
        return 1800; // 30 minutes
      }
      
      // Default API
      return 3600; // 1 hour
    }
    
    // Other endpoints
    return 3600; // 1 hour default
  }

  /**
   * Check rate limiting
   */
  async _checkRateLimit(req) {
    const clientIP = this._getClientIP(req);
    const now = Date.now();
    const windowStart = now - this.options.rateLimitWindow;
    
    if (!this.requestTracker.has(clientIP)) {
      this.requestTracker.set(clientIP, []);
    }
    
    const requests = this.requestTracker.get(clientIP);
    
    // Clean old requests
    const recentRequests = requests.filter(time => time > windowStart);
    this.requestTracker.set(clientIP, recentRequests);
    
    if (recentRequests.length >= this.options.rateLimitMax) {
      const resetTime = Math.ceil((recentRequests[0] + this.options.rateLimitWindow) / 1000);
      
      return {
        allowed: false,
        limit: this.options.rateLimitMax,
        remaining: 0,
        resetTime
      };
    }
    
    // Add current request
    recentRequests.push(now);
    
    return {
      allowed: true,
      limit: this.options.rateLimitMax,
      remaining: this.options.rateLimitMax - recentRequests.length,
      resetTime: Math.ceil((now + this.options.rateLimitWindow) / 1000)
    };
  }

  /**
   * Check if request is conditional
   */
  _isConditionalRequest(req) {
    return req.headers['if-none-match'] || req.headers['if-modified-since'];
  }

  /**
   * Check if response is not modified
   */
  _isNotModified(req, cachedResponse) {
    // Check ETag
    if (req.headers['if-none-match'] && cachedResponse.metadata.etag) {
      if (req.headers['if-none-match'] === cachedResponse.metadata.etag) {
        return true;
      }
    }
    
    // Check Last-Modified
    if (req.headers['if-modified-since'] && cachedResponse.metadata.lastModified) {
      const clientTime = new Date(req.headers['if-modified-since']).getTime();
      const cachedTime = new Date(cachedResponse.metadata.lastModified).getTime();
      
      if (cachedTime <= clientTime) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Generate request key for caching
   */
  _generateRequestKey(req) {
    return `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
  }

  /**
   * Get client IP address
   */
  _getClientIP(req) {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           'unknown';
  }

  /**
   * Check if endpoint is user-specific
   */
  _isUserSpecificEndpoint(path) {
    const userSpecificPatterns = [
      '/profile',
      '/dashboard',
      '/account',
      '/settings',
      '/user/'
    ];
    
    return userSpecificPatterns.some(pattern => path.includes(pattern));
  }

  /**
   * Setup response optimizers
   */
  _setupResponseOptimizers() {
    // JSON response optimizer
    this.responseOptimizers.set('json', new JSONResponseOptimizer());
    
    // Large response optimizer
    this.responseOptimizers.set('large', new LargeResponseOptimizer());
    
    // Compression optimizer
    if (this.options.enableCompression) {
      this.responseOptimizers.set('compression', new CompressionOptimizer());
    }
  }

  /**
   * Apply response optimizers
   */
  _applyOptimizers(response) {
    const optimizations = [];
    
    for (const [name, optimizer] of this.responseOptimizers) {
      try {
        const result = optimizer.optimize(response);
        if (result.optimized) {
          optimizations.push({
            optimizer: name,
            originalSize: result.originalSize,
            optimizedSize: result.optimizedSize,
            improvement: result.improvement
          });
        }
      } catch (error) {
        console.error(`Optimizer ${name} error:`, error);
      }
    }
    
    return optimizations;
  }

  /**
   * Setup event handlers
   */
  _setupEventHandlers() {
    this.responseCache.on('cache_hit', (event) => {
      this.emit('api_cache_hit', event);
    });
    
    this.responseCache.on('cache_miss', (event) => {
      this.emit('api_cache_miss', event);
    });
    
    this.responseCache.on('response_cached', (event) => {
      this.emit('api_response_cached', event);
    });
  }

  /**
   * Update metrics
   */
  _updateMetrics(metric, value, startTime) {
    this.metrics[metric] = (this.metrics[metric] || 0) + value;
    
    if (startTime) {
      const responseTime = Date.now() - startTime;
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
    }
  }

  /**
   * Get API middleware statistics
   */
  getStats() {
    const totalRequests = this.metrics.totalRequests;
    const hitRate = totalRequests > 0 
      ? (this.metrics.cachedResponses / totalRequests * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      ...this.metrics,
      hitRate,
      rateLimitStats: this._getRateLimitStats(),
      topEndpoints: this._getTopEndpoints(),
      cacheEfficiency: this._calculateCacheEfficiency()
    };
  }

  /**
   * Get rate limiting statistics
   */
  _getRateLimitStats() {
    const clients = this.requestTracker.size;
    const totalRateLimited = this.metrics.rateLimitedRequests;
    
    return {
      trackedClients: clients,
      totalRateLimited,
      rateLimitPercentage: this.metrics.totalRequests > 0 
        ? (totalRateLimited / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Get top endpoints
   */
  _getTopEndpoints() {
    // This would track endpoint usage
    return [];
  }

  /**
   * Calculate cache efficiency
   */
  _calculateCacheEfficiency() {
    const hitRate = parseFloat(this.metrics.hitRate);
    const responseTimeImprovement = Math.max(0, 100 - (this.metrics.averageResponseTime / 10));
    
    return (hitRate * 0.7 + responseTimeImprovement * 0.3).toFixed(2);
  }

  /**
   * Clear all caches
   */
  async clearCache() {
    await this.responseCache.clear();
    this.requestTracker.clear();
    
    this.emit('cache_cleared');
  }

  /**
   * Invalidate cache for specific patterns
   */
  async invalidateCache(patterns) {
    return await this.responseCache.invalidate(patterns);
  }

  /**
   * Shutdown middleware
   */
  shutdown() {
    this.requestTracker.clear();
    this.responseOptimizers.clear();
  }
}

/**
 * JSON response optimizer
 */
class JSONResponseOptimizer {
  optimize(response) {
    if (typeof response.data !== 'object') {
      return { optimized: false };
    }
    
    const originalSize = JSON.stringify(response.data).length;
    
    // Remove empty fields
    const cleaned = this._removeEmptyFields(response.data);
    const optimizedSize = JSON.stringify(cleaned).length;
    
    if (optimizedSize < originalSize) {
      return {
        optimized: true,
        originalSize,
        optimizedSize,
        improvement: ((originalSize - optimizedSize) / originalSize * 100).toFixed(2) + '%',
        data: cleaned
      };
    }
    
    return { optimized: false };
  }
  
  _removeEmptyFields(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this._removeEmptyFields(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object') {
            const cleanedValue = this._removeEmptyFields(value);
            if (Object.keys(cleanedValue).length > 0) {
              cleaned[key] = cleanedValue;
            }
          } else {
            cleaned[key] = value;
          }
        }
      }
      return cleaned;
    }
    
    return obj;
  }
}

/**
 * Large response optimizer
 */
class LargeResponseOptimizer {
  optimize(response) {
    if (typeof response.data !== 'object' || !Array.isArray(response.data)) {
      return { optimized: false };
    }
    
    const originalSize = JSON.stringify(response.data).length;
    
    // If response is very large, apply pagination-like optimization
    if (originalSize > 1024 * 1024) { // 1MB
      // This is a simplified version - in production you'd implement proper pagination
      const optimized = {
        ...response.data,
        _optimized: true,
        _note: 'Large response optimized for better performance'
      };
      
      return {
        optimized: true,
        originalSize,
        optimizedSize: JSON.stringify(optimized).length,
        improvement: 'Variable',
        data: optimized
      };
    }
    
    return { optimized: false };
  }
}

/**
 * Compression optimizer
 */
class CompressionOptimizer {
  optimize(response) {
    // This would implement actual compression
    // For now, it's a placeholder
    return { optimized: false };
  }
}

module.exports = { APICacheMiddleware };