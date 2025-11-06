import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase';
import { pdplComplianceService } from '../../../../../compliance/core/PDPLComplianceService';

export async function POST(request: NextRequest) {
  try {
    const consentData = await request.json();

    // Validate required fields
    const requiredFields = ['userId', 'consentType', 'consentVersion', 'legalBasis', 'processingPurposes', 'dataCategories'];
    for (const field of requiredFields) {
      if (!consentData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Record the consent
    const consent = await pdplComplianceService.recordConsent(consentData);

    return NextResponse.json({ consent });
  } catch (error) {
    console.error('Error creating consent record:', error);
    return NextResponse.json(
      { error: 'Failed to create consent record' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const consents = await pdplComplianceService.getUserConsents(userId);

    return NextResponse.json({ consents });
  } catch (error) {
    console.error('Error fetching consents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent records' },
      { status: 500 }
    );
  }
}