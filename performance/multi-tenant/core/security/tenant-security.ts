/**
 * Tenant Security Service
 * UAE Tailoring Business Platform
 */

import { Tenant, TenantUser, TenantSecurity } from '../../types';
import { Permission, Role } from '../../types';
import { MultiTenantResponse } from '../../types';

export class TenantSecurityService {
  private encryptionKey: string;
  private jwtSecret: string;
  private bcryptRounds: number = 12;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateKey();
    this.jwtSecret = process.env.JWT_SECRET || this.generateKey();
  }

  /**
   * Validate tenant security configuration
   */
  async validateTenantSecurity(tenant: Tenant): Promise<MultiTenantResponse<boolean>> {
    try {
      const security = tenant.security;
      const validation = {
        encryption: security.encryption,
        twoFactorRequired: security.twoFactorRequired,
        sessionTimeout: security.sessionTimeout,
        passwordPolicy: security.passwordPolicy,
        auditLog: security.auditLog
      };

      // Validate encryption setup
      if (security.encryption && !this.isEncryptionConfigured()) {
        return {
          success: false,
          error: {
            code: 'ENCRYPTION_NOT_CONFIGURED',
            message: 'Encryption is enabled but not properly configured',
            timestamp: new Date()
          }
        };
      }

      // Validate session timeout
      if (security.sessionTimeout < 15 || security.sessionTimeout > 1440) {
        return {
          success: false,
          error: {
            code: 'INVALID_SESSION_TIMEOUT',
            message: 'Session timeout must be between 15 and 1440 minutes',
            timestamp: new Date()
          }
        };
      }

      // Validate password policy
      const passwordValidation = this.validatePasswordPolicy(security.passwordPolicy);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_PASSWORD_POLICY',
            message: 'Invalid password policy configuration',
            details: passwordValidation.errors,
            timestamp: new Date()
          }
        };
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SECURITY_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Check if user has required permissions
   */
  async checkPermissions(
    user: TenantUser, 
    requiredPermissions: Array<{ resource: string; action: string }>
  ): Promise<boolean> {
    try {
      const userPermissions = this.extractUserPermissions(user);
      
      for (const required of requiredPermissions) {
        const permissionKey = `${required.resource}:${required.action}`;
        
        if (!userPermissions.includes(permissionKey) && 
            !userPermissions.includes(`${required.resource}:manage`)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Check if user has required roles
   */
  async checkRoles(user: TenantUser, requiredRoles: string[]): Promise<boolean> {
    try {
      const userRoleNames = user.roles.map(role => role.name);
      
      return requiredRoles.some(roleName => 
        userRoleNames.includes(roleName) || 
        userRoleNames.includes('super_admin') // Super admin has all roles
      );
    } catch (error) {
      console.error('Role check failed:', error);
      return false;
    }
  }

  /**
   * Validate user password against policy
   */
  validatePassword(password: string, policy: TenantSecurity['passwordPolicy']): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    // In real implementation, this would use bcrypt
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, this.bcryptRounds);
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hash);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string, tenantId: string): string {
    // In real implementation, use proper encryption (AES-256)
    const key = this.generateTenantKey(tenantId);
    return Buffer.from(`${key}:${text}`).toString('base64');
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText: string, tenantId: string): string {
    // In real implementation, use proper decryption
    try {
      const decoded = Buffer.from(encryptedText, 'base64').toString('utf8');
      const key = this.generateTenantKey(tenantId);
      return decoded.startsWith(`${key}:`) ? decoded.substring(key.length + 1) : '';
    } catch {
      return '';
    }
  }

  /**
   * Generate secure session token
   */
  generateSessionToken(userId: string, tenantId: string, expiresIn: number = 3600): string {
    // In real implementation, use JWT
    const payload = {
      userId,
      tenantId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = this.generateSignature(base64Payload);
    
    return `${base64Payload}.${signature}`;
  }

  /**
   * Verify session token
   */
  verifySessionToken(token: string): { userId: string; tenantId: string } | null {
    try {
      const [payload, signature] = token.split('.');
      const expectedSignature = this.generateSignature(payload);
      
      if (signature !== expectedSignature) {
        return null;
      }

      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      
      // Check expiration
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return {
        userId: decoded.userId,
        tenantId: decoded.tenantId
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    tenantId: string, 
    userId: string, 
    event: string, 
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const logEntry = {
        tenantId,
        userId,
        event,
        details,
        timestamp: new Date(),
        ip: details.ip,
        userAgent: details.userAgent,
        severity: this.getEventSeverity(event)
      };

      // In real implementation, save to secure audit log
      console.log('Security event:', logEntry);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Check IP whitelist
   */
  isIPAllowed(ip: string, tenantSecurity: TenantSecurity): boolean {
    if (!tenantSecurity.allowedIPs || tenantSecurity.allowedIPs.length === 0) {
      return true; // No restrictions
    }

    return tenantSecurity.allowedIPs.includes(ip);
  }

  /**
   * Check time restrictions for user
   */
  isTimeAllowed(restrictions: TenantSecurity['passwordPolicy'] | null, currentTime: Date = new Date()): boolean {
    if (!restrictions || !restrictions.timeRestrictions) {
      return true;
    }

    const currentHour = currentTime.getHours();
    const currentDay = currentTime.getDay();

    // Check allowed days
    if (restrictions.timeRestrictions.allowedDays && 
        !restrictions.timeRestrictions.allowedDays.includes(currentDay)) {
      return false;
    }

    // Check allowed hours
    if (restrictions.timeRestrictions.allowedHours) {
      return restrictions.timeRestrictions.allowedHours.some(period => {
        const [startHour] = period.start.split(':').map(Number);
        const [endHour] = period.end.split(':').map(Number);
        
        return currentHour >= startHour && currentHour <= endHour;
      });
    }

    return true;
  }

  /**
   * Generate secure random string
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  /**
   * Rate limiting check
   */
  async checkRateLimit(
    key: string, 
    limit: number, 
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    // In real implementation, use Redis for distributed rate limiting
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    // Simple in-memory rate limiting for demonstration
    const rateKey = `rate_limit:${key}`;
    const requests = await this.getRateLimitCount(rateKey);
    
    if (requests >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + windowMs
      };
    }

    return {
      allowed: true,
      remaining: limit - requests - 1,
      resetTime: now + windowMs
    };
  }

  /**
   * Extract user permissions
   */
  private extractUserPermissions(user: TenantUser): string[] {
    const permissions = new Set<string>();
    
    // Add role permissions
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        permissions.add(`${permission.resource}:${permission.action}`);
      }
    }
    
    // Add direct permissions
    for (const permission of user.permissions) {
      permissions.add(`${permission.resource}:${permission.action}`);
    }
    
    return Array.from(permissions);
  }

  /**
   * Validate password policy
   */
  private validatePasswordPolicy(policy: TenantSecurity['passwordPolicy']): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (policy.minLength < 6 || policy.minLength > 128) {
      errors.push('Password policy: min length must be between 6 and 128');
    }

    if (policy.preventReuse < 0 || policy.preventReuse > 50) {
      errors.push('Password policy: prevent reuse must be between 0 and 50');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if encryption is configured
   */
  private isEncryptionConfigured(): boolean {
    return !!this.encryptionKey && this.encryptionKey.length >= 32;
  }

  /**
   * Generate tenant-specific key
   */
  private generateTenantKey(tenantId: string): string {
    return Buffer.from(`${this.encryptionKey}:${tenantId}`).toString('base64').substring(0, 32);
  }

  /**
   * Generate signature for token
   */
  private generateSignature(payload: string): string {
    // In real implementation, use HMAC-SHA256
    return Buffer.from(payload + this.jwtSecret).toString('base64').substring(0, 16);
  }

  /**
   * Get security event severity
   */
  private getEventSeverity(event: string): 'low' | 'medium' | 'high' | 'critical' {
    const critical = ['login_failure', 'privilege_escalation', 'data_breach', 'unauthorized_access'];
    const high = ['password_change', 'role_change', 'permission_change'];
    const medium = ['login_success', 'logout', 'password_reset'];
    
    if (critical.includes(event)) return 'critical';
    if (high.includes(event)) return 'high';
    if (medium.includes(event)) return 'medium';
    return 'low';
  }

  /**
   * Get rate limit count (simplified)
   */
  private async getRateLimitCount(key: string): Promise<number> {
    // In real implementation, use Redis INCR/EXPIRE
    return 0;
  }
}

// Export singleton instance
export const tenantSecurityService = new TenantSecurityService();
