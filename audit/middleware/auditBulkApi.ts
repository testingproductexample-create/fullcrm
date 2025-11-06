/**
 * API Route: /api/audit/bulk
 * Handles bulk audit event logging for performance optimization
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    let result;
    
    switch (type) {
      case 'audit_events':
        result = await logBulkAuditEvents(data);
        break;
      case 'security_events':
        result = await logBulkSecurityEvents(data);
        break;
      case 'failed_logins':
        result = await logBulkFailedLogins(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid bulk event type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      processed: result 
    });
  } catch (error) {
    console.error('Bulk audit log API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function logBulkAuditEvents(events: any[]) {
  const validEvents = events.map(event => ({
    event_id: event.event_id,
    user_id: event.user_id,
    session_id: event.session_id,
    ip_address: event.ip_address,
    user_agent: event.user_agent,
    event_type: event.event_type,
    event_category: event.event_category,
    resource_type: event.resource_type,
    resource_id: event.resource_id,
    action: event.action,
    details: event.details,
    old_values: event.old_values,
    new_values: event.new_values,
    risk_level: event.risk_level,
    status: event.status,
    error_message: event.error_message,
  }));

  const { data, error } = await supabase
    .from('audit_logs')
    .insert(validEvents);

  if (error) throw error;
  return data?.length || 0;
}

async function logBulkSecurityEvents(events: any[]) {
  const validEvents = events.map(event => ({
    event_id: event.event_id,
    user_id: event.user_id,
    event_type: event.event_type,
    severity: event.severity,
    source_ip: event.source_ip,
    user_agent: event.user_agent,
    details: event.details,
  }));

  const { data, error } = await supabase
    .from('security_events')
    .insert(validEvents);

  if (error) throw error;
  return data?.length || 0;
}

async function logBulkFailedLogins(logins: any[]) {
  const processedLogins = [];
  
  for (const login of logins) {
    // Get user ID if email provided
    let userId = null;
    if (login.email) {
      const { data: user } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', login.email)
        .single();
      
      userId = user?.id;
    }

    // Check if IP should be blocked
    const { count } = await supabase
      .from('failed_login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', login.ip_address)
      .gt('created_at', new Date(Date.now() - 3600000).toISOString())
      .eq('blocked', false);

    const shouldBlock = (count || 0) >= 4;
    const blockedUntil = shouldBlock 
      ? new Date(Date.now() + 3600000).toISOString()
      : null;

    processedLogins.push({
      event_id: login.event_id,
      email: login.email,
      user_id: userId,
      ip_address: login.ip_address,
      user_agent: login.user_agent,
      attempt_method: login.attempt_method,
      failure_reason: login.failure_reason,
      details: login.details,
      blocked: shouldBlock,
      blocked_until: blockedUntil,
    });
  }

  const { data, error } = await supabase
    .from('failed_login_attempts')
    .insert(processedLogins);

  if (error) throw error;

  // Create security events for failed logins
  const securityEvents = processedLogins.map(login => ({
    event_id: login.event_id,
    user_id: login.user_id,
    event_type: 'failed_login',
    severity: login.blocked ? 'HIGH' : 'MEDIUM',
    source_ip: login.ip_address,
    user_agent: login.user_agent,
    details: {
      email: login.email,
      failure_reason: login.failure_reason,
      blocked: login.blocked,
    },
  }));

  await supabase
    .from('security_events')
    .insert(securityEvents);

  return data?.length || 0;
}