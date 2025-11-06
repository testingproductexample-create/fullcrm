import { NextRequest, NextResponse } from 'next/server';
import { PermissionService } from '../../services/permission.service';
import { RBACService } from '../../services/rbac.service';

const permissionService = new PermissionService();
const rbacService = new RBACService();

// GET /api/rbac/permissions - Get all permissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module');
    const resource = searchParams.get('resource');
    const action = searchParams.get('action');
    const group = searchParams.get('group');
    const includeRoles = searchParams.get('includeRoles') === 'true';

    let permissions = await permissionService.getAllPermissions();

    // Apply filters
    if (module) {
      permissions = permissions.filter(perm => perm.module === module);
    }
    if (resource) {
      permissions = permissions.filter(perm => perm.resource === resource);
    }
    if (action) {
      permissions = permissions.filter(perm => perm.action === action);
    }
    if (group) {
      permissions = permissions.filter(perm => perm.group === group);
    }

    // Include roles if requested
    if (includeRoles) {
      const rolePermissions = await rbacService.getAllRolePermissions();
      permissions = permissions.map(permission => ({
        ...permission,
        assignedRoles: Object.keys(rolePermissions).filter(roleId => 
          rolePermissions[roleId]?.some(p => p.id === permission.id)
        ).length
      }));
    }

    return NextResponse.json({
      success: true,
      data: permissions,
      count: permissions.length
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch permissions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/rbac/permissions - Create new permission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, module, resource, action, group, metadata = {} } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Permission name is required' },
        { status: 400 }
      );
    }

    if (!module || !resource || !action) {
      return NextResponse.json(
        { success: false, error: 'Module, resource, and action are required' },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const existingPermissions = await permissionService.getAllPermissions();
    if (existingPermissions.some(perm => perm.name === name)) {
      return NextResponse.json(
        { success: false, error: 'Permission name already exists' },
        { status: 400 }
      );
    }

    // Create permission
    const newPermission = await permissionService.createPermission({
      name,
      description: description || '',
      module,
      resource,
      action,
      group: group || module,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Log action
    await rbacService.logAction({
      userId: 'system',
      action: 'create_permission',
      resource: 'permission',
      resourceId: newPermission.id,
      details: { name, module, resource, action },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: newPermission,
      message: 'Permission created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create permission',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}