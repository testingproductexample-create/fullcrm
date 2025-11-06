// Permissions Middleware
// Handles permission checking and route protection

import { Request, Response, NextFunction } from 'express';
import { RBACException, RBACErrorCode, PermissionName, ResourceType } from '../types/rbac.types';
import { rbacService } from '../services/rbac.service';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  getPermissionLevel
} from '../utils/permissions';
import { authenticate, AuthenticationMiddleware } from './auth';

interface PermissionRequirement {
  permission: PermissionName;
  resource?: ResourceType;
  description?: string;
}

interface PermissionConfig {
  strictMode?: boolean; // If true, fails on permission check errors
  includeOverrides?: boolean; // If true, includes user permission overrides
  cachePermissions?: boolean; // If true, caches permission checks
  logAccessDenied?: boolean; // If true, logs access denied attempts
}

// Default configuration
const defaultConfig: PermissionConfig = {
  strictMode: true,
  includeOverrides: true,
  cachePermissions: true,
  logAccessDenied: true
};

export class PermissionMiddleware {
  private config: PermissionConfig;

  constructor(config: Partial<PermissionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Check if user has a specific permission
   * @param req - Express request object
   * @param permission - Permission to check
   * @param userId - User ID (optional, uses req.userId if not provided)
   * @returns Boolean indicating if user has permission
   */
  private async checkPermission(
    req: Request, 
    permission: PermissionName, 
    userId?: string
  ): Promise<boolean> {
    const targetUserId = userId || req.userId;
    if (!targetUserId) {
      return false;
    }

    try {
      return await rbacService.hasPermission(targetUserId, permission, this.config.includeOverrides);
    } catch (error) {
      if (this.config.strictMode) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   * @param req - Express request object
   * @param permissions - Permissions to check
   * @param userId - User ID (optional, uses req.userId if not provided)
   * @returns Boolean indicating if user has any permission
   */
  private async checkAnyPermission(
    req: Request, 
    permissions: PermissionName[], 
    userId?: string
  ): Promise<boolean> {
    const targetUserId = userId || req.userId;
    if (!targetUserId) {
      return false;
    }

    try {
      return await rbacService.hasAnyPermission(targetUserId, permissions, this.config.includeOverrides);
    } catch (error) {
      if (this.config.strictMode) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Check if user has all of the specified permissions
   * @param req - Express request object
   * @param permissions - Permissions to check
   * @param userId - User ID (optional, uses req.userId if not provided)
   * @returns Boolean indicating if user has all permissions
   */
  private async checkAllPermissions(
    req: Request, 
    permissions: PermissionName[], 
    userId?: string
  ): Promise<boolean> {
    const targetUserId = userId || req.userId;
    if (!targetUserId) {
      return false;
    }

    try {
      return await rbacService.hasAllPermissions(targetUserId, permissions, this.config.includeOverrides);
    } catch (error) {
      if (this.config.strictMode) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Require a specific permission
   * @param permission - Permission required
   * @param options - Additional options
   */
  public requirePermission = (permission: PermissionName, options: {
    description?: string;
    resource?: ResourceType;
  } = {}) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // First ensure user is authenticated
        if (!AuthenticationMiddleware.isAuthenticated(req)) {
          throw new RBACException(
            'AUTHENTICATION_REQUIRED',
            'Authentication required to access this resource'
          );
        }

        // Check permission
        const hasPerm = await this.checkPermission(req, permission);
        if (!hasPerm) {
          this.logAccessDenied(req, permission, 'requirePermission');
          throw new RBACException(
            'INSUFFICIENT_PERMISSIONS',
            `Access denied. Required permission: ${permission}`,
            { 
              userId: req.userId, 
              requiredPermission: permission,
              description: options.description,
              resource: options.resource
            }
          );
        }

        // Add permission info to request for later use
        req.requiredPermissions = [permission];

        next();

      } catch (error) {
        this.handlePermissionError(res, error);
      }
    };
  };

  /**
   * Require any of the specified permissions (user needs at least one)
   * @param permissions - Array of acceptable permissions
   * @param options - Additional options
   */
  public requireAnyPermission = (permissions: PermissionName[], options: {
    description?: string;
  } = {}) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!AuthenticationMiddleware.isAuthenticated(req)) {
          throw new RBACException(
            'AUTHENTICATION_REQUIRED',
            'Authentication required to access this resource'
          );
        }

        const hasAny = await this.checkAnyPermission(req, permissions);
        if (!hasAny) {
          this.logAccessDenied(req, permissions, 'requireAnyPermission');
          throw new RBACException(
            'INSUFFICIENT_PERMISSIONS',
            `Access denied. User must have at least one of these permissions: ${permissions.join(', ')}`,
            { 
              userId: req.userId, 
              requiredPermissions: permissions,
              description: options.description
            }
          );
        }

        req.requiredPermissions = permissions;
        next();

      } catch (error) {
        this.handlePermissionError(res, error);
      }
    };
  };

  /**
   * Require all of the specified permissions (user needs ALL)
   * @param permissions - Array of required permissions
   * @param options - Additional options
   */
  public requireAllPermissions = (permissions: PermissionName[], options: {
    description?: string;
  } = {}) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!AuthenticationMiddleware.isAuthenticated(req)) {
          throw new RBACException(
            'AUTHENTICATION_REQUIRED',
            'Authentication required to access this resource'
          );
        }

        const hasAll = await this.checkAllPermissions(req, permissions);
        if (!hasAll) {
          this.logAccessDenied(req, permissions, 'requireAllPermissions');
          throw new RBACException(
            'INSUFFICIENT_PERMISSIONS',
            `Access denied. User must have all of these permissions: ${permissions.join(', ')}`,
            { 
              userId: req.userId, 
              requiredPermissions: permissions,
              description: options.description
            }
          );
        }

        req.requiredPermissions = permissions;
        next();

      } catch (error) {
        this.handlePermissionError(res, error);
      }
    };
  };

  /**
   * Require minimum permission level for a resource
   * @param resource - Resource type
   * @param minimumLevel - Minimum level required ('read', 'write', 'manage')
   */
  public requireResourceLevel = (resource: ResourceType, minimumLevel: 'read' | 'write' | 'manage') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!AuthenticationMiddleware.isAuthenticated(req)) {
          throw new RBACException(
            'AUTHENTICATION_REQUIRED',
            'Authentication required to access this resource'
          );
        }

        const userLevel = await rbacService.getPermissionLevel(
          req.userId!, 
          resource, 
          this.config.includeOverrides
        );

        const levelHierarchy = { none: 0, read: 1, write: 2, manage: 3 };
        const currentLevel = levelHierarchy[userLevel];
        const requiredLevel = levelHierarchy[minimumLevel];

        if (currentLevel < requiredLevel) {
          this.logAccessDenied(req, [`${resource}:${minimumLevel}`], 'requireResourceLevel');
          throw new RBACException(
            'INSUFFICIENT_PERMISSIONS',
            `Access denied. Required ${minimumLevel} access to ${resource}`,
            { 
              userId: req.userId, 
              resource, 
              currentLevel: userLevel, 
              requiredLevel: minimumLevel
            }
          );
        }

        next();

      } catch (error) {
        this.handlePermissionError(res, error);
      }
    };
  };

  /**
   * Check resource ownership (user can only access their own data)
   * @param resourceIdParam - Parameter name containing resource ID
   * @param ownerIdParam - Parameter name containing owner ID
   * @param fallbackToUserId - If true, checks against req.userId when owner ID not found
   */
  public requireOwnership = (
    resourceIdParam: string = 'id',
    ownerIdParam: string = 'userId',
    fallbackToUserId: boolean = true
  ) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!AuthenticationMiddleware.isAuthenticated(req)) {
          throw new RBACException(
            'AUTHENTICATION_REQUIRED',
            'Authentication required to access this resource'
          );
        }

        const resourceId = req.params[resourceIdParam] || req.body[resourceIdParam];
        const ownerId = req.params[ownerIdParam] || req.body[ownerIdParam] || (fallbackToUserId ? req.userId : null);

        if (!resourceId) {
          throw new RBACException(
            'RESOURCE_ID_REQUIRED',
            'Resource ID is required for ownership check'
          );
        }

        // Check if user owns the resource
        if (ownerId !== req.userId) {
          // Additional checks could be added here (e.g., admin override)
          const userRoles = AuthenticationMiddleware.getUserRoles(req);
          const isAdmin = userRoles.includes('super_admin') || userRoles.includes('system_admin');
          
          if (!isAdmin) {
            this.logAccessDenied(req, [`ownership:${resourceId}`], 'requireOwnership');
            throw new RBACException(
              'INSUFFICIENT_PERMISSIONS',
              'Access denied. You can only access your own resources',
              { 
                userId: req.userId, 
                resourceId, 
                ownerId 
              }
            );
          }
        }

        next();

      } catch (error) {
        this.handlePermissionError(res, error);
      }
    };
  };

  /**
   * Combine multiple permission requirements (AND logic)
   * @param requirements - Array of permission requirements
   */
  public requirePermissions = (requirements: PermissionRequirement[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!AuthenticationMiddleware.isAuthenticated(req)) {
          throw new RBACException(
            'AUTHENTICATION_REQUIRED',
            'Authentication required to access this resource'
          );
        }

        for (const requirement of requirements) {
          const hasPerm = await this.checkPermission(req, requirement.permission);
          if (!hasPerm) {
            this.logAccessDenied(req, [requirement.permission], 'requirePermissions');
            throw new RBACException(
              'INSUFFICIENT_PERMISSIONS',
              `Access denied. Required permission: ${requirement.permission}`,
              { 
                userId: req.userId, 
                requiredPermission: requirement.permission,
                description: requirement.description
              }
            );
          }
        }

        req.requiredPermissions = requirements.map(r => r.permission);
        next();

      } catch (error) {
        this.handlePermissionError(res, error);
      }
    };
  };

  /**
   * Optional permission check (doesn't fail if missing)
   * @param permission - Permission to check
   * @returns Middleware function
   */
  public checkPermission = (permission: PermissionName) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!AuthenticationMiddleware.isAuthenticated(req)) {
          return next();
        }

        const hasPerm = await this.checkPermission(req, permission);
        
        // Add permission check result to request
        req.permissionChecks = req.permissionChecks || {};
        req.permissionChecks[permission] = hasPerm;

        // Continue regardless of permission status
        next();

      } catch (error) {
        // For optional checks, we don't fail on errors
        console.warn('Optional permission check failed:', error.message);
        next();
      }
    };
  };

  /**
   * Log access denied attempt
   * @param req - Express request object
   * @param permissions - Required permissions
   * @param checkType - Type of permission check
   */
  private logAccessDenied(req: Request, permissions: PermissionName[], checkType: string): void {
    if (this.config.logAccessDenied) {
      console.warn('Access Denied:', {
        userId: req.userId,
        userEmail: req.user?.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        requiredPermissions: permissions,
        checkType,
        timestamp: new Date().toISOString()
      });

      // In a production system, you might want to:
      // 1. Log to a database
      // 2. Send alerts for repeated attempts
      // 3. Track patterns for security analysis
    }
  }

  /**
   * Handle permission errors
   * @param res - Express response object
   * @param error - Error to handle
   */
  private handlePermissionError(res: Response, error: any): void {
    let statusCode = 403;
    let errorCode: RBACErrorCode = 'INSUFFICIENT_PERMISSIONS';
    let message = 'Insufficient permissions';

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
        case 'RESOURCE_ID_REQUIRED':
          statusCode = 400;
          break;
        default:
          statusCode = 403;
      }
    } else {
      message = 'Permission check failed';
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
}

// Extend Express Request to include permission-related properties
declare global {
  namespace Express {
    interface Request {
      requiredPermissions?: PermissionName[];
      permissionChecks?: Record<PermissionName, boolean>;
    }
  }
}

// Export default middleware instance
export const permissionMiddleware = new PermissionMiddleware();

// Export individual middleware functions for convenience
export const requirePermission = permissionMiddleware.requirePermission;
export const requireAnyPermission = permissionMiddleware.requireAnyPermission;
export const requireAllPermissions = permissionMiddleware.requireAllPermissions;
export const requireResourceLevel = permissionMiddleware.requireResourceLevel;
export const requireOwnership = permissionMiddleware.requireOwnership;
export const requirePermissions = permissionMiddleware.requirePermissions;
export const checkPermission = permissionMiddleware.checkPermission;
