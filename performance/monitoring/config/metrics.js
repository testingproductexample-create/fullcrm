/**
 * Metrics Collection Configuration
 */

module.exports = {
  // General metrics settings
  general: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    collectionInterval: parseInt(process.env.METRICS_COLLECTION_INTERVAL) || 5000, // 5 seconds
    retention: {
      raw: process.env.METRICS_RAW_RETENTION || '7d', // Keep raw data for 7 days
      aggregated: process.env.METRICS_AGGRETATED_RETENTION || '90d', // Keep aggregated data for 90 days
    },
    aggregation: {
      enabled: process.env.METRICS_AGGREGATION_ENABLED !== 'false',
      intervals: {
        '1m': { retention: '1d' },  // 1-minute aggregations for 1 day
        '5m': { retention: '7d' },  // 5-minute aggregations for 7 days
        '1h': { retention: '30d' }, // 1-hour aggregations for 30 days
        '1d': { retention: '365d' } // 1-day aggregations for 1 year
      }
    },
    compression: {
      enabled: process.env.METRICS_COMPRESSION_ENABLED === 'true',
      algorithm: process.env.METRICS_COMPRESSION_ALGORITHM || 'gzip',
      level: parseInt(process.env.METRICS_COMPRESSION_LEVEL) || 6,
    }
  },

  // System metrics configuration
  system: {
    enabled: process.env.SYSTEM_METRICS_ENABLED !== 'false',
    interval: parseInt(process.env.SYSTEM_METRICS_INTERVAL) || 5000,
    
    // CPU metrics
    cpu: {
      enabled: true,
      metrics: [
        'usage_percent',
        'load_average_1m',
        'load_average_5m',
        'load_average_15m',
        'context_switches',
        'interrupts',
        'processes_running',
        'processes_total',
        'threads_running',
        'threads_total'
      ],
      perCore: process.env.CPU_PER_CORE_METRICS === 'true',
    },

    // Memory metrics
    memory: {
      enabled: true,
      metrics: [
        'total',
        'used',
        'free',
        'available',
        'buffers',
        'cached',
        'swap_total',
        'swap_used',
        'swap_free',
        'memory_percent'
      ],
      includeSwap: true,
    },

    // Disk metrics
    disk: {
      enabled: true,
      metrics: [
        'total',
        'used',
        'free',
        'usage_percent',
        'read_bytes',
        'write_bytes',
        'read_count',
        'write_count',
        'read_time',
        'write_time',
        'io_time'
      ],
      includePerDevice: true,
      devices: process.env.DISK_DEVICES ? process.env.DISK_DEVICES.split(',') : ['sda', 'sdb', 'vda', 'nvme0n1'],
    },

    // Network metrics
    network: {
      enabled: true,
      metrics: [
        'bytes_sent',
        'bytes_recv',
        'packets_sent',
        'packets_recv',
        'err_in',
        'err_out',
        'drop_in',
        'drop_out'
      ],
      includePerInterface: true,
      interfaces: process.env.NETWORK_INTERFACES ? process.env.NETWORK_INTERFACES.split(',') : ['eth0', 'wlan0', 'lo'],
    },

    // Process metrics
    process: {
      enabled: true,
      metrics: [
        'cpu_percent',
        'memory_percent',
        'memory_info',
        'num_threads',
        'num_fds',
        'create_time',
        'status'
      ],
      includeChildren: process.env.PROCESS_INCLUDE_CHILDREN === 'true',
      maxProcesses: parseInt(process.env.MAX_PROCESSES_TRACKED) || 100,
    }
  },

  // Application performance metrics
  application: {
    enabled: process.env.APPLICATION_METRICS_ENABLED !== 'false',
    interval: parseInt(process.env.APPLICATION_METRICS_INTERVAL) || 10000,
    
    // HTTP metrics
    http: {
      enabled: true,
      metrics: [
        'requests_total',
        'requests_per_second',
        'request_duration_histogram',
        'response_size_histogram',
        'request_size_histogram',
        'active_requests',
        'requests_by_method',
        'requests_by_status'
      ],
      includeHeaders: false, // For privacy
      sampleRate: parseFloat(process.env.HTTP_METRICS_SAMPLE_RATE) || 1.0,
    },

    // Database metrics
    database: {
      enabled: true,
      metrics: [
        'connections_active',
        'connections_idle',
        'query_duration_histogram',
        'queries_total',
        'queries_slow',
        'transaction_duration_histogram',
        'transaction_commits',
        'transaction_rollbacks'
      ],
      includeSlowQueries: true,
      slowQueryThreshold: parseInt(process.env.SLOW_QUERY_METRIC_THRESHOLD) || 1000,
    },

    // Cache metrics
    cache: {
      enabled: true,
      metrics: [
        'hits_total',
        'misses_total',
        'hit_rate',
        'evictions_total',
        'memory_usage',
        'keys_total'
      ],
      includePerKeyspace: process.env.CACHE_INCLUDE_PER_KEYSPACE === 'true',
    },

    // Message queue metrics
    messageQueue: {
      enabled: process.env.MESSAGE_QUEUE_METRICS_ENABLED === 'true',
      metrics: [
        'messages_published',
        'messages_consumed',
        'queue_depth',
        'processing_time',
        'failed_messages',
        'dead_letter_messages'
      ],
      queues: process.env.MESSAGE_QUEUES ? process.env.MESSAGE_QUEUES.split(',') : [],
    }
  },

  // Frontend performance metrics
  frontend: {
    enabled: process.env.FRONTEND_METRICS_ENABLED !== 'false',
    realUserMonitoring: {
      enabled: process.env.FRONTEND_RUM_ENABLED === 'true',
      sampleRate: parseFloat(process.env.FRONTEND_RUM_SAMPLE_RATE) || 0.1,
    },

    // Core Web Vitals
    webVitals: {
      enabled: true,
      metrics: [
        'first_contentful_paint',
        'largest_contentful_paint',
        'cumulative_layout_shift',
        'first_input_delay',
        'time_to_interactive',
        'total_blocking_time'
      ],
    },

    // Navigation timing
    navigation: {
      enabled: true,
      metrics: [
        'dom_content_loaded',
        'load_event_end',
        'dns_lookup',
        'tcp_connect',
        'request_response',
        'dom_processing'
      ],
    },

    // Resource timing
    resources: {
      enabled: process.env.RESOURCE_TIMING_ENABLED === 'true',
      metrics: [
        'script_load_time',
        'css_load_time',
        'image_load_time',
        'font_load_time',
        'xmlhttprequest_duration'
      ],
      includeResourceTypes: ['script', 'stylesheet', 'image', 'font', 'xmlhttprequest'],
    },

    // User interaction metrics
    userInteraction: {
      enabled: process.env.USER_INTERACTION_METRICS_ENABLED === 'true',
      metrics: [
        'click_latency',
        'scroll_latency',
        'keypress_latency',
        'focus_events',
        'blur_events'
      ],
    }
  },

  // Business metrics
  business: {
    enabled: process.env.BUSINESS_METRICS_ENABLED === 'true',
    interval: parseInt(process.env.BUSINESS_METRICS_INTERVAL) || 60000,
    
    // User metrics
    users: {
      enabled: true,
      metrics: [
        'active_users',
        'new_users',
        'returning_users',
        'session_duration',
        'pages_per_session',
        'bounce_rate',
        'user_engagement_score'
      ],
    },

    // Conversion metrics
    conversions: {
      enabled: true,
      metrics: [
        'conversion_rate',
        'funnel_completion_rate',
        'checkout_abandonment_rate',
        'form_submission_rate',
        'goal_completion_rate'
      ],
    },

    // Revenue metrics
    revenue: {
      enabled: process.env.REVENUE_METRICS_ENABLED === 'true',
      metrics: [
        'revenue_per_user',
        'average_order_value',
        'revenue_per_session',
        'cart_abandonment_rate',
        'lifetime_value'
      ],
    }
  },

  // Security metrics
  security: {
    enabled: process.env.SECURITY_METRICS_ENABLED === 'true',
    interval: parseInt(process.env.SECURITY_METRICS_INTERVAL) || 30000,
    
    // Authentication metrics
    authentication: {
      enabled: true,
      metrics: [
        'login_attempts',
        'successful_logins',
        'failed_logins',
        'password_resets',
        'account_lockouts',
        'session_creations',
        'session_expirations'
      ],
    },

    // Authorization metrics
    authorization: {
      enabled: true,
      metrics: [
        'permission_checks',
        'unauthorized_access_attempts',
        'role_assignments',
        'permission_grants',
        'permission_denials'
      ],
    },

    // Attack detection
    attackDetection: {
      enabled: process.env.ATTACK_DETECTION_METRICS_ENABLED === 'true',
      metrics: [
        'ddos_attacks_detected',
        'sql_injection_attempts',
        'xss_attempts',
        'brute_force_attempts',
        'suspicious_activities'
      ],
    }
  },

  // Infrastructure metrics
  infrastructure: {
    enabled: process.env.INFRASTRUCTURE_METRICS_ENABLED === 'false', // Disabled by default
    
    // Container metrics (Docker/Kubernetes)
    containers: {
      enabled: process.env.CONTAINER_METRICS_ENABLED === 'true',
      metrics: [
        'container_cpu_usage',
        'container_memory_usage',
        'container_network_io',
        'container_disk_io',
        'container_restart_count'
      ],
      includePerContainer: true,
    },

    // Kubernetes metrics
    kubernetes: {
      enabled: process.env.KUBERNETES_METRICS_ENABLED === 'true',
      metrics: [
        'pod_status',
        'deployment_health',
        'node_status',
        'cluster_cpu_utilization',
        'cluster_memory_utilization'
      ],
    },

    // Load balancer metrics
    loadBalancer: {
      enabled: process.env.LOAD_BALANCER_METRICS_ENABLED === 'true',
      metrics: [
        'backend_health',
        'request_routing_time',
        'active_connections',
        'backend_response_time',
        'server_errors'
      ],
    }
  },

  // Metrics export and integration
  export: {
    enabled: process.env.METRICS_EXPORT_ENABLED === 'true',
    
    // Prometheus export
    prometheus: {
      enabled: process.env.PROMETHEUS_EXPORT_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT) || 9090,
      path: process.env.PROMETHEUS_PATH || '/metrics',
      includeHistogram: process.env.PROMETHEUS_INCLUDE_HISTOGRAM === 'true',
    },

    // Graphite export
    graphite: {
      enabled: process.env.GRAPHITE_EXPORT_ENABLED === 'true',
      host: process.env.GRAPHITE_HOST || 'localhost',
      port: parseInt(process.env.GRAPHITE_PORT) || 2003,
      prefix: process.env.GRAPHITE_PREFIX || 'performance.monitoring',
    },

    // InfluxDB export
    influxdb: {
      enabled: process.env.INFLUXDB_EXPORT_ENABLED === 'true',
      host: process.env.INFLUXDB_HOST || 'localhost',
      port: parseInt(process.env.INFLUXDB_PORT) || 8086,
      database: process.env.INFLUXDB_DATABASE || 'performance_monitoring',
      username: process.env.INFLUXDB_USERNAME,
      password: process.env.INFLUXDB_PASSWORD,
    },

    // Elasticsearch export
    elasticsearch: {
      enabled: process.env.ELASTICSEARCH_EXPORT_ENABLED === 'true',
      host: process.env.ELASTICSEARCH_HOST || 'localhost',
      port: parseInt(process.env.ELASTICSEARCH_PORT) || 9200,
      index: process.env.ELASTICSEARCH_INDEX || 'performance-metrics',
    }
  },

  // Metrics processing and analysis
  processing: {
    enabled: process.env.METRICS_PROCESSING_ENABLED !== 'false',
    
    // Anomaly detection
    anomalyDetection: {
      enabled: process.env.ANOMALY_DETECTION_ENABLED === 'true',
      algorithm: process.env.ANOMALY_DETECTION_ALGORITHM || 'zscore', // zscore, isolation_forest, lstm
      sensitivity: parseFloat(process.env.ANOMALY_DETECTION_SENSITIVITY) || 3.0,
      lookbackWindow: parseInt(process.env.ANOMALY_DETECTION_LOOKBACK) || 1440, // 24 hours
    },

    // Forecasting
    forecasting: {
      enabled: process.env.FORECASTING_ENABLED === 'true',
      algorithm: process.env.FORECASTING_ALGORITHM || 'linear_regression', // linear_regression, arima, lstm
      forecastHorizon: parseInt(process.env.FORECASTING_HORIZON) || 1440, // 24 hours
      confidenceInterval: parseFloat(process.env.FORECASTING_CONFIDENCE) || 0.95,
    },

    // Correlation analysis
    correlation: {
      enabled: process.env.CORRELATION_ANALYSIS_ENABLED === 'true',
      correlationThreshold: parseFloat(process.env.CORRELATION_THRESHOLD) || 0.7,
      maxCorrelations: parseInt(process.env.MAX_CORRELATIONS) || 50,
    }
  },

  // Sampling and filtering
  sampling: {
    enabled: process.env.METRICS_SAMPLING_ENABLED === 'true',
    rate: parseFloat(process.env.METRICS_SAMPLE_RATE) || 1.0, // 100% by default
    
    // Adaptive sampling
    adaptive: {
      enabled: process.env.ADAPTIVE_SAMPLING_ENABLED === 'true',
      highLoadThreshold: parseInt(process.env.ADAPTIVE_SAMPLING_LOAD_THRESHOLD) || 80, // CPU %
      lowLoadThreshold: parseInt(process.env.ADAPTIVE_SAMPLING_LOW_THRESHOLD) || 20,
      maxSampleRate: parseFloat(process.env.ADAPTIVE_MAX_SAMPLE_RATE) || 1.0,
      minSampleRate: parseFloat(process.env.ADAPTIVE_MIN_SAMPLE_RATE) || 0.1,
    }
  },

  // Data quality and validation
  quality: {
    enabled: process.env.METRICS_QUALITY_CHECKS_ENABLED === 'true',
    
    // Validation rules
    validation: {
      enabled: true,
      rules: [
        {
          name: 'range_check',
          description: 'Check if metrics are within expected ranges',
          enabled: true,
        },
        {
          name: 'null_check',
          description: 'Check for null or undefined values',
          enabled: true,
        },
        {
          name: 'outlier_detection',
          description: 'Detect statistical outliers',
          enabled: true,
          method: 'iqr', // iqr, zscore, isolation_forest
          threshold: 3.0,
        }
      ]
    },

    // Data completeness
    completeness: {
      enabled: true,
      requiredMetrics: process.env.REQUIRED_METRICS ? process.env.REQUIRED_METRICS.split(',') : [],
      completenessThreshold: parseFloat(process.env.COMPLETENESS_THRESHOLD) || 0.95,
    }
  }
};