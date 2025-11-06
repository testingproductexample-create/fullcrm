const { Sequelize } = require('sequelize');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/database.log' }),
    new winston.transports.Console()
  ]
});

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'secure_file_storage',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  logging: (sql) => {
    logger.debug('SQL Query:', sql);
  },
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    connectTimeout: 20000
  },
  define: {
    underscored: true,
    freezeTableName: true
  },
  retry: {
    match: [
      /ConnectionError/,
      /EHOSTUNREACH/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    max: 3
  }
};

// Create Sequelize instance
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    return false;
  }
}

// Initialize database
async function initializeDatabase() {
  try {
    logger.info('Initializing database...');
    
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: process.env.DB_FORCE_SYNC === 'true'
    });
    
    logger.info('Database synchronized successfully');
    
    // Create indexes for better performance
    await createIndexes();
    
    // Run database migrations if needed
    await runMigrations();
    
    return true;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

// Create additional indexes for performance
async function createIndexes() {
  try {
    // File table indexes
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_user_id 
      ON files (user_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_category 
      ON files (category);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_created_at 
      ON files (created_at);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_expires_at 
      ON files (expires_at) WHERE expires_at IS NOT NULL;
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_is_accessible 
      ON files (is_accessible);
    `);
    
    // Audit log indexes
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id 
      ON audit_logs (user_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_event_type 
      ON audit_logs (event_type);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at 
      ON audit_logs (created_at);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_severity 
      ON audit_logs (severity);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_security_incident 
      ON audit_logs (is_security_incident) WHERE is_security_incident = true;
    `);
    
    // File share indexes
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_shares_owner_id 
      ON file_shares (owner_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_shares_file_id 
      ON file_shares (file_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_shares_expires_at 
      ON file_shares (expires_at);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_shares_is_active 
      ON file_shares (is_active);
    `);
    
    // User session indexes
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id 
      ON user_sessions (user_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_expires_at 
      ON user_sessions (expires_at);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_is_active 
      ON user_sessions (is_active);
    `);
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.warn('Failed to create some indexes:', error.message);
    // Don't throw error for index creation failures
  }
}

// Run database migrations
async function runMigrations() {
  try {
    // This is a placeholder for custom migrations
    // In a real implementation, you would use a migration tool like umzug
    
    logger.info('Running database migrations...');
    
    // Add any custom migration logic here
    await checkAndCreateDefaultAdmin();
    await cleanupExpiredData();
    
    logger.info('Database migrations completed');
  } catch (error) {
    logger.error('Database migrations failed:', error);
    throw error;
  }
}

// Check and create default admin user
async function checkAndCreateDefaultAdmin() {
  try {
    const { User } = require('../models');
    
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminExists && process.env.CREATE_DEFAULT_ADMIN === 'true') {
      const bcrypt = require('bcryptjs');
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await User.create({
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@securefiles.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true,
        emailVerified: true
      });
      
      logger.info('Default admin user created');
    }
  } catch (error) {
    logger.warn('Failed to create default admin user:', error.message);
  }
}

// Clean up expired data
async function cleanupExpiredData() {
  try {
    const { FileShare, AuditLog } = require('../models');
    const { Op } = require('sequelize');
    
    // Clean up expired file shares
    const expiredShares = await FileShare.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() }
      }
    });
    
    if (expiredShares > 0) {
      logger.info(`Cleaned up ${expiredShares} expired file shares`);
    }
    
    // Clean up old audit logs (keep only for configured retention period)
    const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS) || 90;
    const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
    
    const oldAuditLogs = await AuditLog.destroy({
      where: {
        createdAt: { [Op.lt]: cutoffDate },
        isSecurityIncident: false
      }
    });
    
    if (oldAuditLogs > 0) {
      logger.info(`Cleaned up ${oldAuditLogs} old audit logs`);
    }
    
  } catch (error) {
    logger.warn('Failed to cleanup expired data:', error.message);
  }
}

// Health check for database
async function healthCheck() {
  try {
    await sequelize.authenticate();
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date() 
    };
  }
}

// Graceful shutdown
async function closeConnection() {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
}

// Export functions
module.exports = {
  sequelize,
  testConnection,
  initializeDatabase,
  healthCheck,
  closeConnection
};