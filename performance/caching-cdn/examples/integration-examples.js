/**
 * Integration Examples
 * Comprehensive examples showing how to integrate and use the caching system
 */

import express from 'express';
import { CachingCDNSystem } from '../index.js';
import { QueryCache } from '../database/query-cache.js';
import { ResponseCache } from '../api/response-cache.js';
import { APICacheMiddleware } from '../api/cache-middleware.js';
import { DatabaseCacheMiddleware } from '../database/cache-middleware.js';
import { ImageOptimizer } from '../image/image-optimizer.js';
import { CDNManager } from '../cdn/cdn-manager.js';

// Example 1: Basic Express Application with Full Caching Integration
class BasicIntegrationExample {
    constructor() {
        this.app = express();
        this.cachingSystem = null;
    }

    async setup() {
        console.log('🚀 Setting up basic integration example...');

        // Initialize the caching system
        this.cachingSystem = new CachingCDNSystem();
        await this.cachingSystem.initialize();

        // Add middleware
        this.app.use(this.cachingSystem.components.get('apiMiddleware').middleware());
        this.app.use(this.cachingSystem.components.get('compression').middleware());
        
        this.setupRoutes();
        
        console.log('✅ Basic integration setup complete');
    }

    setupRoutes() {
        // Basic cacheable endpoint
        this.app.get('/api/users', async (req, res, next) => {
            try {
                const cacheKey = `users:${JSON.stringify(req.query)}`;
                
                // Check cache first
                const cached = await this.cachingSystem.components.get('responseCache').get(cacheKey);
                if (cached) {
                    return res.json(cached);
                }

                // Simulate database query
                const users = await this.fetchUsers(req.query);
                
                // Cache the result
                await this.cachingSystem.components.get('responseCache').set(
                    cacheKey, 
                    users, 
                    { ttl: 300 } // 5 minutes
                );

                res.json(users);
            } catch (error) {
                next(error);
            }
        });

        // User profile with database query caching
        this.app.get('/api/users/:id', async (req, res, next) => {
            try {
                const userId = req.params.id;
                
                // Database query will be automatically cached
                const user = await this.cachingSystem.components.get('queryCache').get(
                    'SELECT * FROM users WHERE id = ?', 
                    [userId]
                );
                
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.json(user);
            } catch (error) {
                next(error);
            }
        });

        // Image optimization endpoint
        this.app.get('/api/images/:imageId', async (req, res, next) => {
            try {
                const { imageId } = req.params;
                const { width, height, quality, format } = req.query;

                const image = await this.cachingSystem.components.get('imageOptimizer').optimize({
                    source: `images/${imageId}`,
                    width: width ? parseInt(width) : null,
                    height: height ? parseInt(height) : null,
                    quality: quality ? parseInt(quality) : 85,
                    format: format || 'webp'
                });

                res.set('Content-Type', `image/${format || 'webp'}`);
                res.send(image);
            } catch (error) {
                next(error);
            }
        });

        // Complex query with multiple cache layers
        this.app.get('/api/dashboard', async (req, res, next) => {
            try {
                const dashboard = await this.getDashboardData();
                res.json(dashboard);
            } catch (error) {
                next(error);
            }
        });
    }

    async fetchUsers(query) {
        // Simulate database query
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
            users: [
                { id: 1, name: 'John Doe', email: 'john@example.com' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
            ],
            total: 2,
            page: parseInt(query.page) || 1,
            limit: parseInt(query.limit) || 10
        };
    }

    async getDashboardData() {
        // This would use multiple cache layers
        const [
            userStats,
            recentActivity,
            systemMetrics,
            cachedWidgets
        ] = await Promise.all([
            this.getUserStats(),
            this.getRecentActivity(),
            this.getSystemMetrics(),
            this.getCachedWidgets()
        ]);

        return {
            userStats,
            recentActivity,
            systemMetrics,
            widgets: cachedWidgets,
            timestamp: new Date().toISOString()
        };
    }

    async getUserStats() {
        return await this.cachingSystem.components.get('queryCache').get(
            'SELECT COUNT(*) as total_users, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL \'1 day\') as new_users FROM users'
        );
    }

    async getRecentActivity() {
        return await this.cachingSystem.components.get('responseCache').get(
            'recent_activity', 
            { ttl: 60 } // 1 minute
        ).then(async (cached) => {
            if (cached) return cached;
            
            const activity = await this.fetchRecentActivity();
            await this.cachingSystem.components.get('responseCache').set('recent_activity', activity, { ttl: 60 });
            return activity;
        });
    }

    async fetchRecentActivity() {
        return [
            { id: 1, action: 'User login', user: 'john@example.com', timestamp: new Date() },
            { id: 2, action: 'Data updated', user: 'admin@example.com', timestamp: new Date() }
        ];
    }

    async getSystemMetrics() {
        return await this.cachingSystem.components.get('performanceMonitor').getCurrentMetrics();
    }

    async getCachedWidgets() {
        return await this.cachingSystem.components.get('cacheManager').get('dashboard_widgets');
    }

    start(port = 3000) {
        this.app.listen(port, () => {
            console.log(`📡 Server running on http://localhost:${port}`);
        });
    }
}

// Example 2: Database-Centric Application with Query Caching
class DatabaseIntegrationExample {
    constructor() {
        this.app = express();
        this.queryCache = null;
    }

    async setup() {
        console.log('🗄️ Setting up database integration example...');

        // Initialize only the query caching components
        const cacheManager = new CachingCDNSystem().components.get('cacheManager');
        this.queryCache = new QueryCache(cacheManager, {
            defaultTTL: 1800, // 30 minutes
            normalizeQueries: true,
            enableCompression: true
        });

        this.setupDatabaseRoutes();
        console.log('✅ Database integration setup complete');
    }

    setupDatabaseRoutes() {
        // Product catalog with intelligent query caching
        this.app.get('/api/products', async (req, res, next) => {
            try {
                const { category, priceMin, priceMax, limit = 20, offset = 0 } = req.query;
                
                const products = await this.queryCache.get(
                    'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE (p.category_id = ? OR ? IS NULL) AND (p.price >= ? OR ? IS NULL) AND (p.price <= ? OR ? IS NULL) ORDER BY p.created_at DESC LIMIT ? OFFSET ?',
                    [
                        category || null, category,
                        priceMin || null, priceMin,
                        priceMax || null, priceMax,
                        limit, offset
                    ]
                );

                res.json({
                    products,
                    pagination: {
                        limit,
                        offset,
                        hasMore: products.length === limit
                    }
                });
            } catch (error) {
                next(error);
            }
        });

        // Product search with cached results
        this.app.get('/api/search', async (req, res, next) => {
            try {
                const { q, type = 'products' } = req.query;
                
                if (!q || q.length < 2) {
                    return res.json({ results: [] });
                }

                const searchKey = `search:${type}:${q.toLowerCase()}`;
                
                let results = await this.queryCache.get(searchKey);
                
                if (!results) {
                    // Perform actual search
                    results = await this.performSearch(q, type);
                    
                    // Cache with shorter TTL for search results
                    await this.queryCache.set(searchKey, results, { ttl: 300 });
                }

                res.json({ query: q, type, results });
            } catch (error) {
                next(error);
            }
        });

        // Analytics queries with complex caching
        this.app.get('/api/analytics/sales', async (req, res, next) => {
            try {
                const { period = '30d' } = req.query;
                const cacheKey = `analytics:sales:${period}`;

                const analytics = await this.queryCache.get(cacheKey);
                
                if (analytics) {
                    return res.json(analytics);
                }

                // Complex analytics query
                const data = await this.generateSalesAnalytics(period);
                
                // Cache for 1 hour
                await this.queryCache.set(cacheKey, data, { ttl: 3600 });
                
                res.json(data);
            } catch (error) {
                next(error);
            }
        });
    }

    async performSearch(query, type) {
        // Simulate search
        return [
            { id: 1, title: `Result for "${query}"`, type, score: 0.95 },
            { id: 2, title: `Another result for "${query}"`, type, score: 0.87 }
        ];
    }

    async generateSalesAnalytics(period) {
        // Simulate analytics calculation
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            period,
            totalSales: 125000,
            averageOrderValue: 75.50,
            topProducts: [
                { name: 'Product A', sales: 15000, units: 200 },
                { name: 'Product B', sales: 12000, units: 180 }
            ],
            growth: 12.5
        };
    }
}

// Example 3: API Gateway with Caching and CDN
class APIGatewayExample {
    constructor() {
        this.app = express();
        this.cdnManager = null;
        this.apiMiddleware = null;
    }

    async setup() {
        console.log('🌐 Setting up API gateway example...');

        const cachingSystem = new CachingCDNSystem();
        await cachingSystem.initialize();

        this.cdnManager = cachingSystem.components.get('cdnManager');
        this.apiMiddleware = new APICacheMiddleware(
            cachingSystem.components.get('responseCache'),
            { defaultTTL: 300, enableCompression: true }
        );

        // Apply API caching middleware to all routes
        this.app.use('/api', this.apiMiddleware.middleware());

        this.setupAPIRoutes();
        this.setupCDNRoutes();
        
        console.log('✅ API gateway setup complete');
    }

    setupAPIRoutes() {
        // Public API with aggressive caching
        this.app.get('/api/v1/public/data', async (req, res, next) => {
            try {
                const data = await this.fetchPublicData();
                
                // Set CDN cache headers
                res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
                res.set('Vary', 'Accept-Encoding, Accept');
                
                res.json(data);
            } catch (error) {
                next(error);
            }
        });

        // User-specific API with smart caching
        this.app.get('/api/v1/user/profile', async (req, res, next) => {
            try {
                const userId = req.user?.id; // Assuming authentication middleware
                
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const profile = await this.getUserProfile(userId);
                
                // Cache user profile for shorter time
                res.set('Cache-Control', 'private, max-age=300');
                
                res.json(profile);
            } catch (error) {
                next(error);
            }
        });

        // Bulk data with streaming
        this.app.get('/api/v1/bulk/users', async (req, res, next) => {
            try {
                const { format = 'json' } = req.query;
                
                res.set('Content-Type', 'application/json');
                res.set('Cache-Control', 'public, max-age=1800');
                
                // Stream large dataset
                res.write('[');
                
                const users = await this.fetchUsers();
                for (let i = 0; i < users.length; i++) {
                    if (i > 0) res.write(',');
                    res.write(JSON.stringify(users[i]));
                }
                
                res.write(']');
                res.end();
            } catch (error) {
                next(error);
            }
        });
    }

    setupCDNRoutes() {
        // Static assets with CDN optimization
        this.app.use('/assets', async (req, res, next) => {
            try {
                const assetPath = req.path;
                
                // Check CDN cache first
                const cached = await this.cdnManager.getCachedAsset(assetPath);
                
                if (cached) {
                    res.set('X-Cache', 'HIT');
                    res.set('X-CDN-Cache', 'HIT');
                    res.type(cached.contentType);
                    return res.send(cached.data);
                }

                // Asset not in CDN, serve from origin
                res.set('X-Cache', 'MISS');
                next();
            } catch (error) {
                next(error);
            }
        });

        // Images with automatic optimization
        this.app.get('/images/:id', async (req, res, next) => {
            try {
                const imageId = req.params.id;
                const { width, height, format = 'webp', quality = 85 } = req.query;

                const optimizedImage = await this.optimizeImage(imageId, {
                    width: width ? parseInt(width) : null,
                    height: height ? parseInt(height) : null,
                    format,
                    quality: parseInt(quality)
                });

                res.set('Content-Type', `image/${format}`);
                res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
                
                res.send(optimizedImage);
            } catch (error) {
                next(error);
            }
        });
    }

    async fetchPublicData() {
        return {
            timestamp: new Date().toISOString(),
            data: Array.from({ length: 100 }, (_, i) => ({
                id: i + 1,
                name: `Item ${i + 1}`,
                value: Math.random() * 100
            }))
        };
    }

    async getUserProfile(userId) {
        return {
            id: userId,
            name: 'John Doe',
            email: 'john@example.com',
            preferences: {
                theme: 'dark',
                language: 'en'
            }
        };
    }

    async fetchUsers() {
        return Array.from({ length: 1000 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`
        }));
    }

    async optimizeImage(imageId, options) {
        // This would use the image optimizer
        return Buffer.from('optimized image data');
    }
}

// Example 4: Microservices with Distributed Caching
class MicroservicesExample {
    constructor() {
        this.services = new Map();
        this.cachingSystem = null;
    }

    async setup() {
        console.log('🏗️ Setting up microservices example...');

        // Initialize shared caching infrastructure
        this.cachingSystem = new CachingCDNSystem();
        await this.cachingSystem.initialize();

        // Setup different services
        await this.setupUserService();
        await this.setupProductService();
        await this.setupOrderService();

        console.log('✅ Microservices setup complete');
    }

    async setupUserService() {
        const userApp = express();
        
        userApp.get('/users/:id', async (req, res) => {
            const userId = req.params.id;
            
            // Check distributed cache first
            const cached = await this.cachingSystem.components.get('cacheManager').get(`user:${userId}`);
            
            if (cached) {
                return res.json(cached);
            }

            // Fetch from "database"
            const user = await this.fetchUserFromDB(userId);
            
            // Cache in distributed storage
            await this.cachingSystem.components.get('cacheManager').set(
                `user:${userId}`, 
                user, 
                { ttl: 3600 }
            );

            res.json(user);
        });

        this.services.set('user', userApp);
    }

    async setupProductService() {
        const productApp = express();
        
        productApp.get('/products', async (req, res) => {
            const { category, limit = 20 } = req.query;
            const cacheKey = `products:${category}:${limit}`;
            
            const products = await this.cachingSystem.components.get('cacheManager').get(cacheKey);
            
            if (products) {
                return res.json(products);
            }

            const productsData = await this.fetchProducts(category, limit);
            
            await this.cachingSystem.components.get('cacheManager').set(cacheKey, productsData, { ttl: 1800 });
            
            res.json(productsData);
        });

        this.services.set('product', productApp);
    }

    async setupOrderService() {
        const orderApp = express();
        
        orderApp.post('/orders', async (req, res) => {
            const order = req.body;
            
            // Invalidate related caches
            await this.invalidateRelatedCaches(order.userId, order.productIds);
            
            // Create order
            const createdOrder = await this.createOrder(order);
            
            // Cache the new order
            await this.cachingSystem.components.get('cacheManager').set(
                `order:${createdOrder.id}`, 
                createdOrder, 
                { ttl: 7200 }
            );

            res.status(201).json(createdOrder);
        });

        this.services.set('order', orderApp);
    }

    async fetchUserFromDB(userId) {
        return { id: userId, name: 'User ' + userId, email: `user${userId}@example.com` };
    }

    async fetchProducts(category, limit) {
        return Array.from({ length: limit }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            category: category || 'general',
            price: Math.random() * 100
        }));
    }

    async createOrder(order) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            ...order,
            status: 'created',
            createdAt: new Date().toISOString()
        };
    }

    async invalidateRelatedCaches(userId, productIds) {
        const cacheManager = this.cachingSystem.components.get('cacheManager');
        
        // Invalidate user cache
        await cacheManager.del(`user:${userId}`);
        
        // Invalidate product caches
        for (const productId of productIds) {
            await cacheManager.del(`product:${productId}`);
        }
        
        // Invalidate product list caches
        await cacheManager.del('products:all:*');
    }

    startServices() {
        this.services.forEach((app, name) => {
            const port = {
                user: 3001,
                product: 3002,
                order: 3003
            }[name];

            app.listen(port, () => {
                console.log(`${name} service running on port ${port}`);
            });
        });
    }
}

// Example 5: Advanced Configuration and Monitoring
class AdvancedIntegrationExample {
    constructor() {
        this.app = express();
        this.cachingSystem = null;
        this.metrics = [];
    }

    async setup() {
        console.log('📊 Setting up advanced integration example...');

        // Custom configuration
        const customConfig = {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD,
                keyPrefix: 'myapp:cache:'
            },
            cache: {
                defaultTTL: 1800,
                maxKeyLength: 200,
                enableMetrics: true
            },
            monitoring: {
                enabled: true,
                dashboardPort: 3000,
                metricsEndpoint: '/admin/metrics'
            }
        };

        this.cachingSystem = new CachingCDNSystem();
        this.cachingSystem.config = customConfig;
        await this.cachingSystem.initialize();

        this.setupAdvancedRoutes();
        this.setupMonitoring();
        this.startMetricsCollection();
        
        console.log('✅ Advanced integration setup complete');
    }

    setupAdvancedRoutes() {
        // Cache warming endpoint
        this.app.post('/admin/cache/warm', async (req, res) => {
            try {
                const { keys = [] } = req.body;
                
                const results = await this.cachingSystem.components.get('cacheManager').warmCache(keys);
                
                res.json({
                    success: true,
                    warmed: results.length,
                    results
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Cache clearing endpoint
        this.app.delete('/admin/cache/clear', async (req, res) => {
            try {
                const { pattern } = req.body;
                
                if (pattern) {
                    const cleared = await this.cachingSystem.components.get('cacheManager').clearByPattern(pattern);
                    res.json({ success: true, cleared });
                } else {
                    await this.cachingSystem.components.get('cacheManager').clearAll();
                    res.json({ success: true, cleared: 'all' });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Cache statistics endpoint
        this.app.get('/admin/cache/stats', async (req, res) => {
            try {
                const stats = await this.cachingSystem.components.get('cacheManager').getStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupMonitoring() {
        // Custom metrics endpoint
        this.app.get('/admin/metrics', (req, res) => {
            res.json({
                system: this.getSystemMetrics(),
                cache: this.getCacheMetrics(),
                custom: this.metrics
            });
        });

        // Health check endpoint
        this.app.get('/admin/health', async (req, res) => {
            const health = await this.cachingSystem.getSystemHealth();
            res.json(health);
        });
    }

    startMetricsCollection() {
        setInterval(async () => {
            const metrics = {
                timestamp: Date.now(),
                cacheHits: Math.floor(Math.random() * 1000),
                cacheMisses: Math.floor(Math.random() * 100),
                responseTime: Math.random() * 100,
                memoryUsage: Math.random() * 80
            };
            
            this.metrics.push(metrics);
            
            // Keep only last 100 metrics
            if (this.metrics.length > 100) {
                this.metrics = this.metrics.slice(-100);
            }
        }, 5000);
    }

    getSystemMetrics() {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        };
    }

    getCacheMetrics() {
        return {
            totalKeys: Math.floor(Math.random() * 10000),
            hits: Math.floor(Math.random() * 5000),
            misses: Math.floor(Math.random() * 500),
            hitRate: 0.85 + Math.random() * 0.1
        };
    }
}

// Example 6: Real-time Cache Updates
class RealTimeExample {
    constructor() {
        this.app = express();
        this.cachingSystem = null;
        this.io = null;
    }

    async setup() {
        console.log('🔄 Setting up real-time example...');

        this.cachingSystem = new CachingCDNSystem();
        await this.cachingSystem.initialize();

        this.io = this.cachingSystem.io;
        this.setupRealtimeRoutes();
        this.setupWebSocketHandlers();
        
        console.log('✅ Real-time setup complete');
    }

    setupRealtimeRoutes() {
        // Subscribe to cache updates
        this.app.get('/api/subscribe', (req, res) => {
            const { channel } = req.query;
            
            this.io.on('connection', (socket) => {
                socket.join(channel);
                
                socket.on('cache-update', (data) => {
                    this.io.to(channel).emit('cache-updated', data);
                });
            });
            
            res.json({ success: true, channel });
        });

        // Trigger cache updates
        this.app.post('/api/trigger-update', async (req, res) => {
            const { key, data } = req.body;
            
            // Update cache
            await this.cachingSystem.components.get('cacheManager').set(key, data);
            
            // Broadcast update
            this.io.emit('cache-updated', { key, data, timestamp: Date.now() });
            
            res.json({ success: true });
        });
    }

    setupWebSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            socket.on('subscribe-cache', (patterns) => {
                patterns.forEach(pattern => {
                    socket.join(`cache:${pattern}`);
                });
            });
            
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }
}

// Run examples
const runExample = async (exampleName) => {
    console.log(`\n🚀 Running ${exampleName} example...\n`);
    
    try {
        switch (exampleName) {
            case 'basic':
                const basic = new BasicIntegrationExample();
                await basic.setup();
                basic.start(3000);
                break;
                
            case 'database':
                const db = new DatabaseIntegrationExample();
                await db.setup();
                db.app.listen(3001, () => console.log('Database service on 3001'));
                break;
                
            case 'gateway':
                const gateway = new APIGatewayExample();
                await gateway.setup();
                gateway.app.listen(3002, () => console.log('API Gateway on 3002'));
                break;
                
            case 'microservices':
                const micro = new MicroservicesExample();
                await micro.setup();
                micro.startServices();
                break;
                
            case 'advanced':
                const advanced = new AdvancedIntegrationExample();
                await advanced.setup();
                advanced.app.listen(3003, () => console.log('Advanced service on 3003'));
                break;
                
            case 'realtime':
                const realtime = new RealTimeExample();
                await realtime.setup();
                realtime.app.listen(3004, () => console.log('Real-time service on 3004'));
                break;
                
            default:
                console.log(`Unknown example: ${exampleName}`);
        }
    } catch (error) {
        console.error(`Error running ${exampleName} example:`, error);
    }
};

// Export examples for direct use
export {
    BasicIntegrationExample,
    DatabaseIntegrationExample,
    APIGatewayExample,
    MicroservicesExample,
    AdvancedIntegrationExample,
    RealTimeExample,
    runExample
};

// CLI usage
if (process.argv[1].includes('integration-examples.js')) {
    const example = process.argv[2] || 'basic';
    runExample(example);
}