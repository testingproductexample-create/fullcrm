# RBAC API Documentation

This document describes all available RBAC API endpoints.

## Base URL

```
/api/rbac
```

## Authentication

All endpoints require authentication. Include the user's JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Roles Management

#### GET `/api/rbac/roles`
Get all roles with optional filtering and includes.

**Query Parameters:**
- `includePermissions=true` - Include permissions for each role
- `includeHierarchy=true` - Include hierarchy information
- `level=number` - Filter by role level
- `module=string` - Filter roles that have permissions in specific module

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "role-id",
      "name": "Admin",
      "description": "System administrator",
      "level": 10,
      "permissions": [...],
      "canAssign": true,
      "canRevoke": true
    }
  ],
  "count": 1
}
```

#### POST `/api/rbac/roles`
Create a new role.

**Request Body:**
```json
{
  "name": "Custom Role",
  "description": "Custom role description",
  "level": 5,
  "permissions": ["permission-id-1", "permission-id-2"],
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": { "id": "new-role-id", ... },
  "message": "Role created successfully"
}
```

#### GET `/api/rbac/roles/[id]`
Get specific role details.

**Query Parameters:**
- `includePermissions=true` - Include role permissions
- `includeUsers=true` - Include users with this role
- `includeHierarchy=true` - Include hierarchy information

#### PUT `/api/rbac/roles/[id]`
Update role information.

#### DELETE `/api/rbac/roles/[id]`
Delete a role.

**Query Parameters:**
- `force=true` - Force delete even if role is assigned to users

### 2. Permissions Management

#### GET `/api/rbac/permissions`
Get all permissions with optional filtering.

**Query Parameters:**
- `module=string` - Filter by module
- `resource=string` - Filter by resource
- `action=string` - Filter by action
- `group=string` - Filter by permission group
- `includeRoles=true` - Include count of roles with each permission

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "perm-id",
      "name": "users:create",
      "description": "Create new users",
      "module": "users",
      "resource": "user",
      "action": "create",
      "group": "users",
      "assignedRoles": 3
    }
  ],
  "count": 1
}
```

#### POST `/api/rbac/permissions`
Create a new permission.

**Request Body:**
```json
{
  "name": "custom:resource:action",
  "description": "Custom permission description",
  "module": "custom",
  "resource": "resource",
  "action": "action",
  "group": "custom",
  "metadata": {}
}
```

### 3. User Role Assignments

#### GET `/api/rbac/users/roles`
Get user role assignments.

**Query Parameters:**
- `userId=string` - Get roles for specific user
- `roleId=string` - Get users for specific role
- `includePermissions=true` - Include role permissions
- `includeUsers=true` - Include user information

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user-123",
      "roles": [
        {
          "id": "role-1",
          "name": "Admin",
          "permissions": [...]
        }
      ]
    }
  ]
}
```

#### POST `/api/rbac/users/roles`
Assign role to user.

**Request Body:**
```json
{
  "userId": "user-123",
  "roleId": "role-456",
  "assignedBy": "admin-user-id"
}
```

#### DELETE `/api/rbac/users/roles`
Remove role from user.

**Query Parameters:**
- `userId=string` - User ID
- `roleId=string` - Role ID
- `removedBy=string` - User who performed the removal (default: "system")

### 4. User Permissions

#### GET `/api/rbac/users/permissions`
Check user permissions or get all user permissions.

**Query Parameters:**
- `userId=string` - User ID (required)
- `permission=string` - Check specific permission
- `module=string` - Get permissions for specific module
- `includeHierarchy=true` - Include permission hierarchy

**Response for single permission check:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "permission": "users:create",
    "hasPermission": true
  }
}
```

**Response for all permissions:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "permissions": [...],
    "roles": [...],
    "permissionsByModule": {
      "users": [...],
      "billing": [...]
    },
    "totalPermissionCount": 25,
    "roleCount": 2,
    "permissionHierarchy": [...],
    "maxRoleLevel": 10
  }
}
```

#### POST `/api/rbac/users/permissions/check`
Batch permission check.

**Request Body:**
```json
{
  "userId": "user-123",
  "permissions": ["users:create", "users:delete", "billing:view"],
  "requireAll": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "requireAll": false,
    "permissionResults": [
      { "permission": "users:create", "hasPermission": true },
      { "permission": "users:delete", "hasPermission": false },
      { "permission": "billing:view", "hasPermission": true }
    ],
    "hasAllPermissions": false,
    "hasAnyPermission": true,
    "overallResult": true
  }
}
```

### 5. Audit Logs

#### GET `/api/rbac/audit`
Get audit logs with filtering and pagination.

**Query Parameters:**
- `userId=string` - Filter by user ID
- `action=string` - Filter by action type
- `resource=string` - Filter by resource type
- `startDate=ISO_DATE` - Filter from date
- `endDate=ISO_DATE` - Filter to date
- `limit=number` - Number of records (default: 100)
- `offset=number` - Skip records (default: 0)
- `sortBy=string` - Sort field (default: timestamp)
- `sortOrder=string` - Sort order: asc|desc (default: desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit-123",
      "userId": "user-456",
      "action": "assign_role",
      "resource": "user_role",
      "resourceId": "user-456:role-123",
      "details": { "userId": "user-456", "roleId": "role-123" },
      "success": true,
      "timestamp": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST `/api/rbac/audit`
Create audit log entry.

**Request Body:**
```json
{
  "userId": "user-123",
  "action": "custom_action",
  "resource": "custom_resource",
  "resourceId": "resource-456",
  "details": { "key": "value" },
  "success": true,
  "errorMessage": null
}
```

#### DELETE `/api/rbac/audit`
Clean up old audit logs.

**Query Parameters:**
- `olderThan=number` - Number of days (required)
- `dryRun=true` - Preview without actually deleting

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 50,
    "cutoffDate": "2023-09-01T00:00:00.000Z"
  },
  "message": "Deleted 50 audit logs older than 90 days"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- **Roles/Permissions endpoints**: 100 requests per minute per user
- **User role assignments**: 50 requests per minute per user
- **Permission checks**: 200 requests per minute per user
- **Audit logs**: 20 requests per minute per user

## Examples

### Check if user can create users
```bash
curl -X GET "https://api.example.com/api/rbac/users/permissions?userId=user-123&permission=users:create" \
  -H "Authorization: Bearer <token>"
```

### Assign role to user
```bash
curl -X POST "https://api.example.com/api/rbac/users/roles" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "roleId": "admin-role-456",
    "assignedBy": "current-user-id"
  }'
```

### Get all roles with permissions
```bash
curl -X GET "https://api.example.com/api/rbac/roles?includePermissions=true" \
  -H "Authorization: Bearer <token>"
```

## SDK Usage

The RBAC system includes TypeScript types for all API responses and requests. Import the types and use them for type-safe API integration:

```typescript
import { Role, Permission, User } from './types/rbac.types';

// Type-safe API calls
const response = await fetch('/api/rbac/roles', {
  headers: { Authorization: `Bearer ${token}` }
});
const { data: roles } = await response.json() as { data: Role[] };
```