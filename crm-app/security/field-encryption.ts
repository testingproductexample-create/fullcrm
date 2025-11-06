/**
 * Field-Level Encryption System
 * Specialized encryption for specific sensitive data types
 */

import { encryptionManager, EncryptedData } from './encryption';

export type SensitiveDataType = 
  | 'emirates_id'
  | 'salary'
  | 'body_measurements'
  | 'passport'
  | 'visa_info'
  | 'bank_account'
  | 'phone'
  | 'email'
  | 'address'
  | 'emergency_contact'
  | 'medical_info'
  | 'tax_id';

export interface FieldEncryptionConfig {
  type: SensitiveDataType;
  required: boolean;
  searchable: boolean; // Whether the field needs to be searchable
  anonymizable: boolean; // Whether the field can be anonymized
  retention: number; // Days to retain after deletion request
  compliance: string[]; // Regulatory requirements (PDPL, HIPAA, etc.)
}

export interface FieldValue {
  original: any;
  encrypted?: EncryptedData;
  masked?: string;
  anonymized?: string;
  isEncrypted: boolean;
  isMasked: boolean;
  isAnonymized: boolean;
}

class FieldEncryptionManager {
  private fieldConfigs: Map<SensitiveDataType, FieldEncryptionConfig>;
  private keyMap: Map<SensitiveDataType, string>;

  constructor() {
    this.fieldConfigs = new Map();
    this.keyMap = new Map();
    this.initializeFieldConfigs();
    this.initializeKeyMap();
  }

  private initializeFieldConfigs(): void {
    const configs: FieldEncryptionConfig[] = [
      {
        type: 'emirates_id',
        required: true,
        searchable: false,
        anonymizable: true,
        retention: 2557, // 7 years for UAE compliance
        compliance: ['UAE_PDPL', 'CSA']
      },
      {
        type: 'salary',
        required: true,
        searchable: false,
        anonymizable: false,
        retention: 2557, // 7 years for UAE labor law
        compliance: ['UAE_LABOR_LAW']
      },
      {
        type: 'body_measurements',
        required: true,
        searchable: false,
        anonymizable: true,
        retention: 2557,
        compliance: ['UAE_PDPL']
      },
      {
        type: 'passport',
        required: true,
        searchable: false,
        anonymizable: true,
        retention: 2557,
        compliance: ['UAE_PDPL']
      },
      {
        type: 'visa_info',
        required: true,
        searchable: false,
        anonymizable: true,
        retention: 2557,
        compliance: ['UAE_PDPL']
      },
      {
        type: 'bank_account',
        required: false,
        searchable: false,
        anonymizable: false,
        retention: 2557,
        compliance: ['UAE_PDPL', 'PCI_DSS']
      },
      {
        type: 'phone',
        required: true,
        searchable: true,
        anonymizable: false,
        retention: 2557,
        compliance: ['UAE_PDPL']
      },
      {
        type: 'email',
        required: true,
        searchable: true,
        anonymizable: false,
        retention: 2557,
        compliance: ['UAE_PDPL']
      },
      {
        type: 'address',
        required: true,
        searchable: true,
        anonymizable: true,
        retention: 2557,
        compliance: ['UAE_PDPL']
      },
      {
        type: 'emergency_contact',
        required: true,
        searchable: false,
        anonymizable: true,
        retention: 2557,
        compliance: ['UAE_PDPL']
      },
      {
        type: 'medical_info',
        required: false,
        searchable: false,
        anonymizable: true,
        retention: 2557,
        compliance: ['UAE_PDPL', 'HEALTH_DATA']
      },
      {
        type: 'tax_id',
        required: true,
        searchable: false,
        anonymizable: true,
        retention: 2557,
        compliance: ['UAE_TAX_LAW']
      }
    ];

    configs.forEach(config => {
      this.fieldConfigs.set(config.type, config);
    });
  }

  private initializeKeyMap(): void {
    // Assign specific encryption keys for different data types
    this.keyMap.set('emirates_id', 'pii_primary');
    this.keyMap.set('salary', 'financial_data');
    this.keyMap.set('body_measurements', 'medical_data');
    this.keyMap.set('passport', 'identity_documents');
    this.keyMap.set('visa_info', 'identity_documents');
    this.keyMap.set('bank_account', 'financial_data');
    this.keyMap.set('phone', 'contact_info');
    this.keyMap.set('email', 'contact_info');
    this.keyMap.set('address', 'contact_info');
    this.keyMap.set('emergency_contact', 'contact_info');
    this.keyMap.set('medical_info', 'medical_data');
    this.keyMap.set('tax_id', 'financial_data');
  }

  /**
   * Get field configuration
   */
  getFieldConfig(type: SensitiveDataType): FieldEncryptionConfig | null {
    return this.fieldConfigs.get(type) || null;
  }

  /**
   * Encrypt field value
   */
  encryptField(value: any, type: SensitiveDataType): FieldValue {
    const config = this.getFieldConfig(type);
    if (!config) {
      throw new Error(`Unknown field type: ${type}`);
    }

    if (value === null || value === undefined) {
      return {
        original: value,
        isEncrypted: false,
        isMasked: false,
        isAnonymized: false
      };
    }

    const keyId = this.keyMap.get(type);
    const encrypted = encryptionManager.encrypt(
      typeof value === 'string' ? value : JSON.stringify(value),
      keyId
    );

    return {
      original: value,
      encrypted,
      isEncrypted: true,
      isMasked: false,
      isAnonymized: false
    };
  }

  /**
   * Decrypt field value
   */
  decryptField(fieldValue: FieldValue, type: SensitiveDataType): any {
    const config = this.getFieldConfig(type);
    if (!config) {
      throw new Error(`Unknown field type: ${type}`);
    }

    if (!fieldValue.encrypted) {
      return fieldValue.original;
    }

    try {
      const decrypted = encryptionManager.decrypt(fieldValue.encrypted);
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      throw new Error(`Failed to decrypt field ${type}: ${error.message}`);
    }
  }

  /**
   * Mask field value for display purposes
   */
  maskField(value: any, type: SensitiveDataType): FieldValue {
    if (value === null || value === undefined) {
      return {
        original: value,
        isEncrypted: false,
        isMasked: false,
        isAnonymized: false
      };
    }

    let masked: string;
    
    switch (type) {
      case 'emirates_id':
        masked = this.maskEmiratesId(value);
        break;
      case 'salary':
        masked = this.maskSalary(value);
        break;
      case 'phone':
        masked = this.maskPhone(value);
        break;
      case 'email':
        masked = this.maskEmail(value);
        break;
      case 'bank_account':
        masked = this.maskBankAccount(value);
        break;
      case 'body_measurements':
        masked = this.maskMeasurements(value);
        break;
      default:
        masked = typeof value === 'string' ? value : JSON.stringify(value);
        break;
    }

    return {
      original: value,
      masked,
      isEncrypted: false,
      isMasked: true,
      isAnonymized: false
    };
  }

  /**
   * Anonymize field value
   */
  anonymizeField(value: any, type: SensitiveDataType): FieldValue {
    const config = this.getFieldConfig(type);
    if (!config || !config.anonymizable) {
      throw new Error(`Field type ${type} cannot be anonymized`);
    }

    if (value === null || value === undefined) {
      return {
        original: value,
        isEncrypted: false,
        isMasked: false,
        isAnonymized: false
      };
    }

    let anonymized: string;
    
    switch (type) {
      case 'emirates_id':
        anonymized = this.anonymizeEmiratesId(value);
        break;
      case 'address':
        anonymized = this.anonymizeAddress(value);
        break;
      case 'body_measurements':
        anonymized = this.anonymizeMeasurements(value);
        break;
      default:
        anonymized = this.generateGenericAnonymization(value);
        break;
    }

    return {
      original: value,
      anonymized,
      isEncrypted: false,
      isMasked: false,
      isAnonymized: true
    };
  }

  /**
   * Mask Emirates ID: Show only first and last 2 digits
   */
  private maskEmiratesId(id: string): string {
    if (typeof id !== 'string' || id.length < 4) return '****';
    return `${id.substring(0, 2)}****${id.substring(id.length - 2)}`;
  }

  /**
   * Mask salary: Show as "Confidential" or range
   */
  private maskSalary(salary: number | string): string {
    return 'CONFIDENTIAL';
  }

  /**
   * Mask phone: Show only last 4 digits
   */
  private maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return '****';
    return `****${cleaned.substring(cleaned.length - 4)}`;
  }

  /**
   * Mask email: Show first 2 chars of username
   */
  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (!domain) return '****@****.com';
    const maskedUsername = username.length <= 2 
      ? username.charAt(0) + '*' 
      : username.substring(0, 2) + '*'.repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mask bank account: Show only last 4 digits
   */
  private maskBankAccount(account: string): string {
    const cleaned = account.replace(/\D/g, '');
    if (cleaned.length < 4) return '****';
    return `****${cleaned.substring(cleaned.length - 4)}`;
  }

  /**
   * Mask body measurements: Generalize ranges
   */
  private maskMeasurements(measurements: any): string {
    if (typeof measurements === 'object') {
      return 'CUSTOM_MEASUREMENTS_STORED';
    }
    return 'CONFIDENTIAL_MEASUREMENTS';
  }

  /**
   * Anonymize Emirates ID
   */
  private anonymizeEmiratesId(id: string): string {
    return `ANON_${encryptionManager.generateSecureToken(8)}`;
  }

  /**
   * Anonymize address
   */
  private anonymizeAddress(address: string): string {
    // Remove specific details while keeping general area
    const parts = address.split(',');
    if (parts.length > 1) {
      return `Area ${parts[parts.length - 2].trim()}, UAE`;
    }
    return 'Location Anonymized, UAE';
  }

  /**
   * Anonymize measurements
   */
  private anonymizeMeasurements(measurements: any): string {
    if (typeof measurements === 'object') {
      return 'ANONYMIZED_MEASUREMENTS';
    }
    return 'ANON_MEASURES';
  }

  /**
   * Generate generic anonymization
   */
  private generateGenericAnonymization(value: any): string {
    return `ANON_${encryptionManager.generateSecureToken(8)}`;
  }

  /**
   * Batch encrypt multiple fields
   */
  batchEncryptFieldData(data: Record<string, any>, fieldTypes: Record<string, SensitiveDataType>): Record<string, FieldValue> {
    const result: Record<string, FieldValue> = {};
    
    for (const [fieldName, value] of Object.entries(data)) {
      const fieldType = fieldTypes[fieldName];
      if (fieldType) {
        result[fieldName] = this.encryptField(value, fieldType);
      } else {
        // If no specific type, treat as regular data
        result[fieldName] = {
          original: value,
          isEncrypted: false,
          isMasked: false,
          isAnonymized: false
        };
      }
    }
    
    return result;
  }

  /**
   * Batch decrypt multiple fields
   */
  batchDecryptFieldData(fieldValues: Record<string, FieldValue>, fieldTypes: Record<string, SensitiveDataType>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
      const fieldType = fieldTypes[fieldName];
      if (fieldType) {
        result[fieldName] = this.decryptField(fieldValue, fieldType);
      } else {
        result[fieldName] = fieldValue.original;
      }
    }
    
    return result;
  }

  /**
   * Check if data needs to be retained based on compliance requirements
   */
  shouldRetainData(type: SensitiveDataType): boolean {
    const config = this.getFieldConfig(type);
    return config ? config.compliance.length > 0 : true;
  }

  /**
   * Get retention period for data type (in days)
   */
  getRetentionPeriod(type: SensitiveDataType): number {
    const config = this.getFieldConfig(type);
    return config ? config.retention : 2557; // Default 7 years
  }

  /**
   * Validate field value against type requirements
   */
  validateFieldValue(value: any, type: SensitiveDataType): { isValid: boolean; error?: string } {
    const config = this.getFieldConfig(type);
    if (!config) {
      return { isValid: false, error: `Unknown field type: ${type}` };
    }

    // Required field check
    if (config.required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: `Field ${type} is required` };
    }

    // Type-specific validation
    switch (type) {
      case 'emirates_id':
        return this.validateEmiratesId(value);
      case 'phone':
        return this.validatePhone(value);
      case 'email':
        return this.validateEmail(value);
      default:
        return { isValid: true };
    }
  }

  private validateEmiratesId(value: string): { isValid: boolean; error?: string } {
    if (!value) return { isValid: true };
    const emiratesIdPattern = /^\d{3}-\d{4}-\d{4}-\d{1}$/;
    if (!emiratesIdPattern.test(value)) {
      return { isValid: false, error: 'Invalid Emirates ID format (XXX-XXXX-XXXX-X)' };
    }
    return { isValid: true };
  }

  private validatePhone(value: string): { isValid: boolean; error?: string } {
    if (!value) return { isValid: true };
    const phonePattern = /^\+?971[\d\s\-\(\)]{7,}$/;
    if (!phonePattern.test(value)) {
      return { isValid: false, error: 'Invalid UAE phone number format' };
    }
    return { isValid: true };
  }

  private validateEmail(value: string): { isValid: boolean; error?: string } {
    if (!value) return { isValid: true };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    return { isValid: true };
  }
}

// Singleton instance
export const fieldEncryptionManager = new FieldEncryptionManager();

/**
 * Decorator for automatic field encryption
 */
export function EncryptField(type: SensitiveDataType) {
  return function (target: any, propertyKey: string) {
    let value: any;

    Object.defineProperty(target, propertyKey, {
      get() {
        // Auto-decrypt when accessing the property
        if (this[`_${propertyKey}_encrypted`]) {
          return fieldEncryptionManager.decryptField(
            this[`_${propertyKey}_fieldValue`],
            type
          );
        }
        return value;
      },
      set(newValue) {
        // Auto-encrypt when setting the property
        if (newValue !== null && newValue !== undefined) {
          const fieldValue = fieldEncryptionManager.encryptField(newValue, type);
          this[`_${propertyKey}_fieldValue`] = fieldValue;
          this[`_${propertyKey}_encrypted`] = true;
          value = newValue; // Store original for development
        } else {
          this[`_${propertyKey}_encrypted`] = false;
          value = newValue;
        }
      },
      enumerable: true,
      configurable: true
    });
  };
}
