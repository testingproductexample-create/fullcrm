/**
 * API Routes for Monitoring Dashboard
 * Provides data endpoints for all dashboard components
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

// GET /api/audit/logs - Fetch audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const riskLevel = searchParams.get('riskLevel');
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const timeRange = searchParams.get('timeRange') || '24h';

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply time range filter
    const timeFilter = getTimeRangeFilter(timeRange);
    if (timeFilter) {
      query = query.gte('timestamp', timeFilter);
    }

    // Apply other filters
    if (riskLevel && riskLevel !== 'all') {
      query = query.eq('risk_level', riskLevel);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
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