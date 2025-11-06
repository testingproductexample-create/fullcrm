# Role-Based Access Control (RBAC) System

## Overview

This comprehensive RBAC system provides granular permissions management for all 23+ existing systems in the CRM application. It includes 10+ predefined roles with module-specific permissions, permission management interface, and middleware for route protection.

## System Coverage

### Core Modules (23+ Systems)
1. **Dashboard** - Main dashboard and overview
2. **Appointments** - Appointment scheduling and management
3. **Billing** - Invoice management and payment processing
4. **Communication** - Customer communications and messaging
5. **Compliance** - Legal and regulatory compliance
6. **Customers** - Customer relationship management
7. **Designs** - Design catalog and approval workflows
8. **Documents** - Document management and sharing
9. **Employees** - Employee management and HR
10. **Finance** - Financial management and reporting
11. **Measurements** - Customer measurements and fitting
12. **Orders** - Order management and processing
13. **Payroll** - Payroll processing and management
14. **Security** - Security and authentication
15. **Visa Compliance** - Immigration and work permit compliance
16. **Workflow** - Business process automation
17. **Workload** - Task and workload management
18. **Analytics** - Reporting and analytics
19. **Mobile** - Mobile application features
20. **Offline** - Offline functionality
21. **User Management** - User and role administration
22. **System Settings** - System configuration
23. **Audit & Logging** - Audit trails and system logs

### Predefined Roles
1. **Super Admin** - Full system access
2. **System Admin** - System administration
3. **HR Manager** - Human resources management
4. **Finance Manager** - Financial operations
5. **Operations Manager** - Day-to-day operations
6. **Sales Manager** - Sales and customer management
7. **Designer** - Design and creative work
8. **Customer Service** - Customer support
9. **Employee** - Standard employee access
10. **Customer** - Customer portal access
11. **Accountant** - Financial and accounting
12. **Compliance Officer** - Compliance and legal
13. **Department Manager** - Department-level management
14. **Team Lead** - Team supervision
15. **Viewer** - Read-only access

## Features

- **Granular Permissions**: Module-level and action-level permissions
- **Dynamic Role Assignment**: Flexible role-to-user assignment
- **Route Protection Middleware**: Automatic route access control
- **Permission Matrix**: Visual permission management interface
- **Audit Logging**: Complete access and permission change tracking
- **Hierarchical Permissions**: Role inheritance and hierarchy
- **Real-time Permission Checking**: Live permission validation

## File Structure

```
rbac/
├── README.md                           # This documentation
├── database/
│   ├── schema.sql                      # Database schema for RBAC
│   ├── seed_data.sql                   # Default roles and permissions
│   └── rls_policies.sql                # Row Level Security policies
├── middleware/
│   ├── auth.ts                         # Authentication middleware
│   ├── permissions.ts                  # Permission checking middleware
│   └── route-protector.ts              # Route protection middleware
├── services/
│   ├── permission.service.ts           # Permission management service
│   ├── role.service.ts                 # Role management service
│   └── rbac.service.ts                 # Main RBAC service
├── utils/
│   ├── permissions.ts                  # Permission utilities
│   ├── roles.ts                        # Role definitions
│   └── validation.ts                   # Permission validation
├── components/
│   ├── PermissionMatrix.tsx            # Permission matrix component
│   ├── RoleManager.tsx                 # Role management component
│   ├── UserRoleAssignment.tsx          # User role assignment
│   └── PermissionChecker.tsx           # Permission checking component
├── hooks/
│   ├── usePermissions.ts               # Permission hook
│   ├── useRoles.ts                     # Role management hook
│   └── useRBAC.ts                      # Main RBAC hook
├── types/
│   ├── rbac.types.ts                   # RBAC TypeScript types
│   ├── permission.types.ts             # Permission types
│   └── role.types.ts                   # Role types
└── examples/
    ├── usage-examples.ts               # Usage examples
    └── integration-examples.ts         # Integration examples
```

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Database Migrations**
   ```bash
   # Apply RBAC schema
   psql -f database/schema.sql
   # Seed default data
   psql -f database/seed_data.sql
   ```

3. **Setup Middleware**
   ```typescript
   import { withPermission } from './middleware/permissions';
   
   // Protect routes
   app.use('/api/secure', withPermission('billing:read'));
   ```

4. **Use in Components**
   ```typescript
   import { usePermissions } from './hooks/usePermissions';
   
   function SecureComponent() {
     const { hasPermission } = usePermissions();
     
     if (!hasPermission('finance:read')) {
       return <AccessDenied />;
     }
     
     return <FinancialData />;
   }
   ```

## Architecture

### Permission Model
- **Resource**: The system/module being accessed (e.g., 'billing', 'employees')
- **Action**: The operation being performed (e.g., 'read', 'write', 'delete')
- **Permission**: Combined resource and action (e.g., 'billing:read')

### Role Hierarchy
```
Super Admin
├── System Admin
├── Operations Manager
│   ├── Department Manager
│   │   └── Team Lead
│   └── Employee
├── Finance Manager
│   └── Accountant
├── HR Manager
└── Sales Manager
    └── Customer Service
```

### Permission Inheritance
Roles can inherit permissions from parent roles, with the ability to override or extend permissions.

## API Endpoints

- `GET /api/rbac/permissions` - Get all permissions
- `GET /api/rbac/roles` - Get all roles
- `POST /api/rbac/roles` - Create new role
- `PUT /api/rbac/roles/:id` - Update role
- `DELETE /api/rbac/roles/:id` - Delete role
- `GET /api/rbac/user-permissions/:userId` - Get user permissions
- `POST /api/rbac/assign-role` - Assign role to user
- `DELETE /api/rbac/remove-role` - Remove role from user

## Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Token Validation**: Secure token-based authentication
- **Permission Caching**: Optimized permission checking
- **Audit Logging**: Complete access tracking
- **Session Management**: Secure session handling

## Testing

```bash
# Run RBAC tests
npm test -- --testPathPattern=rbac

# Test permission matrix
npm run test:permissions

# Test role assignments
npm run test:roles
```

## Monitoring

- **Access Logs**: Track all permission checks
- **Permission Changes**: Monitor role/permission modifications
- **Failed Access Attempts**: Alert on unauthorized access
- **Performance Metrics**: Monitor permission check performance

## Support

For issues or questions:
1. Check the documentation in each component
2. Review the usage examples
3. Contact the development team
