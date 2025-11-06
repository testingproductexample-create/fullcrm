import { NextRequest, NextResponse } from 'next/server';
import { pdplComplianceService } from '../../../../../compliance/core/PDPLComplianceService';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();

    // Validate required fields
    const requiredFields = ['userId', 'requestType', 'requestedDataCategories'];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const requestRecord = await pdplComplianceService.createDataSubjectRequest(requestData);

    return NextResponse.json({ request: requestRecord });
  } catch (error) {
    console.error('Error creating data subject request:', error);
    return NextResponse.json(
      { error: 'Failed to create data subject request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') || 'user';
    const status = searchParams.get('status');
    const requestType = searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // For regular users, they can only see their own requests
    // For compliance officers, they can see all requests
    const supabase = createClient();
    let query = supabase
      .from('data_subject_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (userRole === 'user') {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('request_status', status);
    }

    if (requestType) {
      query = query.eq('request_type', requestType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ requests: data });
  } catch (error) {
    console.error('Error fetching data subject requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data subject requests' },
      { status: 500 }
    );
  }
}

function createClient() {
  throw new Error('Function not implemented.');
}