'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Mail, Lock, Loader2, Shield, AlertCircle } from 'lucide-react';
import MFAVerification from '@/components/auth/MFAVerification';
import { supabase } from '@/lib/supabase';
import { AccountLockoutHelper, SessionManager, SecurityLogger, DeviceFingerprintHelper } from '@/lib/auth-helpers';
import { MFAType } from '@/types/auth';

type LoginStep = 'credentials' | 'mfa';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<LoginStep>('credentials');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<MFAType[]>([]);
  const [preferredMethod, setPreferredMethod] = useState<MFAType | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [lockoutInfo, setLockoutInfo] = useState<any>(null);
  
  const { user, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Check for account lockout on email change
  useEffect(() => {
    if (email) {
      checkAccountLockout();
    }
  }, [email]);

  const checkAccountLockout = async () => {
    try {
      // Get user by email first
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .eq('full_name', email) // This is a simplified approach
        .single();

      if (userData) {
        const lockoutStatus = await AccountLockoutHelper.checkLockoutStatus(userData.id);
        setLockoutInfo(lockoutStatus);
      }
    } catch (error) {
      // User not found or other error
      setLockoutInfo(null);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockoutInfo?.isLocked) {
      setError(`Account is locked. Please try again after ${Math.ceil((new Date(lockoutInfo.lockedUntil).getTime() - Date.now()) / (1000 * 60))} minutes.`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Generate device fingerprint
      const fingerprint = await DeviceFingerprintHelper.generateFingerprint();
      const fingerprintHash = await DeviceFingerprintHelper.createFingerprintHash(fingerprint);

      // Attempt sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Record failed attempt
        if (data?.user) {
          const shouldLock = await AccountLockoutHelper.recordFailedAttempt(data.user.id);
          await SecurityLogger.createLog(
            data.user.id,
            'login_failed',
            { email, reason: signInError.message }
          );
        }
        setError('Invalid email or password');
        return;
      }

      // Check if MFA is required
      if (data.user) {
        const { data: mfaSettings } = await supabase
          .from('user_mfa_settings')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (mfaSettings && (mfaSettings.enforce_mfa || mfaSettings.preferred_method)) {
          // Get available MFA methods
          const methods: MFAType[] = [];
          if (mfaSettings.totp_secret) methods.push('totp');
          if (mfaSettings.sms_phone_number) methods.push('sms');
          if (mfaSettings.email_address) methods.push('email');
          if (mfaSettings.backup_codes && mfaSettings.backup_codes.length > 0) methods.push('backup_codes');

          if (methods.length > 0) {
            setUserId(data.user.id);
            setAvailableMethods(methods);
            setPreferredMethod(mfaSettings.preferred_method as MFAType);
            setMfaRequired(true);
            setCurrentStep('mfa');
            
            // Reset the sign in to prepare for MFA
            await supabase.auth.signOut();
            return;
          }
        }
      }

      // No MFA required, proceed to dashboard
      if (data.user) {
        // Create session
        await SessionManager.createSession(
          data.user.id,
          fingerprintHash,
          {
            user_agent: navigator.userAgent,
          }
        );

        // Reset failed attempts
        await AccountLockoutHelper.resetFailedAttempts(data.user.id);

        // Log successful login
        await SecurityLogger.createLog(
          data.user.id,
          'login_success',
          { email },
          { user_agent: navigator.userAgent }
        );

        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMFASuccess = async (token: string) => {
    try {
      if (userId && email && password) {
        // Re-authenticate with the token
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.user) {
          // Create session
          const fingerprint = await DeviceFingerprintHelper.generateFingerprint();
          const fingerprintHash = await DeviceFingerprintHelper.createFingerprintHash(fingerprint);

          await SessionManager.createSession(
            data.user.id,
            fingerprintHash,
            {
              user_agent: navigator.userAgent,
            }
          );

          // Log successful MFA
          await SecurityLogger.createLog(
            data.user.id,
            'mfa_success',
            { method: preferredMethod }
          );

          router.push('/dashboard');
        } else {
          setError('MFA verification failed. Please try again.');
          setCurrentStep('credentials');
        }
      }
    } catch (err) {
      setError('MFA verification failed. Please try again.');
      setCurrentStep('credentials');
    }
  };

  const handleMFACancel = () => {
    setCurrentStep('credentials');
    setMfaRequired(false);
    setAvailableMethods([]);
    setPreferredMethod(null);
    setUserId(null);
  };

  if (currentStep === 'mfa' && mfaRequired) {
    return (
      <MFAVerification
        onSuccess={handleMFASuccess}
        onCancel={handleMFACancel}
        userId={userId || undefined}
        preferredMethod={preferredMethod || undefined}
        availableMethods={availableMethods}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500 mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your CRM account</p>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {lockoutInfo?.isLocked && (
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center">
                <Shield className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-sm text-orange-700">
                  Account temporarily locked due to too many failed attempts
                </span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={loading || lockoutInfo?.isLocked}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Multi-factor authentication enabled for enhanced security
            </p>
            <p className="text-xs text-gray-500">
              Demo: admin@example.com / password123
            </p>
          </div>

          {/* Security Features Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Security Features
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Multi-factor authentication (MFA)</li>
              <li>• Account lockout protection</li>
              <li>• Session management</li>
              <li>• Device fingerprinting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
