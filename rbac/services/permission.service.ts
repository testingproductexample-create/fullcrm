// Permission Service
// Specialized service for permission management operations

import { 
  Permission, 
  PermissionName, 
  ResourceType, 
  PermissionAction,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  RBACException,
  RBACErrorCode,
  ValidationResult,
  PermissionValidationResult
} from '../types/rbac.types';
import { 
  parsePermissionName, 
  validatePermissionName,
  generateResourcePermissions,
  sanitizePermissions,
  groupPermissionsByResource,
  getResourcePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
} from '../utils/permissions';
import { 
  getAllRoleDefinitions,
  getRolePermissions
} from '../utils/roles';
import { 
  validatePermission, 
  validateCreatePermission,
  validatePermissionName as validatePermissionNameUtil
} from '../utils/validation';

export class PermissionService {
  private static instance: PermissionService;

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  // ==========================================
  // PERMISSION CREATION AND MANAGEMENT
  // ==========================================

  /**
   * Create a new permission
   * @param permissionData - Permission creation data
   * @returns Created permission
   */
  async createPermission(permissionData: CreatePermissionRequest): Promise<Permission> {
    try {
      // Validate the permission data
      const validation = validateCreatePermission(permissionData);
      if (!validation.is_valid) {
        throw new RBACException(
          'INVALID_PERMISSION_DATA',
          'Invalid permission creation data',
          { errors: validation.errors }
        );
      }

      // Create the permission object
      const newPermission: Permission = {
        id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: permissionData.name,
        display_name: permissionData.display_name,
        description: permissionData.description,
        resource: permissionData.resource,
        action: permissionData.action,
        is_system_permission: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: permissionData.metadata || {}
      };

      // In a real implementation, this would save to database
      // For now, we'll just return the created permission
      return newPermission;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to create permission: ${error.message}`,
        { permissionData, error: error.message }
      );
    }
  }

  /**
   * Update an existing permission
   * @param permissionId - Permission ID
   * @param updates - Permission updates
   * @returns Updated permission
   */
  async updatePermission(permissionId: string, updates: UpdatePermissionRequest): Promise<Permission> {
    try {
      // Get existing permission (in real implementation, this would query database)
      const existingPermission = await this.getPermissionById(permissionId);
      if (!existingPermission) {
        throw new RBACException(
          'PERMISSION_NOT_FOUND',
          `Permission with ID ${permissionId} not found`
        );
      }

      // Check if trying to update system permission
      if (existingPermission.is_system_permission) {
        throw new RBACException(
          'CANNOT_MODIFY_SYSTEM_PERMISSION',
          'Cannot modify system permissions'
        );
      }

      // Update the permission
      const updatedPermission: Permission = {
        ...existingPermission,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Validate the updated permission
      const validation = validatePermission(updatedPermission);
      if (!validation.is_valid) {
        throw new RBACException(
          'INVALID_PERMISSION_DATA',
          'Invalid permission update data',
          { errors: validation.errors }
        );
      }

      // Save to database (simulated)
      return updatedPermission;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to update permission: ${error.message}`,
        { permissionId, updates, error: error.message }
      );
    }
  }

  /**
   * Delete a permission
   * @param permissionId - Permission ID
   * @returns Boolean indicating success
   */
  async deletePermission(permissionId: string): Promise<boolean> {
    try {
      // Get existing permission
      const existingPermission = await this.getPermissionById(permissionId);
      if (!existingPermission) {
        throw new RBACException(
          'PERMISSION_NOT_FOUND',
          `Permission with ID ${permissionId} not found`
        );
      }

      // Check if it's a system permission
      if (existingPermission.is_system_permission) {
        throw new RBACException(
          'CANNOT_DELETE_SYSTEM_PERMISSION',
          'Cannot delete system permissions'
        );
      }

      // Check if permission is in use
      const usageCount = await this.getPermissionUsageCount(permissionId);
      if (usageCount > 0) {
        throw new RBACException(
          'PERMISSION_IN_USE',
          `Cannot delete permission. It is used by ${usageCount} role(s)`
        );
      }

      // Delete from database (simulated)
      return true;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to delete permission: ${error.message}`,
        { permissionId, error: error.message }
      );
    }
  }

  /**
   * Get permission by ID
   * @param permissionId - Permission ID
   * @returns Permission or undefined
   */
  async getPermissionById(permissionId: string): Promise<Permission | undefined> {
    try {
      // Get all permissions and find by ID
      const allPermissions = await this.getAllPermissions();
      return allPermissions.find(p => p.id === permissionId);

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get permission: ${error.message}`,
        { permissionId, error: error.message }
      );
    }
  }

  /**
   * Get all permissions
   * @returns Array of all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      // Generate all permissions from role definitions
      const permissions = new Map<string, Permission>();

      // Add system permissions from role definitions
      getAllRoleDefinitions().forEach(roleDef => {
        roleDef.default_permissions.forEach(permissionName => {
          const [resource, action] = permissionName.split(':');
          
          if (!permissions.has(permissionName)) {
            permissions.set(permissionName, {
              id: `sys_${permissionName}`,
              name: permissionName,
              display_name: permissionName,
              resource: resource as ResourceType,
              action: action as PermissionAction,
              is_system_permission: true,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        });
      });

      return Array.from(permissions.values());

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get permissions: ${error.message}`,
        { error: error.message }
      );
    }
  }

  // ==========================================
  // PERMISSION VALIDATION
  // ==========================================

  /**
   * Validate a permission
   * @param permission - Permission to validate
   * @returns Validation result
   */
  validatePermissionData(permission: Partial<Permission>): PermissionValidationResult {
    return validatePermission(permission);
  }

  /**
   * Validate permission name format
   * @param permissionName - Permission name to validate
   * @returns Validation result
   */
  validatePermissionNameFormat(permissionName: string): ValidationResult {
    return validatePermissionNameUtil(permissionName);
  }

  /**
   * Validate if a permission can be created
   * @param permissionData - Permission data
   * @param existingPermissions - Existing permissions
   * @returns Validation result
   */
  async validatePermissionCreation(
    permissionData: CreatePermissionRequest,
    existingPermissions: Permission[] = []
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check if permission name already exists
    if (existingPermissions.some(p => p.name === permissionData.name)) {
      errors.push(`Permission with name "${permissionData.name}" already exists`);
    }

    // Validate permission name format
    const nameValidation = this.validatePermissionNameFormat(permissionData.name);
    if (!nameValidation.is_valid) {
      errors.push(...nameValidation.errors);
    }

    return {
      is_valid: errors.length === 0,
      errors
    };
  }

  // ==========================================
  // PERMISSION BULK OPERATIONS
  // ==========================================

  /**
   * Create multiple permissions at once
   * @param permissionsData - Array of permission creation data
   * @returns Array of created permissions
   */
  async createPermissionsBulk(permissionsData: CreatePermissionRequest[]): Promise<Permission[]> {
    try {
      const createdPermissions: Permission[] = [];
      const errors: string[] = [];

      for (let i = 0; i < permissionsData.length; i++) {
        const permissionData = permissionsData[i];
        
        try {
          const permission = await this.createPermission(permissionData);
          createdPermissions.push(permission);
        } catch (error) {
          errors.push(`Failed to create permission ${i + 1}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        throw new RBACException(
          'BULK_CREATE_ERROR',
          `Some permissions failed to create`,
          { errors, successful_count: createdPermissions.length }
        );
      }

      return createdPermissions;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to create permissions in bulk: ${error.message}`,
        { permissionsData, error: error.message }
      );
    }
  }

  /**
   * Delete multiple permissions at once
   * @param permissionIds - Array of permission IDs to delete
   * @returns Object with success count and errors
   */
  async deletePermissionsBulk(permissionIds: string[]): Promise<{ 
    successful_deletions: string[]; 
    failed_deletions: { id: string; error: string }[] 
  }> {
    try {
      const successfulDeletions: string[] = [];
      const failedDeletions: { id: string; error: string }[] = [];

      for (const permissionId of permissionIds) {
        try {
          await this.deletePermission(permissionId);
          successfulDeletions.push(permissionId);
        } catch (error) {
          failedDeletions.push({
            id: permissionId,
            error: error.message
          });
        }
      }

      return {
        successful_deletions: successfulDeletions,
        failed_deletions: failedDeletions
      };

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to delete permissions in bulk: ${error.message}`,
        { permissionIds, error: error.message }
      );
    }
  }

  // ==========================================
  // PERMISSION QUERIES
  // ==========================================

  /**
   * Get permissions by resource
   * @param resource - Resource type
   * @returns Array of permissions for the resource
   */
  async getPermissionsByResource(resource: ResourceType): Promise<Permission[]> {
    try {
      const allPermissions = await this.getAllPermissions();
      return allPermissions.filter(p => p.resource === resource);
    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get permissions by resource: ${error.message}`,
        { resource, error: error.message }
      );
    }
  }

  /**
   * Get permissions by action
   * @param action - Action type
   * @returns Array of permissions for the action
   */
  async getPermissionsByAction(action: PermissionAction): Promise<Permission[]> {
    try {
      const allPermissions = await this.getAllPermissions();
      return allPermissions.filter(p => p.action === action);
    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get permissions by action: ${error.message}`,
        { action, error: error.message }
      );
    }
  }

  /**
   * Get permissions for a resource-action combination
   * @param resource - Resource type
   * @param action - Action type
   * @returns Permission or undefined
   */
  async getPermissionByResourceAction(
    resource: ResourceType, 
    action: PermissionAction
  ): Promise<Permission | undefined> {
    try {
      const allPermissions = await this.getAllPermissions();
      return allPermissions.find(p => p.resource === resource && p.action === action);
    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get permission: ${error.message}`,
        { resource, action, error: error.message }
      );
    }
  }

  /**
   * Generate all possible permissions for a resource
   * @param resource - Resource type
   * @param actions - Array of actions (optional, defaults to all)
   * @returns Array of generated permission names
   */
  generatePermissionsForResource(
    resource: ResourceType, 
    actions?: PermissionAction[]
  ): PermissionName[] {
    return generateResourcePermissions(resource, actions);
  }

  /**
   * Get all system permissions
   * @returns Array of system permissions
   */
  async getSystemPermissions(): Promise<Permission[]> {
    try {
      const allPermissions = await this.getAllPermissions();
      return allPermissions.filter(p => p.is_system_permission);
    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get system permissions: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Get all custom permissions
   * @returns Array of custom permissions
   */
  async getCustomPermissions(): Promise<Permission[]> {
    try {
      const allPermissions = await this.getAllPermissions();
      return allPermissions.filter(p => !p.is_system_permission);
    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get custom permissions: ${error.message}`,
        { error: error.message }
      );
    }
  }

  // ==========================================
  // PERMISSION ANALYSIS
  // ==========================================

  /**
   * Get permission usage statistics
   * @returns Permission usage statistics
   */
  async getPermissionStatistics(): Promise<{
    total_permissions: number;
    system_permissions: number;
    custom_permissions: number;
    active_permissions: number;
    inactive_permissions: number;
    permissions_by_resource: Record<ResourceType, number>;
    permissions_by_action: Record<PermissionAction, number>;
  }> {
    try {
      const allPermissions = await this.getAllPermissions();
      const systemPermissions = allPermissions.filter(p => p.is_system_permission);
      const customPermissions = allPermissions.filter(p => !p.is_system_permission);
      const activePermissions = allPermissions.filter(p => p.is_active);
      const inactivePermissions = allPermissions.filter(p => !p.is_active);

      // Group by resource
      const permissionsByResource = allPermissions.reduce((acc, permission) => {
        acc[permission.resource] = (acc[permission.resource] || 0) + 1;
        return acc;
      }, {} as Record<ResourceType, number>);

      // Group by action
      const permissionsByAction = allPermissions.reduce((acc, permission) => {
        acc[permission.action] = (acc[permission.action] || 0) + 1;
        return acc;
      }, {} as Record<PermissionAction, number>);

      return {
        total_permissions: allPermissions.length,
        system_permissions: systemPermissions.length,
        custom_permissions: customPermissions.length,
        active_permissions: activePermissions.length,
        inactive_permissions: inactivePermissions.length,
        permissions_by_resource: permissionsByResource,
        permissions_by_action: permissionsByAction
      };

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get permission statistics: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Find unused permissions
   * @returns Array of unused permissions
   */
  async getUnusedPermissions(): Promise<Permission[]> {
    try {
      const allPermissions = await this.getAllPermissions();
      const unusedPermissions: Permission[] = [];

      // In a real implementation, this would check which permissions
      // are not assigned to any roles
      // For now, we'll return an empty array
      return unusedPermissions;

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get unused permissions: ${error.message}`,
        { error: error.message }
      );
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Get count of roles using a permission
   * @param permissionId - Permission ID
   * @returns Number of roles using the permission
   */
  private async getPermissionUsageCount(permissionId: string): Promise<number> {
    // In a real implementation, this would query the database
    // to count how many roles have this permission assigned
    return 0;
  }

  /**
   * Check if permission name follows naming convention
   * @param permissionName - Permission name to check
   * @returns Boolean indicating if it follows the convention
   */
  private followsNamingConvention(permissionName: string): boolean {
    const pattern = /^[a-z0-9_]+:[a-z_]+$/;
    return pattern.test(permissionName);
  }

  /**
   * Get recommended actions for a resource
   * @param resource - Resource type
   * @returns Array of recommended actions
   */
  private getRecommendedActionsForResource(resource: ResourceType): PermissionAction[] {
    const defaultActions: PermissionAction[] = ['read', 'write', 'delete', 'manage'];
    
    // Resource-specific recommended actions
    const resourceSpecificActions: Record<ResourceType, PermissionAction[]> = {
      dashboard: ['read', 'write', 'manage'],
      appointments: ['read', 'write', 'delete', 'manage', 'schedule', 'cancel', 'reschedule', 'availability'],
      billing: ['read', 'write', 'delete', 'manage', 'invoices', 'payments', 'refunds', 'reports', 'export'],
      communication: ['read', 'write', 'manage', 'email', 'sms', 'whatsapp', 'video', 'bulk', 'templates'],
      compliance: ['read', 'write', 'manage', 'audit', 'regulatory', 'reports', 'violations'],
      customers: ['read', 'write', 'delete', 'manage', 'profile', 'segments', 'preferences', 'notes', 'loyalty'],
      designs: ['read', 'write', 'delete', 'manage', 'approval', 'variants', 'media', 'browse', 'fabrics'],
      documents: ['read', 'write', 'delete', 'manage', 'upload', 'share', 'templates', 'categories', 'approvals'],
      employees: ['read', 'write', 'delete', 'manage', 'directory', 'profile', 'skills', 'training', 'reviews', 'emergency'],
      finance: ['read', 'write', 'delete', 'manage', 'budgets', 'expenses', 'revenue', 'transactions', 'reports'],
      measurements: ['read', 'write', 'delete', 'manage', 'fitting', 'alterations', 'photos', 'notes'],
      orders: ['read', 'write', 'delete', 'manage', 'create', 'status', 'templates'],
      payroll: ['read', 'write', 'delete', 'manage', 'processing', 'calculations', 'commissions', 'structures', 'payslips'],
      security: ['read', 'write', 'manage', 'authentication', 'monitoring', 'compliance'],
      visa_compliance: ['read', 'write', 'manage', 'visas', 'violations', 'wps', 'regulatory'],
      workflow: ['read', 'write', 'delete', 'manage', 'templates', 'analytics', 'automation'],
      workload: ['read', 'write', 'manage', 'assignments', 'monitoring'],
      analytics: ['read', 'write', 'manage', 'export', 'dashboards'],
      mobile: ['read', 'write', 'manage', 'offline'],
      offline: ['read', 'sync', 'manage'],
      users: ['read', 'write', 'delete', 'manage', 'roles', 'permissions'],
      system: ['read', 'write', 'manage', 'backup', 'restore', 'maintenance'],
      audit: ['read', 'manage', 'export', 'reports'],
      logging: ['read', 'manage']
    };

    return resourceSpecificActions[resource] || defaultActions;
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();
