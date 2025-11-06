const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a secure share token
 * @param {number} length - Token length in bytes
 * @returns {string} Secure token
 */
function generateShareToken(length = 32) {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Verify share token format
 * @param {string} token - Share token to verify
 * @returns {boolean} True if valid format
 */
function verifyShareToken(token) {
  // Check if token is valid base64url and reasonable length
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Base64url regex
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  
  if (!base64urlRegex.test(token)) {
    return false;
  }

  // Check length (should be between 20 and 100 characters)
  if (token.length < 20 || token.length > 100) {
    return false;
  }

  return true;
}

/**
 * Create a secure share URL
 * @param {string} token - Share token
 * @param {string} baseUrl - Base URL for the application
 * @returns {string} Complete share URL
 */
function createShareUrl(token, baseUrl) {
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  return `${cleanBaseUrl}/share/${token}`;
}

/**
 * Parse and validate share configuration
 * @param {Object} shareConfig - Share configuration
 * @returns {Object} Validated configuration
 */
function validateShareConfig(shareConfig) {
  const {
    expiresIn = 1440, // 24 hours default
    maxDownloads = 10,
    password = null,
    allowDownload = true,
    emailNotifications = false
  } = shareConfig;

  const errors = [];
  const warnings = [];

  // Validate expiration time
  if (typeof expiresIn !== 'number' || expiresIn < 1) {
    errors.push('Expiration time must be a positive number of minutes');
  } else if (expiresIn > 43200) { // 30 days
    errors.push('Expiration time cannot exceed 30 days');
  } else if (expiresIn < 60) { // Less than 1 hour
    warnings.push('Share link expires in less than 1 hour');
  }

  // Validate max downloads
  if (typeof maxDownloads !== 'number' || maxDownloads < 1) {
    errors.push('Max downloads must be a positive number');
  } else if (maxDownloads > 1000) {
    errors.push('Max downloads cannot exceed 1000');
  } else if (maxDownloads > 100) {
    warnings.push('High download limit may pose security risks');
  }

  // Validate password
  if (password !== null) {
    if (typeof password !== 'string') {
      errors.push('Password must be a string');
    } else if (password.length < 4) {
      errors.push('Password must be at least 4 characters long');
    } else if (password.length > 100) {
      errors.push('Password cannot exceed 100 characters');
    } else if (password.length < 6) {
      warnings.push('Short passwords are less secure');
    }
  }

  // Validate allowDownload
  if (typeof allowDownload !== 'boolean') {
    errors.push('Allow download must be a boolean value');
  }

  // Validate email notifications
  if (typeof emailNotifications !== 'boolean') {
    errors.push('Email notifications must be a boolean value');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    config: {
      expiresIn,
      maxDownloads,
      password,
      allowDownload,
      emailNotifications
    }
  };
}

/**
 * Generate share statistics
 * @param {Object} shareData - Share data
 * @returns {Object} Share statistics
 */
function generateShareStats(shareData) {
  const {
    createdAt,
    expiresAt,
    downloadCount = 0,
    maxDownloads,
    lastDownloadedAt,
    lastViewedAt
  } = shareData;

  const now = new Date();
  const expirationDate = new Date(expiresAt);
  
  // Calculate remaining time
  const remainingTime = Math.max(0, expirationDate - now);
  const remainingDays = Math.floor(remainingTime / (24 * 60 * 60 * 1000));
  const remainingHours = Math.floor((remainingTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
  
  // Calculate remaining downloads
  const remainingDownloads = Math.max(0, maxDownloads - downloadCount);
  
  // Calculate download usage percentage
  const downloadPercentage = (downloadCount / maxDownloads) * 100;
  
  // Determine share status
  let status = 'active';
  if (now > expirationDate) {
    status = 'expired';
  } else if (downloadCount >= maxDownloads) {
    status = 'exhausted';
  } else if (remainingDownloads < Math.ceil(maxDownloads * 0.1)) {
    status = 'low_downloads';
  }

  return {
    status: status,
    isActive: status === 'active',
    remainingTime: {
      total: remainingTime,
      days: remainingDays,
      hours: remainingHours,
      minutes: remainingMinutes,
      formatted: remainingTime > 0 
        ? `${remainingDays}d ${remainingHours}h ${remainingMinutes}m`
        : 'Expired'
    },
    downloads: {
      used: downloadCount,
      remaining: remainingDownloads,
      total: maxDownloads,
      percentage: downloadPercentage,
      isExhausted: downloadCount >= maxDownloads
    },
    activity: {
      lastDownload: lastDownloadedAt,
      lastView: lastViewedAt,
      createdAt: createdAt,
      expiresAt: expirationDate
    }
  };
}

/**
 * Create share metadata
 * @param {Object} fileData - File data
 * @param {Object} shareOptions - Share options
 * @param {string} ownerId - Share owner ID
 * @returns {Object} Share metadata
 */
function createShareMetadata(fileData, shareOptions, ownerId) {
  const { validateShareConfig } = require('./validation');
  const validation = validateShareConfig(shareOptions);
  
  if (!validation.isValid) {
    throw new Error('Invalid share configuration: ' + validation.errors.join(', '));
  }

  const token = generateShareToken();
  const shareId = uuidv4();
  
  const expiresAt = new Date(Date.now() + (validation.config.expiresIn * 60 * 1000));

  return {
    id: shareId,
    token: token,
    fileId: fileData.id,
    ownerId: ownerId,
    createdAt: new Date(),
    expiresAt: expiresAt,
    maxDownloads: validation.config.maxDownloads,
    downloadCount: 0,
    requiresPassword: !!validation.config.password,
    passwordHash: validation.config.password 
      ? require('bcryptjs').hashSync(validation.config.password, 12)
      : null,
    allowDownload: validation.config.allowDownload,
    emailNotifications: validation.config.emailNotifications,
    isActive: true,
    metadata: {
      fileName: fileData.originalName,
      fileSize: fileData.size,
      fileType: fileData.mimetype,
      shareUrl: createShareUrl(token, process.env.BASE_URL || 'http://localhost:3000')
    }
  };
}

/**
 * Check if share is accessible
 * @param {Object} shareData - Share data
 * @returns {Object} Access check result
 */
function checkShareAccess(shareData) {
  const { isActive, expiresAt, downloadCount, maxDownloads, allowDownload } = shareData;
  const now = new Date();

  // Check if share is active
  if (!isActive) {
    return {
      allowed: false,
      reason: 'Share has been deactivated',
      code: 'DEACTIVATED'
    };
  }

  // Check if share has expired
  if (now > new Date(expiresAt)) {
    return {
      allowed: false,
      reason: 'Share link has expired',
      code: 'EXPIRED'
    };
  }

  // Check if downloads are exhausted
  if (downloadCount >= maxDownloads) {
    return {
      allowed: false,
      reason: 'Download limit has been reached',
      code: 'EXHAUSTED'
    };
  }

  // Check if downloads are allowed
  if (!allowDownload) {
    return {
      allowed: false,
      reason: 'Downloads are disabled for this share',
      code: 'DOWNLOAD_DISABLED'
    };
  }

  return {
    allowed: true,
    reason: 'Share is accessible',
    code: 'OK'
  };
}

/**
 * Log share access attempt
 * @param {Object} shareData - Share data
 * @param {string} action - Action performed
 * @param {Object} context - Access context
 * @param {Object} result - Access result
 */
function logShareAccess(shareData, action, context, result) {
  const { auditLogger } = require('../services/audit');
  
  const logData = {
    shareId: shareData.id,
    fileId: shareData.fileId,
    action: action,
    allowed: result.allowed,
    reason: result.reason,
    context: context
  };

  if (result.allowed) {
    auditLogger.logEvent('SHARE_ACCESS_GRANTED', logData);
  } else {
    auditLogger.logSecurityIncident('SHARE_ACCESS_DENIED', {
      ...logData,
      securityCode: result.code
    });
  }
}

/**
 * Create share expiration reminder
 * @param {Object} shareData - Share data
 * @returns {Object|null} Reminder data
 */
function createExpirationReminder(shareData) {
  const now = new Date();
  const expiresAt = new Date(shareData.expiresAt);
  const timeUntilExpiration = expiresAt - now;
  
  // Create reminders at 24 hours, 4 hours, and 1 hour before expiration
  const reminderIntervals = [
    24 * 60 * 60 * 1000, // 24 hours
    4 * 60 * 60 * 1000,  // 4 hours
    60 * 60 * 1000       // 1 hour
  ];

  for (const interval of reminderIntervals) {
    if (timeUntilExpiration > 0 && timeUntilExpiration <= interval) {
      return {
        shareId: shareData.id,
        ownerId: shareData.ownerId,
        reminderTime: interval,
        expiresAt: expiresAt,
        daysUntilExpiration: Math.floor(timeUntilExpiration / (24 * 60 * 60 * 1000)),
        hoursUntilExpiration: Math.floor((timeUntilExpiration % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
      };
    }
  }

  return null;
}

/**
 * Generate share analytics
 * @param {Array} shareEvents - Share access events
 * @returns {Object} Analytics data
 */
function generateShareAnalytics(shareEvents) {
  if (!shareEvents || shareEvents.length === 0) {
    return {
      totalEvents: 0,
      downloadEvents: 0,
      viewEvents: 0,
      uniqueIPs: 0,
      peakActivity: null,
      dailyActivity: {},
      geographicData: {}
    };
  }

  const analytics = {
    totalEvents: shareEvents.length,
    downloadEvents: 0,
    viewEvents: 0,
    uniqueIPs: new Set(),
    dailyActivity: {},
    hourlyActivity: {},
    userAgents: {},
    geographicData: {}
  };

  shareEvents.forEach(event => {
    // Count event types
    if (event.eventType === 'SHARE_FILE_DOWNLOADED') {
      analytics.downloadEvents++;
    } else if (event.eventType === 'SHARE_VIEWED') {
      analytics.viewEvents++;
    }

    // Track unique IPs
    if (event.ipAddress) {
      analytics.uniqueIPs.add(event.ipAddress);
    }

    // Daily activity
    const date = new Date(event.createdAt).toISOString().split('T')[0];
    analytics.dailyActivity[date] = (analytics.dailyActivity[date] || 0) + 1;

    // Hourly activity
    const hour = new Date(event.createdAt).getHours();
    analytics.hourlyActivity[hour] = (analytics.hourlyActivity[hour] || 0) + 1;

    // User agents
    if (event.userAgent) {
      const userAgent = event.userAgent.split(' ')[0]; // Get browser name
      analytics.userAgents[userAgent] = (analytics.userAgents[userAgent] || 0) + 1;
    }
  });

  // Convert Set to count
  analytics.uniqueIPs = analytics.uniqueIPs.size;

  // Find peak activity
  const peakDate = Object.keys(analytics.dailyActivity).reduce((a, b) => 
    analytics.dailyActivity[a] > analytics.dailyActivity[b] ? a : b
  );
  analytics.peakActivity = {
    date: peakDate,
    events: analytics.dailyActivity[peakDate]
  };

  return analytics;
}

module.exports = {
  generateShareToken,
  verifyShareToken,
  createShareUrl,
  validateShareConfig,
  generateShareStats,
  createShareMetadata,
  checkShareAccess,
  logShareAccess,
  createExpirationReminder,
  generateShareAnalytics
};