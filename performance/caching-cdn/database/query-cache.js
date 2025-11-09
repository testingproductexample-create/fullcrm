const { EventEmitter } = require('events');
const crypto = require('crypto');

/**
 * Advanced database query caching with intelligent invalidation
 */
class QueryCache extends EventEmitter {
  constructor(cacheManager, options = {}) {
    super();
    
    this.cacheManager = cacheManager;
    this.options = {
      defaultTTL: options.defaultTTL || 1800, // 30 minutes
      maxCacheSize: options.maxCacheSize || 1000,
      enableInvalidation: options.enableInvalidation !== false,
      invalidationStrategies: options.invalidationStrategies || ['dependency'],
      trackQueryPatterns: options.trackQueryPatterns !== false,
      enableCompression: options.enableCompression !== false,
      ...options
    };
    
    this.queryCache = new Map();
    this.queryStats = new Map();
    this.dependencyGraph = new Map();
    this.queryPatterns = new Map();
    this.invalidationRules = new Map();
    
    this.metrics = {
      totalQueries: 0,
      cachedHits: 0,
      cachedMisses: 0,
      invalidations: 0,
      averageQueryTime: 0,
      cacheEvictions: 0
    };
    
    this._setupInvalidationSystem();
  }

  /**
   * Execute query with caching
   */
  async execute(query, params = [], options = {}) {
    const startTime = Date.now();
    const queryKey = this._generateQueryKey(query, params, options);
    
    this.metrics.totalQueries++;
    
    try {
      // Check cache first
      const cachedResult = await this.get(queryKey, options);
      if (cachedResult !== null) {
        this._updateQueryStats(queryKey, 'hit', startTime);
        this.metrics.cachedHits++;
        this.emit('query_cache_hit', { queryKey, query, params });
        return cachedResult;
      }
      
      // Cache miss - execute query
      this.metrics.cachedMisses++;
      const result = await this._executeQuery(query, params, options);
      
      // Cache the result
      if (result !== null) {
        const ttl = options.ttl || this._calculateOptimalTTL(query, result);
        await this.set(queryKey, result, {
          ...options,
          ttl,
          query: { sql: query, params },
          tableDependencies: this._extractTableDependencies(query)
        });
        
        this._updateQueryStats(queryKey, 'miss', startTime);
        this.emit('query_cache_miss', { queryKey, query, params, resultSize: this._estimateSize(result) });
      }
      
      return result;
      
    } catch (error) {
      this._updateQueryStats(queryKey, 'error', startTime);
      this.emit('query_error', { queryKey, error: error.message });
      throw error;
    }
  }

  /**
   * Get cached query result
   */
  async get(queryKey, options = {}) {
    const cacheKey = this._buildCacheKey(queryKey, options.namespace);
    
    try {
      const cached = await this.cacheManager.get(cacheKey, {
        namespace: 'query'
      });
      
      if (cached && this._isCacheValid(cached, options)) {
        // Update access statistics
        this._updateAccessStats(queryKey);
        
        return {
          data: cached.data,
          metadata: {
            cached: true,
            cachedAt: cached.cachedAt,
            queryKey,
            executionTime: cached.executionTime
          }
        };
      }
      
      return null;
      
    } catch (error) {
      this.emit('error', new Error(`Query cache GET error: ${error.message}`));
      return null;
    }
  }

  /**
   * Set cached query result
   */
  async set(queryKey, data, options = {}) {
    const cacheKey = this._buildCacheKey(queryKey, options.namespace);
    
    try {
      const cacheEntry = {
        data,
        cachedAt: Date.now(),
        executionTime: options.executionTime,
        query: options.query,
        tableDependencies: options.tableDependencies || [],
        compressionRatio: this._estimateCompressionRatio(data),
        rowCount: this._estimateRowCount(data),
        size: this._estimateSize(data),
        tags: options.tags || []
      };
      
      const ttl = options.ttl || this.options.defaultTTL;
      const result = await this.cacheManager.set(cacheKey, cacheEntry, {
        namespace: 'query',
        ttl,
        compress: this.options.enableCompression && cacheEntry.size > 10240
      });
      
      if (result) {
        // Update internal tracking
        this.queryCache.set(queryKey, {
          cacheKey,
          cachedAt: Date.now(),
          ttl,
          executionTime: options.executionTime
        });
        
        // Track table dependencies for invalidation
        if (this.options.enableInvalidation && options.tableDependencies) {
          this._updateDependencyGraph(queryKey, options.tableDependencies);
        }
        
        // Track query patterns
        if (this.options.trackQueryPatterns) {
          this._updateQueryPatterns(queryKey, options.query);
        }
        
        this.emit('query_cached', { queryKey, tableDependencies: options.tableDependencies });
      }
      
      return result;
      
    } catch (error) {
      this.emit('error', new Error(`Query cache SET error: ${error.message}`));
      return false;
    }
  }

  /**
   * Invalidate cache entries based on table modifications
   */
  async invalidateTable(tableName, options = {}) {
    if (!this.options.enableInvalidation) return;
    
    const startTime = Date.now();
    const invalidatedKeys = [];
    
    try {
      // Find all cached queries that depend on this table
      const dependentQueries = this._findDependentQueries(tableName);
      
      for (const queryKey of dependentQueries) {
        await this.delete(queryKey);
        invalidatedKeys.push(queryKey);
      }
      
      // Clean up dependency graph
      this._cleanUpDependencies(tableName);
      
      this.metrics.invalidations += invalidatedKeys.length;
      
      const duration = Date.now() - startTime;
      this.emit('table_invalidated', { 
        tableName, 
        invalidatedKeys: invalidatedKeys.length,
        duration 
      });
      
      return {
        tableName,
        invalidatedCount: invalidatedKeys.length,
        duration,
        invalidatedKeys
      };
      
    } catch (error) {
      this.emit('error', new Error(`Table invalidation error: ${error.message}`));
      throw error;
    }
  }

  /**
   * Invalidate cache entries based on specific data changes
   */
  async invalidateData(identifiers, options = {}) {
    const invalidatedKeys = [];
    
    try {
      for (const identifier of identifiers) {
        const pattern = `*${identifier}*`;
        const patternCacheKeys = await this.cacheManager.deletePattern(pattern, {
          namespace: 'query'
        });
        
        // Also clean up internal tracking
        for (const [queryKey, cacheInfo] of this.queryCache) {
          if (queryKey.includes(identifier)) {
            this.queryCache.delete(queryKey);
            invalidatedKeys.push(queryKey);
          }
        }
      }
      
      this.metrics.invalidations += invalidatedKeys.length;
      this.emit('data_invalidated', { identifiers, invalidatedKeys: invalidatedKeys.length });
      
      return invalidatedKeys;
      
    } catch (error) {
      this.emit('error', new Error(`Data invalidation error: ${error.message}`));
      throw error;
    }
  }

  /**
   * Clear all query cache
   */
  async clear(options = {}) {
    const pattern = options.pattern || '*';
    const namespace = options.namespace || 'query';
    
    try {
      await this.cacheManager.deletePattern(`query:${pattern}`, { namespace });
      
      // Clear internal tracking
      this.queryCache.clear();
      this.queryStats.clear();
      
      if (options.cleanDependencies) {
        this.dependencyGraph.clear();
      }
      
      if (options.cleanPatterns) {
        this.queryPatterns.clear();
      }
      
      this.emit('query_cache_cleared', options);
      
    } catch (error) {
      this.emit('error', new Error(`Query cache clear error: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get query cache statistics
   */
  getStats() {
    const totalQueries = this.metrics.totalQueries;
    const hitRate = totalQueries > 0 
      ? (this.metrics.cachedHits / totalQueries * 100).toFixed(2) + '%'
      : '0%';
    
    return {
      ...this.metrics,
      hitRate,
      cacheSize: this.queryCache.size,
      dependencyGraphSize: this.dependencyGraph.size,
      queryPatterns: this.queryPatterns.size,
      averageQueryTime: this.metrics.averageQueryTime.toFixed(2) + 'ms',
      topQueries: this._getTopQueries(10)
    };
  }

  /**
   * Get optimal cache configuration for query
   */
  getOptimalConfig(query, data) {
    const tableDeps = this._extractTableDependencies(query);
    const dataVolatility = this._analyzeDataVolatility(data);
    const queryComplexity = this._analyzeQueryComplexity(query);
    const resultSize = this._estimateSize(data);
    
    // Calculate optimal TTL
    let ttl = this.options.defaultTTL;
    
    // Adjust TTL based on data volatility
    if (dataVolatility === 'high') {
      ttl *= 0.5; // Shorter cache for volatile data
    } else if (dataVolatility === 'low') {
      ttl *= 2; // Longer cache for stable data
    }
    
    // Adjust TTL based on query complexity
    if (queryComplexity === 'high') {
      ttl *= 1.5; // Longer cache for complex queries
    }
    
    // Adjust TTL based on result size
    if (resultSize > 1024 * 1024) { // > 1MB
      ttl *= 0.7; // Shorter cache for large results
    }
    
    return {
      ttl: Math.floor(ttl),
      enableCompression: resultSize > 10240, // > 10KB
      priority: this._calculateCachePriority(query, data),
      tags: [...tableDeps, `complexity:${queryComplexity}`, `size:${this._categorizeSize(resultSize)}`]
    };
  }

  /**
   * Setup invalidation system
   */
  _setupInvalidationSystem() {
    if (!this.options.enableInvalidation) return;
    
    // Set up automatic invalidation based on patterns
    this._setupInvalidationRules();
  }

  /**
   * Setup invalidation rules
   */
  _setupInvalidationRules() {
    // User-related queries
    this.addInvalidationRule('user_updated', (queryKey) => {
      return queryKey.includes('user') || queryKey.includes('profile');
    });
    
    // Order-related queries
    this.addInvalidationRule('order_updated', (queryKey) => {
      return queryKey.includes('order') || queryKey.includes('cart');
    });
    
    // Product-related queries
    this.addInvalidationRule('product_updated', (queryKey) => {
      return queryKey.includes('product') || queryKey.includes('inventory');
    });
  }

  /**
   * Add custom invalidation rule
   */
  addInvalidationRule(name, predicate) {
    this.invalidationRules.set(name, predicate);
  }

  /**
   * Apply invalidation rule
   */
  async applyInvalidationRule(ruleName, context) {
    const rule = this.invalidationRules.get(ruleName);
    if (!rule) return;
    
    const invalidatedKeys = [];
    
    for (const [queryKey] of this.queryCache) {
      if (rule(queryKey, context)) {
        await this.delete(queryKey);
        invalidatedKeys.push(queryKey);
      }
    }
    
    this.emit('rule_invalidated', { ruleName, context, count: invalidatedKeys.length });
    
    return invalidatedKeys;
  }

  /**
   * Generate cache key for query
   */
  _generateQueryKey(query, params, options = {}) {
    const normalizedQuery = this._normalizeQuery(query);
    const paramHash = this._hashParams(params);
    const optionsHash = this._hashOptions(options);
    
    const keyData = `${normalizedQuery}|${paramHash}|${optionsHash}`;
    return crypto.createHash('sha256').update(keyData).digest('hex').substring(0, 16);
  }

  /**
   * Normalize query for consistent caching
   */
  _normalizeQuery(query) {
    return query
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/--.*$/gm, '') // Remove comments
      .toLowerCase()
      .trim();
  }

  /**
   * Hash parameters
   */
  _hashParams(params) {
    if (!params || params.length === 0) return 'no-params';
    return crypto.createHash('sha256')
      .update(JSON.stringify(params))
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Hash options
   */
  _hashOptions(options) {
    const hashable = { ...options };
    delete hashable.executionTime; // Remove timing data
    return crypto.createHash('sha256')
      .update(JSON.stringify(hashable))
      .digest('hex')
      .substring(0, 8);
  }

  /**
   * Build cache key
   */
  _buildCacheKey(queryKey, namespace) {
    return `query:${queryKey}`;
  }

  /**
   * Check if cache entry is still valid
   */
  _isCacheValid(cached, options = {}) {
    const maxAge = options.maxAge || cached.ttl;
    const age = Date.now() - cached.cachedAt;
    
    return age < (maxAge * 1000);
  }

  /**
   * Update access statistics
   */
  _updateAccessStats(queryKey) {
    if (!this.queryStats.has(queryKey)) {
      this.queryStats.set(queryKey, {
        hits: 0,
        misses: 0,
        errors: 0,
        lastAccess: 0,
        totalExecutionTime: 0
      });
    }
    
    const stats = this.queryStats.get(queryKey);
    stats.hits++;
    stats.lastAccess = Date.now();
  }

  /**
   * Update query statistics
   */
  _updateQueryStats(queryKey, type, startTime) {
    if (!this.queryStats.has(queryKey)) {
      this.queryStats.set(queryKey, {
        hits: 0,
        misses: 0,
        errors: 0,
        lastAccess: 0,
        totalExecutionTime: 0
      });
    }
    
    const stats = this.queryStats.get(queryKey);
    stats[type]++;
    stats.lastAccess = Date.now();
    
    if (type !== 'error') {
      const executionTime = Date.now() - startTime;
      stats.totalExecutionTime += executionTime;
      
      // Update global average
      this.metrics.averageQueryTime = 
        (this.metrics.averageQueryTime * 0.9) + (executionTime * 0.1);
    }
  }

  /**
   * Extract table dependencies from query
   */
  _extractTableDependencies(query) {
    const dependencies = new Set();
    const normalizedQuery = query.toLowerCase();
    
    // Common table name patterns
    const tablePatterns = [
      /from\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /join\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /update\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /delete\s+from\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /insert\s+into\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
    ];
    
    tablePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(normalizedQuery)) !== null) {
        dependencies.add(match[1]);
      }
    });
    
    return Array.from(dependencies);
  }

  /**
   * Update dependency graph
   */
  _updateDependencyGraph(queryKey, tableDependencies) {
    for (const table of tableDependencies) {
      if (!this.dependencyGraph.has(table)) {
        this.dependencyGraph.set(table, new Set());
      }
      this.dependencyGraph.get(table).add(queryKey);
    }
  }

  /**
   * Find dependent queries
   */
  _findDependentQueries(tableName) {
    return this.dependencyGraph.get(tableName) || new Set();
  }

  /**
   * Clean up dependencies
   */
  _cleanUpDependencies(tableName) {
    this.dependencyGraph.delete(tableName);
  }

  /**
   * Update query patterns
   */
  _updateQueryPatterns(queryKey, query) {
    const pattern = this._extractQueryPattern(query);
    if (!this.queryPatterns.has(pattern)) {
      this.queryPatterns.set(pattern, new Map());
    }
    this.queryPatterns.get(pattern).set(queryKey, Date.now());
  }

  /**
   * Extract query pattern
   */
  _extractQueryPattern(query) {
    // Extract pattern like "SELECT * FROM users WHERE id = ?"
    return query
      .replace(/'[^*]*'/g, '?') // Replace string literals
      .replace(/\d+/g, '?') // Replace numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase()
      .trim();
  }

  /**
   * Calculate optimal TTL for query
   */
  _calculateOptimalTTL(query, result) {
    const config = this.getOptimalConfig(query, result);
    return config.ttl;
  }

  /**
   * Analyze data volatility
   */
  _analyzeDataVolatility(data) {
    // Simplified volatility analysis
    // In production, you might track data changes over time
    if (Array.isArray(data) && data.length > 1000) {
      return 'high';
    }
    return 'medium';
  }

  /**
   * Analyze query complexity
   */
  _analyzeQueryComplexity(query) {
    const complexityIndicators = ['join', 'group by', 'order by', 'having', 'union'];
    const count = complexityIndicators.reduce((acc, indicator) => {
      return acc + (query.toLowerCase().includes(indicator) ? 1 : 0);
    }, 0);
    
    if (count >= 3) return 'high';
    if (count >= 1) return 'medium';
    return 'low';
  }

  /**
   * Estimate data size
   */
  _estimateSize(data) {
    return JSON.stringify(data).length;
  }

  /**
   * Estimate row count
   */
  _estimateRowCount(data) {
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object') return Object.keys(data).length;
    return 1;
  }

  /**
   * Estimate compression ratio
   */
  _estimateCompressionRatio(data) {
    const originalSize = this._estimateSize(data);
    // Simplified compression estimation
    return originalSize > 1024 ? 0.3 : 1;
  }

  /**
   * Calculate cache priority
   */
  _calculateCachePriority(query, data) {
    let priority = 1;
    
    // Higher priority for complex queries
    if (this._analyzeQueryComplexity(query) === 'high') {
      priority += 2;
    }
    
    // Higher priority for larger results
    if (this._estimateSize(data) > 1024 * 100) { // 100KB
      priority += 1;
    }
    
    return Math.min(priority, 5); // Max priority 5
  }

  /**
   * Categorize size
   */
  _categorizeSize(size) {
    if (size < 1024) return 'small';
    if (size < 1024 * 10) return 'medium';
    if (size < 1024 * 100) return 'large';
    return 'huge';
  }

  /**
   * Get top queries
   */
  _getTopQueries(limit = 10) {
    return Array.from(this.queryStats.entries())
      .sort(([,a], [,b]) => b.hits - a.hits)
      .slice(0, limit)
      .map(([queryKey, stats]) => ({
        queryKey,
        hits: stats.hits,
        averageTime: stats.hits > 0 
          ? (stats.totalExecutionTime / stats.hits).toFixed(2) + 'ms'
          : '0ms'
      }));
  }

  /**
   * Execute query (placeholder - implement with your database)
   */
  async _executeQuery(query, params, options) {
    // This is a placeholder implementation
    // In production, you would implement this with your actual database
    throw new Error('_executeQuery must be implemented');
  }
}

module.exports = { QueryCache };