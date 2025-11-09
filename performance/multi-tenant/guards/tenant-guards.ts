/**
 * Multi-Tenant Guards and Access Control
 * UAE Tailoring Business Platform
 */

import { 
  TenantUser, 
  Tenant, 
  Role, 
  Permission, 
  TenantContext,
  DataIsolationStrategy 
} from '../types';
import { tenantSecurityService } from '../core/security/tenant-security';
import { databaseService } from '../core/database/tenant-database';

export class TenantGuards {
  /**
   * Check if user has access to specific resource
   */
  static async canAccessResource(
    user: TenantUser,
    resource: string,
    action: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      // Super admin has access to everything
      if (user.roles.some(role => role.name === 'super_admin')) {
        return true;
      }

      // Check direct permissions
      const hasDirectPermission = user.permissions.some(permission => 
        permission.resource === resource && 
        (permission.action === action || permission.action === 'manage')
      );

      if (hasDirectPermission) {
        // Check for conditional permissions
        if (resourceId) {
          return await this.checkPermissionConditions(user, resource, action, resourceId);
        }
        return true;
      }

      // Check role-based permissions
      for (const role of user.roles) {
        const hasRolePermission = role.permissions.some(permission =>
          permission.resource === resource &&
          (permission.action === action || permission.action === 'manage')
        );

        if (hasRolePermission) {
          // Check for conditional permissions
          if (resourceId) {
            return await this.checkPermissionConditions(user, resource, action, resourceId);
          }
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Resource access check failed:', error);
      return false;
    }
  }

  /**
   * Check permission conditions (e.g., time-based, resource-specific)
   */
  private static async checkPermissionConditions(
    user: TenantUser,
    resource: string,
    action: string,
    resourceId: string
  ): Promise<boolean> {
    // In a real implementation, check specific conditions
    // such as resource ownership, time restrictions, etc.
    
    // Example: Check if user is accessing their own data
    if (resource === 'profile' || resource === 'orders') {
      // This would involve querying the database to check ownership
      // return await this.checkResourceOwnership(user.id, resource, resourceId);
    }

    return true;
  }

  /**
   * Validate data isolation for user
   */
  static async validateDataIsolation(
    user: TenantUser,
    query: string,
    params: any[]
  ): Promise<{ valid: boolean; modifiedQuery: string; modifiedParams: any[] }> {
    try {
      // Ensure tenant isolation is applied
      let modifiedQuery = query;
      let modifiedParams = [...params];

      // Add tenant ID filter if not present
      if (!query.toLowerCase().includes('tenant_id')) {
        // This is a simplified check - in practice, would need more sophisticated parsing
        const tenantIdIndex = modifiedParams.length;
        modifiedParams.push(user.tenantId);
        modifiedQuery += ` AND tenant_id = $${tenantIdIndex + 1}`;
      }

      // Check for other isolation rules based on user permissions
      if (user.roles.some(role => role.restrictions.canViewReports)) {
        // Add additional filters for report access
        // This could include date ranges, specific fields, etc.
      }

      return {
        valid: true,
        modifiedQuery,
        modifiedParams
      };
    } catch (error) {
      console.error('Data isolation validation failed:', error);
      return {
        valid: false,
        modifiedQuery: 'SELECT 1 WHERE 1=0', // Deny access
        modifiedParams: []
      };
    }
  }

  /**
   * Check if user can perform action on specific data
   */
  static async canPerformActionOnData(
    user: TenantUser,
    action: string,
    resourceType: string,
    resourceData: any
  ): Promise<boolean> {
    try {
      // Check basic resource access
      if (!await this.canAccessResource(user, resourceType, action)) {
        return false;
      }

      // Check data ownership
      if (resourceData.tenantId && resourceData.tenantId !== user.tenantId) {
        return false;
      }

      // Check user-specific restrictions
      for (const role of user.roles) {
        // Check time restrictions
        if (role.restrictions.timeRestrictions) {
          const isTimeAllowed = tenantSecurityService.isTimeAllowed(
            { timeRestrictions: role.restrictions.timeRestrictions } as any
          );
          if (!isTimeAllowed) {
            return false;
          }
        }

        // Check value restrictions (for financial data, etc.)
        if (action === 'create' || action === 'update') {
          if (role.restrictions.maxOrderValue > 0) {
            // Check if order value is within limits
            const orderValue = resourceData.value || resourceData.total || 0;
            if (orderValue > role.restrictions.maxOrderValue) {
              return false;
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Data action validation failed:', error);
      return false;
    }
  }

  /**
   * Check if user can manage other users
   */
  static async canManageUser(
    manager: TenantUser,
    targetUser: TenantUser,
    action: 'create' | 'read' | 'update' | 'delete' | 'assign_role'
  ): Promise<boolean> {
    try {
      // Cannot manage super admins unless you're a super admin
      if (targetUser.roles.some(role => role.name === 'super_admin') &&
          !manager.roles.some(role => role.name === 'super_admin')) {
        return false;
      }

      // Check if manager has user management permissions
      if (!await this.canAccessResource(manager, 'users', action)) {
        return false;
      }

      // Check role hierarchy
      for (const managerRole of manager.roles) {
        for (const targetRole of targetUser.roles) {
          if (managerRole.level <= targetRole.level) {
            // Manager role level must be higher than target role level
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('User management check failed:', error);
      return false;
    }
  }

  /**
   * Validate tenant upgrade/downgrade
   */
  static async validateTenantChange(
    user: TenantUser,
    tenant: Tenant,
    changes: Partial<Tenant>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if user can modify tenant settings
      if (!await this.canAccessResource(user, 'tenant_settings', 'update')) {
        errors.push('Insufficient permissions to modify tenant settings');
      }

      // Check for subscription changes
      if (changes.subscription && changes.subscription.plan !== tenant.subscription.plan) {
        // Validate plan change
        const planValidation = this.validatePlanChange(tenant.subscription.plan, changes.subscription.plan);
        errors.push(...planValidation.errors);
      }

      // Check for limit changes
      if (changes.limits) {
        const limitValidation = await this.validateLimitChanges(user, changes.limits);
        errors.push(...limitValidation.errors);
      }

      // Check for security changes
      if (changes.security) {
        const securityValidation = await this.validateSecurityChanges(user, changes.security);
        errors.push(...securityValidation.errors);
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Tenant change validation failed:', error);
      return {
        valid: false,
        errors: ['Validation failed due to internal error']
      };
    }
  }

  /**
   * Check API access permissions
   */
  static async canAccessAPI(
    user: TenantUser,
    endpoint: string,
    method: string
  ): Promise<boolean> {
    try {
      // Parse endpoint to determine resource and action
      const { resource, action } = this.parseEndpoint(endpoint, method);

      if (!resource || !action) {
        return false;
      }

      return await this.canAccessResource(user, resource, action);
    } catch (error) {
      console.error('API access check failed:', error);
      return false;
    }
  }

  /**
   * Check if user can export data
   */
  static async canExportData(
    user: TenantUser,
    resourceType: string,
    format: 'csv' | 'xlsx' | 'pdf'
  ): Promise<boolean> {
    try {
      // Check export permission
      if (!await this.canAccessResource(user, resourceType, 'read')) {
        return false;
      }

      // Check role-based export restrictions
      for (const role of user.roles) {
        if (!role.restrictions.canExportData) {
          return false;
        }
      }

      // Check data size limits
      // In practice, would check current data size against limits

      return true;
    } catch (error) {
      console.error('Export data check failed:', error);
      return false;
    }
  }

  /**
   * Validate data retention policy
   */
  static async validateDataRetention(
    tenant: Tenant,
    dataAge: number // in days
  ): Promise<{ canRetain: boolean; reason?: string }> {
    try {
      const maxRetention = tenant.security.dataRetention;
      
      if (dataAge > maxRetention) {
        return {
          canRetain: false,
          reason: `Data exceeds retention period of ${maxRetention} days`
        };
      }

      return { canRetain: true };
    } catch (error) {
      console.error('Data retention validation failed:', error);
      return { canRetain: false, reason: 'Validation error' };
    }
  }

  /**
   * Check IP whitelist
   */
  static isIPAllowed(user: TenantUser, ip: string): boolean {
    const tenantSecurity = user.metadata?.tenantSecurity;
    if (!tenantSecurity) {
      return true; // No restrictions
    }

    return tenantSecurityService.isIPAllowed(ip, tenantSecurity);
  }

  /**
   * Check session validity
   */
  static isSessionValid(user: TenantUser, sessionData: any): boolean {
    // Check if user is still active
    if (user.status !== 'active') {
      return false;
    }

    // Check session timeout
    const sessionTimeout = user.metadata?.tenantSecurity?.sessionTimeout || 480; // 8 hours
    const lastActivity = new Date(sessionData.lastActivity || user.updatedAt);
    const now = new Date();
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    if (minutesSinceActivity > sessionTimeout) {
      return false;
    }

    return true;
  }

  /**
   * Validate plan change
   */
  private static validatePlanChange(
    fromPlan: string,
    toPlan: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validPlanOrder = ['free', 'basic', 'professional', 'enterprise'];
    
    const fromIndex = validPlanOrder.indexOf(fromPlan);
    const toIndex = validPlanOrder.indexOf(toPlan);

    if (toIndex === -1) {
      errors.push('Invalid target plan');
    }

    if (toIndex < fromIndex) {
      errors.push('Cannot downgrade to a lower plan');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate limit changes
   */
  private static async validateLimitChanges(
    user: TenantUser,
    newLimits: any
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check if user has permission to change limits
    if (!user.roles.some(role => role.restrictions.canManageUsers)) {
      errors.push('Insufficient permissions to modify limits');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate security changes
   */
  private static async validateSecurityChanges(
    user: TenantUser,
    newSecurity: any
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Only super admins can change security settings
    if (!user.roles.some(role => role.name === 'super_admin')) {
      errors.push('Only super administrators can modify security settings');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse API endpoint to extract resource and action
   */
  private static parseEndpoint(
    endpoint: string,
    method: string
  ): { resource: string; action: string } {
    // Simple parsing - in practice would be more sophisticated
    if (endpoint.includes('/orders')) {
      return { resource: 'orders', action: method.toLowerCase() };
    }
    if (endpoint.includes('/customers')) {
      return { resource: 'customers', action: method.toLowerCase() };
    }
    if (endpoint.includes('/users')) {
      return { resource: 'users', action: method.toLowerCase() };
    }

    return { resource: '', action: '' };
  }
}

// Export singleton instance
export const tenantGuards = TenantGuards;
