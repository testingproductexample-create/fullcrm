const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { requireAuth, userRateLimit } = require('../middleware/security');
const { File, FileShare, User } = require('../models');
const { encryptFile, decryptFile } = require('../services/encryption');
const { fileStorage } = require('../services/storage');
const { auditLogger } = require('../services/audit');
const { generateShareToken, verifyShareToken } = require('../utils/sharing');

// Create secure file share link
router.post('/create', requireAuth, userRateLimit, [
  body('fileId').isUUID().withMessage('Valid file ID is required'),
  body('expiresIn').optional().isInt({ min: 1, max: 43200 }).withMessage('Expiration must be between 1 minute and 30 days'),
  body('maxDownloads').optional().isInt({ min: 1, max: 1000 }).withMessage('Max downloads must be between 1 and 1000'),
  body('password').optional().isLength({ min: 4, max: 100 }).withMessage('Password must be between 4 and 100 characters'),
  body('allowDownload').optional().isBoolean().withMessage('Allow download must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { fileId, expiresIn = 1440, maxDownloads = 10, password, allowDownload = true } = req.body;

    // Verify file ownership
    const file = await File.findOne({
      where: {
        id: fileId,
        userId: req.user.id
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file is accessible
    if (!file.isAccessible) {
      return res.status(403).json({ error: 'File access restricted' });
    }

    // Generate share token
    const shareToken = generateShareToken();
    const shareId = uuidv4();

    // Set expiration date
    const expiresAt = new Date(Date.now() + (expiresIn * 60 * 1000));

    // Create share record
    const fileShare = await FileShare.create({
      id: shareId,
      fileId: file.id,
      ownerId: req.user.id,
      shareToken: shareToken,
      expiresAt: expiresAt,
      maxDownloads: maxDownloads,
      downloadCount: 0,
      requiresPassword: !!password,
      allowDownload: allowDownload,
      isActive: true,
      createdAt: new Date()
    });

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      const saltRounds = 12;
      passwordHash = await bcrypt.hash(password, saltRounds);
      fileShare.passwordHash = passwordHash;
      await fileShare.save();
    }

    // Generate share URL
    const shareUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/share/${shareToken}`;

    auditLogger.logEvent('FILE_SHARE_CREATED', {
      userId: req.user.id,
      fileId: file.id,
      shareId: shareId,
      expiresAt: expiresAt,
      maxDownloads: maxDownloads,
      requiresPassword: !!password
    });

    res.status(201).json({
      message: 'File share created successfully',
      share: {
        id: shareId,
        shareToken: shareToken,
        shareUrl: shareUrl,
        fileName: file.originalName,
        fileSize: file.size,
        expiresAt: expiresAt,
        maxDownloads: maxDownloads,
        remainingDownloads: maxDownloads,
        requiresPassword: !!password,
        allowDownload: allowDownload,
        createdAt: fileShare.createdAt
      }
    });

  } catch (error) {
    auditLogger.logError('FILE_SHARE_CREATE_ERROR', error, {
      userId: req.user.id,
      fileId: req.body.fileId
    });
    res.status(500).json({ error: 'Failed to create file share' });
  }
});

// Get file share information (public endpoint with token)
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find active share
    const share = await FileShare.findOne({
      where: {
        shareToken: token,
        isActive: true
      },
      include: [{
        model: File,
        attributes: ['id', 'originalName', 'size', 'mimetype', 'createdAt']
      }]
    });

    if (!share) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    // Check expiration
    if (new Date() > share.expiresAt) {
      await share.update({ isActive: false });
      auditLogger.logEvent('EXPIRED_SHARE_ACCESSED', {
        shareId: share.id,
        ip: req.ip
      });
      return res.status(410).json({ error: 'Share link has expired' });
    }

    // Check download limit
    if (share.downloadCount >= share.maxDownloads) {
      auditLogger.logEvent('DOWNLOAD_LIMIT_EXCEEDED', {
        shareId: share.id,
        downloadCount: share.downloadCount
      });
      return res.status(429).json({ error: 'Download limit exceeded' });
    }

    // Don't expose sensitive information
    res.json({
      fileName: share.File.originalName,
      fileSize: share.File.size,
      mimetype: share.File.mimetype,
      uploadedAt: share.File.createdAt,
      expiresAt: share.expiresAt,
      remainingDownloads: share.maxDownloads - share.downloadCount,
      requiresPassword: share.requiresPassword,
      allowDownload: share.allowDownload
    });

  } catch (error) {
    auditLogger.logError('FILE_SHARE_INFO_ERROR', error, { token: req.params.token });
    res.status(500).json({ error: 'Failed to get share information' });
  }
});

// Download file via share link
router.get('/:token/download', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    // Find active share
    const share = await FileShare.findOne({
      where: {
        shareToken: token,
        isActive: true
      },
      include: [{
        model: File,
        attributes: ['id', 'originalName', 'size', 'mimetype', 'encryptedPath', 'encryptionKey', 'encryptionIv']
      }]
    });

    if (!share) {
      auditLogger.logSecurityIncident('INVALID_SHARE_ACCESS', {
        token: token,
        ip: req.ip
      });
      return res.status(404).json({ error: 'Share link not found' });
    }

    // Check expiration
    if (new Date() > share.expiresAt) {
      await share.update({ isActive: false });
      return res.status(410).json({ error: 'Share link has expired' });
    }

    // Check download limit
    if (share.downloadCount >= share.maxDownloads) {
      return res.status(429).json({ error: 'Download limit exceeded' });
    }

    // Verify password if required
    if (share.requiresPassword) {
      if (!password) {
        return res.status(401).json({ error: 'Password required' });
      }

      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, share.passwordHash);
      if (!isValidPassword) {
        auditLogger.logSecurityIncident('INVALID_SHARE_PASSWORD', {
          shareId: share.id,
          ip: req.ip
        });
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Check if downloads are allowed
    if (!share.allowDownload) {
      auditLogger.logSecurityAttempt('SHARE_DOWNLOAD_DISABLED', {
        shareId: share.id,
        ip: req.ip
      });
      return res.status(403).json({ error: 'Downloads are not allowed for this share' });
    }

    // Read and decrypt file
    const encryptedData = await fileStorage.readEncrypted(share.File.encryptedPath);
    const decryptedData = await decryptFile(
      encryptedData,
      Buffer.from(share.File.encryptionKey, 'base64'),
      Buffer.from(share.File.encryptionIv, 'base64')
    );

    // Set secure download headers
    res.setHeader('Content-Type', share.File.mimetype);
    res.setHeader('Content-Length', share.File.size);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(share.File.originalName)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache');

    // Update download count
    await share.update({
      downloadCount: share.downloadCount + 1,
      lastDownloadedAt: new Date(),
      lastDownloadedFromIp: req.ip
    });

    auditLogger.logEvent('SHARE_FILE_DOWNLOADED', {
      shareId: share.id,
      fileId: share.File.id,
      downloadCount: share.downloadCount + 1,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.send(decryptedData);

  } catch (error) {
    auditLogger.logError('SHARE_DOWNLOAD_ERROR', error, {
      token: req.params.token,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Get user's file shares
router.get('/my/shares', requireAuth, userRateLimit, async (req, res) => {
  try {
    const { FileShare, File } = require('../models');
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const shares = await FileShare.findAndCountAll({
      where: {
        ownerId: req.user.id,
        isActive: true
      },
      include: [{
        model: File,
        attributes: ['id', 'originalName', 'size', 'mimetype', 'category']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Format shares for response
    const formattedShares = shares.rows.map(share => ({
      id: share.id,
      shareToken: share.shareToken,
      shareUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/share/${share.shareToken}`,
      fileName: share.File.originalName,
      fileSize: share.File.size,
      category: share.File.category,
      expiresAt: share.expiresAt,
      maxDownloads: share.maxDownloads,
      downloadCount: share.downloadCount,
      remainingDownloads: share.maxDownloads - share.downloadCount,
      requiresPassword: share.requiresPassword,
      allowDownload: share.allowDownload,
      createdAt: share.createdAt,
      lastDownloadedAt: share.lastDownloadedAt
    }));

    res.json({
      shares: formattedShares,
      total: shares.count,
      page: parseInt(page),
      pages: Math.ceil(shares.count / limit)
    });

  } catch (error) {
    auditLogger.logError('GET_USER_SHARES_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch file shares' });
  }
});

// Revoke file share
router.delete('/:shareId', requireAuth, userRateLimit, async (req, res) => {
  try {
    const { FileShare } = require('../models');
    const { shareId } = req.params;

    // Find share
    const share = await FileShare.findOne({
      where: {
        id: shareId,
        ownerId: req.user.id
      }
    });

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Deactivate share
    await share.update({ isActive: false });

    auditLogger.logEvent('FILE_SHARE_REVOKED', {
      userId: req.user.id,
      shareId: shareId,
      fileId: share.fileId
    });

    res.json({ message: 'File share revoked successfully' });

  } catch (error) {
    auditLogger.logError('REVOKE_SHARE_ERROR', error, {
      userId: req.user.id,
      shareId: req.params.shareId
    });
    res.status(500).json({ error: 'Failed to revoke file share' });
  }
});

// Update share settings
router.patch('/:shareId', requireAuth, userRateLimit, [
  body('maxDownloads').optional().isInt({ min: 1, max: 1000 }),
  body('allowDownload').optional().isBoolean(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const { FileShare } = require('../models');
    const { shareId } = req.params;
    const updates = {};

    // Validate and add allowed updates
    if (req.body.maxDownloads !== undefined) {
      updates.maxDownloads = req.body.maxDownloads;
    }
    if (req.body.allowDownload !== undefined) {
      updates.allowDownload = req.body.allowDownload;
    }
    if (req.body.isActive !== undefined) {
      updates.isActive = req.body.isActive;
    }

    // Find share
    const share = await FileShare.findOne({
      where: {
        id: shareId,
        ownerId: req.user.id
      }
    });

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Update share
    await share.update(updates);

    auditLogger.logEvent('FILE_SHARE_UPDATED', {
      userId: req.user.id,
      shareId: shareId,
      updates: updates
    });

    res.json({
      message: 'File share updated successfully',
      share: {
        id: share.id,
        maxDownloads: share.maxDownloads,
        allowDownload: share.allowDownload,
        isActive: share.isActive
      }
    });

  } catch (error) {
    auditLogger.logError('UPDATE_SHARE_ERROR', error, {
      userId: req.user.id,
      shareId: req.params.shareId
    });
    res.status(500).json({ error: 'Failed to update file share' });
  }
});

// Get share download statistics
router.get('/:shareId/stats', requireAuth, userRateLimit, async (req, res) => {
  try {
    const { FileShare } = require('../models');
    const { shareId } = req.params;

    // Find share
    const share = await FileShare.findOne({
      where: {
        id: shareId,
        ownerId: req.user.id
      }
    });

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    res.json({
      shareId: share.id,
      downloadCount: share.downloadCount,
      maxDownloads: share.maxDownloads,
      remainingDownloads: share.maxDownloads - share.downloadCount,
      lastDownloadedAt: share.lastDownloadedAt,
      lastDownloadedFromIp: share.lastDownloadedFromIp,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      isActive: share.isActive
    });

  } catch (error) {
    auditLogger.logError('GET_SHARE_STATS_ERROR', error, {
      userId: req.user.id,
      shareId: req.params.shareId
    });
    res.status(500).json({ error: 'Failed to get share statistics' });
  }
});

module.exports = router;