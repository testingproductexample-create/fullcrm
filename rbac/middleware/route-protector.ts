// Route Protector Middleware
// Combines authentication and permission checking for comprehensive route protection

import { Request, Response, NextFunction } from 'express';
import { 
  RBACException, 
  RBACErrorCode, 
  ProtectedRoute, 
  RoutePermission,
  PermissionName
} from '../types/rbac.types';
import { authenticate, AuthenticationMiddleware } from './auth';
import { 
  requirePermission, 
  requireAnyPermission, 
  requireAllPermissions,
  requireResourceLevel,
  requireOwnership
} from './permissions';
import { parsePermissionName, validatePermissionName } from '../utils/permissions';

interface RouteProtectionOptions {
  authentication?: 'required' | 'optional' | 'none';
  permissions?: PermissionName[];
  requireAllPermissions?: boolean;
  resourceAccess?: {
    resource: string;
    level: 'read' | 'write' | 'manage';
  };
  ownershipCheck?: {
    resourceIdParam?: string;
    ownerIdParam?: string;
    allowAdminOverride?: boolean;
  };
  allowPublicAccess?: boolean;
  rateLimitEnabled?: boolean;
  logAccess?: boolean;
  customValidator?: (req: Request) => Promise<boolean> | boolean;
}

interface RoutePattern {
  pattern: string | RegExp;
  methods?: string[];
  options: RouteProtectionOptions;
}

export class RouteProtector {
  private routes: RoutePattern[] = [];
  private defaultOptions: RouteProtectionOptions = {
    authentication: 'required',
    permissions: [],
    requireAllPermissions: false,
    resourceAccess: undefined,
    ownershipCheck: undefined,
    allowPublicAccess: false,
    rateLimitEnabled: true,
    logAccess: true,
    customValidator: undefined
  };

  /**
   * Protect a single route
   * @param options - Protection options
   * @returns Express middleware function
   */
  public protect = (options: RouteProtectionOptions = {}) => {
    const config = { ...this.defaultOptions, ...options };

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // 1. Handle authentication
        await this.handleAuthentication(req, res, config);

        // 2. Handle permissions
        await this.handlePermissions(req, res, config);

        // 3. Handle resource access
        await this.handleResourceAccess(req, res, config);

        // 4. Handle ownership check
        await this.handleOwnershipCheck(req, res, config);

        // 5. Handle custom validation
        await this.handleCustomValidation(req, res, config);

        // 6. Log access
        this.logAccess(req, res, config);

        // Continue to route handler
        next();

      } catch (error) {
        this.handleProtectionError(res, error);
      }
    };
  };

  /**
   * Protect multiple routes with the same options
   * @param routes - Array of route patterns and their options
   * @returns Express middleware function
   */
  public protectRoutes = (routes: RoutePattern[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const matchedRoute = this.findMatchingRoute(req, routes);
      
      if (!matchedRoute) {
        // No matching route, apply default protection
        return this.protect()(req, res, next);
      }

      // Apply protection for matched route
      const middleware = this.protect(matchedRoute.options);
      return middleware(req, res, next);
    };
  };

  /**
   * Protect route based on path patterns
   * @param patterns - Array of path patterns and their protection options
   * @returns Express middleware function
   */
  public protectByPath = (patterns: RoutePattern[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const matchedPattern = patterns.find(pattern => {
        if (typeof pattern.pattern === 'string') {
          // Simple string matching (you might want to use path-to-regexp for advanced patterns)
          return req.path.startsWith(pattern.pattern);
        } else if (pattern.pattern instanceof RegExp) {
          return pattern.pattern.test(req.path);
        }
        return false;
      });

      if (matchedPattern) {
        const middleware = this.protect(matchedPattern.options);
        return middleware(req, res, next);
      }

      // No pattern matched, continue without protection
      next();
    };
  };

  /**
   * Add a predefined protected route
   * @param route - Protected route configuration
   */
  public addProtectedRoute = (route: ProtectedRoute): void => {
    const middleware = this.protect({
      permissions: route.permissions,
      allowPublicAccess: route.path === '/public'
    });

    // This would typically be used in your route setup
    // app.use(route.path, middleware, routeHandler);
  };

  /**
   * Create middleware for common protection scenarios
   */
  public createCommonProtectors = () => {
    return {
      // Public access (no authentication or permission required)
      public: this.protect({
        authentication: 'none',
        allowPublicAccess: true
      }),

      // User authentication required
      authenticated: this.protect({
        authentication: 'required'
      }),

      // Admin access
      admin: this.protect({
        authentication: 'required',
        permissions: ['system:manage', 'users:manage']
      }),

      // Read access to resource
      read: (resource: string) => this.protect({
        authentication: 'required',
        resourceAccess: { resource, level: 'read' }
      }),

      // Write access to resource
      write: (resource: string) => this.protect({
        authentication: 'required',
        resourceAccess: { resource, level: 'write' }
      }),

      // Full access to resource
      manage: (resource: string) => this.protect({
        authentication: 'required',
        resourceAccess: { resource, level: 'manage' }
      }),

      // Ownership required
      owner: (resourceIdParam: string = 'id') => this.protect({
        authentication: 'required',
        ownershipCheck: { resourceIdParam, allowAdminOverride: true }
      })
    };
  };

  /**
   * Handle authentication requirements
   * @param req - Express request object
   * @param res - Express response object
   * @param config - Protection configuration
   */
  private async handleAuthentication(
    req: Request, 
    res: Response, 
    config: RouteProtectionOptions
  ): Promise<void> {
    switch (config.authentication) {
      case 'required':
        // Use existing authentication middleware
        await new Promise<void>((resolve, reject) => {
          authenticate(req, res, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        break;

      case 'optional':
        // Use optional authentication
        // (would need to implement optionalAuth similarly to authenticate)
        // await optionalAuth(req, res, next);
        break;

      case 'none':
        // No authentication required
        break;

      default:
        // Default to required
        await new Promise<void>((resolve, reject) => {
          authenticate(req, res, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
    }
  }

  /**
   * Handle permission requirements
   * @param req - Express request object
   * @param res - Express response object
   * @param config - Protection configuration
   */
  private async handlePermissions(
    req: Request, 
    res: Response, 
    config: RouteProtectionOptions
  ): Promise<void> {
    if (!config.permissions || config.permissions.length === 0) {
      return;
    }

    if (config.requireAllPermissions) {
      await new Promise<void>((resolve, reject) => {
        requireAllPermissions(config.permissions!)(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } else {
      await new Promise<void>((resolve, reject) => {
        requireAnyPermission(config.permissions!)(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  }

  /**
   * Handle resource access requirements
   * @param req - Express request object
   * @param res - Express response object
   * @param config - Protection configuration
   */
  private async handleResourceAccess(
    req: Request, 
    res: Response, 
    config: RouteProtectionOptions
  ): Promise<void> {
    if (!config.resourceAccess) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      requireResourceLevel(
        config.resourceAccess.resource as any,
        config.resourceAccess.level
      )(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  /**
   * Handle ownership check
   * @param req - Express request object
   * @param res - Express response object
   * @param config - Protection configuration
   */
  private async handleOwnershipCheck(
    req: Request, 
    res: Response, 
    config: RouteProtectionOptions
  ): Promise<void> {
    if (!config.ownershipCheck) {
      return;
    }

    const { resourceIdParam, ownerIdParam, allowAdminOverride } = config.ownershipCheck;

    await new Promise<void>((resolve, reject) => {
      requireOwnership(resourceIdParam, ownerIdParam, allowAdminOverride)(
        req, res, (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
  }

  /**
   * Handle custom validation
   * @param req - Express request object
   * @param res - Express response object
   * @param config - Protection configuration
   */
  private async handleCustomValidation(
    req: Request, 
    res: Response, 
    config: RouteProtectionOptions
  ): Promise<void> {
    if (!config.customValidator) {
      return;
    }

    const isValid = await config.customValidator(req);
    if (!isValid) {
      throw new RBACException(
        'CUSTOM_VALIDATION_FAILED',
        'Custom validation failed'
      );
    }
  }

  /**
   * Find matching route from patterns
   * @param req - Express request object
   * @param routes - Array of route patterns
   * @returns Matching route or undefined
   */
  private findMatchingRoute(req: Request, routes: RoutePattern[]): RoutePattern | undefined {
    return routes.find(route => {
      // Check HTTP method
      if (route.methods && !route.methods.includes(req.method)) {
        return false;
      }

      // Check path pattern
      if (typeof route.pattern === 'string') {
        return req.path.startsWith(route.pattern);
      } else if (route.pattern instanceof RegExp) {
        return route.pattern.test(req.path);
      }

      return false;
    });
  }

  /**
   * Log access attempt
   * @param req - Express request object
   * @param res - Express response object
   * @param config - Protection configuration
   */
  private logAccess(req: Request, res: Response, config: RouteProtectionOptions): void {
    if (config.logAccess) {
      const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl,
        userId: req.userId,
        userEmail: req.user?.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        permissions: config.permissions,
        resourceAccess: config.resourceAccess,
        authenticated: AuthenticationMiddleware.isAuthenticated(req)
      };

      console.log('Route Access:', logData);

      // In a production system, you might want to:
      // 1. Log to a database
      // 2. Send to a logging service
      // 3. Aggregate for analytics
    }
  }

  /**
   * Handle protection errors
   * @param res - Express response object
   * @param error - Error to handle
   */
  private handleProtectionError(res: Response, error: any): void {
    let statusCode = 403;
    let errorCode: RBACErrorCode = 'INSUFFICIENT_PERMISSIONS';
    let message = 'Access denied';

    if (error instanceof RBACException) {
      errorCode = error.code;
      message = error.message;

      switch (error.code) {
        case 'AUTHENTICATION_REQUIRED':
          statusCode = 401;
          break;
        case 'INSUFFICIENT_PERMISSIONS':
          statusCode = 403;
          break;
        case 'CUSTOM_VALIDATION_FAILED':
          statusCode = 403;
          break;
        default:
          statusCode = 403;
      }
    } else {
      message = 'Route protection failed';
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: message,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Validate route protection configuration
   * @param config - Configuration to validate
   * @returns Validation result
   */
  public validateConfig(config: RouteProtectionOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate permissions
    if (config.permissions) {
      config.permissions.forEach(permission => {
        try {
          parsePermissionName(permission);
        } catch (error) {
          errors.push(`Invalid permission: ${permission} - ${error.message}`);
        }
      });
    }

    // Validate resource access
    if (config.resourceAccess) {
      const validLevels = ['read', 'write', 'manage'];
      if (!validLevels.includes(config.resourceAccess.level)) {
        errors.push(`Invalid access level: ${config.resourceAccess.level}`);
      }
    }

    // Validate authentication setting
    const validAuth = ['required', 'optional', 'none'];
    if (config.authentication && !validAuth.includes(config.authentication)) {
      errors.push(`Invalid authentication setting: ${config.authentication}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export default middleware instance
export const routeProtector = new RouteProtector();

// Export individual functions for convenience
export const protect = routeProtector.protect;
export const protectRoutes = routeProtector.protectRoutes;
export const protectByPath = routeProtector.protectByPath;
export const addProtectedRoute = routeProtector.addProtectedRoute;
export const createCommonProtectors = routeProtector.createCommonProtectors;
export const validateRouteConfig = routeProtector.validateConfig.bind(routeProtector);

// Export common protection patterns
export const commonProtectors = routeProtector.createCommonProtectors();
