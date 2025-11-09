/**
 * Connection Pool Manager
 * Manages database connection pools for optimal performance and resource usage
 */

const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const EventEmitter = require('events');

class ConnectionPoolManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            defaultPoolSize: 20,
            minPoolSize: 5,
            maxPoolSize: 50,
            idleTimeout: 30000,
            connectionTimeout: 10000,
            reapInterval: 1000,
            allowUpgrade: true,
            monitorInterval: 30000, // 30 seconds
            ...config
        };
        this.pools = new Map();
        this.poolStats = new Map();
        this.connectionMetrics = new Map();
        this.optimizationRules = [];
        this.initialized = false;
    }

    async initialize() {
        console.log('🔧 Initializing Connection Pool Manager...');
        
        try {
            await this.createDefaultPool();
            await this.startMonitoring();
            this.initialized = true;
            this.emit('initialized');
            console.log('✅ Connection Pool Manager initialized');
        } catch (error) {
            console.error('❌ Connection Pool Manager initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create default connection pool
     */
    async createDefaultPool() {
        const defaultConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'postgres',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            max: this.config.defaultPoolSize,
            min: this.config.minPoolSize,
            idleTimeoutMillis: this.config.idleTimeout,
            connectionTimeoutMillis: this.config.connectionTimeout
        };

        await this.createPool('default', defaultConfig);
    }

    /**
     * Create a new connection pool
     */
    async createPool(name, config) {
        console.log(`📊 Creating connection pool: ${name}`);
        
        try {
            const poolConfig = {
                ...this.config,
                ...config,
                name: name
            };

            let pool;
            
            if (config.dialect === 'mysql' || config.host?.includes('mysql')) {
                pool = await mysql.createPool({
                    host: config.host,
                    port: config.port,
                    database: config.database,
                    user: config.user,
                    password: config.password,
                    waitForConnections: true,
                    connectionLimit: config.max || this.config.defaultPoolSize,
                    queueLimit: 0,
                    acquireTimeout: this.config.connectionTimeout,
                    timeout: this.config.idleTimeout
                });
            } else {
                pool = new Pool(poolConfig);
            }

            // Test the pool
            await this.testPool(pool, name);
            
            this.pools.set(name, pool);
            this.poolStats.set(name, {
                created: new Date(),
                config: poolConfig,
                totalConnections: 0,
                activeConnections: 0,
                idleConnections: 0,
                waitingClients: 0,
                totalRequests: 0,
                averageWaitTime: 0,
                errors: 0
            });

            this.emit('poolCreated', { name, config: poolConfig });
            console.log(`✅ Created connection pool: ${name}`);
            
            return pool;
        } catch (error) {
            console.error(`❌ Failed to create pool ${name}:`, error);
            throw error;
        }
    }

    /**
     * Test pool connectivity
     */
    async testPool(pool, name) {
        try {
            const client = await pool.connect();
            
            if (client.query) {
                // PostgreSQL
                await client.query('SELECT 1');
            } else {
                // MySQL
                await client.execute('SELECT 1');
            }
            
            client.release();
            console.log(`🧪 Pool ${name} connectivity test passed`);
        } catch (error) {
            console.error(`❌ Pool ${name} connectivity test failed:`, error);
            throw error;
        }
    }

    /**
     * Get a connection from pool
     */
    async getConnection(poolName = 'default', options = {}) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            throw new Error(`Pool ${poolName} not found`);
        }

        const startTime = Date.now();
        
        try {
            const client = await pool.connect();
            const waitTime = Date.now() - startTime;
            
            // Update statistics
            this.updateConnectionStats(poolName, waitTime, true);
            
            // Add cleanup handler
            const releaseWrapper = () => {
                try {
                    client.release();
                    this.updateConnectionStats(poolName, 0, false);
                } catch (error) {
                    console.error('Error releasing connection:', error);
                }
            };
            
            // Wrap the release method
            client.release = releaseWrapper;
            
            this.emit('connectionAcquired', { poolName, waitTime });
            return client;
        } catch (error) {
            this.updateConnectionStats(poolName, Date.now() - startTime, false, error);
            this.emit('connectionFailed', { poolName, error });
            throw error;
        }
    }

    /**
     * Execute query using pool
     */
    async query(sql, params = [], poolName = 'default', options = {}) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            throw new Error(`Pool ${poolName} not found`);
        }

        const startTime = Date.now();
        
        try {
            let result;
            
            if (pool.query) {
                // PostgreSQL pool
                result = await pool.query(sql, params);
            } else {
                // MySQL pool
                result = await pool.execute(sql, params);
            }
            
            const executionTime = Date.now() - startTime;
            this.updateQueryStats(poolName, executionTime, true);
            
            this.emit('queryExecuted', { poolName, sql, executionTime, rowCount: result.rowCount || 0 });
            return result;
        } catch (error) {
            this.updateQueryStats(poolName, Date.now() - startTime, false, error);
            this.emit('queryFailed', { poolName, sql, error });
            throw error;
        }
    }

    /**
     * Update connection statistics
     */
    updateConnectionStats(poolName, waitTime, success, error = null) {
        const stats = this.poolStats.get(poolName);
        if (!stats) return;

        stats.totalRequests++;
        
        if (success) {
            // Update wait time average
            stats.averageWaitTime = ((stats.averageWaitTime * (stats.totalRequests - 1)) + waitTime) / stats.totalRequests;
        } else {
            stats.errors++;
        }

        // Update current connection counts
        if (this.pools.has(poolName)) {
            const pool = this.pools.get(poolName);
            
            if (pool.totalCount !== undefined) {
                // PostgreSQL pool stats
                stats.totalConnections = pool.totalCount;
                stats.idleConnections = pool.idleCount;
                stats.waitingClients = pool.waitingCount;
                stats.activeConnections = pool.totalCount - pool.idleCount;
            } else if (pool.pool) {
                // MySQL pool stats
                const mysqlStats = pool.pool._allConnections;
                stats.totalConnections = mysqlStats.length;
                stats.idleConnections = mysqlStats.filter(conn => !conn._inUse).length;
                stats.activeConnections = mysqlStats.filter(conn => conn._inUse).length;
                stats.waitingClients = 0; // MySQL doesn't track this directly
            }
        }
    }

    /**
     * Update query execution statistics
     */
    updateQueryStats(poolName, executionTime, success, error = null) {
        if (!this.connectionMetrics.has(poolName)) {
            this.connectionMetrics.set(poolName, {
                totalQueries: 0,
                successfulQueries: 0,
                failedQueries: 0,
                totalExecutionTime: 0,
                averageExecutionTime: 0,
                maxExecutionTime: 0,
                minExecutionTime: Infinity
            });
        }

        const metrics = this.connectionMetrics.get(poolName);
        metrics.totalQueries++;
        
        if (success) {
            metrics.successfulQueries++;
            metrics.totalExecutionTime += executionTime;
            metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.successfulQueries;
            metrics.maxExecutionTime = Math.max(metrics.maxExecutionTime, executionTime);
            metrics.minExecutionTime = Math.min(metrics.minExecutionTime, executionTime);
        } else {
            metrics.failedQueries++;
        }
    }

    /**
     * Optimize pool based on current usage
     */
    async optimize() {
        console.log('⚡ Optimizing connection pools...');
        
        const optimizations = [];
        
        try {
            for (let [poolName, stats] of this.poolStats) {
                const optimization = await this.optimizePool(poolName, stats);
                if (optimization) {
                    optimizations.push(optimization);
                }
            }
            
            console.log(`✅ Pool optimization completed - ${optimizations.length} optimizations applied`);
            return optimizations;
        } catch (error) {
            console.error('❌ Pool optimization failed:', error);
            throw error;
        }
    }

    /**
     * Optimize individual pool
     */
    async optimizePool(poolName, stats) {
        const pool = this.pools.get(poolName);
        if (!pool) return null;

        const currentSize = stats.totalConnections;
        const activeRatio = stats.activeConnections / Math.max(currentSize, 1);
        const utilization = stats.totalRequests / (this.config.monitorInterval / 1000); // requests per second
        
        let optimization = null;
        let newSize = currentSize;

        // Scale up if utilization is high
        if (utilization > 0.8 && activeRatio > 0.7 && currentSize < this.config.maxPoolSize) {
            newSize = Math.min(currentSize + 5, this.config.maxPoolSize);
            optimization = {
                type: 'scale_up',
                poolName,
                oldSize: currentSize,
                newSize,
                reason: `High utilization (${(utilization * 100).toFixed(1)}%) and active ratio (${(activeRatio * 100).toFixed(1)}%)`
            };
        }
        // Scale down if utilization is low
        else if (utilization < 0.3 && activeRatio < 0.3 && currentSize > this.config.minPoolSize) {
            newSize = Math.max(currentSize - 3, this.config.minPoolSize);
            optimization = {
                type: 'scale_down',
                poolName,
                oldSize: currentSize,
                newSize,
                reason: `Low utilization (${(utilization * 100).toFixed(1)}%) and active ratio (${(activeRatio * 100).toFixed(1)}%)`
            };
        }

        if (optimization && this.config.allowUpgrade) {
            try {
                await this.resizePool(poolName, newSize);
                optimization.applied = true;
                this.emit('poolOptimized', optimization);
            } catch (error) {
                optimization.error = error.message;
                optimization.applied = false;
            }
        }

        return optimization;
    }

    /**
     * Resize connection pool
     */
    async resizePool(poolName, newSize) {
        console.log(`🔄 Resizing pool ${poolName} to ${newSize} connections`);
        
        const pool = this.pools.get(poolName);
        if (!pool) {
            throw new Error(`Pool ${poolName} not found`);
        }

        try {
            if (pool.options && pool.options.max !== undefined) {
                // PostgreSQL pool
                pool.options.max = newSize;
            } else if (pool.pool && pool.pool._allConnections) {
                // MySQL pool - cannot resize directly, would need to recreate
                console.warn('MySQL pool resizing not supported, would need pool recreation');
                return;
            }
            
            console.log(`✅ Resized pool ${poolName} to ${newSize} connections`);
        } catch (error) {
            console.error(`❌ Failed to resize pool ${poolName}:`, error);
            throw error;
        }
    }

    /**
     * Monitor pool health
     */
    async monitorPools() {
        const healthStatus = {};
        
        for (let [poolName, stats] of this.poolStats) {
            healthStatus[poolName] = await this.checkPoolHealth(poolName, stats);
        }
        
        return healthStatus;
    }

    /**
     * Check individual pool health
     */
    async checkPoolHealth(poolName, stats) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            return { healthy: false, reason: 'Pool not found' };
        }

        const health = {
            healthy: true,
            issues: [],
            metrics: {
                totalConnections: stats.totalConnections,
                activeConnections: stats.activeConnections,
                idleConnections: stats.idleConnections,
                utilization: stats.totalConnections > 0 ? (stats.activeConnections / stats.totalConnections) : 0,
                errorRate: stats.totalRequests > 0 ? (stats.errors / stats.totalRequests) : 0,
                averageWaitTime: stats.averageWaitTime
            }
        };

        // Check for issues
        if (health.metrics.utilization > 0.9) {
            health.issues.push('High connection utilization (>90%)');
            health.healthy = false;
        }

        if (health.metrics.errorRate > 0.05) {
            health.issues.push('High error rate (>5%)');
            health.healthy = false;
        }

        if (stats.averageWaitTime > this.config.connectionTimeout * 0.8) {
            health.issues.push('Long wait times for connections');
            health.healthy = false;
        }

        // Test connectivity
        try {
            const client = await this.getConnection(poolName, { timeout: 5000 });
            client.release();
        } catch (error) {
            health.issues.push('Connectivity test failed: ' + error.message);
            health.healthy = false;
        }

        return health;
    }

    /**
     * Add custom optimization rule
     */
    addOptimizationRule(rule) {
        this.optimizationRules.push({
            ...rule,
            id: Date.now() + Math.random(),
            created: new Date()
        });
    }

    /**
     * Get pool statistics
     */
    getPoolStats() {
        const stats = {};
        
        for (let [poolName, poolStats] of this.poolStats) {
            const metrics = this.connectionMetrics.get(poolName) || {};
            
            stats[poolName] = {
                ...poolStats,
                queryMetrics: metrics,
                health: null // Would be populated by monitorPools()
            };
        }
        
        return stats;
    }

    /**
     * Get connection pool usage summary
     */
    getUsageSummary() {
        const pools = this.getPoolStats();
        let totalConnections = 0;
        let totalActive = 0;
        let totalIdle = 0;
        let totalRequests = 0;
        let totalErrors = 0;

        for (let [poolName, stats] of Object.entries(pools)) {
            totalConnections += stats.totalConnections;
            totalActive += stats.activeConnections;
            totalIdle += stats.idleConnections;
            totalRequests += stats.totalRequests;
            totalErrors += stats.errors;
        }

        return {
            totalPools: this.pools.size,
            totalConnections,
            totalActive,
            totalIdle,
            totalRequests,
            totalErrors,
            averageUtilization: totalConnections > 0 ? (totalActive / totalConnections) : 0,
            errorRate: totalRequests > 0 ? (totalErrors / totalRequests) : 0
        };
    }

    /**
     * Start monitoring
     */
    startMonitoring() {
        console.log('📊 Starting pool monitoring...');
        
        this.monitorInterval = setInterval(async () => {
            try {
                const healthStatus = await this.monitorPools();
                
                for (let [poolName, health] of Object.entries(healthStatus)) {
                    if (!health.healthy) {
                        this.emit('poolUnhealthy', { poolName, health });
                        console.warn(`⚠️ Pool ${poolName} unhealthy:`, health.issues);
                    }
                }
                
                // Auto-optimize if enabled
                if (this.config.allowUpgrade) {
                    await this.optimize();
                }
            } catch (error) {
                console.error('Pool monitoring error:', error);
            }
        }, this.config.monitorInterval);
    }

    /**
     * Clean up connections
     */
    async cleanup() {
        console.log('🧹 Cleaning up connection pools...');
        
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        
        for (let [poolName, pool] of this.pools) {
            try {
                if (pool.end) {
                    await pool.end();
                } else if (pool.close) {
                    await pool.close();
                }
                console.log(`🗑️ Closed pool: ${poolName}`);
            } catch (error) {
                console.error(`Error closing pool ${poolName}:`, error);
            }
        }
        
        this.pools.clear();
        this.poolStats.clear();
        this.connectionMetrics.clear();
        this.initialized = false;
        console.log('✅ Connection Pool Manager cleanup complete');
    }
}

module.exports = ConnectionPoolManager;