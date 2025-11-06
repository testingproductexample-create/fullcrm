# Quick Setup Guide

This guide will help you get the Secure File Upload & Storage system running quickly.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- ClamAV (for virus scanning)
- Redis (optional, for session management)

## Quick Start

### 1. Database Setup
```bash
# Create database
createdb secure_file_storage

# Import schema
psql -d secure_file_storage -f database/schema.sql
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### 3. Install ClamAV (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install clamav clamav-daemon
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon
```

### 4. Start the System
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend  
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api
- Default Admin: admin@securefiles.com / Admin123!

## Environment Configuration

Both backend (.env) and frontend (.env) environment files are pre-configured for development. Update for production.

## System Features

✅ **Security**: AES-256-GCM encryption, JWT authentication, rate limiting
✅ **Virus Scanning**: ClamAV integration with automatic quarantine  
✅ **File Validation**: Magic number detection, type validation
✅ **File Sharing**: Secure links with expiration and access controls
✅ **Audit Logging**: Comprehensive activity tracking
✅ **Bulk Operations**: Multi-file upload and management
✅ **Admin Panel**: User management, quarantine review, system stats

## API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/files/upload` - Secure file upload
- `GET /api/files` - List user files
- `GET /api/files/:id/download` - Secure file download
- `POST /api/files/:id/share` - Create secure share link
- `GET /api/audit/logs` - Retrieve audit logs
- `GET /api/admin/quarantine` - Quarantine management

## Production Deployment

1. Set NODE_ENV=production
2. Configure secure JWT secrets
3. Enable SSL/TLS
4. Set up database backups
5. Configure log rotation
6. Set up monitoring

For detailed documentation, see:
- README.md - Complete setup and usage guide
- docs/security-implementation.md - Security architecture
- docs/api-documentation.md - API reference