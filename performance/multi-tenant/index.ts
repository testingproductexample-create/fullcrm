/**
 * Multi-Tenant System - Main Export
 * UAE Tailoring Business Platform
 */

// Core Services
export { multiTenantContext, MultiTenantContext } from './core/tenant-context';
export { TenantStorageService } from './core/storage/tenant-storage';
export { databaseService, DatabaseService } from './core/database/tenant-database';
export { cacheService, CacheService } from './core/cache/tenant-cache';
export { tenantSecurityService, TenantSecurityService } from './core/security/tenant-security';
export { tenantValidationService, TenantValidationService } from './core/validation/tenant-validation';
export { tenantRoutingService, TenantRoutingService } from './core/routing/tenant-routing';

// Middleware and Guards
export { 
  TenantMiddleware, 
  AuthenticatedRequest,
  tenantResolver,
  authenticate,
  requireRoles,
  requirePermissions,
  rateLimit,
  validateInput,
  securityHeaders,
  auditLog,
  cors,
  errorHandler,
  cleanup
} from './middleware/tenant-middleware';

export { tenantGuards, TenantGuards } from './guards/tenant-guards';

// White Label
export { whiteLabelService, WhiteLabelService } from './white-label/white-label-service';

// Onboarding
export { tenantOnboardingService, TenantOnboardingService } from './onboarding/tenant-onboarding';

// Types
export * from './types';

// Utility functions
export class MultiTenantUtils {
  /**
   * Create a tenant-aware Express router
   */
  static createTenantRouter(tenantId: string) {
    const express = require('express');
    const router = express.Router();

    // Add tenant context to all routes
    router.use((req, res, next) => {
      req.tenantId = tenantId;
      next();
    });

    return router;
  }

  /**
   * Get tenant configuration
   */
  static async getTenantConfig(tenantId: string) {
    const context = multiTenantContext;
    const tenant = await context.getTenant(tenantId);
    return tenant?.configuration || null;
  }

  /**
   * Check if feature is enabled for tenant
   */
  static async isFeatureEnabled(tenantId: string, feature: string): Promise<boolean> {
    const config = await this.getTenantConfig(tenantId);
    return config?.features?.[feature] || false;
  }

  /**
   * Get tenant-specific database query with isolation
   */
  static async getIsolatedQuery(
    baseQuery: string, 
    tenantId: string, 
    additionalConditions: string[] = []
  ): Promise<{ query: string; params: any[] }> {
    const conditions = [`tenant_id = $1`, ...additionalConditions];
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Insert WHERE clause before ORDER BY, LIMIT, etc.
    const queryWithWhere = baseQuery.replace(
      /(ORDER BY|LIMIT|OFFSET|GROUP BY|HAVING)/i,
      `${whereClause} $1 $2`
    );

    return {
      query: queryWithWhere,
      params: [tenantId]
    };
  }

  /**
   * Create tenant-scoped cache key
   */
  static createCacheKey(tenantId: string, resource: string, identifier?: string): string {
    return `tenant:${tenantId}:${resource}${identifier ? `:${identifier}` : ''}`;
  }

  /**
   * Validate tenant limits
   */
  static async checkTenantLimits(tenantId: string, resource: string, quantity: number = 1): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
  }> {
    const tenant = await multiTenantContext.getTenant(tenantId);
    if (!tenant) {
      return { allowed: false, remaining: 0, limit: 0 };
    }

    // Get current usage (this would be implemented with actual metrics)
    const limits: any = {
      users: tenant.limits.maxUsers,
      storage: tenant.limits.maxStorage,
      orders: tenant.limits.maxOrders,
      customers: tenant.limits.maxCustomers,
      apiCalls: tenant.limits.maxApiCalls
    };

    const limit = limits[resource] || 0;
    const used = await this.getCurrentUsage(tenantId, resource);
    const remaining = Math.max(0, limit - used);

    return {
      allowed: remaining >= quantity,
      remaining,
      limit
    };
  }

  /**
   * Get current resource usage for tenant
   */
  private static async getCurrentUsage(tenantId: string, resource: string): Promise<number> {
    // In real implementation, this would query actual usage metrics
    const usageMap: Record<string, number> = {
      users: 0,
      storage: 0,
      orders: 0,
      customers: 0,
      apiCalls: 0
    };

    return usageMap[resource] || 0;
  }
}

// Default configuration
export const MultiTenantConfig = {
  // Database settings
  database: {
    type: 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'tailoring_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.NODE_ENV === 'production'
  },

  // Cache settings
  cache: {
    type: process.env.CACHE_TYPE || 'memory', // 'memory' or 'redis'
    ttl: 3600, // 1 hour
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    }
  },

  // Security settings
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    bcryptRounds: 12,
    sessionTimeout: 480, // 8 hours
    maxLoginAttempts: 5,
    lockoutDuration: 900 // 15 minutes
  },

  // White-label settings
  whiteLabel: {
    enabled: true,
    customDomains: true,
    sslEnabled: true,
    assetCDN: process.env.ASSET_CDN_URL || '/assets'
  },

  // Onboarding settings
  onboarding: {
    enabled: true,
    requiredFlow: true,
    maxDuration: 60, // 60 minutes
    autoComplete: false
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    tenantSpecific: true
  }
};

// Initialize the system
export async function initializeMultiTenantSystem(config: typeof MultiTenantConfig = MultiTenantConfig) {
  try {
    console.log('Initializing Multi-Tenant System...');

    // Initialize database
    const db = require('./core/database/tenant-database').databaseService;
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) {
      throw new Error('Database health check failed');
    }

    // Initialize cache
    const cache = require('./core/cache/tenant-cache').cacheService;
    await cache.warmUpTenant({} as any); // Would warm up with system config

    console.log('Multi-Tenant System initialized successfully');
    
    return {
      success: true,
      message: 'Multi-Tenant System ready'
    };
  } catch (error) {
    console.error('Failed to initialize Multi-Tenant System:', error);
    throw error;
  }
}

// Health check
export async function multiTenantHealthCheck() {
  const checks = {
    database: false,
    cache: false,
    storage: false
  };

  try {
    // Check database
    const db = require('./core/database/tenant-database').databaseService;
    checks.database = await db.healthCheck();

    // Check cache (simplified)
    checks.cache = true; // In real implementation, would ping Redis or check memory usage

    // Check storage
    checks.storage = true; // In real implementation, would check disk space, etc.

    const allHealthy = Object.values(checks).every(check => check === true);

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

// Export version
export const MultiTenantVersion = '1.0.0';

// Default export
export default {
  MultiTenantContext: multiTenantContext,
  TenantStorageService,
  DatabaseService,
  CacheService,
  TenantSecurityService,
  TenantValidationService,
  TenantRoutingService,
  TenantMiddleware,
  TenantGuards,
  WhiteLabelService,
  TenantOnboardingService,
  MultiTenantUtils,
  MultiTenantConfig,
  initializeMultiTenantSystem,
  multiTenantHealthCheck,
  version: MultiTenantVersion
};
