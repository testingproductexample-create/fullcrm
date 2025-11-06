/**
 * Security System Integration Examples
 * Demonstrates how to integrate the security system into the CRM application
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { 
  setupSecuritySystem,
  securitySystem,
  fieldEncryptionManager,
  secureFileUploadManager,
  dataAnonymizationManager,
  secureDeletionManager,
  setupEncryptionMiddleware,
  databaseEncryptionMiddleware,
  SensitiveDataType,
  AnonymizationRule,
  DeletionReason
} from './index';

/**
 * Example 1: Next.js API Route with Encryption Middleware
 */
export const customerApiHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    // req.body is automatically encrypted by middleware
    const customerData = req.body;
    
    // Process customer data (already encrypted)
    const result = await createCustomer(customerData);
    
    // res.json will automatically decrypt the response
    return res.status(201).json(result);
  }
  
  if (req.method === 'GET') {
    // Get customer data (automatically decrypted)
    const customer = await getCustomer(req.query.id as string);
    return res.status(200).json(customer);
  }
  
  if (req.method === 'DELETE') {
    // Request secure deletion
    const deletionRequest = await secureDeletionManager.createDeletionRequest(
      'customer',
      req.query.id as string,
      'data_subject_request',
      req.headers['x-user-id'] as string || 'unknown',
      req.headers['x-org-id'] as string || 'default',
      'high'
    );
    
    return res.status(202).json({ 
      message: 'Deletion request created', 
      requestId: deletionRequest.id 
    });
  }
};

/**
 * Example 2: Employee Data with Salary Encryption
 */
export const employeeApiHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  
  switch (method) {
    case 'POST': {
      const employeeData = req.body;
      
      // Manual field encryption for additional control
      const encryptedEmployee = {
        ...employeeData,
        emirates_id: fieldEncryptionManager.encryptField(employeeData.emirates_id, 'emirates_id'),
        salary: fieldEncryptionManager.encryptField(employeeData.salary, 'salary'),
        bank_account: fieldEncryptionManager.encryptField(employeeData.bank_account, 'bank_account'),
        phone: fieldEncryptionManager.encryptField(employeeData.phone, 'phone'),
        email: fieldEncryptionManager.encryptField(employeeData.email, 'email')
      };
      
      // Store in database
      const employee = await createEmployee(encryptedEmployee);
      
      return res.status(201).json({
        id: employee.id,
        name: employee.name,
        // Salary will be decrypted by middleware or manually
        salary: '[ENCRYPTED]',
        status: 'created'
      });
    }
    
    case 'GET': {
      const employee = await getEmployee(req.query.id as string);
      
      // Mask sensitive data for listing
      const maskedEmployee = {
        ...employee,
        salary: fieldEncryptionManager.maskField(employee.salary, 'salary'),
        emirates_id: fieldEncryptionManager.maskField(employee.emirates_id, 'emirates_id'),
        phone: fieldEncryptionManager.maskField(employee.phone, 'phone')
      };
      
      return res.status(200).json(maskedEmployee);
    }
    
    case 'PUT': {
      const updateData = req.body;
      const employee = await updateEmployee(req.query.id as string, updateData);
      
      return res.status(200).json(employee);
    }
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

/**
 * Example 3: File Upload with Security
 */
export const fileUploadHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { file, metadata } = req.body;
    
    // Validate file upload
    const validation = await secureFileUploadManager.validateFile(
      Buffer.from(file.data, 'base64'),
      file.name,
      file.type
    );
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'File validation failed', 
        details: validation.errors 
      });
    }
    
    // Upload with encryption
    const fileInfo = await secureFileUploadManager.uploadFile(
      Buffer.from(file.data, 'base64'),
      file.name,
      metadata.uploader,
      metadata.purpose,
      metadata.classification || 'confidential'
    );
    
    return res.status(201).json({
      fileId: fileInfo.uploadId,
      originalName: fileInfo.originalName,
      encrypted: fileInfo.encrypted,
      size: fileInfo.size,
      uploadedAt: fileInfo.uploadedAt
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'File upload failed', 
      message: error.message 
    });
  }
};

/**
 * Example 4: Data Anonymization for Analytics
 */
export const analyticsDataHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { dataType, anonymizationRules } = req.body;
    
    // Get raw data (in production, this would come from database)
    const rawData = await getRawDataForAnalytics(dataType);
    
    // Apply anonymization rules
    const anonymizedData = await dataAnonymizationManager.batchAnonymize(
      rawData,
      dataType,
      anonymizationRules,
      {
        method: 'k_anonymity',
        reversible: true,
        preserveDataUtility: true
      }
    );
    
    return res.status(200).json({
      originalCount: rawData.length,
      anonymizedCount: anonymizedData.length,
      data: anonymizedData.map(d => d.anonymizedData),
      metadata: anonymizedData[0]?.metadata
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Anonymization failed', 
      message: error.message 
    });
  }
};

/**
 * Example 5: Customer Measurement Data Protection
 */
export const measurementHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  
  switch (method) {
    case 'POST': {
      const measurementData = req.body;
      
      // Encrypt measurement data
      const measurementFields = [
        'height', 'weight', 'chest', 'waist', 'hips',
        'shoulder_width', 'arm_length', 'leg_length', 'neck', 'sleeve'
      ];
      
      const encryptedMeasurements: any = {};
      for (const field of measurementFields) {
        if (measurementData[field] !== undefined) {
          encryptedMeasurements[field] = fieldEncryptionManager.encryptField(
            measurementData[field], 
            'body_measurements'
          );
        }
      }
      
      // Store encrypted measurements
      const result = await storeMeasurements({
        customerId: measurementData.customerId,
        measurements: encryptedMeasurements,
        takenBy: measurementData.takenBy,
        date: new Date()
      });
      
      return res.status(201).json({
        measurementId: result.id,
        customerId: result.customerId,
        encrypted: true,
        createdAt: result.createdAt
      });
    }
    
    case 'GET': {
      const customerId = req.query.customerId as string;
      const measurements = await getCustomerMeasurements(customerId);
      
      // Decrypt for display
      const decryptedMeasurements = measurements.map(m => {
        const decrypted: any = { ...m };
        const measurementFields = [
          'height', 'weight', 'chest', 'waist', 'hips',
          'shoulder_width', 'arm_length', 'leg_length', 'neck', 'sleeve'
        ];
        
        for (const field of measurementFields) {
          if (m[field] && m[field].encrypted) {
            decrypted[field] = fieldEncryptionManager.decryptField(m[field], 'body_measurements');
          }
        }
        
        return decrypted;
      });
      
      return res.status(200).json(decryptedMeasurements);
    }
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

/**
 * Example 6: Database Integration with Middleware
 */
export const databaseService = {
  /**
   * Insert customer with automatic encryption
   */
  async insertCustomer(customerData: any) {
    const dbMiddleware = databaseEncryptionMiddleware('insert');
    const securityContext = {
      userId: 'system',
      organizationId: 'default',
      sessionId: 'db_service',
      permissions: ['write'],
      riskLevel: 'low' as const,
      ipAddress: '127.0.0.1',
      userAgent: 'db_service',
      timestamp: new Date()
    };
    
    // Middleware automatically encrypts sensitive fields
    const encryptedData = dbMiddleware.before(customerData, securityContext);
    
    // Insert into database
    const result = await this.executeQuery(
      'INSERT INTO customers (name, emirates_id, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [
        encryptedData.name,
        encryptedData.emirates_id,
        encryptedData.phone,
        encryptedData.email,
        encryptedData.address
      ]
    );
    
    return dbMiddleware.after(result, securityContext);
  },
  
  /**
   * Get customer with automatic decryption
   */
  async getCustomer(id: string) {
    const dbMiddleware = databaseEncryptionMiddleware('select');
    const securityContext = {
      userId: 'api_service',
      organizationId: 'default',
      sessionId: 'db_service',
      permissions: ['read'],
      riskLevel: 'medium' as const,
      ipAddress: '127.0.0.1',
      userAgent: 'api_service',
      timestamp: new Date()
    };
    
    // Get from database
    const rawResult = await this.executeQuery(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    
    // Middleware automatically decrypts sensitive fields
    return dbMiddleware.after(rawResult, securityContext);
  },
  
  /**
   * Update customer with encryption
   */
  async updateCustomer(id: string, updateData: any) {
    const dbMiddleware = databaseEncryptionMiddleware('update');
    const securityContext = {
      userId: 'api_service',
      organizationId: 'default',
      sessionId: 'db_service',
      permissions: ['write'],
      riskLevel: 'medium' as const,
      ipAddress: '127.0.0.1',
      userAgent: 'api_service',
      timestamp: new Date()
    };
    
    // Middleware encrypts update data
    const encryptedData = dbMiddleware.before(updateData, securityContext);
    
    const result = await this.executeQuery(
      'UPDATE customers SET name = ?, emirates_id = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [
        encryptedData.name,
        encryptedData.emirates_id,
        encryptedData.phone,
        encryptedData.email,
        encryptedData.address,
        id
      ]
    );
    
    return dbMiddleware.after(result, securityContext);
  },
  
  /**
   * Execute database query (mock implementation)
   */
  async executeQuery(query: string, params: any[]): Promise<any> {
    // In production, this would use actual database connection
    console.log('Executing query:', query, params);
    return { success: true, id: 'mock_id' };
  }
};

/**
 * Example 7: Compliance and Audit Integration
 */
export const complianceService = {
  /**
   * Log audit event
   */
  async logAuditEvent(event: {
    action: string;
    resource: string;
    resourceId: string;
    userId: string;
    success: boolean;
    details?: string;
  }) {
    // This would integrate with your existing audit system
    console.log('Audit event:', {
      timestamp: new Date().toISOString(),
      ...event
    });
    
    // Could also store in database or send to SIEM
    // await auditDatabase.insert(event);
  },
  
  /**
   * Generate compliance report
   */
  async generateComplianceReport(framework: 'UAE_PDPL' | 'CSA' | 'ISO27001') {
    const report = {
      framework,
      generatedAt: new Date(),
      status: 'compliant',
      findings: [],
      recommendations: [],
      metrics: {
        encryptedFields: Object.keys(fieldEncryptionManager['fieldConfigs']).length,
        activeKeys: securitySystem.getStatus().statistics.activeKeys,
        auditEntries: securitySystem.getStatus().statistics.auditEntries
      }
    };
    
    return report;
  },
  
  /**
   * Handle data subject request (PDPL Article 13)
   */
  async handleDataSubjectRequest(request: {
    subjectId: string;
    requestType: 'access' | 'rectification' | 'erasure' | 'portability';
    details?: string;
  }) {
    switch (request.requestType) {
      case 'access':
        return await this.exportCustomerData(request.subjectId);
      case 'rectification':
        return await this.rectifyCustomerData(request.subjectId, request.details);
      case 'erasure':
        return await this.initiateDataDeletion(request.subjectId);
      case 'portability':
        return await this.exportPortableData(request.subjectId);
      default:
        throw new Error('Unsupported request type');
    }
  }
};

/**
 * Example 8: Batch Processing with Security
 */
export const batchProcessingService = {
  /**
   * Process batch customer data with security
   */
  async processCustomerBatch(customers: any[]) {
    const results = [];
    const errors = [];
    
    // Process in chunks to avoid overwhelming the system
    const chunkSize = 100;
    for (let i = 0; i < customers.length; i += chunkSize) {
      const chunk = customers.slice(i, i + chunkSize);
      
      const chunkPromises = chunk.map(async (customer) => {
        try {
          // Anonymize for batch processing if needed
          const anonymizedCustomer = await dataAnonymizationManager.anonymizeCustomerData(
            customer,
            [
              {
                field: 'emirates_id',
                type: 'emirates_id' as SensitiveDataType,
                method: 'pseudonymization',
                parameters: { format: 'CUST_{hash}' }
              }
            ]
          );
          
          // Process the anonymized data
          const result = await this.processAnonymizedCustomer(anonymizedCustomer.anonymizedData);
          
          return { success: true, result, originalId: customer.id };
        } catch (error) {
          return { success: false, error: error.message, originalId: customer.id };
        }
      });
      
      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value);
          } else {
            errors.push(result.value);
          }
        } else {
          errors.push({ success: false, error: result.reason, originalId: 'unknown' });
        }
      });
    }
    
    return { results, errors, totalProcessed: results.length, totalErrors: errors.length };
  },
  
  /**
   * Process anonymized customer data
   */
  async processAnonymizedCustomer(customerData: any) {
    // Business logic here using anonymized data
    console.log('Processing anonymized customer:', customerData.id);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { processed: true, customerId: customerData.id };
  }
};

/**
 * Example 9: Security Health Check
 */
export const securityHealthCheck = async () => {
  const status = securitySystem.getStatus();
  const health = status.health;
  
  const issues = [];
  const recommendations = [];
  
  // Check key health
  if (health.keys !== 'healthy') {
    issues.push('Key management issues detected');
    recommendations.push('Review and rotate expiring keys');
  }
  
  // Check backup status
  if (health.backup !== 'healthy') {
    issues.push('Backup configuration issues');
    recommendations.push('Verify key backup procedures');
  }
  
  // Check compliance
  if (health.compliance !== 'healthy') {
    issues.push('Compliance monitoring issues');
    recommendations.push('Review compliance configuration');
  }
  
  return {
    healthy: issues.length === 0,
    status,
    issues,
    recommendations,
    timestamp: new Date()
  };
};

// Mock functions for examples
async function createCustomer(data: any) { 
  return { id: '1', ...data }; 
}
async function getCustomer(id: string) { 
  return { id, name: 'John Doe', emirates_id: '784-1984-1234567-1' }; 
}
async function createEmployee(data: any) { 
  return { id: '1', ...data }; 
}
async function getEmployee(id: string) { 
  return { id, name: 'Jane Doe', salary: 50000 }; 
}
async function createEmployee(data: any) { 
  return { id: '1', ...data }; 
}
async function updateEmployee(id: string, data: any) { 
  return { id, ...data }; 
}
async function storeMeasurements(data: any) { 
  return { id: '1', ...data }; 
}
async function getCustomerMeasurements(customerId: string) { 
  return [{ id: '1', customerId, height: 180, weight: 75 }]; 
}
async function getRawDataForAnalytics(dataType: string) { 
  return [
    { id: '1', name: 'Customer 1', emirates_id: '784-1984-1234567-1', age: 30 },
    { id: '2', name: 'Customer 2', emirates_id: '784-1984-1234567-2', age: 25 }
  ]; 
}
async function exportCustomerData(subjectId: string) { 
  return { subjectId, data: 'exported_data' }; 
}
async function rectifyCustomerData(subjectId: string, details: string) { 
  return { subjectId, rectified: true, details }; 
}
async function initiateDataDeletion(subjectId: string) { 
  return await secureDeletionManager.createDeletionRequest(
    'customer', subjectId, 'data_subject_request', 'system', 'default', 'high'
  ); 
}
async function exportPortableData(subjectId: string) { 
  return { subjectId, portableData: 'portable_format' }; 
}
