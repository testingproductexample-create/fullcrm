const Redis = require('ioredis');
const { EventEmitter } = require('events');

/**
 * Advanced Redis client with clustering, monitoring, and health checks
 */
class RedisClient extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 6379,
      password: config.password || null,
      db: config.db || 0,
      retryDelayOnFailover: config.retryDelayOnFailover || 100,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      lazyConnect: config.lazyConnect !== false,
      enableReadyCheck: config.enableReadyCheck !== false,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      retryDelayOnFailover: config.retryDelayOnFailover || 100,
      enableOfflineQueue: config.enableOfflineQueue !== false,
      enableReadyCheck: config.enableReadyCheck !== false,
      ...config
    };
    
    this.client = null;
    this.subscriber = null;
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = config.maxRetries || 10;
    this.metrics = {
      commands: 0,
      hits: 0,
      misses: 0,
      errors: 0,
      responseTime: []
    };
  }

  /**
   * Initialize Redis connection with clustering support
   */
  async connect() {
    try {
      if (this.config.cluster) {
        await this._connectCluster();
      } else {
        await this._connectSingle();
      }
      
      this._setupEventHandlers();
      this._startMetricsCollection();
      
      this.emit('connected');
      console.log('✅ Redis client connected successfully');
      
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to connect to Redis: ${error.message}`);
    }
  }

  /**
   * Connect to single Redis instance
   */
  async _connectSingle() {
    this.client = new Redis(this.config);
    
    return new Promise((resolve, reject) => {
      this.client.once('ready', () => {
        this.isConnected = true;
        this.connectionRetries = 0;
        resolve();
      });
      
      this.client.once('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Connect to Redis cluster
   */
  async _connectCluster() {
    const clusterNodes = this.config.cluster.nodes || [
      { host: this.config.host, port: this.config.port }
    ];
    
    this.client = new Redis.Cluster(clusterNodes, {
      redisOptions: {
        password: this.config.password,
        db: this.config.db
      },
      dnsLookup: this.config.dnsLookup || false,
      enableReadyCheck: this.config.enableReadyCheck !== false,
      scaleReads: this.config.scaleReads || 'master'
    });
    
    return new Promise((resolve, reject) => {
      this.client.once('ready', () => {
        this.isConnected = true;
        this.connectionRetries = 0;
        resolve();
      });
      
      this.client.once('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Setup event handlers
   */
  _setupEventHandlers() {
    this.client.on('error', (error) => {
      this.metrics.errors++;
      this.emit('error', error);
      this._handleConnectionError();
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.client.on('reconnecting', () => {
      this.emit('reconnecting');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.connectionRetries = 0;
      this.emit('ready');
    });
  }

  /**
   * Handle connection errors with retry logic
   */
  async _handleConnectionError() {
    if (this.connectionRetries >= this.maxRetries) {
      this.emit('maxRetriesReached');
      return;
    }
    
    this.connectionRetries++;
    const delay = Math.min(1000 * Math.pow(2, this.connectionRetries), 30000);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect().catch(() => {
          this._handleConnectionError();
        });
      }
    }, delay);
  }

  /**
   * Get value with error handling and metrics
   */
  async get(key) {
    this._checkConnection();
    const startTime = Date.now();
    
    try {
      const value = await this.client.get(key);
      this.metrics.commands++;
      
      if (value) {
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }
      
      this._recordResponseTime(startTime);
      return value ? JSON.parse(value) : null;
      
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', new Error(`GET error for key ${key}: ${error.message}`));
      return null;
    }
  }

  /**
   * Set value with TTL support and compression
   */
  async set(key, value, ttl = null, options = {}) {
    this._checkConnection();
    const startTime = Date.now();
    
    try {
      const serializedValue = JSON.stringify(value);
      const compressed = options.compress && this._shouldCompress(serializedValue) 
        ? await this._compress(serializedValue) 
        : serializedValue;
      
      let result;
      if (ttl) {
        result = await this.client.setex(key, ttl, compressed);
      } else {
        result = await this.client.set(key, compressed);
      }
      
      this.metrics.commands++;
      this._recordResponseTime(startTime);
      
      return result === 'OK';
      
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', new Error(`SET error for key ${key}: ${error.message}`));
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async del(pattern) {
    this._checkConnection();
    const startTime = Date.now();
    
    try {
      let keys;
      if (pattern.includes('*')) {
        keys = await this.client.keys(pattern);
      } else {
        keys = [pattern];
      }
      
      if (keys.length === 0) {
        return 0;
      }
      
      const result = await this.client.del(...keys);
      this.metrics.commands++;
      this._recordResponseTime(startTime);
      
      return result;
      
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', new Error(`DEL error for pattern ${pattern}: ${error.message}`));
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    this._checkConnection();
    const startTime = Date.now();
    
    try {
      const result = await this.client.exists(key);
      this.metrics.commands++;
      this._recordResponseTime(startTime);
      
      return result === 1;
      
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', new Error(`EXISTS error for key ${key}: ${error.message}`));
      return false;
    }
  }

  /**
   * Set expiration time
   */
  async expire(key, seconds) {
    this._checkConnection();
    return await this.client.expire(key, seconds);
  }

  /**
   * Get remaining TTL
   */
  async ttl(key) {
    this._checkConnection();
    return await this.client.ttl(key);
  }

  /**
   * Publish message to channel
   */
  async publish(channel, message) {
    this._checkConnection();
    return await this.client.publish(channel, JSON.stringify(message));
  }

  /**
   * Subscribe to channel
   */
  async subscribe(channel, callback) {
    if (!this.subscriber) {
      this.subscriber = new Redis(this.config);
    }
    
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(JSON.parse(message));
      }
    });
  }

  /**
   * Pipeline multiple commands
   */
  async pipeline(commands) {
    this._checkConnection();
    const pipeline = this.client.pipeline();
    
    commands.forEach(({ command, args }) => {
      pipeline[command](...args);
    });
    
    return await pipeline.exec();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.metrics,
      hitRate: this.metrics.commands > 0 
        ? (this.metrics.hits / this.metrics.commands * 100).toFixed(2) + '%' 
        : '0%',
      averageResponseTime: this.metrics.responseTime.length > 0
        ? (this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length).toFixed(2) + 'ms'
        : '0ms',
      isConnected: this.isConnected
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      commands: 0,
      hits: 0,
      misses: 0,
      errors: 0,
      responseTime: []
    };
  }

  /**
   * Check connection status
   */
  _checkConnection() {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }
  }

  /**
   * Record response time for metrics
   */
  _recordResponseTime(startTime) {
    const responseTime = Date.now() - startTime;
    this.metrics.responseTime.push(responseTime);
    
    // Keep only last 1000 measurements
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
  }

  /**
   * Check if value should be compressed
   */
  _shouldCompress(value) {
    return value.length > 1024; // Compress if larger than 1KB
  }

  /**
   * Compress value (simplified - in production use proper compression)
   */
  async _compress(value) {
    // In production, implement proper compression using zlib or similar
    return value;
  }

  /**
   * Start metrics collection
   */
  _startMetricsCollection() {
    setInterval(() => {
      this.emit('metrics', this.getStats());
    }, 60000); // Emit metrics every minute
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    this.isConnected = false;
    this.emit('disconnected');
  }
}

module.exports = { RedisClient };