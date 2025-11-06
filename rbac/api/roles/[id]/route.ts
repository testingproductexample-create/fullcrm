import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '../../services/role.service';
import { RBACService } from '../../services/rbac.service';

const roleService = new RoleService();
const rbacService = new RBACService();

// GET /api/rbac/roles/[id] - Get specific role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;
    const { searchParams } = new URL(request.url);
    const includePermissions = searchParams.get('includePermissions') === 'true';
    const includeUsers = searchParams.get('includeUsers') === 'true';
    const includeHierarchy = searchParams.get('includeHierarchy') === 'true';

    const role = await roleService.getRoleById(roleId);
    
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    const result: any = { ...role };

    // Include permissions if requested
    if (includePermissions) {
      const permissions = await rbacService.getRolePermissions(roleId);
      result.permissions = permissions;
    }

    // Include users if requested
    if (includeUsers) {
      const users = await rbacService.getUsersByRole(roleId);
      result.users = users;
    }

    // Include hierarchy info if requested
    if (includeHierarchy) {
      result.canAssign = await rbacService.canAssignRole('system', roleId);
      result.canRevoke = await rbacService.canRevokeRole('system', roleId);
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch role',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/rbac/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;
    const body = await request.json();
    const { name, description, level, metadata } = body;

    // Check if role exists
    const existingRole = await roleService.getRoleById(roleId);
    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Update role
    const updatedRole = await roleService.updateRole(roleId, {
      name,
      description,
      level,
      metadata,
      updatedAt: new Date()
    });

    // Log action
    await rbacService.logAction({
      userId: 'system',
      action: 'update_role',
      resource: 'role',
      resourceId: roleId,
      details: { changes: body },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update role',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/rbac/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Check if role exists
    const existingRole = await roleService.getRoleById(roleId);
    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if role is assigned to users
    if (!force) {
      const users = await rbacService.getUsersByRole(roleId);
      if (users.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Role is assigned to users',
            details: `Cannot delete role with ${users.length} assigned users. Use force=true to override.`
          },
          { status: 400 }
        );
      }
    }

    // Remove all role assignments if force deleting
    if (force) {
      const users = await rbacService.getUsersByRole(roleId);
      for (const user of users) {
        await rbacService.removeUserRole(user.id, roleId);
      }
    }

    // Delete role
    await roleService.deleteRole(roleId);

    // Log action
    await rbacService.logAction({
      userId: 'system',
      action: 'delete_role',
      resource: 'role',
      resourceId: roleId,
      details: { roleName: existingRole.name, force },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete role',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}