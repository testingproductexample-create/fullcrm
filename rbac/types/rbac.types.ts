// RBAC TypeScript Types
// Comprehensive type definitions for the role-based access control system

// ==========================================
// CORE TYPES
// ==========================================

export interface RBACUser {
  id: string;
  email: string;
  display_name?: string;
  roles: Role[];
  permissions: Permission[];
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  is_active: boolean;
  level: number;
  permissions?: Permission[];
  parent_roles?: Role[];
  child_roles?: Role[];
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string; // e.g., 'billing', 'employees'
  action: string;   // e.g., 'read', 'write', 'delete'
  is_system_permission: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// ==========================================
// RELATIONSHIP TYPES
// ==========================================

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  is_granted: boolean; // true = grant, false = deny
  role?: Role;
  permission?: Permission;
  created_at: string;
  created_by?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  is_active: boolean;
  role?: Role;
  user?: RBACUser;
}

export interface RoleHierarchy {
  id: string;
  parent_role_id: string;
  child_role_id: string;
  inherits_permissions: boolean;
  parent_role?: Role;
  child_role?: Role;
  created_at: string;
}

export interface UserPermissionOverride {
  id: string;
  user_id: string;
  permission_id: string;
  is_granted: boolean;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  reason?: string;
  user?: RBACUser;
  permission?: Permission;
}

// ==========================================
// AUDIT AND LOGGING TYPES
// ==========================================

export interface PermissionAuditLog {
  id: string;
  user_id?: string; // NULL for system actions
  action: PermissionAuditAction;
  target_user_id?: string;
  target_role_id?: string;
  target_permission_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  created_by?: string;
  user?: RBACUser;
  target_user?: RBACUser;
  target_role?: Role;
  target_permission?: Permission;
}

export type PermissionAuditAction = 
  | 'assign_role'
  | 'revoke_role'
  | 'grant_permission'
  | 'revoke_permission'
  | 'create_role'
  | 'update_role'
  | 'delete_role'
  | 'create_permission'
  | 'update_permission'
  | 'delete_permission'
  | 'login'
  | 'logout'
  | 'permission_check'
  | 'access_denied'
  | 'access_granted';

export interface UserPermissionCache {
  user_id: string;
  permissions: string[]; // Array of permission names
  roles: string[];       // Array of role names
  expires_at: string;
  last_updated: string;
  cache_version: number;
}

// ==========================================
// API REQUEST/RESPONSE TYPES
// ==========================================

export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  level?: number;
  metadata?: Record<string, any>;
}

export interface UpdateRoleRequest {
  display_name?: string;
  description?: string;
  is_active?: boolean;
  level?: number;
  metadata?: Record<string, any>;
}

export interface CreatePermissionRequest {
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  metadata?: Record<string, any>;
}

export interface UpdatePermissionRequest {
  display_name?: string;
  description?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface AssignRoleRequest {
  user_id: string;
  role_id: string;
  expires_at?: string;
}

export interface RevokeRoleRequest {
  user_id: string;
  role_id: string;
}

export interface GrantPermissionOverrideRequest {
  user_id: string;
  permission_id: string;
  is_granted: boolean;
  expires_at?: string;
  reason?: string;
}

export interface PermissionCheckRequest {
  permission: string;
  user_id?: string; // If not provided, checks current user
}

export interface PermissionCheckResponse {
  has_permission: boolean;
  user_id: string;
  permission: string;
  evaluated_at: string;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface RBACApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface RBACListResponse<T> extends RBACApiResponse<PaginatedResponse<T>> {}

export interface RBACSummary {
  total_users: number;
  total_roles: number;
  total_permissions: number;
  total_role_assignments: number;
  active_sessions: number;
  last_updated: string;
}

// ==========================================
// UTILITY TYPES
// ==========================================

export type PermissionName = string; // Format: "resource:action"

export interface PermissionMatrix {
  [roleName: string]: {
    [resource: string]: {
      [action: string]: boolean;
    };
  };
}

export interface UserPermissionSummary {
  user_id: string;
  email: string;
  roles: string[];
  permissions: string[];
  role_count: number;
  permission_count: number;
  last_updated: string;
}

// ==========================================
// RESOURCE TYPES (for all 23+ systems)
// ==========================================

export type ResourceType = 
  | 'dashboard'
  | 'appointments'
  | 'billing'
  | 'communication'
  | 'compliance'
  | 'customers'
  | 'designs'
  | 'documents'
  | 'employees'
  | 'finance'
  | 'measurements'
  | 'orders'
  | 'payroll'
  | 'security'
  | 'visa_compliance'
  | 'workflow'
  | 'workload'
  | 'analytics'
  | 'mobile'
  | 'offline'
  | 'users'
  | 'system'
  | 'audit'
  | 'logging';

export type PermissionAction = 
  | 'read'
  | 'write'
  | 'delete'
  | 'manage'
  | 'create'
  | 'update'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'
  | 'schedule'
  | 'cancel'
  | 'reschedule'
  | 'send'
  | 'receive'
  | 'upload'
  | 'download'
  | 'share'
  | 'assign'
  | 'unassign'
  | 'activate'
  | 'deactivate';

export interface ResourcePermission {
  resource: ResourceType;
  action: PermissionAction;
  permission_name: PermissionName;
}

// ==========================================
// ROLE DEFINITION TYPES
// ==========================================

export type RoleName = 
  | 'super_admin'
  | 'system_admin'
  | 'operations_manager'
  | 'hr_manager'
  | 'finance_manager'
  | 'sales_manager'
  | 'designer'
  | 'customer_service'
  | 'accountant'
  | 'compliance_officer'
  | 'department_manager'
  | 'team_lead'
  | 'employee'
  | 'customer'
  | 'viewer';

export interface RoleDefinition {
  name: RoleName;
  display_name: string;
  description: string;
  level: number;
  default_permissions: PermissionName[];
  can_inherit_from: RoleName[];
  can_assign_to: RoleName[];
  metadata?: Record<string, any>;
}

// ==========================================
// MIDDLEWARE AND CONTEXT TYPES
// ==========================================

export interface PermissionContext {
  user_id: string;
  roles: RoleName[];
  permissions: PermissionName[];
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface RoutePermission {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  required_permissions: PermissionName[];
  require_all?: boolean; // true = user must have ALL permissions, false = user needs ANY permission
  allow_own_data?: boolean; // allow access to user's own data
  resource_type?: ResourceType;
}

export interface ProtectedRoute {
  path: string;
  permissions: PermissionName[];
  redirect_unauthorized?: string;
  redirect_denied?: string;
}

// ==========================================
// ERROR TYPES
// ==========================================

export interface RBACError {
  code: RBACErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export type RBACErrorCode = 
  | 'INSUFFICIENT_PERMISSIONS'
  | 'ROLE_NOT_FOUND'
  | 'PERMISSION_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'INVALID_ROLE_ASSIGNMENT'
  | 'CIRCULAR_ROLE_HIERARCHY'
  | 'DUPLICATE_ROLE_NAME'
  | 'DUPLICATE_PERMISSION_NAME'
  | 'DATABASE_ERROR'
  | 'CACHE_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'INVALID_TOKEN';

export class RBACException extends Error {
  public readonly code: RBACErrorCode;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;

  constructor(code: RBACErrorCode, message: string, details?: Record<string, any>) {
    super(message);
    this.name = 'RBACException';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// ==========================================
// VALIDATION TYPES
// ==========================================

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface RoleValidationResult extends ValidationResult {
  role?: Role;
}

export interface PermissionValidationResult extends ValidationResult {
  permission?: Permission;
}

// ==========================================
// CONFIGURATION TYPES
// ==========================================

export interface RBACConfig {
  cache_duration: number; // seconds
  enable_audit_logging: boolean;
  enable_permission_caching: boolean;
  session_timeout: number; // seconds
  max_login_attempts: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
  };
  permissions: {
    default_role: RoleName;
    system_roles: RoleName[];
    system_permissions: PermissionName[];
  };
}

// ==========================================
// EVENT TYPES
// ==========================================

export interface RBACEvent {
  type: RBACEventType;
  user_id?: string;
  data: Record<string, any>;
  timestamp: string;
  source: string;
}

export type RBACEventType = 
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REVOKED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'ACCESS_DENIED'
  | 'ACCESS_GRANTED'
  | 'PASSWORD_CHANGED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED';

export interface EventHandler {
  (event: RBACEvent): Promise<void> | void;
}

// ==========================================
// HOOK TYPES (for React components)
// ==========================================

export interface UsePermissionsOptions {
  cache?: boolean;
  refresh?: boolean;
  include_overrides?: boolean;
}

export interface UsePermissionsResult {
  permissions: PermissionName[];
  roles: RoleName[];
  hasPermission: (permission: PermissionName) => boolean;
  hasAnyPermission: (permissions: PermissionName[]) => boolean;
  hasAllPermissions: (permissions: PermissionName[]) => boolean;
  getPermissionLevel: (resource: ResourceType) => 'none' | 'read' | 'write' | 'manage';
  isLoading: boolean;
  error?: string;
  refresh: () => Promise<void>;
}

export interface UseRoleManagementOptions {
  include_hierarchy?: boolean;
  include_permissions?: boolean;
}

export interface UseRoleManagementResult {
  roles: Role[];
  createRole: (role: CreateRoleRequest) => Promise<Role>;
  updateRole: (id: string, updates: UpdateRoleRequest) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;
  assignRole: (assignment: AssignRoleRequest) => Promise<void>;
  revokeRole: (revocation: RevokeRoleRequest) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export interface UseRBACResult extends UsePermissionsResult {
  user: RBACUser | null;
  isAdmin: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
  roleManagement: UseRoleManagementResult;
}

// ==========================================
// EXPORT ALL TYPES
// ==========================================

// Core types
export type {
  RBACUser,
  Role,
  Permission
};

// Relationship types
export type {
  RolePermission,
  UserRole,
  RoleHierarchy,
  UserPermissionOverride
};

// Audit types
export type {
  PermissionAuditLog,
  PermissionAuditAction,
  UserPermissionCache
};

// API types
export type {
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
  RBACSummary
};

// Utility types
export type {
  PermissionName,
  PermissionMatrix,
  UserPermissionSummary
};

// Resource types
export type {
  ResourceType,
  PermissionAction,
  ResourcePermission
};

// Role types
export type {
  RoleName,
  RoleDefinition
};

// Context types
export type {
  PermissionContext,
  RoutePermission,
  ProtectedRoute
};

// Error types
export type {
  RBACError,
  RBACErrorCode
};

// Validation types
export type {
  ValidationResult,
  RoleValidationResult,
  PermissionValidationResult
};

// Configuration types
export type {
  RBACConfig
};

// Event types
export type {
  RBACEvent,
  RBACEventType,
  EventHandler
};

// Hook types
export type {
  UsePermissionsOptions,
  UsePermissionsResult,
  UseRoleManagementOptions,
  UseRoleManagementResult,
  UseRBACResult
};

// Constants
export const DEFAULT_RBAC_CONFIG: RBACConfig = {
  cache_duration: 3600, // 1 hour
  enable_audit_logging: true,
  enable_permission_caching: true,
  session_timeout: 28800, // 8 hours
  max_login_attempts: 5,
  password_policy: {
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true
  },
  permissions: {
    default_role: 'employee',
    system_roles: [
      'super_admin',
      'system_admin',
      'employee',
      'customer',
      'viewer'
    ],
    system_permissions: [
      'dashboard:read',
      'system:read',
      'users:read'
    ]
  }
};
