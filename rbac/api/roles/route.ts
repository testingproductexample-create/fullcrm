import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '../../services/rbac.service';
import { PermissionService } from '../../services/permission.service';
import { RoleService } from '../../services/role.service';

// Initialize services
const rbacService = new RBACService();
const permissionService = new PermissionService();
const roleService = new RoleService();

// GET /api/rbac/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePermissions = searchParams.get('includePermissions') === 'true';
    const includeHierarchy = searchParams.get('includeHierarchy') === 'true';
    const level = searchParams.get('level');
    const module = searchParams.get('module');

    let roles = await roleService.getAllRoles();

    // Apply filters
    if (level) {
      roles = roles.filter(role => role.level === parseInt(level));
    }

    if (module) {
      const rolePermissions = await rbacService.getAllRolePermissions();
      roles = roles.filter(role => {
        const permissions = rolePermissions[role.id] || [];
        return permissions.some(perm => perm.module === module);
      });
    }

    // Include permissions if requested
    if (includePermissions) {
      const rolePermissions = await rbacService.getAllRolePermissions();
      roles = roles.map(role => ({
        ...role,
        permissions: rolePermissions[role.id] || []
      }));
    }

    // Include hierarchy if requested
    if (includeHierarchy) {
      roles = roles.map(role => ({
        ...role,
        canAssign: await rbacService.canAssignRole('system', role.id),
        canRevoke: await rbacService.canRevokeRole('system', role.id)
      }));
    }

    return NextResponse.json({
      success: true,
      data: roles,
      count: roles.length
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch roles',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/rbac/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, level = 1, permissions = [], metadata = {} } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRoles = await roleService.getAllRoles();
    if (existingRoles.some(role => role.name === name)) {
      return NextResponse.json(
        { success: false, error: 'Role name already exists' },
        { status: 400 }
      );
    }

    // Create role
    const newRole = await roleService.createRole({
      name,
      description: description || '',
      level,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Assign permissions if provided
    if (permissions.length > 0) {
      for (const permissionId of permissions) {
        await rbacService.assignRolePermission(newRole.id, permissionId);
      }
    }

    // Log action
    await rbacService.logAction({
      userId: 'system',
      action: 'create_role',
      resource: 'role',
      resourceId: newRole.id,
      details: { name, level, permissionCount: permissions.length },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: newRole,
      message: 'Role created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create role',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}