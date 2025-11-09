/**
 * Database Performance Monitoring Service
 * Tracks database performance, slow queries, connection pools, and optimization opportunities
 */

const { EventEmitter } = require('events');
const { Logger } = require('../utilities/logger');
const { DatabaseConnection } = require('../utilities/database-connection');
const { AlertingService } = require('./alerting-service');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

class DatabaseMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      connection: options.connection,
      slowQueryThreshold: options.slowQueryThreshold || 1000, // milliseconds
      enableQueryAnalysis: options.enableQueryAnalysis !== false,
      enableConnectionTracking: options.enableConnectionTracking !== false,
      enableLockMonitoring: options.enableLockMonitoring !== false,
      enableCacheMetrics: options.enableCacheMetrics !== false,
      maxSlowQueries: options.maxSlowQueries || 1000,
      collectionInterval: options.collectionInterval || 30000, // 30 seconds
      enableOptimizationSuggestions: options.enableOptimizationSuggestions !== false,
      enablePerformanceBaselines: options.enablePerformanceBaselines !== false,
      ...options
    };

    this.isRunning = false;
    this.logger = new Logger('DatabaseMonitor');
    this.db = null;
    this.alertingService = null;
    
    // Database connection management
    this.dbConnections = new Map();
    this.connectionPools = new Map();
    
    // Performance metrics
    this.metrics = {
      connections: {
        active: 0,
        idle: 0,
        total: 0,
        poolUtilization: 0
      },
      queries: {
        total: 0,
        successful: 0,
        failed: 0,
        slow: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0
      },
      transactions: {
        total: 0,
        committed: 0,
        rolledBack: 0,
        averageTime: 0
      },
      locks: {
        waits: 0,
        deadlocks: 0,
        timeouts: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0
      }
    };
    
    // Query tracking
    this.slowQueries = [];
    this.queryHistory = [];
    this.connectionHistory = [];
    
    // Performance baselines
    this.baselines = new Map();
    
    // Statistics
    this.counters = {
      queriesAnalyzed: 0,
      slowQueriesTracked: 0,
      optimizationSuggestions: 0,
      connectionIssues: 0,
      lockWaitTime: 0,
      queriesOptimized: 0
    };
    
    // Database specific configuration
    this.databaseConfig = {
      type: this.detectDatabaseType(),
      version: null,
      features: new Set(),
      maxConnections: 100,
      defaultTimeout: 30000
    };
    
    // Performance thresholds
    this.thresholds = {
      slowQuery: this.options.slowQueryThreshold,
      connectionPoolUtilization: 85,
      errorRate: 5,
      lockWaitTime: 5000,
      cacheHitRate: 80
    };
  }

  /**
   * Initialize the database monitor
   */
  async initialize() {
    try {
      this.logger.info('Initializing Database Monitor...');
      
      // Initialize main database connection for monitoring
      this.db = new DatabaseConnection();
      await this.db.connect();
      
      // Initialize database-specific monitoring
      await this.initializeDatabaseSpecificMonitoring();
      
      // Initialize alerting service
      this.alertingService = new AlertingService();
      await this.alertingService.initialize();
      
      // Load performance baselines
      if (this.options.enablePerformanceBaselines) {
        await this.loadPerformanceBaselines();
      }
      
      this.logger.info('Database Monitor initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Database Monitor:', error);
      throw error;
    }
  }

  /**
   * Start the database monitor
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('Database Monitor is already running');
      return;
    }

    try {
      await this.initialize();
      
      this.isRunning = true;
      this.logger.info('Database Monitor started');
      
      // Start performance collection interval
      this.collectionInterval = setInterval(() => {
        this.collectDatabaseMetrics();
      }, this.options.collectionInterval);
      
      // Start connection monitoring
      if (this.options.enableConnectionTracking) {
        this.connectionMonitoringInterval = setInterval(() => {
          this.monitorConnections();
        }, 10000); // Every 10 seconds
      }
      
      // Start slow query analysis
      this.slowQueryAnalysisInterval = setInterval(() => {
        this.analyzeSlowQueries();
      }, 60000); // Every minute
      
      // Start optimization analysis
      if (this.options.enableOptimizationSuggestions) {
        this.optimizationAnalysisInterval = setInterval(() => {
          this.analyzeOptimizationOpportunities();
        }, 300000); // Every 5 minutes
      }
      
      // Start cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldData();
      }, 3600000); // Every hour
      
      this.emit('started', {
        timestamp: new Date().toISOString(),
        databaseType: this.databaseConfig.type,
        options: this.options
      });
      
    } catch (error) {
      this.logger.error('Failed to start Database Monitor:', error);
      throw error;
    }
  }

  /**
   * Stop the database monitor
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear intervals
    for (const interval of [
      this.collectionInterval,
      this.connectionMonitoringInterval,
      this.slowQueryAnalysisInterval,
      this.optimizationAnalysisInterval,
      this.cleanupInterval
    ]) {
      if (interval) clearInterval(interval);
    }
    
    // Close all monitored connections
    for (const [key, connection] of this.dbConnections) {
      if (connection && connection.end) {
        connection.end();
      }
    }
    
    this.logger.info('Database Monitor stopped');
    
    this.emit('stopped', {
      timestamp: new Date().toISOString(),
      counters: this.counters
    });
  }

  /**
   * Monitor a database query
   */
  async monitorQuery(query, params = [], options = {}) {
    const startTime = process.hrtime.bigint();
    const queryId = uuidv4();
    const queryName = options.name || 'unnamed_query';
    
    try {
      // Get database connection
      const client = await this.getConnection();
      
      // Execute query with monitoring
      const result = await client.query(query, params);
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      // Analyze query performance
      const queryMetrics = {
        id: queryId,
        name: queryName,
        query: query,
        params: params,
        executionTime: executionTime,
        rowsAffected: result.rowCount || 0,
        timestamp: new Date(),
        success: true,
        connectionId: client.processID || 'unknown',
        database: this.databaseConfig.type,
        options: options
      };
      
      // Store query metrics
      this.storeQueryMetrics(queryMetrics);
      
      // Check for slow queries
      if (executionTime > this.options.slowQueryThreshold) {
        this.handleSlowQuery(queryMetrics);
      }
      
      // Update metrics
      this.updateQueryMetrics(queryMetrics);
      
      this.counters.queriesAnalyzed++;
      
      return result;
      
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;
      
      const errorMetrics = {
        id: queryId,
        name: queryName,
        query: query,
        params: params,
        executionTime: executionTime,
        error: error.message,
        timestamp: new Date(),
        success: false,
        errorType: error.constructor.name,
        database: this.databaseConfig.type
      };
      
      this.storeQueryMetrics(errorMetrics);
      this.updateQueryMetrics(errorMetrics);
      
      throw error;
      
    } finally {
      // Release connection back to pool
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Collect database performance metrics
   */
  async collectDatabaseMetrics() {
    try {
      // Get database-specific metrics
      const databaseMetrics = await this.getDatabaseSpecificMetrics();
      
      // Update connection metrics
      await this.updateConnectionMetrics();
      
      // Update cache metrics
      if (this.options.enableCacheMetrics) {
        await this.updateCacheMetrics();
      }
      
      // Update lock metrics
      if (this.options.enableLockMonitoring) {
        await this.updateLockMetrics();
      }
      
      // Store metrics in database
      if (this.db) {
        await this.storeMetricsInDatabase(databaseMetrics);
      }
      
      // Check for alerts
      if (this.alertingService) {
        await this.checkDatabaseAlerts(databaseMetrics);
      }
      
      // Emit metrics event
      this.emit('metrics', {
        timestamp: new Date(),
        metrics: this.metrics,
        databaseMetrics
      });
      
    } catch (error) {
      this.logger.error('Error collecting database metrics:', error);
    }
  }

  /**
   * Get database-specific metrics
   */
  async getDatabaseSpecificMetrics() {
    const dbType = this.databaseConfig.type;
    
    switch (dbType) {
      case 'postgresql':
        return this.getPostgreSQLMetrics();
      case 'mysql':
        return this.getMySQLMetrics();
      case 'mongodb':
        return this.getMongoDBMetrics();
      default:
        return this.getGenericDatabaseMetrics();
    }
  }

  /**
   * Get PostgreSQL-specific metrics
   */
  async getPostgreSQLMetrics() {
    try {
      const client = await this.getConnection();
      
      // Get database statistics
      const statsQuery = `
        SELECT 
          numbackends as connections,
          xact_commit as transactions_committed,
          xact_rollback as transactions_rolledback,
          blks_read as blocks_read,
          blks_hit as blocks_hit,
          tup_returned as tuples_returned,
          tup_fetched as tuples_fetched,
          tup_inserted as tuples_inserted,
          tup_updated as tuples_updated,
          tup_deleted as tuples_deleted
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;
      
      const statsResult = await client.query(statsQuery);
      const stats = statsResult.rows[0] || {};
      
      // Get connection pool info
      const poolQuery = `
        SELECT state, count(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `;
      
      const poolResult = await client.query(poolQuery);
      const connectionStats = {};
      poolResult.rows.forEach(row => {
        connectionStats[row.state] = parseInt(row.count);
      });
      
      // Get slow queries (if pg_stat_statements is available)
      let slowQueries = [];
      try {
        const slowQueryResult = await client.query(`
          SELECT query, calls, total_time, mean_time, stddev_time
          FROM pg_stat_statements
          WHERE mean_time > $1
          ORDER BY mean_time DESC
          LIMIT 10
        `, [this.options.slowQueryThreshold]);
        
        slowQueries = slowQueryResult.rows;
      } catch (error) {
        // pg_stat_statements not available
      }
      
      await client.release();
      
      return {
        type: 'postgresql',
        connections: {
          active: connectionStats.active || 0,
          idle: connectionStats.idle || 0,
          idleintransaction: connectionStats['idle in transaction'] || 0,
          total: stats.connections || 0
        },
        transactions: {
          committed: parseInt(stats.transactions_committed) || 0,
          rolledBack: parseInt(stats.transactions_rolledback) || 0
        },
        cache: {
          hitRatio: stats.blocks_hit > 0 
            ? (stats.blocks_hit / (stats.blocks_read + stats.blocks_hit)) * 100 
            : 100,
          hit: parseInt(stats.blocks_hit) || 0,
          read: parseInt(stats.blocks_read) || 0
        },
        slowQueries: slowQueries.map(q => ({
          query: q.query.substring(0, 200),
          calls: parseInt(q.calls),
          totalTime: parseFloat(q.total_time),
          meanTime: parseFloat(q.mean_time),
          stddevTime: parseFloat(q.stddev_time)
        }))
      };
      
    } catch (error) {
      this.logger.error('Failed to get PostgreSQL metrics:', error);
      return { type: 'postgresql', error: error.message };
    }
  }

  /**
   * Get MySQL-specific metrics
   */
  async getMySQLMetrics() {
    try {
      const client = await this.getConnection();
      
      // Get connection stats
      const connectionResult = await client.query(`
        SHOW GLOBAL STATUS 
        WHERE Variable_name IN (
          'Threads_connected', 'Threads_running', 'Connections', 'Max_used_connections',
          'Questions', 'Queries', 'Slow_queries', 'Uptime'
        )
      `);
      
      const connectionStats = {};
      connectionResult.rows.forEach(row => {
        connectionStats[row.Variable_name] = parseInt(row.Value);
      });
      
      // Get InnoDB stats
      const innodbResult = await client.query(`
        SHOW GLOBAL STATUS 
        WHERE Variable_name IN (
          'Innodb_buffer_pool_read_requests', 'Innodb_buffer_pool_reads',
          'Innodb_buffer_pool_pages_data', 'Innodb_buffer_pool_pages_total'
        )
      `);
      
      const innodbStats = {};
      innodbResult.rows.forEach(row => {
        innodbStats[row.Variable_name] = parseInt(row.Value);
      });
      
      await client.release();
      
      return {
        type: 'mysql',
        connections: {
          connected: connectionStats.Threads_connected || 0,
          running: connectionStats.Threads_running || 0,
          total: connectionStats.Max_used_connections || 0
        },
        queries: {
          total: connectionStats.Questions || 0,
          slow: connectionStats.Slow_queries || 0,
          perSecond: connectionStats.Questions / (connectionStats.Uptime || 1)
        },
        cache: {
          hitRatio: innodbStats.Innodb_buffer_pool_read_requests > 0
            ? ((innodbStats.Innodb_buffer_pool_read_requests - innodbStats.Innodb_buffer_pool_reads) / 
               innodbStats.Innodb_buffer_pool_read_requests) * 100
            : 100,
          readRequests: innodbStats.Innodb_buffer_pool_read_requests || 0,
          reads: innodbStats.Innodb_buffer_pool_reads || 0
        }
      };
      
    } catch (error) {
      this.logger.error('Failed to get MySQL metrics:', error);
      return { type: 'mysql', error: error.message };
    }
  }

  /**
   * Get generic database metrics
   */
  async getGenericDatabaseMetrics() {
    // Fallback for unsupported database types
    return {
      type: this.databaseConfig.type,
      connections: this.metrics.connections,
      queries: this.metrics.queries,
      error: 'Database type not supported for detailed metrics'
    };
  }

  /**
   * Update connection metrics
   */
  async updateConnectionMetrics() {
    try {
      const dbType = this.databaseConfig.type;
      
      let connectionInfo = null;
      
      switch (dbType) {
        case 'postgresql':
          const pgResult = await this.db.query(`
            SELECT count(*) as total_connections
            FROM pg_stat_activity
          `);
          connectionInfo = { total: parseInt(pgResult.rows[0].total_connections) };
          break;
          
        case 'mysql':
          const mysqlResult = await this.db.query('SHOW STATUS LIKE "Threads_connected"');
          connectionInfo = { total: parseInt(mysqlResult[0]?.Value || 0) };
          break;
      }
      
      if (connectionInfo) {
        this.metrics.connections.total = connectionInfo.total;
        this.metrics.connections.poolUtilization = 
          (connectionInfo.total / this.databaseConfig.maxConnections) * 100;
      }
      
    } catch (error) {
      this.logger.error('Failed to update connection metrics:', error);
    }
  }

  /**
   * Update cache metrics
   */
  async updateCacheMetrics() {
    try {
      // This would be database-specific
      // For now, use calculated values from query history
      
      const totalQueries = this.metrics.queries.total;
      const cacheHits = Math.floor(totalQueries * 0.85); // Estimated 85% cache hit rate
      const cacheMisses = totalQueries - cacheHits;
      
      this.metrics.cache.hits = cacheHits;
      this.metrics.cache.misses = cacheMisses;
      this.metrics.cache.hitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 100;
      
    } catch (error) {
      this.logger.error('Failed to update cache metrics:', error);
    }
  }

  /**
   * Update lock metrics
   */
  async updateLockMetrics() {
    try {
      // This would be database-specific
      // For now, use placeholder values
      this.metrics.locks.waits = Math.floor(Math.random() * 10);
      this.metrics.locks.deadlocks = Math.floor(Math.random() * 3);
      this.metrics.locks.timeouts = Math.floor(Math.random() * 5);
      
    } catch (error) {
      this.logger.error('Failed to update lock metrics:', error);
    }
  }

  /**
   * Handle slow query detection
   */
  handleSlowQuery(queryMetrics) {
    try {
      this.slowQueries.push(queryMetrics);
      this.counters.slowQueriesTracked++;
      
      // Keep only recent slow queries
      if (this.slowQueries.length > this.options.maxSlowQueries) {
        this.slowQueries = this.slowQueries.slice(-this.options.maxSlowQueries);
      }
      
      // Emit slow query event
      this.emit('slowQuery', queryMetrics);
      
      // Analyze query for optimization opportunities
      if (this.options.enableQueryAnalysis) {
        this.analyzeQueryForOptimization(queryMetrics);
      }
      
    } catch (error) {
      this.logger.error('Error handling slow query:', error);
    }
  }

  /**
   * Analyze query for optimization opportunities
   */
  analyzeQueryForOptimization(queryMetrics) {
    try {
      const suggestions = [];
      const query = queryMetrics.query.toLowerCase();
      
      // Check for missing indexes
      if (query.includes('where') && !query.includes('explain')) {
        const whereClause = this.extractWhereClause(query);
        if (whereClause && !this.hasIndex(queryMetrics.query)) {
          suggestions.push({
            type: 'missing_index',
            severity: 'medium',
            description: `Consider adding an index for WHERE clause: ${whereClause}`,
            query: queryMetrics.query,
            impact: 'Could improve query performance significantly'
          });
        }
      }
      
      // Check for SELECT *
      if (query.includes('select *')) {
        suggestions.push({
          type: 'select_star',
          severity: 'low',
          description: 'Avoid SELECT * - specify only needed columns',
          impact: 'Reduces I/O and network transfer'
        });
      }
      
      // Check for N+1 query patterns
      if (query.includes('for each') || query.includes('loop')) {
        suggestions.push({
          type: 'n_plus_one',
          severity: 'high',
          description: 'Potential N+1 query pattern detected',
          impact: 'Can cause significant performance issues'
        });
      }
      
      // Check for subqueries
      if (query.includes('select') && query.includes('(select')) {
        suggestions.push({
          type: 'subquery',
          severity: 'medium',
          description: 'Consider converting subquery to JOIN for better performance',
          impact: 'May improve query execution time'
        });
      }
      
      if (suggestions.length > 0) {
        queryMetrics.optimizationSuggestions = suggestions;
        this.counters.optimizationSuggestions += suggestions.length;
        
        this.emit('optimizationSuggestions', {
          queryId: queryMetrics.id,
          suggestions
        });
      }
      
    } catch (error) {
      this.logger.error('Error analyzing query for optimization:', error);
    }
  }

  /**
   * Update query metrics
   */
  updateQueryMetrics(queryMetrics) {
    const queries = this.metrics.queries;
    
    queries.total++;
    
    if (queryMetrics.success) {
      queries.successful++;
    } else {
      queries.failed++;
    }
    
    if (queryMetrics.executionTime > this.options.slowQueryThreshold) {
      queries.slow++;
    }
    
    // Update timing metrics
    queries.minTime = Math.min(queries.minTime, queryMetrics.executionTime);
    queries.maxTime = Math.max(queries.maxTime, queryMetrics.executionTime);
    
    // Calculate running average
    queries.averageTime = ((queries.averageTime * (queries.total - 1)) + queryMetrics.executionTime) / queries.total;
    
    // Calculate percentiles (simplified)
    this.calculateQueryPercentiles();
  }

  /**
   * Calculate query response time percentiles
   */
  calculateQueryPercentiles() {
    if (this.queryHistory.length < 10) {
      return; // Need more samples
    }
    
    const responseTimes = this.queryHistory
      .slice(-1000) // Use last 1000 queries
      .map(q => q.executionTime)
      .sort((a, b) => a - b);
    
    const percentiles = [50, 90, 95, 99];
    
    percentiles.forEach(p => {
      const index = Math.ceil((p / 100) * responseTimes.length) - 1;
      const percentileKey = `p${p}`;
      this.metrics.queries[percentileKey] = responseTimes[Math.max(0, index)];
    });
  }

  /**
   * Store query metrics in database
   */
  async storeQueryMetrics(queryMetrics) {
    try {
      const client = await this.db.getClient();
      
      await client.query(
        `INSERT INTO database_metrics 
         (timestamp, database_name, metric_type, metric_name, metric_value, metric_unit, 
          query_hash, query_text, execution_time_ms, rows_affected, connection_id, 
          session_id, tags, metadata)
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          queryMetrics.timestamp,
          this.databaseConfig.type,
          'query',
          queryMetrics.success ? 'query_duration' : 'query_error',
          queryMetrics.executionTime,
          'milliseconds',
          this.hashQuery(queryMetrics.query),
          this.anonymizeQuery(queryMetrics.query),
          queryMetrics.executionTime,
          queryMetrics.rowsAffected || 0,
          queryMetrics.connectionId,
          queryMetrics.sessionId,
          JSON.stringify({
            name: queryMetrics.name,
            success: queryMetrics.success,
            error: queryMetrics.error
          }),
          JSON.stringify(queryMetrics.options || {})
        ]
      );
      
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to store query metrics:', error);
    }
  }

  /**
   * Store metrics in database
   */
  async storeMetricsInDatabase(databaseMetrics) {
    try {
      const client = await this.db.getClient();
      
      // Store connection metrics
      await client.query(
        `INSERT INTO database_metrics 
         (timestamp, database_name, metric_type, metric_name, metric_value, metric_unit)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          new Date(),
          this.databaseConfig.type,
          'connection',
          'active_connections',
          this.metrics.connections.active,
          'count'
        ]
      );
      
      // Store query performance metrics
      await client.query(
        `INSERT INTO database_metrics 
         (timestamp, database_name, metric_type, metric_name, metric_value, metric_unit)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          new Date(),
          this.databaseConfig.type,
          'query',
          'total_queries',
          this.metrics.queries.total,
          'count'
        ]
      );
      
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to store metrics in database:', error);
    }
  }

  /**
   * Check for database-specific alerts
   */
  async checkDatabaseAlerts(databaseMetrics) {
    try {
      const alerts = [];
      
      // Connection pool utilization alert
      if (this.metrics.connections.poolUtilization > this.thresholds.connectionPoolUtilization) {
        alerts.push({
          rule: 'high_connection_pool_utilization',
          metric: 'connection_pool_utilization',
          value: this.metrics.connections.poolUtilization,
          threshold: this.thresholds.connectionPoolUtilization,
          severity: this.metrics.connections.poolUtilization > 95 ? 'critical' : 'warning'
        });
      }
      
      // Query error rate alert
      const errorRate = (this.metrics.queries.failed / this.metrics.queries.total) * 100;
      if (errorRate > this.thresholds.errorRate) {
        alerts.push({
          rule: 'high_query_error_rate',
          metric: 'query_error_rate',
          value: errorRate,
          threshold: this.thresholds.errorRate,
          severity: errorRate > 10 ? 'critical' : 'warning'
        });
      }
      
      // Cache hit rate alert
      if (this.metrics.cache.hitRate < this.thresholds.cacheHitRate) {
        alerts.push({
          rule: 'low_cache_hit_rate',
          metric: 'cache_hit_rate',
          value: this.metrics.cache.hitRate,
          threshold: this.thresholds.cacheHitRate,
          severity: 'warning'
        });
      }
      
      // Trigger alerts
      for (const alert of alerts) {
        this.emit('alert', {
          ...alert,
          timestamp: new Date(),
          source: 'database_monitor'
        });
        
        if (this.alertingService) {
          await this.alertingService.triggerAlert(alert);
        }
      }
      
    } catch (error) {
      this.logger.error('Error checking database alerts:', error);
    }
  }

  /**
   * Get database connection
   */
  async getConnection() {
    if (!this.db) {
      throw new Error('Database monitor not initialized');
    }
    
    return await this.db.getClient();
  }

  /**
   * Detect database type
   */
  detectDatabaseType() {
    const connectionString = this.options.connection;
    
    if (connectionString) {
      if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) {
        return 'postgresql';
      } else if (connectionString.startsWith('mysql://')) {
        return 'mysql';
      } else if (connectionString.startsWith('mongodb://') || connectionString.startsWith('mongodb+srv://')) {
        return 'mongodb';
      }
    }
    
    // Default to PostgreSQL
    return 'postgresql';
  }

  /**
   * Initialize database-specific monitoring
   */
  async initializeDatabaseSpecificMonitoring() {
    const dbType = this.databaseConfig.type;
    
    try {
      // Check database version and features
      const client = await this.getConnection();
      
      switch (dbType) {
        case 'postgresql':
          const versionResult = await client.query('SELECT version()');
          this.databaseConfig.version = versionResult.rows[0].version;
          break;
          
        case 'mysql':
          const mysqlVersionResult = await client.query('SELECT VERSION() as version');
          this.databaseConfig.version = mysqlVersionResult.rows[0].version;
          break;
      }
      
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to initialize database-specific monitoring:', error);
    }
  }

  /**
   * Monitor connections
   */
  async monitorConnections() {
    try {
      // This would implement connection monitoring logic
      // For now, just update basic connection info
      
      if (this.db) {
        await this.updateConnectionMetrics();
      }
      
    } catch (error) {
      this.logger.error('Error monitoring connections:', error);
      this.counters.connectionIssues++;
    }
  }

  /**
   * Analyze slow queries
   */
  analyzeSlowQueries() {
    try {
      // Analyze patterns in slow queries
      const recentSlowQueries = this.slowQueries.slice(-50);
      
      // Group by query pattern
      const queryPatterns = new Map();
      
      recentSlowQueries.forEach(query => {
        const pattern = this.normalizeQuery(query.query);
        if (!queryPatterns.has(pattern)) {
          queryPatterns.set(pattern, {
            pattern,
            count: 0,
            totalTime: 0,
            averageTime: 0,
            queries: []
          });
        }
        
        const patternData = queryPatterns.get(pattern);
        patternData.count++;
        patternData.totalTime += query.executionTime;
        patternData.queries.push(query);
      });
      
      // Calculate averages and emit analysis
      for (const [pattern, data] of queryPatterns) {
        data.averageTime = data.totalTime / data.count;
        
        if (data.count > 3) { // Only report patterns with multiple occurrences
          this.emit('queryPatternAnalysis', {
            pattern: data.pattern,
            count: data.count,
            averageTime: data.averageTime,
            totalTime: data.totalTime
          });
        }
      }
      
    } catch (error) {
      this.logger.error('Error analyzing slow queries:', error);
    }
  }

  /**
   * Analyze optimization opportunities
   */
  analyzeOptimizationOpportunities() {
    try {
      const opportunities = [];
      
      // Analyze slow query patterns
      const slowQueryCount = this.slowQueries.length;
      if (slowQueryCount > 10) {
        opportunities.push({
          type: 'slow_queries',
          severity: 'high',
          description: `High number of slow queries (${slowQueryCount}) detected`,
          impact: 'Indicates potential performance bottlenecks',
          recommendation: 'Review and optimize slow queries, add missing indexes'
        });
      }
      
      // Analyze connection pool utilization
      if (this.metrics.connections.poolUtilization > 80) {
        opportunities.push({
          type: 'connection_pool',
          severity: 'medium',
          description: `High connection pool utilization (${this.metrics.connections.poolUtilization.toFixed(1)}%)`,
          impact: 'May lead to connection timeouts',
          recommendation: 'Consider increasing connection pool size or optimizing queries'
        });
      }
      
      // Analyze cache hit rate
      if (this.metrics.cache.hitRate < 85) {
        opportunities.push({
          type: 'cache_performance',
          severity: 'medium',
          description: `Low cache hit rate (${this.metrics.cache.hitRate.toFixed(1)}%)`,
          impact: 'Increased database load and slower response times',
          recommendation: 'Review cache configuration and query patterns'
        });
      }
      
      if (opportunities.length > 0) {
        this.emit('optimizationOpportunities', opportunities);
      }
      
    } catch (error) {
      this.logger.error('Error analyzing optimization opportunities:', error);
    }
  }

  /**
   * Clean up old data
   */
  cleanupOldData() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    const cutoff = Date.now() - maxAge;
    
    // Clean up old slow queries
    this.slowQueries = this.slowQueries.filter(
      query => query.timestamp.getTime() > cutoff
    );
    
    // Clean up old query history
    this.queryHistory = this.queryHistory.filter(
      query => query.timestamp.getTime() > cutoff
    );
    
    // Clean up connection history
    this.connectionHistory = this.connectionHistory.filter(
      conn => conn.timestamp.getTime() > cutoff
    );
    
    this.logger.debug('Cleaned up old database monitoring data');
  }

  /**
   * Store query in history
   */
  storeQueryMetrics(queryMetrics) {
    this.queryHistory.push(queryMetrics);
    
    // Keep only recent queries in memory
    if (this.queryHistory.length > 10000) {
      this.queryHistory = this.queryHistory.slice(-5000);
    }
  }

  /**
   * Hash query for storage
   */
  hashQuery(query) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(query).digest('hex');
  }

  /**
   * Anonymize query for storage (remove sensitive data)
   */
  anonymizeQuery(query) {
    // Remove string literals and replace with placeholder
    return query
      .replace(/'[^']*'/g, "'?''")
      .replace(/"[^"]*"/g, '"?"')
      .replace(/\b\d+\b/g, '?')
      .substring(0, 500); // Limit length
  }

  /**
   * Extract WHERE clause from query
   */
  extractWhereClause(query) {
    const whereMatch = query.match(/where\s+(.+?)(?:\s+group\s+by|\s+order\s+by|\s+limit|\s*;|$)/i);
    return whereMatch ? whereMatch[1].trim() : null;
  }

  /**
   * Check if query has indexes (simplified)
   */
  hasIndex(query) {
    // This is a simplified check - in reality, you'd query the database metadata
    return query.includes('index') || query.includes('using');
  }

  /**
   * Normalize query for pattern matching
   */
  normalizeQuery(query) {
    return query
      .replace(/\s+/g, ' ')
      .replace(/'[^']*'/g, '?')
      .replace(/"[^"]*"/g, '?')
      .replace(/\b\d+\b/g, '?')
      .trim();
  }

  /**
   * Load performance baselines
   */
  async loadPerformanceBaselines() {
    try {
      // This would load baselines from database
      // For now, set default baselines
      this.baselines.set('query_time', {
        p50: 100,
        p90: 500,
        p95: 1000,
        p99: 2000
      });
      
      this.baselines.set('connection_pool', {
        maxUtilization: 80
      });
      
    } catch (error) {
      this.logger.error('Failed to load performance baselines:', error);
    }
  }

  /**
   * Get current database monitor status
   */
  getDatabaseMonitorStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date().toISOString(),
      databaseType: this.databaseConfig.type,
      databaseVersion: this.databaseConfig.version,
      metrics: this.metrics,
      counters: this.counters,
      slowQueriesCount: this.slowQueries.length,
      recentQueriesCount: this.queryHistory.length,
      options: this.options
    };
  }
}

module.exports = { DatabaseMonitor };