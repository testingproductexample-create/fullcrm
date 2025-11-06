const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { requireAuth, requireRole, fileUploadSecurity, userRateLimit, sanitizeInput } = require('../middleware/security');
const { encryptFile, decryptFile } = require('../services/encryption');
const { virusScan } = require('../services/antivirus');
const { fileStorage } = require('../services/storage');
const { auditLogger } = require('../services/audit');
const { validateFileMetadata, generateFileHash } = require('../utils/validation');

// Configure multer for secure file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: fileUploadSecurity.limits,
  fileFilter: fileUploadSecurity.fileFilter
});

// Get all files for user
router.get('/', requireAuth, userRateLimit, async (req, res) => {
  try {
    const { File } = require('../models');
    const { page = 1, limit = 20, search, category } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { userId: req.user.id };
    
    if (search) {
      whereClause.originalName = {
        [require('sequelize').Op.iLike]: `%${search}%`
      };
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    const files = await File.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['encryptedPath', 'encryptionKey', 'encryptionIv']
      }
    });
    
    res.json({
      files: files.rows,
      total: files.count,
      page: parseInt(page),
      pages: Math.ceil(files.count / limit)
    });
  } catch (error) {
    auditLogger.logError('FILE_LIST_ERROR', error, { userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get file metadata
router.get('/:id', requireAuth, userRateLimit, async (req, res) => {
  try {
    const { File } = require('../models');
    const file = await File.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      attributes: {
        exclude: ['encryptedPath', 'encryptionKey', 'encryptionIv']
      }
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Check file access permissions
    if (!file.isAccessible) {
      return res.status(403).json({ error: 'File access restricted' });
    }
    
    res.json(file);
  } catch (error) {
    auditLogger.logError('FILE_METADATA_ERROR', error, { 
      userId: req.user.id,
      fileId: req.params.id 
    });
    res.status(500).json({ error: 'Failed to fetch file metadata' });
  }
});

// Secure file upload
router.post('/upload', requireAuth, userRateLimit, upload.array('files', 10), async (req, res) => {
  const uploadStartTime = Date.now();
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const { File, User } = require('../models');
    const uploadedFiles = [];
    const errors = [];
    
    for (const file of req.files) {
      try {
        // Validate file metadata
        const metadata = validateFileMetadata({
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
        
        if (!metadata.isValid) {
          errors.push({
            filename: file.originalname,
            error: metadata.error
          });
          continue;
        }
        
        // Generate unique file ID and encrypted filename
        const fileId = uuidv4();
        const encryptedFilename = `${fileId}.encrypted`;
        
        // Generate encryption key
        const { encrypt, key, iv } = await encryptFile(file.buffer);
        
        // Store encrypted file
        const encryptedPath = await fileStorage.storeEncrypted(encryptedFilename, encrypt);
        
        // Generate file hash for integrity
        const fileHash = generateFileHash(file.buffer);
        
        // Virus scan the file
        const scanResult = await virusScan(encrypt);
        
        if (!scanResult.isClean) {
          auditLogger.logSecurityIncident('MALWARE_DETECTED', {
            userId: req.user.id,
            filename: file.originalname,
            threat: scanResult.threat
          });
          
          // Quarantine the file
          await fileStorage.quarantineFile(encryptedPath, fileId);
          
          errors.push({
            filename: file.originalname,
            error: `Malware detected: ${scanResult.threat}`
          });
          continue;
        }
        
        // Save file metadata to database
        const fileRecord = await File.create({
          id: fileId,
          userId: req.user.id,
          originalName: file.originalname,
          encryptedFilename: encryptedFilename,
          size: file.size,
          mimetype: file.mimetype,
          encryptedPath: encryptedPath,
          encryptionKey: key.toString('base64'),
          encryptionIv: iv.toString('base64'),
          fileHash: fileHash,
          category: req.body.category || 'general',
          isEncrypted: true,
          isAccessible: true,
          uploadedAt: new Date()
        });
        
        // Generate thumbnail for images
        if (file.mimetype.startsWith('image/')) {
          try {
            const thumbnail = await generateThumbnail(file.buffer);
            if (thumbnail) {
              await fileStorage.storeThumbnail(fileId, thumbnail);
              fileRecord.thumbnailPath = `${fileId}_thumb.jpg`;
              await fileRecord.save();
            }
          } catch (thumbError) {
            console.warn('Failed to generate thumbnail:', thumbError);
          }
        }
        
        uploadedFiles.push({
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          size: fileRecord.size,
          mimetype: fileRecord.mimetype,
          category: fileRecord.category,
          uploadedAt: fileRecord.uploadedAt
        });
        
        auditLogger.logEvent('FILE_UPLOADED', {
          userId: req.user.id,
          fileId: fileId,
          filename: file.originalname,
          size: file.size,
          duration: Date.now() - uploadStartTime
        });
        
      } catch (fileError) {
        console.error('File processing error:', fileError);
        errors.push({
          filename: file.originalname,
          error: 'Failed to process file'
        });
      }
    }
    
    res.json({
      uploaded: uploadedFiles,
      errors: errors,
      summary: {
        uploaded: uploadedFiles.length,
        failed: errors.length,
        total: req.files.length
      }
    });
    
  } catch (error) {
    auditLogger.logError('FILE_UPLOAD_ERROR', error, { 
      userId: req.user.id,
      filesCount: req.files?.length || 0
    });
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Secure file download
router.get('/:id/download', requireAuth, userRateLimit, async (req, res) => {
  try {
    const { File } = require('../models');
    const file = await File.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (!file.isAccessible) {
      auditLogger.logSecurityIncident('UNAUTHORIZED_DOWNLOAD_ATTEMPT', {
        userId: req.user.id,
        fileId: req.params.id
      });
      return res.status(403).json({ error: 'File access restricted' });
    }
    
    // Check file expiration
    if (file.expiresAt && new Date() > file.expiresAt) {
      return res.status(410).json({ error: 'File has expired' });
    }
    
    // Read encrypted file
    const encryptedData = await fileStorage.readEncrypted(file.encryptedPath);
    
    // Decrypt file
    const decryptedData = await decryptFile(
      encryptedData,
      Buffer.from(file.encryptionKey, 'base64'),
      Buffer.from(file.encryptionIv, 'base64')
    );
    
    // Set secure download headers
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache');
    
    // Log download event
    auditLogger.logEvent('FILE_DOWNLOADED', {
      userId: req.user.id,
      fileId: file.id,
      filename: file.originalName,
      ip: req.ip
    });
    
    res.send(decryptedData);
    
  } catch (error) {
    auditLogger.logError('FILE_DOWNLOAD_ERROR', error, {
      userId: req.user.id,
      fileId: req.params.id
    });
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete file securely
router.delete('/:id', requireAuth, userRateLimit, async (req, res) => {
  try {
    const { File } = require('../models');
    const file = await File.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Securely delete the encrypted file
    await fileStorage.deleteSecurely(file.encryptedPath);
    
    // Delete thumbnail if exists
    if (file.thumbnailPath) {
      await fileStorage.deleteThumbnail(file.id);
    }
    
    // Soft delete from database (mark as deleted)
    await file.destroy();
    
    auditLogger.logEvent('FILE_DELETED', {
      userId: req.user.id,
      fileId: file.id,
      filename: file.originalName
    });
    
    res.json({ message: 'File deleted successfully' });
    
  } catch (error) {
    auditLogger.logError('FILE_DELETE_ERROR', error, {
      userId: req.user.id,
      fileId: req.params.id
    });
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Update file metadata
router.patch('/:id', requireAuth, userRateLimit, sanitizeInput, async (req, res) => {
  try {
    const { File } = require('../models');
    const file = await File.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const allowedUpdates = ['category', 'tags', 'description'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    await file.update(updates);
    
    auditLogger.logEvent('FILE_UPDATED', {
      userId: req.user.id,
      fileId: file.id,
      updates: updates
    });
    
    res.json({
      message: 'File updated successfully',
      file: {
        id: file.id,
        originalName: file.originalName,
        category: file.category,
        tags: file.tags,
        description: file.description
      }
    });
    
  } catch (error) {
    auditLogger.logError('FILE_UPDATE_ERROR', error, {
      userId: req.user.id,
      fileId: req.params.id
    });
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Generate thumbnail for images
async function generateThumbnail(imageBuffer) {
  try {
    const sharp = require('sharp');
    const thumbnail = await sharp(imageBuffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    return thumbnail;
  } catch (error) {
    console.warn('Thumbnail generation failed:', error);
    return null;
  }
}

// Bulk operations
router.post('/bulk', requireAuth, userRateLimit, async (req, res) => {
  try {
    const { File } = require('../models');
    const { action, fileIds, data } = req.body;
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'No file IDs provided' });
    }
    
    let results = [];
    let errors = [];
    
    switch (action) {
      case 'delete':
        for (const fileId of fileIds) {
          try {
            const file = await File.findOne({
              where: { id: fileId, userId: req.user.id }
            });
            
            if (file) {
              await fileStorage.deleteSecurely(file.encryptedPath);
              await file.destroy();
              results.push({ fileId, status: 'deleted' });
            } else {
              errors.push({ fileId, error: 'File not found' });
            }
          } catch (error) {
            errors.push({ fileId, error: error.message });
          }
        }
        break;
        
      case 'move':
        const { category } = data;
        for (const fileId of fileIds) {
          try {
            const [updated] = await File.update(
              { category },
              { 
                where: { id: fileId, userId: req.user.id },
                returning: true 
              }
            );
            if (updated[0] > 0) {
              results.push({ fileId, status: 'moved', category });
            } else {
              errors.push({ fileId, error: 'File not found' });
            }
          } catch (error) {
            errors.push({ fileId, error: error.message });
          }
        }
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    auditLogger.logEvent('BULK_OPERATION', {
      userId: req.user.id,
      action: action,
      fileIds: fileIds,
      successCount: results.length,
      errorCount: errors.length
    });
    
    res.json({
      action,
      results,
      errors,
      summary: {
        total: fileIds.length,
        successful: results.length,
        failed: errors.length
      }
    });
    
  } catch (error) {
    auditLogger.logError('BULK_OPERATION_ERROR', error, {
      userId: req.user.id,
      action: req.body.action
    });
    res.status(500).json({ error: 'Bulk operation failed' });
  }
});

module.exports = router;