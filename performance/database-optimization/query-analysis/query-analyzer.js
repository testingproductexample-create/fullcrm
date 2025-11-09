/**
 * Query Performance Analyzer
 * Analyzes query performance, identifies bottlenecks, and provides optimization insights
 */

const { Pool } = require('pg');
const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class QueryAnalyzer extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            maxQueries: 1000,
            analysisWindow: 3600000, // 1 hour in ms
            slowQueryThreshold: 1000, // 1 second
            analyzeExplain: true,
            capturePlans: true,
            ...config
        };
        this.queryHistory = [];
        this.performanceStats = new Map();
        this.bottlenecks = new Map();
        this.optimizationHints = new Map();
        this.initialized = false;
    }

    async initialize() {
        console.log('🔧 Initializing Query Analyzer...');
        
        try {
            await this.startQueryCapture();
            this.initialized = true;
            this.emit('initialized');
            console.log('✅ Query Analyzer initialized');
        } catch (error) {
            console.error('❌ Query Analyzer initialization failed:', error);
            throw error;
        }
    }

    /**
     * Start capturing query performance data
     */
    async startQueryCapture() {
        console.log('📊 Starting query performance capture...');
        
        // This would integrate with database query logging
        // For now, we'll simulate the capture process
        this.captureInterval = setInterval(() => {
            this.captureRecentQueries();
        }, 30000); // Capture every 30 seconds
    }

    /**
     * Capture recent queries from database
     */
    async captureRecentQueries() {
        try {
            const query = `
                SELECT 
                    query,
                    calls,
                    total_time,
                    mean_time,
                    stddev_time,
                    min_time,
                    max_time,
                    rows,
                    shared_blks_hit,
                    shared_blks_read,
                    local_blks_hit,
                    local_blks_read,
                    temp_blks_read,
                    temp_blks_written
                FROM pg_stat_statements 
                ORDER BY total_time DESC
                LIMIT $1
            `;
            
            // const result = await this.executeQuery(query, [this.config.maxQueries]);
            const mockData = this.generateMockQueryStats();
            
            for (const stat of mockData) {
                this.recordQueryStat(stat);
            }
            
            this.cleanupOldData();
        } catch (error) {
            console.error('Failed to capture recent queries:', error);
        }
    }

    /**
     * Generate mock query statistics for demonstration
     */
    generateMockQueryStats() {
        return [
            {
                query: 'SELECT * FROM users WHERE email = $1',
                calls: 50000,
                total_time: 250000,
                mean_time: 5,
                stddev_time: 2,
                min_time: 1,
                max_time: 50,
                rows: 1,
                shared_blks_hit: 50000,
                shared_blks_read: 0
            },
            {
                query: 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
                calls: 25000,
                total_time: 750000,
                mean_time: 30,
                stddev_time: 15,
                min_time: 10,
                max_time: 200,
                rows: 250,
                shared_blks_hit: 25000,
                shared_blks_read: 5000
            },
            {
                query: 'SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL \'1 day\'',
                calls: 100,
                total_time: 50000,
                mean_time: 500,
                stddev_time: 200,
                min_time: 200,
                max_time: 1000,
                rows: 1,
                shared_blks_hit: 100,
                shared_blks_read: 10000
            },
            {
                query: 'SELECT u.*, o.* FROM users u JOIN orders o ON u.id = o.user_id WHERE u.created_at > $1',
                calls: 500,
                total_time: 150000,
                mean_time: 300,
                stddev_time: 100,
                min_time: 100,
                max_time: 800,
                rows: 5000,
                shared_blks_hit: 500,
                shared_blks_read: 20000
            }
        ];
    }

    /**
     * Record query statistics
     */
    recordQueryStat(stat) {
        const queryKey = this.normalizeQuery(stat.query);
        
        if (!this.performanceStats.has(queryKey)) {
            this.performanceStats.set(queryKey, {
                query: stat.query,
                normalizedQuery: queryKey,
                totalCalls: 0,
                totalTime: 0,
                meanTime: 0,
                minTime: Infinity,
                maxTime: 0,
                totalRows: 0,
                totalBlocksRead: 0,
                planStats: null,
                firstSeen: new Date(),
                lastSeen: new Date()
            });
        }
        
        const existing = this.performanceStats.get(queryKey);
        existing.totalCalls += stat.calls;
        existing.totalTime += stat.total_time;
        existing.meanTime = existing.totalTime / existing.totalCalls;
        existing.minTime = Math.min(existing.minTime, stat.min_time);
        existing.maxTime = Math.max(existing.maxTime, stat.max_time);
        existing.totalRows += stat.rows * stat.calls;
        existing.totalBlocksRead += stat.shared_blks_read;
        existing.lastSeen = new Date();
    }

    /**
     * Normalize query by removing literal values
     */
    normalizeQuery(query) {
        return query
            .replace(/'[^']*'/g, "'$var'")  // String literals
            .replace(/\b\d+\b/g, "$num")    // Numbers
            .replace(/\bNULL\b/g, "$null")  // NULL values
            .replace(/\s+/g, ' ')           // Normalize whitespace
            .trim();
    }

    /**
     * Analyze recent queries
     */
    async analyzeRecentQueries() {
        console.log('🔍 Analyzing recent queries...');
        
        const analysis = {
            timestamp: new Date(),
            totalQueries: this.performanceStats.size,
            slowQueries: [],
            highFrequencyQueries: [],
            inefficientQueries: [],
            bottlenecks: [],
            recommendations: []
        };
        
        try {
            // 1. Identify slow queries
            analysis.slowQueries = this.identifySlowQueries();
            
            // 2. Identify high-frequency queries
            analysis.highFrequencyQueries = this.identifyHighFrequencyQueries();
            
            // 3. Identify inefficient queries
            analysis.inefficientQueries = this.identifyInefficientQueries();
            
            // 4. Analyze bottlenecks
            analysis.bottlenecks = this.analyzeBottlenecks();
            
            // 5. Generate recommendations
            analysis.recommendations = this.generateQueryRecommendations(analysis);
            
            // 6. Get execution plans for problematic queries
            if (this.config.capturePlans) {
                await this.captureExecutionPlans(analysis.inefficientQueries);
            }
            
            this.emit('analysisCompleted', analysis);
            console.log(`✅ Query analysis completed - ${analysis.totalQueries} queries analyzed`);
            
            return analysis;
        } catch (error) {
            console.error('❌ Query analysis failed:', error);
            throw error;
        }
    }

    /**
     * Identify slow queries
     */
    identifySlowQueries() {
        const slowQueries = [];
        
        for (let [queryKey, stats] of this.performanceStats) {
            if (stats.meanTime > this.config.slowQueryThreshold) {
                slowQueries.push({
                    query: stats.query,
                    normalizedQuery: queryKey,
                    meanTime: stats.meanTime,
                    maxTime: stats.maxTime,
                    totalCalls: stats.totalCalls,
                    totalTime: stats.totalTime,
                    impactScore: this.calculateImpactScore(stats),
                    reason: this.getSlowQueryReason(stats)
                });
            }
        }
        
        return slowQueries.sort((a, b) => b.impactScore - a.impactScore);
    }

    /**
     * Identify high-frequency queries
     */
    identifyHighFrequencyQueries() {
        const highFrequency = [];
        const frequencyThreshold = 1000; // Minimum calls per hour
        
        const now = Date.now();
        const oneHourAgo = now - this.config.analysisWindow;
        
        for (let [queryKey, stats] of this.performanceStats) {
            if (stats.totalCalls > frequencyThreshold) {
                const timeSpan = now - new Date(stats.firstSeen).getTime();
                const callsPerHour = (stats.totalCalls / (timeSpan / 3600000)) || 0;
                
                if (callsPerHour > frequencyThreshold) {
                    highFrequency.push({
                        query: stats.query,
                        normalizedQuery: queryKey,
                        totalCalls: stats.totalCalls,
                        callsPerHour: callsPerHour,
                        totalTime: stats.totalTime,
                        avgTime: stats.meanTime,
                        efficiency: this.calculateQueryEfficiency(stats)
                    });
                }
            }
        }
        
        return highFrequency.sort((a, b) => b.callsPerHour - a.callsPerHour);
    }

    /**
     * Identify inefficient queries
     */
    identifyInefficientQueries() {
        const inefficient = [];
        
        for (let [queryKey, stats] of this.performanceStats) {
            const efficiency = this.calculateQueryEfficiency(stats);
            
            if (efficiency < 0.5) { // Less than 50% efficient
                inefficient.push({
                    query: stats.query,
                    normalizedQuery: queryKey,
                    efficiency: efficiency,
                    meanTime: stats.meanTime,
                    totalCalls: stats.totalCalls,
                    totalRows: stats.totalRows,
                    blocksRead: stats.totalBlocksRead,
                    issues: this.identifyQueryIssues(stats)
                });
            }
        }
        
        return inefficient.sort((a, b) => a.efficiency - b.efficiency);
    }

    /**
     * Calculate query impact score
     */
    calculateImpactScore(stats) {
        // Impact = (frequency × average time) + (max time × 0.1)
        return (stats.totalCalls * stats.meanTime) + (stats.maxTime * 0.1);
    }

    /**
     * Calculate query efficiency
     */
    calculateQueryEfficiency(stats) {
        // Efficiency = rows processed per millisecond
        const rowsPerMs = stats.totalRows / stats.totalTime;
        return Math.min(1.0, rowsPerMs / 10); // Normalize to 0-1 scale
    }

    /**
     * Get reason for slow query
     */
    getSlowQueryReason(stats) {
        const reasons = [];
        
        if (stats.meanTime > 5000) {
            reasons.push('Very slow execution (>5s average)');
        } else if (stats.meanTime > 1000) {
            reasons.push('Slow execution (>1s average)');
        }
        
        if (stats.maxTime > stats.meanTime * 5) {
            reasons.push('High variability in execution time');
        }
        
        if (stats.totalBlocksRead > 10000) {
            reasons.push('High disk I/O');
        }
        
        if (stats.totalRows / stats.totalCalls < 10) {
            reasons.push('Low selectivity (many rows filtered)');
        }
        
        return reasons.length > 0 ? reasons : ['General performance issues'];
    }

    /**
     * Identify specific query issues
     */
    identifyQueryIssues(stats) {
        const issues = [];
        
        if (stats.meanTime > 1000) {
            issues.push({ type: 'slow', severity: 'high', message: 'Average execution time > 1s' });
        }
        
        if (stats.totalBlocksRead > 5000) {
            issues.push({ type: 'io', severity: 'medium', message: 'High disk I/O operations' });
        }
        
        if ((stats.totalRows / stats.totalCalls) > 1000) {
            issues.push({ type: 'selectivity', severity: 'low', message: 'Low query selectivity' });
        }
        
        if (stats.stddev_time && stats.stddev_time > stats.meanTime) {
            issues.push({ type: 'variance', severity: 'medium', message: 'High execution time variance' });
        }
        
        return issues;
    }

    /**
     * Analyze performance bottlenecks
     */
    analyzeBottlenecks() {
        const bottlenecks = [];
        
        // I/O bottlenecks
        const totalBlocksRead = Array.from(this.performanceStats.values())
            .reduce((sum, stats) => sum + stats.totalBlocksRead, 0);
        
        if (totalBlocksRead > 100000) {
            bottlenecks.push({
                type: 'io',
                severity: 'high',
                description: 'High overall disk I/O activity',
                impact: 'Database performance degraded due to disk operations',
                recommendations: ['Add indexes', 'Increase buffer cache', 'Consider SSD storage']
            });
        }
        
        // CPU bottlenecks
        const totalTime = Array.from(this.performanceStats.values())
            .reduce((sum, stats) => sum + stats.totalTime, 0);
        
        if (totalTime > 10000000) { // 10 seconds total
            bottlenecks.push({
                type: 'cpu',
                severity: 'medium',
                description: 'High CPU usage from query execution',
                impact: 'Queries consuming significant CPU time',
                recommendations: ['Optimize query logic', 'Add proper indexes', 'Review query plans']
            });
        }
        
        // Memory bottlenecks
        const queriesWithHighMemory = Array.from(this.performanceStats.values())
            .filter(stats => stats.meanTime > 2000);
        
        if (queriesWithHighMemory.length > 10) {
            bottlenecks.push({
                type: 'memory',
                severity: 'medium',
                description: 'Queries requiring significant memory',
                impact: 'Memory pressure may affect overall system performance',
                recommendations: ['Optimize large result sets', 'Add memory limits', 'Review query plans']
            });
        }
        
        return bottlenecks;
    }

    /**
     * Generate query optimization recommendations
     */
    generateQueryRecommendations(analysis) {
        const recommendations = [];
        
        // Slow query recommendations
        for (const slowQuery of analysis.slowQueries.slice(0, 5)) {
            recommendations.push({
                type: 'query_optimization',
                priority: 'high',
                query: slowQuery.query,
                reason: `Slow execution (avg: ${slowQuery.meanTime.toFixed(2)}ms)`,
                suggestions: this.getQueryOptimizationSuggestions(slowQuery),
                estimatedImprovement: this.estimateOptimizationImprovement(slowQuery)
            });
        }
        
        // High frequency query recommendations
        for (const freqQuery of analysis.highFrequencyQueries.slice(0, 3)) {
            recommendations.push({
                type: 'caching',
                priority: 'medium',
                query: freqQuery.query,
                reason: `High frequency (${freqQuery.callsPerHour.toFixed(0)} calls/hour)`,
                suggestions: ['Consider result caching', 'Optimize query execution'],
                estimatedImprovement: this.estimateCachingImprovement(freqQuery)
            });
        }
        
        // Index recommendations
        const indexSuggestions = this.generateIndexRecommendations(analysis);
        recommendations.push(...indexSuggestions);
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Get query optimization suggestions
     */
    getQueryOptimizationSuggestions(query) {
        const suggestions = [];
        const queryText = query.query.toLowerCase();
        
        if (queryText.includes('select *')) {
            suggestions.push('Replace SELECT * with specific column names');
        }
        
        if (queryText.includes('order by') && queryText.includes('limit')) {
            suggestions.push('Ensure ORDER BY columns are indexed');
        }
        
        if (queryText.includes('like \'%\'')) {
            suggestions.push('Consider full-text search for wildcard searches');
        }
        
        if (queryText.includes('join')) {
            suggestions.push('Verify join columns are indexed');
            suggestions.push('Consider join order and cardinality');
        }
        
        if (query.meanTime > 2000) {
            suggestions.push('Consider query plan optimization');
        }
        
        return suggestions;
    }

    /**
     * Generate index recommendations
     */
    generateIndexRecommendations(analysis) {
        const recommendations = [];
        const indexedQueries = new Set();
        
        // Analyze WHERE clauses for missing indexes
        for (const slowQuery of analysis.slowQueries) {
            const whereColumns = this.extractWhereColumns(slowQuery.query);
            
            for (const column of whereColumns) {
                const key = `${column.table}.${column.column}`;
                if (!indexedQueries.has(key) && whereColumns.length > 0) {
                    recommendations.push({
                        type: 'index_creation',
                        priority: 'medium',
                        query: slowQuery.query,
                        reason: `Missing index on ${key} (WHERE clause)`,
                        suggestions: [`CREATE INDEX idx_${column.table}_${column.column} ON ${column.table} (${column.column})`],
                        estimatedImprovement: 70 // 70% improvement estimated
                    });
                    indexedQueries.add(key);
                }
            }
        }
        
        return recommendations.slice(0, 10); // Limit to top 10
    }

    /**
     * Extract WHERE clause columns
     */
    extractWhereColumns(query) {
        const columns = [];
        const whereMatch = query.match(/where\s+(.+?)(?:\s+order by|\s+group by|\s+limit|\s*;|$)/i);
        
        if (whereMatch) {
            const whereClause = whereMatch[1];
            const columnMatches = whereClause.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*[=<>]/g);
            
            if (columnMatches) {
                for (const match of columnMatches) {
                    const columnName = match.split(/\s*[=<>]/)[0];
                    columns.push({
                        table: 'unknown', // Would need query parsing to determine table
                        column: columnName
                    });
                }
            }
        }
        
        return columns;
    }

    /**
     * Capture execution plans for inefficient queries
     */
    async captureExecutionPlans(inefficientQueries) {
        console.log('📊 Capturing execution plans...');
        
        for (const query of inefficientQueries.slice(0, 5)) { // Limit to top 5
            try {
                const explainQuery = `EXPLAIN (FORMAT JSON) ${query.query}`;
                // const result = await this.executeQuery(explainQuery);
                
                // Simulate plan capture
                query.executionPlan = {
                    totalCost: Math.random() * 1000 + 100,
                    planType: 'Seq Scan', // or 'Index Scan'
                    rowsAffected: query.totalRows / query.totalCalls,
                    operations: ['Seq Scan on ' + this.extractTableName(query.query)]
                };
                
                this.performanceStats.get(query.normalizedQuery).planStats = query.executionPlan;
            } catch (error) {
                console.error('Failed to capture execution plan:', error);
            }
        }
    }

    /**
     * Extract table name from query
     */
    extractTableName(query) {
        const fromMatch = query.match(/from\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
        return fromMatch ? fromMatch[1] : 'unknown';
    }

    /**
     * Estimate optimization improvement
     */
    estimateOptimizationImprovement(query) {
        let improvement = 0;
        
        if (query.issues) {
            for (const issue of query.issues) {
                switch (issue.type) {
                    case 'slow':
                        improvement += 50;
                        break;
                    case 'io':
                        improvement += 30;
                        break;
                    case 'selectivity':
                        improvement += 20;
                        break;
                }
            }
        }
        
        return Math.min(95, improvement);
    }

    /**
     * Estimate caching improvement
     */
    estimateCachingImprovement(query) {
        // Caching can provide 80-90% improvement for read-heavy queries
        return 85;
    }

    /**
     * Clean up old data
     */
    cleanupOldData() {
        const cutoff = Date.now() - this.config.analysisWindow;
        
        for (let [queryKey, stats] of this.performanceStats) {
            if (new Date(stats.firstSeen).getTime() < cutoff) {
                this.performanceStats.delete(queryKey);
            }
        }
    }

    /**
     * Get query performance summary
     */
    getPerformanceSummary() {
        const stats = Array.from(this.performanceStats.values());
        
        return {
            totalQueries: stats.length,
            totalCalls: stats.reduce((sum, s) => sum + s.totalCalls, 0),
            avgExecutionTime: stats.length > 0 ? 
                stats.reduce((sum, s) => sum + s.meanTime, 0) / stats.length : 0,
            slowQueryCount: stats.filter(s => s.meanTime > this.config.slowQueryThreshold).length,
            mostFrequentQuery: stats.sort((a, b) => b.totalCalls - a.totalCalls)[0],
            slowestQuery: stats.sort((a, b) => b.meanTime - a.meanTime)[0]
        };
    }

    async executeQuery(query, params = []) {
        // This would execute the query on the actual database
        console.log('Executing query:', query.substring(0, 100) + '...');
        return { rows: [], rowCount: 0 };
    }

    async cleanup() {
        console.log('🧹 Cleaning up Query Analyzer...');
        
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
        }
        
        this.performanceStats.clear();
        this.queryHistory = [];
        this.bottlenecks.clear();
        this.optimizationHints.clear();
        this.initialized = false;
        console.log('✅ Query Analyzer cleanup complete');
    }
}

module.exports = QueryAnalyzer;