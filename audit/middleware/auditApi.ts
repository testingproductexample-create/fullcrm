/**
 * API Route: /api/audit/log
 * Handles individual audit event logging
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
      case 'audit_event':
        result = await logAuditEvent(data);
        break;
      case 'security_event':
        result = await logSecurityEvent(data);
        break;
      case 'failed_login':
        result = await logFailedLogin(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      eventId: result 
    });
  } catch (error) {
    console.error('Audit log API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function logAuditEvent(data: any) {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      event_id: data.event_id,
      user_id: data.user_id,
      session_id: data.session_id,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      event_type: data.event_type,
      event_category: data.event_category,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      action: data.action,
      details: data.details,
      old_values: data.old_values,
      new_values: data.new_values,
      risk_level: data.risk_level,
      status: data.status,
      error_message: data.error_message,
    });

  if (error) throw error;
  return data.event_id;
}

async function logSecurityEvent(data: any) {
  const { error } = await supabase
    .from('security_events')
    .insert({
      event_id: data.event_id,
      user_id: data.user_id,
      event_type: data.event_type,
      severity: data.severity,
      source_ip: data.source_ip,
      user_agent: data.user_agent,
      details: data.details,
    });

  if (error) throw error;
  return data.event_id;
}

async function logFailedLogin(data: any) {
  // First get user ID if email provided
  let userId = null;
  if (data.email) {
    const { data: user } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', data.email)
      .single();
    
    userId = user?.id;
  }

  // Check if IP should be blocked
  const { count } = await supabase
    .from('failed_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', data.ip_address)
    .gt('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .eq('blocked', false);

  const shouldBlock = (count || 0) >= 4;
  const blockedUntil = shouldBlock 
    ? new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    : null;

  const { error } = await supabase
    .from('failed_login_attempts')
    .insert({
      event_id: data.event_id,
      email: data.email,
      user_id: userId,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      attempt_method: data.attempt_method,
      failure_reason: data.failure_reason,
      details: data.details,
      blocked: shouldBlock,
      blocked_until: blockedUntil,
    });

  if (error) throw error;

  // Create security event for failed login
  await supabase
    .from('security_events')
    .insert({
      event_id: data.event_id,
      user_id: userId,
      event_type: 'failed_login',
      severity: shouldBlock ? 'HIGH' : 'MEDIUM',
      source_ip: data.ip_address,
      user_agent: data.user_agent,
      details: {
        email: data.email,
        failure_reason: data.failure_reason,
        blocked: shouldBlock,
      },
    });

  return data.event_id;
}