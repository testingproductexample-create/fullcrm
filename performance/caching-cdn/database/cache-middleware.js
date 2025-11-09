/**
 * Database cache middleware for automatic query caching and invalidation
 */
class DatabaseCacheMiddleware {
  constructor(queryCache, queryInvalidator, options = {}) {
    this.queryCache = queryCache;
    this.queryInvalidator = queryInvalidator;
    this.options = {
      enableAutoCaching: options.enableAutoCaching !== false,
      enableAutomaticInvalidation: options.enableAutomaticInvalidation !== false,
      cacheSelectQueries: options.cacheSelectQueries !== false,
      cacheAggregateQueries: options.cacheAggregateQueries !== false,
      excludePatterns: options.excludePatterns || [
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE'
      ],
      includePatterns: options.includePatterns || [
        'SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN'
      ],
      maxCacheSize: options.maxCacheSize || 100,
      enableQueryAnalysis: options.enableQueryAnalysis !== false,
      ...options
    };
    
    this.wrappedMethods = new Map();
    this.queryAnalyzer = new QueryAnalyzer();
    this.performanceTracker = new PerformanceTracker();
    this.metrics = {
      totalQueries: 0,
      cachedQueries: 0,
      directQueries: 0,
      invalidations: 0,
      cacheHitRate: 0,
      averageQueryTime: 0
    };
    
    this._setupAutomaticInvalidation();
  }

  /**
   * Wrap database connection with caching middleware
   */
  wrapConnection(connection) {
    const wrappedConnection = new Proxy(connection, {
      get: (target, prop) => {
        if (typeof target[prop] === 'function') {
          return this._wrapMethod(target, prop, target[prop]);
        }
        return target[prop];
      }
    });
    
    return wrappedConnection;
  }

  /**
   * Wrap individual query method
   */
  _wrapMethod(target, methodName, originalMethod) {
    // Check if method is already wrapped
    if (this.wrappedMethods.has(originalMethod)) {
      return this.wrappedMethods.get(originalMethod);
    }
    
    // Create wrapped method
    const wrappedMethod = async (...args) => {
      return await this._executeWithCaching(
        target,
        methodName,
        originalMethod,
        args
      );
    };
    
    // Store reference to prevent double wrapping
    this.wrappedMethods.set(originalMethod, wrappedMethod);
    
    return wrappedMethod;
  }

  /**
   * Execute method with caching logic
   */
  async _executeWithCaching(target, methodName, originalMethod, args) {
    const startTime = Date.now();
    
    try {
      // Parse query and parameters
      const { query, params, options } = this._parseMethodArgs(args);
      
      if (!query) {
        // Not a query method, execute directly
        const result = await originalMethod.apply(target, args);
        this.metrics.directQueries++;
        return result;
      }
      
      this.metrics.totalQueries++;
      
      // Analyze query
      const analysis = await this.queryAnalyzer.analyze(query, params);
      
      // Check if query should be cached
      if (this._shouldCacheQuery(analysis, query)) {
        // Try to get from cache
        const cachedResult = await this.queryCache.execute(query, params, {
          methodName,
          analysis,
          ...options
        });
        
        if (cachedResult && cachedResult.metadata?.cached) {
          // Cache hit
          const executionTime = Date.now() - startTime;
          this.performanceTracker.recordCacheHit(query, executionTime, analysis);
          return cachedResult.data;
        }
        
        // Cache miss - execute query
        const result = await originalMethod.apply(target, args);
        const executionTime = Date.now() - startTime;
        
        // Cache the result
        if (result !== null && result !== undefined) {
          await this.queryCache.execute(query, params, {
            methodName,
            analysis,
            executionTime,
            ...options
          });
        }
        
        this.performanceTracker.recordCacheMiss(query, executionTime, analysis);
        return result;
        
      } else {
        // Don't cache this query
        const result = await originalMethod.apply(target, args);
        const executionTime = Date.now() - startTime;
        
        this.performanceTracker.recordDirectQuery(query, executionTime, analysis);
        return result;
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.performanceTracker.recordError(query, executionTime, error);
      throw error;
    }
  }

  /**
   * Parse method arguments to extract query and parameters
   */
  _parseMethodArgs(args) {
    if (args.length === 0) {
      return { query: null, params: [], options: {} };
    }
    
    // Common patterns for database methods
    if (typeof args[0] === 'string') {
      // Pattern 1: (query, params, options)
      return {
        query: args[0],
        params: Array.isArray(args[1]) ? args[1] : [],
        options: typeof args[2] === 'object' ? args[2] : {}
      };
    } else if (typeof args[0] === 'object') {
      // Pattern 2: (queryObject)
      const queryObj = args[0];
      return {
        query: queryObj.sql || queryObj.query || queryObj.text,
        params: queryObj.params || queryObj.values || [],
        options: {
          ...queryObj,
          sql: undefined,
          query: undefined,
          text: undefined,
          params: undefined,
          values: undefined
        }
      };
    }
    
    return { query: null, params: [], options: {} };
  }

  /**
   * Check if query should be cached
   */
  _shouldCacheQuery(analysis, query) {
    if (!this.options.enableAutoCaching) return false;
    
    // Check exclude patterns
    const upperQuery = query.toUpperCase();
    for (const pattern of this.options.excludePatterns) {
      if (upperQuery.includes(pattern)) return false;
    }
    
    // Check include patterns
    if (this.options.includePatterns.length > 0) {
      let shouldInclude = false;
      for (const pattern of this.options.includePatterns) {
        if (upperQuery.includes(pattern)) {
          shouldInclude = true;
          break;
        }
      }
      if (!shouldInclude) return false;
    }
    
    // Skip caching for very fast queries
    if (analysis.estimatedExecutionTime < 10) return false; // < 10ms
    
    // Skip caching for queries with many parameters
    if (analysis.parameterCount > 100) return false;
    
    // Skip caching for very large result sets
    if (analysis.estimatedRowCount > 10000) return false;
    
    return true;
  }

  /**
   * Setup automatic invalidation based on database events
   */
  _setupAutomaticInvalidation() {
    if (!this.options.enableAutomaticInvalidation) return;
    
    // Listen for cache invalidation events
    this.queryInvalidator.on('table_invalidated', async (event) => {
      await this._handleTableInvalidation(event);
    });
    
    this.queryInvalidator.on('data_invalidated', async (event) => {
      await this._handleDataInvalidation(event);
    });
    
    this.queryInvalidator.on('smart_invalidation_completed', async (event) => {
      await this._handleSmartInvalidation(event);
    });
  }

  /**
   * Handle table invalidation event
   */
  async _handleTableInvalidation(event) {
    const { tableName, invalidatedQueries, duration } = event;
    
    // Update metrics
    this.metrics.invalidations += invalidatedQueries.length;
    
    // Clean up performance tracking for invalidated queries
    invalidatedQueries.forEach(query => {
      this.performanceTracker.removeQuery(query);
    });
    
    // Log event
    console.log(`Table invalidation completed: ${tableName}, ${invalidatedQueries.length} queries invalidated in ${duration}ms`);
  }

  /**
   * Handle data invalidation event
   */
  async _handleDataInvalidation(event) {
    const { identifiers, invalidatedQueries, duration } = event;
    
    // Update metrics
    this.metrics.invalidations += invalidatedQueries.length;
    
    // Clean up performance tracking
    invalidatedQueries.forEach(query => {
      this.performanceTracker.removeQuery(query);
    });
    
    console.log(`Data invalidation completed: ${identifiers.join(', ')}, ${invalidatedQueries.length} queries invalidated in ${duration}ms`);
  }

  /**
   * Handle smart invalidation event
   */
  async _handleSmartInvalidation(event) {
    const { strategy, affectedQueries, duration, impactAnalysis } = event;
    
    // Update metrics
    this.metrics.invalidations += affectedQueries.length;
    
    // Clean up performance tracking
    affectedQueries.forEach(query => {
      this.performanceTracker.removeQuery(query);
    });
    
    // Update cache hit rate
    this._updateCacheHitRate();
    
    console.log(`Smart invalidation completed: ${strategy}, ${affectedQueries.length} queries affected in ${duration}ms`);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const totalExecuted = this.metrics.cachedQueries + this.metrics.directQueries;
    
    return {
      ...this.metrics,
      cacheHitRate: this._updateCacheHitRate(),
      performance: this.performanceTracker.getStats(),
      topQueries: this.performanceTracker.getTopQueries(10),
      slowestQueries: this.performanceTracker.getSlowestQueries(10),
      cacheableQueries: this.performanceTracker.getCacheableQueries()
    };
  }

  /**
   * Update cache hit rate
   */
  _updateCacheHitRate() {
    const totalQueries = this.metrics.totalQueries;
    const cachedHits = this.metrics.cachedQueries;
    
    this.metrics.cacheHitRate = totalQueries > 0 
      ? (cachedHits / totalQueries * 100).toFixed(2) + '%'
      : '0%';
    
    return this.metrics.cacheHitRate;
  }

  /**
   * Clear all cached queries
   */
  async clearCache() {
    await this.queryCache.clear();
    this.performanceTracker.clear();
    this.metrics = {
      totalQueries: 0,
      cachedQueries: 0,
      directQueries: 0,
      invalidations: 0,
      cacheHitRate: 0,
      averageQueryTime: 0
    };
  }

  /**
   * Manually invalidate queries
   */
  async invalidate(identifiers, options = {}) {
    return await this.queryInvalidator.invalidateData(identifiers, options);
  }

  /**
   * Get cache configuration recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    const metrics = this.getMetrics();
    
    // Low cache hit rate
    if (parseFloat(metrics.cacheHitRate) < 50) {
      recommendations.push({
        type: 'cache_hit_rate',
        severity: 'high',
        message: 'Cache hit rate is below 50%. Consider reviewing cacheable queries.',
        action: 'Analyze query patterns and adjust caching strategy'
      });
    }
    
    // High invalidation rate
    if (metrics.invalidations > metrics.cachedQueries * 0.3) {
      recommendations.push({
        type: 'invalidation_rate',
        severity: 'medium',
        message: 'High invalidation rate detected.',
        action: 'Review invalidation strategy and data update patterns'
      });
    }
    
    // Slow average query time
    if (metrics.performance.averageExecutionTime > 1000) {
      recommendations.push({
        type: 'query_performance',
        severity: 'high',
        message: 'Average query execution time is high.',
        action: 'Consider database optimization and indexing'
      });
    }
    
    return recommendations;
  }
}

/**
 * Query analyzer for determining cacheability
 */
class QueryAnalyzer {
  constructor() {
    this.queryPatterns = new Map();
    this.complexityRules = [
      { pattern: /JOIN/i, complexity: 2, cacheable: true },
      { pattern: /GROUP BY/i, complexity: 3, cacheable: true },
      { pattern: /ORDER BY/i, complexity: 1, cacheable: true },
      { pattern: /UNION/i, complexity: 3, cacheable: true },
      { pattern: /SUBQUERY/i, complexity: 2, cacheable: true },
      { pattern: /DISTINCT/i, complexity: 2, cacheable: true },
      { pattern: /LIMIT/i, complexity: 1, cacheable: false }
    ];
  }

  async analyze(query, params) {
    const analysis = {
      query: query.toLowerCase().trim(),
      complexity: 0,
      cacheable: true,
      estimatedExecutionTime: 0,
      estimatedRowCount: 0,
      parameterCount: params ? params.length : 0,
      tables: this._extractTables(query),
      queryType: this._determineQueryType(query),
      patterns: []
    };

    // Calculate complexity
    for (const rule of this.complexityRules) {
      if (rule.pattern.test(query)) {
        analysis.complexity += rule.complexity;
        analysis.patterns.push({
          pattern: rule.pattern.source,
          complexity: rule.complexity,
          cacheable: rule.cacheable
        });
        
        if (!rule.cacheable) {
          analysis.cacheable = false;
        }
      }
    }

    // Estimate execution time based on complexity
    analysis.estimatedExecutionTime = analysis.complexity * 50 + analysis.parameterCount * 10;

    // Estimate row count
    analysis.estimatedRowCount = this._estimateRowCount(query, analysis.patterns);

    return analysis;
  }

  _extractTables(query) {
    const tables = new Set();
    const patterns = [
      /FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
      /DELETE\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        tables.add(match[1]);
      }
    });

    return Array.from(tables);
  }

  _determineQueryType(query) {
    const upperQuery = query.toUpperCase().trim();
    
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    if (upperQuery.startsWith('CREATE')) return 'CREATE';
    if (upperQuery.startsWith('DROP')) return 'DROP';
    
    return 'UNKNOWN';
  }

  _estimateRowCount(query, patterns) {
    // Simple estimation based on query patterns
    if (patterns.some(p => p.pattern.includes('GROUP BY'))) {
      return 100; // Aggregations typically return fewer rows
    }
    
    if (patterns.some(p => p.pattern.includes('DISTINCT'))) {
      return 500; // Distinct operations reduce row count
    }
    
    if (query.includes('limit')) {
      const limitMatch = query.match(/limit\s+(\d+)/i);
      return limitMatch ? parseInt(limitMatch[1]) : 1000;
    }
    
    return 1000; // Default estimate
  }
}

/**
 * Performance tracker for monitoring query performance
 */
class PerformanceTracker {
  constructor() {
    this.queryStats = new Map();
    this.executionHistory = [];
  }

  recordCacheHit(query, executionTime, analysis) {
    this._updateQueryStats(query, 'cache_hit', executionTime, analysis);
  }

  recordCacheMiss(query, executionTime, analysis) {
    this._updateQueryStats(query, 'cache_miss', executionTime, analysis);
  }

  recordDirectQuery(query, executionTime, analysis) {
    this._updateQueryStats(query, 'direct', executionTime, analysis);
  }

  recordError(query, executionTime, error) {
    this._updateQueryStats(query, 'error', executionTime, { error: error.message });
  }

  _updateQueryStats(query, type, executionTime, analysis) {
    if (!this.queryStats.has(query)) {
      this.queryStats.set(query, {
        hits: 0,
        misses: 0,
        direct: 0,
        errors: 0,
        totalExecutionTime: 0,
        executionCount: 0,
        averageExecutionTime: 0,
        lastExecution: 0,
        analysis
      });
    }

    const stats = this.queryStats.get(query);
    stats[type]++;
    stats.totalExecutionTime += executionTime;
    stats.executionCount++;
    stats.averageExecutionTime = stats.totalExecutionTime / stats.executionCount;
    stats.lastExecution = Date.now();

    // Add to execution history
    this.executionHistory.push({
      query,
      type,
      executionTime,
      timestamp: Date.now()
    });

    // Keep only last 1000 executions
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000);
    }
  }

  getStats() {
    const totalQueries = this.queryStats.size;
    const totalExecutions = Array.from(this.queryStats.values())
      .reduce((sum, stats) => sum + stats.executionCount, 0);
    const totalExecutionTime = Array.from(this.queryStats.values())
      .reduce((sum, stats) => sum + stats.totalExecutionTime, 0);

    return {
      totalQueries,
      totalExecutions,
      averageExecutionTime: totalExecutions > 0 
        ? (totalExecutionTime / totalExecutions).toFixed(2) + 'ms'
        : '0ms',
      cacheHitRate: this._calculateCacheHitRate()
    };
  }

  getTopQueries(limit = 10) {
    return Array.from(this.queryStats.entries())
      .sort(([,a], [,b]) => b.hits - a.hits)
      .slice(0, limit)
      .map(([query, stats]) => ({
        query,
        hits: stats.hits,
        averageTime: stats.averageExecutionTime.toFixed(2) + 'ms',
        cacheable: stats.analysis?.cacheable
      }));
  }

  getSlowestQueries(limit = 10) {
    return Array.from(this.queryStats.entries())
      .sort(([,a], [,b]) => b.averageExecutionTime - a.averageExecutionTime)
      .slice(0, limit)
      .map(([query, stats]) => ({
        query,
        averageTime: stats.averageExecutionTime.toFixed(2) + 'ms',
        executionCount: stats.executionCount
      }));
  }

  getCacheableQueries() {
    return Array.from(this.queryStats.entries())
      .filter(([, stats]) => stats.analysis?.cacheable)
      .map(([query, stats]) => ({
        query,
        averageTime: stats.averageExecutionTime.toFixed(2) + 'ms',
        cacheable: true
      }));
  }

  removeQuery(query) {
    this.queryStats.delete(query);
    this.executionHistory = this.executionHistory.filter(entry => entry.query !== query);
  }

  clear() {
    this.queryStats.clear();
    this.executionHistory = [];
  }

  _calculateCacheHitRate() {
    const totalHits = Array.from(this.queryStats.values())
      .reduce((sum, stats) => sum + stats.hits, 0);
    const totalAttempts = totalHits + Array.from(this.queryStats.values())
      .reduce((sum, stats) => sum + stats.misses, 0);

    return totalAttempts > 0 
      ? (totalHits / totalAttempts * 100).toFixed(2) + '%'
      : '0%';
  }
}

module.exports = { DatabaseCacheMiddleware };