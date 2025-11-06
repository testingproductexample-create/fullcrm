const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const winston = require('winston');
const { auditLogger } = require('./audit');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/storage.log' }),
    new winston.transports.Console()
  ]
});

class FileStorageService {
  constructor() {
    this.basePath = process.env.STORAGE_PATH || './secure_storage';
    this.quarantinePath = process.env.QUARANTINE_PATH || './quarantine';
    this.thumbnailPath = process.env.THUMBNAIL_PATH || './thumbnails';
    this.tempPath = process.env.TEMP_PATH || './temp';
    
    this.diskQuota = parseInt(process.env.DISK_QUOTA) || 1024 * 1024 * 1024; // 1GB default
    this.fileRetentionDays = parseInt(process.env.FILE_RETENTION_DAYS) || 365;
    
    this.initializeDirectories();
  }

  /**
   * Initialize storage directories
   */
  async initializeDirectories() {
    try {
      await fs.ensureDir(this.basePath);
      await fs.ensureDir(this.quarantinePath);
      await fs.ensureDir(this.thumbnailPath);
      await fs.ensureDir(this.tempPath);
      
      logger.info('Storage directories initialized');
    } catch (error) {
      logger.error('Failed to initialize storage directories:', error);
      throw error;
    }
  }

  /**
   * Store encrypted file
   * @param {string} filename - Encrypted filename
   * @param {Buffer} encryptedData - Encrypted file data
   * @returns {Promise<string>} File path
   */
  async storeEncrypted(filename, encryptedData) {
    try {
      // Check disk space before storing
      await this.checkDiskSpace(encryptedData.length);
      
      const filePath = path.join(this.basePath, filename);
      await fs.writeFile(filePath, encryptedData);
      
      // Log storage event
      logger.info(`File stored: ${filename} (${encryptedData.length} bytes)`);
      
      return filePath;
    } catch (error) {
      logger.error(`Failed to store file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Read encrypted file
   * @param {string} filePath - Path to encrypted file
   * @returns {Promise<Buffer>} Encrypted file data
   */
  async readEncrypted(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const data = await fs.readFile(filePath);
      logger.info(`File read: ${filePath} (${data.length} bytes)`);
      
      return data;
    } catch (error) {
      logger.error(`Failed to read file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Delete file securely
   * @param {string} filePath - Path to file to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteSecurely(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        logger.warn(`File not found for deletion: ${filePath}`);
        return false;
      }
      
      // Get file size
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;
      
      // Overwrite file with random data multiple times
      const overwriteCount = 3;
      for (let i = 0; i < overwriteCount; i++) {
        const randomData = crypto.randomBytes(fileSize);
        await fs.writeFile(filePath, randomData);
        
        // Force sync to disk
        await fs.fsync(filePath);
      }
      
      // Delete the file
      await fs.remove(filePath);
      
      logger.info(`File securely deleted: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Failed to securely delete file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Store file thumbnail
   * @param {string} fileId - File ID
   * @param {Buffer} thumbnailData - Thumbnail image data
   * @returns {Promise<string>} Thumbnail path
   */
  async storeThumbnail(fileId, thumbnailData) {
    try {
      const thumbnailFilename = `${fileId}_thumb.jpg`;
      const thumbnailPath = path.join(this.thumbnailPath, thumbnailFilename);
      
      await fs.writeFile(thumbnailPath, thumbnailData);
      
      logger.info(`Thumbnail stored: ${thumbnailFilename}`);
      return thumbnailPath;
    } catch (error) {
      logger.error(`Failed to store thumbnail for ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Get file thumbnail
   * @param {string} fileId - File ID
   * @returns {Promise<Buffer|null>} Thumbnail data or null
   */
  async getThumbnail(fileId) {
    try {
      const thumbnailFilename = `${fileId}_thumb.jpg`;
      const thumbnailPath = path.join(this.thumbnailPath, thumbnailFilename);
      
      if (await fs.pathExists(thumbnailPath)) {
        return await fs.readFile(thumbnailPath);
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to get thumbnail for ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Delete file thumbnail
   * @param {string} fileId - File ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteThumbnail(fileId) {
    try {
      const thumbnailFilename = `${fileId}_thumb.jpg`;
      const thumbnailPath = path.join(this.thumbnailPath, thumbnailFilename);
      
      if (await fs.pathExists(thumbnailPath)) {
        await fs.remove(thumbnailPath);
        logger.info(`Thumbnail deleted: ${thumbnailFilename}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Failed to delete thumbnail for ${fileId}:`, error);
      return false;
    }
  }

  /**
   * Quarantine a file
   * @param {string} filePath - Path to file to quarantine
   * @param {string} fileId - File ID for naming
   * @returns {Promise<string>} Quarantine file path
   */
  async quarantineFile(filePath, fileId) {
    try {
      const quarantineFilename = `quarantine_${fileId}_${Date.now()}.encrypted`;
      const quarantineFilePath = path.join(this.quarantinePath, quarantineFilename);
      
      // Move file to quarantine
      await fs.move(filePath, quarantineFilePath, { overwrite: true });
      
      logger.info(`File quarantined: ${filePath} -> ${quarantineFilePath}`);
      
      auditLogger.logSecurityIncident('FILE_QUARANTINED', {
        fileId: fileId,
        originalPath: filePath,
        quarantinePath: quarantineFilePath
      });
      
      return quarantineFilePath;
    } catch (error) {
      logger.error(`Failed to quarantine file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      const stats = await fs.stat(this.basePath);
      const files = await this.getDirectorySize(this.basePath);
      
      const totalSpace = await this.getTotalSpace();
      const freeSpace = await this.getFreeSpace();
      const usedSpace = totalSpace - freeSpace;
      
      return {
        totalSpace: totalSpace,
        freeSpace: freeSpace,
        usedSpace: usedSpace,
        usagePercentage: (usedSpace / totalSpace) * 100,
        quota: this.diskQuota,
        fileCount: files.count,
        totalSize: files.size,
        storagePath: this.basePath
      };
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Clean up expired files
   * @param {Date} cutoffDate - Files older than this date will be deleted
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupExpiredFiles(cutoffDate = null) {
    if (!cutoffDate) {
      cutoffDate = new Date(Date.now() - (this.fileRetentionDays * 24 * 60 * 60 * 1000));
    }
    
    try {
      const results = {
        filesDeleted: 0,
        spaceFreed: 0,
        errors: []
      };
      
      // This would typically be implemented with database queries
      // For now, we'll just log the cleanup action
      logger.info(`Cleanup scheduled for files older than: ${cutoffDate.toISOString()}`);
      
      return results;
    } catch (error) {
      logger.error('Cleanup expired files error:', error);
      throw error;
    }
  }

  /**
   * Get directory size and file count
   * @param {string} dirPath - Directory path
   * @returns {Promise<Object>} Size and count
   */
  async getDirectorySize(dirPath) {
    try {
      const items = await fs.readdir(dirPath);
      let totalSize = 0;
      let count = 0;
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isFile()) {
          totalSize += stats.size;
          count++;
        } else if (stats.isDirectory()) {
          const subDir = await this.getDirectorySize(itemPath);
          totalSize += subDir.size;
          count += subDir.count;
        }
      }
      
      return { size: totalSize, count: count };
    } catch (error) {
      return { size: 0, count: 0 };
    }
  }

  /**
   * Get total disk space
   * @returns {Promise<number>} Total space in bytes
   */
  async getTotalSpace() {
    try {
      const stats = await fs.stat(this.basePath);
      // This is a simplified implementation
      // In a real system, you'd use system calls to get actual disk space
      return this.diskQuota;
    } catch (error) {
      return this.diskQuota;
    }
  }

  /**
   * Get free disk space
   * @returns {Promise<number>} Free space in bytes
   */
  async getFreeSpace() {
    try {
      const stats = await this.getStorageStats();
      return Math.max(0, stats.totalSpace - stats.usedSpace);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if there's enough disk space
   * @param {number} requiredSpace - Required space in bytes
   * @returns {Promise<boolean>} True if enough space
   */
  async checkDiskSpace(requiredSpace) {
    try {
      const freeSpace = await this.getFreeSpace();
      
      if (freeSpace < requiredSpace) {
        const error = new Error(`Insufficient disk space. Required: ${requiredSpace}, Available: ${freeSpace}`);
        logger.error(error.message);
        throw error;
      }
      
      return true;
    } catch (error) {
      if (error.code === 'ENOSPC') {
        auditLogger.logSecurityIncident('DISK_FULL', {
          requiredSpace: requiredSpace,
          freeSpace: await this.getFreeSpace()
        });
      }
      throw error;
    }
  }

  /**
   * Create backup of storage
   * @param {string} backupPath - Path to backup directory
   * @returns {Promise<string>} Backup ID
   */
  async createBackup(backupPath = null) {
    try {
      if (!backupPath) {
        backupPath = path.join(this.basePath, '..', `backup_${Date.now()}`);
      }
      
      await fs.ensureDir(backupPath);
      
      // Copy all files to backup directory
      await fs.copy(this.basePath, backupPath);
      
      const backupId = path.basename(backupPath);
      
      logger.info(`Storage backup created: ${backupId}`);
      
      auditLogger.logEvent('STORAGE_BACKUP_CREATED', {
        backupId: backupId,
        backupPath: backupPath
      });
      
      return backupId;
    } catch (error) {
      logger.error('Failed to create storage backup:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup ID to restore
   * @returns {Promise<boolean>} Success status
   */
  async restoreBackup(backupId) {
    try {
      const backupPath = path.join(this.basePath, '..', backupId);
      
      if (!await fs.pathExists(backupPath)) {
        throw new Error(`Backup not found: ${backupId}`);
      }
      
      // Create current state backup before restore
      const tempBackupId = await this.createBackup(`pre_restore_${Date.now()}`);
      
      // Clear current storage
      await fs.emptyDir(this.basePath);
      
      // Restore from backup
      await fs.copy(backupPath, this.basePath);
      
      logger.info(`Storage restored from backup: ${backupId}`);
      
      auditLogger.logEvent('STORAGE_BACKUP_RESTORED', {
        backupId: backupId,
        preRestoreBackup: tempBackupId
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to restore backup ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Verify file integrity
   * @param {string} filePath - Path to file to verify
   * @param {string} expectedHash - Expected SHA-256 hash
   * @returns {Promise<boolean>} True if hash matches
   */
  async verifyFileIntegrity(filePath, expectedHash) {
    try {
      const data = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      
      return hash === expectedHash;
    } catch (error) {
      logger.error(`Failed to verify file integrity ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Get file metadata
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        permissions: stats.mode.toString(8)
      };
    } catch (error) {
      logger.error(`Failed to get file metadata ${filePath}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const fileStorage = new FileStorageService();

module.exports = {
  fileStorage,
  FileStorageService
};