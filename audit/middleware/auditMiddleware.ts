/**
 * Audit Logging Middleware
 * Comprehensive middleware for tracking all user actions, data access, and system changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export interface AuditEvent {
  event_id: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  event_type: string;
  event_category: string;
  resource_type?: string;
  resource_id?: string;
  action: string;
  details?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  error_message?: string;
}

export interface SecurityEvent {
  event_id: string;
  user_id?: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source_ip?: string;
  user_agent?: string;
  details: Record<string, any>;
}

export interface FailedLoginAttempt {
  event_id: string;
  email?: string;
  ip_address: string;
  user_agent?: string;
  attempt_method: string;
  failure_reason: string;
  details?: Record<string, any>;
  blocked?: boolean;
  blocked_until?: Date;
}

class AuditLogger {
  private apiEndpoint: string;
  
  constructor() {
    this.apiEndpoint = '/api/audit/log';
  }

  /**
   * Log audit event
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'audit_event',
          data: event,
        }),
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'security_event',
          data: event,
        }),
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Log failed login attempt
   */
  async logFailedLogin(attempt: FailedLoginAttempt): Promise<void> {
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'failed_login',
          data: attempt,
        }),
      });
    } catch (error) {
      console.error('Failed to log failed login:', error);
    }
  }
}

// Global audit logger instance
const auditLogger = new AuditLogger();

/**
 * Request audit middleware - tracks all API requests
 */
export async function auditRequest(
  request: NextRequest,
  context: { 
    userId?: string;
    resourceType?: string;
    action: string;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }
): Promise<void> {
  const event: AuditEvent = {
    event_id: uuidv4(),
    user_id: context.userId,
    session_id: request.cookies.get('session_id')?.value,
    ip_address: request.headers.get('x-forwarded-for') || 
                request.ip || 
                'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    event_type: 'api_request',
    event_category: 'system',
    resource_type: context.resourceType,
    action: context.action,
    details: {
      method: request.method,
      url: request.url,
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin'),
    },
    risk_level: context.riskLevel || 'LOW',
    status: 'SUCCESS',
  };

  await auditLogger.logEvent(event);
}

/**
 * Data access audit middleware - tracks database operations
 */
export async function auditDataAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
): Promise<void> {
  const event: AuditEvent = {
    event_id: uuidv4(),
    user_id: userId,
    event_type: 'data_access',
    event_category: 'data',
    resource_type: resourceType,
    resource_id: resourceId,
    action,
    old_values: oldValues,
    new_values: newValues,
    risk_level: riskLevel,
    status: 'SUCCESS',
  };

  await auditLogger.logEvent(event);
}

/**
 * Authentication audit middleware - tracks login/logout events
 */
export async function auditAuth(
  eventType: 'login' | 'logout' | 'password_change' | 'account_locked',
  userId?: string,
  email?: string,
  success: boolean = true,
  details?: Record<string, any>
): Promise<void> {
  const event: AuditEvent = {
    event_id: uuidv4(),
    user_id: userId,
    event_type: eventType,
    event_category: 'authentication',
    action: eventType.toUpperCase(),
    details: {
      email,
      success,
      ...details,
    },
    risk_level: success ? 'LOW' : 'MEDIUM',
    status: success ? 'SUCCESS' : 'FAILED',
    error_message: success ? undefined : 'Authentication failed',
  };

  await auditLogger.logEvent(event);

  // Log failed logins separately for security monitoring
  if (!success && eventType === 'login') {
    const failedLogin: FailedLoginAttempt = {
      event_id: event.event_id,
      email,
      ip_address: details?.ip_address || 'unknown',
      user_agent: details?.user_agent,
      attempt_method: details?.method || 'password',
      failure_reason: details?.reason || 'unknown',
      details,
    };
    await auditLogger.logFailedLogin(failedLogin);
  }
}

/**
 * Authorization audit middleware - tracks permission checks
 */
export async function auditAuthorization(
  userId: string,
  resourceType: string,
  action: string,
  allowed: boolean,
  reason?: string
): Promise<void> {
  const event: AuditEvent = {
    event_id: uuidv4(),
    user_id: userId,
    event_type: 'authorization',
    event_category: 'authorization',
    resource_type: resourceType,
    action,
    details: {
      allowed,
      reason,
    },
    risk_level: allowed ? 'LOW' : 'HIGH',
    status: allowed ? 'SUCCESS' : 'FAILED',
    error_message: allowed ? undefined : 'Authorization denied',
  };

  await auditLogger.logEvent(event);
}

/**
 * System event audit middleware - tracks system changes
 */
export async function auditSystem(
  eventType: string,
  details: Record<string, any>,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
): Promise<void> {
  const event: AuditEvent = {
    event_id: uuidv4(),
    event_type: eventType,
    event_category: 'system',
    action: eventType.toUpperCase(),
    details,
    risk_level: riskLevel,
    status: 'SUCCESS',
  };

  await auditLogger.logEvent(event);
}

/**
 * Security event audit middleware - tracks security-related events
 */
export async function auditSecurity(
  eventType: string,
  userId: string | undefined,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  details: Record<string, any>
): Promise<void> {
  const event: AuditEvent = {
    event_id: uuidv4(),
    user_id: userId,
    event_type: eventType,
    event_category: 'security',
    action: eventType.toUpperCase(),
    details,
    risk_level: severity,
    status: 'SUCCESS',
  };

  await auditLogger.logEvent(event);

  // Also log as security event
  const securityEvent: SecurityEvent = {
    event_id: event.event_id,
    user_id: userId,
    event_type: eventType,
    severity,
    details,
  };

  await auditLogger.logSecurityEvent(securityEvent);
}

/**
 * Bulk audit operations for performance
 */
export class BulkAuditLogger {
  private events: AuditEvent[] = [];
  private securityEvents: SecurityEvent[] = [];
  private failedLogins: FailedLoginAttempt[] = [];

  /**
   * Add event to bulk queue
   */
  addEvent(event: AuditEvent): void {
    this.events.push(event);
  }

  /**
   * Add security event to bulk queue
   */
  addSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
  }

  /**
   * Add failed login to bulk queue
   */
  addFailedLogin(attempt: FailedLoginAttempt): void {
    this.failedLogins.push(attempt);
  }

  /**
   * Flush all events to database
   */
  async flush(): Promise<void> {
    try {
      const promises = [];

      if (this.events.length > 0) {
        promises.push(
          fetch('/api/audit/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'audit_events',
              data: this.events,
            }),
          })
        );
      }

      if (this.securityEvents.length > 0) {
        promises.push(
          fetch('/api/audit/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'security_events',
              data: this.securityEvents,
            }),
          })
        );
      }

      if (this.failedLogins.length > 0) {
        promises.push(
          fetch('/api/audit/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'failed_logins',
              data: this.failedLogins,
            }),
          })
        );
      }

      await Promise.all(promises);

      // Clear queues
      this.events = [];
      this.securityEvents = [];
      this.failedLogins = [];
    } catch (error) {
      console.error('Failed to flush audit events:', error);
    }
  }
}

// Auto-flush bulk logger every 30 seconds
setInterval(() => {
  const bulkLogger = new BulkAuditLogger();
  // This would need to be implemented with a singleton pattern
  // in a real application to maintain state across requests
}, 30000);

export default auditLogger;