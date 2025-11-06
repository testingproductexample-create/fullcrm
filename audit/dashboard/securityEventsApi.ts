/**
 * API Route: /api/audit/security-events
 * Fetches security events for monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status'); // 'open', 'resolved', 'all'
    const eventType = searchParams.get('eventType');
    const timeRange = searchParams.get('timeRange') || '24h';

    let query = supabase
      .from('security_events')
      .select(`
        *,
        users:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply time range filter
    const timeFilter = getTimeRangeFilter(timeRange);
    if (timeFilter) {
      query = query.gte('created_at', timeFilter);
    }

    // Apply other filters
    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }

    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType);
    }

    if (status && status !== 'all') {
      query = query.eq('resolved', status === 'resolved');
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data to include user email
    const transformedData = data?.map(event => ({
      ...event,
      user_email: event.users?.email || null
    })) || [];

    return NextResponse.json({
      data: transformedData,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { resolved, resolved_by } = body;

    const { data, error } = await supabase
      .from('security_events')
      .update({
        resolved,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolved_by: resolved ? resolved_by : null
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating security event:', error);
    return NextResponse.json(
      { error: 'Failed to update security event' },
      { status: 500 }
    );
  }
}

function getTimeRangeFilter(timeRange: string): string | null {
  const now = new Date();
  
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return null;
  }
}