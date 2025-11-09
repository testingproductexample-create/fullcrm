const EventEmitter = require('events');
const DatabaseConnection = require('../utilities/database-connection');
const Logger = require('../utilities/logger');

class DatabaseCollector extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            collectionInterval: config.collectionInterval || 30000, // 30 seconds
            maxRetainedMetrics: config.maxRetainedMetrics || 1000,
            enableSlowQueryCapture: config.enableSlowQueryCapture !== false,
            slowQueryThreshold: config.slowQueryThreshold || 1000, // 1 second
            maxSlowQueries: config.maxSlowQueries || 100,
            ...config
        };
        
        this.db = new DatabaseConnection();
        this.logger = new Logger('database-collector');
        this.metrics = new Map();
        this.slowQueries = [];
        this.queryStats = new Map();
        this.connectionStats = new Map();
        this.indexUsageStats = new Map();
        this.isCollecting = false;
        this.collectionTimer = null;
        
        this.initializeMetrics();
    }

    initializeMetrics() {
        // Initialize database metrics
        this.metrics.set('total_queries', 0);
        this.metrics.set('total_errors', 0);
        this.metrics.set('average_query_time', 0);
        this.metrics.set('active_connections', 0);
        this.metrics.set('idle_connections', 0);
        this.metrics.set('max_connections', 0);
        this.metrics.set('cache_hit_ratio', 0);
        this.metrics.set('buffer_usage', 0);
        this.metrics.set('index_usage_ratio', 0);
        this.metrics.set('deadlocks', 0);
        this.metrics.set('temp_files_created', 0);
    }

    // Track query execution
    trackQuery(queryData) {
        const {
            query,
            executionTime,
            rowsAffected,
            error,
            connectionId,
            queryType = 'SELECT',
            timestamp = Date.now(),
            userId,
            tableNames = [],
            blocking = false
        } = queryData;

        // Update global metrics
        this.metrics.set('total_queries', this.metrics.get('total_queries') + 1);
        
        if (error) {
            this.metrics.set('total_errors', this.metrics.get('total_errors') + 1);
        }
        
        // Update average query time
        const currentAvg = this.metrics.get('average_query_time') || 0;
        const totalQueries = this.metrics.get('total_queries');
        this.metrics.set('average_query_time', 
            (currentAvg * (totalQueries - 1) + executionTime) / totalQueries);

        // Track query statistics
        const queryHash = this.hashQuery(query);
        if (!this.queryStats.has(queryHash)) {
            this.queryStats.set(queryHash, {
                query: query.substring(0, 200), // Truncate for storage
                count: 0,
                totalTime: 0,
                averageTime: 0,
                minTime: Infinity,
                maxTime: 0,
                rowsAffected: 0,
                errors: 0,
                lastExecuted: null,
                queryType,
                tableNames: [...new Set(tableNames)]
            });
        }

        const queryStat = this.queryStats.get(queryHash);
        queryStat.count++;
        queryStat.totalTime += executionTime;
        queryStat.averageTime = queryStat.totalTime / queryStat.count;
        queryStat.minTime = Math.min(queryStat.minTime, executionTime);
        queryStat.maxTime = Math.max(queryStat.maxTime, executionTime);
        queryStat.lastExecuted = timestamp;
        
        if (rowsAffected !== undefined) {
            queryStat.rowsAffected += rowsAffected;
        }
        
        if (error) {
            queryStat.errors++;
        }

        // Capture slow queries
        if (this.config.enableSlowQueryCapture && executionTime > this.config.slowQueryThreshold) {
            this.captureSlowQuery({
                query,
                executionTime,
                timestamp,
                connectionId,
                queryType,
                tableNames: [...new Set(tableNames)]
            });
        }

        // Track connection stats
        if (connectionId) {
            if (!this.connectionStats.has(connectionId)) {
                this.connectionStats.set(connectionId, {
                    totalQueries: 0,
                    totalTime: 0,
                    lastActivity: timestamp,
                    isActive: false
                });
            }
            
            const connStat = this.connectionStats.get(connectionId);
            connStat.totalQueries++;
            connStat.totalTime += executionTime;
            connStat.lastActivity = timestamp;
            connStat.isActive = executionTime > 0;
        }
    }

    // Hash query for statistics tracking
    hashQuery(query) {
        // Simple hash function - in production, use a more sophisticated one
        let hash = 0;
        const str = query.replace(/\s+/g, ' ').trim().toLowerCase();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Capture slow query
    captureSlowQuery(slowQueryData) {
        this.slowQueries.unshift(slowQueryData);
        
        // Keep only the most recent slow queries
        if (this.slowQueries.length > this.config.maxSlowQueries) {
            this.slowQueries = this.slowQueries.slice(0, this.config.maxSlowQueries);
        }
    }

    // Start collecting metrics
    async start() {
        if (this.isCollecting) {
            this.logger.warn('Database collector is already running');
            return;
        }

        try {
            await this.db.connect();
            this.isCollecting = true;
            
            this.logger.info('Starting database metrics collection');
            
            // Start periodic collection
            this.collectionTimer = setInterval(() => {
                this.collectMetrics().catch(error => {
                    this.logger.error('Error collecting database metrics:', error);
                });
            }, this.config.collectionInterval);
            
            // Initial collection
            await this.collectMetrics();
            
        } catch (error) {
            this.logger.error('Failed to start database collector:', error);
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
        
        this.logger.info('Database metrics collection stopped');
    }

    // Collect and store metrics
    async collectMetrics() {
        const timestamp = new Date();
        const metrics = this.getCurrentMetrics();
        
        try {
            // Store database metrics
            for (const [metricName, metricValue] of metrics.global) {
                await this.db.query(`
                    INSERT INTO system_metrics (
                        metric_name, metric_value, metric_type, dimensions, timestamp
                    ) VALUES ($1, $2, 'gauge', $3, $4)
                `, [metricName, metricValue, JSON.stringify({ service: 'database' }), timestamp]);
            }

            // Store query statistics
            for (const [queryHash, queryStat] of this.queryStats) {
                await this.db.query(`
                    INSERT INTO database_metrics (
                        query_hash, query_text, query_type, execution_count,
                        total_time, average_time, min_time, max_time,
                        rows_affected, error_count, table_names, timestamp
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    queryHash,
                    queryStat.query,
                    queryStat.queryType,
                    queryStat.count,
                    queryStat.totalTime,
                    queryStat.averageTime,
                    queryStat.minTime === Infinity ? null : queryStat.minTime,
                    queryStat.maxTime,
                    queryStat.rowsAffected,
                    queryStat.errors,
                    JSON.stringify(queryStat.tableNames),
                    timestamp
                ]);
            }

            // Store slow queries
            for (const slowQuery of this.slowQueries.slice(0, 10)) { // Store up to 10 per collection
                await this.db.query(`
                    INSERT INTO error_logs (
                        log_level, message, stack_trace, service, 
                        additional_data, timestamp
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    'INFO',
                    `Slow query detected (${slowQuery.executionTime}ms)`,
                    slowQuery.query,
                    'database',
                    JSON.stringify({
                        query_type: slowQuery.queryType,
                        execution_time: slowQuery.executionTime,
                        table_names: slowQuery.tableNames,
                        connection_id: slowQuery.connectionId
                    }),
                    new Date(slowQuery.timestamp)
                ]);
            }
            
        } catch (error) {
            this.logger.error('Failed to store database metrics:', error);
        }
    }

    // Get current metrics
    getCurrentMetrics() {
        const global = {
            total_queries: this.metrics.get('total_queries'),
            total_errors: this.metrics.get('total_errors'),
            average_query_time: this.metrics.get('average_query_time'),
            active_connections: this.metrics.get('active_connections'),
            idle_connections: this.metrics.get('idle_connections'),
            max_connections: this.metrics.get('max_connections'),
            cache_hit_ratio: this.metrics.get('cache_hit_ratio'),
            buffer_usage: this.metrics.get('buffer_usage'),
            index_usage_ratio: this.metrics.get('index_usage_ratio'),
            deadlocks: this.metrics.get('deadlocks'),
            temp_files_created: this.metrics.get('temp_files_created')
        };

        const queryStats = Array.from(this.queryStats.entries())
            .map(([hash, stat]) => ({ hash, ...stat }));

        const connectionStats = Array.from(this.connectionStats.entries())
            .map(([id, stat]) => ({ connectionId: id, ...stat }));

        return {
            global,
            queryStats,
            connectionStats,
            slowQueriesCount: this.slowQueries.length,
            timestamp: new Date()
        };
    }

    // Get top queries by execution time
    getTopQueries(limit = 10) {
        return Array.from(this.queryStats.entries())
            .map(([hash, stat]) => ({ hash, ...stat }))
            .sort((a, b) => b.averageTime - a.averageTime)
            .slice(0, limit);
    }

    // Get most frequent queries
    getMostFrequentQueries(limit = 10) {
        return Array.from(this.queryStats.entries())
            .map(([hash, stat]) => ({ hash, ...stat }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    // Get slow queries
    getSlowQueries(limit = 10) {
        return this.slowQueries
            .sort((a, b) => b.executionTime - a.executionTime)
            .slice(0, limit);
    }

    // Get connection statistics
    getConnectionStats() {
        const totalConnections = this.connectionStats.size;
        const activeConnections = Array.from(this.connectionStats.values())
            .filter(conn => conn.isActive).length;
        
        return {
            total: totalConnections,
            active: activeConnections,
            idle: totalConnections - activeConnections,
            details: Array.from(this.connectionStats.entries())
                .map(([id, stat]) => ({ connectionId: id, ...stat }))
        };
    }

    // Analyze query performance
    analyzeQueryPerformance() {
        const queries = Array.from(this.queryStats.values());
        
        if (queries.length === 0) {
            return { total: 0, analysis: 'No query data available' };
        }

        const totalQueries = queries.reduce((sum, q) => sum + q.count, 0);
        const totalTime = queries.reduce((sum, q) => sum + q.totalTime, 0);
        const avgTime = totalTime / totalQueries;
        
        const slowQueries = queries.filter(q => q.averageTime > avgTime * 2);
        const frequentSlowQueries = queries.filter(q => 
            q.count > 10 && q.averageTime > this.config.slowQueryThreshold);

        const analysis = {
            totalQueries,
            totalTime,
            averageTime: avgTime,
            slowQueryCount: slowQueries.length,
            frequentSlowQueryCount: frequentSlowQueries.length,
            slowQueries: slowQueries.slice(0, 5).map(q => ({
                query: q.query,
                averageTime: q.averageTime,
                count: q.count,
                errorRate: q.errors / q.count * 100
            })),
            recommendations: this.generateRecommendations(queries, avgTime)
        };

        return analysis;
    }

    // Generate performance recommendations
    generateRecommendations(queries, avgTime) {
        const recommendations = [];

        // Query optimization recommendations
        queries
            .filter(q => q.averageTime > avgTime * 3)
            .forEach(q => {
                if (q.queryType === 'SELECT' && q.tableNames.length > 0) {
                    recommendations.push({
                        type: 'index_recommendation',
                        query: q.query,
                        tables: q.tableNames,
                        reason: 'High execution time for SELECT query',
                        action: 'Consider adding indexes on frequently queried columns'
                    });
                }
            });

        // Full table scan detection
        queries
            .filter(q => q.query.includes('*') || 
                (!q.query.toLowerCase().includes('where') && q.queryType === 'SELECT'))
            .forEach(q => {
                recommendations.push({
                    type: 'query_optimization',
                    query: q.query,
                    reason: 'Potential full table scan detected',
                    action: 'Add WHERE clause or LIMIT to reduce scanned rows'
                });
            });

        return recommendations;
    }

    // Reset metrics
    reset() {
        this.initializeMetrics();
        this.slowQueries = [];
        this.queryStats.clear();
        this.connectionStats.clear();
        this.indexUsageStats.clear();
        this.logger.info('Database metrics reset');
    }

    // Get metrics for specific time period
    async getMetricsForPeriod(startTime, endTime) {
        try {
            const result = await this.db.query(`
                SELECT 
                    metric_name,
                    AVG(metric_value) as avg_value,
                    MAX(metric_value) as max_value,
                    DATE_TRUNC('hour', timestamp) as hour
                FROM system_metrics 
                WHERE service = 'database' 
                AND timestamp >= $1 AND timestamp <= $2
                GROUP BY metric_name, DATE_TRUNC('hour', timestamp)
                ORDER BY hour DESC
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
            const stats = this.getConnectionStats();
            return {
                status: 'healthy',
                isCollecting: this.isCollecting,
                totalQueries: this.metrics.get('total_queries'),
                connectionStats: stats,
                slowQueryCount: this.slowQueries.length,
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

module.exports = DatabaseCollector;