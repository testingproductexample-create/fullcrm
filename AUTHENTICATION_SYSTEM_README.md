# Multi-Factor Authentication (MFA) System

A comprehensive multi-factor authentication system with SMS, Email, and Authenticator app support, built for the UAE Tailoring CRM application.

## 🚀 Features

### Core Authentication Features
- **Multi-Factor Authentication (MFA)** with multiple methods
- **Account Lockout Protection** against brute force attacks
- **Session Management** with device fingerprinting
- **Password Policies** with configurable requirements
- **Security Logging** and audit trails
- **Trusted Device Management**
- **Backup Codes** for account recovery

### Supported MFA Methods
1. **Time-based One-Time Password (TOTP)**
   - Google Authenticator, Authy, Microsoft Authenticator support
   - QR code generation for easy setup
   - 30-second time window with tolerance

2. **SMS Verification**
   - Text message codes
   - Phone number validation
   - Automatic code expiration

3. **Email Verification**
   - Email-based verification codes
   - Configurable expiration times
   - Email delivery tracking

4. **Backup Codes**
   - One-time use backup codes
   - Configurable quantity (default: 10)
   - Secure generation and storage

### Security Features
- **Account Lockout**: Progressive lockout with configurable thresholds
- **Password Policy**: Customizable requirements (length, complexity, reuse prevention)
- **Session Management**: Automatic timeout and concurrent session limits
- **Device Fingerprinting**: Browser and device identification
- **Security Logging**: Comprehensive audit trail
- **IP Tracking**: Location and IP address monitoring

## 📁 Project Structure

```
crm-app/
├── app/
│   ├── api/auth/
│   │   ├── mfa/route.ts          # MFA API endpoints
│   │   └── password/route.ts     # Password management API
│   ├── auth/
│   │   └── login/page.tsx        # Updated login with MFA
│   ├── dashboard/
│   │   └── security-settings/    # User security settings
│   └── layout.tsx                # Updated with SecurityProvider
├── components/auth/
│   ├── MFAVerification.tsx       # MFA verification component
│   ├── MFASetup.tsx             # MFA setup component
│   ├── MFAManagement.tsx        # MFA management interface
│   ├── PasswordPolicy.tsx       # Password policy component
│   └── SessionManagement.tsx    # Session management interface
├── contexts/
│   ├── AuthContext.tsx          # Authentication context
│   └── SecurityContext.tsx      # Security and MFA context
├── lib/
│   └── auth-helpers.ts          # Authentication utilities
├── types/
│   └── auth.ts                  # TypeScript interfaces
└── supabase/migrations/
    └── 20241106_mfa_authentication_system.sql
```

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd crm-app
npm install
# or
pnpm install
```

### 2. Database Setup

Run the migration to create the necessary tables:

```bash
# Apply the MFA migration
supabase db push
```

### 3. Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
# or
pnpm dev
```

## 🔧 Configuration

### Password Policy Configuration

```typescript
const passwordPolicy: PasswordPolicy = {
  min_length: 8,
  require_uppercase: true,
  require_lowercase: true,
  require_numbers: true,
  require_symbols: true,
  max_age_days: 90,
  prevent_reuse: 5,
  complexity_score: 3,
};
```

### Account Lockout Configuration

```typescript
const lockoutConfig = {
  max_attempts: 5,
  lockout_duration_minutes: 30,
  progressive_lockout: true,
  reset_after_minutes: 60,
};
```

### Session Configuration

```typescript
const sessionConfig = {
  session_timeout_minutes: 120,
  trusted_device_duration_days: 30,
  max_concurrent_sessions: 5,
};
```

## 🎯 Usage

### 1. MFA Setup for Users

Users can set up MFA through the security settings page:

```typescript
import MFASetup from '@/components/auth/MFASetup';

<MFASetup
  onComplete={handleSetupComplete}
  onSkip={handleSkip}
  userId={user.id}
/>
```

### 2. MFA Verification

```typescript
import MFAVerification from '@/components/auth/MFAVerification';

<MFAVerification
  onSuccess={handleMFASuccess}
  onError={handleMFAError}
  onCancel={handleMFACancel}
  userId={user.id}
  preferredMethod="totp"
  availableMethods={['totp', 'sms', 'email', 'backup_codes']}
/>
```

### 3. Password Management

```typescript
import { PasswordChangeForm } from '@/components/auth/PasswordPolicy';

<PasswordChangeForm
  onSubmit={handlePasswordChange}
  onCancel={handleCancel}
  loading={isLoading}
/>
```

### 4. Session Management

```typescript
import SessionManagement from '@/components/auth/SessionManagement';

<SessionManagement
  onClose={handleClose}
  sessions={userSessions}
  onRevokeSession={revokeSession}
  onRevokeAllSessions={revokeAllSessions}
/>
```

## 🔐 API Endpoints

### MFA Endpoints

#### POST `/api/auth/mfa`
- **verify_totp**: Verify TOTP code
- **send_sms_code**: Send SMS verification code
- **send_email_code**: Send email verification code
- **verify_sms_code**: Verify SMS code
- **verify_email_code**: Verify email code
- **verify_backup_code**: Verify backup code

### Password Endpoints

#### GET `/api/auth/password`
- **check_strength**: Validate password strength
- **check_lockout**: Check account lockout status
- **validate_reset_token**: Validate password reset token

#### POST `/api/auth/password`
- **change_password**: Change user password
- **reset_password**: Reset password with token
- **forgot_password**: Request password reset
- **validate_current**: Validate current password

## 📊 Database Schema

### Key Tables

1. **user_mfa_settings** - Stores MFA configuration
2. **user_security_settings** - Security settings and lockout status
3. **user_sessions** - Active user sessions
4. **trusted_devices** - Trusted device list
5. **security_logs** - Security audit logs
6. **mfa_attempts** - MFA verification attempts
7. **login_attempts** - Login attempt tracking
8. **auth_challenges** - Password reset and verification challenges
9. **password_history** - Password reuse prevention

## 🎨 Components

### MFAVerification
Handles the MFA verification process with support for all MFA methods.

**Props:**
- `onSuccess`: Called when verification succeeds
- `onError`: Called on verification error
- `onCancel`: Cancel callback
- `userId`: User ID
- `preferredMethod`: Preferred MFA method
- `availableMethods`: Array of available methods

### MFASetup
Guides users through MFA setup process.

**Props:**
- `onComplete`: Setup completion callback
- `onSkip`: Skip setup callback
- `userId`: User ID

### MFAManagement
Interface for managing existing MFA settings.

**Props:**
- `userId`: User ID
- `onClose`: Close callback

### PasswordPolicy
Password input with real-time validation.

**Props:**
- `policy`: Password policy configuration
- `value`: Current password value
- `onChange`: Password change callback
- `onValidationChange`: Validation callback
- `showRequirements`: Show/hide requirements
- `compact`: Compact mode

### SessionManagement
Interface for managing user sessions and devices.

**Props:**
- `onClose`: Close callback
- `sessions`: User sessions
- `onRevokeSession`: Revoke session callback
- `onRevokeAllSessions`: Revoke all sessions callback

## 🔒 Security Features

### Account Protection
- **Progressive Lockout**: Increasing lockout duration for repeated failures
- **IP-based Tracking**: Track failed attempts by IP address
- **Time-based Reset**: Automatic reset of failed attempts after time period

### Session Security
- **Device Fingerprinting**: Browser and device identification
- **Concurrent Session Limits**: Control maximum active sessions
- **Automatic Timeout**: Session expiration management
- **Trusted Device Management**: Mark devices as trusted

### Password Security
- **Complexity Requirements**: Configurable password strength
- **Reuse Prevention**: Prevent password reuse
- **Expiration**: Password age limits
- **History Tracking**: Store password change history

### Audit & Monitoring
- **Security Logging**: Comprehensive event logging
- **Real-time Monitoring**: Track security events
- **IP Tracking**: Monitor access locations
- **Failed Attempt Analysis**: Pattern detection

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### Environment Setup
1. Set up environment variables
2. Run database migrations
3. Configure SMS/Email providers
4. Set up security monitoring

### Production Checklist
- [ ] Enable RLS policies
- [ ] Configure SMS/Email providers
- [ ] Set up monitoring and alerts
- [ ] Test all MFA methods
- [ ] Verify security logging
- [ ] Configure backup procedures
- [ ] Test account lockout
- [ ] Verify session management

## 📈 Monitoring & Analytics

### Security Metrics
- Failed login attempts
- MFA adoption rates
- Account lockouts
- Session anomalies
- Security score trends

### Alerting
- Account lockout events
- Multiple failed attempts
- Unusual login patterns
- Security policy violations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🔄 Changelog

### v1.0.0 (2025-11-06)
- Initial release
- MFA setup and verification
- Password policy implementation
- Session management
- Security logging
- Account lockout protection
- Device fingerprinting
- Trusted device management

---

**Note**: This system implements industry-standard security practices and should be regularly updated to maintain security compliance.
