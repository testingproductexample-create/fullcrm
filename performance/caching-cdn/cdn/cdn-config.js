/**
 * CDN configuration management and optimization
 */
class CDNConfig {
  constructor(options = {}) {
    this.config = {
      providers: {
        cloudflare: {
          enabled: true,
          config: {
            zoneId: process.env.CLOUDFLARE_ZONE_ID,
            apiToken: process.env.CLOUDFLARE_API_TOKEN,
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            customHostnames: process.env.CLOUDFLARE_CUSTOM_HOSTNAMES?.split(',') || []
          },
          settings: {
            cacheLevel: 'aggressive',
            edgeCacheTTL: 3600,
            browserCacheTTL: 1800,
            developmentMode: false,
            minify: {
              html: true,
              css: true,
              js: true
            },
            compression: {
              gzip: true,
              brotli: true
            },
            imageOptimization: {
              enabled: true,
              quality: 85,
              format: 'auto'
            }
          },
          performance: {
            cacheHitRate: 0,
            averageResponseTime: 0,
                bandwidth: 0
          }
        },
        
        aws_cloudfront: {
          enabled: true,
          config: {
            distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1'
          },
          settings: {
            defaultCacheBehavior: {
              targetOriginId: 'origin',
              viewerProtocolPolicy: 'redirect-to-https',
              allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
              cachedMethods: ['GET', 'HEAD'],
              compress: true,
              viewerRequestPolicy: 'Managed-CORS-S3Origin',
              responseHeadersPolicyId: 'Managed-CORS-with-preflight-and-SecurityHeadersPolicy',
              originRequestPolicyId: 'Managed-CORS-S3Origin',
              cachePolicyId: 'Managed-CachingOptimized'
            },
            origins: [
              {
                id: 'origin',
                domainName: process.env.ORIGIN_DOMAIN || 'example.com',
                customOriginConfig: {
                  httpPort: 80,
                  httpsPort: 443,
                  originProtocolPolicy: 'https-only',
                  originSslProtocols: ['TLSv1.2']
                }
              }
            ],
            viewerCertificate: {
              cloudFrontDefaultCertificate: process.env.USE_DEFAULT_CERTIFICATE === 'true'
            },
            geoRestriction: {
              restrictionType: 'none'
            }
          },
          performance: {
            cacheHitRate: 0,
            averageResponseTime: 0,
            bandwidth: 0
          }
        },
        
        fastly: {
          enabled: false,
          config: {
            serviceId: process.env.FASTLY_SERVICE_ID,
            apiKey: process.env.FASTLY_API_KEY
          },
          settings: {
            defaultTTL: 3600,
            staleWhileRevalidate: 86400,
            staleIfError: 86400,
            conditions: [
              {
                name: 'cache_static',
                type: 'Request',
                statement: 'req.url.ext =~ "(?i)(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)"'
              }
            ],
            headers: [
              {
                name: 'Cache-Control',
                action: 'set',
                value: 'public, max-age=31536000',
                condition: 'cache_static'
              }
            ],
            gzip: {
              contentTypes: [
                'text/html',
                'text/css',
                'application/javascript',
                'application/json',
                'text/javascript',
                'image/svg+xml'
              ]
            }
          },
          performance: {
            cacheHitRate: 0,
            averageResponseTime: 0,
            bandwidth: 0
          }
        },
        
        cloudinary: {
          enabled: true,
          config: {
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            apiSecret: process.env.CLOUDINARY_API_SECRET
          },
          settings: {
            defaultTransformation: {
              quality: 'auto',
              fetchFormat: 'auto',
              dpr: 'auto'
            },
            imageOptimization: {
              enabled: true,
              formats: ['auto', 'webp', 'avif', 'jpg', 'png'],
              quality: 85,
              progressive: true
            },
            videoOptimization: {
              enabled: true,
              formats: ['auto', 'mp4', 'webm'],
              quality: 80,
              bitRate: 'auto'
            },
            responsive: {
              enabled: true,
              breakpoints: [320, 640, 768, 1024, 1280, 1536, 1920],
              sizes: '100vw'
            }
          },
          performance: {
            cacheHitRate: 0,
            averageResponseTime: 0,
            bandwidth: 0
          }
        }
      },
      
      global: {
        // Cache policies
        cachePolicies: {
          static_assets: {
            ttl: 31536000, // 1 year
            headers: {
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Vary': 'Accept-Encoding'
            },
            providers: ['cloudflare', 'aws_cloudfront', 'fastly']
          },
          
          api_responses: {
            ttl: 3600, // 1 hour
            headers: {
              'Cache-Control': 'public, max-age=3600',
              'Vary': 'Accept, Authorization'
            },
            providers: ['cloudflare', 'aws_cloudfront']
          },
          
          html_pages: {
            ttl: 1800, // 30 minutes
            headers: {
              'Cache-Control': 'public, max-age=1800',
              'Vary': 'Accept-Encoding, Accept-Language'
            },
            providers: ['cloudflare', 'aws_cloudfront', 'fastly']
          },
          
          images: {
            ttl: 86400, // 1 day
            headers: {
              'Cache-Control': 'public, max-age=86400',
              'Vary': 'Accept'
            },
            providers: ['cloudflare', 'cloudinary']
          },
          
          videos: {
            ttl: 604800, // 1 week
            headers: {
              'Cache-Control': 'public, max-age=604800',
              'Accept-Ranges': 'bytes'
            },
            providers: ['cloudflare', 'cloudinary']
          }
        },
        
        // Performance settings
        performance: {
          enableHTTP2: true,
          enableHTTP3: true,
          enableCompression: true,
          enableImageOptimization: true,
          enableMinification: true,
          enableTreeShaking: true,
          enableLazyLoading: true,
          preloadCriticalResources: true
        },
        
        // Security settings
        security: {
          enableDDoSProtection: true,
          enableBotManagement: true,
          enableRateLimiting: true,
          enableWAF: true,
          enableSSL: true,
          enableHSTS: true,
          enableCSP: true
        },
        
        // Monitoring
        monitoring: {
          enableRealTimeAnalytics: true,
          enablePerformanceMonitoring: true,
          enableErrorTracking: true,
          enableUptimeMonitoring: true,
          alertThresholds: {
            responseTime: 2000, // 2 seconds
            errorRate: 5, // 5%
            cacheHitRate: 80 // 80%
          }
        },
        
        // Optimization rules
        optimization: {
          // Content optimization
          contentOptimization: {
            enableImageWebP: true,
            enableImageAVIF: true,
            enableVideoAdaptive: true,
            enableFontOptimization: true,
            enableCSSOptimization: true,
            enableJSOptimization: true
          },
          
          // Delivery optimization
          deliveryOptimization: {
            enableHTTP2Push: true,
            enableResourceHints: true,
            enablePrefetching: true,
            enableServiceWorkerCaching: true,
            enableEdgeComputing: true
          },
          
          // User experience optimization
          uxOptimization: {
            enableInstantPage: true,
            enableProgressiveWebApp: true,
            enableCriticalResourcePriority: true,
            enableDeferNonCriticalResources: true
          }
        }
      },
      
      ...options
    };
    
    this.environment = process.env.NODE_ENV || 'development';
    this.isDevelopment = this.environment === 'development';
    this.isProduction = this.environment === 'production';
    
    this._loadEnvironmentOverrides();
  }
  
  /**
   * Load environment-specific configuration overrides
   */
  _loadEnvironmentOverrides() {
    if (this.isDevelopment) {
      // Development overrides
      this.config.global.performance.enableCompression = false;
      this.config.global.performance.enableMinification = false;
      this.config.global.monitoring.enableRealTimeAnalytics = false;
      
      // Enable all providers for testing
      for (const provider of Object.values(this.config.providers)) {
        provider.enabled = true;
      }
    } else if (this.isProduction) {
      // Production optimizations
      this.config.global.performance.enableHTTP2 = true;
      this.config.global.performance.enableHTTP3 = true;
      this.config.global.performance.enableCompression = true;
      this.config.global.performance.enableImageOptimization = true;
      this.config.global.security.enableDDoSProtection = true;
      this.config.global.security.enableBotManagement = true;
      this.config.global.monitoring.enableRealTimeAnalytics = true;
    }
  }
  
  /**
   * Get configuration for specific provider
   */
  getProviderConfig(providerName) {
    const provider = this.config.providers[providerName];
    if (!provider) {
      throw new Error(`Provider ${providerName} not found in configuration`);
    }
    
    return {
      ...provider,
      environment: this.environment
    };
  }
  
  /**
   * Get cache policy for content type
   */
  getCachePolicy(contentType) {
    // Match content type to cache policy
    if (contentType.startsWith('image/')) {
      return this.config.global.cachePolicies.images;
    } else if (contentType.startsWith('video/')) {
      return this.config.global.cachePolicies.videos;
    } else if (contentType.includes('text/html')) {
      return this.config.global.cachePolicies.html_pages;
    } else if (contentType.includes('application/json') || contentType.includes('text/')) {
      return this.config.global.cachePolicies.api_responses;
    } else if (this._isStaticAsset(contentType)) {
      return this.config.global.cachePolicies.static_assets;
    }
    
    // Default policy
    return {
      ttl: 3600,
      headers: {
        'Cache-Control': 'public, max-age=3600'
      },
      providers: ['cloudflare']
    };
  }
  
  /**
   * Get optimization settings
   */
  getOptimizationSettings(type = 'global') {
    return this.config.global.optimization[type] || this.config.global.optimization;
  }
  
  /**
   * Get performance settings
   */
  getPerformanceSettings() {
    return this.config.global.performance;
  }
  
  /**
   * Get security settings
   */
  getSecuritySettings() {
    return this.config.global.security;
  }
  
  /**
   * Get monitoring settings
   */
  getMonitoringSettings() {
    return this.config.global.monitoring;
  }
  
  /**
   * Check if content type is static asset
   */
  _isStaticAsset(contentType) {
    const staticTypes = [
      'text/css',
      'application/javascript',
      'application/x-javascript',
      'text/javascript',
      'font/',
      'image/svg+xml',
      'application/font-woff',
      'application/font-woff2'
    ];
    
    return staticTypes.some(type => contentType.startsWith(type));
  }
  
  /**
   * Generate CDN headers for response
   */
  generateCDNHeaders(contentType, path, options = {}) {
    const cachePolicy = this.getCachePolicy(contentType);
    const headers = { ...cachePolicy.headers };
    
    // Add ETag for cache validation
    if (options.etag) {
      headers['ETag'] = options.etag;
    }
    
    // Add Vary header for content negotiation
    if (this._needsContentNegotiation(contentType)) {
      headers['Vary'] = headers['Vary'] || 'Accept';
    }
    
    // Add security headers
    if (this.isProduction) {
      headers['X-Content-Type-Options'] = 'nosniff';
      headers['X-Frame-Options'] = 'DENY';
      headers['X-XSS-Protection'] = '1; mode=block';
    }
    
    return headers;
  }
  
  /**
   * Check if content needs negotiation
   */
  _needsContentNegotiation(contentType) {
    const negotiableTypes = [
      'image/',
      'text/html',
      'text/css',
      'application/javascript'
    ];
    
    return negotiableTypes.some(type => contentType.startsWith(type));
  }
  
  /**
   * Get recommended provider for content
   */
  getRecommendedProvider(contentType, path = '') {
    const cachePolicy = this.getCachePolicy(contentType);
    const availableProviders = cachePolicy.providers.filter(
      name => this.config.providers[name]?.enabled
    );
    
    if (availableProviders.length === 0) {
      return 'cloudflare'; // Fallback
    }
    
    // Return first available provider (could implement smarter selection)
    return availableProviders[0];
  }
  
  /**
   * Update provider configuration
   */
  updateProviderConfig(providerName, updates) {
    if (!this.config.providers[providerName]) {
      throw new Error(`Provider ${providerName} not found`);
    }
    
    this.config.providers[providerName] = {
      ...this.config.providers[providerName],
      ...updates
    };
  }
  
  /**
   * Update cache policy
   */
  updateCachePolicy(policyName, updates) {
    if (!this.config.global.cachePolicies[policyName]) {
      throw new Error(`Cache policy ${policyName} not found`);
    }
    
    this.config.global.cachePolicies[policyName] = {
      ...this.config.global.cachePolicies[policyName],
      ...updates
    };
  }
  
  /**
   * Get configuration summary
   */
  getConfigSummary() {
    return {
      environment: this.environment,
      enabledProviders: Object.entries(this.config.providers)
        .filter(([_, config]) => config.enabled)
        .map(([name, _]) => name),
      cachePolicies: Object.keys(this.config.global.cachePolicies),
      performance: this.config.global.performance,
      security: this.config.global.security,
      monitoring: this.config.global.monitoring
    };
  }
  
  /**
   * Validate configuration
   */
  validateConfig() {
    const errors = [];
    const warnings = [];
    
    // Validate provider configurations
    for (const [name, provider] of Object.entries(this.config.providers)) {
      if (provider.enabled) {
        // Check required config
        for (const [key, value] of Object.entries(provider.config)) {
          if (!value && key !== 'customHostnames') {
            errors.push(`Provider ${name} missing required config: ${key}`);
          }
        }
      }
    }
    
    // Check for development/production inconsistencies
    if (this.isProduction) {
      if (!this.config.global.security.enableDDoSProtection) {
        warnings.push('DDoS protection disabled in production');
      }
      if (!this.config.global.monitoring.enableRealTimeAnalytics) {
        warnings.push('Real-time analytics disabled in production');
      }
    }
    
    return { errors, warnings };
  }
  
  /**
   * Export configuration
   */
  exportConfig(format = 'json') {
    const configCopy = JSON.parse(JSON.stringify(this.config));
    
    // Remove sensitive information
    for (const provider of Object.values(configCopy.providers)) {
      if (provider.config) {
        for (const [key, value] of Object.entries(provider.config)) {
          if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')) {
            provider.config[key] = '***HIDDEN***';
          }
        }
      }
    }
    
    if (format === 'json') {
      return JSON.stringify(configCopy, null, 2);
    }
    
    return configCopy;
  }
  
  /**
   * Get configuration for deployment
   */
  getDeploymentConfig() {
    return {
      environment: this.environment,
      providers: Object.fromEntries(
        Object.entries(this.config.providers)
          .filter(([_, config]) => config.enabled)
          .map(([name, config]) => [
            name,
            {
              enabled: config.enabled,
              config: {
                ...config.config,
                // Hide secrets
                ...Object.fromEntries(
                  Object.entries(config.config).filter(
                    ([key]) => !key.toLowerCase().includes('secret') && !key.toLowerCase().includes('key')
                  )
                )
              },
              settings: config.settings
            }
          ])
      ),
      global: this.config.global
    };
  }
}

// Predefined configuration templates
const ConfigTemplates = {
  // High performance configuration
  highPerformance: {
    global: {
      performance: {
        enableHTTP2: true,
        enableHTTP3: true,
        enableCompression: true,
        enableImageOptimization: true,
        enableMinification: true,
        enableTreeShaking: true
      },
      optimization: {
        contentOptimization: {
          enableImageWebP: true,
          enableImageAVIF: true,
          enableVideoAdaptive: true
        }
      }
    }
  },
  
  // Cost-optimized configuration
  costOptimized: {
    providers: {
      cloudflare: { enabled: true },
      aws_cloudfront: { enabled: false },
      fastly: { enabled: false },
      cloudinary: { enabled: false }
    },
    global: {
      cachePolicies: {
        static_assets: { ttl: 31536000 },
        api_responses: { ttl: 1800 }
      }
    }
  },
  
  // Development configuration
  development: {
    environment: 'development',
    providers: {
      cloudflare: { enabled: true },
      aws_cloudfront: { enabled: true },
      fastly: { enabled: true },
      cloudinary: { enabled: true }
    },
    global: {
      performance: {
        enableCompression: false,
        enableMinification: false
      },
      monitoring: {
        enableRealTimeAnalytics: false
      }
    }
  }
};

module.exports = { CDNConfig, ConfigTemplates };