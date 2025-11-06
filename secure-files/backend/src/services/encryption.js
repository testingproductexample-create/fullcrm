const crypto = require('crypto');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/encryption.log' }),
    new winston.transports.Console()
  ]
});

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Generate a random encryption key
 * @returns {Buffer} Random 256-bit key
 */
function generateKey() {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Generate a random initialization vector
 * @returns {Buffer} Random 96-bit IV for GCM
 */
function generateIV() {
  return crypto.randomBytes(IV_LENGTH);
}

/**
 * Generate a random salt
 * @returns {Buffer} Random 128-bit salt
 */
function generateSalt() {
  return crypto.randomBytes(SALT_LENGTH);
}

/**
 * Derive a key from a password using PBKDF2
 * @param {string} password - The password to derive key from
 * @param {Buffer} salt - The salt to use
 * @param {number} iterations - Number of iterations (default: 100000)
 * @returns {Promise<Buffer>} Derived key
 */
async function deriveKeyFromPassword(password, salt, iterations = 100000) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, KEY_LENGTH, 'sha256', (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

/**
 * Encrypt data using AES-256-GCM
 * @param {Buffer} data - The data to encrypt
 * @param {Buffer} key - The encryption key (256-bit)
 * @param {Buffer} iv - The initialization vector
 * @returns {Promise<Object>} Object containing encrypted data and auth tag
 */
async function encrypt(data, key, iv) {
  try {
    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data);
    }

    if (key.length !== KEY_LENGTH) {
      throw new Error(`Invalid key length. Expected ${KEY_LENGTH}, got ${key.length}`);
    }

    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length. Expected ${IV_LENGTH}, got ${iv.length}`);
    }

    const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, null, 'buffer');
    cipher.final();
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted,
      authTag: authTag
    };
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {Buffer} encryptedData - The encrypted data
 * @param {Buffer} key - The decryption key
 * @param {Buffer} iv - The initialization vector
 * @param {Buffer} authTag - The authentication tag
 * @returns {Promise<Buffer>} Decrypted data
 */
async function decrypt(encryptedData, key, iv, authTag) {
  try {
    if (key.length !== KEY_LENGTH) {
      throw new Error(`Invalid key length. Expected ${KEY_LENGTH}, got ${key.length}`);
    }

    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length. Expected ${IV_LENGTH}, got ${iv.length}`);
    }

    if (authTag.length !== TAG_LENGTH) {
      throw new Error(`Invalid auth tag length. Expected ${TAG_LENGTH}, got ${authTag.length}`);
    }

    const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, null, 'buffer');
    decipher.final();

    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Complete file encryption pipeline
 * @param {Buffer} fileData - The file data to encrypt
 * @param {string} password - Optional password for key derivation
 * @returns {Promise<Object>} Object containing all encryption data
 */
async function encryptFile(fileData, password = null) {
  try {
    let key, salt;
    
    if (password) {
      // Derive key from password
      salt = generateSalt();
      key = await deriveKeyFromPassword(password, salt);
    } else {
      // Generate random key
      key = generateKey();
      salt = null;
    }

    const iv = generateIV();
    
    const { encrypted, authTag } = await encrypt(fileData, key, iv);
    
    return {
      encrypted: encrypted,
      key: key,
      iv: iv,
      authTag: authTag,
      salt: salt,
      algorithm: ALGORITHM,
      metadata: {
        keyLength: KEY_LENGTH,
        ivLength: IV_LENGTH,
        tagLength: TAG_LENGTH,
        saltLength: SALT_LENGTH,
        usedPassword: !!password
      }
    };
  } catch (error) {
    logger.error('File encryption pipeline error:', error);
    throw new Error(`File encryption failed: ${error.message}`);
  }
}

/**
 * Complete file decryption pipeline
 * @param {Buffer} encryptedData - The encrypted file data
 * @param {Buffer} key - The decryption key
 * @param {Buffer} iv - The initialization vector
 * @param {Buffer} authTag - The authentication tag
 * @param {Buffer} salt - The salt (if password-derived key was used)
 * @param {string} password - The password (if applicable)
 * @returns {Promise<Buffer>} Decrypted file data
 */
async function decryptFile(encryptedData, key, iv, authTag, salt = null, password = null) {
  try {
    let decryptionKey = key;
    
    if (password && salt) {
      // Derive key from password and salt
      decryptionKey = await deriveKeyFromPassword(password, salt);
    }
    
    return await decrypt(encryptedData, decryptionKey, iv, authTag);
  } catch (error) {
    logger.error('File decryption pipeline error:', error);
    throw new Error(`File decryption failed: ${error.message}`);
  }
}

/**
 * Generate a secure hash for data integrity verification
 * @param {Buffer} data - The data to hash
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {string} Hex-encoded hash
 */
function generateHash(data, algorithm = 'sha256') {
  try {
    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data);
    }
    
    return crypto.createHash(algorithm).update(data).digest('hex');
  } catch (error) {
    logger.error('Hash generation error:', error);
    throw new Error(`Hash generation failed: ${error.message}`);
  }
}

/**
 * Verify data integrity using hash
 * @param {Buffer} data - The original data
 * @param {string} expectedHash - The expected hash
 * @param {string} algorithm - Hash algorithm
 * @returns {boolean} True if hash matches
 */
function verifyHash(data, expectedHash, algorithm = 'sha256') {
  try {
    const actualHash = generateHash(data, algorithm);
    return actualHash === expectedHash;
  } catch (error) {
    logger.error('Hash verification error:', error);
    return false;
  }
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} Hex-encoded random token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate HMAC for data authentication
 * @param {Buffer} data - The data to authenticate
 * @param {Buffer} key - The HMAC key
 * @param {string} algorithm - Hash algorithm for HMAC
 * @returns {Buffer} HMAC
 */
function generateHMAC(data, key, algorithm = 'sha256') {
  return crypto.createHmac(algorithm, key).update(data).digest();
}

/**
 * Verify HMAC
 * @param {Buffer} data - The original data
 * @param {Buffer} hmac - The HMAC to verify
 * @param {Buffer} key - The HMAC key
 * @param {string} algorithm - Hash algorithm
 * @returns {boolean} True if HMAC is valid
 */
function verifyHMAC(data, hmac, key, algorithm = 'sha256') {
  try {
    const expectedHmac = generateHMAC(data, key, algorithm);
    return crypto.timingSafeEqual(hmac, expectedHmac);
  } catch (error) {
    return false;
  }
}

/**
 * Create an encryption envelope containing all necessary information
 * @param {Buffer} data - The data to encrypt
 * @param {Object} options - Encryption options
 * @returns {Promise<Object>} Encryption envelope
 */
async function createEncryptionEnvelope(data, options = {}) {
  const { password, keyDerivationIterations = 100000 } = options;
  
  let key, salt;
  
  if (password) {
    salt = generateSalt();
    key = await deriveKeyFromPassword(password, salt, keyDerivationIterations);
  } else {
    key = generateKey();
    salt = null;
  }
  
  const iv = generateIV();
  const { encrypted, authTag } = await encrypt(data, key, iv);
  
  return {
    version: '1.0',
    algorithm: ALGORITHM,
    encrypted: encrypted,
    key: key,
    iv: iv,
    authTag: authTag,
    salt: salt,
    metadata: {
      keyLength: KEY_LENGTH,
      ivLength: IV_LENGTH,
      tagLength: TAG_LENGTH,
      saltLength: salt ? SALT_LENGTH : 0,
      iterations: password ? keyDerivationIterations : 1,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Extract data from encryption envelope
 * @param {Object} envelope - The encryption envelope
 * @param {string} password - Password for decryption (if applicable)
 * @returns {Promise<Buffer>} Decrypted data
 */
async function extractFromEnvelope(envelope, password = null) {
  try {
    let key = envelope.key;
    
    if (password && envelope.salt && envelope.metadata?.iterations) {
      key = await deriveKeyFromPassword(password, envelope.salt, envelope.metadata.iterations);
    }
    
    return await decrypt(
      envelope.encrypted,
      key,
      envelope.iv,
      envelope.authTag
    );
  } catch (error) {
    logger.error('Envelope extraction error:', error);
    throw new Error(`Envelope extraction failed: ${error.message}`);
  }
}

/**
 * Wipe sensitive data from memory
 * @param {Buffer} data - The buffer to wipe
 */
function wipeBuffer(data) {
  if (Buffer.isBuffer(data)) {
    data.fill(0);
  }
}

/**
 * Secure comparison of two values
 * @param {string|Buffer} a - First value
 * @param {string|Buffer} b - Second value
 * @returns {boolean} True if values are equal
 */
function secureEqual(a, b) {
  try {
    const bufA = Buffer.isBuffer(a) ? a : Buffer.from(a);
    const bufB = Buffer.isBuffer(b) ? b : Buffer.from(b);
    
    if (bufA.length !== bufB.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (error) {
    return false;
  }
}

module.exports = {
  encrypt,
  decrypt,
  encryptFile,
  decryptFile,
  generateKey,
  generateIV,
  generateSalt,
  generateHash,
  verifyHash,
  generateSecureToken,
  generateHMAC,
  verifyHMAC,
  createEncryptionEnvelope,
  extractFromEnvelope,
  wipeBuffer,
  secureEqual,
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  TAG_LENGTH
};