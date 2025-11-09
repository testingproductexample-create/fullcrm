/**
 * Tenant Cache Service
 * UAE Tailoring Business Platform
 */

import { Tenant, TenantUser } from '../../types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tenantId: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  totalKeys: number;
  memoryUsage: number;
}

export class CacheService {
  private redis: any = null; // Would be actual Redis client
  private localCache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    totalKeys: 0,
    memoryUsage: 0
  };
  private useRedis: boolean;

  constructor() {
    this.useRedis = !!process.env.REDIS_URL;
    this.initializeRedis();
    this.startCleanupTask();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    if (this.useRedis) {
      try {
        // In real implementation, this would connect to Redis
        console.log('Redis cache initialized');
      } catch (error) {
        console.error('Failed to initialize Redis, falling back to memory cache:', error);
        this.useRedis = false;
      }
    }
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.buildCacheKey(key);

    if (this.useRedis) {
      return await this.redisGet<T>(cacheKey);
    } else {
      return await this.memoryGet<T>(cacheKey);
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, ttlSeconds: number = 3600, tenantId?: string): Promise<void> {
    const cacheKey = this.buildCacheKey(key);

    if (this.useRedis) {
      await this.redisSet(cacheKey, data, ttlSeconds);
    } else {
      await this.memorySet(cacheKey, data, ttlSeconds, tenantId);
    }

    this.stats.sets++;
  }

  /**
   * Delete data from cache
   */
  async delete(key: string): Promise<boolean> {
    const cacheKey = this.buildCacheKey(key);

    if (this.useRedis) {
      return await this.redisDelete(cacheKey);
    } else {
      const deleted = this.localCache.delete(cacheKey);
      if (deleted) {
        this.stats.deletes++;
        this.updateStats();
      }
      return deleted;
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (this.useRedis) {
      return await this.redisDeletePattern(pattern);
    } else {
      return await this.memoryDeletePattern(pattern);
    }
  }

  /**
   * Clear all cache for a tenant
   */
  async clearTenant(tenantId: string): Promise<number> {
    let deleted = 0;

    if (this.useRedis) {
      const keys = await this.redis.keys(`tenant:${tenantId}:*`);
      for (const key of keys) {
        await this.redis.del(key);
        deleted++;
      }
    } else {
      for (const [key, entry] of this.localCache) {
        if (entry.tenantId === tenantId) {
          this.localCache.delete(key);
          deleted++;
        }
      }
    }

    return deleted;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const cacheKey = this.buildCacheKey(key);

    if (this.useRedis) {
      const result = await this.redis.exists(cacheKey);
      return result === 1;
    } else {
      return this.localCache.has(cacheKey);
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttlSeconds: number = 3600,
    tenantId?: string
  ): Promise<T> {
    let data = await this.get<T>(key);
    
    if (data === null) {
      data = await factory();
      await this.set(key, data, ttlSeconds, tenantId);
    }

    return data;
  }

  /**
   * Set multiple values at once
   */
  async setMultiple(entries: Record<string, any>, ttlSeconds: number = 3600): Promise<void> {
    if (this.useRedis) {
      const pipeline = this.redis.pipeline();
      for (const [key, value] of Object.entries(entries)) {
        const cacheKey = this.buildCacheKey(key);
        pipeline.setex(cacheKey, ttlSeconds, JSON.stringify(value));
      }
      await pipeline.exec();
    } else {
      for (const [key, value] of Object.entries(entries)) {
        const cacheKey = this.buildCacheKey(key);
        await this.memorySet(cacheKey, value, ttlSeconds);
      }
    }
  }

  /**
   * Get multiple values at once
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};

    if (this.useRedis) {
      const cacheKeys = keys.map(key => this.buildCacheKey(key));
      const values = await this.redis.mget(cacheKeys);
      
      keys.forEach((key, index) => {
        result[key] = values[index] ? JSON.parse(values[index]) : null;
      });
    } else {
      for (const key of keys) {
        result[key] = await this.get<T>(key);
      }
    }

    return result;
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    const cacheKey = this.buildCacheKey(key);

    if (this.useRedis) {
      return await this.redis.incrby(cacheKey, amount);
    } else {
      const current = await this.get<number>(key) || 0;
      const newValue = current + amount;
      await this.set(key, newValue);
      return newValue;
    }
  }

  /**
   * Set expiration
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    const cacheKey = this.buildCacheKey(key);

    if (this.useRedis) {
      await this.redis.expire(cacheKey, ttlSeconds);
    } else {
      const entry = this.localCache.get(cacheKey);
      if (entry) {
        entry.expiresAt = Date.now() + (ttlSeconds * 1000);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Warm up cache for tenant
   */
  async warmUpTenant(tenant: Tenant): Promise<void> {
    const warmupKeys = [
      `tenant:${tenant.id}:config`,
      `tenant:${tenant.id}:branding`,
      `tenant:${tenant.id}:limits`
    ];

    await this.setMultiple({
      [`tenant:${tenant.id}:config`]: tenant.configuration,
      [`tenant:${tenant.id}:branding`]: tenant.branding,
      [`tenant:${tenant.id}:limits`]: tenant.limits
    }, 7200); // 2 hours
  }

  /**
   * Cache tenant queries
   */
  async cacheTenantQuery<T>(
    tenantId: string,
    query: string,
    params: any[],
    result: T
  ): Promise<void> {
    const key = `tenant:${tenantId}:query:${this.hashQuery(query, params)}`;
    await this.set(key, result, 1800, tenantId); // 30 minutes
  }

  /**
   * Get cached tenant query
   */
  async getCachedTenantQuery<T>(
    tenantId: string,
    query: string,
    params: any[]
  ): Promise<T | null> {
    const key = `tenant:${tenantId}:query:${this.hashQuery(query, params)}`;
    return await this.get<T>(key);
  }

  /**
   * Redis implementations
   */
  private async redisGet<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      console.error('Redis GET error:', error);
      this.stats.misses++;
      return null;
    }
  }

  private async redisSet(key: string, data: any, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  private async redisDelete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result === 1;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  private async redisDeletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        return await this.redis.del(keys);
      }
      return 0;
    } catch (error) {
      console.error('Redis DELETE PATTERN error:', error);
      return 0;
    }
  }

  /**
   * Memory cache implementations
   */
  private async memoryGet<T>(key: string): Promise<T | null> {
    const entry = this.localCache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.localCache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  private async memorySet<T>(key: string, data: T, ttlSeconds: number, tenantId?: string): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      tenantId: tenantId || 'global'
    };

    this.localCache.set(key, entry);
    this.updateStats();
  }

  private async memoryDeletePattern(pattern: string): Promise<number> {
    let deleted = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));

    for (const [key] of this.localCache) {
      if (regex.test(key)) {
        this.localCache.delete(key);
        deleted++;
      }
    }

    this.stats.deletes += deleted;
    this.updateStats();
    return deleted;
  }

  /**
   * Start background cleanup task
   */
  private startCleanupTask(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.localCache) {
      if (now > entry.expiresAt) {
        this.localCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`);
      this.updateStats();
    }
  }

  /**
   * Build cache key with prefix
   */
  private buildCacheKey(key: string): string {
    return `mt:${key}`;
  }

  /**
   * Hash query for consistent key generation
   */
  private hashQuery(query: string, params: any[]): string {
    const str = query + JSON.stringify(params);
    return btoa(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.totalKeys = this.localCache.size;
    this.stats.memoryUsage = this.calculateMemoryUsage();
  }

  /**
   * Calculate memory usage (approximate)
   */
  private calculateMemoryUsage(): number {
    let usage = 0;
    for (const [, entry] of this.localCache) {
      usage += JSON.stringify(entry).length * 2; // Rough estimate
    }
    return usage;
  }

  /**
   * Shutdown cache service
   */
  async shutdown(): Promise<void> {
    if (this.useRedis && this.redis) {
      await this.redis.quit();
    }
    this.localCache.clear();
    console.log('Cache service shutdown complete');
  }
}

// Export singleton instance
export const cacheService = new CacheService();
