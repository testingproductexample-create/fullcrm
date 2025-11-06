const winston = require('winston');
const cron = require('node-cron');

/**
 * Security Alert System
 * Manages and processes security alerts
 */

// Alert storage and configuration
const alerts = {
  active: new Map(),
  history: new Map(),
  config: {
    maxAlertsPerHour: 100,
    maxAlertsPerDay: 1000,
    duplicateThreshold: 5000, // 5 minutes
    cleanupInterval: 60, // minutes
    enableNotifications: true,
    channels: {
      console: true,
      file: true,
      webhook: false,
      email: false
    }
  },
  statistics: {
    totalCreated: 0,
    totalResolved: 0,
    lastCleanup: new Date()
  }
};

// Configure alert logger
const alertLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/alerts.log' }),
    new winston.transports.Console()
  ]
});

/**
 * Create Security Alert
 * Creates and processes a security alert
 */
function createSecurityAlert(alertData) {
  try {
    const {
      type,
      severity = 'medium',
      message,
      metadata = {},
      source = 'api_security',
      userId = null,
      ip = null,
      requestId = null
    } = alertData;
    
    // Generate unique alert ID
    const alertId = generateAlertId(type, metadata);
    const timestamp = new Date();
    
    // Check for duplicate alerts
    if (isDuplicateAlert(alertId)) {
      console.log(`🔄 Duplicate alert ignored: ${type}`);
      return { duplicate: true, alertId };
    }
    
    // Rate limiting check
    if (!checkAlertRateLimit()) {
      console.log(`⏰ Alert rate limit exceeded for type: ${type}`);
      return { rateLimited: true };
    }
    
    // Create alert object
    const alert = {
      id: alertId,
      type,
      severity,
      message,
      source,
      timestamp,
      metadata: {
        ...metadata,
        userId,
        ip,
        requestId
      },
      status: 'active',
      resolvedAt: null,
      notificationSent: false,
      escalationLevel: determineEscalationLevel(type, severity),
      category: categorizeAlert(type),
      tags: generateAlertTags(type, severity, metadata)
    };
    
    // Store alert
    alerts.active.set(alertId, alert);
    alerts.statistics.totalCreated++;
    
    // Process alert
    processAlert(alert);
    
    // Log alert creation
    alertLogger.info('Security alert created', {
      alertId,
      type,
      severity,
      message,
      escalationLevel: alert.escalationLevel,
      category: alert.category,
      metadata: alert.metadata,
      timestamp: alert.timestamp
    });
    
    console.log(`🚨 Security Alert [${severity.toUpperCase()}] ${type}: ${message}`);
    
    return {
      success: true,
      alertId,
      alert,
      duplicate: false,
      rateLimited: false
    };
    
  } catch (error) {
    alertLogger.error('Failed to create security alert', {
      error: error.message,
      stack: error.stack,
      alertData,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process Security Alert
 * Handles alert processing and notifications
 */
function processAlert(alert) {
  // Send notifications based on severity and configuration
  if (alerts.config.enableNotifications) {
    switch (alert.severity) {
      case 'critical':
        sendCriticalAlert(alert);
        break;
      case 'high':
        sendHighAlert(alert);
        break;
      case 'medium':
        sendMediumAlert(alert);
        break;
      case 'low':
        sendLowAlert(alert);
        break;
    }
  }
  
  // Auto-resolve certain types of alerts
  if (shouldAutoResolve(alert)) {
    resolveAlert(alert.id, 'Auto-resolved', 'System determined alert conditions are no longer present');
  }
}

/**
 * Send Critical Alert
 * Immediate notification for critical alerts
 */
function sendCriticalAlert(alert) {
  // Console notification
  if (alerts.config.channels.console) {
    console.error(`🚨 CRITICAL SECURITY ALERT 🚨`);
    console.error(`Type: ${alert.type}`);
    console.error(`Message: ${alert.message}`);
    console.error(`Time: ${alert.timestamp}`);
    console.error(`Details:`, alert.metadata);
  }
  
  // Log to file
  if (alerts.config.channels.file) {
    alertLogger.error('Critical Security Alert', {
      alertId: alert.id,
      type: alert.type,
      message: alert.message,
      metadata: alert.metadata,
      timestamp: alert.timestamp
    });
  }
  
  // Mark as notified
  alert.notificationSent = true;
  alert.notifiedAt = new Date();
}

/**
 * Send High Alert
 * Notification for high-severity alerts
 */
function sendHighAlert(alert) {
  if (alerts.config.channels.console) {
    console.warn(`⚠️ HIGH SECURITY ALERT`);
    console.warn(`Type: ${alert.type}`);
    console.warn(`Message: ${alert.message}`);
  }
  
  alert.notificationSent = true;
  alert.notifiedAt = new Date();
}

/**
 * Send Medium Alert
 * Standard notification for medium-severity alerts
 */
function sendMediumAlert(alert) {
  if (alerts.config.channels.console) {
    console.log(`ℹ️ MEDIUM SECURITY ALERT: ${alert.type} - ${alert.message}`);
  }
}

/**
 * Send Low Alert
 * Minimal notification for low-severity alerts
 */
function sendLowAlert(alert) {
  if (alerts.config.channels.console) {
    console.log(`📋 Low Security Alert: ${alert.type}`);
  }
}

/**
 * Resolve Alert
 * Marks an alert as resolved
 */
function resolveAlert(alertId, resolvedBy = 'system', resolutionNote = '') {
  const alert = alerts.active.get(alertId);
  if (!alert) {
    return { success: false, error: 'Alert not found' };
  }
  
  alert.status = 'resolved';
  alert.resolvedAt = new Date();
  alert.resolvedBy = resolvedBy;
  alert.resolutionNote = resolutionNote;
  
  // Move to history
  alerts.history.set(alertId, alert);
  alerts.active.delete(alertId);
  alerts.statistics.totalResolved++;
  
  alertLogger.info('Security alert resolved', {
    alertId,
    resolvedBy,
    resolutionNote,
    originalTimestamp: alert.timestamp,
    resolutionTime: alert.resolvedAt
  });
  
  console.log(`✅ Alert resolved: ${alertId} by ${resolvedBy}`);
  
  return { success: true, alert };
}

/**
 * Get Active Alerts
 * Returns all active security alerts
 */
function getActiveAlerts() {
  return Array.from(alerts.active.values())
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get Alert History
 * Returns resolved alerts
 */
function getAlertHistory(limit = 100) {
  return Array.from(alerts.history.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/**
 * Get Alert Statistics
 * Returns alert system statistics
 */
function getAlertStatistics() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);
  const oneDayAgo = new Date(now.getTime() - 86400000);
  
  // Count recent alerts
  const recentHour = Array.from(alerts.active.values())
    .filter(alert => alert.timestamp > oneHourAgo).length;
    
  const recentDay = Array.from(alerts.active.values())
    .filter(alert => alert.timestamp > oneDayAgo).length;
  
  // Count by severity
  const bySeverity = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  // Count by type
  const byType = {};
  
  for (const alert of alerts.active.values()) {
    bySeverity[alert.severity]++;
    byType[alert.type] = (byType[alert.type] || 0) + 1;
  }
  
  return {
    timestamp: now.toISOString(),
    active: alerts.active.size,
    history: alerts.history.size,
    statistics: alerts.statistics,
    recent: {
      lastHour: recentHour,
      lastDay: recentDay
    },
    bySeverity,
    byType,
    topTypes: Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }))
  };
}

/**
 * Configure Alert System
 * Updates alert system configuration
 */
function configureAlertSystem(config = {}) {
  alerts.config = { ...alerts.config, ...config };
  
  alertLogger.info('Alert system configured', {
    oldConfig: { ...alerts.config, ...config },
    newConfig: alerts.config
  });
  
  return { success: true, config: alerts.config };
}

/**
 * Cleanup Old Alerts
 * Removes old alerts to prevent memory leaks
 */
function cleanupAlerts() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600000);
  
  let cleanedActive = 0;
  let cleanedHistory = 0;
  
  // Clean up old active alerts
  for (const [id, alert] of alerts.active.entries()) {
    if (alert.timestamp < sevenDaysAgo) {
      alerts.active.delete(id);
      cleanedActive++;
    }
  }
  
  // Clean up old history
  for (const [id, alert] of alerts.history.entries()) {
    if (alert.timestamp < sevenDaysAgo) {
      alerts.history.delete(id);
      cleanedHistory++;
    }
  }
  
  alerts.statistics.lastCleanup = now;
  
  alertLogger.info('Alerts cleaned up', {
    cleanedActive,
    cleanedHistory,
    timestamp: now
  });
  
  console.log(`🧹 Alert cleanup completed: ${cleanedActive} active, ${cleanedHistory} history`);
}

// Schedule periodic cleanup
cron.schedule('0 */1 * * *', () => {
  cleanupAlerts();
});

/**
 * Helper Functions
 */

function generateAlertId(type, metadata) {
  const crypto = require('crypto');
  const key = `${type}:${JSON.stringify(metadata)}`;
  return crypto.createHash('md5').update(key).digest('hex').substring(0, 16);
}

function isDuplicateAlert(alertId) {
  // Check if similar alert exists in recent history
  const oneHourAgo = Date.now() - 3600000;
  
  for (const [id, alert] of alerts.active.entries()) {
    if (id === alertId && alert.timestamp.getTime() > oneHourAgo) {
      return true;
    }
  }
  
  return false;
}

function checkAlertRateLimit() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);
  
  const recentAlerts = Array.from(alerts.active.values())
    .filter(alert => alert.timestamp > oneHourAgo);
  
  return recentAlerts.length < alerts.config.maxAlertsPerHour;
}

function determineEscalationLevel(type, severity) {
  // Define escalation rules
  const escalationRules = {
    'authentication_failed': severity === 'high' ? 1 : 0,
    'rate_limit_abuse': severity === 'high' ? 2 : 1,
    'webhook_replay_attack': 2,
    'unauthorized_ip': 1,
    'api_key_compromised': 3
  };
  
  return escalationRules[type] || 0;
}

function categorizeAlert(type) {
  if (type.includes('auth') || type.includes('authentication')) {
    return 'authentication';
  } else if (type.includes('rate_limit')) {
    return 'rate_limiting';
  } else if (type.includes('webhook')) {
    return 'webhook';
  } else if (type.includes('cors')) {
    return 'cors';
  } else if (type.includes('ip')) {
    return 'network';
  } else {
    return 'general';
  }
}

function generateAlertTags(type, severity, metadata) {
  const tags = [type, severity];
  
  if (metadata.userId) tags.push('user_specific');
  if (metadata.ip) tags.push('ip_based');
  if (type.includes('abuse') || type.includes('attack')) tags.push('attack');
  
  return tags;
}

function shouldAutoResolve(alert) {
  // Auto-resolve certain types of alerts after a period
  const autoResolveTypes = [
    'rate_limit_exceeded',
    'temporary_block'
  ];
  
  return autoResolveTypes.includes(alert.type) && 
         alert.severity === 'medium';
}

// Initialize alert system
console.log('🔔 Security Alert System initialized');
console.log(`📊 Alert limits: ${alerts.config.maxAlertsPerHour}/hour, ${alerts.config.maxAlertsPerDay}/day`);

module.exports = {
  createSecurityAlert,
  resolveAlert,
  getActiveAlerts,
  getAlertHistory,
  getAlertStatistics,
  configureAlertSystem,
  cleanupAlerts
};