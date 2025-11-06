// RBAC Role Definitions
// Comprehensive role definitions with permissions and hierarchy

import { 
  RoleDefinition, 
  RoleName, 
  PermissionName, 
  ResourceType,
  PermissionAction 
} from '../types/rbac.types';

// ==========================================
// ROLE DEFINITIONS
// ==========================================

/**
 * Complete role definitions for all 15 predefined roles
 * Each role includes display name, description, level, default permissions,
 * inheritance capabilities, and assignment capabilities
 */
export const ROLE_DEFINITIONS: Record<RoleName, RoleDefinition> = {
  super_admin: {
    name: 'super_admin',
    display_name: 'Super Administrator',
    description: 'Full system access with all permissions. Can perform any action on any resource.',
    level: 0,
    default_permissions: generateAllPermissions(),
    can_inherit_from: [],
    can_assign_to: [
      'system_admin', 'operations_manager', 'hr_manager', 'finance_manager',
      'sales_manager', 'designer', 'customer_service', 'accountant',
      'compliance_officer', 'department_manager', 'team_lead',
      'employee', 'customer', 'viewer'
    ],
    metadata: {
      can_bypass_rls: true,
      can_manage_system_settings: true,
      can_view_all_data: true,
      can_modify_permissions: true,
      can_create_roles: true,
      can_delete_users: true
    }
  },

  system_admin: {
    name: 'system_admin',
    display_name: 'System Administrator',
    description: 'System administration and management. Can manage users, roles, and system settings.',
    level: 1,
    default_permissions: [
      // System management
      'system:read', 'system:write', 'system:manage', 'system:backup', 'system:restore',
      'users:read', 'users:write', 'users:delete', 'users:manage', 'users:roles', 'users:permissions',
      'dashboard:read', 'dashboard:write', 'dashboard:manage',
      'audit:read', 'audit:manage', 'audit:export', 'audit:reports',
      'logging:read', 'logging:manage',
      
      // All module access
      'appointments:read', 'appointments:write', 'appointments:delete', 'appointments:manage', 'appointments:schedule', 'appointments:cancel', 'appointments:reschedule', 'appointments:availability',
      'billing:read', 'billing:write', 'billing:delete', 'billing:manage', 'billing:invoices', 'billing:payments', 'billing:refunds', 'billing:reports', 'billing:export',
      'communication:read', 'communication:write', 'communication:manage', 'communication:email', 'communication:sms', 'communication:whatsapp', 'communication:video', 'communication:bulk', 'communication:templates',
      'compliance:read', 'compliance:write', 'compliance:manage', 'compliance:audit', 'compliance:regulatory', 'compliance:reports', 'compliance:violations',
      'customers:read', 'customers:write', 'customers:delete', 'customers:manage', 'customers:profile', 'customers:segments', 'customers:preferences', 'customers:notes', 'customers:loyalty',
      'designs:read', 'designs:write', 'designs:delete', 'designs:manage', 'designs:approval', 'designs:variants', 'designs:media', 'designs:browse', 'designs:fabrics',
      'documents:read', 'documents:write', 'documents:delete', 'documents:manage', 'documents:upload', 'documents:share', 'documents:templates', 'documents:categories', 'documents:approvals',
      'employees:read', 'employees:write', 'employees:delete', 'employees:manage', 'employees:directory', 'employees:profile', 'employees:skills', 'employees:training', 'employees:reviews', 'employees:emergency',
      'finance:read', 'finance:write', 'finance:delete', 'finance:manage', 'finance:budgets', 'finance:expenses', 'finance:revenue', 'finance:transactions', 'finance:reports',
      'measurements:read', 'measurements:write', 'measurements:delete', 'measurements:manage', 'measurements:fitting', 'measurements:alterations', 'measurements:photos', 'measurements:notes',
      'orders:read', 'orders:write', 'orders:delete', 'orders:manage', 'orders:create', 'orders:status', 'orders:templates',
      'payroll:read', 'payroll:write', 'payroll:delete', 'payroll:manage', 'payroll:processing', 'payroll:calculations', 'payroll:commissions', 'payroll:structures', 'payroll:payslips',
      'security:read', 'security:write', 'security:manage', 'security:authentication', 'security:monitoring', 'security:compliance',
      'visa_compliance:read', 'visa_compliance:write', 'visa_compliance:manage', 'visa_compliance:visas', 'visa_compliance:violations', 'visa_compliance:wps', 'visa_compliance:regulatory',
      'workflow:read', 'workflow:write', 'workflow:delete', 'workflow:manage', 'workflow:templates', 'workflow:analytics', 'workflow:automation',
      'workload:read', 'workload:write', 'workload:manage', 'workload:assignments', 'workload:monitoring',
      'analytics:read', 'analytics:write', 'analytics:manage', 'analytics:export', 'analytics:dashboards',
      'mobile:read', 'mobile:write', 'mobile:manage', 'mobile:offline',
      'offline:read', 'offline:sync', 'offline:manage'
    ],
    can_inherit_from: ['super_admin'],
    can_assign_to: [
      'operations_manager', 'hr_manager', 'finance_manager', 'sales_manager',
      'designer', 'customer_service', 'accountant', 'compliance_officer',
      'department_manager', 'team_lead', 'employee', 'customer', 'viewer'
    ],
    metadata: {
      can_manage_users: true,
      can_manage_roles: true,
      can_view_audit_logs: true,
      can_manage_system_settings: true
    }
  },

  operations_manager: {
    name: 'operations_manager',
    display_name: 'Operations Manager',
    description: 'Day-to-day operations management. Can manage workflows, appointments, and general operations.',
    level: 2,
    default_permissions: [
      'dashboard:read', 'dashboard:write', 'dashboard:manage',
      'appointments:read', 'appointments:write', 'appointments:delete', 'appointments:manage', 'appointments:schedule', 'appointments:cancel', 'appointments:reschedule', 'appointments:availability',
      'orders:read', 'orders:write', 'orders:delete', 'orders:manage', 'orders:create', 'orders:status', 'orders:templates',
      'workflow:read', 'workflow:write', 'workflow:delete', 'workflow:manage', 'workflow:templates', 'workflow:analytics', 'workflow:automation',
      'workload:read', 'workload:write', 'workload:manage', 'workload:assignments', 'workload:monitoring',
      'employees:read', 'employees:directory',
      'customers:read', 'customers:manage', 'customers:profile',
      'designs:read', 'designs:manage', 'designs:browse',
      'measurements:read', 'measurements:manage', 'measurements:fitting',
      'analytics:read', 'analytics:write', 'analytics:manage', 'analytics:export', 'analytics:dashboards',
      'documents:read', 'documents:manage', 'documents:share',
      'communication:read', 'communication:write', 'communication:manage', 'communication:bulk'
    ],
    can_inherit_from: ['system_admin', 'super_admin'],
    can_assign_to: [
      'department_manager', 'team_lead', 'designer', 'customer_service', 'employee'
    ],
    metadata: {
      can_manage_operations: true,
      can_manage_workflows: true,
      can_manage_workload: true
    }
  },

  hr_manager: {
    name: 'hr_manager',
    display_name: 'HR Manager',
    description: 'Human resources management. Can manage employees, payroll, and HR processes.',
    level: 2,
    default_permissions: [
      'dashboard:read', 'dashboard:write',
      'employees:read', 'employees:write', 'employees:delete', 'employees:manage', 'employees:directory', 'employees:profile', 'employees:skills', 'employees:training', 'employees:reviews', 'employees:emergency',
      'payroll:read', 'payroll:write', 'payroll:delete', 'payroll:manage', 'payroll:processing', 'payroll:calculations', 'payroll:commissions', 'payroll:structures', 'payroll:payslips',
      'workload:read', 'workload:write', 'workload:manage',
      'analytics:read', 'analytics:write', 'analytics:manage',
      'documents:read', 'documents:write', 'documents:manage', 'documents:upload', 'documents:share',
      'users:read', 'users:write', 'users:manage'
    ],
    can_inherit_from: ['system_admin', 'super_admin'],
    can_assign_to: [
      'department_manager', 'team_lead', 'employee'
    ],
    metadata: {
      can_manage_employees: true,
      can_manage_payroll: true,
      can_perform_hr_functions: true
    }
  },

  finance_manager: {
    name: 'finance_manager',
    display_name: 'Finance Manager',
    description: 'Financial operations management. Can manage billing, finance, and accounting processes.',
    level: 2,
    default_permissions: [
      'dashboard:read', 'dashboard:write',
      'finance:read', 'finance:write', 'finance:delete', 'finance:manage', 'finance:budgets', 'finance:expenses', 'finance:revenue', 'finance:transactions', 'finance:reports',
      'billing:read', 'billing:write', 'billing:delete', 'billing:manage', 'billing:invoices', 'billing:payments', 'billing:refunds', 'billing:reports', 'billing:export',
      'payroll:read', 'payroll:manage',
      'analytics:read', 'analytics:write', 'analytics:manage', 'analytics:export',
      'orders:read', 'orders:manage',
      'customers:read', 'customers:manage'
    ],
    can_inherit_from: ['system_admin', 'super_admin'],
    can_assign_to: [
      'accountant', 'employee'
    ],
    metadata: {
      can_manage_finance: true,
      can_manage_billing: true,
      can_approve_financial_decisions: true
    }
  },

  sales_manager: {
    name: 'sales_manager',
    display_name: 'Sales Manager',
    description: 'Sales and customer management. Can manage customers, orders, and sales processes.',
    level: 2,
    default_permissions: [
      'dashboard:read', 'dashboard:write',
      'customers:read', 'customers:write', 'customers:delete', 'customers:manage', 'customers:profile', 'customers:segments', 'customers:preferences', 'customers:notes', 'customers:loyalty',
      'appointments:read', 'appointments:write', 'appointments:schedule', 'appointments:cancel', 'appointments:reschedule',
      'orders:read', 'orders:write', 'orders:create', 'orders:status', 'orders:manage',
      'communication:read', 'communication:write', 'communication:manage', 'communication:email', 'communication:sms', 'communication:whatsapp', 'communication:bulk',
      'designs:read', 'designs:browse', 'designs:manage',
      'analytics:read', 'analytics:write', 'analytics:manage',
      'documents:read', 'documents:share'
    ],
    can_inherit_from: ['system_admin', 'super_admin'],
    can_assign_to: [
      'customer_service', 'designer', 'employee'
    ],
    metadata: {
      can_manage_sales: true,
      can_manage_customers: true,
      can_view_sales_analytics: true
    }
  },

  designer: {
    name: 'designer',
    display_name: 'Designer',
    description: 'Design and creative work. Can manage designs, fabrics, and creative processes.',
    level: 3,
    default_permissions: [
      'dashboard:read',
      'designs:read', 'designs:write', 'designs:delete', 'designs:manage', 'designs:approval', 'designs:variants', 'designs:media', 'designs:browse', 'designs:fabrics',
      'measurements:read', 'measurements:write', 'measurements:manage', 'measurements:fitting', 'measurements:alterations', 'measurements:photos', 'measurements:notes',
      'customers:read', 'customers:profile', 'customers:preferences',
      'orders:read', 'orders:manage',
      'appointments:read', 'appointments:write', 'appointments:schedule',
      'analytics:read',
      'documents:read', 'documents:write', 'documents:manage', 'documents:upload', 'documents:share'
    ],
    can_inherit_from: ['operations_manager', 'sales_manager', 'super_admin'],
    can_assign_to: ['employee'],
    metadata: {
      can_manage_designs: true,
      can_manage_measurements: true,
      can_approve_designs: true
    }
  },

  customer_service: {
    name: 'customer_service',
    display_name: 'Customer Service',
    description: 'Customer support and service. Can manage customer communications and support.',
    level: 3,
    default_permissions: [
      'dashboard:read',
      'customers:read', 'customers:write', 'customers:manage', 'customers:profile', 'customers:notes', 'customers:preferences',
      'appointments:read', 'appointments:write', 'appointments:schedule', 'appointments:cancel', 'appointments:reschedule',
      'orders:read', 'orders:status',
      'communication:read', 'communication:write', 'communication:manage', 'communication:email', 'communication:sms', 'communication:whatsapp',
      'designs:read', 'designs:browse',
      'measurements:read',
      'analytics:read'
    ],
    can_inherit_from: ['sales_manager', 'super_admin'],
    can_assign_to: ['employee'],
    metadata: {
      can_provide_customer_support: true,
      can_schedule_appointments: true,
      can_update_customer_info: true
    }
  },

  accountant: {
    name: 'accountant',
    display_name: 'Accountant',
    description: 'Financial and accounting tasks. Can manage billing, finance, and accounting processes.',
    level: 3,
    default_permissions: [
      'dashboard:read',
      'billing:read', 'billing:write', 'billing:delete', 'billing:manage', 'billing:invoices', 'billing:payments', 'billing:refunds', 'billing:reports', 'billing:export',
      'finance:read', 'finance:write', 'finance:manage', 'finance:budgets', 'finance:expenses', 'finance:revenue', 'finance:transactions', 'finance:reports',
      'payroll:read', 'payroll:manage',
      'orders:read',
      'customers:read', 'customers:manage',
      'analytics:read', 'analytics:write', 'analytics:manage',
      'documents:read', 'documents:manage', 'documents:export'
    ],
    can_inherit_from: ['finance_manager', 'super_admin'],
    can_assign_to: ['employee'],
    metadata: {
      can_manage_accounting: true,
      can_generate_financial_reports: true,
      can_process_payments: true
    }
  },

  compliance_officer: {
    name: 'compliance_officer',
    display_name: 'Compliance Officer',
    description: 'Compliance and legal oversight. Can manage compliance processes and regulatory requirements.',
    level: 3,
    default_permissions: [
      'dashboard:read',
      'compliance:read', 'compliance:write', 'compliance:manage', 'compliance:audit', 'compliance:regulatory', 'compliance:reports', 'compliance:violations',
      'visa_compliance:read', 'visa_compliance:write', 'visa_compliance:manage', 'visa_compliance:visas', 'visa_compliance:violations', 'visa_compliance:wps', 'visa_compliance:regulatory',
      'audit:read', 'audit:manage', 'audit:export', 'audit:reports',
      'security:read', 'security:monitoring', 'security:compliance',
      'employees:read', 'employees:manage',
      'analytics:read', 'analytics:write', 'analytics:manage',
      'documents:read', 'documents:write', 'documents:manage', 'documents:approvals'
    ],
    can_inherit_from: ['system_admin', 'super_admin'],
    can_assign_to: ['employee'],
    metadata: {
      can_manage_compliance: true,
      can_conduct_audits: true,
      can_manage_regulatory_requirements: true
    }
  },

  department_manager: {
    name: 'department_manager',
    display_name: 'Department Manager',
    description: 'Department-level management. Can manage team members and department operations.',
    level: 4,
    default_permissions: [
      'dashboard:read',
      'employees:read', 'employees:manage', 'employees:directory', 'employees:profile',
      'workload:read', 'workload:write', 'workload:manage', 'workload:assignments',
      'workflow:read', 'workflow:manage',
      'orders:read',
      'appointments:read',
      'analytics:read', 'analytics:write',
      'documents:read', 'documents:manage'
    ],
    can_inherit_from: ['operations_manager', 'hr_manager', 'finance_manager', 'sales_manager', 'super_admin'],
    can_assign_to: ['team_lead', 'employee'],
    metadata: {
      can_manage_department: true,
      can_manage_team_members: true,
      can_view_department_analytics: true
    }
  },

  team_lead: {
    name: 'team_lead',
    display_name: 'Team Lead',
    description: 'Team supervision and coordination. Can coordinate team activities and monitor workload.',
    level: 4,
    default_permissions: [
      'dashboard:read',
      'workload:read', 'workload:write', 'workload:assignments',
      'employees:read', 'employees:directory',
      'workflow:read',
      'orders:read',
      'appointments:read',
      'analytics:read',
      'documents:read'
    ],
    can_inherit_from: ['department_manager', 'super_admin'],
    can_assign_to: ['employee'],
    metadata: {
      can_manage_team: true,
      can_assign_tasks: true,
      can_monitor_workload: true
    }
  },

  employee: {
    name: 'employee',
    display_name: 'Employee',
    description: 'Standard employee access. Can perform job-related tasks and view relevant information.',
    level: 5,
    default_permissions: [
      'dashboard:read',
      'employees:read', 'employees:directory',
      'appointments:read', 'appointments:schedule',
      'orders:read',
      'customers:read',
      'documents:read', 'documents:write',
      'measurements:read',
      'analytics:read',
      'mobile:read', 'mobile:offline'
    ],
    can_inherit_from: [
      'team_lead', 'department_manager', 'operations_manager', 'hr_manager', 
      'finance_manager', 'sales_manager', 'designer', 'customer_service', 
      'accountant', 'compliance_officer', 'super_admin'
    ],
    can_assign_to: [],
    metadata: {
      can_perform_job_functions: true,
      can_access_own_data: true
    }
  },

  customer: {
    name: 'customer',
    display_name: 'Customer',
    description: 'Customer portal access. Can view their own information and interact with services.',
    level: 6,
    default_permissions: [
      'dashboard:read',
      'customers:read',
      'appointments:read', 'appointments:schedule', 'appointments:cancel',
      'orders:read',
      'measurements:read',
      'documents:read',
      'designs:read', 'designs:browse',
      'communication:read', 'communication:write',
      'mobile:read', 'mobile:offline'
    ],
    can_inherit_from: ['super_admin'],
    can_assign_to: [],
    metadata: {
      can_access_own_data_only: true,
      can_book_appointments: true,
      can_view_own_orders: true
    }
  },

  viewer: {
    name: 'viewer',
    display_name: 'Viewer',
    description: 'Read-only access. Can view information but cannot make changes.',
    level: 7,
    default_permissions: [
      'dashboard:read',
      'appointments:read',
      'orders:read',
      'customers:read',
      'employees:read',
      'analytics:read',
      'designs:read',
      'documents:read',
      'measurements:read'
    ],
    can_inherit_from: ['super_admin'],
    can_assign_to: [],
    metadata: {
      read_only_access: true,
      can_view_reports: true
    }
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate all possible permissions for all resources
 * @returns Array of all permission names
 */
function generateAllPermissions(): PermissionName[] {
  const resources: ResourceType[] = [
    'dashboard', 'appointments', 'billing', 'communication', 'compliance',
    'customers', 'designs', 'documents', 'employees', 'finance', 'measurements',
    'orders', 'payroll', 'security', 'visa_compliance', 'workflow', 'workload',
    'analytics', 'mobile', 'offline', 'users', 'system', 'audit', 'logging'
  ];

  const actions: PermissionAction[] = [
    'read', 'write', 'delete', 'manage', 'create', 'update', 'approve', 'reject',
    'export', 'import', 'schedule', 'cancel', 'reschedule', 'send', 'receive',
    'upload', 'download', 'share', 'assign', 'unassign', 'activate', 'deactivate'
  ];

  const permissions: PermissionName[] = [];

  resources.forEach(resource => {
    actions.forEach(action => {
      permissions.push(`${resource}:${action}` as PermissionName);
    });
  });

  return permissions;
}

/**
 * Get role definition by name
 * @param roleName - Name of the role
 * @returns Role definition or undefined
 */
export function getRoleDefinition(roleName: RoleName): RoleDefinition | undefined {
  return ROLE_DEFINITIONS[roleName];
}

/**
 * Get all role definitions
 * @returns All role definitions
 */
export function getAllRoleDefinitions(): RoleDefinition[] {
  return Object.values(ROLE_DEFINITIONS);
}

/**
 * Get roles by level
 * @param level - Level to filter by
 * @returns Array of roles at the specified level
 */
export function getRolesByLevel(level: number): RoleDefinition[] {
  return Object.values(ROLE_DEFINITIONS).filter(role => role.level === level);
}

/**
 * Get roles that can be assigned to a user with a specific role
 * @param userRole - Role of the user making the assignment
 * @returns Array of assignable roles
 */
export function getAssignableRoles(userRole: RoleName): RoleDefinition[] {
  const roleDef = getRoleDefinition(userRole);
  if (!roleDef) return [];

  return Object.values(ROLE_DEFINITIONS).filter(role => 
    roleDef.can_assign_to.includes(role.name)
  );
}

/**
 * Get roles that a user with a specific role can inherit from
 * @param roleName - Role to get parents for
 * @returns Array of parent role definitions
 */
export function getParentRoles(roleName: RoleName): RoleDefinition[] {
  const roleDef = getRoleDefinition(roleName);
  if (!roleDef) return [];

  return roleDef.can_inherit_from
    .map(parentName => getRoleDefinition(parentName))
    .filter((parent): parent is RoleDefinition => parent !== undefined);
}

/**
 * Get the maximum level (highest privilege) for a user based on their roles
 * @param userRoles - Array of user roles
 * @returns Maximum level (0 = highest privilege)
 */
export function getMaximumUserLevel(userRoles: RoleName[]): number {
  if (userRoles.length === 0) return 999; // No roles

  return Math.min(...userRoles.map(roleName => {
    const roleDef = getRoleDefinition(roleName);
    return roleDef ? roleDef.level : 999;
  }));
}

/**
 * Check if a role can inherit from another role
 * @param childRole - Child role name
 * @param parentRole - Parent role name
 * @returns Boolean indicating if inheritance is possible
 */
export function canInheritFrom(childRole: RoleName, parentRole: RoleName): boolean {
  const childDef = getRoleDefinition(childRole);
  return childDef ? childDef.can_inherit_from.includes(parentRole) : false;
}

/**
 * Get all permissions for a specific role
 * @param roleName - Name of the role
 * @returns Array of permission names
 */
export function getRolePermissions(roleName: RoleName): PermissionName[] {
  const roleDef = getRoleDefinition(roleName);
  return roleDef ? roleDef.default_permissions : [];
}

/**
 * Get roles sorted by level (highest privilege first)
 * @returns Array of role definitions sorted by level
 */
export function getRolesSortedByLevel(): RoleDefinition[] {
  return Object.values(ROLE_DEFINITIONS).sort((a, b) => a.level - b.level);
}

/**
 * Check if a role is a system role
 * @param roleName - Name of the role
 * @returns Boolean indicating if it's a system role
 */
export function isSystemRole(roleName: RoleName): boolean {
  const systemRoles: RoleName[] = [
    'super_admin', 'system_admin', 'employee', 'customer', 'viewer'
  ];
  return systemRoles.includes(roleName);
}

/**
 * Get the admin roles
 * @returns Array of admin role definitions
 */
export function getAdminRoles(): RoleDefinition[] {
  return Object.values(ROLE_DEFINITIONS).filter(role => 
    role.name === 'super_admin' || role.name === 'system_admin'
  );
}

/**
 * Get roles that can manage users
 * @returns Array of roles that can manage users
 */
export function getUserManagementRoles(): RoleDefinition[] {
  return Object.values(ROLE_DEFINITIONS).filter(role => 
    role.can_assign_to.includes('employee') || 
    role.can_assign_to.includes('customer') ||
    role.metadata?.can_manage_users
  );
}

// ==========================================
// EXPORT ALL
// ==========================================

export {
  ROLE_DEFINITIONS,
  getRoleDefinition,
  getAllRoleDefinitions,
  getRolesByLevel,
  getAssignableRoles,
  getParentRoles,
  getMaximumUserLevel,
  canInheritFrom,
  getRolePermissions,
  getRolesSortedByLevel,
  isSystemRole,
  getAdminRoles,
  getUserManagementRoles
};
