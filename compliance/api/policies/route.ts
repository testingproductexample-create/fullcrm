import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const policyData = await request.json();

    // Validate required fields
    const requiredFields = ['policyName', 'policyVersion', 'effectiveDate', 'policyContent'];
    for (const field of requiredFields) {
      if (!policyData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('privacy_policies')
      .insert([policyData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ policy: data });
  } catch (error) {
    console.error('Error creating privacy policy:', error);
    return NextResponse.json(
      { error: 'Failed to create privacy policy' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const supabase = createClient();
    let query = supabase
      .from('privacy_policies')
      .select('*')
      .order('effective_date', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ policies: data });
  } catch (error) {
    console.error('Error fetching privacy policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy policies' },
      { status: 500 }
    );
  }
}