import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const activityData = await request.json();

    // Validate required fields
    const requiredFields = [
      'activityName', 'activityDescription', 'controllerName', 'legalBasis',
      'processingPurposes', 'dataCategories', 'dataSubjects'
    ];
    for (const field of requiredFields) {
      if (!activityData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('data_processing_activities')
      .insert([activityData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ activity: data });
  } catch (error) {
    console.error('Error creating processing activity:', error);
    return NextResponse.json(
      { error: 'Failed to create processing activity' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riskLevel = searchParams.get('riskLevel');
    const activeOnly = searchParams.get('active') === 'true';

    const supabase = createClient();
    let query = supabase
      .from('data_processing_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ activities: data });
  } catch (error) {
    console.error('Error fetching processing activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch processing activities' },
      { status: 500 }
    );
  }
}