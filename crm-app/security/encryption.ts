/**
 * Core Encryption Utilities
 * End-to-end encryption for sensitive data using AES-256-GCM
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { Readable } from 'stream';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  authTagLength: number;
  iterations: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyVersion: number;
  timestamp: number;
}

export interface CryptoKey {
  id: string;
  key: Buffer;
  version: number;
  created: Date;
  expires?: Date;
  purpose: string;
}

class EncryptionManager {
  private config: EncryptionConfig;
  private keys: Map<string, CryptoKey>;
  private currentKeyId: string;

  constructor() {
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32, // 256 bits
      ivLength: 12,  // 96 bits for GCM
      authTagLength: 16, // 128 bits
      iterations: 100000
    };
    this.keys = new Map();
    this.currentKeyId = 'default';
    this.initializeKeys();
  }

  private initializeKeys(): void {
    // Generate master encryption key (in production, this should come from HSM or key management service)
    const masterKey = randomBytes(this.config.keyLength);
    const cryptoKey: CryptoKey = {
      id: this.currentKeyId,
      key: masterKey,
      version: 1,
      created: new Date(),
      purpose: 'master'
    };
    this.keys.set(this.currentKeyId, cryptoKey);
  }

  /**
   * Generate a new encryption key for specific data types
   */
  generateKey(purpose: string): CryptoKey {
    const keyId = `${purpose}_${Date.now()}`;
    const key = randomBytes(this.config.keyLength);
    
    const cryptoKey: CryptoKey = {
      id: keyId,
      key,
      version: this.keys.size + 1,
      created: new Date(),
      purpose
    };
    
    this.keys.set(keyId, cryptoKey);
    return cryptoKey;
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(plaintext: string, keyId?: string, purpose?: string): EncryptedData {
    try {
      const key = this.getEncryptionKey(keyId, purpose);
      const iv = randomBytes(this.config.ivLength);
      
      const cipher = createCipheriv(this.config.algorithm, key, iv, {
        authTagLength: this.config.authTagLength
      });

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();

      return {
        data: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.config.algorithm,
        keyVersion: this.keys.get(keyId || this.currentKeyId)?.version || 1,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: EncryptedData): string {
    try {
      const key = this.getDecryptionKey(encryptedData.keyVersion);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      const encrypted = Buffer.from(encryptedData.data, 'hex');

      const decipher = createDecipheriv(encryptedData.algorithm, key, iv, {
        authTagLength: this.config.authTagLength
      });

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt buffer data (for file encryption)
   */
  encryptBuffer(buffer: Buffer, keyId?: string): EncryptedData {
    const key = this.getEncryptionKey(keyId);
    const iv = randomBytes(this.config.ivLength);
    
    const cipher = createCipheriv(this.config.algorithm, key, iv, {
      authTagLength: this.config.authTagLength
    });

    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();

    return {
      data: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: this.config.algorithm,
      keyVersion: this.keys.get(keyId || this.currentKeyId)?.version || 1,
      timestamp: Date.now()
    };
  }

  /**
   * Decrypt buffer data
   */
  decryptBuffer(encryptedData: EncryptedData): Buffer {
    const key = this.getDecryptionKey(encryptedData.keyVersion);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    const encrypted = Buffer.from(encryptedData.data, 'hex');

    const decipher = createDecipheriv(encryptedData.algorithm, key, iv, {
      authTagLength: this.config.authTagLength
    });

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted;
  }

  /**
   * Encrypt stream data
   */
  encryptStream(readable: Readable, keyId?: string): {
    encrypted: Readable;
    authTag: string;
    iv: string;
  } {
    const key = this.getEncryptionKey(keyId);
    const iv = randomBytes(this.config.ivLength);
    
    const cipher = createCipheriv(this.config.algorithm, key, iv, {
      authTagLength: this.config.authTagLength
    });

    const encrypted = readable.pipe(cipher);
    
    return {
      encrypted,
      authTag: cipher.getAuthTag().toString('hex'),
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt stream data
   */
  decryptStream(readable: Readable, encryptedData: EncryptedData): Readable {
    const key = this.getDecryptionKey(encryptedData.keyVersion);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');

    const decipher = createDecipheriv(encryptedData.algorithm, key, iv, {
      authTagLength: this.config.authTagLength
    });

    decipher.setAuthTag(authTag);

    return readable.pipe(decipher);
  }

  /**
   * Generate a hash for data integrity verification
   */
  generateHash(data: string | Buffer): string {
    const hash = createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  /**
   * Verify data integrity using hash
   */
  verifyHash(data: string | Buffer, expectedHash: string): boolean {
    const actualHash = this.generateHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Derive key from password using PBKDF2
   */
  deriveKeyFromPassword(password: string, salt: Buffer): Buffer {
    const { pbkdf2Sync } = require('crypto');
    return pbkdf2Sync(password, salt, this.config.iterations, this.config.keyLength, 'sha256');
  }

  private getEncryptionKey(keyId?: string, purpose?: string): Buffer {
    const id = keyId || this.currentKeyId;
    let key = this.keys.get(id);
    
    if (!key && purpose) {
      // Generate key for specific purpose
      key = this.generateKey(purpose);
    }
    
    if (!key) {
      throw new Error(`Encryption key not found: ${id}`);
    }
    
    return key.key;
  }

  private getDecryptionKey(version: number): Buffer {
    for (const key of this.keys.values()) {
      if (key.version === version) {
        return key.key;
      }
    }
    throw new Error(`Decryption key not found for version: ${version}`);
  }

  /**
   * Rotate encryption keys (key versioning)
   */
  rotateKeys(): void {
    const newKeyId = `rotated_${Date.now()}`;
    const newKey = this.generateKey('rotated');
    this.currentKeyId = newKey.id;
    
    // In production, this would trigger background re-encryption of all data
    console.log(`Encryption keys rotated. New key ID: ${newKeyId}`);
  }

  /**
   * Get key information for audit purposes
   */
  getKeyInfo(keyId: string): CryptoKey | null {
    return this.keys.get(keyId) || null;
  }

  /**
   * List all active keys
   */
  listActiveKeys(): CryptoKey[] {
    return Array.from(this.keys.values());
  }
}

// Singleton instance
export const encryptionManager = new EncryptionManager();

/**
 * Utility functions for common encryption tasks
 */
export const encryptionUtils = {
  /**
   * Encrypt a string and return as base64 encoded
   */
  encryptToBase64: (plaintext: string, keyId?: string): string => {
    const encrypted = encryptionManager.encrypt(plaintext, keyId);
    return Buffer.from(JSON.stringify(encrypted)).toString('base64');
  },

  /**
   * Decrypt from base64 encoded string
   */
  decryptFromBase64: (base64Data: string): string => {
    const encryptedData: EncryptedData = JSON.parse(
      Buffer.from(base64Data, 'base64').toString('utf8')
    );
    return encryptionManager.decrypt(encryptedData);
  },

  /**
   * Check if data appears to be encrypted
   */
  isEncrypted: (data: any): boolean => {
    if (typeof data !== 'string') return false;
    try {
      // Check if it's base64 encoded encrypted data
      const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
      return decoded.algorithm && decoded.data && decoded.iv && decoded.authTag;
    } catch {
      return false;
    }
  }
};
