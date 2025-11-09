const EventEmitter = require('events');
const DatabaseConnection = require('../utilities/database-connection');
const Logger = require('../utilities/logger');

class APICollector extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            collectionInterval: config.collectionInterval || 30000, // 30 seconds
            maxRetainedMetrics: config.maxRetainedMetrics || 1000,
            enableDetailedMetrics: config.enableDetailedMetrics || false,
            ...config
        };
        
        this.db = new DatabaseConnection();
        this.logger = new Logger('api-collector');
        this.metrics = new Map();
        this.requestTracking = new Map();
        this.endpointMetrics = new Map();
        this.isCollecting = false;
        this.collectionTimer = null;
        
        this.initializeMetrics();
    }

    initializeMetrics() {
        // Initialize API request counters
        this.metrics.set('total_requests', 0);
        this.metrics.set('total_errors', 0);
        this.metrics.set('total_success', 0);
        this.metrics.set('average_response_time', 0);
        this.metrics.set('active_connections', 0);
        this.metrics.set('rate_limited_requests', 0);
    }

    // Track incoming API request
    trackRequest(requestData) {
        const {
            method,
            endpoint,
            statusCode,
            responseTime,
            userId,
            sessionId,
            requestId,
            timestamp = Date.now(),
            userAgent,
            ip,
            contentLength,
            requestSize,
            responseSize,
            error
        } = requestData;

        const endpointKey = `${method.toUpperCase()} ${endpoint}`;
        
        // Initialize endpoint metrics if not exists
        if (!this.endpointMetrics.has(endpointKey)) {
            this.endpointMetrics.set(endpointKey, {
                totalRequests: 0,
                totalErrors: 0,
                totalSuccess: 0,
                averageResponseTime: 0,
                minResponseTime: Infinity,
                maxResponseTime: 0,
                statusCodes: {},
                methods: new Set(),
                lastRequest: null,
                errorTypes: new Map(),
                responseSizeTotal: 0,
                requestSizeTotal: 0
            });
        }

        const endpointMetric = this.endpointMetrics.get(endpointKey);
        
        // Update endpoint metrics
        endpointMetric.totalRequests++;
        endpointMetric.lastRequest = timestamp;
        
        if (statusCode >= 400) {
            endpointMetric.totalErrors++;
        } else {
            endpointMetric.totalSuccess++;
        }
        
        // Update response time metrics
        if (responseTime) {
            endpointMetric.averageResponseTime = 
                (endpointMetric.averageResponseTime * (endpointMetric.totalRequests - 1) + responseTime) / 
                endpointMetric.totalRequests;
            endpointMetric.minResponseTime = Math.min(endpointMetric.minResponseTime, responseTime);
            endpointMetric.maxResponseTime = Math.max(endpointMetric.maxResponseTime, responseTime);
        }
        
        // Update status code distribution
        if (!endpointMetric.statusCodes[statusCode]) {
            endpointMetric.statusCodes[statusCode] = 0;
        }
        endpointMetric.statusCodes[statusCode]++;
        
        // Track methods
        endpointMetric.methods.add(method.toUpperCase());
        
        // Track error types if error present
        if (error) {
            const errorType = this.categorizeError(error);
            endpointMetric.errorTypes.set(errorType, 
                (endpointMetric.errorTypes.get(errorType) || 0) + 1);
        }
        
        // Update size metrics
        if (responseSize) {
            endpointMetric.responseSizeTotal += responseSize;
        }
        if (requestSize) {
            endpointMetric.requestSizeTotal += requestSize;
        }

        // Update global metrics
        this.metrics.set('total_requests', this.metrics.get('total_requests') + 1);
        if (statusCode >= 400) {
            this.metrics.set('total_errors', this.metrics.get('total_errors') + 1);
        } else {
            this.metrics.set('total_success', this.metrics.get('total_success') + 1);
        }
        
        // Update average response time
        const currentAvg = this.metrics.get('average_response_time') || 0;
        const totalRequests = this.metrics.get('total_requests');
        this.metrics.set('average_response_time', 
            (currentAvg * (totalRequests - 1) + responseTime) / totalRequests);

        // Track request for correlation
        if (requestId) {
            this.requestTracking.set(requestId, {
                startTime: timestamp,
                method,
                endpoint,
                userId,
                sessionId,
                statusCode,
                responseTime
            });
        }
    }

    categorizeError(error) {
        if (typeof error === 'string') {
            if (error.includes('timeout')) return 'timeout';
            if (error.includes('connection')) return 'connection';
            if (error.includes('validation')) return 'validation';
            if (error.includes('unauthorized')) return 'unauthorized';
            if (error.includes('not found')) return 'not_found';
            if (error.includes('server error')) return 'server_error';
            return 'general';
        }
        
        if (error.status) {
            if (error.status >= 500) return 'server_error';
            if (error.status >= 400 && error.status < 500) return 'client_error';
        }
        
        return 'general';
    }

    // Start collecting metrics
    async start() {
        if (this.isCollecting) {
            this.logger.warn('API collector is already running');
            return;
        }

        try {
            await this.db.connect();
            this.isCollecting = true;
            
            this.logger.info('Starting API metrics collection');
            
            // Start periodic collection
            this.collectionTimer = setInterval(() => {
                this.collectMetrics().catch(error => {
                    this.logger.error('Error collecting API metrics:', error);
                });
            }, this.config.collectionInterval);
            
            // Initial collection
            await this.collectMetrics();
            
        } catch (error) {
            this.logger.error('Failed to start API collector:', error);
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
        
        this.logger.info('API metrics collection stopped');
    }

    // Collect and store metrics
    async collectMetrics() {
        const timestamp = new Date();
        const metrics = this.getCurrentMetrics();
        
        try {
            // Store endpoint-level metrics
            for (const [endpoint, endpointMetric] of this.endpointMetrics) {
                const [method, path] = endpoint.split(' ');
                
                await this.db.query(`
                    INSERT INTO api_metrics (
                        endpoint, method, total_requests, total_errors, total_success,
                        average_response_time, min_response_time, max_response_time,
                        status_codes, error_types, response_size_avg, request_size_avg,
                        timestamp
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    path,
                    method,
                    endpointMetric.totalRequests,
                    endpointMetric.totalErrors,
                    endpointMetric.totalSuccess,
                    endpointMetric.averageResponseTime,
                    endpointMetric.minResponseTime === Infinity ? null : endpointMetric.minResponseTime,
                    endpointMetric.maxResponseTime,
                    JSON.stringify(endpointMetric.statusCodes),
                    JSON.stringify(Array.from(endpointMetric.errorTypes.entries())),
                    endpointMetric.totalRequests > 0 ? endpointMetric.responseSizeTotal / endpointMetric.totalRequests : 0,
                    endpointMetric.totalRequests > 0 ? endpointMetric.requestSizeTotal / endpointMetric.totalRequests : 0,
                    timestamp
                ]);
            }
            
            // Store global metrics
            await this.db.query(`
                INSERT INTO system_metrics (
                    metric_name, metric_value, metric_type, dimensions, timestamp
                ) VALUES 
                ('api_total_requests', $1, 'counter', $2, $3),
                ('api_total_errors', $1, 'counter', $2, $3),
                ('api_total_success', $1, 'counter', $2, $3),
                ('api_average_response_time', $1, 'gauge', $2, $3),
                ('api_active_connections', $1, 'gauge', $2, $3)
            `, [
                metrics.total_requests - (metrics.last_total_requests || 0),
                JSON.stringify({ service: 'api' }),
                timestamp
            ]);
            
            // Update last total requests
            metrics.last_total_requests = metrics.total_requests;
            
        } catch (error) {
            this.logger.error('Failed to store API metrics:', error);
        }
    }

    // Get current metrics
    getCurrentMetrics() {
        const metrics = {
            total_requests: this.metrics.get('total_requests'),
            total_errors: this.metrics.get('total_errors'),
            total_success: this.metrics.get('total_success'),
            average_response_time: this.metrics.get('average_response_time'),
            active_connections: this.metrics.get('active_connections'),
            rate_limited_requests: this.metrics.get('rate_limited_requests'),
            endpoint_count: this.endpointMetrics.size,
            endpoints: [],
            timestamp: new Date()
        };
        
        // Add endpoint details
        for (const [endpoint, endpointMetric] of this.endpointMetrics) {
            metrics.endpoints.push({
                endpoint,
                ...endpointMetric,
                methods: Array.from(endpointMetric.methods),
                error_types: Object.fromEntries(endpointMetric.errorTypes),
                error_rate: endpointMetric.totalRequests > 0 ? 
                    (endpointMetric.totalErrors / endpointMetric.totalRequests) * 100 : 0
            });
        }
        
        return metrics;
    }

    // Get top endpoints by request count
    getTopEndpoints(limit = 10) {
        const endpoints = Array.from(this.endpointMetrics.entries())
            .map(([endpoint, metric]) => ({ endpoint, ...metric }))
            .sort((a, b) => b.totalRequests - a.totalRequests)
            .slice(0, limit);
            
        return endpoints;
    }

    // Get slowest endpoints
    getSlowestEndpoints(limit = 10) {
        const endpoints = Array.from(this.endpointMetrics.entries())
            .map(([endpoint, metric]) => ({ endpoint, ...metric }))
            .filter(metric => metric.totalRequests > 0)
            .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
            .slice(0, limit);
            
        return endpoints;
    }

    // Get error rate by endpoint
    getEndpointsByErrorRate(minRequests = 10) {
        return Array.from(this.endpointMetrics.entries())
            .map(([endpoint, metric]) => ({
                endpoint,
                error_rate: metric.totalRequests > 0 ? 
                    (metric.totalErrors / metric.totalRequests) * 100 : 0,
                total_requests: metric.totalRequests,
                total_errors: metric.totalErrors
            }))
            .filter(metric => metric.total_requests >= minRequests)
            .sort((a, b) => b.error_rate - a.error_rate);
    }

    // Clean up old request tracking data
    cleanup() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        let cleaned = 0;
        
        for (const [requestId, request] of this.requestTracking) {
            if (request.startTime < cutoff) {
                this.requestTracking.delete(requestId);
                cleaned++;
            }
        }
        
        this.logger.debug(`Cleaned up ${cleaned} old request tracking records`);
        return cleaned;
    }

    // Reset metrics
    reset() {
        this.initializeMetrics();
        this.endpointMetrics.clear();
        this.requestTracking.clear();
        this.logger.info('API metrics reset');
    }

    // Get metrics for specific time period
    async getMetricsForPeriod(startTime, endTime) {
        try {
            const result = await this.db.query(`
                SELECT 
                    endpoint,
                    method,
                    DATE_TRUNC('hour', timestamp) as hour,
                    SUM(total_requests) as total_requests,
                    SUM(total_errors) as total_errors,
                    AVG(average_response_time) as avg_response_time,
                    MAX(max_response_time) as max_response_time
                FROM api_metrics 
                WHERE timestamp >= $1 AND timestamp <= $2
                GROUP BY endpoint, method, DATE_TRUNC('hour', timestamp)
                ORDER BY hour DESC, total_requests DESC
            `, [startTime, endTime]);
            
            return result.rows;
        } catch (error) {
            this.logger.error('Failed to get metrics for period:', error);
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
                metricsCount: this.endpointMetrics.size,
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

module.exports = APICollector;