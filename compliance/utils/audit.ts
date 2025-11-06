/**
 * Audit Trail Utility
 * 
 * This utility provides functions to log and track all privacy-related activities
 * for compliance and audit purposes.
 */

import { createClient } from '../../../crm-app/lib/supabase';

export interface AuditEvent {
  userId?: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  legalBasis?: string;
  processingPurpose?: string;
  retentionBasis?: string;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabase = createClient();

    // Get client information
    const clientInfo = await getClientInfo();
    
    const auditRecord = {
      ...event,
      ...clientInfo,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('privacy_audit_trail')
      .insert([auditRecord]);

    if (error) {
      console.error('Error logging audit event:', error);
    }
  } catch (error) {
    console.error('Error in logAuditEvent:', error);
  }
}

async function getClientInfo() {
  // In a real implementation, you would extract this from the request context
  return {
    ip_address: null, // Would be extracted from request headers
    user_agent: null, // Would be extracted from request headers
    session_id: null // Would be extracted from session
  };
}

export async function getAuditTrail(
  userId?: string,
  actionType?: string,
  resourceType?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('privacy_audit_trail')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    throw error;
  }
}

export async function getDataAccessHistory(userId: string, resourceType?: string): Promise<any[]> {
  const actionTypes = ['data_accessed', 'data_modified', 'data_exported'];
  
  return getAuditTrail(
    userId,
    actionTypes.join(','), // Note: This is a simplified approach
    resourceType
  );
}

export async function getConsentHistory(userId: string): Promise<any[]> {
  return getAuditTrail(
    userId,
    'consent_given,consent_withdrawn',
    'consent_record'
  );
}

export async function getDataSubjectRequestHistory(userId: string): Promise<any[]> {
  return getAuditTrail(
    userId,
    'data_subject_request_created,data_subject_request_updated',
    'data_subject_request'
  );
}

// Privacy event types for standardization
export const AUDIT_ACTIONS = {
  // Consent events
  CONSENT_GIVEN: 'consent_given',
  CONSENT_WITHDRAWN: 'consent_withdrawn',
  CONSENT_UPDATED: 'consent_updated',
  
  // Data access events
  DATA_ACCESSED: 'data_accessed',
  DATA_MODIFIED: 'data_modified',
  DATA_DELETED: 'data_deleted',
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',
  
  // Data subject request events
  REQUEST_CREATED: 'data_subject_request_created',
  REQUEST_UPDATED: 'data_subject_request_updated',
  REQUEST_FULFILLED: 'data_subject_request_fulfilled',
  REQUEST_REJECTED: 'data_subject_request_rejected',
  
  // System events
  POLICY_CREATED: 'privacy_policy_created',
  POLICY_UPDATED: 'privacy_policy_updated',
  INCIDENT_REPORTED: 'incident_reported',
  DPEA_COMPLETED: 'dpea_completed',
  RETENTION_EXECUTED: 'retention_executed',
  
  // User events
  PROFILE_ACCESSED: 'profile_accessed',
  SETTINGS_UPDATED: 'settings_updated',
  PASSWORD_CHANGED: 'password_changed'
} as const;

export const RESOURCE_TYPES = {
  USER_DATA: 'user_data',
  CONSENT_RECORD: 'consent_record',
  DATA_SUBJECT_REQUEST: 'data_subject_request',
  PRIVACY_POLICY: 'privacy_policy',
  PROCESSING_ACTIVITY: 'processing_activity',
  COMPLIANCE_INCIDENT: 'compliance_incident',
  PROFILE: 'profile',
  SYSTEM: 'system'
} as const;