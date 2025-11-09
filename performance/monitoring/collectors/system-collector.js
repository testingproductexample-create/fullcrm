/**
 * System Metrics Collector
 * Collects system-level performance metrics
 */

const os = require('os');
const process = require('process');
const { EventEmitter } = require('events');
const { Logger } = require('../utilities/logger');

class SystemCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      interval: options.interval || 5000,
      metrics: options.metrics || ['cpu', 'memory', 'disk', 'network', 'process'],
      enableDetailedMetrics: options.enableDetailedMetrics !== false,
      enablePerCoreMetrics: options.enablePerCoreMetrics || false,
      enableProcessMetrics: options.enableProcessMetrics !== false,
      maxDataPoints: options.maxDataPoints || 1000,
      ...options
    };

    this.isRunning = false;
    this.logger = new Logger('SystemCollector');
    
    // Metrics storage
    this.metricsBuffer = [];
    this.currentMetrics = {};
    this.previousMetrics = {};
    
    // System information
    this.systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus(),
      totalMemory: os.totalmem(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      networkInterfaces: os.networkInterfaces(),
      release: os.release(),
      type: os.type(),
      version: os.version()
    };
    
    // Collection statistics
    this.stats = {
      collections: 0,
      errors: 0,
      dataPoints: 0,
      averageCollectionTime: 0,
      lastCollection: null
    };
    
    // Performance tracking
    this.collectionTimes = [];
  }

  /**
   * Start the system collector
   */
  start() {
    if (this.isRunning) {
      this.logger.warn('System Collector is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('System Collector started', {
      interval: this.options.interval,
      metrics: this.options.metrics
    });

    // Start collection interval
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, this.options.interval);

    // Perform initial collection
    this.collectMetrics();

    this.emit('started', {
      timestamp: new Date(),
      systemInfo: this.systemInfo
    });
  }

  /**
   * Stop the system collector
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }

    this.logger.info('System Collector stopped', {
      stats: this.stats
    });

    this.emit('stopped', {
      timestamp: new Date(),
      stats: this.stats
    });
  }

  /**
   * Collect system metrics
   */
  async collectMetrics() {
    const startTime = process.hrtime.bigint();
    
    try {
      const timestamp = new Date();
      const metrics = {
        timestamp,
        host: this.systemInfo.hostname,
        platform: this.systemInfo.platform
      };

      // Collect requested metrics
      for (const metricType of this.options.metrics) {
        try {
          switch (metricType) {
            case 'cpu':
              metrics.cpu = await this.collectCPUMetrics();
              break;
            case 'memory':
              metrics.memory = await this.collectMemoryMetrics();
              break;
            case 'disk':
              metrics.disk = await this.collectDiskMetrics();
              break;
            case 'network':
              metrics.network = await this.collectNetworkMetrics();
              break;
            case 'process':
              if (this.options.enableProcessMetrics) {
                metrics.process = await this.collectProcessMetrics();
              }
              break;
            default:
              this.logger.warn(`Unknown metric type: ${metricType}`);
          }
        } catch (error) {
          this.logger.error(`Error collecting ${metricType} metrics:`, error);
          metrics[metricType] = { error: error.message };
          this.stats.errors++;
        }
      }

      // Store current metrics
      this.currentMetrics = metrics;
      
      // Add to buffer
      this.metricsBuffer.push(metrics);
      
      // Maintain buffer size
      if (this.metricsBuffer.length > this.options.maxDataPoints) {
        this.metricsBuffer = this.metricsBuffer.slice(-this.options.maxDataPoints);
      }

      // Update statistics
      this.stats.collections++;
      this.stats.lastCollection = timestamp;
      this.stats.dataPoints++;

      // Calculate collection time
      const endTime = process.hrtime.bigint();
      const collectionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      this.collectionTimes.push(collectionTime);
      
      if (this.collectionTimes.length > 100) {
        this.collectionTimes = this.collectionTimes.slice(-100);
      }
      
      this.stats.averageCollectionTime = 
        this.collectionTimes.reduce((a, b) => a + b, 0) / this.collectionTimes.length;

      // Emit metrics event
      this.emit('metrics', metrics);

      this.logger.debug('System metrics collected', {
        collectionTime: `${collectionTime.toFixed(2)}ms`,
        metrics: Object.keys(metrics).filter(k => k !== 'timestamp' && k !== 'host' && k !== 'platform')
      });

    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error collecting system metrics:', error);
      this.emit('error', error);
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
    
    const cpuMetrics = {
      usage_percent: memUsagePercent,
      load_average_1m: loadAvg[0],
      load_average_5m: loadAvg[1],
      load_average_15m: loadAvg[2],
      cpu_count: cpus.length,
      cpu_model: cpus[0]?.model || 'Unknown',
      total_memory: totalMem,
      used_memory: usedMem,
      free_memory: freeMem,
      memory_usage_percent: memUsagePercent
    };

    // Add per-core metrics if enabled
    if (this.options.enablePerCoreMetrics && this.options.enableDetailedMetrics) {
      cpuMetrics.per_core = cpus.map((cpu, index) => ({
        core: index,
        model: cpu.model,
        speed: cpu.speed,
        usage: this.calculateCoreUsage(cpu)
      }));
    }

    // Add CPU usage since last collection
    if (this.previousMetrics.cpu) {
      cpuMetrics.usage_change = cpuMetrics.usage_percent - this.previousMetrics.cpu.usage_percent;
    }

    return cpuMetrics;
  }

  /**
   * Calculate individual core usage
   */
  calculateCoreUsage(cpu) {
    // This is a simplified calculation
    // In a real implementation, you would track CPU times between collections
    return Math.random() * 100; // Placeholder
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
    
    const memoryMetrics = {
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

    // Add memory changes if previous data exists
    if (this.previousMetrics.memory) {
      memoryMetrics.usage_change = memoryMetrics.usage_percent - this.previousMetrics.memory.usage_percent;
    }

    return memoryMetrics;
  }

  /**
   * Collect disk metrics
   */
  async collectDiskMetrics() {
    // This is a simplified implementation
    // In a real implementation, you would use libraries like 'drivelist' or system commands
    
    const drives = this.getSystemDrives();
    const diskMetrics = {
      total_drives: drives.length,
      drives: [],
      total_usage_percent: 0
    };

    for (const drive of drives) {
      try {
        // Placeholder for disk usage calculation
        // In real implementation, use appropriate system calls
        const usage = await this.getDriveUsage(drive);
        diskMetrics.drives.push(usage);
      } catch (error) {
        this.logger.warn(`Failed to get disk metrics for ${drive}:`, error.message);
      }
    }
    
    // Calculate overall disk usage
    if (diskMetrics.drives.length > 0) {
      diskMetrics.total_usage_percent = diskMetrics.drives.reduce(
        (sum, drive) => sum + drive.usage_percent, 0
      ) / diskMetrics.drives.length;
    }

    return diskMetrics;
  }

  /**
   * Get system drives
   */
  getSystemDrives() {
    const platform = os.platform();
    
    switch (platform) {
      case 'win32':
        return ['C:', 'D:']; // Common Windows drives
      case 'darwin':
        return ['/']; // macOS root
      case 'linux':
      default:
        return ['/', '/home', '/var']; // Common Linux mount points
    }
  }

  /**
   * Get drive usage (placeholder implementation)
   */
  async getDriveUsage(drive) {
    // Placeholder implementation
    // In a real implementation, you would use system-specific commands
    
    return {
      drive,
      total: 1000000000000, // 1TB placeholder
      used: Math.random() * 500000000000, // Random usage
      free: 0,
      usage_percent: 0
    };
  }

  /**
   * Collect network metrics
   */
  async collectNetworkMetrics() {
    const interfaces = os.networkInterfaces();
    const networkMetrics = {
      interfaces: [],
      total_bytes_sent: 0,
      total_bytes_recv: 0,
      total_packets_sent: 0,
      total_packets_recv: 0,
      errors_in: 0,
      errors_out: 0,
      drops_in: 0,
      drops_out: 0
    };

    for (const [name, nets] of Object.entries(interfaces)) {
      for (const net of nets) {
        if (net.family === 'IPv4' && !net.internal) {
          const interfaceData = {
            name,
            address: net.address,
            netmask: net.netmask,
            mac: net.mac,
            internal: net.internal
          };
          
          // Add network statistics (placeholder values)
          interfaceData.bytes_sent = Math.random() * 1000000;
          interfaceData.bytes_recv = Math.random() * 1000000;
          interfaceData.packets_sent = Math.floor(Math.random() * 1000);
          interfaceData.packets_recv = Math.floor(Math.random() * 1000);
          interfaceData.errors_in = Math.floor(Math.random() * 10);
          interfaceData.errors_out = Math.floor(Math.random() * 10);
          interfaceData.drops_in = Math.floor(Math.random() * 5);
          interfaceData.drops_out = Math.floor(Math.random() * 5);
          
          networkMetrics.interfaces.push(interfaceData);
          
          // Aggregate totals
          networkMetrics.total_bytes_sent += interfaceData.bytes_sent;
          networkMetrics.total_bytes_recv += interfaceData.bytes_recv;
          networkMetrics.total_packets_sent += interfaceData.packets_sent;
          networkMetrics.total_packets_recv += interfaceData.packets_recv;
          networkMetrics.errors_in += interfaceData.errors_in;
          networkMetrics.errors_out += interfaceData.errors_out;
          networkMetrics.drops_in += interfaceData.drops_in;
          networkMetrics.drops_out += interfaceData.drops_out;
        }
      }
    }

    // Add network rate calculations if previous data exists
    if (this.previousMetrics.network) {
      const timeDiff = this.currentMetrics.timestamp - this.previousMetrics.timestamp;
      if (timeDiff > 0) {
        networkMetrics.bytes_sent_rate = 
          (networkMetrics.total_bytes_sent - this.previousMetrics.network.total_bytes_sent) / (timeDiff / 1000);
        networkMetrics.bytes_recv_rate = 
          (networkMetrics.total_bytes_recv - this.previousMetrics.network.total_bytes_recv) / (timeDiff / 1000);
        networkMetrics.packets_sent_rate = 
          (networkMetrics.total_packets_sent - this.previousMetrics.network.total_packets_sent) / (timeDiff / 1000);
        networkMetrics.packets_recv_rate = 
          (networkMetrics.total_packets_recv - this.previousMetrics.network.total_packets_recv) / (timeDiff / 1000);
      }
    }

    return networkMetrics;
  }

  /**
   * Collect process metrics
   */
  async collectProcessMetrics() {
    const processMemory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const processMetrics = {
      pid: process.pid,
      ppid: process.ppid,
      cpu_percent: this.calculateProcessCPUPercent(),
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

    // Add process-specific information
    if (this.options.enableDetailedMetrics) {
      processMetrics.command = process.argv[0];
      processMetrics.argv = process.argv.slice(1);
      processMetrics.execPath = process.execPath;
      processMetrics.execArgv = process.execArgv;
      processMetrics.version = process.version;
      processMetrics.versions = process.versions;
    }

    return processMetrics;
  }

  /**
   * Calculate process CPU percentage
   */
  calculateProcessCPUPercent() {
    if (!this.previousMetrics.process) {
      // Store initial CPU usage
      this.previousCPUTimes = {
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
    
    const elapsedTime = current.timestamp - this.previousCPUTimes.timestamp;
    const cpuUsed = (current.user - this.previousCPUTimes.user) + (current.system - this.previousCPUTimes.system);
    const cpuPercent = (cpuUsed / (elapsedTime * 1000)) * 100;
    
    this.previousCPUTimes = current;
    return Math.min(cpuPercent, 100); // Cap at 100%
  }

  /**
   * Get current system status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      timestamp: new Date(),
      currentMetrics: this.currentMetrics,
      stats: this.stats,
      systemInfo: this.systemInfo,
      options: this.options
    };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(timeRange = '1h', limit = 100) {
    const timeRangeMs = this.parseTimeRange(timeRange);
    const cutoffTime = new Date(Date.now() - timeRangeMs);
    
    return this.metricsBuffer
      .filter(metric => metric.timestamp > cutoffTime)
      .slice(-limit);
  }

  /**
   * Force immediate collection
   */
  async collectNow() {
    this.logger.info('Forcing immediate system metrics collection...');
    await this.collectMetrics();
    return this.currentMetrics;
  }

  /**
   * Parse time range string
   */
  parseTimeRange(timeRange) {
    const units = {
      'ms': 1,
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000
    };
    
    const match = timeRange.match(/^(\d+)([a-z]+)$/i);
    if (!match) {
      return 3600000; // Default 1 hour
    }
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    return value * (units[unit] || units['h']);
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return this.systemInfo;
  }

  /**
   * Update configuration
   */
  updateConfig(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    if (this.isRunning && this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = setInterval(() => {
        this.collectMetrics();
      }, this.options.interval);
    }
    
    this.logger.info('System Collector configuration updated', {
      newOptions,
      currentOptions: this.options
    });
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      collections: 0,
      errors: 0,
      dataPoints: 0,
      averageCollectionTime: 0,
      lastCollection: null
    };
    
    this.collectionTimes = [];
    this.logger.info('System Collector statistics reset');
  }
}

module.exports = { SystemCollector };