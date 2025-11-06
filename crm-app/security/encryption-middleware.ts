/**
 * Encryption Middleware
 * Automatic encryption/decryption for API endpoints and database operations
 */

import { Request, Response, NextFunction } from 'express';
import { 
  encryptionManager, 
  EncryptedData, 
  encryptionUtils 
} from './encryption';
import { 
  fieldEncryptionManager, 
  SensitiveDataType, 
  FieldValue 
} from './field-encryption';
import { dataAnonymizationManager } from './anonymization';
import { secureDeletionManager } from './secure-deletion';

export interface EncryptionMiddlewareConfig {
  enabled: boolean;
  encryptRequest: boolean;
  decryptResponse: boolean;
  autoEncryptFields: boolean;
  auditLogging: boolean;
  fieldTypes: Record<string, SensitiveDataType>;
  exemptFields: string[];
  exemptEndpoints: string[];
  debug: boolean;
}

export interface SecurityContext {
  userId: string;
  organizationId: string;
  sessionId: string;
  permissions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface AuditLogEntry {
  timestamp: Date;
  operation: 'encrypt' | 'decrypt' | 'access' | 'modify' | 'delete';
  resource: string;
  resourceId: string;
  userId: string;
  success: boolean;
  error?: string;
  context: Partial<SecurityContext>;
  dataClassification: string;
}

class EncryptionMiddlewareManager {
  private config: EncryptionMiddlewareConfig;
  private auditLog: AuditLogEntry[] = [];
  private securityContexts: Map<string, SecurityContext> = new Map();

  constructor() {
    this.config = {
      enabled: true,
      encryptRequest: true,
      decryptResponse: true,
      autoEncryptFields: true,
      auditLogging: true,
      fieldTypes: {
        // Customer data
        'emirates_id': 'emirates_id',
        'phone': 'phone',
        'email': 'email',
        'address': 'address',
        'passport': 'passport',
        'visa_info': 'visa_info',
        // Employee data
        'salary': 'salary',
        'bank_account': 'bank_account',
        'emergency_contact': 'emergency_contact',
        // Measurement data
        'body_measurements': 'body_measurements',
        'height': 'body_measurements',
        'weight': 'body_measurements',
        'chest': 'body_measurements',
        'waist': 'body_measurements',
        'hips': 'body_measurements',
        // Financial data
        'tax_id': 'tax_id',
        'credit_card': 'bank_account',
        // Medical data
        'medical_info': 'medical_info',
        'allergies': 'medical_info',
        'medications': 'medical_info'
      },
      exemptFields: ['id', 'created_at', 'updated_at', 'status', 'is_active'],
      exemptEndpoints: ['/api/auth/', '/api/health', '/api/ping'],
      debug: false
    };
  }

  /**
   * Main encryption middleware for Express
   */
  encryptionMiddleware = (): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next();
      }

      // Skip exempt endpoints
      if (this.isExemptEndpoint(req.path)) {
        return next();
      }

      // Set up security context
      const securityContext = this.createSecurityContext(req);
      this.securityContexts.set(req.sessionID || 'default', securityContext);

      try {
        // Process request (encrypt sensitive data)
        if (this.config.encryptRequest) {
          this.processRequest(req, securityContext);
        }

        // Override res.json to decrypt response
        const originalJson = res.json.bind(res);
        res.json = (data: any) => {
          if (this.config.decryptResponse) {
            try {
              data = this.processResponse(data, securityContext);
            } catch (error) {
              this.logAuditEvent({
                operation: 'decrypt',
                resource: req.path,
                resourceId: 'unknown',
                userId: securityContext.userId,
                success: false,
                error: error.message,
                context: securityContext,
                dataClassification: 'unknown'
              });
            }
          }
          return originalJson(data);
        };

        next();
      } catch (error) {
        this.logAuditEvent({
          operation: 'access',
          resource: req.path,
          resourceId: 'unknown',
          userId: securityContext.userId,
          success: false,
          error: error.message,
          context: securityContext,
          dataClassification: 'unknown'
        });
        next(error);
      }
    };
  };

  /**
   * Database encryption middleware
   */
  databaseEncryptionMiddleware = (operation: 'insert' | 'update' | 'select' | 'delete') => {
    return {
      before: (data: any, context: SecurityContext) => {
        if (!this.config.enabled || !this.config.autoEncryptFields) {
          return data;
        }

        switch (operation) {
          case 'insert':
          case 'update':
            return this.encryptDatabaseData(data, context);
          case 'select':
            return this.decryptDatabaseData(data, context);
          case 'delete':
            return this.handleSecureDelete(data, context);
          default:
            return data;
        }
      },
      after: (result: any, context: SecurityContext) => {
        if (!this.config.enabled) {
          return result;
        }

        if (operation === 'select' && this.config.decryptResponse) {
          return this.decryptDatabaseData(result, context);
        }

        return result;
      }
    };
  };

  /**
   * API request/response encryption middleware
   */
  apiEncryptionMiddleware = (config: {
    encryptRequest?: boolean;
    decryptResponse?: boolean;
    customFieldTypes?: Record<string, SensitiveDataType>;
  } = {}) => {
    const middlewareConfig = { ...this.config, ...config };

    return (req: Request, res: Response, next: NextFunction) => {
      const securityContext = this.createSecurityContext(req);
      
      // Encrypt request body if contains sensitive data
      if (middlewareConfig.encryptRequest && req.body) {
        req.body = this.encryptApiRequest(req.body, securityContext);
      }

      // Wrap response
      const originalSend = res.send.bind(res);
      res.send = (data: any) => {
        if (middlewareConfig.decryptResponse) {
          try {
            data = this.decryptApiResponse(data, securityContext);
          } catch (error) {
            console.error('Response decryption failed:', error);
          }
        }
        return originalSend(data);
      };

      next();
    };
  };

  /**
   * Field-level encryption middleware for specific data types
   */
  fieldEncryptionMiddleware = (fieldType: SensitiveDataType) => {
    return (data: any, context: SecurityContext) => {
      if (!this.config.enabled) {
        return data;
      }

      const fieldValue = fieldEncryptionManager.encryptField(data, fieldType);
      
      this.logAuditEvent({
        operation: 'encrypt',
        resource: 'field',
        resourceId: fieldType,
        userId: context.userId,
        success: true,
        context,
        dataClassification: fieldType
      });

      return fieldValue;
    };
  };

  /**
   * Anonymization middleware
   */
  anonymizationMiddleware = (config: {
    method?: 'masking' | 'pseudonymization' | 'generalization';
    fields?: string[];
    conditional?: (data: any, context: SecurityContext) => boolean;
  } = {}) => {
    return (data: any, context: SecurityContext) => {
      if (!this.config.enabled) {
        return data;
      }

      // Check conditional
      if (config.conditional && !config.conditional(data, context)) {
        return data;
      }

      // Anonymize specified fields
      const anonymizedData = { ...data };
      const fields = config.fields || Object.keys(this.config.fieldTypes);

      for (const field of fields) {
        if (anonymizedData[field] !== undefined) {
          const fieldType = this.config.fieldTypes[field];
          if (fieldType) {
            const fieldValue = fieldEncryptionManager.anonymizeField(
              anonymizedData[field], 
              fieldType
            );
            anonymizedData[field] = fieldValue.anonymized;
          }
        }
      }

      this.logAuditEvent({
        operation: 'modify',
        resource: 'anonymization',
        resourceId: 'bulk',
        userId: context.userId,
        success: true,
        context,
        dataClassification: 'anonymized'
      });

      return anonymizedData;
    };
  };

  /**
   * Process request to encrypt sensitive data
   */
  private processRequest(req: Request, context: SecurityContext): void {
    if (!req.body || typeof req.body !== 'object') {
      return;
    }

    req.body = this.encryptApiRequest(req.body, context);
  }

  /**
   * Process response to decrypt sensitive data
   */
  private processResponse(data: any, context: SecurityContext): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    return this.decryptApiResponse(data, context);
  }

  /**
   * Encrypt API request data
   */
  private encryptApiRequest(data: any, context: SecurityContext): any {
    const encrypted = { ...data };

    for (const [key, value] of Object.entries(data)) {
      if (this.shouldEncryptField(key)) {
        const fieldType = this.config.fieldTypes[key];
        if (fieldType) {
          try {
            const fieldValue = fieldEncryptionManager.encryptField(value, fieldType);
            encrypted[key] = fieldValue.encrypted;
            
            this.logAuditEvent({
              operation: 'encrypt',
              resource: 'api_request',
              resourceId: key,
              userId: context.userId,
              success: true,
              context,
              dataClassification: fieldType
            });
          } catch (error) {
            if (this.config.debug) {
              console.error(`Failed to encrypt field ${key}:`, error);
            }
          }
        }
      }
    }

    return encrypted;
  }

  /**
   * Decrypt API response data
   */
  private decryptApiResponse(data: any, context: SecurityContext): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const decrypted = { ...data };

    for (const [key, value] of Object.entries(data)) {
      if (this.shouldDecryptField(key, value)) {
        try {
          const fieldType = this.config.fieldTypes[key];
          if (fieldType) {
            // Check if value appears to be encrypted
            if (typeof value === 'string' && encryptionUtils.isEncrypted(value)) {
              const decryptedValue = encryptionUtils.decryptFromBase64(value);
              const fieldValue: FieldValue = {
                original: null,
                encrypted: JSON.parse(decryptedValue),
                isEncrypted: true,
                isMasked: false,
                isAnonymized: false
              };
              
              decrypted[key] = fieldEncryptionManager.decryptField(fieldValue, fieldType);
              
              this.logAuditEvent({
                operation: 'decrypt',
                resource: 'api_response',
                resourceId: key,
                userId: context.userId,
                success: true,
                context,
                dataClassification: fieldType
              });
            }
          }
        } catch (error) {
          if (this.config.debug) {
            console.error(`Failed to decrypt field ${key}:`, error);
          }
        }
      }
    }

    return decrypted;
  }

  /**
   * Encrypt database data
   */
  private encryptDatabaseData(data: any, context: SecurityContext): any {
    const encrypted = { ...data };

    for (const [key, value] of Object.entries(data)) {
      if (this.shouldEncryptField(key)) {
        const fieldType = this.config.fieldTypes[key];
        if (fieldType) {
          try {
            const fieldValue = fieldEncryptionManager.encryptField(value, fieldType);
            encrypted[`${key}_encrypted`] = JSON.stringify(fieldValue.encrypted);
            encrypted[`${key}_is_encrypted`] = true;
            
            this.logAuditEvent({
              operation: 'encrypt',
              resource: 'database',
              resourceId: key,
              userId: context.userId,
              success: true,
              context,
              dataClassification: fieldType
            });
          } catch (error) {
            console.error(`Database encryption failed for field ${key}:`, error);
          }
        }
      }
    }

    return encrypted;
  }

  /**
   * Decrypt database data
   */
  private decryptDatabaseData(data: any, context: SecurityContext): any {
    if (!data) return data;

    // Handle single record
    if (!Array.isArray(data)) {
      return this.decryptSingleRecord(data, context);
    }

    // Handle array of records
    return data.map(record => this.decryptSingleRecord(record, context));
  }

  /**
   * Decrypt single database record
   */
  private decryptSingleRecord(record: any, context: SecurityContext): any {
    if (!record || typeof record !== 'object') {
      return record;
    }

    const decrypted = { ...record };

    for (const [key, value] of Object.entries(record)) {
      // Check for encrypted fields
      const encryptedKey = `${key}_encrypted`;
      if (record[`${key}_is_encrypted`] && record[encryptedKey]) {
        try {
          const encryptedData: EncryptedData = JSON.parse(record[encryptedKey]);
          const fieldType = this.config.fieldTypes[key];
          
          if (fieldType) {
            const fieldValue: FieldValue = {
              original: null,
              encrypted: encryptedData,
              isEncrypted: true,
              isMasked: false,
              isAnonymized: false
            };
            
            decrypted[key] = fieldEncryptionManager.decryptField(fieldValue, fieldType);
            
            // Clean up encryption metadata
            delete decrypted[encryptedKey];
            delete decrypted[`${key}_is_encrypted`];
            
            this.logAuditEvent({
              operation: 'decrypt',
              resource: 'database',
              resourceId: key,
              userId: context.userId,
              success: true,
              context,
              dataClassification: fieldType
            });
          }
        } catch (error) {
          console.error(`Database decryption failed for field ${key}:`, error);
        }
      }
    }

    return decrypted;
  }

  /**
   * Handle secure deletion
   */
  private async handleSecureDelete(data: any, context: SecurityContext): Promise<any> {
    try {
      // Create deletion request for sensitive data
      await secureDeletionManager.createDeletionRequest(
        'record',
        data.id || 'unknown',
        'system_maintenance',
        context.userId,
        context.organizationId,
        'medium'
      );
      
      this.logAuditEvent({
        operation: 'delete',
        resource: 'database',
        resourceId: data.id || 'unknown',
        userId: context.userId,
        success: true,
        context,
        dataClassification: 'sensitive'
      });
      
      return data;
    } catch (error) {
      this.logAuditEvent({
        operation: 'delete',
        resource: 'database',
        resourceId: data.id || 'unknown',
        userId: context.userId,
        success: false,
        error: error.message,
        context,
        dataClassification: 'sensitive'
      });
      
      throw error;
    }
  }

  /**
   * Create security context from request
   */
  private createSecurityContext(req: Request): SecurityContext {
    return {
      userId: req.headers['x-user-id'] as string || 'anonymous',
      organizationId: req.headers['x-org-id'] as string || 'default',
      sessionId: req.sessionID || 'default',
      permissions: (req.headers['x-permissions'] as string || '').split(','),
      riskLevel: this.calculateRiskLevel(req),
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date()
    };
  }

  /**
   * Calculate risk level based on request characteristics
   */
  private calculateRiskLevel(req: Request): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    // IP-based risk
    if (req.ip?.includes('192.168.') || req.ip?.includes('10.')) {
      riskScore += 1; // Internal IP
    } else {
      riskScore += 2; // External IP
    }

    // Time-based risk
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 2; // Off-hours access
    }

    // Method-based risk
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      riskScore += 1; // Data modification
    }

    // Path-based risk
    if (req.path.includes('/admin/') || req.path.includes('/api/employees/')) {
      riskScore += 2; // Sensitive endpoints
    }

    if (riskScore <= 2) return 'low';
    if (riskScore <= 4) return 'medium';
    if (riskScore <= 6) return 'high';
    return 'critical';
  }

  /**
   * Check if field should be encrypted
   */
  private shouldEncryptField(fieldName: string): boolean {
    return !this.config.exemptFields.includes(fieldName) && 
           this.config.fieldTypes.hasOwnProperty(fieldName);
  }

  /**
   * Check if field should be decrypted
   */
  private shouldDecryptField(fieldName: string, value: any): boolean {
    if (!this.shouldEncryptField(fieldName)) {
      return false;
    }

    // Check if value is encrypted
    if (typeof value === 'string') {
      return encryptionUtils.isEncrypted(value);
    }

    return false;
  }

  /**
   * Check if endpoint is exempt from encryption
   */
  private isExemptEndpoint(path: string): boolean {
    return this.config.exemptEndpoints.some(exempt => path.startsWith(exempt));
  }

  /**
   * Log audit event
   */
  private logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    if (!this.config.auditLogging) {
      return;
    }

    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date()
    };

    this.auditLog.push(auditEntry);

    // In production, this would be sent to a centralized logging system
    if (this.config.debug) {
      console.log('Security audit:', auditEntry);
    }
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filters?: {
    userId?: string;
    operation?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): AuditLogEntry[] {
    let logs = [...this.auditLog];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.operation) {
        logs = logs.filter(log => log.operation === filters.operation);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }
    }

    return logs;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EncryptionMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
export const encryptionMiddlewareManager = new EncryptionMiddlewareManager();

// Export middleware functions
export const {
  encryptionMiddleware,
  databaseEncryptionMiddleware,
  apiEncryptionMiddleware,
  fieldEncryptionMiddleware,
  anonymizationMiddleware
} = encryptionMiddlewareManager;

/**
 * Quick setup function for Express
 */
export const setupEncryptionMiddleware = (app: any, config?: Partial<EncryptionMiddlewareConfig>) => {
  if (config) {
    encryptionMiddlewareManager.updateConfig(config);
  }

  app.use(encryptionMiddlewareManager.encryptionMiddleware());
  
  console.log('Encryption middleware configured');
};

/**
 * Usage examples
 */
export const examples = {
  // Express middleware
  express: `
    import { setupEncryptionMiddleware } from './security/encryption-middleware';
    
    app.use(setupEncryptionMiddleware(app, {
      enabled: true,
      auditLogging: true,
      fieldTypes: {
        'emirates_id': 'emirates_id',
        'salary': 'salary'
      }
    }));
  `,

  // Database middleware
  database: `
    const dbMiddleware = databaseEncryptionMiddleware('insert');
    const encryptedData = dbMiddleware.before(userData, securityContext);
    await database.insert(encryptedData);
    const result = dbMiddleware.after(rawResult, securityContext);
  `,

  // API middleware
  api: `
    app.post('/api/customers', 
      apiEncryptionMiddleware({ encryptRequest: true }),
      async (req, res) => {
        // req.body is automatically encrypted
        const customer = await createCustomer(req.body);
        // res.json will automatically decrypt
        res.json(customer);
      }
    );
  `
};
