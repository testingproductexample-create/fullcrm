'use client';

import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  MapPin, 
  X, 
  AlertTriangle,
  RefreshCw,
  Shield,
  CheckCircle,
  Wifi,
  WifiOff,
  MoreVertical,
  Trash2,
  LogOut
} from 'lucide-react';
import { SessionInfo, TrustedDevice, SecurityLog } from '@/types/auth';
import { useSecurity } from '@/contexts/SecurityContext';
import { formatTimeRemaining, formatTimeRemaining as formatDuration } from '@/lib/auth-helpers';

interface SessionManagementProps {
  onClose?: () => void;
  className?: string;
}

interface SessionCardProps {
  session: SessionInfo;
  isCurrentSession?: boolean;
  onEndSession: (sessionId: string) => void;
}

function SessionCard({ session, isCurrentSession = false, onEndSession }: SessionCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getDeviceIcon = () => {
    const userAgent = session.user_agent.toLowerCase();
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      return <Tablet className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const parseUserAgent = (userAgent: string) => {
    let deviceType = 'Unknown';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Device type
    if (userAgent.includes('Mobile')) deviceType = 'Mobile';
    else if (userAgent.includes('Tablet')) deviceType = 'Tablet';
    else deviceType = 'Desktop';

    // Browser detection
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { deviceType, browser, os };
  };

  const { deviceType, browser, os } = parseUserAgent(session.user_agent);

  const getTimeStatus = () => {
    const now = new Date();
    const lastAccessed = new Date(session.last_accessed);
    const diffHours = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return { text: 'Just now', color: 'text-green-600' };
    if (diffHours < 24) return { text: `${Math.floor(diffHours)}h ago`, color: 'text-yellow-600' };
    return { text: `${Math.floor(diffHours / 24)}d ago`, color: 'text-red-600' };
  };

  const timeStatus = getTimeStatus();

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors relative">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Device Icon */}
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            {getDeviceIcon()}
          </div>

          {/* Session Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">
                {isCurrentSession ? 'This device' : 'Unknown device'}
              </h4>
              {isCurrentSession && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Current
                </span>
              )}
              {session.is_trusted && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Trusted
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{session.ip_address}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-3 h-3 mr-1" />
                  <span>{browser} on {os}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className={timeStatus.color}>
                    Last active: {timeStatus.text}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Expires: {formatDuration(session.expires_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  onEndSession(session.id);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                disabled={isCurrentSession}
              >
                <LogOut className="w-4 h-4 mr-2" />
                End Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ device, onRemove }: { device: TrustedDevice; onRemove: (deviceId: string) => void }) {
  const getDeviceIcon = () => {
    const userAgent = device.user_agent.toLowerCase();
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      return <Tablet className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const parseUserAgent = (userAgent: string) => {
    let browser = 'Unknown';
    let os = 'Unknown';

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { browser, os };
  };

  const { browser, os } = parseUserAgent(device.user_agent);

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="p-2 bg-green-100 rounded-lg text-green-600">
            {getDeviceIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 mb-1">{device.device_name}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{device.ip_address}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-3 h-3 mr-1" />
                  <span>{browser} on {os}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Last used: {new Date(device.last_used).toLocaleDateString()} at{' '}
                {new Date(device.last_used).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onRemove(device.id)}
          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SecurityLogItem({ log }: { log: SecurityLog }) {
  const getEventIcon = () => {
    const iconClass = "w-4 h-4";
    switch (log.event_type) {
      case 'login_success':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'login_failed':
      case 'mfa_failed':
        return <AlertTriangle className={`${iconClass} text-red-600`} />;
      case 'mfa_success':
        return <Shield className={`${iconClass} text-blue-600`} />;
      case 'account_locked':
        return <AlertTriangle className={`${iconClass} text-red-600`} />;
      default:
        return <Monitor className={`${iconClass} text-gray-600`} />;
    }
  };

  const getEventColor = () => {
    switch (log.event_type) {
      case 'login_success':
      case 'mfa_success':
        return 'border-green-200 bg-green-50';
      case 'login_failed':
      case 'mfa_failed':
      case 'account_locked':
        return 'border-red-200 bg-red-50';
      case 'account_unlocked':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatEventName = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={`p-3 border rounded-lg ${getEventColor()}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getEventIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {formatEventName(log.event_type)}
            </h4>
            <span className="text-xs text-gray-500">
              {new Date(log.created_at).toLocaleDateString()} at{' '}
              {new Date(log.created_at).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            IP: {log.ip_address}
          </p>
          {log.event_data && Object.keys(log.event_data).length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {Object.entries(log.event_data).map(([key, value]) => (
                <span key={key} className="inline-block mr-3">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionManagement({ onClose, className = '' }: SessionManagementProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'devices' | 'logs'>('sessions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    sessions,
    trustedDevices,
    securityLogs,
    revokeSession,
    revokeAllSessions,
    removeTrustedDevice,
  } = useSecurity();

  const currentSessionId = sessions.find(s => {
    // In a real app, you would compare with actual current session
    return s.id === sessions[0]?.id;
  })?.id;

  const handleEndSession = async (sessionId: string) => {
    setError('');
    setSuccess('');
    try {
      await revokeSession(sessionId);
      setSuccess('Session ended successfully');
    } catch (err) {
      setError('Failed to end session');
    }
  };

  const handleEndAllSessions = async () => {
    setError('');
    setSuccess('');
    try {
      await revokeAllSessions(true);
      setSuccess('All other sessions ended successfully');
    } catch (err) {
      setError('Failed to end sessions');
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    setError('');
    setSuccess('');
    try {
      await removeTrustedDevice(deviceId);
      setSuccess('Device removed successfully');
    } catch (err) {
      setError('Failed to remove device');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError('');
    // In a real app, you would refetch data here
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Session & Device Management</h1>
                  <p className="text-primary-100 text-sm">Manage your active sessions and trusted devices</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
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
          </div>

          {/* Alerts */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="px-6 flex space-x-8">
              {[
                { 
                  id: 'sessions', 
                  name: 'Active Sessions', 
                  count: sessions.length,
                  icon: <Clock className="w-4 h-4" /> 
                },
                { 
                  id: 'devices', 
                  name: 'Trusted Devices', 
                  count: trustedDevices.length,
                  icon: <Monitor className="w-4 h-4" /> 
                },
                { 
                  id: 'logs', 
                  name: 'Security Logs', 
                  count: securityLogs.length,
                  icon: <Shield className="w-4 h-4" /> 
                },
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
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'sessions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
                    <p className="text-gray-600 text-sm">
                      Manage your active login sessions across all devices
                    </p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      onClick={handleEndAllSessions}
                      className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-lg text-sm font-medium"
                    >
                      End All Others
                    </button>
                  )}
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active sessions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        isCurrentSession={session.id === currentSessionId}
                        onEndSession={handleEndSession}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'devices' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Trusted Devices</h3>
                    <p className="text-gray-600 text-sm">
                      Manage devices that you trust for quick access
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
                  <div className="space-y-4">
                    {trustedDevices.map((device) => (
                      <DeviceCard
                        key={device.id}
                        device={device}
                        onRemove={handleRemoveDevice}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Security Logs</h3>
                    <p className="text-gray-600 text-sm">
                      Recent security events and login activity
                    </p>
                  </div>
                </div>

                {securityLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No security logs yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {securityLogs.map((log) => (
                      <SecurityLogItem key={log.id} log={log} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
