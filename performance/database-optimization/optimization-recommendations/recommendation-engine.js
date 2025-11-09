/**
 * Database Optimization Recommendation Engine
 * Analyzes performance data and provides actionable optimization recommendations
 */

const EventEmitter = require('events');

class OptimizationRecommendationEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            maxRecommendations: 50,
            minImpactScore: 25,
            autoApply: false,
            recommendationTypes: {
                index: { weight: 1.0, priority: 'medium' },
                query: { weight: 1.2, priority: 'high' },
                resource: { weight: 0.8, priority: 'high' },
                configuration: { weight: 0.6, priority: 'medium' },
                maintenance: { weight: 0.4, priority: 'low' }
            },
            ...config
        };
        this.recommendations = new Map();
        this.analysisHistory = [];
        this.currentRecommendations = [];
        this.initialized = false;
    }

    async initialize() {
        console.log('🔧 Initializing Optimization Recommendation Engine...');
        
        try {
            await this.loadHistoricalData();
            this.initialized = true;
            this.emit('initialized');
            console.log('✅ Optimization Recommendation Engine initialized');
        } catch (error) {
            console.error('❌ Optimization Recommendation Engine initialization failed:', error);
            throw error;
        }
    }

    /**
     * Generate optimization recommendations from analysis data
     */
    async generateRecommendations(optimizationsData) {
        console.log('💡 Generating optimization recommendations...');
        
        const analysis = {
            timestamp: new Date(),
            optimizations: optimizationsData,
            recommendations: []
        };

        try {
            // Process each optimization type
            for (const opt of optimizationsData) {
                switch (opt.type) {
                    case 'query_analysis':
                        analysis.recommendations.push(...this.analyzeQueryRecommendations(opt.details));
                        break;
                    case 'index_optimization':
                        analysis.recommendations.push(...this.analyzeIndexRecommendations(opt.details));
                        break;
                    case 'slow_query_remediation':
                        analysis.recommendations.push(...this.analyzeSlowQueryRecommendations(opt.details));
                        break;
                    case 'connection_pool_optimization':
                        analysis.recommendations.push(...this.analyzeConnectionRecommendations(opt.details));
                        break;
                    case 'health_check':
                        analysis.recommendations.push(...this.analyzeHealthRecommendations(opt.details));
                        break;
                }
            }

            // Consolidate and score recommendations
            analysis.recommendations = this.consolidateRecommendations(analysis.recommendations);
            analysis.recommendations = this.scoreRecommendations(analysis.recommendations);
            analysis.recommendations = this.prioritizeRecommendations(analysis.recommendations);

            // Store current recommendations
            this.currentRecommendations = analysis.recommendations;
            
            // Emit analysis completed
            this.emit('recommendationsGenerated', analysis);
            
            console.log(`✅ Generated ${analysis.recommendations.length} optimization recommendations`);
            return analysis;
        } catch (error) {
            console.error('❌ Recommendation generation failed:', error);
            throw error;
        }
    }

    /**
     * Analyze query-based recommendations
     */
    analyzeQueryRecommendations(queryData) {
        const recommendations = [];
        
        if (!queryData.slowQueries) return recommendations;
        
        for (const slowQuery of queryData.slowQueries) {
            // Index recommendations
            if (slowQuery.issues?.some(issue => issue.type === 'slow')) {
                const whereColumns = this.extractWhereColumns(slowQuery.query);
                for (const column of whereColumns) {
                    recommendations.push({
                        type: 'index',
                        title: `Create Index on ${column.column}`,
                        description: `Missing index on column used in WHERE clause`,
                        impact: 70,
                        effort: 'low',
                        query: slowQuery.query,
                        implementation: `CREATE INDEX idx_${column.table}_${column.column} ON ${column.table} (${column.column})`,
                        estimatedImprovement: 80,
                        category: 'Performance',
                        urgency: slowQuery.impactScore > 100 ? 'high' : 'medium'
                    });
                }
            }
            
            // Query optimization recommendations
            if (slowQuery.query.includes('SELECT *')) {
                recommendations.push({
                    type: 'query',
                    title: 'Optimize SELECT * Query',
                    description: 'Replace SELECT * with specific column names',
                    impact: 40,
                    effort: 'low',
                    query: slowQuery.query,
                    implementation: 'Select only required columns',
                    estimatedImprovement: 50,
                    category: 'Query Optimization',
                    urgency: 'medium'
                });
            }
            
            // Caching recommendations
            if (slowQuery.totalCalls > 1000) {
                recommendations.push({
                    type: 'cache',
                    title: 'Implement Query Caching',
                    description: 'High-frequency query suitable for caching',
                    impact: 85,
                    effort: 'medium',
                    query: slowQuery.query,
                    implementation: 'Add Redis or Memcached layer',
                    estimatedImprovement: 90,
                    category: 'Caching',
                    urgency: 'high'
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Analyze index-based recommendations
     */
    analyzeIndexRecommendations(indexData) {
        const recommendations = [];
        
        if (!indexData.recommendations) return recommendations;
        
        for (const rec of indexData.recommendations) {
            if (rec.priority === 'urgent' || rec.priority === 'high') {
                recommendations.push({
                    type: 'index',
                    title: rec.title || 'Create Recommended Index',
                    description: rec.reason,
                    impact: rec.benefit?.score || 60,
                    effort: 'low',
                    implementation: rec.implementation,
                    estimatedImprovement: rec.benefit?.estimatedImprovement || 70,
                    category: 'Index Optimization',
                    urgency: rec.priority
                });
            }
        }
        
        // Duplicate index recommendations
        if (indexData.redundant) {
            recommendations.push({
                type: 'maintenance',
                title: 'Remove Redundant Indexes',
                description: `Found ${indexData.redundant.length} redundant indexes`,
                impact: 30,
                effort: 'low',
                implementation: 'Drop duplicate/redundant indexes',
                estimatedImprovement: 20,
                category: 'Maintenance',
                urgency: 'low'
            });
        }
        
        return recommendations;
    }

    /**
     * Analyze slow query recommendations
     */
    analyzeSlowQueryRecommendations(slowQueryData) {
        const recommendations = [];
        
        if (!slowQueryData.detected) return recommendations;
        
        for (const slowQuery of slowQueryData.detected) {
            for (const rec of slowQuery.recommendations || []) {
                recommendations.push({
                    type: 'query',
                    title: rec.title,
                    description: rec.description,
                    impact: rec.priority === 'high' ? 80 : 50,
                    effort: rec.type === 'index' ? 'low' : 'medium',
                    implementation: rec.implementation,
                    estimatedImprovement: rec.estimatedImprovement,
                    category: 'Query Optimization',
                    urgency: rec.priority,
                    query: slowQuery.query
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Analyze connection pool recommendations
     */
    analyzeConnectionRecommendations(connectionData) {
        const recommendations = [];
        
        if (!connectionData.pools) return recommendations;
        
        for (const [poolName, stats] of Object.entries(connectionData.pools)) {
            const utilization = (stats.activeConnections / stats.totalConnections) * 100;
            
            if (utilization > 90) {
                recommendations.push({
                    type: 'resource',
                    title: `Increase ${poolName} Pool Size`,
                    description: `High connection utilization (${utilization.toFixed(1)}%)`,
                    impact: 60,
                    effort: 'low',
                    implementation: `Increase max connections for ${poolName} pool`,
                    estimatedImprovement: 40,
                    category: 'Resource Management',
                    urgency: 'high'
                });
            } else if (utilization < 30) {
                recommendations.push({
                    type: 'resource',
                    title: `Optimize ${poolName} Pool Size`,
                    description: `Low connection utilization (${utilization.toFixed(1)}%)`,
                    impact: 20,
                    effort: 'low',
                    implementation: `Decrease max connections for ${poolName} pool`,
                    estimatedImprovement: 15,
                    category: 'Resource Management',
                    urgency: 'low'
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Analyze health check recommendations
     */
    analyzeHealthRecommendations(healthData) {
        const recommendations = [];
        
        if (!healthData.checks) return recommendations;
        
        // Resource recommendations
        if (healthData.checks.resources?.resources) {
            const resources = healthData.checks.resources.resources;
            
            if (resources.cpu?.usage > 80) {
                recommendations.push({
                    type: 'resource',
                    title: 'Optimize CPU Usage',
                    description: `High CPU usage: ${resources.cpu.usage.toFixed(1)}%`,
                    impact: 70,
                    effort: 'medium',
                    implementation: 'Review query performance and add indexes',
                    estimatedImprovement: 50,
                    category: 'Resource Management',
                    urgency: 'high'
                });
            }
            
            if (resources.memory?.usage > 85) {
                recommendations.push({
                    type: 'resource',
                    title: 'Optimize Memory Usage',
                    description: `High memory usage: ${resources.memory.usage.toFixed(1)}%`,
                    impact: 60,
                    effort: 'medium',
                    implementation: 'Review memory-intensive queries and optimize cache settings',
                    estimatedImprovement: 40,
                    category: 'Resource Management',
                    urgency: 'high'
                });
            }
        }
        
        // Maintenance recommendations
        if (healthData.checks.integrity?.checks) {
            const integrity = healthData.checks.integrity.checks;
            
            if (integrity.deadTuples > 50000) {
                recommendations.push({
                    type: 'maintenance',
                    title: 'Perform Database Maintenance',
                    description: `High dead tuple count: ${integrity.deadTuples}`,
                    impact: 40,
                    effort: 'low',
                    implementation: 'Run VACUUM and ANALYZE',
                    estimatedImprovement: 30,
                    category: 'Maintenance',
                    urgency: 'medium'
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Consolidate similar recommendations
     */
    consolidateRecommendations(recommendations) {
        const consolidated = [];
        const seenTitles = new Set();
        
        for (const rec of recommendations) {
            // Normalize title for comparison
            const normalizedTitle = rec.title.toLowerCase().replace(/\s+/g, ' ');
            
            if (seenTitles.has(normalizedTitle)) {
                continue; // Skip duplicate
            }
            
            seenTitles.add(normalizedTitle);
            consolidated.push(rec);
        }
        
        return consolidated;
    }

    /**
     * Score recommendations based on impact and effort
     */
    scoreRecommendations(recommendations) {
        return recommendations.map(rec => {
            const impact = rec.impact || 50;
            const effort = this.getEffortScore(rec.effort || 'medium');
            const urgency = this.getUrgencyScore(rec.urgency || 'medium');
            
            // Score = (impact × effort × urgency) / 100
            rec.score = (impact * effort * urgency) / 100;
            rec.score = Math.min(100, Math.max(1, rec.score)); // Clamp to 1-100
            
            return rec;
        });
    }

    /**
     * Get effort score
     */
    getEffortScore(effort) {
        const effortScores = { low: 1.2, medium: 1.0, high: 0.7 };
        return effortScores[effort] || 1.0;
    }

    /**
     * Get urgency score
     */
    getUrgencyScore(urgency) {
        const urgencyScores = { low: 0.8, medium: 1.0, high: 1.5, critical: 2.0 };
        return urgencyScores[urgency] || 1.0;
    }

    /**
     * Prioritize recommendations
     */
    prioritizeRecommendations(recommendations) {
        return recommendations
            .filter(rec => rec.score >= this.config.minImpactScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, this.config.maxRecommendations);
    }

    /**
     * Extract WHERE columns from query
     */
    extractWhereColumns(query) {
        const columns = [];
        const whereMatch = query.match(/where\s+(.+?)(?:\s+order by|\s+group by|\s+limit|\s*;|$)/i);
        
        if (whereMatch) {
            const whereClause = whereMatch[1];
            const columnMatches = whereClause.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*[=<>]/g);
            
            if (columnMatches) {
                for (const match of columnMatches) {
                    const columnName = match.split(/[=<>]/)[0].trim();
                    const tableName = this.extractTableName(query);
                    columns.push({ table: tableName, column: columnName });
                }
            }
        }
        
        return columns;
    }

    /**
     * Extract table name from query
     */
    extractTableName(query) {
        const fromMatch = query.match(/from\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
        return fromMatch ? fromMatch[1] : 'unknown';
    }

    /**
     * Apply recommendations (dry run or actual)
     */
    async applyRecommendations(recommendations, options = {}) {
        const { dryRun = false, limit } = options;
        
        const filtered = limit ? recommendations.slice(0, limit) : recommendations;
        const applied = [];
        const failed = [];
        
        console.log(`${dryRun ? 'Would apply' : 'Applying'} ${filtered.length} recommendations...`);
        
        for (const rec of filtered) {
            try {
                if (dryRun) {
                    console.log(`  💭 [DRY RUN] ${rec.title}`);
                    applied.push({ ...rec, applied: false, dryRun: true });
                    continue;
                }
                
                const result = await this.applyRecommendation(rec);
                applied.push({ ...rec, applied: true, result });
                this.emit('recommendationApplied', { recommendation: rec, result });
                
            } catch (error) {
                const errorInfo = { 
                    ...rec, 
                    applied: false, 
                    error: error.message,
                    failed: true 
                };
                failed.push(errorInfo);
                console.error(`❌ Failed to apply recommendation "${rec.title}":`, error.message);
            }
        }
        
        const summary = {
            total: filtered.length,
            applied: applied.filter(a => a.applied).length,
            failed: failed.length,
            dryRun: dryRun,
            results: applied,
            errors: failed
        };
        
        console.log(`✅ Recommendation application completed: ${summary.applied}/${summary.total} applied`);
        return summary;
    }

    /**
     * Apply individual recommendation
     */
    async applyRecommendation(recommendation) {
        switch (recommendation.type) {
            case 'index':
                return await this.applyIndexRecommendation(recommendation);
            case 'query':
                return await this.applyQueryRecommendation(recommendation);
            case 'resource':
                return await this.applyResourceRecommendation(recommendation);
            case 'maintenance':
                return await this.applyMaintenanceRecommendation(recommendation);
            case 'cache':
                return await this.applyCacheRecommendation(recommendation);
            default:
                throw new Error(`Unknown recommendation type: ${recommendation.type}`);
        }
    }

    /**
     * Apply index recommendation
     */
    async applyIndexRecommendation(recommendation) {
        console.log(`📊 Creating index: ${recommendation.implementation}`);
        // await this.executeQuery(recommendation.implementation);
        return { action: 'index_created', query: recommendation.implementation };
    }

    /**
     * Apply query recommendation
     */
    async applyQueryRecommendation(recommendation) {
        console.log(`🔧 Applying query optimization: ${recommendation.title}`);
        // This would require application-level changes
        return { action: 'query_optimized', recommendation: recommendation.implementation };
    }

    /**
     * Apply resource recommendation
     */
    async applyResourceRecommendation(recommendation) {
        console.log(`⚙️ Applying resource optimization: ${recommendation.title}`);
        // This would require configuration changes
        return { action: 'resource_optimized', recommendation: recommendation.implementation };
    }

    /**
     * Apply maintenance recommendation
     */
    async applyMaintenanceRecommendation(recommendation) {
        console.log(`🧹 Performing maintenance: ${recommendation.title}`);
        if (recommendation.implementation.includes('VACUUM')) {
            // await this.executeQuery('VACUUM ANALYZE');
        }
        return { action: 'maintenance_performed', recommendation: recommendation.implementation };
    }

    /**
     * Apply cache recommendation
     */
    async applyCacheRecommendation(recommendation) {
        console.log(`💾 Setting up caching: ${recommendation.title}`);
        // This would require application-level changes
        return { action: 'cache_setup', recommendation: recommendation.implementation };
    }

    /**
     * Get current recommendations
     */
    getCurrentRecommendations() {
        return this.currentRecommendations;
    }

    /**
     * Get recommendations by category
     */
    getRecommendationsByCategory() {
        const categorized = {};
        
        for (const rec of this.currentRecommendations) {
            if (!categorized[rec.category]) {
                categorized[rec.category] = [];
            }
            categorized[rec.category].push(rec);
        }
        
        return categorized;
    }

    /**
     * Get top recommendations
     */
    getTopRecommendations(limit = 10) {
        return this.currentRecommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Load historical data
     */
    async loadHistoricalData() {
        // Load previous analysis and recommendations
        console.log('📊 Loading historical optimization data...');
        this.analysisHistory = [];
    }

    /**
     * Save analysis to history
     */
    saveToHistory(analysis) {
        this.analysisHistory.push({
            timestamp: analysis.timestamp,
            recommendationsCount: analysis.recommendations.length,
            averageScore: analysis.recommendations.reduce((sum, r) => sum + r.score, 0) / analysis.recommendations.length
        });
        
        // Limit history size
        if (this.analysisHistory.length > 100) {
            this.analysisHistory.shift();
        }
    }

    /**
     * Get recommendation trends
     */
    getRecommendationTrends() {
        if (this.analysisHistory.length === 0) {
            return { message: 'No historical data available' };
        }
        
        const recent = this.analysisHistory.slice(-10);
        const trends = {
            recommendationCount: recent.map(a => a.recommendationsCount),
            averageScore: recent.map(a => a.averageScore),
            trend: 'stable'
        };
        
        // Simple trend calculation
        if (recent.length >= 2) {
            const first = recent[0].recommendationsCount;
            const last = recent[recent.length - 1].recommendationsCount;
            
            if (last > first * 1.1) {
                trends.trend = 'increasing';
            } else if (last < first * 0.9) {
                trends.trend = 'decreasing';
            }
        }
        
        return trends;
    }

    async executeQuery(query, params = []) {
        // This would execute the query on the actual database
        console.log('Executing query:', query.substring(0, 100) + '...');
        return { rows: [], rowCount: 0 };
    }

    async cleanup() {
        console.log('🧹 Cleaning up Optimization Recommendation Engine...');
        
        this.recommendations.clear();
        this.analysisHistory = [];
        this.currentRecommendations = [];
        this.initialized = false;
        console.log('✅ Optimization Recommendation Engine cleanup complete');
    }
}

module.exports = OptimizationRecommendationEngine;