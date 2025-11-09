const Logger = require('../utilities/logger');

class ErrorTrackingMiddleware {
    constructor(config = {}) {
        this.config = {
            includeStackTrace: config.includeStackTrace !== false,
            includeRequestBody: config.includeRequestBody || false,
            includeResponseBody: config.includeResponseBody || false,
            captureUnhandledRejections: config.captureUnhandledRejections !== false,
            captureUncaughtExceptions: config.captureUncaughtExceptions !== false,
            maxStackDepth: config.maxStackDepth || 10,
            sanitizeData: config.sanitizeData !== false,
            customErrorHandler: config.customErrorHandler,
            ...config
        };
        
        this.logger = new Logger('error-tracking');
        this.errorCounts = new Map();
        this.recentErrors = [];
    }

    // Main error tracking middleware
    middleware() {
        return (req, res, next) => {
            // Set up error handling for this request
            req.errorContext = {
                requestId: req.tracking?.requestId,
                userId: req.tracking?.userId,
                sessionId: req.tracking?.sessionId,
                startTime: Date.now()
            };

            // Override res.json to catch response errors
            const originalJson = res.json;
            res.json = (body) => {
                try {
                    if (body && body.error) {
                        this.trackResponseError(req, res, body.error);
                    }
                    return originalJson.call(res, body);
                } catch (error) {
                    this.trackMiddlewareError(req, res, error, 'json_serialization');
                    throw error;
                }
            };

            // Override res.send to catch response errors
            const originalSend = res.send;
            res.send = (body) => {
                try {
                    if (typeof body === 'string') {
                        try {
                            const parsed = JSON.parse(body);
                            if (parsed.error) {
                                this.trackResponseError(req, res, parsed.error);
                            }
                        } catch {
                            // Not JSON, ignore
                        }
                    }
                    return originalSend.call(res, body);
                } catch (error) {
                    this.trackMiddlewareError(req, res, error, 'send_serialization');
                    throw error;
                }
            };

            next();
        };
    }

    // Error handling middleware
    errorHandler() {
        return (error, req, res, next) => {
            this.trackError(error, req, res);
            
            // Call custom error handler if provided
            if (this.config.customErrorHandler) {
                this.config.customErrorHandler(error, req, res, next);
                return;
            }

            // Default error handling
            this.handleError(error, req, res);
        };
    }

    // Track application errors
    trackError(error, req, res) {
        const errorData = this.createErrorData(error, req, res);
        
        // Categorize error
        const category = this.categorizeError(error);
        const severity = this.determineSeverity(error, category);
        
        // Count error occurrences
        const errorKey = this.getErrorKey(error, category);
        this.incrementErrorCount(errorKey);
        
        // Store error data
        this.storeError(errorData);
        
        // Log error
        this.logError(errorData);
        
        // Emit error event
        this.emitErrorEvent(errorData);
        
        // Check for critical errors
        if (severity === 'critical') {
            this.handleCriticalError(errorData);
        }
    }

    // Create error data object
    createErrorData(error, req, res) {
        const now = Date.now();
        
        return {
            errorId: this.generateErrorId(error, req),
            message: error.message || 'Unknown error',
            stack: this.config.includeStackTrace ? error.stack : null,
            name: error.name || 'Error',
            code: error.code,
            statusCode: error.statusCode || res?.statusCode || 500,
            category: this.categorizeError(error),
            severity: this.determineSeverity(error, this.categorizeError(error)),
            requestId: req?.tracking?.requestId,
            userId: req?.tracking?.userId,
            sessionId: req?.tracking?.sessionId,
            method: req?.method,
            url: req?.originalUrl || req?.url,
            path: req?.path,
            userAgent: req?.headers?.['user-agent'],
            ip: req?.connection?.remoteAddress || req?.ip,
            headers: this.sanitizeHeaders(req?.headers),
            query: req?.query,
            params: req?.params,
            requestBody: this.config.includeRequestBody ? this.sanitizeRequestBody(req?.body) : null,
            responseBody: this.config.includeResponseBody ? this.sanitizeResponseBody(res?.locals) : null,
            duration: now - (req?.errorContext?.startTime || now),
            timestamp: new Date(now),
            occurrences: this.errorCounts.get(this.getErrorKey(error, this.categorizeError(error))) || 1
        };
    }

    // Categorize error based on type and context
    categorizeError(error) {
        const message = (error.message || '').toLowerCase();
        const name = error.name?.toLowerCase() || '';
        const code = error.code;
        
        // Database errors
        if (name.includes('database') || name.includes('sql') || message.includes('connection')) {
            return 'database';
        }
        
        // Validation errors
        if (name.includes('validation') || name.includes('schema') || error.statusCode === 400) {
            return 'validation';
        }
        
        // Authentication errors
        if (name.includes('auth') || name.includes('token') || error.statusCode === 401) {
            return 'authentication';
        }
        
        // Authorization errors
        if (name.includes('permission') || name.includes('forbidden') || error.statusCode === 403) {
            return 'authorization';
        }
        
        // Not found errors
        if (name.includes('notfound') || name.includes('not found') || error.statusCode === 404) {
            return 'not_found';
        }
        
        // Network errors
        if (name.includes('network') || name.includes('timeout') || message.includes('timeout')) {
            return 'network';
        }
        
        // File system errors
        if (name.includes('file') || name.includes('ENOENT') || code === 'ENOENT') {
            return 'filesystem';
        }
        
        // Syntax errors
        if (name.includes('syntax') || name.includes('parse')) {
            return 'syntax';
        }
        
        // Memory errors
        if (message.includes('out of memory') || message.includes('heap')) {
            return 'memory';
        }
        
        // Default to application error
        return 'application';
    }

    // Determine error severity
    determineSeverity(error, category) {
        const message = (error.message || '').toLowerCase();
        const statusCode = error.statusCode;
        
        // Critical errors
        if (message.includes('out of memory') || 
            message.includes('segmentation fault') ||
            message.includes('stack overflow') ||
            category === 'database' && statusCode === 0) {
            return 'critical';
        }
        
        // High severity errors
        if (statusCode >= 500 || 
            category === 'authentication' || 
            category === 'authorization' ||
            message.includes('fatal') ||
            message.includes('critical')) {
            return 'high';
        }
        
        // Medium severity errors
        if (statusCode >= 400 && statusCode < 500 && 
            category !== 'validation' && 
            category !== 'not_found') {
            return 'medium';
        }
        
        // Low severity for validation and not found
        if (category === 'validation' || category === 'not_found') {
            return 'low';
        }
        
        // Default to medium
        return 'medium';
    }

    // Generate error ID
    generateErrorId(error, req) {
        const crypto = require('crypto');
        const content = error.message + error.stack + req?.path + req?.method;
        return crypto.createHash('md5').update(content).digest('hex');
    }

    // Get error key for counting
    getErrorKey(error, category) {
        const message = (error.message || '').toLowerCase().split('\n')[0]; // First line only
        return `${category}:${message}`;
    }

    // Increment error count
    incrementErrorCount(key) {
        const current = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, current + 1);
    }

    // Store error data
    storeError(errorData) {
        this.recentErrors.unshift(errorData);
        
        // Keep only recent errors
        if (this.recentErrors.length > 1000) {
            this.recentErrors = this.recentErrors.slice(0, 1000);
        }
    }

    // Track response errors
    trackResponseError(req, res, error) {
        if (error && typeof error === 'object') {
            const responseError = new Error(error.message || 'Response error');
            responseError.statusCode = error.statusCode || 500;
            responseError.code = error.code;
            this.trackError(responseError, req, res);
        }
    }

    // Track middleware errors
    trackMiddlewareError(req, res, error, context) {
        error.middlewareContext = context;
        error.isMiddlewareError = true;
        this.trackError(error, req, res);
    }

    // Sanitize headers
    sanitizeHeaders(headers) {
        if (!headers) return {};
        
        const sanitized = { ...headers };
        const sensitiveHeaders = ['authorization', 'x-api-key', 'x-auth-token', 'cookie'];
        
        for (const header of sensitiveHeaders) {
            if (sanitized[header]) {
                sanitized[header] = '***REDACTED***';
            }
        }
        
        return sanitized;
    }

    // Sanitize request body
    sanitizeRequestBody(body) {
        if (!body || typeof body !== 'object') return body;
        
        const sanitized = { ...body };
        const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization', 'creditCard'];
        
        for (const key in sanitized) {
            if (sensitiveKeys.some(sensitive => 
                key.toLowerCase().includes(sensitive.toLowerCase())
            )) {
                sanitized[key] = '***REDACTED***';
            } else if (typeof sanitized[key] === 'object') {
                sanitized[key] = this.sanitizeRequestBody(sanitized[key]);
            }
        }
        
        return sanitized;
    }

    // Sanitize response body
    sanitizeResponseBody(data) {
        return this.sanitizeRequestBody(data);
    }

    // Handle error response
    handleError(error, req, res) {
        const statusCode = error.statusCode || 500;
        const message = this.getErrorMessage(error, statusCode);
        
        // Don't expose internal errors in production
        const isDevelopment = process.env.NODE_ENV !== 'production';
        
        const errorResponse = {
            error: {
                message: isDevelopment ? message : 'Internal server error',
                statusCode,
                timestamp: new Date().toISOString(),
                requestId: req?.tracking?.requestId
            }
        };
        
        // Add stack trace in development
        if (isDevelopment && this.config.includeStackTrace) {
            errorResponse.error.stack = error.stack;
        }
        
        res.status(statusCode).json(errorResponse);
    }

    // Get appropriate error message
    getErrorMessage(error, statusCode) {
        if (error.message) {
            return error.message;
        }
        
        // Default messages by status code
        const messages = {
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            405: 'Method Not Allowed',
            409: 'Conflict',
            422: 'Unprocessable Entity',
            429: 'Too Many Requests',
            500: 'Internal Server Error',
            502: 'Bad Gateway',
            503: 'Service Unavailable',
            504: 'Gateway Timeout'
        };
        
        return messages[statusCode] || 'Unknown Error';
    }

    // Handle critical errors
    handleCriticalError(errorData) {
        this.logger.error('Critical error detected', errorData);
        
        // Send alerts for critical errors
        this.sendCriticalErrorAlert(errorData);
    }

    // Send critical error alert
    sendCriticalErrorAlert(errorData) {
        // This would integrate with alerting system
        this.emitErrorEvent('critical-error', errorData);
    }

    // Log error
    logError(errorData) {
        const logData = {
            errorId: errorData.errorId,
            category: errorData.category,
            severity: errorData.severity,
            statusCode: errorData.statusCode,
            url: errorData.url,
            userId: errorData.userId,
            occurrences: errorData.occurrences
        };

        switch (errorData.severity) {
            case 'critical':
                this.logger.error('Critical error', logData);
                break;
            case 'high':
                this.logger.error('High severity error', logData);
                break;
            case 'medium':
                this.logger.warn('Medium severity error', logData);
                break;
            case 'low':
                this.logger.info('Low severity error', logData);
                break;
        }
    }

    // Emit error event
    emitErrorEvent(type, data) {
        if (this.eventEmitter) {
            this.eventEmitter.emit('error-tracking', { type, data });
        }
    }

    // Set event emitter
    setEventEmitter(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    // Setup unhandled rejection tracking
    setupUnhandledRejectionTracking() {
        if (!this.config.captureUnhandledRejections) return;
        
        process.on('unhandledRejection', (reason, promise) => {
            const error = new Error('Unhandled Rejection');
            error.reason = reason;
            error.promise = promise;
            error.isUnhandledRejection = true;
            
            this.trackGlobalError(error, {
                type: 'unhandled_rejection',
                timestamp: new Date()
            });
        });
    }

    // Setup uncaught exception tracking
    setupUncaughtExceptionTracking() {
        if (!this.config.captureUncaughtExceptions) return;
        
        process.on('uncaughtException', (error) => {
            error.isUncaughtException = true;
            this.trackGlobalError(error, {
                type: 'uncaught_exception',
                timestamp: new Date()
            });
            
            // Exit after logging
            process.exit(1);
        });
    }

    // Track global errors
    trackGlobalError(error, context) {
        const errorData = {
            ...this.createErrorData(error, {}, {}),
            global: true,
            context
        };
        
        this.storeError(errorData);
        this.logError(errorData);
        this.emitErrorEvent('global-error', errorData);
    }

    // Get error statistics
    getErrorStats() {
        const stats = {
            totalErrors: this.recentErrors.length,
            errorsByCategory: {},
            errorsBySeverity: {},
            errorsByStatusCode: {},
            topErrors: [],
            recentErrors: this.recentErrors.slice(0, 10)
        };
        
        for (const error of this.recentErrors) {
            // Count by category
            stats.errorsByCategory[error.category] = 
                (stats.errorsByCategory[error.category] || 0) + 1;
            
            // Count by severity
            stats.errorsBySeverity[error.severity] = 
                (stats.errorsBySeverity[error.severity] || 0) + 1;
            
            // Count by status code
            stats.errorsByStatusCode[error.statusCode] = 
                (stats.errorsByStatusCode[error.statusCode] || 0) + 1;
        }
        
        // Top errors
        const errorGroups = new Map();
        for (const error of this.recentErrors) {
            const key = `${error.category}:${error.message}`;
            if (!errorGroups.has(key)) {
                errorGroups.set(key, {
                    category: error.category,
                    message: error.message,
                    count: 0,
                    severity: error.severity,
                    firstOccurrence: error.timestamp,
                    lastOccurrence: error.timestamp
                });
            }
            
            const group = errorGroups.get(key);
            group.count++;
            group.lastOccurrence = error.timestamp;
        }
        
        stats.topErrors = Array.from(errorGroups.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        
        return stats;
    }

    // Clear error data
    clear() {
        this.errorCounts.clear();
        this.recentErrors = [];
    }
}

module.exports = ErrorTrackingMiddleware;