// RBAC Validation Utilities
// Comprehensive validation functions for roles, permissions, and user data

import { 
  Role, 
  Permission, 
  RBACUser, 
  RoleName, 
  PermissionName,
  ValidationResult,
  RoleValidationResult,
  PermissionValidationResult,
  ResourceType,
  PermissionAction,
  RoleHierarchy,
  UserRole,
  RolePermission
} from '../types/rbac.types';
import { 
  parsePermissionName, 
  validatePermissionName,
  generateResourcePermissions,
  hasRole,
  hasPermission,
  hasAllRoles,
  hasAllPermissions
} from './permissions';
import { 
  getRoleDefinition, 
  getAllRoleDefinitions, 
  getParentRoles, 
  canInheritFrom,
  isSystemRole,
  getAdminRoles
} from './roles';

// ==========================================
// ROLE VALIDATION
// ==========================================

/**
 * Validate a role object
 * @param role - Role object to validate
 * @returns Validation result with role if valid
 */
export function validateRole(role: Partial<Role>): RoleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!role.name) {
    errors.push('Role name is required');
  } else {
    // Check if name is valid format
    const namePattern = /^[a-z0-9_]+$/;
    if (!namePattern.test(role.name)) {
      errors.push('Role name must contain only lowercase letters, numbers, and underscores');
    }

    // Check if name is too long
    if (role.name.length > 50) {
      errors.push('Role name must be 50 characters or less');
    }
  }

  if (!role.display_name) {
    errors.push('Display name is required');
  } else if (role.display_name.length > 200) {
    errors.push('Display name must be 200 characters or less');
  }

  if (typeof role.is_system_role !== 'boolean') {
    errors.push('is_system_role must be a boolean');
  }

  if (typeof role.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  if (typeof role.level !== 'number' || role.level < 0) {
    errors.push('Level must be a non-negative number');
  }

  // Optional fields
  if (role.description && role.description.length > 1000) {
    warnings.push('Description is quite long (>1000 characters)');
  }

  // Validate metadata if present
  if (role.metadata && typeof role.metadata !== 'object') {
    errors.push('Metadata must be an object');
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    role: errors.length === 0 ? role as Role : undefined
  };
}

/**
 * Validate role creation request
 * @param roleData - Role creation data
 * @returns Validation result
 */
export function validateCreateRole(roleData: Partial<Role>): ValidationResult {
  const errors: string[] = [];

  // Check for required fields
  if (!roleData.name) {
    errors.push('Role name is required');
  } else {
    // Check if role name already exists
    const existingRoles = getAllRoleDefinitions();
    if (existingRoles.some(r => r.name === roleData.name)) {
      errors.push(`Role with name "${roleData.name}" already exists`);
    }
  }

  if (!roleData.display_name) {
    errors.push('Display name is required');
  }

  // Validate level
  if (roleData.level !== undefined && (typeof roleData.level !== 'number' || roleData.level < 0)) {
    errors.push('Level must be a non-negative number');
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

/**
 * Validate role hierarchy to prevent circular references
 * @param roleId - ID of the role
 * @param parentRoleId - ID of the parent role
 * @param existingHierarchy - Existing role hierarchy relationships
 * @returns Validation result
 */
export function validateRoleHierarchy(
  roleId: string,
  parentRoleId: string,
  existingHierarchy: RoleHierarchy[] = []
): ValidationResult {
  const errors: string[] = [];

  // Check for self-reference
  if (roleId === parentRoleId) {
    errors.push('A role cannot be its own parent');
  }

  // Check for circular reference
  if (wouldCreateCircularReference(roleId, parentRoleId, existingHierarchy)) {
    errors.push('This relationship would create a circular reference in the role hierarchy');
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

/**
 * Check if adding a parent role would create a circular reference
 * @param childRoleId - ID of the child role
 * @param parentRoleId - ID of the proposed parent role
 * @param existingHierarchy - Existing hierarchy relationships
 * @returns Boolean indicating if circular reference would be created
 */
function wouldCreateCircularReference(
  childRoleId: string,
  parentRoleId: string,
  existingHierarchy: RoleHierarchy[]
): boolean {
  // Build a graph of role relationships
  const roleGraph = new Map<string, string[]>();
  
  // Add existing relationships
  existingHierarchy.forEach(hierarchy => {
    if (!roleGraph.has(hierarchy.parent_role_id)) {
      roleGraph.set(hierarchy.parent_role_id, []);
    }
    roleGraph.get(hierarchy.parent_role_id)!.push(hierarchy.child_role_id);
  });

  // Add the new relationship
  if (!roleGraph.has(parentRoleId)) {
    roleGraph.set(parentRoleId, []);
  }
  roleGraph.get(parentRoleId)!.push(childRoleId);

  // Check for cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);

    const children = roleGraph.get(node) || [];
    for (const child of children) {
      if (!visited.has(child)) {
        if (hasCycle(child)) return true;
      } else if (recursionStack.has(child)) {
        return true; // Cycle detected
      }
    }

    recursionStack.delete(node);
    return false;
  }

  // Check for cycles starting from any node
  for (const node of roleGraph.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) return true;
    }
  }

  return false;
}

/**
 * Validate role assignment
 * @param userId - ID of the user
 * @param roleId - ID of the role
 * @param existingUserRoles - Existing roles for the user
 * @returns Validation result
 */
export function validateRoleAssignment(
  userId: string,
  roleId: string,
  existingUserRoles: UserRole[] = []
): ValidationResult {
  const errors: string[] = [];

  if (!userId) {
    errors.push('User ID is required');
  }

  if (!roleId) {
    errors.push('Role ID is required');
  }

  // Check if user already has this role
  if (existingUserRoles.some(ur => ur.role_id === roleId && ur.is_active)) {
    errors.push('User already has this role');
  }

  // Check if trying to assign system role (should be restricted)
  const roleDef = getRoleDefinition(roleId as RoleName);
  if (roleDef && isSystemRole(roleDef.name)) {
    // System roles can only be assigned by admins
    // This check would be done at the business logic level
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

// ==========================================
// PERMISSION VALIDATION
// ==========================================

/**
 * Validate a permission object
 * @param permission - Permission object to validate
 * @returns Validation result with permission if valid
 */
export function validatePermission(permission: Partial<Permission>): PermissionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!permission.name) {
    errors.push('Permission name is required');
  } else {
    try {
      parsePermissionName(permission.name);
    } catch (error) {
      errors.push(`Invalid permission name format: ${error.message}`);
    }
  }

  if (!permission.display_name) {
    errors.push('Display name is required');
  } else if (permission.display_name.length > 200) {
    errors.push('Display name must be 200 characters or less');
  }

  if (!permission.resource) {
    errors.push('Resource is required');
  } else {
    const validResources: ResourceType[] = [
      'dashboard', 'appointments', 'billing', 'communication', 'compliance',
      'customers', 'designs', 'documents', 'employees', 'finance', 'measurements',
      'orders', 'payroll', 'security', 'visa_compliance', 'workflow', 'workload',
      'analytics', 'mobile', 'offline', 'users', 'system', 'audit', 'logging'
    ];

    if (!validResources.includes(permission.resource as ResourceType)) {
      errors.push(`Invalid resource: ${permission.resource}`);
    }
  }

  if (!permission.action) {
    errors.push('Action is required');
  } else {
    const validActions: PermissionAction[] = [
      'read', 'write', 'delete', 'manage', 'create', 'update', 'approve', 'reject',
      'export', 'import', 'schedule', 'cancel', 'reschedule', 'send', 'receive',
      'upload', 'download', 'share', 'assign', 'unassign', 'activate', 'deactivate'
    ];

    if (!validActions.includes(permission.action as PermissionAction)) {
      errors.push(`Invalid action: ${permission.action}`);
    }
  }

  if (typeof permission.is_system_permission !== 'boolean') {
    errors.push('is_system_permission must be a boolean');
  }

  if (typeof permission.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  // Optional fields
  if (permission.description && permission.description.length > 1000) {
    warnings.push('Description is quite long (>1000 characters)');
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    permission: errors.length === 0 ? permission as Permission : undefined
  };
}

/**
 * Validate permission creation
 * @param permissionData - Permission creation data
 * @returns Validation result
 */
export function validateCreatePermission(permissionData: Partial<Permission>): ValidationResult {
  const errors: string[] = [];

  // Check for required fields
  if (!permissionData.name) {
    errors.push('Permission name is required');
  } else {
    // Check if permission name already exists
    // This would require checking against existing permissions in the database
  }

  if (!permissionData.display_name) {
    errors.push('Display name is required');
  }

  if (!permissionData.resource) {
    errors.push('Resource is required');
  }

  if (!permissionData.action) {
    errors.push('Action is required');
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

/**
 * Validate role permission assignment
 * @param roleId - ID of the role
 * @param permissionId - ID of the permission
 * @param existingRolePermissions - Existing role permissions
 * @returns Validation result
 */
export function validateRolePermissionAssignment(
  roleId: string,
  permissionId: string,
  existingRolePermissions: RolePermission[] = []
): ValidationResult {
  const errors: string[] = [];

  if (!roleId) {
    errors.push('Role ID is required');
  }

  if (!permissionId) {
    errors.push('Permission ID is required');
  }

  // Check if role already has this permission
  if (existingRolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permissionId)) {
    errors.push('Role already has this permission');
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

// ==========================================
// USER VALIDATION
// ==========================================

/**
 * Validate user object
 * @param user - User object to validate
 * @returns Validation result
 */
export function validateUser(user: Partial<RBACUser>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!user.id) {
    errors.push('User ID is required');
  }

  if (!user.email) {
    errors.push('Email is required');
  } else {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      errors.push('Invalid email format');
    }
  }

  if (!Array.isArray(user.roles)) {
    errors.push('Roles must be an array');
  }

  if (!Array.isArray(user.permissions)) {
    errors.push('Permissions must be an array');
  }

  if (typeof user.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  // Validate roles
  if (user.roles) {
    user.roles.forEach(role => {
      if (!getRoleDefinition(role.name)) {
        errors.push(`Invalid role: ${role.name}`);
      }
    });
  }

  // Validate permissions
  if (user.permissions) {
    user.permissions.forEach(permission => {
      try {
        parsePermissionName(permission.name);
      } catch (error) {
        errors.push(`Invalid permission: ${permission.name}`);
      }
    });
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate user permission context
 * @param userId - User ID
 * @param userRoles - User roles
 * @param userPermissions - User permissions
 * @returns Validation result
 */
export function validateUserPermissionContext(
  userId: string,
  userRoles: RoleName[],
  userPermissions: PermissionName[]
): ValidationResult {
  const errors: string[] = [];

  if (!userId) {
    errors.push('User ID is required');
  }

  if (!Array.isArray(userRoles)) {
    errors.push('User roles must be an array');
  }

  if (!Array.isArray(userPermissions)) {
    errors.push('User permissions must be an array');
  }

  // Validate roles
  if (Array.isArray(userRoles)) {
    userRoles.forEach(role => {
      if (!getRoleDefinition(role)) {
        errors.push(`Invalid role: ${role}`);
      }
    });
  }

  // Validate permissions
  if (Array.isArray(userPermissions)) {
    userPermissions.forEach(permission => {
      try {
        parsePermissionName(permission);
      } catch (error) {
        errors.push(`Invalid permission: ${permission}`);
      }
    });
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

// ==========================================
// ACCESS CONTROL VALIDATION
// ==========================================

/**
 * Validate if a user can perform an action
 * @param userPermissions - User's permissions
 * @param requiredPermission - Required permission
 * @returns Validation result
 */
export function validateAccess(
  userPermissions: PermissionName[],
  requiredPermission: PermissionName
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(userPermissions)) {
    errors.push('User permissions must be an array');
  }

  if (!requiredPermission) {
    errors.push('Required permission is required');
  }

  if (errors.length > 0) {
    return { is_valid: false, errors };
  }

  // Check if user has the required permission
  if (!hasPermission(userPermissions, requiredPermission)) {
    errors.push(`Access denied. Required permission: ${requiredPermission}`);
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

/**
 * Validate if a user can access a resource
 * @param userRoles - User's roles
 * @param requiredRoles - Required roles
 * @param requireAll - Whether user must have ALL roles
 * @returns Validation result
 */
export function validateRoleAccess(
  userRoles: RoleName[],
  requiredRoles: RoleName[],
  requireAll: boolean = false
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(userRoles)) {
    errors.push('User roles must be an array');
  }

  if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
    errors.push('Required roles must be a non-empty array');
  }

  if (errors.length > 0) {
    return { is_valid: false, errors };
  }

  // Check role access
  if (requireAll) {
    if (!hasAllRoles(userRoles, requiredRoles)) {
      errors.push(`Access denied. User must have all of these roles: ${requiredRoles.join(', ')}`);
    }
  } else {
    if (!requiredRoles.some(role => hasRole(userRoles, role))) {
      errors.push(`Access denied. User must have at least one of these roles: ${requiredRoles.join(', ')}`);
    }
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

// ==========================================
// BULK VALIDATION
// ==========================================

/**
 * Validate multiple roles
 * @param roles - Array of roles to validate
 * @returns Validation result with details
 */
export function validateBulkRoles(roles: Partial<Role>[]): {
  is_valid: boolean;
  results: RoleValidationResult[];
  total_errors: number;
} {
  const results = roles.map(role => validateRole(role));
  const total_errors = results.reduce((sum, result) => sum + result.errors.length, 0);

  return {
    is_valid: total_errors === 0,
    results,
    total_errors
  };
}

/**
 * Validate multiple permissions
 * @param permissions - Array of permissions to validate
 * @returns Validation result with details
 */
export function validateBulkPermissions(permissions: Partial<Permission>[]): {
  is_valid: boolean;
  results: PermissionValidationResult[];
  total_errors: number;
} {
  const results = permissions.map(permission => validatePermission(permission));
  const total_errors = results.reduce((sum, result) => sum + result.errors.length, 0);

  return {
    is_valid: total_errors === 0,
    results,
    total_errors
  };
}

/**
 * Validate role permission matrix
 * @param rolePermissions - Array of role permission assignments
 * @returns Validation result
 */
export function validateRolePermissionMatrix(rolePermissions: Partial<RolePermission>[]): ValidationResult {
  const errors: string[] = [];

  rolePermissions.forEach((assignment, index) => {
    if (!assignment.role_id) {
      errors.push(`Role permission assignment ${index + 1}: Role ID is required`);
    }

    if (!assignment.permission_id) {
      errors.push(`Role permission assignment ${index + 1}: Permission ID is required`);
    }

    if (typeof assignment.is_granted !== 'boolean') {
      errors.push(`Role permission assignment ${index + 1}: is_granted must be a boolean`);
    }
  });

  return {
    is_valid: errors.length === 0,
    errors
  };
}

// ==========================================
// UTILITY VALIDATION
// ==========================================

/**
 * Validate if a string is a valid role name
 * @param roleName - Role name to validate
 * @returns Validation result
 */
export function validateRoleName(roleName: string): ValidationResult {
  const errors: string[] = [];

  if (!roleName) {
    errors.push('Role name is required');
    return { is_valid: false, errors };
  }

  // Check format
  const namePattern = /^[a-z0-9_]+$/;
  if (!namePattern.test(roleName)) {
    errors.push('Role name must contain only lowercase letters, numbers, and underscores');
  }

  // Check length
  if (roleName.length < 2) {
    errors.push('Role name must be at least 2 characters');
  }

  if (roleName.length > 50) {
    errors.push('Role name must be 50 characters or less');
  }

  // Check if role exists
  if (getRoleDefinition(roleName as RoleName)) {
    errors.push(`Role "${roleName}" already exists`);
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

/**
 * Validate if a string is a valid permission name
 * @param permissionName - Permission name to validate
 * @returns Validation result
 */
export function validatePermissionName(permissionName: string): ValidationResult {
  const errors: string[] = [];

  if (!permissionName) {
    errors.push('Permission name is required');
    return { is_valid: false, errors };
  }

  // Use the parse function to validate
  try {
    parsePermissionName(permissionName);
    return { is_valid: true, errors: [] };
  } catch (error) {
    errors.push(error.message);
    return { is_valid: false, errors };
  }
}

/**
 * Validate role level
 * @param level - Level to validate
 * @param existingRoles - Existing roles (optional)
 * @returns Validation result
 */
export function validateRoleLevel(level: number, existingRoles: Role[] = []): ValidationResult {
  const errors: string[] = [];

  if (typeof level !== 'number' || isNaN(level)) {
    errors.push('Level must be a number');
    return { is_valid: false, errors };
  }

  if (level < 0) {
    errors.push('Level must be non-negative');
  }

  if (level > 10) {
    errors.push('Level should not exceed 10');
  }

  // Check if level already exists
  const levelExists = existingRoles.some(role => role.level === level);
  if (levelExists) {
    errors.push(`Level ${level} already exists`);
  }

  return {
    is_valid: errors.length === 0,
    errors
  };
}

// ==========================================
// EXPORT ALL VALIDATION FUNCTIONS
// ==========================================

export {
  // Role validation
  validateRole,
  validateCreateRole,
  validateRoleHierarchy,
  validateRoleAssignment,
  validateRoleName,
  validateRoleLevel,
  
  // Permission validation
  validatePermission,
  validateCreatePermission,
  validateRolePermissionAssignment,
  validatePermissionName,
  
  // User validation
  validateUser,
  validateUserPermissionContext,
  
  // Access control validation
  validateAccess,
  validateRoleAccess,
  
  // Bulk validation
  validateBulkRoles,
  validateBulkPermissions,
  validateRolePermissionMatrix
};
