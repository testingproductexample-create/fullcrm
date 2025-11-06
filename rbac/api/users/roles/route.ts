import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '../../services/rbac.service';
import { RoleService } from '../../services/role.service';

const rbacService = new RBACService();
const roleService = new RoleService();

// GET /api/rbac/users/roles - Get user roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const roleId = searchParams.get('roleId');
    const includePermissions = searchParams.get('includePermissions') === 'true';
    const includeUsers = searchParams.get('includeUsers') === 'true';

    if (userId) {
      // Get roles for specific user
      const userRoles = await rbacService.getUserRoles(userId);
      
      if (includePermissions) {
        const rolesWithPermissions = await Promise.all(
          userRoles.map(async (role) => {
            const permissions = await rbacService.getRolePermissions(role.id);
            return { ...role, permissions };
          })
        );
        return NextResponse.json({
          success: true,
          data: rolesWithPermissions
        });
      }

      return NextResponse.json({
        success: true,
        data: userRoles
      });
    }

    if (roleId) {
      // Get users for specific role
      const users = await rbacService.getUsersByRole(roleId);
      
      if (includeUsers) {
        const usersWithRoles = await Promise.all(
          users.map(async (user) => {
            const roles = await rbacService.getUserRoles(user.id);
            return { ...user, roles };
          })
        );
        return NextResponse.json({
          success: true,
          data: usersWithRoles
        });
      }

      return NextResponse.json({
        success: true,
        data: users
      });
    }

    // Get all user-role assignments
    const allUserRoles = await rbacService.getAllUserRoles();
    
    return NextResponse.json({
      success: true,
      data: allUserRoles,
      count: Object.keys(allUserRoles).length
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user roles',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/rbac/users/roles - Assign role to user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, roleId, assignedBy = 'system' } = body;

    // Validation
    if (!userId || !roleId) {
      return NextResponse.json(
        { success: false, error: 'userId and roleId are required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const role = await roleService.getRoleById(roleId);
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if user already has this role
    const existingUserRoles = await rbacService.getUserRoles(userId);
    if (existingUserRoles.some(r => r.id === roleId)) {
      return NextResponse.json(
        { success: false, error: 'User already has this role' },
        { status: 400 }
      );
    }

    // Assign role
    await rbacService.assignUserRole(userId, roleId, assignedBy);

    // Get updated user data
    const userRoles = await rbacService.getUserRoles(userId);
    const userPermissions = await rbacService.getUserPermissions(userId);

    // Log action
    await rbacService.logAction({
      userId: assignedBy,
      action: 'assign_role',
      resource: 'user_role',
      resourceId: `${userId}:${roleId}`,
      details: { userId, roleId, roleName: role.name },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        roleId,
        userRoles,
        userPermissions
      },
      message: 'Role assigned successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to assign role',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/rbac/users/roles - Remove role from user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const roleId = searchParams.get('roleId');
    const removedBy = searchParams.get('removedBy') || 'system';

    // Validation
    if (!userId || !roleId) {
      return NextResponse.json(
        { success: false, error: 'userId and roleId are required' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingUserRoles = await rbacService.getUserRoles(userId);
    if (!existingUserRoles.some(r => r.id === roleId)) {
      return NextResponse.json(
        { success: false, error: 'User does not have this role' },
        { status: 404 }
      );
    }

    // Get role name for logging
    const role = await roleService.getRoleById(roleId);

    // Remove role
    await rbacService.removeUserRole(userId, roleId, removedBy);

    // Get updated user data
    const userRoles = await rbacService.getUserRoles(userId);
    const userPermissions = await rbacService.getUserPermissions(userId);

    // Log action
    await rbacService.logAction({
      userId: removedBy,
      action: 'remove_role',
      resource: 'user_role',
      resourceId: `${userId}:${roleId}`,
      details: { userId, roleId, roleName: role?.name },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        roleId,
        userRoles,
        userPermissions
      },
      message: 'Role removed successfully'
    });
  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove role',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}