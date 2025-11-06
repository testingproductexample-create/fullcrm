const cron = require('node-cron');
const winston = require('winston');
const { File, FileShare, AuditLog, Quarantine } = require('../models');
const { fileStorage } = require('./storage');
const { auditLogger } = require('./audit');
const { Op } = require('sequelize');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/cleanup.log' }),
    new winston.transports.Console()
  ]
});

class CleanupService {
  constructor() {
    this.isRunning = false;
    this.tasks = [];
  }

  /**
   * Setup all cleanup tasks
   */
  async setupCleanup() {
    try {
      logger.info('Setting up cleanup tasks...');

      // Clean up expired file shares every hour
      this.tasks.push(
        cron.schedule('0 * * * *', () => {
          this.cleanupExpiredShares();
        }, {
          scheduled: false
        })
      );

      // Clean up expired files daily at 2 AM
      this.tasks.push(
        cron.schedule('0 2 * * *', () => {
          this.cleanupExpiredFiles();
        }, {
          scheduled: false
        })
      );

      // Clean up old audit logs weekly on Sunday at 3 AM
      this.tasks.push(
        cron.schedule('0 3 * * 0', () => {
          this.cleanupOldAuditLogs();
        }, {
          scheduled: false
        })
      );

      // Clean up orphaned files daily at 1 AM
      this.tasks.push(
        cron.schedule('0 1 * * *', () => {
          this.cleanupOrphanedFiles();
        }, {
          scheduled: false
        })
      );

      // Clean up temporary files hourly
      this.tasks.push(
        cron.schedule('15 * * * *', () => {
          this.cleanupTempFiles();
        }, {
          scheduled: false
        })
      );

      // Clean up quarantine daily at 4 AM
      this.tasks.push(
        cron.schedule('0 4 * * *', () => {
          this.cleanupQuarantine();
        }, {
          scheduled: false
        })
      );

      // Update antivirus definitions daily at 5 AM
      this.tasks.push(
        cron.schedule('0 5 * * *', () => {
          this.updateAntivirusDefinitions();
        }, {
          scheduled: false
        })
      );

      // Storage quota check daily at 6 AM
      this.tasks.push(
        cron.schedule('0 6 * * *', () => {
          this.checkStorageQuota();
        }, {
          scheduled: false
        })
      );

      // Start all tasks
      this.startAllTasks();

      logger.info(`Cleanup service initialized with ${this.tasks.length} tasks`);
      
    } catch (error) {
      logger.error('Failed to setup cleanup tasks:', error);
      throw error;
    }
  }

  /**
   * Start all cleanup tasks
   */
  startAllTasks() {
    this.tasks.forEach(task => {
      task.start();
    });
    this.isRunning = true;
    logger.info('All cleanup tasks started');
  }

  /**
   * Stop all cleanup tasks
   */
  stopAllTasks() {
    this.tasks.forEach(task => {
      task.stop();
    });
    this.isRunning = false;
    logger.info('All cleanup tasks stopped');
  }

  /**
   * Clean up expired file shares
   */
  async cleanupExpiredShares() {
    try {
      logger.info('Starting cleanup of expired file shares...');
      
      const expiredShares = await FileShare.findAll({
        where: {
          expiresAt: { [Op.lt]: new Date() },
          isActive: true
        },
        include: [{
          model: File,
          attributes: ['id', 'originalName']
        }]
      });

      if (expiredShares.length === 0) {
        logger.info('No expired shares found');
        return;
      }

      let cleaned = 0;
      for (const share of expiredShares) {
        try {
          await share.update({ isActive: false });
          cleaned++;
          
          auditLogger.logEvent('EXPIRED_SHARE_CLEANED', {
            shareId: share.id,
            fileId: share.fileId,
            fileName: share.File?.originalName
          });
          
        } catch (error) {
          logger.error(`Failed to clean share ${share.id}:`, error);
        }
      }

      logger.info(`Cleaned up ${cleaned} expired file shares`);

    } catch (error) {
      logger.error('Cleanup expired shares error:', error);
    }
  }

  /**
   * Clean up expired files
   */
  async cleanupExpiredFiles() {
    try {
      logger.info('Starting cleanup of expired files...');
      
      const expiredFiles = await File.findAll({
        where: {
          expiresAt: { [Op.lt]: new Date() },
          deletedAt: null
        }
      });

      if (expiredFiles.length === 0) {
        logger.info('No expired files found');
        return;
      }

      let cleaned = 0;
      for (const file of expiredFiles) {
        try {
          // Securely delete the file
          if (file.encryptedPath) {
            await fileStorage.deleteSecurely(file.encryptedPath);
          }

          // Delete thumbnail if exists
          if (file.thumbnailPath) {
            await fileStorage.deleteThumbnail(file.id);
          }

          // Soft delete from database
          await file.destroy();

          cleaned++;
          
          auditLogger.logEvent('EXPIRED_FILE_CLEANED', {
            fileId: file.id,
            fileName: file.originalName,
            size: file.size
          });
          
        } catch (error) {
          logger.error(`Failed to clean file ${file.id}:`, error);
        }
      }

      logger.info(`Cleaned up ${cleaned} expired files`);

    } catch (error) {
      logger.error('Cleanup expired files error:', error);
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldAuditLogs() {
    try {
      logger.info('Starting cleanup of old audit logs...');
      
      const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS) || 90;
      const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
      
      // Keep security incidents longer
      const securityRetentionDays = parseInt(process.env.SECURITY_AUDIT_RETENTION_DAYS) || 365;
      const securityCutoffDate = new Date(Date.now() - (securityRetentionDays * 24 * 60 * 60 * 1000));

      // Delete old non-security audit logs
      const deletedNonSecurity = await AuditLog.destroy({
        where: {
          createdAt: { [Op.lt]: cutoffDate },
          isSecurityIncident: false
        }
      });

      // Delete old security audit logs
      const deletedSecurity = await AuditLog.destroy({
        where: {
          createdAt: { [Op.lt]: securityCutoffDate },
          isSecurityIncident: true,
          isResolved: true
        }
      });

      const totalDeleted = deletedNonSecurity + deletedSecurity;
      
      if (totalDeleted > 0) {
        auditLogger.logEvent('AUDIT_LOGS_CLEANED', {
          deletedNonSecurity: deletedNonSecurity,
          deletedSecurity: deletedSecurity,
          totalDeleted: totalDeleted,
          retentionDays: retentionDays,
          securityRetentionDays: securityRetentionDays
        });
      }

      logger.info(`Cleaned up ${totalDeleted} old audit logs (${deletedNonSecurity} non-security, ${deletedSecurity} security)`);

    } catch (error) {
      logger.error('Cleanup old audit logs error:', error);
    }
  }

  /**
   * Clean up orphaned files (files without corresponding user records)
   */
  async cleanupOrphanedFiles() {
    try {
      logger.info('Starting cleanup of orphaned files...');
      
      // This is a complex operation that would require database-specific queries
      // For now, we'll just log the intent
      logger.info('Orphaned files cleanup skipped (requires custom query)');

    } catch (error) {
      logger.error('Cleanup orphaned files error:', error);
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles() {
    try {
      const fs = require('fs-extra');
      const path = require('path');
      const tempPath = process.env.TEMP_PATH || './temp';
      
      logger.info('Starting cleanup of temporary files...');
      
      if (!await fs.pathExists(tempPath)) {
        logger.info('Temp directory does not exist');
        return;
      }

      const files = await fs.readdir(tempPath);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      let cleaned = 0;
      for (const file of files) {
        try {
          const filePath = path.join(tempPath, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.remove(filePath);
            cleaned++;
          }
        } catch (error) {
          logger.warn(`Failed to clean temp file ${file}:`, error);
        }
      }

      if (cleaned > 0) {
        auditLogger.logEvent('TEMP_FILES_CLEANED', {
          cleanedFiles: cleaned,
          tempPath: tempPath
        });
      }

      logger.info(`Cleaned up ${cleaned} temporary files`);

    } catch (error) {
      logger.error('Cleanup temp files error:', error);
    }
  }

  /**
   * Clean up quarantine
   */
  async cleanupQuarantine() {
    try {
      logger.info('Starting cleanup of quarantine...');
      
      const retentionDays = parseInt(process.env.QUARANTINE_RETENTION_DAYS) || 30;
      const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
      
      const oldQuarantinedFiles = await Quarantine.findAll({
        where: {
          createdAt: { [Op.lt]: cutoffDate },
          isResolved: true
        }
      });

      if (oldQuarantinedFiles.length === 0) {
        logger.info('No resolved quarantined files older than retention period');
        return;
      }

      let cleaned = 0;
      for (const quarantine of oldQuarantinedFiles) {
        try {
          // Clean up the quarantined file
          if (quarantine.quarantinePath) {
            await fileStorage.deleteSecurely(quarantine.quarantinePath);
          }

          // Delete quarantine record
          await quarantine.destroy();

          cleaned++;
          
        } catch (error) {
          logger.error(`Failed to clean quarantine ${quarantine.id}:`, error);
        }
      }

      logger.info(`Cleaned up ${cleaned} old quarantined files`);

    } catch (error) {
      logger.error('Cleanup quarantine error:', error);
    }
  }

  /**
   * Update antivirus definitions
   */
  async updateAntivirusDefinitions() {
    try {
      logger.info('Starting antivirus definition update...');
      
      const { updateDefinitions } = require('./antivirus');
      const success = await updateDefinitions();
      
      if (success) {
        auditLogger.logEvent('ANTIVIRUS_DEFINITIONS_UPDATED');
        logger.info('Antivirus definitions updated successfully');
      } else {
        logger.warn('Failed to update antivirus definitions');
      }

    } catch (error) {
      logger.error('Update antivirus definitions error:', error);
    }
  }

  /**
   * Check storage quota
   */
  async checkStorageQuota() {
    try {
      logger.info('Checking storage quota...');
      
      const stats = await fileStorage.getStorageStats();
      const quotaPercentage = (stats.usedSpace / stats.quota) * 100;
      
      if (quotaPercentage > 90) {
        logger.warn(`Storage quota exceeded: ${quotaPercentage.toFixed(2)}% used`);
        
        auditLogger.logSecurityIncident('STORAGE_QUOTA_HIGH', {
          usedSpace: stats.usedSpace,
          totalSpace: stats.quota,
          usagePercentage: quotaPercentage
        });

        // Trigger cleanup if quota is critically high
        if (quotaPercentage > 95) {
          logger.warn('Storage quota critically high, triggering emergency cleanup');
          await this.emergencyCleanup();
        }
        
      } else {
        logger.info(`Storage quota: ${quotaPercentage.toFixed(2)}% used`);
      }

    } catch (error) {
      logger.error('Check storage quota error:', error);
    }
  }

  /**
   * Emergency cleanup for critical storage situations
   */
  async emergencyCleanup() {
    try {
      logger.info('Starting emergency cleanup...');
      
      // Clean up old files first
      await this.cleanupExpiredFiles();
      
      // Clean up old audit logs
      await this.cleanupOldAuditLogs();
      
      // Clean up resolved quarantined files
      await this.cleanupQuarantine();
      
      // Clean up temp files
      await this.cleanupTempFiles();
      
      auditLogger.logEvent('EMERGENCY_CLEANUP_PERFORMED');
      logger.info('Emergency cleanup completed');

    } catch (error) {
      logger.error('Emergency cleanup error:', error);
    }
  }

  /**
   * Run manual cleanup
   * @param {string} type - Cleanup type
   * @param {Object} options - Cleanup options
   */
  async runManualCleanup(type, options = {}) {
    try {
      logger.info(`Running manual cleanup: ${type}`);
      
      switch (type) {
        case 'expired-shares':
          await this.cleanupExpiredShares();
          break;
        case 'expired-files':
          await this.cleanupExpiredFiles();
          break;
        case 'old-audit-logs':
          await this.cleanupOldAuditLogs();
          break;
        case 'orphaned-files':
          await this.cleanupOrphanedFiles();
          break;
        case 'temp-files':
          await this.cleanupTempFiles();
          break;
        case 'quarantine':
          await this.cleanupQuarantine();
          break;
        case 'antivirus-definitions':
          await this.updateAntivirusDefinitions();
          break;
        case 'storage-quota':
          await this.checkStorageQuota();
          break;
        case 'emergency':
          await this.emergencyCleanup();
          break;
        case 'all':
          // Run all cleanup tasks
          await this.cleanupExpiredShares();
          await this.cleanupExpiredFiles();
          await this.cleanupOldAuditLogs();
          await this.cleanupOrphanedFiles();
          await this.cleanupTempFiles();
          await this.cleanupQuarantine();
          await this.updateAntivirusDefinitions();
          await this.checkStorageQuota();
          break;
        default:
          throw new Error(`Unknown cleanup type: ${type}`);
      }
      
      auditLogger.logEvent('MANUAL_CLEANUP_PERFORMED', {
        type: type,
        options: options
      });
      
      logger.info(`Manual cleanup completed: ${type}`);
      
    } catch (error) {
      logger.error(`Manual cleanup error (${type}):`, error);
      throw error;
    }
  }

  /**
   * Get cleanup service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: this.tasks.filter(task => task.getStatus().isRunning).length,
      totalTasks: this.tasks.length,
      uptime: process.uptime()
    };
  }
}

// Create singleton instance
const cleanupService = new CleanupService();

module.exports = {
  setupCleanup: () => cleanupService.setupCleanup(),
  runManualCleanup: (type, options) => cleanupService.runManualCleanup(type, options),
  getCleanupStatus: () => cleanupService.getStatus(),
  stopCleanup: () => cleanupService.stopAllTasks()
};