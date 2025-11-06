import { NextRequest, NextResponse } from 'next/server';
import { pdplComplianceService } from '../../../../../compliance/core/PDPLComplianceService';

export async function PATCH(request: NextRequest) {
  try {
    const { requestId, status, responseDetails, assignedOfficer } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['pending', 'in_progress', 'completed', 'rejected', 'partially_completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    await pdplComplianceService.updateRequestStatus(requestId, status, responseDetails, assignedOfficer);

    return NextResponse.json({ message: 'Request status updated successfully' });
  } catch (error) {
    console.error('Error updating request status:', error);
    return NextResponse.json(
      { error: 'Failed to update request status' },
      { status: 500 }
    );
  }
}