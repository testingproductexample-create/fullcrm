const { DataTypes } = require('sequelize');

// Initialize Sequelize
const { sequelize } = require('../services/database');

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'premium', 'admin'),
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginIp: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginAttempt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastPasswordChange: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true, // Enable soft delete
  hooks: {
    beforeUpdate: (user) => {
      user.updatedAt = new Date();
    }
  }
});

// File Model
const File = sequelize.define('File', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  encryptedFilename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  encryptedPath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  encryptionKey: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  encryptionIv: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fileHash: {
    type: DataTypes.STRING(64),
    allowNull: false // SHA-256 hash
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'general'
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true // JSON array of tags
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  thumbnailPath: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isEncrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isAccessible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastDownloadedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastDownloadedFromIp: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  quarantineStatus: {
    type: DataTypes.ENUM('clean', 'quarantined', 'infected'),
    defaultValue: 'clean'
  },
  virusScanResult: {
    type: DataTypes.TEXT,
    allowNull: true // JSON with scan results
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true // JSON with additional metadata
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'files',
  timestamps: true,
  paranoid: true,
  hooks: {
    beforeUpdate: (file) => {
      file.updatedAt = new Date();
    }
  }
});

// File Share Model
const FileShare = sequelize.define('FileShare', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'files',
      key: 'id'
    }
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  shareToken: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  maxDownloads: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  requiresPassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  allowDownload: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastViewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastDownloadedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastDownloadedFromIp: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'file_shares',
  timestamps: true,
  hooks: {
    beforeUpdate: (share) => {
      share.updatedAt = new Date();
    }
  }
});

// Audit Log Model
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  eventType: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  eventCategory: {
    type: DataTypes.ENUM('AUTH', 'FILE', 'SHARE', 'ADMIN', 'SECURITY', 'SYSTEM'),
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    defaultValue: 'INFO'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resourceId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  resourceType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true // JSON with additional event data
  },
  isSecurityIncident: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isResolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'audit_logs',
  timestamps: false, // We manage timestamps manually for audit logs
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['eventType']
    },
    {
      fields: ['eventCategory']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['isSecurityIncident']
    },
    {
      fields: ['ipAddress']
    }
  ]
});

// User Session Model
const UserSession = sequelize.define('UserSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_sessions',
  timestamps: true,
  hooks: {
    beforeUpdate: (session) => {
      session.lastActivity = new Date();
    }
  },
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['token']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

// Quarantine Model
const Quarantine = sequelize.define('Quarantine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'files',
      key: 'id'
    }
  },
  quarantinedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  threatType: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  scanReport: {
    type: DataTypes.TEXT,
    allowNull: true // JSON with detailed scan report
  },
  quarantinePath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  isResolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resolution: {
    type: DataTypes.ENUM('deleted', 'released', 'false_positive'),
    allowNull: true
  },
  resolvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'quarantine',
  timestamps: true,
  hooks: {
    beforeUpdate: (quarantine) => {
      quarantine.updatedAt = new Date();
    }
  }
});

// Define associations
User.hasMany(File, { foreignKey: 'userId', as: 'files' });
File.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(FileShare, { foreignKey: 'ownerId', as: 'sharedFiles' });
FileShare.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
File.hasMany(FileShare, { foreignKey: 'fileId', as: 'shares' });
FileShare.belongsTo(File, { foreignKey: 'fileId', as: 'file' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserSession, { foreignKey: 'userId', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

File.hasOne(Quarantine, { foreignKey: 'fileId', as: 'quarantine' });
Quarantine.belongsTo(File, { foreignKey: 'fileId', as: 'file' });
Quarantine.belongsTo(User, { foreignKey: 'quarantinedBy', as: 'quarantinedByUser' });
Quarantine.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolvedByUser' });

module.exports = {
  User,
  File,
  FileShare,
  AuditLog,
  UserSession,
  Quarantine
};