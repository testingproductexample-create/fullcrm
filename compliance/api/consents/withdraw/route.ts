import { NextRequest, NextResponse } from 'next/server';
import { pdplComplianceService } from '../../../../../compliance/core/PDPLComplianceService';

export async function POST(request: NextRequest) {
  try {
    const { userId, consentId, withdrawalMethod } = await request.json();

    if (!userId || !consentId) {
      return NextResponse.json(
        { error: 'User ID and Consent ID are required' },
        { status: 400 }
      );
    }

    await pdplComplianceService.withdrawConsent(userId, consentId, withdrawalMethod);

    return NextResponse.json({ message: 'Consent withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing consent:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw consent' },
      { status: 500 }
    );
  }
}