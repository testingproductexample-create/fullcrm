// Multi-Factor Authentication Types

export interface MFAMethod {
  id: string;
  type: MFAType;
  name: string;
  enabled: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export type MFAType = 'totp' | 'sms' | 'email' | 'backup_codes';

export interface TOTPSetup {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export interface SMSConfig {
  phone_number: string;
  carrier?: string;
  verified: boolean;
}

export interface EmailConfig {
  email: string;
  verified: boolean;
}

export interface BackupCodesConfig {
  codes: string[];
  used_codes: string[];
  generated_at: string;
}

export interface MFASettings {
  preferred_method: MFAType | null;
  methods: {
    totp: TOTPSetup | null;
    sms: SMSConfig | null;
    email: EmailConfig | null;
    backup_codes: BackupCodesConfig | null;
  };
  enforce_mfa: boolean;
  trusted_devices: TrustedDevice[];
}

export interface TrustedDevice {
  id: string;
  device_name: string;
  device_fingerprint: string;
  ip_address: string;
  user_agent: string;
  last_used: string;
  expires_at: string;
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  max_age_days: number;
  prevent_reuse: number;
  complexity_score: number;
}

export interface AccountLockout {
  failed_attempts: number;
  last_failed_attempt: string | null;
  locked_until: string | null;
  lockout_threshold: number;
  lockout_duration_minutes: number;
}

export interface SecurityLog {
  id: string;
  user_id: string;
  event_type: SecurityEventType;
  event_data: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'mfa_challenge'
  | 'mfa_success'
  | 'mfa_failed'
  | 'password_changed'
  | 'account_locked'
  | 'account_unlocked'
  | 'trusted_device_added'
  | 'trusted_device_removed'
  | 'suspicious_activity';

export interface SessionInfo {
  id: string;
  user_id: string;
  device_fingerprint: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_accessed: string;
  expires_at: string;
  is_active: boolean;
  is_trusted: boolean;
}

export interface MFAAttempt {
  id: string;
  user_id: string;
  method_type: MFAType;
  code_attempted: string;
  success: boolean;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface PasswordChangeRequest {
  user_id: string;
  current_password: string;
  new_password: string;
  force_change: boolean;
}

export interface AuthChallenge {
  id: string;
  user_id: string;
  challenge_type: 'mfa' | 'password_reset';
  method_type: MFAType;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface LoginAttempt {
  id: string;
  user_id: string;
  email: string;
  success: boolean;
  ip_address: string;
  user_agent: string;
  mfa_required: boolean;
  mfa_completed: boolean;
  created_at: string;
}

// Validation Interfaces
export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  suggestions: string[];
}

export interface MFAValidationResult {
  isValid: boolean;
  remaining_attempts: number;
  lockout_until: string | null;
  error_message?: string;
}

// API Response Types
export interface AuthAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    timestamp: string;
    request_id: string;
  };
}

// Component Props Types
export interface MFAComponentProps {
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  userId?: string;
  challengeId?: string;
  preferredMethod?: MFAType;
  availableMethods: MFAType[];
}

export interface PasswordPolicyComponentProps {
  policy: PasswordPolicy;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (result: PasswordValidationResult) => void;
}

export interface SessionManagementComponentProps {
  sessions: SessionInfo[];
  onRevokeSession: (sessionId: string) => void;
  onRevokeAllSessions: () => void;
  onToggleTrustedDevice: (deviceId: string, trusted: boolean) => void;
}

// Utility Types
export interface CryptoHashOptions {
  algorithm: 'bcrypt' | 'argon2' | 'pbkdf2';
  salt_rounds?: number;
  key_length?: number;
}

export interface DeviceFingerprint {
  user_agent: string;
  screen_resolution: string;
  timezone: string;
  language: string;
  platform: string;
  is_mobile: boolean;
  is_touch_capable: boolean;
  is_https: boolean;
}

export interface SecurityContextType {
  passwordPolicy: PasswordPolicy;
  accountLockout: AccountLockout;
  sessions: SessionInfo[];
  trustedDevices: TrustedDevice[];
  securityLogs: SecurityLog[];
  loading: boolean;
  error: string | null;
  
  // Actions
  validatePassword: (password: string) => PasswordValidationResult;
  checkAccountLockout: (userId: string) => Promise<MFAValidationResult>;
  createMFASecret: () => Promise<TOTPSetup>;
  verifyTOTPCode: (secret: string, code: string) => boolean;
  sendSMSCode: (phoneNumber: string) => Promise<boolean>;
  sendEmailCode: (email: string) => Promise<boolean>;
  generateBackupCodes: () => string[];
  createSecurityLog: (event: Omit<SecurityLog, 'id' | 'created_at'>) => Promise<void>;
  updateSession: (sessionId: string, updates: Partial<SessionInfo>) => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: (excludeCurrent?: boolean) => Promise<void>;
  addTrustedDevice: (device: Omit<TrustedDevice, 'id'>) => Promise<void>;
  removeTrustedDevice: (deviceId: string) => Promise<void>;
}