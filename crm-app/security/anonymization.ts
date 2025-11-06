/**
 * Data Anonymization System
 * Comprehensive data anonymization and pseudonymization for privacy protection
 */

import { fieldEncryptionManager, SensitiveDataType } from './field-encryption';
import { encryptionManager } from './encryption';

export interface AnonymizationConfig {
  method: AnonymizationMethod;
  reversible: boolean;
  salt: string;
  maskSensitiveFields: boolean;
  preserveDataUtility: boolean;
  anonymizeTimestamps: boolean;
}

export type AnonymizationMethod = 
  | 'masking'
  | 'pseudonymization'
  | 'generalization'
  | 'suppression'
  | 'shuffling'
  | 'differential_privacy'
  | 'k_anonymity'
  | 'l_diversity'
  | 't_closeness';

export interface AnonymizationRule {
  field: string;
  type: SensitiveDataType;
  method: AnonymizationMethod;
  parameters: Record<string, any>;
  condition?: string; // Optional condition for when to apply
}

export interface AnonymizationResult {
  originalData: any;
  anonymizedData: any;
  method: AnonymizationMethod;
  timestamp: Date;
  reversibleToken?: string;
  utilityScore: number; // 0-1 score of data utility preservation
  metadata: {
    fieldsModified: string[];
    methodsUsed: Record<string, AnonymizationMethod>;
    parametersUsed: Record<string, any>;
  };
}

export interface DataAnonymizationLog {
  id: string;
  operationType: 'anonymize' | 'pseudonymize' | 'restore' | 'batch';
  dataType: string;
  recordCount: number;
  fieldsAffected: string[];
  method: AnonymizationMethod;
  reversibleToken?: string;
  requestReason: string;
  performedBy: string;
  organizationId: string;
  timestamp: Date;
  parameters: Record<string, any>;
  auditTrail: {
    before: any;
    after: any;
  };
}

class DataAnonymizationManager {
  private anonymizationLog: DataAnonymizationLog[] = [];
  private reversibleTokens = new Map<string, any>();
  private defaultConfig: AnonymizationConfig;

  constructor() {
    this.defaultConfig = {
      method: 'pseudonymization',
      reversible: true,
      salt: encryptionManager.generateSecureToken(32),
      maskSensitiveFields: true,
      preserveDataUtility: true,
      anonymizeTimestamps: true
    };
  }

  /**
   * Anonymize customer data
   */
  async anonymizeCustomerData(
    customerData: any,
    rules: AnonymizationRule[],
    config: Partial<AnonymizationConfig> = {}
  ): Promise<AnonymizationResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const result: AnonymizationResult = {
      originalData: customerData,
      anonymizedData: { ...customerData },
      method: finalConfig.method,
      timestamp: new Date(),
      utilityScore: 1.0,
      metadata: {
        fieldsModified: [],
        methodsUsed: {},
        parametersUsed: finalConfig
      }
    };

    // Create reversible token for potential restoration
    const reversibleToken = finalConfig.reversible 
      ? await this.createReversibleToken(customerData, finalConfig.salt)
      : undefined;
    result.reversibleToken = reversibleToken;

    // Apply anonymization rules
    for (const rule of rules) {
      if (this.shouldApplyRule(rule, customerData)) {
        const fieldValue = customerData[rule.field];
        const anonymizedValue = await this.applyAnonymizationRule(
          fieldValue, 
          rule, 
          finalConfig
        );
        
        if (anonymizedValue !== undefined) {
          result.anonymizedData[rule.field] = anonymizedValue;
          result.metadata.fieldsModified.push(rule.field);
          result.metadata.methodsUsed[rule.field] = rule.method;
          result.utilityScore -= this.calculateUtilityImpact(rule.method);
        }
      }
    }

    // Apply general anonymization for remaining sensitive fields
    if (finalConfig.maskSensitiveFields) {
      await this.applyGeneralAnonymization(result.anonymizedData, finalConfig);
    }

    // Anonymize timestamps if required
    if (finalConfig.anonymizeTimestamps) {
      this.anonymizeTimestamps(result.anonymizedData);
    }

    // Log the operation
    await this.logAnonymizationOperation('anonymize', 'customer', 1, result, finalConfig);

    return result;
  }

  /**
   * Anonymize employee data
   */
  async anonymizeEmployeeData(
    employeeData: any,
    rules: AnonymizationRule[],
    config: Partial<AnonymizationConfig> = {}
  ): Promise<AnonymizationResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const result: AnonymizationResult = {
      originalData: employeeData,
      anonymizedData: { ...employeeData },
      method: finalConfig.method,
      timestamp: new Date(),
      utilityScore: 1.0,
      metadata: {
        fieldsModified: [],
        methodsUsed: {},
        parametersUsed: finalConfig
      }
    };

    // Employee-specific anonymization rules
    const employeeRules: AnonymizationRule[] = [
      {
        field: 'emirates_id',
        type: 'emirates_id',
        method: 'pseudonymization',
        parameters: { format: 'EMP_{hash}' }
      },
      {
        field: 'salary',
        type: 'salary',
        method: 'generalization',
        parameters: { ranges: 5, type: 'decile' }
      },
      {
        field: 'phone',
        type: 'phone',
        method: 'masking',
        parameters: { mask: '****', keepLast: 4 }
      },
      {
        field: 'email',
        type: 'email',
        method: 'pseudonymization',
        parameters: { format: 'emp_{hash}@company.com' }
      },
      {
        field: 'address',
        type: 'address',
        method: 'generalization',
        parameters: { generalization: 'area_only' }
      }
    ];

    const allRules = [...rules, ...employeeRules];

    for (const rule of allRules) {
      if (this.shouldApplyRule(rule, employeeData)) {
        const fieldValue = employeeData[rule.field];
        const anonymizedValue = await this.applyAnonymizationRule(
          fieldValue, 
          rule, 
          finalConfig
        );
        
        if (anonymizedValue !== undefined) {
          result.anonymizedData[rule.field] = anonymizedValue;
          result.metadata.fieldsModified.push(rule.field);
          result.metadata.methodsUsed[rule.field] = rule.method;
          result.utilityScore -= this.calculateUtilityImpact(rule.method);
        }
      }
    }

    await this.logAnonymizationOperation('anonymize', 'employee', 1, result, finalConfig);

    return result;
  }

  /**
   * Anonymize measurement data
   */
  async anonymizeMeasurementData(
    measurementData: any,
    config: Partial<AnonymizationConfig> = {}
  ): Promise<AnonymizationResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const result: AnonymizationResult = {
      originalData: measurementData,
      anonymizedData: { ...measurementData },
      method: 'generalization',
      timestamp: new Date(),
      utilityScore: 1.0,
      metadata: {
        fieldsModified: [],
        methodsUsed: {},
        parametersUsed: finalConfig
      }
    };

    // Anonymize specific measurement fields
    const measurementFields = [
      'chest', 'waist', 'hips', 'shoulder_width', 'arm_length', 
      'leg_length', 'height', 'weight', 'neck', 'sleeve'
    ];

    for (const field of measurementFields) {
      if (measurementData[field] !== undefined) {
        // Generalize measurements to ranges
        const anonymized = this.generalizeMeasurement(measurementData[field]);
        result.anonymizedData[field] = anonymized;
        result.metadata.fieldsModified.push(field);
        result.metadata.methodsUsed[field] = 'generalization';
        result.utilityScore -= 0.1; // Higher impact for measurements
      }
    }

    // Add privacy protection categories
    result.anonymizedData.privacy_category = this.categorizePrivacy(measurementData);
    result.metadata.fieldsModified.push('privacy_category');

    await this.logAnonymizationOperation('anonymize', 'measurement', 1, result, finalConfig);

    return result;
  }

  /**
   * Batch anonymize multiple records
   */
  async batchAnonymize(
    records: any[],
    dataType: string,
    rules: AnonymizationRule[],
    config: Partial<AnonymizationConfig> = {}
  ): Promise<AnonymizationResult[]> {
    const results: AnonymizationResult[] = [];
    const batchToken = encryptionManager.generateSecureToken(16);

    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        let result: AnonymizationResult;

        switch (dataType) {
          case 'customer':
            result = await this.anonymizeCustomerData(record, rules, config);
            break;
          case 'employee':
            result = await this.anonymizeEmployeeData(record, rules, config);
            break;
          case 'measurement':
            result = await this.anonymizeMeasurementData(record, config);
            break;
          default:
            result = await this.anonymizeGenericData(record, rules, config);
            break;
        }

        results.push(result);
      } catch (error) {
        console.error(`Failed to anonymize record ${i}:`, error);
        // Continue with other records
      }
    }

    await this.logAnonymizationOperation('batch', dataType, records.length, 
      { originalData: records, anonymizedData: results, method: config.method || 'batch' }, 
      config
    );

    return results;
  }

  /**
   * Restore anonymized data (if reversible)
   */
  async restoreAnonymizedData(reversibleToken: string): Promise<any> {
    const originalData = this.reversibleTokens.get(reversibleToken);
    if (!originalData) {
      throw new Error('Reversible token not found or expired');
    }

    // Remove token after restoration
    this.reversibleTokens.delete(reversibleToken);

    // Log restoration
    await this.logAnonymizationOperation('restore', 'unknown', 1, 
      { originalData, anonymizedData: originalData, method: 'restore' }, 
      {}
    );

    return originalData;
  }

  /**
   * Apply K-anonymity to dataset
   */
  applyKAnonymity(
    dataset: any[],
    quasiIdentifiers: string[],
    k: number = 5
  ): { anonymized: any[]; suppressed: number } {
    const grouped = new Map<string, any[]>();
    
    // Group records by quasi-identifiers
    for (const record of dataset) {
      const key = quasiIdentifiers.map(qi => record[qi]).join('|');
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(record);
    }

    const anonymized: any[] = [];
    let suppressed = 0;

    // Apply k-anonymity
    for (const [key, group] of grouped.entries()) {
      if (group.length < k) {
        // Suppress small groups
        suppressed += group.length;
      } else {
        // Keep groups that meet k-anonymity
        anonymized.push(...group);
      }
    }

    return { anonymized, suppressed };
  }

  /**
   * Apply L-diversity to dataset
   */
  applyLDiversity(
    dataset: any[],
    sensitiveAttributes: string[],
    l: number = 2
  ): { anonymized: any[]; lowDiversitySuppressed: number } {
    const anonymized: any[] = [];
    let lowDiversitySuppressed = 0;

    // Group by quasi-identifiers and check l-diversity
    const grouped = this.groupByQuasiIdentifiers(dataset, ['age_range', 'gender', 'location']);
    
    for (const group of grouped.values()) {
      if (this.hasLDiversity(group, sensitiveAttributes, l)) {
        anonymized.push(...group);
      } else {
        lowDiversitySuppressed += group.length;
      }
    }

    return { anonymized, lowDiversitySuppressed };
  }

  /**
   * Apply differential privacy
   */
  applyDifferentialPrivacy(
    numericValue: number,
    sensitivity: number,
    epsilon: number = 1.0,
    mechanism: 'laplace' | 'gaussian' = 'laplace'
  ): number {
    const { randomUUID } = require('crypto');
    
    if (mechanism === 'laplace') {
      const scale = sensitivity / epsilon;
      const u = Math.random() - 0.5;
      const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
      return numericValue + noise;
    } else {
      const scale = Math.sqrt(2 * Math.log(1.25 / 0.05)) * sensitivity / epsilon;
      const u1 = Math.random();
      const u2 = Math.random();
      const noise = scale * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return numericValue + noise;
    }
  }

  private async createReversibleToken(data: any, salt: string): Promise<string> {
    const token = encryptionManager.generateSecureToken(16);
    const tokenKey = encryptionManager.generateHash(data + salt);
    this.reversibleTokens.set(tokenKey, data);
    return token;
  }

  private async applyAnonymizationRule(
    value: any,
    rule: AnonymizationRule,
    config: AnonymizationConfig
  ): Promise<any> {
    switch (rule.method) {
      case 'masking':
        return this.maskValue(value, rule.parameters);
      case 'pseudonymization':
        return this.pseudonymizeValue(value, rule.parameters, config.salt);
      case 'generalization':
        return this.generalizeValue(value, rule.parameters);
      case 'suppression':
        return null;
      case 'shuffling':
        return this.shuffleValue(value, rule.parameters);
      case 'differential_privacy':
        return this.applyDifferentialPrivacy(value, rule.parameters.sensitivity, rule.parameters.epsilon);
      default:
        return this.maskValue(value, { mask: '[REDACTED]' });
    }
  }

  private shouldApplyRule(rule: AnonymizationRule, data: any): boolean {
    if (!rule.condition) return true;
    
    try {
      // Simple condition evaluation
      const condition = rule.condition
        .replace(/(\w+)/g, 'data.$1')
        .replace(/([=!<>]+)/g, '$1')
        .replace(/&&/g, '&&')
        .replace(/||/g, '||');
      
      return eval(condition);
    } catch {
      return true;
    }
  }

  private maskValue(value: any, params: Record<string, any>): string {
    if (typeof value !== 'string') value = String(value);
    
    const { mask = '*', keepStart = 0, keepEnd = 0 } = params;
    
    if (value.length <= keepStart + keepEnd) {
      return mask.repeat(value.length);
    }
    
    return value.substring(0, keepStart) + 
           mask.repeat(value.length - keepStart - keepEnd) + 
           value.substring(value.length - keepEnd);
  }

  private pseudonymizeValue(value: any, params: Record<string, any>, salt: string): string {
    const { format = 'ANON_{hash}' } = params;
    const hash = encryptionManager.generateHash(String(value) + salt).substring(0, 8);
    return format.replace('{hash}', hash);
  }

  private generalizeValue(value: any, params: Record<string, any>): any {
    const { type = 'string', ranges = 5 } = params;
    
    switch (type) {
      case 'number':
      case 'salary':
        // Generalize numbers to ranges
        const numValue = Number(value);
        if (isNaN(numValue)) return value;
        
        const rangeSize = Math.ceil(numValue / ranges);
        const min = Math.floor(numValue / rangeSize) * rangeSize;
        const max = min + rangeSize - 1;
        return `${min}-${max}`;
      
      case 'age':
        const age = Number(value);
        if (isNaN(age)) return value;
        
        if (age < 18) return '0-17';
        if (age < 25) return '18-24';
        if (age < 35) return '25-34';
        if (age < 45) return '35-44';
        if (age < 55) return '45-54';
        return '55+';
      
      case 'area_only':
        if (typeof value === 'string') {
          // Keep only area information from address
          const parts = value.split(',');
          return parts.length > 1 ? parts[parts.length - 2].trim() + ', UAE' : 'UAE';
        }
        return value;
      
      default:
        return value;
    }
  }

  private shuffleValue(value: any, params: Record<string, any>): any {
    // For shuffling, we need access to the entire dataset
    // This would be implemented with the full dataset context
    return value; // Placeholder
  }

  private generalizeMeasurement(measurement: number): string {
    // Generalize measurements to 2cm ranges
    const range = Math.floor(measurement / 2) * 2;
    return `${range}-${range + 1}cm`;
  }

  private categorizePrivacy(measurements: any): string {
    // Categorize privacy level based on measurements
    const features = ['height', 'weight', 'chest', 'waist'];
    const presentFeatures = features.filter(f => measurements[f] !== undefined);
    
    if (presentFeatures.length >= 4) return 'high';
    if (presentFeatures.length >= 2) return 'medium';
    return 'low';
  }

  private async applyGeneralAnonymization(data: any, config: AnonymizationConfig): Promise<void> {
    // Apply general anonymization for sensitive fields
    const sensitiveFields = ['emirates_id', 'phone', 'email', 'address', 'passport'];
    
    for (const field of sensitiveFields) {
      if (data[field] && typeof data[field] === 'string') {
        data[field] = this.maskValue(data[field], { keepStart: 2, keepEnd: 2 });
      }
    }
  }

  private anonymizeTimestamps(data: any): void {
    // Replace exact timestamps with time periods
    if (data.birth_date) {
      const date = new Date(data.birth_date);
      const year = date.getFullYear();
      data.birth_date = `${year}-01-01`; // Keep only year
    }
    
    if (data.created_at) {
      const date = new Date(data.created_at);
      data.created_at = date.toISOString().split('T')[0]; // Keep only date
    }
  }

  private calculateUtilityImpact(method: AnonymizationMethod): number {
    const impactMap: Record<AnonymizationMethod, number> = {
      masking: 0.1,
      pseudonymization: 0.15,
      generalization: 0.2,
      suppression: 0.5,
      shuffling: 0.1,
      differential_privacy: 0.3,
      k_anonymity: 0.4,
      l_diversity: 0.35,
      t_closeness: 0.45
    };
    
    return impactMap[method] || 0.2;
  }

  private async logAnonymizationOperation(
    operationType: 'anonymize' | 'pseudonymize' | 'restore' | 'batch',
    dataType: string,
    recordCount: number,
    data: any,
    config: Partial<AnonymizationConfig>
  ): Promise<void> {
    const logEntry: DataAnonymizationLog = {
      id: encryptionManager.generateSecureToken(8),
      operationType,
      dataType,
      recordCount,
      fieldsAffected: data.metadata?.fieldsModified || [],
      method: data.method || 'unknown',
      reversibleToken: data.reversibleToken,
      requestReason: 'privacy_compliance',
      performedBy: 'system',
      organizationId: 'default',
      timestamp: new Date(),
      parameters: config,
      auditTrail: {
        before: data.originalData,
        after: data.anonymizedData
      }
    };
    
    this.anonymizationLog.push(logEntry);
    
    // In production, this would be stored in the database
    console.log('Anonymization operation logged:', logEntry);
  }

  private groupByQuasiIdentifiers(dataset: any[], quasiIdentifiers: string[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();
    
    for (const record of dataset) {
      const key = quasiIdentifiers.map(qi => record[qi] || 'unknown').join('|');
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(record);
    }
    
    return grouped;
  }

  private hasLDiversity(group: any[], sensitiveAttributes: string[], l: number): boolean {
    for (const attribute of sensitiveAttributes) {
      const uniqueValues = new Set(group.map(r => r[attribute]));
      if (uniqueValues.size < l) {
        return false;
      }
    }
    return true;
  }

  private async anonymizeGenericData(
    data: any,
    rules: AnonymizationRule[],
    config: Partial<AnonymizationConfig>
  ): Promise<AnonymizationResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    return {
      originalData: data,
      anonymizedData: data, // No changes for generic
      method: finalConfig.method,
      timestamp: new Date(),
      utilityScore: 1.0,
      metadata: {
        fieldsModified: [],
        methodsUsed: {},
        parametersUsed: finalConfig
      }
    };
  }
}

// Singleton instance
export const dataAnonymizationManager = new DataAnonymizationManager();

/**
 * Utility functions for common anonymization tasks
 */
export const anonymizationUtils = {
  /**
   * Quick anonymization for display
   */
  quickAnonymize: (value: any, type: 'name' | 'email' | 'phone' | 'address' | 'id'): string => {
    switch (type) {
      case 'name':
        return value ? value.split(' ').map((n: string) => n.charAt(0) + '***').join(' ') : '';
      case 'email':
        return value ? value.replace(/(.{2}).*@/, '$1***@') : '';
      case 'phone':
        return value ? value.replace(/\d(?=\d{4})/g, '*') : '';
      case 'address':
        return value ? value.split(',').slice(0, -1).join(',') + ', UAE' : '';
      case 'id':
        return value ? value.replace(/\d(?=\d{1}$)/g, '*') : '';
      default:
        return '***';
    }
  },

  /**
   * Check if data appears to be anonymized
   */
  isAnonymized: (data: any): boolean => {
    if (typeof data === 'string') {
      return data.includes('***') || data.startsWith('ANON_') || data.startsWith('REDACTED');
    }
    return false;
  }
};
