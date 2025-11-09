/**
 * Multi-Tenant Middleware
 * UAE Tailoring Business Platform
 */

import { Request, Response, NextFunction } from 'express';
import { multiTenantContext } from '../core/tenant-context';
import { tenantSecurityService } from '../core/security/tenant-security';
import { TenantUser, TenantContext, MultiTenantResponse } from '../types';

interface AuthenticatedRequest extends Request {
  tenantContext?: TenantContext;
  user?: TenantUser;
  tenantId?: string;
  requestId?: string;
}

export class TenantMiddleware {
  /**
   * Extract and validate tenant from request
   */
  static tenantResolver(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const requestId = req.headers['x-request-id'] as string || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    req.requestId = requestId;

    // Resolve tenant context
    multiTenantContext.resolveTenant(req)
      .then((response) => {
        if (!response.success || !response.data) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'TENANT_NOT_FOUND',
              message: response.error?.message || 'Tenant not found',
              timestamp: new Date()
            },
            meta: {
              tenant: 'unknown',
              timestamp: new Date(),
              requestId
            }
          });
        }

        req.tenantContext = response.data;
        req.tenantId = response.data.tenant.id;

        // Set tenant context in database
        // In real implementation, set this in request-scoped database session
        // databaseService.setTenantContext(response.data.tenant.id);

        next();
      })
      .catch((error) => {
        console.error('Tenant resolution error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'TENANT_RESOLUTION_ERROR',
            message: 'Internal server error',
            timestamp: new Date()
          },
          meta: {
            tenant: 'unknown',
            timestamp: new Date(),
            requestId
          }
        });
      });
  }

  /**
   * Authentication middleware
   */
  static authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                 req.headers['x-auth-token'] as string;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authentication token is required',
          timestamp: new Date()
        }
      });
    }

    // Verify token
    const payload = tenantSecurityService.verifySessionToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid or expired authentication token',
          timestamp: new Date()
        }
      });
    }

    // Set user context
    multiTenantContext.setUserContext(req.requestId!, {
      id: payload.userId,
      tenantId: payload.tenantId,
      email: '', // Would be loaded from database
      firstName: '',
      lastName: '',
      roles: [],
      permissions: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    })
    .then((response) => {
      if (!response.success) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_CONTEXT_ERROR',
            message: 'Failed to set user context',
            timestamp: new Date()
          }
        });
      }

      next();
    })
    .catch((error) => {
      console.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Internal server error',
          timestamp: new Date()
        }
      });
    });
  }

  /**
   * Role-based authorization middleware
   */
  static requireRoles(...roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const context = req.tenantContext;
      const user = context?.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_AUTHENTICATED',
            message: 'User must be authenticated',
            timestamp: new Date()
          }
        });
      }

      // Check if user has required roles
      const hasRole = roles.some(role => 
        user.roles.some(userRole => userRole.name === role) ||
        user.roles.some(userRole => userRole.name === 'super_admin')
      );

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE',
            message: 'Insufficient role permissions',
            timestamp: new Date()
          }
        });
      }

      next();
    };
  }

  /**
   * Permission-based authorization middleware
   */
  static requirePermissions(...permissions: Array<{ resource: string; action: string }>) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const context = req.tenantContext;
      const user = context?.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_AUTHENTICATED',
            message: 'User must be authenticated',
            timestamp: new Date()
          }
        });
      }

      // Check permissions
      tenantSecurityService.checkPermissions(user, permissions)
        .then((hasPermission) => {
          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions',
                timestamp: new Date()
              }
            });
          }

          next();
        })
        .catch((error) => {
          console.error('Permission check error:', error);
          res.status(500).json({
            success: false,
            error: {
              code: 'PERMISSION_CHECK_ERROR',
              message: 'Internal server error',
              timestamp: new Date()
            }
          });
        });
    };
  }

  /**
   * Rate limiting middleware
   */
  static rateLimit(options?: {
    max?: number;
    windowMs?: number;
    message?: string;
  }) {
    const defaultOptions = {
      max: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      message: 'Too many requests from this tenant'
    };

    const config = { ...defaultOptions, ...options };
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const tenantId = req.tenantId || 'anonymous';
      const key = `${tenantId}:${req.ip}`;
      const now = Date.now();
      const windowStart = now - config.windowMs!;

      // Clean up expired entries
      for (const [k, v] of requests) {
        if (v.resetTime < now) {
          requests.delete(k);
        }
      }

      // Get or create request counter
      let counter = requests.get(key);
      if (!counter || counter.resetTime < windowStart) {
        counter = { count: 0, resetTime: now + config.windowMs! };
        requests.set(key, counter);
      }

      // Check limit
      if (counter.count >= config.max!) {
        res.set('X-RateLimit-Limit', config.max!.toString());
        res.set('X-RateLimit-Remaining', '0');
        res.set('X-RateLimit-Reset', (counter.resetTime / 1000).toString());

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: config.message!,
            timestamp: new Date()
          }
        });
      }

      // Increment counter
      counter.count++;
      
      res.set('X-RateLimit-Limit', config.max!.toString());
      res.set('X-RateLimit-Remaining', (config.max! - counter.count).toString());
      res.set('X-RateLimit-Reset', (counter.resetTime / 1000).toString());

      next();
    };
  }

  /**
   * Input validation middleware
   */
  static validateInput(schema: any) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const { error } = schema.validate(req.body, { abortEarly: false });
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.details.map(detail => detail.message),
            timestamp: new Date()
          }
        });
      }

      next();
    };
  }

  /**
   * Security headers middleware
   */
  static securityHeaders(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    // Tenant-specific security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Tenant isolation header
    res.setHeader('X-Tenant-ID', req.tenantId || 'unknown');
    
    // Remove server header
    res.removeHeader('X-Powered-By');
    
    next();
  }

  /**
   * Audit logging middleware
   */
  static auditLog(req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // Log request
    const logData = {
      tenantId: req.tenantId,
      userId: req.user?.id,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      requestId: req.requestId
    };

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(body: any) {
      const duration = Date.now() - startTime;
      
      // Log response
      tenantSecurityService.logSecurityEvent(
        req.tenantId!,
        req.user?.id || 'anonymous',
        'api_request',
        {
          ...logData,
          statusCode: res.statusCode,
          duration,
          responseSize: JSON.stringify(body).length
        }
      );

      return originalJson.call(this, body);
    };

    next();
  }

  /**
   * CORS middleware for multi-tenant setup
   */
  static cors(options?: {
    origin?: string | string[];
    credentials?: boolean;
  }) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      // Set CORS headers based on tenant configuration
      const allowedOrigins = options?.origin || ['*'];
      const origin = req.get('Origin');
      
      if (origin && (allowedOrigins === '*' || allowedOrigins.includes(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else if (allowedOrigins === '*') {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization,X-Tenant-ID');
      res.setHeader('Access-Control-Allow-Credentials', options?.credentials ? 'true' : 'false');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      
      next();
    };
  }

  /**
   * Error handling middleware
   */
  static errorHandler(error: any, req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    console.error('Tenant middleware error:', error);

    // Log security event for errors
    if (req.tenantId) {
      tenantSecurityService.logSecurityEvent(
        req.tenantId,
        req.user?.id || 'anonymous',
        'middleware_error',
        {
          error: error.message,
          stack: error.stack,
          path: req.path,
          method: req.method,
          ip: req.ip
        }
      );
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An internal server error occurred',
        timestamp: new Date()
      }
    });
  }

  /**
   * Cleanup middleware
   */
  static cleanup(req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Clear context after response
    res.on('finish', () => {
      if (req.requestId) {
        multiTenantContext.clearContext(req.requestId);
      }
    });

    next();
  }
}

// Export middleware functions
export const {
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
} = TenantMiddleware;
