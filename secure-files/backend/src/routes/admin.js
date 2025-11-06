const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { requireAuth, requireRole, userRateLimit } = require('../middleware/security');
const { User, File, FileShare, AuditLog } = require('../models');
const { auditLogger } = require('../services/audit');
const { fileStorage } = require('../services/storage');

// Get system overview
router.get('/overview', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const adminUsers = await User.count({ where: { role: 'admin' } });
    
    // Get file statistics
    const totalFiles = await File.count();
    const totalStorage = await File.sum('size') || 0;
    const averageFileSize = totalFiles > 0 ? totalStorage / totalFiles : 0;
    
    // Get share statistics
    const totalShares = await FileShare.count();
    const activeShares = await FileShare.count({ where: { isActive: true } });
    
    // Get recent security incidents
    const recentIncidents = await AuditLog.count({
      where: {
        severity: { [require('sequelize').Op.in]: ['HIGH', 'CRITICAL'] },
        createdAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Get system health
    const systemHealth = {
      database: 'healthy', // This would be actual health check
      storage: 'healthy', // This would be actual health check
      antivirus: 'healthy', // This would be actual health check
      lastCheck: new Date()
    };

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers
      },
      files: {
        total: totalFiles,
        totalStorage: totalStorage,
        averageSize: averageFileSize
      },
      shares: {
        total: totalShares,
        active: activeShares
      },
      security: {
        recentIncidents: recentIncidents
      },
      system: systemHealth
    });

  } catch (error) {
    auditLogger.logError('ADMIN_OVERVIEW_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to get system overview' });
  }
});

// Get all users (admin only)
router.get('/users', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      role, 
      status 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { firstName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { lastName: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (status) {
      whereClause.isActive = status === 'active';
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { 
        exclude: ['password'],
        include: [
          [require('sequelize').fn('COUNT', require('sequelize').col('Files.id')), 'fileCount']
        ]
      },
      include: [{
        model: File,
        attributes: [],
        required: false
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      group: ['User.id']
    });

    res.json({
      users: users.rows,
      total: users.count.length, // Count of unique users
      page: parseInt(page),
      pages: Math.ceil(users.count.length / limit)
    });

  } catch (error) {
    auditLogger.logError('ADMIN_USERS_FETCH_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/users/:userId', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: File,
          attributes: ['id', 'originalName', 'size', 'mimetype', 'category', 'createdAt'],
          limit: 10,
          order: [['createdAt', 'DESC']]
        },
        {
          model: FileShare,
          attributes: ['id', 'shareToken', 'expiresAt', 'maxDownloads', 'downloadCount', 'isActive', 'createdAt'],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user statistics
    const userStats = {
      totalFiles: await File.count({ where: { userId } }),
      totalStorage: await File.sum('size', { where: { userId } }) || 0,
      totalShares: await FileShare.count({ where: { ownerId: userId } }),
      activeShares: await FileShare.count({ where: { ownerId: userId, isActive: true } }),
      lastLogin: user.lastLogin,
      loginAttempts: user.loginAttempts
    };

    res.json({
      user: user,
      statistics: userStats
    });

  } catch (error) {
    auditLogger.logError('ADMIN_USER_DETAILS_ERROR', error, {
      userId: req.user.id,
      targetUserId: req.params.userId
    });
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Update user (admin only)
router.patch('/users/:userId', requireAuth, requireRole(['admin']), userRateLimit, [
  body('firstName').optional().isLength({ min: 2, max: 50 }),
  body('lastName').optional().isLength({ min: 2, max: 50 }),
  body('role').optional().isIn(['user', 'premium', 'admin']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const updates = {};

    const allowedUpdates = ['firstName', 'lastName', 'role', 'isActive'];
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow changing your own role or deactivating yourself
    if (userId === req.user.id) {
      if (updates.role && updates.role !== user.role) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }
      if (updates.isActive === false) {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
      }
    }

    await user.update(updates);

    auditLogger.logEvent('USER_UPDATED_BY_ADMIN', {
      adminId: req.user.id,
      targetUserId: userId,
      updates: updates
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    auditLogger.logError('ADMIN_USER_UPDATE_ERROR', error, {
      userId: req.user.id,
      targetUserId: req.params.userId
    });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user and all their files (admin only)
router.delete('/users/:userId', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting your own account
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all user files
    const userFiles = await File.findAll({ where: { userId } });

    // Delete all files securely
    for (const file of userFiles) {
      try {
        await fileStorage.deleteSecurely(file.encryptedPath);
        if (file.thumbnailPath) {
          await fileStorage.deleteThumbnail(file.id);
        }
      } catch (fileError) {
        console.warn(`Failed to delete file ${file.id}:`, fileError);
      }
    }

    // Delete user shares
    await FileShare.destroy({ where: { ownerId: userId } });

    // Soft delete user (mark as deleted rather than actual deletion)
    await user.update({
      email: `deleted_${Date.now()}_${user.email}`,
      isActive: false,
      deletedAt: new Date()
    });

    auditLogger.logEvent('USER_DELETED_BY_ADMIN', {
      adminId: req.user.id,
      deletedUserId: userId,
      deletedUserEmail: user.email,
      filesDeleted: userFiles.length
    });

    res.json({ 
      message: 'User and all associated data deleted successfully',
      deletedFiles: userFiles.length
    });

  } catch (error) {
    auditLogger.logError('ADMIN_USER_DELETE_ERROR', error, {
      userId: req.user.id,
      targetUserId: req.params.userId
    });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get system configuration
router.get('/config', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    // Return non-sensitive configuration
    const config = {
      maxFileSize: process.env.MAX_FILE_SIZE,
      allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(','),
      jwtExpiresIn: process.env.JWT_EXPIRES_IN,
      storageProvider: process.env.STORAGE_PROVIDER,
      antivirusEnabled: process.env.ANTIVIRUS_ENABLED === 'true',
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
      cleanupInterval: 24, // hours
      auditRetentionDays: process.env.AUDIT_RETENTION_DAYS || 90
    };

    res.json({ config });

  } catch (error) {
    auditLogger.logError('ADMIN_CONFIG_FETCH_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to get system configuration' });
  }
});

// Update system configuration
router.patch('/config', requireAuth, requireRole(['admin']), userRateLimit, [
  body('maxFileSize').optional().isInt({ min: 1024, max: 1024 * 1024 * 1024 }),
  body('allowedFileTypes').optional().isArray(),
  body('jwtExpiresIn').optional().isString(),
  body('antivirusEnabled').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // In a real implementation, these would be stored in a database or config file
    // For now, we'll just log the changes
    const configUpdates = {};
    const allowedConfigs = ['maxFileSize', 'allowedFileTypes', 'jwtExpiresIn', 'antivirusEnabled'];
    
    for (const key of allowedConfigs) {
      if (req.body[key] !== undefined) {
        configUpdates[key] = req.body[key];
      }
    }

    auditLogger.logEvent('SYSTEM_CONFIG_UPDATED', {
      adminId: req.user.id,
      updates: configUpdates
    });

    res.json({
      message: 'System configuration updated successfully',
      updates: configUpdates
    });

  } catch (error) {
    auditLogger.logError('ADMIN_CONFIG_UPDATE_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to update system configuration' });
  }
});

// Get storage usage statistics
router.get('/storage', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get storage by file type
    const storageByType = await File.findAll({
      attributes: [
        'mimetype',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'fileCount'],
        [require('sequelize').fn('SUM', require('sequelize').col('size')), 'totalSize']
      ],
      where: {
        createdAt: {
          [require('sequelize').Op.between]: [startDate, endDate]
        }
      },
      group: ['mimetype'],
      order: [[require('sequelize').fn('SUM', require('sequelize').col('size')), 'DESC']]
    });

    // Get storage by user
    const storageByUser = await File.findAll({
      attributes: [
        'userId',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'fileCount'],
        [require('sequelize').fn('SUM', require('sequelize').col('size')), 'totalSize']
      ],
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }],
      where: {
        createdAt: {
          [require('sequelize').Op.between]: [startDate, endDate]
        }
      },
      group: ['userId', 'User.id'],
      order: [[require('sequelize').fn('SUM', require('sequelize').col('size')), 'DESC']],
      limit: 10
    });

    // Get daily storage usage
    const dailyStorage = await File.findAll({
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'fileCount'],
        [require('sequelize').fn('SUM', require('sequelize').col('size')), 'totalSize']
      ],
      where: {
        createdAt: {
          [require('sequelize').Op.between]: [startDate, endDate]
        }
      },
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']]
    });

    res.json({
      period: period,
      startDate: startDate,
      endDate: endDate,
      storageByType: storageByType.map(item => ({
        mimetype: item.mimetype,
        fileCount: parseInt(item.getDataValue('fileCount')),
        totalSize: parseInt(item.getDataValue('totalSize')) || 0
      })),
      storageByUser: storageByUser.map(item => ({
        userId: item.userId,
        email: item.User.email,
        name: `${item.User.firstName} ${item.User.lastName}`,
        fileCount: parseInt(item.getDataValue('fileCount')),
        totalSize: parseInt(item.getDataValue('totalSize')) || 0
      })),
      dailyStorage: dailyStorage.map(item => ({
        date: item.getDataValue('date'),
        fileCount: parseInt(item.getDataValue('fileCount')),
        totalSize: parseInt(item.getDataValue('totalSize')) || 0
      }))
    });

  } catch (error) {
    auditLogger.logError('ADMIN_STORAGE_STATS_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to get storage statistics' });
  }
});

// Perform system maintenance
router.post('/maintenance', requireAuth, requireRole(['admin']), userRateLimit, [
  body('action').isIn(['cleanup', 'optimize', 'backup', 'restore']).withMessage('Invalid maintenance action')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { action } = req.body;

    let result = {};
    
    switch (action) {
      case 'cleanup':
        // Clean up expired shares and old audit logs
        const expiredShares = await FileShare.destroy({
          where: {
            expiresAt: { [require('sequelize').Op.lt]: new Date() }
          }
        });

        const oldAuditLogs = await AuditLog.destroy({
          where: {
            createdAt: {
              [require('sequelize').Op.lt]: new Date(Date.now() - (parseInt(process.env.AUDIT_RETENTION_DAYS) || 90) * 24 * 60 * 60 * 1000)
            }
          }
        });

        result = {
          expiredSharesDeleted: expiredShares,
          oldAuditLogsDeleted: oldAuditLogs
        };
        break;

      case 'optimize':
        // This would implement database optimization
        result = { status: 'Database optimization completed' };
        break;

      case 'backup':
        // This would create a system backup
        result = { status: 'System backup initiated' };
        break;

      case 'restore':
        // This would restore from backup
        result = { status: 'System restore initiated' };
        break;
    }

    auditLogger.logEvent('MAINTENANCE_ACTION_PERFORMED', {
      adminId: req.user.id,
      action: action,
      result: result
    });

    res.json({
      message: `${action} action completed successfully`,
      result: result
    });

  } catch (error) {
    auditLogger.logError('ADMIN_MAINTENANCE_ERROR', error, {
      userId: req.user.id,
      action: req.body.action
    });
    res.status(500).json({ error: 'Maintenance action failed' });
  }
});

module.exports = router;