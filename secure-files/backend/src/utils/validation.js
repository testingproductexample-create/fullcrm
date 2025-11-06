const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Validate file metadata
 * @param {Object} metadata - File metadata
 * @returns {Object} Validation result
 */
function validateFileMetadata(metadata) {
  const { originalName, size, mimetype } = metadata;
  const errors = [];

  // Validate filename
  if (!originalName || typeof originalName !== 'string') {
    errors.push('Invalid filename');
  } else {
    // Check filename length
    if (originalName.length > 255) {
      errors.push('Filename too long (max 255 characters)');
    }

    // Check for dangerous characters
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(originalName)) {
      errors.push('Filename contains invalid characters');
    }

    // Check for path traversal
    if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
      errors.push('Filename cannot contain path separators');
    }
  }

  // Validate file size
  if (!size || typeof size !== 'number' || size <= 0) {
    errors.push('Invalid file size');
  } else {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024; // 100MB default
    if (size > maxSize) {
      errors.push(`File too large (max ${Math.round(maxSize / (1024 * 1024))}MB)`);
    }

    // Check for suspiciously small files (potential malware)
    if (size < 10) {
      errors.push('File too small (minimum 10 bytes)');
    }
  }

  // Validate MIME type
  if (!mimetype || typeof mimetype !== 'string') {
    errors.push('Invalid MIME type');
  } else {
    // Check against allowed types
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!allowedTypes.includes(mimetype)) {
      errors.push(`File type not allowed: ${mimetype}`);
    }

    // Additional security checks for certain file types
    if (mimetype === 'application/javascript' || mimetype === 'text/javascript') {
      errors.push('JavaScript files are not allowed');
    }

    if (mimetype === 'application/x-executable' || mimetype === 'application/x-msdownload') {
      errors.push('Executable files are not allowed');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Sanitize filename
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Remove path components
  filename = filename.split(/[\\/]/).pop();

  // Remove dangerous characters
  filename = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');

  // Remove multiple consecutive underscores
  filename = filename.replace(/_{2,}/g, '_');

  // Remove leading/trailing underscores and dots
  filename = filename.replace(/^[_\.]+|[_\.]+$/g, '');

  // Limit length
  if (filename.length > 200) {
    const ext = filename.split('.').pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    filename = nameWithoutExt.substring(0, 200 - ext.length - 1) + '.' + ext;
  }

  // Ensure filename is not empty
  if (!filename) {
    filename = 'file_' + Date.now();
  }

  return filename;
}

/**
 * Generate file hash for integrity verification
 * @param {Buffer} data - File data
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {string} Hex-encoded hash
 */
function generateFileHash(data, algorithm = 'sha256') {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

/**
 * Validate file content based on MIME type
 * @param {Buffer} data - File data
 * @param {string} mimetype - File MIME type
 * @returns {Object} Validation result
 */
function validateFileContent(data, mimetype) {
  const errors = [];
  const warnings = [];

  // Check file signature (magic numbers) for security
  const signatures = {
    'image/jpeg': ['ffd8ff'],
    'image/png': ['89504e47'],
    'image/gif': ['47494638'],
    'application/pdf': ['255044462d'],
    'application/zip': ['504b0304', '504b0506', '504b0708']
  };

  if (signatures[mimetype]) {
    const dataHex = data.slice(0, 4).toString('hex');
    const expectedSignatures = signatures[mimetype];
    
    if (!expectedSignatures.some(sig => dataHex.startsWith(sig))) {
      errors.push(`File signature does not match expected ${mimetype} format`);
    }
  }

  // Check for embedded scripts in Office documents
  if (mimetype.includes('officedocument') || mimetype.includes('msword') || mimetype.includes('msexcel')) {
    const dataStr = data.toString('utf8', 0, Math.min(1000, data.length));
    
    if (dataStr.includes('VBA') || dataStr.includes('vbaProject')) {
      warnings.push('Office document contains VBA macros');
    }
    
    if (dataStr.includes('<script') || dataStr.includes('javascript:')) {
      errors.push('Office document contains embedded scripts');
    }
  }

  // Check for suspicious patterns in text files
  if (mimetype === 'text/plain') {
    const dataStr = data.toString('utf8', 0, Math.min(5000, data.length));
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /document\.write/gi,
      /<script/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi
    ];

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(dataStr)) {
        warnings.push('Text file contains potentially malicious patterns');
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

/**
 * Validate email address
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePassword(password) {
  const errors = [];
  const warnings = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors, warnings };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    warnings.push('Password is very long');
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  // Check for common weak patterns
  if (/123|abc|password|qwerty|admin|user/i.test(password)) {
    warnings.push('Password contains common patterns and may be weak');
  }

  // Check for repeated characters
  if (/(.)\1{3,}/.test(password)) {
    warnings.push('Password contains repeated characters');
  }

  // Check for sequential characters
  if (/(abc|bcd|cde|def|123|234|345|456|567|678|789|890)/i.test(password)) {
    warnings.push('Password contains sequential characters');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

/**
 * Validate file sharing settings
 * @param {Object} shareOptions - Share options
 * @returns {Object} Validation result
 */
function validateShareOptions(shareOptions) {
  const { expiresIn, maxDownloads, password, allowDownload } = shareOptions;
  const errors = [];

  // Validate expiration time
  if (expiresIn !== undefined) {
    if (typeof expiresIn !== 'number' || expiresIn < 1) {
      errors.push('Expiration time must be a positive number of minutes');
    } else if (expiresIn > 43200) { // 30 days
      errors.push('Expiration time cannot exceed 30 days (43200 minutes)');
    }
  }

  // Validate max downloads
  if (maxDownloads !== undefined) {
    if (typeof maxDownloads !== 'number' || maxDownloads < 1) {
      errors.push('Max downloads must be a positive number');
    } else if (maxDownloads > 1000) {
      errors.push('Max downloads cannot exceed 1000');
    }
  }

  // Validate password
  if (password !== undefined && password !== null) {
    if (typeof password !== 'string' || password.length < 4) {
      errors.push('Password must be at least 4 characters long');
    } else if (password.length > 100) {
      errors.push('Password cannot exceed 100 characters');
    }
  }

  // Validate allowDownload
  if (allowDownload !== undefined && typeof allowDownload !== 'boolean') {
    errors.push('Allow download must be a boolean value');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Generate unique file ID
 * @returns {string} Unique file ID
 */
function generateFileId() {
  return uuidv4();
}

/**
 * Check if file is potentially dangerous based on extension
 * @param {string} filename - Filename
 * @returns {boolean} True if potentially dangerous
 */
function isPotentiallyDangerousFile(filename) {
  const dangerousExtensions = [
    '.exe', '.com', '.bat', '.cmd', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.ps1', '.sh', '.py', '.php', '.asp', '.jsp', '.pl', '.cgi'
  ];

  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return dangerousExtensions.includes(ext);
}

/**
 * Get file category based on MIME type
 * @param {string} mimetype - MIME type
 * @returns {string} File category
 */
function getFileCategory(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('document') || mimetype.includes('msword') || mimetype.includes('pdf')) return 'document';
  if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'spreadsheet';
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'presentation';
  if (mimetype === 'text/plain' || mimetype === 'text/csv') return 'text';
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('tar')) return 'archive';
  
  return 'other';
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @param {number} precision - Decimal precision
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes, precision = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(precision)) + ' ' + sizes[i];
}

/**
 * Check if IP address is private/local
 * @param {string} ip - IP address
 * @returns {boolean} True if private/local
 */
function isPrivateIP(ip) {
  // Check for private IP ranges
  const privateRanges = [
    /^10\./,           // 10.0.0.0 - 10.255.255.255
    /^192\.168\./,     // 192.168.0.0 - 192.168.255.255
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0 - 172.31.255.255
    /^127\./,          // 127.0.0.0 - 127.255.255.255 (localhost)
    /^169\.254\./,     // 169.254.0.0 - 169.254.255.255 (link-local)
    /^::1$/,           // IPv6 localhost
    /^fc00:/,          // IPv6 private
    /^fe80:/           // IPv6 link-local
  ];

  return privateRanges.some(range => range.test(ip));
}

module.exports = {
  validateFileMetadata,
  sanitizeFilename,
  generateFileHash,
  validateFileContent,
  validateEmail,
  validatePassword,
  validateShareOptions,
  generateFileId,
  isPotentiallyDangerousFile,
  getFileCategory,
  formatFileSize,
  isPrivateIP
};