const { RedisClient } = require('./redis-client');
const EventEmitter = require('events');

/**
 * Advanced cache manager with multi-level caching strategies
 */
class CacheManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      redis: config.redis || {},
      ttl: {
        default: config.ttl?.default || 3600,
        short: config.ttl?.short || 300,
        medium: config.ttl?.medium || 1800,
        long: config.ttl?.long || 86400
      },
      maxMemoryPolicy: config.maxMemoryPolicy || 'allkeys-lru',
      enableCompression: config.enableCompression !== false,
      enableMonitoring: config.enableMonitoring !== false,
      ...config
    };
    
    this.redis = null;
    this.memoryCache = new Map();
    this.memoryCacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0
    };
    this.cacheStrategies = new Map();
    this.namespaces = new Map();
    this.invalidationChannels = new Map();
    this.metrics = {
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      averageLatency: 0,
      cacheLayers: {
        l1: { hits: 0, misses: 0 },
        l2: { hits: 0, misses: 0 },
        l3: { hits: 0, misses: 0 }
      }
    };
  }

  /**
   * Initialize the cache manager
   */
  async initialize() {
    try {
      // Initialize Redis connection
      this.redis = new RedisClient(this.config.redis);
      await this.redis.connect();
      
      // Setup event handlers
      this._setupEventHandlers();
      
      // Initialize memory cache with LRU eviction
      this._setupMemoryCache();
      
      // Setup cache strategies
      this._setupCacheStrategies();
      
      // Setup invalidation system
      this._setupInvalidationSystem();
      
      // Start monitoring
      if (this.config.enableMonitoring) {
        this._startMonitoring();
      }
      
      this.emit('initialized');
      console.log('✅ Cache manager initialized successfully');
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get value from cache with multi-level lookup
   */
  async get(key, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      const fullKey = this._buildKey(key, options.namespace);
      
      // L1: Memory cache lookup
      const l1Result = await this._getFromMemoryCache(fullKey);
      if (l1Result !== null) {
        this.metrics.cacheLayers.l1.hits++;
        this.metrics.totalHits++;
        this._recordLatency(startTime);
        this.emit('cache_hit', { key: fullKey, layer: 'L1' });
        return l1Result;
      }
      
      // L2: Redis cache lookup
      const l2Result = await this._getFromRedisCache(fullKey);
      if (l2Result !== null) {
        // Populate L1 cache
        await this._setMemoryCache(fullKey, l2Result);
        this.metrics.cacheLayers.l2.hits++;
        this.metrics.totalHits++;
        this._recordLatency(startTime);
        this.emit('cache_hit', { key: fullKey, layer: 'L2' });
        return l2Result;
      }
      
      // Cache miss
      this.metrics.totalMisses++;
      this.metrics.cacheLayers.l1.misses++;
      this.metrics.cacheLayers.l2.misses++;
      this._recordLatency(startTime);
      this.emit('cache_miss', { key: fullKey });
      
      return null;
      
    } catch (error) {
      this.emit('error', new Error(`Cache GET error for key ${key}: ${error.message}`));
      return null;
    }
  }

  /**
   * Set value in cache with multi-level storage
   */
  async set(key, value, options = {}) {
    const fullKey = this._buildKey(key, options.namespace);
    const ttl = options.ttl || this.config.ttl.default;
    
    try {
      // Set in L1 (Memory)
      await this._setMemoryCache(fullKey, value);
      
      // Set in L2 (Redis)
      await this._setRedisCache(fullKey, value, ttl);
      
      // Set in L3 (CDN) if configured
      if (options.enableCdn !== false) {
        await this._setCdnCache(fullKey, value, ttl);
      }
      
      // Setup invalidation if needed
      if (options.tags) {
        this._setupInvalidationTags(fullKey, options.tags);
      }
      
      this.emit('cache_set', { key: fullKey, ttl, size: JSON.stringify(value).length });
      
      return true;
      
    } catch (error) {
      this.emit('error', new Error(`Cache SET error for key ${key}: ${error.message}`));
      return false;
    }
  }

  /**
   * Delete value from all cache layers
   */
  async delete(key, options = {}) {
    const fullKey = this._buildKey(key, options.namespace);
    
    try {
      // Delete from all layers
      await Promise.all([
        this._deleteFromMemoryCache(fullKey),
        this._deleteFromRedisCache(fullKey),
        this._deleteFromCdnCache(fullKey)
      ]);
      
      // Clean up invalidation tags
      this._cleanupInvalidationTags(fullKey);
      
      this.emit('cache_delete', { key: fullKey });
      
      return true;
      
    } catch (error) {
      this.emit('error', new Error(`Cache DELETE error for key ${key}: ${error.message}`));
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern, options = {}) {
    const fullPattern = this._buildKey(pattern, options.namespace);
    
    try {
      let deletedCount = 0;
      
      // Delete from Redis
      deletedCount += await this.redis.del(fullPattern);
      
      // Delete from memory cache
      for (const [key] of this.memoryCache) {
        if (this._matchPattern(key, fullPattern)) {
          this.memoryCache.delete(key);
          deletedCount++;
        }
      }
      
      this.emit('cache_delete_pattern', { pattern: fullPattern, count: deletedCount });
      
      return deletedCount;
      
    } catch (error) {
      this.emit('error', new Error(`Cache DELETE PATTERN error for ${pattern}: ${error.message}`));
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key, options = {}) {
    const fullKey = this._buildKey(key, options.namespace);
    
    try {
      // Check L1 first
      if (this.memoryCache.has(fullKey)) {
        return true;
      }
      
      // Check L2
      return await this.redis.exists(fullKey);
      
    } catch (error) {
      this.emit('error', new Error(`Cache EXISTS error for key ${key}: ${error.message}`));
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key, options = {}) {
    const fullKey = this._buildKey(key, options.namespace);
    
    try {
      return await this.redis.ttl(fullKey);
    } catch (error) {
      this.emit('error', new Error(`Cache TTL error for key ${key}: ${error.message}`));
      return -1;
    }
  }

  /**
   * Extend TTL for key
   */
  async extend(key, seconds, options = {}) {
    const fullKey = this._buildKey(key, options.namespace);
    
    try {
      return await this.redis.expire(fullKey, seconds);
    } catch (error) {
      this.emit('error', new Error(`Cache EXTEND error for key ${key}: ${error.message}`));
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.metrics.totalRequests;
    const hitRate = totalRequests > 0 
      ? (this.metrics.totalHits / totalRequests * 100).toFixed(2) + '%' 
      : '0%';
    
    return {
      metrics: this.metrics,
      memoryCache: {
        ...this.memoryCacheStats,
        size: this.memoryCache.size,
        maxSize: this.config.maxMemorySize || 'unlimited'
      },
      redis: this.redis ? this.redis.getStats() : null,
      hitRate,
      latency: {
        average: this.metrics.averageLatency.toFixed(2) + 'ms',
        p50: this._calculatePercentile(50),
        p95: this._calculatePercentile(95),
        p99: this._calculatePercentile(99)
      }
    };
  }

  /**
   * Clear all cache
   */
  async clear(options = {}) {
    try {
      if (!options.memoryOnly) {
        // Clear Redis cache
        const pattern = this._buildKey('*', options.namespace);
        await this.redis.del(pattern);
      }
      
      // Clear memory cache
      if (!options.redisOnly) {
        this.memoryCache.clear();
        this.memoryCacheStats = {
          hits: 0,
          misses: 0,
          evictions: 0,
          size: 0
        };
      }
      
      this.emit('cache_cleared', options);
      
    } catch (error) {
      this.emit('error', new Error(`Cache CLEAR error: ${error.message}`));
    }
  }

  /**
   * Register cache strategy
   */
  registerStrategy(name, strategy) {
    this.cacheStrategies.set(name, strategy);
  }

  /**
   * Setup event handlers
   */
  _setupEventHandlers() {
    this.redis.on('error', (error) => {
      this.emit('redis_error', error);
    });
    
    this.redis.on('disconnected', () => {
      this.emit('cache_degraded', { level: 'L2' });
    });
    
    this.redis.on('reconnected', () => {
      this.emit('cache_restored', { level: 'L2' });
    });
  }

  /**
   * Setup memory cache with LRU eviction
   */
  _setupMemoryCache() {
    const maxSize = this.config.maxMemorySize || 1000;
    
    setInterval(() => {
      if (this.memoryCache.size > maxSize) {
        // LRU eviction: remove oldest accessed items
        const entries = Array.from(this.memoryCache.entries())
          .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        
        const toRemove = Math.ceil(entries.length * 0.1); // Remove 10%
        for (let i = 0; i < toRemove; i++) {
          this.memoryCache.delete(entries[i][0]);
          this.memoryCacheStats.evictions++;
        }
      }
    }, 60000); // Run every minute
  }

  /**
   * Setup cache strategies
   */
  _setupCacheStrategies() {
    // LRU Strategy
    this.registerStrategy('lru', {
      get: (key) => this.get(key),
      set: (key, value, ttl) => this.set(key, value, { ttl }),
      delete: (key) => this.delete(key)
    });
    
    // TTL Strategy
    this.registerStrategy('ttl', {
      get: (key) => this.get(key),
      set: (key, value, ttl) => this.set(key, value, { ttl }),
      delete: (key) => this.delete(key)
    });
    
    // Write-through Strategy
    this.registerStrategy('write-through', {
      get: (key) => this.get(key),
      set: (key, value, ttl) => this.set(key, value, { ttl }),
      delete: (key) => this.delete(key)
    });
  }

  /**
   * Setup invalidation system
   */
  _setupInvalidationSystem() {
    // Subscribe to invalidation channels
    this.redis.subscribe('cache_invalidation', (message) => {
      this._handleInvalidationMessage(message);
    });
  }

  /**
   * Start monitoring
   */
  _startMonitoring() {
    setInterval(() => {
      this.emit('metrics', this.getStats());
    }, 30000); // Emit metrics every 30 seconds
  }

  /**
   * Build full key with namespace
   */
  _buildKey(key, namespace) {
    if (!namespace) return key;
    return `${namespace}:${key}`;
  }

  /**
   * Get from memory cache
   */
  async _getFromMemoryCache(key) {
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      entry.lastAccess = Date.now();
      this.memoryCacheStats.hits++;
      return entry.value;
    }
    
    this.memoryCacheStats.misses++;
    return null;
  }

  /**
   * Set memory cache
   */
  async _setMemoryCache(key, value) {
    this.memoryCache.set(key, {
      value,
      lastAccess: Date.now(),
      created: Date.now()
    });
  }

  /**
   * Delete from memory cache
   */
  async _deleteFromMemoryCache(key) {
    return this.memoryCache.delete(key);
  }

  /**
   * Get from Redis cache
   */
  async _getFromRedisCache(key) {
    return await this.redis.get(key);
  }

  /**
   * Set Redis cache
   */
  async _setRedisCache(key, value, ttl) {
    return await this.redis.set(key, value, ttl, {
      compress: this.config.enableCompression
    });
  }

  /**
   * Delete from Redis cache
   */
  async _deleteFromRedisCache(key) {
    return await this.redis.del(key);
  }

  /**
   * Set CDN cache (placeholder for implementation)
   */
  async _setCdnCache(key, value, ttl) {
    // In production, implement CDN cache logic here
    return true;
  }

  /**
   * Delete from CDN cache
   */
  async _deleteFromCdnCache(key) {
    // In production, implement CDN cache invalidation here
    return true;
  }

  /**
   * Setup invalidation tags
   */
  _setupInvalidationTags(key, tags) {
    tags.forEach(tag => {
      if (!this.invalidationChannels.has(tag)) {
        this.invalidationChannels.set(tag, new Set());
      }
      this.invalidationChannels.get(tag).add(key);
    });
  }

  /**
   * Clean up invalidation tags
   */
  _cleanupInvalidationTags(key) {
    for (const [tag, keys] of this.invalidationChannels) {
      keys.delete(key);
      if (keys.size === 0) {
        this.invalidationChannels.delete(tag);
      }
    }
  }

  /**
   * Handle invalidation message
   */
  _handleInvalidationMessage(message) {
    try {
      const { type, key, tag } = JSON.parse(message);
      
      if (type === 'invalidate_key' && key) {
        this.delete(key);
      } else if (type === 'invalidate_tag' && tag && this.invalidationChannels.has(tag)) {
        const keys = this.invalidationChannels.get(tag);
        keys.forEach(k => this.delete(k));
      }
    } catch (error) {
      console.error('Error handling invalidation message:', error);
    }
  }

  /**
   * Pattern matching utility
   */
  _matchPattern(key, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  /**
   * Record latency metrics
   */
  _recordLatency(startTime) {
    const latency = Date.now() - startTime;
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * 0.9) + (latency * 0.1);
  }

  /**
   * Calculate percentile
   */
  _calculatePercentile(p) {
    // Simplified percentile calculation
    // In production, maintain a proper time series
    return this.metrics.averageLatency.toFixed(2) + 'ms';
  }

  /**
   * Shutdown cache manager
   */
  async shutdown() {
    if (this.redis) {
      await this.redis.disconnect();
    }
    this.memoryCache.clear();
    this.emit('shutdown');
  }
}

module.exports = { CacheManager };