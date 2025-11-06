'use client';

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Mail, 
  MessageSquare, 
  Key, 
  Shield, 
  Plus, 
  Check, 
  X, 
  Copy, 
  QrCode,
  AlertCircle,
  Loader2,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { TOTPSetup, MFAType } from '@/types/auth';
import { useSecurity } from '@/contexts/SecurityContext';
import { getMFAMethodIcon, getMFAMethodName } from '@/lib/auth-helpers';

interface MFASetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  userId: string;
}

const MFA_METHODS: Array<{
  type: MFAType;
  name: string;
  description: string;
  icon: React.ReactNode;
  setupComponent: React.ReactNode;
}> = [
  {
    type: 'totp',
    name: 'Authenticator App',
    description: 'Use Google Authenticator, Authy, or similar apps',
    icon: <Smartphone className="w-5 h-5" />,
    setupComponent: <TOTPSetupComponent />,
  },
  {
    type: 'sms',
    name: 'SMS Code',
    description: 'Receive codes via text message',
    icon: <MessageSquare className="w-5 h-5" />,
    setupComponent: <SMSSsetupComponent />,
  },
  {
    type: 'email',
    name: 'Email Code',
    description: 'Receive codes via email',
    icon: <Mail className="w-5 h-5" />,
    setupComponent: <EmailSetupComponent />,
  },
  {
    type: 'backup_codes',
    name: 'Backup Codes',
    description: 'Use backup codes for emergency access',
    icon: <Key className="w-5 h-5" />,
    setupComponent: <BackupCodesSetupComponent />,
  }
];

function TOTPSetupComponent() {
  const { createMFASecret, verifyTOTPCode } = useSecurity();
  const [setup, setSetup] = useState<TOTPSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'generate' | 'verify' | 'complete'>('generate');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    generateSecret();
  }, []);

  const generateSecret = async () => {
    setLoading(true);
    setError('');
    try {
      const secretData = await createMFASecret();
      setSetup(secretData);
      setStep('verify');
    } catch (err) {
      setError('Failed to generate secret. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!setup || !verificationCode.trim()) return;

    setLoading(true);
    setError('');
    try {
      const isValid = verifyTOTPCode(setup.secret, verificationCode);
      if (isValid) {
        setStep('complete');
        // Here you would save the secret to the database
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading && !setup) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-500" />
        <p className="text-gray-600">Generating authentication secret...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === 'verify' && setup && (
        <>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Set up Authenticator App</h3>
            <p className="text-gray-600 text-sm">
              Scan the QR code with your authenticator app or enter the secret manually
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <img src={setup.qr_code_url} alt="QR Code" className="w-48 h-48" />
            </div>
          </div>

          {/* Manual Entry */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Key
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  {showSecret ? setup.secret : '••••••••••••••••••••••••••••••'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-3 text-gray-500 hover:text-gray-700"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(setup.secret)}
                  className="p-3 text-gray-500 hover:text-gray-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter the 6-digit code from your app
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full p-3 border border-gray-300 rounded-lg text-center text-xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={verifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 py-2 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </button>
            <button
              type="button"
              onClick={generateSecret}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Regenerate
            </button>
          </div>
        </>
      )}

      {step === 'complete' && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authenticator App Enabled!</h3>
          <p className="text-gray-600 text-sm">
            Your authenticator app is now configured and ready to use.
          </p>
        </div>
      )}
    </div>
  );
}

function SMSSsetupComponent() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [codeSent, setCodeSent] = useState(false);

  const sendSMSCode = async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate SMS sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCodeSent(true);
      setStep('verify');
    } catch (err) {
      setError('Failed to send SMS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (verificationCode === '123456') {
        setStep('complete');
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 'setup' && (
        <>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Set up SMS Authentication</h3>
            <p className="text-gray-600 text-sm">
              Enter your phone number to receive verification codes via SMS
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={sendSMSCode}
            disabled={loading || !phoneNumber.trim()}
            className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending Code...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </>
      )}

      {step === 'verify' && (
        <>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Verify Phone Number</h3>
            <p className="text-gray-600 text-sm">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full p-3 border border-gray-300 rounded-lg text-center text-xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={verifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 py-2 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep('setup')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </>
      )}

      {step === 'complete' && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">SMS Authentication Enabled!</h3>
          <p className="text-gray-600 text-sm">
            You'll receive verification codes at {phoneNumber}
          </p>
        </div>
      )}
    </div>
  );
}

function EmailSetupComponent() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');

  const sendEmailCode = async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStep('verify');
    } catch (err) {
      setError('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (verificationCode === '123456') {
        setStep('complete');
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 'setup' && (
        <>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Set up Email Authentication</h3>
            <p className="text-gray-600 text-sm">
              Enter your email address to receive verification codes
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="you@example.com"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={sendEmailCode}
            disabled={loading || !email.trim()}
            className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending Code...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </>
      )}

      {step === 'verify' && (
        <>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Verify Email Address</h3>
            <p className="text-gray-600 text-sm">
              Enter the 6-digit code sent to {email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full p-3 border border-gray-300 rounded-lg text-center text-xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={verifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 py-2 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep('setup')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </>
      )}

      {step === 'complete' && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Email Authentication Enabled!</h3>
          <p className="text-gray-600 text-sm">
            You'll receive verification codes at {email}
          </p>
        </div>
      )}
    </div>
  );
}

function BackupCodesSetupComponent() {
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'generate' | 'display' | 'complete'>('generate');

  useEffect(() => {
    generateBackupCodes();
  }, []);

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    setBackupCodes(codes);
    setStep('display');
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBackupCodes = () => {
    const content = backupCodes.join('\n');
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="space-y-6">
      {step === 'display' && (
        <>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Backup Codes</h3>
            <p className="text-gray-600 text-sm">
              Save these codes in a secure location. Each code can only be used once.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-white rounded border">
                  {index + 1}. {code}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Important Security Notice</p>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Store these codes in a secure, offline location</li>
                  <li>• Each code can only be used once</li>
                  <li>• Generate new codes after using them</li>
                  <li>• Never share these codes with anyone</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={downloadBackupCodes}
              className="flex-1 py-2 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
            >
              Download Codes
            </button>
            <button
              type="button"
              onClick={copyBackupCodes}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Copy Codes
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep('complete')}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
          >
            I've Saved My Codes
          </button>
        </>
      )}

      {step === 'complete' && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Backup Codes Generated!</h3>
          <p className="text-gray-600 text-sm">
            Your backup codes are now configured and ready to use for emergency access.
          </p>
        </div>
      )}
    </div>
  );
}

export default function MFASetup({ onComplete, onSkip, userId }: MFASetupProps) {
  const [selectedMethod, setSelectedMethod] = useState<MFAType | null>(null);
  const [completedMethods, setCompletedMethods] = useState<MFAType[]>([]);
  const [showAllMethods, setShowAllMethods] = useState(false);

  const handleMethodComplete = (methodType: MFAType) => {
    if (!completedMethods.includes(methodType)) {
      setCompletedMethods([...completedMethods, methodType]);
    }
    setSelectedMethod(null);
  };

  const handleContinue = () => {
    onComplete();
  };

  if (selectedMethod) {
    const method = MFA_METHODS.find(m => m.type === selectedMethod);
    if (method) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg mr-3"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-500 text-white rounded-lg">
                    {method.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{method.name}</h2>
                </div>
              </div>
              {React.cloneElement(method.setupComponent as React.ReactElement, {
                onComplete: () => handleMethodComplete(selectedMethod)
              })}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set up Multi-Factor Authentication</h1>
            <p className="text-gray-600">
              Choose at least one method to secure your account. We recommend setting up multiple methods.
            </p>
          </div>

          {/* Progress */}
          {completedMethods.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm text-green-800 font-medium">
                  {completedMethods.length} method{completedMethods.length !== 1 ? 's' : ''} configured
                </span>
              </div>
            </div>
          )}

          {/* Method Selection */}
          <div className="space-y-4 mb-8">
            {MFA_METHODS.filter(method => showAllMethods || !completedMethods.includes(method.type)).map((method) => (
              <div
                key={method.type}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  completedMethods.includes(method.type)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMethod(method.type)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      completedMethods.includes(method.type) ? 'bg-green-500 text-white' : 'bg-primary-500 text-white'
                    }`}>
                      {completedMethods.includes(method.type) ? <Check className="w-5 h-5" /> : method.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                  {completedMethods.includes(method.type) && (
                    <div className="text-green-600">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show all methods toggle */}
          {completedMethods.length > 0 && !showAllMethods && (
            <button
              type="button"
              onClick={() => setShowAllMethods(true)}
              className="w-full mb-4 py-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Set up additional methods
            </button>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
            )}
            <button
              type="button"
              onClick={handleContinue}
              disabled={completedMethods.length === 0}
              className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue ({completedMethods.length} method{completedMethods.length !== 1 ? 's' : ''} set up)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
