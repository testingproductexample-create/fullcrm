// Authentication Utilities and MFA Helpers
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { authenticator } from 'otplib';
import bcrypt from 'bcryptjs';
import { 
  MFASetup, 
  TOTPSetup, 
  PasswordValidationResult, 
  SecurityLog, 
  DeviceFingerprint,
  MFAType,
  SessionInfo,
  PasswordPolicy
} from '@/types/auth';
import { supabase } from '@/lib/supabase';

// Password Policy Constants
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  min_length: 8,
  require_uppercase: true,
  require_lowercase: true,
  require_numbers: true,
  require_symbols: true,
  max_age_days: 90,
  prevent_reuse: 5,
  complexity_score: 3,
};

// Account Lockout Configuration
export const DEFAULT_LOCKOUT_CONFIG = {
  max_attempts: 5,
  lockout_duration_minutes: 30,
  progressive_lockout: true,
  reset_after_minutes: 60,
};

// Session Configuration
export const SESSION_CONFIG = {
  session_timeout_minutes: 120,
  trusted_device_duration_days: 30,
  max_concurrent_sessions: 5,
};

// MFA Helper Functions
export class MFAHelper {
  /**
   * Generate a new TOTP secret and QR code
   */
  static async generateTOTPSetup(
    userEmail: string, 
    serviceName: string = 'CRM App'
  ): Promise<TOTPSetup> {
    const secret = speakeasy.generateSecret({
      name: `${serviceName} (${userEmail})`,
      issuer: serviceName,
      length: 32,
    });

    const qr_code_url = await QRCode.toDataURL(secret.otpauth_url!);
    const backup_codes = this.generateBackupCodes(10);

    return {
      secret: secret.base32,
      qr_code_url,
      backup_codes,
    };
  }

  /**
   * Verify a TOTP code
   */
  static verifyTOTPCode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1, // Allow 1 step tolerance
    });
  }

  /**
   * Generate backup codes for MFA recovery
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash backup codes for secure storage
   */
  static async hashBackupCodes(codes: string[]): Promise<string[]> {
    const hashedCodes: string[] = [];
    for (const code of codes) {
      const hash = await bcrypt.hash(code, 12);
      hashedCodes.push(hash);
    }
    return hashedCodes;
  }

  /**
   * Verify backup code
   */
  static async verifyBackupCode(
    inputCode: string, 
    hashedCodes: string[]
  ): Promise<{ valid: boolean; remaining_codes: string[] }> {
    for (let i = 0; i < hashedCodes.length; i++) {
      const isValid = await bcrypt.compare(inputCode, hashedCodes[i]);
      if (isValid) {
        // Remove used code
        const remaining_codes = hashedCodes.filter((_, index) => index !== i);
        return { valid: true, remaining_codes };
      }
    }
    return { valid: false, remaining_codes: hashedCodes };
  }
}

// Password Security Helper
export class PasswordSecurityHelper {
  /**
   * Validate password against policy
   */
  static validatePassword(
    password: string, 
    policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
  ): PasswordValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length < policy.min_length) {
      errors.push(`Password must be at least ${policy.min_length} characters long`);
    } else {
      score += 1;
    }

    // Uppercase check
    if (policy.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // Lowercase check
    if (policy.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 1;
    }

    // Numbers check
    if (policy.require_numbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 1;
    }

    // Symbols check
    if (policy.require_symbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    }

    // Common patterns check
    const commonPatterns = [
      /(.)\1{2,}/, // Repeated characters
      /123|abc|qwe|password|admin|test/i, // Common sequences
    ];

    const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
    if (hasCommonPattern) {
      errors.push('Password contains common patterns that make it weak');
      score -= 1;
    }

    // Length bonus
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Final scoring
    const finalScore = Math.max(0, Math.min(5, score));
    const isValid = errors.length === 0 && finalScore >= policy.complexity_score;

    if (!isValid) {
      suggestions.push('Use a mix of uppercase, lowercase, numbers, and symbols');
      if (password.length < 12) suggestions.push('Consider using a longer password for better security');
      if (hasCommonPattern) suggestions.push('Avoid common patterns and dictionary words');
    }

    return {
      isValid,
      score: finalScore,
      errors,
      suggestions,
    };
  }

  /**
   * Hash password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// Device Fingerprinting
export class DeviceFingerprintHelper {
  /**
   * Generate device fingerprint
   */
  static generateFingerprint(): DeviceFingerprint {
    if (typeof window === 'undefined') {
      // Server-side fallback
      return {
        user_agent: 'unknown',
        screen_resolution: 'unknown',
        timezone: 'unknown',
        language: 'unknown',
        platform: 'unknown',
        is_mobile: false,
        is_touch_capable: false,
        is_https: true,
      };
    }

    const { screen, navigator, location } = window;
    
    return {
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      is_mobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      is_touch_capable: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      is_https: location.protocol === 'https:',
    };
  }

  /**
   * Create hash from fingerprint
   */
  static async createFingerprintHash(fingerprint: DeviceFingerprint): Promise<string> {
    const data = JSON.stringify(fingerprint);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Security Logging
export class SecurityLogger {
  /**
   * Create security log entry
   */
  static async createLog(
    userId: string,
    eventType: string,
    eventData: Record<string, any> = {},
    additionalData: {
      ip_address?: string;
      user_agent?: string;
    } = {}
  ): Promise<void> {
    try {
      await supabase.from('security_logs').insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        ip_address: additionalData.ip_address || 'unknown',
        user_agent: additionalData.user_agent || 'unknown',
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to create security log:', error);
    }
  }

  /**
   * Get security logs for user
   */
  static async getUserLogs(
    userId: string, 
    limit: number = 50
  ): Promise<SecurityLog[]> {
    const { data, error } = await supabase
      .from('security_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get recent security events
   */
  static async getRecentEvents(
    userId: string,
    eventTypes: string[],
    hours: number = 24
  ): Promise<SecurityLog[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const { data, error } = await supabase
      .from('security_logs')
      .select('*')
      .eq('user_id', userId)
      .in('event_type', eventTypes)
      .gte('created_at', cutoffTime.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Account Lockout Management
export class AccountLockoutHelper {
  /**
   * Check if account is locked
   */
  static async checkLockoutStatus(userId: string) {
    const { data: lockout } = await supabase
      .from('user_security_settings')
      .select('failed_attempts, last_failed_attempt, locked_until')
      .eq('user_id', userId)
      .single();

    if (!lockout) return { isLocked: false, remainingAttempts: DEFAULT_LOCKOUT_CONFIG.max_attempts };

    const now = new Date();
    const lockedUntil = lockout.locked_until ? new Date(lockout.locked_until) : null;
    
    if (lockedUntil && lockedUntil > now) {
      const remainingMs = lockedUntil.getTime() - now.getTime();
      return { 
        isLocked: true, 
        remainingAttempts: 0,
        lockoutDurationMs: remainingMs,
        lockedUntil: lockedUntil.toISOString()
      };
    }

    const attemptsSince = lockout.last_failed_attempt 
      ? now.getTime() - new Date(lockout.last_failed_attempt).getTime()
      : Infinity;
    
    // Reset failed attempts if enough time has passed
    if (attemptsSince > DEFAULT_LOCKOUT_CONFIG.reset_after_minutes * 60 * 1000) {
      await this.resetFailedAttempts(userId);
      return { isLocked: false, remainingAttempts: DEFAULT_LOCKOUT_CONFIG.max_attempts };
    }

    return { 
      isLocked: false, 
      remainingAttempts: Math.max(0, DEFAULT_LOCKOUT_CONFIG.max_attempts - lockout.failed_attempts)
    };
  }

  /**
   * Record failed login attempt
   */
  static async recordFailedAttempt(userId: string): Promise<{ isLocked: boolean; remainingAttempts: number }> {
    const status = await this.checkLockoutStatus(userId);
    
    if (status.isLocked) return status;

    const { data: lockout } = await supabase
      .from('user_security_settings')
      .select('failed_attempts')
      .eq('user_id', userId)
      .single();

    const newFailedAttempts = (lockout?.failed_attempts || 0) + 1;
    const now = new Date().toISOString();

    if (newFailedAttempts >= DEFAULT_LOCKOUT_CONFIG.max_attempts) {
      const lockoutUntil = new Date();
      lockoutUntil.setMinutes(lockoutUntil.getMinutes() + DEFAULT_LOCKOUT_CONFIG.lockout_duration_minutes);

      await supabase
        .from('user_security_settings')
        .upsert({
          user_id: userId,
          failed_attempts: newFailedAttempts,
          last_failed_attempt: now,
          locked_until: lockoutUntil.toISOString(),
        });

      // Log security event
      await SecurityLogger.createLog(
        userId,
        'account_locked',
        { failed_attempts: newFailedAttempts }
      );

      return { isLocked: true, remainingAttempts: 0 };
    } else {
      await supabase
        .from('user_security_settings')
        .upsert({
          user_id: userId,
          failed_attempts: newFailedAttempts,
          last_failed_attempt: now,
        });

      return { isLocked: false, remainingAttempts: DEFAULT_LOCKOUT_CONFIG.max_attempts - newFailedAttempts };
    }
  }

  /**
   * Reset failed attempts after successful login
   */
  static async resetFailedAttempts(userId: string): Promise<void> {
    await supabase
      .from('user_security_settings')
      .upsert({
        user_id: userId,
        failed_attempts: 0,
        last_failed_attempt: null,
        locked_until: null,
      });
  }

  /**
   * Unlock account (for admin use)
   */
  static async unlockAccount(userId: string, unlockedBy: string): Promise<void> {
    await supabase
      .from('user_security_settings')
      .upsert({
        user_id: userId,
        failed_attempts: 0,
        last_failed_attempt: null,
        locked_until: null,
      });

    // Log security event
    await SecurityLogger.createLog(
      userId,
      'account_unlocked',
      { unlocked_by: unlockedBy }
    );
  }
}

// Session Management
export class SessionManager {
  /**
   * Create new session
   */
  static async createSession(
    userId: string,
    deviceFingerprint: string,
    additionalData: {
      ip_address?: string;
      user_agent?: string;
    } = {}
  ): Promise<SessionInfo> {
    // Check concurrent session limit
    await this.revokeOldestSessions(userId);

    const sessionData = {
      user_id: userId,
      device_fingerprint: deviceFingerprint,
      ip_address: additionalData.ip_address || 'unknown',
      user_agent: additionalData.user_agent || 'unknown',
      created_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      expires_at: new Date(Date.now() + SESSION_CONFIG.session_timeout_minutes * 60 * 1000).toISOString(),
      is_active: true,
      is_trusted: false,
    };

    const { data, error } = await supabase
      .from('user_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update session activity
   */
  static async updateSessionActivity(sessionId: string): Promise<void> {
    const { data: session } = await supabase
      .from('user_sessions')
      .select('expires_at')
      .eq('id', sessionId)
      .single();

    if (session) {
      const now = new Date();
      const expiresAt = new Date(session.expires_at);

      if (now < expiresAt) {
        await supabase
          .from('user_sessions')
          .update({
            last_accessed: now.toISOString(),
          })
          .eq('id', sessionId);
      }
    }
  }

  /**
   * Get active sessions for user
   */
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_accessed', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Revoke specific session
   */
  static async revokeSession(sessionId: string): Promise<void> {
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);
  }

  /**
   * Revoke all sessions for user
   */
  static async revokeAllSessions(userId: string, excludeSessionId?: string): Promise<void> {
    let query = supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (excludeSessionId) {
      query = query.neq('id', excludeSessionId);
    }

    await query;
  }

  /**
   * Revoke oldest sessions if limit exceeded
   */
  private static async revokeOldestSessions(userId: string): Promise<void> {
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(SESSION_CONFIG.max_concurrent_sessions + 1);

    if (sessions && sessions.length > SESSION_CONFIG.max_concurrent_sessions) {
      const sessionsToRevoke = sessions.slice(SESSION_CONFIG.max_concurrent_sessions);
      const sessionIds = sessionsToRevoke.map(s => s.id);
      
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .in('id', sessionIds);
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const now = new Date().toISOString();
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .lt('expires_at', now);
  }
}

// Utility Functions
export const formatLockoutTime = (durationMs: number): string => {
  const minutes = Math.ceil(durationMs / (1000 * 60));
  return minutes <= 1 ? '1 minute' : `${minutes} minutes`;
};

export const formatTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const getMFAMethodIcon = (method: MFAType): string => {
  const icons = {
    totp: '📱',
    sms: '📞',
    email: '📧',
    backup_codes: '🔑',
  };
  return icons[method] || '🔐';
};

export const getMFAMethodName = (method: MFAType): string => {
  const names = {
    totp: 'Authenticator App',
    sms: 'SMS Code',
    email: 'Email Code',
    backup_codes: 'Backup Codes',
  };
  return names[method] || 'Unknown';
};

export const getPasswordStrengthColor = (score: number): string => {
  if (score <= 1) return 'text-red-600';
  if (score <= 2) return 'text-orange-600';
  if (score <= 3) return 'text-yellow-600';
  if (score <= 4) return 'text-green-600';
  return 'text-emerald-600';
};

export const getPasswordStrengthText = (score: number): string => {
  if (score <= 1) return 'Weak';
  if (score <= 2) return 'Fair';
  if (score <= 3) return 'Good';
  if (score <= 4) return 'Strong';
  return 'Excellent';
};
