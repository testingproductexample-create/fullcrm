/**
 * Dashboard Configuration
 */

module.exports = {
  // General dashboard settings
  general: {
    enabled: process.env.DASHBOARD_ENABLED !== 'false',
    port: parseInt(process.env.DASHBOARD_PORT) || 3000,
    host: process.env.DASHBOARD_HOST || '0.0.0.0',
    title: process.env.DASHBOARD_TITLE || 'Performance Monitoring Dashboard',
    theme: process.env.DASHBOARD_THEME || 'light', // light, dark, auto
    refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_INTERVAL) || 30000, // 30 seconds
    timezone: process.env.DASHBOARD_TIMEZONE || 'UTC',
    language: process.env.DASHBOARD_LANGUAGE || 'en',
  },

  // Authentication and authorization
  authentication: {
    enabled: process.env.DASHBOARD_AUTH_ENABLED === 'true',
    method: process.env.DASHBOARD_AUTH_METHOD || 'basic', // basic, jwt, oauth
    sessionTimeout: parseInt(process.env.DASHBOARD_SESSION_TIMEOUT) || 3600000, // 1 hour
    
    // Basic auth
    basic: {
      enabled: process.env.DASHBOARD_BASIC_AUTH_ENABLED === 'true',
      username: process.env.DASHBOARD_USERNAME || 'admin',
      password: process.env.DASHBOARD_PASSWORD || 'password',
    },
    
    // JWT auth
    jwt: {
      enabled: process.env.DASHBOARD_JWT_ENABLED === 'true',
      secret: process.env.DASHBOARD_JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.DASHBOARD_JWT_EXPIRES_IN || '24h',
    },
    
    // OAuth
    oauth: {
      enabled: process.env.DASHBOARD_OAUTH_ENABLED === 'true',
      provider: process.env.OAUTH_PROVIDER || 'google',
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      callbackUrl: process.env.OAUTH_CALLBACK_URL,
    }
  },

  // Dashboard pages configuration
  pages: {
    // Overview dashboard
    overview: {
      enabled: true,
      title: 'System Overview',
      description: 'High-level system health and performance metrics',
      refreshInterval: parseInt(process.env.OVERVIEW_REFRESH_INTERVAL) || 30000,
      widgets: [
        {
          type: 'system-health',
          title: 'System Health',
          size: 'large',
          position: { x: 0, y: 0, w: 6, h: 4 },
          refreshInterval: 5000,
        },
        {
          type: 'application-performance',
          title: 'Application Performance',
          size: 'large',
          position: { x: 6, y: 0, w: 6, h: 4 },
          refreshInterval: 10000,
        },
        {
          type: 'real-time-metrics',
          title: 'Real-time Metrics',
          size: 'medium',
          position: { x: 0, y: 4, w: 12, h: 3 },
          refreshInterval: 5000,
        },
        {
          type: 'alerts-summary',
          title: 'Active Alerts',
          size: 'small',
          position: { x: 0, y: 7, w: 4, h: 3 },
          refreshInterval: 15000,
        },
        {
          type: 'error-rate',
          title: 'Error Rate',
          size: 'small',
          position: { x: 4, y: 7, w: 4, h: 3 },
          refreshInterval: 15000,
        },
        {
          type: 'performance-trends',
          title: 'Performance Trends',
          size: 'small',
          position: { x: 8, y: 7, w: 4, h: 3 },
          refreshInterval: 30000,
        }
      ]
    },

    // System monitoring dashboard
    system: {
      enabled: true,
      title: 'System Monitoring',
      description: 'Detailed system resource monitoring',
      refreshInterval: parseInt(process.env.SYSTEM_DASHBOARD_REFRESH_INTERVAL) || 10000,
      widgets: [
        {
          type: 'cpu-usage',
          title: 'CPU Usage',
          size: 'medium',
          position: { x: 0, y: 0, w: 4, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'memory-usage',
          title: 'Memory Usage',
          size: 'medium',
          position: { x: 4, y: 0, w: 4, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'disk-usage',
          title: 'Disk Usage',
          size: 'medium',
          position: { x: 8, y: 0, w: 4, h: 3 },
          chart: 'doughnut',
          timeRange: '1h',
        },
        {
          type: 'load-average',
          title: 'Load Average',
          size: 'medium',
          position: { x: 0, y: 3, w: 6, h: 3 },
          chart: 'line',
          timeRange: '24h',
        },
        {
          type: 'network-traffic',
          title: 'Network Traffic',
          size: 'medium',
          position: { x: 6, y: 3, w: 6, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'processes',
          title: 'Top Processes',
          size: 'medium',
          position: { x: 0, y: 6, w: 12, h: 4 },
          chart: 'table',
          timeRange: '1h',
          maxItems: 20,
        }
      ]
    },

    // Application performance dashboard
    performance: {
      enabled: true,
      title: 'Application Performance',
      description: 'Application performance metrics and analysis',
      refreshInterval: parseInt(process.env.PERFORMANCE_DASHBOARD_REFRESH_INTERVAL) || 15000,
      widgets: [
        {
          type: 'response-time',
          title: 'Response Time',
          size: 'large',
          position: { x: 0, y: 0, w: 6, h: 3 },
          chart: 'line',
          timeRange: '1h',
          percentiles: [50, 90, 95, 99],
        },
        {
          type: 'throughput',
          title: 'Throughput',
          size: 'large',
          position: { x: 6, y: 0, w: 6, h: 3 },
          chart: 'bar',
          timeRange: '1h',
        },
        {
          type: 'error-rate',
          title: 'Error Rate',
          size: 'medium',
          position: { x: 0, y: 3, w: 6, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'apdex-score',
          title: 'Apdex Score',
          size: 'medium',
          position: { x: 6, y: 3, w: 6, h: 3 },
          chart: 'gauge',
          timeRange: '1h',
        },
        {
          type: 'endpoints',
          title: 'Endpoint Performance',
          size: 'large',
          position: { x: 0, y: 6, w: 12, h: 4 },
          chart: 'table',
          timeRange: '1h',
          sortable: true,
          maxItems: 50,
        },
        {
          type: 'transaction-breakdown',
          title: 'Transaction Breakdown',
          size: 'medium',
          position: { x: 0, y: 10, w: 6, h: 3 },
          chart: 'pie',
          timeRange: '1h',
        },
        {
          type: 'user-satisfaction',
          title: 'User Satisfaction',
          size: 'medium',
          position: { x: 6, y: 10, w: 6, h: 3 },
          chart: 'funnel',
          timeRange: '1h',
        }
      ]
    },

    // Database dashboard
    database: {
      enabled: true,
      title: 'Database Performance',
      description: 'Database performance and optimization metrics',
      refreshInterval: parseInt(process.env.DATABASE_DASHBOARD_REFRESH_INTERVAL) || 20000,
      widgets: [
        {
          type: 'connection-pool',
          title: 'Connection Pool',
          size: 'medium',
          position: { x: 0, y: 0, w: 4, h: 3 },
          chart: 'gauge',
          timeRange: '1h',
        },
        {
          type: 'query-performance',
          title: 'Query Performance',
          size: 'medium',
          position: { x: 4, y: 0, w: 4, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'slow-queries',
          title: 'Slow Queries',
          size: 'medium',
          position: { x: 8, y: 0, w: 4, h: 3 },
          chart: 'bar',
          timeRange: '1h',
        },
        {
          type: 'query-stats',
          title: 'Query Statistics',
          size: 'large',
          position: { x: 0, y: 3, w: 12, h: 4 },
          chart: 'table',
          timeRange: '1h',
          maxItems: 100,
        },
        {
          type: 'table-sizes',
          title: 'Table Sizes',
          size: 'medium',
          position: { x: 0, y: 7, w: 6, h: 3 },
          chart: 'bar',
          timeRange: '1d',
        },
        {
          type: 'index-usage',
          title: 'Index Usage',
          size: 'medium',
          position: { x: 6, y: 7, w: 6, h: 3 },
          chart: 'heatmap',
          timeRange: '1d',
        }
      ]
    },

    // API dashboard
    api: {
      enabled: true,
      title: 'API Analytics',
      description: 'API performance and usage analytics',
      refreshInterval: parseInt(process.env.API_DASHBOARD_REFRESH_INTERVAL) || 15000,
      widgets: [
        {
          type: 'request-volume',
          title: 'Request Volume',
          size: 'medium',
          position: { x: 0, y: 0, w: 4, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'response-times',
          title: 'Response Times',
          size: 'medium',
          position: { x: 4, y: 0, w: 4, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'error-rates',
          title: 'Error Rates',
          size: 'medium',
          position: { x: 8, y: 0, w: 4, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'endpoints',
          title: 'Endpoint Performance',
          size: 'large',
          position: { x: 0, y: 3, w: 8, h: 4 },
          chart: 'table',
          timeRange: '1h',
          sortable: true,
          maxItems: 20,
        },
        {
          type: 'rate-limiting',
          title: 'Rate Limiting',
          size: 'medium',
          position: { x: 8, y: 3, w: 4, h: 4 },
          chart: 'gauge',
          timeRange: '1h',
        },
        {
          type: 'top-endpoints',
          title: 'Top Endpoints',
          size: 'medium',
          position: { x: 0, y: 7, w: 6, h: 3 },
          chart: 'bar',
          timeRange: '1d',
        },
        {
          type: 'user-agents',
          title: 'User Agents',
          size: 'medium',
          position: { x: 6, y: 7, w: 6, h: 3 },
          chart: 'pie',
          timeRange: '1d',
        }
      ]
    },

    // Frontend dashboard
    frontend: {
      enabled: process.env.FRONTEND_DASHBOARD_ENABLED === 'true',
      title: 'Frontend Performance',
      description: 'User experience and frontend performance metrics',
      refreshInterval: parseInt(process.env.FRONTEND_DASHBOARD_REFRESH_INTERVAL) || 20000,
      widgets: [
        {
          type: 'core-web-vitals',
          title: 'Core Web Vitals',
          size: 'large',
          position: { x: 0, y: 0, w: 12, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'page-load-times',
          title: 'Page Load Times',
          size: 'medium',
          position: { x: 0, y: 3, w: 4, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'user-interactions',
          title: 'User Interactions',
          size: 'medium',
          position: { x: 4, y: 3, w: 4, h: 3 },
          chart: 'bar',
          timeRange: '1h',
        },
        {
          type: 'browser-breakdown',
          title: 'Browser Breakdown',
          size: 'medium',
          position: { x: 8, y: 3, w: 4, h: 3 },
          chart: 'pie',
          timeRange: '1d',
        },
        {
          type: 'page-performance',
          title: 'Page Performance',
          size: 'large',
          position: { x: 0, y: 6, w: 12, h: 4 },
          chart: 'table',
          timeRange: '1h',
          maxItems: 50,
        }
      ]
    },

    // Error tracking dashboard
    errors: {
      enabled: true,
      title: 'Error Tracking',
      description: 'Error monitoring and analysis',
      refreshInterval: parseInt(process.env.ERRORS_DASHBOARD_REFRESH_INTERVAL) || 15000,
      widgets: [
        {
          type: 'error-rate',
          title: 'Error Rate',
          size: 'medium',
          position: { x: 0, y: 0, w: 4, h: 3 },
          chart: 'line',
          timeRange: '1h',
        },
        {
          type: 'error-types',
          title: 'Error Types',
          size: 'medium',
          position: { x: 4, y: 0, w: 4, h: 3 },
          chart: 'pie',
          timeRange: '1h',
        },
        {
          type: 'error-trends',
          title: 'Error Trends',
          size: 'medium',
          position: { x: 8, y: 0, w: 4, h: 3 },
          chart: 'bar',
          timeRange: '1d',
        },
        {
          type: 'recent-errors',
          title: 'Recent Errors',
          size: 'large',
          position: { x: 0, y: 3, w: 12, h: 4 },
          chart: 'table',
          timeRange: '1h',
          maxItems: 100,
          clickable: true,
        },
        {
          type: 'error-heatmap',
          title: 'Error Heatmap',
          size: 'medium',
          position: { x: 0, y: 7, w: 6, h: 3 },
          chart: 'heatmap',
          timeRange: '1d',
        },
        {
          type: 'error-sources',
          title: 'Error Sources',
          size: 'medium',
          position: { x: 6, y: 7, w: 6, h: 3 },
          chart: 'treemap',
          timeRange: '1d',
        }
      ]
    },

    // Alerts dashboard
    alerts: {
      enabled: true,
      title: 'Alerts & Notifications',
      description: 'Alert management and status',
      refreshInterval: parseInt(process.env.ALERTS_DASHBOARD_REFRESH_INTERVAL) || 10000,
      widgets: [
        {
          type: 'active-alerts',
          title: 'Active Alerts',
          size: 'large',
          position: { x: 0, y: 0, w: 8, h: 4 },
          chart: 'table',
          timeRange: '1h',
          maxItems: 50,
        },
        {
          type: 'alert-severity',
          title: 'Alert Severity',
          size: 'medium',
          position: { x: 8, y: 0, w: 4, h: 4 },
          chart: 'pie',
          timeRange: '1h',
        },
        {
          type: 'alert-history',
          title: 'Alert History',
          size: 'medium',
          position: { x: 0, y: 4, w: 12, h: 4 },
          chart: 'timeline',
          timeRange: '24h',
        },
        {
          type: 'alert-rules',
          title: 'Alert Rules',
          size: 'medium',
          position: { x: 0, y: 8, w: 6, h: 3 },
          chart: 'table',
          maxItems: 20,
        },
        {
          type: 'alert-channels',
          title: 'Alert Channels',
          size: 'medium',
          position: { x: 6, y: 8, w: 6, h: 3 },
          chart: 'bar',
          timeRange: '1d',
        }
      ]
    },

    // Analytics dashboard
    analytics: {
      enabled: process.env.ANALYTICS_DASHBOARD_ENABLED === 'true',
      title: 'Analytics & Reports',
      description: 'Performance analytics and automated reports',
      refreshInterval: parseInt(process.env.ANALYTICS_DASHBOARD_REFRESH_INTERVAL) || 60000,
      widgets: [
        {
          type: 'performance-score',
          title: 'Performance Score',
          size: 'medium',
          position: { x: 0, y: 0, w: 4, h: 3 },
          chart: 'gauge',
          timeRange: '1d',
        },
        {
          type: 'optimization-suggestions',
          title: 'Optimization Suggestions',
          size: 'medium',
          position: { x: 4, y: 0, w: 4, h: 3 },
          chart: 'badge',
          timeRange: '1h',
        },
        {
          type: 'cost-optimization',
          title: 'Cost Optimization',
          size: 'medium',
          position: { x: 8, y: 0, w: 4, h: 3 },
          chart: 'line',
          timeRange: '1d',
        },
        {
          type: 'trends-analysis',
          title: 'Trends Analysis',
          size: 'large',
          position: { x: 0, y: 3, w: 8, h: 4 },
          chart: 'line',
          timeRange: '7d',
        },
        {
          type: 'comparative-analysis',
          title: 'Comparative Analysis',
          size: 'medium',
          position: { x: 8, y: 3, w: 4, h: 4 },
          chart: 'radar',
          timeRange: '7d',
        },
        {
          type: 'performance-reports',
          title: 'Performance Reports',
          size: 'medium',
          position: { x: 0, y: 7, w: 12, h: 4 },
          chart: 'table',
          maxItems: 20,
          downloadable: true,
        }
      ]
    }
  },

  // Chart and visualization configuration
  charts: {
    // Chart library settings
    library: process.env.DASHBOARD_CHART_LIBRARY || 'chart.js', // chart.js, d3, visx
    
    // Color schemes
    colorSchemes: {
      light: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        light: '#f8f9fa',
        dark: '#343a40',
      },
      dark: {
        primary: '#0d6efd',
        secondary: '#495057',
        success: '#198754',
        danger: '#dc3545',
        warning: '#fd7e14',
        info: '#0dcaf0',
        light: '#f8f9fa',
        dark: '#212529',
      }
    },

    // Default chart settings
    defaults: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart',
      },
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      },
    },

    // Chart-specific settings
    types: {
      line: {
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      bar: {
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      pie: {
        cutout: '50%',
        borderWidth: 2,
      },
      doughnut: {
        cutout: '60%',
        borderWidth: 2,
      },
      gauge: {
        min: 0,
        max: 100,
        thresholds: [
          { value: 70, color: 'warning' },
          { value: 90, color: 'danger' }
        ]
      },
      heatmap: {
        colorScale: 'viridis',
        cellSize: 10,
      },
      timeline: {
        axisFormat: 'HH:mm:ss',
        showTimeScale: true,
      }
    }
  },

  // Data export and sharing
  export: {
    enabled: process.env.DASHBOARD_EXPORT_ENABLED === 'true',
    formats: ['pdf', 'png', 'svg', 'csv', 'json'],
    schedule: {
      enabled: process.env.DASHBOARD_EXPORT_SCHEDULE_ENABLED === 'true',
      frequency: process.env.DASHBOARD_EXPORT_FREQUENCY || 'daily', // daily, weekly, monthly
      time: process.env.DASHBOARD_EXPORT_TIME || '00:00',
      recipients: (process.env.DASHBOARD_EXPORT_RECIPIENTS || '').split(',').filter(Boolean),
    },
    watermark: {
      enabled: process.env.DASHBOARD_WATERMARK_ENABLED === 'true',
      text: process.env.DASHBOARD_WATERMARK_TEXT || 'Generated by Performance Monitoring System',
      opacity: parseFloat(process.env.DASHBOARD_WATERMARK_OPACITY) || 0.3,
    }
  },

  // Real-time updates
  realtime: {
    enabled: process.env.REALTIME_UPDATES_ENABLED !== 'false',
    transport: process.env.REALTIME_TRANSPORT || 'websocket', // websocket, sse
    interval: parseInt(process.env.REALTIME_UPDATE_INTERVAL) || 5000,
    maxConnections: parseInt(process.env.REALTIME_MAX_CONNECTIONS) || 100,
    heartbeatInterval: parseInt(process.env.REALTIME_HEARTBEAT_INTERVAL) || 30000,
  },

  // Caching and performance
  caching: {
    enabled: process.env.DASHBOARD_CACHING_ENABLED !== 'false',
    provider: process.env.CACHE_PROVIDER || 'memory', // memory, redis, memcached
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
    }
  },

  // Responsive design
  responsive: {
    enabled: process.env.DASHBOARD_RESPONSIVE_ENABLED !== 'false',
    breakpoints: {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
    },
    grid: {
      cols: 12,
      rowHeight: 60,
      margin: 10,
      mobileBreakpoint: 768,
    }
  }
};