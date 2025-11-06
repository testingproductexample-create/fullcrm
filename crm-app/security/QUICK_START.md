# Security System Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Initialize Security System
```typescript
import { setupSecuritySystem } from './security';

await setupSecuritySystem();
```

### 2. Use Field Encryption
```typescript
import { fieldEncryptionManager } from './security';

// Encrypt
const encrypted = fieldEncryptionManager.encryptField('784-1984-1234567-1', 'emirates_id');

// Decrypt
const decrypted = fieldEncryptionManager.decryptField(encrypted, 'emirates_id');

// Mask for display
const masked = fieldEncryptionManager.maskField('+971501234567', 'phone');
// Result: "****4567"
```

### 3. Secure File Upload
```typescript
import { secureFileUploadManager } from './security';

const fileInfo = await secureFileUploadManager.uploadFile(
  fileBuffer,
  'document.pdf',
  'user123',
  'verification',
  'confidential'
);
```

## 📋 Data Types Supported

| Type | Example | Protection |
|------|---------|------------|
| `emirates_id` | 784-1984-1234567-1 | Encryption + Masking |
| `salary` | 50000 | Encryption Only |
| `body_measurements` | {height: 180, chest: 100} | Encryption + Anonymization |
| `phone` | +971501234567 | Encryption + Masking |
| `email` | user@example.com | Encryption + Masking |
| `passport` | A1234567 | Encryption + Anonymization |
| `bank_account` | 1234567890 | Encryption Only |
| `medical_info` | {allergies: 'penicillin'} | Encryption + Anonymization |

## 🛡️ Security Features

### ✅ What's Included
- **Field-level encryption** for 12+ sensitive data types
- **Secure file upload** with validation and encryption
- **Data anonymization** (9 methods: masking, pseudonymization, etc.)
- **Secure deletion** with multi-pass overwriting
- **Key management** with auto-rotation
- **Audit logging** for all operations
- **UAE PDPL & CSA compliance**

### ✅ Compliance Ready
- **UAE PDPL** (Personal Data Protection Law)
- **CSA** (Cybersecurity Audit)
- **ISO 27001** framework
- **Data retention** policies
- **Subject rights** (access, rectification, erasure)

## 💻 Code Examples

### Express.js Middleware
```typescript
import { setupEncryptionMiddleware } from './security';

// Apply to all routes
app.use(setupEncryptionMiddleware());

// Specific route
app.post('/api/customers', 
  apiEncryptionMiddleware({ encryptRequest: true }),
  (req, res) => {
    // req.body is auto-encrypted
    res.json(customer); // Auto-decrypted response
  }
);
```

### Database Middleware
```typescript
const dbMiddleware = databaseEncryptionMiddleware('insert');
const encrypted = dbMiddleware.before(data, context);
await db.insert(encrypted);
const result = dbMiddleware.after(rawResult, context);
```

### Anonymization
```typescript
const result = await dataAnonymizationManager.anonymizeCustomerData(
  customerData,
  [
    {
      field: 'emirates_id',
      type: 'emirates_id',
      method: 'pseudonymization',
      parameters: { format: 'CUST_{hash}' }
    }
  ]
);
// Result: { anonymizedData: { emirates_id: 'CUST_a1b2c3d4' } }
```

### Secure Deletion
```typescript
const request = await secureDeletionManager.createDeletionRequest(
  'customer',
  'customer_id',
  'data_subject_request',
  'user_id',
  'org_id',
  'high'
);
```

## 🔧 Configuration

### Development
```typescript
await setupSecuritySystem({
  encryption: { keyRotation: false },
  compliance: { autoCompliance: false }
});
```

### Production
```typescript
await setupSecuritySystem({
  encryption: { keyRotation: true, autoBackup: true },
  fileUpload: { virusScan: true, maxFileSize: 100 * 1024 * 1024 },
  compliance: { autoCompliance: true, auditTrail: true }
});
```

## 📊 Monitoring

### Check System Health
```typescript
const status = securitySystem.getStatus();
console.log({
  health: status.health,
  activeKeys: status.statistics.activeKeys,
  securityScore: status.overview.securityScore
});
```

### Get Audit Logs
```typescript
const logs = encryptionMiddlewareManager.getAuditLogs({
  userId: 'user123',
  limit: 50
});
```

## ❗ Important Notes

### 🔒 Security Best Practices
1. **Never store keys in code** - Use environment variables or HSM
2. **Regular key rotation** - Set to auto-rotate in production
3. **Backup keys securely** - Use distributed backup locations
4. **Monitor access** - Review audit logs regularly
5. **Test regularly** - Run security tests in CI/CD

### 🚨 Common Pitfalls
1. **Don't forget to initialize** - Call `setupSecuritySystem()` first
2. **Check field types** - Use correct `SensitiveDataType` for each field
3. **Handle errors** - Wrap encryption in try-catch
4. **Validate input** - Check data before encryption
5. **Monitor performance** - Large datasets need batch processing

### 📝 Required Dependencies
```bash
npm install crypto file-type
```

## 🔍 Testing

### Run Tests
```bash
# Unit tests for all security components
npm test -- security.test.ts

# Integration tests
npm test -- security.integration.test.ts
```

### Manual Testing
```typescript
// Test encryption/decryption
const testData = '784-1984-1234567-1';
const encrypted = fieldEncryptionManager.encryptField(testData, 'emirates_id');
const decrypted = fieldEncryptionManager.decryptField(encrypted, 'emirates_id');
console.log(decrypted === testData); // Should be true

// Test anonymization
const anonymized = fieldEncryptionManager.anonymizeField(testData, 'emirates_id');
console.log(anonymized.anonymized); // Should be 'ANON_xxxxxxxx'
```

## 📚 Documentation

- **Full Documentation**: `./security/README.md`
- **API Reference**: `./security/README.md#api-reference`
- **Examples**: `./security/examples.ts`
- **Test Suite**: `./security/security.test.ts`

## 🆘 Troubleshooting

### Encryption Fails
```typescript
// Check field type configuration
const config = fieldEncryptionManager.getFieldConfig('emirates_id');
if (!config) {
  console.error('Field type not configured');
}
```

### Key Access Issues
```typescript
// Check key status
const key = cryptoKeyManager['keys'].get(keyId);
if (key?.status !== 'active') {
  console.error(`Key status: ${key?.status}`);
}
```

### Performance Issues
```typescript
// Use batch processing for large datasets
const batch = data.slice(0, 100);
await Promise.all(batch.map(item => processItem(item)));
```

## 📞 Support

1. **Check the README.md** for detailed documentation
2. **Review audit logs** for error details
3. **Run security tests** to identify issues
4. **Validate configuration** with provided utilities
5. **Check compliance** requirements for your use case

---

**Security is not a feature, it's a foundation. 🔐**
