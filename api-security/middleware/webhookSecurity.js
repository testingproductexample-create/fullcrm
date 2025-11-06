const crypto = require('crypto');
const winston = require('winston');
const { createSecurityAlert } = require('../utils/alertSystem');

// Configure webhook logger
const webhookLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/webhooks.log' }),
    new winston.transports.Console()
  ]
});

/**
 * Webhook Security Configuration
 */
const webhookConfig = {
  providers: {
    stripe: {
      secret: process.env.STRIPE_WEBHOOK_SECRET,
      algorithm: 'sha256',
      header: 'stripe-signature',
      timeout: 300000, // 5 minutes
      requiredFields: ['id', 'object', 'data', 'type']
    },
    github: {
      secret: process.env.GITHUB_WEBHOOK_SECRET,
      algorithm: 'sha256',
      header: 'x-hub-signature-256',
      timeout: 600000, // 10 minutes
      requiredFields: ['zen']
    },
    generic: {
      secret: process.env.WEBHOOK_GENERIC_SECRET,
      algorithm: 'sha256',
      header: 'x-webhook-signature',
      timeout: 300000,
      requiredFields: []
    }
  }
};

/**
 * Webhook Signature Validation
 * Validates webhook signatures for security
 */
const validateWebhookSignature = (provider, payload, signature, secret) => {
  if (!provider || !webhookConfig.providers[provider]) {
    throw new Error(`Unsupported webhook provider: ${provider}`);
  }
  
  const config = webhookConfig.providers[provider];
  const expectedSignature = crypto
    .createHmac(config.algorithm, secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  const providedSignature = signature.replace(`${config.algorithm}=`, '');
  
  if (providedSignature !== expectedSignature) {
    throw new Error('Invalid webhook signature');
  }
  
  return true;
};

/**
 * Webhook Timestamp Validation
 * Prevents replay attacks
 */
const validateWebhookTimestamp = (timestamp, maxAge = 300000) => {
  if (!timestamp) {
    throw new Error('Missing webhook timestamp');
  }
  
  const webhookTime = parseInt(timestamp) * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeDiff = Math.abs(currentTime - webhookTime);
  
  if (timeDiff > maxAge) {
    throw new Error('Webhook timestamp is too old');
  }
  
  return true;
};

/**
 * Webhook Security Middleware
 * Main middleware for webhook security validation
 */
const webhookValidation = (req, res, next) => {
  try {
    const provider = req.path.split('/').pop() || 'generic';
    const config = webhookConfig.providers[provider];
    
    if (!config) {
      throw new Error(`Webhook provider '${provider}' not configured`);
    }
    
    // Get raw body for signature validation
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signature = req.get(config.header);
    const timestamp = req.get('x-webhook-timestamp') || req.get('timestamp');
    
    // Validate timestamp first
    try {
      validateWebhookTimestamp(timestamp, config.timeout);
    } catch (timestampError) {
      createSecurityAlert({
        type: 'webhook_replay_attack',
        severity: 'high',
        message: `Webhook timestamp validation failed for ${provider}`,
        metadata: {
          provider,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp,
          error: timestampError.message
        }
      });
      
      return res.status(400).json({
        error: 'Invalid webhook timestamp',
        message: timestampError.message
      });
    }
    
    // Validate signature
    if (!signature) {
      createSecurityAlert({
        type: 'webhook_signature_missing',
        severity: 'high',
        message: `Missing webhook signature for ${provider}`,
        metadata: {
          provider,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp
        }
      });
      
      return res.status(400).json({
        error: 'Missing webhook signature',
        message: `${config.header} header is required`
      });
    }
    
    try {
      validateWebhookSignature(provider, rawBody, signature, config.secret);
    } catch (signatureError) {
      createSecurityAlert({
        type: 'webhook_signature_invalid',
        severity: 'high',
        message: `Invalid webhook signature for ${provider}`,
        metadata: {
          provider,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          signature: signature.substring(0, 20) + '...',
          error: signatureError.message
        }
      });
      
      return res.status(400).json({
        error: 'Invalid webhook signature',
        message: signatureError.message
      });
    }
    
    // Validate required fields
    const webhookData = req.body;
    const missingFields = config.requiredFields.filter(field => 
      !hasNestedProperty(webhookData, field)
    );
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required webhook fields',
        message: `Missing fields: ${missingFields.join(', ')}`
      });
    }
    
    // Add webhook metadata
    req.webhook = {
      provider,
      timestamp,
      signature: signature.substring(0, 20) + '...',
      validated: true
    };
    
    // Log successful validation
    webhookLogger.info('Webhook validated', {
      provider,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp,
      endpoint: req.path,
      method: req.method
    });
    
    next();
  } catch (error) {
    webhookLogger.error('Webhook validation error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    res.status(500).json({
      error: 'Webhook validation service error',
      message: 'Unable to validate webhook'
    });
  }
};

/**
 * IP Whitelist for Webhooks
 * Restrict webhook endpoints to known providers
 */
const webhookIPWhitelist = (allowedIPs = {}) => {
  return (req, res, next) => {
    const provider = req.path.split('/').pop() || 'generic';
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs[provider]) {
      return res.status(403).json({
        error: 'IP whitelist not configured for provider',
        message: `Provider '${provider}' does not have IP whitelist configured`
      });
    }
    
    // Note: In production, you would resolve actual IPs from DNS or maintain a list
    // This is a simplified version for demonstration
    const validIPs = allowedIPs[provider];
    
    if (!validIPs.includes(clientIP)) {
      createSecurityAlert({
        type: 'webhook_unauthorized_ip',
        severity: 'high',
        message: `Unauthorized webhook request from ${clientIP} for ${provider}`,
        metadata: {
          provider,
          ip: clientIP,
          userAgent: req.get('User-Agent')
        }
      });
      
      return res.status(403).json({
        error: 'Unauthorized IP',
        message: 'This IP is not authorized to send webhooks for this provider'
      });
    }
    
    next();
  };
};

/**
 * Webhook Rate Limiting
 * Separate rate limiting for webhook endpoints
 */
const webhookRateLimit = (maxRequests = 10, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const provider = req.path.split('/').pop() || 'generic';
    const key = `${provider}:${req.ip}`;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, { count: 0, resetTime: now + windowMs });
    }
    
    const rateData = requests.get(key);
    
    if (now > rateData.resetTime) {
      rateData.count = 0;
      rateData.resetTime = now + windowMs;
    }
    
    if (rateData.count >= maxRequests) {
      createSecurityAlert({
        type: 'webhook_rate_limit_exceeded',
        severity: 'medium',
        message: `Webhook rate limit exceeded for ${provider} from ${req.ip}`,
        metadata: {
          provider,
          ip: req.ip,
          count: rateData.count,
          limit: maxRequests
        }
      });
      
      return res.status(429).json({
        error: 'Webhook rate limit exceeded',
        message: `Too many webhook requests for provider '${provider}'`,
        retryAfter: Math.ceil((rateData.resetTime - now) / 1000),
        provider,
        timestamp: new Date().toISOString()
      });
    }
    
    rateData.count++;
    requests.set(key, rateData);
    
    // Set rate limit headers
    res.setHeader('X-Webhook-RateLimit-Limit', maxRequests);
    res.setHeader('X-Webhook-RateLimit-Remaining', maxRequests - rateData.count);
    res.setHeader('X-Webhook-RateLimit-Reset', Math.ceil(rateData.resetTime / 1000));
    
    next();
  };
};

/**
 * Webhook Event Logging
 * Log webhook events for audit trail
 */
const logWebhookEvent = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to capture response
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log webhook event
    webhookLogger.info('Webhook event processed', {
      provider: req.webhook?.provider,
      ip: req.ip,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      validated: req.webhook?.validated,
      timestamp: new Date().toISOString()
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Helper function to check nested object properties
 */
function hasNestedProperty(obj, path) {
  return path.split('.').every(key => {
    if (obj === null || obj === undefined) return false;
    obj = obj[key];
    return obj !== undefined;
  });
}

/**
 * Generic Webhook Handler
 * Handles various webhook providers
 */
const genericWebhookHandler = async (req, res) => {
  const provider = req.webhook?.provider;
  const webhookData = req.body;
  
  try {
    // Process webhook based on provider
    switch (provider) {
      case 'stripe':
        await handleStripeWebhook(webhookData, req);
        break;
      case 'github':
        await handleGithubWebhook(webhookData, req);
        break;
      case 'generic':
        await handleGenericWebhook(webhookData, req);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    res.json({
      success: true,
      message: `Webhook from ${provider} processed successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    webhookLogger.error('Webhook processing error', {
      provider,
      error: error.message,
      stack: error.stack,
      data: webhookData
    });
    
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Webhook handlers for different providers
async function handleStripeWebhook(data, req) {
  // Handle Stripe webhook data
  webhookLogger.info('Processing Stripe webhook', { type: data.type });
  // Add your Stripe webhook processing logic here
}

async function handleGithubWebhook(data, req) {
  // Handle GitHub webhook data
  webhookLogger.info('Processing GitHub webhook', { action: data.action });
  // Add your GitHub webhook processing logic here
}

async function handleGenericWebhook(data, req) {
  // Handle generic webhook data
  webhookLogger.info('Processing generic webhook', { 
    provider: req.webhook.provider,
    hasData: !!data 
  });
  // Add your generic webhook processing logic here
}

module.exports = {
  webhookValidation,
  webhookIPWhitelist,
  webhookRateLimit,
  logWebhookEvent,
  validateWebhookSignature,
  validateWebhookTimestamp,
  genericWebhookHandler
};