/**
 * API Route: /api/audit/anomalies
 * Fetches anomaly detection data for monitoring dashboard
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
    const status = searchParams.get('status'); // 'OPEN', 'INVESTIGATED', 'CONFIRMED', 'FALSE_POSITIVE'
    const severity = searchParams.get('severity');
    const anomalyType = searchParams.get('anomalyType');
    const timeRange = searchParams.get('timeRange') || '7d';
    const userId = searchParams.get('userId');

    let query = supabase
      .from('anomaly_detection')
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
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }

    if (anomalyType && anomalyType !== 'all') {
      query = query.eq('anomaly_type', anomalyType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data to include user information
    const transformedData = data?.map(anomaly => ({
      ...anomaly,
      user_email: anomaly.users?.email || null,
      display_name: anomaly.users?.raw_user_meta_data?.full_name || 
                   anomaly.users?.raw_user_meta_data?.name || 
                   anomaly.users?.email || 
                   'Unknown User'
    })) || [];

    return NextResponse.json({
      data: transformedData,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anomalies' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const anomalyId = searchParams.get('id');
    
    if (!anomalyId) {
      return NextResponse.json(
        { error: 'Anomaly ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, investigated_by, notes } = body;

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (investigated_by) {
      updateData.investigated_by = investigated_by;
      updateData.investigated_at = new Date().toISOString();
    }

    if (notes) {
      updateData.investigation_notes = notes;
    }

    const { data, error } = await supabase
      .from('anomaly_detection')
      .update(updateData)
      .eq('id', anomalyId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating anomaly:', error);
    return NextResponse.json(
      { error: 'Failed to update anomaly' },
      { status: 500 }
    );
  }
}

// Get anomaly statistics
export async function GET_statistics(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    const timeFilter = getTimeRangeFilter(timeRange);
    
    // Get total anomalies count
    let totalQuery = supabase
      .from('anomaly_detection')
      .select('*', { count: 'exact', head: true });

    if (timeFilter) {
      totalQuery = totalQuery.gte('created_at', timeFilter);
    }

    const { count: totalAnomalies } = await totalQuery;

    // Get anomalies by status
    const statusQueries = [
      { status: 'OPEN', query: supabase.from('anomaly_detection').select('*', { count: 'exact', head: true }).eq('status', 'OPEN') },
      { status: 'INVESTIGATED', query: supabase.from('anomaly_detection').select('*', { count: 'exact', head: true }).eq('status', 'INVESTIGATED') },
      { status: 'CONFIRMED', query: supabase.from('anomaly_detection').select('*', { count: 'exact', head: true }).eq('status', 'CONFIRMED') },
      { status: 'FALSE_POSITIVE', query: supabase.from('anomaly_detection').select('*', { count: 'exact', head: true }).eq('status', 'FALSE_POSITIVE') }
    ];

    const statusResults = await Promise.all(
      statusQueries.map(async (item) => {
        let query = item.query;
        if (timeFilter) {
          query = query.gte('created_at', timeFilter);
        }
        const { count } = await query;
        return { status: item.status, count: count || 0 };
      })
    );

    // Get anomalies by severity
    const severityQueries = [
      { severity: 'LOW', query: supabase.from('anomaly_detection').select('*', { count: 'exact', head: true }).eq('severity', 'LOW') },
      { severity: 'MEDIUM', query: supabase.from('anomaly_detection').select('*', { count: 'exact', head: true }).eq('severity', 'MEDIUM') },
      { severity: 'HIGH', query: supabase.from('anomaly_detection').select('*', { count: 'exact', head: true }).eq('severity', 'HIGH') },
      { severity: 'CRITICAL', query: supabase.from('anomaly_detection').select('*', { count: 'exact', head: true }).eq('severity', 'CRITICAL') }
    ];

    const severityResults = await Promise.all(
      severityQueries.map(async (item) => {
        let query = item.query;
        if (timeFilter) {
          query = query.gte('created_at', timeFilter);
        }
        const { count } = await query;
        return { severity: item.severity, count: count || 0 };
      })
    );

    // Get top anomaly types
    const { data: anomalyTypes } = await supabase
      .from('anomaly_detection')
      .select('anomaly_type')
      .gte('created_at', timeFilter || '1970-01-01')
      .group('anomaly_type')
      .order('count', { ascending: false })
      .limit(10);

    return NextResponse.json({
      statistics: {
        total_anomalies: totalAnomalies,
        by_status: statusResults.reduce((acc, curr) => {
          acc[curr.status] = curr.count;
          return acc;
        }, {} as Record<string, number>),
        by_severity: severityResults.reduce((acc, curr) => {
          acc[curr.severity] = curr.count;
          return acc;
        }, {} as Record<string, number>),
        top_anomaly_types: anomalyTypes
      }
    });
  } catch (error) {
    console.error('Error fetching anomaly statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anomaly statistics' },
      { status: 500 }
    );
  }
}

// Get anomaly trends
export async function GET_trends(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('anomaly_detection')
      .select('created_at, anomaly_type, severity, status')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by day and type
    const trends: Record<string, Record<string, number>> = {};
    
    data?.forEach(anomaly => {
      const date = anomaly.created_at.split('T')[0];
      const type = anomaly.anomaly_type;
      
      if (!trends[date]) {
        trends[date] = {};
      }
      
      if (!trends[date][type]) {
        trends[date][type] = 0;
      }
      
      trends[date][type]++;
    });

    return NextResponse.json({ 
      trends,
      total_days: days
    });
  } catch (error) {
    console.error('Error fetching anomaly trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anomaly trends' },
      { status: 500 }
    );
  }
}

// Create new anomaly
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      event_id, 
      user_id, 
      anomaly_type, 
      severity, 
      description, 
      baseline_metrics, 
      current_metrics, 
      deviation_score, 
      confidence_level 
    } = body;

    const { data, error } = await supabase
      .from('anomaly_detection')
      .insert({
        event_id,
        user_id,
        anomaly_type,
        severity,
        description,
        baseline_metrics,
        current_metrics,
        deviation_score,
        confidence_level,
        status: 'OPEN'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error creating anomaly:', error);
    return NextResponse.json(
      { error: 'Failed to create anomaly' },
      { status: 500 }
    );
  }
}

function getTimeRangeFilter(timeRange: string): string | null {
  const now = new Date();
  
  switch (timeRange) {
    case '1d':
      return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return null;
  }
}