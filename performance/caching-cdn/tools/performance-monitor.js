/**
 * Performance Monitor
 * Real-time monitoring and analytics for cache system performance
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

class PerformanceMonitor extends EventEmitter {
    constructor(components, config = {}) {
        super();
        
        this.components = components;
        this.config = {
            collectionInterval: config.collectionInterval || 5000, // 5 seconds
            retentionPeriod: config.retentionPeriod || 86400000, // 24 hours
            alertThresholds: {
                hitRate: 0.8,
                responseTime: 500,
                memoryUsage: 0.85,
                errorRate: 0.01,
                ...config.alertThresholds
            },
            enableRealTime: config.enableRealTime !== false,
            enableAlerts: config.enableAlerts !== false,
            maxDataPoints: config.maxDataPoints || 1000,
            ...config
        };

        // Data storage
        this.metrics = {
            cache: [],
            system: [],
            network: [],
            application: []
        };
        
        this.currentMetrics = {
            cache: {},
            system: {},
            network: {},
            application: {}
        };
        
        this.alerts = [];
        this.isCollecting = false;
        this.collectionTimer = null;
        this.cleanupTimer = null;
    }

    /**
     * Start performance monitoring
     */
    start() {
        if (this.isCollecting) {
            logger.warn('Performance monitoring is already running');
            return;
        }

        this.isCollecting = true;
        logger.info('📊 Starting performance monitoring...');

        // Start data collection
        this.startDataCollection();
        
        // Start cleanup process
        this.startCleanup();
        
        // Initialize real-time WebSocket if enabled
        if (this.config.enableRealTime) {
            this.initializeRealTimeMonitoring();
        }

        logger.info('✅ Performance monitoring started');
    }

    /**
     * Stop performance monitoring
     */
    stop() {
        if (!this.isCollecting) {
            return;
        }

        this.isCollecting = false;

        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = null;
        }

        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        logger.info('📊 Performance monitoring stopped');
    }

    /**
     * Start the main data collection loop
     */
    startDataCollection() {
        this.collectionTimer = setInterval(async () => {
            try {
                await this.collectMetrics();
                await this.analyzePerformance();
                await this.checkAlerts();
            } catch (error) {
                logger.error('Error during metrics collection:', error);
            }
        }, this.config.collectionInterval);

        // Collect initial metrics
        this.collectMetrics();
    }

    /**
     * Start cleanup process to remove old data
     */
    startCleanup() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupOldData();
        }, this.config.collectionInterval * 10); // Cleanup every 10 collection cycles
    }

    /**
     * Collect all performance metrics
     */
    async collectMetrics() {
        const timestamp = Date.now();
        
        try {
            // Collect cache metrics
            const cacheMetrics = await this.collectCacheMetrics();
            
            // Collect system metrics
            const systemMetrics = await this.collectSystemMetrics();
            
            // Collect network metrics
            const networkMetrics = await this.collectNetworkMetrics();
            
            // Collect application metrics
            const applicationMetrics = await this.collectApplicationMetrics();

            // Store metrics
            this.storeMetrics({
                timestamp,
                cache: cacheMetrics,
                system: systemMetrics,
                network: networkMetrics,
                application: applicationMetrics
            });

            // Update current metrics
            this.currentMetrics = {
                cache: cacheMetrics,
                system: systemMetrics,
                network: networkMetrics,
                application: applicationMetrics
            };

            // Emit metrics update event
            this.emit('metricsUpdated', {
                timestamp,
                metrics: this.currentMetrics
            });

        } catch (error) {
            logger.error('Error collecting metrics:', error);
        }
    }

    /**
     * Collect cache-specific metrics
     */
    async collectCacheMetrics() {
        const metrics = {
            timestamp: Date.now()
        };

        try {
            // Get cache statistics
            const cacheManager = this.components.get('cacheManager');
            if (cacheManager) {
                const stats = await cacheManager.getStats();
                metrics.hits = stats.hits || 0;
                metrics.misses = stats.misses || 0;
                metrics.hitRate = this.calculateHitRate(stats.hits, stats.misses);
                metrics.totalRequests = (stats.hits || 0) + (stats.misses || 0);
            }

            // Get Redis metrics
            const redisClient = this.components.get('redis');
            if (redisClient) {
                const redisInfo = await this.getRedisMetrics(redisClient);
                metrics.memoryUsage = redisInfo.usedMemoryPercent;
                metrics.connectedClients = redisInfo.connectedClients;
                metrics.totalKeys = redisInfo.totalKeys;
                metrics.evictedKeys = redisInfo.evictedKeys;
            }

            // Get query cache metrics
            const queryCache = this.components.get('queryCache');
            if (queryCache) {
                metrics.queryCacheHits = await this.getQueryCacheHits();
                metrics.queryCacheMisses = await this.getQueryCacheMisses();
                metrics.averageQueryTime = await this.getAverageQueryTime();
            }

            // Get response cache metrics
            const responseCache = this.components.get('responseCache');
            if (responseCache) {
                metrics.responseCacheHits = await this.getResponseCacheHits();
                metrics.responseCacheMisses = await this.getResponseCacheMisses();
                metrics.averageResponseTime = await this.getAverageResponseTime();
            }

            // Calculate derived metrics
            metrics.efficiency = this.calculateCacheEfficiency(metrics);
            metrics.score = this.calculateCacheScore(metrics);

        } catch (error) {
            logger.error('Error collecting cache metrics:', error);
            metrics.error = error.message;
        }

        return metrics;
    }

    /**
     * Collect system-level metrics
     */
    async collectSystemMetrics() {
        const metrics = {
            timestamp: Date.now()
        };

        try {
            // Process memory usage
            const memUsage = process.memoryUsage();
            metrics.memoryRSS = memUsage.rss;
            metrics.memoryHeapTotal = memUsage.heapTotal;
            metrics.memoryHeapUsed = memUsage.heapUsed;
            metrics.memoryExternal = memUsage.external;
            metrics.memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

            // Process CPU usage
            const cpuUsage = process.cpuUsage();
            metrics.cpuUser = cpuUsage.user;
            metrics.cpuSystem = cpuUsage.system;
            
            // System load (if available)
            if (typeof require !== 'undefined') {
                try {
                    const os = require('os');
                    metrics.loadAverage = os.loadavg();
                    metrics.totalMemory = os.totalmem();
                    metrics.freeMemory = os.freemem();
                    metrics.memoryAvailablePercent = (os.freemem() / os.totalmem()) * 100;
                } catch (err) {
                    // OS metrics not available
                }
            }

            // Process uptime
            metrics.uptime = process.uptime();
            
            // Event loop lag
            metrics.eventLoopLag = await this.measureEventLoopLag();

        } catch (error) {
            logger.error('Error collecting system metrics:', error);
            metrics.error = error.message;
        }

        return metrics;
    }

    /**
     * Collect network and I/O metrics
     */
    async collectNetworkMetrics() {
        const metrics = {
            timestamp: Date.now()
        };

        try {
            // Count active connections (mock implementation)
            metrics.activeConnections = await this.getActiveConnections();
            metrics.connectionRate = await this.getConnectionRate();
            
            // Network I/O (if available)
            metrics.networkIn = await this.getNetworkBytes('in');
            metrics.networkOut = await this.getNetworkBytes('out');
            
            // Request rate
            metrics.requestsPerSecond = await this.getRequestsPerSecond();
            
            // Error rate
            metrics.errorRate = await this.getErrorRate();

        } catch (error) {
            logger.error('Error collecting network metrics:', error);
            metrics.error = error.message;
        }

        return metrics;
    }

    /**
     * Collect application-specific metrics
     */
    async collectApplicationMetrics() {
        const metrics = {
            timestamp: Date.now()
        };

        try {
            // Application performance
            metrics.averageResponseTime = await this.getApplicationResponseTime();
            metrics.p95ResponseTime = await this.getP95ResponseTime();
            metrics.p99ResponseTime = await this.getP99ResponseTime();
            
            // Database metrics
            const queryCache = this.components.get('queryCache');
            if (queryCache) {
                metrics.dbQueryTime = await this.getDatabaseQueryTime();
                metrics.dbConnections = await this.getDatabaseConnections();
            }
            
            // CDN metrics
            const cdnManager = this.components.get('cdnManager');
            if (cdnManager) {
                metrics.cdnHitRate = await this.getCDNHitRate();
                metrics.cdnCacheTime = await this.getCDNCacheTime();
            }
            
            // Image optimization metrics
            const imageOptimizer = this.components.get('imageOptimizer');
            if (imageOptimizer) {
                metrics.imagesOptimized = await this.getImagesOptimized();
                metrics.averageOptimizationTime = await this.getAverageOptimizationTime();
            }

        } catch (error) {
            logger.error('Error collecting application metrics:', error);
            metrics.error = error.message;
        }

        return metrics;
    }

    /**
     * Store collected metrics with retention policy
     */
    storeMetrics(data) {
        const { cache, system, network, application } = data;
        const timestamp = Date.now();

        // Add to cache metrics
        this.metrics.cache.push({
            ...cache,
            timestamp
        });

        // Add to system metrics
        this.metrics.system.push({
            ...system,
            timestamp
        });

        // Add to network metrics
        this.metrics.network.push({
            ...network,
            timestamp
        });

        // Add to application metrics
        this.metrics.application.push({
            ...application,
            timestamp
        });

        // Trim data to maxDataPoints
        this.trimMetrics();
    }

    /**
     * Trim old metrics to prevent memory issues
     */
    trimMetrics() {
        Object.keys(this.metrics).forEach(key => {
            if (this.metrics[key].length > this.config.maxDataPoints) {
                this.metrics[key] = this.metrics[key].slice(-this.config.maxDataPoints);
            }
        });
    }

    /**
     * Clean up old data based on retention period
     */
    cleanupOldData() {
        const cutoff = Date.now() - this.config.retentionPeriod;
        
        Object.keys(this.metrics).forEach(key => {
            const before = this.metrics[key].length;
            this.metrics[key] = this.metrics[key].filter(m => m.timestamp > cutoff);
            const after = this.metrics[key].length;
            
            if (after < before) {
                logger.debug(`Cleaned up ${before - after} old ${key} metrics`);
            }
        });
    }

    /**
     * Analyze performance trends and patterns
     */
    async analyzePerformance() {
        try {
            const analysis = {
                timestamp: Date.now(),
                cache: await this.analyzeCachePerformance(),
                system: await this.analyzeSystemPerformance(),
                network: await this.analyzeNetworkPerformance(),
                application: await this.analyzeApplicationPerformance()
            };

            // Detect trends
            analysis.trends = this.detectTrends();
            
            // Generate insights
            analysis.insights = this.generateInsights(analysis);
            
            // Emit analysis event
            this.emit('performanceAnalyzed', analysis);

        } catch (error) {
            logger.error('Error analyzing performance:', error);
        }
    }

    /**
     * Check for performance alerts
     */
    async checkAlerts() {
        if (!this.config.enableAlerts) {
            return;
        }

        const current = this.currentMetrics;
        const alerts = [];

        try {
            // Check cache performance alerts
            if (current.cache) {
                if (current.cache.hitRate < this.config.alertThresholds.hitRate) {
                    alerts.push({
                        type: 'cache',
                        severity: 'warning',
                        message: `Cache hit rate low: ${(current.cache.hitRate * 100).toFixed(1)}%`,
                        threshold: this.config.alertThresholds.hitRate,
                        value: current.cache.hitRate
                    });
                }

                if (current.cache.memoryUsage > this.config.alertThresholds.memoryUsage) {
                    alerts.push({
                        type: 'memory',
                        severity: 'critical',
                        message: `High memory usage: ${(current.cache.memoryUsage * 100).toFixed(1)}%`,
                        threshold: this.config.alertThresholds.memoryUsage,
                        value: current.cache.memoryUsage
                    });
                }
            }

            // Check system performance alerts
            if (current.system) {
                if (current.system.memoryUsagePercent > 90) {
                    alerts.push({
                        type: 'system',
                        severity: 'critical',
                        message: `System memory usage critical: ${current.system.memoryUsagePercent.toFixed(1)}%`,
                        value: current.system.memoryUsagePercent
                    });
                }
            }

            // Check application performance alerts
            if (current.application) {
                if (current.application.averageResponseTime > this.config.alertThresholds.responseTime) {
                    alerts.push({
                        type: 'performance',
                        severity: 'warning',
                        message: `High response time: ${current.application.averageResponseTime.toFixed(0)}ms`,
                        threshold: this.config.alertThresholds.responseTime,
                        value: current.application.averageResponseTime
                    });
                }

                if (current.application.errorRate > this.config.alertThresholds.errorRate) {
                    alerts.push({
                        type: 'errors',
                        severity: 'critical',
                        message: `High error rate: ${(current.application.errorRate * 100).toFixed(2)}%`,
                        threshold: this.config.alertThresholds.errorRate,
                        value: current.application.errorRate
                    });
                }
            }

            // Store and emit alerts
            this.alerts.push(...alerts);
            
            if (alerts.length > 0) {
                this.emit('alertsTriggered', alerts);
                logger.warn(`Performance alerts triggered: ${alerts.map(a => a.message).join(', ')}`);
            }

        } catch (error) {
            logger.error('Error checking alerts:', error);
        }
    }

    /**
     * Get current metrics snapshot
     */
    getCurrentMetrics() {
        return {
            ...this.currentMetrics,
            timestamp: Date.now()
        };
    }

    /**
     * Get metrics history
     */
    getMetricsHistory(type = 'all', limit = 100) {
        if (type === 'all') {
            return {
                cache: this.metrics.cache.slice(-limit),
                system: this.metrics.system.slice(-limit),
                network: this.metrics.network.slice(-limit),
                application: this.metrics.application.slice(-limit)
            };
        }
        
        return this.metrics[type] ? this.metrics[type].slice(-limit) : [];
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats(period = '1h') {
        const now = Date.now();
        const periods = {
            '1h': 3600000,
            '6h': 21600000,
            '24h': 86400000,
            '7d': 604800000
        };
        
        const cutoff = now - periods[period] || periods['1h'];
        
        const recentMetrics = {
            cache: this.metrics.cache.filter(m => m.timestamp > cutoff),
            system: this.metrics.system.filter(m => m.timestamp > cutoff),
            network: this.metrics.network.filter(m => m.timestamp > cutoff),
            application: this.metrics.application.filter(m => m.timestamp > cutoff)
        };

        return {
            period,
            dataPoints: {
                cache: recentMetrics.cache.length,
                system: recentMetrics.system.length,
                network: recentMetrics.network.length,
                application: recentMetrics.application.length
            },
            averages: this.calculateAverages(recentMetrics),
            trends: this.calculateTrends(recentMetrics),
            summary: this.generateSummary(recentMetrics)
        };
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.alerts.filter(alert => !alert.resolved);
    }

    /**
     * Get alert history
     */
    getAlertHistory(limit = 50) {
        return this.alerts.slice(-limit);
    }

    // Helper methods for metrics collection
    async getRedisMetrics(redisClient) {
        try {
            const info = await redisClient.info();
            const lines = info.split('\n');
            
            const memoryLine = lines.find(line => line.startsWith('used_memory_human:'));
            const clientsLine = lines.find(line => line.startsWith('connected_clients:'));
            const keysLine = lines.find(line => line.startsWith('db0:'));
            
            return {
                usedMemoryPercent: this.parseMemoryPercentage(info),
                connectedClients: clientsLine ? parseInt(clientsLine.split(':')[1]) : 0,
                totalKeys: keysLine ? this.extractKeyCount(keysLine) : 0,
                evictedKeys: this.extractEvictedCount(info)
            };
        } catch (error) {
            logger.error('Error getting Redis metrics:', error);
            return {};
        }
    }

    parseMemoryPercentage(redisInfo) {
        const usedMemoryLine = redisInfo.split('\n').find(line => line.startsWith('used_memory_human:'));
        const maxMemoryLine = redisInfo.split('\n').find(line => line.startsWith('maxmemory_human:'));
        
        if (usedMemoryLine && maxMemoryLine) {
            const used = this.parseMemorySize(usedMemoryLine.split(':')[1]);
            const max = this.parseMemorySize(maxMemoryLine.split(':')[1]);
            return max > 0 ? (used / max) * 100 : 0;
        }
        
        return 0;
    }

    parseMemorySize(sizeStr) {
        const unit = sizeStr.trim().slice(-1).toUpperCase();
        const value = parseFloat(sizeStr.trim().slice(0, -1));
        
        const multipliers = {
            'B': 1,
            'K': 1024,
            'M': 1024 * 1024,
            'G': 1024 * 1024 * 1024
        };
        
        return value * (multipliers[unit] || 1);
    }

    extractKeyCount(dbLine) {
        const match = dbLine.match(/keys=(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    extractEvictedCount(redisInfo) {
        const evictedLine = redisInfo.split('\n').find(line => line.startsWith('evicted_keys:'));
        return evictedLine ? parseInt(evictedLine.split(':')[1]) : 0;
    }

    calculateHitRate(hits, misses) {
        const total = hits + misses;
        return total > 0 ? hits / total : 0;
    }

    calculateCacheEfficiency(metrics) {
        // Simple efficiency calculation
        const hitRateWeight = 0.4;
        const responseTimeWeight = 0.3;
        const memoryWeight = 0.3;
        
        const hitRateScore = metrics.hitRate || 0;
        const responseTimeScore = Math.max(0, 1 - (metrics.averageResponseTime || 0) / 1000);
        const memoryScore = Math.max(0, 1 - (metrics.memoryUsage || 0));
        
        return (hitRateWeight * hitRateScore) + 
               (responseTimeWeight * responseTimeScore) + 
               (memoryWeight * memoryScore);
    }

    calculateCacheScore(metrics) {
        return Math.round(this.calculateCacheEfficiency(metrics) * 100);
    }

    async measureEventLoopLag() {
        return new Promise((resolve) => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const end = process.hrtime.bigint();
                const lag = Number(end - start) / 1000000; // Convert to milliseconds
                resolve(lag);
            });
        });
    }

    // Mock implementations for missing metrics
    async getQueryCacheHits() { return 0; }
    async getQueryCacheMisses() { return 0; }
    async getAverageQueryTime() { return 0; }
    async getResponseCacheHits() { return 0; }
    async getResponseCacheMisses() { return 0; }
    async getAverageResponseTime() { return 0; }
    async getActiveConnections() { return 0; }
    async getConnectionRate() { return 0; }
    async getNetworkBytes(direction) { return 0; }
    async getRequestsPerSecond() { return 0; }
    async getErrorRate() { return 0; }
    async getApplicationResponseTime() { return 0; }
    async getP95ResponseTime() { return 0; }
    async getP99ResponseTime() { return 0; }
    async getDatabaseQueryTime() { return 0; }
    async getDatabaseConnections() { return 0; }
    async getCDNHitRate() { return 0; }
    async getCDNCacheTime() { return 0; }
    async getImagesOptimized() { return 0; }
    async getAverageOptimizationTime() { return 0; }

    // Analysis methods
    async analyzeCachePerformance() { return {}; }
    async analyzeSystemPerformance() { return {}; }
    async analyzeNetworkPerformance() { return {}; }
    async analyzeApplicationPerformance() { return {}; }
    detectTrends() { return {}; }
    generateInsights(analysis) { return []; }
    calculateAverages(metrics) { return {}; }
    calculateTrends(metrics) { return {}; }
    generateSummary(metrics) { return {}; }
    initializeRealTimeMonitoring() { }
}

export { PerformanceMonitor };