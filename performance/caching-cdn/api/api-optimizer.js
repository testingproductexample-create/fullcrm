const EventEmitter = require('events');

/**
 * Advanced API response optimizer for performance and bandwidth optimization
 */
class APIOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableCompression: options.enableCompression !== false,
      enableMinification: options.enableMinification !== false,
      enableLazyLoading: options.enableLazyLoading !== false,
      enableFieldFiltering: options.enableFieldFiltering !== false,
      enableResponseChunking: options.enableResponseChunking !== false,
      compressionThreshold: options.compressionThreshold || 1024, // 1KB
      maxResponseSize: options.maxResponseSize || 10 * 1024 * 1024, // 10MB
      chunkSize: options.chunkSize || 64 * 1024, // 64KB
      ...options
    };
    
    this.optimizationRules = new Map();
    this.fieldFilters = new Map();
    this.compressionEngine = new CompressionEngine();
    this.performanceTracker = new PerformanceTracker();
    
    this.metrics = {
      totalOptimizations: 0,
      totalBytesOptimized: 0,
      compressionRatio: 0,
      minificationRatio: 0,
      lazyLoadingHits: 0,
      fieldFilteringSavings: 0,
      averageOptimizationTime: 0
    };
    
    this._setupOptimizationRules();
  }

  /**
   * Optimize API response
   */
  async optimizeResponse(response, context = {}) {
    const startTime = Date.now();
    const optimizations = [];
    
    try {
      const { request, endpoint, user } = context;
      
      // 1. Compress response if beneficial
      if (this.options.enableCompression) {
        const compressionResult = await this._optimizeCompression(response, request);
        if (compressionResult.optimized) {
          optimizations.push(compressionResult);
          this.metrics.totalBytesOptimized += compressionResult.bytesSaved;
        }
      }
      
      // 2. Minify JSON response
      if (this.options.enableMinification && this._shouldMinify(response)) {
        const minificationResult = await this._optimizeMinification(response, request);
        if (minificationResult.optimized) {
          optimizations.push(minificationResult);
          this.metrics.minificationRatio += minificationResult.savings;
        }
      }
      
      // 3. Apply field filtering
      if (this.options.enableFieldFiltering) {
        const filteringResult = await this._optimizeFieldFiltering(response, request, user);
        if (filteringResult.optimized) {
          optimizations.push(filteringResult);
          this.metrics.fieldFilteringSavings += filteringResult.savings;
        }
      }
      
      // 4. Apply lazy loading for large responses
      if (this.options.enableLazyLoading && this._shouldLazyLoad(response)) {
        const lazyResult = await this._optimizeLazyLoading(response, request, context);
        if (lazyResult.optimized) {
          optimizations.push(lazyResult);
          this.metrics.lazyLoadingHits++;
        }
      }
      
      // 5. Apply response chunking
      if (this.options.enableResponseChunking && this._shouldChunk(response)) {
        const chunkingResult = await this._optimizeChunking(response, request);
        if (chunkingResult.optimized) {
          optimizations.push(chunkingResult);
        }
      }
      
      // 6. Apply custom optimization rules
      const customOptimizations = await this._applyCustomRules(response, context);
      optimizations.push(...customOptimizations);
      
      const optimizationTime = Date.now() - startTime;
      this._updateOptimizationMetrics(optimizationTime, optimizations.length);
      
      this.emit('response_optimized', {
        endpoint,
        optimizations,
        optimizationTime,
        originalSize: response.data ? JSON.stringify(response.data).length : 0
      });
      
      return {
        response,
        optimizations,
        metadata: {
          optimized: optimizations.length > 0,
          optimizationTime,
          totalSavings: optimizations.reduce((sum, opt) => sum + (opt.bytesSaved || 0), 0)
        }
      };
      
    } catch (error) {
      this.emit('optimization_error', {
        endpoint: context.endpoint,
        error: error.message
      });
      
      // Return original response on error
      return {
        response,
        optimizations: [],
        metadata: {
          optimized: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Setup optimization rules
   */
  _setupOptimizationRules() {
    // User profile optimization
    this.addOptimizationRule('user_profile', (response, context) => {
      if (context.endpoint?.includes('profile') || context.endpoint?.includes('user')) {
        return {
          priority: 'high',
          fields: ['id', 'name', 'email', 'avatar'],
          exclude: ['password', 'privateData', 'internalFields']
        };
      }
      return null;
    });
    
    // List responses optimization
    this.addOptimizationRule('list_response', (response, context) => {
      if (response.data && Array.isArray(response.data)) {
        return {
          priority: 'medium',
          limitFields: true,
          excludeFields: ['description', 'metadata', 'tags']
        };
      }
      return null;
    });
    
    // Search results optimization
    this.addOptimizationRule('search_results', (response, context) => {
      if (context.endpoint?.includes('search')) {
        return {
          priority: 'high',
          limit: 20,
          fields: ['id', 'title', 'score', 'summary']
        };
      }
      return null;
    });
  }

  /**
   * Add custom optimization rule
   */
  addOptimizationRule(name, rule) {
    this.optimizationRules.set(name, rule);
  }

  /**
   * Add field filter
   */
  addFieldFilter(endpoint, filter) {
    if (!this.fieldFilters.has(endpoint)) {
      this.fieldFilters.set(endpoint, []);
    }
    this.fieldFilters.get(endpoint).push(filter);
  }

  /**
   * Optimize compression
   */
  async _optimizeCompression(response, request) {
    const data = response.data;
    if (!data || typeof data !== 'object') {
      return { optimized: false };
    }
    
    const originalSize = JSON.stringify(data).length;
    
    // Only compress if above threshold
    if (originalSize < this.options.compressionThreshold) {
      return { optimized: false };
    }
    
    try {
      const compressed = await this.compressionEngine.compress(data, request.headers);
      
      if (compressed && compressed.length < originalSize) {
        const bytesSaved = originalSize - compressed.length;
        const compressionRatio = (bytesSaved / originalSize * 100).toFixed(2);
        
        return {
          optimized: true,
          type: 'compression',
          originalSize,
          optimizedSize: compressed.length,
          bytesSaved,
          compressionRatio: compressionRatio + '%',
          data: compressed,
          headers: {
            'Content-Encoding': 'gzip',
            'X-Original-Size': originalSize,
            'X-Compressed': 'true'
          }
        };
      }
      
    } catch (error) {
      console.error('Compression error:', error);
    }
    
    return { optimized: false };
  }

  /**
   * Optimize minification
   */
  async _optimizeMinification(response, request) {
    const data = response.data;
    if (!data || typeof data !== 'object') {
      return { optimized: false };
    }
    
    const originalSize = JSON.stringify(data).length;
    
    // Only minify if there's significant savings potential
    if (originalSize < 1024) {
      return { optimized: false };
    }
    
    try {
      const minified = this._minifyJSON(data);
      const minifiedSize = JSON.stringify(minified).length;
      
      if (minifiedSize < originalSize) {
        const bytesSaved = originalSize - minifiedSize;
        const savings = (bytesSaved / originalSize * 100).toFixed(2);
        
        return {
          optimized: true,
          type: 'minification',
          originalSize,
          optimizedSize: minifiedSize,
          bytesSaved,
          savings: savings + '%',
          data: minified,
          headers: {
            'X-Minified': 'true',
            'X-Minification-Savings': savings + '%'
          }
        };
      }
      
    } catch (error) {
      console.error('Minification error:', error);
    }
    
    return { optimized: false };
  }

  /**
   * Optimize field filtering
   */
  async _optimizeFieldFiltering(response, request, user) {
    const data = response.data;
    if (!data || typeof data !== 'object') {
      return { optimized: false };
    }
    
    const endpoint = request.url;
    const filters = this.fieldFilters.get(endpoint) || [];
    
    // Apply built-in filters
    const filteredData = this._applyFieldFilters(data, filters, user, endpoint);
    
    const originalSize = JSON.stringify(data).length;
    const filteredSize = JSON.stringify(filteredData).length;
    
    if (filteredSize < originalSize) {
      const bytesSaved = originalSize - filteredSize;
      const savings = (bytesSaved / originalSize * 100).toFixed(2);
      
      return {
        optimized: true,
        type: 'field_filtering',
        originalSize,
        optimizedSize: filteredSize,
        bytesSaved,
        savings: savings + '%',
        data: filteredData,
        headers: {
          'X-Field-Filtered': 'true',
          'X-Field-Filtering-Savings': savings + '%'
        }
      };
    }
    
    return { optimized: false };
  }

  /**
   * Optimize lazy loading
   */
  async _optimizeLazyLoading(response, request, context) {
    const data = response.data;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { optimized: false };
    }
    
    const originalSize = JSON.stringify(data).length;
    
    // Only apply lazy loading for large datasets
    if (originalSize < 1024 * 1024) { // 1MB
      return { optimized: false };
    }
    
    const pageSize = this._calculateOptimalPageSize(data.length, request);
    const firstPage = data.slice(0, pageSize);
    
    const optimized = {
      data: firstPage,
      pagination: {
        page: 1,
        pageSize,
        totalItems: data.length,
        totalPages: Math.ceil(data.length / pageSize),
        hasMore: data.length > pageSize,
        lazyLoaded: true
      },
      _lazyOptimized: true
    };
    
    const optimizedSize = JSON.stringify(optimized).length;
    const bytesSaved = originalSize - optimizedSize;
    
    return {
      optimized: true,
      type: 'lazy_loading',
      originalSize,
      optimizedSize,
      bytesSaved,
      data: optimized,
      headers: {
        'X-Lazy-Loaded': 'true',
        'X-Total-Items': data.length.toString()
      }
    };
  }

  /**
   * Optimize chunking
   */
  async _optimizeChunking(response, request) {
    const data = response.data;
    if (!data || typeof data !== 'string') {
      return { optimized: false };
    }
    
    const originalSize = data.length;
    
    if (originalSize <= this.options.chunkSize) {
      return { optimized: false };
    }
    
    const chunks = this._chunkString(data, this.options.chunkSize);
    
    return {
      optimized: true,
      type: 'chunking',
      originalSize,
      optimizedSize: originalSize, // Same size but better for streaming
      chunkCount: chunks.length,
      data: chunks[0], // Send first chunk immediately
      metadata: {
        totalChunks: chunks.length,
        chunkSize: this.options.chunkSize,
        isChunked: true
      },
      headers: {
        'X-Chunked': 'true',
        'X-Total-Chunks': chunks.length.toString(),
        'X-Chunk-Size': this.options.chunkSize.toString()
      }
    };
  }

  /**
   * Apply custom optimization rules
   */
  async _applyCustomRules(response, context) {
    const optimizations = [];
    
    for (const [name, rule] of this.optimizationRules) {
      try {
        const ruleResult = rule(response, context);
        if (ruleResult) {
          const optimization = await this._applyRule(ruleResult, response, context);
          if (optimization.optimized) {
            optimizations.push(optimization);
          }
        }
      } catch (error) {
        console.error(`Optimization rule ${name} error:`, error);
      }
    }
    
    return optimizations;
  }

  /**
   * Apply optimization rule
   */
  async _applyRule(rule, response, context) {
    const data = response.data;
    if (!data) return { optimized: false };
    
    let optimizedData = data;
    let optimizations = [];
    
    // Field selection
    if (rule.fields) {
      optimizedData = this._selectFields(optimizedData, rule.fields);
      optimizations.push('field_selection');
    }
    
    // Field exclusion
    if (rule.exclude) {
      optimizedData = this._excludeFields(optimizedData, rule.exclude);
      optimizations.push('field_exclusion');
    }
    
    // Limit fields
    if (rule.limitFields) {
      optimizedData = this._limitFields(optimizedData);
      optimizations.push('field_limiting');
    }
    
    // Apply limit
    if (rule.limit && Array.isArray(optimizedData)) {
      optimizedData = optimizedData.slice(0, rule.limit);
      optimizations.push('result_limiting');
    }
    
    const originalSize = JSON.stringify(data).length;
    const optimizedSize = JSON.stringify(optimizedData).length;
    
    if (optimizedSize < originalSize) {
      return {
        optimized: true,
        type: 'custom_rule',
        rule: rule,
        originalSize,
        optimizedSize,
        bytesSaved: originalSize - optimizedSize,
        optimizations,
        data: optimizedData
      };
    }
    
    return { optimized: false };
  }

  /**
   * Minify JSON response
   */
  _minifyJSON(data) {
    if (Array.isArray(data)) {
      return data.map(item => this._minifyJSON(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const minified = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          // Use shorter key names if possible
          const minifiedKey = this._getMinifiedKey(key);
          minified[minifiedKey] = this._minifyJSON(value);
        }
      }
      return minified;
    }
    
    return data;
  }

  /**
   * Get minified key name
   */
  _getMinifiedKey(key) {
    const minificationMap = {
      'userId': 'uid',
      'firstName': 'fn',
      'lastName': 'ln',
      'createdAt': 'ca',
      'updatedAt': 'ua',
      'isActive': 'ia',
      'fullName': 'nm'
    };
    
    return minificationMap[key] || key;
  }

  /**
   * Apply field filters
   */
  _applyFieldFilters(data, filters, user, endpoint) {
    let filteredData = data;
    
    // Apply user-based filtering
    if (user) {
      filteredData = this._applyUserBasedFiltering(filteredData, user, endpoint);
    }
    
    // Apply custom filters
    for (const filter of filters) {
      filteredData = filter(filteredData, user, endpoint);
    }
    
    return filteredData;
  }

  /**
   * Apply user-based filtering
   */
  _applyUserBasedFiltering(data, user, endpoint) {
    // Remove private data for non-admin users
    if (!user.isAdmin && endpoint?.includes('/admin/')) {
      return this._excludeFields(data, ['internalData', 'privateFields', 'adminOnly']);
    }
    
    return data;
  }

  /**
   * Select specific fields
   */
  _selectFields(data, fields) {
    if (Array.isArray(data)) {
      return data.map(item => this._selectFields(item, fields));
    }
    
    if (typeof data === 'object' && data !== null) {
      const selected = {};
      fields.forEach(field => {
        if (field in data) {
          selected[field] = data[field];
        }
      });
      return selected;
    }
    
    return data;
  }

  /**
   * Exclude specific fields
   */
  _excludeFields(data, excludedFields) {
    if (Array.isArray(data)) {
      return data.map(item => this._excludeFields(item, excludedFields));
    }
    
    if (typeof data === 'object' && data !== null) {
      const filtered = {};
      for (const [key, value] of Object.entries(data)) {
        if (!excludedFields.includes(key)) {
          filtered[key] = value;
        }
      }
      return filtered;
    }
    
    return data;
  }

  /**
   * Limit fields to important ones
   */
  _limitFields(data) {
    if (Array.isArray(data)) {
      return data.map(item => this._limitFields(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const importantFields = ['id', 'name', 'title', 'description', 'createdAt'];
      const limited = {};
      
      for (const field of importantFields) {
        if (field in data) {
          limited[field] = data[field];
        }
      }
      
      return limited;
    }
    
    return data;
  }

  /**
   * Calculate optimal page size
   */
  _calculateOptimalPageSize(totalItems, request) {
    const queryPageSize = request.query?.pageSize;
    if (queryPageSize) {
      return Math.min(parseInt(queryPageSize), 100);
    }
    
    // Adaptive page size based on data size
    if (totalItems > 1000) return 20;
    if (totalItems > 500) return 50;
    return 100;
  }

  /**
   * Chunk string into smaller pieces
   */
  _chunkString(str, chunkSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(str.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Should minify response
   */
  _shouldMinify(response) {
    return response.data && typeof response.data === 'object';
  }

  /**
   * Should lazy load response
   */
  _shouldLazyLoad(response) {
    return response.data && 
           Array.isArray(response.data) && 
           response.data.length > 100;
  }

  /**
   * Should chunk response
   */
  _shouldChunk(response) {
    return response.data && 
           typeof response.data === 'string' && 
           response.data.length > this.options.chunkSize;
  }

  /**
   * Update optimization metrics
   */
  _updateOptimizationMetrics(optimizationTime, optimizationCount) {
    this.metrics.totalOptimizations += optimizationCount;
    this.metrics.averageOptimizationTime = 
      (this.metrics.averageOptimizationTime * 0.9) + (optimizationTime * 0.1);
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      ...this.metrics,
      totalOptimizations: this.metrics.totalOptimizations,
      averageOptimizationTime: this.metrics.averageOptimizationTime.toFixed(2) + 'ms',
      optimizationRules: this.optimizationRules.size,
      fieldFilters: this.fieldFilters.size
    };
  }
}

/**
 * Compression engine
 */
class CompressionEngine {
  async compress(data, headers) {
    // Simplified compression - in production use zlib or similar
    const jsonString = JSON.stringify(data);
    
    // Check if client accepts gzip
    const acceptEncoding = headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip')) {
      // Simulate compression
      if (jsonString.length > 1024) {
        return jsonString; // In real implementation, this would be gzipped
      }
    }
    
    return jsonString;
  }
}

/**
 * Performance tracker
 */
class PerformanceTracker {
  constructor() {
    this.optimizationStats = new Map();
  }

  recordOptimization(endpoint, optimizationType, time, bytesSaved) {
    if (!this.optimizationStats.has(endpoint)) {
      this.optimizationStats.set(endpoint, {
        count: 0,
        totalTime: 0,
        totalBytesSaved: 0,
        types: new Set()
      });
    }

    const stats = this.optimizationStats.get(endpoint);
    stats.count++;
    stats.totalTime += time;
    stats.totalBytesSaved += bytesSaved;
    stats.types.add(optimizationType);
  }

  getStats() {
    return {
      totalEndpoints: this.optimizationStats.size,
      averageOptimizationTime: this._calculateAverageTime(),
      totalBytesSaved: this._calculateTotalBytesSaved()
    };
  }

  _calculateAverageTime() {
    let totalTime = 0;
    let totalCount = 0;
    
    for (const stats of this.optimizationStats.values()) {
      totalTime += stats.totalTime;
      totalCount += stats.count;
    }
    
    return totalCount > 0 ? (totalTime / totalCount).toFixed(2) + 'ms' : '0ms';
  }

  _calculateTotalBytesSaved() {
    let total = 0;
    for (const stats of this.optimizationStats.values()) {
      total += stats.totalBytesSaved;
    }
    return total;
  }
}

module.exports = { APIOptimizer };