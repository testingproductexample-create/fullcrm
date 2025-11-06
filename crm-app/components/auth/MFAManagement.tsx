'use client';

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Mail, 
  MessageSquare, 
  Key, 
  Shield, 
  Settings, 
  Check, 
  X, 
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  MapPin,
  Monitor
} from 'lucide-react';
import { MFASettings, MFAType, TrustedDevice, SessionInfo } from '@/types/auth';
import { useSecurity } from '@/contexts/SecurityContext';
import { getMFAMethodIcon, getMFAMethodName, formatTimeRemaining } from '@/lib/auth-helpers';

interface MFAManagementProps {
  userId: string;
  onClose?: () => void;
}

const METHOD_CONFIG = {
  totp: {
    name: 'Authenticator App',
    icon: <Smartphone className="w-5 h-5" />,
    color: 'blue',
  },
  sms: {
    name: 'SMS Code',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'green',
  },
  email: {
    name: 'Email Code',
    icon: <Mail className="w-5 h-5" />,
    color: 'purple',
  },
  backup_codes: {
    name: 'Backup Codes',
    icon: <Key className="w-5 h-5" />,
    color: 'orange',
  },
};

const COLORS = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' },
};

export default function MFAManagement({ userId, onClose }: MFAManagementProps) {
  const [settings, setSettings] = useState<MFASettings>({
    preferred_method: null,
    methods: {
      totp: null,
      sms: null,
      email: null,
      backup_codes: null,
    },
    enforce_mfa: false,
    trusted_devices: [],
  });
  const [activeTab, setActiveTab] = useState<'methods' | 'devices' | 'sessions' | 'settings'>('methods');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    sessions,
    trustedDevices,
    securityLogs,
    revokeSession,
    revokeAllSessions,
    removeTrustedDevice,
    createSecurityLog,
    checkAccountLockout
  } = useSecurity();

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      // In a real implementation, you would fetch these from your database
      const mockSettings: MFASettings = {
        preferred_method: 'totp',
        methods: {
          totp: { secret: 'stored_secret', qr_code_url: '', backup_codes: [] },
          sms: { phone_number: '+1234567890', carrier: 'Verizon', verified: true },
          email: { email: 'user@example.com', verified: true },
          backup_codes: { codes: [], used_codes: [], generated_at: new Date().toISOString() },
        },
        enforce_mfa: true,
        trusted_devices: trustedDevices,
      };
      setSettings(mockSettings);
    } catch (err) {
      setError('Failed to load MFA settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleMethod = async (methodType: MFAType, enabled: boolean) => {
    setError('');
    setSuccess('');
    try {
      // In a real implementation, you would update the database
      setSettings(prev => ({
        ...prev,
        methods: {
          ...prev.methods,
          [methodType]: enabled ? prev.methods[methodType] : null,
        },
      }));

      if (enabled) {
        await createSecurityLog({
          user_id: userId,
          event_type: 'mfa_challenge',
          event_data: { action: 'enabled', method: methodType },
          ip_address: 'unknown',
          user_agent: navigator.userAgent,
        });
        setSuccess(`${getMFAMethodName(methodType)} enabled successfully`);
      } else {
        setSuccess(`${getMFAMethodName(methodType)} disabled successfully`);
      }
    } catch (err) {
      setError('Failed to update settings');
    }
  };

  const setPreferredMethod = async (methodType: MFAType) => {
    setError('');
    setSuccess('');
    try {
      setSettings(prev => ({
        ...prev,
        preferred_method: methodType,
      }));
      setSuccess(`Preferred method set to ${getMFAMethodName(methodType)}`);
    } catch (err) {
      setError('Failed to set preferred method');
    }
  };

  const regenerateBackupCodes = async () => {
    setError('');
    setSuccess('');
    try {
      // In a real implementation, you would regenerate and save new codes
      const newCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      
      setSettings(prev => ({
        ...prev,
        methods: {
          ...prev.methods,
          backup_codes: {
            codes: newCodes,
            used_codes: [],
            generated_at: new Date().toISOString(),
          },
        },
      }));

      await createSecurityLog({
        user_id: userId,
        event_type: 'mfa_challenge',
        event_data: { action: 'regenerate_backup_codes' },
        ip_address: 'unknown',
        user_agent: navigator.userAgent,
      });

      setSuccess('Backup codes regenerated successfully');
    } catch (err) {
      setError('Failed to regenerate backup codes');
    }
  };

  const removeDevice = async (deviceId: string) => {
    setError('');
    try {
      await removeTrustedDevice(deviceId);
      setSuccess('Device removed successfully');
    } catch (err) {
      setError('Failed to remove device');
    }
  };

  const endSession = async (sessionId: string) => {
    setError('');
    try {
      await revokeSession(sessionId);
      setSuccess('Session ended successfully');
    } catch (err) {
      setError('Failed to end session');
    }
  };

  const endAllSessions = async () => {
    setError('');
    try {
      await revokeAllSessions(true);
      setSuccess('All other sessions ended successfully');
    } catch (err) {
      setError('Failed to end sessions');
    }
  };

  const getMethodStatus = (methodType: MFAType) => {
    const method = settings.methods[methodType];
    return method !== null;
  };

  const getEnabledMethods = () => {
    return Object.keys(settings.methods).filter(
      (key) => settings.methods[key as MFAType] !== null
    ) as MFAType[];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-600">Loading MFA settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Security Settings</h1>
                  <p className="text-primary-100">Manage your multi-factor authentication</p>
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mx-8 mt-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mx-8 mt-6 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center">
              <Check className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="px-8 flex space-x-8">
              {[
                { id: 'methods', name: 'Authentication Methods', icon: <Settings className="w-4 h-4" /> },
                { id: 'devices', name: 'Trusted Devices', icon: <Monitor className="w-4 h-4" /> },
                { id: 'sessions', name: 'Active Sessions', icon: <Clock className="w-4 h-4" /> },
                { id: 'settings', name: 'Security Settings', icon: <Shield className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'methods' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Methods</h3>
                  <p className="text-gray-600 text-sm">
                    Choose which methods you want to use for two-factor authentication.
                  </p>
                </div>

                {/* Preferred Method */}
                {getEnabledMethods().length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Preferred Method</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      This method will be used first when signing in.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getEnabledMethods().map((method) => {
                        const config = METHOD_CONFIG[method];
                        const isPreferred = settings.preferred_method === method;
                        return (
                          <button
                            key={method}
                            onClick={() => setPreferredMethod(method)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isPreferred
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-blue-600 hover:bg-blue-100'
                            }`}
                          >
                            {getMFAMethodIcon(method)} {config.name}
                            {isPreferred && <Check className="w-3 h-3 inline ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Methods List */}
                <div className="space-y-4">
                  {Object.entries(METHOD_CONFIG).map(([methodType, config]) => {
                    const isEnabled = getMethodStatus(methodType as MFAType);
                    const colorConfig = COLORS[config.color as keyof typeof COLORS];
                    
                    return (
                      <div
                        key={methodType}
                        className={`p-4 border-2 rounded-lg ${isEnabled ? colorConfig.border : 'border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${isEnabled ? colorConfig.bg : 'bg-gray-100'}`}>
                              <div className={isEnabled ? colorConfig.icon : 'text-gray-500'}>
                                {config.icon}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{config.name}</h4>
                                {isEnabled && (
                                  <div className="flex items-center space-x-1">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">Enabled</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {getMethodDescription(methodType as MFAType)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isEnabled && methodType === 'backup_codes' && (
                              <button
                                onClick={regenerateBackupCodes}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                title="Regenerate backup codes"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => toggleMethod(methodType as MFAType, !isEnabled)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isEnabled
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                              }`}
                            >
                              {isEnabled ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'devices' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Trusted Devices</h3>
                    <p className="text-gray-600 text-sm">
                      Manage devices that you trust for quick access.
                    </p>
                  </div>
                </div>

                {trustedDevices.length === 0 ? (
                  <div className="text-center py-8">
                    <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No trusted devices yet</p>
                    <p className="text-sm text-gray-500">Trusted devices will appear here after you sign in</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trustedDevices.map((device) => (
                      <div key={device.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Monitor className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{device.device_name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {device.ip_address}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Last used: {new Date(device.last_used).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeDevice(device.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Active Sessions</h3>
                    <p className="text-gray-600 text-sm">
                      Manage your active login sessions across all devices.
                    </p>
                  </div>
                  <button
                    onClick={endAllSessions}
                    className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-lg text-sm font-medium"
                  >
                    End All Other Sessions
                  </button>
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active sessions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Monitor className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {session.is_trusted ? 'This device' : 'Unknown device'}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {session.ip_address}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Expires: {formatTimeRemaining(session.expires_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => endSession(session.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Security Settings</h3>
                  <p className="text-gray-600 text-sm">
                    Configure additional security options for your account.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Enforce MFA */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Enforce Multi-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">
                          Require MFA for all sign-ins (recommended for enhanced security)
                        </p>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, enforce_mfa: !prev.enforce_mfa }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          settings.enforce_mfa
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {settings.enforce_mfa ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  {/* Account Security Status */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Account Security Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Authentication methods configured</span>
                        <span className="font-medium">{getEnabledMethods().length}/4</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Trusted devices</span>
                        <span className="font-medium">{trustedDevices.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Active sessions</span>
                        <span className="font-medium">{sessions.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getMethodDescription(methodType: MFAType): string {
  const descriptions = {
    totp: 'Use an authenticator app like Google Authenticator or Authy',
    sms: 'Receive codes via text message to your phone',
    email: 'Receive codes via email to your registered address',
    backup_codes: 'Use emergency backup codes for account recovery',
  };
  return descriptions[methodType];
}
