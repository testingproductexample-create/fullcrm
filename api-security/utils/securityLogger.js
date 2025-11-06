const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

/**
 * Security Logger Configuration
 * Comprehensive logging for security events
 */

// Custom log format for security events
const securityFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Transport configuration
const transports = [
  // Console logging for immediate feedback
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // Daily rotating file for all security events
  new DailyRotateFile({
    filename: path.join('logs/security', 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: securityFormat
  }),
  
  // Separate file for authentication events
  new DailyRotateFile({
    filename: path.join('logs/security', 'auth-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '90d',
    format: securityFormat
  }),
  
  // Separate file for rate limiting events
  new DailyRotateFile({
    filename: path.join('logs/security', 'rate-limit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: securityFormat
  }),
  
  // Separate file for API key events
  new DailyRotateFile({
    filename: path.join('logs/security', 'api-keys-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '90d',
    format: securityFormat
  })
];

// Create logger instance
const securityLogger = winston.createLogger({
  level: 'info',
  format: securityFormat,
  transports,
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join('logs/security', 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join('logs/security', 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// Security event logging methods
const securityLog = {
  // Authentication events
  auth: (event, data) => {
    securityLogger.info('Authentication Event', {
      category: 'authentication',
      event,
      ...data
    });
  },
  
  // Authorization events
  authz: (event, data) => {
    securityLogger.info('Authorization Event', {
      category: 'authorization',
      event,
      ...data
    });
  },
  
  // Rate limiting events
  rateLimit: (event, data) => {
    securityLogger.warn('Rate Limit Event', {
      category: 'rate_limit',
      event,
      ...data
    });
  },
  
  // API key events
  apiKey: (event, data) => {
    securityLogger.info('API Key Event', {
      category: 'api_key',
      event,
      ...data
    });
  },
  
  // CORS events
  cors: (event, data) => {
    securityLogger.warn('CORS Event', {
      category: 'cors',
      event,
      ...data
    });
  },
  
  // Webhook events
  webhook: (event, data) => {
    securityLogger.warn('Webhook Security Event', {
      category: 'webhook',
      event,
      ...data
    });
  },
  
  // API versioning events
  versioning: (event, data) => {
    securityLogger.info('API Versioning Event', {
      category: 'versioning',
      event,
      ...data
    });
  },
  
  // General security events
  security: (event, data) => {
    securityLogger.info('Security Event', {
      category: 'security',
      event,
      ...data
    });
  }
};

// Express middleware for request/response logging
const requestResponseLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  securityLog.auth('request_received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    apiKey: req.get('X-API-Key') ? 'present' : 'missing',
    apiVersion: req.apiVersion || 'unknown',
    timestamp: new Date().toISOString()
  });
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    securityLog.auth('response_sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      apiKey: req.apiKey ? 'validated' : 'missing',
      apiVersion: req.apiVersion || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Security metrics logging
const logSecurityMetrics = (metrics) => {
  securityLogger.info('Security Metrics', {
    category: 'metrics',
    ...metrics,
    timestamp: new Date().toISOString()
  });
};

// Log security alerts
const logSecurityAlert = (alert) => {
  securityLogger.error('Security Alert', {
    category: 'alert',
    severity: alert.severity,
    type: alert.type,
    message: alert.message,
    metadata: alert.metadata,
    timestamp: new Date().toISOString()
  });
};

// Express middleware for comprehensive security logging
const securityLoggerMiddleware = (req, res, next) => {
  // Add security context
  req.securityContext = {
    requestId: req.get('X-Request-ID') || generateRequestId(),
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };
  
  // Log security headers
  const securityHeaders = {
    'x-frame-options': req.get('X-Frame-Options'),
    'x-content-type-options': req.get('X-Content-Type-Options'),
    'x-xss-protection': req.get('X-XSS-Protection'),
    'strict-transport-security': req.get('Strict-Transport-Security')
  };
  
  if (Object.values(securityHeaders).some(header => header)) {
    securityLog.security('security_headers_detected', {
      ...req.securityContext,
      headers: securityHeaders
    });
  }
  
  next();
};

// Utility function to generate request ID
function generateRequestId() {
  return require('crypto').randomUUID();
}

// Log system startup
securityLogger.info('Security Logger Initialized', {
  category: 'system',
  transports: transports.length,
  logDirectory: 'logs/security',
  timestamp: new Date().toISOString()
});

module.exports = securityLogger;
module.exports.securityLog = securityLog;
module.exports.requestResponseLogger = requestResponseLogger;
module.exports.logSecurityMetrics = logSecurityMetrics;
module.exports.logSecurityAlert = logSecurityAlert;
module.exports.securityLoggerMiddleware = securityLoggerMiddleware;