// Permission-specific hooks
// Specialized hooks for permission-related functionality

import { useState, useCallback, useMemo } from 'react';
import { 
  PermissionName, 
  ResourceType, 
  PermissionAction,
  UsePermissionsOptions,
  UsePermissionsResult,
  Permission
} from '../types/rbac.types';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  getPermissionLevel,
  canPerformAction,
  parsePermissionName,
  generateResourcePermissions,
  getResourcePermissions,
  getResourceActions,
  countPermissions,
  groupPermissionsByResource
} from '../utils/permissions';
import { useRBAC } from './useRBAC';

// ==========================================
// MAIN PERMISSIONS HOOK
// ==========================================

/**
 * Hook for comprehensive permission management
 * @param options - Configuration options
 * @returns Permission management interface
 */
export function usePermissions(options: UsePermissionsOptions = {}): UsePermissionsResult {
  const { cache = true, refresh = false, include_overrides = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rbac = useRBAC();

  // Permission checking functions
  const hasPermission = useCallback((permission: PermissionName): boolean => {
    return hasPermission(rbac.permissions, permission);
  }, [rbac.permissions]);

  const hasAnyPermission = useCallback((permissions: PermissionName[]): boolean => {
    return hasAnyPermission(rbac.permissions, permissions);
  }, [rbac.permissions]);

  const hasAllPermissions = useCallback((permissions: PermissionName[]): boolean => {
    return hasAllPermissions(rbac.permissions, permissions);
  }, [rbac.permissions]);

  const getPermissionLevel = useCallback((resource: ResourceType): 'none' | 'read' | 'write' | 'manage' => {
    return getPermissionLevel(rbac.permissions, resource);
  }, [rbac.permissions]);

  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await rbac.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh permissions');
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
// RESOURCE-SPECIFIC HOOKS
// ==========================================

/**
 * Hook for managing permissions for a specific resource
 * @param resource - Resource type
 * @returns Resource-specific permission interface
 */
export function useResourcePermissions(resource: ResourceType) {
  const { permissions, hasPermission, getPermissionLevel } = usePermissions();

  // Get all permissions for this resource
  const resourcePermissions = useMemo(() => {
    return getResourcePermissions(permissions, resource);
  }, [permissions, resource]);

  // Get all actions available for this resource
  const availableActions = useMemo(() => {
    return getResourceActions(permissions, resource);
  }, [permissions, resource]);

  // Check specific action
  const canRead = hasPermission(`${resource}:read` as PermissionName);
  const canWrite = hasPermission(`${resource}:write` as PermissionName);
  const canDelete = hasPermission(`${resource}:delete` as PermissionName);
  const canManage = hasPermission(`${resource}:manage` as PermissionName);

  // Get permission level
  const permissionLevel = getPermissionLevel(resource);

  // Check if user can perform a custom action
  const canPerform = useCallback((action: PermissionAction): boolean => {
    return canPerformAction(permissions, resource, action);
  }, [permissions, resource]);

  return {
    resourcePermissions,
    availableActions,
    canRead,
    canWrite,
    canDelete,
    canManage,
    permissionLevel,
    canPerform,
    hasPermission: (action: PermissionAction) => canPerform(action)
  };
}

/**
 * Hook for managing user permissions
 * @param userId - User ID to check permissions for
 * @returns User permission interface
 */
export function useUserPermissions(userId?: string) {
  const [userPermissions, setUserPermissions] = useState<PermissionName[]>([]);
  const [userRoles, setUserRoles] = useState<RoleName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check permission for a specific user
  const checkUserPermission = useCallback(async (permission: PermissionName): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      // This would use your RBAC service to check permissions for the specific user
      // const hasPerm = await rbacService.hasPermission(userId, permission);
      // return hasPerm;
      
      // For now, return the current user's permissions
      const rbac = useRBAC();
      return rbac.hasPermission(permission);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Get all permissions for a user
  const getUserAllPermissions = useCallback(async (): Promise<PermissionName[]> => {
    if (!userId) return [];

    setIsLoading(true);
    setError(null);

    try {
      // This would use your RBAC service
      // return await rbacService.getUserPermissions(userId);
      
      // For now, return current user's permissions
      const rbac = useRBAC();
      return rbac.permissions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get permissions');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    userPermissions,
    userRoles,
    isLoading,
    error,
    checkUserPermission,
    getUserAllPermissions
  };
}

// ==========================================
// PERMISSION ANALYSIS HOOKS
// ==========================================

/**
 * Hook for analyzing user's permission structure
 * @returns Permission analysis interface
 */
export function usePermissionAnalysis() {
  const { permissions } = usePermissions();

  // Group permissions by resource
  const permissionsByResource = useMemo(() => {
    return groupPermissionsByResource(permissions);
  }, [permissions]);

  // Count total permissions
  const totalPermissions = useMemo(() => {
    return countPermissions(permissions);
  }, [permissions]);

  // Get resources user has access to
  const accessibleResources = useMemo(() => {
    return Object.keys(permissionsByResource) as ResourceType[];
  }, [permissionsByResource]);

  // Get resources by access level
  const resourcesByLevel = useMemo(() => {
    const result = {
      none: [] as ResourceType[],
      read: [] as ResourceType[],
      write: [] as ResourceType[],
      manage: [] as ResourceType[]
    };

    accessibleResources.forEach(resource => {
      const level = getPermissionLevel(permissions, resource);
      result[level].push(resource);
    });

    return result;
  }, [permissions, accessibleResources]);

  // Get most privileged resources
  const mostPrivilegedResources = useMemo(() => {
    return resourcesByLevel.manage;
  }, [resourcesByLevel]);

  // Get least privileged resources
  const leastPrivilegedResources = useMemo(() => {
    return resourcesByLevel.none;
  }, [resourcesByLevel]);

  // Check if user has admin-like access
  const hasAdminAccess = useMemo(() => {
    const adminPermissions = ['system:manage', 'users:manage', 'audit:read'];
    return hasAllPermissions(permissions, adminPermissions);
  }, [permissions]);

  return {
    permissionsByResource,
    totalPermissions,
    accessibleResources,
    resourcesByLevel,
    mostPrivilegedResources,
    leastPrivilegedResources,
    hasAdminAccess
  };
}

/**
 * Hook for permission comparison between users
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns Permission comparison interface
 */
export function usePermissionComparison(userId1?: string, userId2?: string) {
  const [comparison, setComparison] = useState<{
    user1Permissions: PermissionName[];
    user2Permissions: PermissionName[];
    sharedPermissions: PermissionName[];
    user1Only: PermissionName[];
    user2Only: PermissionName[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comparePermissions = useCallback(async () => {
    if (!userId1 || !userId2) return;

    setIsLoading(true);
    setError(null);

    try {
      // This would compare permissions between two users
      // For now, return mock comparison
      const mockComparison = {
        user1Permissions: [] as PermissionName[],
        user2Permissions: [] as PermissionName[],
        sharedPermissions: [] as PermissionName[],
        user1Only: [] as PermissionName[],
        user2Only: [] as PermissionName[]
      };

      setComparison(mockComparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare permissions');
    } finally {
      setIsLoading(false);
    }
  }, [userId1, userId2]);

  return {
    comparison,
    isLoading,
    error,
    comparePermissions
  };
}

// ==========================================
// BULK PERMISSION HOOKS
// ==========================================

/**
 * Hook for managing bulk permission operations
 * @returns Bulk permission management interface
 */
export function useBulkPermissions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    successful: PermissionName[];
    failed: { permission: PermissionName; error: string }[];
  }>({ successful: [], failed: [] });

  // Check multiple permissions at once
  const checkBulkPermissions = useCallback(async (permissions: PermissionName[]): Promise<{
    has: PermissionName[];
    missing: PermissionName[];
  }> => {
    setIsLoading(true);
    setError(null);

    try {
      const rbac = useRBAC();
      const has: PermissionName[] = [];
      const missing: PermissionName[] = [];

      permissions.forEach(permission => {
        if (rbac.hasPermission(permission)) {
          has.push(permission);
        } else {
          missing.push(permission);
        }
      });

      return { has, missing };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check bulk permissions');
      return { has: [], missing: permissions };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate permission suggestions
  const generatePermissionSuggestions = useCallback((
    resource: ResourceType, 
    context: 'minimal' | 'standard' | 'full' = 'standard'
  ): PermissionName[] => {
    const suggestions: PermissionName[] = [];

    switch (context) {
      case 'minimal':
        suggestions.push(`${resource}:read`);
        break;
      case 'standard':
        suggestions.push(`${resource}:read`, `${resource}:write`);
        break;
      case 'full':
        suggestions.push(
          `${resource}:read`, 
          `${resource}:write`, 
          `${resource}:delete`, 
          `${resource}:manage`
        );
        break;
    }

    return suggestions;
  }, []);

  return {
    isLoading,
    error,
    results,
    checkBulkPermissions,
    generatePermissionSuggestions
  };
}

// ==========================================
// CONDITIONAL PERMISSION HOOKS
// ==========================================

/**
 * Hook for conditional permission checks
 * @returns Conditional permission utilities
 */
export function useConditionalPermissions() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Check if user can perform action with fallback
  const canWithFallback = useCallback((
    primaryPermission: PermissionName, 
    fallbackPermissions: PermissionName[] = []
  ): boolean => {
    if (hasPermission(primaryPermission)) {
      return true;
    }

    if (fallbackPermissions.length > 0) {
      return hasAnyPermission(fallbackPermissions);
    }

    return false;
  }, [hasPermission, hasAnyPermission]);

  // Check resource access with level
  const canAccessResource = useCallback((
    resource: ResourceType, 
    requiredLevel: 'read' | 'write' | 'manage' = 'read'
  ): boolean => {
    const level = getPermissionLevel([], resource); // This would need the actual permissions
    
    const levelHierarchy = { none: 0, read: 1, write: 2, manage: 3 };
    return levelHierarchy[level] >= levelHierarchy[requiredLevel];
  }, []);

  return {
    canWithFallback,
    canAccessResource
  };
}

// ==========================================
// DYNAMIC PERMISSION HOOKS
// ==========================================

/**
 * Hook for dynamic permission management
 * @returns Dynamic permission interface
 */
export function useDynamicPermissions() {
  const [dynamicPermissions, setDynamicPermissions] = useState<Set<PermissionName>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { hasPermission: baseHasPermission } = usePermissions();

  // Add dynamic permission
  const addPermission = useCallback((permission: PermissionName) => {
    setDynamicPermissions(prev => new Set([...prev, permission]));
  }, []);

  // Remove dynamic permission
  const removePermission = useCallback((permission: PermissionName) => {
    setDynamicPermissions(prev => {
      const newSet = new Set(prev);
      newSet.delete(permission);
      return newSet;
    });
  }, []);

  // Clear all dynamic permissions
  const clearPermissions = useCallback(() => {
    setDynamicPermissions(new Set());
  }, []);

  // Check permission including dynamic permissions
  const hasDynamicPermission = useCallback((permission: PermissionName): boolean => {
    return baseHasPermission(permission) || dynamicPermissions.has(permission);
  }, [baseHasPermission, dynamicPermissions]);

  return {
    dynamicPermissions: Array.from(dynamicPermissions),
    isLoading,
    addPermission,
    removePermission,
    clearPermissions,
    hasPermission: hasDynamicPermission
  };
}

// ==========================================
// EXPORT ALL PERMISSION HOOKS
// ==========================================

export {
  // Main hooks
  usePermissions,
  useResourcePermissions,
  useUserPermissions,
  
  // Analysis hooks
  usePermissionAnalysis,
  usePermissionComparison,
  
  // Bulk operations
  useBulkPermissions,
  
  // Conditional and dynamic
  useConditionalPermissions,
  useDynamicPermissions
};
