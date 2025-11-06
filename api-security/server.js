const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('express-async-errors');
require('dotenv').config();

const securityLogger = require('./utils/securityLogger');
const { corsPolicy } = require('./middleware/cors');
const { authenticateAPIKey, validateRequest, logRequest } = require('./middleware/security');
const { slidingWindowRateLimit, tokenBucketRateLimit } = require('./strategies/rateLimiting');
const { apiVersioning } = require('./middleware/apiVersioning');
const { webhookValidation } = require('./middleware/webhookSecurity');
const { generateApiKey, validateApiKey, revokeApiKey } = require('./utils/apiKeyManager');
const { getSecurityMetrics } = require('./utils/securityMetrics');
const { createSecurityAlert } = require('./utils/alertSystem');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers & Basic Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors(corsPolicy));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Logging
app.use(securityLogger);
app.use(logRequest);

// API Versioning
app.use('/api', apiVersioning);

// Rate Limiting Strategies
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Rate limit exceeded',
    retryAfter: '15 minutes'
  }
});

// API Key Required Routes
app.use('/api/v1/protected', authenticateAPIKey);
app.use('/api/v2/protected', authenticateAPIKey);

// Apply rate limits to different endpoint categories
app.use('/api/auth', slowDown({ windowMs: 15 * 60 * 1000, delayAfter: 5 }), strictLimiter);
app.use('/api/v1', generalLimiter);
app.use('/api/v2', generalLimiter);
app.use('/webhooks', authenticateAPIKey, webhookValidation);

// Demo endpoints
app.post('/api/auth/generate-key', async (req, res) => {
  try {
    const { userId, permissions = ['read'], expiresIn = '30d' } = req.body;
    const apiKey = await generateApiKey(userId, permissions, expiresIn);
    
    res.json({
      success: true,
      apiKey: apiKey.key,
      keyId: apiKey.keyId,
      expiresAt: apiKey.expiresAt,
      permissions: apiKey.permissions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    security: {
      rateLimiting: 'enabled',
      apiKeys: 'enabled',
      webhookValidation: 'enabled',
      monitoring: 'active'
    }
  });
});

app.get('/api/security/metrics', authenticateAPIKey, async (req, res) => {
  try {
    const metrics = await getSecurityMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoints for rate limiting strategies
app.use('/api/test/sliding-window', slidingWindowRateLimit);
app.use('/api/test/token-bucket', tokenBucketRateLimit);

app.get('/api/test/public', (req, res) => {
  res.json({
    message: 'Public endpoint - no authentication required',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test/secured', authenticateAPIKey, (req, res) => {
  res.json({
    message: 'Secured endpoint - API key required',
    userId: req.apiKey?.userId,
    permissions: req.apiKey?.permissions,
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoint example
app.post('/webhooks/stripe', webhookValidation, (req, res) => {
  res.json({
    message: 'Webhook received and validated',
    timestamp: new Date().toISOString()
  });
});

// Error Handling
app.use((error, req, res, next) => {
  securityLogger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Create security alert for certain errors
  if (error.status === 429 || error.message.includes('rate limit')) {
    createSecurityAlert({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      message: `Rate limit exceeded for IP: ${req.ip}`,
      metadata: { ip: req.ip, userAgent: req.get('User-Agent') }
    });
  }

  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/generate-key',
      'GET /api/security/metrics',
      'GET /api/test/public',
      'GET /api/test/secured',
      'POST /webhooks/stripe'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Security Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔒 Security features enabled:`);
  console.log(`  ✓ Rate Limiting (Multiple strategies)`);
  console.log(`  ✓ API Key Authentication`);
  console.log(`  ✓ CORS Policy Enforcement`);
  console.log(`  ✓ Request/Response Logging`);
  console.log(`  ✓ Webhook Security Validation`);
  console.log(`  ✓ API Versioning`);
  console.log(`  ✓ Security Monitoring`);
  console.log(`  ✓ Real-time Security Alerts`);
});

module.exports = app;