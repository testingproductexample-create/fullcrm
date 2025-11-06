// Authentication Middleware
// Handles JWT token validation and user authentication

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RBACException, RBACErrorCode, RBACUser } from '../types/rbac.types';
import { rbacService } from '../services/rbac.service';

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: RBACUser;
      userId?: string;
      userRoles?: string[];
      userPermissions?: string[];
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

interface AuthenticationConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  requireEmailVerification?: boolean;
  allowExpiredTokens?: boolean;
  tokenBlacklistEnabled?: boolean;
}

// Default configuration
const defaultConfig: AuthenticationConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: '8h',
  requireEmailVerification: false,
  allowExpiredTokens: false,
  tokenBlacklistEnabled: true
};

export class AuthenticationMiddleware {
  private config: AuthenticationConfig;

  constructor(config: Partial<AuthenticationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Main authentication middleware
   * Validates JWT token and sets user information in request
   */
  public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from header
      const token = this.extractToken(req);
      if (!token) {
        throw new RBACException(
          'AUTHENTICATION_REQUIRED',
          'No authentication token provided'
        );
      }

      // Verify JWT token
      const payload = this.verifyToken(token);

      // Get user information
      const user = await this.getUserFromPayload(payload);
      if (!user) {
        throw new RBACException(
          'USER_NOT_FOUND',
          'User associated with token not found'
        );
      }

      // Check if user is active
      if (!user.is_active) {
        throw new RBACException(
          'ACCOUNT_INACTIVE',
          'User account is inactive'
        );
      }

      // Set user information in request
      req.user = user;
      req.userId = user.id;
      req.userRoles = user.roles.map(role => role.name);
      req.userPermissions = user.permissions.map(permission => permission.name);

      // Continue to next middleware
      next();

    } catch (error) {
      this.handleAuthenticationError(res, error);
    }
  };

  /**
   * Optional authentication middleware
   * Does not fail if no token is provided, but validates if token exists
   */
  public optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      if (!token) {
        // No token provided, continue without authentication
        return next();
      }

      // Token provided, validate it
      await this.authenticate(req, res, next);

    } catch (error) {
      // In optional auth, we don't fail on authentication errors
      // Just continue without setting user information
      console.warn('Optional auth failed:', error.message);
      next();
    }
  };

  /**
   * Admin authentication middleware
   * Requires user to be an admin
   */
  public requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First authenticate
      await this.authenticate(req, res, async () => {
        // Check if user is admin
        const userPermissions = await rbacService.getUserPermissions(req.userId!);
        const isAdmin = userPermissions.includes('system:manage') || 
                       userPermissions.includes('users:manage');

        if (!isAdmin) {
          throw new RBACException(
            'INSUFFICIENT_PERMISSIONS',
            'Admin access required',
            { userId: req.userId }
          );
        }

        next();
      });

    } catch (error) {
      this.handleAuthenticationError(res, error);
    }
  };

  /**
   * Specific role requirement middleware
   * @param requiredRoles - Array of roles that are acceptable
   * @param requireAll - Whether user must have ALL roles (default: false)
   */
  public requireRole = (requiredRoles: string[], requireAll: boolean = false) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // First authenticate
        await this.authenticate(req, res, async () => {
          const userRoles = req.userRoles || [];

          if (requireAll) {
            // User must have ALL required roles
            const hasAllRoles = requiredRoles.every(role => userRoles.includes(role));
            if (!hasAllRoles) {
              throw new RBACException(
                'INSUFFICIENT_PERMISSIONS',
                `User must have all of these roles: ${requiredRoles.join(', ')}`,
                { userId: req.userId, userRoles, requiredRoles }
              );
            }
          } else {
            // User must have at least ONE of the required roles
            const hasAnyRole = requiredRoles.some(role => userRoles.includes(role));
            if (!hasAnyRole) {
              throw new RBACException(
                'INSUFFICIENT_PERMISSIONS',
                `User must have at least one of these roles: ${requiredRoles.join(', ')}`,
                { userId: req.userId, userRoles, requiredRoles }
              );
            }
          }

          next();
        });

      } catch (error) {
        this.handleAuthenticationError(res, error);
      }
    };
  };

  /**
   * Generate JWT token for user
   * @param user - User object
   * @param additionalPayload - Additional payload data
   * @returns JWT token
   */
  public generateToken(user: RBACUser, additionalPayload: Record<string, any> = {}): string {
    const payload: Partial<JWTPayload> & Record<string, any> = {
      userId: user.id,
      email: user.email,
      roles: user.roles.map(role => role.name),
      ...additionalPayload
    };

    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
      issuer: 'rbac-system',
      audience: 'rbac-api'
    });
  };

  /**
   * Refresh JWT token
   * @param currentToken - Current JWT token
   * @returns New JWT token
   */
  public refreshToken = async (currentToken: string): Promise<string> => {
    try {
      const payload = this.verifyToken(currentToken);
      
      // Get fresh user data
      const user = await this.getUserFromPayload(payload);
      if (!user) {
        throw new RBACException('USER_NOT_FOUND', 'User not found');
      }

      // Generate new token
      return this.generateToken(user, {
        refreshedAt: new Date().toISOString()
      });

    } catch (error) {
      throw new RBACException(
        'TOKEN_REFRESH_FAILED',
        `Failed to refresh token: ${error.message}`
      );
    }
  };

  /**
   * Invalidate token (add to blacklist if enabled)
   * @param token - Token to invalidate
   * @param reason - Reason for invalidation
   */
  public invalidateToken = async (token: string, reason: string = 'manual'): Promise<void> => {
    if (this.config.tokenBlacklistEnabled) {
      try {
        // Add token to blacklist (in real implementation, use Redis or database)
        console.log(`Invalidating token: ${token.substring(0, 20)}... Reason: ${reason}`);
        
        // In a production system, you would:
        // 1. Add token to Redis blacklist with expiration
        // 2. Or add to database blacklist table
        // 3. Or use JWT jti (JWT ID) for tracking
        
      } catch (error) {
        console.error('Failed to invalidate token:', error);
      }
    }
  };

  /**
   * Extract token from request
   * @param req - Express request object
   * @returns JWT token or null
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check for token in cookies
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }

    // Check for token in query parameters (not recommended for production)
    if (req.query.token && typeof req.query.token === 'string') {
      return req.query.token;
    }

    return null;
  }

  /**
   * Verify JWT token
   * @param token - JWT token to verify
   * @returns Decoded payload
   */
  private verifyToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret, {
        issuer: 'rbac-system',
        audience: 'rbac-api'
      }) as JWTPayload;

      return payload;

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        if (this.config.allowExpiredTokens) {
          // Decode expired token for special handling
          const payload = jwt.decode(token) as JWTPayload;
          if (payload) {
            return payload;
          }
        }
        throw new RBACException('TOKEN_EXPIRED', 'Authentication token has expired');
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new RBACException('INVALID_TOKEN', 'Invalid authentication token');
      }

      throw new RBACException('TOKEN_VERIFICATION_FAILED', 'Token verification failed');
    }
  }

  /**
   * Get user information from JWT payload
   * @param payload - JWT payload
   * @returns User object or null
   */
  private async getUserFromPayload(payload: JWTPayload): Promise<RBACUser | null> {
    try {
      // In a real implementation, this would query the database
      // For now, return a mock user based on the payload
      const user: RBACUser = {
        id: payload.userId,
        email: payload.email,
        display_name: payload.email.split('@')[0],
        roles: payload.roles.map(roleName => ({
          id: roleName,
          name: roleName as any,
          display_name: roleName,
          description: `${roleName} role`,
          is_system_role: true,
          is_active: true,
          level: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })),
        permissions: [], // Would be populated from database
        is_active: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return user;

    } catch (error) {
      console.error('Failed to get user from payload:', error);
      return null;
    }
  }

  /**
   * Handle authentication errors
   * @param res - Express response object
   * @param error - Error to handle
   */
  private handleAuthenticationError(res: Response, error: any): void {
    let statusCode = 401;
    let errorCode: RBACErrorCode = 'AUTHENTICATION_REQUIRED';
    let message = 'Authentication required';

    if (error instanceof RBACException) {
      errorCode = error.code;
      message = error.message;

      switch (error.code) {
        case 'TOKEN_EXPIRED':
          statusCode = 401;
          break;
        case 'INVALID_TOKEN':
          statusCode = 401;
          break;
        case 'USER_NOT_FOUND':
          statusCode = 404;
          break;
        case 'ACCOUNT_INACTIVE':
          statusCode = 403;
          break;
        case 'INSUFFICIENT_PERMISSIONS':
          statusCode = 403;
          break;
        default:
          statusCode = 401;
      }
    } else {
      message = 'Authentication failed';
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
   * Extract user information from request (for use in other middlewares)
   * @param req - Express request object
   * @returns User ID or null
   */
  public static getUserId(req: Request): string | null {
    return req.userId || null;
  }

  /**
   * Check if user is authenticated
   * @param req - Express request object
   * @returns Boolean indicating if user is authenticated
   */
  public static isAuthenticated(req: Request): boolean {
    return req.user !== undefined && req.userId !== undefined;
  }

  /**
   * Get user roles from request
   * @param req - Express request object
   * @returns Array of user roles or empty array
   */
  public static getUserRoles(req: Request): string[] {
    return req.userRoles || [];
  }

  /**
   * Get user permissions from request
   * @param req - Express request object
   * @returns Array of user permissions or empty array
   */
  public static getUserPermissions(req: Request): string[] {
    return req.userPermissions || [];
  }
}

// Export default middleware instance
export const authMiddleware = new AuthenticationMiddleware();

// Export individual middleware functions for convenience
export const authenticate = authMiddleware.authenticate;
export const optionalAuth = authMiddleware.optionalAuth;
export const requireAdmin = authMiddleware.requireAdmin;
export const requireRole = authMiddleware.requireRole;
export const generateToken = authMiddleware.generateToken.bind(authMiddleware);
export const refreshToken = authMiddleware.refreshToken.bind(authMiddleware);
export const invalidateToken = authMiddleware.invalidateToken.bind(authMiddleware);
