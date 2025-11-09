/**
 * Error Tracking Service
 * Comprehensive error logging, tracking, and analysis system
 */

const { EventEmitter } = require('events');
const { Logger } = require('../utilities/logger');
const { DatabaseConnection } = require('../utilities/database-connection');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const crypto = require('crypto');

class ErrorTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableStackTrace: options.enableStackTrace !== false,
      enableSourceMapping: options.enableSourceMapping || false,
      enableUserTracking: options.enableUserTracking !== false,
      enableIPTracking: options.enableIPTracking !== false,
      enableUserAgentTracking: options.enableUserAgentTracking !== false,
      maxErrorsPerService: options.maxErrorsPerService || 10000,
      errorRetentionDays: options.errorRetentionDays || 90,
      enableGrouping: options.enableGrouping !== false,
      enableAutoResolution: options.enableAutoResolution || false,
      enableNotification: options.enableNotification !== false,
      batchSize: options.batchSize || 100,
      flushInterval: options.flushInterval || 5000,
      ...options
    };

    this.isRunning = false;
    this.logger = new Logger('ErrorTracker');
    this.db = null;
    
    // Error storage
    this.errorBuffer = [];
    this.recentErrors = [];
    this.errorGroups = new Map();
    this.fingerprintCache = new Map();
    
    // Statistics
    this.stats = {
      totalErrors: 0,
      errorsByService: new Map(),
      errorsByType: new Map(),
      errorsBySeverity: new Map(),
      uniqueErrors: 0,
      resolvedErrors: 0,
      criticalErrors: 0,
      lastError: null
    };
    
    // Configuration
    this.severityLevels = ['info', 'warning', 'error', 'critical'];
    this.errorCategories = {
      'javascript': 'JavaScript Runtime Error',
      'network': 'Network Error',
      'database': 'Database Error',
      'authentication': 'Authentication Error',
      'authorization': 'Authorization Error',
      'validation': 'Validation Error',
      'timeout': 'Timeout Error',
      'external': 'External Service Error',
      'system': 'System Error',
      'security': 'Security Error',
      'performance': 'Performance Error',
      'business': 'Business Logic Error',
      'infrastructure': 'Infrastructure Error',
      'unknown': 'Unknown Error'
    };
    
    // Performance monitoring
    this.counters = {
      errorsTracked: 0,
      errorsGrouped: 0,
      errorsResolved: 0,
      batchFlushes: 0,
      databaseOperations: 0,
      alertTriggers: 0
    };
    
    // Start time
    this.startTime = Date.now();
  }

  /**
   * Initialize the error tracker
   */
  async initialize() {
    try {
      this.logger.info('Initializing Error Tracker...');
      
      // Initialize database connection
      this.db = new DatabaseConnection();
      await this.db.connect();
      
      // Load error groups from database
      await this.loadErrorGroups();
      
      // Initialize auto-resolution system
      if (this.options.enableAutoResolution) {
        this.initializeAutoResolution();
      }
      
      this.logger.info('Error Tracker initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Error Tracker:', error);
      throw error;
    }
  }

  /**
   * Start the error tracker
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('Error Tracker is already running');
      return;
    }

    try {
      await this.initialize();
      
      this.isRunning = true;
      this.logger.info('Error Tracker started');
      
      // Start batch flush interval
      this.flushInterval = setInterval(() => {
        this.flushErrorBuffer();
      }, this.options.flushInterval);
      
      // Start cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldErrors();
      }, 3600000); // Every hour
      
      // Start statistics update interval
      this.statsInterval = setInterval(() => {
        this.updateStatistics();
      }, 60000); // Every minute
      
      this.emit('started', {
        timestamp: new Date().toISOString(),
        options: this.options
      });
      
    } catch (error) {
      this.logger.error('Failed to start Error Tracker:', error);
      throw error;
    }
  }

  /**
   * Stop the error tracker
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear intervals
    for (const interval of [this.flushInterval, this.cleanupInterval, this.statsInterval]) {
      if (interval) clearInterval(interval);
    }
    
    // Flush any remaining errors
    await this.flushErrorBuffer();
    
    this.logger.info('Error Tracker stopped');
    
    this.emit('stopped', {
      timestamp: new Date().toISOString(),
      counters: this.counters
    });
  }

  /**
   * Track an error
   */
  async trackError(error, context = {}) {
    try {
      const errorData = this.createErrorData(error, context);
      
      // Add to buffer for batch processing
      this.errorBuffer.push(errorData);
      
      // Add to recent errors (in-memory)
      this.recentErrors.push(errorData);
      
      // Update statistics
      this.updateErrorStats(errorData);
      
      // Group similar errors
      if (this.options.enableGrouping) {
        const groupId = this.generateErrorFingerprint(errorData);
        this.groupError(errorData, groupId);
      }
      
      // Check for immediate notification
      if (this.options.enableNotification && this.shouldNotifyImmediately(errorData)) {
        await this.sendNotification(errorData);
      }
      
      // Flush buffer if it's full
      if (this.errorBuffer.length >= this.options.batchSize) {
        await this.flushErrorBuffer();
      }
      
      this.counters.errorsTracked++;
      this.emit('error', errorData);
      
      // Keep recent errors list manageable
      this.maintainRecentErrors();
      
    } catch (trackingError) {
      this.logger.error('Error tracking failed:', trackingError);
    }
  }

  /**
   * Create error data object
   */
  createErrorData(error, context = {}) {
    const timestamp = new Date();
    const errorId = uuidv4();
    
    // Determine error category
    const category = this.categorizeError(error);
    
    // Determine severity
    const severity = this.determineSeverity(error, context);
    
    // Extract stack trace
    const stackTrace = this.options.enableStackTrace 
      ? (error.stack || new Error(error.message).stack)
      : null;
    
    // Create error fingerprint
    const fingerprint = this.generateErrorFingerprint({
      type: error.constructor.name,
      message: error.message,
      category,
      service: context.service || 'unknown',
      filePath: this.extractFilePath(stackTrace)
    });
    
    return {
      id: errorId,
      timestamp,
      type: error.constructor.name,
      message: error.message,
      category,
      severity,
      stackTrace,
      filePath: this.extractFilePath(stackTrace),
      lineNumber: this.extractLineNumber(stackTrace),
      functionName: this.extractFunctionName(stackTrace),
      service: context.service || 'unknown',
      endpoint: context.endpoint || null,
      method: context.method || null,
      userId: this.options.enableUserTracking ? context.userId : null,
      sessionId: context.sessionId || null,
      requestId: context.requestId || null,
      userAgent: this.options.enableUserAgentTracking ? context.userAgent : null,
      ipAddress: this.options.enableIPTracking ? context.ipAddress : null,
      url: context.url || null,
      referrer: context.referrer || null,
      fingerprint,
      occurrenceCount: 1,
      isResolved: false,
      resolvedAt: null,
      resolvedBy: null,
      tags: context.tags || {},
      metadata: {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        pid: process.pid,
        ...context.metadata
      }
    };
  }

  /**
   * Categorize error based on type and message
   */
  categorizeError(error) {
    const errorStr = error.toString().toLowerCase();
    const errorType = error.constructor.name.toLowerCase();
    
    // Network errors
    if (errorStr.includes('network') || errorStr.includes('fetch') || errorStr.includes('timeout') || 
        errorType.includes('networkerror') || errorType.includes('timeouterror')) {
      return 'network';
    }
    
    // Database errors
    if (errorStr.includes('database') || errorStr.includes('sql') || errorStr.includes('connection') ||
        errorType.includes('databaseerror') || errorType.includes('connectionerror')) {
      return 'database';
    }
    
    // Authentication errors
    if (errorStr.includes('auth') || errorStr.includes('unauthorized') || errorStr.includes('401')) {
      return 'authentication';
    }
    
    // Authorization errors
    if (errorStr.includes('forbidden') || errorStr.includes('403') || errorStr.includes('permission')) {
      return 'authorization';
    }
    
    // Validation errors
    if (errorStr.includes('validation') || errorStr.includes('invalid') || errorType.includes('validationerror')) {
      return 'validation';
    }
    
    // Timeout errors
    if (errorStr.includes('timeout') || errorType.includes('timeouterror')) {
      return 'timeout';
    }
    
    // Security errors
    if (errorStr.includes('security') || errorStr.includes('csrf') || errorStr.includes('xss')) {
      return 'security';
    }
    
    // Performance errors
    if (errorStr.includes('performance') || errorStr.includes('memory') || errorStr.includes('cpu')) {
      return 'performance';
    }
    
    // JavaScript runtime errors
    if (errorType.includes('referenceerror') || errorType.includes('typeerror') || 
        errorType.includes('syntaxerror') || errorType.includes('rangeerror')) {
      return 'javascript';
    }
    
    // Business logic errors
    if (errorStr.includes('business') || errorStr.includes('logic') || errorType.includes('businesserror')) {
      return 'business';
    }
    
    // System errors
    if (errorType.includes('systemerror') || errorType.includes('operationalerror')) {
      return 'system';
    }
    
    // Infrastructure errors
    if (errorStr.includes('infrastructure') || errorStr.includes('deployment') || errorStr.includes('infrastructure')) {
      return 'infrastructure';
    }
    
    return 'unknown';
  }

  /**
   * Determine error severity
   */
  determineSeverity(error, context = {}) {
    // Check if severity is explicitly set in context
    if (context.severity && this.severityLevels.includes(context.severity)) {
      return context.severity;
    }
    
    // Check error type
    const errorType = error.constructor.name.toLowerCase();
    
    if (errorType.includes('critical') || errorType.includes('fatal')) {
      return 'critical';
    }
    
    // Check HTTP status code
    if (context.statusCode) {
      if (context.statusCode >= 500) return 'critical';
      if (context.statusCode >= 400) return 'error';
    }
    
    // Check error message
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('critical') || errorMessage.includes('fatal')) {
      return 'critical';
    }
    
    if (errorMessage.includes('error') || errorMessage.includes('failed')) {
      return 'error';
    }
    
    if (errorMessage.includes('warning') || errorMessage.includes('caution')) {
      return 'warning';
    }
    
    // Default to error
    return 'error';
  }

  /**
   * Generate error fingerprint for grouping
   */
  generateErrorFingerprint(errorData) {
    const key = `${errorData.type}|${errorData.category}|${errorData.service}|${errorData.filePath}`;
    
    // Use cache to avoid recomputation
    if (this.fingerprintCache.has(key)) {
      return this.fingerprintCache.get(key);
    }
    
    // Create hash of the key
    const hash = crypto.createHash('md5').update(key).digest('hex');
    const fingerprint = `err_${hash.substring(0, 8)}`;
    
    this.fingerprintCache.set(key, fingerprint);
    return fingerprint;
  }

  /**
   * Group similar errors
   */
  groupError(errorData, fingerprint) {
    if (!this.errorGroups.has(fingerprint)) {
      this.errorGroups.set(fingerprint, {
        fingerprint,
        type: errorData.type,
        category: errorData.category,
        service: errorData.service,
        firstSeen: errorData.timestamp,
        lastSeen: errorData.timestamp,
        totalOccurrences: 1,
        occurrences: [errorData],
        affectedUsers: new Set(),
        affectedEndpoints: new Set(),
        status: 'active'
      });
    } else {
      const group = this.errorGroups.get(fingerprint);
      group.totalOccurrences++;
      group.lastSeen = errorData.timestamp;
      group.occurrences.push(errorData);
      
      if (errorData.userId) {
        group.affectedUsers.add(errorData.userId);
      }
      
      if (errorData.endpoint) {
        group.affectedEndpoints.add(errorData.endpoint);
      }
      
      // Keep only recent occurrences in memory
      if (group.occurrences.length > 100) {
        group.occurrences = group.occurrences.slice(-100);
      }
    }
    
    this.counters.errorsGrouped++;
  }

  /**
   * Check if error should trigger immediate notification
   */
  shouldNotifyImmediately(errorData) {
    // Critical errors always trigger immediate notification
    if (errorData.severity === 'critical') {
      return true;
    }
    
    // High-frequency errors (more than 10 in 5 minutes)
    const recentErrors = this.recentErrors.filter(e => 
      e.fingerprint === errorData.fingerprint && 
      Date.now() - e.timestamp.getTime() < 300000 // 5 minutes
    );
    
    if (recentErrors.length > 10) {
      return true;
    }
    
    // Security-related errors
    if (errorData.category === 'security') {
      return true;
    }
    
    return false;
  }

  /**
   * Send notification for critical errors
   */
  async sendNotification(errorData) {
    try {
      // This would integrate with your notification system
      // For now, just emit an event
      this.emit('criticalError', errorData);
      
      this.counters.alertTriggers++;
      this.logger.warn(`Critical error detected: ${errorData.message}`, {
        errorId: errorData.id,
        type: errorData.type,
        category: errorData.category
      });
      
    } catch (error) {
      this.logger.error('Failed to send error notification:', error);
    }
  }

  /**
   * Flush error buffer to database
   */
  async flushErrorBuffer() {
    if (this.errorBuffer.length === 0) {
      return;
    }
    
    try {
      const errors = [...this.errorBuffer];
      this.errorBuffer = [];
      
      const client = await this.db.getClient();
      
      // Batch insert errors
      for (const errorData of errors) {
        await client.query(
          `INSERT INTO error_logs 
           (timestamp, service_name, error_type, error_message, stack_trace, 
            file_path, line_number, function_name, severity, user_id, session_id, 
            request_id, endpoint, method, user_agent, ip_address, tags, metadata, 
            occurrence_count)
           VALUES 
           ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
          [
            errorData.timestamp,
            errorData.service,
            errorData.type,
            errorData.message,
            errorData.stackTrace,
            errorData.filePath,
            errorData.lineNumber,
            errorData.functionName,
            errorData.severity,
            errorData.userId,
            errorData.sessionId,
            errorData.requestId,
            errorData.endpoint,
            errorData.method,
            errorData.userAgent,
            errorData.ipAddress,
            JSON.stringify(errorData.tags),
            JSON.stringify(errorData.metadata),
            errorData.occurrenceCount
          ]
        );
      }
      
      await client.release();
      this.counters.batchFlushes++;
      
      this.logger.debug(`Flushed ${errors.length} errors to database`);
      
    } catch (error) {
      this.logger.error('Failed to flush error buffer:', error);
      
      // Put errors back in buffer for retry
      this.errorBuffer.unshift(...errors);
    }
  }

  /**
   * Load error groups from database
   */
  async loadErrorGroups() {
    try {
      const client = await this.db.getClient();
      
      const result = await client.query(`
        SELECT fingerprint, error_type, category, service, COUNT(*) as count,
               MIN(timestamp) as first_seen, MAX(timestamp) as last_seen
        FROM error_logs
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY fingerprint, error_type, category, service
        ORDER BY count DESC
        LIMIT 100
      `);
      
      for (const row of result.rows) {
        this.errorGroups.set(row.fingerprint, {
          fingerprint: row.fingerprint,
          type: row.error_type,
          category: row.category,
          service: row.service,
          totalOccurrences: parseInt(row.count),
          firstSeen: row.first_seen,
          lastSeen: row.last_seen,
          status: 'active'
        });
      }
      
      await client.release();
      this.logger.info(`Loaded ${this.errorGroups.size} error groups from database`);
      
    } catch (error) {
      this.logger.error('Failed to load error groups:', error);
    }
  }

  /**
   * Update error statistics
   */
  updateErrorStats(errorData) {
    this.stats.totalErrors++;
    this.stats.lastError = errorData;
    
    // Update service stats
    const serviceCount = this.stats.errorsByService.get(errorData.service) || 0;
    this.stats.errorsByService.set(errorData.service, serviceCount + 1);
    
    // Update type stats
    const typeCount = this.stats.errorsByType.get(errorData.type) || 0;
    this.stats.errorsByType.set(errorData.type, typeCount + 1);
    
    // Update severity stats
    const severityCount = this.stats.errorsBySeverity.get(errorData.severity) || 0;
    this.stats.errorsBySeverity.set(errorData.severity, severityCount + 1);
    
    if (errorData.severity === 'critical') {
      this.stats.criticalErrors++;
    }
  }

  /**
   * Update overall statistics
   */
  updateStatistics() {
    try {
      // This would typically fetch updated stats from database
      // For now, just emit current stats
      this.emit('statistics', {
        timestamp: new Date(),
        stats: this.stats,
        counters: this.counters,
        errorGroups: this.errorGroups.size
      });
      
    } catch (error) {
      this.logger.error('Error updating statistics:', error);
    }
  }

  /**
   * Clean up old errors
   */
  async cleanupOldErrors() {
    try {
      const cutoffDate = new Date(Date.now() - (this.options.errorRetentionDays * 24 * 60 * 60 * 1000));
      
      const client = await this.db.getClient();
      
      const result = await client.query(
        'DELETE FROM error_logs WHERE timestamp < $1',
        [cutoffDate]
      );
      
      await client.release();
      
      this.logger.info(`Cleaned up ${result.rowCount} old errors (older than ${this.options.errorRetentionDays} days)`);
      
    } catch (error) {
      this.logger.error('Failed to clean up old errors:', error);
    }
  }

  /**
   * Maintain recent errors list size
   */
  maintainRecentErrors() {
    const maxRecentErrors = 1000;
    
    if (this.recentErrors.length > maxRecentErrors) {
      this.recentErrors = this.recentErrors.slice(-maxRecentErrors);
    }
  }

  /**
   * Extract file path from stack trace
   */
  extractFilePath(stackTrace) {
    if (!stackTrace) return null;
    
    const match = stackTrace.match(/at\s+.*\s+\((.*):\d+:\d+\)/);
    return match ? match[1] : null;
  }

  /**
   * Extract line number from stack trace
   */
  extractLineNumber(stackTrace) {
    if (!stackTrace) return null;
    
    const match = stackTrace.match(/at\s+.*\s+\(.*:(\d+):\d+\)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Extract function name from stack trace
   */
  extractFunctionName(stackTrace) {
    if (!stackTrace) return null;
    
    const match = stackTrace.match(/at\s+([^\s(]+)/);
    return match ? match[1] : null;
  }

  /**
   * Initialize auto-resolution system
   */
  initializeAutoResolution() {
    // This would implement logic to automatically resolve certain types of errors
    // For example, temporary network errors might be auto-resolved after a period
    this.logger.info('Auto-resolution system initialized');
  }

  /**
   * Resolve an error
   */
  async resolveError(errorId, resolvedBy, notes = '') {
    try {
      // Update in database
      const client = await this.db.getClient();
      
      await client.query(
        'UPDATE error_logs SET is_resolved = true, resolved_at = NOW(), resolved_by = $1 WHERE id = $2',
        [resolvedBy, errorId]
      );
      
      await client.release();
      
      // Update in-memory data
      const errorIndex = this.recentErrors.findIndex(e => e.id === errorId);
      if (errorIndex !== -1) {
        this.recentErrors[errorIndex].isResolved = true;
        this.recentErrors[errorIndex].resolvedAt = new Date();
        this.recentErrors[errorIndex].resolvedBy = resolvedBy;
      }
      
      this.stats.resolvedErrors++;
      this.counters.errorsResolved++;
      
      this.emit('errorResolved', {
        errorId,
        resolvedBy,
        notes,
        timestamp: new Date()
      });
      
      this.logger.info(`Error resolved: ${errorId} by ${resolvedBy}`);
      
    } catch (error) {
      this.logger.error('Failed to resolve error:', error);
      throw error;
    }
  }

  /**
   * Get error by ID
   */
  getError(errorId) {
    return this.recentErrors.find(e => e.id === errorId);
  }

  /**
   * Get errors by service
   */
  getErrorsByService(service, limit = 100) {
    return this.recentErrors
      .filter(e => e.service === service)
      .slice(-limit);
  }

  /**
   * Get error groups
   */
  getErrorGroups() {
    return Array.from(this.errorGroups.values());
  }

  /**
   * Get current error tracker status
   */
  getErrorTrackerStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date().toISOString(),
      stats: {
        totalErrors: this.stats.totalErrors,
        criticalErrors: this.stats.criticalErrors,
        resolvedErrors: this.stats.resolvedErrors,
        errorGroups: this.errorGroups.size,
        bufferSize: this.errorBuffer.length,
        recentErrors: this.recentErrors.length
      },
      counters: this.counters,
      options: this.options
    };
  }
}

module.exports = { ErrorTracker };