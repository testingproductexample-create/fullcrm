const cors = require('cors');

/**
 * CORS Policy Configuration
 * Comprehensive CORS setup with security best practices
 */
const corsPolicy = {
  // Define allowed origins
  origin: function (origin, callback) {
    // List of allowed origins (configure based on your domains)
    const allowedOrigins = [
      'http://localhost:3000',      // Development
      'http://localhost:3001',      // API Server
      'https://yourdomain.com',      // Production domain
      'https://dashboard.yourdomain.com', // Dashboard
      // Add more domains as needed
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log CORS policy violation
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  
  // Allow specific HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Allow specific headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-API-Version',
    'X-Request-ID',
    'X-Rate-Limit-Key',
    'X-Forwarded-For',
    'X-Real-IP',
    'X-Forwarded-Proto',
    'X-Forwarded-Host',
    'X-Custom-Header'
  ],
  
  // Headers that are exposed to the client
  exposedHeaders: [
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
    'X-Request-ID',
    'X-API-Version',
    'X-Response-Time'
  ],
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Cache preflight requests for 24 hours
  maxAge: 24 * 60 * 60,
  
  // Preflight success status code
  optionsSuccessStatus: 200,
  
  // Prevents the browser from exposing the response to the frontend JavaScript when a network error occurs
  optionsSuccess204: false
};

/**
 * Dynamic CORS Policy for Different Environment
 */
const getDynamicCORS = (environment = 'production') => {
  const basePolicy = { ...corsPolicy };
  
  if (environment === 'development') {
    // More permissive in development
    basePolicy.origin = function(origin, callback) {
      callback(null, true); // Allow all origins in development
    };
    basePolicy.maxAge = 5 * 60; // 5 minutes cache for development
  }
  
  return basePolicy;
};

/**
 * CORS Error Handler
 */
const handleCORSError = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS policy') {
    // Log CORS violation
    console.warn(`CORS Violation: ${req.method} ${req.path} from ${req.get('Origin')}`);
    
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'The request origin is not allowed by the CORS policy',
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://yourdomain.com'
      ],
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
};

/**
 * CORS Headers Middleware
 * Ensures CORS headers are set correctly
 */
const setCORSHeaders = (req, res, next) => {
  // Set response time header
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
  });
  
  // Set request ID for tracking
  if (!req.get('X-Request-ID')) {
    const requestId = require('crypto').randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
  }
  
  // Set API version header
  res.setHeader('X-API-Version', '1.0');
  
  next();
};

/**
 * CORS Security Middleware
 * Additional security checks for CORS
 */
const corsSecurityCheck = (req, res, next) => {
  const origin = req.get('Origin');
  const method = req.method;
  
  // Block dangerous HTTP methods
  if (method === 'TRACE' || method === 'TRACK') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'TRACE and TRACK methods are not allowed'
    });
  }
  
  // Check for suspicious origins
  const suspiciousPatterns = [
    /javascript:/,
    /data:/,
    /vbscript:/,
    /file:/,
    /ftp:/
  ];
  
  if (origin) {
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(origin));
    if (isSuspicious) {
      console.warn(`Suspicious CORS origin detected: ${origin}`);
      return res.status(403).json({
        error: 'Suspicious origin',
        message: 'The request origin contains suspicious patterns'
      });
    }
  }
  
  next();
};

module.exports = {
  corsPolicy,
  getDynamicCORS,
  handleCORSError,
  setCORSHeaders,
  corsSecurityCheck
};