const { RateLimiterRedis, RateLimiterMemory, RateLimiterCluster } = require('rate-limiter-flexible');
const Redis = require('redis');
const winston = require('winston');
const { createSecurityAlert } = require('../utils/alertSystem');

// Configure logger for rate limiting
const rateLimitLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/rate-limiting.log' }),
    new winston.transports.Console()
  ]
});

/**
 * Sliding Window Rate Limiting
 * Tracks requests in a sliding time window
 */
class SlidingWindowRateLimiter {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 100;
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.store = new Map(); // In-memory storage (use Redis in production)
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async consume(key, weight = 1) {
    const now = Date.now();
    const windowStart = now - this.windowSize;
    
    // Clean up old entries
    this.cleanup();
    
    if (!this.store.has(key)) {
      this.store.set(key, []);
    }
    
    const requests = this.store.get(key);
    
    // Remove requests outside the current window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    const totalRequests = validRequests.reduce((sum, timestamp) => {
      // Weight can be applied here for different request types
      return sum + 1;
    }, 0);
    
    if (totalRequests + weight > this.maxRequests) {
      const retryAfter = Math.ceil((this.windowSize - (now - validRequests[0])) / 1000);
      
      // Log rate limit violation
      rateLimitLogger.warn('Rate limit exceeded', {
        key,
        requests: totalRequests,
        limit: this.maxRequests,
        windowSize: this.windowSize,
        retryAfter
      });
      
      // Create security alert for repeated violations
      if (totalRequests > this.maxRequests * 2) {
        createSecurityAlert({
          type: 'rate_limit_abuse',
          severity: 'high',
          message: `Excessive rate limit violations from ${key}`,
          metadata: { key, requests: totalRequests, limit: this.maxRequests }
        });
      }
      
      throw new Error('Rate limit exceeded');
    }
    
    // Add current request
    validRequests.push(now);
    this.store.set(key, validRequests);
    
    return {
      remaining: this.maxRequests - totalRequests - weight,
      resetTime: now + this.windowSize,
      totalHits: totalRequests + weight
    };
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowSize;
    
    for (const [key, requests] of this.store.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, validRequests);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Token Bucket Rate Limiting
 * Uses token bucket algorithm for rate limiting
 */
class TokenBucketRateLimiter {
  constructor(options = {}) {
    this.capacity = options.capacity || 100; // Maximum tokens in bucket
    this.refillRate = options.refillRate || 1; // Tokens per second
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.buckets = new Map(); // In-memory storage
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
  }

  async consume(key, cost = 1) {
    const now = Date.now();
    const bucket = this.getOrCreateBucket(key, now);
    
    // Calculate tokens to add based on time elapsed
    const timeElapsed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timeElapsed * this.refillRate;
    
    // Refill bucket but don't exceed capacity
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    // Check if enough tokens available
    if (bucket.tokens < cost) {
      const timeToNextToken = Math.ceil((cost - bucket.tokens) / this.refillRate * 1000);
      
      rateLimitLogger.warn('Token bucket limit exceeded', {
        key,
        tokens: bucket.tokens,
        cost,
        capacity: bucket.capacity,
        refillRate: this.refillRate,
        timeToNextToken
      });
      
      // Create alert for significant overages
      if (cost > bucket.capacity * 0.8) {
        createSecurityAlert({
          type: 'token_bucket_abuse',
          severity: 'high',
          message: `Large cost request from ${key}: ${cost} tokens`,
          metadata: { key, cost, capacity: bucket.capacity }
        });
      }
      
      throw new Error('Insufficient tokens');
    }
    
    // Consume tokens
    bucket.tokens -= cost;
    
    return {
      remaining: Math.floor(bucket.tokens),
      capacity: bucket.capacity,
      resetTime: Math.ceil((bucket.capacity - bucket.tokens) / this.refillRate * 1000)
    };
  }

  getOrCreateBucket(key, now) {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.capacity,
        lastRefill: now,
        capacity: this.capacity
      });
    }
    return this.buckets.get(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      // Remove unused buckets (older than 5 minutes)
      if (now - bucket.lastRefill > 5 * 60 * 1000) {
        this.buckets.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.buckets.clear();
  }
}

// Create instances
const slidingWindowLimiter = new SlidingWindowRateLimiter({
  windowSize: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100
});

const tokenBucketLimiter = new TokenBucketRateLimiter({
  capacity: 100,
  refileRate: 1
});

/**
 * Express Middleware for Sliding Window Rate Limiting
 */
const slidingWindowRateLimit = async (req, res, next) => {
  try {
    const key = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const result = await slidingWindowLimiter.consume(key, 1);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', slidingWindowLimiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
    
    next();
  } catch (error) {
    res.setHeader('X-RateLimit-Limit', slidingWindowLimiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('Retry-After', Math.ceil(slidingWindowLimiter.windowSize / 1000));
    
    rateLimitLogger.warn('Rate limit exceeded', {
      ip: req.ip,
      endpoint: req.path,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded for sliding window',
      retryAfter: Math.ceil(slidingWindowLimiter.windowSize / 1000),
      limit: slidingWindowLimiter.maxRequests,
      window: 'sliding'
    });
  }
};

/**
 * Express Middleware for Token Bucket Rate Limiting
 */
const tokenBucketRateLimit = async (req, res, next) => {
  try {
    const key = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const result = await tokenBucketLimiter.consume(key, 1);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', tokenBucketLimiter.capacity);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
    
    next();
  } catch (error) {
    res.setHeader('X-RateLimit-Limit', tokenBucketLimiter.capacity);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('Retry-After', Math.ceil(result.resetTime / 1000));
    
    rateLimitLogger.warn('Token bucket limit exceeded', {
      ip: req.ip,
      endpoint: req.path,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Insufficient tokens',
      message: 'Token bucket limit exceeded',
      retryAfter: Math.ceil(result.resetTime / 1000),
      limit: tokenBucketLimiter.capacity,
      window: 'token_bucket'
    });
  }
};

/**
 * Dynamic Rate Limiting
 * Adjust rate limits based on API key or user type
 */
const dynamicRateLimit = (req, res, next) => {
  const userType = req.apiKey?.userType || 'anonymous';
  const endpoint = req.path;
  
  let maxRequests, windowMs;
  
  // Different limits for different user types
  switch (userType) {
    case 'premium':
      maxRequests = 1000;
      windowMs = 15 * 60 * 1000; // 15 minutes
      break;
    case 'standard':
      maxRequests = 500;
      windowMs = 15 * 60 * 1000;
      break;
    case 'free':
      maxRequests = 100;
      windowMs = 15 * 60 * 1000;
      break;
    default:
      maxRequests = 50;
      windowMs = 15 * 60 * 1000;
  }
  
  // Different limits for different endpoints
  if (endpoint.includes('/api/v1/')) {
    maxRequests = Math.floor(maxRequests * 0.8); // 20% reduction for v1
  }
  
  // Store for use in middleware
  req.rateLimitConfig = { maxRequests, windowMs };
  
  next();
};

module.exports = {
  SlidingWindowRateLimiter,
  TokenBucketRateLimiter,
  slidingWindowRateLimit,
  tokenBucketRateLimit,
  dynamicRateLimit,
  slidingWindowLimiter,
  tokenBucketLimiter
};