/**
 * System Health Monitoring Service
 * Monitors CPU, Memory, Disk, Network, and Process metrics
 */

const os = require('os');
const process = require('process');
const { EventEmitter } = require('events');
const { Logger } = require('../utilities/logger');
const { DatabaseConnection } = require('../utilities/database-connection');
const { AlertingService } = require('./alerting-service');
const config = require('../config/metrics');

class SystemMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      interval: options.interval || 5000,
      retention: options.retention || '7d',
      alertThreshold: options.alertThreshold || {
        cpu: 80,
        memory: 85,
        disk: 90
      },
      enableAlerts: options.enableAlerts !== false,
      enableHistoricalData: options.enableHistoricalData !== false,
      maxDataPoints: options.maxDataPoints || 1000,
      ...options
    };

    this.isRunning = false;
    this.logger = new Logger('SystemMonitor');
    this.db = null;
    this.alertingService = null;
    
    // Current metrics cache
    this.currentMetrics = {
      cpu: null,
      memory: null,
      disk: null,
      network: null,
      process: null
    };
    
    // Historical data storage
    this.metricsHistory = {
      cpu: [],
      memory: [],
      disk: [],
      network: [],
      process: []
    };

    // Performance counters
    this.counters = {
      collections: 0,
      errors: 0,
      alertsTriggered: 0,
      dataPointsStored: 0
    };

    // System information
    this.systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      uptime: os.uptime(),
      nodeVersion: process.version,
      processId: process.pid
    };

    this.lastCollectionTime = null;
  }

  /**
   * Initialize the system monitor
   */
  async initialize() {
    try {
      this.logger.info('Initializing System Monitor...');
      
      // Initialize database connection
      this.db = new DatabaseConnection();
      await this.db.connect();
      
      // Initialize alerting service
      if (this.options.enableAlerts) {
        this.alertingService = new AlertingService();
        await this.alertingService.initialize();
      }
      
      // Pre-collect baseline metrics
      await this.collectSystemMetrics();
      
      this.logger.info('System Monitor initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize System Monitor:', error);
      throw error;
    }
  }

  /**
   * Start the system monitoring
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('System Monitor is already running');
      return;
    }

    try {
      await this.initialize();
      
      this.isRunning = true;
      this.logger.info('System Monitor started');
      
      // Start collection interval
      this.collectionInterval = setInterval(() => {
        this.collectSystemMetrics().catch(error => {
          this.logger.error('Error collecting system metrics:', error);
          this.counters.errors++;
        });
      }, this.options.interval);
      
      // Start cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanupHistoricalData();
      }, 60000); // Clean up every minute
      
      // Emit initial metrics
      this.emit('started', {
        timestamp: new Date().toISOString(),
        systemInfo: this.systemInfo,
        options: this.options
      });
      
    } catch (error) {
      this.logger.error('Failed to start System Monitor:', error);
      throw error;
    }
  }

  /**
   * Stop the system monitoring
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear intervals
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Close database connection
    if (this.db) {
      await this.db.disconnect();
    }
    
    // Stop alerting service
    if (this.alertingService) {
      this.alertingService.stop();
    }
    
    this.logger.info('System Monitor stopped');
    
    this.emit('stopped', {
      timestamp: new Date().toISOString(),
      counters: this.counters
    });
  }

  /**
   * Collect all system metrics
   */
  async collectSystemMetrics() {
    const timestamp = new Date();
    this.lastCollectionTime = timestamp;
    this.counters.collections++;

    try {
      // Collect metrics concurrently
      const [
        cpuMetrics,
        memoryMetrics,
        diskMetrics,
        networkMetrics,
        processMetrics
      ] = await Promise.all([
        this.collectCPUMetrics(),
        this.collectMemoryMetrics(),
        this.collectDiskMetrics(),
        this.collectNetworkMetrics(),
        this.collectProcessMetrics()
      ]);

      // Store metrics
      const metrics = {
        timestamp,
        cpu: cpuMetrics,
        memory: memoryMetrics,
        disk: diskMetrics,
        network: networkMetrics,
        process: processMetrics
      };

      this.currentMetrics = metrics;
      
      // Store in history
      this.updateMetricsHistory(metrics);
      
      // Store in database
      if (this.db && this.options.enableHistoricalData) {
        await this.storeMetricsInDatabase(metrics);
      }
      
      // Check alerts
      if (this.alertingService) {
        await this.checkAlerts(metrics);
      }
      
      // Emit metrics event
      this.emit('metrics', metrics);
      
      this.counters.dataPointsStored++;
      
    } catch (error) {
      this.logger.error('Error collecting system metrics:', error);
      this.counters.errors++;
      throw error;
    }
  }

  /**
   * Collect CPU metrics
   */
  async collectCPUMetrics() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;
    
    // Get process-specific CPU usage
    const processCPU = process.cpuUsage();
    const processMemory = process.memoryUsage();
    
    return {
      usage_percent: memUsagePercent,
      load_average_1m: loadAvg[0],
      load_average_5m: loadAvg[1],
      load_average_15m: loadAvg[2],
      cpu_count: cpus.length,
      cpu_model: cpus[0]?.model || 'Unknown',
      total_memory: totalMem,
      used_memory: usedMem,
      free_memory: freeMem,
      memory_usage_percent: memUsagePercent,
      process: {
        cpu_user: processCPU.user,
        cpu_system: processCPU.system,
        cpu_percent: this.calculateCPUPercent(),
        memory_rss: processMemory.rss,
        memory_heap_total: processMemory.heapTotal,
        memory_heap_used: processMemory.heapUsed,
        memory_external: processMemory.external
      }
    };
  }

  /**
   * Collect memory metrics
   */
  async collectMemoryMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;
    
    const processMemory = process.memoryUsage();
    
    return {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      available: freeMem, // In most systems, free ≈ available
      usage_percent: memUsagePercent,
      process: {
        rss: processMemory.rss,
        heap_total: processMemory.heapTotal,
        heap_used: processMemory.heapUsed,
        external: processMemory.external,
        array_buffers: processMemory.arrayBuffers || 0
      }
    };
  }

  /**
   * Collect disk metrics
   */
  async collectDiskMetrics() {
    // This is a simplified implementation
    // In a real implementation, you would use libraries like 'drivelist' or system commands
    const drives = ['C:', '/', '/home']; // Common drive letters/mounts
    const diskMetrics = [];
    
    for (const drive of drives) {
      try {
        // Placeholder for disk usage calculation
        // In real implementation, use appropriate system calls
        const usage = {
          drive,
          total: 1000000000000, // 1TB placeholder
          used: Math.random() * 500000000000, // Random usage
          free: 0,
          usage_percent: 0
        };
        usage.free = usage.total - usage.used;
        usage.usage_percent = (usage.used / usage.total) * 100;
        
        diskMetrics.push(usage);
      } catch (error) {
        this.logger.warn(`Failed to get disk metrics for ${drive}:`, error.message);
      }
    }
    
    return {
      drives: diskMetrics,
      total_usage_percent: diskMetrics.length > 0 
        ? diskMetrics.reduce((sum, d) => sum + d.usage_percent, 0) / diskMetrics.length 
        : 0
    };
  }

  /**
   * Collect network metrics
   */
  async collectNetworkMetrics() {
    // This is a simplified implementation
    // In a real implementation, you would use system network statistics
    return {
      interfaces: this.getNetworkInterfaces(),
      total_bytes_sent: Math.random() * 1000000, // Placeholder
      total_bytes_recv: Math.random() * 1000000,
      total_packets_sent: Math.floor(Math.random() * 1000),
      total_packets_recv: Math.floor(Math.random() * 1000),
      errors_in: Math.floor(Math.random() * 10),
      errors_out: Math.floor(Math.random() * 10),
      drops_in: Math.floor(Math.random() * 5),
      drops_out: Math.floor(Math.random() * 5)
    };
  }

  /**
   * Collect process metrics
   */
  async collectProcessMetrics() {
    const processMemory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      pid: process.pid,
      ppid: process.ppid,
      cpu_percent: this.calculateCPUPercent(),
      memory_percent: (processMemory.rss / os.totalmem()) * 100,
      memory_rss: processMemory.rss,
      memory_heap_used: processMemory.heapUsed,
      memory_heap_total: processMemory.heapTotal,
      num_threads: process.getOpenFileDescriptors ? process.getOpenFileDescriptors() : 0,
      num_fds: process.getOpenFileDescriptors ? process.getOpenFileDescriptors() : 0,
      uptime: process.uptime(),
      start_time: process.startTime ? process.startTime() : Date.now() - (process.uptime() * 1000),
      cpu_user: cpuUsage.user,
      cpu_system: cpuUsage.system
    };
  }

  /**
   * Calculate CPU percentage for the process
   */
  calculateCPUPercent() {
    if (!this.lastCPUTimes) {
      this.lastCPUTimes = {
        user: process.cpuUsage().user,
        system: process.cpuUsage().system,
        timestamp: Date.now()
      };
      return 0;
    }
    
    const current = {
      user: process.cpuUsage().user,
      system: process.cpuUsage().system,
      timestamp: Date.now()
    };
    
    const elapsedTime = current.timestamp - this.lastCPUTimes.timestamp;
    const cpuUsed = (current.user - this.lastCPUTimes.user) + (current.system - this.lastCPUTimes.system);
    const cpuPercent = (cpuUsed / (elapsedTime * 1000)) * 100;
    
    this.lastCPUTimes = current;
    return Math.min(cpuPercent, 100); // Cap at 100%
  }

  /**
   * Get network interfaces information
   */
  getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result = [];
    
    for (const [name, nets] of Object.entries(interfaces)) {
      for (const net of nets) {
        if (net.family === 'IPv4' && !net.internal) {
          result.push({
            name,
            address: net.address,
            netmask: net.netmask,
            mac: net.mac,
            internal: net.internal
          });
        }
      }
    }
    
    return result;
  }

  /**
   * Update metrics history
   */
  updateMetricsHistory(metrics) {
    // Keep only the most recent data points
    const maxDataPoints = this.options.maxDataPoints;
    
    for (const [category, data] of Object.entries(metrics)) {
      if (category === 'timestamp') continue;
      
      if (!this.metricsHistory[category]) {
        this.metricsHistory[category] = [];
      }
      
      this.metricsHistory[category].push({
        timestamp: metrics.timestamp,
        data
      });
      
      // Trim old data points
      if (this.metricsHistory[category].length > maxDataPoints) {
        this.metricsHistory[category] = this.metricsHistory[category].slice(-maxDataPoints);
      }
    }
  }

  /**
   * Store metrics in database
   */
  async storeMetricsInDatabase(metrics) {
    try {
      const client = await this.db.getClient();
      
      // Store system metrics
      const systemMetrics = [
        { metric_type: 'cpu', metric_name: 'usage_percent', value: metrics.cpu.usage_percent, unit: 'percent' },
        { metric_type: 'cpu', metric_name: 'load_average_1m', value: metrics.cpu.load_average_1m, unit: 'number' },
        { metric_type: 'cpu', metric_name: 'load_average_5m', value: metrics.cpu.load_average_5m, unit: 'number' },
        { metric_type: 'cpu', metric_name: 'load_average_15m', value: metrics.cpu.load_average_15m, unit: 'number' },
        { metric_type: 'memory', metric_name: 'total', value: metrics.memory.total, unit: 'bytes' },
        { metric_type: 'memory', metric_name: 'used', value: metrics.memory.used, unit: 'bytes' },
        { metric_type: 'memory', metric_name: 'usage_percent', value: metrics.memory.usage_percent, unit: 'percent' },
        { metric_type: 'process', metric_name: 'cpu_percent', value: metrics.process.cpu_percent, unit: 'percent' },
        { metric_type: 'process', metric_name: 'memory_percent', value: metrics.process.memory_percent, unit: 'percent' },
        { metric_type: 'process', metric_name: 'uptime', value: metrics.process.uptime, unit: 'seconds' }
      ];
      
      for (const metric of systemMetrics) {
        await client.query(
          `INSERT INTO system_metrics (timestamp, host_id, metric_type, metric_name, metric_value, metric_unit)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [metrics.timestamp, this.systemInfo.hostname, metric.metric_type, metric.metric_name, metric.value, metric.unit]
        );
      }
      
      await client.release();
      
    } catch (error) {
      this.logger.error('Failed to store metrics in database:', error);
      throw error;
    }
  }

  /**
   * Check for alert conditions
   */
  async checkAlerts(metrics) {
    try {
      const alerts = [];
      
      // CPU usage alert
      if (metrics.cpu.usage_percent > this.options.alertThreshold.cpu) {
        alerts.push({
          rule: 'high_cpu_usage',
          metric: 'cpu.usage_percent',
          value: metrics.cpu.usage_percent,
          threshold: this.options.alertThreshold.cpu,
          severity: metrics.cpu.usage_percent > 90 ? 'critical' : 'warning'
        });
      }
      
      // Memory usage alert
      if (metrics.memory.usage_percent > this.options.alertThreshold.memory) {
        alerts.push({
          rule: 'high_memory_usage',
          metric: 'memory.usage_percent',
          value: metrics.memory.usage_percent,
          threshold: this.options.alertThreshold.memory,
          severity: metrics.memory.usage_percent > 95 ? 'critical' : 'warning'
        });
      }
      
      // Disk usage alert
      if (metrics.disk.total_usage_percent > this.options.alertThreshold.disk) {
        alerts.push({
          rule: 'high_disk_usage',
          metric: 'disk.usage_percent',
          value: metrics.disk.total_usage_percent,
          threshold: this.options.alertThreshold.disk,
          severity: metrics.disk.total_usage_percent > 95 ? 'critical' : 'warning'
        });
      }
      
      // Process-specific alerts
      if (metrics.process.cpu_percent > 90) {
        alerts.push({
          rule: 'high_process_cpu',
          metric: 'process.cpu_percent',
          value: metrics.process.cpu_percent,
          threshold: 90,
          severity: 'warning'
        });
      }
      
      if (metrics.process.memory_percent > 85) {
        alerts.push({
          rule: 'high_process_memory',
          metric: 'process.memory_percent',
          value: metrics.process.memory_percent,
          threshold: 85,
          severity: 'warning'
        });
      }
      
      // Trigger alerts
      for (const alert of alerts) {
        this.counters.alertsTriggered++;
        this.emit('alert', {
          ...alert,
          timestamp: new Date(),
          source: 'system_monitor'
        });
        
        if (this.alertingService) {
          await this.alertingService.triggerAlert(alert);
        }
      }
      
    } catch (error) {
      this.logger.error('Error checking alerts:', error);
    }
  }

  /**
   * Clean up historical data
   */
  cleanupHistoricalData() {
    const now = new Date();
    const retentionMs = this.parseRetentionPeriod(this.options.retention);
    const cutoffTime = new Date(now.getTime() - retentionMs);
    
    // Clean up metrics history
    for (const [category, history] of Object.entries(this.metricsHistory)) {
      this.metricsHistory[category] = history.filter(
        entry => entry.timestamp > cutoffTime
      );
    }
    
    this.logger.debug('Cleaned up historical data');
  }

  /**
   * Parse retention period string to milliseconds
   */
  parseRetentionPeriod(retention) {
    const units = {
      'ms': 1,
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000,
      'w': 604800000
    };
    
    const match = retention.match(/^(\d+)([a-z]+)$/i);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000; // Default 7 days
    }
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    return value * (units[unit] || units['d']);
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date().toISOString(),
      lastCollection: this.lastCollectionTime,
      systemInfo: this.systemInfo,
      currentMetrics: this.currentMetrics,
      counters: this.counters,
      options: this.options
    };
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(category, timeRange = '1h') {
    if (!this.metricsHistory[category]) {
      return [];
    }
    
    const timeRangeMs = this.parseRetentionPeriod(timeRange);
    const cutoffTime = new Date(Date.now() - timeRangeMs);
    
    return this.metricsHistory[category].filter(
      entry => entry.timestamp > cutoffTime
    );
  }

  /**
   * Force collection of system metrics
   */
  async collectNow() {
    this.logger.info('Forcing system metrics collection...');
    await this.collectSystemMetrics();
    return this.currentMetrics;
  }
}

module.exports = { SystemMonitor };