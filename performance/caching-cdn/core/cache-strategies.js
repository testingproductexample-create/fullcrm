/**
 * Advanced cache strategies for different use cases
 */
class CacheStrategies {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.strategies = new Map();
    this._initializeStrategies();
  }

  /**
   * Initialize built-in strategies
   */
  _initializeStrategies() {
    // LRU (Least Recently Used) Strategy
    this.registerStrategy('lru', new LRUStrategy(this.cacheManager));
    
    // TTL (Time To Live) Strategy
    this.registerStrategy('ttl', new TLTStrategy(this.cacheManager));
    
    // Smart Strategy (combines multiple factors)
    this.registerStrategy('smart', new SmartStrategy(this.cacheManager));
    
    // Write-through Strategy
    this.registerStrategy('write-through', new WriteThroughStrategy(this.cacheManager));
    
    // Write-behind Strategy
    this.registerStrategy('write-behind', new WriteBehindStrategy(this.cacheManager));
    
    // Cache-aside Strategy
    this.registerStrategy('cache-aside', new CacheAsideStrategy(this.cacheManager));
    
    // Read-through Strategy
    this.registerStrategy('read-through', new ReadThroughStrategy(this.cacheManager));
  }

  /**
   * Register custom strategy
   */
  registerStrategy(name, strategy) {
    this.strategies.set(name, strategy);
  }

  /**
   * Get strategy by name
   */
  getStrategy(name) {
    return this.strategies.get(name);
  }

  /**
   * Get all strategies
   */
  getAllStrategies() {
    return Array.from(this.strategies.keys());
  }

  /**
   * Apply strategy with automatic strategy selection
   */
  async applyStrategy(operation, key, options = {}) {
    const strategyName = options.strategy || 'smart';
    const strategy = this.getStrategy(strategyName);
    
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }
    
    return await strategy[operation](key, options);
  }
}

/**
 * LRU (Least Recently Used) Strategy
 */
class LRUStrategy {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.accessLog = new Map();
  }

  async get(key, options = {}) {
    const value = await this.cacheManager.get(key, options);
    
    // Update access log
    if (value !== null) {
      this.accessLog.set(key, Date.now());
    }
    
    return value;
  }

  async set(key, value, options = {}) {
    const result = await this.cacheManager.set(key, value, options);
    
    if (result) {
      this.accessLog.set(key, Date.now());
    }
    
    return result;
  }

  async delete(key) {
    this.accessLog.delete(key);
    return await this.cacheManager.delete(key);
  }

  getMetrics() {
    return {
      strategy: 'lru',
      accessLogSize: this.accessLog.size
    };
  }
}

/**
 * TTL (Time To Live) Strategy
 */
class TLTStrategy {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.ttlRules = new Map();
  }

  async get(key, options = {}) {
    return await this.cacheManager.get(key, options);
  }

  async set(key, value, options = {}) {
    // Apply TTL rules
    const ttl = this._calculateTTL(key, options);
    
    return await this.cacheManager.set(key, value, { 
      ...options, 
      ttl 
    });
  }

  async delete(key) {
    return await this.cacheManager.delete(key);
  }

  /**
   * Calculate appropriate TTL based on key patterns
   */
  _calculateTTL(key, options = {}) {
    // Static content: longer TTL
    if (key.includes('static') || key.includes('asset')) {
      return 86400; // 24 hours
    }
    
    // User data: medium TTL
    if (key.includes('user') || key.includes('profile')) {
      return 1800; // 30 minutes
    }
    
    // API responses: variable TTL
    if (key.includes('api:')) {
      return 3600; // 1 hour
    }
    
    // Default TTL
    return options.ttl || 3600;
  }

  addTTLRule(pattern, ttl) {
    this.ttlRules.set(pattern, ttl);
  }

  getMetrics() {
    return {
      strategy: 'ttl',
      ttlRules: this.ttlRules.size
    };
  }
}

/**
 * Smart Strategy (combines multiple factors)
 */
class SmartStrategy {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.accessPatterns = new Map();
    this.sizeLimits = new Map();
  }

  async get(key, options = {}) {
    const startTime = Date.now();
    
    // Check access patterns
    const accessCount = this.accessPatterns.get(key) || 0;
    const accessFrequency = this._calculateAccessFrequency(key);
    
    // Predictive caching: cache data that's likely to be accessed
    if (accessCount > 5 || accessFrequency > 0.1) {
      const value = await this.cacheManager.get(key, options);
      
      if (value !== null) {
        this.accessPatterns.set(key, accessCount + 1);
        
        // Preload related data if high access
        if (accessCount > 10) {
          this._preloadRelatedData(key, options);
        }
      }
      
      return value;
    }
    
    return await this.cacheManager.get(key, options);
  }

  async set(key, value, options = {}) {
    // Check size limits
    const estimatedSize = JSON.stringify(value).length;
    const keyType = this._classifyKey(key);
    
    // Dynamic TTL based on data type and size
    const dynamicTTL = this._calculateDynamicTTL(key, value, keyType);
    
    // Compress large values automatically
    if (estimatedSize > 1024 * 100) { // 100KB
      options.compress = true;
    }
    
    const result = await this.cacheManager.set(key, value, { 
      ...options, 
      ttl: dynamicTTL 
    });
    
    if (result) {
      this.accessPatterns.set(key, (this.accessPatterns.get(key) || 0) + 1);
    }
    
    return result;
  }

  async delete(key) {
    this.accessPatterns.delete(key);
    return await this.cacheManager.delete(key);
  }

  /**
   * Calculate access frequency for a key
   */
  _calculateAccessFrequency(key) {
    const now = Date.now();
    const window = 3600000; // 1 hour
    
    // Track access timestamps
    if (!this.accessPatterns.has(key + ':timestamps')) {
      this.accessPatterns.set(key + ':timestamps', []);
    }
    
    const timestamps = this.accessPatterns.get(key + ':timestamps');
    timestamps.push(now);
    
    // Remove old timestamps
    const recentTimestamps = timestamps.filter(ts => now - ts < window);
    this.accessPatterns.set(key + ':timestamps', recentTimestamps);
    
    return recentTimestamps.length / (window / 1000);
  }

  /**
   * Preload related data based on access patterns
   */
  async _preloadRelatedData(key, options = {}) {
    const relatedKeys = this._findRelatedKeys(key);
    
    for (const relatedKey of relatedKeys) {
      // Check if related key is already cached
      if (!(await this.cacheManager.exists(relatedKey))) {
        // Trigger data load for related key
        this.cacheManager.emit('preload_request', { key: relatedKey });
      }
    }
  }

  /**
   * Find related keys based on patterns
   */
  _findRelatedKeys(key) {
    const relatedKeys = [];
    const baseKey = key.split(':')[0];
    
    // Add common related patterns
    relatedKeys.push(`${baseKey}:metadata`);
    relatedKeys.push(`${baseKey}:config`);
    relatedKeys.push(`${baseKey}:summary`);
    
    return relatedKeys;
  }

  /**
   * Classify key type for optimization
   */
  _classifyKey(key) {
    if (key.includes('user:')) return 'user_data';
    if (key.includes('api:')) return 'api_response';
    if (key.includes('static:') || key.includes('asset:')) return 'static_content';
    if (key.includes('session:')) return 'session_data';
    return 'general';
  }

  /**
   * Calculate dynamic TTL based on multiple factors
   */
  _calculateDynamicTTL(key, value, keyType) {
    let baseTTL;
    
    // Base TTL by type
    const typeTTL = {
      'user_data': 1800,     // 30 minutes
      'api_response': 3600,   // 1 hour
      'static_content': 86400, // 24 hours
      'session_data': 3600,   // 1 hour
      'general': 3600         // 1 hour
    };
    
    baseTTL = typeTTL[keyType] || 3600;
    
    // Adjust based on value size
    const size = JSON.stringify(value).length;
    if (size > 1024 * 1024) { // 1MB
      baseTTL *= 2; // Cache larger objects longer
    } else if (size < 1024) { // 1KB
      baseTTL *= 0.5; // Cache smaller objects shorter
    }
    
    return Math.floor(baseTTL);
  }

  getMetrics() {
    return {
      strategy: 'smart',
      accessPatterns: this.accessPatterns.size,
      sizeLimits: this.sizeLimits.size
    };
  }
}

/**
 * Write-through Strategy
 */
class WriteThroughStrategy {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
  }

  async get(key, options = {}) {
    return await this.cacheManager.get(key, options);
  }

  async set(key, value, options = {}) {
    // Write to cache and data source simultaneously
    const cacheResult = await this.cacheManager.set(key, value, options);
    
    // Update data source (e.g., database)
    try {
      await this._updateDataSource(key, value, options);
    } catch (error) {
      // If data source update fails, invalidate cache
      await this.cacheManager.delete(key, options);
      throw error;
    }
    
    return cacheResult;
  }

  async delete(key) {
    const cacheResult = await this.cacheManager.delete(key);
    
    // Delete from data source
    try {
      await this._deleteFromDataSource(key);
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to delete from data source:', error);
    }
    
    return cacheResult;
  }

  async _updateDataSource(key, value, options) {
    // Implement data source update logic
    // This is a placeholder - implement based on your data source
  }

  async _deleteFromDataSource(key) {
    // Implement data source delete logic
    // This is a placeholder - implement based on your data source
  }

  getMetrics() {
    return {
      strategy: 'write-through'
    };
  }
}

/**
 * Write-behind Strategy
 */
class WriteBehindStrategy {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.writeQueue = new Map();
    this.flushInterval = 5000; // 5 seconds
    this._startFlushTimer();
  }

  async set(key, value, options = {}) {
    // Write to cache first
    const cacheResult = await this.cacheManager.set(key, value, options);
    
    // Queue for later write to data source
    this.writeQueue.set(key, {
      operation: 'set',
      value,
      options,
      timestamp: Date.now()
    });
    
    return cacheResult;
  }

  async delete(key, options = {}) {
    const cacheResult = await this.cacheManager.delete(key, options);
    
    // Queue for later delete from data source
    this.writeQueue.set(key, {
      operation: 'delete',
      options,
      timestamp: Date.now()
    });
    
    return cacheResult;
  }

  /**
   * Start flush timer
   */
  _startFlushTimer() {
    setInterval(() => {
      this._flushWriteQueue();
    }, this.flushInterval);
  }

  /**
   * Flush write queue to data source
   */
  async _flushWriteQueue() {
    if (this.writeQueue.size === 0) return;
    
    const operations = Array.from(this.writeQueue.entries());
    this.writeQueue.clear();
    
    for (const [key, operation] of operations) {
      try {
        if (operation.operation === 'set') {
          await this._updateDataSource(key, operation.value, operation.options);
        } else if (operation.operation === 'delete') {
          await this._deleteFromDataSource(key, operation.options);
        }
      } catch (error) {
        console.error(`Failed to flush ${operation.operation} for key ${key}:`, error);
        // Re-queue failed operations
        this.writeQueue.set(key, operation);
      }
    }
  }

  async _updateDataSource(key, value, options) {
    // Implement data source update logic
  }

  async _deleteFromDataSource(key, options) {
    // Implement data source delete logic
  }

  getMetrics() {
    return {
      strategy: 'write-behind',
      queueSize: this.writeQueue.size,
      flushInterval: this.flushInterval
    };
  }
}

/**
 * Cache-aside Strategy
 */
class CacheAsideStrategy {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.dataLoader = null;
  }

  setDataLoader(loader) {
    this.dataLoader = loader;
  }

  async get(key, options = {}) {
    // Try cache first
    let value = await this.cacheManager.get(key, options);
    
    if (value === null) {
      // Cache miss - load from data source
      if (this.dataLoader) {
        value = await this.dataLoader(key, options);
        
        if (value !== null) {
          // Cache the result
          await this.cacheManager.set(key, value, options);
        }
      }
    }
    
    return value;
  }

  async set(key, value, options = {}) {
    // Update cache
    const result = await this.cacheManager.set(key, value, options);
    
    // Optionally update data source
    if (options.updateDataSource) {
      try {
        await this._updateDataSource(key, value, options);
      } catch (error) {
        console.error('Failed to update data source:', error);
      }
    }
    
    return result;
  }

  async delete(key, options = {}) {
    return await this.cacheManager.delete(key, options);
  }

  async _updateDataSource(key, value, options) {
    // Implement data source update logic
  }

  getMetrics() {
    return {
      strategy: 'cache-aside',
      hasDataLoader: !!this.dataLoader
    };
  }
}

/**
 * Read-through Strategy
 */
class ReadThroughStrategy {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.dataLoader = null;
  }

  setDataLoader(loader) {
    this.dataLoader = loader;
  }

  async get(key, options = {}) {
    // Always go through data loader and cache result
    let value = null;
    
    if (this.dataLoader) {
      value = await this.dataLoader(key, options);
      
      if (value !== null) {
        await this.cacheManager.set(key, value, options);
      }
    }
    
    return value;
  }

  async set(key, value, options = {}) {
    return await this.cacheManager.set(key, value, options);
  }

  async delete(key, options = {}) {
    return await this.cacheManager.delete(key, options);
  }

  getMetrics() {
    return {
      strategy: 'read-through',
      hasDataLoader: !!this.dataLoader
    };
  }
}

module.exports = { CacheStrategies };