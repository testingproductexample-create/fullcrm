'use client';

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Mail, 
  MessageSquare, 
  Key, 
  Shield, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { MFAComponentProps, MFAType } from '@/types/auth';
import { useSecurity } from '@/contexts/SecurityContext';
import { getMFAMethodIcon, getMFAMethodName } from '@/lib/auth-helpers';

interface MFAStep {
  type: MFAType;
  icon: React.ReactNode;
  name: string;
  description: string;
}

const MFA_STEPS: MFAStep[] = [
  {
    type: 'totp',
    icon: <Smartphone className="w-5 h-5" />,
    name: 'Authenticator App',
    description: 'Enter the 6-digit code from your authenticator app'
  },
  {
    type: 'sms',
    icon: <MessageSquare className="w-5 h-5" />,
    name: 'SMS Code',
    description: 'Enter the code sent to your phone'
  },
  {
    type: 'email',
    icon: <Mail className="w-5 h-5" />,
    name: 'Email Code',
    description: 'Enter the code sent to your email'
  },
  {
    type: 'backup_codes',
    icon: <Key className="w-5 h-5" />,
    name: 'Backup Code',
    description: 'Enter one of your backup codes'
  }
];

export default function MFAVerification({
  onSuccess,
  onError,
  onCancel,
  userId,
  challengeId,
  preferredMethod,
  availableMethods
}: MFAComponentProps) {
  const [selectedMethod, setSelectedMethod] = useState<MFAType | null>(
    preferredMethod && availableMethods.includes(preferredMethod) 
      ? preferredMethod 
      : availableMethods[0] || null
  );
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [codeSent, setCodeSent] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  const { 
    checkAccountLockout, 
    verifyTOTPCode, 
    sendSMSCode, 
    sendEmailCode, 
    createSecurityLog,
    checkAccountLockout: checkLockout
  } = useSecurity();

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || !selectedMethod) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time expired, reset code
          setCode('');
          setCodeSent(false);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, selectedMethod]);

  // Send code for SMS/Email
  useEffect(() => {
    if (selectedMethod && (selectedMethod === 'sms' || selectedMethod === 'email') && !codeSent) {
      sendVerificationCode();
    }
  }, [selectedMethod, codeSent]);

  const sendVerificationCode = async () => {
    if (!selectedMethod || !userId) return;

    setLoading(true);
    setError('');

    try {
      let success = false;

      if (selectedMethod === 'sms') {
        // In a real implementation, you would get the phone number from user settings
        success = await sendSMSCode('+1234567890');
      } else if (selectedMethod === 'email') {
        // In a real implementation, you would get the email from user settings
        success = await sendEmailCode('user@example.com');
      }

      if (success) {
        setCodeSent(true);
        setTimeLeft(300); // 5 minutes
        
        await createSecurityLog({
          user_id: userId,
          event_type: 'mfa_challenge',
          event_data: { method: selectedMethod },
          ip_address: 'unknown',
          user_agent: navigator.userAgent,
        });
      } else {
        setError(`Failed to send ${selectedMethod} code. Please try again.`);
      }
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow numbers and limit length
    const numericValue = value.replace(/\D/g, '').slice(0, 8);
    setCode(numericValue);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !code.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Check account lockout
      const lockoutCheck = await checkAccountLockout(userId!);
      if (!lockoutCheck.isValid) {
        setError(lockoutCheck.error_message || 'Account is locked');
        return;
      }

      let isValid = false;

      // Verify code based on method
      if (selectedMethod === 'totp') {
        // For TOTP, you would typically have the secret stored
        isValid = verifyTOTPCode('stored_secret', code);
      } else if (selectedMethod === 'backup_codes') {
        // For backup codes, you would verify against stored hashed codes
        // This is a placeholder - implement actual verification
        isValid = code.length === 8; // Simplified for demo
      } else {
        // For SMS/Email, you would verify against a temporary stored code
        // This is a placeholder - implement actual verification
        isValid = code.length === 6; // Simplified for demo
      }

      if (isValid) {
        // Log successful MFA
        await createSecurityLog({
          user_id: userId!,
          event_type: 'mfa_success',
          event_data: { method: selectedMethod },
          ip_address: 'unknown',
          user_agent: navigator.userAgent,
        });

        onSuccess?.(code);
      } else {
        const newAttemptsLeft = attemptsLeft - 1;
        setAttemptsLeft(newAttemptsLeft);

        // Log failed MFA attempt
        await createSecurityLog({
          user_id: userId!,
          event_type: 'mfa_failed',
          event_data: { method: selectedMethod, attempts_left: newAttemptsLeft },
          ip_address: 'unknown',
          user_agent: navigator.userAgent,
        });

        if (newAttemptsLeft <= 0) {
          setError('Too many failed attempts. Please try again later.');
        } else {
          setError(`Invalid code. ${newAttemptsLeft} attempts remaining.`);
          setCode('');
        }
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      onError?.('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStep = MFA_STEPS.find(step => step.type === selectedMethod);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
            <p className="text-gray-600">Verify your identity to continue</p>
          </div>

          {/* Method Selection */}
          {availableMethods.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose verification method:
              </label>
              <div className="space-y-2">
                {availableMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method);
                      setCode('');
                      setError('');
                      setTimeLeft(300);
                      setCodeSent(false);
                      setAttemptsLeft(3);
                    }}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      selectedMethod === method
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        selectedMethod === method ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getMFAMethodIcon(method)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {getMFAMethodName(method)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {MFA_STEPS.find(s => s.type === method)?.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verification Form */}
          {currentStep && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Method Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-500 text-white rounded-lg">
                    {currentStep.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{currentStep.name}</div>
                    <div className="text-sm text-gray-600">{currentStep.description}</div>
                  </div>
                </div>
              </div>

              {/* Timer for SMS/Email */}
              {(selectedMethod === 'sms' || selectedMethod === 'email') && codeSent && (
                <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-700">
                    Code expires in {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {/* Code Input */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedMethod === 'totp' ? 'Authenticator Code' : 
                   selectedMethod === 'backup_codes' ? 'Backup Code' : 'Verification Code'}
                </label>
                <div className="relative">
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={
                      selectedMethod === 'backup_codes' ? 'XXXXXXXX' : '000000'
                    }
                    maxLength={selectedMethod === 'backup_codes' ? 8 : 6}
                    required
                    disabled={loading}
                  />
                </div>
                {selectedMethod === 'backup_codes' && (
                  <p className="mt-2 text-xs text-gray-500">
                    Enter one of your 8-character backup codes
                  </p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Success Indicator */}
              {attemptsLeft < 3 && attemptsLeft > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center">
                  <CheckCircle className="w-4 h-4 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-700">
                    {attemptsLeft} attempts remaining
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={loading || !code.trim() || attemptsLeft <= 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                {(selectedMethod === 'sms' || selectedMethod === 'email') && codeSent && (
                  <button
                    type="button"
                    onClick={sendVerificationCode}
                    className="w-full py-2 px-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                )}

                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="w-full py-2 px-4 text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center justify-center"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Login
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Having trouble? Contact your administrator for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
