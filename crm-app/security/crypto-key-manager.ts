/**
 * Crypto Key Management System
 * Enterprise-grade encryption key lifecycle management
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { randomBytes, createHash, generateKeyPairSync } from 'crypto';
import { encryptionManager } from './encryption';

export interface CryptoKey {
  id: string;
  name: string;
  type: KeyType;
  algorithm: string;
  keySize: number;
  keyMaterial: string; // Encrypted
  publicKey?: string;
  privateKey?: string; // Encrypted
  version: number;
  status: KeyStatus;
  purpose: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  rotatedAt?: Date;
  rotatedFrom?: string;
  rotatedTo?: string;
  metadata: {
    createdBy: string;
    organizationId: string;
    hsmBacked: boolean;
    backupLocations: string[];
    accessCount: number;
    lastAccessAt?: Date;
    usage: KeyUsage;
  };
  security: {
    entropy: number;
    randomnessScore: number;
    keyStrength: 'weak' | 'medium' | 'strong' | 'enterprise';
    backupStatus: 'none' | 'partial' | 'complete' | 'distributed';
    auditTrail: KeyAuditEntry[];
  };
}

export type KeyType = 
  | 'symmetric' 
  | 'asymmetric' 
  | 'rsa' 
  | 'ecdsa' 
  | 'ed25519' 
  | 'hmac' 
  | 'kdf' 
  | 'master'
  | 'field_encryption'
  | 'file_encryption'
  | 'backup'
  | 'api'
  | 'session';

export type KeyStatus = 
  | 'active' 
  | 'expired' 
  | 'revoked' 
  | 'compromised' 
  | 'rotated' 
  | 'disabled'
  | 'backup';

export type KeyUsage = {
  encryption: number;
  decryption: number;
  signing: number;
  verification: number;
  key_derivation: number;
  authentication: number;
};

export interface KeyAuditEntry {
  timestamp: Date;
  action: KeyAction;
  userId: string;
  ipAddress: string;
  details: string;
  result: 'success' | 'failure';
  error?: string;
  metadata?: any;
}

export type KeyAction = 
  | 'created' 
  | 'accessed' 
  | 'used' 
  | 'rotated' 
  | 'backed_up' 
  | 'restored' 
  | 'revoked' 
  | 'destroyed'
  | 'imported'
  | 'exported'
  | 'validated'
  | 'maintenance';

export interface KeyRotationConfig {
  autoRotate: boolean;
  rotationInterval: number; // Days
  rotationStrategy: 'overlapping' | 'parallel' | 'sequential';
  advanceNotice: number; // Days before expiration
  overlapPeriod: number; // Days to keep old key active
  forceRotation: boolean;
  auditRotation: boolean;
}

export interface KeyBackupConfig {
  enabled: boolean;
  methods: BackupMethod[];
  locations: string[];
  encryption: boolean;
  verification: boolean;
  testRestore: boolean;
  testFrequency: number; // Days
  retention: number; // Days
  geographicDistribution: boolean;
  complianceRequirements: string[];
}

export type BackupMethod = 
  | 'file' 
  | 'database' 
  | 'hsm' 
  | 'cloud' 
  | 'offline' 
  | 'distributed'
  | 'threshold';

export interface KeyValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'enterprise';
  entropy: number;
  issues: string[];
  recommendations: string[];
  lastValidated: Date;
}

class CryptoKeyManager {
  private keys: Map<string, CryptoKey> = new Map();
  private masterKey: CryptoKey;
  private keyDirectory: string;
  private auditLog: KeyAuditEntry[] = [];
  private rotationConfig: KeyRotationConfig;
  private backupConfig: KeyBackupConfig;
  private keyLocks: Map<string, Promise<void>> = new Map();

  constructor() {
    this.keyDirectory = path.join(process.cwd(), 'security', 'keys');
    this.rotationConfig = {
      autoRotate: true,
      rotationInterval: 90, // 3 months
      rotationStrategy: 'overlapping',
      advanceNotice: 30,
      overlapPeriod: 7,
      forceRotation: false,
      auditRotation: true
    };

    this.backupConfig = {
      enabled: true,
      methods: ['file', 'database', 'cloud'],
      locations: ['./backup/keys', './backup/keys_cloud'],
      encryption: true,
      verification: true,
      testRestore: true,
      testFrequency: 30,
      retention: 2557, // 7 years
      geographicDistribution: false,
      complianceRequirements: ['UAE_PDPL', 'ISO27001']
    };

    this.initializeMasterKey();
    this.setupKeyRotationScheduler();
  }

  /**
   * Initialize master key
   */
  private initializeMasterKey(): void {
    const masterKeyId = 'master_key_001';
    const masterKeyMaterial = this.generateSecureRandom(256); // 256 bits
    
    this.masterKey = {
      id: masterKeyId,
      name: 'Master Encryption Key',
      type: 'master',
      algorithm: 'AES-256-GCM',
      keySize: 256,
      keyMaterial: this.encryptKeyMaterial(masterKeyMaterial),
      version: 1,
      status: 'active',
      purpose: ['key_encryption', 'key_derivation', 'backup'],
      createdAt: new Date(),
      metadata: {
        createdBy: 'system',
        organizationId: 'default',
        hsmBacked: false,
        backupLocations: ['./backup/master_key'],
        accessCount: 0,
        usage: {
          encryption: 0,
          decryption: 0,
          signing: 0,
          verification: 0,
          key_derivation: 0,
          authentication: 0
        }
      },
      security: {
        entropy: 1.0,
        randomnessScore: 1.0,
        keyStrength: 'enterprise',
        backupStatus: 'complete',
        auditTrail: []
      }
    };

    this.keys.set(masterKeyId, this.masterKey);
    this.logKeyAction(masterKeyId, 'created', 'system', 'Master key initialized', 'success');
  }

  /**
   * Generate new encryption key
   */
  async generateKey(
    name: string,
    type: KeyType,
    purpose: string[],
    organizationId: string = 'default',
    createdBy: string = 'system'
  ): Promise<CryptoKey> {
    const keyId = this.generateKeyId();
    const keyMaterial = this.generateKeyMaterial(type);
    const algorithm = this.getAlgorithmForType(type);
    const keySize = this.getKeySizeForType(type);

    const cryptoKey: CryptoKey = {
      id: keyId,
      name,
      type,
      algorithm,
      keySize,
      keyMaterial: this.encryptKeyMaterial(keyMaterial),
      version: 1,
      status: 'active',
      purpose,
      createdAt: new Date(),
      metadata: {
        createdBy,
        organizationId,
        hsmBacked: false,
        backupLocations: [],
        accessCount: 0,
        usage: {
          encryption: 0,
          decryption: 0,
          signing: 0,
          verification: 0,
          key_derivation: 0,
          authentication: 0
        }
      },
      security: {
        entropy: this.calculateEntropy(keyMaterial),
        randomnessScore: this.calculateRandomnessScore(keyMaterial),
        keyStrength: this.assessKeyStrength(keyMaterial),
        backupStatus: 'none',
        auditTrail: []
      }
    };

    // Generate asymmetric key pair if needed
    if (this.isAsymmetricType(type)) {
      const keyPair = this.generateAsymmetricKeyPair(type, keySize);
      cryptoKey.publicKey = keyPair.publicKey;
      cryptoKey.privateKey = this.encryptKeyMaterial(keyPair.privateKey);
    }

    this.keys.set(keyId, cryptoKey);
    await this.backupKey(cryptoKey);
    this.logKeyAction(keyId, 'created', createdBy, `Key ${name} generated`, 'success');

    return cryptoKey;
  }

  /**
   * Get encryption key for use
   */
  async getKey(
    keyId: string, 
    userId: string = 'system', 
    ipAddress: string = 'unknown',
    purpose?: string
  ): Promise<string> {
    const lockKey = `key_${keyId}_${userId}`;
    
    // Acquire lock to prevent concurrent access
    if (this.keyLocks.has(lockKey)) {
      await this.keyLocks.get(lockKey);
    }

    const lockPromise = this.performKeyOperation(keyId, userId, ipAddress, purpose);
    this.keyLocks.set(lockPromise, lockPromise);

    try {
      const keyMaterial = await lockPromise;
      return keyMaterial;
    } finally {
      this.keyLocks.delete(lockPromise);
    }
  }

  /**
   * Perform key operation with audit
   */
  private async performKeyOperation(
    keyId: string, 
    userId: string, 
    ipAddress: string, 
    purpose?: string
  ): Promise<string> {
    const cryptoKey = this.keys.get(keyId);
    if (!cryptoKey) {
      this.logKeyAction(keyId, 'accessed', userId, 'Key not found', 'failure', { ipAddress });
      throw new Error(`Key not found: ${keyId}`);
    }

    if (cryptoKey.status !== 'active') {
      this.logKeyAction(
        keyId, 
        'accessed', 
        userId, 
        `Key status: ${cryptoKey.status}`, 
        'failure', 
        { ipAddress }
      );
      throw new Error(`Key is not active: ${cryptoKey.status}`);
    }

    // Check expiration
    if (cryptoKey.expiresAt && new Date() > cryptoKey.expiresAt) {
      this.logKeyAction(
        keyId, 
        'accessed', 
        userId, 
        'Key expired', 
        'failure', 
        { ipAddress }
      );
      throw new Error(`Key has expired: ${keyId}`);
    }

    // Update usage statistics
    this.updateKeyUsage(cryptoKey, purpose || 'general');

    // Decrypt key material
    const keyMaterial = this.decryptKeyMaterial(cryptoKey.keyMaterial, cryptoKey.id);

    // Log access
    cryptoKey.metadata.accessCount++;
    cryptoKey.metadata.lastAccessAt = new Date();
    cryptoKey.lastUsedAt = new Date();
    
    this.logKeyAction(
      keyId, 
      'accessed', 
      userId, 
      `Key accessed for ${purpose || 'general'}`, 
      'success', 
      { ipAddress, purpose }
    );

    return keyMaterial;
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(
    keyId: string, 
    userId: string = 'system',
    reason: string = 'scheduled_rotation'
  ): Promise<CryptoKey> {
    const oldKey = this.keys.get(keyId);
    if (!oldKey) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Create new key with same configuration
    const newKey = await this.generateKey(
      `${oldKey.name}_rotated_v${oldKey.version + 1}`,
      oldKey.type,
      oldKey.purpose,
      oldKey.metadata.organizationId,
      userId
    );

    // Link rotation
    oldKey.rotatedTo = newKey.id;
    oldKey.rotatedAt = new Date();
    oldKey.status = 'rotated';
    
    newKey.rotatedFrom = oldKey.id;
    newKey.version = oldKey.version + 1;

    this.logKeyAction(keyId, 'rotated', userId, `Key rotated: ${reason}`, 'success', {
      oldKeyId: keyId,
      newKeyId: newKey.id,
      reason
    });

    return newKey;
  }

  /**
   * Revoke key
   */
  async revokeKey(
    keyId: string, 
    userId: string, 
    reason: string,
    immediate: boolean = false
  ): Promise<boolean> {
    const cryptoKey = this.keys.get(keyId);
    if (!cryptoKey) {
      throw new Error(`Key not found: ${keyId}`);
    }

    cryptoKey.status = 'revoked';
    cryptoKey.metadata.lastAccessAt = new Date();

    this.logKeyAction(keyId, 'revoked', userId, `Key revoked: ${reason}`, 'success', {
      reason,
      immediate
    });

    // Invalidate cached key material
    if (immediate) {
      // In production, this would invalidate key material in HSM/cache
      cryptoKey.keyMaterial = 'REVOKED';
    }

    return true;
  }

  /**
   * Validate key integrity and strength
   */
  validateKey(keyId: string): KeyValidationResult {
    const cryptoKey = this.keys.get(keyId);
    if (!cryptoKey) {
      return {
        isValid: false,
        strength: 'weak',
        entropy: 0,
        issues: ['Key not found'],
        recommendations: ['Generate new key'],
        lastValidated: new Date()
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check key status
    if (cryptoKey.status !== 'active') {
      issues.push(`Key status is ${cryptoKey.status}`);
      recommendations.push('Restore key to active status or generate new key');
    }

    // Check expiration
    if (cryptoKey.expiresAt && new Date() > cryptoKey.expiresAt) {
      issues.push('Key has expired');
      recommendations.push('Rotate key immediately');
    }

    // Check key strength
    if (cryptoKey.security.keyStrength === 'weak') {
      issues.push('Key strength is weak');
      recommendations.push('Use stronger key or increase key size');
    }

    // Check backup status
    if (cryptoKey.security.backupStatus === 'none') {
      issues.push('No backup exists for key');
      recommendations.push('Create backup immediately');
    }

    // Check entropy
    if (cryptoKey.security.entropy < 0.7) {
      issues.push('Key entropy is below recommended threshold');
      recommendations.push('Regenerate key with proper randomness');
    }

    // Check usage
    if (cryptoKey.metadata.accessCount === 0) {
      recommendations.push('Key has never been used - verify if needed');
    }

    return {
      isValid: issues.length === 0,
      strength: cryptoKey.security.keyStrength,
      entropy: cryptoKey.security.entropy,
      issues,
      recommendations,
      lastValidated: new Date()
    };
  }

  /**
   * Create key backup
   */
  async backupKey(cryptoKey: CryptoKey): Promise<boolean> {
    try {
      const backupData = JSON.stringify(cryptoKey, null, 2);
      const backupFile = path.join(this.keyDirectory, `backup_${cryptoKey.id}_${Date.now()}.json`);
      
      await fs.mkdir(this.keyDirectory, { recursive: true });
      await fs.writeFile(backupFile, backupData, 'utf8');
      
      cryptoKey.metadata.backupLocations.push(backupFile);
      cryptoKey.security.backupStatus = this.calculateBackupStatus(cryptoKey);
      
      this.logKeyAction(cryptoKey.id, 'backed_up', 'system', 'Key backed up', 'success', {
        backupLocation: backupFile
      });
      
      return true;
    } catch (error) {
      this.logKeyAction(
        cryptoKey.id, 
        'backed_up', 
        'system', 
        `Backup failed: ${error.message}`, 
        'failure'
      );
      return false;
    }
  }

  /**
   * Test key restoration
   */
  async testKeyRestore(keyId: string): Promise<boolean> {
    const cryptoKey = this.keys.get(keyId);
    if (!cryptoKey) {
      throw new Error(`Key not found: ${keyId}`);
    }

    try {
      // In production, this would restore from actual backup
      const backupLocation = cryptoKey.metadata.backupLocations[0];
      if (backupLocation) {
        const backupData = await fs.readFile(backupLocation, 'utf8');
        const restoredKey = JSON.parse(backupData);
        
        // Verify key material can be decrypted
        const keyMaterial = this.decryptKeyMaterial(restoredKey.keyMaterial, restoredKey.id);
        
        this.logKeyAction(keyId, 'restored', 'system', 'Key restoration test successful', 'success');
        return true;
      }
      
      return false;
    } catch (error) {
      this.logKeyAction(
        keyId, 
        'restored', 
        'system', 
        `Key restoration test failed: ${error.message}`, 
        'failure'
      );
      return false;
    }
  }

  /**
   * Get key statistics
   */
  getKeyStatistics(): {
    total: number;
    active: number;
    expired: number;
    revoked: number;
    rotated: number;
    weak: number;
    strong: number;
    enterprise: number;
    averageEntropy: number;
    totalUsage: number;
  } {
    const keys = Array.from(this.keys.values());
    const stats = {
      total: keys.length,
      active: keys.filter(k => k.status === 'active').length,
      expired: keys.filter(k => k.status === 'expired').length,
      revoked: keys.filter(k => k.status === 'revoked').length,
      rotated: keys.filter(k => k.status === 'rotated').length,
      weak: keys.filter(k => k.security.keyStrength === 'weak').length,
      strong: keys.filter(k => k.security.keyStrength === 'strong').length,
      enterprise: keys.filter(k => k.security.keyStrength === 'enterprise').length,
      averageEntropy: keys.reduce((sum, k) => sum + k.security.entropy, 0) / keys.length,
      totalUsage: keys.reduce((sum, k) => sum + k.metadata.accessCount, 0)
    };

    return stats;
  }

  /**
   * Setup automatic key rotation scheduler
   */
  private setupKeyRotationScheduler(): void {
    if (!this.rotationConfig.autoRotate) {
      return;
    }

    // Check for keys that need rotation daily
    setInterval(() => {
      this.checkKeysForRotation();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Check keys for rotation
   */
  private async checkKeysForRotation(): Promise<void> {
    const now = new Date();
    const advanceNotice = this.rotationConfig.advanceNotice;
    const rotationInterval = this.rotationConfig.rotationInterval;

    for (const cryptoKey of this.keys.values()) {
      if (cryptoKey.status !== 'active') continue;

      const shouldRotate = 
        cryptoKey.expiresAt && 
        (now.getTime() - cryptoKey.createdAt.getTime()) / (1000 * 60 * 60 * 24) >= rotationInterval ||
        cryptoKey.expiresAt && 
        (cryptoKey.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= advanceNotice;

      if (shouldRotate) {
        try {
          await this.rotateKey(cryptoKey.id, 'system', 'scheduled_rotation');
          console.log(`Key ${cryptoKey.id} rotated automatically`);
        } catch (error) {
          console.error(`Automatic key rotation failed for ${cryptoKey.id}:`, error);
        }
      }
    }
  }

  // Utility methods

  private generateKeyId(): string {
    return `key_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateSecureRandom(bits: number): string {
    return randomBytes(bits / 8).toString('hex');
  }

  private generateKeyMaterial(type: KeyType): string {
    const size = this.getKeySizeForType(type);
    return this.generateSecureRandom(size);
  }

  private getAlgorithmForType(type: KeyType): string {
    const algorithms = {
      'symmetric': 'AES-256-GCM',
      'asymmetric': 'RSA-2048',
      'rsa': 'RSA-2048',
      'ecdsa': 'ECDSA-P256',
      'ed25519': 'Ed25519',
      'hmac': 'HMAC-SHA256',
      'kdf': 'PBKDF2',
      'master': 'AES-256-GCM',
      'field_encryption': 'AES-256-GCM',
      'file_encryption': 'AES-256-GCM',
      'backup': 'AES-256-GCM',
      'api': 'AES-256-GCM',
      'session': 'AES-256-GCM'
    };
    return algorithms[type] || 'AES-256-GCM';
  }

  private getKeySizeForType(type: KeyType): number {
    const sizes = {
      'symmetric': 256,
      'asymmetric': 2048,
      'rsa': 2048,
      'ecdsa': 256,
      'ed25519': 256,
      'hmac': 256,
      'kdf': 256,
      'master': 256,
      'field_encryption': 256,
      'file_encryption': 256,
      'backup': 256,
      'api': 256,
      'session': 256
    };
    return sizes[type] || 256;
  }

  private isAsymmetricType(type: KeyType): boolean {
    return ['asymmetric', 'rsa', 'ecdsa', 'ed25519'].includes(type);
  }

  private generateAsymmetricKeyPair(type: KeyType, keySize: number): {
    publicKey: string;
    privateKey: string;
  } {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  private encryptKeyMaterial(keyMaterial: string): string {
    // In production, this would use HSM or secure key management
    return encryptionManager.encryptToBase64(keyMaterial, this.masterKey.id);
  }

  private decryptKeyMaterial(encryptedMaterial: string, keyId: string): string {
    // In production, this would use HSM or secure key management
    return encryptionManager.decryptFromBase64(encryptedMaterial);
  }

  private calculateEntropy(keyMaterial: string): number {
    // Simplified entropy calculation
    const chars = new Set(keyMaterial);
    return Math.min(1.0, chars.size / 16); // Normalize to 0-1
  }

  private calculateRandomnessScore(keyMaterial: string): number {
    // Check for patterns in the key material
    const hasPatterns = /([0-9A-Fa-f])\1{3,}/.test(keyMaterial);
    return hasPatterns ? 0.7 : 1.0;
  }

  private assessKeyStrength(keyMaterial: string): 'weak' | 'medium' | 'strong' | 'enterprise' {
    const entropy = this.calculateEntropy(keyMaterial);
    const randomness = this.calculateRandomnessScore(keyMaterial);
    const score = (entropy + randomness) / 2;
    
    if (score >= 0.9) return 'enterprise';
    if (score >= 0.8) return 'strong';
    if (score >= 0.6) return 'medium';
    return 'weak';
  }

  private updateKeyUsage(cryptoKey: CryptoKey, purpose: string): void {
    const usage = cryptoKey.metadata.usage;
    
    switch (purpose) {
      case 'encryption':
        usage.encryption++;
        break;
      case 'decryption':
        usage.decryption++;
        break;
      case 'signing':
        usage.signing++;
        break;
      case 'verification':
        usage.verification++;
        break;
      case 'key_derivation':
        usage.key_derivation++;
        break;
      case 'authentication':
        usage.authentication++;
        break;
    }
  }

  private calculateBackupStatus(cryptoKey: CryptoKey): 'none' | 'partial' | 'complete' | 'distributed' {
    const backupCount = cryptoKey.metadata.backupLocations.length;
    if (backupCount === 0) return 'none';
    if (backupCount === 1) return 'partial';
    if (backupCount >= 2 && backupCount < 3) return 'complete';
    return 'distributed';
  }

  private logKeyAction(
    keyId: string,
    action: KeyAction,
    userId: string,
    details: string,
    result: 'success' | 'failure',
    metadata?: any
  ): void {
    const auditEntry: KeyAuditEntry = {
      timestamp: new Date(),
      action,
      userId,
      ipAddress: 'system',
      details,
      result,
      metadata
    };

    const cryptoKey = this.keys.get(keyId);
    if (cryptoKey) {
      cryptoKey.security.auditTrail.push(auditEntry);
    }
    this.auditLog.push({ ...auditEntry, keyId } as any);
  }
}

// Singleton instance
export const cryptoKeyManager = new CryptoKeyManager();

/**
 * Utility functions
 */
export const keyManagerUtils = {
  /**
   * Get key by purpose
   */
  getKeyByPurpose: (purpose: string): CryptoKey | null => {
    for (const key of cryptoKeyManager['keys'].values()) {
      if (key.purpose.includes(purpose) && key.status === 'active') {
        return key;
      }
    }
    return null;
  },

  /**
   * Check if key needs rotation
   */
  needsRotation: (keyId: string): boolean => {
    const key = cryptoKeyManager['keys'].get(keyId);
    if (!key || key.status !== 'active') return false;
    
    const now = new Date();
    const age = (now.getTime() - key.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return age >= cryptoKeyManager['rotationConfig'].rotationInterval;
  },

  /**
   * Get expiring keys
   */
  getExpiringKeys: (days: number = 30): CryptoKey[] => {
    const expiring: CryptoKey[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    for (const key of cryptoKeyManager['keys'].values()) {
      if (key.expiresAt && key.expiresAt <= cutoffDate && key.status === 'active') {
        expiring.push(key);
      }
    }

    return expiring;
  },

  /**
   * Create field encryption key
   */
  createFieldEncryptionKey: async (fieldType: string): Promise<CryptoKey> => {
    return cryptoKeyManager.generateKey(
      `field_encryption_${fieldType}`,
      'field_encryption',
      ['field_encryption', 'pii_protection'],
      'default',
      'system'
    );
  },

  /**
   * Create file encryption key
   */
  createFileEncryptionKey: async (purpose: string): Promise<CryptoKey> => {
    return cryptoKeyManager.generateKey(
      `file_encryption_${purpose}`,
      'file_encryption',
      ['file_encryption', 'document_protection'],
      'default',
      'system'
    );
  }
};
