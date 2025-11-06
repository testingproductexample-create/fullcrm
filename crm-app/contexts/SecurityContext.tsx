'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  SecurityContextType,
  PasswordPolicy,
  AccountLockout,
  SessionInfo,
  TrustedDevice,
  SecurityLog,
  PasswordValidationResult,
  MFAValidationResult,
  SecurityEventType,
  MFAType
} from '@/types/auth';
import { 
  DEFAULT_PASSWORD_POLICY,
  DEFAULT_LOCKOUT_CONFIG,
  PasswordSecurityHelper,
  AccountLockoutHelper,
  SessionManager,
  SecurityLogger,
  MFAHelper,
  DeviceFingerprintHelper
} from '@/lib/auth-helpers';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>(DEFAULT_PASSWORD_POLICY);
  const [accountLockout, setAccountLockout] = useState<AccountLockout>({
    failed_attempts: 0,
    last_failed_attempt: null,
    locked_until: null,
    lockout_threshold: DEFAULT_LOCKOUT_CONFIG.max_attempts,
    lockout_duration_minutes: DEFAULT_LOCKOUT_CONFIG.lockout_duration_minutes,
  });
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user security data
  const loadSecurityData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Load account lockout status
      const lockoutStatus = await AccountLockoutHelper.checkLockoutStatus(user.id);
      setAccountLockout(prev => ({
        ...prev,
        failed_attempts: lockoutStatus.remainingAttempts < DEFAULT_LOCKOUT_CONFIG.max_attempts 
          ? DEFAULT_LOCKOUT_CONFIG.max_attempts - lockoutStatus.remainingAttempts
          : 0,
        last_failed_attempt: lockoutStatus.lockedUntil ? new Date().toISOString() : null,
        locked_until: lockoutStatus.lockedUntil || null,
      }));

      // Load active sessions
      const userSessions = await SessionManager.getUserSessions(user.id);
      setSessions(userSessions);

      // Load trusted devices
      const { data: devices } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used', { ascending: false });
      setTrustedDevices(devices || []);

      // Load security logs
      const logs = await SecurityLogger.getUserLogs(user.id, 100);
      setSecurityLogs(logs);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user, loadSecurityData]);

  // Password validation
  const validatePassword = useCallback((password: string): PasswordValidationResult => {
    return PasswordSecurityHelper.validatePassword(password, passwordPolicy);
  }, [passwordPolicy]);

  // Check account lockout
  const checkAccountLockout = useCallback(async (userId: string): Promise<MFAValidationResult> => {
    const status = await AccountLockoutHelper.checkLockoutStatus(userId);
    
    if (status.isLocked) {
      return {
        isValid: false,
        remaining_attempts: 0,
        lockout_until: status.lockedUntil,
        error_message: 'Account is temporarily locked due to too many failed attempts',
      };
    }

    return {
      isValid: true,
      remaining_attempts: status.remainingAttempts,
      lockout_until: null,
    };
  }, []);

  // MFA Helper functions
  const createMFASecret = useCallback(async (): Promise<any> => {
    if (!user) throw new Error('User not authenticated');
    
    return await MFAHelper.generateTOTPSetup(user.email || 'user@example.com');
  }, [user]);

  const verifyTOTPCode = useCallback((secret: string, code: string): boolean => {
    return MFAHelper.verifyTOTPCode(secret, code);
  }, []);

  const sendSMSCode = useCallback(async (phoneNumber: string): Promise<boolean> => {
    // Implement SMS sending logic
    try {
      await SecurityLogger.createLog(
        user?.id || 'unknown',
        'mfa_challenge',
        { method: 'sms', phone_number: phoneNumber }
      );
      // Here you would integrate with your SMS provider
      console.log('SMS code sent to:', phoneNumber);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }, [user]);

  const sendEmailCode = useCallback(async (email: string): Promise<boolean> => {
    // Implement email sending logic
    try {
      await SecurityLogger.createLog(
        user?.id || 'unknown',
        'mfa_challenge',
        { method: 'email', email }
      );
      // Here you would integrate with your email service
      console.log('Email code sent to:', email);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }, [user]);

  const generateBackupCodes = useCallback((): string[] => {
    return MFAHelper.generateBackupCodes(10);
  }, []);

  // Security logging
  const createSecurityLog = useCallback(async (event: Omit<SecurityLog, 'id' | 'created_at'>): Promise<void> => {
    try {
      await SecurityLogger.createLog(
        event.user_id,
        event.event_type,
        event.event_data,
        {
          ip_address: event.ip_address,
          user_agent: event.user_agent,
        }
      );
      
      // Refresh logs
      if (user) {
        const logs = await SecurityLogger.getUserLogs(user.id, 100);
        setSecurityLogs(logs);
      }
    } catch (err) {
      console.error('Failed to create security log:', err);
    }
  }, [user]);

  // Session management
  const updateSession = useCallback(async (sessionId: string, updates: Partial<SessionInfo>): Promise<void> => {
    try {
      await supabase
        .from('user_sessions')
        .update(updates)
        .eq('id', sessionId);

      // Refresh sessions
      if (user) {
        const userSessions = await SessionManager.getUserSessions(user.id);
        setSessions(userSessions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
    }
  }, [user]);

  const revokeSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await SessionManager.revokeSession(sessionId);
      
      // Refresh sessions
      if (user) {
        const userSessions = await SessionManager.getUserSessions(user.id);
        setSessions(userSessions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    }
  }, [user]);

  const revokeAllSessions = useCallback(async (excludeCurrent: boolean = false): Promise<void> => {
    try {
      if (!user) return;
      
      const currentSession = sessions.find(s => s.is_active);
      const excludeId = excludeCurrent && currentSession ? currentSession.id : undefined;
      
      await SessionManager.revokeAllSessions(user.id, excludeId);
      
      // Refresh sessions
      const userSessions = await SessionManager.getUserSessions(user.id);
      setSessions(userSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke sessions');
    }
  }, [user, sessions]);

  // Trusted device management
  const addTrustedDevice = useCallback(async (device: Omit<TrustedDevice, 'id'>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .insert({
          ...device,
          user_id: user?.id,
        });

      if (error) throw error;

      // Refresh trusted devices
      const { data: devices } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('last_used', { ascending: false });
      
      setTrustedDevices(devices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add trusted device');
    }
  }, [user]);

  const removeTrustedDevice = useCallback(async (deviceId: string): Promise<void> => {
    try {
      await supabase
        .from('trusted_devices')
        .update({ is_active: false })
        .eq('id', deviceId);

      // Refresh trusted devices
      const { data: devices } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('last_used', { ascending: false });
      
      setTrustedDevices(devices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove trusted device');
    }
  }, [user]);

  const contextValue: SecurityContextType = {
    passwordPolicy,
    accountLockout,
    sessions,
    trustedDevices,
    securityLogs,
    loading,
    error,
    
    // Actions
    validatePassword,
    checkAccountLockout,
    createMFASecret,
    verifyTOTPCode,
    sendSMSCode,
    sendEmailCode,
    generateBackupCodes,
    createSecurityLog,
    updateSession,
    revokeSession,
    revokeAllSessions,
    addTrustedDevice,
    removeTrustedDevice,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
