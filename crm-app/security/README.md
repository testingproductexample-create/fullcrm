# Security & Encryption System Documentation

## Overview

This comprehensive security system provides end-to-end encryption, data protection, anonymization, and secure deletion for the CRM system. It ensures compliance with UAE PDPL (Personal Data Protection Law) and CSA (Cybersecurity Audit) requirements.

## Features

### Core Components

1. **Field-Level Encryption** - Encrypt specific sensitive data types
2. **Secure File Upload** - Encrypted file handling with validation
3. **Data Anonymization** - Privacy-preserving data transformations
4. **Secure Deletion** - Compliant data lifecycle management
5. **Encryption Middleware** - Automatic encryption/decryption
6. **Key Management** - Enterprise-grade key lifecycle management

## Quick Start

### 1. Basic Setup

```typescript
import { setupSecuritySystem, securitySystem } from './security';

// Initialize with default configuration
await setupSecuritySystem();

// Or customize configuration
await setupSecuritySystem({
  encryption: {
    enabled: true,
    keyRotation: true,
    autoBackup: true
  },
  compliance: {
    frameworks: ['UAE_PDPL', 'CSA'],
    autoCompliance: true
  }
});
```

### 2. Field-Level Encryption

```typescript
import { fieldEncryptionManager, SensitiveDataType } from './security';

// Encrypt Emirates ID
const emiratesId = "784-1984-1234567-1";
const encrypted = fieldEncryptionManager.encryptField(emiratesId, 'emirates_id');

// Decrypt when needed
const decrypted = fieldEncryptionManager.decryptField(encrypted, 'emirates_id');

// Mask for display
const masked = fieldEncryptionManager.maskField(emiratesId, 'emirates_id');
// Result: "78****67"
```

### 3. Secure File Upload

```typescript
import { secureFileUploadManager } from './security';

// Upload file with encryption
const fileBuffer = Buffer.from(fileContent);
const fileInfo = await secureFileUploadManager.uploadFile(
  fileBuffer,
  'customer_document.pdf',
  'user123',
  'customer_verification',
  'confidential'
);

// Download and decrypt
const { buffer, fileInfo: info } = await secureFileUploadManager.downloadFile(
  fileInfo.fileName,
  'customer_verification',
  'confidential'
);
```

### 4. Data Anonymization

```typescript
import { dataAnonymizationManager } from './security';

// Anonymize customer data
const customerData = {
  name: "Ahmed Al-Rashid",
  emirates_id: "784-1984-1234567-1",
  phone: "+971501234567",
  address: "Dubai Marina, Dubai, UAE"
};

const rules = [
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

// result.anonymizedData will contain protected data
```

### 5. Secure Deletion

```typescript
import { secureDeletionManager } from './security';

// Create deletion request
const request = await secureDeletionManager.createDeletionRequest(
  'customer',
  'customer_id_123',
  'data_subject_request',
  'user123',
  'org123',
  'high'
);

// Approve and execute
await secureDeletionManager.approveDeletionRequest(request.id, 'admin');
const success = await secureDeletionManager.executeDeletionRequest(request.id);
```

## Detailed Usage

### Encryption Middleware

#### Express.js Setup

```typescript
import { setupEncryptionMiddleware } from './security';
import express from 'express';

const app = express();

// Apply encryption middleware to all routes
app.use(setupEncryptionMiddleware(app, {
  enabled: true,
  auditLogging: true,
  fieldTypes: {
    'emirates_id': 'emirates_id',
    'salary': 'salary',
    'phone': 'phone',
    'email': 'email'
  }
}));

// Specific route with custom configuration
app.post('/api/customers', 
  apiEncryptionMiddleware({ 
    encryptRequest: true, 
    decryptResponse: true 
  }),
  async (req, res) => {
    // req.body is automatically encrypted
    const customer = await createCustomer(req.body);
    // res.json will automatically decrypt
    res.json(customer);
  }
);
```

#### Database Middleware

```typescript
import { databaseEncryptionMiddleware } from './security';

// Before insert/update
const dbMiddleware = databaseEncryptionMiddleware('insert');
const encryptedData = dbMiddleware.before(customerData, securityContext);
await database.insert(encryptedData);
const result = dbMiddleware.after(rawResult, securityContext);
```

### Key Management

```typescript
import { cryptoKeyManager, keyManagerUtils } from './security';

// Generate new key
const key = await cryptoKeyManager.generateKey(
  'Customer PII Encryption',
  'field_encryption',
  ['pii_protection', 'customer_data'],
  'org123',
  'admin'
);

// Get key for use
const keyMaterial = await cryptoKeyManager.getKey(key.id, 'user123', '192.168.1.1');

// Rotate key
const newKey = await cryptoKeyManager.rotateKey(key.id, 'admin', 'scheduled_rotation');

// Validate key
const validation = cryptoKeyManager.validateKey(key.id);
console.log(validation.issues); // Any issues found
```

### Anonymization Methods

#### 1. Masking
```typescript
// Keep only last 4 digits of phone number
const masked = fieldEncryptionManager.maskField('+971501234567', 'phone');
// Result: "****4567"
```

#### 2. Pseudonymization
```typescript
// Replace with hash-based pseudonym
const pseudonym = fieldEncryptionManager.anonymizeField('Ahmed Al-Rashid', 'name');
// Result: "ANON_a1b2c3d4"
```

#### 3. Generalization
```typescript
// Generalize salary to ranges
const generalized = dataAnonymizationManager.anonymizeEmployeeData({
  salary: 15000
}, [{
  field: 'salary',
  type: 'salary',
  method: 'generalization',
  parameters: { type: 'quintile' }
}]);
// Result: "10000-19999"
```

#### 4. K-Anonymity
```typescript
// Apply k-anonymity to dataset
const { anonymized, suppressed } = dataAnonymizationManager.applyKAnonymity(
  customerDataset,
  ['age_range', 'gender', 'location'],
  5 // k=5
);
```

### File Upload with Validation

```typescript
import { secureFileUploadManager } from './security';

// Configure upload settings
const config = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['image/jpeg', 'application/pdf'],
  encryptionRequired: true,
  virusScan: true,
  quarantinePeriod: 7
};

// Batch upload
const files = [
  {
    buffer: fileBuffer1,
    fileName: 'document1.pdf',
    uploader: 'user123',
    purpose: 'verification'
  }
];

const results = await secureFileUploadManager.batchUpload(
  files,
  'confidential'
);
```

## Configuration Options

### Security System Configuration

```typescript
const config = {
  encryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
    keyRotation: true,
    autoBackup: true
  },
  fieldEncryption: {
    enabled: true,
    autoEncrypt: true,
    searchableFields: ['phone', 'email', 'name']
  },
  fileUpload: {
    enabled: true,
    maxFileSize: 50 * 1024 * 1024,
    allowedTypes: ['image/*', 'application/pdf'],
    virusScan: true
  },
  anonymization: {
    enabled: true,
    defaultMethod: 'pseudonymization',
    reversible: true
  },
  deletion: {
    enabled: true,
    secureDeletion: true,
    retentionCompliance: true
  },
  middleware: {
    enabled: true,
    auditLogging: true,
    riskAssessment: true
  },
  compliance: {
    frameworks: ['UAE_PDPL', 'CSA', 'ISO27001'],
    autoCompliance: true,
    auditTrail: true
  }
};
```

## Compliance Features

### UAE PDPL Compliance

```typescript
// Automatic consent management
const consent = await dataConsentManager.grantConsent({
  subjectId: 'customer123',
  subjectType: 'customer',
  consentType: 'processing',
  purpose: 'order_fulfillment',
  dataCategories: ['contact_info', 'measurements']
});

// Data subject rights
const request = await dataSubjectRightsManager.createRequest({
  subjectId: 'customer123',
  requestType: 'access',
  legalBasis: 'Article 13 PDPL'
});
```

### Audit Trail

```typescript
// Get audit logs
const logs = encryptionMiddlewareManager.getAuditLogs({
  userId: 'user123',
  operation: 'decrypt',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
  limit: 50
});

// Log custom event
await auditLogger.log({
  action: 'data_access',
  resource: 'customer',
  resourceId: 'customer123',
  userId: 'user123',
  details: 'Accessed customer profile',
  metadata: { fields: ['name', 'phone'] }
});
```

## Best Practices

### 1. Data Classification

```typescript
// Always classify data before processing
const sensitivity = securityUtils.classifyDataSensitivity(customerData);
if (sensitivity === 'critical') {
  // Apply maximum security measures
  await fieldEncryptionManager.encryptField(data, 'emirates_id');
  await fieldEncryptionManager.encryptField(data, 'salary');
}
```

### 2. Key Management

```typescript
// Never store keys in code
// Always use environment variables or key management service
const key = await cryptoKeyManager.getKey(process.env.ENCRYPTION_KEY_ID);

// Regular key rotation
setInterval(async () => {
  const expiringKeys = keyManagerUtils.getExpiringKeys(30);
  for (const key of expiringKeys) {
    await cryptoKeyManager.rotateKey(key.id, 'system', 'scheduled_rotation');
  }
}, 24 * 60 * 60 * 1000); // Check daily
```

### 3. Secure Deletion

```typescript
// Implement retention policies
const retentionPolicy = {
  'customer_data': 2557, // 7 years
  'employee_data': 2557, // 7 years
  'financial_data': 4380, // 12 years
  'logs': 90 // 90 days
};

// Schedule automatic deletion
setInterval(async () => {
  for (const [dataType, days] of Object.entries(retentionPolicy)) {
    const expiredRecords = await getExpiredRecords(dataType, days);
    for (const record of expiredRecords) {
      await secureDeletionManager.createDeletionRequest(
        dataType,
        record.id,
        'retention_policy',
        'system',
        'org123'
      );
    }
  }
}, 24 * 60 * 60 * 1000); // Check daily
```

### 4. Monitoring and Alerting

```typescript
// Monitor security health
const health = securitySystem.getStatus();
if (health.health.keys === 'critical') {
  await alertManager.sendAlert({
    type: 'security',
    severity: 'critical',
    message: 'Encryption keys expiring',
    action: 'immediate_rotation_required'
  });
}

// Track security metrics
const metrics = {
  encryptionOperations: auditLogs.filter(log => 
    log.operation === 'encrypt' || log.operation === 'decrypt'
  ).length,
  failedAttempts: auditLogs.filter(log => log.success === false).length,
  uniqueUsers: new Set(auditLogs.map(log => log.userId)).size
};
```

## Troubleshooting

### Common Issues

1. **Encryption Failures**
   ```typescript
   try {
     const encrypted = fieldEncryptionManager.encryptField(data, 'emirates_id');
   } catch (error) {
     // Check if field type is valid
     const config = fieldEncryptionManager.getFieldConfig('emirates_id');
     if (!config) {
       console.error('Invalid field type');
     }
   }
   ```

2. **Key Access Issues**
   ```typescript
   // Check key status
   const key = cryptoKeyManager['keys'].get(keyId);
   if (key?.status !== 'active') {
     console.error(`Key status: ${key?.status}`);
   }
   
   // Validate key
   const validation = cryptoKeyManager.validateKey(keyId);
   if (!validation.isValid) {
     console.error('Key validation failed:', validation.issues);
   }
   ```

3. **Performance Issues**
   ```typescript
   // Use batch operations for large datasets
   const batch = data.slice(0, 100); // Process in batches
   for (let i = 0; i < data.length; i += 100) {
     const batch = data.slice(i, i + 100);
     await Promise.all(batch.map(item => processItem(item)));
   }
   ```

## API Reference

### Core Classes

- `EncryptionManager` - Core encryption operations
- `FieldEncryptionManager` - Field-level encryption
- `SecureFileUploadManager` - File upload handling
- `DataAnonymizationManager` - Data anonymization
- `SecureDeletionManager` - Data deletion
- `EncryptionMiddlewareManager` - Middleware integration
- `CryptoKeyManager` - Key lifecycle management

### Key Types

- `emirates_id` - UAE Emirates ID
- `salary` - Employee salary information
- `body_measurements` - Customer measurements
- `passport` - Passport information
- `visa_info` - Visa details
- `bank_account` - Bank account details
- `phone` - Phone numbers
- `email` - Email addresses
- `address` - Physical addresses
- `medical_info` - Medical data

### Anonymization Methods

- `masking` - Replace with masked version
- `pseudonymization` - Replace with pseudonym
- `generalization` - Replace with generalized value
- `suppression` - Remove data completely
- `shuffling` - Shuffle values between records
- `differential_privacy` - Add privacy-preserving noise
- `k_anonymity` - Ensure k-anonymity
- `l_diversity` - Ensure l-diversity

## Security Considerations

### 1. Data in Transit
- All encryption uses TLS 1.3
- API endpoints use HTTPS only
- Database connections are encrypted

### 2. Data at Rest
- All sensitive fields are encrypted
- File system encryption enabled
- Database encryption at rest

### 3. Access Control
- Role-based access control (RBAC)
- Multi-factor authentication required
- Session management with timeout

### 4. Audit and Monitoring
- All security events are logged
- Real-time monitoring enabled
- Automated compliance reporting

### 5. Key Management
- Hardware Security Module (HSM) integration
- Key rotation automation
- Secure key backup and recovery

## Support and Maintenance

For issues or questions:
1. Check the troubleshooting section
2. Review audit logs for specific errors
3. Validate configuration settings
4. Test with development environment first
5. Consult compliance documentation

## License

This security system is proprietary software designed for enterprise use. All security implementations follow industry best practices and UAE regulatory requirements.
