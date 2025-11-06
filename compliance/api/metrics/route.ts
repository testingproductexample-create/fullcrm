import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase';
import { pdplComplianceService } from '../../../../compliance/core/PDPLComplianceService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') || 'user';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get compliance metrics
    const metrics = await pdplComplianceService.getComplianceMetrics();

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching compliance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'run_checks':
        const results = await pdplComplianceService.runComplianceChecks();
        return NextResponse.json({ results });

      case 'export_data':
        const exportData = await pdplComplianceService.exportUserData(data.userId);
        return NextResponse.json({ data: exportData });

      case 'delete_data':
        await pdplComplianceService.deleteUserData(data.userId, data.dataCategories);
        return NextResponse.json({ message: 'Data deleted successfully' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in compliance metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}