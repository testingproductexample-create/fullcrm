/**
 * Slow Query Detection System
 * Identifies, analyzes, and provides remediation for slow database queries
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');

class SlowQueryDetector extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            threshold: 1000, // milliseconds
            maxSlowQueries: 1000,
            analysisWindow: 3600000, // 1 hour
            autoRemediation: true,
            explainEnabled: true,
            recommendIndexes: true,
            ...config
        };
        this.slowQueries = new Map();
        this.queryStats = new Map();
        this.recommendations = new Map();
        this.initialized = false;
        this.isDetecting = false;
    }

    async initialize() {
        console.log('🔧 Initializing Slow Query Detector...');
        
        try {
            await this.startQueryMonitoring();
            this.initialized = true;
            this.emit('initialized');
            console.log('✅ Slow Query Detector initialized');
        } catch (error) {
            console.error('❌ Slow Query Detector initialization failed:', error);
            throw error;
        }
    }

    /**
     * Start query monitoring
     */
    async startQueryMonitoring() {
        console.log('🔍 Starting slow query monitoring...');
        
        this.monitorInterval = setInterval(async () => {
            try {
                await this.scanForSlowQueries();
            } catch (error) {
                console.error('Slow query monitoring error:', error);
            }
        }, 30000); // Check every 30 seconds
        
        this.isDetecting = true;
    }

    /**
     * Scan for slow queries
     */
    async scanForSlowQueries() {
        try {
            // Get query statistics from pg_stat_statements
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
                    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
                FROM pg_stat_statements 
                WHERE mean_time > $1
                ORDER BY total_time DESC
                LIMIT 100
            `;
            
            // const result = await this.executeQuery(query, [this.config.threshold]);
            const mockData = this.generateMockSlowQueries();
            
            for (const stat of mockData) {
                this.analyzeSlowQuery(stat);
            }
            
            this.cleanupOldQueries();
        } catch (error) {
            console.error('Failed to scan for slow queries:', error);
        }
    }

    /**
     * Generate mock slow queries for demonstration
     */
    generateMockSlowQueries() {
        return [
            {
                query: 'SELECT * FROM orders o JOIN users u ON o.user_id = u.id WHERE o.created_at > NOW() - INTERVAL \'1 day\'',
                calls: 150,
                total_time: 75000,
                mean_time: 500,
                stddev_time: 200,
                min_time: 100,
                max_time: 2000,
                rows: 1500,
                hit_percent: 85.5
            },
            {
                query: 'SELECT COUNT(*) FROM large_table WHERE created_at < $1 AND status = \'active\'',
                calls: 50,
                total_time: 25000,
                mean_time: 500,
                stddev_time: 100,
                min_time: 200,
                max_time: 800,
                rows: 1,
                hit_percent: 95.2
            },
            {
                query: 'UPDATE products SET views = views + 1 WHERE id = $1',
                calls: 2000,
                total_time: 120000,
                mean_time: 60,
                stddev_time: 30,
                min_time: 20,
                max_time: 300,
                rows: 1,
                hit_percent: 99.1
            },
            {
                query: 'SELECT DISTINCT email FROM users WHERE created_at > $1',
                calls: 30,
                total_time: 18000,
                mean_time: 600,
                stddev_time: 150,
                min_time: 300,
                max_time: 1200,
                rows: 1000,
                hit_percent: 78.3
            }
        ];
    }

    /**
     * Analyze a slow query
     */
    analyzeSlowQuery(queryStat) {
        const normalizedQuery = this.normalizeQuery(queryStat.query);
        
        if (!this.slowQueries.has(normalizedQuery)) {
            this.slowQueries.set(normalizedQuery, {
                query: queryStat.query,
                normalizedQuery: normalizedQuery,
                totalCalls: 0,
                totalTime: 0,
                meanTime: 0,
                maxTime: 0,
                minTime: Infinity,
                totalRows: 0,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                impact: 0,
                issues: [],
                recommendations: []
            });
        }
        
        const slowQuery = this.slowQueries.get(normalizedQuery);
        
        // Update statistics
        slowQuery.totalCalls += queryStat.calls;
        slowQuery.totalTime += queryStat.total_time;
        slowQuery.meanTime = slowQuery.totalTime / slowQuery.totalCalls;
        slowQuery.maxTime = Math.max(slowQuery.maxTime, queryStat.max_time);
        slowQuery.minTime = Math.min(slowQuery.minTime, queryStat.min_time);
        slowQuery.totalRows += queryStat.rows;
        slowQuery.lastSeen = Date.now();
        
        // Calculate impact score
        slowQuery.impact = this.calculateImpactScore(slowQuery);
        
        // Identify issues
        slowQuery.issues = this.identifyQueryIssues(slowQuery, queryStat);
        
        // Generate recommendations
        if (this.config.recommendIndexes || this.config.explainEnabled) {
            slowQuery.recommendations = this.generateRecommendations(slowQuery, queryStat);
        }
        
        this.emit('slowQueryDetected', { query: slowQuery, stat: queryStat });
    }

    /**
     * Normalize query for consistent tracking
     */
    normalizeQuery(query) {
        return query
            .replace(/'[^']*'/g, "'$var'")  // String literals
            .replace(/\b\d+\b/g, "$num")    // Numbers
            .replace(/\s+/g, ' ')           // Normalize whitespace
            .trim()
            .toLowerCase();
    }

    /**
     * Calculate impact score for slow query
     */
    calculateImpactScore(slowQuery) {
        // Impact = (frequency × average time) + (max time × weight) + (rows × weight)
        const frequencyImpact = (slowQuery.totalCalls / 100) * (slowQuery.meanTime / 10);
        const maxTimeImpact = (slowQuery.maxTime / 100) * 0.1;
        const rowImpact = (slowQuery.totalRows / 10000) * 0.05;
        
        return frequencyImpact + maxTimeImpact + rowImpact;
    }

    /**
     * Identify issues with the query
     */
    identifyQueryIssues(slowQuery, queryStat) {
        const issues = [];
        
        // High execution time
        if (slowQuery.meanTime > 5000) {
            issues.push({
                type: 'high_execution_time',
                severity: 'critical',
                message: `Very high average execution time: ${slowQuery.meanTime.toFixed(0)}ms`,
                impact: 'Significantly affects user experience'
            });
        } else if (slowQuery.meanTime > 1000) {
            issues.push({
                type: 'high_execution_time',
                severity: 'warning',
                message: `High average execution time: ${slowQuery.meanTime.toFixed(0)}ms`,
                impact: 'Noticeable performance impact'
            });
        }
        
        // High variability
        if (queryStat.stddev_time && queryStat.stddev_time > slowQuery.meanTime) {
            issues.push({
                type: 'high_variance',
                severity: 'warning',
                message: `High execution time variance: ${queryStat.stddev_time.toFixed(0)}ms stddev`,
                impact: 'Inconsistent performance'
            });
        }
        
        // Low cache hit ratio
        if (queryStat.hit_percent < 90) {
            issues.push({
                type: 'low_cache_hit',
                severity: 'warning',
                message: `Low cache hit ratio: ${queryStat.hit_percent.toFixed(1)}%`,
                impact: 'Excessive disk I/O'
            });
        }
        
        // Full table scan indicators
        if (this.queryHasFullTableScanIndicators(slowQuery.query)) {
            issues.push({
                type: 'potential_full_scan',
                severity: 'warning',
                message: 'Query may be performing full table scans',
                impact: 'Inefficient data access pattern'
            });
        }
        
        return issues;
    }

    /**
     * Check if query has full table scan indicators
     */
    queryHasFullTableScanIndicators(query) {
        const queryLower = query.toLowerCase();
        
        // Check for patterns that often lead to full scans
        return queryLower.includes('like \'%') || 
               queryLower.includes('!=') ||
               queryLower.includes('or ') ||
               (queryLower.includes('not ') && !queryLower.includes('not in'));
    }

    /**
     * Generate recommendations for query optimization
     */
    generateRecommendations(slowQuery, queryStat) {
        const recommendations = [];
        
        // Index recommendations
        const indexRecs = this.generateIndexRecommendations(slowQuery);
        recommendations.push(...indexRecs);
        
        // Query rewrite recommendations
        const rewriteRecs = this.generateRewriteRecommendations(slowQuery);
        recommendations.push(...rewriteRecs);
        
        // Plan optimization recommendations
        if (this.config.explainEnabled) {
            const planRecs = this.generatePlanRecommendations(slowQuery);
            recommendations.push(...planRecs);
        }
        
        // Caching recommendations
        if (slowQuery.totalCalls > 100) {
            recommendations.push({
                type: 'caching',
                priority: 'medium',
                title: 'Consider Query Result Caching',
                description: 'High-frequency query suitable for caching',
                estimatedImprovement: 80,
                implementation: 'Implement query result caching for frequently executed queries'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate index recommendations
     */
    generateIndexRecommendations(slowQuery) {
        const recommendations = [];
        const whereColumns = this.extractWhereColumns(slowQuery.query);
        const orderByColumns = this.extractOrderByColumns(slowQuery.query);
        const joinColumns = this.extractJoinColumns(slowQuery.query);
        
        // Index WHERE clause columns
        for (const column of whereColumns) {
            if (!this.columnHasIndex(column, slowQuery.query)) {
                recommendations.push({
                    type: 'index',
                    priority: 'high',
                    title: `Add Index on ${column.table}.${column.column}`,
                    description: `Column used in WHERE clause without index`,
                    estimatedImprovement: 70,
                    implementation: `CREATE INDEX idx_${column.table}_${column.column} ON ${column.table} (${column.column})`,
                    column: column.column,
                    table: column.table
                });
            }
        }
        
        // Index join columns
        for (const column of joinColumns) {
            if (!this.columnHasIndex(column, slowQuery.query)) {
                recommendations.push({
                    type: 'index',
                    priority: 'high',
                    title: `Add Index on ${column.table}.${column.column} for JOIN`,
                    description: `Join column without index`,
                    estimatedImprovement: 60,
                    implementation: `CREATE INDEX idx_${column.table}_${column.column}_join ON ${column.table} (${column.column})`,
                    column: column.column,
                    table: column.table
                });
            }
        }
        
        // Composite indexes for ORDER BY
        if (orderByColumns.length > 0) {
            recommendations.push({
                type: 'index',
                priority: 'medium',
                title: `Composite Index for ORDER BY`,
                description: `Index on ORDER BY columns to avoid sorting`,
                estimatedImprovement: 40,
                implementation: `CREATE INDEX idx_${this.extractTableName(slowQuery.query)}_order ON ${this.extractTableName(slowQuery.query)} (${orderByColumns.join(', ')})`,
                columns: orderByColumns
            });
        }
        
        return recommendations;
    }

    /**
     * Generate query rewrite recommendations
     */
    generateRewriteRecommendations(slowQuery) {
        const recommendations = [];
        const query = slowQuery.query.toLowerCase();
        
        // SELECT * recommendation
        if (query.includes('select *')) {
            recommendations.push({
                type: 'rewrite',
                priority: 'medium',
                title: 'Avoid SELECT *',
                description: 'Select only required columns to reduce data transfer',
                estimatedImprovement: 30,
                implementation: 'Replace SELECT * with specific column names'
            });
        }
        
        // LIKE pattern optimization
        if (query.includes('like \'%')) {
            recommendations.push({
                type: 'rewrite',
                priority: 'high',
                title: 'Optimize LIKE Patterns',
                description: 'Leading wildcard searches cannot use indexes efficiently',
                estimatedImprovement: 80,
                implementation: 'Consider full-text search or avoid leading wildcards'
            });
        }
        
        // Subquery optimization
        if (query.includes('select') && query.includes(')')) {
            recommendations.push({
                type: 'rewrite',
                priority: 'medium',
                title: 'Consider JOIN Instead of Subquery',
                description: 'Subqueries may be less efficient than JOINs',
                estimatedImprovement: 25,
                implementation: 'Rewrite subqueries as JOINs where possible'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate plan optimization recommendations
     */
    generatePlanRecommendations(slowQuery) {
        const recommendations = [];
        
        // This would typically involve running EXPLAIN ANALYZE
        // For now, we'll provide general recommendations
        
        recommendations.push({
            type: 'plan',
            priority: 'high',
            title: 'Analyze Query Execution Plan',
            description: 'Run EXPLAIN ANALYZE to understand query execution plan',
            estimatedImprovement: 50,
            implementation: 'Use EXPLAIN ANALYZE to identify plan issues',
            query: `EXPLAIN ANALYZE ${slowQuery.query}`
        });
        
        return recommendations;
    }

    /**
     * Extract WHERE clause columns
     */
    extractWhereColumns(query) {
        const columns = [];
        const whereMatch = query.match(/where\s+(.+?)(?:\s+order by|\s+group by|\s+limit|\s*;|$)/i);
        
        if (whereMatch) {
            const whereClause = whereMatch[1];
            const columnMatches = whereClause.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*[=<>!]/g);
            
            if (columnMatches) {
                for (const match of columnMatches) {
                    const columnName = match.split(/[=<>!]/)[0].trim();
                    const tableName = this.extractTableName(query);
                    columns.push({ table: tableName, column: columnName });
                }
            }
        }
        
        return columns;
    }

    /**
     * Extract ORDER BY columns
     */
    extractOrderByColumns(query) {
        const columns = [];
        const orderMatch = query.match(/order by\s+(.+?)(?:\s+limit|\s*;|$)/i);
        
        if (orderMatch) {
            const orderClause = orderMatch[1];
            columns.push(...orderClause.split(',').map(col => col.trim()));
        }
        
        return columns;
    }

    /**
     * Extract JOIN columns
     */
    extractJoinColumns(query) {
        const columns = [];
        const joinMatches = query.match(/join\s+[a-zA-Z_][a-zA-Z0-9_]*\s+on\s+([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/gi);
        
        if (joinMatches) {
            for (const match of joinMatches) {
                const parts = match.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/g);
                if (parts && parts.length >= 2) {
                    const [left, right] = parts;
                    const [leftTable, leftCol] = left.split('.');
                    const [rightTable, rightCol] = right.split('.');
                    columns.push({ table: leftTable, column: leftCol });
                    columns.push({ table: rightTable, column: rightCol });
                }
            }
        }
        
        return columns;
    }

    /**
     * Check if column already has index
     */
    columnHasIndex(column, query) {
        // This would check actual database indexes
        // For demonstration, return false
        return false;
    }

    /**
     * Extract table name from query
     */
    extractTableName(query) {
        const fromMatch = query.match(/from\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
        return fromMatch ? fromMatch[1] : 'unknown';
    }

    /**
     * Detect and remediate slow queries
     */
    async detectAndRemediate() {
        console.log('🔍 Detecting and remediating slow queries...');
        
        const remediation = {
            detected: 0,
            analyzed: 0,
            recommendations: [],
            applied: 0,
            improvements: []
        };
        
        try {
            // Get all slow queries
            const slowQueryArray = Array.from(this.slowQueries.values())
                .filter(query => query.meanTime > this.config.threshold)
                .sort((a, b) => b.impact - a.impact);
            
            remediation.detected = slowQueryArray.length;
            
            // Analyze top slow queries
            for (const slowQuery of slowQueryArray.slice(0, 10)) {
                remediation.analyzed++;
                
                // Collect all recommendations
                for (const rec of slowQuery.recommendations) {
                    if (!remediation.recommendations.some(r => r.title === rec.title)) {
                        remediation.recommendations.push(rec);
                    }
                }
            }
            
            // Apply safe remediations
            if (this.config.autoRemediation) {
                const appliedRemediations = await this.applyAutoRemediations(slowQueryArray.slice(0, 5));
                remediation.applied = appliedRemediations.length;
                remediation.improvements = appliedRemediations;
            }
            
            console.log(`✅ Slow query detection completed - ${remediation.detected} detected, ${remediation.analyzed} analyzed`);
            return remediation;
        } catch (error) {
            console.error('❌ Slow query detection failed:', error);
            throw error;
        }
    }

    /**
     * Apply automatic remediations
     */
    async applyAutoRemediations(slowQueries) {
        const appliedRemediations = [];
        
        for (const slowQuery of slowQueries) {
            for (const rec of slowQuery.recommendations) {
                if (rec.type === 'index' && rec.priority === 'high' && this.isSafeToApply(rec)) {
                    try {
                        await this.applyIndexRecommendation(slowQuery, rec);
                        appliedRemediations.push({
                            query: slowQuery.query.substring(0, 100) + '...',
                            recommendation: rec,
                            success: true
                        });
                    } catch (error) {
                        appliedRemediations.push({
                            query: slowQuery.query.substring(0, 100) + '...',
                            recommendation: rec,
                            success: false,
                            error: error.message
                        });
                    }
                }
            }
        }
        
        return appliedRemediations;
    }

    /**
     * Check if recommendation is safe to apply
     */
    isSafeToApply(recommendation) {
        // Don't apply to primary key or unique constraint columns
        if (recommendation.column && recommendation.column.toLowerCase().includes('id')) {
            return false;
        }
        
        return true;
    }

    /**
     * Apply index recommendation
     */
    async applyIndexRecommendation(slowQuery, recommendation) {
        console.log(`📊 Creating index: ${recommendation.implementation}`);
        
        // await this.executeQuery(recommendation.implementation);
        
        this.emit('indexCreated', {
            slowQuery: slowQuery.query,
            index: recommendation.implementation
        });
    }

    /**
     * Get slow query statistics
     */
    getSlowQueryStats() {
        const slowQueries = Array.from(this.slowQueries.values())
            .filter(query => query.meanTime > this.config.threshold)
            .sort((a, b) => b.impact - a.impact);
        
        const totalImpact = slowQueries.reduce((sum, query) => sum + query.impact, 0);
        
        return {
            totalSlowQueries: slowQueries.length,
            totalImpact: totalImpact,
            averageTime: slowQueries.length > 0 ? 
                slowQueries.reduce((sum, q) => sum + q.meanTime, 0) / slowQueries.length : 0,
            topQueries: slowQueries.slice(0, 10),
            recommendations: this.getAllRecommendations()
        };
    }

    /**
     * Get all recommendations
     */
    getAllRecommendations() {
        const allRecs = [];
        
        for (let slowQuery of this.slowQueries.values()) {
            allRecs.push(...slowQuery.recommendations);
        }
        
        // Remove duplicates
        return allRecs.filter((rec, index, self) => 
            index === self.findIndex(r => r.title === rec.title)
        );
    }

    /**
     * Cleanup old queries
     */
    cleanupOldQueries() {
        const cutoff = Date.now() - this.config.analysisWindow;
        
        for (let [query, data] of this.slowQueries) {
            if (data.lastSeen < cutoff) {
                this.slowQueries.delete(query);
            }
        }
    }

    /**
     * Get top slow queries
     */
    getTopSlowQueries(limit = 10) {
        return Array.from(this.slowQueries.values())
            .sort((a, b) => b.impact - a.impact)
            .slice(0, limit);
    }

    /**
     * Get slow query details
     */
    getSlowQueryDetails(queryId) {
        return this.slowQueries.get(queryId);
    }

    async executeQuery(query, params = []) {
        // This would execute the query on the actual database
        console.log('Executing query:', query.substring(0, 100) + '...');
        return { rows: [], rowCount: 0 };
    }

    async cleanup() {
        console.log('🧹 Cleaning up Slow Query Detector...');
        
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        
        this.slowQueries.clear();
        this.queryStats.clear();
        this.recommendations.clear();
        this.initialized = false;
        this.isDetecting = false;
        console.log('✅ Slow Query Detector cleanup complete');
    }
}

module.exports = SlowQueryDetector;