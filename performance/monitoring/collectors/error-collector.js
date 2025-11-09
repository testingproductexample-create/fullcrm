const EventEmitter = require('events');
const DatabaseConnection = require('../utilities/database-connection');
const Logger = require('../utilities/logger');

class ErrorCollector extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            collectionInterval: config.collectionInterval || 10000, // 10 seconds
            maxRetainedErrors: config.maxRetainedErrors || 10000,
            enableStackCapture: config.enableStackCapture !== false,
            maxStackDepth: config.maxStackDepth || 10,
            errorGroupingWindow: config.errorGroupingWindow || 300000, // 5 minutes
            ...config
        };
        
        this.db = new DatabaseConnection();
        this.logger = new Logger('error-collector');
        this.errors = new Map();
        this.errorGroups = new Map();
        this.recentErrors = [];
        this.criticalErrors = [];
        this.errorPatterns = new Map();
        this.isCollecting = false;
        this.collectionTimer = null;
        
        this.initializeMetrics();
    }

    initializeMetrics() {
        // Initialize error metrics
        this.metrics.set('total_errors', 0);
        this.metrics.set('critical_errors', 0);
        this.metrics.set('warning_errors', 0);
        this.metrics.set('info_errors', 0);
        this.metrics.set('error_rate', 0);
        this.metrics.set('unique_errors', 0);
        this.metrics.set('resolved_errors', 0);
        this.metrics.set('average_resolution_time', 0);
    }

    // Track error occurrence
    trackError(errorData) {
        const {
            message,
            stack = '',
            level = 'error', // error, warning, info, debug
            service = 'application',
            source = '',
            userId,
            sessionId,
            requestId,
            url,
            method,
            userAgent,
            ip,
            additionalData = {},
            timestamp = Date.now(),
            severity = 'medium', // low, medium, high, critical
            category = 'general',
            tags = []
        } = errorData;

        // Create error object
        const errorId = this.generateErrorId(message, stack);
        const error = {
            id: errorId,
            message: this.sanitizeMessage(message),
            stack: this.config.enableStackCapture ? stack : '',
            level,
            service,
            source,
            userId,
            sessionId,
            requestId,
            url,
            method,
            userAgent,
            ip,
            severity,
            category,
            tags: [...new Set(tags)],
            additionalData: { ...additionalData },
            timestamp,
            resolved: false,
            resolvedAt: null,
            occurrenceCount: 1,
            firstSeen: timestamp,
            lastSeen: timestamp
        };

        // Update global metrics
        this.metrics.set('total_errors', this.metrics.get('total_errors') + 1);
        
        if (level === 'critical') {
            this.metrics.set('critical_errors', this.metrics.get('critical_errors') + 1);
            this.criticalErrors.unshift(error);
            if (this.criticalErrors.length > 100) {
                this.criticalErrors = this.criticalErrors.slice(0, 100);
            }
        } else if (level === 'warning') {
            this.metrics.set('warning_errors', this.metrics.get('warning_errors') + 1);
        } else {
            this.metrics.set('info_errors', this.metrics.get('info_errors') + 1);
        }

        // Group similar errors
        this.groupError(error);

        // Store in recent errors
        this.recentErrors.unshift(error);
        if (this.recentErrors.length > this.config.maxRetainedErrors) {
            this.recentErrors = this.recentErrors.slice(0, this.config.maxRetainedErrors);
        }

        // Analyze error patterns
        this.analyzeErrorPatterns(error);

        // Emit event for real-time monitoring
        this.emit('error', error);

        return error;
    }

    // Generate unique error ID
    generateErrorId(message, stack) {
        const crypto = require('crypto');
        const content = message + (this.config.enableStackCapture ? stack : '');
        return crypto.createHash('md5').update(content).digest('hex');
    }

    // Sanitize error message
    sanitizeMessage(message) {
        if (typeof message !== 'string') {
            return String(message);
        }
        
        // Remove sensitive information
        return message
            .replace(/password\s*[:=]\s*[^\s]+/gi, 'password: ***')
            .replace(/token\s*[:=]\s*[^\s]+/gi, 'token: ***')
            .replace(/authorization\s*[:=]\s*[^\s]+/gi, 'authorization: ***')
            .replace(/api[_-]?key\s*[:=]\s*[^\s]+/gi, 'api_key: ***');
    }

    // Group similar errors
    groupError(error) {
        const groupKey = this.getErrorGroupKey(error);
        
        if (!this.errorGroups.has(groupKey)) {
            this.errorGroups.set(groupKey, {
                key: groupKey,
                errorId: error.id,
                message: error.message,
                level: error.level,
                service: error.service,
                source: error.source,
                category: error.category,
                occurrenceCount: 0,
                firstSeen: error.timestamp,
                lastSeen: error.timestamp,
                severity: error.severity,
                tags: error.tags,
                affectedUsers: new Set(),
                affectedSessions: new Set(),
                affectedRequests: new Set(),
                trend: 'stable', // increasing, decreasing, stable
                status: 'active' // active, resolved, investigating
            });
        }

        const group = this.errorGroups.get(groupKey);
        group.occurrenceCount++;
        group.lastSeen = error.timestamp;
        
        if (group.occurrenceCount === 1) {
            group.firstSeen = error.timestamp;
        }

        // Track affected entities
        if (error.userId) {
            group.affectedUsers.add(error.userId);
        }
        if (error.sessionId) {
            group.affectedSessions.add(error.sessionId);
        }
        if (error.requestId) {
            group.affectedRequests.add(error.requestId);
        }

        // Update trend
        this.updateErrorTrend(group);
    }

    // Get error group key for clustering similar errors
    getErrorGroupKey(error) {
        // Remove dynamic parts like timestamps, IDs, etc.
        const normalizedMessage = error.message
            .replace(/\d{4}-\d{2}-\d{2}/g, 'DATE')
            .replace(/\d{2}:\d{2}:\d{2}/g, 'TIME')
            .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
            .replace(/\b\d+\b/g, 'NUMBER')
            .replace(/"[^"]*"/g, 'STRING');

        return `${error.service}:${error.level}:${normalizedMessage}`;
    }

    // Update error trend analysis
    updateErrorTrend(group) {
        const now = Date.now();
        const recentTime = now - 60000; // Last minute
        const olderTime = now - 300000; // Last 5 minutes

        // Count occurrences in different time windows
        const recentCount = this.getRecentErrorCount(group.key, recentTime);
        const olderCount = this.getRecentErrorCount(group.key, olderTime) - recentCount;

        if (recentCount > olderCount * 1.5) {
            group.trend = 'increasing';
        } else if (recentCount < olderCount * 0.5) {
            group.trend = 'decreasing';
        } else {
            group.trend = 'stable';
        }
    }

    // Get recent error count for a group
    getRecentErrorCount(groupKey, since) {
        return this.recentErrors
            .filter(error => {
                const key = this.getErrorGroupKey(error);
                return key === groupKey && error.timestamp >= since;
            })
            .length;
    }

    // Analyze error patterns
    analyzeErrorPatterns(error) {
        const pattern = this.extractPattern(error);
        if (pattern) {
            if (!this.errorPatterns.has(pattern)) {
                this.errorPatterns.set(pattern, {
                    pattern,
                    count: 0,
                    firstSeen: error.timestamp,
                    lastSeen: error.timestamp,
                    examples: []
                });
            }

            const patternData = this.errorPatterns.get(pattern);
            patternData.count++;
            patternData.lastSeen = error.timestamp;
            
            if (patternData.examples.length < 5) {
                patternData.examples.push({
                    message: error.message,
                    service: error.service,
                    timestamp: error.timestamp
                });
            }
        }
    }

    // Extract pattern from error
    extractPattern(error) {
        // Simple pattern extraction - could be more sophisticated
        if (error.message.includes('timeout')) return 'timeout_pattern';
        if (error.message.includes('connection')) return 'connection_pattern';
        if (error.message.includes('memory')) return 'memory_pattern';
        if (error.message.includes('disk')) return 'disk_pattern';
        if (error.message.includes('permission')) return 'permission_pattern';
        if (error.message.includes('validation')) return 'validation_pattern';
        return null;
    }

    // Start collecting metrics
    async start() {
        if (this.isCollecting) {
            this.logger.warn('Error collector is already running');
            return;
        }

        try {
            await this.db.connect();
            this.isCollecting = true;
            
            this.logger.info('Starting error metrics collection');
            
            // Start periodic collection
            this.collectionTimer = setInterval(() => {
                this.collectMetrics().catch(error => {
                    this.logger.error('Error collecting error metrics:', error);
                });
            }, this.config.collectionInterval);
            
            // Initial collection
            await this.collectMetrics();
            
        } catch (error) {
            this.logger.error('Failed to start error collector:', error);
            throw error;
        }
    }

    // Stop collecting metrics
    async stop() {
        if (!this.isCollecting) {
            return;
        }

        this.isCollecting = false;
        
        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = null;
        }
        
        // Save final metrics
        try {
            await this.collectMetrics();
        } catch (error) {
            this.logger.error('Error collecting final metrics:', error);
        }
        
        this.logger.info('Error metrics collection stopped');
    }

    // Collect and store metrics
    async collectMetrics() {
        const timestamp = new Date();
        const metrics = this.getCurrentMetrics();
        
        try {
            // Store global error metrics
            for (const [metricName, metricValue] of metrics.global) {
                await this.db.query(`
                    INSERT INTO system_metrics (
                        metric_name, metric_value, metric_type, dimensions, timestamp
                    ) VALUES ($1, $2, 'counter', $3, $4)
                `, [metricName, metricValue, JSON.stringify({ service: 'errors' }), timestamp]);
            }

            // Store recent errors to database
            for (const error of this.recentErrors.slice(0, 50)) { // Store up to 50 per collection
                await this.db.query(`
                    INSERT INTO error_logs (
                        log_level, message, stack_trace, service, source,
                        user_id, session_id, request_id, url, method,
                        user_agent, ip, severity, category, tags,
                        additional_data, timestamp
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                `, [
                    error.level,
                    error.message,
                    error.stack,
                    error.service,
                    error.source,
                    error.userId,
                    error.sessionId,
                    error.requestId,
                    error.url,
                    error.method,
                    error.userAgent,
                    error.ip,
                    error.severity,
                    error.category,
                    JSON.stringify(error.tags),
                    JSON.stringify(error.additionalData),
                    new Date(error.timestamp)
                ]);
            }

            // Clean up old errors from recent cache
            this.cleanupOldErrors();
            
        } catch (error) {
            this.logger.error('Failed to store error metrics:', error);
        }
    }

    // Clean up old errors from recent cache
    cleanupOldErrors() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        
        this.recentErrors = this.recentErrors.filter(error => error.timestamp >= cutoff);
        this.criticalErrors = this.criticalErrors.filter(error => error.timestamp >= cutoff);
    }

    // Get current metrics
    getCurrentMetrics() {
        const global = {
            total_errors: this.metrics.get('total_errors'),
            critical_errors: this.metrics.get('critical_errors'),
            warning_errors: this.metrics.get('warning_errors'),
            info_errors: this.metrics.get('info_errors'),
            error_rate: this.calculateErrorRate(),
            unique_errors: this.errorGroups.size,
            resolved_errors: this.metrics.get('resolved_errors'),
            average_resolution_time: this.metrics.get('average_resolution_time')
        };

        const errorGroups = Array.from(this.errorGroups.values())
            .map(group => ({
                ...group,
                affectedUsers: Array.from(group.affectedUsers),
                affectedSessions: Array.from(group.affectedSessions),
                affectedRequests: Array.from(group.affectedRequests)
            }));

        const errorPatterns = Array.from(this.errorPatterns.values());

        return {
            global,
            errorGroups,
            errorPatterns,
            recentErrorsCount: this.recentErrors.length,
            criticalErrorsCount: this.criticalErrors.length,
            timestamp: new Date()
        };
    }

    // Calculate error rate
    calculateErrorRate() {
        // This would need to be calculated based on total requests
        // For now, return a placeholder
        const totalErrors = this.metrics.get('total_errors');
        const uniqueErrors = this.errorGroups.size;
        
        return totalErrors > 0 ? (uniqueErrors / totalErrors) * 100 : 0;
    }

    // Get top error groups
    getTopErrorGroups(limit = 10) {
        return Array.from(this.errorGroups.values())
            .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
            .slice(0, limit);
    }

    // Get errors by severity
    getErrorsBySeverity() {
        const severityCounts = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };

        for (const group of this.errorGroups.values()) {
            severityCounts[group.severity] = (severityCounts[group.severity] || 0) + group.occurrenceCount;
        }

        return severityCounts;
    }

    // Get errors by service
    getErrorsByService() {
        const serviceCounts = new Map();

        for (const group of this.errorGroups.values()) {
            const current = serviceCounts.get(group.service) || 0;
            serviceCounts.set(group.service, current + group.occurrenceCount);
        }

        return Object.fromEntries(serviceCounts);
    }

    // Resolve error group
    resolveErrorGroup(groupKey, resolvedBy, resolutionNote = '') {
        const group = this.errorGroups.get(groupKey);
        if (group) {
            group.status = 'resolved';
            group.resolvedAt = Date.now();
            group.resolvedBy = resolvedBy;
            group.resolutionNote = resolutionNote;

            this.metrics.set('resolved_errors', this.metrics.get('resolved_errors') + 1);
            
            this.logger.info(`Resolved error group: ${groupKey}`, {
                resolvedBy,
                resolutionNote,
                occurrenceCount: group.occurrenceCount
            });
        }
    }

    // Get error trends
    getErrorTrends(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        const trends = [];

        // Group errors by hour
        const hourlyErrors = new Map();
        
        for (const error of this.recentErrors) {
            if (error.timestamp >= cutoff) {
                const hour = new Date(Math.floor(error.timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000));
                const hourKey = hour.toISOString();
                
                if (!hourlyErrors.has(hourKey)) {
                    hourlyErrors.set(hourKey, {
                        hour: hourKey,
                        total: 0,
                        critical: 0,
                        warning: 0,
                        info: 0
                    });
                }
                
                const hourData = hourlyErrors.get(hourKey);
                hourData.total++;
                hourData[error.level] = (hourData[error.level] || 0) + 1;
            }
        }

        return Array.from(hourlyErrors.values())
            .sort((a, b) => a.hour.localeCompare(b.hour));
    }

    // Reset metrics
    reset() {
        this.initializeMetrics();
        this.errors.clear();
        this.errorGroups.clear();
        this.recentErrors = [];
        this.criticalErrors = [];
        this.errorPatterns.clear();
        this.logger.info('Error metrics reset');
    }

    // Get metrics for specific time period
    async getMetricsForPeriod(startTime, endTime) {
        try {
            const result = await this.db.query(`
                SELECT 
                    log_level,
                    service,
                    severity,
                    category,
                    COUNT(*) as count,
                    DATE_TRUNC('hour', timestamp) as hour
                FROM error_logs 
                WHERE timestamp >= $1 AND timestamp <= $2
                GROUP BY log_level, service, severity, category, DATE_TRUNC('hour', timestamp)
                ORDER BY hour DESC
            `, [startTime, endTime]);
            
            return result.rows;
        } catch (error) {
            this.logger.error('Failed to get error metrics for period:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        try {
            await this.db.query('SELECT 1');
            return {
                status: 'healthy',
                isCollecting: this.isCollecting,
                totalErrors: this.metrics.get('total_errors'),
                errorGroups: this.errorGroups.size,
                recentErrors: this.recentErrors.length,
                criticalErrors: this.criticalErrors.length,
                lastCollection: new Date()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                isCollecting: this.isCollecting,
                error: error.message,
                lastCollection: null
            };
        }
    }
}

module.exports = ErrorCollector;