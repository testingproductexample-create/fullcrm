/**
 * Database Administration Interface
 * Web-based administration panel for database optimization
 */

const express = require('express');
const path = require('path');
const EventEmitter = require('events');

class DatabaseAdminInterface extends EventEmitter {
    constructor(optimizer, config = {}) {
        super();
        this.optimizer = optimizer;
        this.config = {
            port: process.env.ADMIN_PORT || 3001,
            host: process.env.ADMIN_HOST || 'localhost',
            apiKey: process.env.ADMIN_API_KEY || 'admin-key',
            enableAuth: true,
            enableCORS: true,
            ...config
        };
        this.app = express();
        this.server = null;
        this.sessions = new Map();
        this.initialized = false;
    }

    async initialize() {
        console.log('🔧 Initializing Database Administration Interface...');
        
        try {
            this.setupMiddleware();
            this.setupRoutes();
            await this.startServer();
            this.initialized = true;
            this.emit('initialized');
            console.log('✅ Database Administration Interface initialized');
        } catch (error) {
            console.error('❌ Database Administration Interface initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        if (this.config.enableCORS) {
            const cors = require('cors');
            this.app.use(cors());
        }
        
        // Authentication middleware
        if (this.config.enableAuth) {
            this.app.use((req, res, next) => {
                this.authenticateRequest(req, res, next);
            });
        }
        
        // Static files
        this.app.use('/static', express.static(path.join(__dirname, '../dashboard/build/static')));
    }

    /**
     * Authenticate requests
     */
    authenticateRequest(req, res, next) {
        if (req.path === '/login' || req.path.startsWith('/public/')) {
            return next();
        }
        
        const apiKey = req.headers['x-api-key'] || req.query.apiKey;
        
        if (apiKey === this.config.apiKey) {
            req.user = { id: 'admin', role: 'administrator' };
            return next();
        }
        
        res.status(401).json({ error: 'Unauthorized' });
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        // Authentication
        this.app.post('/api/login', (req, res) => {
            const { username, password } = req.body;
            
            // Simple authentication - in real app, use proper auth
            if (username === 'admin' && password === 'admin') {
                const token = this.generateToken();
                this.sessions.set(token, { user: { username }, created: Date.now() });
                res.json({ token, user: { username } });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
        
        // Dashboard routes
        this.setupDashboardRoutes();
        
        // Optimization routes
        this.setupOptimizationRoutes();
        
        // Monitoring routes
        this.setupMonitoringRoutes();
        
        // Sharding routes
        this.setupShardingRoutes();
        
        // Indexing routes
        this.setupIndexingRoutes();
        
        // Query analysis routes
        this.setupQueryAnalysisRoutes();
        
        // Benchmarking routes
        this.setupBenchmarkingRoutes();
        
        // Health check routes
        this.setupHealthRoutes();
        
        // Serve dashboard
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../dashboard/build/index.html'));
        });
    }

    /**
     * Setup dashboard routes
     */
    setupDashboardRoutes() {
        // Get dashboard overview
        this.app.get('/api/dashboard/overview', async (req, res) => {
            try {
                const overview = await this.getDashboardOverview();
                res.json(overview);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get performance metrics
        this.app.get('/api/dashboard/metrics', async (req, res) => {
            try {
                const { timeRange = 3600000 } = req.query; // 1 hour default
                const metrics = await this.optimizer.getPerformanceMetrics();
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get active alerts
        this.app.get('/api/dashboard/alerts', async (req, res) => {
            try {
                const alerts = this.optimizer.monitoring.getActiveAlerts();
                res.json(alerts);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Setup optimization routes
     */
    setupOptimizationRoutes() {
        // Start optimization
        this.app.post('/api/optimization/start', async (req, res) => {
            try {
                const result = await this.optimizer.optimizeDatabase();
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get optimization history
        this.app.get('/api/optimization/history', async (req, res) => {
            try {
                const { limit = 10 } = req.query;
                const history = await this.optimizer.getOptimizationHistory(parseInt(limit));
                res.json(history);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get optimization recommendations
        this.app.get('/api/optimization/recommendations', async (req, res) => {
            try {
                const recommendations = this.optimizer.optimizer.getCurrentRecommendations();
                res.json(recommendations);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Apply recommendation
        this.app.post('/api/optimization/recommendations/apply', async (req, res) => {
            try {
                const { recommendationIds, dryRun = false } = req.body;
                const recommendations = this.optimizer.optimizer.getCurrentRecommendations()
                    .filter(r => recommendationIds.includes(r.id));
                
                const result = await this.optimizer.optimizer.applyRecommendations(recommendations, { dryRun });
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Setup monitoring routes
     */
    setupMonitoringRoutes() {
        // Get current metrics
        this.app.get('/api/monitoring/metrics', async (req, res) => {
            try {
                const metrics = await this.optimizer.monitoring.getCurrentMetrics();
                res.json(metrics);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get historical metrics
        this.app.get('/api/monitoring/history', async (req, res) => {
            try {
                const { timeRange = 3600000 } = req.query;
                const history = await this.optimizer.monitoring.getHistoricalMetrics(parseInt(timeRange));
                res.json(history);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get alert history
        this.app.get('/api/monitoring/alerts', async (req, res) => {
            try {
                const { limit = 100 } = req.query;
                const alerts = this.optimizer.monitoring.getAllAlerts(parseInt(limit));
                res.json(alerts);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Acknowledge alert
        this.app.post('/api/monitoring/alerts/:id/acknowledge', async (req, res) => {
            try {
                const { id } = req.params;
                this.optimizer.monitoring.acknowledgeAlert(id);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Resolve alert
        this.app.post('/api/monitoring/alerts/:id/resolve', async (req, res) => {
            try {
                const { id } = req.params;
                this.optimizer.monitoring.resolveAlert(id);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Setup sharding routes
     */
    setupShardingRoutes() {
        // Get shard statistics
        this.app.get('/api/sharding/stats', async (req, res) => {
            try {
                const stats = this.optimizer.sharding.getShardStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Add shard
        this.app.post('/api/sharding/add', async (req, res) => {
            try {
                const { shardId } = req.body;
                await this.optimizer.sharding.addShard(shardId);
                res.json({ success: true, shardId });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Remove shard
        this.app.post('/api/sharding/remove', async (req, res) => {
            try {
                const { shardId } = req.body;
                await this.optimizer.sharding.removeShard(shardId);
                res.json({ success: true, shardId });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Rebalance data
        this.app.post('/api/sharding/rebalance', async (req, res) => {
            try {
                const { tableName, shardKey } = req.body;
                await this.optimizer.sharding.rebalanceData(tableName, shardKey);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Setup indexing routes
     */
    setupIndexingRoutes() {
        // Get index statistics
        this.app.get('/api/indexing/stats', async (req, res) => {
            try {
                const stats = this.optimizer.indexing.getIndexStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Optimize indexes
        this.app.post('/api/indexing/optimize', async (req, res) => {
            try {
                const result = await this.optimizer.indexing.optimizeIndexes();
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Create index
        this.app.post('/api/indexing/create', async (req, res) => {
            try {
                const { tableName, columns, unique = false } = req.body;
                const indexName = `idx_${tableName}_${columns.join('_')}_${Date.now()}`;
                const createQuery = `CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${columns.join(', ')})`;
                
                // await this.optimizer.connectionPool.query(createQuery);
                res.json({ success: true, indexName, query: createQuery });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Drop index
        this.app.post('/api/indexing/drop', async (req, res) => {
            try {
                const { indexName } = req.body;
                const dropQuery = `DROP INDEX ${indexName}`;
                
                // await this.optimizer.connectionPool.query(dropQuery);
                res.json({ success: true, indexName });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Setup query analysis routes
     */
    setupQueryAnalysisRoutes() {
        // Analyze queries
        this.app.post('/api/query-analysis/analyze', async (req, res) => {
            try {
                const result = await this.optimizer.queryAnalyzer.analyzeRecentQueries();
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get slow queries
        this.app.get('/api/query-analysis/slow-queries', async (req, res) => {
            try {
                const { limit = 10 } = req.query;
                const slowQueries = this.optimizer.slowQueryDetector.getTopSlowQueries(parseInt(limit));
                res.json(slowQueries);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get query performance summary
        this.app.get('/api/query-analysis/summary', async (req, res) => {
            try {
                const summary = this.optimizer.queryAnalyzer.getPerformanceSummary();
                res.json(summary);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Setup benchmarking routes
     */
    setupBenchmarkingRoutes() {
        // Run benchmark
        this.app.post('/api/benchmarking/run', async (req, res) => {
            try {
                const { name, query, params, duration, concurrency } = req.body;
                const result = await this.optimizer.benchmarking.runCustomBenchmark({
                    name, query, params, duration, concurrency
                });
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Run comprehensive benchmark
        this.app.post('/api/benchmarking/comprehensive', async (req, res) => {
            try {
                const { duration, concurrencyLevels } = req.body;
                const result = await this.optimizer.benchmarking.runBenchmarks({
                    duration, concurrencyLevels
                });
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get benchmark results
        this.app.get('/api/benchmarking/results', async (req, res) => {
            try {
                const summary = this.optimizer.benchmarking.getBenchmarkSummary();
                res.json(summary);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Export benchmark results
        this.app.get('/api/benchmarking/export', async (req, res) => {
            try {
                const { format = 'json' } = req.query;
                const data = this.optimizer.benchmarking.exportResults(format);
                
                if (format === 'json') {
                    res.json(data);
                } else {
                    res.setHeader('Content-Disposition', 'attachment; filename=benchmark-results.csv');
                    res.setHeader('Content-Type', 'text/csv');
                    res.send(data);
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Setup health check routes
     */
    setupHealthRoutes() {
        // Get health status
        this.app.get('/api/health', async (req, res) => {
            try {
                const health = await this.optimizer.performHealthCheck();
                res.json(health);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get health trends
        this.app.get('/api/health/trends', async (req, res) => {
            try {
                const trends = this.optimizer.healthMonitor.getHealthTrends();
                res.json(trends);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Run health check
        this.app.post('/api/health/check', async (req, res) => {
            try {
                const health = await this.optimizer.performHealthCheck();
                res.json({ success: true, health });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Get dashboard overview data
     */
    async getDashboardOverview() {
        const [
            performanceMetrics,
            healthStatus,
            activeAlerts,
            optimizationHistory,
            currentRecommendations
        ] = await Promise.all([
            this.optimizer.getPerformanceMetrics(),
            this.optimizer.performHealthCheck(),
            this.optimizer.monitoring.getActiveAlerts(),
            this.optimizer.getOptimizationHistory(5),
            this.optimizer.optimizer.getCurrentRecommendations()
        ]);

        return {
            timestamp: new Date(),
            performance: {
                ...performanceMetrics.current,
                trend: this.calculatePerformanceTrend(performanceMetrics.historical)
            },
            health: {
                status: healthStatus.overall,
                lastCheck: healthStatus.lastCheck,
                criticalIssues: Object.values(healthStatus.checks).filter(c => c.status === 'critical').length
            },
            alerts: {
                total: activeAlerts.length,
                critical: activeAlerts.filter(a => a.severity === 'critical').length,
                recent: activeAlerts.slice(0, 5)
            },
            optimization: {
                lastRun: optimizationHistory.length > 0 ? optimizationHistory[0].timestamp : null,
                totalRuns: optimizationHistory.length,
                successRate: optimizationHistory.filter(h => h.success).length / Math.max(optimizationHistory.length, 1)
            },
            recommendations: {
                total: currentRecommendations.length,
                high: currentRecommendations.filter(r => r.priority === 'high').length,
                recent: currentRecommendations.slice(0, 5)
            }
        };
    }

    /**
     * Calculate performance trend
     */
    calculatePerformanceTrend(historicalMetrics) {
        if (!historicalMetrics || Object.keys(historicalMetrics).length === 0) {
            return 'unknown';
        }
        
        // Simple trend calculation based on recent data
        const recent = Object.values(historicalMetrics).slice(-10);
        if (recent.length < 2) return 'stable';
        
        const first = recent[0];
        const last = recent[recent.length - 1];
        
        if (last > first * 1.1) return 'improving';
        if (last < first * 0.9) return 'degrading';
        return 'stable';
    }

    /**
     * Generate authentication token
     */
    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    /**
     * Start HTTP server
     */
    async startServer() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.config.port, this.config.host, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`🌐 Database Administration Interface running at http://${this.config.host}:${this.config.port}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Stop HTTP server
     */
    async stopServer() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log('🛑 Administration Interface server stopped');
                    resolve();
                });
            });
        }
    }

    /**
     * Shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Database Administration Interface...');
        await this.stopServer();
        this.initialized = false;
        console.log('✅ Database Administration Interface shutdown complete');
    }
}

module.exports = DatabaseAdminInterface;