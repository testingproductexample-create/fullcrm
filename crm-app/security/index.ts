/**
 * Security Module Index
 * Central export point for all security and encryption functionality
 */

// Core encryption
export {
  EncryptionManager,
  encryptionManager,
  encryptionUtils,
  type EncryptedData,
  type CryptoKey,
  type EncryptionConfig
} from './encryption';

// Field-level encryption
export {
  FieldEncryptionManager,
  fieldEncryptionManager,
  EncryptField,
  type SensitiveDataType,
  type FieldEncryptionConfig,
  type FieldValue
} from './field-encryption';

// Secure file upload
export {
  SecureFileUploadManager,
  secureFileUploadManager,
  createSecureUploadMiddleware,
  MockVirusScanner,
  type VirusScanner,
  type SecureFileInfo,
  type FileUploadConfig,
  type UploadValidationResult
} from './secure-upload';

// Data anonymization
export {
  DataAnonymizationManager,
  dataAnonymizationManager,
  anonymizationUtils,
  type AnonymizationConfig,
  type AnonymizationResult,
  type AnonymizationRule,
  type AnonymizationMethod
} from './anonymization';

// Secure deletion
export {
  SecureDeletionManager,
  secureDeletionManager,
  deletionUtils,
  type DeletionRequest,
  type DeletionReason,
  type DeletionPolicy,
  type SecureDeletionConfig
} from './secure-deletion';

// Encryption middleware
export {
  EncryptionMiddlewareManager,
  encryptionMiddlewareManager,
  setupEncryptionMiddleware,
  encryptionMiddleware,
  databaseEncryptionMiddleware,
  apiEncryptionMiddleware,
  fieldEncryptionMiddleware,
  anonymizationMiddleware,
  type EncryptionMiddlewareConfig,
  type SecurityContext,
  type AuditLogEntry
} from './encryption-middleware';

// Crypto key management
export {
  CryptoKeyManager,
  cryptoKeyManager,
  keyManagerUtils,
  type CryptoKey,
  type KeyType,
  type KeyStatus,
  type KeyRotationConfig,
  type KeyBackupConfig,
  type KeyValidationResult
} from './crypto-key-manager';

/**
 * Complete Security System Configuration
 */
export interface SecuritySystemConfig {
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyRotation: boolean;
    autoBackup: boolean;
  };
  fieldEncryption: {
    enabled: boolean;
    autoEncrypt: boolean;
    searchableFields: string[];
  };
  fileUpload: {
    enabled: boolean;
    maxFileSize: number;
    allowedTypes: string[];
    virusScan: boolean;
  };
  anonymization: {
    enabled: boolean;
    defaultMethod: string;
    reversible: boolean;
  };
  deletion: {
    enabled: boolean;
    secureDeletion: boolean;
    retentionCompliance: boolean;
  };
  middleware: {
    enabled: boolean;
    auditLogging: boolean;
    riskAssessment: boolean;
  };
  compliance: {
    frameworks: string[];
    autoCompliance: boolean;
    auditTrail: boolean;
  };
}

/**
 * Initialize the complete security system
 */
export class SecuritySystem {
  private config: SecuritySystemConfig;
  private initialized: boolean = false;

  constructor(config: Partial<SecuritySystemConfig> = {}) {
    this.config = {
      encryption: {
        enabled: true,
        algorithm: 'AES-256-GCM',
        keyRotation: true,
        autoBackup: true,
        ...config.encryption
      },
      fieldEncryption: {
        enabled: true,
        autoEncrypt: true,
        searchableFields: ['phone', 'email', 'name'],
        ...config.fieldEncryption
      },
      fileUpload: {
        enabled: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['image/*', 'application/pdf', 'text/*'],
        virusScan: false, // Set to true in production
        ...config.fileUpload
      },
      anonymization: {
        enabled: true,
        defaultMethod: 'pseudonymization',
        reversible: true,
        ...config.anonymization
      },
      deletion: {
        enabled: true,
        secureDeletion: true,
        retentionCompliance: true,
        ...config.deletion
      },
      middleware: {
        enabled: true,
        auditLogging: true,
        riskAssessment: true,
        ...config.middleware
      },
      compliance: {
        frameworks: ['UAE_PDPL', 'CSA', 'ISO27001'],
        autoCompliance: true,
        auditTrail: true,
        ...config.compliance
      }
    };
  }

  /**
   * Initialize all security components
   */
  async initialize(): Promise<{
    success: boolean;
    components: string[];
    errors: string[];
  }> {
    if (this.initialized) {
      return { success: true, components: [], errors: [] };
    }

    const components: string[] = [];
    const errors: string[] = [];

    try {
      // Initialize file upload manager
      if (this.config.fileUpload.enabled) {
        await secureFileUploadManager.initialize();
        components.push('File Upload Manager');
      }

      // Initialize key manager
      if (this.config.encryption.enabled) {
        // Key manager is auto-initialized in constructor
        components.push('Crypto Key Manager');
      }

      this.initialized = true;

      console.log('Security system initialized successfully');
      return { success: true, components, errors };

    } catch (error) {
      errors.push(error.message);
      console.error('Security system initialization failed:', error);
      return { success: false, components, errors };
    }
  }

  /**
   * Get security system status
   */
  getStatus(): {
    initialized: boolean;
    config: SecuritySystemConfig;
    statistics: {
      activeKeys: number;
      encryptedFields: number;
      uploadedFiles: number;
      anonymizedRecords: number;
      deletionRequests: number;
      auditEntries: number;
    };
    health: {
      encryption: 'healthy' | 'warning' | 'critical';
      keys: 'healthy' | 'warning' | 'critical';
      backup: 'healthy' | 'warning' | 'critical';
      compliance: 'healthy' | 'warning' | 'critical';
    };
  } {
    const keyStats = cryptoKeyManager.getKeyStatistics();
    
    return {
      initialized: this.initialized,
      config: this.config,
      statistics: {
        activeKeys: keyStats.active,
        encryptedFields: Object.keys(fieldEncryptionManager['fieldConfigs']).length,
        uploadedFiles: 0, // Would be tracked in production
        anonymizedRecords: 0, // Would be tracked in production
        deletionRequests: deletionUtils.listRequests().length,
        auditEntries: encryptionMiddlewareManager.getAuditLogs().length
      },
      health: this.assessHealth()
    };
  }

  /**
   * Create security dashboard data
   */
  getDashboardData(): {
    overview: any;
    encryption: any;
    keys: any;
    compliance: any;
    recent: any;
  } {
    const keyStats = cryptoKeyManager.getKeyStatistics();
    const expiringKeys = keyManagerUtils.getExpiringKeys(30);
    const auditLogs = encryptionMiddlewareManager.getAuditLogs({ limit: 10 });
    const deletionRequests = deletionUtils.listRequests('pending', 5);

    return {
      overview: {
        totalKeys: keyStats.total,
        activeKeys: keyStats.active,
        expiringKeys: expiringKeys.length,
        pendingDeletions: deletionRequests.length,
        securityScore: this.calculateSecurityScore()
      },
      encryption: {
        algorithm: this.config.encryption.algorithm,
        activeFields: Object.keys(fieldEncryptionManager['fieldConfigs']).length,
        keyRotation: this.config.encryption.keyRotation,
        autoBackup: this.config.encryption.autoBackup
      },
      keys: {
        statistics: keyStats,
        expiring: expiringKeys.map(k => ({ id: k.id, name: k.name, expiresAt: k.expiresAt })),
        recentActivity: auditLogs.filter(log => log.operation === 'access').slice(0, 5)
      },
      compliance: {
        frameworks: this.config.compliance.frameworks,
        autoCompliance: this.config.compliance.autoCompliance,
        auditTrail: this.config.compliance.auditTrail,
        lastAudit: new Date() // Would track actual audit dates
      },
      recent: {
        audits: auditLogs,
        deletions: deletionRequests,
        backups: [] // Would track backup history
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SecuritySystemConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      encryption: { ...this.config.encryption, ...newConfig.encryption },
      fieldEncryption: { ...this.config.fieldEncryption, ...newConfig.fieldEncryption },
      fileUpload: { ...this.config.fileUpload, ...newConfig.fileUpload },
      anonymization: { ...this.config.anonymization, ...newConfig.anonymization },
      deletion: { ...this.config.deletion, ...newConfig.deletion },
      middleware: { ...this.config.middleware, ...newConfig.middleware },
      compliance: { ...this.config.compliance, ...newConfig.compliance }
    };
  }

  private assessHealth(): {
    encryption: 'healthy' | 'warning' | 'critical';
    keys: 'healthy' | 'warning' | 'critical';
    backup: 'healthy' | 'warning' | 'critical';
    compliance: 'healthy' | 'warning' | 'critical';
  } {
    const keyStats = cryptoKeyManager.getKeyStatistics();
    const expiringKeys = keyManagerUtils.getExpiringKeys(7).length;
    const expiringCount = keyManagerUtils.getExpiringKeys(30).length;

    return {
      encryption: this.config.encryption.enabled ? 'healthy' : 'critical',
      keys: expiringKeys > 0 ? (expiringCount > 3 ? 'critical' : 'warning') : 'healthy',
      backup: keyStats.strong >= keyStats.total * 0.8 ? 'healthy' : 'warning',
      compliance: this.config.compliance.autoCompliance ? 'healthy' : 'warning'
    };
  }

  private calculateSecurityScore(): number {
    let score = 0;
    
    // Encryption enabled (25%)
    if (this.config.encryption.enabled) score += 25;
    
    // Field encryption (20%)
    if (this.config.fieldEncryption.enabled) score += 20;
    
    // Key management (20%)
    const keyStats = cryptoKeyManager.getKeyStatistics();
    if (keyStats.active > 0 && keyStats.strong >= keyStats.total * 0.8) score += 20;
    
    // Secure deletion (15%)
    if (this.config.deletion.enabled && this.config.deletion.secureDeletion) score += 15;
    
    // Audit logging (10%)
    if (this.config.middleware.auditLogging) score += 10;
    
    // Compliance (10%)
    if (this.config.compliance.autoCompliance) score += 10;
    
    return score;
  }
}

// Default security system instance
export const securitySystem = new SecuritySystem();

/**
 * Quick setup functions
 */

// Setup for Next.js/Express
export const setupSecuritySystem = async (config?: Partial<SecuritySystemConfig>) => {
  if (config) {
    securitySystem.updateConfig(config);
  }
  
  const result = await securitySystem.initialize();
  if (!result.success) {
    throw new Error(`Security system initialization failed: ${result.errors.join(', ')}`);
  }
  
  return result;
};

// Setup for development environment
export const setupDevelopmentSecurity = () => {
  return setupSecuritySystem({
    encryption: {
      enabled: true,
      keyRotation: false, // Disable auto-rotation in dev
      autoBackup: false
    },
    fileUpload: {
      virusScan: false,
      maxFileSize: 10 * 1024 * 1024 // 10MB for dev
    },
    compliance: {
      autoCompliance: false,
      auditTrail: true
    }
  });
};

// Setup for production environment
export const setupProductionSecurity = () => {
  return setupSecuritySystem({
    encryption: {
      enabled: true,
      keyRotation: true,
      autoBackup: true
    },
    fileUpload: {
      enabled: true,
      virusScan: true,
      maxFileSize: 100 * 1024 * 1024 // 100MB for production
    },
    middleware: {
      auditLogging: true,
      riskAssessment: true
    },
    compliance: {
      autoCompliance: true,
      auditTrail: true
    }
  });
};

/**
 * Security utilities and helpers
 */
export const securityUtils = {
  /**
   * Check if data contains sensitive information
   */
  containsSensitiveData: (data: any): boolean => {
    if (typeof data !== 'object' || data === null) return false;
    
    const sensitiveFields = ['emirates_id', 'salary', 'passport', 'bank_account', 'phone', 'email'];
    return sensitiveFields.some(field => data[field] !== undefined);
  },

  /**
   * Classify data sensitivity level
   */
  classifyDataSensitivity: (data: any): 'low' | 'medium' | 'high' | 'critical' => {
    if (securityUtils.containsSensitiveData(data)) {
      // Check for highly sensitive data
      if (data.emirates_id || data.salary || data.bank_account) {
        return 'critical';
      }
      if (data.passport || data.visa_info) {
        return 'high';
      }
      return 'medium';
    }
    return 'low';
  },

  /**
   * Generate security report
   */
  generateSecurityReport: () => {
    const status = securitySystem.getStatus();
    return {
      generatedAt: new Date(),
      systemStatus: status,
      recommendations: [
        ...(status.health.keys !== 'healthy' ? ['Rotate expiring keys immediately'] : []),
        ...(status.statistics.auditEntries < 10 ? ['Review audit logging configuration'] : []),
        ...(!securitySystem.config.compliance.autoCompliance ? ['Enable automatic compliance checks'] : [])
      ]
    };
  },

  /**
   * Validate security configuration
   */
  validateSecurityConfig: (config: SecuritySystemConfig): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!config.encryption.enabled) {
      errors.push('Encryption must be enabled in production');
    }
    
    if (config.fileUpload.maxFileSize > 500 * 1024 * 1024) {
      errors.push('File size limit is too high for production');
    }
    
    if (config.compliance.frameworks.length === 0) {
      errors.push('At least one compliance framework must be selected');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default securitySystem;
