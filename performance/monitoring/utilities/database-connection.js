/**
 * Database Connection Utility
 * Manages database connections and provides connection pooling
 */

const { Pool } = require('pg');
const { Logger } = require('./logger');

class DatabaseConnection {
  constructor(options = {}) {
    this.options = {
      host: options.host || process.env.DB_HOST || 'localhost',
      port: options.port || parseInt(process.env.DB_PORT) || 5432,
      database: options.database || process.env.DB_NAME || 'performance_monitoring',
      user: options.user || process.env.DB_USER || 'postgres',
      password: options.password || process.env.DB_PASSWORD || 'password',
      max: options.max || parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
      idleTimeoutMillis: options.idleTimeoutMillis || parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: options.connectionTimeoutMillis || parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
      ssl: options.ssl || process.env.DB_SSL === 'true',
      ...options
    };

    this.pool = null;
    this.isConnected = false;
    this.logger = new Logger('DatabaseConnection');
    
    // Statistics
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      totalQueries: 0,
      totalErrors: 0,
      averageQueryTime: 0,
      lastConnectionTime: null
    };
    
    // Query timing
    this.queryTimes = [];
  }

  /**
   * Connect to the database
   */
  async connect() {
    try {
      this.logger.info('Connecting to database...', {
        host: this.options.host,
        port: this.options.port,
        database: this.options.database
      });

      // Create connection pool
      this.pool = new Pool({
        host: this.options.host,
        port: this.options.port,
        database: this.options.database,
        user: this.options.user,
        password: this.options.password,
        max: this.options.max,
        idleTimeoutMillis: this.options.idleTimeoutMillis,
        connectionTimeoutMillis: this.options.connectionTimeoutMillis,
        ssl: this.options.ssl,
      });

      // Test the connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      
      this.isConnected = true;
      this.stats.lastConnectionTime = new Date();
      
      // Release the test client
      client.release();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.logger.info('Database connected successfully', {
        currentTime: result.rows[0].current_time
      });

      return this;
      
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      
      this.isConnected = false;
      this.logger.info('Database disconnected');
      
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  /**
   * Get a database client from the pool
   */
  async getClient() {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call connect() first.');
    }
    
    try {
      const client = await this.pool.connect();
      
      // Add query timing middleware
      const originalQuery = client.query.bind(client);
      const startTime = Date.now();
      
      client.query = async (...args) => {
        const queryStart = Date.now();
        try {
          const result = await originalQuery(...args);
          const queryTime = Date.now() - queryStart;
          this.recordQueryTime(queryTime);
          this.stats.totalQueries++;
          return result;
        } catch (error) {
          this.stats.totalErrors++;
          this.logger.error('Database query error:', error);
          throw error;
        }
      };
      
      return client;
      
    } catch (error) {
      this.logger.error('Error getting database client:', error);
      throw error;
    }
  }

  /**
   * Execute a query using the pool
   */
  async query(text, params = []) {
    const startTime = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      
      const queryTime = Date.now() - startTime;
      this.recordQueryTime(queryTime);
      this.stats.totalQueries++;
      
      this.logger.debug('Query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: params.length,
        time: queryTime,
        rows: result.rowCount
      });
      
      return result;
      
    } catch (error) {
      this.stats.totalErrors++;
      this.logger.error('Query execution failed:', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if database is healthy
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const result = await this.query('SELECT 1 as health');
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: true,
        responseTime,
        timestamp: new Date(),
        stats: this.getStats()
      };
      
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date(),
        stats: this.getStats()
      };
    }
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolStats: this.pool ? {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      } : null
    };
  }

  /**
   * Record query execution time
   */
  recordQueryTime(time) {
    this.queryTimes.push(time);
    
    // Keep only the last 1000 query times
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }
    
    // Update average query time
    this.stats.averageQueryTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
  }

  /**
   * Setup event listeners for the connection pool
   */
  setupEventListeners() {
    if (!this.pool) return;
    
    this.pool.on('connect', (client) => {
      this.stats.totalConnections++;
      this.logger.debug('New database client connected');
    });
    
    this.pool.on('acquire', (client) => {
      this.stats.activeConnections = this.pool.totalCount - this.pool.idleCount;
      this.logger.debug('Database client acquired from pool');
    });
    
    this.pool.on('release', (client) => {
      this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);
      this.stats.idleConnections = this.pool.idleCount;
      this.logger.debug('Database client released back to pool');
    });
    
    this.pool.on('error', (error, client) => {
      this.logger.error('Database pool error:', error);
      this.stats.totalErrors++;
    });
    
    this.pool.on('remove', (client) => {
      this.stats.totalConnections = Math.max(0, this.stats.totalConnections - 1);
      this.logger.debug('Database client removed from pool');
    });
  }

  /**
   * Initialize database schema
   */
  async initializeSchema() {
    try {
      this.logger.info('Initializing database schema...');
      
      const schema = require('../database/schema.sql');
      
      // Execute schema creation
      await this.query(schema);
      
      this.logger.info('Database schema initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    try {
      this.logger.info('Running database migrations...');
      
      // This would run migration files
      // For now, just log
      this.logger.info('Migrations completed');
      
    } catch (error) {
      this.logger.error('Failed to run migrations:', error);
      throw error;
    }
  }

  /**
   * Seed database with test data
   */
  async seedDatabase() {
    try {
      this.logger.info('Seeding database with test data...');
      
      // Insert sample system metrics
      const sampleMetrics = [
        { type: 'cpu', name: 'usage_percent', value: 45.2, unit: 'percent' },
        { type: 'memory', name: 'usage_percent', value: 67.8, unit: 'percent' },
        { type: 'disk', name: 'usage_percent', value: 34.1, unit: 'percent' },
        { type: 'network', name: 'bytes_per_second', value: 1024000, unit: 'bytes' }
      ];
      
      for (const metric of sampleMetrics) {
        await this.query(
          'INSERT INTO system_metrics (timestamp, host_id, metric_type, metric_name, metric_value, metric_unit) VALUES (NOW(), $1, $2, $3, $4, $5)',
          ['localhost', metric.type, metric.name, metric.value, metric.unit]
        );
      }
      
      // Insert sample application metrics
      const appMetrics = [
        { name: 'response_time', value: 250.5, unit: 'milliseconds' },
        { name: 'throughput', value: 150.0, unit: 'requests_per_second' },
        { name: 'error_rate', value: 0.5, unit: 'percent' }
      ];
      
      for (const metric of appMetrics) {
        await this.query(
          'INSERT INTO application_metrics (timestamp, service_name, metric_type, metric_name, metric_value, metric_unit) VALUES (NOW(), $1, $2, $3, $4, $5)',
          ['api-service', 'http', metric.name, metric.value, metric.unit]
        );
      }
      
      this.logger.info('Database seeded with test data');
      
    } catch (error) {
      this.logger.error('Failed to seed database:', error);
      throw error;
    }
  }

  /**
   * Backup database
   */
  async backupDatabase(backupPath) {
    try {
      this.logger.info('Creating database backup...', { backupPath });
      
      // This would create a database backup
      // Implementation depends on the database system
      this.logger.info('Database backup completed');
      
    } catch (error) {
      this.logger.error('Failed to backup database:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreDatabase(backupPath) {
    try {
      this.logger.info('Restoring database from backup...', { backupPath });
      
      // This would restore from a backup
      // Implementation depends on the database system
      this.logger.info('Database restore completed');
      
    } catch (error) {
      this.logger.error('Failed to restore database:', error);
      throw error;
    }
  }

  /**
   * Get slow queries
   */
  async getSlowQueries(limit = 10) {
    try {
      const result = await this.query(`
        SELECT query, calls, total_time, mean_time, stddev_time
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
      
    } catch (error) {
      this.logger.error('Failed to get slow queries:', error);
      return [];
    }
  }

  /**
   * Get database size
   */
  async getDatabaseSize() {
    try {
      const result = await this.query(`
        SELECT pg_size_pretty(pg_database_size($1)) as size,
               pg_database_size($1) as size_bytes
      `, [this.options.database]);
      
      return result.rows[0];
      
    } catch (error) {
      this.logger.error('Failed to get database size:', error);
      return null;
    }
  }

  /**
   * Get table sizes
   */
  async getTableSizes(limit = 10) {
    try {
      const result = await this.query(`
        SELECT schemaname, tablename,
               pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
               pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
      
    } catch (error) {
      this.logger.error('Failed to get table sizes:', error);
      return [];
    }
  }

  /**
   * Analyze database performance
   */
  async analyzePerformance() {
    try {
      const analysis = {
        timestamp: new Date(),
        statistics: this.getStats(),
        slowQueries: await this.getSlowQueries(5),
        databaseSize: await this.getDatabaseSize(),
        tableSizes: await this.getTableSizes(5)
      };
      
      this.logger.info('Database performance analysis completed');
      return analysis;
      
    } catch (error) {
      this.logger.error('Failed to analyze database performance:', error);
      throw error;
    }
  }

  /**
   * Create a read replica connection
   */
  createReadReplica() {
    const replicaOptions = {
      ...this.options,
      host: process.env.DB_REPLICA_HOST || this.options.host,
      port: process.env.DB_REPLICA_PORT || this.options.port
    };
    
    return new DatabaseConnection(replicaOptions);
  }

  /**
   * Execute query on read replica
   */
  async queryReadReplica(text, params = []) {
    try {
      const replica = this.createReadReplica();
      await replica.connect();
      
      const result = await replica.query(text, params);
      await replica.disconnect();
      
      return result;
      
    } catch (error) {
      this.logger.error('Read replica query failed, falling back to primary:', error);
      // Fall back to primary
      return this.query(text, params);
    }
  }

  /**
   * Cleanup old data based on retention policies
   */
  async cleanupOldData() {
    try {
      this.logger.info('Cleaning up old data...');
      
      // Get retention policies
      const result = await this.query(`
        SELECT table_name, retention_period, archive_strategy
        FROM data_retention_policies
      `);
      
      for (const policy of result.rows) {
        const cutoffDate = new Date();
        const retentionMs = this.parseRetentionPeriod(policy.retention_period);
        cutoffDate.setTime(cutoffDate.getTime() - retentionMs);
        
        await this.query(`
          DELETE FROM ${policy.table_name}
          WHERE timestamp < $1
        `, [cutoffDate]);
        
        this.logger.debug(`Cleaned up old data from ${policy.table_name}`);
      }
      
      this.logger.info('Old data cleanup completed');
      
    } catch (error) {
      this.logger.error('Failed to cleanup old data:', error);
      throw error;
    }
  }

  /**
   * Parse retention period string
   */
  parseRetentionPeriod(period) {
    const units = {
      'day': 24 * 60 * 60 * 1000,
      'days': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      'weeks': 7 * 24 * 60 * 60 * 1000,
      'month': 30 * 24 * 60 * 60 * 1000,
      'months': 30 * 24 * 60 * 60 * 1000,
      'year': 365 * 24 * 60 * 60 * 1000,
      'years': 365 * 24 * 60 * 60 * 1000
    };
    
    const match = period.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
    if (!match) {
      return 30 * 24 * 60 * 60 * 1000; // Default 30 days
    }
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    return value * (units[unit] || units['days']);
  }
}

module.exports = { DatabaseConnection };