# API Documentation

## Overview

The Secure File Storage System provides a RESTful API for file management, user authentication, file sharing, and administrative functions. All endpoints use JSON for request and response data.

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication
Most endpoints require authentication using JWT tokens:

```http
Authorization: Bearer <jwt_token>
```

### Response Format
All responses follow this standard format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## Authentication Endpoints

### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Codes:**
- `400`: Invalid input
- `401`: Invalid credentials
- `423`: Account locked
- `429`: Too many attempts

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "user"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/logout
Logout user and invalidate session.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### POST /auth/refresh
Refresh JWT token before expiration.

**Request:**
```json
{
  "token": "current_jwt_token"
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "token": "new_jwt_token"
}
```

### POST /auth/change-password
Change user password.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### GET /auth/me
Get current user profile.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "lastLogin": "2025-11-06T23:45:03Z"
  }
}
```

## File Management Endpoints

### GET /files
List user's files with pagination and filtering.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```
?page=1&limit=20&search=document&category=work
```

**Response:**
```json
{
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "originalName": "presentation.pdf",
      "size": 2048000,
      "mimetype": "application/pdf",
      "category": "work",
      "uploadedAt": "2025-11-06T23:45:03Z",
      "isEncrypted": true,
      "downloadCount": 5
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 3
}
```

### POST /files/upload
Upload one or more files (multipart/form-data).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `files`: File input(s)
- `category`: File category (optional)

**Response:**
```json
{
  "uploaded": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "originalName": "document.pdf",
      "size": 1024000,
      "mimetype": "application/pdf",
      "category": "general",
      "uploadedAt": "2025-11-06T23:45:03Z"
    }
  ],
  "errors": [],
  "summary": {
    "uploaded": 1,
    "failed": 0,
    "total": 1
  }
}
```

### GET /files/:id
Get file metadata and information.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "originalName": "document.pdf",
  "size": 1024000,
  "mimetype": "application/pdf",
  "category": "work",
  "description": "Important business document",
  "tags": ["contract", "important"],
  "uploadedAt": "2025-11-06T23:45:03Z",
  "isEncrypted": true,
  "isAccessible": true,
  "downloadCount": 5,
  "lastDownloadedAt": "2025-11-06T22:30:00Z",
  "virusScanResult": {
    "isClean": true,
    "threat": null,
    "scanDate": "2025-11-06T23:45:03Z"
  }
}
```

### GET /files/:id/download
Download encrypted file (returns binary data).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Accept: application/octet-stream
```

**Response:**
- **Headers:** Content-Type, Content-Disposition
- **Body:** Binary file data

### DELETE /files/:id
Securely delete file and all associated data.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

### PATCH /files/:id
Update file metadata.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "category": "personal",
  "tags": ["important", "review"],
  "description": "Updated description"
}
```

**Response:**
```json
{
  "message": "File updated successfully",
  "file": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "originalName": "document.pdf",
    "category": "personal",
    "tags": ["important", "review"],
    "description": "Updated description"
  }
}
```

### POST /files/bulk
Perform bulk operations on multiple files.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "action": "delete",
  "fileIds": [
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
  ]
}
```

**Response:**
```json
{
  "action": "delete",
  "results": [
    {
      "fileId": "550e8400-e29b-41d4-a716-446655440002",
      "status": "deleted"
    },
    {
      "fileId": "550e8400-e29b-41d4-a716-446655440003",
      "status": "deleted"
    }
  ],
  "errors": [],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

## File Sharing Endpoints

### POST /sharing/create
Create secure file share link.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "fileId": "550e8400-e29b-41d4-a716-446655440002",
  "expiresIn": 1440,
  "maxDownloads": 10,
  "password": "sharePassword123",
  "allowDownload": true
}
```

**Response:**
```json
{
  "message": "File share created successfully",
  "share": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "shareToken": "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u",
    "shareUrl": "http://localhost:3000/share/a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "expiresAt": "2025-11-07T23:45:03Z",
    "maxDownloads": 10,
    "remainingDownloads": 10,
    "requiresPassword": true,
    "allowDownload": true
  }
}
```

### GET /sharing/:token
Get share link information (public endpoint).

**Response:**
```json
{
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "mimetype": "application/pdf",
  "uploadedAt": "2025-11-06T23:45:03Z",
  "expiresAt": "2025-11-07T23:45:03Z",
  "remainingDownloads": 8,
  "requiresPassword": true,
  "allowDownload": true
}
```

### GET /sharing/:token/download
Download file via share link.

**Query Parameters:**
```
?password=sharePassword123
```

**Response:**
- **Headers:** Content-Type, Content-Disposition
- **Body:** Binary file data

### GET /sharing/my/shares
List user's file shares.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "shares": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "shareUrl": "http://localhost:3000/share/a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u",
      "fileName": "document.pdf",
      "fileSize": 1024000,
      "expiresAt": "2025-11-07T23:45:03Z",
      "maxDownloads": 10,
      "downloadCount": 2,
      "remainingDownloads": 8,
      "requiresPassword": true,
      "createdAt": "2025-11-06T23:45:03Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

### DELETE /sharing/:shareId
Revoke file share link.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "File share revoked successfully"
}
```

### PATCH /sharing/:shareId
Update share settings.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "maxDownloads": 20,
  "allowDownload": false
}
```

**Response:**
```json
{
  "message": "File share updated successfully",
  "share": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "maxDownloads": 20,
    "allowDownload": false,
    "isActive": true
  }
}
```

## Audit Endpoints

### GET /audit/logs
Retrieve audit logs (admin only).

**Request Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
```
?page=1&limit=50&eventType=FILE_UPLOADED&severity=INFO
```

**Response:**
```json
{
  "logs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "eventType": "FILE_UPLOADED",
      "eventCategory": "FILE",
      "severity": "INFO",
      "description": "File uploaded: document.pdf",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "resourceId": "550e8400-e29b-41d4-a716-446655440002",
      "createdAt": "2025-11-06T23:45:03Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 3
}
```

### GET /audit/security-incidents
Get security incidents (admin only).

**Response:**
```json
{
  "incidents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "userId": null,
      "eventType": "UNAUTHORIZED_ACCESS",
      "eventCategory": "SECURITY",
      "severity": "HIGH",
      "description": "Unauthorized access attempt to admin area",
      "ipAddress": "203.0.113.1",
      "userAgent": "curl/7.68.0",
      "isSecurityIncident": true,
      "isResolved": false,
      "createdAt": "2025-11-06T23:45:03Z"
    }
  ],
  "total": 5,
  "page": 1,
  "pages": 1
}
```

### GET /audit/statistics
Get system audit statistics (admin only).

**Response:**
```json
{
  "period": "7d",
  "startDate": "2025-10-30T00:00:00Z",
  "endDate": "2025-11-06T23:59:59Z",
  "eventCounts": {
    "FILE_UPLOADED": 45,
    "FILE_DOWNLOADED": 123,
    "AUTH_LOGIN": 89,
    "FILE_DELETED": 12
  },
  "securityIncidents": {
    "UNAUTHORIZED_ACCESS": 3,
    "MALWARE_DETECTED": 1
  },
  "topUsers": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "activityCount": 67
    }
  ],
  "dailyActivity": [
    {
      "date": "2025-11-01",
      "count": 34
    }
  ]
}
```

## Admin Endpoints

### GET /admin/overview
Get system overview statistics (admin only).

**Response:**
```json
{
  "users": {
    "total": 150,
    "active": 142,
    "admins": 3
  },
  "files": {
    "total": 2450,
    "totalStorage": 5368709120,
    "averageSize": 2191324
  },
  "shares": {
    "total": 89,
    "active": 67
  },
  "security": {
    "recentIncidents": 2
  },
  "system": {
    "database": "healthy",
    "storage": "healthy",
    "antivirus": "healthy",
    "lastCheck": "2025-11-06T23:45:03Z"
  }
}
```

### GET /admin/users
List all users (admin only).

**Response:**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-10-01T00:00:00Z",
      "lastLogin": "2025-11-06T23:30:00Z",
      "fileCount": 45,
      "loginAttempts": 0
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 8
}
```

### PATCH /admin/users/:userId
Update user account (admin only).

**Request:**
```json
{
  "firstName": "Jane",
  "role": "premium",
  "isActive": true
}
```

### DELETE /admin/users/:userId
Delete user account and all associated data (admin only).

### GET /admin/config
Get system configuration (admin only).

**Response:**
```json
{
  "config": {
    "maxFileSize": 104857600,
    "allowedFileTypes": [
      "image/jpeg",
      "image/png",
      "application/pdf"
    ],
    "jwtExpiresIn": "24h",
    "storageProvider": "local",
    "antivirusEnabled": true,
    "maxLoginAttempts": 5,
    "lockoutDuration": 30,
    "cleanupInterval": 24,
    "auditRetentionDays": 90
  }
}
```

## Health Check Endpoints

### GET /health
System health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T23:45:03Z",
  "version": "1.0.0"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 410 | Gone - Resource has expired |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

## Rate Limiting

### Limits:
- **Authentication**: 5 attempts per 15 minutes
- **File Upload**: 100 requests per 15 minutes per user
- **File Download**: 20 downloads per minute per user
- **API General**: 100 requests per 15 minutes per IP
- **Admin API**: 1000 requests per 15 minutes per admin

### Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635723456
```

## File Upload Limits

### Constraints:
- **Maximum File Size**: 100MB (configurable)
- **Maximum Files per Upload**: 10
- **Allowed File Types**: Images, PDF, Documents, Spreadsheets
- **Upload Timeout**: 300 seconds
- **Concurrent Uploads**: 5 per user

### Supported File Types:
```
image/jpeg, image/png, image/gif
application/pdf
text/plain
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.ms-excel
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
text/csv
```

## Security Considerations

### Headers:
All API responses include security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### HTTPS Required:
All API endpoints require HTTPS in production environments.

### CORS:
Cross-origin requests are restricted to configured origins.

## SDKs and Libraries

### JavaScript/TypeScript:
```javascript
// Using fetch
const response = await fetch('/api/files', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Python:
```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}
response = requests.get('/api/files', headers=headers)
```

### cURL:
```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     https://api.example.com/api/files
```

## Testing

### Postman Collection:
A Postman collection is available for API testing with pre-configured requests and environment variables.

### Test Data:
```json
{
  "user": {
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  },
  "files": {
    "testImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGUE3N2kAAAAABJRU5ErkJggg=="
  }
}
```

---

For additional support, please refer to the [Security Implementation Guide](security-implementation.md) and the main [README.md](README.md).