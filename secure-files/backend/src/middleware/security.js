const rateLimit = require('express-rate-limit');
const { auditLogger } = require('../services/audit');
const { validateFileType, sanitizeFilename } = require('../utils/validation');

// Custom security middleware
const securityMiddleware = (req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server signature
  res.removeHeader('X-Powered-By');
  
  // Request ID for tracking
  req.requestId = require('uuid').v4();
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

// File upload security middleware
const fileUploadSecurity = {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
    files: 10, // Maximum 10 files per upload
  },
  
  // File type validation
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    // Sanitize filename
    file.originalname = sanitizeFilename(file.originalname);
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      auditLogger.logSecurityIncident('UNAUTHORIZED_FILE_TYPE', {
        filename: file.originalname,
        mimetype: file.mimetype,
        ip: req.ip,
        userId: req.user?.id
      });
      
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
};

// API rate limiting per user
const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  max: (req) => {
    // Different limits based on user role
    if (req.user?.role === 'admin') return 1000;
    if (req.user?.role === 'premium') return 500;
    return 100; // default for regular users
  },
  message: {
    error: 'Rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLogger.logSecurityIncident('RATE_LIMIT_EXCEEDED', {
      userId: req.user?.id,
      ip: req.ip,
      endpoint: req.originalUrl,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Rate limit exceeded. Please try again later.'
    });
  }
});

// Download rate limiting
const downloadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  max: 20, // 20 downloads per minute
  message: {
    error: 'Download limit exceeded. Please try again later.'
  }
});

// CSRF protection
const csrfProtection = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;
  
  if (!token || token !== sessionToken) {
    auditLogger.logSecurityIncident('CSRF_TOKEN_INVALID', {
      ip: req.ip,
      userId: req.user?.id,
      url: req.originalUrl
    });
    
    return res.status(403).json({
      error: 'Invalid CSRF token'
    });
  }
  
  next();
};

// Input sanitization
const sanitizeInput = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    for (let key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        req.query[key] = req.query[key].replace(/[<>]/g, '');
      }
    }
  }
  
  // Sanitize body parameters
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        req.body[key] = req.body[key].replace(/[<>]/g, '');
      }
    }
  }
  
  next();
};

// Authentication required middleware
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    auditLogger.logSecurityIncident('INVALID_TOKEN', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
};

// Role-based authorization
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      auditLogger.logSecurityIncident('UNAUTHORIZED_ACCESS_ATTEMPT', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

module.exports = {
  securityMiddleware,
  fileUploadSecurity,
  userRateLimit,
  downloadRateLimit,
  csrfProtection,
  sanitizeInput,
  requireAuth,
  requireRole
};