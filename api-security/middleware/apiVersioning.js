/**
 * API Versioning Middleware
 * Handles version negotiation and routing
 */

const versionRoutes = {
  '1': {
    supported: true,
    deprecated: false,
    sunsetDate: null,
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
    features: ['basic_auth', 'rate_limiting', 'cors']
  },
  '2': {
    supported: true,
    deprecated: false,
    sunsetDate: null,
    rateLimit: { windowMs: 15 * 60 * 1000, max: 200 },
    features: ['api_keys', 'rate_limiting', 'cors', 'webhook_validation', 'advanced_logging']
  }
};

/**
 * API Versioning Middleware
 * Extracts version from URL path or header
 */
const apiVersioning = (req, res, next) => {
  // Extract version from URL path (/api/v1/...)
  const pathMatch = req.path.match(/\/api\/v(\d+)/);
  let version = null;
  
  if (pathMatch) {
    version = pathMatch[1];
  } else {
    // Check X-API-Version header
    const headerVersion = req.get('X-API-Version');
    if (headerVersion) {
      version = headerVersion;
    } else {
      // Default to latest stable version
      version = '2';
    }
  }
  
  // Validate version
  if (!versionRoutes[version]) {
    return res.status(400).json({
      error: 'Unsupported API version',
      message: `API version v${version} is not supported`,
      supportedVersions: Object.keys(versionRoutes).map(v => `v${v}`),
      latestVersion: 'v2',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check if version is deprecated
  const versionConfig = versionRoutes[version];
  if (versionConfig.deprecated && !versionConfig.supported) {
    return res.status(410).json({
      error: 'API version deprecated',
      message: `API version v${version} has been deprecated and is no longer supported`,
      sunsetDate: versionConfig.sunsetDate,
      supportedVersions: Object.keys(versionRoutes)
        .filter(v => versionRoutes[v].supported)
        .map(v => `v${v}`),
      latestVersion: 'v2',
      timestamp: new Date().toISOString()
    });
  }
  
  // Add version info to request object
  req.apiVersion = version;
  req.versionConfig = versionConfig;
  
  // Set response headers
  res.setHeader('X-API-Version', version);
  res.setHeader('X-API-Features', versionConfig.features.join(', '));
  
  // Add deprecation notice for old versions
  if (versionConfig.deprecated) {
    res.setHeader('Sunset', versionConfig.sunsetDate);
    res.setHeader('Deprecation', 'true');
  }
  
  // Log version usage
  console.log(`📡 API Request: ${req.method} ${req.path} - Version v${version}`);
  
  next();
};

/**
 * Version-Specific Rate Limiting
 * Apply different rate limits based on API version
 */
const versionBasedRateLimit = (req, res, next) => {
  const version = req.apiVersion;
  const versionConfig = versionRoutes[version];
  
  if (!versionConfig || !versionConfig.rateLimit) {
    return next(); // Skip rate limiting if not configured
  }
  
  const { windowMs, max } = versionConfig.rateLimit;
  const key = `${req.ip}:${version}`;
  
  // Simple in-memory rate limiting (use Redis in production)
  const now = Date.now();
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }
  
  if (!global.rateLimitStore.has(key)) {
    global.rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
  } else {
    const data = global.rateLimitStore.get(key);
    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + windowMs;
    } else {
      data.count++;
    }
    
    if (data.count > max) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `API version v${version} rate limit exceeded`,
        limit: max,
        window: Math.ceil(windowMs / 1000),
        version: version,
        timestamp: new Date().toISOString()
      });
    }
    
    global.rateLimitStore.set(key, data);
  }
  
  // Set rate limit headers
  const currentData = global.rateLimitStore.get(key);
  res.setHeader('X-RateLimit-Limit', max);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, max - currentData.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(currentData.resetTime / 1000));
  
  next();
};

/**
 * Version Compatibility Checker
 * Checks if requested features are available in the version
 */
const checkVersionCompatibility = (requiredFeatures = []) => {
  return (req, res, next) => {
    const version = req.apiVersion;
    const versionConfig = versionRoutes[version];
    
    if (!versionConfig) {
      return res.status(400).json({
        error: 'Invalid API version',
        message: `Version v${version} is not supported`
      });
    }
    
    const missingFeatures = requiredFeatures.filter(
      feature => !versionConfig.features.includes(feature)
    );
    
    if (missingFeatures.length > 0) {
      return res.status(400).json({
        error: 'Feature not available in this version',
        message: `Version v${version} does not support: ${missingFeatures.join(', ')}`,
        versionFeatures: versionConfig.features,
        requiredFeatures,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * API Version Negotiation Middleware
 * Negotiates the best version based on client preferences
 */
const negotiateVersion = (req, res, next) => {
  const acceptHeader = req.get('Accept');
  const userAgent = req.get('User-Agent');
  
  // Parse Accept header for version preferences
  let preferredVersion = '2'; // Default
  
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.api\+v(\d+)\+json/);
    if (versionMatch) {
      preferredVersion = versionMatch[1];
    }
  }
  
  // Client-specific version recommendations
  if (userAgent && userAgent.includes('API-Client/1.0')) {
    preferredVersion = '1'; // Older client
  }
  
  // Store negotiation result
  req.negotiatedVersion = preferredVersion;
  
  console.log(`🔄 Version negotiation: Client preferred v${preferredVersion}, URL shows v${req.apiVersion}`);
  
  next();
};

/**
 * Deprecation Warning Middleware
 * Sends warnings for deprecated versions
 */
const deprecationWarning = (req, res, next) => {
  const version = req.apiVersion;
  const versionConfig = versionRoutes[version];
  
  if (versionConfig.deprecated) {
    // Add deprecation warning header
    res.setHeader('Warning', `299 - "API version v${version} is deprecated" Sunset="${versionConfig.sunsetDate}"`);
    
    // Log deprecation usage
    console.warn(`⚠️  Using deprecated API version v${version} from ${req.ip}`);
  }
  
  next();
};

/**
 * Version Health Check
 * Endpoint to check version status
 */
const getVersionInfo = (req, res) => {
  const versions = Object.entries(versionRoutes).map(([version, config]) => ({
    version: `v${version}`,
    supported: config.supported,
    deprecated: config.deprecated,
    sunsetDate: config.sunsetDate,
    rateLimit: config.rateLimit,
    features: config.features
  }));
  
  res.json({
    currentVersion: req.apiVersion ? `v${req.apiVersion}` : null,
    versions,
    latestVersion: 'v2',
    timestamp: new Date().toISOString()
  });
};

/**
 * Migration Guide Endpoint
 * Provides information about migrating between versions
 */
const getMigrationGuide = (req, res) => {
  const { from, to } = req.query;
  
  const guides = {
    '1-to-2': {
      overview: 'Migration from API v1 to v2',
      changes: [
        'API Key authentication required (X-API-Key header)',
        'Enhanced rate limiting (higher limits)',
        'Webhook signature validation',
        'Improved error responses',
        'Additional security headers'
      ],
      breakingChanges: [
        'API Key now required for protected endpoints',
        'Different error response format',
        'Additional required headers'
      ],
      steps: [
        '1. Obtain API key from /api/auth/generate-key',
        '2. Add X-API-Key header to all requests',
        '3. Update rate limit handling (new headers provided)',
        '4. Test webhook endpoints (signature validation enabled)'
      ]
    }
  };
  
  const guideKey = `${from}-to-${to}`;
  
  res.json({
    migration: guides[guideKey] || null,
    availableMigrations: Object.keys(guides),
    currentVersion: req.apiVersion ? `v${req.apiVersion}` : null,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  apiVersioning,
  versionBasedRateLimit,
  checkVersionCompatibility,
  negotiateVersion,
  deprecationWarning,
  getVersionInfo,
  getMigrationGuide,
  versionRoutes
};