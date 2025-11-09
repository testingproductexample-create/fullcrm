const { v4: uuidv4 } = require('uuid');
const Logger = require('../utilities/logger');

class RequestTrackingMiddleware {
    constructor(config = {}) {
        this.config = {
            includeRequestBody: config.includeRequestBody || false,
            includeResponseBody: config.includeResponseBody || false,
            maxBodySize: config.maxBodySize || 1024 * 1024, // 1MB
            excludePaths: config.excludePaths || ['/health', '/metrics'],
            enableCorrelationIds: config.enableCorrelationIds !== false,
            enableRequestTiming: config.enableRequestTiming !== false,
            ...config
        };
        
        this.logger = new Logger('request-tracking');
    }

    // Main middleware function
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const requestId = this.generateRequestId(req);
            const correlationId = this.generateCorrelationId();
            
            // Add request tracking data
            req.tracking = {
                requestId,
                correlationId,
                startTime,
                userId: null,
                sessionId: null,
                custom: {}
            };

            // Set response headers for tracking
            if (this.config.enableCorrelationIds) {
                res.setHeader('X-Request-ID', requestId);
                res.setHeader('X-Correlation-ID', correlationId);
            }

            // Track user information if available
            if (req.user) {
                req.tracking.userId = req.user.id;
                req.tracking.sessionId = req.user.sessionId;
            } else if (req.headers['x-user-id']) {
                req.tracking.userId = req.headers['x-user-id'];
            }

            // Track session information
            if (req.session && req.session.id) {
                req.tracking.sessionId = req.session.id;
            } else if (req.headers['x-session-id']) {
                req.tracking.sessionId = req.headers['x-session-id'];
            }

            // Exclude certain paths from detailed tracking
            const shouldExclude = this.config.excludePaths.some(path => 
                req.path.startsWith(path)
            );

            let requestBody = null;
            let responseBody = null;

            // Capture request body if enabled
            if (this.config.includeRequestBody && !shouldExclude) {
                requestBody = this.captureRequestBody(req);
            }

            // Override res.json to capture response body
            if (this.config.includeResponseBody && !shouldExclude) {
                const originalJson = res.json;
                const originalSend = res.send;
                
                res.json = (body) => {
                    responseBody = this.sanitizeResponseBody(body);
                    return originalJson.call(res, body);
                };
                
                res.send = (body) => {
                    if (typeof body === 'string') {
                        try {
                            responseBody = this.sanitizeResponseBody(JSON.parse(body));
                        } catch {
                            responseBody = body;
                        }
                    } else {
                        responseBody = this.sanitizeResponseBody(body);
                    }
                    return originalSend.call(res, body);
                };
            }

            // Track response
            const originalEnd = res.end;
            res.end = (chunk, encoding) => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                // Create tracking data
                const trackingData = {
                    requestId,
                    correlationId,
                    method: req.method,
                    url: req.originalUrl,
                    path: req.path,
                    query: req.query,
                    headers: this.sanitizeHeaders(req.headers),
                    userAgent: req.headers['user-agent'],
                    ip: this.getClientIP(req),
                    userId: req.tracking.userId,
                    sessionId: req.tracking.sessionId,
                    startTime,
                    endTime,
                    duration,
                    statusCode: res.statusCode,
                    contentLength: res.get('content-length'),
                    requestBody: shouldExclude ? null : requestBody,
                    responseBody: shouldExclude ? null : responseBody,
                    custom: req.tracking.custom,
                    timestamp: new Date()
                };

                // Log request tracking
                this.logRequest(trackingData);

                // Emit tracking event
                this.emitTrackingEvent('request', trackingData);

                // Call original end method
                return originalEnd.call(res, chunk, encoding);
            };

            // Handle errors
            res.on('error', (error) => {
                const trackingData = {
                    requestId,
                    correlationId,
                    method: req.method,
                    url: req.originalUrl,
                    path: req.path,
                    userAgent: req.headers['user-agent'],
                    ip: this.getClientIP(req),
                    userId: req.tracking.userId,
                    sessionId: req.tracking.sessionId,
                    startTime,
                    endTime: Date.now(),
                    duration: Date.now() - startTime,
                    error: error.message,
                    stack: error.stack,
                    timestamp: new Date()
                };

                this.logError(trackingData);
                this.emitTrackingEvent('error', trackingData);
            });

            next();
        };
    }

    // Generate request ID
    generateRequestId(req) {
        // Check if ID already exists in headers
        const existingId = req.headers['x-request-id'];
        if (existingId) {
            return existingId;
        }

        // Generate new ID
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Generate correlation ID
    generateCorrelationId() {
        return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    }

    // Get client IP address
    getClientIP(req) {
        return req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               'unknown';
    }

    // Capture request body
    captureRequestBody(req) {
        if (req.body && typeof req.body === 'object') {
            // Sanitize sensitive data
            return this.sanitizeRequestBody(req.body);
        }
        return null;
    }

    // Sanitize request body
    sanitizeRequestBody(body) {
        if (typeof body !== 'object' || body === null) {
            return body;
        }

        const sanitized = { ...body };
        const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];
        
        for (const key in sanitized) {
            if (sensitiveKeys.some(sensitive => 
                key.toLowerCase().includes(sensitive.toLowerCase())
            )) {
                sanitized[key] = '***REDACTED***';
            }
        }

        return sanitized;
    }

    // Sanitize response body
    sanitizeResponseBody(body) {
        if (typeof body !== 'object' || body === null) {
            return body;
        }

        // Remove sensitive data from response
        const sanitized = this.sanitizeRequestBody(body);
        return sanitized;
    }

    // Sanitize headers
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        const sensitiveHeaders = ['authorization', 'x-api-key', 'x-auth-token'];
        
        for (const header of sensitiveHeaders) {
            if (sanitized[header]) {
                sanitized[header] = '***REDACTED***';
            }
        }

        return sanitized;
    }

    // Log request tracking data
    logRequest(trackingData) {
        const logData = {
            requestId: trackingData.requestId,
            method: trackingData.method,
            url: trackingData.url,
            statusCode: trackingData.statusCode,
            duration: trackingData.duration,
            userId: trackingData.userId,
            ip: trackingData.ip
        };

        if (trackingData.statusCode >= 500) {
            this.logger.error('Request failed', logData);
        } else if (trackingData.statusCode >= 400) {
            this.logger.warn('Request error', logData);
        } else {
            this.logger.info('Request completed', logData);
        }
    }

    // Log error tracking data
    logError(trackingData) {
        this.logger.error('Request error', {
            requestId: trackingData.requestId,
            correlationId: trackingData.correlationId,
            method: trackingData.method,
            url: trackingData.url,
            error: trackingData.error,
            stack: trackingData.stack,
            duration: trackingData.duration,
            userId: trackingData.userId
        });
    }

    // Emit tracking event
    emitTrackingEvent(type, data) {
        // This would be connected to the monitoring system
        if (this.eventEmitter) {
            this.eventEmitter.emit('request-tracking', { type, data });
        }
    }

    // Set event emitter for tracking events
    setEventEmitter(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    // Add custom tracking data
    addCustomTracking(req, key, value) {
        if (req.tracking && req.tracking.custom) {
            req.tracking.custom[key] = value;
        }
    }

    // Middleware to track user interactions
    trackUserInteraction() {
        return (req, res, next) => {
            if (req.body && req.body.action) {
                const interactionData = {
                    requestId: req.tracking?.requestId,
                    userId: req.tracking?.userId,
                    action: req.body.action,
                    resource: req.body.resource || req.path,
                    timestamp: new Date(),
                    metadata: req.body.metadata || {}
                };

                this.emitTrackingEvent('user-interaction', interactionData);
            }
            next();
        };
    }

    // Middleware to track API rate limits
    trackRateLimit() {
        return (req, res, next) => {
            const originalSend = res.send;
            res.send = function(data) {
                if (res.get('X-RateLimit-Remaining') === '0') {
                    const rateLimitData = {
                        requestId: req.tracking?.requestId,
                        userId: req.tracking?.userId,
                        ip: req.tracking?.ip,
                        endpoint: req.path,
                        method: req.method,
                        rateLimitHit: true,
                        timestamp: new Date()
                    };

                    this.emitTrackingEvent('rate-limit', rateLimitData);
                }
                return originalSend.call(this, data);
            }.bind(this);

            next();
        };
    }

    // Middleware to track performance metrics
    trackPerformance() {
        return (req, res, next) => {
            const startTime = process.hrtime.bigint();
            
            const originalEnd = res.end;
            res.end = function(...args) {
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
                
                const performanceData = {
                    requestId: req.tracking?.requestId,
                    method: req.method,
                    url: req.path,
                    duration,
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: process.cpuUsage(),
                    timestamp: new Date()
                };

                this.emitTrackingEvent('performance', performanceData);
                
                return originalEnd.apply(this, args);
            }.bind(this);

            next();
        };
    }

    // Middleware to track database queries
    trackDatabaseQueries() {
        return (req, res, next) => {
            req.tracking.queries = [];
            
            // This would be connected to database monitoring
            // For now, just a placeholder structure
            next();
        };
    }

    // Get tracking data for a request
    getTrackingData(req) {
        return req.tracking;
    }

    // Check if request should be excluded from tracking
    shouldExcludeRequest(req) {
        return this.config.excludePaths.some(path => req.path.startsWith(path));
    }
}

module.exports = RequestTrackingMiddleware;