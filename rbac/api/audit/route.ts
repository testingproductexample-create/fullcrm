import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '../../services/rbac.service';

const rbacService = new RBACService();

// GET /api/rbac/audit - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filters
    const filters: any = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Get audit logs
    const auditLogs = await rbacService.getAuditLogs({
      ...filters,
      limit,
      offset,
      sortBy,
      sortOrder
    });

    // Get total count for pagination
    const totalCount = await rbacService.getAuditLogsCount(filters);

    return NextResponse.json({
      success: true,
      data: auditLogs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch audit logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/rbac/audit - Create audit log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      action, 
      resource, 
      resourceId, 
      details = {}, 
      success = true,
      errorMessage 
    } = body;

    // Validation
    if (!userId || !action || !resource) {
      return NextResponse.json(
        { success: false, error: 'userId, action, and resource are required' },
        { status: 400 }
      );
    }

    // Create audit log
    const auditLog = await rbacService.logAction({
      userId,
      action,
      resource,
      resourceId: resourceId || '',
      details,
      success,
      errorMessage,
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      data: auditLog,
      message: 'Audit log created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create audit log',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/rbac/audit - Clean up old audit logs
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan');
    const olderThanDays = parseInt(olderThan || '90');
    const dryRun = searchParams.get('dryRun') === 'true';

    if (!olderThan && !olderThanDays) {
      return NextResponse.json(
        { success: false, error: 'olderThan parameter required (number of days)' },
        { status: 400 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Count logs to be deleted
    const logsToDelete = await rbacService.getAuditLogs({
      endDate: cutoffDate,
      limit: 10000 // Safety limit
    });

    if (dryRun) {
      return NextResponse.json({
        success: true,
        data: {
          dryRun: true,
          logsToDeleteCount: logsToDelete.length,
          cutoffDate: cutoffDate.toISOString()
        },
        message: `Found ${logsToDelete.length} logs older than ${olderThanDays} days`
      });
    }

    // Delete old logs
    const deletedCount = await rbacService.deleteAuditLogsOlderThan(cutoffDate);

    return NextResponse.json({
      success: true,
      data: {
        deletedCount,
        cutoffDate: cutoffDate.toISOString()
      },
      message: `Deleted ${deletedCount} audit logs older than ${olderThanDays} days`
    });
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clean up audit logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}