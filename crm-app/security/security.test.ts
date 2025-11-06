/**
 * Security System Tests
 * Comprehensive test suite for encryption and security features
 */

import { 
  setupSecuritySystem,
  securitySystem,
  fieldEncryptionManager,
  secureFileUploadManager,
  dataAnonymizationManager,
  secureDeletionManager,
  cryptoKeyManager,
  keyManagerUtils,
  SensitiveDataType,
  AnonymizationRule,
  DeletionReason
} from './index';

describe('Security System', () => {
  let testConfig: any;

  beforeAll(async () => {
    // Initialize security system for testing
    testConfig = {
      encryption: {
        enabled: true,
        keyRotation: false, // Disable in tests
        autoBackup: false
      },
      compliance: {
        frameworks: ['UAE_PDPL'],
        autoCompliance: false // Disable in tests
      }
    };

    await setupSecuritySystem(testConfig);
  });

  describe('Encryption Manager', () => {
    test('should encrypt and decrypt data', () => {
      const plaintext = 'Sensitive customer data';
      const encrypted = securitySystem['encryptionManager'].encrypt(plaintext);
      const decrypted = securitySystem['encryptionManager'].decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
      expect(encrypted).toHaveProperty('data');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('algorithm');
    });

    test('should generate secure tokens', () => {
      const token1 = securitySystem['encryptionManager'].generateSecureToken(32);
      const token2 = securitySystem['encryptionManager'].generateSecureToken(32);
      
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    test('should calculate hashes', () => {
      const data = 'test data';
      const hash1 = securitySystem['encryptionManager'].generateHash(data);
      const hash2 = securitySystem['encryptionManager'].generateHash(data);
      const hash3 = securitySystem['encryptionManager'].generateHash('different data');
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toHaveLength(64); // SHA256 hex
    });
  });

  describe('Field Encryption', () => {
    test('should encrypt Emirates ID', () => {
      const emiratesId = '784-1984-1234567-1';
      const encrypted = fieldEncryptionManager.encryptField(emiratesId, 'emirates_id');
      
      expect(encrypted.isEncrypted).toBe(true);
      expect(encrypted.original).toBe(emiratesId);
      expect(encrypted.encrypted).toBeDefined();
    });

    test('should decrypt Emirates ID', () => {
      const emiratesId = '784-1984-1234567-1';
      const encrypted = fieldEncryptionManager.encryptField(emiratesId, 'emirates_id');
      const decrypted = fieldEncryptionManager.decryptField(encrypted, 'emirates_id');
      
      expect(decrypted).toBe(emiratesId);
    });

    test('should mask Emirates ID', () => {
      const emiratesId = '784-1984-1234567-1';
      const masked = fieldEncryptionManager.maskField(emiratesId, 'emirates_id');
      
      expect(masked.isMasked).toBe(true);
      expect(masked.masked).toBe('78****67');
    });

    test('should encrypt salary data', () => {
      const salary = 75000;
      const encrypted = fieldEncryptionManager.encryptField(salary, 'salary');
      
      expect(encrypted.isEncrypted).toBe(true);
      expect(encrypted.original).toBe(salary);
    });

    test('should mask phone numbers', () => {
      const phone = '+971501234567';
      const masked = fieldEncryptionManager.maskField(phone, 'phone');
      
      expect(masked.isMasked).toBe(true);
      expect(masked.masked).toBe('****4567');
    });

    test('should anonymize data', () => {
      const emiratesId = '784-1984-1234567-1';
      const anonymized = fieldEncryptionManager.anonymizeField(emiratesId, 'emirates_id');
      
      expect(anonymized.isAnonymized).toBe(true);
      expect(anonymized.anonymized).toMatch(/^ANON_[a-f0-9]{8}$/);
    });

    test('should validate Emirates ID format', () => {
      const validId = '784-1984-1234567-1';
      const invalidId = '123';
      
      const validResult = fieldEncryptionManager.validateFieldValue(validId, 'emirates_id');
      const invalidResult = fieldEncryptionManager.validateFieldValue(invalidId, 'emirates_id');
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('Invalid Emirates ID format');
    });
  });

  describe('File Upload Security', () => {
    test('should validate allowed file types', async () => {
      const allowedBuffer = Buffer.from('test image data');
      const allowedType = 'image/jpeg';
      
      const result = await secureFileUploadManager.validateFile(
        allowedBuffer,
        'test.jpg',
        allowedType
      );
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject disallowed file types', async () => {
      const disallowedBuffer = Buffer.from('test executable');
      const disallowedType = 'application/x-executable';
      
      const result = await secureFileUploadManager.validateFile(
        disallowedBuffer,
        'malware.exe',
        disallowedType
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('File type'));
    });

    test('should encrypt file uploads', async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test.pdf';
      const uploader = 'test_user';
      const purpose = 'document_upload';
      
      const fileInfo = await secureFileUploadManager.uploadFile(
        fileBuffer,
        fileName,
        uploader,
        purpose
      );
      
      expect(fileInfo.encrypted).toBe(true);
      expect(fileInfo.encryptedData).toBeDefined();
      expect(fileInfo.uploadId).toBeDefined();
    });

    test('should generate secure file names', () => {
      const originalName = 'customer_document.pdf';
      const uploadId = 'upload_1234567890_abcdef12';
      
      const secureName = (secureFileUploadManager as any).generateSecureFileName(
        originalName,
        uploadId
      );
      
      expect(secureName).toMatch(/^encrypted_\d+_[a-f0-9]{16}\.pdf$/);
    });
  });

  describe('Data Anonymization', () => {
    test('should anonymize customer data', async () => {
      const customerData = {
        name: 'Ahmed Al-Rashid',
        emirates_id: '784-1984-1234567-1',
        phone: '+971501234567',
        address: 'Dubai Marina, Dubai, UAE'
      };

      const rules: AnonymizationRule[] = [
        {
          field: 'emirates_id',
          type: 'emirates_id',
          method: 'pseudonymization',
          parameters: { format: 'CUST_{hash}' }
        },
        {
          field: 'phone',
          type: 'phone',
          method: 'masking',
          parameters: { keepLast: 4 }
        }
      ];

      const result = await dataAnonymizationManager.anonymizeCustomerData(
        customerData,
        rules
      );

      expect(result.anonymizedData.emirates_id).toMatch(/^CUST_[a-f0-9]{8}$/);
      expect(result.anonymizedData.phone).toBe('****4567');
      expect(result.anonymizedData.name).toBe('Ahmed Al-Rashid'); // Not in rules, unchanged
    });

    test('should apply k-anonymity', () => {
      const dataset = [
        { age_range: '25-34', gender: 'male', location: 'Dubai', value: 100 },
        { age_range: '25-34', gender: 'male', location: 'Dubai', value: 200 },
        { age_range: '25-34', gender: 'male', location: 'Dubai', value: 150 },
        { age_range: '35-44', gender: 'female', location: 'Abu Dhabi', value: 300 },
        { age_range: '35-44', gender: 'female', location: 'Abu Dhabi', value: 250 }
      ];

      const quasiIdentifiers = ['age_range', 'gender', 'location'];
      const k = 3;

      const { anonymized, suppressed } = dataAnonymizationManager.applyKAnonymity(
        dataset,
        quasiIdentifiers,
        k
      );

      expect(suppressed).toBe(2); // 2 records in group with 2 items (< k=3)
      expect(anonymized).toHaveLength(3); // 3 records kept
    });

    test('should apply differential privacy', () => {
      const originalValue = 100;
      const sensitivity = 10;
      const epsilon = 1.0;

      const noisyValue = dataAnonymizationManager.applyDifferentialPrivacy(
        originalValue,
        sensitivity,
        epsilon,
        'laplace'
      );

      expect(typeof noisyValue).toBe('number');
      expect(noisyValue).not.toBe(originalValue);
    });

    test('should mask email addresses', () => {
      const email = 'ahmed.rashid@example.com';
      const masked = dataAnonymizationManager['anonymizationUtils'].quickAnonymize(email, 'email');
      
      expect(masked).toBe('ah***@example.com');
    });
  });

  describe('Secure Deletion', () => {
    test('should create deletion request', async () => {
      const request = await secureDeletionManager.createDeletionRequest(
        'customer',
        'customer_123',
        'data_subject_request' as DeletionReason,
        'user123',
        'org123',
        'high'
      );

      expect(request.id).toBeDefined();
      expect(request.dataType).toBe('customer');
      expect(request.identifier).toBe('customer_123');
      expect(request.reason).toBe('data_subject_request');
      expect(request.status).toBe('pending');
    });

    test('should approve deletion request', async () => {
      const request = await secureDeletionManager.createDeletionRequest(
        'customer',
        'customer_456',
        'retention_policy' as DeletionReason,
        'user123',
        'org123',
        'medium'
      );

      const approved = await secureDeletionManager.approveDeletionRequest(
        request.id,
        'admin'
      );

      expect(approved).toBe(true);
      expect(request.status).toBe('approved');
    });

    test('should check if data can be deleted', () => {
      const canDeleteCustomer = deletionUtils.canDelete('customer', 'data_subject_request');
      const canDeleteEmployee = deletionUtils.canDelete('employee', 'employee_termination');
      
      expect(canDeleteCustomer).toBe(true);
      expect(canDeleteEmployee).toBe(true);
    });

    test('should get retention periods', () => {
      const customerRetention = deletionUtils.getRetentionPeriod('customer');
      const employeeRetention = deletionUtils.getRetentionPeriod('employee');
      
      expect(customerRetention).toBeGreaterThan(0);
      expect(employeeRetention).toBeGreaterThan(0);
    });
  });

  describe('Key Management', () => {
    test('should generate new key', async () => {
      const key = await cryptoKeyManager.generateKey(
        'Test Key',
        'field_encryption',
        ['pii_protection'],
        'test_org',
        'test_user'
      );

      expect(key.id).toBeDefined();
      expect(key.name).toBe('Test Key');
      expect(key.type).toBe('field_encryption');
      expect(key.status).toBe('active');
      expect(key.algorithm).toBe('AES-256-GCM');
    });

    test('should validate key', () => {
      const key = cryptoKeyManager['keys'].get('master_key_001');
      if (key) {
        const validation = cryptoKeyManager.validateKey(key.id);
        
        expect(validation.isValid).toBeDefined();
        expect(validation.strength).toBeDefined();
        expect(validation.entropy).toBeGreaterThan(0);
        expect(validation.lastValidated).toBeInstanceOf(Date);
      }
    });

    test('should get key statistics', () => {
      const stats = cryptoKeyManager.getKeyStatistics();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('expired');
      expect(stats).toHaveProperty('averageEntropy');
      expect(stats.total).toBeGreaterThanOrEqual(1); // At least master key
      expect(stats.active).toBeGreaterThanOrEqual(1);
    });

    test('should get expiring keys', () => {
      const expiringKeys = keyManagerUtils.getExpiringKeys(30);
      
      expect(Array.isArray(expiringKeys)).toBe(true);
    });
  });

  describe('Security System', () => {
    test('should initialize successfully', async () => {
      const result = await securitySystem.initialize();
      
      expect(result.success).toBe(true);
      expect(result.components).toContain('Crypto Key Manager');
    });

    test('should provide system status', () => {
      const status = securitySystem.getStatus();
      
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('statistics');
      expect(status).toHaveProperty('health');
      expect(status.statistics).toHaveProperty('activeKeys');
      expect(status.health).toHaveProperty('encryption');
    });

    test('should calculate security score', () => {
      const dashboardData = securitySystem.getDashboardData();
      
      expect(dashboardData.overview).toHaveProperty('securityScore');
      expect(dashboardData.overview.securityScore).toBeGreaterThanOrEqual(0);
      expect(dashboardData.overview.securityScore).toBeLessThanOrEqual(100);
    });

    test('should detect sensitive data', () => {
      const sensitiveData = {
        name: 'John Doe',
        emirates_id: '784-1984-1234567-1',
        salary: 50000
      };

      const nonSensitiveData = {
        name: 'John Doe',
        status: 'active',
        created_at: '2023-01-01'
      };

      const { securityUtils } = require('./index');
      
      expect(securityUtils.containsSensitiveData(sensitiveData)).toBe(true);
      expect(securityUtils.containsSensitiveData(nonSensitiveData)).toBe(false);
    });

    test('should classify data sensitivity', () => {
      const { securityUtils } = require('./index');
      
      const criticalData = { emirates_id: '784-1984-1234567-1', salary: 50000 };
      const highData = { passport: 'A1234567' };
      const mediumData = { phone: '+971501234567' };
      const lowData = { name: 'John Doe', status: 'active' };

      expect(securityUtils.classifyDataSensitivity(criticalData)).toBe('critical');
      expect(securityUtils.classifyDataSensitivity(highData)).toBe('high');
      expect(securityUtils.classifyDataSensitivity(mediumData)).toBe('medium');
      expect(securityUtils.classifyDataSensitivity(lowData)).toBe('low');
    });

    test('should generate security report', () => {
      const { securityUtils } = require('./index');
      
      const report = securityUtils.generateSecurityReport();
      
      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('systemStatus');
      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Compliance and Validation', () => {
    test('should validate configuration', () => {
      const { securityUtils } = require('./index');
      
      const validConfig = {
        encryption: { enabled: true },
        compliance: { frameworks: ['UAE_PDPL'] }
      };
      
      const invalidConfig = {
        encryption: { enabled: false },
        compliance: { frameworks: [] }
      };

      const validResult = securityUtils.validateSecurityConfig(validConfig);
      const invalidResult = securityUtils.validateSecurityConfig(invalidConfig);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('should handle PDPL compliance', () => {
      // Test PDPL-specific features
      const pdplData = {
        emirates_id: '784-1984-1234567-1',
        consent_given: true,
        consent_date: new Date().toISOString(),
        purpose: 'customer_service'
      };

      // Should have appropriate retention and protection
      const retention = fieldEncryptionManager.getRetentionPeriod('emirates_id');
      expect(retention).toBeGreaterThan(2555); // Close to 7 years
    });
  });

  describe('Error Handling', () => {
    test('should handle encryption errors gracefully', () => {
      expect(() => {
        fieldEncryptionManager.decryptField(
          { original: null, isEncrypted: false, isMasked: false, isAnonymized: false },
          'emirates_id'
        );
      }).not.toThrow();
    });

    test('should handle invalid key access', async () => {
      await expect(
        cryptoKeyManager.getKey('non_existent_key', 'test_user')
      ).rejects.toThrow('Key not found');
    });

    test('should handle file validation errors', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = await secureFileUploadManager.validateFile(
        emptyBuffer,
        'empty.txt',
        'text/plain'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Integration Tests
 */
describe('Security System Integration', () => {
  test('should work end-to-end for customer data', async () => {
    // 1. Create customer with sensitive data
    const customerData = {
      name: 'Sarah Al-Mansoori',
      emirates_id: '784-1985-9876543-1',
      phone: '+971502345678',
      email: 'sarah.almansoori@example.com',
      salary: 45000
    };

    // 2. Encrypt sensitive fields
    const encryptedCustomer = {
      ...customerData,
      emirates_id: fieldEncryptionManager.encryptField(customerData.emirates_id, 'emirates_id'),
      phone: fieldEncryptionManager.encryptField(customerData.phone, 'phone'),
      email: fieldEncryptionManager.encryptField(customerData.email, 'email'),
      salary: fieldEncryptionManager.encryptField(customerData.salary, 'salary')
    };

    // 3. Anonymize for analytics
    const anonymized = await dataAnonymizationManager.anonymizeCustomerData(
      customerData,
      [
        {
          field: 'emirates_id',
          type: 'emirates_id',
          method: 'pseudonymization',
          parameters: { format: 'ANALYTICS_{hash}' }
        }
      ]
    );

    // 4. Verify encryption
    const decryptedId = fieldEncryptionManager.decryptField(
      encryptedCustomer.emirates_id,
      'emirates_id'
    );
    
    expect(decryptedId).toBe(customerData.emirates_id);
    expect(anonymized.anonymizedData.emirates_id).toMatch(/^ANALYTICS_[a-f0-9]{8}$/);
  });

  test('should handle secure file upload workflow', async () => {
    const fileContent = Buffer.from('Customer contract document');
    const fileName = 'contract.pdf';
    const classification = 'confidential';

    // Upload file
    const fileInfo = await secureFileUploadManager.uploadFile(
      fileContent,
      fileName,
      'user123',
      'contract_storage',
      classification
    );

    expect(fileInfo.encrypted).toBe(true);
    expect(fileInfo.classification).toBe(classification);

    // The file would be downloaded and decrypted in real usage
    // await secureFileUploadManager.downloadFile(fileInfo.fileName, 'contract_storage', classification);
  });

  test('should handle complete data lifecycle', async () => {
    const employeeData = {
      name: 'Omar Al-Zahra',
      emirates_id: '784-1986-5555555-1',
      salary: 60000,
      phone: '+971503456789'
    };

    // 1. Create with encryption
    const encrypted = fieldEncryptionManager.encryptField(employeeData.salary, 'salary');
    expect(encrypted.isEncrypted).toBe(true);

    // 2. Mask for display
    const masked = fieldEncryptionManager.maskField(employeeData.phone, 'phone');
    expect(masked.isMasked).toBe(true);
    expect(masked.masked).toBe('****6789');

    // 3. Anonymize for reports
    const anonymized = await dataAnonymizationManager.anonymizeEmployeeData(
      employeeData,
      [
        {
          field: 'emirates_id',
          type: 'emirates_id',
          method: 'pseudonymization',
          parameters: { format: 'EMP_{hash}' }
        }
      ]
    );

    expect(anonymized.anonymizedData.emirates_id).toMatch(/^EMP_[a-f0-9]{8}$/);

    // 4. Request deletion
    const deletionRequest = await secureDeletionManager.createDeletionRequest(
      'employee',
      'emp_123',
      'employee_termination' as DeletionReason,
      'hr_system',
      'org123',
      'high'
    );

    expect(deletionRequest.status).toBe('pending');
  });
});
