const EventEmitter = require('events');

/**
 * Advanced query invalidator with smart dependency tracking
 */
class QueryInvalidator extends EventEmitter {
  constructor(queryCache, options = {}) {
    super();
    
    this.queryCache = queryCache;
    this.options = {
      enableSmartInvalidation: options.enableSmartInvalidation !== false,
      enableBatchInvalidation: options.enableBatchInvalidation !== false,
      batchSize: options.batchSize || 50,
      invalidationDelay: options.invalidationDelay || 100,
      maxDependencyDepth: options.maxDependencyDepth || 5,
      ...options
    };
    
    this.dependencyGraph = new Map();
    this.invalidationQueue = [];
    this.batchProcessor = null;
    this.invalidationHistory = [];
    this.performanceMetrics = {
      totalInvalidations: 0,
      averageInvalidationTime: 0,
      batchOperations: 0,
      smartInvalidations: 0,
      cascadeInvalidations: 0
    };
    
    this._setupBatchProcessing();
  }

  /**
   * Invalidate queries based on table changes
   */
  async invalidateTable(tableName, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        cascade = true,
        depth = 0,
        excludeQueries = [],
        priority = 'normal',
        reason = 'table_update'
      } = options;
      
      const invalidationId = this._generateInvalidationId();
      const invalidatedQueries = new Set();
      
      // Log invalidation start
      this._logInvalidation({
        id: invalidationId,
        type: 'table',
        target: tableName,
        reason,
        priority,
        timestamp: startTime
      });
      
      // Find direct dependencies
      const directDependencies = this._findDirectDependencies(tableName);
      
      for (const queryKey of directDependencies) {
        if (excludeQueries.includes(queryKey)) continue;
        
        if (await this._invalidateQuery(queryKey, {
          reason: `table_${reason}`,
          invalidationId,
          depth
        })) {
          invalidatedQueries.add(queryKey);
        }
      }
      
      // Handle cascade invalidation
      if (cascade && depth < this.options.maxDependencyDepth) {
        const cascadeQueries = await this._handleCascadeInvalidation(
          Array.from(invalidatedQueries),
          depth + 1,
          excludeQueries,
          invalidationId
        );
        cascadeQueries.forEach(query => invalidatedQueries.add(query));
      }
      
      // Batch process invalidations
      if (this.options.enableBatchInvalidation) {
        await this._queueBatchInvalidation(Array.from(invalidatedQueries), {
          invalidationId,
          reason: `batch_${reason}`,
          priority
        });
      } else {
        // Process immediately
        for (const query of invalidatedQueries) {
          await this._invalidateQuery(query, {
            reason: `immediate_${reason}`,
            invalidationId
          });
        }
      }
      
      const duration = Date.now() - startTime;
      this._updateMetrics('totalInvalidations', 1);
      this._updateMetrics('averageInvalidationTime', duration);
      
      // Log completion
      this._logInvalidation({
        id: invalidationId,
        type: 'table',
        target: tableName,
        result: 'completed',
        invalidatedQueries: invalidatedQueries.size,
        duration,
        cascade
      });
      
      this.emit('table_invalidated', {
        tableName,
        invalidatedQueries: Array.from(invalidatedQueries),
        duration,
        cascade,
        invalidationId
      });
      
      return {
        success: true,
        tableName,
        invalidatedCount: invalidatedQueries.size,
        duration,
        cascade,
        invalidationId
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.emit('invalidation_error', {
        type: 'table',
        target: tableName,
        error: error.message,
        duration
      });
      
      throw error;
    }
  }

  /**
   * Invalidate queries based on data changes
   */
  async invalidateData(identifiers, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        patternMatching = true,
        fuzzy = false,
        excludePatterns = [],
        reason = 'data_change'
      } = options;
      
      const invalidationId = this._generateInvalidationId();
      const invalidatedQueries = new Set();
      
      // Log invalidation start
      this._logInvalidation({
        id: invalidationId,
        type: 'data',
        target: identifiers,
        reason,
        timestamp: startTime
      });
      
      for (const identifier of identifiers) {
        // Find queries containing this identifier
        const matchingQueries = await this._findQueriesByIdentifier(identifier, {
          fuzzy,
          excludePatterns
        });
        
        for (const queryKey of matchingQueries) {
          if (await this._invalidateQuery(queryKey, {
            reason: `data_${reason}`,
            invalidationId,
            identifier
          })) {
            invalidatedQueries.add(queryKey);
          }
        }
      }
      
      const duration = Date.now() - startTime;
      this._updateMetrics('totalInvalidations', 1);
      
      this.emit('data_invalidated', {
        identifiers,
        invalidatedQueries: Array.from(invalidatedQueries),
        duration,
        invalidationId
      });
      
      return {
        success: true,
        identifiers,
        invalidatedCount: invalidatedQueries.size,
        duration,
        invalidationId
      };
      
    } catch (error) {
      this.emit('invalidation_error', {
        type: 'data',
        target: identifiers,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Smart invalidation based on change impact analysis
   */
  async smartInvalidate(changeContext) {
    if (!this.options.enableSmartInvalidation) {
      return await this.invalidateData([changeContext.identifier], changeContext);
    }
    
    const startTime = Date.now();
    const { type, scope, impact } = changeContext;
    
    try {
      const invalidationId = this._generateInvalidationId();
      const affectedQueries = new Set();
      
      // Analyze change impact
      const impactAnalysis = await this._analyzeChangeImpact(changeContext);
      
      // Determine invalidation strategy
      const strategy = this._determineInvalidationStrategy(impactAnalysis);
      
      // Apply strategy
      for (const queryInfo of strategy.queries) {
        if (await this._invalidateQuery(queryInfo.key, {
          reason: `smart_${type}`,
          invalidationId,
          impact: queryInfo.impact,
          strategy: strategy.name
        })) {
          affectedQueries.add(queryInfo.key);
        }
      }
      
      // Handle related changes
      if (strategy.relatedChanges) {
        const relatedInvalidations = await Promise.all(
          strategy.relatedChanges.map(change => this.smartInvalidate(change))
        );
        
        // Merge results
        relatedInvalidations.forEach(result => {
          if (result.success) {
            result.invalidatedQueries.forEach(query => affectedQueries.add(query));
          }
        });
      }
      
      const duration = Date.now() - startTime;
      this._updateMetrics('smartInvalidations', 1);
      this._updateMetrics('totalInvalidations', 1);
      
      this.emit('smart_invalidation_completed', {
        changeContext,
        strategy: strategy.name,
        affectedQueries: Array.from(affectedQueries),
        duration,
        impactAnalysis
      });
      
      return {
        success: true,
        strategy: strategy.name,
        affectedQueries: Array.from(affectedQueries),
        duration,
        impactAnalysis
      };
      
    } catch (error) {
      this.emit('smart_invalidation_error', {
        changeContext,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Setup batch processing for invalidations
   */
  _setupBatchProcessing() {
    if (!this.options.enableBatchInvalidation) return;
    
    this.batchProcessor = setInterval(() => {
      this._processBatchQueue();
    }, this.options.batchInterval || 1000);
  }

  /**
   * Queue batch invalidation
   */
  async _queueBatchInvalidation(queries, metadata) {
    this.invalidationQueue.push({
      queries,
      metadata,
      timestamp: Date.now()
    });
    
    // Process if queue is full
    if (this.invalidationQueue.length >= this.options.batchSize) {
      await this._processBatchQueue();
    }
  }

  /**
   * Process batch queue
   */
  async _processBatchQueue() {
    if (this.invalidationQueue.length === 0) return;
    
    const batch = this.invalidationQueue.splice(0, this.options.batchSize);
    const startTime = Date.now();
    
    try {
      // Group by metadata for efficient processing
      const groups = this._groupBatchByMetadata(batch);
      
      for (const [metadataKey, group] of groups) {
        const allQueries = group.reduce((acc, item) => [...acc, ...item.queries], []);
        const uniqueQueries = Array.from(new Set(allQueries));
        
        // Process batch
        await this._executeBatchInvalidation(uniqueQueries, group[0].metadata);
      }
      
      const duration = Date.now() - startTime;
      this._updateMetrics('batchOperations', 1);
      this._updateMetrics('averageInvalidationTime', duration);
      
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }

  /**
   * Execute batch invalidation
   */
  async _executeBatchInvalidation(queries, metadata) {
    const promises = queries.map(queryKey => 
      this._invalidateQuery(queryKey, metadata)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Group batch items by metadata
   */
  _groupBatchByMetadata(batch) {
    const groups = new Map();
    
    batch.forEach(item => {
      const key = JSON.stringify(item.metadata);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(item);
    });
    
    return groups;
  }

  /**
   * Find direct dependencies
   */
  _findDirectDependencies(tableName) {
    const dependencies = new Set();
    
    // Check dependency graph
    if (this.dependencyGraph.has(tableName)) {
      this.dependencyGraph.get(tableName).forEach(query => {
        dependencies.add(query);
      });
    }
    
    return dependencies;
  }

  /**
   * Handle cascade invalidation
   */
  async _handleCascadeInvalidation(queries, depth, excludeQueries, invalidationId) {
    if (depth >= this.options.maxDependencyDepth) return [];
    
    const cascadeQueries = new Set();
    this._updateMetrics('cascadeInvalidations', 1);
    
    for (const queryKey of queries) {
      // Find queries that depend on this query
      const dependentQueries = this._findDependentQueries(queryKey);
      
      for (const dependentQuery of dependentQueries) {
        if (excludeQueries.includes(dependentQuery)) continue;
        
        if (await this._invalidateQuery(dependentQuery, {
          reason: 'cascade',
          invalidationId,
          depth
        })) {
          cascadeQueries.add(dependentQuery);
          
          // Recursive cascade
          const recursiveQueries = await this._handleCascadeInvalidation(
            [dependentQuery],
            depth + 1,
            excludeQueries,
            invalidationId
          );
          recursiveQueries.forEach(q => cascadeQueries.add(q));
        }
      }
    }
    
    return Array.from(cascadeQueries);
  }

  /**
   * Find dependent queries
   */
  _findDependentQueries(queryKey) {
    const dependents = new Set();
    
    // This is a simplified implementation
    // In production, you would maintain a reverse dependency graph
    for (const [table, queries] of this.dependencyGraph) {
      queries.forEach(query => {
        if (query !== queryKey) {
          dependents.add(query);
        }
      });
    }
    
    return dependents;
  }

  /**
   * Find queries by identifier
   */
  async _findQueriesByIdentifier(identifier, options = {}) {
    const { fuzzy = false, excludePatterns = [] } = options;
    const matches = new Set();
    
    // Get all cached queries (this would come from queryCache)
    const allQueries = []; // This would be implemented with actual query cache
    
    for (const queryKey of allQueries) {
      if (excludePatterns.some(pattern => queryKey.includes(pattern))) continue;
      
      if (fuzzy) {
        // Fuzzy matching logic
        if (this._fuzzyMatch(queryKey, identifier)) {
          matches.add(queryKey);
        }
      } else {
        // Exact matching
        if (queryKey.includes(identifier)) {
          matches.add(queryKey);
        }
      }
    }
    
    return Array.from(matches);
  }

  /**
   * Fuzzy matching for query identification
   */
  _fuzzyMatch(queryKey, identifier) {
    // Simplified fuzzy matching
    // In production, use more sophisticated algorithms like Levenshtein distance
    const normalizedQuery = queryKey.toLowerCase();
    const normalizedIdentifier = identifier.toLowerCase();
    
    return normalizedQuery.includes(normalizedIdentifier) ||
           normalizedIdentifier.includes(normalizedQuery) ||
           this._calculateSimilarity(normalizedQuery, normalizedIdentifier) > 0.8;
  }

  /**
   * Calculate similarity between strings
   */
  _calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this._editDistance(longer, shorter)) / longer.length;
  }

  /**
   * Calculate edit distance
   */
  _editDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Invalidate single query
   */
  async _invalidateQuery(queryKey, options = {}) {
    try {
      await this.queryCache.delete(queryKey);
      return true;
    } catch (error) {
      console.error(`Failed to invalidate query ${queryKey}:`, error);
      return false;
    }
  }

  /**
   * Analyze change impact
   */
  async _analyzeChangeImpact(changeContext) {
    const { type, scope, identifier } = changeContext;
    
    // Simplified impact analysis
    const impact = {
      scope: scope || 'local',
      propagation: 'direct',
      affectedQueries: [],
      riskLevel: 'low'
    };
    
    // High-impact changes
    if (type === 'schema_change' || type === 'bulk_update') {
      impact.riskLevel = 'high';
      impact.propagation = 'cascade';
      impact.affectedQueries = await this._findQueriesByIdentifier(identifier, { fuzzy: true });
    } else if (type === 'single_update') {
      impact.riskLevel = 'medium';
      impact.affectedQueries = await this._findQueriesByIdentifier(identifier, { fuzzy: false });
    }
    
    return impact;
  }

  /**
   * Determine invalidation strategy
   */
  _determineInvalidationStrategy(impactAnalysis) {
    const { scope, riskLevel, affectedQueries } = impactAnalysis;
    
    if (riskLevel === 'high') {
      return {
        name: 'aggressive',
        queries: affectedQueries.map(q => ({ key: q, impact: 'high' })),
        relatedChanges: []
      };
    } else if (riskLevel === 'medium') {
      return {
        name: 'selective',
        queries: affectedQueries.map(q => ({ key: q, impact: 'medium' })),
        relatedChanges: []
      };
    } else {
      return {
        name: 'conservative',
        queries: affectedQueries.slice(0, 10).map(q => ({ key: q, impact: 'low' })),
        relatedChanges: []
      };
    }
  }

  /**
   * Generate invalidation ID
   */
  _generateInvalidationId() {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log invalidation
   */
  _logInvalidation(entry) {
    this.invalidationHistory.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 entries
    if (this.invalidationHistory.length > 1000) {
      this.invalidationHistory = this.invalidationHistory.slice(-1000);
    }
  }

  /**
   * Update metrics
   */
  _updateMetrics(metric, value) {
    if (typeof this.performanceMetrics[metric] === 'number') {
      if (metric === 'averageInvalidationTime') {
        this.performanceMetrics[metric] = 
          (this.performanceMetrics[metric] * 0.9) + (value * 0.1);
      } else {
        this.performanceMetrics[metric] += value;
      }
    }
  }

  /**
   * Get invalidation statistics
   */
  getStats() {
    return {
      ...this.performanceMetrics,
      queueSize: this.invalidationQueue.length,
      dependencyGraphSize: this.dependencyGraph.size,
      recentInvalidations: this.invalidationHistory.slice(-10)
    };
  }

  /**
   * Shutdown invalidator
   */
  shutdown() {
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor);
    }
    
    // Process remaining queue
    if (this.invalidationQueue.length > 0) {
      this._processBatchQueue();
    }
  }
}

module.exports = { QueryInvalidator };