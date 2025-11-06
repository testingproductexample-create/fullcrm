const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();

const { requireAuth, requireRole, userRateLimit } = require('../middleware/security');
const { AuditLog, User, File } = require('../models');
const { auditLogger } = require('../services/audit');

// Get audit logs (admin only)
router.get('/logs', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      eventType, 
      userId, 
      ipAddress, 
      startDate, 
      endDate,
      severity 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Apply filters
    if (eventType) {
      whereClause.eventType = eventType;
    }
    if (userId) {
      whereClause.userId = userId;
    }
    if (ipAddress) {
      whereClause.ipAddress = { [Op.iLike]: `%${ipAddress}%` };
    }
    if (severity) {
      whereClause.severity = severity;
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const logs = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'email', 'firstName', 'lastName', 'role']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    res.json({
      logs: logs.rows,
      total: logs.count,
      page: parseInt(page),
      pages: Math.ceil(logs.count / limit)
    });

  } catch (error) {
    auditLogger.logError('AUDIT_LOGS_FETCH_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get security incidents (admin only)
router.get('/security-incidents', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      incidentType, 
      userId, 
      ipAddress, 
      startDate, 
      endDate,
      resolved 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      severity: { [Op.in]: ['HIGH', 'CRITICAL'] }
    };

    // Apply filters
    if (incidentType) {
      whereClause.eventType = incidentType;
    }
    if (userId) {
      whereClause.userId = userId;
    }
    if (ipAddress) {
      whereClause.ipAddress = { [Op.iLike]: `%${ipAddress}%` };
    }
    if (resolved !== undefined) {
      whereClause.isResolved = resolved === 'true';
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const incidents = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'email', 'firstName', 'lastName', 'role']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    res.json({
      incidents: incidents.rows,
      total: incidents.count,
      page: parseInt(page),
      pages: Math.ceil(incidents.count / limit)
    });

  } catch (error) {
    auditLogger.logError('SECURITY_INCIDENTS_FETCH_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch security incidents' });
  }
});

// Get user activity log
router.get('/user-activity/:userId', requireAuth, userRateLimit, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    // Check if user is viewing their own activity or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const offset = (page - 1) * limit;
    const whereClause = { userId: userId };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const activities = await AuditLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      activities: activities.rows,
      total: activities.count,
      page: parseInt(page),
      pages: Math.ceil(activities.count / limit)
    });

  } catch (error) {
    auditLogger.logError('USER_ACTIVITY_FETCH_ERROR', error, { 
      userId: req.user.id,
      targetUserId: req.params.userId 
    });
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// Get file access history
router.get('/file-access/:fileId', requireAuth, userRateLimit, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if user owns the file or is admin
    const file = await File.findByPk(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const offset = (page - 1) * limit;
    const whereClause = {
      [Op.or]: [
        { eventType: 'FILE_DOWNLOADED' },
        { eventType: 'FILE_SHARED' },
        { eventType: 'SHARE_FILE_DOWNLOADED' }
      ]
    };

    if (req.user.role !== 'admin') {
      whereClause.userId = req.user.id;
    }

    const accessHistory = await AuditLog.findAndCountAll({
      where: {
        ...whereClause,
        resourceId: fileId
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      accessHistory: accessHistory.rows,
      total: accessHistory.count,
      page: parseInt(page),
      pages: Math.ceil(accessHistory.count / limit)
    });

  } catch (error) {
    auditLogger.logError('FILE_ACCESS_HISTORY_ERROR', error, {
      userId: req.user.id,
      fileId: req.params.fileId
    });
    res.status(500).json({ error: 'Failed to fetch file access history' });
  }
});

// Get system statistics
router.get('/statistics', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '1d':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
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
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get event counts by type
    const eventCounts = await AuditLog.findAll({
      attributes: [
        'eventType',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['eventType'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']]
    });

    // Get security incidents by type
    const securityIncidents = await AuditLog.findAll({
      attributes: [
        'eventType',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: {
        severity: { [Op.in]: ['HIGH', 'CRITICAL'] },
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['eventType'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']]
    });

    // Get top users by activity
    const topUsers = await AuditLog.findAll({
      attributes: [
        'userId',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'activityCount']
      ],
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }],
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        userId: { [Op.not]: null }
      },
      group: ['userId', 'User.id'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
      limit: 10
    });

    // Get daily activity
    const dailyActivity = await AuditLog.findAll({
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']]
    });

    res.json({
      period: period,
      startDate: startDate,
      endDate: endDate,
      eventCounts: eventCounts.reduce((acc, event) => {
        acc[event.eventType] = parseInt(event.getDataValue('count'));
        return acc;
      }, {}),
      securityIncidents: securityIncidents.reduce((acc, incident) => {
        acc[incident.eventType] = parseInt(incident.getDataValue('count'));
        return acc;
      }, {}),
      topUsers: topUsers.map(user => ({
        userId: user.userId,
        email: user.User.email,
        name: `${user.User.firstName} ${user.User.lastName}`,
        activityCount: parseInt(user.getDataValue('activityCount'))
      })),
      dailyActivity: dailyActivity.map(day => ({
        date: day.getDataValue('date'),
        count: parseInt(day.getDataValue('count'))
      }))
    });

  } catch (error) {
    auditLogger.logError('AUDIT_STATISTICS_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// Resolve security incident
router.patch('/security-incidents/:incidentId/resolve', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { resolution, status = 'resolved' } = req.body;

    const incident = await AuditLog.findByPk(incidentId);
    if (!incident) {
      return res.status(404).json({ error: 'Security incident not found' });
    }

    await incident.update({
      isResolved: status === 'resolved',
      resolution: resolution,
      resolvedBy: req.user.id,
      resolvedAt: new Date()
    });

    auditLogger.logEvent('SECURITY_INCIDENT_RESOLVED', {
      incidentId: incidentId,
      resolution: resolution,
      resolvedBy: req.user.id
    });

    res.json({
      message: 'Security incident updated successfully',
      incident: {
        id: incident.id,
        eventType: incident.eventType,
        isResolved: incident.isResolved,
        resolution: incident.resolution,
        resolvedBy: incident.resolvedBy,
        resolvedAt: incident.resolvedAt
      }
    });

  } catch (error) {
    auditLogger.logError('RESOLVE_SECURITY_INCIDENT_ERROR', error, {
      userId: req.user.id,
      incidentId: req.params.incidentId
    });
    res.status(500).json({ error: 'Failed to resolve security incident' });
  }
});

// Export audit logs
router.get('/export', requireAuth, requireRole(['admin']), userRateLimit, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      eventType, 
      format = 'csv' 
    } = req.query;

    const whereClause = {};
    if (eventType) {
      whereClause.eventType = eventType;
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const logs = await AuditLog.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10000 // Limit export to prevent memory issues
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.json"`);
      res.json(logs);
    } else {
      // CSV format
      const csv = require('csv-stringify');
      const stringifier = csv.stringify({
        header: true,
        columns: [
          'ID',
          'Event Type',
          'Severity',
          'User',
          'IP Address',
          'User Agent',
          'Resource ID',
          'Description',
          'Created At',
          'Resolved',
          'Resolution'
        ]
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);

      stringifier.pipe(res);

      logs.forEach(log => {
        stringifier.write([
          log.id,
          log.eventType,
          log.severity,
          log.User ? `${log.User.firstName} ${log.User.lastName} (${log.User.email})` : 'System',
          log.ipAddress || '',
          log.userAgent || '',
          log.resourceId || '',
          log.description || '',
          log.createdAt.toISOString(),
          log.isResolved ? 'Yes' : 'No',
          log.resolution || ''
        ]);
      });

      stringifier.end();
    }

    auditLogger.logEvent('AUDIT_LOGS_EXPORTED', {
      userId: req.user.id,
      format: format,
      recordCount: logs.length
    });

  } catch (error) {
    auditLogger.logError('AUDIT_LOGS_EXPORT_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

module.exports = router;