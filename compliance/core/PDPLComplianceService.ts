/**
 * UAE PDPL (Personal Data Protection Law) Compliance Service
 * 
 * This service implements comprehensive data protection and privacy compliance features
 * including consent management, data subject rights, privacy policy management,
 * and compliance reporting.
 */

import { createClient } from '../../crm-app/lib/supabase';
import { generateUUID } from '../utils/uuid';
import { logAuditEvent } from '../utils/audit';

export interface ConsentRecord {
  id?: string;
  userId: string;
  consentType: string;
  consentGiven: boolean;
  consentDate?: string;
  consentExpiry?: string;
  consentVersion: string;
  ipAddress?: string;
  userAgent?: string;
  consentMethod?: string;
  legalBasis: string;
  processingPurposes: string[];
  dataCategories: string[];
  thirdParties?: string[];
  internationalTransfers?: boolean;
  transferMechanisms?: string[];
  withdrawalDate?: string;
  withdrawalMethod?: string;
  isActive?: boolean;
}

export interface DataSubjectRequest {
  id?: string;
  userId: string;
  requestType: string;
  requestStatus?: string;
  requestDate?: string;
  requestedDataCategories: string[];
  requestDetails?: string;
  identityVerified?: boolean;
  verificationDate?: string;
  verificationMethod?: string;
  responseDate?: string;
  responseMethod?: string;
  responseDetails?: string;
  rejectionReason?: string;
  processingDeadline: string;
  escalated?: boolean;
  escalationDate?: string;
  assignedOfficer?: string;
  legalBasis?: string;
  dataLocation?: string;
  thirdPartiesNotified?: string[];
}

export interface PrivacyPolicy {
  id?: string;
  policyName: string;
  policyVersion: string;
  effectiveDate: string;
  expiryDate?: string;
  policyContent: string;
  language?: string;
  isActive?: boolean;
  changeSummary?: string;
  approvedBy?: string;
  approvalDate?: string;
  legalReviewDate?: string;
  nextReviewDate?: string;
  dataProtectionImpactAssessment?: boolean;
  dpeaReference?: string;
}

export interface ProcessingActivity {
  id?: string;
  activityName: string;
  activityDescription: string;
  controllerName: string;
  dpoContact?: string;
  legalBasis: string;
  processingPurposes: string[];
  dataCategories: string[];
  dataSubjects: string[];
  recipients?: string[];
  internationalTransfers?: boolean;
  transferCountries?: string[];
  transferMechanisms?: string[];
  retentionPeriod?: string;
  securityMeasures?: string[];
  automatedDecisionMaking?: boolean;
  profiling?: boolean;
  specialCategoryData?: boolean;
  consentRequired?: boolean;
  riskLevel?: string;
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
  isActive?: boolean;
}

export interface ComplianceMetrics {
  totalConsents: number;
  activeConsents: number;
  consentExpiryAlerts: number;
  dataSubjectRequests: number;
  pendingRequests: number;
  overdueRequests: number;
  privacyPolicies: number;
  activePolicies: number;
  processingActivities: number;
  highRiskActivities: number;
  complianceScore: number;
  incidentCount: number;
  openIncidents: number;
}

class PDPLComplianceService {
  private supabase = createClient();

  /**
   * Consent Management
   */
  async recordConsent(consent: Omit<ConsentRecord, 'id'>): Promise<ConsentRecord> {
    try {
      const { data, error } = await this.supabase
        .from('consent_records')
        .insert([{
          ...consent,
          consent_date: consent.consentDate || new Date().toISOString(),
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await logAuditEvent({
        userId: consent.userId,
        actionType: 'consent_given',
        resourceType: 'consent_record',
        resourceId: data.id,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        legalBasis: consent.legalBasis,
        processingPurpose: consent.processingPurposes.join(', ')
      });

      return data;
    } catch (error) {
      console.error('Error recording consent:', error);
      throw error;
    }
  }

  async withdrawConsent(userId: string, consentId: string, withdrawalMethod: string = 'web_form'): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('consent_records')
        .update({
          is_active: false,
          withdrawal_date: new Date().toISOString(),
          withdrawal_method: withdrawalMethod
        })
        .eq('id', consentId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log audit event
      await logAuditEvent({
        userId,
        actionType: 'consent_withdrawn',
        resourceType: 'consent_record',
        resourceId: consentId
      });
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      throw error;
    }
  }

  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    const { data, error } = await this.supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async checkConsentExpiry(): Promise<ConsentRecord[]> {
    const { data, error } = await this.supabase
      .from('consent_records')
      .select('*')
      .eq('is_active', true)
      .not('consent_expiry', 'is', null)
      .lt('consent_expiry', new Date().toISOString())
      .is('withdrawal_date', null);

    if (error) throw error;
    return data || [];
  }

  /**
   * Data Subject Rights Management
   */
  async createDataSubjectRequest(request: Omit<DataSubjectRequest, 'id' | 'requestDate' | 'requestStatus'>): Promise<DataSubjectRequest> {
    try {
      const processingDeadline = new Date();
      processingDeadline.setDate(processingDeadline.getDate() + 30); // 30 days under PDPL

      const { data, error } = await this.supabase
        .from('data_subject_requests')
        .insert([{
          ...request,
          request_date: new Date().toISOString(),
          request_status: 'pending',
          processing_deadline: processingDeadline.toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      await logAuditEvent({
        userId: request.userId,
        actionType: 'data_subject_request_created',
        resourceType: 'data_subject_request',
        resourceId: data.id
      });

      return data;
    } catch (error) {
      console.error('Error creating data subject request:', error);
      throw error;
    }
  }

  async updateRequestStatus(requestId: string, status: string, responseDetails?: string, assignedOfficer?: string): Promise<void> {
    try {
      const updateData: any = {
        request_status: status,
        updated_at: new Date().toISOString()
      };

      if (responseDetails) {
        updateData.response_details = responseDetails;
        updateData.response_date = new Date().toISOString();
      }

      if (assignedOfficer) {
        updateData.assigned_officer = assignedOfficer;
      }

      const { error } = await this.supabase
        .from('data_subject_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  async getOverdueRequests(): Promise<DataSubjectRequest[]> {
    const { data, error } = await this.supabase
      .from('data_subject_requests')
      .select('*')
      .lt('processing_deadline', new Date().toISOString().split('T')[0])
      .in('request_status', ['pending', 'in_progress']);

    if (error) throw error;
    return data || [];
  }

  /**
   * Privacy Policy Management
   */
  async createPrivacyPolicy(policy: Omit<PrivacyPolicy, 'id'>): Promise<PrivacyPolicy> {
    const { data, error } = await this.supabase
      .from('privacy_policies')
      .insert([policy])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getActivePrivacyPolicy(): Promise<PrivacyPolicy | null> {
    const { data, error } = await this.supabase
      .from('privacy_policies')
      .select('*')
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }

  async updatePrivacyPolicy(policyId: string, updates: Partial<PrivacyPolicy>): Promise<PrivacyPolicy> {
    const { data, error } = await this.supabase
      .from('privacy_policies')
      .update(updates)
      .eq('id', policyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Data Processing Activities
   */
  async createProcessingActivity(activity: Omit<ProcessingActivity, 'id'>): Promise<ProcessingActivity> {
    const { data, error } = await this.supabase
      .from('data_processing_activities')
      .insert([activity])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProcessingActivities(): Promise<ProcessingActivity[]> {
    const { data, error } = await this.supabase
      .from('data_processing_activities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getHighRiskActivities(): Promise<ProcessingActivity[]> {
    const { data, error } = await this.supabase
      .from('data_processing_activities')
      .select('*')
      .eq('is_active', true)
      .in('risk_level', ['high', 'critical'])
      .order('risk_level', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Compliance Metrics and Reporting
   */
  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    try {
      // Get consent metrics
      const { data: consentData } = await this.supabase
        .from('consent_records')
        .select('*');

      const totalConsents = consentData?.length || 0;
      const activeConsents = consentData?.filter(c => c.is_active)?.length || 0;
      const consentExpiryAlerts = consentData?.filter(c => 
        c.is_active && c.consent_expiry && 
        new Date(c.consent_expiry) < new Date() && !c.withdrawal_date
      )?.length || 0;

      // Get data subject request metrics
      const { data: requestData } = await this.supabase
        .from('data_subject_requests')
        .select('*');

      const dataSubjectRequests = requestData?.length || 0;
      const pendingRequests = requestData?.filter(r => r.request_status === 'pending')?.length || 0;
      const overdueRequests = requestData?.filter(r => 
        ['pending', 'in_progress'].includes(r.request_status) &&
        new Date(r.processing_deadline) < new Date()
      )?.length || 0;

      // Get privacy policy metrics
      const { data: policyData } = await this.supabase
        .from('privacy_policies')
        .select('*');

      const privacyPolicies = policyData?.length || 0;
      const activePolicies = policyData?.filter(p => p.is_active)?.length || 0;

      // Get processing activity metrics
      const { data: activityData } = await this.supabase
        .from('data_processing_activities')
        .select('*');

      const processingActivities = activityData?.length || 0;
      const highRiskActivities = activityData?.filter(a => 
        ['high', 'critical'].includes(a.risk_level)
      )?.length || 0;

      // Get incident metrics
      const { data: incidentData } = await this.supabase
        .from('compliance_incidents')
        .select('*');

      const incidentCount = incidentData?.length || 0;
      const openIncidents = incidentData?.filter(i => 
        ['investigating', 'contained'].includes(i.incident_status)
      )?.length || 0;

      // Calculate compliance score (simplified calculation)
      const complianceScore = this.calculateComplianceScore({
        totalConsents,
        activeConsents,
        consentExpiryAlerts,
        dataSubjectRequests,
        pendingRequests,
        overdueRequests,
        processingActivities,
        highRiskActivities,
        incidentCount,
        openIncidents
      });

      return {
        totalConsents,
        activeConsents,
        consentExpiryAlerts,
        dataSubjectRequests,
        pendingRequests,
        overdueRequests,
        privacyPolicies,
        activePolicies,
        processingActivities,
        highRiskActivities,
        complianceScore,
        incidentCount,
        openIncidents
      };
    } catch (error) {
      console.error('Error getting compliance metrics:', error);
      throw error;
    }
  }

  private calculateComplianceScore(metrics: any): number {
    let score = 100;

    // Deduct for overdue requests
    if (metrics.overdueRequests > 0) {
      score -= metrics.overdueRequests * 10;
    }

    // Deduct for consent expiry alerts
    if (metrics.consentExpiryAlerts > 0) {
      score -= metrics.consentExpiryAlerts * 5;
    }

    // Deduct for high-risk processing activities
    if (metrics.highRiskActivities > 0) {
      score -= metrics.highRiskActivities * 8;
    }

    // Deduct for open incidents
    if (metrics.openIncidents > 0) {
      score -= metrics.openIncidents * 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Data Export for Portability Rights
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      // Get all user consents
      const consents = await this.getUserConsents(userId);

      // Get all data subject requests
      const { data: requests } = await this.supabase
        .from('data_subject_requests')
        .select('*')
        .eq('user_id', userId);

      // Get audit trail for this user
      const { data: auditTrail } = await this.supabase
        .from('privacy_audit_trail')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        consents: consents || [],
        dataSubjectRequests: requests || [],
        auditTrail: auditTrail || []
      };

      // Log audit event
      await logAuditEvent({
        userId,
        actionType: 'data_exported',
        resourceType: 'user_data',
        legalBasis: 'data_subject_request'
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Data Deletion for Erasure Rights
   */
  async deleteUserData(userId: string, dataCategories: string[]): Promise<void> {
    try {
      // Note: In a real implementation, you would need to carefully consider
      // legal obligations to retain data and implement proper deletion procedures

      // Deactivate consents
      await this.supabase
        .from('consent_records')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Log audit event
      await logAuditEvent({
        userId,
        actionType: 'data_deleted',
        resourceType: 'user_data',
        newValues: { dataCategories }
      });
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  /**
   * Incident Management
   */
  async reportIncident(incident: any): Promise<void> {
    const { data, error } = await this.supabase
      .from('compliance_incidents')
      .insert([incident])
      .select()
      .single();

    if (error) throw error;

    // Log audit event
    await logAuditEvent({
      actionType: 'incident_reported',
      resourceType: 'compliance_incident',
      resourceId: data.id
    });
  }

  /**
   * Automated Compliance Checks
   */
  async runComplianceChecks(): Promise<any> {
    const results = {
      consentExpiryAlerts: await this.checkConsentExpiry(),
      overdueRequests: await this.getOverdueRequests(),
      highRiskActivities: await this.getHighRiskActivities(),
      checkDate: new Date().toISOString()
    };

    return results;
  }
}

export const pdplComplianceService = new PDPLComplianceService();
export default pdplComplianceService;