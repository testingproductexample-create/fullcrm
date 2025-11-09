/**
 * Database Performance Monitor
 * Real-time monitoring of database performance metrics and alerts
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class DatabaseMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            pollInterval: 5000, // 5 seconds
            retentionPeriod: 86400000, // 24 hours
            alertThresholds: {
                cpu: 80,
                memory: 85,
                disk: 90,
                connections: 80,
                slowQueries: 10,
                deadlocks: 5
            },
            enableAlerts: true,
            ...config
        };
        this.metrics = {
            performance: new Map(),
            resource: new Map(),
            queries: new Map(),
            connections: new Map(),
            system: new Map()
        };
        this.alerts = [];
        this.alertHistory = [];
        this.isMonitoring = false;
        this.initialized = false;
    }

    async initialize() {
        console.log('🔧 Initializing Database Monitor...');
        
        try {
            await this.setupMetricsCollection();
            this.initialized = true;
            this.emit('initialized');
            console.log('✅ Database Monitor initialized');
        } catch (error) {
            console.error('❌ Database Monitor initialization failed:', error);
            throw error;
        }
    }

    /**
     * Start monitoring
     */
    start() {
        if (this.isMonitoring) {
            console.log('⚠️ Monitor is already running');
            return;
        }

        console.log('📊 Starting database performance monitoring...');
        this.isMonitoring = true;

        this.monitorInterval = setInterval(async () => {
            try {
                await this.collectMetrics();
                await this.checkAlerts();
                this.cleanupOldData();
            } catch (error) {
                console.error('Monitor collection error:', error);
                this.emit('monitorError', { error });
            }
        }, this.config.pollInterval);

        this.emit('monitoringStarted');
        console.log('✅ Database monitoring started');
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (!this.isMonitoring) {
            return;
        }

        console.log('🛑 Stopping database performance monitoring...');
        this.isMonitoring = false;

        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }

        this.emit('monitoringStopped');
        console.log('✅ Database monitoring stopped');
    }

    /**
     * Setup metrics collection
     */
    async setupMetricsCollection() {
        // Initialize metric storage
        this.initializeMetricStore('performance');
        this.initializeMetricStore('resource');
        this.initializeMetricStore('queries');
        this.initializeMetricStore('connections');
        this.initializeMetricStore('system');
    }

    /**
     * Initialize metric store
     */
    initializeMetricStore(type) {
        if (!this.metrics[type]) {
            this.metrics[type] = new Map();
        }
    }

    /**
     * Collect all metrics
     */
    async collectMetrics() {
        const timestamp = Date.now();
        
        try {
            // Collect performance metrics
            await this.collectPerformanceMetrics(timestamp);
            
            // Collect resource metrics
            await this.collectResourceMetrics(timestamp);
            
            // Collect query metrics
            await this.collectQueryMetrics(timestamp);
            
            // Collect connection metrics
            await this.collectConnectionMetrics(timestamp);
            
            // Collect system metrics
            await this.collectSystemMetrics(timestamp);
            
            this.emit('metricsCollected', { timestamp });
        } catch (error) {
            console.error('Metrics collection failed:', error);
            throw error;
        }
    }

    /**
     * Collect performance metrics
     */
    async collectPerformanceMetrics(timestamp) {
        const performanceData = {
            timestamp,
            queriesPerSecond: Math.random() * 100 + 50, // Mock data
            transactionsPerSecond: Math.random() * 50 + 20,
            cacheHitRatio: 0.95 + Math.random() * 0.04, // 95-99%
            lockWaits: Math.floor(Math.random() * 5),
            deadlocks: Math.floor(Math.random() * 2),
            slowQueries: Math.floor(Math.random() * 20),
            averageQueryTime: Math.random() * 100 + 50, // 50-150ms
            activeTransactions: Math.floor(Math.random() * 100)
        };

        this.storeMetric('performance', 'query_stats', performanceData);
    }

    /**
     * Collect resource metrics
     */
    async collectResourceMetrics(timestamp) {
        const resourceData = {
            timestamp,
            cpu: {
                usage: Math.random() * 100,
                load: Math.random() * 4 + 1
            },
            memory: {
                usage: Math.random() * 100,
                available: Math.random() * 8192 + 4096, // MB
                cached: Math.random() * 2048 + 1024
            },
            disk: {
                usage: Math.random() * 100,
                iops: Math.random() * 1000 + 500,
                readLatency: Math.random() * 10 + 5, // ms
                writeLatency: Math.random() * 15 + 10
            },
            network: {
                bytesIn: Math.random() * 1000000, // bytes/sec
                bytesOut: Math.random() * 500000,
                packetsIn: Math.random() * 1000,
                packetsOut: Math.random() * 800
            }
        };

        this.storeMetric('resource', 'system_resources', resourceData);
    }

    /**
     * Collect query metrics
     */
    async collectQueryMetrics(timestamp) {
        const queryData = {
            timestamp,
            totalQueries: Math.floor(Math.random() * 10000) + 5000,
            slowQueries: Math.floor(Math.random() * 50) + 10,
            errorQueries: Math.floor(Math.random() * 10) + 1,
            longestQuery: Math.random() * 5000 + 1000, // ms
            mostFrequentQuery: 'SELECT * FROM users WHERE email = ?',
            queriesByType: {
                SELECT: Math.floor(Math.random() * 5000) + 3000,
                INSERT: Math.floor(Math.random() * 1000) + 500,
                UPDATE: Math.floor(Math.random() * 800) + 300,
                DELETE: Math.floor(Math.random() * 200) + 50
            }
        };

        this.storeMetric('queries', 'query_stats', queryData);
    }

    /**
     * Collect connection metrics
     */
    async collectConnectionMetrics(timestamp) {
        const connectionData = {
            timestamp,
            activeConnections: Math.floor(Math.random() * 50) + 20,
            idleConnections: Math.floor(Math.random() * 30) + 10,
            maxConnections: 100,
            connectionPoolUtilization: Math.random() * 100,
            connectionErrors: Math.floor(Math.random() * 5),
            averageConnectionTime: Math.random() * 1000 + 200, // ms
            waitingConnections: Math.floor(Math.random() * 10)
        };

        this.storeMetric('connections', 'connection_stats', connectionData);
    }

    /**
     * Collect system metrics
     */
    async collectSystemMetrics(timestamp) {
        const systemData = {
            timestamp,
            uptime: Date.now() - (Math.random() * 86400000 * 7), // Up to 7 days
            databaseVersion: 'PostgreSQL 14.5',
            activeDatabases: ['main', 'analytics', 'cache'],
            replication: {
                status: Math.random() > 0.1 ? 'active' : 'lagging',
                lag: Math.random() * 1000 // seconds
            },
            maintenance: {
                lastVacuum: new Date(Date.now() - Math.random() * 86400000),
                lastAnalyze: new Date(Date.now() - Math.random() * 86400000),
                autoVacuum: Math.random() > 0.5
            }
        };

        this.storeMetric('system', 'system_stats', systemData);
    }

    /**
     * Store metric in time-series storage
     */
    storeMetric(type, name, data) {
        if (!this.metrics[type]) {
            this.metrics[type] = new Map();
        }
        
        if (!this.metrics[type].has(name)) {
            this.metrics[type].set(name, []);
        }
        
        const series = this.metrics[type].get(name);
        series.push(data);
        
        // Limit series length to prevent memory issues
        const maxLength = Math.floor(this.config.retentionPeriod / this.config.pollInterval);
        if (series.length > maxLength) {
            series.shift();
        }
    }

    /**
     * Check for alert conditions
     */
    async checkAlerts() {
        if (!this.config.enableAlerts) {
            return;
        }

        const timestamp = Date.now();
        
        try {
            // Check performance alerts
            await this.checkPerformanceAlerts(timestamp);
            
            // Check resource alerts
            await this.checkResourceAlerts(timestamp);
            
            // Check connection alerts
            await this.checkConnectionAlerts(timestamp);
            
            // Check query alerts
            await this.checkQueryAlerts(timestamp);
        } catch (error) {
            console.error('Alert checking failed:', error);
        }
    }

    /**
     * Check performance alerts
     */
    async checkPerformanceAlerts(timestamp) {
        const perfData = this.getLatestMetric('performance', 'query_stats');
        if (!perfData) return;

        // Check cache hit ratio
        if (perfData.cacheHitRatio < 0.9) {
            this.createAlert({
                type: 'performance',
                severity: perfData.cacheHitRatio < 0.8 ? 'critical' : 'warning',
                message: `Low cache hit ratio: ${(perfData.cacheHitRatio * 100).toFixed(1)}%`,
                threshold: 90,
                current: perfData.cacheHitRatio * 100,
                timestamp
            });
        }

        // Check deadlocks
        if (perfData.deadlocks > this.config.alertThresholds.deadlocks) {
            this.createAlert({
                type: 'performance',
                severity: 'warning',
                message: `High deadlock count: ${perfData.deadlocks}`,
                threshold: this.config.alertThresholds.deadlocks,
                current: perfData.deadlocks,
                timestamp
            });
        }

        // Check slow queries
        if (perfData.slowQueries > this.config.alertThresholds.slowQueries) {
            this.createAlert({
                type: 'performance',
                severity: 'warning',
                message: `Many slow queries: ${perfData.slowQueries}`,
                threshold: this.config.alertThresholds.slowQueries,
                current: perfData.slowQueries,
                timestamp
            });
        }
    }

    /**
     * Check resource alerts
     */
    async checkResourceAlerts(timestamp) {
        const resourceData = this.getLatestMetric('resource', 'system_resources');
        if (!resourceData) return;

        // Check CPU
        if (resourceData.cpu.usage > this.config.alertThresholds.cpu) {
            this.createAlert({
                type: 'resource',
                severity: resourceData.cpu.usage > 90 ? 'critical' : 'warning',
                message: `High CPU usage: ${resourceData.cpu.usage.toFixed(1)}%`,
                threshold: this.config.alertThresholds.cpu,
                current: resourceData.cpu.usage,
                timestamp
            });
        }

        // Check memory
        if (resourceData.memory.usage > this.config.alertThresholds.memory) {
            this.createAlert({
                type: 'resource',
                severity: resourceData.memory.usage > 95 ? 'critical' : 'warning',
                message: `High memory usage: ${resourceData.memory.usage.toFixed(1)}%`,
                threshold: this.config.alertThresholds.memory,
                current: resourceData.memory.usage,
                timestamp
            });
        }

        // Check disk
        if (resourceData.disk.usage > this.config.alertThresholds.disk) {
            this.createAlert({
                type: 'resource',
                severity: resourceData.disk.usage > 95 ? 'critical' : 'warning',
                message: `High disk usage: ${resourceData.disk.usage.toFixed(1)}%`,
                threshold: this.config.alertThresholds.disk,
                current: resourceData.disk.usage,
                timestamp
            });
        }
    }

    /**
     * Check connection alerts
     */
    async checkConnectionAlerts(timestamp) {
        const connData = this.getLatestMetric('connections', 'connection_stats');
        if (!connData) return;

        const utilization = (connData.activeConnections / connData.maxConnections) * 100;
        
        if (utilization > this.config.alertThresholds.connections) {
            this.createAlert({
                type: 'connections',
                severity: utilization > 95 ? 'critical' : 'warning',
                message: `High connection utilization: ${utilization.toFixed(1)}%`,
                threshold: this.config.alertThresholds.connections,
                current: utilization,
                timestamp
            });
        }

        if (connData.waitingConnections > 5) {
            this.createAlert({
                type: 'connections',
                severity: 'warning',
                message: `Connection queue backlog: ${connData.waitingConnections}`,
                threshold: 5,
                current: connData.waitingConnections,
                timestamp
            });
        }
    }

    /**
     * Check query alerts
     */
    async checkQueryAlerts(timestamp) {
        const queryData = this.getLatestMetric('queries', 'query_stats');
        if (!queryData) return;

        const errorRate = (queryData.errorQueries / Math.max(queryData.totalQueries, 1)) * 100;
        
        if (errorRate > 5) {
            this.createAlert({
                type: 'queries',
                severity: errorRate > 10 ? 'critical' : 'warning',
                message: `High query error rate: ${errorRate.toFixed(1)}%`,
                threshold: 5,
                current: errorRate,
                timestamp
            });
        }

        if (queryData.averageQueryTime > 1000) {
            this.createAlert({
                type: 'queries',
                severity: queryData.averageQueryTime > 2000 ? 'critical' : 'warning',
                message: `High average query time: ${queryData.averageQueryTime.toFixed(0)}ms`,
                threshold: 1000,
                current: queryData.averageQueryTime,
                timestamp
            });
        }
    }

    /**
     * Create alert
     */
    createAlert(alertData) {
        const alert = {
            id: this.generateAlertId(),
            ...alertData,
            resolved: false,
            acknowledged: false
        };

        this.alerts.push(alert);
        this.emit('alertCreated', alert);
        
        console.log(`🚨 Alert: ${alert.severity.toUpperCase()} - ${alert.message}`);
    }

    /**
     * Generate unique alert ID
     */
    generateAlertId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get latest metric for a specific type and name
     */
    getLatestMetric(type, name) {
        if (!this.metrics[type] || !this.metrics[type].has(name)) {
            return null;
        }
        
        const series = this.metrics[type].get(name);
        return series[series.length - 1] || null;
    }

    /**
     * Get metrics for a specific time range
     */
    getMetrics(type, name, startTime, endTime) {
        if (!this.metrics[type] || !this.metrics[type].has(name)) {
            return [];
        }
        
        const series = this.metrics[type].get(name);
        return series.filter(metric => 
            metric.timestamp >= startTime && metric.timestamp <= endTime
        );
    }

    /**
     * Get current metrics
     */
    async getCurrentMetrics() {
        const current = {};
        
        for (let [type, metrics] of Object.entries(this.metrics)) {
            current[type] = {};
            
            for (let [name, series] of metrics.entries()) {
                current[type][name] = series[series.length - 1] || null;
            }
        }
        
        return current;
    }

    /**
     * Get historical metrics
     */
    async getHistoricalMetrics(timeRange = 3600000) { // 1 hour default
        const endTime = Date.now();
        const startTime = endTime - timeRange;
        
        const historical = {};
        
        for (let [type, metrics] of Object.entries(this.metrics)) {
            historical[type] = {};
            
            for (let [name, series] of metrics.entries()) {
                historical[type][name] = this.getMetrics(type, name, startTime, endTime);
            }
        }
        
        return historical;
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.alerts.filter(alert => !alert.resolved);
    }

    /**
     * Get all alerts
     */
    getAllAlerts(limit = 100) {
        return this.alerts
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = Date.now();
            this.emit('alertAcknowledged', alert);
        }
    }

    /**
     * Resolve alert
     */
    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            this.emit('alertResolved', alert);
        }
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const perfData = this.getLatestMetric('performance', 'query_stats');
        const resourceData = this.getLatestMetric('resource', 'system_resources');
        const connData = this.getLatestMetric('connections', 'connection_stats');
        
        return {
            timestamp: Date.now(),
            performance: {
                queriesPerSecond: perfData?.queriesPerSecond || 0,
                cacheHitRatio: perfData?.cacheHitRatio || 0,
                activeTransactions: perfData?.activeTransactions || 0,
                slowQueries: perfData?.slowQueries || 0
            },
            resources: {
                cpu: resourceData?.cpu?.usage || 0,
                memory: resourceData?.memory?.usage || 0,
                disk: resourceData?.disk?.usage || 0
            },
            connections: {
                active: connData?.activeConnections || 0,
                max: connData?.maxConnections || 0,
                utilization: connData ? (connData.activeConnections / connData.maxConnections) * 100 : 0
            },
            activeAlerts: this.getActiveAlerts().length
        };
    }

    /**
     * Cleanup old data
     */
    cleanupOldData() {
        const cutoff = Date.now() - this.config.retentionPeriod;
        
        for (let metrics of Object.values(this.metrics)) {
            for (let [name, series] of metrics.entries()) {
                while (series.length > 0 && series[0].timestamp < cutoff) {
                    series.shift();
                }
            }
        }
        
        // Cleanup old alerts
        this.alerts = this.alerts.filter(alert => 
            alert.timestamp > cutoff || !alert.resolved
        );
    }

    async cleanup() {
        console.log('🧹 Cleaning up Database Monitor...');
        
        this.stop();
        
        this.metrics = {
            performance: new Map(),
            resource: new Map(),
            queries: new Map(),
            connections: new Map(),
            system: new Map()
        };
        
        this.alerts = [];
        this.initialized = false;
        console.log('✅ Database Monitor cleanup complete');
    }
}

module.exports = DatabaseMonitor;