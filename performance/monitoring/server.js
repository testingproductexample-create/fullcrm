/**
 * Performance Monitoring & Analytics System
 * Main Server Entry Point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import configuration and services
const config = require('./config/dashboard');
const { DatabaseConnection } = require('./utilities/database-connection');
const { Logger } = require('./utilities/logger');

// Import monitoring services
const { SystemMonitor } = require('./services/system-monitor');
const { APMService } = require('./services/apm-service');
const { DatabaseMonitor } = require('./services/database-monitor');
const { APIMonitor } = require('./services/api-monitor');
const { ErrorTracker } = require('./services/error-tracker');
const { AlertingService } = require('./services/alerting-service');
const { PerformanceAnalyzer } = require('./services/performance-analyzer');

// Import collectors
const { SystemCollector } = require('./collectors/system-collector');
const { ApplicationCollector } = require('./collectors/application-collector');
const { DatabaseCollector } = require('./collectors/database-collector');
const { APICollector } = require('./collectors/api-collector');
const { FrontendCollector } = require('./collectors/frontend-collector');
const { LogCollector } = require('./collectors/log-collector');

// Import route handlers
const systemRoutes = require('./api/routes/system');
const performanceRoutes = require('./api/routes/performance');
const errorRoutes = require('./api/routes/errors');
const databaseRoutes = require('./api/routes/database');
const apiRoutes = require('./api/routes/api');
const dashboardRoutes = require('./api/routes/dashboard');
const alertRoutes = require('./api/routes/alerts');
const reportRoutes = require('./api/routes/reports');

class PerformanceMonitoringServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.port = process.env.PORT || 3000;
    this.isRunning = false;
    
    // Initialize services
    this.services = {};
    this.collectors = {};
    this.activeConnections = new Map();
  }

  /**
   * Initialize the monitoring server
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Performance Monitoring System...');
      
      // Initialize database
      await this.initializeDatabase();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Initialize services
      await this.initializeServices();
      
      // Initialize collectors
      this.initializeCollectors();
      
      // Setup WebSocket connections
      this.setupWebSocket();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      console.log('✅ Performance Monitoring System initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize monitoring system:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize database connection
   */
  async initializeDatabase() {
    const dbConnection = new DatabaseConnection();
    await dbConnection.connect();
    this.db = dbConnection;
    console.log('📊 Database connection established');
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security and performance middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"]
        }
      }
    }));
    
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));
    
    this.app.use(compression());
    this.app.use(morgan('combined'));
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Static files
    this.app.use('/static', express.static(path.join(__dirname, 'dashboards/public')));
    
    // Health check endpoint (no auth required)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: Object.keys(this.services).map(key => ({
          name: key,
          status: this.services[key].isRunning ? 'running' : 'stopped'
        }))
      });
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    const apiRouter = express.Router();
    
    // API routes
    apiRouter.use('/system', systemRoutes);
    apiRouter.use('/performance', performanceRoutes);
    apiRouter.use('/errors', errorRoutes);
    apiRouter.use('/database', databaseRoutes);
    apiRouter.use('/api', apiRoutes);
    apiRouter.use('/alerts', alertRoutes);
    apiRouter.use('/reports', reportRoutes);
    
    // Dashboard routes
    this.app.use('/api/dashboard', dashboardRoutes);
    
    // Mount API router
    this.app.use('/api', apiRouter);
    
    // Serve dashboard files
    this.app.use('/dashboard', express.static(path.join(__dirname, 'dashboards/public')));
    
    // Serve main dashboard
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'dashboards/public/index.html'));
    });
    
    // Dashboard endpoints
    this.app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, 'dashboards/public/index.html'));
    });
    
    this.app.get('/dashboard/:page', (req, res) => {
      res.sendFile(path.join(__dirname, 'dashboards/public/index.html'));
    });
    
    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        message: 'Performance Monitoring API Documentation',
        version: '1.0.0',
        endpoints: {
          system: {
            health: 'GET /api/system/health',
            metrics: 'GET /api/system/metrics',
            status: 'GET /api/system/status'
          },
          performance: {
            metrics: 'GET /api/performance/metrics',
            analysis: 'GET /api/performance/analysis',
            trends: 'GET /api/performance/trends'
          },
          errors: {
            recent: 'GET /api/errors/recent',
            statistics: 'GET /api/errors/statistics',
            details: 'GET /api/errors/:id'
          },
          database: {
            stats: 'GET /api/database/stats',
            queries: 'GET /api/database/queries',
            performance: 'GET /api/database/performance'
          },
          api: {
            stats: 'GET /api/api/stats',
            endpoints: 'GET /api/api/endpoints',
            usage: 'GET /api/api/usage'
          },
          alerts: {
            list: 'GET /api/alerts',
            configure: 'POST /api/alerts/configure',
            history: 'GET /api/alerts/history'
          },
          reports: {
            generate: 'POST /api/reports/generate',
            download: 'GET /api/reports/:id/download'
          }
        }
      });
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
    
    // Error handler
    this.app.use((error, req, res, next) => {
      console.error('API Error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  /**
   * Initialize monitoring services
   */
  async initializeServices() {
    console.log('🔧 Initializing monitoring services...');
    
    // System Monitor
    this.services.systemMonitor = new SystemMonitor({
      interval: parseInt(process.env.SYSTEM_MONITOR_INTERVAL) || 5000,
      retention: process.env.SYSTEM_RETENTION || '7d',
      alertThreshold: {
        cpu: parseInt(process.env.CPU_ALERT_THRESHOLD) || 80,
        memory: parseInt(process.env.MEMORY_ALERT_THRESHOLD) || 85,
        disk: parseInt(process.env.DISK_ALERT_THRESHOLD) || 90
      }
    });
    
    // APM Service
    this.services.apmService = new APMService({
      app: this.app,
      sampleRate: parseFloat(process.env.APM_SAMPLE_RATE) || 1.0,
      enableProfiling: process.env.ENABLE_PROFILING === 'true',
      slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 2000
    });
    
    // Database Monitor
    this.services.databaseMonitor = new DatabaseMonitor({
      connection: process.env.DATABASE_URL,
      slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000,
      enableQueryAnalysis: true
    });
    
    // API Monitor
    this.services.apiMonitor = new APIMonitor({
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      enableDetailedMetrics: true
    });
    
    // Error Tracker
    this.services.errorTracker = new ErrorTracker({
      enableStackTrace: process.env.ENABLE_STACK_TRACE === 'true',
      enableSourceMapping: process.env.ENABLE_SOURCE_MAPPING === 'true',
      enableUserTracking: process.env.ENABLE_USER_TRACKING === 'true'
    });
    
    // Alerting Service
    this.services.alertingService = new AlertingService({
      email: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      webhook: {
        url: process.env.WEBHOOK_URL,
        secret: process.env.WEBHOOK_SECRET
      },
      channels: {
        email: process.env.ALERT_EMAIL_ENABLED === 'true',
        webhook: process.env.ALERT_WEBHOOK_ENABLED === 'true',
        slack: process.env.ALERT_SLACK_ENABLED === 'true'
      }
    });
    
    // Performance Analyzer
    this.services.performanceAnalyzer = new PerformanceAnalyzer({
      analysisInterval: parseInt(process.env.ANALYSIS_INTERVAL) || 300000,
      enableOptimizationSuggestions: true
    });
    
    // Start services
    for (const [name, service] of Object.entries(this.services)) {
      try {
        await service.start();
        console.log(`✅ ${name} started`);
      } catch (error) {
        console.error(`❌ Failed to start ${name}:`, error);
      }
    }
  }

  /**
   * Initialize data collectors
   */
  initializeCollectors() {
    console.log('📊 Initializing data collectors...');
    
    // System Collector
    this.collectors.systemCollector = new SystemCollector({
      interval: parseInt(process.env.COLLECTOR_INTERVAL) || 5000,
      metrics: ['cpu', 'memory', 'disk', 'network', 'process']
    });
    
    // Application Collector
    this.collectors.applicationCollector = new ApplicationCollector({
      interval: parseInt(process.env.APP_COLLECTOR_INTERVAL) || 10000,
      includeUserMetrics: true
    });
    
    // Database Collector
    this.collectors.databaseCollector = new DatabaseCollector({
      interval: parseInt(process.env.DB_COLLECTOR_INTERVAL) || 30000,
      connection: process.env.DATABASE_URL
    });
    
    // API Collector
    this.collectors.apiCollector = new APICollector({
      interval: parseInt(process.env.API_COLLECTOR_INTERVAL) || 15000
    });
    
    // Frontend Collector (for serving collector scripts)
    this.collectors.frontendCollector = new FrontendCollector({
      enableRealUserMonitoring: process.env.ENABLE_RUM === 'true',
      sampleRate: parseFloat(process.env.RUM_SAMPLE_RATE) || 0.1
    });
    
    // Log Collector
    this.collectors.logCollector = new LogCollector({
      logLevel: process.env.LOG_LEVEL || 'info',
      enableRealTimeProcessing: true
    });
    
    // Start collectors
    for (const [name, collector] of Object.entries(this.collectors)) {
      try {
        collector.start();
        console.log(`✅ ${name} started`);
      } catch (error) {
        console.error(`❌ Failed to start ${name}:`, error);
      }
    }
    
    // Serve collector scripts
    this.app.get('/monitoring/:script', (req, res) => {
      const script = req.params.script;
      if (this.collectors.frontendCollector.hasScript(script)) {
        res.set('Content-Type', 'application/javascript');
        res.send(this.collectors.frontendCollector.getScript(script));
      } else {
        res.status(404).send('Script not found');
      }
    });
  }

  /**
   * Setup WebSocket connections for real-time updates
   */
  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log(`📡 New client connected: ${socket.id}`);
      this.activeConnections.set(socket.id, {
        id: socket.id,
        connectedAt: new Date(),
        subscriptions: new Set()
      });
      
      // Handle subscription requests
      socket.on('subscribe', (data) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          connection.subscriptions.add(data.type);
          console.log(`Client ${socket.id} subscribed to ${data.type}`);
        }
      });
      
      // Handle unsubscription requests
      socket.on('unsubscribe', (data) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          connection.subscriptions.delete(data.type);
          console.log(`Client ${socket.id} unsubscribed from ${data.type}`);
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`📡 Client disconnected: ${socket.id}`);
        this.activeConnections.delete(socket.id);
      });
      
      // Send initial data
      socket.emit('connected', {
        clientId: socket.id,
        timestamp: new Date().toISOString(),
        availableSubscriptions: [
          'system-metrics',
          'application-metrics',
          'database-metrics',
          'api-metrics',
          'errors',
          'alerts'
        ]
      });
    });
    
    // Broadcast metrics updates to subscribed clients
    setInterval(() => {
      this.broadcastMetrics();
    }, parseInt(process.env.BROADCAST_INTERVAL) || 5000);
  }

  /**
   * Broadcast real-time metrics to connected clients
   */
  broadcastMetrics() {
    const now = new Date();
    
    // System metrics
    this.io.emit('system-metrics', {
      timestamp: now.toISOString(),
      data: {
        cpu: Math.random() * 100, // Replace with actual metrics
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 1000
      }
    });
    
    // Application metrics
    this.io.emit('application-metrics', {
      timestamp: now.toISOString(),
      data: {
        responseTime: Math.random() * 1000,
        throughput: Math.random() * 100,
        errorRate: Math.random() * 5,
        activeUsers: Math.floor(Math.random() * 1000)
      }
    });
    
    // Database metrics
    this.io.emit('database-metrics', {
      timestamp: now.toISOString(),
      data: {
        queryTime: Math.random() * 500,
        connections: Math.floor(Math.random() * 100),
        cacheHitRate: Math.random() * 100,
        slowQueries: Math.floor(Math.random() * 10)
      }
    });
    
    // API metrics
    this.io.emit('api-metrics', {
      timestamp: now.toISOString(),
      data: {
        requestsPerSecond: Math.random() * 1000,
        averageResponseTime: Math.random() * 500,
        errorRate: Math.random() * 3,
        rateLimitHits: Math.floor(Math.random() * 50)
      }
    });
  }

  /**
   * Setup graceful shutdown handling
   */
  setupGracefulShutdown() {
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown('unhandledRejection');
    });
  }

  /**
   * Gracefully shutdown the server
   */
  async shutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    this.isRunning = false;
    
    try {
      // Stop collectors
      for (const collector of Object.values(this.collectors)) {
        collector.stop();
      }
      
      // Stop services
      for (const service of Object.values(this.services)) {
        service.stop();
      }
      
      // Close database connections
      if (this.db) {
        await this.db.disconnect();
      }
      
      // Close WebSocket connections
      this.io.close();
      
      // Close HTTP server
      this.server.close(() => {
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Start the server
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Server is already running');
      return;
    }
    
    await this.initialize();
    
    this.server.listen(this.port, () => {
      this.isRunning = true;
      console.log(`🎯 Performance Monitoring System running on port ${this.port}`);
      console.log(`📊 Dashboard: http://localhost:${this.port}/dashboard`);
      console.log(`🔌 API: http://localhost:${this.port}/api`);
      console.log(`📈 Health: http://localhost:${this.port}/health`);
      console.log(`📚 API Docs: http://localhost:${this.port}/api/docs`);
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new PerformanceMonitoringServer();
  server.start().catch(console.error);
}

module.exports = PerformanceMonitoringServer;