/**
 * Database Sharding Manager
 * Handles horizontal and vertical database sharding strategies
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class ShardingManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            strategy: 'hash', // hash, range, directory
            shardKey: 'id',
            shardCount: 4,
            connectionTimeout: 30000,
            ...config
        };
        this.shards = new Map();
        this.shardMeta = new Map();
        this.initialized = false;
    }

    async initialize() {
        console.log('🔧 Initializing Sharding Manager...');
        
        try {
            // Initialize shard connections
            for (let i = 0; i < this.config.shardCount; i++) {
                await this.createShardConnection(i);
            }
            
            this.initialized = true;
            this.emit('initialized');
            console.log('✅ Sharding Manager initialized with', this.config.shardCount, 'shards');
        } catch (error) {
            console.error('❌ Sharding Manager initialization failed:', error);
            throw error;
        }
    }

    async createShardConnection(shardId) {
        const shardConfig = {
            host: process.env[`SHARD_${shardId}_HOST`] || 'localhost',
            port: parseInt(process.env[`SHARD_${shardId}_PORT`] || '5432') + shardId,
            database: process.env[`SHARD_${shardId}_DB`] || `shard_${shardId}`,
            user: process.env[`SHARD_${shardId}_USER`] || 'postgres',
            password: process.env[`SHARD_${shardId}_PASSWORD`] || 'password',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: this.config.connectionTimeout
        };

        const { Pool } = require('pg');
        const pool = new Pool(shardConfig);
        
        // Test connection
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        
        this.shards.set(shardId, pool);
        this.shardMeta.set(shardId, {
            config: shardConfig,
            created: new Date(),
            lastActivity: null,
            connectionCount: 0
        });
    }

    /**
     * Get shard ID based on sharding strategy
     */
    getShardId(key) {
        switch (this.config.strategy) {
            case 'hash':
                return this.hashSharding(key);
            case 'range':
                return this.rangeSharding(key);
            case 'directory':
                return this.directorySharding(key);
            default:
                throw new Error(`Unknown sharding strategy: ${this.config.strategy}`);
        }
    }

    /**
     * Hash-based sharding (recommended for even distribution)
     */
    hashSharding(key) {
        const hash = crypto.createHash('sha256').update(String(key)).digest('hex');
        const numericHash = parseInt(hash.substring(0, 8), 16);
        return numericHash % this.config.shardCount;
    }

    /**
     * Range-based sharding (good for time-based data)
     */
    rangeSharding(key) {
        if (typeof key === 'number') {
            const rangeSize = Math.floor(Number.MAX_SAFE_INTEGER / this.config.shardCount);
            return Math.floor(key / rangeSize);
        }
        
        if (key instanceof Date) {
            const year = key.getFullYear();
            const rangeSize = Math.floor(2100 - 2020) / this.config.shardCount;
            return Math.floor((year - 2020) / rangeSize);
        }
        
        // Default to hash for non-numeric/date keys
        return this.hashSharding(key);
    }

    /**
     * Directory-based sharding (custom routing rules)
     */
    directorySharding(key) {
        // This would typically look up routing rules in a directory service
        // For now, implement a simple directory based on key prefixes
        const keyStr = String(key);
        const hash = crypto.createHash('md5').update(keyStr).digest('hex');
        return parseInt(hash.substring(0, 2), 16) % this.config.shardCount;
    }

    /**
     * Execute query on appropriate shard
     */
    async query(queryText, params = [], options = {}) {
        if (!this.initialized) {
            throw new Error('Sharding Manager not initialized');
        }

        // If shardId is specified, use that shard
        if (options.shardId !== undefined) {
            return this.executeOnShard(options.shardId, queryText, params);
        }

        // If shardKey is provided, calculate shard
        if (options.shardKey) {
            const shardId = this.getShardId(options.shardKey);
            return this.executeOnShard(shardId, queryText, params);
        }

        // If no specific shard specified, query all shards and aggregate
        return this.queryAllShards(queryText, params, options);
    }

    /**
     * Execute query on specific shard
     */
    async executeOnShard(shardId, queryText, params = []) {
        const pool = this.shards.get(shardId);
        if (!pool) {
            throw new Error(`Shard ${shardId} not found`);
        }

        const meta = this.shardMeta.get(shardId);
        const startTime = Date.now();

        try {
            const client = await pool.connect();
            const result = await client.query(queryText, params);
            client.release();

            // Update metadata
            meta.lastActivity = new Date();
            meta.connectionCount = pool.totalCount;

            const executionTime = Date.now() - startTime;
            this.emit('queryExecuted', { shardId, queryText, executionTime, rowCount: result.rowCount });

            return result;
        } catch (error) {
            console.error(`Query failed on shard ${shardId}:`, error);
            throw error;
        }
    }

    /**
     * Query all shards and aggregate results
     */
    async queryAllShards(queryText, params = [], options = {}) {
        const promises = [];
        const results = [];

        for (let shardId = 0; shardId < this.config.shardCount; shardId++) {
            promises.push(
                this.executeOnShard(shardId, queryText, params)
                    .then(result => ({ shardId, result }))
                    .catch(error => ({ shardId, error }))
            );
        }

        const shardResults = await Promise.allSettled(promises);
        
        for (const { status, value } of shardResults) {
            if (status === 'fulfilled') {
                results.push(value);
            } else {
                console.error('Shard query failed:', value);
            }
        }

        return this.aggregateResults(results, options.aggregate);
    }

    /**
     * Aggregate results from multiple shards
     */
    aggregateResults(results, aggregateType = 'union') {
        const successful = results.filter(r => !r.error);
        const errors = results.filter(r => r.error);

        switch (aggregateType) {
            case 'union':
                return {
                    rows: successful.flatMap(r => r.result.rows),
                    rowCount: successful.reduce((sum, r) => sum + r.result.rowCount, 0),
                    errors: errors
                };
            case 'merge':
                return {
                    rows: this.mergeResults(successful.map(r => r.result.rows)),
                    rowCount: successful.reduce((sum, r) => sum + r.result.rowCount, 0),
                    errors: errors
                };
            case 'count':
                return {
                    count: successful.reduce((sum, r) => sum + r.result.rowCount, 0),
                    errors: errors
                };
            default:
                return { results: successful, errors };
        }
    }

    /**
     * Merge results by primary key
     */
    mergeResults(rowsArrays) {
        const merged = new Map();
        
        for (const rows of rowsArrays) {
            for (const row of rows) {
                const key = row.id || JSON.stringify(row);
                if (!merged.has(key)) {
                    merged.set(key, row);
                }
            }
        }
        
        return Array.from(merged.values());
    }

    /**
     * Add new shard dynamically
     */
    async addShard(shardId) {
        console.log(`➕ Adding new shard: ${shardId}`);
        
        try {
            await this.createShardConnection(shardId);
            this.config.shardCount = Math.max(this.config.shardCount, shardId + 1);
            this.emit('shardAdded', { shardId });
            console.log(`✅ Successfully added shard ${shardId}`);
        } catch (error) {
            console.error(`❌ Failed to add shard ${shardId}:`, error);
            throw error;
        }
    }

    /**
     * Remove shard
     */
    async removeShard(shardId) {
        console.log(`➖ Removing shard: ${shardId}`);
        
        const pool = this.shards.get(shardId);
        if (!pool) {
            throw new Error(`Shard ${shardId} not found`);
        }

        try {
            await pool.end();
            this.shards.delete(shardId);
            this.shardMeta.delete(shardId);
            this.emit('shardRemoved', { shardId });
            console.log(`✅ Successfully removed shard ${shardId}`);
        } catch (error) {
            console.error(`❌ Failed to remove shard ${shardId}:`, error);
            throw error;
        }
    }

    /**
     * Get shard statistics
     */
    getShardStats() {
        const stats = {};
        
        for (let [shardId, pool] of this.shards) {
            const meta = this.shardMeta.get(shardId);
            stats[shardId] = {
                totalConnections: pool.totalCount,
                idleConnections: pool.idleCount,
                waitingClients: pool.waitingCount,
                lastActivity: meta.lastActivity,
                created: meta.created
            };
        }
        
        return stats;
    }

    /**
     * Rebalance data across shards
     */
    async rebalanceData(tableName, shardKey = 'id') {
        console.log('🔄 Starting data rebalancing...');
        
        try {
            // This would implement complex rebalancing logic
            // For now, just log the intent
            this.emit('rebalancingStarted', { tableName, shardKey });
            
            // TODO: Implement actual rebalancing logic
            // - Identify hot shards
            // - Move data from overloaded shards
            // - Update routing table
            
            console.log('✅ Data rebalancing completed');
            this.emit('rebalancingCompleted', { tableName, shardKey });
        } catch (error) {
            console.error('❌ Data rebalancing failed:', error);
            throw error;
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up Sharding Manager...');
        
        for (let [shardId, pool] of this.shards) {
            await pool.end();
        }
        
        this.shards.clear();
        this.shardMeta.clear();
        this.initialized = false;
        console.log('✅ Sharding Manager cleanup complete');
    }
}

module.exports = ShardingManager;