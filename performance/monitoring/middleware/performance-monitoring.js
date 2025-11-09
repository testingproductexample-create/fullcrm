const Logger = require('../utilities/logger');

class PerformanceMonitoringMiddleware {
    constructor(config = {}) {
        this.config = {
            enableCpuMonitoring: config.enableCpuMonitoring !== false,
            enableMemoryMonitoring: config.enableMemoryMonitoring !== false,
            enableEventLoopMonitoring: config.enableEventLoopMonitoring !== false,
            enableDatabaseQueryTracking: config.enableDatabaseQueryTracking !== false,
            enableExternalCallTracking: config.enableExternalCallTracking !== false,
            slowRequestThreshold: config.slowRequestThreshold || 1000, // 1 second
            memoryWarningThreshold: config.memoryWarningThreshold || 500 * 1024 * 1024, // 500MB
            cpuWarningThreshold: config.cpuWarningThreshold || 80, // 80%
            ...config
        };
        
        this.logger = new Logger('performance-monitoring');
        this.performanceData = new Map();
        this.slowRequests = [];
        this.performanceSamples = [];
    }

    // Main performance monitoring middleware
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const startMemory = process.memoryUsage();
            const startCpu = process.cpuUsage();
            
            // Set up performance tracking
            req.performance = {
                startTime,
                startMemory,
                startCpu,
                queries: [],
                externalCalls: [],
                custom: {}
            };

            // Monitor event loop lag
            if (this.config.enableEventLoopMonitoring) {
                this.monitorEventLoop(req);
            }

            // Override res.end to capture performance metrics
            const originalEnd = res.end;
            res.end = (chunk, encoding) => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                const endMemory = process.memoryUsage();
                const endCpu = process.cpuUsage(startCpu);
                
                // Calculate performance metrics
                const performanceMetrics = this.calculateMetrics({
                    duration,
                    startMemory,
                    endMemory,
                    startCpu,
                    endCpu,
                    queries: req.performance.queries,
                    externalCalls: req.performance.externalCalls
                });

                // Store performance data
                this.storePerformanceData(req, res, performanceMetrics);

                // Check for performance issues
                this.checkPerformanceIssues(req, res, performanceMetrics);

                // Log slow requests
                if (duration > this.config.slowRequestThreshold) {
                    this.logSlowRequest(req, res, performanceMetrics);
                }

                return originalEnd.call(res, chunk, encoding);
            };

            next();
        };
    }

    // Monitor event loop lag
    monitorEventLoop(req) {
        let lastCheck = process.hrtime.bigint();
        
        const checkInterval = setInterval(() => {
            const now = process.hrtime.bigint();
            const elapsed = Number(now - lastCheck) / 1000000; // Convert to milliseconds
            
            // If elapsed time is much larger than expected, we have event loop lag
            if (elapsed > 16) { // More than 16ms (typical 60fps frame time)
                req.performance.eventLoopLag = (req.performance.eventLoopLag || 0) + elapsed;
            }
            
            lastCheck = now;
        }, 10);

        // Clear interval when response ends
        res.on('finish', () => {
            clearInterval(checkInterval);
        });
    }

    // Calculate performance metrics
    calculateMetrics(data) {
        const { duration, startMemory, endMemory, startCpu, endCpu, queries, externalCalls } = data;
        
        // Memory metrics
        const memoryDelta = {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            external: endMemory.external - startMemory.external
        };

        // CPU metrics
        const cpuDelta = {
            user: endCpu.user - startCpu.user,
            system: endCpu.system - startCpu.system
        };

        // Query metrics
        const totalQueryTime = queries.reduce((sum, query) => sum + (query.duration || 0), 0);
        const queryCount = queries.length;

        // External call metrics
        const totalExternalTime = externalCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
        const externalCallCount = externalCalls.length;

        return {
            requestDuration: duration,
            memoryDelta,
            cpuDelta,
            queryMetrics: {
                count: queryCount,
                totalTime: totalQueryTime,
                averageTime: queryCount > 0 ? totalQueryTime / queryCount : 0
            },
            externalCallMetrics: {
                count: externalCallCount,
                totalTime: totalExternalTime,
                averageTime: externalCallCount > 0 ? totalExternalTime / externalCallCount : 0
            },
            timestamp: new Date()
        };
    }

    // Store performance data
    storePerformanceData(req, res, metrics) {
        const requestId = req.tracking?.requestId || 'unknown';
        
        this.performanceData.set(requestId, {
            requestId,
            method: req.method,
            url: req.path,
            statusCode: res.statusCode,
            userId: req.tracking?.userId,
            sessionId: req.tracking?.sessionId,
            ...metrics
        });

        // Keep only recent performance data
        if (this.performanceData.size > 10000) {
            const entries = Array.from(this.performanceData.entries());
            const oldEntries = entries.slice(0, 1000);
            oldEntries.forEach(([id]) => this.performanceData.delete(id));
        }
    }

    // Check for performance issues
    checkPerformanceIssues(req, res, metrics) {
        const issues = [];

        // Check memory usage
        if (this.config.enableMemoryMonitoring) {
            const currentMemory = process.memoryUsage();
            if (currentMemory.rss > this.config.memoryWarningThreshold) {
                issues.push({
                    type: 'high_memory_usage',
                    severity: 'warning',
                    current: currentMemory.rss,
                    threshold: this.config.memoryWarningThreshold
                });
            }
        }

        // Check CPU usage
        if (this.config.enableCpuMonitoring) {
            const cpuUsage = this.calculateCpuUsage(metrics.cpuDelta);
            if (cpuUsage > this.config.cpuWarningThreshold) {
                issues.push({
                    type: 'high_cpu_usage',
                    severity: 'warning',
                    current: cpuUsage,
                    threshold: this.config.cpuWarningThreshold
                });
            }
        }

        // Check for event loop lag
        if (req.performance.eventLoopLag && req.performance.eventLoopLag > 50) {
            issues.push({
                type: 'event_loop_lag',
                severity: 'warning',
                current: req.performance.eventLoopLag,
                threshold: 50
            });
        }

        // Check query performance
        if (metrics.queryMetrics.averageTime > 500) {
            issues.push({
                type: 'slow_database_queries',
                severity: 'warning',
                averageTime: metrics.queryMetrics.averageTime
            });
        }

        // Check for issues
        if (issues.length > 0) {
            this.logPerformanceIssues(req, res, metrics, issues);
        }
    }

    // Calculate CPU usage percentage
    calculateCpuUsage(cpuDelta) {
        const totalCpu = cpuDelta.user + cpuDelta.system;
        // This is a simplified calculation
        // In production, you might want a more sophisticated CPU usage calculation
        return Math.min(totalCpu / 10000, 100); // Rough approximation
    }

    // Log performance issues
    logPerformanceIssues(req, res, metrics, issues) {
        const logData = {
            requestId: req.tracking?.requestId,
            method: req.method,
            url: req.path,
            userId: req.tracking?.userId,
            issues
        };

        this.logger.warn('Performance issues detected', logData);

        // Emit performance event
        this.emitPerformanceEvent('issues', {
            ...logData,
            metrics
        });
    }

    // Log slow request
    logSlowRequest(req, res, metrics) {
        const slowRequestData = {
            requestId: req.tracking?.requestId,
            method: req.method,
            url: req.path,
            duration: metrics.requestDuration,
            statusCode: res.statusCode,
            userId: req.tracking?.userId,
            memoryDelta: metrics.memoryDelta,
            queryCount: metrics.queryMetrics.count,
            externalCallCount: metrics.externalCallMetrics.count,
            timestamp: new Date()
        };

        this.slowRequests.unshift(slowRequestData);
        if (this.slowRequests.length > 100) {
            this.slowRequests = this.slowRequests.slice(0, 100);
        }

        this.logger.warn('Slow request detected', slowRequestData);
        this.emitPerformanceEvent('slow-request', slowRequestData);
    }

    // Track database query
    trackQuery() {
        return (req, res, next) => {
            const originalQuery = req.db?.query || req.connection?.query;
            
            if (originalQuery && this.config.enableDatabaseQueryTracking) {
                req.db.query = (...args) => {
                    const startTime = Date.now();
                    const query = typeof args[0] === 'string' ? args[0] : '';
                    const params = args[1] || [];
                    
                    return originalQuery.apply(req.db, args)
                        .then((result) => {
                            const endTime = Date.now();
                            const duration = endTime - startTime;
                            
                            req.performance.queries.push({
                                query: this.sanitizeQuery(query),
                                params,
                                duration,
                                rowCount: result.rowCount || 0,
                                timestamp: new Date()
                            });
                            
                            return result;
                        })
                        .catch((error) => {
                            const endTime = Date.now();
                            const duration = endTime - startTime;
                            
                            req.performance.queries.push({
                                query: this.sanitizeQuery(query),
                                params,
                                duration,
                                error: error.message,
                                timestamp: new Date()
                            });
                            
                            throw error;
                        });
                };
            }
            
            next();
        };
    }

    // Track external API calls
    trackExternalCalls() {
        return (req, res, next) => {
            const originalFetch = global.fetch;
            
            if (originalFetch && this.config.enableExternalCallTracking) {
                global.fetch = (...args) => {
                    const startTime = Date.now();
                    const url = args[0];
                    const options = args[1] || {};
                    
                    return originalFetch.apply(global, args)
                        .then((response) => {
                            const endTime = Date.now();
                            const duration = endTime - startTime;
                            
                            req.performance.externalCalls.push({
                                url: typeof url === 'string' ? url : url.toString(),
                                method: options.method || 'GET',
                                duration,
                                statusCode: response.status,
                                timestamp: new Date()
                            });
                            
                            return response;
                        })
                        .catch((error) => {
                            const endTime = Date.now();
                            const duration = endTime - startTime;
                            
                            req.performance.externalCalls.push({
                                url: typeof url === 'string' ? url : url.toString(),
                                method: options.method || 'GET',
                                duration,
                                error: error.message,
                                timestamp: new Date()
                            });
                            
                            throw error;
                        });
                };
            }
            
            next();
        };
    }

    // Sanitize query for logging
    sanitizeQuery(query) {
        if (typeof query !== 'string') {
            return String(query);
        }
        
        // Remove specific values but keep structure
        return query
            .replace(/'[^']*'/g, "'[REDACTED]'")
            .replace(/"\s*:\s*"[^"]*"/g, '" : "[REDACTED]"')
            .replace(/\b\d+\b/g, '[NUMBER]');
    }

    // Add custom performance measurement
    measureCustom(req, name, fn) {
        const startTime = process.hrtime.bigint();
        
        try {
            const result = fn();
            
            if (result && typeof result.then === 'function') {
                return result.then((value) => {
                    const endTime = process.hrtime.bigint();
                    const duration = Number(endTime - startTime) / 1000000;
                    
                    req.performance.custom[name] = {
                        duration,
                        success: true,
                        timestamp: new Date()
                    };
                    
                    return value;
                });
            } else {
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000;
                
                req.performance.custom[name] = {
                    duration,
                    success: true,
                    timestamp: new Date()
                };
                
                return result;
            }
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000;
            
            req.performance.custom[name] = {
                duration,
                success: false,
                error: error.message,
                timestamp: new Date()
            };
            
            throw error;
        }
    }

    // Get performance data for a request
    getPerformanceData(requestId) {
        return this.performanceData.get(requestId);
    }

    // Get all performance data
    getAllPerformanceData() {
        return Array.from(this.performanceData.values());
    }

    // Get slow requests
    getSlowRequests(limit = 10) {
        return this.slowRequests
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }

    // Get performance statistics
    getPerformanceStats() {
        const data = Array.from(this.performanceData.values());
        
        if (data.length === 0) {
            return null;
        }

        const durations = data.map(d => d.requestDuration);
        const memoryUsage = data.map(d => d.memoryDelta.rss);
        const queryTimes = data.flatMap(d => d.queries.map(q => q.duration));
        
        return {
            requestCount: data.length,
            averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            averageMemoryDelta: memoryUsage.reduce((sum, m) => sum + m, 0) / memoryUsage.length,
            totalQueries: data.reduce((sum, d) => sum + d.queryMetrics.count, 0),
            averageQueryTime: queryTimes.length > 0 ? 
                queryTimes.reduce((sum, q) => sum + q, 0) / queryTimes.length : 0,
            slowRequestCount: this.slowRequests.length,
            timestamp: new Date()
        };
    }

    // Clear performance data
    clear() {
        this.performanceData.clear();
        this.slowRequests = [];
        this.performanceSamples = [];
    }

    // Emit performance event
    emitPerformanceEvent(type, data) {
        if (this.eventEmitter) {
            this.eventEmitter.emit('performance', { type, data });
        }
    }

    // Set event emitter
    setEventEmitter(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
}

module.exports = PerformanceMonitoringMiddleware;