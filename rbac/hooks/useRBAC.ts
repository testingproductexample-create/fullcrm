// useRBAC Hook
// Main React hook for role-based access control

import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { 
  RBACUser, 
  RoleName, 
  PermissionName, 
  ResourceType, 
  UseRBACResult,
  UsePermissionsOptions,
  UseRoleManagementOptions,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
  RevokeRoleRequest,
  RBACException
} from '../types/rbac.types';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  getPermissionLevel,
  isAdmin,
  canManageUsers,
  canViewAuditLogs
} from '../utils/permissions';
import { rbacService } from '../services/rbac.service';
import { roleService } from '../services/role.service';

// ==========================================
// RBAC CONTEXT
// ==========================================

interface RBACContextType {
  user: RBACUser | null;
  roles: RoleName[];
  permissions: PermissionName[];
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: PermissionName) => boolean;
  hasAnyPermission: (permissions: PermissionName[]) => boolean;
  hasAllPermissions: (permissions: PermissionName[]) => boolean;
  getPermissionLevel: (resource: ResourceType) => 'none' | 'read' | 'write' | 'manage';
  isAdmin: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function RBACProvider({ 
  children, 
  userId, 
  autoRefresh = true, 
  refreshInterval = 5 * 60 * 1000 // 5 minutes
}: RBACProviderProps) {
  const [user, setUser] = useState<RBACUser | null>(null);
  const [roles, setRoles] = useState<RoleName[]>([]);
  const [permissions, setPermissions] = useState<PermissionName[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data
  const loadUserData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get user roles and permissions
      const [userRoles, userPermissions] = await Promise.all([
        rbacService.getUserRoles(userId),
        rbacService.getUserPermissions(userId)
      ]);

      // Get user details (simplified for demo)
      const userData: RBACUser = {
        id: userId,
        email: 'user@example.com', // This would come from your user service
        display_name: 'User',
        roles: userRoles.map(roleName => ({
          id: roleName,
          name: roleName,
          display_name: roleName,
          description: `${roleName} role`,
          is_system_role: true,
          is_active: true,
          level: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })),
        permissions: [], // Would be populated from permissions service
        is_active: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setUser(userData);
      setRoles(userRoles);
      setPermissions(userPermissions);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
      setError(errorMessage);
      console.error('Failed to load RBAC data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Check if user has a specific permission
  const checkPermission = useCallback((permission: PermissionName): boolean => {
    return hasPermission(permissions, permission);
  }, [permissions]);

  // Check if user has any of the specified permissions
  const checkAnyPermission = useCallback((requiredPermissions: PermissionName[]): boolean => {
    return hasAnyPermission(permissions, requiredPermissions);
  }, [permissions]);

  // Check if user has all of the specified permissions
  const checkAllPermissions = useCallback((requiredPermissions: PermissionName[]): boolean => {
    return hasAllPermissions(permissions, requiredPermissions);
  }, [permissions]);

  // Get permission level for a resource
  const getUserPermissionLevel = useCallback((resource: ResourceType): 'none' | 'read' | 'write' | 'manage' => {
    return getPermissionLevel(permissions, resource);
  }, [permissions]);

  // Check if user is admin
  const userIsAdmin = useCallback((): boolean => {
    return isAdmin(roles);
  }, [roles]);

  // Check if user can manage users
  const userCanManageUsers = useCallback((): boolean => {
    return canManageUsers(permissions);
  }, [permissions]);

  // Check if user can view audit logs
  const userCanViewAuditLogs = useCallback((): boolean => {
    return canViewAuditLogs(permissions);
  }, [permissions]);

  // Refresh user data
  const refresh = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setError(null);
    // In a real app, you'd also clear the auth token, etc.
  }, []);

  // Load data on mount and when userId changes
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && userId) {
      const interval = setInterval(loadUserData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, userId, refreshInterval, loadUserData]);

  const value: RBACContextType = {
    user,
    roles,
    permissions,
    isLoading,
    error,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    getPermissionLevel: getUserPermissionLevel,
    isAdmin: userIsAdmin(),
    canManageUsers: userCanManageUsers(),
    canViewAuditLogs: userCanViewAuditLogs(),
    refresh,
    logout
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

// ==========================================
// MAIN HOOK
// ==========================================

/**
 * Main hook for accessing RBAC functionality
 * @param options - Options for the hook
 * @returns RBAC functionality
 */
export function useRBAC(options: {
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}): UseRBACResult {
  const context = useContext(RBACContext);
  
  if (context) {
    // If used within RBACProvider, return context values
    return {
      permissions: context.permissions,
      roles: context.roles,
      hasPermission: context.hasPermission,
      hasAnyPermission: context.hasAnyPermission,
      hasAllPermissions: context.hasAllPermissions,
      getPermissionLevel: context.getPermissionLevel,
      isLoading: context.isLoading,
      error: context.error,
      refresh: context.refresh,
      user: context.user,
      isAdmin: context.isAdmin,
      canManageUsers: context.canManageUsers,
      canViewAuditLogs: context.canViewAuditLogs,
      roleManagement: useRoleManagement()
    };
  }

  // If not within provider, return empty/default values
  return {
    permissions: [],
    roles: [],
    hasPermission: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
    getPermissionLevel: () => 'none',
    isLoading: false,
    error: 'RBACProvider not found',
    refresh: async () => {},
    user: null,
    isAdmin: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    roleManagement: useRoleManagement()
  };
}

// ==========================================
// PERMISSIONS HOOK
// ==========================================

/**
 * Hook for permission management
 * @param options - Options for permissions
 * @returns Permission management functionality
 */
export function usePermissions(options: UsePermissionsOptions = {}): UsePermissionsResult {
  const { cache = true, refresh = false, include_overrides = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rbac = useRBAC();

  const hasPermission = useCallback((permission: PermissionName): boolean => {
    return rbac.hasPermission(permission);
  }, [rbac]);

  const hasAnyPermission = useCallback((permissions: PermissionName[]): boolean => {
    return rbac.hasAnyPermission(permissions);
  }, [rbac]);

  const hasAllPermissions = useCallback((permissions: PermissionName[]): boolean => {
    return rbac.hasAllPermissions(permissions);
  }, [rbac]);

  const getPermissionLevel = useCallback((resource: ResourceType): 'none' | 'read' | 'write' | 'manage' => {
    return rbac.getPermissionLevel(resource);
  }, [rbac]);

  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (rbac.user) {
        await rbac.refresh();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh permissions';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [rbac]);

  return {
    permissions: rbac.permissions,
    roles: rbac.roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionLevel,
    isLoading,
    error,
    refresh: refreshPermissions
  };
}

// ==========================================
// ROLE MANAGEMENT HOOK
// ==========================================

/**
 * Hook for role management
 * @param options - Options for role management
 * @returns Role management functionality
 */
export function useRoleManagement(options: UseRoleManagementOptions = {}): UseRoleManagementResult {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load roles';
      setError(errorMessage);
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
// CONDITIONAL RENDERING HOOKS
// ==========================================

/**
 * Hook for conditional rendering based on permissions
 * @param permission - Permission required
 * @returns Boolean indicating if user has permission
 */
export function useCan(permission: PermissionName): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

/**
 * Hook for conditional rendering based on role
 * @param role - Role required
 * @returns Boolean indicating if user has role
 */
export function useIsRole(role: RoleName): boolean {
  const { roles } = useRBAC();
  return roles.includes(role);
}

/**
 * Hook for conditional rendering based on admin status
 * @returns Boolean indicating if user is admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useRBAC();
  return isAdmin;
}

/**
 * Hook for conditional rendering based on resource access
 * @param resource - Resource type
 * @param level - Minimum access level required
 * @returns Boolean indicating if user has required access
 */
export function useCanAccessResource(
  resource: ResourceType, 
  level: 'read' | 'write' | 'manage' = 'read'
): boolean {
  const { getPermissionLevel } = usePermissions();
  const userLevel = getPermissionLevel(resource);
  
  const levelHierarchy = { none: 0, read: 1, write: 2, manage: 3 };
  return levelHierarchy[userLevel] >= levelHierarchy[level];
}

// ==========================================
// ERROR HANDLING HOOK
// ==========================================

/**
 * Hook for handling RBAC errors
 * @returns Error handling utilities
 */
export function useRBACError() {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: any) => {
    if (error instanceof RBACException) {
      setError(error.message);
    } else if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError
  };
}

// ==========================================
// EXPORT ALL HOOKS
// ==========================================

export {
  // Main hooks
  useRBAC,
  usePermissions,
  useRoleManagement,
  
  // Conditional rendering hooks
  useCan,
  useIsRole,
  useIsAdmin,
  useCanAccessResource,
  
  // Error handling
  useRBACError,
  
  // Context
  RBACContext,
  RBACProvider
};
