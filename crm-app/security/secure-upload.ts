/**
 * Secure File Upload System
 * End-to-end encrypted file handling with validation
 */

import { Readable, Writable } from 'stream';
import { promises as fs } from 'fs';
import * as path from 'path';
import { encryptionManager, EncryptedData } from './encryption';
import { fileTypeFromBuffer } from 'file-type';

export interface FileUploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  encryptionRequired: boolean;
  quarantinePeriod: number; // Days to keep in quarantine
  virusScan: boolean;
  anonymizeMetadata: boolean;
}

export interface SecureFileInfo {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  encrypted: boolean;
  encryptedData?: EncryptedData;
  checksum: string;
  uploadId: string;
  uploadedAt: Date;
  isQuarantined: boolean;
  metadata: {
    uploader: string;
    purpose: string;
    classification: string;
    retention: number;
  };
}

export interface UploadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  quarantineRequired: boolean;
}

class SecureFileUploadManager {
  private uploadConfig: FileUploadConfig;
  private quarantineDir: string;
  private uploadDir: string;
  private maxConcurrentUploads = 10;
  private activeUploads = new Map<string, UploadSession>();
  private virusScanner: VirusScanner | null = null;

  constructor() {
    this.uploadConfig = {
      maxFileSize: 50 * 1024 * 1024, // 50MB default
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      encryptionRequired: true,
      quarantinePeriod: 7, // 7 days
      virusScan: true,
      anonymizeMetadata: true
    };
    this.quarantineDir = path.join(process.cwd(), 'storage', 'quarantine');
    this.uploadDir = path.join(process.cwd(), 'storage', 'secure');
  }

  /**
   * Initialize secure upload directories
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.quarantineDir, { recursive: true });
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  /**
   * Set virus scanner
   */
  setVirusScanner(scanner: VirusScanner): void {
    this.virusScanner = scanner;
  }

  /**
   * Validate file before upload
   */
  async validateFile(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let quarantineRequired = false;

    // File size validation
    if (buffer.length > this.uploadConfig.maxFileSize) {
      errors.push(`File size ${buffer.length} exceeds maximum ${this.uploadConfig.maxFileSize} bytes`);
    }

    // File type validation
    const detectedMimeType = await this.detectMimeType(buffer);
    if (detectedMimeType !== mimeType) {
      warnings.push(`MIME type mismatch: declared ${mimeType}, detected ${detectedMimeType}`);
    }

    if (!this.uploadConfig.allowedTypes.includes(detectedMimeType)) {
      errors.push(`File type ${detectedMimeType} is not allowed`);
    }

    // Extension validation
    const extension = path.extname(fileName).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.txt', '.csv', '.xls', '.xlsx'];
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed`);
    }

    // File name validation (prevent path traversal)
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      errors.push('Invalid file name: contains path traversal characters');
    }

    // Basic file header validation
    if (buffer.length < 4) {
      errors.push('File too small to be valid');
    }

    // Suspicious file patterns
    if (this.containsSuspiciousContent(fileName, buffer)) {
      warnings.push('File may contain suspicious content');
      quarantineRequired = true;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      quarantineRequired
    };
  }

  /**
   * Upload file securely
   */
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    uploader: string,
    purpose: string,
    classification: string = 'internal'
  ): Promise<SecureFileInfo> {
    // Validate file
    const validation = await this.validateFile(buffer, fileName, '');
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Detect actual MIME type
    const detectedMimeType = await this.detectMimeType(buffer);
    
    // Generate secure file name
    const uploadId = this.generateUploadId();
    const secureFileName = this.generateSecureFileName(fileName, uploadId);
    
    // Calculate checksum for integrity
    const checksum = encryptionManager.generateHash(buffer);
    
    // Encrypt file if required
    let encryptedData: EncryptedData | undefined;
    let finalBuffer = buffer;
    
    if (this.uploadConfig.encryptionRequired) {
      encryptedData = encryptionManager.encryptBuffer(buffer);
      // Store encrypted version
      finalBuffer = Buffer.from(JSON.stringify(encryptedData), 'utf8');
    }

    // Virus scan if enabled
    if (this.uploadConfig.virusScan && this.virusScanner) {
      const scanResult = await this.virusScanner.scan(buffer);
      if (!scanResult.isClean) {
        throw new Error(`File contains virus: ${scanResult.threatName}`);
      }
    }

    // Anonymize metadata if required
    const processedBuffer = this.uploadConfig.anonymizeMetadata 
      ? await this.anonymizeMetadata(buffer, detectedMimeType)
      : buffer;

    // Determine storage location
    const storageLocation = validation.quarantineRequired 
      ? path.join(this.quarantineDir, secureFileName)
      : path.join(this.uploadDir, secureFileName);

    // Write file
    await fs.writeFile(storageLocation, finalBuffer);

    // Create file info
    const fileInfo: SecureFileInfo = {
      originalName: fileName,
      fileName: secureFileName,
      mimeType: detectedMimeType,
      size: buffer.length,
      encrypted: !!encryptedData,
      encryptedData,
      checksum,
      uploadId,
      uploadedAt: new Date(),
      isQuarantined: validation.quarantineRequired,
      metadata: {
        uploader,
        purpose,
        classification,
        retention: this.calculateRetentionPeriod(classification)
      }
    };

    return fileInfo;
  }

  /**
   * Download and decrypt file
   */
  async downloadFile(
    fileName: string,
    purpose: string,
    classification: string
  ): Promise<{ buffer: Buffer; fileInfo: SecureFileInfo }> {
    const filePath = path.join(this.uploadDir, fileName);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      throw new Error('File not found');
    }

    // Read file
    const encryptedDataStr = await fs.readFile(filePath, 'utf8');
    const encryptedData: EncryptedData = JSON.parse(encryptedDataStr);

    // Decrypt file
    const decryptedBuffer = encryptionManager.decryptBuffer(encryptedData);
    
    // Create file info (in production, this would come from database)
    const fileInfo: SecureFileInfo = {
      originalName: encryptedDataStr, // This would be stored separately in production
      fileName,
      mimeType: 'application/octet-stream',
      size: decryptedBuffer.length,
      encrypted: true,
      encryptedData,
      checksum: '',
      uploadId: '',
      uploadedAt: new Date(),
      isQuarantined: false,
      metadata: {
        uploader: 'system',
        purpose,
        classification,
        retention: 2557
      }
    };

    return {
      buffer: decryptedBuffer,
      fileInfo
    };
  }

  /**
   * Stream file upload
   */
  async uploadFileStream(
    readStream: Readable,
    fileName: string,
    uploader: string,
    purpose: string
  ): Promise<SecureFileInfo> {
    const uploadId = this.generateUploadId();
    const secureFileName = this.generateSecureFileName(fileName, uploadId);
    const tempFilePath = path.join(this.uploadDir, `${uploadId}_temp`);

    // Create write stream
    const writeStream = fs.createWriteStream(tempFilePath);
    const chunks: Buffer[] = [];

    // Process stream
    const streamPromise = new Promise<Buffer>((resolve, reject) => {
      readStream.on('data', (chunk) => chunks.push(chunk));
      readStream.on('end', () => resolve(Buffer.concat(chunks)));
      readStream.on('error', reject);
    });

    // Write to temp file
    readStream.pipe(writeStream);
    const buffer = await streamPromise;

    // Validate and process
    const fileInfo = await this.uploadFile(buffer, fileName, uploader, purpose);
    
    // Clean up temp file
    await fs.unlink(tempFilePath).catch(() => {});

    return fileInfo;
  }

  /**
   * Batch upload multiple files
   */
  async batchUpload(
    files: Array<{
      buffer: Buffer;
      fileName: string;
      uploader: string;
      purpose: string;
    }>,
    classification: string = 'internal'
  ): Promise<SecureFileInfo[]> {
    const results: SecureFileInfo[] = [];
    
    // Process in chunks to avoid overwhelming the system
    for (let i = 0; i < files.length; i += this.maxConcurrentUploads) {
      const batch = files.slice(i, i + this.maxConcurrentUploads);
      const batchPromises = batch.map(file => 
        this.uploadFile(file.buffer, file.fileName, file.uploader, file.purpose, classification)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to upload file ${files[i + index].fileName}:`, result.reason);
        }
      });
    }
    
    return results;
  }

  /**
   * Delete file securely (secure deletion)
   */
  async secureDelete(fileName: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      
      // Read file content
      const fileContent = await fs.readFile(filePath);
      
      // Overwrite with random data multiple times
      const fileSize = fileContent.length;
      for (let i = 0; i < 3; i++) {
        const randomData = encryptionManager.generateSecureToken(fileSize);
        await fs.writeFile(filePath, randomData);
      }
      
      // Overwrite with zeros
      await fs.writeFile(filePath, Buffer.alloc(fileSize, 0));
      
      // Delete file
      await fs.unlink(filePath);
      
      return true;
    } catch (error) {
      console.error('Secure delete failed:', error);
      return false;
    }
  }

  /**
   * Archive file for compliance
   */
  async archiveFile(fileName: string, reason: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileName);
    const archivePath = path.join(this.uploadDir, 'archive', `${Date.now()}_${fileName}`);
    
    await fs.mkdir(path.dirname(archivePath), { recursive: true });
    await fs.rename(filePath, archivePath);
    
    // Log archive action (in production, this would go to audit log)
    console.log(`File archived: ${fileName}, reason: ${reason}`);
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${encryptionManager.generateSecureToken(8)}`;
  }

  private generateSecureFileName(originalName: string, uploadId: string): string {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const hash = encryptionManager.generateHash(originalName + uploadId).substring(0, 16);
    return `encrypted_${timestamp}_${hash}${extension}`;
  }

  private async detectMimeType(buffer: Buffer): Promise<string> {
    try {
      const result = await fileTypeFromBuffer(buffer);
      return result?.mime || 'application/octet-stream';
    } catch {
      return 'application/octet-stream';
    }
  }

  private containsSuspiciousContent(fileName: string, buffer: Buffer): boolean {
    // Check for executable content
    if (buffer.slice(0, 2).toString('hex') === '4d5a') {
      return true; // Windows PE executable
    }
    
    if (buffer.slice(0, 4).toString('hex') === '7f454c46') {
      return true; // Linux ELF executable
    }

    // Check for suspicious file names
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const extension = path.extname(fileName).toLowerCase();
    if (suspiciousExtensions.includes(extension)) {
      return true;
    }

    return false;
  }

  private async anonymizeMetadata(buffer: Buffer, mimeType: string): Promise<Buffer> {
    // Basic metadata anonymization
    // In production, this would use specialized libraries like exiftool
    if (mimeType.startsWith('image/')) {
      // Remove EXIF data from images
      // This is a simplified implementation
      return buffer; // In production, remove EXIF data
    }
    
    return buffer;
  }

  private calculateRetentionPeriod(classification: string): number {
    // Map classifications to retention periods
    const retentionMap: Record<string, number> = {
      'public': 30,
      'internal': 2557, // 7 years
      'confidential': 2557, // 7 years
      'restricted': 3650, // 10 years
      'critical': 5475 // 15 years
    };
    
    return retentionMap[classification] || 2557;
  }
}

/**
 * Virus Scanner Interface
 */
export interface VirusScanner {
  scan(buffer: Buffer): Promise<{ isClean: boolean; threatName?: string }>;
}

/**
 * Simple Mock Virus Scanner
 */
export class MockVirusScanner implements VirusScanner {
  async scan(buffer: Buffer): Promise<{ isClean: boolean; threatName?: string }> {
    // Mock implementation - always returns clean
    // In production, integrate with ClamAV, VirusTotal, or similar service
    return { isClean: true };
  }
}

/**
 * Upload Session Management
 */
class UploadSession {
  public id: string;
  public startTime: Date;
  public buffer: Buffer[] = [];
  public size = 0;
  public validated = false;
  public errors: string[] = [];

  constructor(id: string) {
    this.id = id;
    this.startTime = new Date();
  }

  addChunk(chunk: Buffer): void {
    this.buffer.push(chunk);
    this.size += chunk.length;
  }

  finalize(): Buffer {
    return Buffer.concat(this.buffer);
  }

  getDuration(): number {
    return Date.now() - this.startTime.getTime();
  }
}

// Singleton instance
export const secureFileUploadManager = new SecureFileUploadManager();

/**
 * Upload middleware
 */
export const createSecureUploadMiddleware = (config?: Partial<FileUploadConfig>) => {
  if (config) {
    Object.assign(secureFileUploadManager, config);
  }
  
  return {
    upload: (buffer: Buffer, metadata: any) => 
      secureFileUploadManager.uploadFile(
        buffer,
        metadata.originalName,
        metadata.uploader,
        metadata.purpose
      )
  };
};
