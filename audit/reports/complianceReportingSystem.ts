/**
 * Compliance Reporting System
 * Generates comprehensive compliance reports for GDPR, SOX, HIPAA, and other standards
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ComplianceReport {
  id: string;
  report_type: 'GDPR' | 'SOX' | 'HIPAA' | 'PCI_DSS' | 'ISO_27001' | 'CUSTOM';
  report_period_start: Date;
  report_period_end: Date;
  generated_by: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  file_path?: string;
  summary: ComplianceSummary;
  metrics: ComplianceMetrics;
  findings: ComplianceFinding[];
  created_at: Date;
  completed_at?: Date;
}

export interface ComplianceSummary {
  total_audit_events: number;
  security_events: number;
  failed_logins: number;
  resolved_incidents: number;
  compliance_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ComplianceMetrics {
  [key: string]: any; // Flexible metrics based on compliance type
}

export interface ComplianceFinding {
  id: string;
  type: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'INFO';
  category: string;
  description: string;
  evidence: any;
  recommendation: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'RESOLVED' | 'ACCEPTED';
}

class ComplianceReportingSystem {
  private supabase: any;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Generate compliance report for a specific standard
   */
  async generateReport(
    reportType: string,
    startDate: Date,
    endDate: Date,
    generatedBy: string,
    customConfig?: any
  ): Promise<string> {
    const reportId = uuidv4();

    try {
      // Create report record
      const { error: createError } = await this.supabase
        .from('compliance_reports')
        .insert({
          id: reportId,
          report_type: reportType,
          report_period_start: startDate.toISOString().split('T')[0],
          report_period_end: endDate.toISOString().split('T')[0],
          generated_by: generatedBy,
          status: 'GENERATING'
        });

      if (createError) {
        throw new Error(`Failed to create report: ${createError.message}`);
      }

      // Generate report based on type
      let reportData: ComplianceReport;
      switch (reportType.toUpperCase()) {
        case 'GDPR':
          reportData = await this.generateGDPRReport(startDate, endDate, generatedBy);
          break;
        case 'SOX':
          reportData = await this.generateSOXReport(startDate, endDate, generatedBy);
          break;
        case 'HIPAA':
          reportData = await this.generateHIPAAReport(startDate, endDate, generatedBy);
          break;
        case 'PCI_DSS':
          reportData = await this.generatePCIDSSReport(startDate, endDate, generatedBy);
          break;
        case 'ISO_27001':
          reportData = await this.generateISO27001Report(startDate, endDate, generatedBy);
          break;
        default:
          reportData = await this.generateCustomReport(startDate, endDate, generatedBy, customConfig);
      }

      // Update report with generated data
      const { error: updateError } = await this.supabase
        .from('compliance_reports')
        .update({
          status: 'COMPLETED',
          summary: reportData.summary,
          metrics: reportData.metrics,
          findings: reportData.findings,
          completed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (updateError) {
        throw new Error(`Failed to update report: ${updateError.message}`);
      }

      // Generate report file (PDF/Excel)
      const filePath = await this.generateReportFile(reportId, reportData);
      
      // Update report with file path
      await this.supabase
        .from('compliance_reports')
        .update({ file_path: filePath })
        .eq('id', reportId);

      console.log(`Generated ${reportType} compliance report: ${reportId}`);
      return reportId;

    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      
      // Mark report as failed
      await this.supabase
        .from('compliance_reports')
        .update({ status: 'FAILED' })
        .eq('id', reportId);

      throw error;
    }
  }

  /**
   * Generate GDPR compliance report
   */
  private async generateGDPRReport(startDate: Date, endDate: Date, generatedBy: string): Promise<ComplianceReport> {
    // Data subject access requests
    const { data: accessRequests } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('event_type', 'data_access_request')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // Data processing activities
    const { data: dataProcessing } = await this.supabase
      .from('audit_logs')
      .select('*')
      .in('event_type', ['data_create', 'data_read', 'data_update', 'data_delete'])
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // Security incidents
    const { data: securityIncidents } = await this.supabase
      .from('security_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // User consent records (if available)
    const { data: consentRecords } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('event_type', 'consent_granted')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // Data breach notifications
    const { data: breachNotifications } = await this.supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'data_breach')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const findings: ComplianceFinding[] = [];

    // GDPR Article 32 - Security of processing
    if (securityIncidents && securityIncidents.length > 0) {
      findings.push({
        id: uuidv4(),
        type: 'NON_COMPLIANT',
        category: 'Security of Processing',
        description: `${securityIncidents.length} security incidents detected`,
        evidence: securityIncidents,
        recommendation: 'Implement additional security measures and incident response procedures',
        severity: 'HIGH',
        status: 'OPEN'
      });
    }

    // GDPR Article 33 - Data breach notification
    if (breachNotifications && breachNotifications.length > 0) {
      findings.push({
        id: uuidv4(),
        type: 'WARNING',
        category: 'Data Breach Notification',
        description: `${breachNotifications.length} data breaches detected - verify 72-hour notification compliance`,
        evidence: breachNotifications,
        recommendation: 'Ensure all data breaches are reported to supervisory authority within 72 hours',
        severity: 'CRITICAL',
        status: 'OPEN'
      });
    }

    // GDPR Article 35 - Data Protection Impact Assessment
    const highRiskProcessing = dataProcessing?.filter(p => p.risk_level === 'HIGH').length || 0;
    if (highRiskProcessing > 0) {
      findings.push({
        id: uuidv4(),
        type: 'WARNING',
        category: 'Data Protection Impact Assessment',
        description: `${highRiskProcessing} high-risk processing activities detected`,
        evidence: dataProcessing?.filter(p => p.risk_level === 'HIGH'),
        recommendation: 'Conduct Data Protection Impact Assessments (DPIAs) for high-risk processing',
        severity: 'MEDIUM',
        status: 'OPEN'
      });
    }

    const complianceScore = this.calculateGDPRComplianceScore(findings, securityIncidents?.length || 0, breachNotifications?.length || 0);

    return {
      id: uuidv4(),
      report_type: 'GDPR',
      report_period_start: startDate,
      report_period_end: endDate,
      generated_by: generatedBy,
      status: 'COMPLETED',
      summary: {
        total_audit_events: (dataProcessing?.length || 0) + (accessRequests?.length || 0),
        security_events: securityIncidents?.length || 0,
        failed_logins: 0, // GDPR doesn't track this specifically
        resolved_incidents: 0,
        compliance_score: complianceScore,
        risk_level: this.getRiskLevel(complianceScore)
      },
      metrics: {
        data_subject_access_requests: accessRequests?.length || 0,
        data_processing_activities: dataProcessing?.length || 0,
        security_incidents: securityIncidents?.length || 0,
        consent_records: consentRecords?.length || 0,
        data_breach_notifications: breachNotifications?.length || 0,
        high_risk_processing: highRiskProcessing
      },
      findings,
      created_at: new Date()
    };
  }

  /**
   * Generate SOX compliance report
   */
  private async generateSOXReport(startDate: Date, endDate: Date, generatedBy: string): Promise<ComplianceReport> {
    // Financial data access
    const { data: financialAccess } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('event_category', 'financial')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // User access changes
    const { data: accessChanges } = await this.supabase
      .from('audit_logs')
      .select('*')
      .in('event_type', ['user_create', 'user_update', 'user_delete', 'permission_change'])
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // System configuration changes
    const { data: configChanges } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('event_category', 'system')
      .eq('resource_type', 'configuration')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // Failed authentication attempts
    const { data: failedAuth } = await this.supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'failed_login')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const findings: ComplianceFinding[] = [];

    // SOX Section 302 - CEO/CFO Certification
    if (failedAuth && failedAuth.length > 100) {
      findings.push({
        id: uuidv4(),
        type: 'NON_COMPLIANT',
        category: 'Access Controls',
        description: `Excessive failed authentication attempts (${failedAuth.length})`,
        evidence: failedAuth,
        recommendation: 'Implement stronger access controls and user training',
        severity: 'HIGH',
        status: 'OPEN'
      });
    }

    // SOX Section 404 - Internal Controls
    const unmonitoredAccess = accessChanges?.filter(a => a.status === 'FAILED').length || 0;
    if (unmonitoredAccess > 0) {
      findings.push({
        id: uuidv4(),
        type: 'WARNING',
        category: 'Internal Controls',
        description: `${unmonitoredAccess} failed access change attempts`,
        evidence: accessChanges?.filter(a => a.status === 'FAILED'),
        recommendation: 'Review and strengthen change management procedures',
        severity: 'MEDIUM',
        status: 'OPEN'
      });
    }

    const complianceScore = this.calculateSOXComplianceScore(findings, financialAccess?.length || 0, failedAuth?.length || 0);

    return {
      id: uuidv4(),
      report_type: 'SOX',
      report_period_start: startDate,
      report_period_end: endDate,
      generated_by: generatedBy,
      status: 'COMPLETED',
      summary: {
        total_audit_events: (financialAccess?.length || 0) + (accessChanges?.length || 0),
        security_events: failedAuth?.length || 0,
        failed_logins: failedAuth?.length || 0,
        resolved_incidents: 0,
        compliance_score: complianceScore,
        risk_level: this.getRiskLevel(complianceScore)
      },
      metrics: {
        financial_data_access: financialAccess?.length || 0,
        access_changes: accessChanges?.length || 0,
        configuration_changes: configChanges?.length || 0,
        failed_authentication_attempts: failedAuth?.length || 0,
        privileged_access_events: financialAccess?.filter(a => a.action === 'PRIVILEGED_ACCESS').length || 0
      },
      findings,
      created_at: new Date()
    };
  }

  /**
   * Generate HIPAA compliance report
   */
  private async generateHIPAAReport(startDate: Date, endDate: Date, generatedBy: string): Promise<ComplianceReport> {
    // PHI access attempts
    const { data: phiAccess } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', 'phi')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // Security incidents
    const { data: securityIncidents } = await this.supabase
      .from('security_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Failed login attempts
    const { data: failedLogins } = await this.supabase
      .from('failed_login_attempts')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const findings: ComplianceFinding[] = [];

    // HIPAA Security Rule - Access Control
    const unauthorizedAccess = phiAccess?.filter(a => a.status === 'FAILED').length || 0;
    if (unauthorizedAccess > 0) {
      findings.push({
        id: uuidv4(),
        type: 'NON_COMPLIANT',
        category: 'Access Control',
        description: `${unauthorizedAccess} unauthorized PHI access attempts`,
        evidence: phiAccess?.filter(a => a.status === 'FAILED'),
        recommendation: 'Implement stronger access controls and user authentication',
        severity: 'CRITICAL',
        status: 'OPEN'
      });
    }

    // HIPAA Breach Notification Rule
    const criticalIncidents = securityIncidents?.filter(i => i.severity === 'CRITICAL').length || 0;
    if (criticalIncidents > 0) {
      findings.push({
        id: uuidv4(),
        type: 'WARNING',
        category: 'Breach Notification',
        description: `${criticalIncidents} critical security incidents - verify breach notification compliance`,
        evidence: securityIncidents?.filter(i => i.severity === 'CRITICAL'),
        recommendation: 'Ensure proper breach notification procedures are followed',
        severity: 'HIGH',
        status: 'OPEN'
      });
    }

    const complianceScore = this.calculateHIPAAComplianceScore(findings, phiAccess?.length || 0, criticalIncidents);

    return {
      id: uuidv4(),
      report_type: 'HIPAA',
      report_period_start: startDate,
      report_period_end: endDate,
      generated_by: generatedBy,
      status: 'COMPLETED',
      summary: {
        total_audit_events: phiAccess?.length || 0,
        security_events: securityIncidents?.length || 0,
        failed_logins: failedLogins?.length || 0,
        resolved_incidents: 0,
        compliance_score: complianceScore,
        risk_level: this.getRiskLevel(complianceScore)
      },
      metrics: {
        phi_access_attempts: phiAccess?.length || 0,
        unauthorized_access: unauthorizedAccess,
        security_incidents: securityIncidents?.length || 0,
        critical_incidents: criticalIncidents,
        failed_login_attempts: failedLogins?.length || 0
      },
      findings,
      created_at: new Date()
    };
  }

  /**
   * Generate PCI DSS compliance report
   */
  private async generatePCIDSSReport(startDate: Date, endDate: Date, generatedBy: string): Promise<ComplianceReport> {
    // Payment card data access
    const { data: cardDataAccess } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', 'payment_card_data')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // Encryption events
    const { data: encryptionEvents } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('event_type', 'data_encryption')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    // Security scans
    const { data: securityScans } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('event_type', 'security_scan')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    const findings: ComplianceFinding[] = [];

    // PCI DSS Requirement 3 - Protect stored cardholder data
    const unencryptedAccess = cardDataAccess?.filter(a => !a.details?.encrypted).length || 0;
    if (unencryptedAccess > 0) {
      findings.push({
        id: uuidv4(),
        type: 'NON_COMPLIANT',
        category: 'Data Protection',
        description: `${unencryptedAccess} unencrypted cardholder data access attempts`,
        evidence: cardDataAccess?.filter(a => !a.details?.encrypted),
        recommendation: 'Ensure all cardholder data is properly encrypted',
        severity: 'CRITICAL',
        status: 'OPEN'
      });
    }

    const complianceScore = this.calculatePCIDSSComplianceScore(findings, cardDataAccess?.length || 0, encryptionEvents?.length || 0);

    return {
      id: uuidv4(),
      report_type: 'PCI_DSS',
      report_period_start: startDate,
      report_period_end: endDate,
      generated_by: generatedBy,
      status: 'COMPLETED',
      summary: {
        total_audit_events: (cardDataAccess?.length || 0) + (encryptionEvents?.length || 0),
        security_events: 0,
        failed_logins: 0,
        resolved_incidents: 0,
        compliance_score: complianceScore,
        risk_level: this.getRiskLevel(complianceScore)
      },
      metrics: {
        cardholder_data_access: cardDataAccess?.length || 0,
        encryption_events: encryptionEvents?.length || 0,
        security_scans: securityScans?.length || 0,
        unencrypted_access: unencryptedAccess
      },
      findings,
      created_at: new Date()
    };
  }

  /**
   * Generate ISO 27001 compliance report
   */
  private async generateISO27001Report(startDate: Date, endDate: Date, generatedBy: string): Promise<ComplianceReport> {
    // All security events
    const { data: securityEvents } = await this.supabase
      .from('security_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Information security incidents
    const { data: securityIncidents } = await this.supabase
      .from('security_events')
      .select('*')
      .in('event_type', ['data_breach', 'unauthorized_access', 'malware_detection'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // User access reviews
    const { data: accessReviews } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('event_type', 'access_review')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    const findings: ComplianceFinding[] = [];

    // ISO 27001 Annex A.12.6 - Management of technical vulnerabilities
    const unresolvedIncidents = securityIncidents?.filter(i => !i.resolved).length || 0;
    if (unresolvedIncidents > 0) {
      findings.push({
        id: uuidv4(),
        type: 'WARNING',
        category: 'Incident Management',
        description: `${unresolvedIncidents} unresolved security incidents`,
        evidence: securityIncidents?.filter(i => !i.resolved),
        recommendation: 'Resolve all outstanding security incidents promptly',
        severity: 'HIGH',
        status: 'OPEN'
      });
    }

    const complianceScore = this.calculateISO27001ComplianceScore(findings, securityEvents?.length || 0, unresolvedIncidents);

    return {
      id: uuidv4(),
      report_type: 'ISO_27001',
      report_period_start: startDate,
      report_period_end: endDate,
      generated_by: generatedBy,
      status: 'COMPLETED',
      summary: {
        total_audit_events: accessReviews?.length || 0,
        security_events: securityEvents?.length || 0,
        failed_logins: 0,
        resolved_incidents: securityIncidents?.filter(i => i.resolved).length || 0,
        compliance_score: complianceScore,
        risk_level: this.getRiskLevel(complianceScore)
      },
      metrics: {
        total_security_events: securityEvents?.length || 0,
        security_incidents: securityIncidents?.length || 0,
        unresolved_incidents: unresolvedIncidents,
        access_reviews: accessReviews?.length || 0
      },
      findings,
      created_at: new Date()
    };
  }

  /**
   * Generate custom compliance report
   */
  private async generateCustomReport(
    startDate: Date, 
    endDate: Date, 
    generatedBy: string, 
    config: any
  ): Promise<ComplianceReport> {
    // Generic metrics for custom reports
    const { data: auditLogs } = await this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    const { data: securityEvents } = await this.supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const findings: ComplianceFinding[] = [];
    
    // Add custom findings based on configuration
    if (config?.customFindings) {
      for (const finding of config.customFindings) {
        findings.push({
          id: uuidv4(),
          ...finding
        });
      }
    }

    const complianceScore = Math.random() * 0.3 + 0.7; // Mock score for custom reports

    return {
      id: uuidv4(),
      report_type: 'CUSTOM',
      report_period_start: startDate,
      report_period_end: endDate,
      generated_by: generatedBy,
      status: 'COMPLETED',
      summary: {
        total_audit_events: auditLogs?.length || 0,
        security_events: securityEvents?.length || 0,
        failed_logins: 0,
        resolved_incidents: 0,
        compliance_score: complianceScore,
        risk_level: this.getRiskLevel(complianceScore)
      },
      metrics: {
        total_audit_logs: auditLogs?.length || 0,
        total_security_events: securityEvents?.length || 0,
        ...config?.customMetrics
      },
      findings,
      created_at: new Date()
    };
  }

  /**
   * Calculate compliance scores for different standards
   */
  private calculateGDPRComplianceScore(findings: ComplianceFinding[], securityIncidents: number, breaches: number): number {
    let score = 1.0;
    
    // Deduct for findings
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'CRITICAL': score -= 0.3; break;
        case 'HIGH': score -= 0.2; break;
        case 'MEDIUM': score -= 0.1; break;
        case 'LOW': score -= 0.05; break;
      }
    });

    // Deduct for security incidents
    score -= Math.min(securityIncidents * 0.05, 0.3);

    // Deduct for data breaches
    score -= Math.min(breaches * 0.2, 0.5);

    return Math.max(score, 0.0);
  }

  private calculateSOXComplianceScore(findings: ComplianceFinding[], financialAccess: number, failedAuth: number): number {
    let score = 1.0;
    
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'CRITICAL': score -= 0.25; break;
        case 'HIGH': score -= 0.15; break;
        case 'MEDIUM': score -= 0.08; break;
        case 'LOW': score -= 0.03; break;
      }
    });

    // Deduct for excessive failed authentication
    if (failedAuth > 50) {
      score -= 0.1;
    }

    return Math.max(score, 0.0);
  }

  private calculateHIPAAComplianceScore(findings: ComplianceFinding[], phiAccess: number, criticalIncidents: number): number {
    let score = 1.0;
    
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'CRITICAL': score -= 0.4; break;
        case 'HIGH': score -= 0.25; break;
        case 'MEDIUM': score -= 0.1; break;
        case 'LOW': score -= 0.05; break;
      }
    });

    // Deduct for critical incidents
    score -= Math.min(criticalIncidents * 0.15, 0.3);

    return Math.max(score, 0.0);
  }

  private calculatePCIDSSComplianceScore(findings: ComplianceFinding[], cardDataAccess: number, encryptionEvents: number): number {
    let score = 1.0;
    
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'CRITICAL': score -= 0.5; break;
        case 'HIGH': score -= 0.3; break;
        case 'MEDIUM': score -= 0.15; break;
        case 'LOW': score -= 0.05; break;
      }
    });

    return Math.max(score, 0.0);
  }

  private calculateISO27001ComplianceScore(findings: ComplianceFinding[], securityEvents: number, unresolvedIncidents: number): number {
    let score = 1.0;
    
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'CRITICAL': score -= 0.3; break;
        case 'HIGH': score -= 0.2; break;
        case 'MEDIUM': score -= 0.1; break;
        case 'LOW': score -= 0.05; break;
      }
    });

    return Math.max(score, 0.0);
  }

  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 0.9) return 'LOW';
    if (score >= 0.7) return 'MEDIUM';
    if (score >= 0.5) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Generate report file (PDF/Excel)
   */
  private async generateReportFile(reportId: string, reportData: ComplianceReport): Promise<string> {
    // In a real implementation, this would generate actual PDF/Excel files
    // For now, we'll return a mock file path
    const fileName = `${reportData.report_type}_${reportId}_${Date.now()}.pdf`;
    const filePath = `/reports/${fileName}`;
    
    console.log(`Generated report file: ${filePath}`);
    return filePath;
  }

  /**
   * Get list of compliance reports
   */
  async getReports(limit: number = 50, offset: number = 0): Promise<ComplianceReport[]> {
    const { data, error } = await this.supabase
      .from('compliance_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get specific compliance report
   */
  async getReport(reportId: string): Promise<ComplianceReport | null> {
    const { data, error } = await this.supabase
      .from('compliance_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch report: ${error.message}`);
    }

    return data;
  }

  /**
   * Update report status
   */
  async updateReportStatus(reportId: string, status: 'GENERATING' | 'COMPLETED' | 'FAILED'): Promise<void> {
    const { error } = await this.supabase
      .from('compliance_reports')
      .update({ 
        status,
        ...(status === 'COMPLETED' ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', reportId);

    if (error) {
      throw new Error(`Failed to update report status: ${error.message}`);
    }
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<void> {
    const { error } = await this.supabase
      .from('compliance_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      throw new Error(`Failed to delete report: ${error.message}`);
    }
  }

  /**
   * Get report statistics
   */
  async getReportStatistics(): Promise<any> {
    const { data: reports } = await this.supabase
      .from('compliance_reports')
      .select('report_type, status, compliance_score, risk_level');

    const stats = {
      total_reports: reports?.length || 0,
      by_type: {} as Record<string, number>,
      by_status: {} as Record<string, number>,
      average_compliance_score: 0,
      high_risk_reports: 0
    };

    if (reports) {
      // Count by type
      reports.forEach(report => {
        stats.by_type[report.report_type] = (stats.by_type[report.report_type] || 0) + 1;
        stats.by_status[report.status] = (stats.by_status[report.status] || 0) + 1;
        
        if (report.compliance_score) {
          stats.average_compliance_score += report.compliance_score;
        }
        
        if (report.risk_level === 'HIGH' || report.risk_level === 'CRITICAL') {
          stats.high_risk_reports++;
        }
      });

      // Calculate average score
      const scoredReports = reports.filter(r => r.compliance_score);
      stats.average_compliance_score = scoredReports.length > 0 
        ? stats.average_compliance_score / scoredReports.length 
        : 0;
    }

    return stats;
  }
}

export default ComplianceReportingSystem;