/**
 * Comprehensive Testing Suite
 * Unit tests, integration tests, and performance benchmarks for the caching system
 */

import { jest } from '@jest/globals';
import { CacheManager } from '../core/cache-manager.js';
import { RedisClient } from '../core/redis-client.js';
import { QueryCache } from '../database/query-cache.js';
import { ResponseCache } from '../api/response-cache.js';
import { ImageOptimizer } from '../image/image-optimizer.js';
import { CDNManager } from '../cdn/cdn-manager.js';
import { CacheOptimizer } from '../tools/cache-optimizer.js';
import { PerformanceMonitor } from '../tools/performance-monitor.js';
import { logger } from '../utils/logger.js';

// Test utilities and helpers
class TestUtils {
    static createMockRedis() {
        const mockRedis = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
            flushall: jest.fn(),
            config: jest.fn(),
            info: jest.fn(() => Promise.resolve('redis_version:6.0.0')),
            ping: jest.fn(() => Promise.resolve('PONG')),
            quit: jest.fn(() => Promise.resolve('OK'))
        };
        
        mockRedis.get.mockImplementation((key) => {
            const value = this.testData.get(key);
            return Promise.resolve(value ? JSON.stringify(value) : null);
        });
        
        mockRedis.set.mockImplementation((key, value) => {
            this.testData.set(key, JSON.parse(value));
            return Promise.resolve('OK');
        });
        
        mockRedis.del.mockImplementation((key) => {
            this.testData.delete(key);
            return Promise.resolve(1);
        });
        
        mockRedis.keys.mockImplementation((pattern) => {
            const keys = Array.from(this.testData.keys()).filter(key => 
                pattern.replace('*', '') === '' || key.startsWith(pattern.replace('*', ''))
            );
            return Promise.resolve(keys);
        });
        
        mockRedis.flushall.mockImplementation(() => {
            this.testData.clear();
            return Promise.resolve('OK');
        });
        
        return mockRedis;
    }
    
    static testData = new Map();
    
    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static generateTestData(count = 100) {
        return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: `Test Item ${i + 1}`,
            value: Math.random() * 1000,
            timestamp: new Date().toISOString(),
            tags: ['test', 'data', `tag-${i % 10}`]
        }));
    }
    
    static measurePerformance(fn) {
        const start = process.hrtime.bigint();
        const result = fn();
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        
        return { result, duration };
    }
    
    static createMockRequest(params = {}) {
        return {
            method: 'GET',
            url: '/test',
            headers: { 'user-agent': 'test-agent' },
            query: {},
            params: {},
            ...params
        };
    }
    
    static createMockResponse() {
        const res = {
            statusCode: 200,
            headers: {},
            data: null,
            
            status(code) {
                this.statusCode = code;
                return this;
            },
            
            json(data) {
                this.data = data;
                this.headers['content-type'] = 'application/json';
                return this;
            },
            
            send(data) {
                this.data = data;
                return this;
            },
            
            set(name, value) {
                this.headers[name] = value;
                return this;
            }
        };
        
        return res;
    }
}

// Cache Manager Tests
describe('CacheManager', () => {
    let cacheManager;
    let mockRedis;
    
    beforeEach(() => {
        mockRedis = TestUtils.createMockRedis();
        cacheManager = new CacheManager(mockRedis, {
            defaultTTL: 300,
            enableMetrics: true
        });
    });
    
    afterEach(() => {
        TestUtils.testData.clear();
        jest.clearAllMocks();
    });
    
    describe('Basic Operations', () => {
        test('should set and get cache values', async () => {
            const key = 'test:key';
            const value = { name: 'test', value: 123 };
            
            await cacheManager.set(key, value, { ttl: 300 });
            const retrieved = await cacheManager.get(key);
            
            expect(retrieved).toEqual(value);
        });
        
        test('should return null for non-existent keys', async () => {
            const value = await cacheManager.get('nonexistent');
            expect(value).toBeNull();
        });
        
        test('should delete cache entries', async () => {
            const key = 'test:delete';
            const value = { name: 'test' };
            
            await cacheManager.set(key, value);
            await cacheManager.del(key);
            
            const retrieved = await cacheManager.get(key);
            expect(retrieved).toBeNull();
        });
        
        test('should handle TTL expiration', async () => {
            const key = 'test:ttl';
            const value = { name: 'test' };
            
            await cacheManager.set(key, value, { ttl: 0.1 }); // 100ms
            await TestUtils.sleep(150);
            
            const retrieved = await cacheManager.get(key);
            expect(retrieved).toBeNull();
        });
    });
    
    describe('Batch Operations', () => {
        test('should handle batch gets', async () => {
            const items = { key1: 'value1', key2: 'value2', key3: 'value3' };
            
            await Promise.all(
                Object.entries(items).map(([key, value]) => 
                    cacheManager.set(key, value)
                )
            );
            
            const results = await cacheManager.mget(Object.keys(items));
            expect(results).toEqual(['value1', 'value2', 'value3']);
        });
        
        test('should handle batch sets', async () => {
            const items = { key1: 'value1', key2: 'value2' };
            
            await cacheManager.mset(items);
            
            const results = await cacheManager.mget(Object.keys(items));
            expect(results).toEqual(['value1', 'value2']);
        });
    });
    
    describe('Pattern Operations', () => {
        test('should clear by pattern', async () => {
            await cacheManager.set('pattern:test1', 'value1');
            await cacheManager.set('pattern:test2', 'value2');
            await cacheManager.set('other:key', 'value3');
            
            const cleared = await cacheManager.clearByPattern('pattern:test*');
            expect(cleared).toBe(2);
            
            const remaining = await cacheManager.get('other:key');
            expect(remaining).toBe('value3');
        });
    });
    
    describe('Statistics', () => {
        test('should track cache statistics', async () => {
            const key = 'stats:test';
            const value = 'test value';
            
            // Simulate hits and misses
            await cacheManager.set(key, value);
            await cacheManager.get(key); // Hit
            await cacheManager.get('nonexistent'); // Miss
            
            const stats = await cacheManager.getStats();
            expect(stats).toHaveProperty('hits');
            expect(stats).toHaveProperty('misses');
            expect(stats).toHaveProperty('hitRate');
        });
    });
});

// Redis Client Tests
describe('RedisClient', () => {
    let redisClient;
    
    beforeEach(() => {
        redisClient = new RedisClient({
            host: 'localhost',
            port: 6379,
            enableOfflineQueue: false
        });
    });
    
    afterEach(() => {
        if (redisClient.client) {
            redisClient.client.quit();
        }
    });
    
    test('should connect to Redis', async () => {
        // Mock connection
        redisClient.client = TestUtils.createMockRedis();
        
        await redisClient.connect();
        expect(redisClient.client).toBeDefined();
    });
    
    test('should handle connection errors', async () => {
        const error = new Error('Connection refused');
        redisClient.client = {
            connect: jest.fn().mockRejectedValue(error),
            on: jest.fn()
        };
        
        await expect(redisClient.connect()).rejects.toThrow('Connection refused');
    });
    
    test('should execute commands with retry logic', async () => {
        redisClient.client = TestUtils.createMockRedis();
        redisClient.client.get.mockRejectedValueOnce(new Error('Temporary error'));
        
        const result = await redisClient.get('test:key');
        expect(result).toBeNull(); // Due to our mock
        expect(redisClient.client.get).toHaveBeenCalledTimes(2); // Retry happened
    });
});

// Query Cache Tests
describe('QueryCache', () => {
    let queryCache;
    let mockCacheManager;
    
    beforeEach(() => {
        mockCacheManager = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn()
        };
        
        queryCache = new QueryCache(mockCacheManager, {
            defaultTTL: 300,
            normalizeQueries: true,
            enableCompression: true
        });
    });
    
    test('should cache database queries', async () => {
        const query = 'SELECT * FROM users WHERE id = ?';
        const params = [123];
        const result = { id: 123, name: 'John Doe' };
        
        mockCacheManager.get.mockResolvedValue(null);
        mockCacheManager.set.mockResolvedValue('OK');
        
        const cached = await queryCache.get(query, params);
        expect(cached).toEqual(result);
        expect(mockCacheManager.set).toHaveBeenCalled();
    });
    
    test('should return cached results', async () => {
        const query = 'SELECT * FROM users';
        const result = [{ id: 1, name: 'John' }];
        
        mockCacheManager.get.mockResolvedValue(result);
        
        const cached = await queryCache.get(query);
        expect(cached).toEqual(result);
        expect(mockCacheManager.get).toHaveBeenCalled();
    });
    
    test('should invalidate cache on write operations', async () => {
        const query = 'UPDATE users SET name = ? WHERE id = ?';
        const params = ['Jane', 123];
        
        mockCacheManager.del.mockResolvedValue(1);
        
        await queryCache.invalidate('users', 123);
        
        expect(mockCacheManager.del).toHaveBeenCalled();
    });
    
    test('should normalize queries for consistent keys', async () => {
        const query1 = 'SELECT * FROM users WHERE id = 123';
        const query2 = 'SELECT * FROM users WHERE id=123';
        
        expect(queryCache.normalizeQuery(query1)).toEqual(queryCache.normalizeQuery(query2));
    });
});

// Response Cache Tests
describe('ResponseCache', () => {
    let responseCache;
    let mockCacheManager;
    let mockRequest;
    let mockResponse;
    
    beforeEach(() => {
        mockCacheManager = {
            get: jest.fn(),
            set: jest.fn()
        };
        
        mockRequest = TestUtils.createMockRequest();
        mockResponse = TestUtils.createMockResponse();
        
        responseCache = new ResponseCache(mockCacheManager, {
            defaultTTL: 300,
            enableCompression: true
        });
    });
    
    test('should cache HTTP responses', async () => {
        const key = 'api:users';
        const data = { users: [{ id: 1, name: 'John' }] };
        
        mockCacheManager.get.mockResolvedValue(null);
        mockCacheManager.set.mockResolvedValue('OK');
        
        await responseCache.set(key, data, { ttl: 300 });
        
        expect(mockCacheManager.set).toHaveBeenCalledWith(
            key,
            expect.objectContaining({ data, statusCode: 200 }),
            expect.any(Object)
        );
    });
    
    test('should retrieve cached responses', async () => {
        const key = 'api:users';
        const cachedData = {
            data: { users: [{ id: 1, name: 'John' }] },
            statusCode: 200,
            headers: { 'content-type': 'application/json' }
        };
        
        mockCacheManager.get.mockResolvedValue(cachedData);
        
        const result = await responseCache.get(key);
        expect(result).toEqual(cachedData);
    });
    
    test('should handle conditional requests', async () => {
        const key = 'api:data';
        const cachedData = {
            data: { version: 1 },
            statusCode: 200,
            headers: { etag: 'abc123', 'last-modified': '2023-01-01T00:00:00Z' }
        };
        
        const request = {
            ...mockRequest,
            headers: { 'if-none-match': 'abc123' }
        };
        
        mockCacheManager.get.mockResolvedValue(cachedData);
        
        const result = await responseCache.get(key, { request });
        
        expect(result.statusCode).toBe(304); // Not Modified
    });
});

// Image Optimizer Tests
describe('ImageOptimizer', () => {
    let imageOptimizer;
    
    beforeEach(() => {
        imageOptimizer = new ImageOptimizer({
            qualityDefault: 85,
            webpEnabled: true,
            avifEnabled: true
        });
    });
    
    test('should optimize images', async () => {
        const options = {
            source: 'test.jpg',
            width: 800,
            height: 600,
            quality: 80,
            format: 'webp'
        };
        
        // Mock the sharp library
        jest.mock('sharp', () => {
            return jest.fn().mockImplementation(() => ({
                resize: jest.fn().mockReturnThis(),
                webp: jest.fn().mockReturnThis(),
                toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized image data'))
            }));
        });
        
        const result = await imageOptimizer.optimize(options);
        
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe('optimized image data');
    });
    
    test('should generate responsive images', async () => {
        const options = {
            source: 'test.jpg',
            breakpoints: [320, 768, 1024, 1920],
            format: 'webp'
        };
        
        const result = await imageOptimizer.generateResponsive(options);
        
        expect(result).toHaveProperty('sizes');
        expect(Object.keys(result.sizes)).toEqual(['320w', '768w', '1024w', '1920w']);
    });
});

// CDN Manager Tests
describe('CDNManager', () => {
    let cdnManager;
    
    beforeEach(() => {
        cdnManager = new CDNManager({
            defaultProvider: 'cloudflare',
            providers: {
                cloudflare: {
                    enabled: true,
                    apiToken: 'test-token'
                }
            }
        });
    });
    
    test('should initialize CDN providers', async () => {
        const providers = await cdnManager.initializeProviders();
        
        expect(providers).toHaveProperty('cloudflare');
        expect(providers.cloudflare).toBeDefined();
    });
    
    test('should purge cache by URL', async () => {
        const url = 'https://example.com/image.jpg';
        
        jest.spyOn(cdnManager.providers.cloudflare, 'purge').mockResolvedValue({ success: true });
        
        const result = await cdnManager.purgeCache([url]);
        
        expect(result).toHaveProperty('success');
        expect(cdnManager.providers.cloudflare.purge).toHaveBeenCalledWith([url]);
    });
    
    test('should get cache status', async () => {
        const url = 'https://example.com/data.json';
        
        jest.spyOn(cdnManager.providers.cloudflare, 'getStatus').mockResolvedValue({
            cached: true,
            cacheStatus: 'hit',
            lastModified: '2023-01-01T00:00:00Z'
        });
        
        const status = await cdnManager.getCacheStatus(url);
        
        expect(status).toHaveProperty('cached');
        expect(status).toHaveProperty('cacheStatus');
    });
});

// Cache Optimizer Tests
describe('CacheOptimizer', () => {
    let cacheOptimizer;
    let mockCacheManager;
    
    beforeEach(() => {
        mockCacheManager = {
            get: jest.fn(),
            set: jest.fn(),
            getStats: jest.fn().mockResolvedValue({
                hits: 1000,
                misses: 200,
                memoryUsage: 60
            })
        };
        
        cacheOptimizer = new CacheOptimizer(mockCacheManager, {
            analysisInterval: 60000,
            optimizationThreshold: 0.8
        });
    });
    
    test('should start optimization process', async () => {
        const performanceMonitor = {
            getCurrentMetrics: jest.fn().mockResolvedValue({
                hitRate: 0.7,
                memoryUsage: 0.6,
                responseTime: 150
            })
        };
        
        cacheOptimizer.performanceMonitor = performanceMonitor;
        
        await cacheOptimizer.start();
        
        expect(cacheOptimizer.isRunning).toBe(true);
    });
    
    test('should generate optimization recommendations', async () => {
        const analysis = {
            patterns: {
                frequency: new Map([
                    ['high', []],
                    ['medium', []],
                    ['low', []],
                    ['never', [1, 2, 3]],
                    ['totalKeys', 100]
                ])
            },
            bottlenecks: new Map(),
            performance: {
                hitRate: 0.6,
                memoryUsage: 0.8
            }
        };
        
        const optimizations = await cacheOptimizer.generateOptimizations();
        
        expect(optimizations).toBeInstanceOf(Array);
        expect(optimizations.length).toBeGreaterThan(0);
    });
    
    test('should apply safe optimizations', async () => {
        const optimizations = [
            {
                id: 'test-1',
                type: 'memory',
                autoApplicable: true,
                priority: 0.9,
                configuration: { maxMemory: 80 }
            }
        ];
        
        cacheOptimizer.applyOptimization = jest.fn().mockResolvedValue(undefined);
        
        const applied = await cacheOptimizer.applySafeOptimizations(optimizations);
        
        expect(applied).toHaveLength(1);
        expect(cacheOptimizer.applyOptimization).toHaveBeenCalledWith(optimizations[0]);
    });
});

// Performance Monitor Tests
describe('PerformanceMonitor', () => {
    let performanceMonitor;
    let mockComponents;
    
    beforeEach(() => {
        mockComponents = {
            cacheManager: {
                getStats: jest.fn().mockResolvedValue({
                    hits: 1000,
                    misses: 200,
                    totalKeys: 1500
                }),
                redis: {
                    info: jest.fn().mockResolvedValue('used_memory_human:10MB\nused_memory_peak_human:15MB')
                }
            }
        };
        
        performanceMonitor = new PerformanceMonitor(mockComponents, {
            collectionInterval: 5000
        });
    });
    
    test('should collect performance metrics', async () => {
        const metrics = await performanceMonitor.getCurrentMetrics();
        
        expect(metrics).toHaveProperty('cache');
        expect(metrics).toHaveProperty('memory');
        expect(metrics).toHaveProperty('timestamp');
    });
    
    test('should track performance trends', async () => {
        const history = performanceMonitor.getPerformanceHistory();
        
        expect(history).toBeInstanceOf(Array);
    });
    
    test('should detect performance anomalies', async () => {
        // Mock low hit rate to trigger anomaly
        mockComponents.cacheManager.getStats.mockResolvedValueOnce({
            hits: 100,
            misses: 900,
            totalKeys: 1000
        });
        
        const anomalies = await performanceMonitor.detectAnomalies();
        
        expect(anomalies).toBeInstanceOf(Array);
    });
});

// Integration Tests
describe('Cache System Integration', () => {
    let cachingSystem;
    
    beforeEach(() => {
        // Create mock components for integration tests
        cachingSystem = {
            components: new Map([
                ['cacheManager', {
                    get: jest.fn(),
                    set: jest.fn(),
                    getStats: jest.fn().mockResolvedValue({ hits: 1000, misses: 200 })
                }],
                ['redis', TestUtils.createMockRedis()],
                ['queryCache', new QueryCache({
                    get: jest.fn(),
                    set: jest.fn()
                })],
                ['responseCache', new ResponseCache({
                    get: jest.fn(),
                    set: jest.fn()
                })]
            ])
        };
    });
    
    test('should handle end-to-end caching flow', async () => {
        const cacheManager = cachingSystem.components.get('cacheManager');
        const queryCache = cachingSystem.components.get('queryCache');
        
        // Set up mock behavior
        cacheManager.get.mockResolvedValueOnce(null); // Cache miss
        cacheManager.get.mockResolvedValueOnce({ user: 'test' }); // Cache hit
        
        // Test query caching
        const result1 = await queryCache.get('SELECT * FROM users WHERE id = 1');
        expect(result1).toBeDefined();
        
        // Test cache hit on second call
        const result2 = await queryCache.get('SELECT * FROM users WHERE id = 1');
        expect(result2).toBeDefined();
        
        expect(cacheManager.set).toHaveBeenCalledTimes(1);
        expect(cacheManager.get).toHaveBeenCalledTimes(2);
    });
    
    test('should handle cache invalidation across layers', async () => {
        const cacheManager = cachingSystem.components.get('cacheManager');
        const queryCache = cachingSystem.components.get('queryCache');
        
        // Set up mock
        cacheManager.get.mockResolvedValue({ user: { id: 1, name: 'John' } });
        
        // Simulate cache invalidation
        await queryCache.invalidate('users', 1);
        
        expect(cacheManager.del).toHaveBeenCalled();
    });
});

// Load Testing
describe('Cache Performance Tests', () => {
    test('should handle high concurrent load', async () => {
        const cacheManager = new CacheManager(TestUtils.createMockRedis());
        const operations = 1000;
        const concurrency = 50;
        
        const start = Date.now();
        
        // Create concurrent operations
        const promises = Array.from({ length: operations }, (_, i) => 
            cacheManager.set(`test:key:${i}`, { value: i })
        );
        
        await Promise.all(promises);
        
        const duration = Date.now() - start;
        const throughput = operations / (duration / 1000);
        
        console.log(`Throughput: ${throughput.toFixed(2)} ops/sec`);
        
        expect(throughput).toBeGreaterThan(100); // At least 100 operations per second
    });
    
    test('should maintain performance under memory pressure', async () => {
        const cacheManager = new CacheManager(TestUtils.createMockRedis());
        const results = [];
        
        // Generate memory pressure with large objects
        for (let i = 0; i < 100; i++) {
            const largeObject = {
                data: Array.from({ length: 1000 }, (_, j) => ({
                    id: j,
                    content: 'x'.repeat(1000)
                }))
            };
            
            const { result, duration } = TestUtils.measurePerformance(
                () => cacheManager.set(`large:${i}`, largeObject, { ttl: 300 })
            );
            
            results.push(duration);
        }
        
        const averageDuration = results.reduce((a, b) => a + b, 0) / results.length;
        
        expect(averageDuration).toBeLessThan(100); // Average should be under 100ms
    });
});

// Cleanup and utilities
afterAll(() => {
    // Clean up test data
    TestUtils.testData.clear();
    
    // Close any open connections
    jest.clearAllTimers();
    jest.clearAllMocks();
});

export { TestUtils };