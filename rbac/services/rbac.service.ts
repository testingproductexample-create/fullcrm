// RBAC Service
// Main business logic and API for role-based access control

import { 
  RBACUser, 
  Role, 
  Permission, 
  RolePermission, 
  UserRole, 
  RoleHierarchy,
  UserPermissionOverride,
  PermissionAuditLog,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  AssignRoleRequest,
  RevokeRoleRequest,
  GrantPermissionOverrideRequest,
  PermissionCheckRequest,
  PermissionCheckResponse,
  RBACApiResponse,
  RBACListResponse,
  RBACSummary,
  UserPermissionSummary,
  PermissionMatrix,
  RBACError,
  RBACException,
  RBACErrorCode
} from '../types/rbac.types';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionLevel,
  canPerformAction,
  hasRole,
  hasAnyRole,
  isAdmin,
  canManageUsers,
  canViewAuditLogs,
  sanitizePermissions,
  validatePermissionName,
  groupPermissionsByResource
} from '../utils/permissions';
import { 
  getRoleDefinition, 
  getAllRoleDefinitions, 
  getRolePermissions,
  getRolesSortedByLevel,
  isSystemRole,
  getAdminRoles
} from '../utils/roles';
import { 
  validateRole, 
  validateCreateRole, 
  validatePermission, 
  validateCreatePermission,
  validateRoleAssignment,
  validateAccess,
  validateUserPermissionContext
} from '../utils/validation';

// ==========================================
// RBAC SERVICE CLASS
// ==========================================

export class RBACService {
  private static instance: RBACService;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  // Singleton pattern
  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  // ==========================================
  // USER PERMISSION MANAGEMENT
  // ==========================================

  /**
   * Get all permissions for a user
   * @param userId - User ID
   * @param includeOverrides - Whether to include user-specific overrides
   * @returns Array of user permissions
   */
  async getUserPermissions(userId: string, includeOverrides: boolean = true): Promise<PermissionName[]> {
    try {
      // Check cache first
      const cacheKey = `user_permissions_${userId}_${includeOverrides}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // In a real implementation, this would query the database
      // For now, we'll return permissions based on user's roles
      const userRoles = await this.getUserRoles(userId);
      const allPermissions = new Set<PermissionName>();

      // Get permissions from all roles
      for (const roleName of userRoles) {
        const rolePermissions = getRolePermissions(roleName);
        rolePermissions.forEach(permission => allPermissions.add(permission));
      }

      // Apply user-specific overrides if requested
      if (includeOverrides) {
        const overrides = await this.getUserPermissionOverrides(userId);
        overrides.forEach(override => {
          if (override.is_granted) {
            allPermissions.add(override.permission.name);
          } else {
            allPermissions.delete(override.permission.name);
          }
        });
      }

      const result = Array.from(allPermissions);
      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get user permissions: ${error.message}`,
        { userId, error: error.message }
      );
    }
  }

  /**
   * Get all roles for a user
   * @param userId - User ID
   * @returns Array of user role names
   */
  async getUserRoles(userId: string): Promise<RoleName[]> {
    try {
      // Check cache first
      const cacheKey = `user_roles_${userId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // In a real implementation, this would query the database
      // For demonstration, we'll return some example roles
      const result: RoleName[] = ['employee']; // Default role
      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get user roles: ${error.message}`,
        { userId, error: error.message }
      );
    }
  }

  /**
   * Check if a user has a specific permission
   * @param userId - User ID
   * @param permission - Permission to check
   * @param includeOverrides - Whether to include user-specific overrides
   * @returns Boolean indicating if user has permission
   */
  async hasPermission(
    userId: string, 
    permission: PermissionName, 
    includeOverrides: boolean = true
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId, includeOverrides);
      return hasPermission(userPermissions, permission);
    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to check permission: ${error.message}`,
        { userId, permission, error: error.message }
      );
    }
  }

  /**
   * Check if a user has any of the specified permissions
   * @param userId - User ID
   * @param permissions - Permissions to check
   * @param includeOverrides - Whether to include user-specific overrides
   * @returns Boolean indicating if user has any permission
   */
  async hasAnyPermission(
    userId: string, 
    permissions: PermissionName[], 
    includeOverrides: boolean = true
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId, includeOverrides);
      return hasAnyPermission(userPermissions, permissions);
    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to check permissions: ${error.message}`,
        { userId, permissions, error: error.message }
      );
    }
  }

  /**
   * Check if a user has all of the specified permissions
   * @param userId - User ID
   * @param permissions - Permissions to check
   * @param includeOverrides - Whether to include user-specific overrides
   * @returns Boolean indicating if user has all permissions
   */
  async hasAllPermissions(
    userId: string, 
    permissions: PermissionName[], 
    includeOverrides: boolean = true
  ): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId, includeOverrides);
      return hasAllPermissions(userPermissions, permissions);
    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to check permissions: ${error.message}`,
        { userId, permissions, error: error.message }
      );
    }
  }

  /**
   * Get user's permission level for a resource
   * @param userId - User ID
   * @param resource - Resource type
   * @param includeOverrides - Whether to include user-specific overrides
   * @returns Permission level: 'none', 'read', 'write', or 'manage'
   */
  async getPermissionLevel(
    userId: string, 
    resource: ResourceType, 
    includeOverrides: boolean = true
  ): Promise<'none' | 'read' | 'write' | 'manage'> {
    try {
      const userPermissions = await this.getUserPermissions(userId, includeOverrides);
      return getPermissionLevel(userPermissions, resource);
    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get permission level: ${error.message}`,
        { userId, resource, error: error.message }
      );
    }
  }

  // ==========================================
  // ROLE MANAGEMENT
  // ==========================================

  /**
   * Get all roles
   * @returns Array of all roles
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      // Check cache first
      const cacheKey = 'all_roles';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Convert role definitions to Role objects
      const roles = getAllRoleDefinitions().map(roleDef => ({
        id: roleDef.name, // Using name as ID for system roles
        name: roleDef.name,
        display_name: roleDef.display_name,
        description: roleDef.description,
        is_system_role: isSystemRole(roleDef.name),
        is_active: true,
        level: roleDef.level,
        permissions: roleDef.default_permissions.map(perm => ({
          id: perm,
          name: perm,
          display_name: perm,
          resource: perm.split(':')[0] as ResourceType,
          action: perm.split(':')[1] as PermissionAction,
          is_system_permission: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      this.setCache(cacheKey, roles);
      return roles;

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get roles: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Create a new role
   * @param roleData - Role creation data
   * @param createdBy - ID of the user creating the role
   * @returns Created role
   */
  async createRole(roleData: CreateRoleRequest, createdBy: string): Promise<Role> {
    try {
      // Validate role data
      const validation = validateCreateRole(roleData);
      if (!validation.is_valid) {
        throw new RBACException(
          'INVALID_ROLE_DATA',
          'Invalid role data',
          { errors: validation.errors }
        );
      }

      // Create role object
      const newRole: Role = {
        id: `custom_${Date.now()}`, // In real implementation, this would be UUID
        name: roleData.name,
        display_name: roleData.display_name,
        description: roleData.description,
        is_system_role: false,
        is_active: true,
        level: roleData.level || 5,
        permissions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: roleData.metadata
      };

      // Save to database (simulated)
      // In real implementation, this would save to database

      // Clear cache
      this.clearCache();

      // Log audit
      await this.logAudit('create_role', {
        role_id: newRole.id,
        role_name: newRole.name,
        new_values: newRole
      }, createdBy);

      return newRole;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to create role: ${error.message}`,
        { roleData, createdBy, error: error.message }
      );
    }
  }

  /**
   * Update an existing role
   * @param roleId - Role ID
   * @param updates - Role updates
   * @param updatedBy - ID of the user updating the role
   * @returns Updated role
   */
  async updateRole(roleId: string, updates: UpdateRoleRequest, updatedBy: string): Promise<Role> {
    try {
      // Get existing role
      const existingRole = await this.getRoleById(roleId);
      if (!existingRole) {
        throw new RBACException('ROLE_NOT_FOUND', `Role with ID ${roleId} not found`);
      }

      // Validate updates
      if (updates.is_active === false && existingRole.is_system_role) {
        throw new RBACException(
          'CANNOT_DEACTIVATE_SYSTEM_ROLE',
          'Cannot deactivate system roles'
        );
      }

      // Update role object
      const updatedRole: Role = {
        ...existingRole,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Save to database (simulated)
      // In real implementation, this would save to database

      // Clear cache
      this.clearCache();

      // Log audit
      await this.logAudit('update_role', {
        role_id: roleId,
        old_values: existingRole,
        new_values: updates
      }, updatedBy);

      return updatedRole;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to update role: ${error.message}`,
        { roleId, updates, updatedBy, error: error.message }
      );
    }
  }

  /**
   * Delete a role
   * @param roleId - Role ID
   * @param deletedBy - ID of the user deleting the role
   * @returns Boolean indicating success
   */
  async deleteRole(roleId: string, deletedBy: string): Promise<boolean> {
    try {
      // Get existing role
      const existingRole = await this.getRoleById(roleId);
      if (!existingRole) {
        throw new RBACException('ROLE_NOT_FOUND', `Role with ID ${roleId} not found`);
      }

      // Check if role is system role
      if (existingRole.is_system_role) {
        throw new RBACException(
          'CANNOT_DELETE_SYSTEM_ROLE',
          'Cannot delete system roles'
        );
      }

      // Check if role is assigned to users
      const userCount = await this.getRoleUserCount(roleId);
      if (userCount > 0) {
        throw new RBACException(
          'ROLE_IN_USE',
          `Cannot delete role. It is assigned to ${userCount} users`
        );
      }

      // Delete role (simulated)
      // In real implementation, this would delete from database

      // Clear cache
      this.clearCache();

      // Log audit
      await this.logAudit('delete_role', {
        role_id: roleId,
        old_values: existingRole
      }, deletedBy);

      return true;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to delete role: ${error.message}`,
        { roleId, deletedBy, error: error.message }
      );
    }
  }

  /**
   * Get a role by ID
   * @param roleId - Role ID
   * @returns Role or undefined
   */
  async getRoleById(roleId: string): Promise<Role | undefined> {
    try {
      const roles = await this.getAllRoles();
      return roles.find(role => role.id === roleId || role.name === roleId);
    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get role: ${error.message}`,
        { roleId, error: error.message }
      );
    }
  }

  // ==========================================
  // PERMISSION MANAGEMENT
  // ==========================================

  /**
   * Get all permissions
   * @returns Array of all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      // Check cache first
      const cacheKey = 'all_permissions';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Generate all permissions for all resources
      const allPermissions = new Set<Permission>();
      
      getAllRoleDefinitions().forEach(roleDef => {
        roleDef.default_permissions.forEach(permissionName => {
          const [resource, action] = permissionName.split(':');
          allPermissions.add({
            id: permissionName,
            name: permissionName,
            display_name: permissionName,
            resource: resource as ResourceType,
            action: action as PermissionAction,
            is_system_permission: true,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });
      });

      const result = Array.from(allPermissions);
      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get permissions: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Create a new permission
   * @param permissionData - Permission creation data
   * @param createdBy - ID of the user creating the permission
   * @returns Created permission
   */
  async createPermission(permissionData: CreatePermissionRequest, createdBy: string): Promise<Permission> {
    try {
      // Validate permission data
      const validation = validateCreatePermission(permissionData);
      if (!validation.is_valid) {
        throw new RBACException(
          'INVALID_PERMISSION_DATA',
          'Invalid permission data',
          { errors: validation.errors }
        );
      }

      // Create permission object
      const newPermission: Permission = {
        id: `custom_${Date.now()}`, // In real implementation, this would be UUID
        name: permissionData.name,
        display_name: permissionData.display_name,
        description: permissionData.description,
        resource: permissionData.resource,
        action: permissionData.action,
        is_system_permission: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: permissionData.metadata
      };

      // Save to database (simulated)
      // In real implementation, this would save to database

      // Clear cache
      this.clearCache();

      // Log audit
      await this.logAudit('create_permission', {
        permission_id: newPermission.id,
        permission_name: newPermission.name,
        new_values: newPermission
      }, createdBy);

      return newPermission;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to create permission: ${error.message}`,
        { permissionData, createdBy, error: error.message }
      );
    }
  }

  // ==========================================
  // ROLE ASSIGNMENT
  // ==========================================

  /**
   * Assign a role to a user
   * @param assignment - Role assignment data
   * @param assignedBy - ID of the user making the assignment
   * @returns Boolean indicating success
   */
  async assignRole(assignment: AssignRoleRequest, assignedBy: string): Promise<boolean> {
    try {
      // Get existing user roles
      const existingUserRoles = await this.getUserRoles(assignment.user_id);

      // Validate assignment
      const validation = validateRoleAssignment(assignment.user_id, assignment.role_id, existingUserRoles);
      if (!validation.is_valid) {
        throw new RBACException(
          'INVALID_ROLE_ASSIGNMENT',
          'Invalid role assignment',
          { errors: validation.errors }
        );
      }

      // Check if the assigner has permission to assign this role
      const assignerPermissions = await this.getUserPermissions(assignedBy);
      if (!canManageUsers(assignerPermissions) && !isAdmin(assignerPermissions)) {
        throw new RBACException(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions to assign roles'
        );
      }

      // Assign role (simulated)
      // In real implementation, this would save to database

      // Clear cache
      this.clearUserCache(assignment.user_id);

      // Log audit
      await this.logAudit('assign_role', {
        target_user_id: assignment.user_id,
        target_role_id: assignment.role_id,
        expires_at: assignment.expires_at
      }, assignedBy);

      return true;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to assign role: ${error.message}`,
        { assignment, assignedBy, error: error.message }
      );
    }
  }

  /**
   * Revoke a role from a user
   * @param revocation - Role revocation data
   * @param revokedBy - ID of the user revoking the role
   * @returns Boolean indicating success
   */
  async revokeRole(revocation: RevokeRoleRequest, revokedBy: string): Promise<boolean> {
    try {
      // Check if the revoker has permission to revoke roles
      const revokerPermissions = await this.getUserPermissions(revokedBy);
      if (!canManageUsers(revokerPermissions) && !isAdmin(revokerPermissions)) {
        throw new RBACException(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions to revoke roles'
        );
      }

      // Revoke role (simulated)
      // In real implementation, this would update the database

      // Clear cache
      this.clearUserCache(revocation.user_id);

      // Log audit
      await this.logAudit('revoke_role', {
        target_user_id: revocation.user_id,
        target_role_id: revocation.role_id
      }, revokedBy);

      return true;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to revoke role: ${error.message}`,
        { revocation, revokedBy, error: error.message }
      );
    }
  }

  // ==========================================
  // PERMISSION MATRIX
  // ==========================================

  /**
   * Get permission matrix for all roles
   * @returns Permission matrix
   */
  async getPermissionMatrix(): Promise<PermissionMatrix> {
    try {
      // Check cache first
      const cacheKey = 'permission_matrix';
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const roles = await this.getAllRoles();
      const matrix: PermissionMatrix = {};

      roles.forEach(role => {
        matrix[role.name] = groupPermissionsByResource(
          role.permissions.map(p => p.name)
        );
      });

      this.setCache(cacheKey, matrix);
      return matrix;

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get permission matrix: ${error.message}`,
        { error: error.message }
      );
    }
  }

  // ==========================================
  // AUDIT AND REPORTING
  // ==========================================

  /**
   * Get audit log entries
   * @param userId - Optional user ID to filter by
   * @param limit - Maximum number of entries to return
   * @param offset - Offset for pagination
   * @returns Array of audit log entries
   */
  async getAuditLog(userId?: string, limit: number = 100, offset: number = 0): Promise<PermissionAuditLog[]> {
    try {
      // Check if user has permission to view audit logs
      if (userId) {
        const userPermissions = await this.getUserPermissions(userId);
        if (!canViewAuditLogs(userPermissions)) {
          throw new RBACException(
            'INSUFFICIENT_PERMISSIONS',
            'Insufficient permissions to view audit logs'
          );
        }
      }

      // In real implementation, this would query the database
      // For now, return empty array
      return [];

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get audit log: ${error.message}`,
        { userId, limit, offset, error: error.message }
      );
    }
  }

  /**
   * Get system summary
   * @returns System summary
   */
  async getSystemSummary(): Promise<RBACSummary> {
    try {
      const roles = await this.getAllRoles();
      const permissions = await this.getAllPermissions();

      return {
        total_users: 0, // Would be calculated from database
        total_roles: roles.length,
        total_permissions: permissions.length,
        total_role_assignments: 0, // Would be calculated from database
        active_sessions: 0, // Would be calculated from session management
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get system summary: ${error.message}`,
        { error: error.message }
      );
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Get user permission overrides
   * @param userId - User ID
   * @returns Array of permission overrides
   */
  private async getUserPermissionOverrides(userId: string): Promise<UserPermissionOverride[]> {
    // In real implementation, this would query the database
    return [];
  }

  /**
   * Get number of users assigned to a role
   * @param roleId - Role ID
   * @returns Number of users
   */
  private async getRoleUserCount(roleId: string): Promise<number> {
    // In real implementation, this would query the database
    return 0;
  }

  /**
   * Log an audit event
   * @param action - Action performed
   * @param data - Action data
   * @param userId - User performing the action
   */
  private async logAudit(action: string, data: any, userId: string): Promise<void> {
    // In real implementation, this would save to audit log table
    console.log('RBAC Audit:', { action, data, userId, timestamp: new Date().toISOString() });
  }

  /**
   * Get data from cache
   * @param key - Cache key
   * @returns Cached data or undefined
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return undefined;
  }

  /**
   * Set data in cache
   * @param key - Cache key
   * @param data - Data to cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheExpiry
    });
  }

  /**
   * Clear cache for a specific user
   * @param userId - User ID
   */
  private clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((value, key) => {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  private clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const rbacService = RBACService.getInstance();
