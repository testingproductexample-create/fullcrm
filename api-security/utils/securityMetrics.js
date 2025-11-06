const winston = require('winston');
const { slidingWindowLimiter, tokenBucketLimiter } = require('../strategies/rateLimiting');
const { getApiKeyStatistics } = require('./apiKeyManager');

/**
 * Security Metrics Collection System
 * Collects and provides real-time security metrics
 */

// In-memory metrics storage
const metrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    blocked: 0,
    byEndpoint: new Map(),
    byIP: new Map(),
    byAPIKey: new Map(),
    byVersion: new Map(),
    responseTimes: []
  },
  authentication: {
    totalAttempts: 0,
    successful: 0,
    failed: 0,
    apiKeyValidations: 0,
    apiKeyFailures: 0,
    byUserId: new Map()
  },
  rateLimiting: {
    totalBlocks: 0,
    byStrategy: new Map(),
    byIP: new Map(),
    topOffenders: []
  },
  security: {
    suspiciousActivities: 0,
    securityAlerts: 0,
    corsViolations: 0,
    webhookViolations: 0
  },
  webhooks: {
    totalReceived: 0,
    validated: 0,
    rejected: 0,
    byProvider: new Map()
  },
  uptime: {
    startTime: new Date(),
    lastRestart: new Date(),
    totalRequests: 0
  }
};

// Update metrics function
function updateMetrics(type, data) {
  switch (type) {
    case 'request':
      updateRequestMetrics(data);
      break;
    case 'authentication':
      updateAuthMetrics(data);
      break;
    case 'rateLimit':
      updateRateLimitMetrics(data);
      break;
    case 'security':
      updateSecurityMetrics(data);
      break;
    case 'webhook':
      updateWebhookMetrics(data);
      break;
    default:
      console.warn(`Unknown metrics type: ${type}`);
  }
}

function updateRequestMetrics(data) {
  const { method, url, statusCode, responseTime, ip, apiKey, apiVersion } = data;
  
  metrics.requests.total++;
  metrics.requests.totalRequests++;
  metrics.uptime.totalRequests++;
  
  // Track by status
  if (statusCode >= 200 && statusCode < 300) {
    metrics.requests.successful++;
  } else if (statusCode >= 400) {
    metrics.requests.failed++;
    if (statusCode === 429) {
      metrics.requests.blocked++;
    }
  }
  
  // Track by endpoint
  const endpoint = url.split('?')[0];
  if (!metrics.requests.byEndpoint.has(endpoint)) {
    metrics.requests.byEndpoint.set(endpoint, { count: 0, avgResponseTime: 0 });
  }
  const endpointData = metrics.requests.byEndpoint.get(endpoint);
  endpointData.count++;
  endpointData.avgResponseTime = (endpointData.avgResponseTime * (endpointData.count - 1) + responseTime) / endpointData.count;
  metrics.requests.byEndpoint.set(endpoint, endpointData);
  
  // Track by IP
  if (!metrics.requests.byIP.has(ip)) {
    metrics.requests.byIP.set(ip, { count: 0, blocked: 0 });
  }
  const ipData = metrics.requests.byIP.get(ip);
  ipData.count++;
  if (statusCode === 429) {
    ipData.blocked++;
  }
  metrics.requests.byIP.set(ip, ipData);
  
  // Track by API Key
  if (apiKey) {
    if (!metrics.requests.byAPIKey.has(apiKey)) {
      metrics.requests.byAPIKey.set(apiKey, { count: 0, failed: 0 });
    }
    const keyData = metrics.requests.byAPIKey.get(apiKey);
    keyData.count++;
    if (statusCode >= 400) {
      keyData.failed++;
    }
    metrics.requests.byAPIKey.set(apiKey, keyData);
  }
  
  // Track by version
  const version = apiVersion || 'unknown';
  if (!metrics.requests.byVersion.has(version)) {
    metrics.requests.byVersion.set(version, { count: 0, avgResponseTime: 0 });
  }
  const versionData = metrics.requests.byVersion.get(version);
  versionData.count++;
  versionData.avgResponseTime = (versionData.avgResponseTime * (versionData.count - 1) + responseTime) / versionData.count;
  metrics.requests.byVersion.set(version, versionData);
  
  // Track response times (keep last 1000)
  metrics.requests.responseTimes.push(responseTime);
  if (metrics.requests.responseTimes.length > 1000) {
    metrics.requests.responseTimes.shift();
  }
}

function updateAuthMetrics(data) {
  const { success, userId, type = 'apiKey' } = data;
  
  metrics.authentication.totalAttempts++;
  
  if (success) {
    metrics.authentication.successful++;
    if (type === 'apiKey') {
      metrics.authentication.apiKeyValidations++;
    }
  } else {
    metrics.authentication.failed++;
    if (type === 'apiKey') {
      metrics.authentication.apiKeyFailures++;
    }
  }
  
  // Track by user
  if (userId) {
    if (!metrics.authentication.byUserId.has(userId)) {
      metrics.authentication.byUserId.set(userId, { attempts: 0, successful: 0, failed: 0 });
    }
    const userData = metrics.authentication.byUserId.get(userId);
    userData.attempts++;
    if (success) {
      userData.successful++;
    } else {
      userData.failed++;
    }
    metrics.authentication.byUserId.set(userId, userData);
  }
}

function updateRateLimitMetrics(data) {
  const { strategy, ip, blocked } = data;
  
  if (blocked) {
    metrics.rateLimiting.totalBlocks++;
    
    // Track by strategy
    if (!metrics.rateLimiting.byStrategy.has(strategy)) {
      metrics.rateLimiting.byStrategy.set(strategy, { blocks: 0, topIPs: [] });
    }
    const strategyData = metrics.rateLimiting.byStrategy.get(strategy);
    strategyData.blocks++;
    metrics.rateLimiting.byStrategy.set(strategy, strategyData);
    
    // Track by IP
    if (!metrics.rateLimiting.byIP.has(ip)) {
      metrics.rateLimiting.byIP.set(ip, { blocks: 0, lastBlock: null });
    }
    const ipData = metrics.rateLimiting.byIP.get(ip);
    ipData.blocks++;
    ipData.lastBlock = new Date();
    metrics.rateLimiting.byIP.set(ip, ipData);
  }
}

function updateSecurityMetrics(data) {
  const { type, severity = 'low' } = data;
  
  metrics.security.suspiciousActivities++;
  
  if (severity === 'high') {
    metrics.security.securityAlerts++;
  }
  
  switch (type) {
    case 'cors':
      metrics.security.corsViolations++;
      break;
    case 'webhook':
      metrics.security.webhookViolations++;
      break;
  }
}

function updateWebhookMetrics(data) {
  const { provider, validated, rejected } = data;
  
  metrics.webhooks.totalReceived++;
  
  if (validated) {
    metrics.webhooks.validated++;
  }
  
  if (rejected) {
    metrics.webhooks.rejected++;
  }
  
  // Track by provider
  if (!metrics.webhooks.byProvider.has(provider)) {
    metrics.webhooks.byProvider.set(provider, { total: 0, validated: 0, rejected: 0 });
  }
  const providerData = metrics.webhooks.byProvider.get(provider);
  providerData.total++;
  if (validated) providerData.validated++;
  if (rejected) providerData.rejected++;
  metrics.webhooks.byProvider.set(provider, providerData);
}

/**
 * Get Security Metrics
 * Returns comprehensive security metrics
 */
async function getSecurityMetrics() {
  // Clean up old data periodically
  cleanupOldData();
  
  const now = new Date();
  const uptime = now - metrics.uptime.startTime;
  
  return {
    timestamp: now.toISOString(),
    uptime: {
      duration: uptime,
      startTime: metrics.uptime.startTime,
      lastRestart: metrics.uptime.lastRestart,
      totalRequests: metrics.uptime.totalRequests
    },
    requests: {
      total: metrics.requests.total,
      successful: metrics.requests.successful,
      failed: metrics.requests.failed,
      blocked: metrics.requests.blocked,
      successRate: metrics.requests.total > 0 ? 
        (metrics.requests.successful / metrics.requests.total * 100).toFixed(2) : 0,
      avgResponseTime: metrics.requests.responseTimes.length > 0 ?
        (metrics.requests.responseTimes.reduce((a, b) => a + b, 0) / metrics.requests.responseTimes.length).toFixed(2) : 0,
      topEndpoints: Array.from(metrics.requests.byEndpoint.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([endpoint, data]) => ({
          endpoint,
          count: data.count,
          avgResponseTime: data.avgResponseTime.toFixed(2)
        })),
      topIPs: Array.from(metrics.requests.byIP.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([ip, data]) => ({
          ip,
          count: data.count,
          blocked: data.blocked
        })),
      byVersion: Object.fromEntries(
        Array.from(metrics.requests.byVersion.entries())
          .map(([version, data]) => [version, {
            count: data.count,
            avgResponseTime: data.avgResponseTime.toFixed(2)
          }])
      )
    },
    authentication: {
      totalAttempts: metrics.authentication.totalAttempts,
      successful: metrics.authentication.successful,
      failed: metrics.authentication.failed,
      successRate: metrics.authentication.totalAttempts > 0 ?
        (metrics.authentication.successful / metrics.authentication.totalAttempts * 100).toFixed(2) : 0,
      apiKeyValidations: metrics.authentication.apiKeyValidations,
      apiKeyFailures: metrics.authentication.apiKeyFailures,
      topUsers: Array.from(metrics.authentication.byUserId.entries())
        .sort((a, b) => b[1].attempts - a[1].attempts)
        .slice(0, 10)
        .map(([userId, data]) => ({
          userId,
          attempts: data.attempts,
          successful: data.successful,
          failed: data.failed,
          successRate: data.attempts > 0 ? 
            (data.successful / data.attempts * 100).toFixed(2) : 0
        }))
    },
    rateLimiting: {
      totalBlocks: metrics.rateLimiting.totalBlocks,
      byStrategy: Object.fromEntries(
        Array.from(metrics.rateLimiting.byStrategy.entries())
          .map(([strategy, data]) => [strategy, {
            blocks: data.blocks,
            topIPs: data.topIPs
          }])
      ),
      topOffenders: Array.from(metrics.rateLimiting.byIP.entries())
        .sort((a, b) => b[1].blocks - a[1].blocks)
        .slice(0, 10)
        .map(([ip, data]) => ({
          ip,
          blocks: data.blocks,
          lastBlock: data.lastBlock
        }))
    },
    security: {
      suspiciousActivities: metrics.security.suspiciousActivities,
      securityAlerts: metrics.security.securityAlerts,
      corsViolations: metrics.security.corsViolations,
      webhookViolations: metrics.security.webhookViolations
    },
    webhooks: {
      totalReceived: metrics.webhooks.totalReceived,
      validated: metrics.webhooks.validated,
      rejected: metrics.webhooks.rejected,
      successRate: metrics.webhooks.totalReceived > 0 ?
        (metrics.webhooks.validated / metrics.webhooks.totalReceived * 100).toFixed(2) : 0,
      byProvider: Object.fromEntries(metrics.webhooks.byProvider.entries())
    },
    apiKeys: getApiKeyStatistics()
  };
}

/**
 * Get Real-time Metrics
 * Returns simplified metrics for dashboard
 */
async function getRealTimeMetrics() {
  const currentMetrics = await getSecurityMetrics();
  
  // Calculate real-time rate (requests per minute)
  const oneMinuteAgo = Date.now() - 60000;
  const recentRequests = metrics.requests.responseTimes.length;
  
  return {
    timestamp: new Date().toISOString(),
    requestsPerMinute: recentRequests,
    activeConnections: metrics.requests.byIP.size,
    activeAPIKeys: Array.from(metrics.requests.byAPIKey.keys()).length,
    currentRateLimitBlocks: metrics.rateLimiting.totalBlocks,
    securityAlerts: metrics.security.securityAlerts,
    uptime: {
      hours: Math.floor((Date.now() - metrics.uptime.startTime) / (1000 * 60 * 60))
    }
  };
}

/**
 * Reset Metrics
 * Resets all metrics (use with caution)
 */
function resetMetrics() {
  metrics.requests = {
    total: 0,
    successful: 0,
    failed: 0,
    blocked: 0,
    byEndpoint: new Map(),
    byIP: new Map(),
    byAPIKey: new Map(),
    byVersion: new Map(),
    responseTimes: []
  };
  
  metrics.authentication = {
    totalAttempts: 0,
    successful: 0,
    failed: 0,
    apiKeyValidations: 0,
    apiKeyFailures: 0,
    byUserId: new Map()
  };
  
  metrics.rateLimiting = {
    totalBlocks: 0,
    byStrategy: new Map(),
    byIP: new Map(),
    topOffenders: []
  };
  
  metrics.security = {
    suspiciousActivities: 0,
    securityAlerts: 0,
    corsViolations: 0,
    webhookViolations: 0
  };
  
  metrics.webhooks = {
    totalReceived: 0,
    validated: 0,
    rejected: 0,
    byProvider: new Map()
  };
  
  console.log('🔄 Security metrics reset');
}

/**
 * Clean up old data
 * Removes old entries to prevent memory leaks
 */
function cleanupOldData() {
  const oneHourAgo = Date.now() - 3600000;
  
  // Clean up IP data
  for (const [ip, data] of metrics.requests.byIP.entries()) {
    // Keep only recent active IPs
    if (data.lastSeen && data.lastSeen < oneHourAgo) {
      metrics.requests.byIP.delete(ip);
    }
  }
  
  // Clean up API key data
  for (const [key, data] of metrics.requests.byAPIKey.entries()) {
    // Keep only recent active keys
    if (data.lastSeen && data.lastSeen < oneHourAgo) {
      metrics.requests.byAPIKey.delete(key);
    }
  }
  
  // Keep only last 1000 response times
  if (metrics.requests.responseTimes.length > 1000) {
    metrics.requests.responseTimes = metrics.requests.responseTimes.slice(-1000);
  }
}

module.exports = {
  updateMetrics,
  getSecurityMetrics,
  getRealTimeMetrics,
  resetMetrics
};