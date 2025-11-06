/**
 * API Route: /api/audit/failed-logins
 * Fetches failed login attempts for monitoring dashboard
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
    const blocked = searchParams.get('blocked');
    const timeRange = searchParams.get('timeRange') || '24h';
    const ipAddress = searchParams.get('ipAddress');
    const email = searchParams.get('email');

    let query = supabase
      .from('failed_login_attempts')
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
    if (blocked === 'true') {
      query = query.eq('blocked', true);
    } else if (blocked === 'false') {
      query = query.eq('blocked', false);
    }

    if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    }

    if (email) {
      query = query.ilike('email', `%${email}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data to include user email
    const transformedData = data?.map(attempt => ({
      ...attempt,
      user_email: attempt.users?.email || null,
      is_blocked: attempt.blocked,
      blocked_until: attempt.blocked_until
    })) || [];

    return NextResponse.json({
      data: transformedData,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching failed logins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch failed logins' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip_address, unblock_until } = body;

    // Unblock IP address
    if (ip_address) {
      const { error } = await supabase
        .from('failed_login_attempts')
        .update({
          blocked: false,
          blocked_until: null
        })
        .eq('ip_address', ip_address);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    return NextResponse.json(
      { error: 'Failed to unblock IP' },
      { status: 500 }
    );
  }
}

// Get statistics for failed logins
export async function GET_statistics(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    const timeFilter = getTimeRangeFilter(timeRange);
    
    // Get total failed login count
    let countQuery = supabase
      .from('failed_login_attempts')
      .select('*', { count: 'exact', head: true });

    if (timeFilter) {
      countQuery = countQuery.gte('created_at', timeFilter);
    }

    const { count: totalCount } = await countQuery;

    // Get blocked attempts count
    let blockedQuery = supabase
      .from('failed_login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('blocked', true);

    if (timeFilter) {
      blockedQuery = blockedQuery.gte('created_at', timeFilter);
    }

    const { count: blockedCount } = await blockedQuery;

    // Get top IPs
    const { data: topIPs } = await supabase
      .from('failed_login_attempts')
      .select('ip_address')
      .gte('created_at', timeFilter || '1970-01-01')
      .group('ip_address')
      .order('count', { ascending: false })
      .limit(10);

    // Get top email domains
    const { data: topDomains } = await supabase
      .from('failed_login_attempts')
      .select('email')
      .not('email', 'is', null)
      .gte('created_at', timeFilter || '1970-01-01')
      .then(({ data }) => {
        if (!data) return { data: [] };
        
        const domainCounts: Record<string, number> = {};
        data.forEach(attempt => {
          if (attempt.email) {
            const domain = attempt.email.split('@')[1] || 'unknown';
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          }
        });

        return {
          data: Object.entries(domainCounts)
            .map(([domain, count]) => ({ domain, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        };
      });

    return NextResponse.json({
      statistics: {
        total_failed_logins: totalCount,
        blocked_attempts: blockedCount,
        top_attacking_ips: topIPs,
        top_email_domains: topDomains
      }
    });
  } catch (error) {
    console.error('Error fetching failed login statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
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