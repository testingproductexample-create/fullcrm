/**
 * API Route: /api/audit/user-analytics
 * Fetches user behavior analytics for monitoring dashboard
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
    const userId = searchParams.get('userId');
    const riskThreshold = searchParams.get('riskThreshold') || '0';
    const sortBy = searchParams.get('sortBy') || 'event_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let query = supabase
      .from('user_behavior_analytics')
      .select(`
        *,
        users:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (riskThreshold !== '0') {
      query = query.gte('risk_score', parseFloat(riskThreshold));
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data to include user email and format data
    const transformedData = data?.map(analytic => ({
      ...analytic,
      user_email: analytic.users?.email || null,
      display_name: analytic.users?.raw_user_meta_data?.full_name || 
                   analytic.users?.raw_user_meta_data?.name || 
                   analytic.users?.email || 
                   'Unknown User'
    })) || [];

    return NextResponse.json({
      data: transformedData,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
}

// Get high-risk users summary
export async function GET_high_risk(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threshold = parseFloat(searchParams.get('threshold') || '0.7');
    const limit = parseInt(searchParams.get('limit') || '20');

    const { data, error } = await supabase
      .from('user_behavior_analytics')
      .select(`
        *,
        users:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .gte('risk_score', threshold)
      .order('risk_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const highRiskData = data?.map(user => ({
      ...user,
      user_email: user.users?.email || null,
      display_name: user.users?.raw_user_meta_data?.full_name || 
                   user.users?.raw_user_meta_data?.name || 
                   user.users?.email || 
                   'Unknown User'
    })) || [];

    return NextResponse.json({ data: highRiskData });
  } catch (error) {
    console.error('Error fetching high risk users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch high risk users' },
      { status: 500 }
    );
  }
}

// Get analytics summary/statistics
export async function GET_summary(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    
    const timeFilter = getTimeRangeFilter(timeRange);
    
    // Get total users with analytics
    let totalUsersQuery = supabase
      .from('user_behavior_analytics')
      .select('user_id', { count: 'exact', head: true });

    if (timeFilter) {
      totalUsersQuery = totalUsersQuery.gte('event_date', timeFilter.split('T')[0]);
    }

    const { count: totalUsers } = await totalUsersQuery;

    // Get high risk users
    let highRiskQuery = supabase
      .from('user_behavior_analytics')
      .select('user_id', { count: 'exact', head: true })
      .gte('risk_score', 0.7);

    if (timeFilter) {
      highRiskQuery = highRiskQuery.gte('event_date', timeFilter.split('T')[0]);
    }

    const { count: highRiskUsers } = await highRiskQuery;

    // Get average metrics
    const { data: avgMetrics } = await supabase
      .from('user_behavior_analytics')
      .select('session_count, total_actions, login_count, failed_login_count, risk_score')
      .gte('event_date', timeFilter?.split('T')[0] || '1970-01-01');

    if (avgMetrics && avgMetrics.length > 0) {
      const totals = avgMetrics.reduce((acc, curr) => ({
        total_sessions: acc.total_sessions + curr.session_count,
        total_actions: acc.total_actions + curr.total_actions,
        total_logins: acc.total_logins + curr.login_count,
        total_failed_logins: acc.total_failed_logins + curr.failed_login_count,
        total_risk_score: acc.total_risk_score + curr.risk_score
      }), {
        total_sessions: 0,
        total_actions: 0,
        total_logins: 0,
        total_failed_logins: 0,
        total_risk_score: 0
      });

      const averages = {
        avg_sessions_per_user: totals.total_sessions / avgMetrics.length,
        avg_actions_per_user: totals.total_actions / avgMetrics.length,
        avg_logins_per_user: totals.total_logins / avgMetrics.length,
        avg_failed_logins_per_user: totals.total_failed_logins / avgMetrics.length,
        avg_risk_score: totals.total_risk_score / avgMetrics.length
      };

      return NextResponse.json({
        summary: {
          total_users: totalUsers,
          high_risk_users: highRiskUsers,
          high_risk_percentage: totalUsers ? (highRiskUsers / totalUsers * 100).toFixed(2) : 0,
          averages
        }
      });
    }

    return NextResponse.json({
      summary: {
        total_users: totalUsers,
        high_risk_users: highRiskUsers,
        high_risk_percentage: 0,
        averages: {
          avg_sessions_per_user: 0,
          avg_actions_per_user: 0,
          avg_logins_per_user: 0,
          avg_failed_logins_per_user: 0,
          avg_risk_score: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics summary' },
      { status: 500 }
    );
  }
}

// Get user timeline/activity history
export async function GET_timeline(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('user_behavior_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('event_date', startDate.toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching user timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user timeline' },
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