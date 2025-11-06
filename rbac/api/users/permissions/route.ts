import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '../../services/rbac.service';

const rbacService = new RBACService();

// GET /api/rbac/users/permissions - Check user permissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const permission = searchParams.get('permission');
    const module = searchParams.get('module');
    const includeHierarchy = searchParams.get('includeHierarchy') === 'true';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    if (permission) {
      // Check single permission
      const hasPermission = await rbacService.hasPermission(userId, permission);
      
      return NextResponse.json({
        success: true,
        data: {
          userId,
          permission,
          hasPermission
        }
      });
    }

    if (module) {
      // Get all permissions for a module
      const userPermissions = await rbacService.getUserPermissions(userId);
      const modulePermissions = userPermissions.filter(p => p.module === module);

      return NextResponse.json({
        success: true,
        data: {
          userId,
          module,
          permissions: modulePermissions,
          permissionCount: modulePermissions.length
        }
      });
    }

    // Get all user permissions
    const userPermissions = await rbacService.getUserPermissions(userId);
    const userRoles = await rbacService.getUserRoles(userId);

    // Group permissions by module
    const permissionsByModule = userPermissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof userPermissions>);

    const result: any = {
      userId,
      permissions: userPermissions,
      roles: userRoles,
      permissionsByModule,
      totalPermissionCount: userPermissions.length,
      roleCount: userRoles.length
    };

    // Include hierarchy if requested
    if (includeHierarchy) {
      result.permissionHierarchy = await rbacService.getPermissionHierarchy(userId);
      result.maxRoleLevel = userRoles.length > 0 
        ? Math.max(...userRoles.map(r => r.level || 0))
        : 0;
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user permissions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/rbac/users/permissions/check - Batch permission check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, permissions, requireAll = false } = body;

    // Validation
    if (!userId || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'userId and permissions array are required' },
        { status: 400 }
      );
    }

    // Check permissions
    const permissionResults = await Promise.all(
      permissions.map(async (permission: string) => {
        const hasPermission = await rbacService.hasPermission(userId, permission);
        return {
          permission,
          hasPermission
        };
      })
    );

    // Determine overall result
    const hasAllPermissions = permissionResults.every(r => r.hasPermission);
    const hasAnyPermission = permissionResults.some(r => r.hasPermission);
    const overallResult = requireAll ? hasAllPermissions : hasAnyPermission;

    return NextResponse.json({
      success: true,
      data: {
        userId,
        requireAll,
        permissionResults,
        hasAllPermissions,
        hasAnyPermission,
        overallResult
      }
    });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check permissions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}