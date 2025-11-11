'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { 
  Settings, 
  Shield, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  Key,
  Monitor,
  Clock,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import MFAManagement from '@/components/auth/MFAManagement';
import { PasswordChangeForm } from '@/components/auth/PasswordPolicy';
import SessionManagement from '@/components/auth/SessionManagement';

type SecurityTab = 'overview' | 'mfa' | 'password' | 'sessions' | 'devices';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const { securityLogs, sessions, trustedDevices } = useSecurity();
  const [activeTab, setActiveTab] = useState<SecurityTab>('overview');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login' as any);
    }
  }, [user, router]);

  const getSecurityScore = () => {
    let score = 0;
    
    // MFA enabled
    if (securityLogs.some(log => log.event_type === 'mfa_success')) score += 25;
    
    // Multiple session management
    if (sessions.length > 0) score += 25;
    
    // Trusted device management
    if (trustedDevices.length > 0) score += 25;
    
    // Recent security activity (no failed logins)
    const recentFailedLogins = securityLogs.filter(log => 
      log.event_type === 'login_failed' && 
      new Date(log.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentFailedLogins.length === 0) score += 25;
    
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreText = (score: number) => {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Fair';
    return 'Poor';
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'change_password',
          data: {
            userId: user?.id,
            currentPassword,
            newPassword,
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const securityScore = getSecurityScore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-500 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Security Settings</h1>
                  <p className="text-sm text-gray-600">Manage your account security and authentication</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 py-4">
          {[
            { id: 'overview', name: 'Overview', icon: <Shield className="w-4 h-4" /> },
            { id: 'mfa', name: 'Multi-Factor Auth', icon: <Smartphone className="w-4 h-4" /> },
            { id: 'password', name: 'Password', icon: <Key className="w-4 h-4" /> },
            { id: 'sessions', name: 'Sessions & Devices', icon: <Monitor className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SecurityTab)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Security Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Security Score</h2>
                <div className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
                  {securityScore}/100
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      securityScore >= 75 ? 'bg-green-500' :
                      securityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${securityScore}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${getScoreColor(securityScore)}`}>
                  {getScoreText(securityScore)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Your account security level is {getScoreText(securityScore).toLowerCase()}. 
                {securityScore < 75 && ' Consider enabling additional security features to improve your score.'}
              </p>
            </div>

            {/* Security Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Methods</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Multi-Factor Authentication', enabled: true, icon: <Smartphone className="w-5 h-5" /> },
                    { name: 'SMS Verification', enabled: false, icon: <MessageSquare className="w-5 h-5" /> },
                    { name: 'Email Verification', enabled: true, icon: <Mail className="w-5 h-5" /> },
                    { name: 'Backup Codes', enabled: true, icon: <Key className="w-5 h-5" /> },
                  ].map((method) => (
                    <div key={method.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600">
                          {method.icon}
                        </div>
                        <span className="text-sm text-gray-900">{method.name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        method.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {method.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('mfa')}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Manage MFA Settings →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {securityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-lg ${
                        log.event_type.includes('success') ? 'bg-green-100 text-green-600' :
                        log.event_type.includes('failed') ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <Shield className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {log.event_type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All Activity →
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('mfa')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Smartphone className="w-8 h-8 text-primary-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Set up MFA</h4>
                  <p className="text-sm text-gray-600">Add extra security with 2FA</p>
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Key className="w-8 h-8 text-primary-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Change Password</h4>
                  <p className="text-sm text-gray-600">Update your login password</p>
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Monitor className="w-8 h-8 text-primary-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Manage Sessions</h4>
                  <p className="text-sm text-gray-600">View active sessions</p>
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Shield className="w-8 h-8 text-primary-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Trusted Devices</h4>
                  <p className="text-sm text-gray-600">Manage trusted devices</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mfa' && (
          <MFAManagement 
            userId={user.id} 
            onClose={() => setActiveTab('overview')} 
          />
        )}

        {activeTab === 'password' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-primary-500 rounded-lg">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                    <p className="text-sm text-gray-600">Update your account password</p>
                  </div>
                </div>
                
                <PasswordChangeForm
                  onSubmit={handlePasswordChange}
                  onCancel={() => setActiveTab('overview')}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <SessionManagement onClose={() => setActiveTab('overview')} />
        )}
      </div>
    </div>
  );
}
