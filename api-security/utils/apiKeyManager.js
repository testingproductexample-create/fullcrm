const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const securityLogger = require('./securityLogger');

// In-memory storage (use database in production)
const apiKeys = new Map();
const revokedKeys = new Set();

/**
 * API Key Management System
 * Handles API key generation, validation, and management
 */

// Default configuration
const defaultConfig = {
  keyLength: 32,
  saltRounds: 12,
  maxKeysPerUser: 10,
  defaultPermissions: ['read'],
  defaultExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
  algorithms: ['sha256', 'hmac-sha256'],
  requireIPWhitelist: false
};

/**
 * Generate API Key
 * Creates a new API key with specified permissions
 */
async function generateApiKey(userId, permissions = defaultConfig.defaultPermissions, expiresIn = '30d') {
  try {
    // Check if user has reached maximum keys limit
    const userKeys = Array.from(apiKeys.values()).filter(key => key.userId === userId);
    if (userKeys.length >= defaultConfig.maxKeysPerUser) {
      throw new Error(`Maximum number of API keys (${defaultConfig.maxKeysPerUser}) reached for user ${userId}`);
    }
    
    // Generate unique key ID
    const keyId = uuidv4();
    
    // Generate API key
    const randomBytes = crypto.randomBytes(defaultConfig.keyLength);
    const apiKeyString = `api_${randomBytes.toString('hex')}`;
    
    // Hash the API key for storage
    const salt = await bcrypt.genSalt(defaultConfig.saltRounds);
    const hashedKey = await bcrypt.hash(apiKeyString, salt);
    
    // Calculate expiry date
    const expiryMs = parseExpiryTime(expiresIn);
    const expiresAt = new Date(Date.now() + expiryMs);
    
    // Create API key record
    const apiKey = {
      keyId,
      userId,
      hashedKey,
      permissions: Array.from(new Set([...permissions, ...defaultConfig.defaultPermissions])),
      createdAt: new Date(),
      expiresAt,
      lastUsed: null,
      usageCount: 0,
      isActive: true,
      metadata: {
        ipWhitelist: [],
        userAgent: null,
        description: `API Key for user ${userId}`,
        tags: []
      }
    };
    
    // Store API key
    apiKeys.set(keyId, {
      ...apiKey,
      key: apiKeyString // Store unhashed version for immediate return
    });
    
    // Log API key creation
    securityLogger.apiKey('api_key_generated', {
      keyId,
      userId,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      timestamp: new Date().toISOString()
    });
    
    return {
      keyId,
      key: apiKeyString,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt
    };
  } catch (error) {
    securityLogger.apiKey('api_key_generation_failed', {
      userId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Validate API Key
 * Checks if API key is valid and not expired
 */
async function validateApiKey(apiKeyString) {
  try {
    // Search for matching API key
    let foundKey = null;
    let keyId = null;
    
    for (const [id, key] of apiKeys.entries()) {
      if (key.key === apiKeyString) {
        foundKey = key;
        keyId = id;
        break;
      }
    }
    
    if (!foundKey) {
      // Check if it's a revoked key
      if (revokedKeys.has(apiKeyString)) {
        securityLogger.apiKey('revoked_key_used', {
          key: apiKeyString.substring(0, 20) + '...',
          timestamp: new Date().toISOString()
        });
        return {
          valid: false,
          reason: 'API key has been revoked',
          keyId: null
        };
      }
      
      securityLogger.apiKey('invalid_key_attempt', {
        key: apiKeyString.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      });
      
      return {
        valid: false,
        reason: 'Invalid API key',
        keyId: null
      };
    }
    
    // Check if key is active
    if (!foundKey.isActive) {
      securityLogger.apiKey('inactive_key_used', {
        keyId,
        userId: foundKey.userId,
        timestamp: new Date().toISOString()
      });
      
      return {
        valid: false,
        reason: 'API key is inactive',
        keyId
      };
    }
    
    // Check if key is expired
    if (new Date() > foundKey.expiresAt) {
      securityLogger.apiKey('expired_key_used', {
        keyId,
        userId: foundKey.userId,
        expiresAt: foundKey.expiresAt,
        timestamp: new Date().toISOString()
      });
      
      return {
        valid: false,
        reason: 'API key has expired',
        keyId
      };
    }
    
    // Verify the key using bcrypt
    const isValid = await bcrypt.compare(apiKeyString, foundKey.hashedKey);
    if (!isValid) {
      securityLogger.apiKey('key_verification_failed', {
        keyId,
        userId: foundKey.userId,
        timestamp: new Date().toISOString()
      });
      
      return {
        valid: false,
        reason: 'Key verification failed',
        keyId
      };
    }
    
    // Update usage statistics
    foundKey.lastUsed = new Date();
    foundKey.usageCount++;
    apiKeys.set(keyId, foundKey);
    
    securityLogger.apiKey('key_validated', {
      keyId,
      userId: foundKey.userId,
      permissions: foundKey.permissions,
      usageCount: foundKey.usageCount,
      timestamp: new Date().toISOString()
    });
    
    return {
      valid: true,
      key: foundKey,
      keyId
    };
  } catch (error) {
    securityLogger.apiKey('key_validation_error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return {
      valid: false,
      reason: 'Validation service error',
      keyId: null
    };
  }
}

/**
 * Revoke API Key
 * Deactivates an API key permanently
 */
async function revokeApiKey(keyId, reason = 'User requested revocation') {
  try {
    const key = apiKeys.get(keyId);
    if (!key) {
      throw new Error(`API key not found: ${keyId}`);
    }
    
    // Deactivate the key
    key.isActive = false;
    key.revokedAt = new Date();
    key.revocationReason = reason;
    
    // Add to revoked keys set
    revokedKeys.add(key.key);
    
    // Update storage
    apiKeys.set(keyId, key);
    
    // Log revocation
    securityLogger.apiKey('api_key_revoked', {
      keyId,
      userId: key.userId,
      reason,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      keyId,
      revokedAt: key.revokedAt
    };
  } catch (error) {
    securityLogger.apiKey('key_revocation_failed', {
      keyId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Get API Key Information
 * Retrieves information about an API key without the actual key
 */
function getApiKeyInfo(keyId) {
  const key = apiKeys.get(keyId);
  if (!key) {
    return null;
  }
  
  // Return key information without the actual key
  const { key: actualKey, ...keyInfo } = key;
  return {
    ...keyInfo,
    key: `api_${'*'.repeat(32)}` // Masked key
  };
}

/**
 * List User API Keys
 * Returns all API keys for a user
 */
function listUserApiKeys(userId) {
  const userKeys = Array.from(apiKeys.entries())
    .filter(([id, key]) => key.userId === userId)
    .map(([id, key]) => {
      const { key: actualKey, ...keyInfo } = key;
      return {
        ...keyInfo,
        keyId: id,
        key: `api_${'*'.repeat(32)}` // Masked key
      };
    });
  
  return userKeys;
}

/**
 * Update API Key Permissions
 * Updates the permissions for an API key
 */
async function updateApiKeyPermissions(keyId, newPermissions) {
  try {
    const key = apiKeys.get(keyId);
    if (!key) {
      throw new Error(`API key not found: ${keyId}`);
    }
    
    if (!key.isActive) {
      throw new Error('Cannot update permissions for inactive key');
    }
    
    // Update permissions
    key.permissions = Array.from(new Set([...newPermissions, ...defaultConfig.defaultPermissions]));
    key.updatedAt = new Date();
    
    apiKeys.set(keyId, key);
    
    securityLogger.apiKey('key_permissions_updated', {
      keyId,
      userId: key.userId,
      newPermissions: key.permissions,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      keyId,
      permissions: key.permissions
    };
  } catch (error) {
    securityLogger.apiKey('key_permission_update_failed', {
      keyId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Rotate API Key
 * Creates a new API key and revokes the old one
 */
async function rotateApiKey(keyId, description = 'Key rotation') {
  try {
    const oldKey = apiKeys.get(keyId);
    if (!oldKey) {
      throw new Error(`API key not found: ${keyId}`);
    }
    
    // Generate new key with same permissions and expiry
    const newKey = await generateApiKey(
      oldKey.userId,
      oldKey.permissions,
      formatExpiryTime(oldKey.expiresAt)
    );
    
    // Revoke old key
    await revokeApiKey(keyId, 'Key rotation');
    
    securityLogger.apiKey('key_rotated', {
      oldKeyId: keyId,
      newKeyId: newKey.keyId,
      userId: oldKey.userId,
      description,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      oldKeyId: keyId,
      newKey: newKey
    };
  } catch (error) {
    securityLogger.apiKey('key_rotation_failed', {
      keyId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Get API Key Statistics
 * Returns usage statistics for API keys
 */
function getApiKeyStatistics() {
  const stats = {
    totalKeys: apiKeys.size,
    activeKeys: 0,
    expiredKeys: 0,
    revokedKeys: revokedKeys.size,
    totalUsers: new Set(Array.from(apiKeys.values()).map(key => key.userId)).size,
    keysExpiringSoon: 0,
    topUsers: []
  };
  
  const now = new Date();
  const soonExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const userKeyCounts = new Map();
  
  for (const [id, key] of apiKeys.entries()) {
    // Count active keys
    if (key.isActive) {
      stats.activeKeys++;
      
      // Count expired keys
      if (key.expiresAt < now) {
        stats.expiredKeys++;
      }
      
      // Count keys expiring soon
      if (key.expiresAt < soonExpiry && key.expiresAt > now) {
        stats.keysExpiringSoon++;
      }
      
      // Track user key counts
      userKeyCounts.set(key.userId, (userKeyCounts.get(key.userId) || 0) + 1);
    }
  }
  
  // Get top users by key count
  stats.topUsers = Array.from(userKeyCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, keyCount: count }));
  
  return stats;
}

// Helper function to parse expiry time strings
function parseExpiryTime(expiresIn) {
  if (typeof expiresIn === 'number') {
    return expiresIn;
  }
  
  const timeUnits = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
    'w': 7 * 24 * 60 * 60 * 1000,
    'M': 30 * 24 * 60 * 60 * 1000,
    'y': 365 * 24 * 60 * 60 * 1000
  };
  
  const match = expiresIn.match(/^(\d+)([smhdwMy])$/);
  if (!match) {
    return defaultConfig.defaultExpiry; // Default to 30 days
  }
  
  const [, value, unit] = match;
  return parseInt(value) * timeUnits[unit];
}

// Helper function to format expiry time for rotation
function formatExpiryTime(expiresAt) {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  
  if (days >= 30) {
    return `${Math.ceil(days / 30)}M`;
  } else if (days >= 7) {
    return `${Math.ceil(days / 7)}w`;
  } else {
    return `${days}d`;
  }
}

module.exports = {
  generateApiKey,
  validateApiKey,
  revokeApiKey,
  getApiKeyInfo,
  listUserApiKeys,
  updateApiKeyPermissions,
  rotateApiKey,
  getApiKeyStatistics,
  parseExpiryTime
};