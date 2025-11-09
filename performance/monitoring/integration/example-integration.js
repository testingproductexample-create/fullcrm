const express = require('express');
const path = require('path');

// Import all monitoring components
const SystemMonitor = require('../services/system-monitor');
const APMServices = require('../services/apm-service');
const ErrorTracker = require('../services/error-tracker');
const DatabaseMonitor = require('../services/database-monitor');
const APIMonitor = require('../services/api-monitor');
const AlertingService = require('../services/alerting-service');
const PerformanceAnalyzer = require('../services/performance-analyzer');

// Import collectors
const SystemCollector = require('../collectors/system-collector');
const APICollector = require('../collectors/api-collector');
const DatabaseCollector = require('../collectors/database-collector');
const ErrorCollector = require('../collectors/error-collector');
const FrontendCollector = require('../collectors/frontend-collector');

// Import middleware
const RequestTrackingMiddleware = require('../middleware/request-tracking');
const PerformanceMonitoringMiddleware = require('../middleware/performance-monitoring');
const ErrorTrackingMiddleware = require('../middleware/error-tracking');

// Import dashboard
const DashboardService = require('./dashboard-service');

class PerformanceMonitoringIntegration {
    constructor(config = {}) {
        this.config = {
            // Service configuration
            services: {
                system: { enabled: true, ...config.system },
                apm: { enabled: true, ...config.apm },
                errors: { enabled: true, ...config.errors },
                database: { enabled: true, ...config.database },
                api: { enabled: true, ...config.api },
                alerts: { enabled: true, ...config.alerts },
                analysis: { enabled: true, ...config.analysis }
            },
            
            // Collector configuration
            collectors: {
                system: { enabled: true, ...config.systemCollector },
                api: { enabled: true, ...config.apiCollector },
                database: { enabled: true, ...config.databaseCollector },
                errors: { enabled: true, ...config.errorCollector },
                frontend: { enabled: true, ...config.frontendCollector }
            },
            
            // Middleware configuration
            middleware: {
                requestTracking: { enabled: true, ...config.requestTracking },
                performanceMonitoring: { enabled: true, ...config.performanceMonitoring },
                errorTracking: { enabled: true, ...config.errorTracking }
            },
            
            // Dashboard configuration
            dashboard: { 
                enabled: true, 
                port: config.dashboardPort || 3001,
                ...config.dashboard 
            },

            // Database configuration
            database: {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'performance_monitoring',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password'
            },

            // Redis configuration
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || null
            },

            ...config
        };
        
        this.app = express();
        this.services = new Map();
        this.collectors = new Map();
        this.middleware = new Map();
        this.dashboard = null;
        this.isInitialized = false;
        this.isRunning = false;
        
        this.setupExpress();
    }

    setupExpress() {
        // Basic middleware
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') return res.status(200).end();
            next();
        });

        // Setup monitoring middleware
        this.setupMiddleware();

        // Example application routes
        this.setupExampleRoutes();
    }

    setupMiddleware() {
        // Request tracking middleware
        if (this.config.middleware.requestTracking.enabled) {
            const requestTracking = new RequestTrackingMiddleware(this.config.middleware.requestTracking);
            this.app.use(requestTracking.middleware());
            this.middleware.set('requestTracking', requestTracking);
        }

        // Performance monitoring middleware
        if (this.config.middleware.performanceMonitoring.enabled) {
            const performanceMonitoring = new PerformanceMonitoringMiddleware(this.config.middleware.performanceMonitoring);
            this.app.use(performanceMonitoring.middleware());
            this.middleware.set('performanceMonitoring', performanceMonitoring);
        }

        // Error tracking middleware
        if (this.config.middleware.errorTracking.enabled) {
            const errorTracking = new ErrorTrackingMiddleware(this.config.middleware.errorTracking);
            this.app.use(errorTracking.errorHandler());
            this.middleware.set('errorTracking', errorTracking);
        }
    }

    setupExampleRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date(),
                uptime: process.uptime(),
                services: Object.fromEntries(this.services),
                collectors: Object.fromEntries(this.collectors)
            });
        });

        // Example API routes with monitoring
        this.app.get('/api/users', async (req, res, next) => {
            try {
                // Simulate database query
                const users = await this.simulateDatabaseQuery('SELECT * FROM users');
                
                res.json({
                    success: true,
                    data: users,
                    count: users.length
                });
            } catch (error) {
                next(error);
            }
        });

        this.app.get('/api/products', async (req, res, next) => {
            try {
                // Simulate external API call
                const products = await this.simulateExternalApiCall('https://api.example.com/products');
                
                res.json({
                    success: true,
                    data: products
                });
            } catch (error) {
                next(error);
            }
        });

        this.app.post('/api/orders', async (req, res, next) => {
            try {
                // Simulate order creation
                const order = await this.simulateOrderCreation(req.body);
                
                res.json({
                    success: true,
                    data: order
                });
            } catch (error) {
                next(error);
            }
        });

        // Example route that intentionally causes errors
        this.app.get('/api/error-example', (req, res, next) => {
            // Randomly throw errors for demonstration
            if (Math.random() > 0.7) {
                const error = new Error('This is a demo error');
                error.statusCode = 500;
                next(error);
            } else {
                res.json({ message: 'No error this time!' });
            }
        });

        // Performance testing route
        this.app.get('/api/performance-test', async (req, res, next) => {
            try {
                const startTime = Date.now();
                
                // Simulate various operations
                await this.simulateCpuIntensiveTask();
                await this.simulateMemoryIntensiveTask();
                await this.simulateIoOperation();
                
                const duration = Date.now() - startTime;
                
                res.json({
                    message: 'Performance test completed',
                    duration: duration + 'ms'
                });
            } catch (error) {
                next(error);
            }
        });

        // Static files for dashboard
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    // Simulate database query
    async simulateDatabaseQuery(query) {
        // Simulate query time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        // Simulate occasional errors
        if (Math.random() > 0.95) {
            const error = new Error('Database connection timeout');
            error.code = 'ECONNREFUSED';
            throw error;
        }
        
        return [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ];
    }

    // Simulate external API call
    async simulateExternalApiCall(url) {
        // Simulate API call time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
        
        // Simulate occasional timeouts
        if (Math.random() > 0.9) {
            throw new Error('External API timeout');
        }
        
        return [
            { id: 1, name: 'Product A', price: 29.99 },
            { id: 2, name: 'Product B', price: 39.99 }
        ];
    }

    // Simulate order creation
    async simulateOrderCreation(orderData) {
        // Validate order data
        if (!orderData || !orderData.items || !orderData.userId) {
            const error = new Error('Invalid order data');
            error.statusCode = 400;
            throw error;
        }
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        
        return {
            orderId: 'ORD-' + Date.now(),
            status: 'created',
            total: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            createdAt: new Date()
        };
    }

    // Simulate CPU intensive task
    async simulateCpuIntensiveTask() {
        const iterations = 100000;
        let result = 0;
        for (let i = 0; i < iterations; i++) {
            result += Math.sqrt(i) * Math.sin(i);
        }
        return result;
    }

    // Simulate memory intensive task
    async simulateMemoryIntensiveTask() {
        const size = 1000000;
        const array = new Array(size);
        for (let i = 0; i < size; i++) {
            array[i] = {
                id: i,
                data: 'x'.repeat(100),
                timestamp: Date.now()
            };
        }
        return array.length;
    }

    // Simulate I/O operation
    async simulateIoOperation() {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return 'I/O operation completed';
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('Performance monitoring already initialized');
            return;
        }

        try {
            console.log('Initializing Performance Monitoring System...');

            // Initialize services
            await this.initializeServices();

            // Initialize collectors
            await this.initializeCollectors();

            // Setup event handling between components
            this.setupEventHandling();

            // Initialize dashboard
            if (this.config.dashboard.enabled) {
                await this.initializeDashboard();
            }

            this.isInitialized = true;
            console.log('Performance Monitoring System initialized successfully');

        } catch (error) {
            console.error('Failed to initialize performance monitoring:', error);
            throw error;
        }
    }

    async initializeServices() {
        // System Monitor
        if (this.config.services.system.enabled) {
            const systemMonitor = new SystemMonitor(this.config.services.system);
            await systemMonitor.start();
            this.services.set('system', systemMonitor);
            console.log('✓ System Monitor initialized');
        }

        // APM Service
        if (this.config.services.apm.enabled) {
            const apmService = new APMServices(this.config.services.apm);
            await apmService.start();
            this.services.set('apm', apmService);
            console.log('✓ APM Service initialized');
        }

        // Error Tracker
        if (this.config.services.errors.enabled) {
            const errorTracker = new ErrorTracker(this.config.services.errors);
            await errorTracker.start();
            this.services.set('errorTracker', errorTracker);
            console.log('✓ Error Tracker initialized');
        }

        // Database Monitor
        if (this.config.services.database.enabled) {
            const databaseMonitor = new DatabaseMonitor(this.config.services.database);
            await databaseMonitor.start();
            this.services.set('database', databaseMonitor);
            console.log('✓ Database Monitor initialized');
        }

        // API Monitor
        if (this.config.services.api.enabled) {
            const apiMonitor = new APIMonitor(this.config.services.api);
            await apiMonitor.start();
            this.services.set('api', apiMonitor);
            console.log('✓ API Monitor initialized');
        }

        // Alerting Service
        if (this.config.services.alerts.enabled) {
            const alertingService = new AlertingService(this.config.services.alerts);
            await alertingService.start();
            this.services.set('alerts', alertingService);
            console.log('✓ Alerting Service initialized');
        }

        // Performance Analyzer
        if (this.config.services.analysis.enabled) {
            const performanceAnalyzer = new PerformanceAnalyzer(this.config.services.analysis);
            await performanceAnalyzer.start();
            this.services.set('analysis', performanceAnalyzer);
            console.log('✓ Performance Analyzer initialized');
        }
    }

    async initializeCollectors() {
        // System Collector
        if (this.config.collectors.system.enabled) {
            const systemCollector = new SystemCollector(this.config.collectors.system);
            await systemCollector.start();
            this.collectors.set('system', systemCollector);
            console.log('✓ System Collector initialized');
        }

        // API Collector
        if (this.config.collectors.api.enabled) {
            const apiCollector = new APICollector(this.config.collectors.api);
            await apiCollector.start();
            this.collectors.set('api', apiCollector);
            console.log('✓ API Collector initialized');
        }

        // Database Collector
        if (this.config.collectors.database.enabled) {
            const databaseCollector = new DatabaseCollector(this.config.collectors.database);
            await databaseCollector.start();
            this.collectors.set('database', databaseCollector);
            console.log('✓ Database Collector initialized');
        }

        // Error Collector
        if (this.config.collectors.errors.enabled) {
            const errorCollector = new ErrorCollector(this.config.collectors.errors);
            await errorCollector.start();
            this.collectors.set('errors', errorCollector);
            console.log('✓ Error Collector initialized');
        }

        // Frontend Collector
        if (this.config.collectors.frontend.enabled) {
            const frontendCollector = new FrontendCollector(this.config.collectors.frontend);
            await frontendCollector.start();
            this.collectors.set('frontend', frontendCollector);
            console.log('✓ Frontend Collector initialized');
        }
    }

    setupEventHandling() {
        // Connect middleware to collectors
        const eventEmitter = new (require('events'))();
        
        // Connect request tracking middleware to API collector
        const requestTracking = this.middleware.get('requestTracking');
        const apiCollector = this.collectors.get('api');
        if (requestTracking && apiCollector) {
            requestTracking.setEventEmitter(eventEmitter);
            eventEmitter.on('request-tracking', (event) => {
                if (event.type === 'request') {
                    apiCollector.trackRequest(event.data);
                }
            });
        }

        // Connect performance monitoring to appropriate collectors
        const performanceMonitoring = this.middleware.get('performanceMonitoring');
        const databaseCollector = this.collectors.get('database');
        if (performanceMonitoring && databaseCollector) {
            performanceMonitoring.setEventEmitter(eventEmitter);
            eventEmitter.on('performance', (event) => {
                if (event.type === 'slow-request') {
                    // Handle slow requests
                }
            });
        }

        // Connect error tracking to error collector
        const errorTracking = this.middleware.get('errorTracking');
        const errorCollector = this.collectors.get('errors');
        if (errorTracking && errorCollector) {
            errorTracking.setEventEmitter(eventEmitter);
            eventEmitter.on('error-tracking', (event) => {
                if (event.type === 'error') {
                    errorCollector.trackError(event.data);
                }
            });
        }

        console.log('✓ Event handling configured');
    }

    async initializeDashboard() {
        this.dashboard = new DashboardService(this.config.dashboard);
        await this.dashboard.start();
        console.log(`✓ Dashboard initialized on port ${this.config.dashboard.port}`);
    }

    async start(port = 3000) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.isRunning) {
            console.log('Application already running');
            return;
        }

        // Start monitoring collectors and services
        for (const [name, service] of this.services) {
            if (service.start) {
                await service.start();
            }
        }

        for (const [name, collector] of this.collectors) {
            if (collector.start) {
                await collector.start();
            }
        }

        // Start the main application server
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.isRunning = true;
                    console.log(`✓ Application running on http://localhost:${port}`);
                    console.log(`✓ Dashboard available on http://localhost:${this.config.dashboard.port}`);
                    resolve();
                }
            });
        });
    }

    async stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('Stopping Performance Monitoring System...');

        // Stop services
        for (const [name, service] of this.services) {
            if (service.stop) {
                try {
                    await service.stop();
                } catch (error) {
                    console.error(`Error stopping ${name} service:`, error);
                }
            }
        }

        // Stop collectors
        for (const [name, collector] of this.collectors) {
            if (collector.stop) {
                try {
                    await collector.stop();
                } catch (error) {
                    console.error(`Error stopping ${name} collector:`, error);
                }
            }
        }

        // Stop dashboard
        if (this.dashboard) {
            await this.dashboard.stop();
        }

        // Stop HTTP server
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(resolve);
            });
        }

        this.isRunning = false;
        console.log('Performance Monitoring System stopped');
    }

    // Get system status
    getStatus() {
        return {
            initialized: this.isInitialized,
            running: this.isRunning,
            services: {
                system: this.services.has('system'),
                apm: this.services.has('apm'),
                errors: this.services.has('errorTracker'),
                database: this.services.has('database'),
                api: this.services.has('api'),
                alerts: this.services.has('alerts'),
                analysis: this.services.has('analysis')
            },
            collectors: {
                system: this.collectors.has('system'),
                api: this.collectors.has('api'),
                database: this.collectors.has('database'),
                errors: this.collectors.has('errors'),
                frontend: this.collectors.has('frontend')
            },
            middleware: {
                requestTracking: this.middleware.has('requestTracking'),
                performanceMonitoring: this.middleware.has('performanceMonitoring'),
                errorTracking: this.middleware.has('errorTracking')
            },
            dashboard: {
                enabled: this.config.dashboard.enabled,
                port: this.config.dashboard.port
            }
        };
    }
}

// Example usage
if (require.main === module) {
    const config = {
        services: {
            system: { collectionInterval: 5000 },
            api: { collectionInterval: 10000 },
            database: { collectionInterval: 30000 }
        },
        dashboard: {
            port: 3001,
            enableAuthentication: false
        },
        middleware: {
            requestTracking: {
                includeRequestBody: false,
                includeResponseBody: false
            },
            performanceMonitoring: {
                slowRequestThreshold: 500,
                enableCpuMonitoring: true,
                enableMemoryMonitoring: true
            },
            errorTracking: {
                includeStackTrace: true,
                captureUnhandledRejections: true,
                captureUncaughtExceptions: true
            }
        }
    };

    const monitoring = new PerformanceMonitoringIntegration(config);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nReceived SIGINT, shutting down gracefully...');
        await monitoring.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\nReceived SIGTERM, shutting down gracefully...');
        await monitoring.stop();
        process.exit(0);
    });

    // Start the application
    monitoring.start(3000).catch(error => {
        console.error('Failed to start application:', error);
        process.exit(1);
    });
}

module.exports = PerformanceMonitoringIntegration;