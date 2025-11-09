const { EventEmitter } = require('events');

/**
 * Advanced CDN Manager for multi-provider CDN integration
 */
class CDNManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      providers: options.providers || ['cloudflare', 'aws-cloudfront', 'fastly', 'cloudinary'],
      defaultProvider: options.defaultProvider || 'cloudflare',
      enableAutoFailover: options.enableAutoFailover !== false,
      enableRealTimeSync: options.enableRealTimeSync !== false,
      enablePerformanceOptimization: options.enablePerformanceOptimization !== false,
      cacheTiers: {
        edge: { ttl: 3600, priority: 'high' },
        regional: { ttl: 1800, priority: 'medium' },
        origin: { ttl: 300, priority: 'low' }
      },
      ...options
    };
    
    this.providers = new Map();
    this.activeProvider = null;
    this.failoverQueue = [];
    this.performanceMetrics = new Map();
    this.cacheRules = new Map();
    this.invalidationRules = new Map();
    
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      invalidations: 0,
      totalBandwidth: 0,
      averageResponseTime: 0,
      providerFailovers: 0
    };
    
    this._initializeProviders();
    this._setupMonitoring();
  }

  /**
   * Initialize CDN providers
   */
  _initializeProviders() {
    // Cloudflare Provider
    this.providers.set('cloudflare', new CloudflareProvider({
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID
    }));
    
    // AWS CloudFront Provider
    this.providers.set('aws-cloudfront', new AWSCloudFrontProvider({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID
    }));
    
    // Fastly Provider
    this.providers.set('fastly', new FastlyProvider({
      apiKey: process.env.FASTLY_API_KEY,
      serviceId: process.env.FASTLY_SERVICE_ID
    }));
    
    // Cloudinary (for media)
    this.providers.set('cloudinary', new CloudinaryProvider({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    }));
    
    // Set active provider
    this.activeProvider = this.providers.get(this.options.defaultProvider);
  }

  /**
   * Setup monitoring and health checks
   */
  _setupMonitoring() {
    // Health check every 30 seconds
    setInterval(() => {
      this._performHealthChecks();
    }, 30000);
    
    // Performance monitoring every minute
    setInterval(() => {
      this._updatePerformanceMetrics();
    }, 60000);
  }

  /**
   * Upload asset to CDN
   */
  async uploadAsset(assetPath, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        provider = this.options.defaultProvider,
        cacheControl = 'public, max-age=31536000',
        contentType,
        region = 'auto',
        customHeaders = {}
      } = options;
      
      const cdnProvider = this.providers.get(provider);
      if (!cdnProvider) {
        throw new Error(`CDN provider ${provider} not available`);
      }
      
      // Read asset file
      const fs = require('fs');
      const path = require('path');
      const content = await fs.promises.readFile(assetPath);
      
      // Generate CDN path
      const cdnPath = this._generateCDNPath(assetPath, options);
      
      // Upload to CDN
      const uploadResult = await cdnProvider.upload({
        path: cdnPath,
        content,
        contentType: contentType || this._detectContentType(assetPath),
        cacheControl,
        customHeaders,
        region
      });
      
      // Apply cache rules
      await this._applyCacheRules(cdnPath, options);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this._updateUploadMetrics(responseTime, content.length);
      
      this.emit('asset_uploaded', {
        assetPath,
        cdnPath,
        provider,
        size: content.length,
        responseTime
      });
      
      return {
        assetPath,
        cdnPath,
        url: uploadResult.url,
        cdnUrl: this._generateCDNUrl(cdnPath, provider),
        provider,
        uploadTime: responseTime,
        cacheControl,
        etag: uploadResult.etag
      };
      
    } catch (error) {
      this.emit('upload_error', {
        assetPath,
        provider,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Upload multiple assets
   */
  async uploadAssets(assetPaths, options = {}) {
    const { 
      parallel = true, 
      maxConcurrent = 5, 
      provider = this.options.defaultProvider 
    } = options;
    
    const results = [];
    const errors = [];
    
    if (parallel) {
      // Process in parallel with concurrency limit
      const batches = this._createBatches(assetPaths, maxConcurrent);
      
      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(assetPath => this.uploadAsset(assetPath, { ...options, provider }))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push({
              assetPath: batch[index],
              error: result.reason.message
            });
          }
        });
      }
    } else {
      // Process sequentially
      for (const assetPath of assetPaths) {
        try {
          const result = await this.uploadAsset(assetPath, { ...options, provider });
          results.push(result);
        } catch (error) {
          errors.push({ assetPath, error: error.message });
        }
      }
    }
    
    this.emit('bulk_upload_completed', {
      totalAssets: assetPaths.length,
      successful: results.length,
      failed: errors.length
    });
    
    return { results, errors };
  }

  /**
   * Invalidate CDN cache
   */
  async invalidateCache(paths, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        provider = this.activeProvider?.name,
        recursive = true,
        purgeEverything = false
      } = options;
      
      if (!provider) {
        throw new Error('No active CDN provider available');
      }
      
      const cdnProvider = this.providers.get(provider);
      const invalidateResult = await cdnProvider.invalidate({
        paths: purgeEverything ? ['/*'] : paths,
        recursive
      });
      
      // Apply invalidation rules
      if (this.options.enableRealTimeSync) {
        await this._applyInvalidationRules(paths, provider);
      }
      
      const duration = Date.now() - startTime;
      this.metrics.invalidations += paths.length;
      
      this.emit('cache_invalidated', {
        provider,
        paths: paths.length,
        recursive,
        duration,
        purgeEverything
      });
      
      return {
        success: true,
        provider,
        pathsInvalidated: paths.length,
        duration,
        purgeId: invalidateResult.purgeId
      };
      
    } catch (error) {
      this.emit('invalidation_error', {
        provider,
        paths,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get CDN configuration
   */
  async getCDNConfig(provider = this.activeProvider?.name) {
    try {
      const cdnProvider = this.providers.get(provider);
      if (!cdnProvider) {
        throw new Error(`CDN provider ${provider} not found`);
      }
      
      return await cdnProvider.getConfig();
      
    } catch (error) {
      this.emit('config_error', { provider, error: error.message });
      throw error;
    }
  }

  /**
   * Update CDN configuration
   */
  async updateCDNConfig(config, provider = this.activeProvider?.name) {
    try {
      const cdnProvider = this.providers.get(provider);
      if (!cdnProvider) {
        throw new Error(`CDN provider ${provider} not found`);
      }
      
      const result = await cdnProvider.updateConfig(config);
      
      this.emit('config_updated', {
        provider,
        configKeys: Object.keys(config)
      });
      
      return result;
      
    } catch (error) {
      this.emit('config_update_error', { provider, error: error.message });
      throw error;
    }
  }

  /**
   * Get CDN analytics
   */
  async getCDNAnalytics(options = {}) {
    const {
      provider = this.activeProvider?.name,
      dateRange = '7d',
      metrics = ['requests', 'bandwidth', 'cache_hit_ratio']
    } = options;
    
    try {
      const cdnProvider = this.providers.get(provider);
      if (!cdnProvider) {
        throw new Error(`CDN provider ${provider} not found`);
      }
      
      const analytics = await cdnProvider.getAnalytics({
        dateRange,
        metrics
      });
      
      return {
        provider,
        dateRange,
        metrics,
        data: analytics,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      this.emit('analytics_error', { provider, error: error.message });
      throw error;
    }
  }

  /**
   * Setup cache rules
   */
  addCacheRule(pattern, rules) {
    this.cacheRules.set(pattern, {
      ...rules,
      createdAt: new Date().toISOString()
    });
    
    this.emit('cache_rule_added', { pattern, rules });
  }

  /**
   * Setup invalidation rules
   */
  addInvalidationRule(pattern, rule) {
    this.invalidationRules.set(pattern, {
      ...rule,
      createdAt: new Date().toISOString()
    });
    
    this.emit('invalidation_rule_added', { pattern, rule });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const providerMetrics = {};
    
    for (const [name, provider] of this.providers) {
      providerMetrics[name] = provider.getMetrics();
    }
    
    return {
      global: this.metrics,
      providers: providerMetrics,
      cacheHitRate: this._calculateGlobalCacheHitRate(),
      averageResponseTime: this.metrics.averageResponseTime.toFixed(2) + 'ms'
    };
  }

  /**
   * Switch CDN provider (failover)
   */
  async switchProvider(newProvider, options = {}) {
    const { reason = 'manual_switch' } = options;
    
    try {
      if (!this.providers.has(newProvider)) {
        throw new Error(`Provider ${newProvider} not available`);
      }
      
      const oldProvider = this.activeProvider;
      this.activeProvider = this.providers.get(newProvider);
      
      this.metrics.providerFailovers++;
      
      // Sync configurations between providers if needed
      if (this.options.enableRealTimeSync && oldProvider) {
        await this._syncProviderConfig(oldProvider.name, newProvider);
      }
      
      this.emit('provider_switched', {
        from: oldProvider?.name,
        to: newProvider,
        reason
      });
      
      return {
        success: true,
        from: oldProvider?.name,
        to: newProvider,
        switchedAt: new Date().toISOString()
      };
      
    } catch (error) {
      this.emit('provider_switch_error', { newProvider, error: error.message });
      throw error;
    }
  }

  /**
   * Setup real-time cache sync
   */
  setupRealTimeSync() {
    // Listen for cache invalidation events
    this.on('cache_invalidated', async (event) => {
      // Sync with all active providers
      for (const [name, provider] of this.providers) {
        if (name !== event.provider) {
          try {
            await provider.invalidate({
              paths: event.paths,
              recursive: event.recursive
            });
          } catch (error) {
            console.warn(`Failed to sync invalidation to ${name}:`, error.message);
          }
        }
      }
    });
  }

  /**
   * Generate CDN path for asset
   */
  _generateCDNPath(assetPath, options = {}) {
    const path = require('path');
    const { 
      basePath = '/assets', 
      version = null,
      region = null 
    } = options;
    
    const filename = path.basename(assetPath);
    const dirname = path.dirname(assetPath);
    
    let cdnPath = basePath;
    
    // Add version if provided
    if (version) {
      cdnPath += `/v${version}`;
    }
    
    // Add region if specified
    if (region && region !== 'auto') {
      cdnPath += `/${region}`;
    }
    
    // Add asset path
    cdnPath += `/${dirname.replace(/^\.\/?/, '')}`;
    
    return `${cdnPath}/${filename}`;
  }

  /**
   * Generate CDN URL
   */
  _generateCDNUrl(path, provider) {
    const cdnProvider = this.providers.get(provider);
    if (!cdnProvider) {
      return path;
    }
    
    return cdnProvider.getBaseUrl() + path;
  }

  /**
   * Detect content type from file extension
   */
  _detectContentType(filePath) {
    const ext = require('path').extname(filePath).toLowerCase();
    
    const contentTypes = {
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'font/otf'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Apply cache rules
   */
  async _applyCacheRules(cdnPath, options) {
    for (const [pattern, rules] of this.cacheRules) {
      if (this._matchPattern(cdnPath, pattern)) {
        const cdnProvider = this.providers.get(this.activeProvider.name);
        if (cdnProvider && cdnProvider.applyCacheRules) {
          await cdnProvider.applyCacheRules(cdnPath, rules);
        }
      }
    }
  }

  /**
   * Apply invalidation rules
   */
  async _applyInvalidationRules(paths, provider) {
    for (const [pattern, rule] of this.invalidationRules) {
      const matchingPaths = paths.filter(path => this._matchPattern(path, pattern));
      
      if (matchingPaths.length > 0 && rule.trigger === 'path_change') {
        // Trigger custom invalidation logic
        this.emit('invalidation_rule_triggered', {
          pattern,
          matchingPaths,
          rule
        });
      }
    }
  }

  /**
   * Pattern matching utility
   */
  _matchPattern(str, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(str);
  }

  /**
   * Create batches for parallel processing
   */
  _createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Update upload metrics
   */
  _updateUploadMetrics(responseTime, contentSize) {
    this.metrics.totalRequests++;
    this.metrics.totalBandwidth += contentSize;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
  }

  /**
   * Calculate global cache hit rate
   */
  _calculateGlobalCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 
      ? (this.metrics.cacheHits / total * 100).toFixed(2) + '%'
      : '0%';
  }

  /**
   * Perform health checks
   */
  async _performHealthChecks() {
    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        this.performanceMetrics.set(name, health);
        
        if (!health.healthy && this.options.enableAutoFailover) {
          // Add to failover queue
          this.failoverQueue.push({
            provider: name,
            reason: 'health_check_failed',
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.warn(`Health check failed for ${name}:`, error.message);
      }
    }
  }

  /**
   * Update performance metrics
   */
  _updatePerformanceMetrics() {
    // Update global metrics based on provider metrics
    for (const [name, metrics] of this.performanceMetrics) {
      if (metrics.responseTime) {
        this.metrics.averageResponseTime = 
          (this.metrics.averageResponseTime * 0.9) + (metrics.responseTime * 0.1);
      }
    }
  }

  /**
   * Sync provider configuration
   */
  async _syncProviderConfig(fromProvider, toProvider) {
    // Simplified config sync - in production would be more sophisticated
    try {
      const fromConfig = await this.getCDNConfig(fromProvider);
      await this.updateCDNConfig(fromConfig, toProvider);
    } catch (error) {
      console.warn('Failed to sync provider config:', error.message);
    }
  }

  /**
   * Get CDN manager statistics
   */
  getStats() {
    return {
      ...this.metrics,
      activeProvider: this.activeProvider?.name,
      availableProviders: Array.from(this.providers.keys()),
      cacheRules: this.cacheRules.size,
      invalidationRules: this.invalidationRules.size,
      failoverQueue: this.failoverQueue.length
    };
  }
}

// Base CDN Provider Class
class BaseCDNProvider extends EventEmitter {
  constructor(name, config) {
    super();
    this.name = name;
    this.config = config;
    this.metrics = {
      requests: 0,
      responseTime: 0,
      errors: 0
    };
  }
  
  async upload(options) {
    throw new Error('Upload method must be implemented');
  }
  
  async invalidate(options) {
    throw new Error('Invalidate method must be implemented');
  }
  
  async getConfig() {
    throw new Error('Get config method must be implemented');
  }
  
  async updateConfig(config) {
    throw new Error('Update config method must be implemented');
  }
  
  async getAnalytics(options) {
    throw new Error('Get analytics method must be implemented');
  }
  
  async healthCheck() {
    return { healthy: true, responseTime: 0 };
  }
  
  getBaseUrl() {
    throw new Error('Get base URL method must be implemented');
  }
  
  getMetrics() {
    return this.metrics;
  }
}

// Cloudflare Provider Implementation
class CloudflareProvider extends BaseCDNProvider {
  constructor(config) {
    super('cloudflare', config);
    this.baseUrl = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}`;
  }
  
  async upload(options) {
    // Simplified Cloudflare API implementation
    return {
      url: `https://${this.config.zoneId}.cdn.cloudflare.net${options.path}`,
      etag: `cf-${Date.now()}`
    };
  }
  
  async invalidate(options) {
    return {
      success: true,
      purgeId: `purge_${Date.now()}`
    };
  }
  
  getBaseUrl() {
    return `https://${this.config.zoneId}.cdn.cloudflare.net`;
  }
}

// AWS CloudFront Provider Implementation
class AWSCloudFrontProvider extends BaseCDNProvider {
  constructor(config) {
    super('aws-cloudfront', config);
    this.distributionDomain = `${config.distributionId}.cloudfront.net`;
  }
  
  async upload(options) {
    return {
      url: `https://${this.distributionDomain}${options.path}`,
      etag: `aws-${Date.now()}`
    };
  }
  
  async invalidate(options) {
    return {
      success: true,
      purgeId: `invalidate_${Date.now()}`
    };
  }
  
  getBaseUrl() {
    return `https://${this.distributionDomain}`;
  }
}

// Fastly Provider Implementation
class FastlyProvider extends BaseCDNProvider {
  constructor(config) {
    super('fastly', config);
    this.baseApiUrl = 'https://api.fastly.com';
  }
  
  async upload(options) {
    return {
      url: `https://${this.config.serviceId}.fastly.global.ssl.fastly.net${options.path}`,
      etag: `fastly-${Date.now()}`
    };
  }
  
  async invalidate(options) {
    return {
      success: true,
      purgeId: `purge_${Date.now()}`
    };
  }
  
  getBaseUrl() {
    return `https://${this.config.serviceId}.fastly.global.ssl.fastly.net`;
  }
}

// Cloudinary Provider Implementation
class CloudinaryProvider extends BaseCDNProvider {
  constructor(config) {
    super('cloudinary', config);
    this.baseUrl = `https://res.cloudinary.com/${config.cloudName}`;
  }
  
  async upload(options) {
    return {
      url: `${this.baseUrl}/image/upload${options.path}`,
      etag: `cloudinary-${Date.now()}`
    };
  }
  
  getBaseUrl() {
    return this.baseUrl;
  }
}

module.exports = { CDNManager };