/**
 * Tenant Routing Service
 * UAE Tailoring Business Platform
 */

import { TenantRoute, TenantAPIConfig, MultiTenantResponse } from '../../types';
import { cacheService } from '../cache/tenant-cache';
import { databaseService } from '../database/tenant-database';

interface RequestContext {
  headers: Record<string, string>;
  hostname: string;
  path: string;
  method: string;
  ip: string;
  query: Record<string, any>;
}

export class TenantRoutingService {
  private routes: Map<string, TenantRoute> = new Map();
  private apiConfigs: Map<string, TenantAPIConfig> = new Map();

  constructor() {
    this.initializeDefaultRoutes();
    this.initializeDefaultAPIConfigs();
  }

  /**
   * Extract tenant ID from request
   */
  async extractTenantId(request: any): Promise<string | null> {
    try {
      const context = this.createRequestContext(request);
      
      // Try multiple methods to identify tenant
      const methods = [
        () => this.extractFromHeader(context),
        () => this.extractFromSubdomain(context),
        () => this.extractFromPath(context),
        () => this.extractFromQuery(context),
        () => this.extractFromDomain(context)
      ];

      for (const method of methods) {
        const tenantId = await method();
        if (tenantId) {
          return tenantId;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to extract tenant ID:', error);
      return null;
    }
  }

  /**
   * Extract tenant from header
   */
  private async extractFromHeader(context: RequestContext): Promise<string | null> {
    const tenantHeader = context.headers['x-tenant-id'] || 
                        context.headers['X-Tenant-Id'] ||
                        context.headers['tenant-id'] ||
                        context.headers['Tenant-Id'];

    if (tenantHeader) {
      // Validate that tenant exists
      const tenant = await databaseService.findOne('tenants', { id: tenantHeader });
      return tenant ? tenant.id : null;
    }

    return null;
  }

  /**
   * Extract tenant from subdomain
   */
  private async extractFromSubdomain(context: RequestContext): Promise<string | null> {
    const hostname = context.hostname;
    
    // Check if this is a subdomain (e.g., tenant1.example.com)
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const subdomain = parts[0];
      
      // Check if subdomain matches a tenant
      const tenant = await databaseService.findOne('tenants', { subdomain });
      if (tenant) {
        return tenant.id;
      }
    }

    return null;
  }

  /**
   * Extract tenant from path
   */
  private async extractFromPath(context: RequestContext): Promise<string | null> {
    const path = context.path;
    
    // Check for /tenant/{slug} pattern
    const match = path.match(/^\/tenant\/([a-z0-9-]+)/i);
    if (match) {
      const slug = match[1];
      const tenant = await databaseService.findOne('tenants', { slug });
      if (tenant) {
        return tenant.id;
      }
    }

    return null;
  }

  /**
   * Extract tenant from query parameter
   */
  private async extractFromQuery(context: RequestContext): Promise<string | null> {
    const tenantQuery = context.query.tenant || 
                       context.query.tenantId || 
                       context.query['tenant-id'];

    if (tenantQuery) {
      const tenant = await databaseService.findOne('tenants', { id: tenantQuery });
      return tenant ? tenant.id : null;
    }

    return null;
  }

  /**
   * Extract tenant from domain
   */
  private async extractFromDomain(context: RequestContext): Promise<string | null> {
    const hostname = context.hostname;
    
    // Check for custom domain mapping
    const tenant = await databaseService.findOne('tenants', { domain: hostname });
    if (tenant) {
      return tenant.id;
    }

    return null;
  }

  /**
   * Get route for request
   */
  getRoute(tenantId: string, path: string, method: string): TenantRoute | null {
    // Create cache key for route lookup
    const cacheKey = `route:${tenantId}:${method}:${path}`;
    
    // Check cache first (in a real implementation)
    // const cached = await cacheService.get<TenantRoute>(cacheKey);
    // if (cached) return cached;

    // Find matching route
    const route = this.findMatchingRoute(tenantId, path, method);
    if (route) {
      // Cache the result
      // await cacheService.set(cacheKey, route, 300); // 5 minutes
    }

    return route;
  }

  /**
   * Find matching route
   */
  private findMatchingRoute(tenantId: string, path: string, method: string): TenantRoute | null {
    // Get tenant-specific routes first
    const tenantRoutes = this.getTenantRoutes(tenantId);
    
    for (const route of tenantRoutes) {
      if (this.matchesRoute(route, path, method)) {
        return route;
      }
    }

    // Fall back to global routes
    const globalRoutes = this.getGlobalRoutes();
    for (const route of globalRoutes) {
      if (this.matchesRoute(route, path, method)) {
        return route;
      }
    }

    return null;
  }

  /**
   * Check if request matches route
   */
  private matchesRoute(route: TenantRoute, path: string, method: string): boolean {
    // Convert route path to regex
    const pattern = this.pathToRegex(route.path);
    const matches = pattern.test(path);

    if (!matches) return false;

    // Check HTTP method
    if (route.path.includes(':method') && method.toUpperCase() !== route.path.split(':method')[1].split('/')[0].toUpperCase()) {
      return false;
    }

    return true;
  }

  /**
   * Convert path to regex
   */
  private pathToRegex(path: string): RegExp {
    // Convert route parameters to regex groups
    const regex = path
      .replace(/:([a-zA-Z0-9_]+)/g, '([^/]+)')
      .replace(/\//g, '\\/')
      .replace(/:method/g, '');

    return new RegExp(`^${regex}$`);
  }

  /**
   * Get tenant-specific routes
   */
  private getTenantRoutes(tenantId: string): TenantRoute[] {
    const tenantRoutes: TenantRoute[] = [];
    
    // In a real implementation, these would be loaded from database
    // and customized per tenant
    tenantRoutes.push(
      {
        path: '/dashboard',
        component: 'TenantDashboard',
        requiresAuth: true,
        requiredPermissions: ['dashboard:read'],
        requiredRoles: [],
        layout: 'tenant',
        metadata: { tenant: tenantId }
      },
      {
        path: '/orders',
        component: 'OrderList',
        requiresAuth: true,
        requiredPermissions: ['orders:read'],
        requiredRoles: [],
        layout: 'tenant',
        metadata: { tenant: tenantId }
      },
      {
        path: '/customers',
        component: 'CustomerList',
        requiresAuth: true,
        requiredPermissions: ['customers:read'],
        requiredRoles: [],
        layout: 'tenant',
        metadata: { tenant: tenantId }
      }
    );

    return tenantRoutes;
  }

  /**
   * Get global routes
   */
  private getGlobalRoutes(): TenantRoute[] {
    return [
      {
        path: '/:method/login',
        component: 'TenantLogin',
        requiresAuth: false,
        requiredPermissions: [],
        requiredRoles: [],
        layout: 'public',
        metadata: { global: true }
      },
      {
        path: '/:method/register',
        component: 'TenantRegistration',
        requiresAuth: false,
        requiredPermissions: [],
        requiredRoles: [],
        layout: 'public',
        metadata: { global: true }
      },
      {
        path: '/api/:method/*',
        component: 'APIRoute',
        requiresAuth: false,
        requiredPermissions: [],
        requiredRoles: [],
        layout: 'api',
        metadata: { global: true, api: true }
      }
    ];
  }

  /**
   * Get API configuration for tenant
   */
  getAPIConfig(tenantId: string): TenantAPIConfig | null {
    // Check cache first
    const cacheKey = `api-config:${tenantId}`;
    
    // In a real implementation:
    // return await cacheService.getOrSet(cacheKey, async () => {
    //   return this.loadAPIConfig(tenantId);
    // });

    return this.apiConfigs.get('default') || null;
  }

  /**
   * Create tenant-specific subdomain URL
   */
  createSubdomainURL(tenantSlug: string, baseDomain: string, path: string = '/'): string {
    const protocol = baseDomain.startsWith('https') ? 'https' : 'http';
    const cleanDomain = baseDomain.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
    
    return `${protocol}://${tenantSlug}.${cleanDomain}${path}`;
  }

  /**
   * Create custom domain URL
   */
  createCustomDomainURL(domain: string, path: string = '/'): string {
    const protocol = domain.startsWith('https') ? 'https' : 'http';
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
    
    return `${protocol}://${cleanDomain}${path}`;
  }

  /**
   * Generate tenant-specific assets URL
   */
  generateAssetURL(tenantId: string, assetPath: string,cdnUrl?: string): string {
    const baseURL = cdnUrl || process.env.ASSET_CDN_URL || '/assets';
    return `${baseURL}/tenants/${tenantId}/${assetPath}`;
  }

  /**
   * Validate tenant URL
   */
  async validateTenantURL(url: string): Promise<{ valid: boolean; tenantId?: string; error?: string }> {
    try {
      const urlObj = new URL(url);
      
      // Extract tenant identifier
      const tenantId = await this.extractTenantId({
        headers: {},
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'GET',
        ip: '',
        query: Object.fromEntries(urlObj.searchParams)
      });

      if (!tenantId) {
        return { valid: false, error: 'Tenant not found for URL' };
      }

      // Check if URL format is valid
      const route = this.getRoute(tenantId, urlObj.pathname, 'GET');
      if (!route) {
        return { valid: false, error: 'Invalid URL path' };
      }

      return { valid: true, tenantId };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Invalid URL' 
      };
    }
  }

  /**
   * Create redirect rules for tenant
   */
  createRedirectRules(tenantId: string, rules: Array<{
    from: string;
    to: string;
    type: 'permanent' | 'temporary';
  }>): Array<{ pattern: string; target: string; type: 'permanent' | 'temporary' }> {
    return rules.map(rule => ({
      pattern: this.pathToRegex(rule.from).source,
      target: rule.to,
      type: rule.type
    }));
  }

  /**
   * Get tenant-specific middleware
   */
  getTenantMiddleware(tenantId: string, path: string, method: string): string[] {
    const middleware: string[] = ['tenant-context', 'tenant-auth'];

    // Add security middleware for sensitive paths
    if (path.includes('/admin') || path.includes('/api')) {
      middleware.push('tenant-security', 'rate-limit');
    }

    // Add validation middleware for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      middleware.push('tenant-validation');
    }

    return middleware;
  }

  /**
   * Create request context from incoming request
   */
  private createRequestContext(request: any): RequestContext {
    return {
      headers: request.headers || {},
      hostname: request.hostname || request.host || '',
      path: request.path || request.url?.split('?')[0] || '',
      method: request.method || 'GET',
      ip: request.ip || request.connection?.remoteAddress || '',
      query: request.query || Object.fromEntries(new URLSearchParams(request.url?.split('?')[1] || ''))
    };
  }

  /**
   * Initialize default routes
   */
  private initializeDefaultRoutes(): void {
    // Register common routes
    const defaultRoutes: TenantRoute[] = [
      {
        path: '/dashboard',
        component: 'TenantDashboard',
        requiresAuth: true,
        requiredPermissions: ['dashboard:read'],
        requiredRoles: ['user', 'admin'],
        layout: 'tenant',
        metadata: { category: 'dashboard' }
      },
      {
        path: '/settings',
        component: 'TenantSettings',
        requiresAuth: true,
        requiredPermissions: ['settings:read'],
        requiredRoles: ['admin'],
        layout: 'tenant',
        metadata: { category: 'settings' }
      }
    ];

    for (const route of defaultRoutes) {
      this.routes.set(`${route.path}:${route.layout}`, route);
    }
  }

  /**
   * Initialize default API configurations
   */
  private initializeDefaultAPIConfigs(): void {
    const defaultConfig: TenantAPIConfig = {
      baseUrl: '/api/v1',
      version: 'v1',
      rateLimit: {
        requests: 1000,
        window: 60 // 1 minute
      },
      endpoints: [
        {
          path: '/orders',
          method: 'GET',
          requiresAuth: true,
          requiredPermissions: ['orders:read'],
          responseFormat: 'json'
        },
        {
          path: '/orders',
          method: 'POST',
          requiresAuth: true,
          requiredPermissions: ['orders:create'],
          responseFormat: 'json'
        }
      ],
      authentication: {
        method: 'jwt',
        required: true
      }
    };

    this.apiConfigs.set('default', defaultConfig);
  }

  /**
   * Clear route cache for tenant
   */
  async clearRouteCache(tenantId: string): Promise<void> {
    const pattern = `route:${tenantId}:*`;
    await cacheService.deletePattern(pattern);
  }

  /**
   * Preload routes for tenant
   */
  async preloadRoutes(tenantId: string): Promise<void> {
    // Preload frequently used routes
    const routesToPreload = [
      '/dashboard',
      '/orders',
      '/customers',
      '/settings'
    ];

    for (const path of routesToPreload) {
      const route = this.getRoute(tenantId, path, 'GET');
      if (route) {
        const cacheKey = `route:${tenantId}:GET:${path}`;
        await cacheService.set(cacheKey, route, 300); // 5 minutes
      }
    }
  }
}

// Export singleton instance
export const tenantRoutingService = new TenantRoutingService();
