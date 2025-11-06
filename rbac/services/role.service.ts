// Role Service
// Specialized service for role management operations

import { 
  Role, 
  RoleName, 
  CreateRoleRequest, 
  UpdateRoleRequest, 
  RBACException,
  ValidationResult,
  RoleValidationResult,
  AssignRoleRequest,
  RevokeRoleRequest,
  UserRole,
  RoleHierarchy
} from '../types/rbac.types';
import { 
  getRoleDefinition, 
  getAllRoleDefinitions, 
  getRolePermissions,
  getRolesSortedByLevel,
  getRolesByLevel,
  getAssignableRoles,
  getParentRoles,
  getMaximumUserLevel,
  canInheritFrom,
  isSystemRole,
  getAdminRoles
} from '../utils/roles';
import { 
  validateRole, 
  validateCreateRole, 
  validateRoleAssignment,
  validateRoleHierarchy,
  validateRoleName,
  validateRoleLevel
} from '../utils/validation';

export class RoleService {
  private static instance: RoleService;

  public static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
  }

  // ==========================================
  // ROLE CREATION AND MANAGEMENT
  // ==========================================

  /**
   * Create a new role
   * @param roleData - Role creation data
   * @param createdBy - ID of user creating the role
   * @returns Created role
   */
  async createRole(roleData: CreateRoleRequest, createdBy: string): Promise<Role> {
    try {
      // Validate role data
      const validation = validateCreateRole(roleData);
      if (!validation.is_valid) {
        throw new RBACException(
          'INVALID_ROLE_DATA',
          'Invalid role creation data',
          { errors: validation.errors }
        );
      }

      // Check if role name already exists
      const existingRole = await this.getRoleByName(roleData.name);
      if (existingRole) {
        throw new RBACException(
          'DUPLICATE_ROLE_NAME',
          `Role with name "${roleData.name}" already exists`
        );
      }

      // Create the role object
      const newRole: Role = {
        id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: roleData.name,
        display_name: roleData.display_name,
        description: roleData.description,
        is_system_role: false,
        is_active: true,
        level: roleData.level || 5,
        permissions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: roleData.metadata || {}
      };

      // In a real implementation, this would save to database
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
   * @param updatedBy - ID of user updating the role
   * @returns Updated role
   */
  async updateRole(roleId: string, updates: UpdateRoleRequest, updatedBy: string): Promise<Role> {
    try {
      // Get existing role
      const existingRole = await this.getRoleById(roleId);
      if (!existingRole) {
        throw new RBACException(
          'ROLE_NOT_FOUND',
          `Role with ID ${roleId} not found`
        );
      }

      // Check if trying to modify system role
      if (existingRole.is_system_role) {
        throw new RBACException(
          'CANNOT_MODIFY_SYSTEM_ROLE',
          'Cannot modify system roles'
        );
      }

      // Validate updates
      const updatedRoleData = { ...existingRole, ...updates };
      const validation = validateRole(updatedRoleData);
      if (!validation.is_valid) {
        throw new RBACException(
          'INVALID_ROLE_DATA',
          'Invalid role update data',
          { errors: validation.errors }
        );
      }

      // Update the role
      const updatedRole: Role = {
        ...existingRole,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // In a real implementation, this would save to database
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
   * @param deletedBy - ID of user deleting the role
   * @returns Boolean indicating success
   */
  async deleteRole(roleId: string, deletedBy: string): Promise<boolean> {
    try {
      // Get existing role
      const existingRole = await this.getRoleById(roleId);
      if (!existingRole) {
        throw new RBACException(
          'ROLE_NOT_FOUND',
          `Role with ID ${roleId} not found`
        );
      }

      // Check if it's a system role
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
          `Cannot delete role. It is assigned to ${userCount} user(s)`
        );
      }

      // Check if role has child roles
      const childCount = await this.getRoleChildCount(roleId);
      if (childCount > 0) {
        throw new RBACException(
          'ROLE_HAS_CHILDREN',
          `Cannot delete role. It has ${childCount} child role(s)`
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
        `Failed to delete role: ${error.message}`,
        { roleId, deletedBy, error: error.message }
      );
    }
  }

  /**
   * Get role by ID
   * @param roleId - Role ID
   * @returns Role or undefined
   */
  async getRoleById(roleId: string): Promise<Role | undefined> {
    try {
      const roles = await this.getAllRoles();
      return roles.find(role => role.id === roleId);

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get role: ${error.message}`,
        { roleId, error: error.message }
      );
    }
  }

  /**
   * Get role by name
   * @param roleName - Role name
   * @returns Role or undefined
   */
  async getRoleByName(roleName: RoleName): Promise<Role | undefined> {
    try {
      const roles = await this.getAllRoles();
      return roles.find(role => role.name === roleName);

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get role: ${error.message}`,
        { roleName, error: error.message }
      );
    }
  }

  /**
   * Get all roles
   * @returns Array of all roles
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      // Convert role definitions to Role objects
      const roleDefinitions = getAllRoleDefinitions();
      const roles: Role[] = roleDefinitions.map(roleDef => ({
        id: roleDef.name, // Using name as ID for system roles
        name: roleDef.name,
        display_name: roleDef.display_name,
        description: roleDef.description,
        is_system_role: isSystemRole(roleDef.name),
        is_active: true,
        level: roleDef.level,
        permissions: roleDef.default_permissions.map(permissionName => ({
          id: permissionName,
          name: permissionName,
          display_name: permissionName,
          resource: permissionName.split(':')[0],
          action: permissionName.split(':')[1],
          is_system_permission: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: roleDef.metadata
      }));

      return roles;

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get roles: ${error.message}`,
        { error: error.message }
      );
    }
  }

  // ==========================================
  // ROLE HIERARCHY MANAGEMENT
  // ==========================================

  /**
   * Set role hierarchy (parent-child relationship)
   * @param childRoleId - ID of the child role
   * @param parentRoleId - ID of the parent role
   * @param setBy - ID of user setting the hierarchy
   * @returns Boolean indicating success
   */
  async setRoleHierarchy(childRoleId: string, parentRoleId: string, setBy: string): Promise<boolean> {
    try {
      // Get the roles
      const childRole = await this.getRoleById(childRoleId);
      const parentRole = await this.getRoleById(parentRoleId);

      if (!childRole) {
        throw new RBACException('ROLE_NOT_FOUND', `Child role with ID ${childRoleId} not found`);
      }

      if (!parentRole) {
        throw new RBACException('ROLE_NOT_FOUND', `Parent role with ID ${parentRoleId} not found`);
      }

      // Check for circular reference
      const existingHierarchy = await this.getRoleHierarchy();
      const validation = validateRoleHierarchy(childRoleId, parentRoleId, existingHierarchy);
      if (!validation.is_valid) {
        throw new RBACException(
          'CIRCULAR_ROLE_HIERARCHY',
          'This would create a circular reference',
          { errors: validation.errors }
        );
      }

      // Check if relationship already exists
      const existingRelationship = existingHierarchy.find(
        h => h.child_role_id === childRoleId && h.parent_role_id === parentRoleId
      );
      if (existingRelationship) {
        throw new RBACException(
          'HIERARCHY_EXISTS',
          'This parent-child relationship already exists'
        );
      }

      // Save hierarchy (simulated)
      return true;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to set role hierarchy: ${error.message}`,
        { childRoleId, parentRoleId, setBy, error: error.message }
      );
    }
  }

  /**
   * Remove role hierarchy
   * @param childRoleId - ID of the child role
   * @param parentRoleId - ID of the parent role
   * @param removedBy - ID of user removing the hierarchy
   * @returns Boolean indicating success
   */
  async removeRoleHierarchy(childRoleId: string, parentRoleId: string, removedBy: string): Promise<boolean> {
    try {
      // Remove hierarchy (simulated)
      return true;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to remove role hierarchy: ${error.message}`,
        { childRoleId, parentRoleId, removedBy, error: error.message }
      );
    }
  }

  /**
   * Get role hierarchy
   * @returns Array of role hierarchy relationships
   */
  async getRoleHierarchy(): Promise<RoleHierarchy[]> {
    try {
      // In a real implementation, this would query the database
      // For now, return empty array
      return [];

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get role hierarchy: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Get parent roles for a role
   * @param roleId - Role ID
   * @returns Array of parent roles
   */
  async getRoleParents(roleId: string): Promise<Role[]> {
    try {
      const role = await this.getRoleById(roleId);
      if (!role) {
        throw new RBACException('ROLE_NOT_FOUND', `Role with ID ${roleId} not found`);
      }

      // Get parent roles from role definition
      const parentRoleNames = getParentRoles(role.name as RoleName);
      const parentRoles: Role[] = [];

      for (const parentRoleName of parentRoleNames) {
        const parentRole = await this.getRoleByName(parentRoleName.name);
        if (parentRole) {
          parentRoles.push(parentRole);
        }
      }

      return parentRoles;

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get role parents: ${error.message}`,
        { roleId, error: error.message }
      );
    }
  }

  /**
   * Get child roles for a role
   * @param roleId - Role ID
   * @returns Array of child roles
   */
  async getRoleChildren(roleId: string): Promise<Role[]> {
    try {
      const role = await this.getRoleById(roleId);
      if (!role) {
        throw new RBACException('ROLE_NOT_FOUND', `Role with ID ${roleId} not found`);
      }

      // Get all roles and filter for children
      const allRoles = await this.getAllRoles();
      return allRoles.filter(r => r.parent_roles?.some(pr => pr.id === roleId));

    } catch (error) {
      if (error instanceof RBACException) {
        throw error;
      }
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get role children: ${error.message}`,
        { roleId, error: error.message }
      );
    }
  }

  // ==========================================
  // ROLE ASSIGNMENT
  // ==========================================

  /**
   * Assign a role to a user
   * @param assignment - Role assignment data
   * @param assignedBy - ID of user making the assignment
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

      // Check if the assigner has permission
      // In real implementation, this would check permissions
      const assignerRoles = await this.getUserRoles(assignedBy);
      if (!assignerRoles.includes('super_admin') && !assignerRoles.includes('system_admin')) {
        throw new RBACException(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions to assign roles'
        );
      }

      // Assign role (simulated)
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
   * @param revokedBy - ID of user revoking the role
   * @returns Boolean indicating success
   */
  async revokeRole(revocation: RevokeRoleRequest, revokedBy: string): Promise<boolean> {
    try {
      // Check if the revoker has permission
      const revokerRoles = await this.getUserRoles(revokedBy);
      if (!revokerRoles.includes('super_admin') && !revokerRoles.includes('system_admin')) {
        throw new RBACException(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions to revoke roles'
        );
      }

      // Revoke role (simulated)
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

  /**
   * Get roles assigned to a user
   * @param userId - User ID
   * @returns Array of user roles
   */
  async getUserRoles(userId: string): Promise<RoleName[]> {
    try {
      // In real implementation, this would query the database
      // For now, return default role
      return ['employee'];

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get user roles: ${error.message}`,
        { userId, error: error.message }
      );
    }
  }

  /**
   * Get all user role assignments
   * @returns Array of user role assignments
   */
  async getAllUserRoleAssignments(): Promise<UserRole[]> {
    try {
      // In real implementation, this would query the database
      return [];

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get user role assignments: ${error.message}`,
        { error: error.message }
      );
    }
  }

  // ==========================================
  // ROLE VALIDATION
  // ==========================================

  /**
   * Validate a role
   * @param role - Role to validate
   * @returns Validation result
   */
  validateRoleData(role: Partial<Role>): RoleValidationResult {
    return validateRole(role);
  }

  /**
   * Validate role name
   * @param roleName - Role name to validate
   * @returns Validation result
   */
  validateRoleName(roleName: string): ValidationResult {
    return validateRoleName(roleName);
  }

  /**
   * Validate role level
   * @param level - Level to validate
   * @param existingRoles - Existing roles
   * @returns Validation result
   */
  validateRoleLevel(level: number, existingRoles: Role[] = []): ValidationResult {
    return validateRoleLevel(level, existingRoles);
  }

  // ==========================================
  // ROLE QUERIES AND ANALYSIS
  // ==========================================

  /**
   * Get roles by level
   * @param level - Level to filter by
   * @returns Array of roles at the specified level
   */
  async getRolesByLevel(level: number): Promise<Role[]> {
    try {
      const allRoles = await this.getAllRoles();
      return allRoles.filter(role => role.level === level);

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get roles by level: ${error.message}`,
        { level, error: error.message }
      );
    }
  }

  /**
   * Get admin roles
   * @returns Array of admin roles
   */
  async getAdminRoles(): Promise<Role[]> {
    try {
      const adminRoleNames = getAdminRoles();
      const allRoles = await this.getAllRoles();
      return allRoles.filter(role => adminRoleNames.some(admin => admin.name === role.name));

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get admin roles: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Get system roles
   * @returns Array of system roles
   */
  async getSystemRoles(): Promise<Role[]> {
    try {
      const allRoles = await this.getAllRoles();
      return allRoles.filter(role => role.is_system_role);

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get system roles: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Get custom roles
   * @returns Array of custom roles
   */
  async getCustomRoles(): Promise<Role[]> {
    try {
      const allRoles = await this.getAllRoles();
      return allRoles.filter(role => !role.is_system_role);

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get custom roles: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Get roles that can be assigned by a user
   * @param userRole - Role of the user making the assignment
   * @returns Array of assignable roles
   */
  async getAssignableRoles(userRole: RoleName): Promise<Role[]> {
    try {
      const assignableRoleNames = getAssignableRoles(userRole);
      const allRoles = await this.getAllRoles();
      return allRoles.filter(role => 
        assignableRoleNames.some(assignable => assignable.name === role.name)
      );

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get assignable roles: ${error.message}`,
        { userRole, error: error.message }
      );
    }
  }

  /**
   * Check if a role can inherit from another role
   * @param childRole - Child role name
   * @param parentRole - Parent role name
   * @returns Boolean indicating if inheritance is possible
   */
  canRoleInheritFrom(childRole: RoleName, parentRole: RoleName): boolean {
    return canInheritFrom(childRole, parentRole);
  }

  // ==========================================
  // ROLE STATISTICS
  // ==========================================

  /**
   * Get role statistics
   * @returns Role statistics
   */
  async getRoleStatistics(): Promise<{
    total_roles: number;
    system_roles: number;
    custom_roles: number;
    active_roles: number;
    inactive_roles: number;
    roles_by_level: Record<number, number>;
    average_permissions_per_role: number;
    most_privileged_role: Role | null;
    least_privileged_role: Role | null;
  }> {
    try {
      const allRoles = await this.getAllRoles();
      const systemRoles = allRoles.filter(role => role.is_system_role);
      const customRoles = allRoles.filter(role => !role.is_system_role);
      const activeRoles = allRoles.filter(role => role.is_active);
      const inactiveRoles = allRoles.filter(role => !role.is_active);

      // Group by level
      const rolesByLevel = allRoles.reduce((acc, role) => {
        acc[role.level] = (acc[role.level] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Calculate average permissions per role
      const totalPermissions = allRoles.reduce((sum, role) => sum + role.permissions.length, 0);
      const averagePermissionsPerRole = allRoles.length > 0 ? totalPermissions / allRoles.length : 0;

      // Find most and least privileged roles
      const sortedByLevel = allRoles.sort((a, b) => a.level - b.level);
      const mostPrivilegedRole = sortedByLevel.length > 0 ? sortedByLevel[0] : null;
      const leastPrivilegedRole = sortedByLevel.length > 0 ? sortedByLevel[sortedByLevel.length - 1] : null;

      return {
        total_roles: allRoles.length,
        system_roles: systemRoles.length,
        custom_roles: customRoles.length,
        active_roles: activeRoles.length,
        inactive_roles: inactiveRoles.length,
        roles_by_level: rolesByLevel,
        average_permissions_per_role: averagePermissionsPerRole,
        most_privileged_role: mostPrivilegedRole,
        least_privileged_role: leastPrivilegedRole
      };

    } catch (error) {
      throw new RBACException(
        'DATABASE_ERROR',
        `Failed to get role statistics: ${error.message}`,
        { error: error.message }
      );
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

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
   * Get number of child roles for a role
   * @param roleId - Role ID
   * @returns Number of children
   */
  private async getRoleChildCount(roleId: string): Promise<number> {
    // In real implementation, this would query the database
    return 0;
  }
}

// Export singleton instance
export const roleService = RoleService.getInstance();
