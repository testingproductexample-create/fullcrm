// RBAC Permission Utilities
// Core permission checking and validation functions

import { 
  PermissionName, 
  ResourceType, 
  PermissionAction, 
  RoleName,
  Permission,
  Role,
  UserPermissionSummary,
  PermissionMatrix,
  ValidationResult,
  PermissionContext,
  RBACError,
  RBACException,
  RBACErrorCode
} from '../types/rbac.types';

// ==========================================
// PERMISSION PARSING AND VALIDATION
// ==========================================

/**
 * Parse a permission name into resource and action components
 * @param permissionName - Permission name in format "resource:action"
 * @returns Parsed resource and action
 */
export function parsePermissionName(permissionName: PermissionName): { resource: ResourceType; action: PermissionAction } {
  const parts = permissionName.split(':');
  if (parts.length !== 2) {
    throw new RBACException(
      'INVALID_PERMISSION_NAME',
      `Invalid permission name format: ${permissionName}. Expected format: "resource:action"`
    );
  }

  const [resource, action] = parts;
  
  // Validate resource type
  const validResources: ResourceType[] = [
    'dashboard', 'appointments', 'billing', 'communication', 'compliance',
    'customers', 'designs', 'documents', 'employees', 'finance', 'measurements',
    'orders', 'payroll', 'security', 'visa_compliance', 'workflow', 'workload',
    'analytics', 'mobile', 'offline', 'users', 'system', 'audit', 'logging'
  ];

  if (!validResources.includes(resource as ResourceType)) {
    throw new RBACException(
      'INVALID_PERMISSION_NAME',
      `Invalid resource type: ${resource}. Valid resources: ${validResources.join(', ')}`
    );
  }

  // Validate action type
  const validActions: PermissionAction[] = [
    'read', 'write', 'delete', 'manage', 'create', 'update', 'approve', 'reject',
    'export', 'import', 'schedule', 'cancel', 'reschedule', 'send', 'receive',
    'upload', 'download', 'share', 'assign', 'unassign', 'activate', 'deactivate'
  ];

  if (!validActions.includes(action as PermissionAction)) {
    throw new RBACException(
      'INVALID_PERMISSION_NAME',
      `Invalid action type: ${action}. Valid actions: ${validActions.join(', ')}`
    );
  }

  return {
    resource: resource as ResourceType,
    action: action as PermissionAction
  };
}

/**
 * Validate if a permission name is properly formatted
 * @param permissionName - Permission name to validate
 * @returns Validation result
 */
export function validatePermissionName(permissionName: PermissionName): ValidationResult {
  const errors: string[] = [];
  
  try {
    parsePermissionName(permissionName);
    return {
      is_valid: true,
      errors: []
    };
  } catch (error) {
    if (error instanceof RBACException) {
      errors.push(error.message);
    } else {
      errors.push('Unknown validation error');
    }
    
    return {
      is_valid: false,
      errors
    };
  }
}

/**
 * Generate all possible permissions for a resource
 * @param resource - Resource type
 * @param actions - Array of actions (optional, defaults to all actions)
 * @returns Array of permission names
 */
export function generateResourcePermissions(
  resource: ResourceType, 
  actions?: PermissionAction[]
): PermissionName[] {
  const defaultActions: PermissionAction[] = [
    'read', 'write', 'delete', 'manage'
  ];
  
  const validActions = actions || defaultActions;
  
  return validActions.map(action => `${resource}:${action}` as PermissionName);
}

// ==========================================
// PERMISSION CHECKING FUNCTIONS
// ==========================================

/**
 * Check if a user has a specific permission
 * @param userPermissions - Array of user permissions
 * @param requiredPermission - Permission to check
 * @returns Boolean indicating if user has permission
 */
export function hasPermission(
  userPermissions: PermissionName[], 
  requiredPermission: PermissionName
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if a user has any of the specified permissions
 * @param userPermissions - Array of user permissions
 * @param requiredPermissions - Array of permissions to check
 * @returns Boolean indicating if user has any permission
 */
export function hasAnyPermission(
  userPermissions: PermissionName[], 
  requiredPermissions: PermissionName[]
): boolean {
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
}

/**
 * Check if a user has all of the specified permissions
 * @param userPermissions - Array of user permissions
 * @param requiredPermissions - Array of permissions to check
 * @returns Boolean indicating if user has all permissions
 */
export function hasAllPermissions(
  userPermissions: PermissionName[], 
  requiredPermissions: PermissionName[]
): boolean {
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}

/**
 * Get the highest permission level for a resource
 * @param userPermissions - Array of user permissions
 * @param resource - Resource type
 * @returns Permission level: 'none', 'read', 'write', or 'manage'
 */
export function getPermissionLevel(
  userPermissions: PermissionName[], 
  resource: ResourceType
): 'none' | 'read' | 'write' | 'manage' {
  const resourcePermissions = userPermissions.filter(permission => {
    const parsed = parsePermissionName(permission);
    return parsed.resource === resource;
  });

  if (resourcePermissions.some(p => p.endsWith(':manage'))) {
    return 'manage';
  } else if (resourcePermissions.some(p => p.endsWith(':write'))) {
    return 'write';
  } else if (resourcePermissions.some(p => p.endsWith(':read'))) {
    return 'read';
  } else {
    return 'none';
  }
}

/**
 * Check if a user can perform a specific action on a resource
 * @param userPermissions - Array of user permissions
 * @param resource - Resource type
 * @param action - Action to perform
 * @returns Boolean indicating if user can perform action
 */
export function canPerformAction(
  userPermissions: PermissionName[], 
  resource: ResourceType, 
  action: PermissionAction
): boolean {
  const requiredPermission = `${resource}:${action}` as PermissionName;
  return hasPermission(userPermissions, requiredPermission);
}

// ==========================================
// ROLE-BASED CHECKING
// ==========================================

/**
 * Check if a user has a specific role
 * @param userRoles - Array of user roles
 * @param requiredRole - Role to check
 * @returns Boolean indicating if user has role
 */
export function hasRole(userRoles: RoleName[], requiredRole: RoleName): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Check if a user has any of the specified roles
 * @param userRoles - Array of user roles
 * @param requiredRoles - Array of roles to check
 * @returns Boolean indicating if user has any role
 */
export function hasAnyRole(userRoles: RoleName[], requiredRoles: RoleName[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check if a user has all of the specified roles
 * @param userRoles - Array of user roles
 * @param requiredRoles - Array of roles to check
 * @returns Boolean indicating if user has all roles
 */
export function hasAllRoles(userRoles: RoleName[], requiredRoles: RoleName[]): boolean {
  return requiredRoles.every(role => userRoles.includes(role));
}

/**
 * Check if a user is an admin
 * @param userRoles - Array of user roles
 * @returns Boolean indicating if user is an admin
 */
export function isAdmin(userRoles: RoleName[]): boolean {
  return hasAnyRole(userRoles, ['super_admin', 'system_admin']);
}

/**
 * Check if a user can manage other users
 * @param userPermissions - Array of user permissions
 * @returns Boolean indicating if user can manage users
 */
export function canManageUsers(userPermissions: PermissionName[]): boolean {
  return hasAnyPermission(userPermissions, [
    'users:manage',
    'users:write',
    'system:manage'
  ]);
}

/**
 * Check if a user can view audit logs
 * @param userPermissions - Array of user permissions
 * @returns Boolean indicating if user can view audit logs
 */
export function canViewAuditLogs(userPermissions: PermissionName[]): boolean {
  return hasAnyPermission(userPermissions, [
    'audit:read',
    'system:read',
    'logging:read'
  ]);
}

// ==========================================
// PERMISSION MATRIX FUNCTIONS
// ==========================================

/**
 * Create a permission matrix for roles
 * @param roles - Array of roles with permissions
 * @returns Permission matrix
 */
export function createPermissionMatrix(roles: (Role & { permissions?: Permission[] })[]): PermissionMatrix {
  const matrix: PermissionMatrix = {};

  roles.forEach(role => {
    matrix[role.name] = {};
    
    // Group permissions by resource
    const resourcePermissions = new Map<string, { [action: string]: boolean }>();
    
    role.permissions?.forEach(permission => {
      const { resource, action } = parsePermissionName(permission.name);
      
      if (!resourcePermissions.has(resource)) {
        resourcePermissions.set(resource, {});
      }
      
      resourcePermissions.get(resource)![action] = true;
    });

    // Convert to matrix format
    resourcePermissions.forEach((actions, resource) => {
      matrix[role.name][resource] = actions;
    });
  });

  return matrix;
}

/**
 * Compare two permission matrices
 * @param matrix1 - First permission matrix
 * @param matrix2 - Second permission matrix
 * @returns Differences between matrices
 */
export function comparePermissionMatrices(
  matrix1: PermissionMatrix, 
  matrix2: PermissionMatrix
): {
  added: PermissionName[];
  removed: PermissionName[];
  changed: PermissionName[];
} {
  const added: PermissionName[] = [];
  const removed: PermissionName[] = [];
  const changed: PermissionName[] = [];

  // Find added and changed permissions
  Object.keys(matrix1).forEach(roleName => {
    const role1 = matrix1[roleName];
    const role2 = matrix2[roleName];

    if (role2) {
      // Compare resources and actions
      Object.keys(role1).forEach(resource => {
        const actions1 = role1[resource];
        const actions2 = role2[resource];

        if (actions2) {
          Object.keys(actions1).forEach(action => {
            const permission = `${resource}:${action}` as PermissionName;
            
            if (!actions2[action]) {
              removed.push(permission);
            }
          });

          Object.keys(actions2).forEach(action => {
            const permission = `${resource}:${action}` as PermissionName;
            
            if (!actions1[action]) {
              added.push(permission);
            } else if (actions1[action] !== actions2[action]) {
              changed.push(permission);
            }
          });
        } else {
          // All permissions for this resource were removed
          Object.keys(actions1).forEach(action => {
            removed.push(`${resource}:${action}` as PermissionName);
          });
        }
      });
    } else {
      // Entire role was removed
      Object.keys(role1).forEach(resource => {
        const actions = role1[resource];
        Object.keys(actions).forEach(action => {
          removed.push(`${resource}:${action}` as PermissionName);
        });
      });
    }
  });

  // Find added roles
  Object.keys(matrix2).forEach(roleName => {
    if (!matrix1[roleName]) {
      const role2 = matrix2[roleName];
      Object.keys(role2).forEach(resource => {
        const actions = role2[resource];
        Object.keys(actions).forEach(action => {
          added.push(`${resource}:${action}` as PermissionName);
        });
      });
    }
  });

  return { added, removed, changed };
}

// ==========================================
// VALIDATION AND SANITIZATION
// ==========================================

/**
 * Sanitize a list of permissions by removing duplicates and invalid permissions
 * @param permissions - Array of permissions to sanitize
 * @returns Sanitized array of permissions
 */
export function sanitizePermissions(permissions: PermissionName[]): PermissionName[] {
  const sanitized = new Set<PermissionName>();
  const errors: string[] = [];

  permissions.forEach(permission => {
    const validation = validatePermissionName(permission);
    
    if (validation.is_valid) {
      sanitized.add(permission);
    } else {
      errors.push(`Invalid permission "${permission}": ${validation.errors.join(', ')}`);
    }
  });

  if (errors.length > 0) {
    throw new RBACException(
      'INVALID_PERMISSIONS',
      `Found ${errors.length} invalid permissions`,
      { errors }
    );
  }

  return Array.from(sanitized);
}

/**
 * Validate user permission summary
 * @param summary - User permission summary to validate
 * @returns Validation result
 */
export function validateUserPermissionSummary(summary: UserPermissionSummary): ValidationResult {
  const errors: string[] = [];

  if (!summary.user_id) {
    errors.push('User ID is required');
  }

  if (!summary.email) {
    errors.push('Email is required');
  }

  if (!Array.isArray(summary.roles)) {
    errors.push('Roles must be an array');
  }

  if (!Array.isArray(summary.permissions)) {
    errors.push('Permissions must be an array');
  }

  // Validate roles
  const validRoles: RoleName[] = [
    'super_admin', 'system_admin', 'operations_manager', 'hr_manager',
    'finance_manager', 'sales_manager', 'designer', 'customer_service',
    'accountant', 'compliance_officer', 'department_manager', 'team_lead',
    'employee', 'customer', 'viewer'
  ];

  summary.roles?.forEach(role => {
    if (!validRoles.includes(role as RoleName)) {
      errors.push(`Invalid role: ${role}`);
    }
  });

  // Validate permissions
  summary.permissions?.forEach(permission => {
    const validation = validatePermissionName(permission);
    if (!validation.is_valid) {
      errors.push(`Invalid permission: ${permission}`);
    }
  });

  return {
    is_valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a permission context is valid
 * @param context - Permission context to validate
 * @returns Validation result
 */
export function validatePermissionContext(context: PermissionContext): ValidationResult {
  const errors: string[] = [];

  if (!context.user_id) {
    errors.push('User ID is required');
  }

  if (!Array.isArray(context.roles)) {
    errors.push('Roles must be an array');
  }

  if (!Array.isArray(context.permissions)) {
    errors.push('Permissions must be an array');
  }

  if (!context.timestamp) {
    errors.push('Timestamp is required');
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get all permissions for a specific resource
 * @param permissions - Array of permissions
 * @param resource - Resource type
 * @returns Array of permissions for the resource
 */
export function getResourcePermissions(
  permissions: PermissionName[], 
  resource: ResourceType
): PermissionName[] {
  return permissions.filter(permission => {
    const parsed = parsePermissionName(permission);
    return parsed.resource === resource;
  });
}

/**
 * Get all actions available for a resource
 * @param permissions - Array of permissions
 * @param resource - Resource type
 * @returns Array of available actions
 */
export function getResourceActions(
  permissions: PermissionName[], 
  resource: ResourceType
): PermissionAction[] {
  const resourcePermissions = getResourcePermissions(permissions, resource);
  
  return resourcePermissions.map(permission => {
    const parsed = parsePermissionName(permission);
    return parsed.action;
  });
}

/**
 * Calculate the total number of permissions a user has
 * @param permissions - Array of permissions
 * @returns Total count
 */
export function countPermissions(permissions: PermissionName[]): number {
  return permissions.length;
}

/**
 * Group permissions by resource
 * @param permissions - Array of permissions
 * @returns Grouped permissions by resource
 */
export function groupPermissionsByResource(permissions: PermissionName[]): Record<ResourceType, PermissionAction[]> {
  return permissions.reduce((groups, permission) => {
    try {
      const { resource, action } = parsePermissionName(permission);
      
      if (!groups[resource]) {
        groups[resource] = [];
      }
      
      groups[resource].push(action);
    } catch (error) {
      // Skip invalid permissions
      console.warn(`Skipping invalid permission: ${permission}`);
    }
    
    return groups;
  }, {} as Record<ResourceType, PermissionAction[]>);
}

/**
 * Check if a user has minimum required permissions
 * @param userPermissions - User permissions
 * @param minimumPermissions - Minimum required permissions
 * @returns Boolean indicating if user meets minimum requirements
 */
export function meetsMinimumRequirements(
  userPermissions: PermissionName[], 
  minimumPermissions: PermissionName[]
): boolean {
  return hasAllPermissions(userPermissions, minimumPermissions);
}

// ==========================================
// EXPORT ALL FUNCTIONS
// ==========================================

export {
  // Parsing and validation
  parsePermissionName,
  validatePermissionName,
  generateResourcePermissions,
  
  // Permission checking
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionLevel,
  canPerformAction,
  
  // Role-based checking
  hasRole,
  hasAnyRole,
  hasAllRoles,
  isAdmin,
  canManageUsers,
  canViewAuditLogs,
  
  // Permission matrix
  createPermissionMatrix,
  comparePermissionMatrices,
  
  // Validation and sanitization
  sanitizePermissions,
  validateUserPermissionSummary,
  validatePermissionContext,
  
  // Utility functions
  getResourcePermissions,
  getResourceActions,
  countPermissions,
  groupPermissionsByResource,
  meetsMinimumRequirements
};
