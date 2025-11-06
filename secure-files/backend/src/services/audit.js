const winston = require('winston');
const { AuditLog } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/audit.log' }),
    new winston.transports.File({ filename: 'logs/security.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class AuditLogger {
  constructor() {
    this.sessionId = uuidv4();
    this.userContext = new Map();
  }

  /**
   * Log a user event
   * @param {string} eventType - Type of event
   * @param {Object} metadata - Event metadata
   * @param {string} userId - User ID (optional)
   * @param {string} ipAddress - IP address (optional)
   * @param {string} userAgent - User agent (optional)
   */
  async logEvent(eventType, metadata = {}, userId = null, ipAddress = null, userAgent = null) {
    try {
      const logData = {
        id: uuidv4(),
        userId: userId,
        eventType: eventType,
        eventCategory: this.getEventCategory(eventType),
        severity: this.getSeverity(eventType),
        description: this.generateDescription(eventType, metadata),
        ipAddress: ipAddress,
        userAgent: userAgent,
        resourceId: metadata.resourceId || null,
        resourceType: metadata.resourceType || null,
        metadata: JSON.stringify(metadata),
        isSecurityIncident: this.isSecurityEvent(eventType),
        isResolved: false,
        createdAt: new Date()
      };

      // Save to database
      await AuditLog.create(logData);

      // Log to Winston
      logger.info(`Event: ${eventType}`, {
        eventType,
        userId,
        sessionId: this.sessionId,
        ...metadata
      });

    } catch (error) {
      logger.error('Failed to log event:', error);
      // Don't throw error to prevent breaking main flow
    }
  }

  /**
   * Log a security incident
   * @param {string} incidentType - Type of security incident
   * @param {Object} metadata - Incident metadata
   * @param {string} userId - User ID (optional)
   * @param {string} ipAddress - IP address (optional)
   * @param {string} userAgent - User agent (optional)
   */
  async logSecurityIncident(incidentType, metadata = {}, userId = null, ipAddress = null, userAgent = null) {
    try {
      const logData = {
        id: uuidv4(),
        userId: userId,
        eventType: incidentType,
        eventCategory: 'SECURITY',
        severity: this.getSecuritySeverity(incidentType),
        description: this.generateSecurityDescription(incidentType, metadata),
        ipAddress: ipAddress,
        userAgent: userAgent,
        resourceId: metadata.resourceId || null,
        resourceType: metadata.resourceType || null,
        metadata: JSON.stringify(metadata),
        isSecurityIncident: true,
        isResolved: false,
        createdAt: new Date()
      };

      // Save to database
      await AuditLog.create(logData);

      // Log to Winston with security level
      logger.error(`Security Incident: ${incidentType}`, {
        incidentType,
        userId,
        sessionId: this.sessionId,
        severity: logData.severity,
        ...metadata
      });

      // Trigger security alert if critical
      if (logData.severity === 'CRITICAL') {
        await this.triggerSecurityAlert(incidentType, logData);
      }

    } catch (error) {
      logger.error('Failed to log security incident:', error);
    }
  }

  /**
   * Log an error
   * @param {string} errorType - Type of error
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  async logError(errorType, error, context = {}) {
    try {
      const metadata = {
        error: error.message,
        stack: error.stack,
        ...context
      };

      await this.logEvent(errorType, metadata, context.userId, context.ipAddress, context.userAgent);

    } catch (logError) {
      logger.error('Failed to log error:', logError);
    }
  }

  /**
   * Log user authentication events
   * @param {string} authType - Type of authentication event
   * @param {Object} metadata - Authentication metadata
   * @param {string} userId - User ID
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   */
  async logAuth(authType, metadata, userId, ipAddress, userAgent) {
    try {
      const eventType = `AUTH_${authType.toUpperCase()}`;
      const description = this.generateAuthDescription(authType, metadata);

      const logData = {
        id: uuidv4(),
        userId: userId,
        eventType: eventType,
        eventCategory: 'AUTH',
        severity: this.getAuthSeverity(authType),
        description: description,
        ipAddress: ipAddress,
        userAgent: userAgent,
        resourceId: metadata.resourceId || null,
        resourceType: 'USER',
        metadata: JSON.stringify(metadata),
        isSecurityIncident: this.isAuthSecurityEvent(authType),
        isResolved: false,
        createdAt: new Date()
      };

      await AuditLog.create(logData);

      logger.info(`Auth Event: ${authType}`, {
        userId,
        eventType,
        ipAddress,
        userAgent,
        ...metadata
      });

    } catch (error) {
      logger.error('Failed to log auth event:', error);
    }
  }

  /**
   * Log file operations
   * @param {string} operation - Type of file operation
   * @param {Object} metadata - Operation metadata
   * @param {string} userId - User ID
   * @param {string} ipAddress - IP address
   */
  async logFileOperation(operation, metadata, userId, ipAddress) {
    try {
      const eventType = `FILE_${operation.toUpperCase()}`;
      
      await this.logEvent(eventType, metadata, userId, ipAddress);

    } catch (error) {
      logger.error('Failed to log file operation:', error);
    }
  }

  /**
   * Log admin actions
   * @param {string} action - Admin action type
   * @param {Object} metadata - Action metadata
   * @param {string} adminId - Admin user ID
   * @param {string} ipAddress - IP address
   */
  async logAdminAction(action, metadata, adminId, ipAddress) {
    try {
      const eventType = `ADMIN_${action.toUpperCase()}`;
      
      await this.logEvent(eventType, metadata, adminId, ipAddress);

    } catch (error) {
      logger.error('Failed to log admin action:', error);
    }
  }

  /**
   * Get event category based on event type
   * @param {string} eventType - Event type
   * @returns {string} Event category
   */
  getEventCategory(eventType) {
    const categories = {
      // Authentication
      AUTH_LOGIN: 'AUTH',
      AUTH_LOGOUT: 'AUTH',
      AUTH_REGISTER: 'AUTH',
      AUTH_TOKEN_REFRESH: 'AUTH',
      AUTH_PASSWORD_CHANGE: 'AUTH',
      
      // File operations
      FILE_UPLOADED: 'FILE',
      FILE_DOWNLOADED: 'FILE',
      FILE_DELETED: 'FILE',
      FILE_UPDATED: 'FILE',
      FILE_SHARED: 'SHARE',
      SHARE_FILE_DOWNLOADED: 'SHARE',
      
      // Admin actions
      ADMIN_USER_CREATED: 'ADMIN',
      ADMIN_USER_UPDATED: 'ADMIN',
      ADMIN_USER_DELETED: 'ADMIN',
      ADMIN_CONFIG_CHANGED: 'ADMIN',
      
      // System
      SYSTEM_BACKUP_CREATED: 'SYSTEM',
      SYSTEM_RESTORE: 'SYSTEM',
      MAINTENANCE_ACTION: 'SYSTEM'
    };

    return categories[eventType] || 'SYSTEM';
  }

  /**
   * Get severity level for event
   * @param {string} eventType - Event type
   * @returns {string} Severity level
   */
  getSeverity(eventType) {
    const severityMap = {
      // Info level
      FILE_UPLOADED: 'INFO',
      FILE_DOWNLOADED: 'INFO',
      AUTH_LOGIN: 'INFO',
      AUTH_LOGOUT: 'INFO',
      TOKEN_REFRESHED: 'INFO',
      
      // Medium level
      FILE_DELETED: 'MEDIUM',
      FILE_UPDATED: 'MEDIUM',
      PASSWORD_CHANGED: 'MEDIUM',
      
      // High level
      UNAUTHORIZED_ACCESS: 'HIGH',
      RATE_LIMIT_EXCEEDED: 'HIGH',
      ADMIN_ACTION: 'HIGH'
    };

    return severityMap[eventType] || 'INFO';
  }

  /**
   * Get security severity for incidents
   * @param {string} incidentType - Incident type
   * @returns {string} Security severity
   */
  getSecuritySeverity(incidentType) {
    const criticalIncidents = [
      'MALWARE_DETECTED',
      'CRITICAL_SYSTEM_ERROR',
      'DATA_BREACH',
      'UNAUTHORIZED_ACCESS_ADMIN'
    ];

    const highIncidents = [
      'INVALID_TOKEN',
      'UNAUTHORIZED_FILE_TYPE',
      'ACCOUNT_LOCKED',
      'SUSPICIOUS_ACTIVITY',
      'FILE_QUARANTINED'
    ];

    if (criticalIncidents.includes(incidentType)) return 'CRITICAL';
    if (highIncidents.includes(incidentType)) return 'HIGH';
    return 'MEDIUM';
  }

  /**
   * Get authentication severity
   * @param {string} authType - Authentication type
   * @returns {string} Severity level
   */
  getAuthSeverity(authType) {
    const authMap = {
      LOGIN_SUCCESS: 'INFO',
      LOGOUT: 'INFO',
      TOKEN_REFRESH: 'INFO',
      REGISTER_SUCCESS: 'INFO',
      LOGIN_FAILED: 'LOW',
      PASSWORD_CHANGE: 'MEDIUM',
      ACCOUNT_LOCKED: 'HIGH',
      BRUTE_FORCE: 'HIGH'
    };

    return authMap[authType.toUpperCase()] || 'LOW';
  }

  /**
   * Check if event is security-related
   * @param {string} eventType - Event type
   * @returns {boolean} True if security event
   */
  isSecurityEvent(eventType) {
    const securityEvents = [
      'UNAUTHORIZED_ACCESS',
      'UNAUTHORIZED_FILE_TYPE',
      'RATE_LIMIT_EXCEEDED',
      'INVALID_TOKEN',
      'CSRF_TOKEN_INVALID',
      'SUSPICIOUS_ACTIVITY',
      'MALWARE_DETECTED',
      'FILE_QUARANTINED'
    ];

    return securityEvents.includes(eventType);
  }

  /**
   * Check if auth event is security-related
   * @param {string} authType - Auth type
   * @returns {boolean} True if security auth event
   */
  isAuthSecurityEvent(authType) {
    const securityAuthEvents = [
      'LOGIN_FAILED',
      'BRUTE_FORCE',
      'ACCOUNT_LOCKED',
      'INVALID_CREDENTIALS'
    ];

    return securityAuthEvents.includes(authType.toUpperCase());
  }

  /**
   * Generate event description
   * @param {string} eventType - Event type
   * @param {Object} metadata - Event metadata
   * @returns {string} Event description
   */
  generateDescription(eventType, metadata) {
    const descriptions = {
      FILE_UPLOADED: `File uploaded: ${metadata.filename || 'Unknown'}`,
      FILE_DOWNLOADED: `File downloaded: ${metadata.filename || 'Unknown'}`,
      FILE_DELETED: `File deleted: ${metadata.filename || 'Unknown'}`,
      FILE_SHARED: `File shared: ${metadata.shareId || 'Unknown'}`,
      AUTH_LOGIN: `User login: ${metadata.email || 'Unknown'}`,
      AUTH_LOGOUT: `User logout: ${metadata.userId || 'Unknown'}`,
      TOKEN_REFRESH: 'Token refreshed'
    };

    return descriptions[eventType] || `Event: ${eventType}`;
  }

  /**
   * Generate security description
   * @param {string} incidentType - Incident type
   * @param {Object} metadata - Incident metadata
   * @returns {string} Security description
   */
  generateSecurityDescription(incidentType, metadata) {
    const descriptions = {
      MALWARE_DETECTED: `Malware detected in file: ${metadata.filename || 'Unknown'}`,
      UNAUTHORIZED_ACCESS: `Unauthorized access attempt: ${metadata.url || 'Unknown'}`,
      INVALID_TOKEN: 'Invalid or expired token used',
      UNAUTHORIZED_FILE_TYPE: `Unauthorized file type uploaded: ${metadata.mimetype || 'Unknown'}`,
      RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
      FILE_QUARANTINED: `File quarantined: ${metadata.filename || 'Unknown'}`
    };

    return descriptions[incidentType] || `Security incident: ${incidentType}`;
  }

  /**
   * Generate auth description
   * @param {string} authType - Auth type
   * @param {Object} metadata - Auth metadata
   * @returns {string} Auth description
   */
  generateAuthDescription(authType, metadata) {
    const descriptions = {
      LOGIN_SUCCESS: `Successful login: ${metadata.email || 'Unknown'}`,
      LOGIN_FAILED: `Failed login attempt: ${metadata.email || 'Unknown'}`,
      LOGOUT: `User logout: ${metadata.userId || 'Unknown'}`,
      ACCOUNT_LOCKED: `Account locked: ${metadata.email || 'Unknown'}`,
      BRUTE_FORCE: `Brute force attack detected: ${metadata.email || 'Unknown'}`
    };

    return descriptions[authType.toUpperCase()] || `Auth event: ${authType}`;
  }

  /**
   * Trigger security alert for critical incidents
   * @param {string} incidentType - Incident type
   * @param {Object} logData - Log data
   */
  async triggerSecurityAlert(incidentType, logData) {
    try {
      // In a real implementation, this would send alerts via email, SMS, Slack, etc.
      logger.error(`SECURITY ALERT: ${incidentType}`, {
        incidentType,
        logData: logData,
        alertLevel: 'CRITICAL'
      });

      // Could integrate with alerting systems like:
      // - PagerDuty
      // - Slack
      // - Email
      // - SMS
      // - etc.

    } catch (error) {
      logger.error('Failed to trigger security alert:', error);
    }
  }

  /**
   * Set user context for logging
   * @param {string} userId - User ID
   * @param {Object} context - User context
   */
  setUserContext(userId, context) {
    this.userContext.set(userId, context);
  }

  /**
   * Get user context
   * @param {string} userId - User ID
   * @returns {Object} User context
   */
  getUserContext(userId) {
    return this.userContext.get(userId) || {};
  }

  /**
   * Clear user context
   * @param {string} userId - User ID
   */
  clearUserContext(userId) {
    this.userContext.delete(userId);
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

module.exports = {
  auditLogger,
  AuditLogger
};