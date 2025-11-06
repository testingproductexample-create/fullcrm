# Secure File Storage System

A comprehensive secure file upload and storage system with virus scanning, encryption, access controls, file sharing, and audit logging.

## 🚀 Features

### Security Features
- **End-to-end Encryption**: AES-256-GCM encryption for all stored files
- **Virus Scanning**: Real-time malware detection using ClamAV
- **File Type Validation**: Strict file type restrictions and content verification
- **Access Controls**: Role-based permissions and user authentication
- **Secure File Sharing**: Time-limited share links with optional password protection
- **Audit Logging**: Comprehensive activity tracking and security incident monitoring
- **Quarantine System**: Automatic isolation of suspicious files
- **Secure Deletion**: Multi-pass overwriting for deleted files

### File Management
- **Drag & Drop Upload**: Intuitive file upload interface
- **Bulk Operations**: Delete, move, and organize multiple files
- **File Categories**: Organize files by type and custom categories
- **Search & Filter**: Advanced file search and filtering capabilities
- **Download Security**: Protected downloads with access logging
- **File Versioning**: Track file changes and access history
- **Metadata Management**: Custom tags, descriptions, and file properties

### User Management
- **User Roles**: Admin, Premium, and Standard user roles
- **Session Management**: Secure session handling with automatic refresh
- **Password Security**: Strong password requirements and validation
- **Account Lockout**: Protection against brute force attacks
- **Profile Management**: User profile and preferences management

### Administration
- **System Dashboard**: Real-time system health and usage statistics
- **User Management**: Admin controls for user accounts and permissions
- **Audit Trail**: Detailed security and activity logs
- **Storage Management**: Monitor disk usage and storage quotas
- **System Maintenance**: Automated cleanup and maintenance tasks
- **Security Monitoring**: Real-time security incident detection and alerts

## 🏗️ Architecture

### Backend (Node.js/Express)
```
backend/
├── src/
│   ├── routes/           # API routes
│   │   ├── auth.js       # Authentication routes
│   │   ├── files.js      # File management routes
│   │   ├── sharing.js    # File sharing routes
│   │   ├── audit.js      # Audit logging routes
│   │   └── admin.js      # Admin management routes
│   ├── services/         # Core services
│   │   ├── database.js   # Database connection and management
│   │   ├── encryption.js # File encryption/decryption
│   │   ├── antivirus.js  # Virus scanning service
│   │   ├── storage.js    # File storage management
│   │   ├── audit.js      # Audit logging service
│   │   └── cleanup.js    # Automated maintenance
│   ├── middleware/       # Custom middleware
│   │   └── security.js   # Security middleware
│   ├── models/           # Database models
│   │   └── index.js      # Sequelize models
│   ├── utils/            # Utility functions
│   │   ├── validation.js # Input validation
│   │   └── sharing.js    # File sharing utilities
│   └── server.js         # Main application server
├── database/
│   └── schema.sql        # Database schema
├── config/               # Configuration files
└── tests/               # Test files
```

### Frontend (React/TypeScript)
```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx    # Main layout component
│   │   ├── FileUpload.tsx # File upload component
│   │   └── ProtectedRoute.tsx # Route protection
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── files/        # File management pages
│   │   ├── sharing/      # File sharing pages
│   │   ├── admin/        # Admin pages
│   │   └── settings/     # Settings pages
│   ├── services/         # API services
│   │   └── api.ts        # API client
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── package.json          # Dependencies
└── vite.config.ts        # Build configuration
```

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- ClamAV (for virus scanning)
- Redis (optional, for session management)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd secure-files
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration

# Create database
createdb secure_file_storage
psql secure_file_storage < ../database/schema.sql

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Copy environment configuration
cp .env.example .env

# Start the development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Default admin: admin@securefiles.com / Admin123!

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secure_file_storage
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# File Storage
STORAGE_PATH=./secure_storage
MAX_FILE_SIZE=104857600
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,...

# Antivirus
ANTIVIRUS_ENABLED=true
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310

# Security
AUDIT_RETENTION_DAYS=90
SECURITY_AUDIT_RETENTION_DAYS=365
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=SecureFiles
VITE_MAX_FILE_SIZE=104857600
VITE_MAX_FILES_PER_UPLOAD=10
```

## 🔒 Security Features

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Management**: Secure key generation and storage
- **File Integrity**: SHA-256 hash verification
- **Password Protection**: Optional password-based encryption

### Virus Protection
- **Real-time Scanning**: ClamAV integration
- **File Quarantine**: Automatic isolation of threats
- **Signature Updates**: Automated virus definition updates
- **Content Validation**: File signature verification

### Access Control
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control (RBAC)
- **Session Management**: Secure session handling
- **Rate Limiting**: API rate limiting and abuse prevention

### Audit & Monitoring
- **Activity Logging**: Comprehensive audit trail
- **Security Monitoring**: Real-time threat detection
- **Incident Response**: Automated security incident handling
- **Compliance**: GDPR and security standard compliance

## 📊 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
POST /api/auth/logout         # User logout
POST /api/auth/refresh        # Token refresh
POST /api/auth/change-password # Change password
GET  /api/auth/me             # Get current user
```

### File Management Endpoints
```
GET    /api/files             # List files
POST   /api/files/upload      # Upload files
GET    /api/files/:id         # Get file metadata
GET    /api/files/:id/download # Download file
DELETE /api/files/:id         # Delete file
PATCH  /api/files/:id         # Update file metadata
POST   /api/files/bulk        # Bulk operations
```

### File Sharing Endpoints
```
POST   /api/sharing/create    # Create share link
GET    /api/sharing/:token    # Get share info
GET    /api/sharing/:token/download # Download shared file
GET    /api/sharing/my/shares # List user shares
DELETE /api/sharing/:id       # Revoke share
PATCH  /api/sharing/:id       # Update share settings
```

### Admin Endpoints
```
GET    /api/admin/overview    # System overview
GET    /api/admin/users       # List users
GET    /api/admin/users/:id   # Get user details
PATCH  /api/admin/users/:id   # Update user
DELETE /api/admin/users/:id   # Delete user
GET    /api/admin/config      # System configuration
PATCH  /api/admin/config      # Update configuration
```

### Audit Endpoints
```
GET    /api/audit/logs        # List audit logs
GET    /api/audit/security-incidents # List security incidents
GET    /api/audit/statistics  # System statistics
GET    /api/audit/export      # Export audit logs
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test              # Run all tests
npm run test:unit     # Run unit tests
npm run test:integration # Run integration tests
npm run test:security # Run security tests
```

### Frontend Testing
```bash
cd frontend
npm test              # Run all tests
npm run test:ui       # Run UI tests
npm run test:coverage # Run tests with coverage
```

## 📈 Performance

### Optimization Features
- **File Compression**: Automatic thumbnail generation
- **Caching**: Redis-based session and data caching
- **Pagination**: Efficient large dataset handling
- **CDN Ready**: Static asset optimization
- **Database Indexing**: Optimized database queries

### Monitoring
- **Health Checks**: System health monitoring
- **Performance Metrics**: Request/response time tracking
- **Storage Monitoring**: Disk usage and quota management
- **Error Tracking**: Comprehensive error logging

## 🛠️ Deployment

### Production Deployment
1. **Environment Setup**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   DB_SSL=true
   ANTIVIRUS_ENABLED=true
   ```

2. **Build Applications**
   ```bash
   # Build backend
   cd backend
   npm run build
   
   # Build frontend
   cd ../frontend
   npm run build
   ```

3. **Database Setup**
   ```bash
   # Run migrations
   psql secure_file_storage_production < database/schema.sql
   ```

4. **Start Services**
   ```bash
   # Start backend
   cd backend && npm start
   
   # Serve frontend
   cd ../frontend && npm run preview
   ```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔧 Maintenance

### Automated Tasks
- **File Cleanup**: Automatic deletion of expired files
- **Log Rotation**: Automated audit log cleanup
- **Database Maintenance**: Regular database optimization
- **Security Updates**: Automatic virus definition updates

### Manual Maintenance
- **User Management**: Add, remove, or modify user accounts
- **System Configuration**: Adjust system settings and quotas
- **Backup & Recovery**: Regular data backup and recovery procedures
- **Security Audits**: Periodic security assessments

## 📚 Documentation

### Additional Resources
- [API Documentation](./docs/api.md)
- [Security Guide](./docs/security.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Contributing Guide](./docs/contributing.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the troubleshooting guide

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Complete file upload and storage system
- Security features implementation
- User management and admin interface
- Audit logging and monitoring

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile application
- [ ] Advanced file preview
- [ ] Integration with cloud storage providers
- [ ] Advanced analytics and reporting
- [ ] Multi-tenant support
- [ ] API rate limiting enhancements
- [ ] Enhanced file collaboration features

---

**Built with security and privacy in mind** 🔒