/**
 * Database Monitoring Configuration
 */

module.exports = {
  // Database connection settings
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'performance_monitoring',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  },

  // Monitoring settings
  monitoring: {
    enabled: process.env.DB_MONITORING_ENABLED === 'true',
    interval: parseInt(process.env.DB_MONITOR_INTERVAL) || 30000, // 30 seconds
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000, // milliseconds
    enableQueryPlanAnalysis: process.env.ENABLE_QUERY_PLAN === 'true',
    enableConnectionTracking: true,
    enableLockMonitoring: true,
    enableCacheMetrics: true,
  },

  // Metrics collection
  metrics: {
    // Query performance metrics
    queryPerformance: {
      collectionInterval: 15000, // 15 seconds
      retentionPeriod: '30d',
      includeSlowQueries: true,
      maxSlowQueries: 1000,
    },

    // Connection pool metrics
    connectionPool: {
      collectionInterval: 10000, // 10 seconds
      trackWaitTime: true,
      trackIdleTime: true,
      maxPoolSize: 100,
    },

    // Database statistics
    databaseStats: {
      collectionInterval: 60000, // 1 minute
      trackTableSizes: true,
      trackIndexUsage: true,
      trackCacheHitRatio: true,
    },

    // Transaction metrics
    transactions: {
      collectionInterval: 20000, // 20 seconds
      trackCommitRate: true,
      trackRollbackRate: true,
      trackDeadlocks: true,
    },
  },

  // Alerts configuration
  alerts: {
    slowQuery: {
      enabled: true,
      threshold: parseInt(process.env.DB_SLOW_QUERY_ALERT_THRESHOLD) || 2000,
      duration: 60000, // 1 minute
      severity: 'warning',
    },
    
    connectionPoolExhaustion: {
      enabled: true,
      threshold: 90, // 90% of pool exhausted
      duration: 30000, // 30 seconds
      severity: 'critical',
    },
    
    highQueryErrorRate: {
      enabled: true,
      threshold: 5, // 5% error rate
      duration: 60000, // 1 minute
      severity: 'critical',
    },
    
    deadlockDetected: {
      enabled: true,
      severity: 'critical',
      immediateAlert: true,
    },
    
    lowCacheHitRatio: {
      enabled: true,
      threshold: 80, // 80% cache hit ratio
      duration: 300000, // 5 minutes
      severity: 'warning',
    },
    
    databaseDiskSpace: {
      enabled: true,
      threshold: 90, // 90% disk usage
      duration: 300000, // 5 minutes
      severity: 'critical',
    },
  },

  // Logging configuration
  logging: {
    level: process.env.DB_LOG_LEVEL || 'info',
    enableSlowQueryLogging: true,
    enableConnectionLogging: true,
    enableErrorLogging: true,
    logFile: process.env.DB_LOG_FILE || 'logs/database-monitor.log',
    maxLogSize: '10MB',
    maxFiles: 5,
  },

  // Performance optimization recommendations
  optimization: {
    enableRecommendations: true,
    recommendationInterval: 3600000, // 1 hour
    maxRecommendations: 50,
    includeIndexSuggestions: true,
    includeQueryOptimization: true,
    includeConnectionOptimization: true,
  },

  // Data retention policies
  retention: {
    detailedMetrics: '7d', // Keep detailed metrics for 7 days
    summaryMetrics: '90d', // Keep summary metrics for 90 days
    slowQueries: '30d', // Keep slow query logs for 30 days
    errorLogs: '30d', // Keep error logs for 30 days
    optimizationSuggestions: '60d', // Keep suggestions for 60 days
  },

  // Database-specific configurations
  postgresql: {
    enablePgStatStatements: true,
    enablePgStatUserTables: true,
    enablePgStatUserIndexes: true,
    enablePgLocks: true,
    maxConnections: 100,
    sharedPreloadLibraries: ['pg_stat_statements'],
  },

  mysql: {
    enablePerformanceSchema: true,
    enableSlowQueryLog: true,
    slowQueryLogTime: 2, // seconds
    maxConnections: 151,
  },

  // Aggregation settings
  aggregation: {
    enabled: true,
    intervals: {
      '1m': { retention: '1d' },
      '5m': { retention: '7d' },
      '1h': { retention: '30d' },
      '1d': { retention: '365d' }
    }
  },

  // Export and reporting
  export: {
    enabled: process.env.DB_EXPORT_ENABLED === 'true',
    formats: ['json', 'csv', 'pdf'],
    schedule: '0 0 * * *', // Daily at midnight
    includeRecommendations: true,
    maxExportSize: '100MB',
  },
};