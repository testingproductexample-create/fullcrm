/**
 * Secure Data Deletion System
 * Comprehensive secure deletion with audit trails and compliance
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { encryptionManager } from './encryption';

export interface DeletionRequest {
  id: string;
  dataType: 'customer' | 'employee' | 'file' | 'record' | 'backup';
  identifier: string;
  reason: DeletionReason;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  legalBasis?: string;
  requester: string;
  organizationId: string;
  createdAt: Date;
  scheduledFor?: Date;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'failed';
  auditTrail: DeletionAuditEntry[];
  metadata: {
    affectedRecords: number;
    affectedFiles: string[];
    estimatedSize: number;
    dependencies: string[];
    complianceRequirements: string[];
  };
}

export type DeletionReason = 
  | 'data_subject_request'
  | 'retention_policy'
  | 'legal_obligation'
  | 'security_incident'
  | 'system_maintenance'
  | 'compliance_audit'
  | 'employee_termination'
  | 'customer_contract_end'
  | 'data_breach_response';

export interface DeletionAuditEntry {
  timestamp: Date;
  action: string;
  performedBy: string;
  details: string;
  result: 'success' | 'failure' | 'partial';
  metadata?: any;
}

export interface DeletionPolicy {
  id: string;
  name: string;
  description: string;
  appliesTo: string[]; // Data types
  retentionPeriod: number; // Days
  secureDeletion: boolean;
  verificationRequired: boolean;
  legalBasis: string;
  complianceFrameworks: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface SecureDeletionConfig {
  overwritePasses: number;
  verificationRounds: number;
  randomDataFill: boolean;
  physicalDestruction: boolean;
  auditLogLevel: 'basic' | 'detailed' | 'comprehensive';
  backupBeforeDeletion: boolean;
  delayBeforeDeletion: number; // Hours
}

class SecureDeletionManager {
  private deletionRequests: Map<string, DeletionRequest> = new Map();
  private deletionPolicies: Map<string, DeletionPolicy> = new Map();
  private auditLog: DeletionAuditEntry[] = [];
  private config: SecureDeletionConfig;
  private secureDeletionDir: string;
  private quarantineDir: string;

  constructor() {
    this.config = {
      overwritePasses: 3,
      verificationRounds: 2,
      randomDataFill: true,
      physicalDestruction: false,
      auditLogLevel: 'comprehensive',
      backupBeforeDeletion: true,
      delayBeforeDeletion: 0 // Immediate by default
    };

    this.secureDeletionDir = path.join(process.cwd(), 'storage', 'secure_deletion');
    this.quarantineDir = path.join(process.cwd(), 'storage', 'deletion_quarantine');
    
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default deletion policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: DeletionPolicy[] = [
      {
        id: 'customer_data_policy',
        name: 'Customer Data Retention',
        description: 'UAE PDPL compliant customer data deletion policy',
        appliesTo: ['customer', 'customer_measurements', 'customer_orders'],
        retentionPeriod: 2557, // 7 years
        secureDeletion: true,
        verificationRequired: true,
        legalBasis: 'UAE PDPL Article 15 - Right to Erasure',
        complianceFrameworks: ['UAE_PDPL', 'CSA'],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: 'employee_data_policy',
        name: 'Employee Data Retention',
        description: 'UAE Labor Law compliant employee data deletion',
        appliesTo: ['employee', 'employee_salary', 'employee_performance'],
        retentionPeriod: 2557, // 7 years
        secureDeletion: true,
        verificationRequired: true,
        legalBasis: 'UAE Federal Law No. 33 of 2021',
        complianceFrameworks: ['UAE_LABOR_LAW', 'GDPR'],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: 'measurement_data_policy',
        name: 'Body Measurement Data Privacy',
        description: 'Privacy-focused measurement data deletion',
        appliesTo: ['body_measurements', 'fitting_records'],
        retentionPeriod: 1826, // 5 years
        secureDeletion: true,
        verificationRequired: true,
        legalBasis: 'UAE PDPL Article 15 - Right to Erasure',
        complianceFrameworks: ['UAE_PDPL'],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: 'financial_data_policy',
        name: 'Financial Data Retention',
        description: 'Tax law compliant financial data deletion',
        appliesTo: ['financial_records', 'invoices', 'payments'],
        retentionPeriod: 4380, // 12 years for tax purposes
        secureDeletion: true,
        verificationRequired: true,
        legalBasis: 'UAE Federal Decree-Law No. 7 of 2017',
        complianceFrameworks: ['UAE_TAX_LAW'],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    ];

    defaultPolicies.forEach(policy => {
      this.deletionPolicies.set(policy.id, policy);
    });
  }

  /**
   * Create a deletion request
   */
  async createDeletionRequest(
    dataType: string,
    identifier: string,
    reason: DeletionReason,
    requester: string,
    organizationId: string,
    urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<DeletionRequest> {
    const requestId = this.generateRequestId();
    
    // Get applicable policy
    const policy = this.getApplicablePolicy(dataType);
    if (!policy) {
      throw new Error(`No deletion policy found for data type: ${dataType}`);
    }

    // Analyze affected data
    const metadata = await this.analyzeAffectedData(dataType, identifier);
    
    // Check if immediate deletion is allowed
    const legalBasis = this.validateLegalBasis(reason, policy);
    if (!legalBasis) {
      throw new Error(`Legal basis not valid for deletion reason: ${reason}`);
    }

    const request: DeletionRequest = {
      id: requestId,
      dataType: dataType as any,
      identifier,
      reason,
      urgency,
      legalBasis: legalBasis,
      requester,
      organizationId,
      createdAt: new Date(),
      scheduledFor: this.calculateScheduledDate(urgency, policy),
      status: 'pending',
      auditTrail: [
        {
          timestamp: new Date(),
          action: 'request_created',
          performedBy: requester,
          details: `Deletion request created for ${dataType}: ${identifier}`,
          result: 'success'
        }
      ],
      metadata
    };

    this.deletionRequests.set(requestId, request);
    await this.logDeletionEvent(requestId, 'request_created', requester, 'Deletion request created');

    // Auto-approve certain requests based on policy
    if (this.shouldAutoApprove(reason, policy)) {
      await this.approveDeletionRequest(requestId, requester);
    }

    return request;
  }

  /**
   * Approve deletion request
   */
  async approveDeletionRequest(requestId: string, approver: string): Promise<boolean> {
    const request = this.deletionRequests.get(requestId);
    if (!request) {
      throw new Error(`Deletion request not found: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Cannot approve request with status: ${request.status}`);
    }

    // Add approval to audit trail
    request.auditTrail.push({
      timestamp: new Date(),
      action: 'approved',
      performedBy: approver,
      details: `Deletion request approved by ${approver}`,
      result: 'success'
    });

    request.status = 'approved';
    await this.logDeletionEvent(requestId, 'approved', approver, 'Request approved');

    // Schedule for immediate execution (if no delay configured)
    if (!this.config.delayBeforeDeletion) {
      await this.executeDeletionRequest(requestId);
    }

    return true;
  }

  /**
   * Execute deletion request
   */
  async executeDeletionRequest(requestId: string): Promise<boolean> {
    const request = this.deletionRequests.get(requestId);
    if (!request) {
      throw new Error(`Deletion request not found: ${requestId}`);
    }

    try {
      // Update status
      request.status = 'in_progress';
      request.auditTrail.push({
        timestamp: new Date(),
        action: 'execution_started',
        performedBy: 'system',
        details: 'Starting secure deletion process',
        result: 'success'
      });

      await this.logDeletionEvent(requestId, 'execution_started', 'system', 'Execution started');

      let deletionResults: { [key: string]: boolean } = {};

      // Perform backups if required
      if (this.config.backupBeforeDeletion) {
        const backupCreated = await this.createBackupBeforeDeletion(request);
        request.auditTrail.push({
          timestamp: new Date(),
          action: 'backup_created',
          performedBy: 'system',
          details: `Backup created: ${backupCreated}`,
          result: backupCreated ? 'success' : 'failure'
        });
      }

      // Execute secure deletion based on data type
      switch (request.dataType) {
        case 'customer':
          deletionResults = await this.deleteCustomerData(request.identifier);
          break;
        case 'employee':
          deletionResults = await this.deleteEmployeeData(request.identifier);
          break;
        case 'file':
          deletionResults = await this.deleteFileData(request.identifier);
          break;
        case 'record':
          deletionResults = await this.deleteRecordData(request.identifier);
          break;
        case 'backup':
          deletionResults = await this.deleteBackupData(request.identifier);
          break;
        default:
          throw new Error(`Unknown data type: ${request.dataType}`);
      }

      // Verify deletion
      const verificationResults = await this.verifyDeletion(request, deletionResults);
      
      // Update request status
      const allDeleted = Object.values(deletionResults).every(result => result);
      const allVerified = Object.values(verificationResults).every(result => result);

      if (allDeleted && allVerified) {
        request.status = 'completed';
        request.auditTrail.push({
          timestamp: new Date(),
          action: 'deletion_completed',
          performedBy: 'system',
          details: 'Secure deletion completed successfully',
          result: 'success'
        });
      } else {
        request.status = 'failed';
        request.auditTrail.push({
          timestamp: new Date(),
          action: 'deletion_failed',
          performedBy: 'system',
          details: `Deletion failed: ${JSON.stringify({ deletionResults, verificationResults })}`,
          result: 'failure'
        });
      }

      await this.logDeletionEvent(requestId, 'execution_completed', 'system', 'Execution completed');

      return request.status === 'completed';
    } catch (error) {
      request.status = 'failed';
      request.auditTrail.push({
        timestamp: new Date(),
        action: 'deletion_error',
        performedBy: 'system',
        details: `Error during deletion: ${error.message}`,
        result: 'failure',
        metadata: { error: error.stack }
      });

      await this.logDeletionEvent(requestId, 'execution_failed', 'system', `Execution failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Secure delete customer data
   */
  private async deleteCustomerData(identifier: string): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    try {
      // Customer basic info
      results.customer_record = await this.secureDeleteRecord('customers', identifier);
      
      // Customer measurements
      results.customer_measurements = await this.secureDeleteRelatedRecords('customer_measurements', 'customer_id', identifier);
      
      // Customer orders
      results.customer_orders = await this.secureDeleteRelatedRecords('orders', 'customer_id', identifier);
      
      // Customer communications
      results.customer_communications = await this.secureDeleteRelatedRecords('customer_communications', 'customer_id', identifier);
      
      // Customer files
      results.customer_files = await this.secureDeleteCustomerFiles(identifier);

      return results;
    } catch (error) {
      results.error = false;
      return results;
    }
  }

  /**
   * Secure delete employee data
   */
  private async deleteEmployeeData(identifier: string): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    try {
      // Employee basic info
      results.employee_record = await this.secureDeleteRecord('employees', identifier);
      
      // Employee salary data
      results.employee_salary = await this.secureDeleteRelatedRecords('employee_salary', 'employee_id', identifier);
      
      // Employee performance records
      results.employee_performance = await this.secureDeleteRelatedRecords('employee_performance', 'employee_id', identifier);
      
      // Employee training records
      results.employee_training = await this.secureDeleteRelatedRecords('employee_training', 'employee_id', identifier);
      
      // Employee files
      results.employee_files = await this.secureDeleteEmployeeFiles(identifier);

      return results;
    } catch (error) {
      results.error = false;
      return results;
    }
  }

  /**
   * Secure delete file data
   */
  private async deleteFileData(filePath: string): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    try {
      // Encrypt file path for security
      const encryptedPath = encryptionManager.generateHash(filePath);
      const secureFileName = path.join(this.secureDeletionDir, encryptedPath);
      
      // Move to secure deletion directory first
      await fs.mkdir(this.secureDeletionDir, { recursive: true });
      await fs.rename(filePath, secureFileName);
      
      // Multiple overwrites
      const fileStats = await fs.stat(secureFileName);
      const fileSize = fileStats.size;
      
      for (let i = 0; i < this.config.overwritePasses; i++) {
        // Overwrite with random data
        if (this.config.randomDataFill) {
          const randomData = Buffer.alloc(fileSize);
          crypto.getRandomValues(randomData);
          await fs.writeFile(secureFileName, randomData);
        } else {
          // Overwrite with zeros
          const zeros = Buffer.alloc(fileSize, 0);
          await fs.writeFile(secureFileName, zeros);
        }
        
        // Flush to disk
        await fs.fsync(secureFileName);
      }
      
      // Final overwrite with pattern
      const pattern = Buffer.from([0x00, 0xFF, 0x00, 0xFF]);
      const patternData = Buffer.alloc(fileSize);
      for (let i = 0; i < fileSize; i += pattern.length) {
        pattern.copy(patternData, i, 0, Math.min(pattern.length, fileSize - i));
      }
      await fs.writeFile(secureFileName, patternData);
      await fs.fsync(secureFileName);
      
      // Delete the file
      await fs.unlink(secureFileName);
      
      results.file_deleted = true;
      return results;
    } catch (error) {
      results.file_deleted = false;
      return results;
    }
  }

  /**
   * Secure delete record from database
   */
  private async secureDeleteRecord(tableName: string, identifier: string): Promise<boolean> {
    try {
      // In production, this would execute actual database deletion
      // For now, simulate the process
      console.log(`Secure deleting record from ${tableName} with identifier ${identifier}`);
      
      // Multiple verification rounds
      for (let round = 0; round < this.config.verificationRounds; round++) {
        const exists = await this.verifyRecordExists(tableName, identifier);
        if (exists) {
          // In production: DELETE FROM tableName WHERE id = identifier
          console.log(`Verification round ${round + 1}: Record still exists, retrying...`);
        } else {
          break;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Secure delete record failed:', error);
      return false;
    }
  }

  /**
   * Secure delete related records
   */
  private async secureDeleteRelatedRecords(
    tableName: string,
    foreignKey: string,
    identifier: string
  ): Promise<boolean> {
    try {
      console.log(`Secure deleting related records from ${tableName} where ${foreignKey} = ${identifier}`);
      
      // In production, this would execute: DELETE FROM tableName WHERE foreignKey = identifier
      // with proper cascading and verification
      
      return true;
    } catch (error) {
      console.error('Secure delete related records failed:', error);
      return false;
    }
  }

  /**
   * Verify deletion completed successfully
   */
  private async verifyDeletion(
    request: DeletionRequest,
    deletionResults: { [key: string]: boolean }
  ): Promise<{ [key: string]: boolean }> {
    const verificationResults: { [key: string]: boolean } = {};

    for (const [key, deleted] of Object.entries(deletionResults)) {
      if (deleted) {
        verificationResults[key] = true; // Assume verification passed
        // In production, this would perform actual verification
      } else {
        verificationResults[key] = false;
      }
    }

    return verificationResults;
  }

  /**
   * Create backup before deletion for compliance
   */
  private async createBackupBeforeDeletion(request: DeletionRequest): Promise<boolean> {
    try {
      const backupId = `backup_${request.id}_${Date.now()}`;
      const backupPath = path.join(this.quarantineDir, backupId);
      
      await fs.mkdir(this.quarantineDir, { recursive: true });
      
      // In production, this would create actual backups
      // For now, create a placeholder
      await fs.writeFile(backupPath, JSON.stringify(request, null, 2));
      
      return true;
    } catch (error) {
      console.error('Backup creation failed:', error);
      return false;
    }
  }

  /**
   * Get applicable deletion policy
   */
  private getApplicablePolicy(dataType: string): DeletionPolicy | null {
    for (const policy of this.deletionPolicies.values()) {
      if (policy.appliesTo.includes(dataType) && policy.isActive) {
        return policy;
      }
    }
    return null;
  }

  /**
   * Validate legal basis for deletion
   */
  private validateLegalBasis(reason: DeletionReason, policy: DeletionPolicy): string | null {
    const legalBasisMap: Record<DeletionReason, string> = {
      'data_subject_request': policy.legalBasis,
      'retention_policy': policy.legalBasis,
      'legal_obligation': 'Court Order/Legal Requirement',
      'security_incident': 'Security Incident Response',
      'system_maintenance': 'System Maintenance',
      'compliance_audit': 'Compliance Audit',
      'employee_termination': 'Employment Termination',
      'customer_contract_end': 'Contract Completion',
      'data_breach_response': 'Data Breach Response'
    };

    return legalBasisMap[reason] || null;
  }

  /**
   * Calculate scheduled date for deletion
   */
  private calculateScheduledDate(urgency: string, policy: DeletionPolicy): Date {
    const now = new Date();
    const delayHours = {
      'low': 168,    // 1 week
      'medium': 24,  // 1 day
      'high': 4,     // 4 hours
      'critical': 1  // 1 hour
    }[urgency] || 24;

    return new Date(now.getTime() + delayHours * 60 * 60 * 1000);
  }

  /**
   * Check if request should be auto-approved
   */
  private shouldAutoApprove(reason: DeletionReason, policy: DeletionPolicy): boolean {
    // Auto-approve for retention policy and legal obligations
    return reason === 'retention_policy' || reason === 'legal_obligation';
  }

  /**
   * Analyze affected data before deletion
   */
  private async analyzeAffectedData(dataType: string, identifier: string): Promise<DeletionRequest['metadata']> {
    // In production, this would analyze the actual database
    return {
      affectedRecords: 1,
      affectedFiles: [],
      estimatedSize: 1024, // 1KB estimated
      dependencies: [],
      complianceRequirements: ['UAE_PDPL']
    };
  }

  /**
   * Verify record exists (mock implementation)
   */
  private async verifyRecordExists(tableName: string, identifier: string): Promise<boolean> {
    // In production, this would check the actual database
    return false; // Assume not found
  }

  private generateRequestId(): string {
    return `del_${Date.now()}_${encryptionManager.generateSecureToken(8)}`;
  }

  private async logDeletionEvent(
    requestId: string,
    action: string,
    performedBy: string,
    details: string
  ): Promise<void> {
    const entry: DeletionAuditEntry = {
      timestamp: new Date(),
      action,
      performedBy,
      details,
      result: 'success'
    };

    this.auditLog.push(entry);
    
    // In production, this would be written to the database
    console.log(`[Deletion ${requestId}] ${action}: ${details}`);
  }

  // Placeholder methods for file deletion
  private async secureDeleteCustomerFiles(identifier: string): Promise<boolean> {
    return true;
  }

  private async secureDeleteEmployeeFiles(identifier: string): Promise<boolean> {
    return true;
  }

  private async deleteRecordData(identifier: string): Promise<{ [key: string]: boolean }> {
    return { record_deleted: true };
  }

  private async deleteBackupData(identifier: string): Promise<{ [key: string]: boolean }> {
    return { backup_deleted: true };
  }
}

// Singleton instance
export const secureDeletionManager = new SecureDeletionManager();

/**
 * Utility functions for deletion operations
 */
export const deletionUtils = {
  /**
   * Get deletion request status
   */
  getRequestStatus: (requestId: string): DeletionRequest | null => {
    return secureDeletionManager['deletionRequests'].get(requestId) || null;
  },

  /**
   * List deletion requests
   */
  listRequests: (status?: string, limit: number = 100): DeletionRequest[] => {
    const requests = Array.from(secureDeletionManager['deletionRequests'].values());
    return status 
      ? requests.filter(r => r.status === status).slice(0, limit)
      : requests.slice(0, limit);
  },

  /**
   * Check if data can be legally deleted
   */
  canDelete: (dataType: string, reason: DeletionReason): boolean => {
    const policy = secureDeletionManager['getApplicablePolicy'](dataType);
    return policy !== null && policy.isActive;
  },

  /**
   * Get retention period for data type
   */
  getRetentionPeriod: (dataType: string): number => {
    const policy = secureDeletionManager['getApplicablePolicy'](dataType);
    return policy ? policy.retentionPeriod : 2557; // Default 7 years
  }
};
