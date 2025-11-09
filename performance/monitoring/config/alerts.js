/**
 * Alerting System Configuration
 */

module.exports = {
  // General alert settings
  general: {
    enabled: process.env.ALERTS_ENABLED === 'true',
    globalThreshold: {
      warning: parseInt(process.env.ALERT_WARNING_THRESHOLD) || 70,
      critical: parseInt(process.env.ALERT_CRITICAL_THRESHOLD) || 90,
    },
    escalation: {
      enabled: process.env.ALERT_ESCALATION_ENABLED === 'true',
      intervals: {
        warning: parseInt(process.env.WARNING_ESCALATION_INTERVAL) || 300000, // 5 minutes
        critical: parseInt(process.env.CRITICAL_ESCALATION_INTERVAL) || 60000, // 1 minute
      },
      maxEscalations: parseInt(process.env.MAX_ESCALATIONS) || 3,
    },
    suppression: {
      enabled: process.env.ALERT_SUPPRESSION_ENABLED === 'true',
      maintenanceWindow: process.env.MAINTENANCE_WINDOW || null,
      holidaySchedule: process.env.HOLIDAY_SCHEDULE || null,
    }
  },

  // Alert channels configuration
  channels: {
    email: {
      enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
      smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        }
      },
      recipients: {
        warning: (process.env.ALERT_EMAIL_WARNING_RECIPIENTS || '').split(',').filter(Boolean),
        critical: (process.env.ALERT_EMAIL_CRITICAL_RECIPIENTS || '').split(',').filter(Boolean),
        admins: (process.env.ALERT_EMAIL_ADMIN_RECIPIENTS || '').split(',').filter(Boolean),
      },
      templates: {
        subject: 'Performance Alert: {{severity}} - {{alertName}}',
        body: {
          warning: 'Warning alert triggered for {{metricName}}: {{currentValue}} (threshold: {{threshold}})',
          critical: 'Critical alert triggered for {{metricName}}: {{currentValue}} (threshold: {{threshold}})',
        }
      }
    },

    webhook: {
      enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
      url: process.env.WEBHOOK_URL || '',
      method: process.env.WEBHOOK_METHOD || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.WEBHOOK_BEARER_TOKEN || '',
      },
      timeout: parseInt(process.env.WEBHOOK_TIMEOUT) || 10000,
      retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS) || 3,
      retryInterval: parseInt(process.env.WEBHOOK_RETRY_INTERVAL) || 5000,
    },

    slack: {
      enabled: process.env.ALERT_SLACK_ENABLED === 'true',
      webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
      channel: process.env.SLACK_CHANNEL || '#alerts',
      username: process.env.SLACK_USERNAME || 'Performance Monitor',
      iconEmoji: process.env.SLACK_ICON_EMOJI || ':warning:',
      timeout: parseInt(process.env.SLACK_TIMEOUT) || 5000,
    },

    sms: {
      enabled: process.env.ALERT_SMS_ENABLED === 'true',
      provider: process.env.SMS_PROVIDER || 'twilio',
      apiKey: process.env.SMS_API_KEY || '',
      apiSecret: process.env.SMS_API_SECRET || '',
      fromNumber: process.env.SMS_FROM_NUMBER || '',
      recipients: (process.env.SMS_RECIPIENTS || '').split(',').filter(Boolean),
    },

    pagerduty: {
      enabled: process.env.ALERT_PAGERDUTY_ENABLED === 'true',
      integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || '',
      serviceKey: process.env.PAGERDUTY_SERVICE_KEY || '',
    },

    teams: {
      enabled: process.env.ALERT_TEAMS_ENABLED === 'true',
      webhookUrl: process.env.TEAMS_WEBHOOK_URL || '',
      channel: process.env.TEAMS_CHANNEL || '',
    }
  },

  // System health alerts
  system: {
    cpu: {
      enabled: true,
      warning: {
        threshold: parseInt(process.env.CPU_WARNING_THRESHOLD) || 70,
        duration: parseInt(process.env.CPU_WARNING_DURATION) || 300000, // 5 minutes
      },
      critical: {
        threshold: parseInt(process.env.CPU_CRITICAL_THRESHOLD) || 85,
        duration: parseInt(process.env.CPU_CRITICAL_DURATION) || 120000, // 2 minutes
      }
    },

    memory: {
      enabled: true,
      warning: {
        threshold: parseInt(process.env.MEMORY_WARNING_THRESHOLD) || 75,
        duration: parseInt(process.env.MEMORY_WARNING_DURATION) || 300000,
      },
      critical: {
        threshold: parseInt(process.env.MEMORY_CRITICAL_THRESHOLD) || 90,
        duration: parseInt(process.env.MEMORY_CRITICAL_DURATION) || 120000,
      }
    },

    disk: {
      enabled: true,
      warning: {
        threshold: parseInt(process.env.DISK_WARNING_THRESHOLD) || 80,
        duration: parseInt(process.env.DISK_WARNING_DURATION) || 600000, // 10 minutes
      },
      critical: {
        threshold: parseInt(process.env.DISK_CRITICAL_THRESHOLD) || 95,
        duration: parseInt(process.env.DISK_CRITICAL_DURATION) || 300000, // 5 minutes
      }
    },

    network: {
      enabled: process.env.NETWORK_ALERTS_ENABLED === 'true',
      warning: {
        threshold: parseInt(process.env.NETWORK_WARNING_THRESHOLD) || 1000000, // 1MB/s
        duration: parseInt(process.env.NETWORK_WARNING_DURATION) || 300000,
      },
      critical: {
        threshold: parseInt(process.env.NETWORK_CRITICAL_THRESHOLD) || 10000000, // 10MB/s
        duration: parseInt(process.env.NETWORK_CRITICAL_DURATION) || 120000,
      }
    }
  },

  // Application performance alerts
  application: {
    responseTime: {
      enabled: true,
      warning: {
        threshold: parseInt(process.env.RESPONSE_TIME_WARNING_THRESHOLD) || 1000, // 1 second
        duration: parseInt(process.env.RESPONSE_TIME_WARNING_DURATION) || 180000, // 3 minutes
      },
      critical: {
        threshold: parseInt(process.env.RESPONSE_TIME_CRITICAL_THRESHOLD) || 3000, // 3 seconds
        duration: parseInt(process.env.RESPONSE_TIME_CRITICAL_DURATION) || 60000, // 1 minute
      }
    },

    errorRate: {
      enabled: true,
      warning: {
        threshold: parseFloat(process.env.ERROR_RATE_WARNING_THRESHOLD) || 2, // 2%
        duration: parseInt(process.env.ERROR_RATE_WARNING_DURATION) || 120000, // 2 minutes
      },
      critical: {
        threshold: parseFloat(process.env.ERROR_RATE_CRITICAL_THRESHOLD) || 5, // 5%
        duration: parseInt(process.env.ERROR_RATE_CRITICAL_DURATION) || 60000, // 1 minute
      }
    },

    throughput: {
      enabled: process.env.THROUGHPUT_ALERTS_ENABLED === 'true',
      warning: {
        threshold: parseInt(process.env.THROUGHPUT_WARNING_THRESHOLD) || 10, // 10 req/s
        duration: parseInt(process.env.THROUGHPUT_WARNING_DURATION) || 300000, // 5 minutes
        type: 'low' // Alert when below threshold
      },
      critical: {
        threshold: parseInt(process.env.THROUGHPUT_CRITICAL_THRESHOLD) || 5, // 5 req/s
        duration: parseInt(process.env.THROUGHPUT_CRITICAL_DURATION) || 120000, // 2 minutes
        type: 'low'
      }
    },

    availability: {
      enabled: true,
      warning: {
        threshold: 99, // 99% availability
        duration: parseInt(process.env.AVAILABILITY_WARNING_DURATION) || 600000, // 10 minutes
      },
      critical: {
        threshold: 95, // 95% availability
        duration: parseInt(process.env.AVAILABILITY_CRITICAL_DURATION) || 300000, // 5 minutes
      }
    }
  },

  // Database performance alerts
  database: {
    connectionPool: {
      enabled: true,
      warning: {
        threshold: 80, // 80% of pool used
        duration: parseInt(process.env.DB_POOL_WARNING_DURATION) || 300000,
      },
      critical: {
        threshold: 95, // 95% of pool used
        duration: parseInt(process.env.DB_POOL_CRITICAL_DURATION) || 120000,
      }
    },

    queryPerformance: {
      enabled: true,
      warning: {
        threshold: parseInt(process.env.DB_QUERY_WARNING_THRESHOLD) || 1000, // 1 second
        duration: parseInt(process.env.DB_QUERY_WARNING_DURATION) || 300000,
      },
      critical: {
        threshold: parseInt(process.env.DB_QUERY_CRITICAL_THRESHOLD) || 5000, // 5 seconds
        duration: parseInt(process.env.DB_QUERY_CRITICAL_DURATION) || 60000,
      }
    },

    slowQueries: {
      enabled: true,
      critical: {
        threshold: parseInt(process.env.SLOW_QUERIES_CRITICAL_THRESHOLD) || 10, // 10 slow queries
        duration: parseInt(process.env.SLOW_QUERIES_CRITICAL_DURATION) || 60000,
      }
    }
  },

  // API performance alerts
  api: {
    rateLimit: {
      enabled: true,
      warning: {
        threshold: 80, // 80% of rate limit
        duration: parseInt(process.env.RATE_LIMIT_WARNING_DURATION) || 60000,
      },
      critical: {
        threshold: 95, // 95% of rate limit
        duration: parseInt(process.env.RATE_LIMIT_CRITICAL_DURATION) || 30000,
      }
    },

    timeout: {
      enabled: true,
      critical: {
        threshold: parseInt(process.env.API_TIMEOUT_CRITICAL_THRESHOLD) || 5, // 5 timeouts
        duration: parseInt(process.env.API_TIMEOUT_CRITICAL_DURATION) || 60000,
      }
    }
  },

  // Security alerts
  security: {
    failedLogins: {
      enabled: process.env.SECURITY_ALERTS_ENABLED === 'true',
      warning: {
        threshold: parseInt(process.env.FAILED_LOGINS_WARNING_THRESHOLD) || 10, // 10 failures
        duration: parseInt(process.env.FAILED_LOGINS_WARNING_DURATION) || 300000, // 5 minutes
      },
      critical: {
        threshold: parseInt(process.env.FAILED_LOGINS_CRITICAL_THRESHOLD) || 20, // 20 failures
        duration: parseInt(process.env.FAILED_LOGINS_CRITICAL_DURATION) || 120000, // 2 minutes
      }
    },

    suspiciousActivity: {
      enabled: process.env.SUSPICIOUS_ACTIVITY_ALERTS_ENABLED === 'true',
      critical: {
        immediateAlert: true,
        threshold: 1, // Any suspicious activity
      }
    }
  },

  // Business metrics alerts
  business: {
    userEngagement: {
      enabled: process.env.BUSINESS_METRICS_ALERTS_ENABLED === 'true',
      warning: {
        threshold: parseFloat(process.env.USER_ENGAGEMENT_WARNING_THRESHOLD) || 80, // 80% of baseline
        duration: parseInt(process.env.USER_ENGAGEMENT_WARNING_DURATION) || 1800000, // 30 minutes
        type: 'low'
      }
    },

    conversionRate: {
      enabled: process.env.CONVERSION_RATE_ALERTS_ENABLED === 'true',
      warning: {
        threshold: parseFloat(process.env.CONVERSION_RATE_WARNING_THRESHOLD) || 5, // 5% drop
        duration: parseInt(process.env.CONVERSION_RATE_WARNING_DURATION) || 3600000, // 1 hour
        type: 'low'
      }
    }
  },

  // Alert grouping and correlation
  grouping: {
    enabled: process.env.ALERT_GROUPING_ENABLED === 'true',
    timeWindow: parseInt(process.env.ALERT_GROUPING_WINDOW) || 300000, // 5 minutes
    maxGroupSize: parseInt(process.env.ALERT_GROUPING_MAX_SIZE) || 10,
    correlation: {
      enabled: process.env.ALERT_CORRELATION_ENABLED === 'true',
      similarityThreshold: parseFloat(process.env.ALERT_CORRELATION_THRESHOLD) || 0.8,
    }
  },

  // Notification templates
  templates: {
    default: {
      subject: '[{{severity.toUpperCase}}] {{alertName}} - {{timestamp}}',
      message: {
        warning: '⚠️ {{alertName}}\n\nMetric: {{metricName}}\nCurrent: {{currentValue}}\nThreshold: {{threshold}}\nDuration: {{duration}}\nTimestamp: {{timestamp}}',
        critical: '🚨 {{alertName}}\n\nMetric: {{metricName}}\nCurrent: {{currentValue}}\nThreshold: {{threshold}}\nDuration: {{duration}}\nTimestamp: {{timestamp}}',
      }
    },
    
    email: {
      html: true,
      includeCharts: process.env.ALERT_EMAIL_INCLUDE_CHARTS === 'true',
      includeHistory: process.env.ALERT_EMAIL_INCLUDE_HISTORY === 'true',
    }
  },

  // Alert history and audit
  history: {
    enabled: true,
    retention: process.env.ALERT_HISTORY_RETENTION || '90d',
    maxEntries: parseInt(process.env.ALERT_HISTORY_MAX_ENTRIES) || 10000,
    includeActions: true,
    includeResolutions: true,
  },

  // Testing and dry run
  testing: {
    enabled: process.env.ALERT_TESTING_ENABLED === 'true',
    dryRun: process.env.ALERT_DRY_RUN === 'false' ? false : process.env.ALERT_DRY_RUN,
    testInterval: parseInt(process.env.ALERT_TEST_INTERVAL) || 3600000, // 1 hour
    testRecipients: (process.env.ALERT_TEST_RECIPIENTS || '').split(',').filter(Boolean),
  }
};