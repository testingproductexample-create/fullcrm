// Role-specific hooks
// Specialized hooks for role-related functionality

import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Role, 
  RoleName, 
  CreateRoleRequest, 
  UpdateRoleRequest,
  AssignRoleRequest,
  RevokeRoleRequest,
  UseRoleManagementOptions,
  UseRoleManagementResult,
  RoleDefinition
} from '../types/rbac.types';
import { 
  getRoleDefinition, 
  getAllRoleDefinitions, 
  getRolesByLevel,
  getRolesSortedByLevel,
  getAssignableRoles,
  getParentRoles,
  getMaximumUserLevel,
  isSystemRole,
  getAdminRoles
} from '../utils/roles';
import { 
  validateRoleName,
  validateRoleLevel
} from '../utils/validation';
import { useRBAC } from './useRBAC';
import { roleService } from '../services/role.service';

// ==========================================
// MAIN ROLES HOOK
// ==========================================

/**
 * Hook for comprehensive role management
 * @param options - Configuration options
 * @returns Role management interface
 */
export function useRoles(options: UseRoleManagementOptions = {}): UseRoleManagementResult {
  const { include_hierarchy = false, include_permissions = false } = options;
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rbac = useRBAC();

  // Load all roles
  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rolesData = await roleService.getAllRoles();
      setRoles(rolesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create role
  const createRole = useCallback(async (roleData: CreateRoleRequest): Promise<Role> => {
    setIsLoading(true);
    setError(null);

    try {
      const newRole = await roleService.createRole(roleData, rbac.user?.id || 'system');
      
      // Reload roles after creation
      await loadRoles();
      
      return newRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [rbac.user?.id, loadRoles]);

  // Update role
  const updateRole = useCallback(async (id: string, updates: UpdateRoleRequest): Promise<Role> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedRole = await roleService.updateRole(id, updates, rbac.user?.id || 'system');
      
      // Reload roles after update
      await loadRoles();
      
      return updatedRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [rbac.user?.id, loadRoles]);

  // Delete role
  const deleteRole = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await roleService.deleteRole(id, rbac.user?.id || 'system');
      
      // Reload roles after deletion
      await loadRoles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [rbac.user?.id, loadRoles]);

  // Assign role
  const assignRole = useCallback(async (assignment: AssignRoleRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await roleService.assignRole(assignment, rbac.user?.id || 'system');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [rbac.user?.id]);

  // Revoke role
  const revokeRole = useCallback(async (revocation: RevokeRoleRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await roleService.revokeRole(revocation, rbac.user?.id || 'system');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke role';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [rbac.user?.id]);

  // Load roles on mount
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return {
    roles,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    revokeRole,
    isLoading,
    error
  };
}

// ==========================================
// USER ROLES HOOK
// ==========================================

/**
 * Hook for managing user-specific roles
 * @param userId - User ID to manage roles for
 * @returns User role management interface
 */
export function useUserRoles(userId?: string) {
  const [userRoles, setUserRoles] = useState<RoleName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rbac = useRBAC();

  // Load user roles
  const loadUserRoles = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const roles = await roleService.getUserRoles(userId);
      setUserRoles(roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user roles');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Check if user has role
  const hasRole = useCallback((roleName: RoleName): boolean => {
    return userRoles.includes(roleName);
  }, [userRoles]);

  // Check if user has any of the roles
  const hasAnyRole = useCallback((roleNames: RoleName[]): boolean => {
    return roleNames.some(role => userRoles.includes(role));
  }, [userRoles]);

  // Check if user has all of the roles
  const hasAllRoles = useCallback((roleNames: RoleName[]): boolean => {
    return roleNames.every(role => userRoles.includes(role));
  }, [userRoles]);

  // Assign role to user
  const assignUserRole = useCallback(async (roleName: RoleName): Promise<void> => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const role = await roleService.getRoleByName(roleName);
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }

      await roleService.assignRole({
        user_id: userId,
        role_id: role.id
      }, rbac.user?.id || 'system');

      // Reload user roles
      await loadUserRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, rbac.user?.id, loadUserRoles]);

  // Revoke role from user
  const revokeUserRole = useCallback(async (roleName: RoleName): Promise<void> => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const role = await roleService.getRoleByName(roleName);
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }

      await roleService.revokeRole({
        user_id: userId,
        role_id: role.id
      }, rbac.user?.id || 'system');

      // Reload user roles
      await loadUserRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke role');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, rbac.user?.id, loadUserRoles]);

  // Load user roles when userId changes
  useEffect(() => {
    loadUserRoles();
  }, [loadUserRoles]);

  return {
    userRoles,
    isLoading,
    error,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    assignRole: assignUserRole,
    revokeRole: revokeUserRole,
    refresh: loadUserRoles
  };
}

// ==========================================
// ROLE ANALYSIS HOOKS
// ==========================================

/**
 * Hook for analyzing role structure
 * @returns Role analysis interface
 */
export function useRoleAnalysis() {
  const { roles } = useRoles();

  // Get roles by level
  const rolesByLevel = useMemo(() => {
    return getRolesByLevel(0).reduce((acc, role) => {
      if (!acc[role.level]) {
        acc[role.level] = [];
      }
      acc[role.level].push(role);
      return acc;
    }, {} as Record<number, Role[]>);
  }, [roles]);

  // Get system roles
  const systemRoles = useMemo(() => {
    return roles.filter(role => role.is_system_role);
  }, [roles]);

  // Get custom roles
  const customRoles = useMemo(() => {
    return roles.filter(role => !role.is_system_role);
  }, [roles]);

  // Get admin roles
  const adminRoles = useMemo(() => {
    return roles.filter(role => 
      role.name === 'super_admin' || role.name === 'system_admin'
    );
  }, [roles]);

  // Get most privileged role
  const mostPrivilegedRole = useMemo(() => {
    return roles.reduce((prev, current) => 
      (prev.level < current.level) ? prev : current
    );
  }, [roles]);

  // Get least privileged role
  const leastPrivilegedRole = useMemo(() => {
    return roles.reduce((prev, current) => 
      (prev.level > current.level) ? prev : current
    );
  }, [roles]);

  // Get role statistics
  const roleStats = useMemo(() => {
    return {
      total: roles.length,
      system: systemRoles.length,
      custom: customRoles.length,
      admin: adminRoles.length,
      byLevel: Object.keys(rolesByLevel).length
    };
  }, [roles, systemRoles, customRoles, adminRoles, rolesByLevel]);

  return {
    rolesByLevel,
    systemRoles,
    customRoles,
    adminRoles,
    mostPrivilegedRole,
    leastPrivilegedRole,
    roleStats
  };
}

/**
 * Hook for role comparison
 * @param roleName1 - First role name
 * @param roleName2 - Second role name
 * @returns Role comparison interface
 */
export function useRoleComparison(roleName1?: RoleName, roleName2?: RoleName) {
  const [comparison, setComparison] = useState<{
    role1: Role | undefined;
    role2: Role | undefined;
    sharedPermissions: string[];
    role1OnlyPermissions: string[];
    role2OnlyPermissions: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compareRoles = useCallback(async () => {
    if (!roleName1 || !roleName2) return;

    setIsLoading(true);
    setError(null);

    try {
      const role1 = getRoleDefinition(roleName1);
      const role2 = getRoleDefinition(roleName2);

      if (!role1 || !role2) {
        throw new Error('One or both roles not found');
      }

      // Compare permissions
      const role1Permissions = new Set(role1.default_permissions);
      const role2Permissions = new Set(role2.default_permissions);

      const sharedPermissions = Array.from(role1Permissions).filter(p => 
        role2Permissions.has(p)
      );

      const role1OnlyPermissions = Array.from(role1Permissions).filter(p => 
        !role2Permissions.has(p)
      );

      const role2OnlyPermissions = Array.from(role2Permissions).filter(p => 
        !role1Permissions.has(p)
      );

      setComparison({
        role1: role1 as Role,
        role2: role2 as Role,
        sharedPermissions,
        role1OnlyPermissions,
        role2OnlyPermissions
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare roles');
    } finally {
      setIsLoading(false);
    }
  }, [roleName1, roleName2]);

  return {
    comparison,
    isLoading,
    error,
    compareRoles
  };
}

// ==========================================
// ROLE VALIDATION HOOKS
// ==========================================

/**
 * Hook for role validation utilities
 * @returns Role validation interface
 */
export function useRoleValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate role name
  const validateRoleName = useCallback((roleName: string): boolean => {
    const validation = validateRoleName(roleName);
    return validation.is_valid;
  }, []);

  // Validate role level
  const validateRoleLevel = useCallback((level: number): boolean => {
    const validation = validateRoleLevel(level);
    return validation.is_valid;
  }, []);

  // Validate role creation data
  const validateRoleData = useCallback((roleData: CreateRoleRequest): {
    isValid: boolean;
    errors: string[];
  } => {
    setIsValidating(true);
    setValidationErrors([]);

    const errors: string[] = [];

    // Validate role name
    if (!roleData.name) {
      errors.push('Role name is required');
    } else if (!validateRoleName(roleData.name)) {
      errors.push('Invalid role name format');
    }

    // Validate display name
    if (!roleData.display_name) {
      errors.push('Display name is required');
    }

    // Validate level
    if (roleData.level !== undefined && !validateRoleLevel(roleData.level)) {
      errors.push('Invalid role level');
    }

    setValidationErrors(errors);
    setIsValidating(false);

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [validateRoleName, validateRoleLevel]);

  return {
    isValidating,
    validationErrors,
    validateRoleName,
    validateRoleLevel,
    validateRoleData
  };
}

// ==========================================
// ROLE PERMISSION HOOKS
// ==========================================

/**
 * Hook for managing role permissions
 * @param roleId - Role ID to manage permissions for
 * @returns Role permission management interface
 */
export function useRolePermissions(roleId?: string) {
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load role permissions
  const loadRolePermissions = useCallback(async () => {
    if (!roleId) return;

    setIsLoading(true);
    setError(null);

    try {
      const role = await roleService.getRoleById(roleId);
      if (role) {
        setRolePermissions(role.permissions.map(p => p.name));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role permissions');
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);

  // Check if role has permission
  const roleHasPermission = useCallback((permission: string): boolean => {
    return rolePermissions.includes(permission);
  }, [rolePermissions]);

  // Get permissions by resource
  const getPermissionsByResource = useCallback((resource: string) => {
    return rolePermissions.filter(p => p.startsWith(`${resource}:`));
  }, [rolePermissions]);

  return {
    rolePermissions,
    isLoading,
    error,
    roleHasPermission,
    getPermissionsByResource,
    refresh: loadRolePermissions
  };
}

// ==========================================
// ROLE SELECTION HOOKS
// ==========================================

/**
 * Hook for role selection and management
 * @returns Role selection interface
 */
export function useRoleSelection() {
  const [selectedRoles, setSelectedRoles] = useState<RoleName[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  // Toggle role selection
  const toggleRole = useCallback((roleName: RoleName) => {
    setSelectedRoles(prev => 
      prev.includes(roleName) 
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    );
  }, []);

  // Select role
  const selectRole = useCallback((roleName: RoleName) => {
    setSelectedRoles(prev => 
      prev.includes(roleName) ? prev : [...prev, roleName]
    );
  }, []);

  // Deselect role
  const deselectRole = useCallback((roleName: RoleName) => {
    setSelectedRoles(prev => prev.filter(r => r !== roleName));
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedRoles([]);
  }, []);

  // Select all
  const selectAll = useCallback((availableRoles: RoleName[]) => {
    setSelectedRoles([...availableRoles]);
  }, []);

  // Get role by level
  const getRolesByLevel = useCallback((level: number): RoleName[] => {
    return getRolesByLevel(level).map(r => r.name);
  }, []);

  return {
    selectedRoles,
    isSelecting,
    toggleRole,
    selectRole,
    deselectRole,
    clearSelection,
    selectAll,
    getRolesByLevel,
    setIsSelecting
  };
}

// ==========================================
// CONDITIONAL ROLE HOOKS
// ==========================================

/**
 * Hook for conditional role checks
 * @returns Conditional role utilities
 */
export function useConditionalRoles() {
  const { roles } = useRBAC();

  // Check if user has role
  const hasRole = useCallback((roleName: RoleName): boolean => {
    return roles.includes(roleName);
  }, [roles]);

  // Check if user has any of the roles
  const hasAnyRole = useCallback((roleNames: RoleName[]): boolean => {
    return roleNames.some(role => roles.includes(role));
  }, [roles]);

  // Check if user has all of the roles
  const hasAllRoles = useCallback((roleNames: RoleName[]): boolean => {
    return roleNames.every(role => roles.includes(role));
  }, [roles]);

  // Check if user is admin
  const isAdmin = useCallback((): boolean => {
    return hasAnyRole(['super_admin', 'system_admin']);
  }, [hasAnyRole]);

  // Check if user can manage roles
  const canManageRoles = useCallback((): boolean => {
    return isAdmin() || hasAnyRole(['operations_manager', 'hr_manager']);
  }, [isAdmin, hasAnyRole]);

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    canManageRoles
  };
}

// ==========================================
// EXPORT ALL ROLE HOOKS
// ==========================================

export {
  // Main hooks
  useRoles,
  useUserRoles,
  
  // Analysis hooks
  useRoleAnalysis,
  useRoleComparison,
  
  // Validation hooks
  useRoleValidation,
  
  // Permission management
  useRolePermissions,
  
  // Selection and conditional
  useRoleSelection,
  useConditionalRoles
};
