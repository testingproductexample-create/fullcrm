/**
 * Database Index Optimizer
 * Analyzes, creates, and manages database indexes for optimal performance
 */

const { Pool } = require('pg');
const EventEmitter = require('events');
const crypto = require('crypto');

class IndexOptimizer extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            autoCreateIndexes: false,
            analyzeThreshold: 1000, // Minimum query count to suggest index
            maintenanceSchedule: '0 2 * * *', // Daily at 2 AM
            unusedIndexThreshold: 30, // days
            duplicateIndexThreshold: 0.8, // 80% similarity
            ...config
        };
        this.indexes = new Map();
        this.queryStats = new Map();
        this.recommendations = [];
        this.initialized = false;
    }

    async initialize() {
        console.log('🔧 Initializing Index Optimizer...');
        
        try {
            await this.discoverIndexes();
            await this.startPeriodicMaintenance();
            this.initialized = true;
            this.emit('initialized');
            console.log('✅ Index Optimizer initialized');
        } catch (error) {
            console.error('❌ Index Optimizer initialization failed:', error);
            throw error;
        }
    }

    /**
     * Discover existing indexes
     */
    async discoverIndexes() {
        console.log('🔍 Discovering existing indexes...');
        
        const query = `
            SELECT 
                schemaname,
                tablename,
                indexname,
                indexdef,
                indisprimary,
                indisunique,
                pg_relation_size(oid) as index_size,
                pg_stat_get_tuples_returned(oid) as tuples_read,
                pg_stat_get_tuples_fetched(oid) as tuples_fetched
            FROM pg_indexes 
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY pg_relation_size(oid) DESC
        `;
        
        try {
            // await this.executeQuery(query);
            
            // Simulate discovering indexes
            const mockIndexes = [
                { tablename: 'users', indexname: 'users_email_idx', indexdef: 'CREATE INDEX users_email_idx ON users (email)', index_size: 1024000 },
                { tablename: 'orders', indexname: 'orders_user_id_idx', indexdef: 'CREATE INDEX orders_user_id_idx ON orders (user_id)', index_size: 2048000 },
                { tablename: 'orders', indexname: 'orders_created_at_idx', indexdef: 'CREATE INDEX orders_created_at_idx ON orders (created_at)', index_size: 1536000 }
            ];
            
            for (const idx of mockIndexes) {
                this.indexes.set(idx.indexname, {
                    ...idx,
                    lastUsed: null,
                    usageCount: 0,
                    recommendations: []
                });
            }
            
            console.log(`📊 Discovered ${this.indexes.size} indexes`);
        } catch (error) {
            console.error('Failed to discover indexes:', error);
        }
    }

    /**
     * Analyze query patterns and suggest indexes
     */
    async analyzeQueryPatterns() {
        console.log('🔍 Analyzing query patterns...');
        
        try {
            // Get recent query statistics
            const query = `
                SELECT 
                    query,
                    calls,
                    total_time,
                    mean_time,
                    rows
                FROM pg_stat_statements 
                WHERE calls > $1
                ORDER BY total_time DESC
                LIMIT 100
            `;
            
            // const result = await this.executeQuery(query, [this.config.analyzeThreshold]);
            const mockStats = [
                {
                    query: 'SELECT * FROM users WHERE email = $1',
                    calls: 10000,
                    total_time: 50000,
                    mean_time: 5,
                    rows: 1
                },
                {
                    query: 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
                    calls: 8000,
                    total_time: 120000,
                    mean_time: 15,
                    rows: 10
                },
                {
                    query: 'SELECT * FROM orders WHERE created_at > $1',
                    calls: 5000,
                    total_time: 300000,
                    mean_time: 60,
                    rows: 1000
                }
            ];
            
            for (const stat of mockStats) {
                this.queryStats.set(stat.query, stat);
                this.generateIndexRecommendations(stat);
            }
            
            this.recommendations = this.consolidateRecommendations();
            console.log(`💡 Generated ${this.recommendations.length} index recommendations`);
        } catch (error) {
            console.error('Query pattern analysis failed:', error);
        }
    }

    /**
     * Generate index recommendations from query statistics
     */
    generateIndexRecommendations(queryStat) {
        const { query, calls, total_time, mean_time, rows } = queryStat;
        
        // Simple pattern matching for WHERE clauses
        const whereClause = this.extractWhereClause(query);
        if (!whereClause) return;
        
        const columns = this.extractColumns(whereClause);
        if (columns.length === 0) return;
        
        // Calculate index benefit
        const indexBenefit = this.calculateIndexBenefit(queryStat, columns);
        
        if (indexBenefit.score > 50) { // Only suggest high-benefit indexes
            const recommendation = {
                type: 'create_index',
                columns: columns,
                query: query,
                benefit: indexBenefit,
                priority: this.calculatePriority(queryStat, indexBenefit),
                estimatedSize: this.estimateIndexSize(columns),
                tableName: this.extractTableName(query)
            };
            
            this.recommendations.push(recommendation);
        }
    }

    /**
     * Extract WHERE clause from query
     */
    extractWhereClause(query) {
        const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+GROUP BY|\s+LIMIT|\s+;|$)/i);
        return whereMatch ? whereMatch[1].trim() : null;
    }

    /**
     * Extract column names from WHERE clause
     */
    extractColumns(whereClause) {
        const columns = [];
        const columnRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*(=|>|<|IN|LIKE)\s*/g;
        let match;
        
        while ((match = columnRegex.exec(whereClause)) !== null) {
            if (match[1] && !match[1].match(/^\d+$/)) { // Not a number
                columns.push(match[1]);
            }
        }
        
        return [...new Set(columns)]; // Remove duplicates
    }

    /**
     * Calculate index benefit score
     */
    calculateIndexBenefit(queryStat, columns) {
        const { calls, total_time, mean_time, rows } = queryStat;
        
        // Base score from query frequency and execution time
        let score = (calls / 100) * (mean_time / 10);
        
        // Adjust for rows returned (lower is better for indexes)
        if (rows > 1000) score *= 0.5; // Low selectivity
        else if (rows > 100) score *= 0.7; // Medium selectivity
        else score *= 1.0; // High selectivity
        
        // Adjust for column count (more columns = more complex index)
        score *= Math.max(0.5, 1.0 - (columns.length - 1) * 0.2);
        
        return {
            score,
            estimatedImprovement: Math.min(90, (mean_time * score) / 10),
            priority: score > 100 ? 'high' : score > 50 ? 'medium' : 'low'
        };
    }

    /**
     * Calculate recommendation priority
     */
    calculatePriority(queryStat, indexBenefit) {
        if (indexBenefit.score > 200 && queryStat.calls > 5000) return 'urgent';
        if (indexBenefit.score > 100 && queryStat.calls > 1000) return 'high';
        if (indexBenefit.score > 50) return 'medium';
        return 'low';
    }

    /**
     * Extract table name from query
     */
    extractTableName(query) {
        const fromMatch = query.match(/FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
        return fromMatch ? fromMatch[1] : 'unknown';
    }

    /**
     * Estimate index size
     */
    estimateIndexSize(columns) {
        // Rough estimation: 100 bytes per row per column
        // This should be calculated based on actual table statistics
        return columns.length * 100000; // 100KB per column for 1000 rows
    }

    /**
     * Consolidate similar recommendations
     */
    consolidateRecommendations() {
        const consolidated = [];
        const seenCombinations = new Set();
        
        for (const rec of this.recommendations) {
            const key = rec.columns.sort().join(',');
            
            if (!seenCombinations.has(key)) {
                seenCombinations.add(key);
                
                // Find all recommendations for this column combination
                const similar = this.recommendations.filter(r => 
                    r.columns.sort().join(',') === key
                );
                
                if (similar.length > 1) {
                    // Merge similar recommendations
                    const merged = { ...similar[0] };
                    merged.benefit = {
                        score: Math.max(...similar.map(s => s.benefit.score)),
                        estimatedImprovement: Math.max(...similar.map(s => s.benefit.estimatedImprovement))
                    };
                    merged.priority = similar.reduce((max, s) => 
                        s.priority === 'urgent' ? 'urgent' : 
                        s.priority === 'high' && max !== 'urgent' ? 'high' : 
                        s.priority === 'medium' && max !== 'urgent' && max !== 'high' ? 'medium' : max,
                        'low'
                    );
                    consolidated.push(merged);
                } else {
                    consolidated.push(rec);
                }
            }
        }
        
        return consolidated.sort((a, b) => b.benefit.score - a.benefit.score);
    }

    /**
     * Create recommended indexes
     */
    async createRecommendedIndexes(options = {}) {
        const { dryRun = false, priority = 'high', limit } = options;
        const createdIndexes = [];
        
        const filteredRecs = this.recommendations
            .filter(rec => rec.priority === priority || priority === 'all')
            .slice(0, limit);
        
        console.log(`📋 ${dryRun ? 'Would create' : 'Creating'} ${filteredRecs.length} ${priority} priority indexes...`);
        
        for (const recommendation of filteredRecs) {
            if (dryRun) {
                console.log(`  💭 ${recommendation.tableName} (${recommendation.columns.join(', ')})`);
                continue;
            }
            
            try {
                const indexName = this.generateIndexName(recommendation);
                const createQuery = this.buildCreateIndexQuery(recommendation, indexName);
                
                // await this.executeQuery(createQuery);
                
                // Add to indexes map
                this.indexes.set(indexName, {
                    indexname: indexName,
                    tablename: recommendation.tableName,
                    indexdef: createQuery,
                    created: new Date(),
                    usageCount: 0,
                    recommendations: []
                });
                
                createdIndexes.push({ recommendation, indexName });
                this.emit('indexCreated', { indexName, recommendation });
                
                console.log(`✅ Created index: ${indexName}`);
            } catch (error) {
                console.error(`❌ Failed to create index for ${recommendation.tableName}:`, error);
            }
        }
        
        return createdIndexes;
    }

    /**
     * Generate index name
     */
    generateIndexName(recommendation) {
        const tableName = recommendation.tableName;
        const columns = recommendation.columns;
        const hash = crypto.createHash('md5').update(columns.join(',')).digest('hex').substring(0, 8);
        return `idx_${tableName}_${columns.join('_')}_${hash}`;
    }

    /**
     * Build CREATE INDEX query
     */
    buildCreateIndexQuery(recommendation, indexName) {
        const columns = recommendation.columns.join(', ');
        const tableName = recommendation.tableName;
        
        return `CREATE INDEX ${indexName} ON ${tableName} (${columns})`;
    }

    /**
     * Find duplicate or redundant indexes
     */
    async findRedundantIndexes() {
        console.log('🔍 Finding redundant indexes...');
        
        const redundant = [];
        const indexArray = Array.from(this.indexes.values());
        
        for (let i = 0; i < indexArray.length; i++) {
            for (let j = i + 1; j < indexArray.length; j++) {
                const idx1 = indexArray[i];
                const idx2 = indexArray[j];
                
                const similarity = this.calculateIndexSimilarity(idx1, idx2);
                
                if (similarity > this.config.duplicateIndexThreshold) {
                    redundant.push({
                        primary: idx1,
                        redundant: idx2,
                        similarity,
                        recommendation: this.recommendIndexRetention(idx1, idx2)
                    });
                }
            }
        }
        
        console.log(`📊 Found ${redundant.length} potentially redundant indexes`);
        return redundant;
    }

    /**
     * Calculate index similarity
     */
    calculateIndexSimilarity(idx1, idx2) {
        // Extract columns from index definitions
        const columns1 = this.extractIndexColumns(idx1.indexdef);
        const columns2 = this.extractIndexColumns(idx2.indexdef);
        
        if (columns1.length === 0 || columns2.length === 0) return 0;
        
        // Calculate Jaccard similarity
        const intersection = columns1.filter(col => columns2.includes(col));
        const union = [...new Set([...columns1, ...columns2])];
        
        return intersection.length / union.length;
    }

    /**
     * Extract columns from index definition
     */
    extractIndexColumns(indexDef) {
        const match = indexDef.match(/\((.+?)\)/);
        if (!match) return [];
        
        return match[1].split(',').map(col => 
            col.trim().replace(/"/g, '').toLowerCase()
        );
    }

    /**
     * Recommend which index to keep
     */
    recommendIndexRetention(idx1, idx2) {
        // Prefer indexes with better usage statistics
        if (idx1.usageCount > idx2.usageCount * 1.5) return 'keep_primary';
        if (idx2.usageCount > idx1.usageCount * 1.5) return 'keep_redundant';
        
        // Prefer primary keys over regular indexes
        if (idx1.indisprimary && !idx2.indisprimary) return 'keep_primary';
        if (idx2.indisprimary && !idx1.indisprimary) return 'keep_redundant';
        
        // Prefer smaller indexes
        if (idx1.index_size < idx2.index_size * 0.8) return 'keep_primary';
        if (idx2.index_size < idx1.index_size * 0.8) return 'keep_redundant';
        
        return 'keep_smaller';
    }

    /**
     * Drop redundant indexes
     */
    async dropRedundantIndexes(redundantIndexes, options = {}) {
        const { dryRun = false } = options;
        const droppedIndexes = [];
        
        for (const redundant of redundantIndexes) {
            const indexToDrop = redundant.recommendation === 'keep_primary' ? 
                redundant.redundant : redundant.primary;
            
            if (dryRun) {
                console.log(`  💭 Would drop: ${indexToDrop.indexname}`);
                continue;
            }
            
            try {
                const dropQuery = `DROP INDEX ${indexToDrop.indexname}`;
                // await this.executeQuery(dropQuery);
                
                this.indexes.delete(indexToDrop.indexname);
                droppedIndexes.push(indexToDrop);
                this.emit('indexDropped', { indexName: indexToDrop.indexname });
                
                console.log(`🗑️ Dropped redundant index: ${indexToDrop.indexname}`);
            } catch (error) {
                console.error(`❌ Failed to drop index ${indexToDrop.indexname}:`, error);
            }
        }
        
        return droppedIndexes;
    }

    /**
     * Analyze index usage statistics
     */
    async analyzeIndexUsage() {
        console.log('📊 Analyzing index usage...');
        
        const query = `
            SELECT 
                schemaname,
                tablename,
                indexname,
                idx_scan,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes
            ORDER BY idx_scan DESC
        `;
        
        try {
            // const result = await this.executeQuery(query);
            const mockUsage = [
                { indexname: 'users_email_idx', idx_scan: 50000, idx_tup_read: 100000 },
                { indexname: 'orders_user_id_idx', idx_scan: 10000, idx_tup_read: 50000 },
                { indexname: 'orders_created_at_idx', idx_scan: 1000, idx_tup_read: 5000 }
            ];
            
            for (const usage of mockUsage) {
                const index = this.indexes.get(usage.indexname);
                if (index) {
                    index.usageCount = usage.idx_scan;
                    index.lastUsed = new Date(); // This would be calculated from actual stats
                }
            }
            
            return mockUsage;
        } catch (error) {
            console.error('Index usage analysis failed:', error);
            return [];
        }
    }

    /**
     * Find unused indexes
     */
    findUnusedIndexes() {
        const unused = [];
        const threshold = this.config.unusedIndexThreshold;
        const now = new Date();
        
        for (let [indexName, index] of this.indexes) {
            if (index.lastUsed) {
                const daysSinceUse = (now - new Date(index.lastUsed)) / (1000 * 60 * 60 * 24);
                if (daysSinceUse > threshold) {
                    unused.push({
                        index,
                        daysSinceUse,
                        reason: 'No usage in last ' + threshold + ' days'
                    });
                }
            }
        }
        
        console.log(`📉 Found ${unused.length} potentially unused indexes`);
        return unused;
    }

    /**
     * Optimize all indexes
     */
    async optimizeIndexes() {
        console.log('⚡ Optimizing indexes...');
        
        const results = {
            created: [],
            dropped: [],
            maintained: []
        };
        
        try {
            // 1. Analyze query patterns
            await this.analyzeQueryPatterns();
            
            // 2. Find redundant indexes
            const redundant = await this.findRedundantIndexes();
            
            // 3. Analyze usage
            await this.analyzeIndexUsage();
            
            // 4. Find unused indexes
            const unused = this.findUnusedIndexes();
            
            // 5. Apply optimizations
            if (this.config.autoCreateIndexes) {
                results.created = await this.createRecommendedIndexes({ 
                    priority: 'urgent', 
                    limit: 5 
                });
            }
            
            results.dropped = await this.dropRedundantIndexes(redundant);
            
            // 6. Update recommendations
            this.updateRecommendations(redundant, unused);
            
            console.log('✅ Index optimization completed');
            return results;
        } catch (error) {
            console.error('❌ Index optimization failed:', error);
            throw error;
        }
    }

    /**
     * Update recommendations based on optimization results
     */
    updateRecommendations(redundant, unused) {
        // Remove recommendations for indexes that are now redundant
        this.recommendations = this.recommendations.filter(rec => 
            !redundant.some(r => r.primary.indexname === this.generateIndexName(rec) ||
                                r.redundant.indexname === this.generateIndexName(rec))
        );
    }

    /**
     * Start periodic maintenance
     */
    startPeriodicMaintenance() {
        // This would typically use a job scheduler like node-cron
        console.log('⏰ Starting periodic index maintenance');
    }

    /**
     * Get index statistics
     */
    getIndexStats() {
        const stats = {
            total: this.indexes.size,
            used: 0,
            unused: 0,
            totalSize: 0,
            recommendations: this.recommendations.length
        };
        
        for (let [name, index] of this.indexes) {
            stats.totalSize += index.index_size || 0;
            if (index.usageCount > 0) {
                stats.used++;
            } else {
                stats.unused++;
            }
        }
        
        return stats;
    }

    async executeQuery(query, params = []) {
        // This would execute the query on the actual database
        console.log('Executing query:', query.substring(0, 100) + '...');
        return { rows: [], rowCount: 0 };
    }

    async cleanup() {
        console.log('🧹 Cleaning up Index Optimizer...');
        this.indexes.clear();
        this.queryStats.clear();
        this.recommendations = [];
        this.initialized = false;
        console.log('✅ Index Optimizer cleanup complete');
    }
}

module.exports = IndexOptimizer;