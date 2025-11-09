/**
 * Logger Utility
 * Comprehensive logging system with multiple levels, formats, and outputs
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

class Logger {
  constructor(component = 'app', options = {}) {
    this.component = component;
    this.options = {
      level: options.level || process.env.LOG_LEVEL || 'info',
      format: options.format || process.env.LOG_FORMAT || 'json',
      enableFileLogging: options.enableFileLogging !== false,
      enableConsoleLogging: options.enableConsoleLogging !== false,
      maxFiles: options.maxFiles || 5,
      maxFileSize: options.maxFileSize || '10m',
      logDir: options.logDir || 'logs',
      enableColors: options.enableColors !== false,
      enableTimestamps: options.enableTimestamps !== false,
      enablePerformanceTracking: options.enablePerformanceTracking || false,
      ...options
    };

    this.winstonLogger = null;
    this.performanceLogs = new Map();
    this.isInitialized = false;
    
    this.initialize();
  }

  /**
   * Initialize the logger
   */
  initialize() {
    try {
      // Create log directory if it doesn't exist
      if (this.options.enableFileLogging) {
        this.createLogDirectory();
      }

      // Define log formats
      const formats = {
        json: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        simple: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize({ all: this.options.enableColors }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [${this.component}] ${level}: ${message} ${metaStr}`;
          })
        ),
        detailed: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
            const stackStr = stack ? `\n${stack}` : '';
            return `${timestamp} [${this.component}] ${level}: ${message}${metaStr}${stackStr}`;
          })
        )
      };

      // Create winston logger
      this.winstonLogger = winston.createLogger({
        level: this.options.level,
        format: formats[this.options.format] || formats.json,
        defaultMeta: { 
          component: this.component,
          pid: process.pid,
          hostname: require('os').hostname()
        },
        transports: this.createTransports(),
        exitOnError: false
      });

      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize logger:', error);
      throw error;
    }
  }

  /**
   * Create log transports
   */
  createTransports() {
    const transports = [];

    // Console transport
    if (this.options.enableConsoleLogging) {
      transports.push(
        new winston.transports.Console({
          level: this.options.level,
          format: this.options.format === 'simple' ? 
            winston.format.combine(
              winston.format.colorize({ all: this.options.enableColors }),
              winston.format.simple()
            ) :
            winston.format.combine(
              winston.format.colorize({ all: this.options.enableColors }),
              winston.format.timestamp(),
              winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} [${this.component}] ${level}: ${message}${metaStr}`;
              })
            )
        })
      );
    }

    // File transports
    if (this.options.enableFileLogging) {
      // Error log file
      transports.push(
        new winston.transports.File({
          filename: path.join(this.options.logDir, 'error.log'),
          level: 'error',
          maxsize: this.parseSize(this.options.maxFileSize),
          maxFiles: this.options.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );

      // Combined log file
      transports.push(
        new winston.transports.File({
          filename: path.join(this.options.logDir, 'combined.log'),
          maxsize: this.parseSize(this.options.maxFileSize),
          maxFiles: this.options.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );

      // Component-specific log file
      transports.push(
        new winston.transports.File({
          filename: path.join(this.options.logDir, `${this.component}.log`),
          level: this.options.level,
          maxsize: this.parseSize(this.options.maxFileSize),
          maxFiles: this.options.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );

      // Performance log file
      if (this.options.enablePerformanceTracking) {
        transports.push(
          new winston.transports.File({
            filename: path.join(this.options.logDir, 'performance.log'),
            level: 'info',
            maxsize: this.parseSize(this.options.maxFileSize),
            maxFiles: this.options.maxFiles,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            )
          })
        );
      }
    }

    return transports;
  }

  /**
   * Create log directory
   */
  createLogDirectory() {
    try {
      if (!fs.existsSync(this.options.logDir)) {
        fs.mkdirSync(this.options.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
      throw error;
    }
  }

  /**
   * Parse size string to bytes
   */
  parseSize(size) {
    const units = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024
    };

    const match = size.match(/^(\d+)([a-z]+)$/i);
    if (!match) {
      return 10 * 1024 * 1024; // Default 10MB
    }

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    return value * (units[unit] || units.mb);
  }

  /**
   * Log at debug level
   */
  debug(message, meta = {}) {
    if (!this.isInitialized) return;
    this.winstonLogger.debug(message, meta);
  }

  /**
   * Log at info level
   */
  info(message, meta = {}) {
    if (!this.isInitialized) return;
    this.winstonLogger.info(message, meta);
  }

  /**
   * Log at warn level
   */
  warn(message, meta = {}) {
    if (!this.isInitialized) return;
    this.winstonLogger.warn(message, meta);
  }

  /**
   * Log at error level
   */
  error(message, meta = {}) {
    if (!this.isInitialized) return;
    this.winstonLogger.error(message, meta);
  }

  /**
   * Log at fatal level
   */
  fatal(message, meta = {}) {
    if (!this.isInitialized) return;
    this.winstonLogger.error(`FATAL: ${message}`, meta);
  }

  /**
   * Start performance tracking
   */
  startTimer(operation) {
    if (!this.options.enablePerformanceTracking) {
      return {
        end: () => {},
        log: () => {}
      };
    }

    const startTime = process.hrtime.bigint();
    const timerId = `${operation}_${Date.now()}`;
    
    this.performanceLogs.set(timerId, {
      operation,
      startTime,
      startMemory: process.memoryUsage()
    });

    return {
      end: (meta = {}) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        const timer = this.performanceLogs.get(timerId);
        if (timer) {
          const endMemory = process.memoryUsage();
          const memoryDelta = {
            rss: endMemory.rss - timer.startMemory.rss,
            heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed
          };

          this.performanceLogs.delete(timerId);
          
          const perfData = {
            operation,
            duration,
            memoryDelta,
            timestamp: new Date().toISOString(),
            ...meta
          };

          this.info(`Performance: ${operation}`, perfData);
          return perfData;
        }
      },
      
      log: (level = 'info', meta = {}) => {
        this[level](`Performance: ${operation}`, meta);
      }
    };
  }

  /**
   * Log request information
   */
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      contentLength: res.get('Content-Length') || 0
    };

    if (res.statusCode >= 400) {
      this.warn('HTTP Request Error', logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }

  /**
   * Log database query
   */
  logQuery(query, params, duration, resultCount = 0) {
    this.debug('Database Query', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      params: params?.length || 0,
      duration: `${duration}ms`,
      resultCount
    });
  }

  /**
   * Log API call
   */
  logAPICall(endpoint, method, duration, statusCode, userId = null) {
    const logData = {
      endpoint,
      method,
      duration: `${duration}ms`,
      status: statusCode,
      userId
    };

    if (statusCode >= 400) {
      this.warn('API Call Error', logData);
    } else {
      this.info('API Call', logData);
    }
  }

  /**
   * Log alert information
   */
  logAlert(alert) {
    const logData = {
      id: alert.id,
      rule: alert.rule,
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold,
      severity: alert.severity,
      source: alert.source,
      timestamp: alert.timestamp
    };

    if (alert.severity === 'critical') {
      this.fatal('Critical Alert', logData);
    } else if (alert.severity === 'warning') {
      this.warn('Warning Alert', logData);
    } else {
      this.info('Info Alert', logData);
    }
  }

  /**
   * Log system metrics
   */
  logSystemMetrics(metrics) {
    this.debug('System Metrics', {
      cpu: metrics.cpu?.usage_percent,
      memory: metrics.memory?.usage_percent,
      disk: metrics.disk?.total_usage_percent,
      network: metrics.network?.total_bytes_sent,
      timestamp: metrics.timestamp
    });
  }

  /**
   * Log error with context
   */
  logError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      ...context
    };

    this.error('Application Error', errorData);
  }

  /**
   * Create child logger
   */
  child(component) {
    return new Logger(`${this.component}:${component}`, this.options);
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (this.winstonLogger) {
      this.winstonLogger.level = level;
      this.options.level = level;
      this.info(`Log level changed to ${level}`);
    }
  }

  /**
   * Get current log level
   */
  getLevel() {
    return this.options.level;
  }

  /**
   * Add custom format
   */
  addFormat(format) {
    if (this.winstonLogger) {
      // This would require recreating the logger with the new format
      this.warn('Cannot add format to running logger');
    }
  }

  /**
   * Flush logs (for testing)
   */
  async flush() {
    return new Promise((resolve) => {
      this.winstonLogger.on('finish', resolve);
      this.winstonLogger.end();
    });
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const stats = {
      totalOperations: this.performanceLogs.size,
      operations: Array.from(this.performanceLogs.values())
        .map(timer => ({
          operation: timer.operation,
          duration: Date.now() - Number(timer.startTime) / 1000000,
          memoryUsage: timer.startMemory
        }))
    };
    
    return stats;
  }

  /**
   * Get logger status
   */
  getStatus() {
    return {
      component: this.component,
      level: this.options.level,
      format: this.options.format,
      initialized: this.isInitialized,
      transports: this.winstonLogger?.transports?.length || 0,
      performanceTracking: this.options.enablePerformanceTracking
    };
  }

  /**
   * Create structured logger for specific use cases
   */
  createStructuredLogger(type, data) {
    const structuredData = {
      type,
      data,
      timestamp: new Date().toISOString(),
      component: this.component
    };

    return structuredData;
  }

  /**
   * Log with correlation ID for tracing
   */
  logWithCorrelation(message, correlationId, level = 'info', meta = {}) {
    const logData = {
      ...meta,
      correlationId
    };

    this[level](message, logData);
  }

  /**
   * Create metrics logger
   */
  logMetrics(metrics) {
    this.info('Metrics', {
      type: 'metrics',
      data: metrics,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log configuration changes
   */
  logConfigChange(action, key, oldValue, newValue) {
    this.info('Configuration Change', {
      action,
      key,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(event, details = {}) {
    const securityData = {
      event,
      details,
      timestamp: new Date().toISOString(),
      severity: 'warning'
    };

    this.warn('Security Event', securityData);
  }

  /**
   * Log business events
   */
  logBusinessEvent(event, data = {}) {
    const businessData = {
      event,
      data,
      timestamp: new Date().toISOString()
    };

    this.info('Business Event', businessData);
  }
}

// Create default logger instance
const defaultLogger = new Logger('app');

module.exports = { 
  Logger,
  defaultLogger
};