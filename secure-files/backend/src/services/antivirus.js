const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
const { auditLogger } = require('./audit');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'logs/antivirus.log' }),
    new winston.transports.Console()
  ]
});

let clamav = null;
let isInitialized = false;

/**
 * Initialize ClamAV antivirus engine
 */
async function initializeClamAV() {
  try {
    if (process.env.ANTIVIRUS_ENABLED !== 'true') {
      logger.info('Antivirus scanning is disabled');
      isInitialized = false;
      return false;
    }

    // Check if ClamAV is installed
    const clamscanVersion = await checkClamAVInstallation();
    if (!clamscanVersion) {
      throw new Error('ClamAV is not installed or not accessible');
    }

    // Initialize ClamAV
    const ClamAV = require('clamav.js');
    clamav = new ClamAV({
      removeInfected: false,
      quarantineInfected: true,
      quarantineDirectory: process.env.QUARANTINE_PATH || './quarantine',
      clamdscan: {
        host: process.env.CLAMAV_HOST || '127.0.0.1',
        port: parseInt(process.env.CLAMAV_PORT) || 3310,
        timeout: 30000,
        local_fallback: true
      },
      clamscan: {
        path: '/usr/bin/clamscan',
        database: '/var/lib/clamav',
        timeout: 30000
      }
    });

    isInitialized = true;
    logger.info(`ClamAV initialized successfully (version: ${clamscanVersion})`);
    return true;
  } catch (error) {
    logger.error('Failed to initialize ClamAV:', error);
    isInitialized = false;
    return false;
  }
}

/**
 * Check if ClamAV is installed
 * @returns {Promise<string|null>} Version string or null
 */
function checkClamAVInstallation() {
  return new Promise((resolve) => {
    const clamscan = spawn('clamscan', ['--version']);
    
    let version = '';
    
    clamscan.stdout.on('data', (data) => {
      version += data.toString();
    });
    
    clamscan.on('close', (code) => {
      if (code === 0) {
        // Extract version from output
        const versionMatch = version.match(/ClamAV (\d+\.\d+\.\d+)/);
        resolve(versionMatch ? versionMatch[1] : version.trim());
      } else {
        resolve(null);
      }
    });
    
    clamscan.on('error', () => {
      resolve(null);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      resolve(null);
    }, 5000);
  });
}

/**
 * Scan data for viruses/malware
 * @param {Buffer} data - Data to scan
 * @param {string} filename - Optional filename for logging
 * @returns {Promise<Object>} Scan result
 */
async function virusScan(data, filename = 'unknown') {
  try {
    if (!isInitialized) {
      logger.warn('Antivirus not initialized, skipping scan');
      return {
        isClean: true,
        threat: null,
        confidence: 0,
        engine: 'disabled',
        timestamp: new Date().toISOString()
      };
    }

    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data);
    }

    const scanStartTime = Date.now();
    
    // Create temporary file for scanning
    const tempDir = process.env.TEMP_SCAN_PATH || '/tmp';
    const tempFile = path.join(tempDir, `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    await fs.writeFile(tempFile, data);
    
    let scanResult;
    try {
      if (clamav) {
        // Use ClamAV for scanning
        const result = await clamav.scanFile(tempFile);
        scanResult = parseClamAVResult(result);
      } else {
        // Fallback to manual pattern matching
        scanResult = await manualScan(data, filename);
      }
    } finally {
      // Clean up temporary file
      try {
        await fs.remove(tempFile);
      } catch (cleanupError) {
        logger.warn('Failed to clean up temporary scan file:', cleanupError);
      }
    }
    
    const scanDuration = Date.now() - scanStartTime;
    
    logger.info(`Virus scan completed for ${filename}: ${scanResult.isClean ? 'CLEAN' : 'INFECTED'} (${scanDuration}ms)`);
    
    return {
      isClean: scanResult.isClean,
      threat: scanResult.threat,
      threatType: scanResult.threatType,
      confidence: scanResult.confidence,
      engine: scanResult.engine,
      scanDuration: scanDuration,
      timestamp: new Date().toISOString(),
      metadata: {
        fileSize: data.length,
        filename: filename,
        signature: scanResult.signature
      }
    };
    
  } catch (error) {
    logger.error(`Virus scan error for ${filename}:`, error);
    
    // Log security incident
    auditLogger.logSecurityIncident('ANTIVIRUS_SCAN_ERROR', {
      filename: filename,
      error: error.message
    });
    
    return {
      isClean: false, // Err on the side of caution
      threat: 'SCAN_ERROR',
      confidence: 1.0,
      engine: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Parse ClamAV scan result
 * @param {Object} result - ClamAV scan result
 * @returns {Object} Parsed result
 */
function parseClamAVResult(result) {
  if (!result) {
    return {
      isClean: true,
      threat: null,
      threatType: 'UNKNOWN',
      confidence: 0.5,
      engine: 'clamav',
      signature: null
    };
  }
  
  if (result.isInfected) {
    return {
      isClean: false,
      threat: result.viruses[0] || 'UNKNOWN_VIRUS',
      threatType: getThreatType(result.viruses[0] || ''),
      confidence: 1.0,
      engine: 'clamav',
      signature: result.signature
    };
  }
  
  if (result.isError) {
    return {
      isClean: true, // Assume clean on error
      threat: 'SCAN_ERROR',
      threatType: 'ERROR',
      confidence: 0.0,
      engine: 'clamav',
      error: result.error
    };
  }
  
  return {
    isClean: true,
    threat: null,
    threatType: 'CLEAN',
    confidence: 0.0,
    engine: 'clamav',
    signature: null
  };
}

/**
 * Manual malware scan (fallback when ClamAV is not available)
 * @param {Buffer} data - Data to scan
 * @param {string} filename - Filename for context
 * @returns {Promise<Object>} Scan result
 */
async function manualScan(data, filename) {
  const suspiciousPatterns = [
    /EICAR-STANDARD-ANTIVIRUS-TEST-FILE/i,  // EICAR test file
    /MZ.{100,}/,  // Potential PE executable
    /eval\s*\(/gi,  // JavaScript eval
    /<script[^>]*>.*?<\/script>/gi,  // Script tags
    /cmd\.exe/i,  // Windows command execution
    /powershell/i,  // PowerShell execution
    /bash.*-i/i,  // Interactive bash shell
    /nc\s+-l/i,  // Netcat listener
    /rm\s+-rf/i,  // Destructive command
    /format\s+c:/i,  // Disk formatting
  ];
  
  const dataString = data.toString('utf8');
  const dataHex = data.toString('hex');
  const dataLower = dataString.toLowerCase();
  
  for (let i = 0; i < suspiciousPatterns.length; i++) {
    const pattern = suspiciousPatterns[i];
    if (pattern.test(dataString) || pattern.test(dataLower)) {
      const match = dataString.match(pattern) || [dataLower.match(pattern)];
      
      auditLogger.logSecurityIncident('MANUAL_MALWARE_DETECTED', {
        filename: filename,
        pattern: pattern.source,
        match: match[0],
        position: i
      });
      
      return {
        isClean: false,
        threat: `SUSPICIOUS_PATTERN_${i}`,
        threatType: 'SUSPICIOUS_PATTERN',
        confidence: 0.8,
        engine: 'manual',
        signature: pattern.source
      };
    }
  }
  
  // Check for PE file headers
  if (dataHex.startsWith('4d5a') || data.slice(0, 2).toString('hex') === '4d5a') {
    return {
      isClean: false,
      threat: 'PE_EXECUTABLE',
      threatType: 'EXECUTABLE',
      confidence: 0.9,
      engine: 'manual',
      signature: 'PE_HEADER'
    };
  }
  
  // Check for Office document macros
  if (data.includes('VBProject') || data.includes('vbaProject')) {
    return {
      isClean: false,
      threat: 'OFFICE_MACRO',
      threatType: 'MACRO',
      confidence: 0.7,
      engine: 'manual',
      signature: 'MACRO_DETECTED'
    };
  }
  
  return {
    isClean: true,
    threat: null,
    threatType: 'CLEAN',
    confidence: 0.0,
    engine: 'manual',
    signature: null
  };
}

/**
 * Get threat type from threat name
 * @param {string} threat - Threat name
 * @returns {string} Threat type
 */
function getThreatType(threat) {
  const threatLower = threat.toLowerCase();
  
  if (threatLower.includes('virus')) return 'VIRUS';
  if (threatLower.includes('trojan')) return 'TROJAN';
  if (threatLower.includes('worm')) return 'WORM';
  if (threatLower.includes('spyware')) return 'SPYWARE';
  if (threatLower.includes('adware')) return 'ADWARE';
  if (threatLower.includes('ransom')) return 'RANSOMWARE';
  if (threatLower.includes('macro')) return 'MACRO';
  if (threatLower.includes('exploit')) return 'EXPLOIT';
  if (threatLower.includes('suspicious')) return 'SUSPICIOUS';
  if (threatLower.includes('heuristic')) return 'HEURISTIC';
  
  return 'UNKNOWN';
}

/**
 * Quarantine a suspicious file
 * @param {Buffer} data - File data
 * @param {string} fileId - File ID
 * @param {string} reason - Quarantine reason
 * @returns {Promise<string>} Quarantine file path
 */
async function quarantineFile(data, fileId, reason = 'SUSPICIOUS') {
  try {
    const quarantineDir = process.env.QUARANTINE_PATH || './quarantine';
    await fs.ensureDir(quarantineDir);
    
    const quarantineFile = path.join(quarantineDir, `quarantine_${fileId}_${Date.now()}.encrypted`);
    
    // Encrypt the quarantined file
    const { encryptFile } = require('./encryption');
    const { encrypted } = await encryptFile(data);
    
    await fs.writeFile(quarantineFile, encrypted);
    
    logger.info(`File quarantined: ${quarantineFile} (Reason: ${reason})`);
    
    auditLogger.logSecurityIncident('FILE_QUARANTINED', {
      fileId: fileId,
      quarantinePath: quarantineFile,
      reason: reason
    });
    
    return quarantineFile;
  } catch (error) {
    logger.error('Failed to quarantine file:', error);
    throw error;
  }
}

/**
 * Clean quarantined file
 * @param {string} quarantinePath - Path to quarantined file
 * @returns {Promise<boolean>} Success status
 */
async function cleanQuarantine(quarantinePath) {
  try {
    if (await fs.pathExists(quarantinePath)) {
      // Securely overwrite the file before deletion
      const stats = await fs.stat(quarantinePath);
      const fileSize = stats.size;
      
      // Overwrite with random data multiple times
      for (let i = 0; i < 3; i++) {
        const randomData = crypto.randomBytes(fileSize);
        await fs.writeFile(quarantinePath, randomData);
      }
      
      // Delete the file
      await fs.remove(quarantinePath);
      
      logger.info(`Quarantined file cleaned: ${quarantinePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to clean quarantined file:', error);
    return false;
  }
}

/**
 * Get antivirus statistics
 * @returns {Promise<Object>} Statistics
 */
async function getAntivirusStats() {
  try {
    if (!isInitialized) {
      return {
        enabled: false,
        engine: 'none',
        lastUpdate: null,
        signatures: 0
      };
    }
    
    // Get ClamAV statistics
    const clamscanVersion = await checkClamAVInstallation();
    
    return {
      enabled: true,
      engine: 'clamav',
      version: clamscanVersion,
      lastUpdate: new Date().toISOString(),
      initialized: isInitialized
    };
  } catch (error) {
    logger.error('Failed to get antivirus stats:', error);
    return {
      enabled: false,
      engine: 'unknown',
      error: error.message
    };
  }
}

/**
 * Update virus definitions
 * @returns {Promise<boolean>} Success status
 */
async function updateDefinitions() {
  try {
    if (!isInitialized) {
      logger.warn('Antivirus not initialized, cannot update definitions');
      return false;
    }
    
    // Run freshclam to update virus definitions
    return new Promise((resolve) => {
      const freshclam = spawn('freshclam', [], {
        timeout: 300000 // 5 minutes timeout
      });
      
      freshclam.on('close', (code) => {
        if (code === 0) {
          logger.info('Virus definitions updated successfully');
          resolve(true);
        } else {
          logger.error(`Failed to update virus definitions (exit code: ${code})`);
          resolve(false);
        }
      });
      
      freshclam.on('error', (error) => {
        logger.error('Error updating virus definitions:', error);
        resolve(false);
      });
    });
  } catch (error) {
    logger.error('Update definitions error:', error);
    return false;
  }
}

// Graceful shutdown
async function shutdown() {
  if (clamav) {
    try {
      await clamav.close();
      logger.info('ClamAV connection closed');
    } catch (error) {
      logger.error('Error closing ClamAV connection:', error);
    }
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = {
  initializeClamAV,
  virusScan,
  quarantineFile,
  cleanQuarantine,
  getAntivirusStats,
  updateDefinitions,
  shutdown
};