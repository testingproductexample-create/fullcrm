const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Advanced API response caching with smart invalidation and compression
 */
class ResponseCache extends EventEmitter {
  constructor(cacheManager, options = {}) {
    super();
    
    this.cacheManager = cacheManager;
    this.options = {
      defaultTTL: options.defaultTTL || 3600, // 1 hour
      maxCacheSize: options.maxCacheSize || 1000,
      enableCompression: options.enableCompression !== false,
      enableSmartInvalidation: options.enableSmartInvalidation !== false,
      strategies: options.strategies || ['lru', 'ttl', 'smart'],
      enableEtag: options.enableEtag !== false,
      enableLastModified: options.enableLastModified !== false,
      varyHeaders: options.varyHeaders || ['Accept', 'Accept-Encoding', 'User-Agent'],
      ...options
    };
    
    this.responseCache = new Map();
    this.cacheHeaders = new Map();
    this.invalidationRules = new Map();
    this.compressionEnabled = this.options.enableCompression;
    
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      invalidations: 0,
      averageResponseTime: 0,
      compressionRatio: 0,
      bandwidthSaved: 0
    };
    
    this._setupSmartInvalidation();
  }

  /**
   * Get cached response
   */
  async get(requestKey, request, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Generate cache key
      const cacheKey = this._generateCacheKey(requestKey, request, options);
      
      // Get from cache
      const cached = await this.cacheManager.get(cacheKey, {
        namespace: 'api'
      });
      
      if (cached && this._isResponseValid(cached, request, options)) {
        // Update metrics
        const responseTime = Date.now() - startTime;
        this._updateMetrics('cacheHits', 1);
        this._updateAverageResponseTime(responseTime);
        
        // Add cache headers
        const response = this._buildResponse(cached, {
          includeHeaders: true,
          fromCache: true
        });
        
        this.emit('cache_hit', {
          cacheKey,
          requestKey,
          responseTime,
          hitRate: this._calculateHitRate()
        });
        
        return response;
      }
      
      // Cache miss
      this.metrics.cacheMisses++;
      this.emit('cache_miss', {
        cacheKey,
        requestKey,
        reason: 'not_cached'
      });
      
      return null;
      
    } catch (error) {
      this.emit('error', new Error(`Response cache GET error: ${error.message}`));
      return null;
    }
  }

  /**
   * Set cached response
   */
  async set(requestKey, response, request, options = {}) {
    try {
      const cacheKey = this._generateCacheKey(requestKey, request, options);
      const ttl = options.ttl || this._calculateOptimalTTL(request, response);
      
      // Prepare cache entry
      const cacheEntry = {
        data: response.data || response,
        status: response.status || 200,
        headers: this._prepareHeaders(response.headers || {}),
        cachedAt: Date.now(),
        ttl,
        requestInfo: {
          method: request.method || 'GET',
          url: request.url,
          varyHeaders: this._getVaryHeaders(request)
        },
        etag: this._generateETag(response.data || response),
        lastModified: new Date().toISOString(),
        compressionRatio: this._estimateCompressionRatio(response.data || response)
      };
      
      // Compress if beneficial
      if (this.compressionEnabled && cacheEntry.compressionRatio < 0.8) {
        const compressedData = await this._compress(cacheEntry.data);
        if (compressedData) {
          cacheEntry.data = compressedData;
          cacheEntry.compressed = true;
          cacheEntry.originalSize = JSON.stringify(response.data || response).length;
          cacheEntry.compressedSize = compressedData.length;
        }
      }
      
      // Set in cache
      const result = await this.cacheManager.set(cacheKey, cacheEntry, {
        namespace: 'api',
        ttl,
        tags: this._extractResponseTags(request, response)
      });
      
      if (result) {
        // Update internal tracking
        this.responseCache.set(requestKey, {
          cacheKey,
          cachedAt: Date.now(),
          ttl,
          size: JSON.stringify(cacheEntry).length
        });
        
        this.emit('response_cached', {
          cacheKey,
          requestKey,
          ttl,
          size: cacheEntry.data.length || cacheEntry.data.size,
          compressed: cacheEntry.compressed
        });
      }
      
      return result;
      
    } catch (error) {
      this.emit('error', new Error(`Response cache SET error: ${error.message}`));
      return false;
    }
  }

  /**
   * Invalidate cached responses
   */
  async invalidate(patterns = [], options = {}) {
    const startTime = Date.now();
    let invalidatedCount = 0;
    
    try {
      for (const pattern of patterns) {
        const patternKey = this._buildPatternKey(pattern);
        const deletedKeys = await this.cacheManager.deletePattern(patternKey, {
          namespace: 'api'
        });
        invalidatedCount += deletedKeys;
        
        // Clean up internal tracking
        for (const [requestKey, cacheInfo] of this.responseCache) {
          if (this._matchPattern(requestKey, pattern)) {
            this.responseCache.delete(requestKey);
          }
        }
      }
      
      const duration = Date.now() - startTime;
      this.metrics.invalidations += invalidatedCount;
      
      this.emit('responses_invalidated', {
        patterns,
        invalidatedCount,
        duration
      });
      
      return {
        success: true,
        patterns,
        invalidatedCount,
        duration
      };
      
    } catch (error) {
      this.emit('error', new Error(`Response invalidation error: ${error.message}`));
      throw error;
    }
  }

  /**
   * Invalidate by endpoint
   */
  async invalidateEndpoint(endpoint, options = {}) {
    const pattern = `*${endpoint}*`;
    return await this.invalidate([pattern], options);
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTags(tags, options = {}) {
    if (!Array.isArray(tags)) tags = [tags];
    
    const invalidatedKeys = [];
    
    // This would require tag-based invalidation support in cache manager
    for (const [requestKey, cacheInfo] of this.responseCache) {
      const cached = await this.cacheManager.get(cacheInfo.cacheKey, {
        namespace: 'api'
      });
      
      if (cached && cached.tags) {
        const hasMatchingTag = tags.some(tag => cached.tags.includes(tag));
        if (hasMatchingTag) {
          await this.cacheManager.delete(cacheInfo.cacheKey, {
            namespace: 'api'
          });
          this.responseCache.delete(requestKey);
          invalidatedKeys.push(requestKey);
        }
      }
    }
    
    this.metrics.invalidations += invalidatedKeys.length;
    this.emit('responses_invalidated_by_tags', { tags, invalidatedKeys: invalidatedKeys.length });
    
    return invalidatedKeys;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.metrics.totalRequests;
    const hitRate = totalRequests > 0 
      ? (this.metrics.cacheHits / totalRequests * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      ...this.metrics,
      hitRate,
      cacheSize: this.responseCache.size,
      averageCompressionRatio: this._calculateAverageCompressionRatio(),
      bandwidthSaved: this.metrics.bandwidthSaved,
      topEndpoints: this._getTopEndpoints(10),
      cacheEfficiency: this._calculateCacheEfficiency()
    };
  }

  /**
   * Setup smart invalidation
   */
  _setupSmartInvalidation() {
    if (!this.options.enableSmartInvalidation) return;
    
    // Listen for data changes
    this.on('data_changed', async (event) => {
      await this._handleDataChange(event);
    });
    
    // Setup invalidation rules
    this._setupInvalidationRules();
  }

  /**
   * Setup invalidation rules
   */
  _setupInvalidationRules() {
    // User data changes
    this.addInvalidationRule('user_updated', (cacheKey, event) => {
      return cacheKey.includes('user') || cacheKey.includes('profile');
    });
    
    // Content changes
    this.addInvalidationRule('content_updated', (cacheKey, event) => {
      return cacheKey.includes('content') || cacheKey.includes('article');
    });
    
    // Product changes
    this.addInvalidationRule('product_updated', (cacheKey, event) => {
      return cacheKey.includes('product') || cacheKey.includes('catalog');
    });
  }

  /**
   * Add custom invalidation rule
   */
  addInvalidationRule(name, predicate) {
    this.invalidationRules.set(name, predicate);
  }

  /**
   * Handle data change events
   */
  async _handleDataChange(event) {
    const { type, data, identifier } = event;
    const invalidationRule = this.invalidationRules.get(type);
    
    if (!invalidationRule) return;
    
    const invalidatedKeys = [];
    
    // Find cache entries that should be invalidated
    for (const [requestKey, cacheInfo] of this.responseCache) {
      if (invalidationRule(requestKey, event)) {
        await this.cacheManager.delete(cacheInfo.cacheKey, {
          namespace: 'api'
        });
        this.responseCache.delete(requestKey);
        invalidatedKeys.push(requestKey);
      }
    }
    
    this.emit('smart_invalidation_completed', {
      rule: type,
      data,
      identifier,
      invalidatedKeys: invalidatedKeys.length
    });
  }

  /**
   * Generate cache key for request
   */
  _generateCacheKey(requestKey, request, options = {}) {
    const keyData = {
      base: requestKey,
      method: request.method || 'GET',
      url: this._normalizeUrl(request.url || options.url),
      headers: this._hashHeaders(request.headers, options),
      query: this._normalizeQuery(request.query || options.query),
      vary: this._getVaryHeaders(request)
    };
    
    const keyString = JSON.stringify(keyData);
    return crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);
  }

  /**
   * Normalize URL for consistent caching
   */
  _normalizeUrl(url) {
    if (!url) return '';
    
    return url
      .split('?')[0] // Remove query string
      .replace(/\/+/g, '/') // Normalize slashes
      .replace(/\/$/, '') // Remove trailing slash
      .toLowerCase();
  }

  /**
   * Normalize query parameters
   */
  _normalizeQuery(query) {
    if (!query) return {};
    
    const sorted = {};
    Object.keys(query).sort().forEach(key => {
      sorted[key] = query[key];
    });
    
    return sorted;
  }

  /**
   * Hash relevant headers
   */
  _hashHeaders(headers, options = {}) {
    const varyHeaders = this.options.varyHeaders;
    const relevantHeaders = {};
    
    varyHeaders.forEach(header => {
      if (headers && headers[header]) {
        relevantHeaders[header] = headers[header];
      }
    });
    
    return crypto.createHash('md5')
      .update(JSON.stringify(relevantHeaders))
      .digest('hex');
  }

  /**
   * Get vary headers
   */
  _getVaryHeaders(request) {
    return this.options.varyHeaders.filter(header => 
      request.headers && request.headers[header]
    );
  }

  /**
   * Check if cached response is still valid
   */
  _isResponseValid(cached, request, options = {}) {
    const maxAge = options.maxAge || cached.ttl;
    const age = Date.now() - cached.cachedAt;
    
    if (age > maxAge * 1000) {
      return false;
    }
    
    // Check ETag if client provides one
    if (this.options.enableEtag && request.headers && request.headers['if-none-match']) {
      if (cached.etag === request.headers['if-none-match']) {
        return false; // Not modified
      }
    }
    
    // Check Last-Modified if client provides one
    if (this.options.enableLastModified && request.headers && request.headers['if-modified-since']) {
      const clientTime = new Date(request.headers['if-modified-since']).getTime();
      const cachedTime = new Date(cached.lastModified).getTime();
      
      if (cachedTime <= clientTime) {
        return false; // Not modified
      }
    }
    
    return true;
  }

  /**
   * Build response with cache headers
   */
  _buildResponse(cached, options = {}) {
    const response = {
      data: cached.data,
      status: cached.status,
      headers: cached.headers,
      metadata: {
        cached: true,
        cachedAt: cached.cachedAt,
        etag: cached.etag,
        lastModified: cached.lastModified,
        ...options
      }
    };
    
    if (options.includeHeaders) {
      // Add cache control headers
      response.headers['X-Cache'] = 'HIT';
      response.headers['Cache-Control'] = `max-age=${cached.ttl}`;
      response.headers['ETag'] = cached.etag;
      response.headers['Last-Modified'] = cached.lastModified;
      
      if (cached.compressed) {
        response.headers['Content-Encoding'] = 'gzip';
        response.headers['X-Content-Encoding'] = 'gzip';
      }
    }
    
    return response;
  }

  /**
   * Calculate optimal TTL for response
   */
  _calculateOptimalTTL(request, response) {
    const { method, url } = request;
    const status = response.status || 200;
    
    // Static content: longer cache
    if (url && (url.includes('/static/') || url.includes('/assets/'))) {
      return 86400; // 24 hours
    }
    
    // API endpoints: medium cache
    if (url && url.includes('/api/')) {
      // Read-only endpoints: longer cache
      if (method === 'GET' && status === 200) {
        return 3600; // 1 hour
      }
      // Other methods: shorter cache
      return 300; // 5 minutes
    }
    
    // User-specific content: shorter cache
    if (url && (url.includes('/profile/') || url.includes('/dashboard/'))) {
      return 1800; // 30 minutes
    }
    
    // Default TTL
    return this.options.defaultTTL;
  }

  /**
   * Generate ETag for response
   */
  _generateETag(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('md5').update(dataString).digest('hex');
  }

  /**
   * Prepare headers for caching
   */
  _prepareHeaders(headers) {
    const cacheableHeaders = [
      'content-type',
      'content-length',
      'content-encoding',
      'x-api-version'
    ];
    
    const prepared = {};
    cacheableHeaders.forEach(header => {
      if (headers[header]) {
        prepared[header] = headers[header];
      }
    });
    
    return prepared;
  }

  /**
   * Extract response tags for invalidation
   */
  _extractResponseTags(request, response) {
    const tags = [];
    
    // URL-based tags
    if (request.url) {
      const pathSegments = request.url.split('/').filter(s => s);
      tags.push(...pathSegments.map(segment => `path:${segment}`));
    }
    
    // Method-based tags
    if (request.method) {
      tags.push(`method:${request.method.toLowerCase()}`);
    }
    
    // Status-based tags
    const status = response.status || 200;
    tags.push(`status:${Math.floor(status / 100)}xx`);
    
    return tags;
  }

  /**
   * Estimate compression ratio
   */
  _estimateCompressionRatio(data) {
    const originalSize = JSON.stringify(data).length;
    // Simplified compression estimation
    // In production, use actual compression algorithms
    return originalSize > 1024 ? 0.4 : 1; // 60% reduction for large data
  }

  /**
   * Compress data
   */
  async _compress(data) {
    // Simplified compression - in production use zlib or similar
    if (typeof data === 'string') {
      return data; // Already compressed in this simplified version
    }
    return data;
  }

  /**
   * Build pattern key for invalidation
   */
  _buildPatternKey(pattern) {
    return `api:${pattern}`;
  }

  /**
   * Match pattern
   */
  _matchPattern(str, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(str);
  }

  /**
   * Update metrics
   */
  _updateMetrics(metric, value) {
    if (typeof this.metrics[metric] === 'number') {
      this.metrics[metric] += value;
    }
  }

  /**
   * Update average response time
   */
  _updateAverageResponseTime(responseTime) {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
  }

  /**
   * Calculate hit rate
   */
  _calculateHitRate() {
    const total = this.metrics.totalRequests;
    const hits = this.metrics.cacheHits;
    
    return total > 0 ? (hits / total * 100).toFixed(2) + '%' : '0%';
  }

  /**
   * Calculate average compression ratio
   */
  _calculateAverageCompressionRatio() {
    // This would be calculated from actual compression data
    return this.metrics.compressionRatio.toFixed(2) + '%';
  }

  /**
   * Calculate cache efficiency
   */
  _calculateCacheEfficiency() {
    const hitRate = parseFloat(this._calculateHitRate());
    const efficiency = hitRate * 0.7 + (this.metrics.bandwidthSaved / 1000) * 0.3;
    return efficiency.toFixed(2);
  }

  /**
   * Get top endpoints
   */
  _getTopEndpoints(limit = 10) {
    return Array.from(this.responseCache.entries())
      .slice(0, limit)
      .map(([key, info]) => ({
        endpoint: key,
        cachedAt: info.cachedAt,
        size: info.size
      }));
  }

  /**
   * Clear all cached responses
   */
  async clear() {
    await this.cacheManager.deletePattern('api:*', { namespace: 'api' });
    this.responseCache.clear();
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      invalidations: 0,
      averageResponseTime: 0,
      compressionRatio: 0,
      bandwidthSaved: 0
    };
    
    this.emit('cache_cleared');
  }
}

module.exports = { ResponseCache };