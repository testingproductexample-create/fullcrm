const { validateApiKey, getApiKey } = require('../utils/apiKeyManager');
const { createSecurityAlert } = require('../utils/alertSystem');

/**
 * API Key Authentication Middleware
 * Validates API keys for protected endpoints
 */
const authenticateAPIKey = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key') || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      createSecurityAlert({
        type: 'authentication_failed',
        severity: 'high',
        message: 'Missing API key in request',
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path
        }
      });
      
      return res.status(401).json({
        error: 'API key required',
        message: 'X-API-Key header is required for this endpoint'
      });
    }

    const keyValidation = await validateApiKey(apiKey);
    
    if (!keyValidation.valid) {
      createSecurityAlert({
        type: 'authentication_failed',
        severity: 'high',
        message: 'Invalid API key attempt',
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          keyId: keyValidation.keyId
        }
      });
      
      return res.status(401).json({
        error: 'Invalid API key',
        message: keyValidation.reason || 'API key is invalid or expired'
      });
    }

    // Attach key information to request
    req.apiKey = keyValidation.key;
    req.userId = keyValidation.key.userId;
    
    // Log successful authentication
    console.log(`✅ API Key authenticated: ${keyValidation.key.keyId} for user ${keyValidation.key.userId}`);
    
    next();
  } catch (error) {
    console.error('API Key authentication error:', error);
    res.status(500).json({
      error: 'Authentication service error',
      message: 'Unable to validate API key'
    });
  }
};

/**
 * Request Validation Middleware
 * Validates request structure and headers
 */
const validateRequest = (req, res, next) => {
  // Check for required headers
  const userAgent = req.get('User-Agent');
  const contentType = req.get('Content-Type');
  
  if (!userAgent) {
    return res.status(400).json({
      error: 'Missing User-Agent header',
      message: 'User-Agent header is required'
    });
  }
  
  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (contentType && !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Invalid content type',
        message: 'Content-Type must be application/json for write operations'
      });
    }
  }
  
  // Check request size
  const contentLength = parseInt(req.get('Content-Length') || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request payload exceeds 10MB limit'
    });
  }
  
  next();
};

/**
 * IP Whitelist Validation
 * Validates if IP is in allowed list (optional feature)
 */
const validateIPWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!allowedIPs.includes(clientIP)) {
      createSecurityAlert({
        type: 'unauthorized_ip',
        severity: 'high',
        message: `Request from unauthorized IP: ${clientIP}`,
        metadata: {
          ip: clientIP,
          userAgent: req.get('User-Agent'),
          endpoint: req.path
        }
      });
      
      return res.status(403).json({
        error: 'IP not authorized',
        message: 'Your IP address is not authorized to access this endpoint'
      });
    }
    
    next();
  };
};

/**
 * Role-Based Access Control (RBAC)
 * Check if API key has required permissions
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.apiKey || !req.apiKey.permissions) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'API key does not have required permissions'
      });
    }
    
    if (!req.apiKey.permissions.includes(requiredPermission) && !req.apiKey.permissions.includes('admin')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `API key requires '${requiredPermission}' permission`
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateAPIKey,
  validateRequest,
  validateIPWhitelist,
  requirePermission
};