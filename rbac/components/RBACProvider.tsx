import React, { createContext, useContext, useEffect, useState, useReducer, useCallback, ReactNode } from 'react';
import { User, Role, Permission, RBACContext, RBACState, UserRole, RolePermission } from '../types';
import { RBACService } from '../services/rbac.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';

// Action types for reducer
type RBACAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ROLES'; payload: Role[] }
  | { type: 'SET_PERMISSIONS'; payload: Permission[] }
  | { type: 'SET_USER_ROLES'; payload: Record<string, Role[]> }
  | { type: 'SET_ROLE_PERMISSIONS'; payload: Record<string, Permission[]> }
  | { type: 'SET_USER_PERMISSIONS'; payload: Record<string, Permission[]> }
  | { type: 'UPDATE_USER_ROLES'; payload: { userId: string; roles: Role[] } }
  | { type: 'UPDATE_ROLE_PERMISSIONS'; payload: { roleId: string; permissions: Permission[] } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'SET_AUDIT_LOGS'; payload: any[] }
  | { type: 'REFRESH_CACHE' };

// Initial state
const initialState: RBACState = {
  user: null,
  roles: [],
  permissions: [],
  userRoles: {},
  rolePermissions: {},
  userPermissions: {},
  auditLogs: [],
  loading: true,
  error: null,
  permissionCache: new Map(),
  roleCache: new Map(),
  lastRefresh: null,
};

// Reducer
const rbacReducer = (state: RBACState, action: RBACAction): RBACState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_ROLES':
      return { ...state, roles: action.payload };
    
    case 'SET_PERMISSIONS':
      return { ...state, permissions: action.payload };
    
    case 'SET_USER_ROLES':
      return { ...state, userRoles: action.payload };
    
    case 'SET_ROLE_PERMISSIONS':
      return { ...state, rolePermissions: action.payload };
    
    case 'SET_USER_PERMISSIONS':
      return { ...state, userPermissions: action.payload };
    
    case 'UPDATE_USER_ROLES':
      return {
        ...state,
        userRoles: {
          ...state.userRoles,
          [action.payload.userId]: action.payload.roles,
        },
      };
    
    case 'UPDATE_ROLE_PERMISSIONS':
      return {
        ...state,
        rolePermissions: {
          ...state.rolePermissions,
          [action.payload.roleId]: action.payload.permissions,
        },
      };
    
    case 'SET_AUDIT_LOGS':
      return { ...state, auditLogs: action.payload };
    
    case 'CLEAR_CACHE':
      return {
        ...state,
        permissionCache: new Map(),
        roleCache: new Map(),
        lastRefresh: null,
      };
    
    case 'REFRESH_CACHE':
      return {
        ...state,
        lastRefresh: new Date(),
      };
    
    default:
      return state;
  }
};

// Context
const RBACContext = createContext<RBACContext | null>(null);

// Provider component
interface RBACProviderProps {
  children: ReactNode;
  user?: User | null;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAuditLogging?: boolean;
  onError?: (error: Error) => void;
  onPermissionChange?: (userId: string, permissions: Permission[]) => void;
  onRoleChange?: (userId: string, roles: Role[]) => void;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({
  children,
  user: initialUser,
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
  enableAuditLogging = true,
  onError,
  onPermissionChange,
  onRoleChange,
}) => {
  const [state, dispatch] = useReducer(rbacReducer, {
    ...initialState,
    user: initialUser,
  });

  // Services
  const [rbacService] = useState(() => new RBACService());
  const [permissionService] = useState(() => new PermissionService());
  const [roleService] = useState(() => new RoleService());

  // Initialize RBAC system
  const initialize = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Load all data in parallel
      const [roles, permissions, userRoles, rolePermissions] = await Promise.all([
        roleService.getAllRoles(),
        permissionService.getAllPermissions(),
        rbacService.getAllUserRoles(),
        rbacService.getAllRolePermissions(),
      ]);

      dispatch({ type: 'SET_ROLES', payload: roles });
      dispatch({ type: 'SET_PERMISSIONS', payload: permissions });
      dispatch({ type: 'SET_USER_ROLES', payload: userRoles });
      dispatch({ type: 'SET_ROLE_PERMISSIONS', payload: rolePermissions });

      // Calculate user permissions if user is available
      if (state.user) {
        const userPermissions = await rbacService.getUserPermissions(state.user.id);
        dispatch({ 
          type: 'SET_USER_PERMISSIONS', 
          payload: { [state.user.id]: userPermissions }
        });
      }

      dispatch({ type: 'REFRESH_CACHE' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize RBAC';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      onError?.(error as Error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user, rbacService, permissionService, roleService, onError]);

  // Refresh data
  const refresh = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const [roles, permissions, userRoles, rolePermissions] = await Promise.all([
        roleService.getAllRoles(),
        permissionService.getAllPermissions(),
        rbacService.getAllUserRoles(),
        rbacService.getAllRolePermissions(),
      ]);

      dispatch({ type: 'SET_ROLES', payload: roles });
      dispatch({ type: 'SET_PERMISSIONS', payload: permissions });
      dispatch({ type: 'SET_USER_ROLES', payload: userRoles });
      dispatch({ type: 'SET_ROLE_PERMISSIONS', payload: rolePermissions });

      dispatch({ type: 'CLEAR_CACHE' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh RBAC data';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      onError?.(error as Error);
    }
  }, [rbacService, permissionService, roleService, onError]);

  // Set user
  const setUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
    
    if (user) {
      // Load user-specific data
      rbacService.getUserPermissions(user.id).then(permissions => {
        dispatch({
          type: 'SET_USER_PERMISSIONS',
          payload: { [user.id]: permissions }
        });
      }).catch(error => {
        onError?.(error as Error);
      });
    }
  }, [rbacService, onError]);

  // Permission checking with caching
  const hasPermission = useCallback((userId: string, permissionName: string): boolean => {
    // Check cache first
    const cacheKey = `${userId}:${permissionName}`;
    if (state.permissionCache.has(cacheKey)) {
      return state.permissionCache.get(cacheKey);
    }

    // Get user permissions
    const userPerms = state.userPermissions[userId] || [];
    const hasAccess = userPerms.some(perm => perm.name === permissionName);

    // Cache result
    state.permissionCache.set(cacheKey, hasAccess);

    return hasAccess;
  }, [state.userPermissions, state.permissionCache]);

  // Get all user permissions
  const getUserPermissions = useCallback((userId: string): Permission[] => {
    return state.userPermissions[userId] || [];
  }, [state.userPermissions]);

  // Get user roles
  const getUserRoles = useCallback((userId: string): Role[] => {
    return state.userRoles[userId] || [];
  }, [state.userRoles]);

  // Check if user has role
  const hasRole = useCallback((userId: string, roleName: string): boolean => {
    const userRoles = getUserRoles(userId);
    return userRoles.some(role => role.name === roleName);
  }, [getUserRoles]);

  // Assign role to user
  const assignUserRole = useCallback(async (userId: string, roleId: string) => {
    try {
      await rbacService.assignUserRole(userId, roleId);
      
      // Update local state
      const currentRoles = state.userRoles[userId] || [];
      const role = state.roles.find(r => r.id === roleId);
      if (role && !currentRoles.some(r => r.id === roleId)) {
        const updatedRoles = [...currentRoles, role];
        dispatch({ type: 'UPDATE_USER_ROLES', payload: { userId, roles: updatedRoles } });
        
        // Clear permission cache for this user
        for (const [key] of state.permissionCache) {
          if (key.startsWith(`${userId}:`)) {
            state.permissionCache.delete(key);
          }
        }

        // Reload user permissions
        const updatedPermissions = await rbacService.getUserPermissions(userId);
        dispatch({
          type: 'SET_USER_PERMISSIONS',
          payload: { [userId]: updatedPermissions }
        });

        onRoleChange?.(userId, updatedRoles);
        onPermissionChange?.(userId, updatedPermissions);
      }
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }, [rbacService, state.userRoles, state.roles, state.permissionCache, onRoleChange, onPermissionChange, onError]);

  // Remove role from user
  const removeUserRole = useCallback(async (userId: string, roleId: string) => {
    try {
      await rbacService.removeUserRole(userId, roleId);
      
      // Update local state
      const currentRoles = state.userRoles[userId] || [];
      const updatedRoles = currentRoles.filter(role => role.id !== roleId);
      dispatch({ type: 'UPDATE_USER_ROLES', payload: { userId, roles: updatedRoles } });
      
      // Clear permission cache for this user
      for (const [key] of state.permissionCache) {
        if (key.startsWith(`${userId}:`)) {
          state.permissionCache.delete(key);
        }
      }

      // Reload user permissions
      const updatedPermissions = await rbacService.getUserPermissions(userId);
      dispatch({
        type: 'SET_USER_PERMISSIONS',
        payload: { [userId]: updatedPermissions }
      });

      onRoleChange?.(userId, updatedRoles);
      onPermissionChange?.(userId, updatedPermissions);
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }, [rbacService, state.userRoles, state.permissionCache, onRoleChange, onPermissionChange, onError]);

  // Clear cache
  const clearCache = useCallback(() => {
    dispatch({ type: 'CLEAR_CACHE' });
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refresh]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Context value
  const contextValue: RBACContext = {
    // State
    user: state.user,
    roles: state.roles,
    permissions: state.permissions,
    userRoles: state.userRoles,
    rolePermissions: state.rolePermissions,
    userPermissions: state.userPermissions,
    auditLogs: state.auditLogs,
    loading: state.loading,
    error: state.error,
    permissionCache: state.permissionCache,
    roleCache: state.roleCache,
    lastRefresh: state.lastRefresh,

    // Methods
    hasPermission,
    getUserPermissions,
    getUserRoles,
    hasRole,
    assignUserRole,
    removeUserRole,
    setUser,
    refresh,
    clearCache,
    initialize,

    // Services
    rbacService,
    permissionService,
    roleService,
  };

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  );
};

// Custom hook to use RBAC context
export const useRBACContext = (): RBACContext => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBACContext must be used within an RBACProvider');
  }
  return context;
};

// Higher-order component to wrap components with RBAC context
export const withRBACProvider = <P extends object>(
  Component: React.ComponentType<P>,
  providerProps?: Omit<RBACProviderProps, 'children'>
) => {
  return (props: P) => {
    return (
      <RBACProvider {...providerProps}>
        <Component {...props} />
      </RBACProvider>
    );
  };
};

export default RBACProvider;