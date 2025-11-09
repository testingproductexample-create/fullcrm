#!/usr/bin/env node

/**
 * Advanced Caching & CDN Integration System
 * Main entry point that initializes and coordinates all caching components
 */

import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import core components
import { CacheManager } from './core/cache-manager.js';
import { RedisClient } from './core/redis-client.js';
import { CacheValidator } from './core/cache-validator.js';
import { QueryCache } from './database/query-cache.js';
import { ResponseCache } from './api/response-cache.js';
import { AssetOptimizer } from './static/asset-optimizer.js';
import { CDNManager } from './cdn/cdn-manager.js';
import { ImageOptimizer } from './image/image-optimizer.js';

// Import monitoring and management
import { PerformanceMonitor } from './tools/performance-monitor.js';
import { CacheDashboard } from './tools/cache-dashboard.js';
import { CacheOptimizer } from './tools/cache-optimizer.js';
import { healthCheckRouter } from './tools/health-check.js';

// Import middleware and utilities
import { APICacheMiddleware } from './api/cache-middleware.js';
import { DatabaseCacheMiddleware } from './database/cache-middleware.js';
import { CompressionUtil } from './static/compression.js';
import { VersioningUtil } from './static/versioning.js';
import { logger } from './utils/logger.js';
import { loadConfig } from './utils/config-loader.js';
import { setupRoutes } from './routes/index.js';
import { setupWebSocketHandlers } from './websocket/handlers.js';

config();

class CachingCDNSystem {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.config = loadConfig();
        this.isInitialized = false;
        this.components = new Map();
    }

    async initialize() {
        try {
            logger.info('🚀 Initializing Advanced Caching & CDN System...');

            // Initialize core components
            await this.initializeCoreComponents();
            await this.initializeCacheLayers();
            await this.initializeCDN();
            await this.initializeImageOptimization();
            await thisinitializeStaticOptimization();
            await this.initializeMiddleware();
            await this.initializeMonitoring();
            await this.initializeDashboard();
            await this.initializeWebSocket();
            await this.setupRoutes();
            await this.startHealthChecks();

            this.isInitialized = true;
            logger.info('✅ Caching & CDN System initialized successfully');
            logger.info(`📊 Dashboard: http://localhost:${this.config.monitoring?.dashboardPort || 3000}`);
            logger.info(`🏥 Health Check: http://localhost:${this.config.health?.port || 3001}/health`);

        } catch (error) {
            logger.error('❌ Failed to initialize Caching & CDN System:', error);
            process.exit(1);
        }
    }

    async initializeCoreComponents() {
        logger.info('🔧 Initializing core components...');

        // Redis Client
        this.components.set('redis', new RedisClient(this.config.redis));
        
        // Cache Manager
        this.components.set('cacheManager', new CacheManager(
            this.components.get('redis'),
            this.config.cache
        ));

        // Cache Validator
        this.components.set('cacheValidator', new CacheValidator(
            this.components.get('cacheManager'),
            this.config.validator
        ));

        logger.info('✅ Core components initialized');
    }

    async initializeCacheLayers() {
        logger.info('💾 Initializing cache layers...');

        // Database Query Cache
        this.components.set('queryCache', new QueryCache(
            this.components.get('cacheManager'),
            this.config.database
        ));

        // API Response Cache
        this.components.set('responseCache', new ResponseCache(
            this.components.get('cacheManager'),
            this.config.api
        ));

        logger.info('✅ Cache layers initialized');
    }

    async initializeCDN() {
        logger.info('🌍 Initializing CDN management...');

        this.components.set('cdnManager', new CDNManager(
            this.config.cdn
        ));

        logger.info('✅ CDN management initialized');
    }

    async initializeImageOptimization() {
        logger.info('🖼️ Initializing image optimization...');

        this.components.set('imageOptimizer', new ImageOptimizer(
            this.config.image
        ));

        logger.info('✅ Image optimization initialized');
    }

    async initializeStaticOptimization() {
        logger.info('📦 Initializing static asset optimization...');

        this.components.set('assetOptimizer', new AssetOptimizer(
            this.config.static
        ));

        this.components.set('compression', new CompressionUtil(
            this.config.compression
        ));

        this.components.set('versioning', new VersioningUtil(
            this.config.versioning
        ));

        logger.info('✅ Static asset optimization initialized');
    }

    async initializeMiddleware() {
        logger.info('🔌 Initializing middleware...');

        this.components.set('apiMiddleware', new APICacheMiddleware(
            this.components.get('responseCache'),
            this.config.api
        ));

        this.components.set('dbMiddleware', new DatabaseCacheMiddleware(
            this.components.get('queryCache'),
            this.config.database
        ));

        logger.info('✅ Middleware initialized');
    }

    async initializeMonitoring() {
        logger.info('📊 Initializing performance monitoring...');

        this.components.set('performanceMonitor', new PerformanceMonitor(
            this.components,
            this.config.monitoring
        ));

        logger.info('✅ Performance monitoring initialized');
    }

    async initializeDashboard() {
        logger.info('📈 Initializing management dashboard...');

        this.components.set('dashboard', new CacheDashboard(
            this.components,
            this.config.dashboard
        ));

        logger.info('✅ Management dashboard initialized');
    }

    async initializeWebSocket() {
        logger.info('🔌 Initializing WebSocket handlers...');

        setupWebSocketHandlers(this.io, this.components);

        logger.info('✅ WebSocket handlers initialized');
    }

    async setupRoutes() {
        logger.info('🛣️ Setting up routes...');

        // Basic middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "ws:", "wss:"]
                }
            }
        }));

        this.app.use(cors({
            origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));

        this.app.use(compression());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        this.app.use(morgan('combined'));

        // Health check routes
        this.app.use('/health', healthCheckRouter(this.components));

        // API routes
        setupRoutes(this.app, this.components);

        // Dashboard routes
        this.components.get('dashboard').setupRoutes(this.app);

        // Error handling
        this.app.use((err, req, res, next) => {
            logger.error('Request error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ error: 'Route not found' });
        });

        logger.info('✅ Routes configured');
    }

    async startHealthChecks() {
        if (this.config.health?.enabled) {
            setInterval(async () => {
                try {
                    const health = await this.getSystemHealth();
                    if (health.status !== 'healthy') {
                        logger.warn('Health check failed:', health);
                    }
                } catch (error) {
                    logger.error('Health check error:', error);
                }
            }, this.config.health.interval || 30000);
        }
    }

    async getSystemHealth() {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            components: {}
        };

        for (const [name, component] of this.components) {
            try {
                if (typeof component.healthCheck === 'function') {
                    health.components[name] = await component.healthCheck();
                } else {
                    health.components[name] = { status: 'ok' };
                }
            } catch (error) {
                health.components[name] = { status: 'error', error: error.message };
                health.status = 'degraded';
            }
        }

        return health;
    }

    async start() {
        await this.initialize();

        const port = this.config.server?.port || 3000;
        const host = this.config.server?.host || 'localhost';

        this.server.listen(port, host, () => {
            logger.info(`🚀 Server running on http://${host}:${port}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', this.gracefulShutdown.bind(this));
        process.on('SIGINT', this.gracefulShutdown.bind(this));
    }

    async gracefulShutdown(signal) {
        logger.info(`Received ${signal}. Starting graceful shutdown...`);

        try {
            // Close server
            this.server.close(() => {
                logger.info('HTTP server closed');
            });

            // Close WebSocket connections
            this.io.close(() => {
                logger.info('WebSocket server closed');
            });

            // Clean up components
            for (const [name, component] of this.components) {
                if (typeof component.close === 'function') {
                    await component.close();
                }
            }

            logger.info('Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Start the system
if (import.meta.url === `file://${process.argv[1]}`) {
    const system = new CachingCDNSystem();
    system.start().catch(error => {
        logger.error('Failed to start system:', error);
        process.exit(1);
    });
}

export { CachingCDNSystem };